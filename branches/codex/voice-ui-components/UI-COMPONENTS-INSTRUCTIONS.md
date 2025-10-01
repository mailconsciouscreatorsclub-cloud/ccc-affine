# 🎨 Voice UI Components Instructions for Codex

## Your Mission: Build Beautiful Voice UI Components

While Claude handles testing, you can work in parallel on the UI components that will give users visual feedback for voice interactions!

## 🎯 Components to Build

### 1. **VoiceIndicator** (`VoiceIndicator.tsx`)
Visual indicator showing voice control state (listening, processing, idle).

```typescript
interface VoiceIndicatorProps {
  state: 'idle' | 'listening' | 'processing' | 'error';
  confidence?: number;
  transcript?: string;
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
}

// Features:
- Animated pulse when listening
- Processing spinner
- Color states (green=active, yellow=processing, red=error)
- Mini transcript preview
- Click to expand/collapse
```

### 2. **VoiceCommandPalette** (`VoiceCommandPalette.tsx`)
Command discovery UI - shows available voice commands.

```typescript
interface VoiceCommandPaletteProps {
  commands: VoiceCommand[];
  searchQuery?: string;
  onCommandSelect?: (command: VoiceCommand) => void;
  groupByCategory?: boolean;
}

// Features:
- Searchable command list
- Category grouping
- Keyboard navigation (Arrow keys + Enter)
- Command shortcuts display
- Usage examples
- Recently used section
```

### 3. **VoiceTutorial** (`VoiceTutorial.tsx`)
Interactive onboarding for new users.

```typescript
interface VoiceTutorialProps {
  onComplete?: () => void;
  onSkip?: () => void;
  steps?: TutorialStep[];
}

interface TutorialStep {
  title: string;
  description: string;
  command?: string;
  action?: () => void;
}

// Features:
- Step-by-step guide
- Practice commands
- Progress indicator
- Skip option
- Success animations
```

### 4. **VoiceStatusBar** (`VoiceStatusBar.tsx`)
Real-time voice system status display.

```typescript
interface VoiceStatusBarProps {
  isActive: boolean;
  isListening: boolean;
  lastCommand?: string;
  microphoneLevel?: number;
  language?: string;
}

// Features:
- Microphone level indicator
- Current language display
- Last command executed
- Quick toggle button
- Settings shortcut
```

## 🎨 Design System Integration

Follow AFFiNE's existing design patterns:

```tsx
// Use existing style system
import { cssVar } from '@toeverything/theme';
import { IconButton, Tooltip } from '@affine/component';

// Color scheme
const colors = {
  listening: cssVar('--affine-primary-color'),
  processing: cssVar('--affine-warning-color'),
  error: cssVar('--affine-error-color'),
  success: cssVar('--affine-success-color'),
};

// Animation classes (use CSS modules)
.pulseAnimation {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}
```

## 📁 File Structure

```
branches/codex/voice-ui-components/
├── components/
│   ├── VoiceIndicator/
│   │   ├── VoiceIndicator.tsx
│   │   ├── VoiceIndicator.css
│   │   ├── VoiceIndicator.stories.tsx
│   │   └── index.ts
│   ├── VoiceCommandPalette/
│   │   ├── VoiceCommandPalette.tsx
│   │   ├── VoiceCommandPalette.css
│   │   ├── VoiceCommandPalette.stories.tsx
│   │   └── index.ts
│   ├── VoiceTutorial/
│   │   ├── VoiceTutorial.tsx
│   │   ├── VoiceTutorial.css
│   │   ├── VoiceTutorial.stories.tsx
│   │   └── index.ts
│   └── VoiceStatusBar/
│       ├── VoiceStatusBar.tsx
│       ├── VoiceStatusBar.css
│       ├── VoiceStatusBar.stories.tsx
│       └── index.ts
├── hooks/
│   ├── useVoiceState.ts
│   └── useVoiceCommands.ts
└── index.ts
```

## 🪝 Custom Hooks

