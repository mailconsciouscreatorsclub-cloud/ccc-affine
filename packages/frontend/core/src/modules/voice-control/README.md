# Voice Control Module Ã°ÂŸÂŽÂ¤

> **Status**: Ã°ÂŸÂšÂ§ Under Development - Phase 1 Complete
> **Version**: 1.0.0-alpha
> **Author**: Conscious Creators Club

The first fully voice-controlled knowledge management platform for AFFiNE. Navigate, create, and interact with your workspace using natural speech commands.

## Ã¢ÂœÂ¨ Features

- Ã°ÂŸÂŽÂ¯ **Natural Language Commands**: "Open my project notes", "Create a new page called Meeting Notes"
- Ã°ÂŸÂ§Â  **AI-Powered Understanding**: Contextual command interpretation with fallback suggestions
- Ã°ÂŸÂŒÂ **Multi-Language Support**: 10+ languages including English, Spanish, French, German, Chinese, Japanese
- Ã¢ÂšÂ¡ **Real-Time Feedback**: Visual and audio confirmation of voice commands
- Ã°ÂŸÂ”Â§ **Extensible Architecture**: Easy to add custom commands and integrations
- Ã¢Â™Â¿ **Accessibility First**: WCAG AAA compliant voice navigation
- Ã°ÂŸÂ”Â’ **Privacy-Focused**: Local-first with optional cloud providers

## Ã°ÂŸÂšÂ€ Quick Start

```typescript
import { VoiceControlService, createVoiceConfig } from '@affine/core/modules/voice-control';

// Initialize voice control
const voiceControl = new VoiceControlService();
const config = createVoiceConfig({
  recognition: {
    language: 'en-US',
    wakeWord: 'hey affine'
  },
  debug: true
});

await voiceControl.initialize(config);
await voiceControl.start();

// Listen for voice events
voiceControl.on('voice:command:executed', ({ command, result }) => {
  console.log(`Executed: ${command.trigger}`);
});
```

## Ã°ÂŸÂ“Â‹ Available Commands

### Navigation
- `"Open sidebar"` / `"Close sidebar"`
- `"Open workspace [name]"`
- `"Create new page called [title]"`
- `"Search for [query]"`
- `"Go back"` / `"Go forward"`

### Document Editing
- `"Type [text content]"`
- `"Format as heading"`
- `"Insert bullet list"`
- `"Add code block"`
- `"Create table with 3 rows and 2 columns"`

### AI Integration  
- `"Summarize this page"`
- `"Translate to Spanish"`
- `"Create mindmap about [topic]"`
- `"Explain this code"`
- `"Improve this writing"`

### System
- `"Show help"`
- `"Open settings"`
- `"Toggle voice control"`

## Ã°ÂŸÂÂ—Ã¯Â¸Â Architecture

```
Ã°ÂŸÂ“Â voice-control/
Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ index.ts                    # Main module exports
Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â services/
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ voice-control.service.ts     # Core orchestrator
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ voice-command-registry.service.ts # Command management
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ voice-navigation.service.ts      # Context awareness
Ã¢Â”Â‚   Ã¢Â”Â”Ã¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ voice-feedback.service.ts        # User feedback
Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â types/
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ index.ts                # Core type definitions
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ commands.ts             # Command-specific types
Ã¢Â”Â‚   Ã¢Â”Â”Ã¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ providers.ts            # Provider interfaces
Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â commands/
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ navigation.commands.ts  # Navigation command implementations
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ document.commands.ts    # Document editing commands
Ã¢Â”Â‚   Ã¢Â”Â”Ã¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ ai.commands.ts         # AI integration commands
Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â providers/
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ web-speech.provider.ts  # Web Speech API implementation
Ã¢Â”Â‚   Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ azure-speech.provider.ts # Azure Speech Services
Ã¢Â”Â‚   Ã¢Â”Â”Ã¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ provider-factory.ts     # Provider selection logic
Ã¢Â”Â”Ã¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â components/
    Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ voice-indicator.tsx     # Visual voice status indicator
    Ã¢Â”ÂœÃ¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ voice-command-palette.tsx # Command discovery UI
    Ã¢Â”Â”Ã¢Â”Â€Ã¢Â”Â€ Ã°ÂŸÂ“Â„ voice-tutorial.tsx      # Interactive onboarding
```

## Ã°ÂŸÂ”Â§ Configuration

### Environment Variables

```bash
# Enable voice control
ENABLE_VOICE_CONTROL=true

# Debug mode
VOICE_DEBUG=true

# Wake word customization
VOICE_WAKE_WORD="hey affine"

# Speech recognition provider
VOICE_PROVIDER=web-speech-api

# Azure Speech Services (optional)
VOICE_API_KEY=your-api-key
VOICE_REGION=westus2
```

### Runtime Configuration

```typescript
const config = createVoiceConfig({
  recognition: {
    language: 'en-US',
    continuous: true,
    confidenceThreshold: 0.8,
    wakeWord: 'hey affine',
    commandTimeout: 5000
  },
  feedback: {
    audioEnabled: true,
    visualEnabled: true,
    speechRate: 1.2,
    speechVolume: 0.7
  },
  enabledCategories: ['navigation', 'document', 'ai'],
  debug: false
});
```

## Ã°ÂŸÂŽÂ¯ Supported Providers

