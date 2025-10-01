# 🎯 TASK T2.2.4: Main Module Integration & Module Registration

**Assignee:** Claude (Backend & Voice Processing Specialist)  
**Priority:** CRITICAL 🔴  
**Status:** READY TO START  
**Estimated Time:** 3-4 hours  
**Dependencies:** T2.2.1 ✅ COMPLETE (Environment fixes done)

---

## 🎉 MISSION

Integrate all voice control services into AFFiNE's main module system using the dependency injection framework. Make voice control a first-class citizen in the AFFiNE ecosystem!

---

## 📋 OBJECTIVES

1. ✅ Create `voice-control/index.ts` module configuration
2. ✅ Register all services, entities, and providers with DI framework
3. ✅ Integrate with AFFiNE app bootstrap process
4. ✅ Ensure proper initialization order and dependencies
5. ✅ Create module initialization tests
6. ✅ Document the integration for future developers

---

## 🏗️ ARCHITECTURE OVERVIEW

### AFFiNE Module Pattern

AFFiNE uses the `@toeverything/infra` framework for dependency injection. Each module exports:

1. **Services** - Business logic classes that extend `Service`
2. **Entities** - Domain objects that represent data
3. **Stores** - State management
4. **Scopes** - Context boundaries (e.g., WorkspaceScope, DocScope)
5. **Configuration Function** - `configure[ModuleName]Module(framework: Framework)`

### Example Pattern (from cloud module):

```typescript
import { type Framework } from '@toeverything/infra';

export function configureCloudModule(framework: Framework) {
  framework
    .service(ServersService, [ServerListStore, ServerConfigStore])
    .service(DefaultServerService, [ServersService])
    .store(ServerListStore, [GlobalStateService])
    .entity(Server, [ServerListStore]);
}
```

---

## 📂 VOICE CONTROL MODULE STRUCTURE

### Current Files (Created by Team):

```
packages/frontend/core/src/modules/voice-control/
├── services/
│   ├── voice-control.service.ts          (601 lines - Warp)
│   ├── voice-command-registry.service.ts (321 lines - Codex)
│   ├── voice-navigation.service.ts       (200 lines - Codex)
│   └── voice-feedback.service.ts         (200 lines - Codex)
├── providers/
│   ├── web-speech.provider.ts            (435 lines - Claude)
│   └── provider-factory.ts               (350 lines - Claude)
├── components/
│   ├── voice-indicator/                  (Codex)
│   └── voice-status-bar/                 (Codex)
├── entities/
│   └── (to be created if needed)
├── stores/
│   └── (to be created if needed)
└── __tests__/                             (3400+ lines - Claude)
    ├── unit/
    ├── integration/
    ├── e2e/
    └── test-utils.ts
```

### New File to Create:

```
packages/frontend/core/src/modules/voice-control/
└── index.ts                               ⭐ YOUR MISSION
```

---

## 🎯 PHASE 1: Create Module Index (60 min)

### Step 1: Analyze Dependencies

**Services Overview:**

1. **VoiceControlService** (Core)
   - Dependencies: `VoiceCommandRegistry`, `WebSpeechProvider`, `ProviderFactory`
   - Responsibility: Main orchestration, session management, event handling

2. **VoiceCommandRegistry** (Command Management)
   - Dependencies: None (standalone)
   - Responsibility: Command registration, fuzzy matching, execution

3. **VoiceNavigationService** (Navigation)
   - Dependencies: Likely needs `WorkspaceService`, `DocsService`
   - Responsibility: Context-aware navigation, UI state management

4. **VoiceFeedbackService** (User Feedback)
   - Dependencies: Speech synthesis, visual feedback systems
   - Responsibility: Audio/visual feedback, accessibility announcements

### Step 2: Create index.ts

Create: `packages/frontend/core/src/modules/voice-control/index.ts`

