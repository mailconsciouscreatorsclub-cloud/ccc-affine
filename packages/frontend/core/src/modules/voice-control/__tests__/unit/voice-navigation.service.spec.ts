/**
 * VoiceNavigationService Test Suite
 *
 * Tests for context tracking, workspace/document management,
 * navigation history, and browser safety.
 */

import { Framework } from '@toeverything/infra';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { configureVoiceControlModule } from '../../index';
import { VoiceNavigationService } from '../../services/voice-navigation.service';
import type { VoiceNavigationContext } from '../../types';
import { generateMockContext, waitForMicrotasks } from '../test-utils';

describe('VoiceNavigationService', () => {
  let framework: Framework;
  let service: VoiceNavigationService;
  let mockContext: VoiceNavigationContext;

  beforeEach(async () => {
    framework = new Framework();
    configureVoiceControlModule(framework);
    const provider = framework.provider();
    service = provider.get(VoiceNavigationService);
    await service.initialize();
    mockContext = generateMockContext();
  });

  afterEach(async () => {
    service.dispose()
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const testFramework = new Framework();
      configureVoiceControlModule(testFramework);
      const testProvider = testFramework.provider();
      const newService = testProvider.get(VoiceNavigationService);
      await expect(newService.initialize()).resolves.not.toThrow();
      newService.dispose()
    });

    it('should not throw when initialized multiple times', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should provide default context when no specific context is set', () => {
      const context = service.getCurrentContext();

      expect(context).toBeDefined();
      expect(context.currentView).toBeDefined();
      expect(context.navigationHistory).toBeDefined();
      expect(Array.isArray(context.navigationHistory)).toBe(true);
    });

    it('should handle SSR environment safely', async () => {
      // Temporarily remove window to simulate SSR
      const originalWindow = global.window;
      delete (global as any).window;

      const testFramework = new Framework();
      configureVoiceControlModule(testFramework);
      const testProvider = testFramework.provider();
      const ssrService = testProvider.get(VoiceNavigationService);
      await expect(ssrService.initialize()).resolves.not.toThrow();

      const context = ssrService.getCurrentContext();
      expect(context).toBeDefined();
      expect(context.currentView).toBe('/'); // Default fallback

      // Restore window
      global.window = originalWindow;
      ssrService.dispose()
    });
  });

  // ============================================================================
  // Context Management Tests
  // ============================================================================

  describe('context management', () => {
    it('should update context successfully', () => {
      const newContext = generateMockContext({
        currentView: '/new/view',
        workspace: { id: 'new-ws', name: 'New Workspace' }
      });

      service.updateContext(newContext);

      const retrievedContext = service.getCurrentContext();
      expect(retrievedContext.currentView).toBe('/new/view');
      expect(retrievedContext.workspace?.id).toBe('new-ws');
    });

    it('should merge partial context updates', () => {
      service.updateContext(mockContext);

      const partialUpdate = {
        currentView: '/updated/view'
      };

      service.updateContext(partialUpdate);

      const context = service.getCurrentContext();
      expect(context.currentView).toBe('/updated/view');
      expect(context.workspace?.id).toBe(mockContext.workspace?.id); // Should retain original workspace
    });

    it('should track context changes over time', () => {
      const changes: VoiceNavigationContext[] = [];
      const unsubscribe = service.onContextChange((context) => {
        changes.push({ ...context });
      });

      service.updateContext({ currentView: '/view1' });
      service.updateContext({ currentView: '/view2' });
      service.updateContext({ currentView: '/view3' });

      expect(changes).toHaveLength(3);
      expect(changes[0].currentView).toBe('/view1');
      expect(changes[1].currentView).toBe('/view2');
      expect(changes[2].currentView).toBe('/view3');

      unsubscribe();
    });

    it('should unsubscribe context change listeners properly', () => {
      const listener = vi.fn();
      const unsubscribe = service.onContextChange(listener);

      service.updateContext({ currentView: '/test' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      service.updateContext({ currentView: '/test2' });
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should handle multiple simultaneous listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      service.onContextChange(listener1);
      service.onContextChange(listener2);
      service.onContextChange(listener3);

      service.updateContext({ currentView: '/broadcast' });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // Workspace Management Tests
  // ============================================================================

  describe('workspace management', () => {
    it('should track workspace changes', () => {
      const workspace1 = { id: 'ws-1', name: 'Workspace 1' };
      const workspace2 = { id: 'ws-2', name: 'Workspace 2' };

      service.updateContext({ workspace: workspace1 });
      expect(service.getCurrentContext().workspace).toEqual(workspace1);

      service.updateContext({ workspace: workspace2 });
      expect(service.getCurrentContext().workspace).toEqual(workspace2);
    });

    it('should handle workspace switching in navigation history', () => {
      const ws1 = { id: 'ws-1', name: 'WS 1' };
      const ws2 = { id: 'ws-2', name: 'WS 2' };

      service.updateContext({
        workspace: ws1,
        currentView: '/workspace/ws-1'
      });

      service.updateContext({
        workspace: ws2,
        currentView: '/workspace/ws-2'
      });

      const context = service.getCurrentContext();
      expect(context.navigationHistory).toHaveLength(2);
      expect(context.navigationHistory[1].path).toBe('/workspace/ws-2');
    });

    it('should provide workspace-specific context', () => {
      const workspace = {
        id: 'test-workspace',
        name: 'Test Workspace',
        avatar: '/avatar.png'
      };

      service.updateContext({ workspace });

      const context = service.getCurrentContext();
      expect(context.workspace).toEqual(workspace);
    });

    it('should handle workspace removal', () => {
      service.updateContext({ workspace: { id: 'ws-1', name: 'WS 1' } });
      expect(service.getCurrentContext().workspace).toBeDefined();

      service.updateContext({ workspace: undefined });
      expect(service.getCurrentContext().workspace).toBeUndefined();
    });
  });

  // ============================================================================
  // Document Management Tests
  // ============================================================================

  describe('document management', () => {
    it('should track document context', () => {
      const document = {
        id: 'doc-123',
        title: 'Test Document',
        type: 'page' as const
      };

      service.updateContext({ document });

      const context = service.getCurrentContext();
      expect(context.document).toEqual(document);
    });

    it('should handle document type changes', () => {
      const pageDoc = { id: 'doc-1', title: 'Page Doc', type: 'page' as const };
      const edgelessDoc = { id: 'doc-2', title: 'Edgeless Doc', type: 'edgeless' as const };

      service.updateContext({ document: pageDoc });
      expect(service.getCurrentContext().document?.type).toBe('page');

      service.updateContext({ document: edgelessDoc });
      expect(service.getCurrentContext().document?.type).toBe('edgeless');
    });

    it('should track document navigation history', () => {
      const doc1 = { id: 'doc-1', title: 'Doc 1', type: 'page' as const };
      const doc2 = { id: 'doc-2', title: 'Doc 2', type: 'page' as const };

      service.updateContext({
        document: doc1,
        currentView: '/workspace/doc-1'
      });

      service.updateContext({
        document: doc2,
        currentView: '/workspace/doc-2'
      });

      const context = service.getCurrentContext();
      expect(context.navigationHistory).toHaveLength(2);

      const history = context.navigationHistory;
      expect(history[0].path).toBe('/workspace/doc-1');
      expect(history[1].path).toBe('/workspace/doc-2');
    });

    it('should handle document metadata', () => {
      const document = {
        id: 'doc-with-meta',
        title: 'Document with Metadata',
        type: 'page' as const,
        tags: ['important', 'project'],
        lastModified: new Date('2023-01-01'),
        wordCount: 1500
      };

      service.updateContext({ document });

      const context = service.getCurrentContext();
      expect(context.document).toEqual(document);
    });
  });

  // ============================================================================
  // Navigation History Tests
  // ============================================================================

  describe('navigation history', () => {
    it('should build navigation history automatically', () => {
      service.updateContext({ currentView: '/view1' });
      service.updateContext({ currentView: '/view2' });
      service.updateContext({ currentView: '/view3' });

      const context = service.getCurrentContext();
      expect(context.navigationHistory).toHaveLength(3);

      const paths = context.navigationHistory.map(h => h.path);
      expect(paths).toEqual(['/view1', '/view2', '/view3']);
    });

    it('should include timestamps in navigation history', () => {
      const startTime = Date.now();

      service.updateContext({ currentView: '/timed-view' });

      const context = service.getCurrentContext();
      const lastEntry = context.navigationHistory[context.navigationHistory.length - 1];

      expect(lastEntry.timestamp).toBeGreaterThanOrEqual(startTime);
      expect(lastEntry.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should limit navigation history size', () => {
      // Add many navigation entries
      for (let i = 0; i < 150; i++) {
        service.updateContext({ currentView: `/view-${i}` });
      }

      const context = service.getCurrentContext();

      // Should be limited to reasonable size (e.g., 100 entries)
      expect(context.navigationHistory.length).toBeLessThanOrEqual(100);

      // Most recent entries should be preserved
      const lastEntry = context.navigationHistory[context.navigationHistory.length - 1];
      expect(lastEntry.path).toBe('/view-149');
    });

    it('should handle duplicate consecutive paths', () => {
      service.updateContext({ currentView: '/same-view' });
      service.updateContext({ currentView: '/same-view' });
      service.updateContext({ currentView: '/same-view' });

      const context = service.getCurrentContext();

      // Should deduplicate consecutive identical paths
      const samePaths = context.navigationHistory.filter(h => h.path === '/same-view');
      expect(samePaths.length).toBeLessThanOrEqual(2); // At most initial and final
    });

    it('should provide navigation history utilities', () => {
      service.updateContext({ currentView: '/view1' });
      service.updateContext({ currentView: '/view2' });
      service.updateContext({ currentView: '/view3' });

      const context = service.getCurrentContext();

      // Should provide easy access to current and previous views
      expect(context.currentView).toBe('/view3');

      if (context.navigationHistory.length >= 2) {
        const previousView = context.navigationHistory[context.navigationHistory.length - 2];
        expect(previousView.path).toBe('/view2');
      }
    });
  });

  // ============================================================================
  // Sidebar State Tests
  // ============================================================================

  describe('sidebar state tracking', () => {
    it('should track sidebar open/close state', () => {
      service.updateContext({ sidebarOpen: true });
      expect(service.getCurrentContext().sidebarOpen).toBe(true);

      service.updateContext({ sidebarOpen: false });
      expect(service.getCurrentContext().sidebarOpen).toBe(false);
    });

    it('should handle sidebar state in context changes', () => {
      const changes: boolean[] = [];
      service.onContextChange((context) => {
        if (context.sidebarOpen !== undefined) {
          changes.push(context.sidebarOpen);
        }
      });

      service.updateContext({ sidebarOpen: true });
      service.updateContext({ sidebarOpen: false });
      service.updateContext({ sidebarOpen: true });

      expect(changes).toEqual([true, false, true]);
    });

    it('should handle undefined sidebar state gracefully', () => {
      service.updateContext({ sidebarOpen: undefined });

      const context = service.getCurrentContext();
      expect(context.sidebarOpen).toBeUndefined();
    });
  });

  // ============================================================================
  // User Context Tests
  // ============================================================================

  describe('user context tracking', () => {
    it('should track user information', () => {
      const user = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        avatar: '/user-avatar.png'
      };

      service.updateContext({ user });

      const context = service.getCurrentContext();
      expect(context.user).toEqual(user);
    });

    it('should handle user context changes', () => {
      const user1 = { id: 'user-1', name: 'User 1', email: 'user1@test.com' };
      const user2 = { id: 'user-2', name: 'User 2', email: 'user2@test.com' };

      service.updateContext({ user: user1 });
      expect(service.getCurrentContext().user).toEqual(user1);

      service.updateContext({ user: user2 });
      expect(service.getCurrentContext().user).toEqual(user2);
    });

    it('should handle user logout (undefined user)', () => {
      const user = { id: 'user-1', name: 'User 1', email: 'user1@test.com' };

      service.updateContext({ user });
      expect(service.getCurrentContext().user).toEqual(user);

      service.updateContext({ user: undefined });
      expect(service.getCurrentContext().user).toBeUndefined();
    });
  });

  // ============================================================================
  // Browser Safety Tests
  // ============================================================================

  describe('browser safety', () => {
    it('should handle missing window object', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const testFramework = new Framework();
      configureVoiceControlModule(testFramework);
      const testProvider = testFramework.provider();
      const safeService = testProvider.get(VoiceNavigationService);
      await expect(safeService.initialize()).resolves.not.toThrow();

      const context = safeService.getCurrentContext();
      expect(context).toBeDefined();
      expect(context.currentView).toBeDefined();

      global.window = originalWindow;
      safeService.dispose()
    });

    it('should handle missing location object', () => {
      const originalLocation = window.location;
      delete (window as any).location;

      const context = service.getCurrentContext();
      expect(context).toBeDefined();

      window.location = originalLocation;
    });

    it('should handle missing history object', () => {
      const originalHistory = window.history;
      delete (window as any).history;

      service.updateContext({ currentView: '/test' });
      const context = service.getCurrentContext();
      expect(context.currentView).toBe('/test');

      window.history = originalHistory;
    });

    it('should work in iframe environments', async () => {
      // Simulate iframe by modifying window.parent
      const originalParent = window.parent;
      (window as any).parent = {}; // Different parent

      const testFramework = new Framework();
      configureVoiceControlModule(testFramework);
      const testProvider = testFramework.provider();
      const iframeService = testProvider.get(VoiceNavigationService);
      await expect(iframeService.initialize()).resolves.not.toThrow();

      const context = iframeService.getCurrentContext();
      expect(context).toBeDefined();

      window.parent = originalParent;
      iframeService.dispose()
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('performance', () => {
    it('should handle rapid context updates efficiently', async () => {
      const startTime = performance.now();

      // Rapidly update context 1000 times
      for (let i = 0; i < 1000; i++) {
        service.updateContext({
          currentView: `/rapid-view-${i}`,
          navigationHistory: [{ path: `/rapid-view-${i}`, timestamp: Date.now() }]
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 100ms)
      expect(duration).toBeLessThan(100);

      const context = service.getCurrentContext();
      expect(context.currentView).toBe('/rapid-view-999');
    });

    it('should handle many simultaneous listeners efficiently', () => {
      const listeners: Array<() => void> = [];

      // Add 100 listeners
      for (let i = 0; i < 100; i++) {
        const listener = vi.fn();
        listeners.push(listener);
        service.onContextChange(listener);
      }

      const startTime = performance.now();
      service.updateContext({ currentView: '/performance-test' });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50); // Should notify all listeners quickly

      // All listeners should have been called
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle large navigation history efficiently', () => {
      // Build large navigation history
      const largeHistory = Array.from({ length: 1000 }, (_, i) => ({
        path: `/large-history-${i}`,
        timestamp: Date.now() - (1000 - i) * 1000
      }));

      const startTime = performance.now();
      service.updateContext({ navigationHistory: largeHistory });
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10);

      const context = service.getCurrentContext();
      expect(Array.isArray(context.navigationHistory)).toBe(true);
    });
  });

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('edge cases', () => {
    it('should handle null context updates', () => {
      expect(() => {
        service.updateContext(null as any);
      }).not.toThrow();
    });

    it('should handle undefined context updates', () => {
      expect(() => {
        service.updateContext(undefined as any);
      }).not.toThrow();
    });

    it('should handle circular reference in context', () => {
      const circularContext: any = { currentView: '/circular' };
      circularContext.self = circularContext;

      expect(() => {
        service.updateContext(circularContext);
      }).not.toThrow();
    });

    it('should handle very long path names', () => {
      const longPath = '/very/long/path/' + 'segment/'.repeat(100) + 'end';

      service.updateContext({ currentView: longPath });

      const context = service.getCurrentContext();
      expect(context.currentView).toBe(longPath);
    });

    it('should handle special characters in paths', () => {
      const specialPath = '/path/with/特殊字符/émojis/🎉/and/spaces and symbols!@#$%^&*()';

      service.updateContext({ currentView: specialPath });

      const context = service.getCurrentContext();
      expect(context.currentView).toBe(specialPath);
    });

    it('should handle concurrent context updates', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        Promise.resolve().then(() => {
          service.updateContext({ currentView: `/concurrent-${i}` });
        })
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();

      const context = service.getCurrentContext();
      expect(context.currentView).toMatch(/^\/concurrent-\d+$/);
    });
  });

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  describe('cleanup and disposal', () => {
    it('should dispose cleanly', async () => {
      const listener = vi.fn();
      service.onContextChange(listener);

      expect(() => service.dispose()).not.toThrow();

      // Should not call listeners after disposal
      service.updateContext({ currentView: '/after-dispose' });
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple disposal calls', async () => {
      expect(() => service.dispose()).not.toThrow();
      expect(() => service.dispose()).not.toThrow();
      expect(() => service.dispose()).not.toThrow();
    });

    it('should clean up all event listeners on disposal', async () => {
      const listeners = Array.from({ length: 10 }, () => vi.fn());
      listeners.forEach(listener => service.onContextChange(listener));

      service.dispose()

      // Verify no memory leaks by checking internal state would be ideal,
      // but we can at least verify that listeners aren't called
      service.updateContext({ currentView: '/test' });
      listeners.forEach(listener => {
        expect(listener).not.toHaveBeenCalled();
      });
    });
  });
});
