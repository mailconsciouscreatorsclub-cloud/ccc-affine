# Voice Control Command Reference

## Overview
The voice command registry powers speech-driven interactions in AFFiNE. Commands are defined with metadata (trigger phrase, aliases, parameters, context) and executed through `VoiceControlService`. Recognition results are normalized, scored, and filtered before the orchestrator runs the winning command and publishes lifecycle events.

## Built-In Commands
| Command ID | Trigger | Category | Aliases | Description |
| --- | --- | --- | --- | --- |
| `help` | `help` | system | show help, what can you do, commands | Lists every registered command and surfaces a help panel. |
| `start-listening` | `start listening` | system | begin voice control, activate voice, listen | Turns on continuous recognition or wake word monitoring. |
| `stop-listening` | `stop listening` | system | end voice control, deactivate voice, silence | Suspends recognition and frees the microphone. |
| `go-back` | `go back` | navigation | back, previous page, navigate back | Navigates browser history backward when supported. |
| `go-forward` | `go forward` | navigation | forward, next page, navigate forward | Navigates browser history forward when supported. |
| `reload-page` | `reload page` | navigation | refresh page, reload, refresh | Reloads the current location. |
| `voice-status` | `voice status` | system | status, are you listening, voice control status | Reports whether the service is active, listening, or processing. |

Use the command palette (`VoiceCommandPaletteConnected`) to inspect custom commands at runtime.

## Command Definition Fields
```ts
interface VoiceCommand {
  id: string;
  trigger: string;
  aliases: string[];
  description: string;
  category: 'navigation' | 'document' | 'ai' | 'workspace' | 'system' | 'accessibility';
  parameters?: VoiceCommandParameter[];
  context?: VoiceCommandContext;
  requiresConfirmation?: boolean;
  handler: VoiceCommandHandler;
}
```
- **Parameters** let the registry extract structured values. Supported types: `string`, `number`, `boolean`, `enum`, optional regex validation, default values, and enumerations.
- **Context** can require or ban specific views, workspaces, or documents before execution.
- **Requires confirmation** ensures the UI collects an explicit acknowledgement before running the handler.

## Handler Contract
Handlers receive extracted parameters and the live navigation context:
```ts
export type VoiceCommandHandler = (
  params: VoiceCommandParameters,
  context: VoiceNavigationContext,
) => Promise<VoiceCommandResult>;

interface VoiceCommandResult {
  success: boolean;
  message?: string;
  actions?: VoiceAction[];
  data?: any;
}
```
Return messages are surfaced via the feedback service, while `actions` can instruct the UI to navigate, highlight elements, or trigger additional commands.

## Matching Behaviour
- Input is normalized to lowercase, accents removed, punctuation stripped, and whitespace compressed.
- Each trigger and alias is scored using prefix, substring, and Levenshtein similarity heuristics. Scores below **0.45** are ignored.
- Parameter extraction reuses the matched phrase remainder and parameter definitions to populate the `parameters` map.
- Confidence combines trigger score, parameter coverage, and optional context validation. Matches are sorted descending before execution.
- The global execution threshold defaults to **0.7** (`config.recognition.confidenceThreshold`). Adjust this to tighten or relax tolerance for near-miss phrases.

## Registering Custom Commands
```ts
voiceControl.commandRegistry.register({
  id: 'create-page',
  trigger: 'create page called {title}',
  aliases: ['new page named {title}', 'make a note called {title}'],
  description: 'Create a workspace page with the given title.',
  category: 'workspace',
  parameters: [
    { name: 'title', type: 'string', required: true, pattern: '^[\w\s-]{3,}$' },
  ],
  context: { requiredView: '/workspace' },
  handler: async ({ parameters }, context) => {
    const title = parameters.title as string;
    await workspaceApi.createPage({ title, workspaceId: context.workspace?.id });
    return {
      success: true,
      message: `Created page "${title}".`,
      actions: [{ type: 'navigate', target: `/pages/${title}` }],
    };
  },
});
```
To update an existing command, call `unregister(id)` followed by `register()` with the new definition. Subscribe to `commandRegistry.onChange` to refresh UI views when the set of commands changes.

## Triggering Commands Programmatically
Use `voiceControl.triggerCommand(commandId, options)` to execute a command without speech. Options accept `originalInput`, `parameters`, `confidence`, and `suppressErrorFeedback`. The method reuses the feedback pipeline and publishes the same `voice:command:*` events as speech-driven execution.

## Lifecycle Summary
1. Recognition provider emits text alternatives.
2. `VoiceCommandRegistry.findMatchingCommands` scores phrases and extracts parameters.
3. `VoiceControlService` picks the top match above the configured threshold and verifies context.
4. The command handler runs; success/failure events and feedback surface to the UI.
5. `VoiceNavigationService` updates state when navigation occurs, feeding future matches and UI displays.

Monitor `voice:command:matched`, `voice:command:executed`, and `voice:command:failed` to audit or log command flow.