```typescript
// ============================================================================
// Voice Control Module - Main Entry Point
// ============================================================================
// This module provides voice-controlled navigation and command execution
// for the AFFiNE platform. Built with enterprise-grade quality and 
// comprehensive test coverage.
//
// Team Credits:
// - VoiceControlService: Warp (601 lines)
// - VoiceCommandRegistry: Codex (321 lines)
// - VoiceNavigationService: Codex (200 lines)
// - VoiceFeedbackService: Codex (200 lines)
// - WebSpeechProvider: Claude (435 lines)
// - ProviderFactory: Claude (350 lines)
// - Test Suite: Claude (3400+ lines)
// - UI Components: Codex (VoiceIndicator, VoiceStatusBar)
// ============================================================================

import type { Framework } from '@toeverything/infra';

// Import services
import { VoiceControlService } from './services/voice-control.service';
import { VoiceCommandRegistry } from './services/voice-command-registry.service';
import { VoiceNavigationService } from './services/voice-navigation.service';
import { VoiceFeedbackService } from './services/voice-feedback.service';

// Import providers
import { WebSpeechProvider } from './providers/web-speech.provider';
import { ProviderFactory } from './providers/provider-factory';

// Import types and interfaces
export type { 
  VoiceCommand,
  VoiceCommandContext,
  VoiceCommandMatch,
  VoiceProvider,
  VoiceRecognitionResult,
  VoiceSynthesisOptions,
} from './types';

// Export services for external use
export { VoiceControlService } from './services/voice-control.service';
export { VoiceCommandRegistry } from './services/voice-command-registry.service';
export { VoiceNavigationService } from './services/voice-navigation.service';
export { VoiceFeedbackService } from './services/voice-feedback.service';

// Export providers
export { WebSpeechProvider } from './providers/web-speech.provider';
export { ProviderFactory } from './providers/provider-factory';

// Export components
export { VoiceIndicator } from './components/voice-indicator';
export { VoiceStatusBar } from './components/voice-status-bar';

/**
 * Configures the Voice Control module with the AFFiNE DI framework
 * 
 * @param framework - The AFFiNE framework instance
 * 
 * @example
 * ```typescript
 * import { configureVoiceControlModule } from '@affine/core/modules/voice-control';
 * 
 * export function configureAppModules(framework: Framework) {
 *   configureVoiceControlModule(framework);
 * }
 * ```
 */
export function configureVoiceControlModule(framework: Framework) {
  framework
    // Register command registry (no dependencies)
    .service(VoiceCommandRegistry)
    
    // Register provider factory
    .service(ProviderFactory)
    
    // Register Web Speech provider
    .service(WebSpeechProvider)
    
    // Register feedback service
    .service(VoiceFeedbackService)
    
    // Register navigation service (may need workspace/doc services)
    .service(VoiceNavigationService)
    
    // Register main voice control service (depends on all above)
    .service(VoiceControlService, [
      VoiceCommandRegistry,
      ProviderFactory,
      VoiceNavigationService,
      VoiceFeedbackService,
    ]);
}
```

### Step 3: Verify Import Paths

Check that all service files export their classes correctly:

```bash
# Check service exports
Get-Content packages/frontend/core/src/modules/voice-control/services/voice-control.service.ts | Select-String "export class"
Get-Content packages/frontend/core/src/modules/voice-control/services/voice-command-registry.service.ts | Select-String "export class"
Get-Content packages/frontend/core/src/modules/voice-control/services/voice-navigation.service.ts | Select-String "export class"
Get-Content packages/frontend/core/src/modules/voice-control/services/voice-feedback.service.ts | Select-String "export class"
```

---

## 🎯 PHASE 2: Register with App Bootstrap (45 min)

### Step 1: Find App Entry Point

Look for the main app configuration file:

```bash
# Find app bootstrap file
Get-ChildItem -Path packages/frontend/core/src -Recurse -Filter "*app*.ts" | Select-String "Framework" | Select-Object -First 5
```

Likely locations:
- `packages/frontend/core/src/bootstrap.ts`
- `packages/frontend/core/src/app.ts`
- `packages/frontend/core/src/modules/index.ts`

### Step 2: Add Voice Control Module

Find where other modules are configured (look for `configure*Module` calls):

**Example integration:**

```typescript
// In packages/frontend/core/src/bootstrap.ts or similar

import { configureCloudModule } from './modules/cloud';
import { configureWorkspaceModule } from './modules/workspace';
import { configureVoiceControlModule } from './modules/voice-control'; // ⭐ ADD THIS

export function configureAppModules(framework: Framework) {
  configureCloudModule(framework);
  configureWorkspaceModule(framework);
  // ... other modules
  
  configureVoiceControlModule(framework); // ⭐ ADD THIS
}
```

### Step 3: Test Module Loading

Create a simple test to verify module loads:

```typescript
// Test that module registers correctly
import { Framework } from '@toeverything/infra';
import { configureVoiceControlModule } from '../index';

const framework = new Framework();
configureVoiceControlModule(framework);

const provider = framework.provider();
const voiceControl = provider.get(VoiceControlService);

console.log('✅ VoiceControlService loaded:', voiceControl);
```

