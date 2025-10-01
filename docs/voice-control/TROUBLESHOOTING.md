# Voice Control Troubleshooting

## Quick Checklist
- Confirm the environment supports required APIs by calling `isVoiceControlSupported()` or inspecting `getVoiceEnvironmentCapabilities()`.
- Ensure microphone permission is granted and the page is served over HTTPS (or localhost).
- Run `voiceControl.getState()` in the console to verify `isActive`, `isListening`, and `error` flags.
- Inspect registered commands with `voiceControl.getCommands()` and confirm your command category is enabled in the config.

## Issue Guide

### Voice control never leaves idle
**Likely causes**
- The initialization promise rejected (provider failure, missing APIs).
- `start()` was never awaited or threw an error.
- Wake word configured with Web Speech provider (not supported; module falls back to continuous listening and may stay idle if `start()` was gated behind wake word).

**Resolutions**
1. Wrap `initialize`/`start` in a try/catch and log `error.message` from the rejection.
2. Call `isVoiceControlSupported()` before initializing; short-circuit or show a fallback if `speechRecognition` is false.
3. Disable wake word (`wakeWord: undefined`) when using Web Speech until a dedicated wake word provider is registered.

### Microphone permission prompt never appears
**Likely causes**
- Browser blocked by insecure origin.
- An earlier denial was persisted for the origin.
- Another tab is already using the microphone.

**Resolutions**
1. Serve the app over HTTPS or `http://localhost`.
2. Reset permissions in browser settings and reload.
3. Close other tabs using the microphone or restart the recognition provider with `await voiceControl.stop(); await voiceControl.start();`.

### Commands never match
**Likely causes**
- Confidence threshold too high relative to the spoken phrase.
- Command category disabled in `config.enabledCategories`.
- Command ID not registered or unregistered earlier.

**Resolutions**
1. Lower `confidenceThreshold` (e.g., `0.6`) or add clearer aliases.
2. Double-check `enabledCategories` before initialization.
3. Inspect `voiceControl.getCommands()`; if empty, confirm initialization completed and built-ins were registered.
4. Subscribe to `voice:recognition` to debug raw transcripts:
   ```ts
   voiceControl.on('voice:recognition', payload => console.debug(payload));
   ```

### Recognition stops unexpectedly
**Likely causes**
- Provider raised an error and the service emitted `voice:error`.
- Browser throttled background tabs.
- The app called `stopListening()` indirectly via `stop()`.

**Resolutions**
1. Listen for `voice:error` and surface the `context` to diagnose provider failures.
2. Keep the tab focused or relaunch recognition when the tab regains focus.
3. Explicitly call `start()` after recovering from errors or tab visibility changes.

### Speech synthesis silent or cut off
**Likely causes**
- `feedback.audioEnabled` is false.
- No voices loaded yet (`speechSynthesis.getVoices()` returns empty until the `voiceschanged` event fires).
- Another utterance interrupts playback.

**Resolutions**
1. Call `voiceControl.getConfig()` and ensure `feedback.audioEnabled` is true.
2. Wait for or manually trigger a `voiceschanged` event before speaking (the service already does this; logging helps confirm).
3. Pass `{ suppressErrorFeedback: true }` when triggering commands you do not want to interrupt existing speech.

### UI components stuck in “processing”
**Likely causes**
- Handler threw without rejecting (synchronous error). The service catches and reports, but the UI may remain in processing if events are not handled.
- Event listeners were not cleaned up when components unmounted, leaving stale state.

**Resolutions**
1. Wrap handler logic in try/catch and throw `Error` instances so `voice:command:failed` fires.
2. Use the disposer returned by `voiceControl.on` in custom hooks to avoid duplicate listeners.
3. Inspect `useVoiceControlUIState` consumers to ensure they run inside a provider context (`useService` requires the DI scope).

### Debugging Tips
- Enable debug logging by setting `VOICE_DEBUG=true` or `createVoiceConfig({ debug: true })`; logs prefix with `[voice-control]`.
- Use the command palette to manually trigger commands and inspect parameters.
- The tutorial component (`VoiceTutorial`) can auto-run commands; if a step stalls, call `voiceControl.triggerCommand(step.commandId, { suppressErrorFeedback: true })` to resume.
- Record event order by temporarily attaching a logger:
  ```ts
  const disposer = voiceControl.on('voice:command:matched', payload => console.info('matched', payload));
  // remember to call disposer() when done
  ```

If issues persist, capture debug logs, browser version, and the `getVoiceEnvironmentCapabilities()` output before escalating to the core team.
