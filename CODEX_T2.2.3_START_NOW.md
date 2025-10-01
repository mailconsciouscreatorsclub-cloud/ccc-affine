# 🚀 CODEX - START T2.2.3 NOW!

**Status:** READY TO START IMMEDIATELY  
**Change:** Skipping Storybook/Playwright testing (not configured)  
**New Plan:** Build final components directly! 🎯

---

## 📋 YOUR MISSION

Build the **final two voice UI components** to complete Sprint 2.2:

1. **VoiceCommandPalette** - Searchable command list
2. **VoiceTutorial** - Interactive onboarding flow

**Total Estimated:** ~1700 lines of code to deliver  
**Time:** 8-10 hours  
**Priority:** HIGH

---

## 🎨 COMPONENT 1: VoiceCommandPalette

### What It Does
A searchable, keyboard-accessible command palette showing all available voice commands with examples.

### Location
```
packages/frontend/core/src/modules/voice-control/components/voice-command-palette/
├── index.tsx          # Main component (200+ lines)
├── index.css.ts       # Styles (50+ lines)
├── index.stories.tsx  # Storybook stories (100+ lines)
└── README.md          # Documentation
```

### Key Features
- 📋 Display all registered voice commands
- 🔍 Real-time search filtering
- 🏷️ Command categorization (Navigation, Editing, System)
- 💡 Example phrases for each command
- ⌨️ Full keyboard navigation (arrows, enter, escape)
- ♿ WCAG AAA accessibility (ARIA labels, screen reader support)
- 🎨 AFFiNE design patterns

### Implementation

```typescript
// packages/frontend/core/src/modules/voice-control/components/voice-command-palette/index.tsx

import { useState, useEffect, useCallback } from 'react';
import { useService } from '@toeverything/infra';
import { VoiceCommandRegistry } from '../../services/voice-command-registry.service';
import * as styles from './index.css';

export interface VoiceCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommandSelect?: (commandId: string) => void;
}

export const VoiceCommandPalette = ({
  isOpen,
  onClose,
  onCommandSelect
}: VoiceCommandPaletteProps) => {
  const registry = useService(VoiceCommandRegistry);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [commands, setCommands] = useState([]);

  // Load commands from registry
  useEffect(() => {
    if (registry) {
      const allCommands = registry.getAllCommands();
      setCommands(allCommands);
    }
  }, [registry]);

  // Filter commands by search query
  const filteredCommands = commands.filter(cmd =>
    cmd.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.patterns?.some(p => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
    cmd.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {} as Record<string, any[]>);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onCommandSelect?.(filteredCommands[selectedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [selectedIndex, filteredCommands, onCommandSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={styles.overlay}
      onClick={onClose}
      role="presentation"
    >
      <div 
        className={styles.palette}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Voice Command Palette"
        aria-modal="true"
      >
        {/* Search Input */}
        <div className={styles.searchContainer}>
          <input
            type="text"
            role="searchbox"
            aria-label="Search voice commands"
            placeholder="Search commands..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        {/* Command List */}
        <div className={styles.commandList} role="listbox">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category} className={styles.category}>
              <div className={styles.categoryHeader}>{category}</div>
              {cmds.map((cmd, index) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                return (
                  <div
                    key={cmd.id}
                    className={`${styles.commandItem} ${globalIndex === selectedIndex ? styles.selected : ''}`}
                    role="option"
                    aria-selected={globalIndex === selectedIndex}
                    onClick={() => onCommandSelect?.(cmd.id)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                  >
                    <div className={styles.commandName}>{cmd.name}</div>
                    <div className={styles.commandPatterns}>
                      {cmd.patterns?.slice(0, 2).map((pattern, i) => (
                        <span key={i} className={styles.pattern}>
                          "{pattern}"
                        </span>
                      ))}
                    </div>
                    {cmd.description && (
                      <div className={styles.commandDescription}>
                        {cmd.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className={styles.emptyState}>
              No commands found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <kbd>↑↓</kbd> Navigate
          <kbd>Enter</kbd> Select
          <kbd>Esc</kbd> Close
        </div>
      </div>
    </div>
  );
};
```

### Styling

