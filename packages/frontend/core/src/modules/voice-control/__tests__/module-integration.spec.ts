/**
 * Voice Control Module Integration Tests
 *
 * Tests the DI framework integration and module initialization.
 */

import { Framework } from '@toeverything/infra';
import { beforeEach,describe, expect, it } from 'vitest';

import { configureVoiceControlModule } from '../index';
import { VoiceProviderFactory } from '../providers/provider-factory';
import { WebSpeechProvider } from '../providers/web-speech.provider';
import { VoiceCommandRegistry } from '../services/voice-command-registry.service';
import { VoiceControlService } from '../services/voice-control.service';
import { VoiceFeedbackService } from '../services/voice-feedback.service';
import { VoiceNavigationService } from '../services/voice-navigation.service';

describe('Voice Control Module Integration', () => {
  let framework: Framework;

  beforeEach(() => {
    framework = new Framework();
    configureVoiceControlModule(framework);
  });

  // ============================================================================
  // Module Configuration Tests
  // ============================================================================

  describe('module configuration', () => {
    it('should configure voice control module without errors', () => {
      expect(() => configureVoiceControlModule(framework)).not.toThrow();
    });

    it('should register all required services', () => {
      const provider = framework.provider();

      // All services should be registered
      expect(() => provider.get(VoiceCommandRegistry)).not.toThrow();
      expect(() => provider.get(VoiceProviderFactory)).not.toThrow();
      expect(() => provider.get(WebSpeechProvider)).not.toThrow();
      expect(() => provider.get(VoiceFeedbackService)).not.toThrow();
      expect(() => provider.get(VoiceNavigationService)).not.toThrow();
      expect(() => provider.get(VoiceControlService)).not.toThrow();
    });
  });

  // ============================================================================
  // Service Instantiation Tests
  // ============================================================================

  describe('service instantiation', () => {
    it('should instantiate VoiceCommandRegistry', () => {
      const provider = framework.provider();
      const registry = provider.get(VoiceCommandRegistry);

      expect(registry).toBeInstanceOf(VoiceCommandRegistry);
    });

    it('should instantiate VoiceProviderFactory', () => {
      const provider = framework.provider();
      const factory = provider.get(VoiceProviderFactory);

      expect(factory).toBeInstanceOf(VoiceProviderFactory);
    });

    it('should instantiate WebSpeechProvider', () => {
      const provider = framework.provider();
      const webSpeech = provider.get(WebSpeechProvider);

      expect(webSpeech).toBeInstanceOf(WebSpeechProvider);
    });

    it('should instantiate VoiceFeedbackService', () => {
      const provider = framework.provider();
      const feedback = provider.get(VoiceFeedbackService);

      expect(feedback).toBeInstanceOf(VoiceFeedbackService);
    });

    it('should instantiate VoiceNavigationService', () => {
      const provider = framework.provider();
      const navigation = provider.get(VoiceNavigationService);

      expect(navigation).toBeInstanceOf(VoiceNavigationService);
    });

    it('should instantiate VoiceControlService with dependencies', () => {
      const provider = framework.provider();
      const voiceControl = provider.get(VoiceControlService);

      expect(voiceControl).toBeInstanceOf(VoiceControlService);
    });
  });

  // ============================================================================
  // Dependency Injection Tests
  // ============================================================================

  describe('dependency injection', () => {
    it('should inject dependencies into VoiceControlService', () => {
      const provider = framework.provider();
      const voiceControl = provider.get(VoiceControlService);

      // VoiceControlService should have access to its dependencies
      // We can test this by checking if the service initializes without errors
      expect(voiceControl).toBeDefined();
    });

    it('should provide singleton instances', () => {
      const provider = framework.provider();

      const registry1 = provider.get(VoiceCommandRegistry);
      const registry2 = provider.get(VoiceCommandRegistry);

      // Should return the same instance
      expect(registry1).toBe(registry2);
    });

    it('should maintain proper dependency order', () => {
      const provider = framework.provider();

      // Get services in initialization order
      const registry = provider.get(VoiceCommandRegistry);
      const factory = provider.get(VoiceProviderFactory);
      const webSpeech = provider.get(WebSpeechProvider);
      const feedback = provider.get(VoiceFeedbackService);
      const navigation = provider.get(VoiceNavigationService);
      const voiceControl = provider.get(VoiceControlService);

      // All services should be properly instantiated
      expect(registry).toBeDefined();
      expect(factory).toBeDefined();
      expect(webSpeech).toBeDefined();
      expect(feedback).toBeDefined();
      expect(navigation).toBeDefined();
      expect(voiceControl).toBeDefined();
    });
  });

  // ============================================================================
  // Service Lifecycle Tests
  // ============================================================================

  describe('service lifecycle', () => {
    it('should initialize VoiceCommandRegistry', async () => {
      const provider = framework.provider();
      const registry = provider.get(VoiceCommandRegistry);

      await expect(registry.initialize()).resolves.not.toThrow();
    });

    it('should initialize VoiceNavigationService', async () => {
      const provider = framework.provider();
      const navigation = provider.get(VoiceNavigationService);

      await expect(navigation.initialize()).resolves.not.toThrow();
    });

    it('should handle multiple initialization calls gracefully', async () => {
      const provider = framework.provider();
      const registry = provider.get(VoiceCommandRegistry);

      await registry.initialize();
      await expect(registry.initialize()).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Module Integration Tests
  // ============================================================================

  describe('module integration', () => {
    it('should work with multiple framework instances', () => {
      const framework1 = new Framework();
      const framework2 = new Framework();

      configureVoiceControlModule(framework1);
      configureVoiceControlModule(framework2);

      const provider1 = framework1.provider();
      const provider2 = framework2.provider();

      const service1 = provider1.get(VoiceControlService);
      const service2 = provider2.get(VoiceControlService);

      // Should be different instances for different frameworks
      expect(service1).not.toBe(service2);
    });

    it('should export configureVoiceControlModule function', () => {
      expect(configureVoiceControlModule).toBeDefined();
      expect(typeof configureVoiceControlModule).toBe('function');
    });
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('error handling', () => {
    it('should handle missing dependencies gracefully', () => {
      const emptyFramework = new Framework();
      const provider = emptyFramework.provider();

      // Services not registered should throw
      expect(() => provider.get(VoiceControlService)).toThrow();
    });

    it('should not throw when configuring module multiple times', () => {
      expect(() => {
        configureVoiceControlModule(framework);
        configureVoiceControlModule(framework);
      }).not.toThrow();
    });
  });
});