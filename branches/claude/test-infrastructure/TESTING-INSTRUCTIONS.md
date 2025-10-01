# 🧪 Testing Instructions for Claude

## Your Mission: Create Comprehensive Test Suite

Since Gemini hit their API limit, you're taking over testing responsibilities. This is critical for Phase 2 completion!

## 📋 Test Coverage Requirements

### 1. **VoiceCommandRegistry Tests** (`voice-command-registry.spec.ts`)
```typescript
// Test scenarios needed:
- Command registration and unregistration
- Fuzzy matching with various confidence levels
- Parameter extraction (string, number, boolean, enum)
- Context scoring and evaluation
- Levenshtein distance algorithm accuracy
- Edge cases: empty input, special characters, multiple languages
```

### 2. **VoiceNavigationService Tests** (`voice-navigation.service.spec.ts`)
```typescript
// Test scenarios needed:
- Context initialization and updates
- Workspace/document tracking
- Navigation history management
- Event listener setup and cleanup
- Browser vs SSR safety
- Sidebar state tracking
```

### 3. **VoiceFeedbackService Tests** (`voice-feedback.service.spec.ts`)
```typescript
// Test scenarios needed:
- Speech synthesis initialization
- Visual feedback banner creation
- Audio/visual enable/disable
- Configuration updates
- Browser API availability checks
- Voice selection logic
```

### 4. **WebSpeechProvider Tests** (`web-speech.provider.spec.ts`)
```typescript
// Integration tests needed:
- Recognition start/stop
- Language switching
- Error handling and recovery
- Confidence threshold filtering
- Browser compatibility
- Microphone permission handling
```

### 5. **End-to-End Test** (`voice-control.e2e.spec.ts`)
```typescript
// Complete flow testing:
- Initialize VoiceControlService
- Start recognition
- Speak command (mock)
- Process through registry
- Execute command
- Verify feedback
```

## 🛠️ Testing Framework Setup

```typescript
// Use Vitest + @testing-library/react
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock Web APIs
global.SpeechRecognition = vi.fn();
global.speechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => [])
};
```

## 📊 Coverage Goals

- **Unit Test Coverage**: 80% minimum
- **Critical Path Coverage**: 100% (command execution flow)
- **Error Handling Coverage**: 100%
- **Browser Compatibility**: Chrome, Edge, Firefox, Safari

## 🎯 Test Data Generators

Create test utilities in `test-utils.ts`:
```typescript
export const generateMockCommand = (overrides = {}) => ({
  id: 'test-command',
  trigger: 'test trigger',
  aliases: [],
  category: 'system',
  handler: vi.fn(),
  ...overrides
});

export const generateMockContext = (overrides = {}) => ({
  workspace: { id: 'ws-1', name: 'Test Workspace' },
  document: { id: 'doc-1', title: 'Test Doc', type: 'page' },
  currentView: '/workspace/doc',
  navigationHistory: [],
  sidebarOpen: true,
  ...overrides
});
```

## 📁 File Structure

```
branches/claude/test-infrastructure/
├── tests/
│   ├── unit/
│   │   ├── voice-command-registry.spec.ts
│   │   ├── voice-navigation.service.spec.ts
│   │   └── voice-feedback.service.spec.ts
│   ├── integration/
│   │   ├── web-speech.provider.spec.ts
│   │   └── provider-factory.spec.ts
│   └── e2e/
│       └── voice-control.e2e.spec.ts
├── test-utils.ts
├── setup.ts
└── vitest.config.ts
```

## ✅ Acceptance Criteria

1. All tests pass with >80% coverage
2. No flaky tests - must pass 10 consecutive runs
3. Performance: Test suite completes in <30 seconds
4. Documentation: Each test has clear description
5. Mocking: Proper isolation, no real API calls

## 🚀 Quick Start

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test voice-command-registry

# Watch mode
pnpm test:watch
```

## 💡 Pro Tips

1. Use `describe.each` for parameterized tests
2. Mock timers for timeout testing
3. Use `waitFor` for async operations
4. Test error boundaries and edge cases
5. Include performance benchmarks

## 📝 Example Test Structure

```typescript
describe('VoiceCommandRegistry', () => {
  let registry: VoiceCommandRegistry;
  
  beforeEach(() => {
    registry = new VoiceCommandRegistry();
    registry.initialize();
  });
  
  afterEach(() => {
    registry.clear();
  });
  
  describe('findMatchingCommands', () => {
    it('should match exact trigger phrase', () => {
      const command = generateMockCommand({ trigger: 'open sidebar' });
      registry.register(command);
      
      const matches = registry.findMatchingCommands('open sidebar');
      
      expect(matches).toHaveLength(1);
      expect(matches[0].command.id).toBe(command.id);
      expect(matches[0].confidence).toBeGreaterThan(0.9);
    });
    
    it('should handle fuzzy matching', () => {
      const command = generateMockCommand({ trigger: 'create new page' });
      registry.register(command);
      
      const matches = registry.findMatchingCommands('create page');
      
      expect(matches).toHaveLength(1);
      expect(matches[0].confidence).toBeGreaterThan(0.6);
    });
  });
});
```

---

**Remember:** You're not just writing tests - you're ensuring the reliability of the world's first voice-controlled knowledge management platform! Every test you write brings us closer to revolutionizing human-computer interaction.

Good luck, Claude! The team is counting on you! 🚀