/**
 * Test Utilities for Voice Control Module
 *
 * Provides mock data generators, test helpers, and common testing utilities
 * for comprehensive voice control testing.
 */

import { vi } from 'vitest';
import type {
  VoiceCommand,
  VoiceNavigationContext,
  VoiceControlConfig,
  VoiceControlState,
  VoiceCommandParameter,
  VoiceRecognitionResult,
  SpeechRecognitionResult,
  SynthesisResult
} from '../../packages/frontend/core/src/modules/voice-control/types';

// ============================================================================
// Mock Data Generators
// ============================================================================

export const generateMockCommand = (overrides: Partial<VoiceCommand> = {}): VoiceCommand => ({
  id: 'test-command',
  trigger: 'test trigger',
  aliases: ['test alias'],
  description: 'Test command description',
  category: 'system',
  handler: vi.fn().mockResolvedValue({ success: true, message: 'Test executed' }),
  parameters: [],
  ...overrides
});

export const generateMockCommandWithParams = (
  parameters: VoiceCommandParameter[],
  overrides: Partial<VoiceCommand> = {}
): VoiceCommand => ({
  ...generateMockCommand(overrides),
  parameters,
  trigger: 'test with parameters',
  id: 'test-command-params'
});

export const generateMockContext = (overrides: Partial<VoiceNavigationContext> = {}): VoiceNavigationContext => ({
  workspace: {
    id: 'ws-1',
    name: 'Test Workspace',
    avatar: '/avatar.png'
  },
  document: {
    id: 'doc-1',
    title: 'Test Document',
    type: 'page'
  },
  currentView: '/workspace/doc',
  navigationHistory: [
    { path: '/workspace', timestamp: Date.now() - 1000 },
    { path: '/workspace/doc', timestamp: Date.now() }
  ],
  sidebarOpen: true,
  user: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com'
  },
  ...overrides
});

export const generateMockConfig = (overrides: Partial<VoiceControlConfig> = {}): VoiceControlConfig => ({
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
  debug: false,
  ...overrides
});

export const generateMockState = (overrides: Partial<VoiceControlState> = {}): VoiceControlState => ({
  isActive: false,
  isListening: false,
  isProcessing: false,
  lastRecognizedText: undefined,
  error: undefined,
  currentSession: undefined,
  ...overrides
});

export const generateMockRecognitionResult = (overrides: Partial<VoiceRecognitionResult> = {}): VoiceRecognitionResult => ({
  transcript: 'test command',
  confidence: 0.85,
  isFinal: true,
  alternatives: [
    { transcript: 'test command', confidence: 0.85 },
    { transcript: 'best command', confidence: 0.75 }
  ],
  timestamp: Date.now(),
  metadata: { provider: 'web-speech-api' },
  ...overrides
});

export const generateMockSpeechResult = (overrides: Partial<SpeechRecognitionResult> = {}): SpeechRecognitionResult => ({
  text: 'test command',
  confidence: 0.85,
  isFinal: true,
  alternatives: [
    { text: 'test command', confidence: 0.85 },
    { text: 'best command', confidence: 0.75 }
  ],
  timestamp: Date.now(),
  metadata: { provider: 'web-speech-api' },
  ...overrides
});

export const generateMockSynthesisResult = (overrides: Partial<SynthesisResult> = {}): SynthesisResult => ({
  success: true,
  text: 'Test response',
  duration: 1500,
  audioData: undefined,
  metadata: {
    voice: 'Test Voice',
    language: 'en-US',
    provider: 'web-speech-api'
  },
  ...overrides
});

// ============================================================================
// Parameter Type Generators
// ============================================================================

export const createStringParameter = (name: string, required = false): VoiceCommandParameter => ({
  name,
  type: 'string',
  required,
  description: `String parameter: ${name}`
});

export const createNumberParameter = (name: string, required = false): VoiceCommandParameter => ({
  name,
  type: 'number',
  required,
  description: `Number parameter: ${name}`
});

