# 🎯 TASK T2.2.3: Voice UI Components - VoiceCommandPalette & VoiceTutorial

**Assignee:** Codex (Frontend & UI Specialist)  
**Priority:** HIGH  
**Status:** READY AFTER PLAYWRIGHT TESTING  
**Estimated Time:** 8-10 hours  
**Dependencies:** T2.2.2 ✅ COMPLETE (VoiceIndicator & VoiceStatusBar done)

---

## 🎉 MISSION

Build the final two voice UI components: **VoiceCommandPalette** for command discovery and **VoiceTutorial** for interactive onboarding. These components will help users discover and learn voice commands!

---

## 📋 OBJECTIVES

1. ✅ Build VoiceCommandPalette - Searchable command list
2. ✅ Build VoiceTutorial - Interactive onboarding flow
3. ✅ Ensure WCAG AAA accessibility compliance
4. ✅ Add smooth animations and transitions
5. ✅ Integrate with existing voice control services
6. ✅ Create Storybook stories for both components
7. ✅ Write Playwright visual tests

---

## 🎨 COMPONENT 1: VoiceCommandPalette

### Features

- 📋 **Command List** - Display all registered voice commands
- 🔍 **Search** - Filter commands by name, pattern, or category
- 🏷️ **Categorization** - Group commands by function (Navigation, Editing, etc.)
- 💡 **Example Phrases** - Show example voice patterns for each command
- ⌨️ **Keyboard Navigation** - Full keyboard support
- ♿ **Accessibility** - Screen reader friendly with ARIA
- 🎨 **AFFiNE Design** - Follow existing design patterns

### User Stories

1. **As a new user**, I want to see all available voice commands so I can learn what I can say
2. **As a power user**, I want to quickly search for specific commands
3. **As a keyboard user**, I want to navigate the palette with arrow keys
4. **As a screen reader user**, I want to hear command descriptions

### Component Structure

```
voice-command-palette/
├── index.tsx                  # Main component
├── index.css.ts              # Styles (vanilla-extract)
├── index.stories.tsx         # Storybook stories
├── command-list-item.tsx     # Individual command display
└── README.md                 # Component documentation
```

### Implementation Guidelines

```typescript
// packages/frontend/core/src/modules/voice-control/components/voice-command-palette/index.tsx

import { useState, useEffect } from 'react';
import { useService } from '@toeverything/infra';
import { VoiceCommandRegistry } from '../../services/voice-command-registry.service';

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
    const allCommands = registry.getAllCommands();
    setCommands(allCommands);
  }, [registry]);

  // Filter commands by search
  const filteredCommands = commands.filter(cmd => 
    cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cmd.patterns.some(p => p.includes(searchQuery.toLowerCase())) ||
    cmd.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    switch(e.key) {
      case 'ArrowDown':
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        if (filteredCommands[selectedIndex]) {
          onCommandSelect?.(filteredCommands[selectedIndex].id);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  return (
    <div 
      role="dialog" 
      aria-label="Voice Command Palette"
      aria-modal="true"
      className={styles.palette}
    >
      {/* Search input */}
      <input
        type="text"
        role="searchbox"
        aria-label="Search voice commands"
        placeholder="Search commands..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
      />

      {/* Command list */}
      <div 
        role="listbox" 
        aria-label="Available voice commands"
        className={styles.commandList}
      >
        {filteredCommands.map((cmd, index) => (
          <CommandListItem
            key={cmd.id}
            command={cmd}
            isSelected={index === selectedIndex}
            onSelect={() => onCommandSelect?.(cmd.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Styling Requirements

```typescript
// index.css.ts
import { style } from '@vanilla-extract/css';

export const palette = style({
  position: 'fixed',
  top: '20%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '600px',
  maxHeight: '500px',
  background: 'var(--affine-background-overlay-panel-color)',
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  padding: '16px',
  zIndex: 1000,
});

export const commandList = style({
  maxHeight: '400px',
  overflowY: 'auto',
  marginTop: '12px',
});
```

---

## 🎓 COMPONENT 2: VoiceTutorial

### Features

- 📚 **Step-by-Step Guide** - Interactive tutorial with multiple steps
- 🎤 **Voice Practice** - Let users practice voice commands
- ✅ **Progress Tracking** - Show completion status
- 🎨 **Animations** - Smooth transitions between steps
- 💾 **Persistence** - Remember user progress
- ⏭️ **Skip Option** - Allow users to skip tutorial

### Tutorial Steps

1. **Welcome** - Introduction to voice control
2. **Microphone Setup** - Test microphone access
3. **Basic Commands** - Practice "help", "start listening"
4. **Navigation** - Practice workspace/document navigation
5. **Advanced Features** - Custom commands, settings
6. **Completion** - Summary and resources

### Component Structure

```
voice-tutorial/
├── index.tsx                  # Main tutorial component
├── index.css.ts              # Styles
├── index.stories.tsx         # Storybook stories
├── steps/
│   ├── welcome-step.tsx
│   ├── microphone-step.tsx
│   ├── basic-commands-step.tsx
│   ├── navigation-step.tsx
│   ├── advanced-step.tsx
│   └── completion-step.tsx
└── README.md
```

### Implementation Guidelines

```typescript
// packages/frontend/core/src/modules/voice-control/components/voice-tutorial/index.tsx

