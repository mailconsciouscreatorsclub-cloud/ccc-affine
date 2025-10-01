/**
 * Voice Control End-to-End Test Suite
 *
 * Complete integration tests for the entire voice control flow:
 * Speech Recognition → Command Processing → Execution → Feedback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceControlService } from '../../../../packages/frontend/core/src/modules/voice-control/services/voice-control.service';
import { VoiceCommandRegistry } from '../../../../packages/frontend/core/src/modules/voice-control/services/voice-command-registry.service';
import { VoiceNavigationService } from '../../../../packages/frontend/core/src/modules/voice-control/services/voice-navigation.service';
import { VoiceFeedbackService } from '../../../../packages/frontend/core/src/modules/voice-control/services/voice-feedback.service';
import {
  setupWebSpeechMocks,
  setupNavigatorMocks,
  generateMockConfig,
  generateMockCommand,
  generateMockContext,
  waitForMicrotasks,
  measurePerformance,
  expectPerformance
} from '../../test-utils';
import type {
  VoiceControlConfig,
  VoiceCommand,
  VoiceControlEvents,
  VoiceRecognitionResult
} from '../../../../packages/frontend/core/src/modules/voice-control/types';

describe('Voice Control E2E', () => {
  let voiceControl: VoiceControlService;
  let webSpeechMocks: ReturnType<typeof setupWebSpeechMocks>;
  let navigatorMocks: ReturnType<typeof setupNavigatorMocks>;
  let mockConfig: VoiceControlConfig;

  beforeEach(async () => {
    // Set up all mocks
    webSpeechMocks = setupWebSpeechMocks();
    navigatorMocks = setupNavigatorMocks();

    // Set up DOM
    document.body.innerHTML = '<div id="app"></div>';

    // Create service and config
    voiceControl = new VoiceControlService();
    mockConfig = generateMockConfig({
      debug: true,
      recognition: {
        language: 'en-US',
        continuous: true,
        confidenceThreshold: 0.7
      }
    });
  });

  afterEach(async () => {
    await voiceControl.dispose();
    webSpeechMocks.cleanup();
    navigatorMocks.cleanup();
    document.body.innerHTML = '';
  });

  // ============================================================================
  // Complete Voice Control Flow Tests
  // ============================================================================

  describe('complete voice control flow', () => {
    it('should complete full voice command cycle', async () => {
      // Track events throughout the flow
      const events: Array<{ type: string; data: any }> = [];

      voiceControl.on('voice:started', () => {
        events.push({ type: 'started', data: null });
      });

      voiceControl.on('voice:listening:start', () => {
        events.push({ type: 'listening_start', data: null });
      });

      voiceControl.on('voice:recognition', (data) => {
        events.push({ type: 'recognition', data });
      });

      voiceControl.on('voice:command:matched', (data) => {
        events.push({ type: 'command_matched', data });
      });

      voiceControl.on('voice:command:executed', (data) => {
        events.push({ type: 'command_executed', data });
      });

      // Step 1: Initialize voice control
      await voiceControl.initialize(mockConfig);
      expect(events.some(e => e.type === 'started')).toBe(true);

      // Step 2: Start voice control
      await voiceControl.start();
      expect(events.some(e => e.type === 'listening_start')).toBe(true);

      // Step 3: Simulate voice input
      webSpeechMocks.mockRecognition._triggerResult('help', 0.95, true);
      await waitForMicrotasks();

      // Step 4: Verify complete flow
      expect(events.some(e => e.type === 'recognition')).toBe(true);
      expect(events.some(e => e.type === 'command_matched')).toBe(true);
      expect(events.some(e => e.type === 'command_executed')).toBe(true);

      // Verify final state
      const state = voiceControl.getState();
      expect(state.isActive).toBe(true);
      expect(state.isListening).toBe(true);
      expect(state.lastRecognizedText).toBe('help');
    });

    it('should handle multiple consecutive commands', async () => {
      const executedCommands: string[] = [];

      voiceControl.on('voice:command:executed', ({ command }) => {
        executedCommands.push(command.id);
      });

      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Execute multiple commands in sequence
      const commands = ['help', 'voice status', 'go back', 'go forward'];

      for (const commandText of commands) {
        webSpeechMocks.mockRecognition._triggerResult(commandText, 0.9, true);
        await waitForMicrotasks();
      }

      expect(executedCommands).toHaveLength(commands.length);
      expect(executedCommands).toContain('help');
      expect(executedCommands).toContain('voice-status');
      expect(executedCommands).toContain('go-back');
      expect(executedCommands).toContain('go-forward');
    });

    it('should maintain session state throughout voice interaction', async () => {
      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Execute several commands
      webSpeechMocks.mockRecognition._triggerResult('help', 0.9, true);
      await waitForMicrotasks();

      webSpeechMocks.mockRecognition._triggerResult('voice status', 0.85, true);
      await waitForMicrotasks();

      webSpeechMocks.mockRecognition._triggerResult('go back', 0.88, true);
      await waitForMicrotasks();

      const state = voiceControl.getState();
      expect(state.currentSession).toBeDefined();
      expect(state.currentSession!.commands).toHaveLength(3);

      // Verify session statistics
      const session = state.currentSession!;
      expect(session.stats.totalCommands).toBe(3);
      expect(session.stats.successfulCommands).toBe(3);
      expect(session.stats.failedCommands).toBe(0);
    });

    it('should handle command execution failures gracefully', async () => {
      const errors: any[] = [];

      voiceControl.on('voice:command:failed', (data) => {
        errors.push(data);
      });

      // Register a command that will fail
      const failingCommand = generateMockCommand({
        id: 'failing-command',
        trigger: 'fail please',
        handler: vi.fn().mockRejectedValue(new Error('Command failed'))
      });

      await voiceControl.initialize(mockConfig);

      // Register the failing command after initialization
      voiceControl.commandRegistry.register(failingCommand);

      await voiceControl.start();

      // Trigger the failing command
      webSpeechMocks.mockRecognition._triggerResult('fail please', 0.9, true);
      await waitForMicrotasks();

      expect(errors).toHaveLength(1);
      expect(errors[0].error).toContain('Command failed');

      // System should still be responsive
      const state = voiceControl.getState();
      expect(state.isActive).toBe(true);
      expect(state.isListening).toBe(true);
    });
  });

  // ============================================================================
  // Built-in Commands E2E Tests
  // ============================================================================

  describe('built-in commands execution', () => {
    beforeEach(async () => {
      await voiceControl.initialize(mockConfig);
      await voiceControl.start();
    });

    it('should execute help command and provide feedback', async () => {
      const feedbackMessages: string[] = [];

      // Mock feedback service to capture spoken messages
      const originalSpeak = voiceControl.feedbackService.speak;
      voiceControl.feedbackService.speak = vi.fn().mockImplementation(async (message) => {
        feedbackMessages.push(message);
        return { success: true, text: message };
      });

      webSpeechMocks.mockRecognition._triggerResult('help', 0.95, true);
      await waitForMicrotasks();

      expect(feedbackMessages).toHaveLength(1);
      expect(feedbackMessages[0]).toContain('Available commands');
    });

    it('should execute voice status command', async () => {
      const executedCommands: any[] = [];

      voiceControl.on('voice:command:executed', ({ command, result }) => {
        executedCommands.push({ command: command.id, result });
      });

      webSpeechMocks.mockRecognition._triggerResult('voice status', 0.9, true);
      await waitForMicrotasks();

      expect(executedCommands).toHaveLength(1);
      expect(executedCommands[0].command).toBe('voice-status');
      expect(executedCommands[0].result.success).toBe(true);
      expect(executedCommands[0].result.data).toBeDefined();
    });

    it('should execute navigation commands', async () => {
      const navigationActions: string[] = [];

      // Mock window.history
      const mockHistory = {
        back: vi.fn(() => navigationActions.push('back')),
        forward: vi.fn(() => navigationActions.push('forward'))
      };

      Object.defineProperty(window, 'history', {
        value: mockHistory,
        writable: true
      });

      // Test back navigation
      webSpeechMocks.mockRecognition._triggerResult('go back', 0.9, true);
      await waitForMicrotasks();

      // Test forward navigation
      webSpeechMocks.mockRecognition._triggerResult('go forward', 0.9, true);
      await waitForMicrotasks();

      expect(navigationActions).toContain('back');
      expect(navigationActions).toContain('forward');
    });

    it('should execute page reload command', async () => {
      let reloadCalled = false;

      // Mock window.location.reload
      Object.defineProperty(window, 'location', {
        value: {
          reload: vi.fn(() => { reloadCalled = true; })
        },
        writable: true
      });

      webSpeechMocks.mockRecognition._triggerResult('reload page', 0.9, true);
      await waitForMicrotasks();

      expect(reloadCalled).toBe(true);
    });

    it('should handle start/stop listening commands', async () => {
      // Test stop listening
      webSpeechMocks.mockRecognition._triggerResult('stop listening', 0.9, true);
      await waitForMicrotasks();

      expect(voiceControl.getState().isListening).toBe(false);

      // Test start listening
      webSpeechMocks.mockRecognition._triggerResult('start listening', 0.9, true);
      await waitForMicrotasks();

      expect(voiceControl.getState().isListening).toBe(true);
    });
  });

  // ============================================================================
  // Custom Commands E2E Tests
  // ============================================================================

  describe('custom commands integration', () => {
    it('should register and execute custom commands', async () => {
      const customCommandResult = { executed: false, parameters: {} };

      const customCommand: VoiceCommand = {
        id: 'custom-test',
        trigger: 'custom command',
        aliases: ['custom cmd'],
        description: 'Test custom command',
        category: 'system',
        handler: async (params) => {
          customCommandResult.executed = true;
          customCommandResult.parameters = params.parameters;
          return { success: true, message: 'Custom command executed' };
        }
      };

      await voiceControl.initialize(mockConfig);

      // Register custom command
      voiceControl.commandRegistry.register(customCommand);

      await voiceControl.start();

      // Execute custom command
      webSpeechMocks.mockRecognition._triggerResult('custom command', 0.9, true);
      await waitForMicrotasks();

      expect(customCommandResult.executed).toBe(true);
    });

    it('should handle custom commands with parameters', async () => {
      const customCommandResult = { parameters: {} };

      const customCommand: VoiceCommand = {
        id: 'parametrized-command',
        trigger: 'create note called',
        description: 'Create a note with a title',
        category: 'document',
        parameters: [{
          name: 'title',
          type: 'string',
          required: true,
          description: 'Note title'
        }],
        handler: async (params) => {
          customCommandResult.parameters = params.parameters;
          return { success: true, message: `Created note: ${params.parameters.title}` };
        }
      };

      await voiceControl.initialize(mockConfig);
      voiceControl.commandRegistry.register(customCommand);
      await voiceControl.start();

      webSpeechMocks.mockRecognition._triggerResult('create note called Meeting Notes', 0.9, true);
      await waitForMicrotasks();

      expect(customCommandResult.parameters.title).toBe('Meeting Notes');
    });

    it('should handle custom command aliases', async () => {
      let commandExecuted = false;

      const customCommand: VoiceCommand = {
        id: 'alias-test',
        trigger: 'primary trigger',
        aliases: ['alias one', 'alias two'],
        description: 'Test aliases',
        category: 'system',
        handler: async () => {
          commandExecuted = true;
          return { success: true, message: 'Alias command executed' };
        }
      };

      await voiceControl.initialize(mockConfig);
      voiceControl.commandRegistry.register(customCommand);
      await voiceControl.start();

      // Test alias execution
      webSpeechMocks.mockRecognition._triggerResult('alias one', 0.9, true);
      await waitForMicrotasks();

      expect(commandExecuted).toBe(true);
    });
  });

  // ============================================================================
  // Context-Aware Commands E2E Tests
  // ============================================================================

  describe('context-aware commands', () => {
    it('should execute context-appropriate commands with higher confidence', async () => {
      const matchedCommands: any[] = [];

      voiceControl.on('voice:command:matched', ({ command, confidence }) => {
        matchedCommands.push({ id: command.id, confidence });
      });

      // Set up context
      const mockContext = generateMockContext({
        currentView: '/workspace/doc',
        workspace: { id: 'ws-1', name: 'Test Workspace' },
        document: { id: 'doc-1', title: 'Test Doc', type: 'page' }
      });

      // Register context-specific command
      const contextCommand: VoiceCommand = {
        id: 'context-specific',
        trigger: 'test context',
        description: 'Context-specific command',
        category: 'document',
        context: {
          requiredView: '/workspace/doc'
        },
        handler: async () => ({ success: true, message: 'Context command executed' })
      };

      await voiceControl.initialize(mockConfig);

      // Set context through navigation service
      voiceControl.navigationService.updateContext(mockContext);

      voiceControl.commandRegistry.register(contextCommand);
      await voiceControl.start();

      webSpeechMocks.mockRecognition._triggerResult('test context', 0.8, true);
      await waitForMicrotasks();

      expect(matchedCommands).toHaveLength(1);
      expect(matchedCommands[0].id).toBe('context-specific');
      expect(matchedCommands[0].confidence).toBeGreaterThan(0.7);
    });

    it('should handle context changes during voice session', async () => {
      const executedCommands: string[] = [];

      voiceControl.on('voice:command:executed', ({ command }) => {
        executedCommands.push(command.id);
      });

      // Register workspace-specific commands
      const workspaceCommand1: VoiceCommand = {
        id: 'ws1-command',
        trigger: 'workspace command',
        description: 'Workspace 1 command',
        category: 'workspace',
        context: { requiredWorkspace: 'ws-1' },
        handler: async () => ({ success: true, message: 'WS1 command' })
      };

      const workspaceCommand2: VoiceCommand = {
        id: 'ws2-command',
        trigger: 'workspace command',
        description: 'Workspace 2 command',
        category: 'workspace',
        context: { requiredWorkspace: 'ws-2' },
        handler: async () => ({ success: true, message: 'WS2 command' })
      };

      await voiceControl.initialize(mockConfig);
      voiceControl.commandRegistry.register(workspaceCommand1);
      voiceControl.commandRegistry.register(workspaceCommand2);
      await voiceControl.start();

      // Set initial context
      voiceControl.navigationService.updateContext({
        workspace: { id: 'ws-1', name: 'Workspace 1' }
      });

      webSpeechMocks.mockRecognition._triggerResult('workspace command', 0.9, true);
      await waitForMicrotasks();

      // Change context
      voiceControl.navigationService.updateContext({
        workspace: { id: 'ws-2', name: 'Workspace 2' }
      });

      webSpeechMocks.mockRecognition._triggerResult('workspace command', 0.9, true);
      await waitForMicrotasks();

      expect(executedCommands).toContain('ws1-command');
      expect(executedCommands).toContain('ws2-command');
    });
  });

  // ============================================================================
  // Error Handling E2E Tests
  // ============================================================================

  describe('error handling end-to-end', () => {
    it('should recover from recognition errors and continue listening', async () => {
      const errors: any[] = [];
      const recoveries: any[] = [];

      voiceControl.on('voice:error', (data) => {
        errors.push(data);
      });

      voiceControl.on('voice:listening:start', () => {
        recoveries.push({ type: 'listening_resumed' });
      });

      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Simulate recognition error
      webSpeechMocks.mockRecognition._triggerError('no-speech');
      await waitForMicrotasks();

      expect(errors).toHaveLength(1);

      // System should still be able to process commands after error
      webSpeechMocks.mockRecognition._triggerResult('help', 0.9, true);
      await waitForMicrotasks();

      const state = voiceControl.getState();
      expect(state.isActive).toBe(true);
    });

    it('should handle unrecognized commands gracefully', async () => {
      const feedbackMessages: string[] = [];

      // Mock feedback service
      const originalSpeak = voiceControl.feedbackService.speak;
      voiceControl.feedbackService.speak = vi.fn().mockImplementation(async (message) => {
        feedbackMessages.push(message);
        return { success: true, text: message };
      });

      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Trigger unrecognized command
      webSpeechMocks.mockRecognition._triggerResult('completely unknown command', 0.9, true);
      await waitForMicrotasks();

      expect(feedbackMessages).toHaveLength(1);
      expect(feedbackMessages[0]).toContain("didn't understand");
    });

    it('should handle low confidence recognition results', async () => {
      const recognitionEvents: any[] = [];

      voiceControl.on('voice:recognition', (data) => {
        recognitionEvents.push(data);
      });

      voiceControl.on('voice:command:executed', () => {
        recognitionEvents.push({ type: 'command_executed' });
      });

      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Trigger low confidence result (below threshold)
      webSpeechMocks.mockRecognition._triggerResult('help', 0.5, true); // Below 0.7 threshold
      await waitForMicrotasks();

      // Should receive recognition event but not execute command
      expect(recognitionEvents.some(e => e.transcript === 'help')).toBe(true);
      expect(recognitionEvents.some(e => e.type === 'command_executed')).toBe(false);
    });
  });

  // ============================================================================
  // Performance E2E Tests
  // ============================================================================

  describe('performance end-to-end', () => {
    it('should handle rapid voice commands efficiently', async () => {
      const executedCommands: string[] = [];

      voiceControl.on('voice:command:executed', ({ command }) => {
        executedCommands.push(command.id);
      });

      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      const commands = ['help', 'voice status', 'help', 'voice status', 'help'];

      const performanceResult = await measurePerformance(async () => {
        for (const command of commands) {
          webSpeechMocks.mockRecognition._triggerResult(command, 0.9, true);
          await waitForMicrotasks();
        }
      });

      expectPerformance(performanceResult, 50); // Should handle 5 commands in under 50ms total

      expect(executedCommands).toHaveLength(commands.length);
    });

    it('should maintain performance with many registered commands', async () => {
      // Register many commands
      for (let i = 0; i < 100; i++) {
        const command = generateMockCommand({
          id: `perf-command-${i}`,
          trigger: `command ${i}`,
          handler: async () => ({ success: true, message: `Command ${i} executed` })
        });
        voiceControl.commandRegistry.register(command);
      }

      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      const performanceResult = await measurePerformance(async () => {
        webSpeechMocks.mockRecognition._triggerResult('command 50', 0.9, true);
        await waitForMicrotasks();
      }, 10);

      expectPerformance(performanceResult, 20); // Should find and execute command quickly even with many registered
    });

    it('should handle long voice sessions without memory leaks', async () => {
      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Simulate long session with many commands
      for (let i = 0; i < 50; i++) {
        webSpeechMocks.mockRecognition._triggerResult('help', 0.9, true);
        await waitForMicrotasks();
      }

      const state = voiceControl.getState();
      const session = state.currentSession!;

      expect(session.commands).toHaveLength(50);
      expect(session.stats.totalCommands).toBe(50);
      expect(session.stats.successfulCommands).toBe(50);

      // Memory usage should be reasonable
      expect(session.commands.length).toBeLessThanOrEqual(100); // Should limit history if needed
    });
  });

  // ============================================================================
  // Configuration E2E Tests
  // ============================================================================

  describe('configuration end-to-end', () => {
    it('should apply configuration changes during active session', async () => {
      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Change confidence threshold
      await voiceControl.updateConfig({
        recognition: { confidenceThreshold: 0.9 }
      });

      // Test with confidence below new threshold
      webSpeechMocks.mockRecognition._triggerResult('help', 0.85, true); // Below 0.9
      await waitForMicrotasks();

      const state = voiceControl.getState();
      // Command should not be executed due to low confidence
      expect(state.currentSession?.commands || []).toHaveLength(0);

      // Test with confidence above new threshold
      webSpeechMocks.mockRecognition._triggerResult('help', 0.95, true); // Above 0.9
      await waitForMicrotasks();

      // Command should be executed
      expect(state.currentSession?.commands || []).toHaveLength(1);
    });

    it('should handle language switching during session', async () => {
      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Change language
      await voiceControl.updateConfig({
        recognition: { language: 'es-ES' }
      });

      // Verify language was applied to recognition provider
      const recognition = (voiceControl as any).speechRecognition;
      if (recognition && recognition.setLanguage) {
        expect(webSpeechMocks.mockRecognition.lang).toBe('es-ES');
      }
    });

    it('should handle feedback configuration changes', async () => {
      const feedbackMessages: string[] = [];

      // Mock feedback service
      const originalSpeak = voiceControl.feedbackService.speak;
      voiceControl.feedbackService.speak = vi.fn().mockImplementation(async (message) => {
        feedbackMessages.push(message);
        return { success: true, text: message };
      });

      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Disable audio feedback
      await voiceControl.updateConfig({
        feedback: { audioEnabled: false }
      });

      webSpeechMocks.mockRecognition._triggerResult('help', 0.9, true);
      await waitForMicrotasks();

      // Should not have spoken feedback when audio is disabled
      expect(feedbackMessages).toHaveLength(0);

      // Re-enable audio feedback
      await voiceControl.updateConfig({
        feedback: { audioEnabled: true }
      });

      webSpeechMocks.mockRecognition._triggerResult('help', 0.9, true);
      await waitForMicrotasks();

      // Should have spoken feedback when audio is enabled
      expect(feedbackMessages).toHaveLength(1);
    });
  });

  // ============================================================================
  // Lifecycle E2E Tests
  // ============================================================================

  describe('lifecycle end-to-end', () => {
    it('should handle complete lifecycle: init → start → stop → dispose', async () => {
      const events: string[] = [];

      voiceControl.on('voice:started', () => events.push('started'));
      voiceControl.on('voice:stopped', () => events.push('stopped'));

      // Initialize
      await voiceControl.initialize(mockConfig);
      expect(events).toContain('started');

      // Start
      await voiceControl.start();
      expect(voiceControl.getState().isActive).toBe(true);

      // Execute command to verify it's working
      webSpeechMocks.mockRecognition._triggerResult('help', 0.9, true);
      await waitForMicrotasks();

      // Stop
      await voiceControl.stop();
      expect(events).toContain('stopped');
      expect(voiceControl.getState().isActive).toBe(false);

      // Dispose
      await voiceControl.dispose();

      // Should not respond to commands after disposal
      webSpeechMocks.mockRecognition._triggerResult('help', 0.9, true);
      await waitForMicrotasks();

      // No new session should be created
      expect(voiceControl.getState().currentSession).toBeUndefined();
    });

    it('should handle restart after stop', async () => {
      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Stop
      await voiceControl.stop();
      expect(voiceControl.getState().isActive).toBe(false);

      // Restart
      await voiceControl.start();
      expect(voiceControl.getState().isActive).toBe(true);

      // Should work normally after restart
      webSpeechMocks.mockRecognition._triggerResult('help', 0.9, true);
      await waitForMicrotasks();

      const state = voiceControl.getState();
      expect(state.currentSession?.commands).toHaveLength(1);
    });

    it('should handle multiple dispose calls safely', async () => {
      await voiceControl.initialize(mockConfig);
      await voiceControl.start();

      // Multiple dispose calls should not throw
      await expect(voiceControl.dispose()).resolves.not.toThrow();
      await expect(voiceControl.dispose()).resolves.not.toThrow();
      await expect(voiceControl.dispose()).resolves.not.toThrow();
    });
  });
});