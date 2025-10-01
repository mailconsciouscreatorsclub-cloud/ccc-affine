# Voice Control Architecture

## Module Layout
```
packages/frontend/core/src/modules/voice-control/
|-- components/
|   |-- voice-indicator/
|   |-- voice-status-bar/
|   |-- voice-command-palette/
|   `-- voice-tutorial/
|-- providers/
|-- services/
|-- types/
|-- index.ts
`-- integration.ts
```
The entry point (`index.ts`) re-exports services, providers, types, and React components. `integration.ts` wires the module into the AFFiNE dependency injection framework (`@toeverything/infra`).

## Service Layer
- **VoiceControlService** (orchestrator)
  - Initializes audio pipeline (audio processor placeholder), recognition, synthesis, wake word (continuous fallback), and feedback services.
  - Registers built-in commands, manages sessions, enforces confidence thresholds, and emits lifecycle events (`voice:*`).
  - Exposes APIs: `initialize`, `start`, `stop`, `triggerCommand`, `getState`, `getConfig`, `getCommands`, `on`, `off`.
- **VoiceCommandRegistry** (command catalog)
  - Stores command metadata keyed by ID, grouped by category, and exposes change listeners.
  - Normalizes phrases, applies fuzzy scoring, and combines trigger, parameter, and context signals into a confidence score.
  - Allows external registration/unregistration and context injection via `setContext`.
- **VoiceNavigationService** (context tracker)
  - Observes browser focus, history, and DOM metadata to build `VoiceNavigationContext` (workspace, document, view, active element, sidebar state).
  - Maintains a capped navigation history and notifies subscribers when context changes.
- **VoiceFeedbackService** (user feedback)
  - Bridges visual feedback (lightweight DOM container) and speech synthesis with configurable rate, pitch, volume, and voice selection.
  - Supports interruptible messages and error fallbacks; exposes `speak`, `stopSpeaking`, and config updates.

## Provider Stack
- **provider-factory.ts** builds `VoiceProviderFactory`, exposing `createRecognitionProvider`, `createSynthesisProvider`, and health monitoring hooks. The factory chooses the best provider (Web Speech today, placeholders for Azure, Google, Amazon, ElevenLabs).
- **web-speech.provider.ts** implements recognition/synthesis adapters around native Web Speech APIs, adds retry logic, and surfaces provider diagnostics.
- Future providers plug into the same interfaces (`SpeechRecognitionProviderInterface`, `SpeechSynthesisProviderInterface`, `WakeWordProviderInterface`).

## Dependency Graph
```
VoiceControlService
|-- VoiceCommandRegistry
|-- VoiceNavigationService
|-- VoiceFeedbackService
|-- VoiceProviderFactory
|   `-- WebSpeechProvider (default)
`-- Optional: wake word + audio processor
```
All services extend `Service` from `@toeverything/infra`, enabling DI lifecycle management and dependency resolution.

## Event Flow
1. `VoiceControlService.initialize()` resolves providers and subscribes to navigation context changes.
2. When recognition emits a transcript, `handleRecognitionResult` calls `commandRegistry.findMatchingCommands`.
3. The best match above the configured confidence threshold executes via `executeCommand`, which:
   - Emits `voice:command:matched` before execution.
   - Runs the handler, updates session state, and triggers `voice:command:executed` or `voice:command:failed`.
   - Hands results to `VoiceFeedbackService` for audio/visual messaging.
4. Listeners update UI through `useVoiceControlUIState`, and `VoiceNavigationService` refreshes context when navigation occurs.

## UI Integration
`components/hooks/use-voice-ui-state.ts` consumes `VoiceControlService` and `VoiceNavigationService` to derive:
- Indicator phase (`idle`, `listening`, `processing`, `error`), transcript snippets, errors.
- Status bar data (microphone level placeholder, language, last command success).
- Command catalog snapshots and recent history (up to six entries).

Connected components (`VoiceIndicatorConnected`, `VoiceStatusBarConnected`, `VoiceCommandPaletteConnected`, `VoiceTutorial`) rely on this hook, ensuring all UI elements stay synchronized with the service layer.

## Configuration & DI
- `createVoiceConfig` merges defaults, environment overrides, and runtime overrides before boot.
- `configureVoiceControlModule(framework)` registers the services in a deterministic order so the orchestrator receives ready-to-use dependencies.
- `integration.ts` also exposes feature-flag helpers (`isVoiceControlSupported`, `getVoiceEnvironmentCapabilities`) for guardrails.

## State & Context
`VoiceNavigationContext` includes workspace metadata, document information, current view, active element identifier, navigation history (max 20 entries), and sidebar state. The command registry stores it to inform context-aware command execution (for example, hiding workspace commands when no workspace is active).

`VoiceControlState` tracks activation flags, listening/processing status, last recognized text, current session, and error messages. The UI hook mirrors this state for rendering.

## Testing & Observability
- Vitest suites cover the command registry (`__tests__/unit/voice-command-registry.spec.ts`) and service behaviours. They run via the monorepo `yarn test` command.
- Playwright scenarios (see `TASK_CODEX_PLAYWRIGHT_TESTING.md`) exercise the UI components for visual regressions.
- Rich event stream (`voice:*`) plus the status bar and tutorial telemetry make it straightforward to log, surface, or analytics-track voice usage.

## Extensibility Checklist
1. Add a new provider? Implement the provider interface and register it through `VoiceProviderFactory`.
2. Extend commands? Use `voiceControl.commandRegistry.register` and supply parameter/context metadata.
3. Customize onboarding? Override `VoiceTutorial` steps with custom `commandId` hooks and persistence keys.
4. Export analytics? Subscribe to command events and navigation updates, then forward to your telemetry pipeline.
