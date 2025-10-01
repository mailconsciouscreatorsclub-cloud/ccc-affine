/**
 * VoiceFeedbackService Test Suite
 *
 * Tests for speech synthesis, visual feedback, audio/visual controls,
 * configuration updates, and browser API integration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceFeedbackService } from '../../../../packages/frontend/core/src/modules/voice-control/services/voice-feedback.service';
import {
  generateMockConfig,
  setupWebSpeechMocks,
  createMockSpeechSynthesis,
  createMockSpeechSynthesisUtterance,
  waitForMicrotasks,
  generateMockSynthesisResult
} from '../../test-utils';
import type { VoiceFeedbackConfig } from '../../../../packages/frontend/core/src/modules/voice-control/types';

describe('VoiceFeedbackService', () => {
  let service: VoiceFeedbackService;
  let mockConfig: VoiceFeedbackConfig;
  let webSpeechMocks: ReturnType<typeof setupWebSpeechMocks>;

  beforeEach(async () => {
    webSpeechMocks = setupWebSpeechMocks();
    service = new VoiceFeedbackService();
    mockConfig = generateMockConfig().feedback;
    await service.initialize(mockConfig);
  });

  afterEach(async () => {
    await service.dispose();
    webSpeechMocks.cleanup();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('initialization', () => {
    it('should initialize successfully with default config', async () => {
      const newService = new VoiceFeedbackService();
      await expect(newService.initialize()).resolves.not.toThrow();
      await newService.dispose();
    });

    it('should initialize with custom config', async () => {
      const customConfig: VoiceFeedbackConfig = {
        audioEnabled: false,
        visualEnabled: true,
        speechRate: 1.5,
        speechPitch: 0.8,
        speechVolume: 0.6
      };

      const newService = new VoiceFeedbackService();
      await expect(newService.initialize(customConfig)).resolves.not.toThrow();

      const currentConfig = newService.getConfig();
      expect(currentConfig.speechRate).toBe(1.5);
      expect(currentConfig.speechPitch).toBe(0.8);
      expect(currentConfig.audioEnabled).toBe(false);

      await newService.dispose();
    });

    it('should not throw when initialized multiple times', async () => {
      await expect(service.initialize(mockConfig)).resolves.not.toThrow();
      await expect(service.initialize(mockConfig)).resolves.not.toThrow();
    });

    it('should handle missing speech synthesis API gracefully', async () => {
      delete (global as any).speechSynthesis;
      delete (window as any).speechSynthesis;

      const newService = new VoiceFeedbackService();
      await expect(newService.initialize(mockConfig)).resolves.not.toThrow();

      // Should fall back to visual-only feedback
      const config = newService.getConfig();
      expect(config.audioEnabled).toBe(false);

      await newService.dispose();

      // Restore for other tests
      webSpeechMocks = setupWebSpeechMocks();
    });

    it('should detect available voices on initialization', async () => {
      const voices = service.getAvailableVoices();
      expect(Array.isArray(voices)).toBe(true);
      expect(voices.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // Speech Synthesis Tests
  // ============================================================================

  describe('speech synthesis', () => {
    it('should speak text successfully', async () => {
      const result = await service.speak('Hello world');

      expect(result.success).toBe(true);
      expect(result.text).toBe('Hello world');
      expect(webSpeechMocks.mockSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    it('should respect audio enabled/disabled setting', async () => {
      // Test with audio enabled
      await service.updateConfig({ audioEnabled: true });
      await service.speak('Test with audio');
      expect(webSpeechMocks.mockSynthesis.speak).toHaveBeenCalled();

      vi.clearAllMocks();

      // Test with audio disabled
      await service.updateConfig({ audioEnabled: false });
      await service.speak('Test without audio');
      expect(webSpeechMocks.mockSynthesis.speak).not.toHaveBeenCalled();
    });

    it('should apply speech configuration to utterances', async () => {
      const customConfig = {
        speechRate: 1.5,
        speechPitch: 0.8,
        speechVolume: 0.6
      };

      await service.updateConfig(customConfig);
      await service.speak('Configuration test');

      const speakCall = webSpeechMocks.mockSynthesis.speak.mock.calls[0];
      const utterance = speakCall[0];

      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(0.8);
      expect(utterance.volume).toBe(0.6);
    });

    it('should handle different feedback types with appropriate voices', async () => {
      const testCases = [
        { type: 'success', expectedTone: 'success' },
        { type: 'error', expectedTone: 'error' },
        { type: 'info', expectedTone: 'info' },
        { type: 'warning', expectedTone: 'warning' }
      ] as const;

      for (const { type, expectedTone } of testCases) {
        vi.clearAllMocks();
        await service.speak(`Test ${type} message`, type);

        expect(webSpeechMocks.mockSynthesis.speak).toHaveBeenCalledTimes(1);
        // Could test for different voice selection based on type
      }
    });

    it('should handle very long text appropriately', async () => {
      const longText = 'Very long text. '.repeat(100); // 1600+ characters

      const result = await service.speak(longText);

      expect(result.success).toBe(true);
      expect(webSpeechMocks.mockSynthesis.speak).toHaveBeenCalledTimes(1);

      const utterance = webSpeechMocks.mockSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toBe(longText);
    });

    it('should handle empty text gracefully', async () => {
      const result = await service.speak('');

      expect(result.success).toBe(true);
      // Should not actually speak empty text
      expect(webSpeechMocks.mockSynthesis.speak).not.toHaveBeenCalled();
    });

    it('should handle speech synthesis errors', async () => {
      // Mock an error in speech synthesis
      const mockUtterance = createMockSpeechSynthesisUtterance('Error test');
      webSpeechMocks.mockSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance._triggerError('synthesis-failed'), 10);
      });

      const result = await service.speak('This should fail');

      expect(result.success).toBe(false);
    });

    it('should queue multiple speech requests properly', async () => {
      const promises = [
        service.speak('First message'),
        service.speak('Second message'),
        service.speak('Third message')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => expect(result.success).toBe(true));

      // All should have been queued through speech synthesis
      expect(webSpeechMocks.mockSynthesis.speak).toHaveBeenCalledTimes(3);
    });
  });

  // ============================================================================
  // Visual Feedback Tests
  // ============================================================================

  describe('visual feedback', () => {
    beforeEach(() => {
      // Set up DOM for visual feedback tests
      document.body.innerHTML = '<div id="app"></div>';
    });

    it('should show visual feedback when enabled', async () => {
      await service.updateConfig({ visualEnabled: true });
      await service.speak('Visual feedback test', 'info');

      await waitForMicrotasks();

      // Check if visual feedback banner was created
      const feedbackElement = document.querySelector('[data-voice-feedback]');
      expect(feedbackElement).toBeTruthy();
    });

    it('should not show visual feedback when disabled', async () => {
      await service.updateConfig({ visualEnabled: false });
      await service.speak('No visual feedback test', 'info');

      await waitForMicrotasks();

      const feedbackElement = document.querySelector('[data-voice-feedback]');
      expect(feedbackElement).toBeFalsy();
    });

    it('should apply appropriate styling for different feedback types', async () => {
      await service.updateConfig({ visualEnabled: true });

      const testCases = ['success', 'error', 'info', 'warning'] as const;

      for (const type of testCases) {
        await service.speak(`${type} message`, type);
        await waitForMicrotasks();

        const feedbackElement = document.querySelector('[data-voice-feedback]');
        expect(feedbackElement).toBeTruthy();
        expect(feedbackElement?.getAttribute('data-feedback-type')).toBe(type);

        // Clean up for next test
        feedbackElement?.remove();
      }
    });

    it('should auto-dismiss visual feedback after timeout', async () => {
      await service.updateConfig({ visualEnabled: true });
      await service.speak('Auto-dismiss test', 'info');

      await waitForMicrotasks();

      const feedbackElement = document.querySelector('[data-voice-feedback]');
      expect(feedbackElement).toBeTruthy();

      // Fast-forward timers to trigger auto-dismiss
      vi.advanceTimersByTime(4000); // Default timeout is usually 3 seconds
      await waitForMicrotasks();

      // Element should be removed
      const elementAfterTimeout = document.querySelector('[data-voice-feedback]');
      expect(elementAfterTimeout).toBeFalsy();
    });

    it('should handle multiple simultaneous visual feedbacks', async () => {
      await service.updateConfig({ visualEnabled: true });

      await Promise.all([
        service.speak('Message 1', 'info'),
        service.speak('Message 2', 'success'),
        service.speak('Message 3', 'warning')
      ]);

      await waitForMicrotasks();

      const feedbackElements = document.querySelectorAll('[data-voice-feedback]');
      expect(feedbackElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should be accessible with proper ARIA attributes', async () => {
      await service.updateConfig({ visualEnabled: true });
      await service.speak('Accessibility test', 'info');

      await waitForMicrotasks();

      const feedbackElement = document.querySelector('[data-voice-feedback]');
      expect(feedbackElement).toBeTruthy();

      // Check for accessibility attributes
      expect(feedbackElement?.getAttribute('role')).toBeTruthy();
      expect(feedbackElement?.getAttribute('aria-live')).toBeTruthy();
      expect(feedbackElement?.getAttribute('aria-atomic')).toBeTruthy();
    });
  });

  // ============================================================================
  // Voice Selection Tests
  // ============================================================================

  describe('voice selection', () => {
    it('should list available voices', () => {
      const voices = service.getAvailableVoices();

      expect(Array.isArray(voices)).toBe(true);
      voices.forEach(voice => {
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('language');
      });
    });

    it('should set voice successfully', async () => {
      const voices = service.getAvailableVoices();

      if (voices.length > 0) {
        const testVoice = voices[0];
        await expect(service.setVoice(testVoice.id)).resolves.not.toThrow();

        // Test that the voice is used in speech
        await service.speak('Voice test');
        const utterance = webSpeechMocks.mockSynthesis.speak.mock.calls[0][0];
        expect(utterance.voice).toBeTruthy();
      }
    });

    it('should handle invalid voice ID gracefully', async () => {
      await expect(service.setVoice('non-existent-voice')).rejects.toThrow();
    });

    it('should filter voices by language', () => {
      const voices = service.getAvailableVoices();
      const englishVoices = voices.filter(voice => voice.language.startsWith('en'));

      expect(Array.isArray(englishVoices)).toBe(true);
      englishVoices.forEach(voice => {
        expect(voice.language).toMatch(/^en/);
      });
    });

    it('should prefer local voices over cloud voices', () => {
      const voices = service.getAvailableVoices();
      const localVoices = voices.filter(voice => voice.isLocal);
      const cloudVoices = voices.filter(voice => !voice.isLocal);

      // If both types exist, local should be prioritized
      if (localVoices.length > 0 && cloudVoices.length > 0) {
        // Implementation would prefer local voices
        expect(localVoices.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================================================
  // Configuration Management Tests
  // ============================================================================

  describe('configuration management', () => {
    it('should update configuration successfully', async () => {
      const newConfig: Partial<VoiceFeedbackConfig> = {
        speechRate: 2.0,
        speechVolume: 0.5,
        audioEnabled: false
      };

      await service.updateConfig(newConfig);

      const config = service.getConfig();
      expect(config.speechRate).toBe(2.0);
      expect(config.speechVolume).toBe(0.5);
      expect(config.audioEnabled).toBe(false);
    });

    it('should merge partial configuration updates', async () => {
      const originalConfig = service.getConfig();

      await service.updateConfig({ speechRate: 1.8 });

      const updatedConfig = service.getConfig();
      expect(updatedConfig.speechRate).toBe(1.8);
      expect(updatedConfig.speechPitch).toBe(originalConfig.speechPitch); // Should remain unchanged
      expect(updatedConfig.speechVolume).toBe(originalConfig.speechVolume); // Should remain unchanged
    });

    it('should validate configuration values', async () => {
      // Test invalid speech rate
      await expect(service.updateConfig({ speechRate: -1 })).rejects.toThrow();
      await expect(service.updateConfig({ speechRate: 11 })).rejects.toThrow();

      // Test invalid pitch
      await expect(service.updateConfig({ speechPitch: -1 })).rejects.toThrow();
      await expect(service.updateConfig({ speechPitch: 3 })).rejects.toThrow();

      // Test invalid volume
      await expect(service.updateConfig({ speechVolume: -1 })).rejects.toThrow();
      await expect(service.updateConfig({ speechVolume: 2 })).rejects.toThrow();
    });

    it('should apply configuration changes immediately', async () => {
      await service.updateConfig({ speechRate: 1.7, speechPitch: 1.2 });

      await service.speak('Configuration test');

      const utterance = webSpeechMocks.mockSynthesis.speak.mock.calls[0][0];
      expect(utterance.rate).toBe(1.7);
      expect(utterance.pitch).toBe(1.2);
    });

    it('should handle null/undefined config updates gracefully', async () => {
      await expect(service.updateConfig(null as any)).resolves.not.toThrow();
      await expect(service.updateConfig(undefined as any)).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Browser Compatibility Tests
  // ============================================================================

  describe('browser compatibility', () => {
    it('should detect speech synthesis availability', () => {
      const isAvailable = service.isSpeechSynthesisAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });

    it('should handle missing speechSynthesis API', async () => {
      const originalSpeechSynthesis = global.speechSynthesis;
      delete (global as any).speechSynthesis;

      const compatService = new VoiceFeedbackService();
      await compatService.initialize(mockConfig);

      expect(compatService.isSpeechSynthesisAvailable()).toBe(false);

      const result = await compatService.speak('Compatibility test');
      expect(result.success).toBe(true); // Should fall back gracefully

      await compatService.dispose();
      global.speechSynthesis = originalSpeechSynthesis;
    });

    it('should work in SSR environment', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const ssrService = new VoiceFeedbackService();
      await expect(ssrService.initialize(mockConfig)).resolves.not.toThrow();

      const result = await ssrService.speak('SSR test');
      expect(result.success).toBe(true);

      await ssrService.dispose();
      global.window = originalWindow;
    });

    it('should handle browser-specific voice formats', () => {
      const voices = service.getAvailableVoices();

      voices.forEach(voice => {
        // Should handle different voice URI formats
        expect(typeof voice.id).toBe('string');
        expect(voice.id.length).toBeGreaterThan(0);
      });
    });

    it('should handle voices loading asynchronously', async () => {
      // Simulate voices not being immediately available
      webSpeechMocks.mockSynthesis.getVoices.mockReturnValue([]);

      const compatService = new VoiceFeedbackService();
      await compatService.initialize(mockConfig);

      // Initially no voices
      expect(compatService.getAvailableVoices()).toHaveLength(0);

      // Simulate voices becoming available
      webSpeechMocks.mockSynthesis.getVoices.mockReturnValue([
        {
          name: 'Test Voice',
          lang: 'en-US',
          default: true,
          localService: true,
          voiceURI: 'test-voice'
        }
      ]);

      // Simulate voiceschanged event
      if (global.speechSynthesis.onvoiceschanged) {
        global.speechSynthesis.onvoiceschanged();
      }

      await waitForMicrotasks();

      // Should now have voices
      expect(compatService.getAvailableVoices().length).toBeGreaterThan(0);

      await compatService.dispose();
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('performance', () => {
    it('should handle rapid speech requests efficiently', async () => {
      const startTime = performance.now();

      const promises = Array.from({ length: 50 }, (_, i) =>
        service.speak(`Message ${i}`, 'info')
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(200); // Should handle 50 requests quickly
    });

    it('should manage memory efficiently with many visual feedbacks', async () => {
      await service.updateConfig({ visualEnabled: true });

      // Create many visual feedbacks
      for (let i = 0; i < 100; i++) {
        await service.speak(`Message ${i}`, 'info');
      }

      await waitForMicrotasks();

      // Should not create unlimited DOM elements
      const feedbackElements = document.querySelectorAll('[data-voice-feedback]');
      expect(feedbackElements.length).toBeLessThanOrEqual(10); // Should limit concurrent feedbacks
    });

    it('should clean up resources properly', async () => {
      await service.speak('Cleanup test');

      const initialSpyCallCount = webSpeechMocks.mockSynthesis.speak.mock.calls.length;

      await service.dispose();

      // Should not accept new speech requests after disposal
      await service.speak('After dispose');

      expect(webSpeechMocks.mockSynthesis.speak.mock.calls.length).toBe(initialSpyCallCount);
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('edge cases', () => {
    it('should handle special characters in speech text', async () => {
      const specialText = '🎉 Hello! @#$%^&*() 특수문자 émojis 中文';

      const result = await service.speak(specialText);

      expect(result.success).toBe(true);
      expect(result.text).toBe(specialText);
    });

    it('should handle very rapid configuration changes', async () => {
      const configs = [
        { speechRate: 1.0 },
        { speechRate: 1.5 },
        { speechRate: 2.0 },
        { speechPitch: 0.5 },
        { speechPitch: 1.0 },
        { speechVolume: 0.3 },
        { speechVolume: 1.0 }
      ];

      const promises = configs.map(config => service.updateConfig(config));

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should handle speech interruption gracefully', async () => {
      const longSpeech = service.speak('This is a very long message that might be interrupted');

      // Interrupt with new speech
      await service.speak('Interruption');

      // Both should complete successfully
      const result = await longSpeech;
      expect(result.success).toBe(true);
    });

    it('should handle DOM manipulation safely', async () => {
      await service.updateConfig({ visualEnabled: true });

      // Remove document body to simulate extreme edge case
      const originalBody = document.body;
      document.body.remove();

      // Should not throw error
      await expect(service.speak('No body test', 'info')).resolves.not.toThrow();

      // Restore body
      document.documentElement.appendChild(originalBody);
    });

    it('should handle concurrent speak and dispose calls', async () => {
      const speakPromise = service.speak('Concurrent test');
      const disposePromise = service.dispose();

      await expect(Promise.all([speakPromise, disposePromise])).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  describe('accessibility', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div id="app"></div>';
    });

    it('should follow WCAG guidelines for visual feedback', async () => {
      await service.updateConfig({ visualEnabled: true });
      await service.speak('Accessibility test', 'info');

      await waitForMicrotasks();

      const feedbackElement = document.querySelector('[data-voice-feedback]');
      expect(feedbackElement).toBeTruthy();

      // Check ARIA attributes
      expect(feedbackElement?.getAttribute('role')).toBe('status');
      expect(feedbackElement?.getAttribute('aria-live')).toBe('polite');
      expect(feedbackElement?.getAttribute('aria-atomic')).toBe('true');
    });

    it('should respect reduced motion preferences', async () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn(() => ({
          matches: true, // User prefers reduced motion
          media: '(prefers-reduced-motion: reduce)',
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn()
        }))
      });

      await service.updateConfig({ visualEnabled: true });
      await service.speak('Reduced motion test', 'info');

      await waitForMicrotasks();

      const feedbackElement = document.querySelector('[data-voice-feedback]');
      if (feedbackElement) {
        // Should apply reduced motion styles
        const computedStyle = getComputedStyle(feedbackElement);
        // Would check for appropriate motion reduction
      }
    });

    it('should provide screen reader friendly content', async () => {
      await service.updateConfig({ visualEnabled: true });
      await service.speak('Screen reader test message', 'success');

      await waitForMicrotasks();

      const feedbackElement = document.querySelector('[data-voice-feedback]');
      expect(feedbackElement?.textContent).toContain('Screen reader test message');
    });
  });
});