### `useVoiceState`
```typescript
export function useVoiceState() {
  const voiceControl = useService(VoiceControlService);
  const state = useLiveData(voiceControl.state$);
  
  return {
    isActive: state.isActive,
    isListening: state.isListening,
    isProcessing: state.isProcessing,
    lastCommand: state.lastRecognizedText,
    error: state.error
  };
}
```

### `useVoiceCommands`
```typescript
export function useVoiceCommands() {
  const registry = useService(VoiceCommandRegistry);
  const commands = useLiveData(registry.commands$);
  
  return {
    commands,
    executeCommand: (id: string) => registry.execute(id),
    searchCommands: (query: string) => registry.search(query)
  };
}
```

## 📚 Storybook Stories

Create interactive stories for each component:

```typescript
// VoiceIndicator.stories.tsx
export default {
  title: 'Voice Control/VoiceIndicator',
  component: VoiceIndicator,
} as Meta;

export const Idle: Story = {
  args: { state: 'idle' }
};

export const Listening: Story = {
  args: { 
    state: 'listening',
    transcript: 'Open new document...'
  }
};

export const Processing: Story = {
  args: {
    state: 'processing',
    confidence: 0.85
  }
};
```

## ♿ Accessibility Requirements

- **ARIA Labels**: All interactive elements must have proper labels
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Announce state changes
- **Focus Management**: Proper focus trapping in modals
- **Color Contrast**: WCAG AAA compliance

```tsx
// Example accessibility implementation
<div
  role="status"
  aria-live="polite"
  aria-label="Voice control status"
  tabIndex={0}
  onKeyDown={handleKeyDown}
>
  <span className="sr-only">
    {state === 'listening' ? 'Listening for voice commands' : 'Voice control idle'}
  </span>
  {/* Visual content */}
</div>
```

## 🎯 Acceptance Criteria

1. **Visual Excellence**: Smooth animations, consistent styling
2. **Performance**: 60fps animations, <16ms render time
3. **Accessibility**: WCAG AAA compliant
4. **Responsiveness**: Works on all screen sizes
5. **Documentation**: Complete prop types and examples
6. **Testing**: Storybook stories for all states

## 💡 Pro Tips

1. Use `framer-motion` for complex animations
2. Implement `useMemo` for expensive computations
3. Add loading states and skeleton screens
4. Use CSS variables for theming
5. Include error boundaries

## 🎨 Example Component Structure

```tsx
// VoiceIndicator.tsx
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MicrophoneIcon } from '@blocksuite/icons';
import { cssVar } from '@toeverything/theme';
import styles from './VoiceIndicator.css';

export interface VoiceIndicatorProps {
  state: 'idle' | 'listening' | 'processing' | 'error';
  confidence?: number;
  transcript?: string;
  position?: 'bottom-right' | 'top-right';
  onToggle?: () => void;
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({
  state = 'idle',
  confidence,
  transcript,
  position = 'bottom-right',
  onToggle
}) => {
  const color = useMemo(() => {
    switch (state) {
      case 'listening': return cssVar('--affine-primary-color');
      case 'processing': return cssVar('--affine-warning-color');
      case 'error': return cssVar('--affine-error-color');
      default: return cssVar('--affine-text-secondary-color');
    }
  }, [state]);

  return (
    <motion.div
      className={styles.container}
      data-position={position}
      data-state={state}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        className={styles.indicator}
        onClick={onToggle}
        aria-label={`Voice control ${state}`}
        style={{ borderColor: color }}
      >
        <MicrophoneIcon className={styles.icon} />
        {state === 'listening' && (
          <span className={styles.pulse} />
        )}
      </button>
      
      {transcript && (
        <motion.div 
          className={styles.transcript}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {transcript}
        </motion.div>
      )}
    </motion.div>
  );
};
```

---

**Remember:** You're creating the visual language for voice interaction! Every component you build helps users understand and control the voice system. Make it beautiful, intuitive, and accessible!

Let's show the world what the future of UI looks like! 🎨🚀