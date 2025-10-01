# Voice Command Palette

The `VoiceCommandPalette` component provides a searchable, keyboard-first catalog of registered voice commands with category filtering and contextual detail.

## Features

- Real-time search across triggers, aliases, and descriptions
- Category chips with counts and keyboard support
- `aria-activedescendant` list with arrow key + Home/End navigation
- Detail side panel showing aliases, parameters, and context requirements
- Recently used command history surface
- Accessible status narration for assistive tech users

## Usage

```tsx
import { VoiceCommandPaletteConnected } from '@affine/core/modules/voice-control';

export const VoicePaletteDemo = () => (
  <VoiceCommandPaletteConnected
    groupByCategory
    onCommandSelect={command => console.log('Selected', command)}
  />
);
```

### Props

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `commands` | `VoiceCommand[]` | Full command list (required for base component). |
| `searchQuery` | `string` | Controlled search query. |
| `onSearchQueryChange` | `(value: string) => void` | Callback when search changes. |
| `onCommandSelect` | `(command: VoiceCommand) => void` | Invoked when a command is selected via mouse/keyboard. |
| `groupByCategory` | `boolean` | Enable category grouping (default `true`). |
| `recentCommands` | `VoiceCommandHistoryEntry[]` | History entries to display above filters. |

Use the connected variant to automatically bind to the `VoiceControlService` and navigation state.

## Connected Variant

`VoiceCommandPaletteConnected` binds to `VoiceControlService` and runs commands automatically. Use the `autoExecute` flag to opt out:

```tsx
import { VoiceCommandPaletteConnected } from '@affine/core/modules/voice-control';

export const VoicePaletteManualDemo = () => (
  <VoiceCommandPaletteConnected autoExecute={false} onCommandSelect={command => console.log(command)} />
);
```

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `autoExecute` | `boolean` | `true` | Execute the selected command immediately via `VoiceControlService`. |
| `onCommandSelect` | `(command: VoiceCommand) => void` | `undefined` | Callback fired after a command is selected (runs even when `autoExecute` is enabled). |
