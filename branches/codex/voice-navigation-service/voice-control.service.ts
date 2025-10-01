/**
 * Voice Control Service - Main coordinator for voice-controlled navigation
 * 
 * This service manages the entire voice control system including:
 * - Speech recognition and synthesis
 * - Command processing and execution
 * - Context awareness and navigation
 * - Integration with Affine's existing services
 */

import { Service } from '@toeverything/infra';
import type { 
  VoiceControlConfig,
  VoiceControlState,
  VoiceControlEvents,
  VoiceRecognitionResult,
  VoiceCommand,
  VoiceCommandParameters,
  VoiceCommandResult,
  VoiceNavigationContext,
  VoiceFeedback,
  VoiceSession,
  VoiceEventHandler
} from '../types';
import type {
  SpeechRecognitionProviderInterface,
  SpeechSynthesisProviderInterface,
  WakeWordProviderInterface,
  AudioProcessorInterface
} from '../types/providers';
import { VoiceCommandRegistry } from './voice-command-registry.service';
import { VoiceNavigationService } from './voice-navigation.service';
import { VoiceFeedbackService } from './voice-feedback.service';

export class VoiceControlService extends Service {
  private config: VoiceControlConfig;
  private state: VoiceControlState;
  private eventListeners = new Map<keyof VoiceControlEvents, Set<Function>>();
  
  // Core components
  private speechRecognition?: SpeechRecognitionProviderInterface;
  private speechSynthesis?: SpeechSynthesisProviderInterface;
  private wakeWordDetector?: WakeWordProviderInterface;
  private audioProcessor?: AudioProcessorInterface;
  
  // Services
  private commandRegistry: VoiceCommandRegistry;
  private navigationService: VoiceNavigationService;
  private feedbackService: VoiceFeedbackService;
  
  // Session management
  private currentSession?: VoiceSession;
  private sessionStartTime?: number;
  private unsubscribeNavigation?: () => void;
  
  constructor() {
    super();
    
    // Initialize default configuration
    this.config = {
      recognition: {
        language: 'en-US',
        continuous: true,
        interimResults: true,
        maxAlternatives: 3,
        confidenceThreshold: 0.7,
        wakeWord: 'hey affine',
        commandTimeout: 10000
      },
      feedback: {
        audioEnabled: true,
        visualEnabled: true,
        speechRate: 1.0,
        speechPitch: 1.0,
        speechVolume: 0.8
      },
      enabledCategories: ['navigation', 'document', 'ai', 'workspace', 'system'],
      debug: false
    };
    
    // Initialize default state
    this.state = {
      isActive: false,
      isListening: false,
      isProcessing: false
    };
    
    // Initialize services
    this.commandRegistry = new VoiceCommandRegistry();
    this.navigationService = new VoiceNavigationService();
    this.feedbackService = new VoiceFeedbackService();
  }

  // ============================================================================
  // Public API - Service Control
  // ============================================================================

