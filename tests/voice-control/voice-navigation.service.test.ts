import { beforeEach, describe, expect, it } from 'vitest';

import { VoiceNavigationService } from '../../packages/frontend/core/src/modules/voice-control/services/voice-navigation.service';

describe('VoiceNavigationService', () => {
  let service: VoiceNavigationService;

  beforeEach(() => {
    service = new VoiceNavigationService();
  });

  it('records navigation history and updates current view', () => {
    service.recordNavigation('dashboard');
    service.recordNavigation('editor');

    const context = service.getCurrentContext();
    expect(context.currentView).toBe('editor');
    expect(context.navigationHistory).toEqual(['dashboard', 'editor']);
  });

  it('updates workspace and document data', () => {
    service.setWorkspace({ id: 'ws-1', name: 'Workspace One' });
    service.setDocument({ id: 'doc-1', title: 'Doc', type: 'page' });

    const context = service.getCurrentContext();
    expect(context.workspace).toEqual({ id: 'ws-1', name: 'Workspace One' });
    expect(context.document).toEqual({ id: 'doc-1', title: 'Doc', type: 'page' });
  });

  it('invokes listeners on context change and supports unsubscribe', () => {
    const snapshots: string[] = [];
    const unsubscribe = service.onContextChange(ctx => snapshots.push(ctx.currentView));

    service.recordNavigation('editor');
    unsubscribe();
    service.recordNavigation('home');

    expect(snapshots).toEqual(['unknown', 'editor']);
  });
});
