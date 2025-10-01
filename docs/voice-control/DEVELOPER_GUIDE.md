# Voice Control Developer Guide

## Audience
This guide is for engineers integrating the AFFiNE voice control module into product features, customizing command behavior, and ensuring the experience remains resilient across environments.

## Prerequisites
- AFFiNE framework access via `@toeverything/infra` (DI container / service provider).
- Browser context that exposes `SpeechRecognition` (or `webkitSpeechRecognition`) and `speechSynthesis`.
- HTTPS (or `http://localhost`) hosting to unlock microphone APIs.
- TypeScript project using the `@affine/core/modules/voice-control` package.

## 1. Bootstrapping The Module
1. Register the module with AFFiNE’s DI container:
   ```ts
   import type { Framework } from '@toeverything/infra';
   import { configureVoiceControlModule } from '@affine/core/modules/voice-control';

   export function configureModules(framework: Framework) {
     configureVoiceControlModule(framework);
   }
   ```
2. Resolve the orchestrator and initialize it at app startup:
   ```ts
   import { createVoiceConfig, VoiceControlService } from '@affine/core/modules/voice-control';
   import { useService } from '@toeverything/infra';

   const voiceControl = framework.get(VoiceControlService);
   const config = createVoiceConfig({
     recognition: { language: 'en-US', confidenceThreshold: 0.7 },
     debug: process.env.NODE_ENV !== 'production',
   });

   await voiceControl.initialize(config);
   await voiceControl.start();
   ```
3. Guard usage with `isVoiceControlSupported()` (exported from `voice-control/index.ts`) when loading the feature for capability awareness.

## 2. Service Responsibilities
- **VoiceControlService** – orchestrates speech recognition, command execution, feedback, session management, and event dispatch.
- **VoiceCommandRegistry** – normalizes textual input, scores fuzzy matches, stores command metadata, and exposes change listeners.
- **VoiceNavigationService** – tracks workspace, document, view, and focus context so commands understand the active UI state.
- **VoiceFeedbackService** – surfaces speech synthesis and lightweight visual messages; handles interruption semantics.
- **ProviderFactory / WebSpeechProvider** – selects recognition & synthesis backends (Web Speech today, Azure/Google/Amazon scaffolding ready).

## 3. Configuration & Feature Flags
`createVoiceConfig(overrides)` merges defaults, environment variables, and runtime overrides. Important keys:
- `recognition.language`, `confidenceThreshold`, `wakeWord`, `commandTimeout`.
- `feedback.audioEnabled`, `feedback.visualEnabled`, `speechRate`, `speechPitch`, `speechVolume`.
- `enabledCategories` – filter command categories at runtime.
- `debug` – enables verbose logging from `VoiceControlService`.

Environment variables (e.g., `VOICE_WAKE_WORD`, `VOICE_DEBUG`) are respected when present.

## 4. Provider Selection
The provider factory checks environment capabilities and returns the Web Speech implementation by default. To add cloud providers:
1. Implement the relevant interfaces in `types/providers.ts` (`SpeechRecognitionProviderInterface`, `SpeechSynthesisProviderInterface`, `WakeWordProviderInterface`).
2. Register the provider with `VoiceProviderFactory` (see `providers/provider-factory.ts`).
3. Supply selection strategy overrides via `createVoiceConfig({ recognition: { provider: 'azure' } })` (custom logic lives in the factory).

## 5. Command Lifecycle
1. Recognition provider emits transcripts.
2. `VoiceCommandRegistry.findMatchingCommands()` normalizes and scores phrases (threshold 0.45 minimum, global execution threshold defaults to 0.7).
3. `VoiceControlService` validates context, invokes handlers, and emits lifecycle events.
4. `VoiceFeedbackService` relays result feedback (audio + visual) while `VoiceNavigationService` updates state as the UI changes.

Use `voiceControl.on('voice:command:matched', handler)` to inspect scoring and debug edge cases.

## 6. Registering Commands
Either resolve the registry from the DI container (`const registry = framework.get(VoiceCommandRegistry)`) before `start()` or add commands later and call `voiceControl.onCommandsChanged` to refresh dependent UI.
```ts
const registry = framework.get(VoiceCommandRegistry);

registry.register({
  id: 'open-kanban',
  trigger: 'open kanban board',
  aliases: ['show kanban', 'kanban view'],
  description: 'Switch the main view to Kanban.',
  category: 'workspace',
  parameters: [{ name: 'workspaceId', type: 'string', required: false }],
  context: { requiredView: '/workspace' },
  handler: async ({ parameters }, context) => {
    const id = parameters.workspaceId ?? context.workspace?.id;
    await workspaceNavigator.openKanban(id);
    return { success: true, message: 'Kanban view ready.' };
  },
});
```
Use `voiceControl.triggerCommand(id, { parameters })` for programmatic execution (tutorials, onboarding, tests).

## 7. Event System
Subscribe with `voiceControl.on(event, handler)` and dispose via `voiceControl.off(event, handler)`.
Key events:
- `voice:started`, `voice:stopped`
- `voice:listening:start`, `voice:listening:stop`
- `voice:recognition` (raw provider payload)
- `voice:command:matched`, `voice:command:executed`, `voice:command:failed`
- `voice:error` (fatal setup/runtime issues)
- `voice:session:stats` (if analytics enabled)

Event handlers may return promises; errors are logged with context by the service.

## 8. UI Integration
- Consume real-time UI state via `useVoiceControlUIState()` hook; it exposes indicator + status bar view models, recent commands, and navigation context.
- Use connected components (`VoiceIndicatorConnected`, `VoiceCommandPaletteConnected`, `VoiceStatusBarConnected`, `VoiceTutorial`) to minimize wiring.
- Call `connectToUI(voiceControl, navigationService)` from `integration.ts` if you need DOM observers that sync workspace/document metadata.

## 9. Testing & Quality
- Run `yarn test voice-control` or `yarn test` to execute Vitest suites in `packages/frontend/core/src/modules/voice-control/__tests__`.
- UI and visual regressions: see the Playwright scenarios defined in `TASK_CODEX_PLAYWRIGHT_TESTING.md`.
- Stub speech APIs in unit tests by providing mock implementations of `SpeechRecognitionProviderInterface` and `SpeechSynthesisProviderInterface` to the provider factory.
- Verify linting (`yarn lint`) and type safety (`yarn typecheck`) before promoting command updates.
- Accessibility: ensure new components respect `aria-live`, focus management, and keyboard affordances documented in `components/voice-*` readmes.

## 10. Deployment Checklist
- Feature-flag voice control for unsupported browsers with `isVoiceControlSupported()`.
- Request microphone permission on user action to avoid browser blocks.
- Provide fallbacks (e.g., VoiceCommandPalette) when recognition is unavailable.
- Log command execution metrics via `voice:command:*` events for monitoring.
- Document configuration overrides for ops teams (wake word, debug, provider selection).

## Related Documents
- `VOICE_CONTROL_README.md` – high-level overview.
- `VOICE_COMMANDS_REFERENCE.md` – built-in command catalog and matching heuristics.
- `API_REFERENCE.md` – method-level reference for services.
- `INTEGRATION_EXAMPLES.md` – copy-paste ready scenarios.
- `TROUBLESHOOTING.md` – production support checklist.