  /**
   * Initialize the voice control system
   */
  async initialize(config?: Partial<VoiceControlConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      // Initialize audio processor
      await this.initializeAudioProcessor();
      
      // Initialize speech providers
      await this.initializeSpeechRecognition();
      await this.initializeSpeechSynthesis();
      
      // Initialize wake word detection if configured
      if (this.config.recognition.wakeWord) {
        await this.initializeWakeWordDetection();
      }
      
      // Initialize services
      await this.commandRegistry.initialize();
      await this.navigationService.initialize();
      this.commandRegistry.setContext(this.navigationService.getCurrentContext());
      this.unsubscribeNavigation?.();
      this.unsubscribeNavigation = this.navigationService.onContextChange((context) => {
        this.commandRegistry.setContext(context);
      });
      await this.feedbackService.initialize(this.config.feedback);
      
      // Register built-in commands
      await this.registerBuiltInCommands();
      
      this.log('Voice control system initialized successfully');
      this.emit('voice:started');
      
    } catch (error) {
      const errorMessage = `Failed to initialize voice control: ${error.message}`;
      this.log(errorMessage, 'error');
      this.state.error = errorMessage;
      this.emit('voice:error', { error: errorMessage, context: error });
      throw error;
    }
  }

  /**
   * Start voice control (begin listening)
   */
  async start(): Promise<void> {
    if (!this.speechRecognition) {
      throw new Error('Voice control not initialized. Call initialize() first.');
    }

    if (this.state.isActive) {
      this.log('Voice control is already active');
      return;
    }

    try {
      // Start new session
      await this.startSession();
      
      // Start wake word detection if configured
      if (this.wakeWordDetector && this.config.recognition.wakeWord) {
        await this.wakeWordDetector.start();
        this.log(`Wake word detection started: "${this.config.recognition.wakeWord}"`);
      } else {
        // Start continuous listening
        await this.startListening();
      }
      
      this.state.isActive = true;
      this.log('Voice control started');
      
    } catch (error) {
      const errorMessage = `Failed to start voice control: ${error.message}`;
      this.log(errorMessage, 'error');
      this.state.error = errorMessage;
      this.emit('voice:error', { error: errorMessage, context: error });
      throw error;
    }
  }

  /**
   * Stop voice control
   */
  async stop(): Promise<void> {
    if (!this.state.isActive) {
      return;
    }

    try {
      // Stop listening
      await this.stopListening();
      
      // Stop wake word detection
      if (this.wakeWordDetector) {
        await this.wakeWordDetector.stop();
      }
      
      // End current session
      await this.endSession();
      
      this.state.isActive = false;
      this.log('Voice control stopped');
      this.emit('voice:stopped');
      
    } catch (error) {
      this.log(`Error stopping voice control: ${error.message}`, 'error');
    }
  }

  /**
   * Get current voice control state
   */
  getState(): VoiceControlState {
    return { ...this.state };
  }

  /**
   * Get current configuration
   */
  getConfig(): VoiceControlConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(config: Partial<VoiceControlConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Update feedback service if feedback config changed
    if (config.feedback) {
      await this.feedbackService.updateConfig(config.feedback);
    }
    
    this.log('Configuration updated');
  }

  // ============================================================================
  // Event Management
  // ============================================================================

  /**
   * Subscribe to voice control events
   */
  on<K extends keyof VoiceControlEvents>(
    event: K,
    handler: VoiceEventHandler<K>
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from voice control events
   */
  off<K extends keyof VoiceControlEvents>(
    event: K,
    handler: VoiceEventHandler<K>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(handler);
    }
  }

  /**
   * Emit voice control event
   */
  private emit<K extends keyof VoiceControlEvents>(
    event: K,
    data: VoiceControlEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          this.log(`Error in event handler for ${event}: ${error.message}`, 'error');
        }
      });
    }
  }

  // ============================================================================
  // Speech Recognition
  // ============================================================================

  private async startListening(): Promise<void> {
    if (!this.speechRecognition || this.state.isListening) {
      return;
    }

    try {
      await this.speechRecognition.startRecognition();
      this.state.isListening = true;
      this.emit('voice:listening:start', undefined);
      this.log('Started listening for voice commands');
      
    } catch (error) {
      throw new Error(`Failed to start listening: ${error.message}`);
    }
  }

  private async stopListening(): Promise<void> {
    if (!this.speechRecognition || !this.state.isListening) {
      return;
    }

    try {
      await this.speechRecognition.stopRecognition();
      this.state.isListening = false;
      this.emit('voice:listening:stop', undefined);
      this.log('Stopped listening for voice commands');
      
    } catch (error) {
      this.log(`Error stopping listening: ${error.message}`, 'error');
    }
  }

  private async handleRecognitionResult(result: VoiceRecognitionResult): Promise<void> {
    this.state.lastRecognizedText = result.transcript;
    this.emit('voice:recognition', result);
    
    // Only process final results with sufficient confidence
    if (!result.isFinal || result.confidence < this.config.recognition.confidenceThreshold) {
      return;
    }

    this.log(`Processing voice command: "${result.transcript}" (confidence: ${result.confidence})`);
    
    try {
      this.state.isProcessing = true;
      
      // Find matching commands
      const matches = this.commandRegistry.findMatchingCommands(result.transcript);
      
      if (matches.length === 0) {
        await this.handleUnrecognizedCommand(result.transcript);
        return;
      }
      
      // Execute the best matching command
      const bestMatch = matches[0];
      await this.executeCommand(bestMatch.command, {
        originalInput: result.transcript,
        parameters: bestMatch.parameters,
        confidence: result.confidence
      });
      
    } catch (error) {
      this.log(`Error processing voice command: ${error.message}`, 'error');
      await this.feedbackService.speak(`Sorry, I couldn't process that command. ${error.message}`, 'error');
    } finally {
      this.state.isProcessing = false;
    }
  }

  private async handleUnrecognizedCommand(text: string): Promise<void> {
    this.log(`Unrecognized voice command: "${text}"`);
    
    // Try to get help from AI if available
    const suggestions = await this.getSuggestionsFromAI(text);
    
    if (suggestions.length > 0) {
      await this.feedbackService.speak(
        `I didn't recognize that command. Did you mean: ${suggestions.join(', ')}?`,
        'info'
      );
    } else {
      await this.feedbackService.speak(
        'I didn\'t understand that command. Say "help" to see available commands.',
        'info'
      );
    }
  }

  // ============================================================================
  // Command Execution
  // ============================================================================

  private async executeCommand(
    command: VoiceCommand,
    parameters: VoiceCommandParameters
  ): Promise<void> {
    const context = await this.navigationService.getCurrentContext();
    
    this.emit('voice:command:matched', { command, parameters });
    
    try {
      // Check if command can be executed in current context
      if (!this.canExecuteInContext(command, context)) {
        throw new Error(`Command "${command.trigger}" is not available in the current context`);
      }
      
      // Execute the command
      const startTime = Date.now();
      const result = await command.handler(parameters, context);
      const duration = Date.now() - startTime;
      
      // Record execution in session
      if (this.currentSession) {
        this.currentSession.commands.push({
          command,
          parameters,
          result,
          timestamp: startTime,
          duration
        });
        
        // Update session stats
        this.updateSessionStats(result.success);
      }
      
      // Provide feedback
      if (result.message) {
        const feedbackType = result.success ? 'success' : 'error';
        await this.feedbackService.speak(result.message, feedbackType);
      }
      
      // Execute follow-up actions
      if (result.actions) {
        for (const action of result.actions) {
          await this.executeAction(action);
        }
      }
      
      this.emit('voice:command:executed', { command, result });
      this.log(`Command executed: "${command.trigger}" (${duration}ms)`);
      
    } catch (error) {
      this.emit('voice:command:failed', { command, error: error.message });
      this.log(`Command execution failed: ${error.message}`, 'error');
      throw error;
    }
  }

  private canExecuteInContext(command: VoiceCommand, context: VoiceNavigationContext): boolean {
    if (!command.context) {
      return true; // No context requirements
    }
    
    // Check required view
    if (command.context.requiredView && context.currentView !== command.context.requiredView) {
      return false;
    }
    
    // Check excluded contexts
    if (command.context.excludedContexts?.includes(context.currentView)) {
      return false;
    }
    
    // Add more context validation as needed
    return true;
  }

  // ============================================================================
  // Session Management
  // ============================================================================

  private async startSession(): Promise<void> {
    const context = await this.navigationService.getCurrentContext();
    
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      commands: [],
      context,
      stats: {
        totalCommands: 0,
        successfulCommands: 0,
        failedCommands: 0,
        averageConfidence: 0,
        totalDuration: 0
      }
    };
    
    this.sessionStartTime = Date.now();
    this.state.currentSession = this.currentSession;
    
    this.log(`Started new voice session: ${this.currentSession.id}`);
  }

  private async endSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    
    this.currentSession.endTime = Date.now();
    this.currentSession.stats.totalDuration = this.currentSession.endTime - this.currentSession.startTime;
    
    this.log(
      `Ended voice session: ${this.currentSession.id} ` +
      `(${this.currentSession.commands.length} commands, ` +
      `${this.currentSession.stats.totalDuration}ms)`
    );
    
    // Store session for analytics (implement as needed)
    // await this.storeSession(this.currentSession);
    
    this.currentSession = undefined;
    this.state.currentSession = undefined;
  }

  private updateSessionStats(success: boolean): void {
    if (!this.currentSession) return;
    
    const stats = this.currentSession.stats;
    stats.totalCommands++;
    
    if (success) {
      stats.successfulCommands++;
    } else {
      stats.failedCommands++;
    }
    
    // Update average confidence (simplified)
    const totalConfidence = this.currentSession.commands.reduce(
      (sum, cmd) => sum + cmd.parameters.confidence, 0
    );
    stats.averageConfidence = totalConfidence / stats.totalCommands;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private generateSessionId(): string {
    return `voice-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.config.debug) {
      console[level](`[VoiceControl] ${message}`);
    }
  }

  private async getSuggestionsFromAI(text: string): Promise<string[]> {
    // Implement AI-powered command suggestions
    // This could integrate with the existing AI provider system
    return [];
  }

  private async executeAction(action: any): Promise<void> {
    // Implement action execution (navigate, highlight, etc.)
    this.log(`Executing action: ${action.type}`);
  }

  // ============================================================================
  // Provider Initialization (to be implemented)
  // ============================================================================

  private async initializeAudioProcessor(): Promise<void> {
    // Initialize audio processor
    // Implementation needed
  }

  private async initializeSpeechRecognition(): Promise<void> {
    // Initialize speech recognition provider
    // Implementation needed
  }

  private async initializeSpeechSynthesis(): Promise<void> {
    // Initialize speech synthesis provider
    // Implementation needed
  }

  private async initializeWakeWordDetection(): Promise<void> {
    // Initialize wake word detection
    // Implementation needed
  }

  private async registerBuiltInCommands(): Promise<void> {
    // Register built-in commands
    // Implementation needed
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  async dispose(): Promise<void> {
    await this.stop();
    this.unsubscribeNavigation?.();
    this.unsubscribeNavigation = undefined;
    
    // Cleanup providers
    if (this.speechRecognition) {
      await this.speechRecognition.cleanup();
    }
    if (this.speechSynthesis) {
      await this.speechSynthesis.cleanup();
    }
    if (this.wakeWordDetector) {
      await this.wakeWordDetector.cleanup();
    }
    if (this.audioProcessor) {
      // await this.audioProcessor.cleanup();
    }
    
    // Clear event listeners
    this.eventListeners.clear();
    
    this.log('Voice control service disposed');
  }
}