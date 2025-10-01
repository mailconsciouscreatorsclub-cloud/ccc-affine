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

import { createProviderFactory, createWebSpeechProvider } from '../providers';
import type { 
  VoiceCommand,
  VoiceCommandParameters,
  VoiceCommandResult,
  VoiceControlConfig,
  VoiceControlEvents,
  VoiceControlState,
  VoiceEventHandler,
  VoiceFeedback,
  VoiceNavigationContext,
  VoiceRecognitionResult,
  VoiceSession} from '../types';
import type {
  AudioProcessorInterface,
  SpeechRecognitionProviderInterface,
  SpeechSynthesisProviderInterface,
  WakeWordProviderInterface} from '../types/providers';
import { VoiceCommandRegistry } from './voice-command-registry.service';
import { VoiceFeedbackService } from './voice-feedback.service';
import { VoiceNavigationService } from './voice-navigation.service';

interface TriggerCommandOptions {
  originalInput?: string;
  parameters?: VoiceCommandParameters['parameters'];
  confidence?: number;
  suppressErrorFeedback?: boolean;
}

type VoiceEventListenerMap = {
  [K in keyof VoiceControlEvents]?: Set<VoiceEventHandler<K>>;
};

export class VoiceControlService extends Service {
  private config: VoiceControlConfig;
  private readonly state: VoiceControlState;
  private eventListeners: VoiceEventListenerMap = {};
  
  // Core components
  private speechRecognition?: SpeechRecognitionProviderInterface;
  private speechSynthesis?: SpeechSynthesisProviderInterface;
  private readonly wakeWordDetector?: WakeWordProviderInterface;
  private readonly audioProcessor?: AudioProcessorInterface;
  
  // Services
  private readonly commandRegistry: VoiceCommandRegistry;
  private readonly navigationService: VoiceNavigationService;
  private readonly feedbackService: VoiceFeedbackService;
  
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

  getCommands(): VoiceCommand[] {
    return this.commandRegistry.getAllCommands();
  }

  async triggerCommand(
    commandId: string,
    options: TriggerCommandOptions = {},
  ): Promise<void> {
    const command = this.commandRegistry.getCommand(commandId);

    if (!command) {
      const message = `Voice command "${commandId}" is not registered.`;
      this.log(message, 'error');
      this.emit('voice:command:failed', { command: undefined, error: message });

      if (!options.suppressErrorFeedback) {
        try {
          await this.feedbackService.speak(message, 'error', { interrupt: false });
        } catch (feedbackError) {
          const feedbackMessage = feedbackError instanceof Error ? feedbackError.message : String(feedbackError);
          this.log(`Failed to provide error feedback: ${feedbackMessage}`, 'error');
        }
      }

      throw new Error(message);
    }

    const confidence = Math.max(0, Math.min(1, options.confidence ?? 1));

    const parameters: VoiceCommandParameters = {
      originalInput: options.originalInput ?? command.trigger,
      parameters: options.parameters ?? {},
      confidence,
    };

    this.state.lastRecognizedText = parameters.originalInput;
    this.state.isProcessing = true;

    try {
      await this.executeCommand(command, parameters);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log(`Failed to run command "${command.trigger}": ${errorMessage}`, 'error');

      if (!options.suppressErrorFeedback) {
        try {
          const feedback = errorMessage
            ? `I couldn't run ${command.trigger}. ${errorMessage}`
            : `I couldn't run ${command.trigger}.`;
          await this.feedbackService.speak(feedback.trim(), 'error', { interrupt: false });
        } catch (feedbackError) {
          const feedbackMessage = feedbackError instanceof Error ? feedbackError.message : String(feedbackError);
          this.log(`Failed to provide error feedback: ${feedbackMessage}`, 'error');
        }
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error(errorMessage);
    } finally {
      this.state.isProcessing = false;
    }
  }

  onCommandsChanged(listener: () => void): () => void {
    return this.commandRegistry.onChange(listener);
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
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = new Set();
    }
    (this.eventListeners[event] as Set<VoiceEventHandler<K>>).add(handler);
  }

  /**
   * Unsubscribe from voice control events
   */
  off<K extends keyof VoiceControlEvents>(
    event: K,
    handler: VoiceEventHandler<K>
  ): void {
    const listeners = this.eventListeners[event] as Set<VoiceEventHandler<K>> | undefined;
    if (listeners) {
      listeners.delete(handler);
      if (listeners.size === 0) {
        delete this.eventListeners[event];
      }
    }
  }