export const createBooleanParameter = (name: string, required = false): VoiceCommandParameter => ({
  name,
  type: 'boolean',
  required,
  description: `Boolean parameter: ${name}`
});

export const createEnumParameter = (name: string, values: string[], required = false): VoiceCommandParameter => ({
  name,
  type: 'enum',
  required,
  enumValues: values,
  description: `Enum parameter: ${name}`
});

// ============================================================================
// Web API Mocks
// ============================================================================

export const createMockSpeechRecognition = () => {
  const mockRecognition = {
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    lang: 'en-US',
    onstart: null as any,
    onend: null as any,
    onresult: null as any,
    onerror: null as any,
    onnomatch: null as any,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    // Simulate recognition events
    _triggerStart: function() { this.onstart?.(); },
    _triggerEnd: function() { this.onend?.(); },
    _triggerResult: function(transcript: string, confidence = 0.85, isFinal = true) {
      const mockEvent = {
        resultIndex: 0,
        results: [{
          0: { transcript, confidence },
          isFinal,
          length: 1,
          [Symbol.iterator]: function*() { yield this[0]; }
        }]
      };
      this.onresult?.(mockEvent);
    },
    _triggerError: function(error: string) {
      this.onerror?.({ error });
    },
    _triggerNoMatch: function() {
      this.onnomatch?.();
    }
  };

  return mockRecognition;
};

export const createMockSpeechSynthesis = () => {
  const mockSynthesis = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [
      {
        name: 'Test Voice 1',
        lang: 'en-US',
        default: true,
        localService: true,
        voiceURI: 'test-voice-1'
      },
      {
        name: 'Test Voice 2',
        lang: 'es-ES',
        default: false,
        localService: true,
        voiceURI: 'test-voice-2'
      }
    ]),
    // Mock properties
    speaking: false,
    pending: false,
    paused: false
  };

  return mockSynthesis;
};

export const createMockSpeechSynthesisUtterance = (text: string) => {
  const mockUtterance = {
    text,
    lang: 'en-US',
    voice: null,
    volume: 1,
    rate: 1,
    pitch: 1,
    onstart: null as any,
    onend: null as any,
    onerror: null as any,
    onpause: null as any,
    onresume: null as any,
    onmark: null as any,
    onboundary: null as any,
    // Simulate utterance events
    _triggerStart: function() { this.onstart?.(); },
    _triggerEnd: function() { this.onend?.(); },
    _triggerError: function(error: string) { this.onerror?.({ error }); }
  };

  return mockUtterance;
};

// ============================================================================
// Test Environment Setup
// ============================================================================

export const setupWebSpeechMocks = () => {
  const mockRecognition = createMockSpeechRecognition();
  const mockSynthesis = createMockSpeechSynthesis();

  // Mock constructors
  global.SpeechRecognition = vi.fn(() => mockRecognition);
  global.webkitSpeechRecognition = vi.fn(() => mockRecognition);
  global.SpeechSynthesisUtterance = vi.fn((text) => createMockSpeechSynthesisUtterance(text));

  // Mock global objects
  global.speechSynthesis = mockSynthesis;

  // Mock window object
  Object.defineProperty(window, 'SpeechRecognition', {
    value: global.SpeechRecognition,
    writable: true
  });

  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: global.webkitSpeechRecognition,
    writable: true
  });

  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSynthesis,
    writable: true
  });

  Object.defineProperty(window, 'SpeechSynthesisUtterance', {
    value: global.SpeechSynthesisUtterance,
    writable: true
  });

  return {
    mockRecognition,
    mockSynthesis,
    cleanup: () => {
      delete (global as any).SpeechRecognition;
      delete (global as any).webkitSpeechRecognition;
      delete (global as any).speechSynthesis;
      delete (global as any).SpeechSynthesisUtterance;
    }
  };
};

