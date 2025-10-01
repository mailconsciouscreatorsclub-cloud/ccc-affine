/**
 * Vitest Setup File
 *
 * Configures global test environment, mocks, and utilities
 */

import { afterAll, afterEach,beforeAll, beforeEach, vi } from 'vitest';

import { setupNavigatorMocks,setupWebSpeechMocks } from './test-utils';

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

// Mock performance API with configurable property
Object.defineProperty(global, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => [])
  },
  writable: true,
  configurable: true
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
  writable: true,
  configurable: true
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
  writable: true,
  configurable: true
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
  writable: true,
  configurable: true
});

Object.defineProperty(window, 'webkitAudioContext', {
  value: MockAudioContext,
  writable: true,
  configurable: true
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

// ============================================================================
// AFFiNE DI Framework Provider Context for Testing
// ============================================================================

import { Framework } from '@toeverything/infra';

/**
 * Creates a test provider context for AFFiNE DI Framework
 * Required for services that extend the Service base class from @toeverything/infra
 */
export function createTestProvider() {
  const framework = new Framework();
  const provider = framework.provider();
  return provider;
}

/**
 * Helper to create a service within a provider context
 * This ensures services that require DI context can be instantiated in tests
 */
export function createTestService<T>(ServiceClass: new (...args: any[]) => T, ...args: any[]): T {
  const provider = createTestProvider();

  // If the service needs to be registered with specific dependencies, do that here
  // For now, we'll try to get it directly from the provider
  try {
    return provider.get(ServiceClass);
  } catch (error) {
    // If provider.get() fails, try direct instantiation with provider context
    // This handles cases where the service isn't pre-registered
    return new ServiceClass(...args);
  }
}

// Export setup for manual use if needed
export { navigatorMocks,webSpeechMocks };