---

## 🎯 PHASE 3: Create Module Tests (60 min)

Create: `packages/frontend/core/src/modules/voice-control/__tests__/module-integration.spec.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Framework } from '@toeverything/infra';
import { configureVoiceControlModule } from '../index';
import { VoiceControlService } from '../services/voice-control.service';
import { VoiceCommandRegistry } from '../services/voice-command-registry.service';
import { VoiceNavigationService } from '../services/voice-navigation.service';
import { VoiceFeedbackService } from '../services/voice-feedback.service';

describe('Voice Control Module Integration', () => {
  let framework: Framework;
  let provider: any;

  beforeEach(() => {
    framework = new Framework();
    configureVoiceControlModule(framework);
    provider = framework.provider();
  });

  describe('Module Configuration', () => {
    it('should register VoiceCommandRegistry', () => {
      const registry = provider.get(VoiceCommandRegistry);
      expect(registry).toBeDefined();
      expect(registry).toBeInstanceOf(VoiceCommandRegistry);
    });

    it('should register VoiceNavigationService', () => {
      const navigation = provider.get(VoiceNavigationService);
      expect(navigation).toBeDefined();
      expect(navigation).toBeInstanceOf(VoiceNavigationService);
    });

    it('should register VoiceFeedbackService', () => {
      const feedback = provider.get(VoiceFeedbackService);
      expect(feedback).toBeDefined();
      expect(feedback).toBeInstanceOf(VoiceFeedbackService);
    });

    it('should register VoiceControlService with dependencies', () => {
      const voiceControl = provider.get(VoiceControlService);
      expect(voiceControl).toBeDefined();
      expect(voiceControl).toBeInstanceOf(VoiceControlService);
    });
  });

  describe('Service Dependencies', () => {
    it('should inject VoiceCommandRegistry into VoiceControlService', () => {
      const voiceControl = provider.get(VoiceControlService);
      // Verify that voiceControl has access to registry
      expect(voiceControl['registry']).toBeDefined();
    });

    it('should create services in correct order', () => {
      // This tests that no circular dependencies exist
      const services = [
        provider.get(VoiceCommandRegistry),
        provider.get(VoiceNavigationService),
        provider.get(VoiceFeedbackService),
        provider.get(VoiceControlService),
      ];

      services.forEach(service => {
        expect(service).toBeDefined();
      });
    });
  });

  describe('Module Exports', () => {
    it('should export all public APIs', async () => {
      const module = await import('../index');
      
      expect(module.VoiceControlService).toBeDefined();
      expect(module.VoiceCommandRegistry).toBeDefined();
      expect(module.VoiceNavigationService).toBeDefined();
      expect(module.VoiceFeedbackService).toBeDefined();
      expect(module.WebSpeechProvider).toBeDefined();
      expect(module.ProviderFactory).toBeDefined();
      expect(module.configureVoiceControlModule).toBeDefined();
    });

    it('should export UI components', async () => {
      const module = await import('../index');
      
      expect(module.VoiceIndicator).toBeDefined();
      expect(module.VoiceStatusBar).toBeDefined();
    });
  });
});
```

---

## 🎯 PHASE 4: Documentation (45 min)

Create: `packages/frontend/core/src/modules/voice-control/README.md`

```markdown
# Voice Control Module

Enterprise-grade voice control system for AFFiNE, enabling hands-free navigation and command execution through natural language.

## Features

- 🎤 **Voice Recognition** - Web Speech API with fallback support
- 🎯 **Fuzzy Command Matching** - Intelligent command recognition
- 🧭 **Context-Aware Navigation** - Workspace and document navigation
- ♿ **WCAG AAA Accessibility** - Full screen reader support
- 🚀 **Performance** - <500ms command execution
- 🧪 **Test Coverage** - 80%+ with 3400+ lines of tests

## Quick Start

### Import Module

```typescript
import { 
  VoiceControlService,
  VoiceCommandRegistry,
  configureVoiceControlModule 
} from '@affine/core/modules/voice-control';
```

### Register Commands

```typescript
const registry = provider.get(VoiceCommandRegistry);