import { useState, useEffect } from 'react';
import { useService } from '@toeverything/infra';
import { VoiceControlService } from '../../services/voice-control.service';

export interface VoiceTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export const VoiceTutorial = ({ 
  isOpen, 
  onClose, 
  onComplete 
}: VoiceTutorialProps) => {
  const voiceControl = useService(VoiceControlService);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = [
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
    // ... more steps
  ];

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handleSkip = () => {
    onClose();
    localStorage.setItem('voice-tutorial-skipped', 'true');
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div role="dialog" aria-label="Voice Control Tutorial" className={styles.tutorial}>
      {/* Progress bar */}
      <div className={styles.progress}>
        <div 
          className={styles.progressBar}
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className={styles.stepIndicator}>
        Step {currentStep + 1} of {steps.length}
      </div>

      {/* Current step content */}
      <CurrentStepComponent
        onComplete={handleStepComplete}
        onSkip={handleSkip}
      />

      {/* Navigation */}
      <div className={styles.navigation}>
        <button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}>
          Previous
        </button>
        <button onClick={handleSkip}>Skip Tutorial</button>
        <button onClick={handleStepComplete}>
          {currentStep < steps.length - 1 ? 'Next' : 'Complete'}
        </button>
      </div>
    </div>
  );
};
```

---

## ✅ ACCEPTANCE CRITERIA

### VoiceCommandPalette
- [ ] Displays all registered commands
- [ ] Search filters commands in real-time
- [ ] Commands grouped by category
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Clicking a command triggers onCommandSelect
- [ ] WCAG AAA compliant
- [ ] Responsive design
- [ ] Storybook stories complete

### VoiceTutorial
- [ ] 6 tutorial steps implemented
- [ ] Progress bar shows completion
- [ ] Users can practice voice commands
- [ ] Progress persists in localStorage
- [ ] Skip functionality works
- [ ] Smooth animations between steps
- [ ] WCAG AAA compliant
- [ ] Storybook stories complete

---

## 🧪 TESTING REQUIREMENTS

### Playwright Tests

Create tests for both components:

```typescript
// tests/voice-control/components/voice-command-palette.spec.ts

test('VoiceCommandPalette renders and filters commands', async ({ page }) => {
  // Test search functionality
  await page.fill('[aria-label="Search voice commands"]', 'navigate');
  const results = await page.locator('[role="listbox"] > *').count();
  expect(results).toBeGreaterThan(0);
});

test('VoiceCommandPalette keyboard navigation', async ({ page }) => {
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  // Verify command was selected
});
```

---

## 📦 DELIVERABLES

1. `voice-command-palette/index.tsx` (200+ lines)
2. `voice-command-palette/index.css.ts` (50+ lines)
3. `voice-command-palette/index.stories.tsx` (100+ lines)
4. `voice-tutorial/index.tsx` (300+ lines)
5. `voice-tutorial/index.css.ts` (100+ lines)
6. `voice-tutorial/steps/` (6 step components, 600+ lines total)
7. `voice-tutorial/index.stories.tsx` (150+ lines)
8. Playwright tests for both components (200+ lines)
9. README.md documentation for both

**Total Estimated Lines:** ~1700+ lines

---

## 🚀 EXECUTION PLAN

### Phase 1: VoiceCommandPalette (4 hours)
1. Create component structure
2. Implement search and filtering
3. Add keyboard navigation
4. Style with AFFiNE patterns
5. Create Storybook stories
6. Write Playwright tests

### Phase 2: VoiceTutorial (6 hours)
1. Create tutorial shell
2. Implement 6 tutorial steps
3. Add progress tracking
4. Implement voice practice mode
5. Add localStorage persistence
6. Style with animations
7. Create Storybook stories
8. Write Playwright tests

---

## 💡 TIPS

1. **Reuse Existing Components** - Check AFFiNE's component library
2. **Follow Existing Patterns** - Look at command palette in AFFiNE for inspiration
3. **Test Accessibility** - Use screen reader to verify ARIA labels
4. **Smooth Animations** - Use CSS transitions for professional feel

---

## 📞 NEXT STEPS

**After Playwright testing of VoiceIndicator/VoiceStatusBar:**

1. Read this document
2. Create component directories
3. Implement VoiceCommandPalette first
4. Test and get feedback
5. Implement VoiceTutorial
6. Create comprehensive Playwright tests
7. Update central-memory.json

---

**Created:** 2025-09-30 by Warp  
**Status:** READY (After current Playwright task)  
**Priority:** HIGH