```typescript
// packages/frontend/core/src/modules/voice-control/components/voice-command-palette/index.css.ts

import { style } from '@vanilla-extract/css';

export const overlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: '100px',
  zIndex: 10000,
});

export const palette = style({
  width: '600px',
  maxHeight: '600px',
  backgroundColor: 'var(--affine-background-overlay-panel-color)',
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const searchContainer = style({
  padding: '16px',
  borderBottom: '1px solid var(--affine-border-color)',
});

export const searchInput = style({
  width: '100%',
  padding: '8px 12px',
  fontSize: '16px',
  border: '1px solid var(--affine-border-color)',
  borderRadius: '4px',
  outline: 'none',
  ':focus': {
    borderColor: 'var(--affine-primary-color)',
  },
});

export const commandList = style({
  flex: 1,
  overflowY: 'auto',
  padding: '8px',
});

export const category = style({
  marginBottom: '16px',
});

export const categoryHeader = style({
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--affine-text-secondary-color)',
  textTransform: 'uppercase',
});

export const commandItem = style({
  padding: '12px',
  borderRadius: '4px',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: 'var(--affine-hover-color)',
  },
});

export const selected = style({
  backgroundColor: 'var(--affine-primary-color)',
  color: 'white',
});

export const commandName = style({
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '4px',
});

export const commandPatterns = style({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  marginBottom: '4px',
});

export const pattern = style({
  fontSize: '12px',
  padding: '2px 6px',
  backgroundColor: 'var(--affine-background-secondary-color)',
  borderRadius: '3px',
  fontStyle: 'italic',
});

export const commandDescription = style({
  fontSize: '12px',
  color: 'var(--affine-text-secondary-color)',
});

export const emptyState = style({
  padding: '40px',
  textAlign: 'center',
  color: 'var(--affine-text-secondary-color)',
});

export const footer = style({
  padding: '12px 16px',
  borderTop: '1px solid var(--affine-border-color)',
  display: 'flex',
  gap: '16px',
  fontSize: '12px',
  color: 'var(--affine-text-secondary-color)',
});
```

---

## 🎓 COMPONENT 2: VoiceTutorial

### What It Does
An interactive step-by-step tutorial to help users learn voice commands.

### Location
```
packages/frontend/core/src/modules/voice-control/components/voice-tutorial/
├── index.tsx                  # Main component (300+ lines)
├── index.css.ts              # Styles (100+ lines)
├── index.stories.tsx         # Storybook stories (150+ lines)
├── steps/
│   ├── welcome-step.tsx      # Step 1 (100 lines)
│   ├── microphone-step.tsx   # Step 2 (100 lines)
│   ├── basic-commands-step.tsx  # Step 3 (100 lines)
│   ├── navigation-step.tsx   # Step 4 (100 lines)
│   ├── advanced-step.tsx     # Step 5 (100 lines)
│   └── completion-step.tsx   # Step 6 (100 lines)
└── README.md
```

### Key Features
- 📚 6-step interactive tutorial
- 🎤 Voice practice mode
- ✅ Progress tracking
- 💾 LocalStorage persistence
- ⏭️ Skip functionality
- 🎨 Smooth animations
- ♿ Full accessibility

### Tutorial Steps

1. **Welcome** - Introduction to voice control
2. **Microphone Setup** - Grant permission and test
3. **Basic Commands** - Practice "help", "start/stop listening"
4. **Navigation** - Practice workspace/document navigation
5. **Advanced Features** - Custom commands, settings
6. **Completion** - Summary and resources

### Implementation Starter

