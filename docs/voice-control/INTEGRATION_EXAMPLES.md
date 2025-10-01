# Voice Control Integration Examples

Copy the scenarios below into your app or tests to accelerate integration work.

## 1. Bootstrapping With AFFiNE DI
```ts
import type { Framework } from '@toeverything/infra';
import {
  configureVoiceControlModule,
  createVoiceConfig,
  VoiceControlService,
  VoiceNavigationService,
  connectToUI,
} from '@affine/core/modules/voice-control';

export async function initVoiceControl(framework: Framework) {
  configureVoiceControlModule(framework);

  const voiceControl = framework.get(VoiceControlService);
  const navigation = framework.get(VoiceNavigationService);

  const config = createVoiceConfig({
    recognition: {
      language: navigator.language || 'en-US',
      confidenceThreshold: 0.68,
      commandTimeout: 12000,
    },
    feedback: {
      audioEnabled: true,
      visualEnabled: true,
    },
    enabledCategories: ['navigation', 'workspace', 'document', 'system'],
  });

  await voiceControl.initialize(config);
  connectToUI(voiceControl, navigation);
  await voiceControl.start();

  return voiceControl;
}
```

## 2. Rendering Connected Components
```tsx
import { VoiceIndicatorConnected, VoiceStatusBarConnected } from '@affine/core/modules/voice-control';
import { useVoiceControlUIState } from '@affine/core/modules/voice-control';

export function VoiceHUD() {
  const { commands, recentCommands } = useVoiceControlUIState();

  return (
    <aside className="voice-hud">
      <VoiceIndicatorConnected position="bottom-right" />
      <VoiceStatusBarConnected />
      <section>
        <h3>Recent commands</h3>
        <ol>
          {recentCommands.map(entry => (
            <li key={entry.timestamp}>{entry.label} – {entry.success ? 'ok' : 'failed'}</li>
          ))}
        </ol>
      </section>
      <section>
        <h3>Available commands</h3>
        <ul>
          {commands.map(command => (
            <li key={command.id}>{command.trigger}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
```

## 3. Registering Custom Commands
```ts
import { VoiceCommandRegistry } from '@affine/core/modules/voice-control';

export function registerWorkspaceCommands(registry: VoiceCommandRegistry) {
  registry.register({
    id: 'duplicate-page',
    trigger: 'duplicate this page',
    aliases: ['clone page', 'copy page'],
    description: 'Create a duplicate of the current document.',
    category: 'document',
    context: { requiredView: '/workspace', excludedViews: ['/settings'] },
    parameters: [
      { name: 'title', type: 'string', required: false },
      { name: 'includeComments', type: 'boolean', required: false, defaultValue: false },
    ],
    handler: async ({ parameters }, context) => {
      const sourceId = context.document?.id;
      if (!sourceId) {
        return { success: false, message: 'No active document.' };
      }

      const duplicate = await workspaceApi.duplicatePage({
        sourceId,
        title: parameters.title,
        includeComments: parameters.includeComments === true,
      });

      return {
        success: true,
        message: `Duplicated to ${duplicate.title}.`,
        actions: [{ type: 'navigate', target: `/pages/${duplicate.id}` }],
      };
    },
  });
}
```

## 4. Programmatic Execution (Tutorial Step)
```ts
import { VoiceControlService } from '@affine/core/modules/voice-control';

export async function runPracticeStep(voiceControl: VoiceControlService) {
  try {
    await voiceControl.triggerCommand('create-page', {
      originalInput: 'create page called tutorial checklist',
      parameters: { title: 'Tutorial Checklist' },
      confidence: 0.95,
      suppressErrorFeedback: true,
    });
  } catch (error) {
    console.error('Practice command failed', error);
  }
}
```

## 5. Listening For Events (Telemetry)
```ts
import { VoiceControlService } from '@affine/core/modules/voice-control';

export function wireVoiceAnalytics(voiceControl: VoiceControlService) {
  const disposers = [
    voiceControl.on('voice:command:executed', ({ command, result }) => {
      analytics.track('voice_command_executed', {
        commandId: command.id,
        success: result.success,
        message: result.message,
      });
    }),
    voiceControl.on('voice:command:failed', ({ command, error }) => {
      analytics.track('voice_command_failed', {
        commandId: command?.id ?? 'unknown',
        error,
      });
    }),
    voiceControl.on('voice:error', payload => {
      logger.error('[voice-control]', payload.error, payload.context);
    }),
  ];

  return () => disposers.forEach(dispose => dispose?.());
}
```

## 6. Mocking Providers In Tests
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VoiceControlService,
  VoiceProviderFactory,
  createVoiceConfig,
} from '@affine/core/modules/voice-control';

class FakeRecognitionProvider {
  startRecognition = vi.fn(async () => {
    setTimeout(() => {
      this.onResult?.({ text: 'help', confidence: 0.82 });
    }, 10);
  });
  stopRecognition = vi.fn(async () => {});
  cleanup = vi.fn(async () => {});
  onResult?: (result: any) => void;
}

class FakeFactory extends VoiceProviderFactory {
  private fakeRecognition = new FakeRecognitionProvider();
  override getRecognitionProvider() {
    return this.fakeRecognition;
  }
}

describe('voice tutorial practice', () => {
  let voiceControl: VoiceControlService;

  beforeEach(async () => {
    voiceControl = new VoiceControlService();
    // @ts-expect-error override private field for tests
    voiceControl.providerFactory = new FakeFactory();

    await voiceControl.initialize(createVoiceConfig({ debug: true }));
  });

  it('emits matched events for fake provider output', async () => {
    const matched = vi.fn();
    voiceControl.on('voice:command:matched', matched);

    await voiceControl.start();
    await new Promise(resolve => setTimeout(resolve, 25));

    expect(matched).toHaveBeenCalled();
  });
});
```

## 7. Updating Navigation Context Manually
```ts
import { VoiceNavigationService } from '@affine/core/modules/voice-control';

export function syncNavigation(navigation: VoiceNavigationService, router: Router) {
  router.on('routeChange', route => {
    navigation.updateContext({
      currentView: route.path,
      navigationHistory: [...route.history].slice(-20),
    });
  });

  router.on('documentLoaded', doc => {
    navigation.setDocument({ id: doc.id, title: doc.title, type: doc.type });
  });
}
```

These snippets cover the most common integration paths. Combine them with the developer guide and API reference for deeper details.