export const setupNavigatorMocks = () => {
  const originalNavigator = global.navigator;

  global.navigator = {
    ...originalNavigator,
    mediaDevices: {
      getUserMedia: vi.fn().mockResolvedValue({}),
      enumerateDevices: vi.fn().mockResolvedValue([])
    }
  };

  return {
    cleanup: () => {
      global.navigator = originalNavigator;
    }
  };
};

// ============================================================================
// Test Helpers
// ============================================================================

export const waitForMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

export const waitForTimeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createAsyncIterator = <T>(items: T[]) => {
  let index = 0;
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (index < items.length) {
            return { value: items[index++], done: false };
          }
          return { done: true };
        }
      };
    }
  };
};

// ============================================================================
// Test Data Sets
// ============================================================================

export const FUZZY_MATCHING_TEST_CASES = [
  { input: 'open sidebar', expected: 'open sidebar', confidence: 1.0 },
  { input: 'open side bar', expected: 'open sidebar', confidence: 0.9 },
  { input: 'open side', expected: 'open sidebar', confidence: 0.7 },
  { input: 'opne sidebar', expected: 'open sidebar', confidence: 0.85 }, // typo
  { input: 'sidebar open', expected: 'open sidebar', confidence: 0.7 }, // word order
  { input: 'show sidebar', expected: 'open sidebar', confidence: 0.6 }, // synonym
];

export const PARAMETER_EXTRACTION_TEST_CASES = [
  {
    input: 'create page called "Test Page"',
    command: 'create page called',
    expected: { title: 'Test Page' }
  },
  {
    input: 'set volume to 75',
    command: 'set volume to',
    expected: { volume: 75 }
  },
  {
    input: 'enable dark mode',
    command: 'toggle dark mode',
    expected: { enabled: true }
  },
  {
    input: 'choose format pdf',
    command: 'choose format',
    expected: { format: 'pdf' }
  }
];

export const LANGUAGE_TEST_CASES = [
  { lang: 'en-US', input: 'open sidebar', expected: true },
  { lang: 'es-ES', input: 'abrir barra lateral', expected: true },
  { lang: 'fr-FR', input: 'ouvrir la barre latérale', expected: true },
  { lang: 'de-DE', input: 'seitenleiste öffnen', expected: true },
  { lang: 'zh-CN', input: '打开侧边栏', expected: true }
];

// ============================================================================
// Performance Testing
// ============================================================================

export const measurePerformance = async (fn: () => Promise<void> | void, iterations = 100) => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)];

  return { avg, min, max, median, times };
};

export const expectPerformance = (result: ReturnType<typeof measurePerformance>, maxAvg: number) => {
  expect(result.avg).toBeLessThan(maxAvg);
  expect(result.max).toBeLessThan(maxAvg * 2); // Allow some variance
};

// ============================================================================
// Error Testing Helpers
// ============================================================================

export const simulateNetworkError = () => {
  const error = new Error('Network error');
  (error as any).code = 'NETWORK_ERROR';
  return error;
};

export const simulatePermissionError = () => {
  const error = new Error('Permission denied');
  (error as any).code = 'PERMISSION_DENIED';
  return error;
};

export const simulateAudioError = () => {
  const error = new Error('Audio capture failed');
  (error as any).code = 'AUDIO_CAPTURE_FAILED';
  return error;
};

// ============================================================================
// Export All
// ============================================================================

export default {
  generateMockCommand,
  generateMockCommandWithParams,
  generateMockContext,
  generateMockConfig,
  generateMockState,
  generateMockRecognitionResult,
  setupWebSpeechMocks,
  setupNavigatorMocks,
  waitForMicrotasks,
  measurePerformance,
  expectPerformance,
  FUZZY_MATCHING_TEST_CASES,
  PARAMETER_EXTRACTION_TEST_CASES,
  LANGUAGE_TEST_CASES
};