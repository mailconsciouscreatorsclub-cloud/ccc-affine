# 🔄 Development Workflow & Branching Strategy

## Branch Structure

### Main Branches
- `main` - Production-ready code (protected)
- `develop` - Integration branch for completed features
- `feature/voice-control-main` - Main voice control feature branch

### AI Team Member Branches
Each AI team member works in their own branch to prevent conflicts:

```
feature/voice-control-{ai-name}-{task}
```

#### Current Active Branches:
- `feature/voice-control-claude-registry` - Claude's VoiceCommandRegistry work
- `feature/voice-control-codex-navigation` - Codex's navigation services 
- `feature/voice-control-gemini-tests` - Gemini's test infrastructure
- `feature/voice-control-vision-visual` - Vision AI's visual testing

## 📁 Folder Structure

```
ccc-affine-canary/
├── central-memory.json                    # Main coordination file
├── DEVELOPMENT-WORKFLOW.md                 # This file
├── branches/                               # Branch work directories
│   ├── claude/                            # Claude's workspace
│   │   └── voice-command-registry/        # Current task
│   ├── codex/                             # Codex's workspace  
│   │   ├── voice-navigation-service/      # Completed
│   │   └── voice-feedback-service/        # Completed
│   ├── gemini/                            # Gemini's workspace
│   │   └── test-infrastructure/           # Current task
│   └── vision/                            # Vision AI's workspace
│       └── visual-testing/                # Current task
└── packages/
    └── frontend/core/src/modules/
        └── voice-control/                  # Main integration point

```

## 🔧 Workflow Process

### 1. Starting Work
```bash
# Create your branch
git checkout -b feature/voice-control-{yourname}-{task}

# Create your work directory
mkdir -p branches/{yourname}/{task-name}

# Copy relevant files to your workspace
cp -r packages/frontend/core/src/modules/voice-control/* branches/{yourname}/{task-name}/
```

### 2. During Development
```bash
# Work in your branch directory
cd branches/{yourname}/{task-name}

# Make changes and test locally
# Update central-memory.json with progress
```

### 3. Completing Work
```bash
# Copy completed work to main module
cp branches/{yourname}/{task-name}/*.ts packages/frontend/core/src/modules/voice-control/

# Update central memory
# Document in handoffs section

# Create pull request to feature/voice-control-main
```

### 4. Integration (Warp's Role)
```bash
# Review code in branch directories
# Integrate into main module
# Resolve conflicts
# Update central memory
# Merge to feature/voice-control-main
```

## 📝 Naming Conventions

### Files
- **Services**: `{name}.service.ts` (e.g., `voice-command-registry.service.ts`)
- **Components**: `{Name}.tsx` (e.g., `VoiceIndicator.tsx`)
- **Types**: `{name}.types.ts` or in `types/` directory
- **Tests**: `{name}.spec.ts` or `{name}.test.ts`
- **Providers**: `{name}.provider.ts`

### Classes & Interfaces
- **Services**: `{Name}Service` (e.g., `VoiceCommandRegistryService`)
- **Interfaces**: `I{Name}` or just `{Name}` for types
- **Components**: `{Name}` (PascalCase)
- **Providers**: `{Name}Provider`

### Functions & Variables
- **Functions**: `camelCase` (e.g., `findMatchingCommands`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_CONFIDENCE_THRESHOLD`)
- **Private members**: `_prefixed` or `private` keyword

## 🔄 Central Memory Updates

### Required Updates
When working on a task, update these sections in `central-memory.json`:

1. **aiTeam.{yourname}.currentTask** - What you're working on now
2. **aiTeam.{yourname}.status** - "working" | "blocked" | "reviewing" | "complete"
3. **currentSprint.tasks[].status** - Update your task status
4. **updates[]** - Add entry when completing work

### Update Template
```json
{
  "timestamp": "ISO-8601 timestamp",
  "author": "your-ai-name",
  "summary": "Brief description",
  "details": {
    "completed": ["list of completed items"],
    "inProgress": ["current work"],
    "blocked": ["any blockers"]
  },
  "filesModified": ["list of files"],
  "nextSteps": ["what needs to happen next"],
  "messageToWarp": "Any integration notes"
}
```

## 🤝 Handoff Protocol

1. **Complete your work** in your branch directory
2. **Run tests** to ensure quality
3. **Update documentation** for your code
4. **Copy to main module** directory
5. **Update central memory** with handoff details
6. **Notify team** via central memory update
7. **Warp reviews** and integrates

## ⚠️ Conflict Resolution

- **Same file conflicts**: Warp resolves during integration
- **Interface conflicts**: Team discussion in central memory
- **Architecture conflicts**: Warp makes final decision
- **Test conflicts**: Gemini has authority on test standards

## 📊 Status Tracking

Check status with:
```bash
# View all branch work
ls branches/*/

# Check central memory for updates
cat central-memory.json | grep "status"

# See recent updates
cat central-memory.json | jq '.updates[-5:]'
```

---
*Last Updated: 2025-09-29 by Warp*
*Version: 1.0.0*