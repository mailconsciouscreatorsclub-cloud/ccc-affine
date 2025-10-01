/**
 * WebSpeechProvider Integration Test Suite
 *
 * Integration tests for Web Speech API provider including recognition,
 * synthesis, error handling, and browser compatibility.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  WebSpeechProvider,
  WebSpeechRecognitionProvider,
  WebSpeechSynthesisProvider
} from '../../providers/web-speech.provider';
import type {
  SpeechRecognitionProviderConfig,
  SpeechRecognitionResult,
  SpeechSynthesisProviderConfig,
  SynthesisOptions
} from '../../types/providers';
import {
  createMockSpeechRecognition,
  createMockSpeechSynthesis,
  expectPerformance,
  generateMockSpeechResult,
  generateMockSynthesisResult,
  measurePerformance,
  setupWebSpeechMocks,
  simulateAudioError,
  simulateNetworkError,
  simulatePermissionError,
  waitForMicrotasks} from '../test-utils';

describe('WebSpeechProvider Integration', () => {
  let provider: WebSpeechProvider;
  let webSpeechMocks: ReturnType<typeof setupWebSpeechMocks>;

  beforeEach(() => {
    webSpeechMocks = setupWebSpeechMocks();
    provider = new WebSpeechProvider();
  });

  afterEach(async () => {
    await provider.cleanup();
    webSpeechMocks.cleanup();
  });

  // ============================================================================
  // Provider Capabilities Tests
  // ============================================================================

  describe('provider capabilities', () => {
    it('should detect full support when both APIs are available', () => {
      expect(provider.isFullySupported()).toBe(true);
    });

    it('should report accurate capabilities', () => {
      const capabilities = provider.getCapabilities();

      expect(capabilities.recognition).toBe(true);
      expect(capabilities.synthesis).toBe(true);
      expect(capabilities.wakeWordDetection).toBe(false); // Web Speech API limitation
    });

    it('should handle partial API availability', () => {
      // Remove synthesis API
      delete (global as any).speechSynthesis;
      delete (window as any).speechSynthesis;

      const partialProvider = new WebSpeechProvider();
      const capabilities = partialProvider.getCapabilities();

      expect(capabilities.recognition).toBe(true);
      expect(capabilities.synthesis).toBe(false);
      expect(partialProvider.isFullySupported()).toBe(false);
    });

    it('should handle no API availability', () => {
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;
      delete (global as any).speechSynthesis;
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      delete (window as any).speechSynthesis;

      const noApiProvider = new WebSpeechProvider();
      const capabilities = noApiProvider.getCapabilities();

      expect(capabilities.recognition).toBe(false);
      expect(capabilities.synthesis).toBe(false);
      expect(noApiProvider.isFullySupported()).toBe(false);
    });
  });

  // ============================================================================
  // Combined Provider Initialization Tests
  // ============================================================================

  describe('combined provider initialization', () => {
    it('should initialize both recognition and synthesis successfully', async () => {
      const recognitionConfig: SpeechRecognitionProviderConfig = {
        provider: 'web-speech-api',
        options: {
          language: 'en-US',
          continuous: true,
          interimResults: true
        }
      };

      const synthesisConfig: SpeechSynthesisProviderConfig = {
        provider: 'web-speech-api',
        voice: {
          language: 'en-US',
          gender: 'neutral'
        },
        audio: {
          rate: 1.0,
          pitch: 1.0,
          volume: 0.8
        }
      };

      await expect(
        provider.initialize(recognitionConfig, synthesisConfig)
      ).resolves.not.toThrow();
    });

    it('should handle initialization failure gracefully', async () => {
      // Mock initialization failure
      vi.spyOn(provider.recognition, 'initialize').mockRejectedValue(new Error('Init failed'));

      const recognitionConfig: SpeechRecognitionProviderConfig = {
        provider: 'web-speech-api',
        options: { language: 'en-US' }
      };

      const synthesisConfig: SpeechSynthesisProviderConfig = {
        provider: 'web-speech-api'
      };

      await expect(
        provider.initialize(recognitionConfig, synthesisConfig)
      ).rejects.toThrow('Init failed');
    });

    it('should clean up both providers on disposal', async () => {
      const recognitionConfig: SpeechRecognitionProviderConfig = {
        provider: 'web-speech-api',
        options: { language: 'en-US' }
      };

      const synthesisConfig: SpeechSynthesisProviderConfig = {
        provider: 'web-speech-api'
      };

      await provider.initialize(recognitionConfig, synthesisConfig);

      const recognitionCleanupSpy = vi.spyOn(provider.recognition, 'cleanup');
      const synthesisCleanupSpy = vi.spyOn(provider.synthesis, 'cleanup');

      await provider.cleanup();

      expect(recognitionCleanupSpy).toHaveBeenCalled();
      expect(synthesisCleanupSpy).toHaveBeenCalled();
    });
  });
});

describe('WebSpeechRecognitionProvider', () => {
  let provider: WebSpeechRecognitionProvider;
  let webSpeechMocks: ReturnType<typeof setupWebSpeechMocks>;
  let mockRecognition: ReturnType<typeof createMockSpeechRecognition>;

  beforeEach(async () => {
    webSpeechMocks = setupWebSpeechMocks();
    mockRecognition = webSpeechMocks.mockRecognition;
    provider = new WebSpeechRecognitionProvider();

    const config: SpeechRecognitionProviderConfig = {
      provider: 'web-speech-api',
      options: {
        language: 'en-US',
        continuous: true,
        interimResults: true,
        maxAlternatives: 3
      }
    };

    await provider.initialize(config);
  });

  afterEach(async () => {
    await provider.cleanup();
    webSpeechMocks.cleanup();
  });

  // ============================================================================
  // Recognition Provider Tests
  // ============================================================================

  describe('speech recognition', () => {
    it('should start recognition successfully', async () => {
      await provider.startRecognition();

      expect(mockRecognition.start).toHaveBeenCalledTimes(1);
    });

    it('should stop recognition successfully', async () => {
      await provider.startRecognition();
      await provider.stopRecognition();

      expect(mockRecognition.stop).toHaveBeenCalledTimes(1);
    });

    it('should handle recognition results', async () => {
      const results: SpeechRecognitionResult[] = [];
      provider.onResult((result) => {
        results.push(result);
      });

      await provider.startRecognition();

      // Simulate recognition result
      mockRecognition._triggerResult('hello world', 0.95, true);

      await waitForMicrotasks();

      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('hello world');
      expect(results[0].confidence).toBe(0.95);
      expect(results[0].isFinal).toBe(true);
    });

    it('should handle multiple alternatives in results', async () => {
      const results: SpeechRecognitionResult[] = [];
      provider.onResult((result) => {
        results.push(result);
      });

      await provider.startRecognition();

      // Create mock event with alternatives
      const mockEvent = {
        resultIndex: 0,
        results: [{
          0: { transcript: 'hello world', confidence: 0.95 },
          1: { transcript: 'yellow world', confidence: 0.75 },
          2: { transcript: 'mellow world', confidence: 0.65 },
          isFinal: true,
          length: 3,
          [Symbol.iterator]: function*() {
            yield this[0];
            yield this[1];
            yield this[2];
          }
        }]
      };

      mockRecognition.onresult(mockEvent);

      await waitForMicrotasks();

      expect(results).toHaveLength(1);
      expect(results[0].alternatives).toHaveLength(2); // Primary + 2 alternatives = 3 total, but alternatives array has 2
      expect(results[0].alternatives![0].text).toBe('yellow world');
      expect(results[0].alternatives![1].text).toBe('mellow world');
    });

    it('should handle recognition errors', async () => {
      const errors: any[] = [];
      provider.onError((error) => {
        errors.push(error);
      });

      await provider.startRecognition();

      mockRecognition._triggerError('no-speech');

      await waitForMicrotasks();

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('NO_SPEECH');
      expect(errors[0].message).toBe('No speech was detected');
    });

    it('should map browser error codes correctly', async () => {
      const errors: any[] = [];
      provider.onError((error) => {
        errors.push(error);
      });

      await provider.startRecognition();

      const testCases = [
        { browserError: 'no-speech', expectedCode: 'NO_SPEECH' },
        { browserError: 'aborted', expectedCode: 'ABORTED' },
        { browserError: 'audio-capture', expectedCode: 'AUDIO_CAPTURE_FAILED' },
        { browserError: 'network', expectedCode: 'NETWORK_ERROR' },
        { browserError: 'not-allowed', expectedCode: 'PERMISSION_DENIED' },
        { browserError: 'service-not-allowed', expectedCode: 'SERVICE_NOT_ALLOWED' },
        { browserError: 'bad-grammar', expectedCode: 'BAD_GRAMMAR' },
        { browserError: 'language-not-supported', expectedCode: 'LANGUAGE_NOT_SUPPORTED' }
      ];

      for (const { browserError, expectedCode } of testCases) {
        mockRecognition._triggerError(browserError);
        await waitForMicrotasks();
      }

      expect(errors).toHaveLength(testCases.length);
      testCases.forEach((testCase, index) => {
        expect(errors[index].code).toBe(testCase.expectedCode);
      });
    });

    it('should handle no match events', async () => {
      const errors: any[] = [];
      provider.onError((error) => {
        errors.push(error);
      });

      await provider.startRecognition();

      mockRecognition._triggerNoMatch();

      await waitForMicrotasks();

      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('NO_MATCH');
      expect(errors[0].message).toBe('No speech was recognized');
    });

    it('should support language switching', () => {
      provider.setLanguage('es-ES');
      expect(mockRecognition.lang).toBe('es-ES');

      provider.setLanguage('fr-FR');
      expect(mockRecognition.lang).toBe('fr-FR');
    });

    it('should provide supported languages list', () => {
      const languages = provider.getSupportedLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(10);
      expect(languages).toContain('en-US');
      expect(languages).toContain('es-ES');
      expect(languages).toContain('fr-FR');
    });

    it('should prevent starting recognition when already running', async () => {
      await provider.startRecognition();

      // Try to start again
      await provider.startRecognition();

      // Should only call start once
      expect(mockRecognition.start).toHaveBeenCalledTimes(1);
    });

    it('should handle stop when not running', async () => {
      // Try to stop without starting
      await expect(provider.stopRecognition()).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Recognition Performance Tests
  // ============================================================================

  describe('recognition performance', () => {
    it('should handle rapid start/stop cycles', async () => {
      const cycles = 10;

      for (let i = 0; i < cycles; i++) {
        await provider.startRecognition();
        await provider.stopRecognition();
      }

      expect(mockRecognition.start).toHaveBeenCalledTimes(cycles);
      expect(mockRecognition.stop).toHaveBeenCalledTimes(cycles);
    });

    it('should process results quickly', async () => {
      const results: SpeechRecognitionResult[] = [];
      provider.onResult((result) => {
        results.push(result);
      });

      await provider.startRecognition();

      const performanceResult = await measurePerformance(() => {
        mockRecognition._triggerResult('performance test', 0.9, true);
      }, 50);

      await waitForMicrotasks();

      expectPerformance(performanceResult, 5); // Should process results in under 5ms
      expect(results.length).toBeGreaterThanOrEqual(50);
    });
  });
});

describe('WebSpeechSynthesisProvider', () => {
  let provider: WebSpeechSynthesisProvider;
  let webSpeechMocks: ReturnType<typeof setupWebSpeechMocks>;
  let mockSynthesis: ReturnType<typeof createMockSpeechSynthesis>;

  beforeEach(async () => {
    webSpeechMocks = setupWebSpeechMocks();
    mockSynthesis = webSpeechMocks.mockSynthesis;
    provider = new WebSpeechSynthesisProvider();

    const config: SpeechSynthesisProviderConfig = {
      provider: 'web-speech-api',
      voice: {
        language: 'en-US',
        gender: 'neutral'
      },
      audio: {
        rate: 1.0,
        pitch: 1.0,
        volume: 0.8
      }
    };

    await provider.initialize(config);
  });

  afterEach(async () => {
    await provider.cleanup();
    webSpeechMocks.cleanup();
  });

  // ============================================================================
  // Synthesis Provider Tests
  // ============================================================================

  describe('speech synthesis', () => {
    it('should speak text successfully', async () => {
      const result = await provider.speak('Hello world');

      expect(result.success).toBe(true);
      expect(result.text).toBe('Hello world');
      expect(mockSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    it('should apply synthesis options', async () => {
      const options: SynthesisOptions = {
        rate: 1.5,
        pitch: 0.8,
        volume: 0.6
      };

      await provider.speak('Options test', options);

      const utteranceCall = mockSynthesis.speak.mock.calls[0];
      const utterance = utteranceCall[0];

      expect(utterance.rate).toBe(1.5);
      expect(utterance.pitch).toBe(0.8);
      expect(utterance.volume).toBe(0.6);
    });

    it('should handle synthesis completion', async () => {
      // Mock successful completion
      mockSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance._triggerEnd(), 10);
      });

      const result = await provider.speak('Completion test');

      expect(result.success).toBe(true);
      expect(result.metadata?.provider).toBe('web-speech-api');
    });

    it('should handle synthesis errors', async () => {
      // Mock synthesis error
      mockSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance._triggerError('synthesis-failed'), 10);
      });

      await expect(provider.speak('Error test')).rejects.toThrow();
    });

    it('should stop speech successfully', async () => {
      await provider.stop();
      expect(mockSynthesis.cancel).toHaveBeenCalledTimes(1);
    });

    it('should pause and resume speech', async () => {
      await provider.pause();
      expect(mockSynthesis.pause).toHaveBeenCalledTimes(1);

      await provider.resume();
      expect(mockSynthesis.resume).toHaveBeenCalledTimes(1);
    });

    it('should handle empty text gracefully', async () => {
      const result = await provider.speak('');
      expect(result.success).toBe(true);
      expect(mockSynthesis.speak).toHaveBeenCalledTimes(1);
    });

    it('should handle very long text', async () => {
      const longText = 'Very long text. '.repeat(1000); // 16KB+ text

      mockSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance._triggerEnd(), 5);
      });

      const result = await provider.speak(longText);

      expect(result.success).toBe(true);
      expect(result.text).toBe(longText);
    });
  });

  // ============================================================================
  // Voice Management Tests
  // ============================================================================

  describe('voice management', () => {
    it('should list available voices', () => {
      const voices = provider.getAvailableVoices();

      expect(Array.isArray(voices)).toBe(true);
      voices.forEach(voice => {
        expect(voice).toHaveProperty('id');
        expect(voice).toHaveProperty('name');
        expect(voice).toHaveProperty('language');
        expect(voice).toHaveProperty('gender');
        expect(voice).toHaveProperty('isLocal');
        expect(voice).toHaveProperty('isDefault');
      });
    });

    it('should set voice successfully', async () => {
      const voices = provider.getAvailableVoices();

      if (voices.length > 0) {
        const testVoice = voices[0];
        await expect(provider.setVoice(testVoice.id)).resolves.not.toThrow();
      }
    });

    it('should handle invalid voice ID', async () => {
      await expect(provider.setVoice('non-existent-voice')).rejects.toThrow();
    });

    it('should guess voice gender correctly', () => {
      const voices = provider.getAvailableVoices();

      // Test voices should have guessed genders
      voices.forEach(voice => {
        expect(['male', 'female', 'neutral']).toContain(voice.gender);
      });
    });

    it('should handle voice loading delays', async () => {
      // Simulate voices not immediately available
      mockSynthesis.getVoices.mockReturnValue([]);

      const noVoicesProvider = new WebSpeechSynthesisProvider();
      await noVoicesProvider.initialize({
        provider: 'web-speech-api'
      });

      expect(noVoicesProvider.getAvailableVoices()).toHaveLength(0);

      await noVoicesProvider.cleanup();
    });
  });

  // ============================================================================
  // Synthesis Performance Tests
  // ============================================================================

  describe('synthesis performance', () => {
    it('should handle multiple synthesis requests', async () => {
      mockSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance._triggerEnd(), 5);
      });

      const promises = Array.from({ length: 10 }, (_, i) =>
        provider.speak(`Message ${i}`)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => expect(result.success).toBe(true));
    });

    it('should process synthesis requests quickly', async () => {
      mockSynthesis.speak.mockImplementation((utterance) => {
        utterance._triggerEnd();
      });

      const performanceResult = await measurePerformance(() => {
        return provider.speak('Performance test');
      }, 20);

      expectPerformance(performanceResult, 10); // Should complete in under 10ms
    });
  });
});

// ============================================================================
// Cross-Provider Integration Tests
// ============================================================================

describe('Cross-Provider Integration', () => {
  let provider: WebSpeechProvider;
  let webSpeechMocks: ReturnType<typeof setupWebSpeechMocks>;

  beforeEach(async () => {
    webSpeechMocks = setupWebSpeechMocks();
    provider = new WebSpeechProvider();

    const recognitionConfig: SpeechRecognitionProviderConfig = {
      provider: 'web-speech-api',
      options: { language: 'en-US' }
    };

    const synthesisConfig: SpeechSynthesisProviderConfig = {
      provider: 'web-speech-api'
    };

    await provider.initialize(recognitionConfig, synthesisConfig);
  });

  afterEach(async () => {
    await provider.cleanup();
    webSpeechMocks.cleanup();
  });

  describe('recognition and synthesis integration', () => {
    it('should handle simultaneous recognition and synthesis', async () => {
      const results: SpeechRecognitionResult[] = [];
      provider.recognition.onResult((result) => {
        results.push(result);
      });

      // Start recognition
      await provider.recognition.startRecognition();

      // Start synthesis simultaneously
      const synthesisPromise = provider.synthesis.speak('Synthesis while recognizing');

      // Trigger recognition result
      webSpeechMocks.mockRecognition._triggerResult('recognition while synthesizing', 0.9, true);

      await synthesisPromise;
      await waitForMicrotasks();

      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('recognition while synthesizing');
    });

    it('should maintain separate configurations', async () => {
      provider.recognition.setLanguage('es-ES');
      await provider.synthesis.setVoice('Test Voice 2');

      // Recognition language change shouldn't affect synthesis
      expect(webSpeechMocks.mockRecognition.lang).toBe('es-ES');

      // Synthesis voice change shouldn't affect recognition
      const voices = provider.synthesis.getAvailableVoices();
      if (voices.length > 1) {
        expect(webSpeechMocks.mockRecognition.lang).toBe('es-ES'); // Should remain unchanged
      }
    });

    it('should handle cleanup of both providers', async () => {
      const recognitionCleanupSpy = vi.spyOn(provider.recognition, 'cleanup');
      const synthesisCleanupSpy = vi.spyOn(provider.synthesis, 'cleanup');

      await provider.cleanup();

      expect(recognitionCleanupSpy).toHaveBeenCalled();
      expect(synthesisCleanupSpy).toHaveBeenCalled();
    });
  });

  describe('error handling integration', () => {
    it('should handle recognition errors without affecting synthesis', async () => {
      const recognitionErrors: any[] = [];
      provider.recognition.onError((error) => {
        recognitionErrors.push(error);
      });

      await provider.recognition.startRecognition();

      // Trigger recognition error
      webSpeechMocks.mockRecognition._triggerError('audio-capture');

      // Synthesis should still work
      const synthesisResult = await provider.synthesis.speak('Synthesis after recognition error');

      expect(recognitionErrors).toHaveLength(1);
      expect(synthesisResult.success).toBe(true);
    });

    it('should handle synthesis errors without affecting recognition', async () => {
      const results: SpeechRecognitionResult[] = [];
      provider.recognition.onResult((result) => {
        results.push(result);
      });

      await provider.recognition.startRecognition();

      // Cause synthesis error
      webSpeechMocks.mockSynthesis.speak.mockImplementation((utterance) => {
        setTimeout(() => utterance._triggerError('synthesis-failed'), 5);
      });

      await expect(provider.synthesis.speak('Error test')).rejects.toThrow();

      // Recognition should still work
      webSpeechMocks.mockRecognition._triggerResult('recognition after synthesis error', 0.9, true);

      await waitForMicrotasks();

      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('recognition after synthesis error');
    });
  });
});