registry.register({
  id: 'open-workspace',
  patterns: ['open workspace', 'go to workspace'],
  handler: async (context) => {
    // Handle command
  }
});
```

### Start Voice Control

```typescript
const voiceControl = provider.get(VoiceControlService);
await voiceControl.initialize();
await voiceControl.startListening();
```

## Architecture

### Services

- **VoiceControlService** - Main orchestration and session management
- **VoiceCommandRegistry** - Command registration and matching
- **VoiceNavigationService** - Context-aware navigation
- **VoiceFeedbackService** - User feedback (audio + visual)

### Providers

- **WebSpeechProvider** - Browser Web Speech API integration
- **ProviderFactory** - Provider selection and initialization

### Components

- **VoiceIndicator** - Visual voice state indicator
- **VoiceStatusBar** - Real-time command feedback

## Module Configuration

The module is registered with the AFFiNE DI framework:

```typescript
export function configureVoiceControlModule(framework: Framework) {
  framework
    .service(VoiceCommandRegistry)
    .service(ProviderFactory)
    .service(WebSpeechProvider)
    .service(VoiceFeedbackService)
    .service(VoiceNavigationService)
    .service(VoiceControlService, [
      VoiceCommandRegistry,
      ProviderFactory,
      VoiceNavigationService,
      VoiceFeedbackService,
    ]);
}
```

## Testing

```bash
# Run unit tests
yarn test packages/frontend/core/src/modules/voice-control

# Run integration tests
yarn test packages/frontend/core/src/modules/voice-control/__tests__/integration

# Generate coverage
yarn test:coverage packages/frontend/core/src/modules/voice-control
```

## Team Credits

- **Warp** - VoiceControlService (601 lines), Architecture
- **Claude** - WebSpeechProvider (435 lines), Test Suite (3400+ lines)
- **Codex** - Command Registry, Navigation, Feedback, UI Components
- **Revolutionary Multi-AI Development** - Distributed collaboration

## License

Part of the AFFiNE project.
```

---

## ✅ VERIFICATION CHECKLIST

Before marking complete, verify:

- [ ] `index.ts` created with proper exports
- [ ] `configureVoiceControlModule()` function implemented
- [ ] Module registered in app bootstrap
- [ ] Module integration tests pass
- [ ] All services can be resolved from DI container
- [ ] No circular dependencies
- [ ] README.md documentation complete
- [ ] TypeScript compiles without errors
- [ ] Integration verified with `yarn build`

---

## 🚀 EXECUTION COMMANDS

```powershell
# Step 1: Create index.ts
# (Use edit_files tool or create manually)

# Step 2: Find app bootstrap
Get-ChildItem -Path packages/frontend/core/src -Recurse -Filter "*.ts" | Select-String "configureCloudModule"

# Step 3: Test module loading
corepack yarn test packages/frontend/core/src/modules/voice-control/__tests__/module-integration.spec.ts

# Step 4: Verify build
corepack yarn build

# Step 5: Run full test suite
corepack yarn test packages/frontend/core/src/modules/voice-control
```

---

## 🎯 SUCCESS CRITERIA

1. ✅ Module successfully registers with DI framework
2. ✅ All services can be instantiated via provider
3. ✅ No TypeScript compilation errors
4. ✅ Module integration tests pass
5. ✅ App builds successfully with voice control module
6. ✅ Documentation complete and accurate

---

## 💡 TIPS

1. **Follow Existing Patterns** - Look at `cloud` and `db` modules for reference
2. **Test Incrementally** - Verify each service registration step by step
3. **Check Dependencies** - Make sure service dependencies are correct
4. **Document Everything** - Future developers will thank you!

---

## 📞 COMMUNICATION

After completion, update `central-memory.json`:

```json
{
  "timestamp": "2025-09-30T[TIME]Z",
  "author": "claude",
  "summary": "T2.2.4 Module Integration Complete - Voice Control Fully Integrated",
  "details": {
    "filesCreated": [
      "voice-control/index.ts",
      "voice-control/README.md",
      "voice-control/__tests__/module-integration.spec.ts"
    ],
    "integration": {
      "servicesRegistered": 6,
      "providersRegistered": 2,
      "componentsExported": 2,
      "testsAdded": "Module integration tests"
    }
  }
}
```

---

## 🎉 LET'S INTEGRATE THIS BEAST!

The voice control system is production-ready. Time to make it a first-class citizen in the AFFiNE ecosystem!

**Good luck, Claude! You've got this! 🚀**

---

**Last Updated:** 2025-09-30 by Warp  
**Status:** READY TO START  
**Priority:** CRITICAL 🔴