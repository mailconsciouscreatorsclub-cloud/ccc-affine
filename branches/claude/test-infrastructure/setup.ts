/**
 * Vitest Setup File
 *
 * Configures global test environment, mocks, and utilities
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { setupWebSpeechMocks, setupNavigatorMocks } from './test-utils';

// ============================================================================
// Global Mocks Setup
// ============================================================================

// Mock Web Speech APIs globally
const webSpeechMocks = setupWebSpeechMocks();
const navigatorMocks = setupNavigatorMocks();

// Mock console methods in tests (reduce noise)
global.console = {
  ...console,
  debug: vi.fn(),
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => [])
  }
});

// Mock window location and history
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    reload: vi.fn()
  },
  writable: true
});

Object.defineProperty(window, 'history', {
  value: {
    length: 1,
    state: null,
    back: vi.fn(),
    forward: vi.fn(),
    go: vi.fn(),
    pushState: vi.fn(),
    replaceState: vi.fn()
  },
  writable: true
});

// Mock Audio Context
class MockAudioContext {
  state = 'running';
  sampleRate = 44100;
  currentTime = 0;
  destination = {};
  listener = {};

  createMediaStreamSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn()
  }));

  createAnalyser = vi.fn(() => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn()
  }));

  createGain = vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
    disconnect: vi.fn()
  }));

  close = vi.fn();
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
}

Object.defineProperty(window, 'AudioContext', {
  value: MockAudioContext,
  writable: true
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: MockAudioContext,
  writable: true
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  root = null;
  rootMargin = '';
  thresholds = [];

  constructor(public callback: any, public options: any) {}

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// ============================================================================
// Global Test Lifecycle
// ============================================================================

beforeAll(() => {
  // Set up fake timers globally
  vi.useFakeTimers();
});

afterAll(() => {
  // Clean up mocks
  webSpeechMocks.cleanup();
  navigatorMocks.cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  vi.clearAllTimers();

  // Reset DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  // Reset local/session storage
  window.localStorage.clear();
  window.sessionStorage.clear();
});

afterEach(() => {
  // Clean up any side effects after each test
  vi.runOnlyPendingTimers();
  vi.clearAllTimers();
});

// ============================================================================
// Global Test Utilities
// ============================================================================

// Make test utilities available globally
declare global {
  interface Window {
    __TEST_UTILS__: typeof import('./test-utils');
  }
}

// Export setup for manual use if needed
export { webSpeechMocks, navigatorMocks };