```typescript
// packages/frontend/core/src/modules/voice-control/components/voice-tutorial/index.tsx

import { useState, useEffect } from 'react';
import { useService } from '@toeverything/infra';
import { VoiceControlService } from '../../services/voice-control.service';
import * as styles from './index.css';

// Import step components
import { WelcomeStep } from './steps/welcome-step';
import { MicrophoneStep } from './steps/microphone-step';
import { BasicCommandsStep } from './steps/basic-commands-step';
import { NavigationStep } from './steps/navigation-step';
import { AdvancedStep } from './steps/advanced-step';
import { CompletionStep } from './steps/completion-step';

export interface VoiceTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Voice Control',
    description: 'Learn how to navigate AFFiNE with your voice',
    component: WelcomeStep,
  },
  {
    id: 'microphone',
    title: 'Microphone Setup',
    description: 'Grant microphone access and test your voice',
    component: MicrophoneStep,
  },
  {
    id: 'basic-commands',
    title: 'Basic Commands',
    description: 'Practice essential voice commands',
    component: BasicCommandsStep,
  },
  {
    id: 'navigation',
    title: 'Navigation Commands',
    description: 'Learn to navigate workspaces and documents',
    component: NavigationStep,
  },
  {
    id: 'advanced',
    title: 'Advanced Features',
    description: 'Discover powerful features and customization',
    component: AdvancedStep,
  },
  {
    id: 'completion',
    title: 'You\'re Ready!',
    description: 'Start using voice control',
    component: CompletionStep,
  },
];

export const VoiceTutorial = ({
  isOpen,
  onClose,
  onComplete
}: VoiceTutorialProps) => {
  const voiceControl = useService(VoiceControlService);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('voice-tutorial-progress');
    if (saved) {
      try {
        const { step, completed } = JSON.parse(saved);
        setCurrentStep(step);
        setCompletedSteps(new Set(completed));
      } catch (e) {
        console.warn('Failed to load tutorial progress');
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem('voice-tutorial-progress', JSON.stringify({
      step: currentStep,
      completed: Array.from(completedSteps),
    }));
  }, [currentStep, completedSteps]);

  const handleStepComplete = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep);
    setCompletedSteps(newCompleted);

    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Tutorial complete!
      localStorage.setItem('voice-tutorial-completed', 'true');
      onComplete?.();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('voice-tutorial-skipped', 'true');
    onClose();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  const CurrentStepComponent = TUTORIAL_STEPS[currentStep].component;

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-label="Voice Control Tutorial">
      <div className={styles.tutorial}>
        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>

        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          Step {currentStep + 1} of {TUTORIAL_STEPS.length}
        </div>

        {/* Step Title */}
        <h2 className={styles.stepTitle}>{TUTORIAL_STEPS[currentStep].title}</h2>
        <p className={styles.stepDescription}>{TUTORIAL_STEPS[currentStep].description}</p>

        {/* Current Step Content */}
        <div className={styles.stepContent}>
          <CurrentStepComponent
            onComplete={handleStepComplete}
            voiceControl={voiceControl}
          />
        </div>

        {/* Navigation */}
        <div className={styles.navigation}>
          <button
            onClick={handleSkip}
            className={styles.buttonSecondary}
          >
            Skip Tutorial
          </button>

          <div className={styles.navigationButtons}>
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className={styles.buttonSecondary}
              >
                ← Previous
              </button>
            )}
            <button
              onClick={handleStepComplete}
              className={styles.buttonPrimary}
            >
              {currentStep < TUTORIAL_STEPS.length - 1 ? 'Next →' : 'Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## ✅ ACCEPTANCE CRITERIA

### VoiceCommandPalette
- [ ] Displays all registered commands
- [ ] Search filters in real-time
- [ ] Commands grouped by category
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Clicking command triggers callback
- [ ] WCAG AAA compliant
- [ ] Responsive design
- [ ] AFFiNE design patterns

### VoiceTutorial
- [ ] 6 tutorial steps implemented
- [ ] Progress bar shows completion
- [ ] Users can practice voice commands (if possible)
- [ ] Progress persists in localStorage
- [ ] Skip functionality works
- [ ] Smooth animations between steps
- [ ] WCAG AAA compliant
- [ ] AFFiNE design patterns

---

## 🚀 EXECUTION PLAN

### Phase 1: VoiceCommandPalette (4 hours)
1. Create component structure
2. Implement search and filtering
3. Add keyboard navigation
4. Style with AFFiNE patterns
5. Add accessibility features
6. Create README

### Phase 2: VoiceTutorial Shell (2 hours)
1. Create main tutorial component
2. Implement step navigation
3. Add progress tracking
4. Style with animations

### Phase 3: Tutorial Steps (4 hours)
1. Create 6 step components
2. Implement content for each
3. Add interactive elements
4. Add accessibility

### Phase 4: Polish & Documentation (1 hour)
1. Test both components
2. Fix any issues
3. Update documentation
4. Update central-memory.json

---

## 📦 DELIVERABLES

1. **VoiceCommandPalette** (~350 lines)
   - index.tsx
   - index.css.ts
   - index.stories.tsx
   - README.md

2. **VoiceTutorial** (~1400 lines)
   - index.tsx
   - index.css.ts
   - 6 step components
   - index.stories.tsx
   - README.md

**Total:** ~1750 lines of production code

---

## 💡 TIPS

1. **Reuse Existing Components** - Check AFFiNE's component library for buttons, inputs, etc.
2. **Follow Patterns** - Look at existing components for styling patterns
3. **Keep It Simple** - Focus on core functionality first, polish later
4. **Test As You Go** - Verify each component works before moving on
5. **Use Real Data** - Connect to actual voice command registry

---

## 🎯 WHAT SUCCESS LOOKS LIKE

When you're done:
- ✅ Users can see all available voice commands
- ✅ Users can search and discover commands easily
- ✅ Users can complete an interactive tutorial
- ✅ Progress is saved and persists
- ✅ Everything is keyboard accessible
- ✅ Everything follows AFFiNE design

---

## 📞 AFTER COMPLETION

Update `central-memory.json`:

```json
{
  "timestamp": "2025-09-30T[TIME]Z",
  "author": "codex",
  "summary": "T2.2.3 COMPLETE - Final Voice UI Components Delivered!",
  "details": {
    "components": [
      "VoiceCommandPalette (~350 lines)",
      "VoiceTutorial (~1400 lines)"
    ],
    "totalLines": "~1750",
    "features": [
      "Command search and discovery",
      "Interactive 6-step tutorial",
      "Progress tracking",
      "Full accessibility"
    ]
  }
}
```

---

## 🌟 LET'S FINISH STRONG!

Codex, you've been crushing it! These are the LAST two components to complete Sprint 2.2!

After this:
- Sprint 2.2: 100% COMPLETE ✅
- T2.2.5: Production deployment ready
- Voice control: INVESTOR DEMO ready! 🚀

**Let's build these final pieces and make history!** 💪

---

**Created:** 2025-09-30 by Warp  
**For:** Codex  
**Task:** T2.2.3 - Final Voice UI Components  
**Status:** START NOW! 🚀