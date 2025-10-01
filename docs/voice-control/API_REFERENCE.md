# Voice Control API Reference

This reference lists the primary classes, hooks, and types exported by `@affine/core/modules/voice-control`.

## VoiceControlService
Resolved from the DI container. Coordinates recognition, command execution, feedback, sessions, and events.

| Method | Signature | Description |
| --- | --- | --- |
| `initialize` | `initialize(config?: Partial<VoiceControlConfig>): Promise<void>` | Configures providers, sets up services, registers built-in commands, emits `voice:started` on success. Call once before `start()`. |
| `start` | `start(): Promise<void>` | Opens microphone, starts recognition or wake word detection, creates a session, sets `isActive`. |
| `stop` | `stop(): Promise<void>` | Stops recognition, halts wake word detection, ends the session, emits `voice:stopped`. |
| `getState` | `getState(): VoiceControlState` | Returns a snapshot of activity flags, session data, last transcript, and error state. |
| `getConfig` | `getConfig(): VoiceControlConfig` | Returns the merged configuration currently in use. |
| `getCommands` | `getCommands(): VoiceCommand[]` | Returns all registered commands (including built-ins and custom registrations). |
| `triggerCommand` | `triggerCommand(commandId, options?): Promise<void>` | Executes a command programmatically. Options: `originalInput`, `parameters`, `confidence`, `suppressErrorFeedback`. Emits the same events as spoken commands. |
| `updateConfig` | `updateConfig(partial: Partial<VoiceControlConfig>): Promise<void>` | Patches configuration at runtime. Automatically applies feedback updates. |
| `onCommandsChanged` | `onCommandsChanged(listener: () => void): () => void` | Subscribes to registry change notifications (useful for refreshing palettes or tooling). Returns an unsubscribe callback. |
| `on` | `on(event, handler): void` | Adds an event listener (see [Event Map](#event-map)). Handlers may return promises. |
| `off` | `off(event, handler): void` | Removes an event listener. |
| `dispose` | `dispose(): void` | Stops recognition, cleans up subscriptions, and releases provider resources (use when tearing down the DI scope). |

### Event Map
`VoiceControlEvents` defines payloads for each event.

| Event | Payload |
| --- | --- |
| `voice:started` | `undefined` |
| `voice:stopped` | `undefined` |
| `voice:listening:start` | `undefined` |
| `voice:listening:stop` | `undefined` |
| `voice:recognition` | `VoiceRecognitionResult` (raw provider transcript + alternatives) |
| `voice:command:matched` | `{ command: VoiceCommand; parameters: Record<string, any>; confidence: number; score: {...} }` |
| `voice:command:executed` | `{ command: VoiceCommand; result: VoiceCommandResult }` |
| `voice:command:failed` | `{ command?: VoiceCommand; error: string }` |
| `voice:error` | `{ error: string; context?: unknown }` |

## VoiceCommandRegistry
Stores and matches voice commands. Resolve it from the container when you need direct access.

| Method | Description |
| --- | --- |
| `initialize(): Promise<void>` | Idempotent setup hook. Automatically called by `VoiceControlService`. |
| `setContext(context)` | Injects the latest `VoiceNavigationContext` for context-aware scoring. |
| `onChange(listener)` | Subscribes to registry changes; returns disposer. |
| `register(command)` | Adds a command; throws if the `id` already exists. Normalizes triggers and aliases. |
| `unregister(commandId)` | Removes a command if present. |
| `getAllCommands()` | Returns every command in insertion order. |
| `getCommandsByCategory(category)` | Filters commands by category. |
| `getCommand(commandId)` | Returns a specific command or `undefined`. |
| `findMatchingCommands(input)` | Returns an array of `VoiceCommandMatch` ordered by confidence (trigger score, parameter coverage, context score). |
| `clear()` | Removes every command and empties category caches. |

## VoiceNavigationService
Tracks UI state for context-sensitive commands.

| Method | Description |
| --- | --- |
| `initialize()` | Reads initial DOM metadata and attaches focus/history listeners (browser-only). |
| `dispose()` | Removes DOM listeners. |
| `onContextChange(listener)` | Emits when workspace/document/sidebar/focus changes; immediately invokes listener with current state. |
| `getCurrentContext()` | Returns a cloned `VoiceNavigationContext`. |
| `updateContext(partial)` | Patches the stored context. |
| `setWorkspace(workspace)` | Convenience helper to set workspace metadata. |
| `setDocument(document)` | Convenience helper for document metadata. |
| `setSidebarState(isOpen)` | Tracks sidebar open/close state. |
| `recordNavigation(view)` | Appends a view to navigation history (max 20 entries). |

## VoiceFeedbackService
Bridges speech synthesis and lightweight UI banners.

| Method | Description |
| --- | --- |
| `initialize(config)` | Stores config, resolves `speechSynthesis`, prepares DOM container. |
| `updateConfig(partial)` | Patches runtime configuration (audio or visual). |
| `speak(text, type?, options?)` | Plays speech + shows banner. Types: `info`, `success`, `warning`, `error`. Options: `duration`, `interrupt`. |
| `stopSpeaking()` | Cancels any active utterance. |

## Provider Factory Helpers
| Export | Description |
| --- | --- |
| `createProviderFactory()` | Returns a `VoiceProviderFactory` instance that manages recognition/synthesis wake-word providers. |
| `createWebSpeechProvider()` | Factory for the default Web Speech provider (recognition + synthesis). |
| `VoiceProviderFactory` | Class exposing `getRecognitionProvider`, `getSynthesisProvider`, health monitoring, and provider selection logic. |
| `WebSpeechProvider`, `WebSpeechRecognitionProvider`, `WebSpeechSynthesisProvider` | Concrete implementations around browser APIs with retry/error handling. |

## Hooks & UI Helpers
| Export | Description |
| --- | --- |
| `useVoiceControlUIState()` | React hook that returns `{ indicator, statusBar, commands, recentCommands, context }`; subscribe to real-time updates. |
| `VoiceIndicatorConnected`, `VoiceStatusBarConnected`, `VoiceCommandPaletteConnected`, `VoiceTutorial` | React components connected to the hook/services for ready-to-use UI. |
| `createVoiceControlHook()` (integration helper) | Returns a custom React hook that mirrors service state; useful for bespoke UI. |

## Key Types
| Type | Purpose |
| --- | --- |
| `VoiceControlConfig` | Top-level configuration (recognition, feedback, enabled categories, debug, custom commands). |
| `VoiceControlState` | Runtime flags: `isActive`, `isListening`, `isProcessing`, `currentSession`, `lastRecognizedText`, `error`. |
| `VoiceCommand` | Command metadata (`id`, `trigger`, `aliases`, `parameters`, `context`, `requiresConfirmation`, `handler`). |
| `VoiceCommandParameter` | Parameter definitions (type, required, default, enum values, regex). |
| `VoiceCommandMatch` | Matching result (`command`, `confidence`, `parameters`, `score`). |
| `VoiceCommandResult` | Handler result (`success`, `message`, `actions`, `data`). |
| `VoiceNavigationContext` | Workspace/document/view/sidebar/focus metadata for context-aware execution. |
| `VoiceFeedbackConfig` | Audio/visual feedback configuration. |
| `VoiceSession`, `VoiceSessionStats` | Session metadata and aggregate stats (success/failed counts, average confidence, duration). |
| `SpeechRecognitionProviderInterface` | Contract for recognition backends (`startRecognition`, `stopRecognition`, `cleanup`, events). |
| `SpeechSynthesisProviderInterface` | Contract for synthesis backends (`initialize`, `speak`, `stop`, `cleanup`). |

## Utilities
| Export | Description |
| --- | --- |
| `createVoiceConfig(overrides?)` | Merges defaults, env overrides, and runtime overrides into a ready configuration object. |
| `isVoiceControlSupported()` | Feature detection helper (checks recognition/synthesis/media device availability). |
| `getVoiceEnvironmentCapabilities()` | Returns a detailed capabilities object to drive fallbacks. |

## Error Handling
- Commands should throw `Error` objects; `voice:command:failed` and `voice:error` emit the sanitized message.
- Unhandled promise rejections inside event listeners are logged with context; prefer wrapping asynchronous handlers in `try/catch`.

## Testing Hooks
- Use `voiceControl.onCommandsChanged` to detect registry mutations in tests.
- Mock recognition providers by injecting a custom `VoiceProviderFactory` before calling `initialize()`.
- Trigger commands programmatically via `triggerCommand` in integration tests / tutorials.

Refer to the source of each class under `packages/frontend/core/src/modules/voice-control` for deeper implementation notes.