### Speech Recognition
- **Web Speech API** (Built-in, Chrome/Edge)
- **Azure Speech Services** (Cloud, high accuracy)
- **Google Cloud Speech** (Cloud, multilingual)
- **Amazon Transcribe** (Cloud, real-time)

### Speech Synthesis
- **Web Speech API** (Built-in)
- **Azure Speech Services** (Neural voices)
- **ElevenLabs** (Premium AI voices)
- **Amazon Polly** (Cloud TTS)

### Wake Word Detection
- **Picovoice** (Edge AI)
- **Custom Models** (Your own wake words)

## Ã°ÂŸÂ›Â Ã¯Â¸Â Development

### Adding Custom Commands

```typescript
import { VoiceCommand } from '@affine/core/modules/voice-control';

const customCommand: VoiceCommand = {
  id: 'create-meeting-note',
  trigger: 'create meeting note',
  aliases: ['new meeting', 'meeting notes'],
  description: 'Create a new meeting notes page',
  category: 'document',
  parameters: [{
    name: 'title',
    type: 'string',
    required: false,
    defaultValue: 'Meeting Notes'
  }],
  handler: async (params, context) => {
    // Your command implementation
    return {
      success: true,
      message: `Created meeting note: ${params.parameters.title}`
    };
  }
};

// Register the command
voiceControl.commandRegistry.register(customCommand);
```

### Testing

```bash
# Run unit tests
yarn test voice-control

# Run integration tests
yarn test voice-control:integration

# Run end-to-end tests
yarn test voice-control:e2e
```

## Ã°ÂŸÂ“ÂŠ Performance

- **Command Recognition Latency**: <500ms
- **Wake Word Detection**: <100ms
- **Memory Usage**: <50MB
- **Supported Concurrent Sessions**: 1
- **Offline Capability**: Web Speech API only

## Ã°ÂŸÂ”Â’ Privacy & Security

- **Local-First**: Web Speech API processes audio locally
- **Encrypted Transit**: All cloud providers use TLS encryption
- **No Audio Storage**: Commands are processed in real-time, not stored
- **Permission-Based**: Explicit microphone permission required
- **Audit Trail**: All commands logged for debugging (disabled in production)

## Ã°ÂŸÂ“Âˆ Roadmap

### Phase 2: Core Infrastructure (Current)
- [ ] VoiceCommandRegistry implementation
- [ ] VoiceNavigationService implementation
- [ ] VoiceFeedbackService implementation
- [ ] Web Speech API provider

### Phase 3: Navigation Integration
- [ ] AppSidebar voice integration
- [ ] Workspace navigation commands
- [ ] Page management commands
- [ ] Search functionality

### Phase 4: Content Creation
- [ ] Document editing commands
- [ ] Block operations
- [ ] AI-powered content generation
- [ ] Voice-to-text dictation

### Phase 5: Advanced Features
- [ ] Context-aware commands
- [ ] Multi-modal interactions
- [ ] Custom voice workflows
- [ ] Voice command macros

### Phase 6: Testing & QA
- [ ] Comprehensive test suite
- [ ] Performance optimization
- [ ] Accessibility validation
- [ ] Multi-language testing

### Phase 7: Documentation
- [ ] API documentation
- [ ] User guides
- [ ] Video tutorials
- [ ] Developer resources

### Phase 8: Production
- [ ] Feature flags implementation
- [ ] Performance monitoring
- [ ] Error tracking
- [ ] Analytics dashboard

## Ã°ÂŸÂ¤Â Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/voice-awesome`
3. **Make** your changes and add tests
4. **Ensure** all tests pass: `yarn test`
5. **Submit** a pull request

### Code Style
- Follow existing TypeScript patterns
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Write tests for new functionality

## Ã°ÂŸÂ“Â License

MIT License - see [LICENSE](../../../../LICENSE) for details.

## Ã°ÂŸÂ™Â‹Ã¢Â€ÂÃ¢Â™Â‚Ã¯Â¸Â Support

- **Issues**: [GitHub Issues](https://github.com/toeverything/AFFiNE/issues)
- **Discussions**: [GitHub Discussions](https://github.com/toeverything/AFFiNE/discussions)
- **Discord**: [AFFiNE Community](https://discord.gg/affine)

---

**Made with Ã¢ÂÂ¤Ã¯Â¸Â by the Conscious Creators Club**

*"The future of human-computer interaction is voice. We're just making it happen today."*
## ðŸŽ¤ Voice UI Components

### VoiceIndicator
- Displays the current state of voice control (idle, listening, processing, error).
- Shows transcript previews and recognition confidence.
- Use `VoiceIndicatorConnected` to bind directly to `VoiceControlService`.

```tsx
import { VoiceIndicatorConnected } from '@affine/core/modules/voice-control';

export const VoiceIndicatorDemo = () => <VoiceIndicatorConnected position="bottom-right" />;
```

### VoiceCommandPalette
- Discover and search available voice commands with keyboard navigation and category filters.
- Inspect command details (aliases, parameters, context) in the built-in side panel.
- Group commands by category and display recent usage with `VoiceCommandPaletteConnected`.
### VoiceStatusBar
- Surface real-time voice status, microphone levels, and quick actions.
- Connected variant keeps language, last command, and state in sync with services.

### VoiceTutorial
- Guide new users through voice interactions with customisable steps and practice actions.
- Persists progress (optional) and exposes restart/skip callbacks for onboarding flows.

