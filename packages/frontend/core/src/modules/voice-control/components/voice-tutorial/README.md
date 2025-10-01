# Voice Tutorial

`VoiceTutorial` guides new users through voice control onboarding with an optional persistent timeline and practice hooks.

## Features

- Six-step default journey covering wake word, navigation, creation, AI usage, and wrap-up
- Responsive timeline with progress indicator and `aria-live` announcements
- Practice buttons trigger custom actions, run commands via `VoiceControlService` when `commandId` is provided, or fall back to spoken hints
- Steps auto-complete when linked commands finish successfully through `VoiceControlService.triggerCommand()`
- Command-based practice disables buttons and surfaces status while execution completes
- Optional localStorage persistence via `storageKey` / `persistProgress`
- Restart and skip controls for flexible onboarding flows

## Usage

```tsx
import { VoiceTutorial } from '@affine/core/modules/voice-control';

export const TutorialDemo = () => (
  <VoiceTutorial
    persistProgress
    onComplete={() => console.log('Tutorial finished')}
    onSkip={() => console.log('Tutorial skipped')}
  />
);
```

### Props

| Prop | Type | Description |
| ---- | ---- | ----------- |
| `steps` | `TutorialStep[]` | Custom step definitions (defaults provided). |
| `onComplete` | `() => void` | Called when the tour finishes or user confirms completion. |
| `onSkip` | `() => void` | Called when the user skips the tour. |
| `storageKey` | `string` | localStorage key for persisted progress (default `affine:voice-control:tutorial`). |
| `persistProgress` | `boolean` | Enable/disable persistence (default `true`). |

Each `TutorialStep` may include an `action` callback for advanced practice integrations.


### TutorialStep extras

| Field | Type | Description |
| ----- | ---- | ----------- |
| `commandId` | `string` | Optional voice command id to trigger automatically via `VoiceControlService` when practising. |
| `action` | `() => void` | Custom practice handler invoked before any speech feedback. |
| `hint` | `string` | Additional helper text shown in the step body. |