  /**
   * Emit voice control event
   */
  private emit<K extends keyof VoiceControlEvents>(
    event: K,
    data: VoiceControlEvents[K]
  ): void {
    const listeners = this.eventListeners[event] as Set<VoiceEventHandler<K>> | undefined;
    if (!listeners) {
      return;
    }

    listeners.forEach(listener => {
      try {
        const result = listener(data);
        if (result instanceof Promise) {
          result.catch(error => {
            const message = error instanceof Error ? error.message : String(error);
            this.log(`Async event handler for ${String(event)} rejected: ${message}`, 'error');
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log(`Error in event handler for ${String(event)}: ${message}`, 'error');
      }
    });
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
    const context = this.navigationService.getCurrentContext();
    
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
    const context = this.navigationService.getCurrentContext();
    
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
    // Audio processor initialization - not needed for Web Speech API
    // Future implementation for advanced audio processing (noise reduction, etc.)
    this.log('Audio processor initialization skipped (using Web Speech API native processing)');
  }

  private async initializeSpeechRecognition(): Promise<void> {
    try {
      const providerFactory = createProviderFactory();

      // Create Web Speech API provider for now (extensible for future cloud providers)
      const webSpeechProvider = createWebSpeechProvider();

      // Initialize recognition with current config
      const recognitionConfig = {
        provider: 'web-speech-api' as const,
        options: {
          language: this.config.recognition.language,
          continuous: this.config.recognition.continuous,
          interimResults: this.config.recognition.interimResults,
          maxAlternatives: this.config.recognition.maxAlternatives
        }
      };

      await webSpeechProvider.recognition.initialize(recognitionConfig);

      // Set up recognition event handlers
      webSpeechProvider.recognition.onResult((result) => {
        const voiceResult = {
          transcript: result.text,
          confidence: result.confidence,
          isFinal: result.isFinal,
          alternatives: result.alternatives?.map(alt => ({
            transcript: alt.text,
            confidence: alt.confidence
          })) || [],
          timestamp: result.timestamp,
          metadata: result.metadata
        };
        void this.handleRecognitionResult(voiceResult).catch(error => {
          const message = error instanceof Error ? error.message : String(error);
          this.log(`Error handling recognition result: ${message}`,'error');
        });
      });

      webSpeechProvider.recognition.onError((error) => {
        this.log(`Speech recognition error: ${error.message}`, 'error');
        this.emit('voice:error', { error: error.message, context: error });
      });

      this.speechRecognition = webSpeechProvider.recognition;
      this.log('Speech recognition provider initialized successfully');

    } catch (error) {
      throw new Error(`Failed to initialize speech recognition: ${error.message}`);
    }
  }

  private async initializeSpeechSynthesis(): Promise<void> {
    try {
      const webSpeechProvider = createWebSpeechProvider();

      // Initialize synthesis with current config
      const synthesisConfig = {
        provider: 'web-speech-api' as const,
        voice: {
          language: this.config.recognition.language, // Use same language as recognition
          gender: 'neutral' as const
        },
        audio: {
          rate: this.config.feedback.speechRate,
          pitch: this.config.feedback.speechPitch,
          volume: this.config.feedback.speechVolume
        }
      };

      await webSpeechProvider.synthesis.initialize(synthesisConfig);
      this.speechSynthesis = webSpeechProvider.synthesis;
      this.log('Speech synthesis provider initialized successfully');

    } catch (error) {
      throw new Error(`Failed to initialize speech synthesis: ${error.message}`);
    }
  }

  private async initializeWakeWordDetection(): Promise<void> {
    // Wake word detection not supported by Web Speech API
    // This would be implemented with specialized libraries like Picovoice
    this.log('Wake word detection not available with Web Speech API provider');

    // For now, we'll use continuous listening mode instead
    if (this.config.recognition.wakeWord) {
      this.log(`Wake word configured: "${this.config.recognition.wakeWord}" (continuous mode will be used)`);
    }
  }

  private async registerBuiltInCommands(): Promise<void> {
    // Register essential built-in voice commands
    try {
      // System commands
      this.commandRegistry.register({
        id: 'help',
        trigger: 'help',
        aliases: ['show help', 'what can you do', 'commands'],
        description: 'Show available voice commands',
        category: 'system',
        handler: async () => {
          const commands = this.commandRegistry.getAllCommands();
          const helpText = commands
            .filter(cmd => cmd.category !== 'system' || cmd.id === 'help')
            .map(cmd => `"${cmd.trigger}" - ${cmd.description}`)
            .join(', ');

          return {
            success: true,
            message: `Available commands: ${helpText}`,
            actions: [{
              type: 'show_help_panel',
              commands: commands.map(cmd => ({
                trigger: cmd.trigger,
                description: cmd.description,
                category: cmd.category
              }))
            }]
          };
        }
      });

      // Voice control commands
      this.commandRegistry.register({
        id: 'start-listening',
        trigger: 'start listening',
        aliases: ['begin voice control', 'activate voice', 'listen'],
        description: 'Start voice recognition',
        category: 'system',
        handler: async () => {
          if (!this.state.isListening) {
            await this.startListening();
            return { success: true, message: 'Voice recognition started' };
          }
          return { success: false, message: 'Voice recognition is already active' };
        }
      });

      this.commandRegistry.register({
        id: 'stop-listening',
        trigger: 'stop listening',
        aliases: ['end voice control', 'deactivate voice', 'silence'],
        description: 'Stop voice recognition',
        category: 'system',
        handler: async () => {
          if (this.state.isListening) {
            await this.stopListening();
            return { success: true, message: 'Voice recognition stopped' };
          }
          return { success: false, message: 'Voice recognition is not active' };
        }
      });

      // Basic navigation commands
      this.commandRegistry.register({
        id: 'go-back',
        trigger: 'go back',
        aliases: ['back', 'previous page', 'navigate back'],
        description: 'Navigate to previous page',
        category: 'navigation',
        handler: async () => {
          if (typeof window !== 'undefined' && window.history) {
            window.history.back();
            return { success: true, message: 'Navigated back' };
          }
          return { success: false, message: 'Cannot navigate back' };
        }
      });

      this.commandRegistry.register({
        id: 'go-forward',
        trigger: 'go forward',
        aliases: ['forward', 'next page', 'navigate forward'],
        description: 'Navigate to next page',
        category: 'navigation',
        handler: async () => {
          if (typeof window !== 'undefined' && window.history) {
            window.history.forward();
            return { success: true, message: 'Navigated forward' };
          }
          return { success: false, message: 'Cannot navigate forward' };
        }
      });

      this.commandRegistry.register({
        id: 'reload-page',
        trigger: 'reload page',
        aliases: ['refresh page', 'reload', 'refresh'],
        description: 'Reload the current page',
        category: 'navigation',
        handler: async () => {
          if (typeof window !== 'undefined') {
            window.location.reload();
            return { success: true, message: 'Page reloaded' };
          }
          return { success: false, message: 'Cannot reload page' };
        }
      });

      // Status commands
      this.commandRegistry.register({
        id: 'voice-status',
        trigger: 'voice status',
        aliases: ['status', 'are you listening', 'voice control status'],
        description: 'Get voice control status',
        category: 'system',
        handler: async () => {
          const state = this.getState();
          const statusText = `Voice control is ${state.isActive ? 'active' : 'inactive'}, ${state.isListening ? 'listening' : 'not listening'}`;
          return {
            success: true,
            message: statusText,
            data: state
          };
        }
      });

      this.log(`Registered ${this.commandRegistry.getAllCommands().length} built-in commands`);

    } catch (error) {
      this.log(`Error registering built-in commands: ${error.message}`, 'error');
      throw error;
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    void (async () => {
      try {
        await this.stop();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.log(`Error stopping voice control during dispose: ${message}`, 'error');
      }

      this.unsubscribeNavigation?.();
      this.unsubscribeNavigation = undefined;

      const cleanupTasks: Promise<void>[] = [];

      if (this.speechRecognition) {
        cleanupTasks.push(this.speechRecognition.cleanup());
      }
      if (this.speechSynthesis) {
        cleanupTasks.push(this.speechSynthesis.cleanup());
      }
      if (this.wakeWordDetector) {
        cleanupTasks.push(this.wakeWordDetector.cleanup());
      }
      if (this.audioProcessor) {
        // await this.audioProcessor.cleanup();
      }

      if (cleanupTasks.length > 0) {
        for (const task of cleanupTasks) {
          try {
            await task;
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.log(`Error cleaning up provider: ${message}`, 'error');
          }
        }
      }

      for (const eventKey of Object.keys(this.eventListeners) as Array<keyof VoiceControlEvents>) {
        this.eventListeners[eventKey]?.clear();
        delete this.eventListeners[eventKey];
      }

      this.log('Voice control service disposed');
    })().catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      this.log(`Error disposing voice control service: ${message}`, 'error');
    });
  }
}








