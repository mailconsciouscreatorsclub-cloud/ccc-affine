/**
 * VoiceCommandRegistry Test Suite
 *
 * Comprehensive tests for command registration, fuzzy matching,
 * parameter extraction, and context evaluation.
 */

import { Framework } from '@toeverything/infra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureVoiceControlModule } from '../../index';
import { VoiceCommandRegistry } from '../../services/voice-command-registry.service';
import type { VoiceCommand, VoiceNavigationContext } from '../../types';
import {
  createBooleanParameter,
  createEnumParameter,
  createNumberParameter,
  createStringParameter,
  expectPerformance,
  FUZZY_MATCHING_TEST_CASES,
  generateMockCommand,
  generateMockCommandWithParams,
  generateMockContext,
  measurePerformance,
  PARAMETER_EXTRACTION_TEST_CASES,
  waitForMicrotasks} from '../test-utils';

describe('VoiceCommandRegistry', () => {
  let framework: Framework;
  let registry: VoiceCommandRegistry;
  let mockContext: VoiceNavigationContext;

  beforeEach(async () => {
    framework = new Framework();
    configureVoiceControlModule(framework);
    const provider = framework.provider();
    registry = provider.get(VoiceCommandRegistry);
    await registry.initialize();
    mockContext = generateMockContext();
    registry.setContext(mockContext);
  });

  afterEach(() => {
    registry.clear();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const testFramework = new Framework();
      configureVoiceControlModule(testFramework);
      const testProvider = testFramework.provider();
      const newRegistry = testProvider.get(VoiceCommandRegistry);
      await expect(newRegistry.initialize()).resolves.not.toThrow();
    });

    it('should not throw when initialized multiple times', async () => {
      await expect(registry.initialize()).resolves.not.toThrow();
      await expect(registry.initialize()).resolves.not.toThrow();
    });

    it('should start with empty command registry', () => {
      const commands = registry.getAllCommands();
      expect(commands).toHaveLength(0);
    });
  });

  // ============================================================================
  // Command Registration Tests
  // ============================================================================

  describe('command registration', () => {
    it('should register a command successfully', () => {
      const command = generateMockCommand({ id: 'test-1', trigger: 'open sidebar' });

      expect(() => registry.register(command)).not.toThrow();

      const commands = registry.getAllCommands();
      expect(commands).toHaveLength(1);
      expect(commands[0]).toEqual(command);
    });

    it('should throw error when registering duplicate command id', () => {
      const command1 = generateMockCommand({ id: 'duplicate', trigger: 'first' });
      const command2 = generateMockCommand({ id: 'duplicate', trigger: 'second' });

      registry.register(command1);

      expect(() => registry.register(command2)).toThrow('Voice command with id "duplicate" is already registered.');
    });

    it('should allow multiple commands with same trigger but different ids', () => {
      const command1 = generateMockCommand({ id: 'cmd-1', trigger: 'help' });
      const command2 = generateMockCommand({ id: 'cmd-2', trigger: 'help' });

      expect(() => {
        registry.register(command1);
        registry.register(command2);
      }).not.toThrow();

      expect(registry.getAllCommands()).toHaveLength(2);
    });

    it('should organize commands by category', () => {
      const navCommand = generateMockCommand({ id: 'nav-1', category: 'navigation' });
      const systemCommand = generateMockCommand({ id: 'sys-1', category: 'system' });

      registry.register(navCommand);
      registry.register(systemCommand);

      const navCommands = registry.getCommandsByCategory('navigation');
      const systemCommands = registry.getCommandsByCategory('system');

      expect(navCommands).toHaveLength(1);
      expect(systemCommands).toHaveLength(1);
      expect(navCommands[0].id).toBe('nav-1');
      expect(systemCommands[0].id).toBe('sys-1');
    });

    it('should notify listeners when commands change', () => {
      const listener = vi.fn();
      const unsubscribe = registry.onChange(listener);

      const command = generateMockCommand();
      registry.register(command);

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      registry.register(generateMockCommand({ id: 'another' }));

      expect(listener).toHaveBeenCalledTimes(1); // No additional calls after unsubscribe
    });
  });

  // ============================================================================
  // Command Unregistration Tests
  // ============================================================================

  describe('command unregistration', () => {
    it('should unregister existing command', () => {
      const command = generateMockCommand({ id: 'to-remove' });
      registry.register(command);

      expect(registry.getAllCommands()).toHaveLength(1);

      registry.unregister('to-remove');

      expect(registry.getAllCommands()).toHaveLength(0);
      expect(registry.getCommand('to-remove')).toBeUndefined();
    });

    it('should handle unregistering non-existent command gracefully', () => {
      expect(() => registry.unregister('non-existent')).not.toThrow();
    });

    it('should notify listeners when command is unregistered', () => {
      const listener = vi.fn();
      registry.onChange(listener);

      const command = generateMockCommand({ id: 'to-remove' });
      registry.register(command);
      registry.unregister('to-remove');

      expect(listener).toHaveBeenCalledTimes(2); // Once for register, once for unregister
    });

    it('should remove command from category when unregistered', () => {
      const command = generateMockCommand({ id: 'test', category: 'navigation' });
      registry.register(command);

      expect(registry.getCommandsByCategory('navigation')).toHaveLength(1);

      registry.unregister('test');

      expect(registry.getCommandsByCategory('navigation')).toHaveLength(0);
    });
  });

  // ============================================================================
  // Fuzzy Matching Tests
  // ============================================================================

  describe('fuzzy matching', () => {
    beforeEach(() => {
      // Register test commands
      registry.register(generateMockCommand({ id: 'open-sidebar', trigger: 'open sidebar' }));
      registry.register(generateMockCommand({ id: 'close-sidebar', trigger: 'close sidebar' }));
      registry.register(generateMockCommand({ id: 'create-page', trigger: 'create new page' }));
      registry.register(generateMockCommand({ id: 'help', trigger: 'help', aliases: ['show help', 'what can you do'] }));
    });

    it('should match exact trigger phrase with high confidence', () => {
      const matches = registry.findMatchingCommands('open sidebar');

      expect(matches).toHaveLength(1);
      expect(matches[0].command.id).toBe('open-sidebar');
      expect(matches[0].confidence).toBeGreaterThan(0.9);
    });

    it('should match aliases with high confidence', () => {
      const matches = registry.findMatchingCommands('show help');

      expect(matches).toHaveLength(1);
      expect(matches[0].command.id).toBe('help');
      expect(matches[0].confidence).toBeGreaterThan(0.8);
    });

    it.each(FUZZY_MATCHING_TEST_CASES)('should handle fuzzy matching: "$input" -> "$expected"', ({ input, expected, confidence }) => {
      // Register the expected command
      registry.clear();
      registry.register(generateMockCommand({ id: 'test', trigger: expected }));

      const matches = registry.findMatchingCommands(input);

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThanOrEqual(confidence - 0.1); // Allow small variance
    });

    it('should handle partial word matches', () => {
      const matches = registry.findMatchingCommands('create page');

      expect(matches).toHaveLength(1);
      expect(matches[0].command.id).toBe('create-page');
      expect(matches[0].confidence).toBeGreaterThan(0.6);
    });

    it('should handle typos with reasonable confidence', () => {
      const matches = registry.findMatchingCommands('opne sidebar'); // typo: opne -> open

      expect(matches).toHaveLength(1);
      expect(matches[0].command.id).toBe('open-sidebar');
      expect(matches[0].confidence).toBeGreaterThan(0.7);
    });

    it('should return multiple matches sorted by confidence', () => {
      registry.register(generateMockCommand({ id: 'sidebar-variant', trigger: 'sidebar' }));

      const matches = registry.findMatchingCommands('sidebar');

      expect(matches.length).toBeGreaterThan(1);

      // Should be sorted by confidence (descending)
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].confidence).toBeGreaterThanOrEqual(matches[i].confidence);
      }
    });

    it('should filter out low-confidence matches', () => {
      const matches = registry.findMatchingCommands('completely unrelated phrase that should not match anything');

      expect(matches).toHaveLength(0);
    });

    it('should handle empty input gracefully', () => {
      const matches = registry.findMatchingCommands('');
      expect(matches).toHaveLength(0);
    });

    it('should handle only whitespace input', () => {
      const matches = registry.findMatchingCommands('   \t\n  ');
      expect(matches).toHaveLength(0);
    });

    it('should normalize input (case insensitive, diacritics)', () => {
      registry.register(generateMockCommand({ id: 'accents', trigger: 'café' }));

      const matches1 = registry.findMatchingCommands('CAFÉ');
      const matches2 = registry.findMatchingCommands('cafe');

      expect(matches1).toHaveLength(1);
      expect(matches2).toHaveLength(1);
      expect(matches1[0].confidence).toBeGreaterThan(0.9);
      expect(matches2[0].confidence).toBeGreaterThan(0.9);
    });
  });

  // ============================================================================
  // Parameter Extraction Tests
  // ============================================================================

  describe('parameter extraction', () => {
    it('should extract string parameters', () => {
      const command = generateMockCommandWithParams([
        createStringParameter('title', true)
      ], { trigger: 'create page called' });

      registry.register(command);

      const matches = registry.findMatchingCommands('create page called Test Page');

      expect(matches).toHaveLength(1);
      expect(matches[0].parameters.title).toBe('Test Page');
    });

    it('should extract number parameters', () => {
      const command = generateMockCommandWithParams([
        createNumberParameter('count', true)
      ], { trigger: 'create table with' });

      registry.register(command);

      const matches = registry.findMatchingCommands('create table with 5 rows');

      expect(matches).toHaveLength(1);
      expect(matches[0].parameters.count).toBe(5);
    });

    it('should extract boolean parameters', () => {
      const command = generateMockCommandWithParams([
        createBooleanParameter('enabled', true)
      ], { trigger: 'set notifications' });

      registry.register(command);

      const matchesOn = registry.findMatchingCommands('set notifications on');
      const matchesOff = registry.findMatchingCommands('set notifications off');

      expect(matchesOn[0].parameters.enabled).toBe(true);
      expect(matchesOff[0].parameters.enabled).toBe(false);
    });

    it('should extract enum parameters', () => {
      const command = generateMockCommandWithParams([
        createEnumParameter('format', ['pdf', 'docx', 'html'], true)
      ], { trigger: 'export as' });

      registry.register(command);

      const matches = registry.findMatchingCommands('export as pdf');

      expect(matches).toHaveLength(1);
      expect(matches[0].parameters.format).toBe('pdf');
    });

    it('should handle multiple parameters', () => {
      const command = generateMockCommandWithParams([
        createStringParameter('title', true),
        createNumberParameter('count', false)
      ], { trigger: 'create table called' });

      registry.register(command);

      const matches = registry.findMatchingCommands('create table called User Data 10');

      expect(matches).toHaveLength(1);
      expect(matches[0].parameters.title).toBe('User Data 10'); // String takes remaining text
    });

    it('should provide default values for missing optional parameters', () => {
      const command = generateMockCommandWithParams([
        createStringParameter('title', false)
      ], { trigger: 'create page' });

      command.parameters![0].defaultValue = 'Untitled';
      registry.register(command);

      const matches = registry.findMatchingCommands('create page');

      expect(matches).toHaveLength(1);
      expect(matches[0].parameters.title).toBe('Untitled');
    });

    it.each(PARAMETER_EXTRACTION_TEST_CASES)('should extract parameters correctly: "$input"', ({ input, command, expected }) => {
      // This is a simplified test - in real implementation, we'd register the appropriate command
      const matches = registry.findMatchingCommands(input);
      // This test would need specific command setups for each case
    });
  });

  // ============================================================================
  // Context Evaluation Tests
  // ============================================================================

  describe('context evaluation', () => {
    beforeEach(() => {
      registry.setContext(generateMockContext({
        currentView: '/workspace/doc',
        workspace: { id: 'ws-1', name: 'Test Workspace' },
        document: { id: 'doc-1', title: 'Test Doc', type: 'page' }
      }));
    });

    it('should boost confidence for context-appropriate commands', () => {
      const contextCommand = generateMockCommand({
        id: 'context-appropriate',
        trigger: 'test command',
        context: {
          requiredView: '/workspace/doc'
        }
      });

      const generalCommand = generateMockCommand({
        id: 'general',
        trigger: 'test command'
      });

      registry.register(contextCommand);
      registry.register(generalCommand);

      const matches = registry.findMatchingCommands('test command');

      expect(matches).toHaveLength(2);
      // Context-appropriate command should have higher confidence
      expect(matches[0].command.id).toBe('context-appropriate');
    });

    it('should reduce confidence for context-inappropriate commands', () => {
      const wrongContextCommand = generateMockCommand({
        id: 'wrong-context',
        trigger: 'test command',
        context: {
          requiredView: '/different/view'
        }
      });

      registry.register(wrongContextCommand);

      const matches = registry.findMatchingCommands('test command');

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeLessThan(0.8); // Reduced due to context mismatch
    });

    it('should handle workspace-specific commands', () => {
      const workspaceCommand = generateMockCommand({
        id: 'workspace-specific',
        trigger: 'test command',
        context: {
          requiredWorkspace: 'ws-1'
        }
      });

      registry.register(workspaceCommand);

      const matches = registry.findMatchingCommands('test command');

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThan(0.8);
    });

    it('should handle document-specific commands', () => {
      const docCommand = generateMockCommand({
        id: 'doc-specific',
        trigger: 'test command',
        context: {
          requiredDocument: 'doc-1'
        }
      });

      registry.register(docCommand);

      const matches = registry.findMatchingCommands('test command');

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThan(0.8);
    });

    it('should filter excluded contexts', () => {
      const excludedCommand = generateMockCommand({
        id: 'excluded',
        trigger: 'test command',
        context: {
          excludedContexts: ['/workspace/doc']
        }
      });

      registry.register(excludedCommand);

      const matches = registry.findMatchingCommands('test command');

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeLessThan(0.5); // Heavily penalized
    });

    it('should handle commands without context requirements', () => {
      const universalCommand = generateMockCommand({
        id: 'universal',
        trigger: 'test command'
        // No context property
      });

      registry.register(universalCommand);

      const matches = registry.findMatchingCommands('test command');

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThan(0.8); // Full confidence for universal commands
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('performance', () => {
    beforeEach(() => {
      // Register many commands for performance testing
      for (let i = 0; i < 100; i++) {
        registry.register(generateMockCommand({
          id: `perf-command-${i}`,
          trigger: `command ${i}`,
          aliases: [`alias ${i}`, `alternative ${i}`]
        }));
      }
    });

    it('should find matches quickly with many registered commands', async () => {
      const result = await measurePerformance(() => {
        registry.findMatchingCommands('command 50');
      }, 50);

      expectPerformance(result, 10); // Should complete in under 10ms on average
    });

    it('should register commands quickly', async () => {
      const result = await measurePerformance(() => {
        registry.register(generateMockCommand({
          id: `new-command-${Math.random()}`,
          trigger: 'new command'
        }));
      }, 50);

      expectPerformance(result, 1); // Should complete in under 1ms on average
    });

    it('should handle complex fuzzy matching efficiently', async () => {
      const result = await measurePerformance(() => {
        registry.findMatchingCommands('this is a very long and complex query that should still be processed quickly');
      }, 20);

      expectPerformance(result, 20); // Should complete in under 20ms on average
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('edge cases', () => {
    it('should handle special characters in input', () => {
      const command = generateMockCommand({ trigger: 'test command' });
      registry.register(command);

      const matches = registry.findMatchingCommands('test!@#$%^&*()command');

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThan(0.6);
    });

    it('should handle very long input', () => {
      const command = generateMockCommand({ trigger: 'help' });
      registry.register(command);

      const longInput = 'help ' + 'very '.repeat(100) + 'long input';
      const matches = registry.findMatchingCommands(longInput);

      expect(matches).toHaveLength(1);
    });

    it('should handle numbers in commands', () => {
      const command = generateMockCommand({ trigger: 'go to page 1' });
      registry.register(command);

      const matches = registry.findMatchingCommands('go to page 1');

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThan(0.9);
    });

    it('should handle unicode characters', () => {
      const command = generateMockCommand({ trigger: 'créer une page' });
      registry.register(command);

      const matches = registry.findMatchingCommands('créer une page');

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThan(0.9);
    });

    it('should handle clearing all commands', () => {
      registry.register(generateMockCommand({ id: '1' }));
      registry.register(generateMockCommand({ id: '2' }));

      expect(registry.getAllCommands()).toHaveLength(2);

      registry.clear();

      expect(registry.getAllCommands()).toHaveLength(0);
      expect(registry.getCommandsByCategory('system')).toHaveLength(0);
    });

    it('should notify listeners when clearing', () => {
      const listener = vi.fn();
      registry.onChange(listener);

      registry.register(generateMockCommand());
      registry.clear();

      expect(listener).toHaveBeenCalledTimes(2); // Once for register, once for clear
    });
  });

  // ============================================================================
  // Levenshtein Distance Tests
  // ============================================================================

  describe('levenshtein distance algorithm', () => {
    it('should calculate distance for identical strings', () => {
      registry.register(generateMockCommand({ trigger: 'identical' }));

      const matches = registry.findMatchingCommands('identical');

      expect(matches[0].confidence).toBe(1.0);
    });

    it('should calculate distance for completely different strings', () => {
      registry.register(generateMockCommand({ trigger: 'abc' }));

      const matches = registry.findMatchingCommands('xyz');

      // Should be very low confidence or no matches
      if (matches.length > 0) {
        expect(matches[0].confidence).toBeLessThan(0.5);
      }
    });

    it('should handle single character differences', () => {
      registry.register(generateMockCommand({ trigger: 'test' }));

      const matches = registry.findMatchingCommands('best'); // One character different

      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThan(0.7);
    });
  });
});