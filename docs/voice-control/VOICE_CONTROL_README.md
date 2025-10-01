# AFFiNE Voice Control

## Overview
The voice control module (`packages/frontend/core/src/modules/voice-control`) brings speech-driven navigation and command execution to AFFiNE. It bundles speech recognition, fuzzy command matching, contextual awareness, and UI feedback into a cohesive 2.0.0-alpha release. The module integrates with the AFFiNE dependency injection framework and exposes ready-to-use React components so teams can light up voice features without rebuilding infrastructure.

## Core Highlights
- Built-in command registry with fuzzy matching, context awareness, and a configurable confidence threshold (0.45 match floor, 0.7 execution default).
- Service layer orchestrates recognition, navigation context, and feedback while emitting rich lifecycle events.
- Provider factory ships with a Web Speech implementation and scaffolding for Azure, Google, Amazon, and custom providers.
- UI kit includes indicator, status bar, command palette, and interactive tutorial components backed by a shared `useVoiceControlUIState` hook.
- Accessibility-first design: visual announcements, keyboard support, WCAG-aligned defaults, and optional speech feedback.

## Requirements
- Browser capabilities: `SpeechRecognition`/`webkitSpeechRecognition`, `speechSynthesis`, and `navigator.mediaDevices.getUserMedia`.
- HTTPS (or localhost) context to unlock microphone APIs.
- AFFiNE framework runtime via `@toeverything/infra` for service registration.
- Modern Chromium, Edge, or Safari builds; Firefox enables recognition behind configuration flags.

## Installation And Setup
1. **Register services with the DI container.**
   ```ts
   import { configureVoiceControlModule } from '@affine/core/modules/voice-control';

   export function configureAppModules(framework: Framework) {
     configureVoiceControlModule(framework);
   }
   ```
2. **Create and initialize the orchestrator.**
   ```ts
   const voiceControl = framework.get(VoiceControlService);
   const config = createVoiceConfig({
     recognition: {
       language: 'en-US',
       wakeWord: undefined,
     },
     debug: process.env.NODE_ENV !== 'production',
   });

   await voiceControl.initialize(config);
   await voiceControl.start();
   ```
3. **Wire UI feedback (optional but recommended).** Drop `VoiceIndicatorConnected`, `VoiceStatusBarConnected`, or `VoiceCommandPaletteConnected` anywhere in the React tree inside a provider-aware scope.

Environment variables can override pieces of the default configuration. Define `VOICE_WAKE_WORD`, `VOICE_DEBUG`, and related flags before bootstrapping to change recognition behaviour without code changes.

## Quick Start
```ts
import { useEffect } from 'react';
import { useService } from '@toeverything/infra';
import {
  VoiceControlService,
  createVoiceConfig,
  VoiceIndicatorConnected,
} from '@affine/core/modules/voice-control';

export function VoiceControlBoot() {
  const voiceControl = useService(VoiceControlService);

  useEffect(() => {
    const config = createVoiceConfig({
      recognition: {
        language: 'en-US',
        confidenceThreshold: 0.75,
        enabledCategories: ['navigation', 'system'],
      },
      feedback: {
        audioEnabled: false,
      },
    });

    voiceControl.initialize(config).then(() => voiceControl.start());

    const stop = () => void voiceControl.stop();
    window.addEventListener('beforeunload', stop);
    return () => {
      window.removeEventListener('beforeunload', stop);
      void voiceControl.stop();
    };
  }, [voiceControl]);

  return <VoiceIndicatorConnected position="bottom-right" />;
}
```

## UI Components
- **VoiceIndicator**: Displays listening/processing/error states, transcript preview, and confidence score with optional expansion controls.
- **VoiceStatusBar**: Surfaces microphone level, active language, and the most recent command result. Connected variant reflects live state via `useVoiceControlUIState`.
- **VoiceCommandPalette**: Browse and filter commands, inspect aliases and parameters, and execute actions without speaking, ideal for discovery and debugging.
- **VoiceTutorial**: Six-step onboarding flow that can auto-trigger commands, persist progress, and expose restart/skip hooks for custom onboarding.

## Runtime Events
`VoiceControlService` emits granular events you can subscribe to with `voiceControl.on(event, handler)`:
- `voice:started`, `voice:stopped`
- `voice:listening:start`, `voice:listening:stop`
- `voice:recognition` (raw recognition result payload)
- `voice:command:matched` (command + extracted parameters)
- `voice:command:executed` (successful execution result)
- `voice:command:failed` (failure with error details)
- `voice:error` (fatal setup or runtime issues)

Use `voiceControl.off(event, handler)` or the disposer returned by `voiceControl.on` to clean up listeners.

## Configuration Reference
```ts
const defaults = {
  recognition: {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    confidenceThreshold: 0.7,
    wakeWord: 'hey affine',
    commandTimeout: 10000,
  },
  feedback: {
    audioEnabled: true,
    visualEnabled: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 0.8,
  },
  enabledCategories: ['navigation', 'document', 'ai', 'workspace', 'system'],
  debug: false,
};
```
Override values via `createVoiceConfig(overrides)` or environment variables when the app boots. Commands below the configured confidence threshold are ignored, but you can inspect them with the command palette or custom logging.

## Testing And Quality
- Unit and integration tests live under `packages/frontend/core/src/modules/voice-control/__tests__` and run as part of `yarn test`.
- Execute `yarn lint` and `yarn typecheck` to ensure ESLint and TypeScript remain clean before releasing voice features.
- The UI surfaces support Playwright-driven visual regression (see `TASK_CODEX_PLAYWRIGHT_TESTING.md` for scripted scenarios).

## Related Documents
- [Architecture](ARCHITECTURE.md)
- [Command Reference](VOICE_COMMANDS_REFERENCE.md)
- [Troubleshooting](TROUBLESHOOTING.md)
