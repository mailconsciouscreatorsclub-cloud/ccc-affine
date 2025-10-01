import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test-utils.ts',
        'setup.ts',
        'vitest.config.ts',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/types/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../packages/frontend/core/src'),
      '@voice-control': resolve(__dirname, '../../packages/frontend/core/src/modules/voice-control'),
      '@test-utils': resolve(__dirname, './test-utils')
    }
  },
  define: {
    // Define global constants for testing
    __TEST__: true,
    __DEV__: true
  }
});