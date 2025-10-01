/**
 * Voice Control Module Integration
 * 
 * This file integrates all voice control services and provides
 * the main entry point for the voice control system in AFFiNE.
 * 
 * @module voice-control/integration
 */

import { ServiceProvider } from '@toeverything/infra';

import { ProviderFactory } from './providers/provider-factory';
import { WebSpeechProvider } from './providers/web-speech.provider';
import { VoiceCommandRegistry } from './services/voice-command-registry.service';
import { VoiceControlService } from './services/voice-control.service';
import { VoiceFeedbackService } from './services/voice-feedback.service';
import { VoiceNavigationService } from './services/voice-navigation.service';
import type { VoiceControlConfig } from './types';

/**
 * Initialize the voice control system with all required services
 */
export async function initializeVoiceControl(
  serviceProvider: ServiceProvider,
  config?: Partial<VoiceControlConfig>
): Promise<VoiceControlService> {
  // Register all services with the service provider
  serviceProvider.register(VoiceCommandRegistry);
  serviceProvider.register(VoiceNavigationService);
  serviceProvider.register(VoiceFeedbackService);
  serviceProvider.register(VoiceControlService);

  // Get the main voice control service
  const voiceControl = serviceProvider.get(VoiceControlService);
  
  // Initialize with configuration
  await voiceControl.initialize(config);
  
  return voiceControl;
}

/**
 * Quick start function for voice control
 * Provides sensible defaults for immediate use
 */
export async function startVoiceControl(
  serviceProvider: ServiceProvider
): Promise<VoiceControlService> {
  const voiceControl = await initializeVoiceControl(serviceProvider, {
    recognition: {
      language: navigator.language || 'en-US',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      wakeWord: 'hey affine',
      commandTimeout: 10000
    },
    feedback: {
      audioEnabled: true,
      visualEnabled: true,
      speechRate: 1.0,
      speechPitch: 1.0,
      speechVolume: 0.8
    },
    enabledCategories: ['navigation', 'document', 'ai', 'workspace', 'system'],
    debug: process.env.NODE_ENV === 'development'
  });
  
  // Start listening
  await voiceControl.start();
  
  return voiceControl;
}

/**
 * Register default voice commands
 */
export function registerDefaultCommands(registry: VoiceCommandRegistry): void {
  // Navigation commands
  registry.register({
    id: 'open-sidebar',
    trigger: 'open sidebar',
    aliases: ['show sidebar', 'toggle sidebar'],
    description: 'Open the application sidebar',
    category: 'navigation',
    handler: async (params, context) => {
      const sidebar = document.querySelector('[data-testid="app-sidebar"]');
      if (sidebar) {
        // Trigger sidebar open event
        sidebar.dispatchEvent(new CustomEvent('voice:open'));
      }
      return {
        success: true,
        message: 'Sidebar opened'
      };
    }
  });

  registry.register({
    id: 'close-sidebar',
    trigger: 'close sidebar',
    aliases: ['hide sidebar'],
    description: 'Close the application sidebar',
    category: 'navigation',
    handler: async (params, context) => {
      const sidebar = document.querySelector('[data-testid="app-sidebar"]');
      if (sidebar) {
        sidebar.dispatchEvent(new CustomEvent('voice:close'));
      }
      return {
        success: true,
        message: 'Sidebar closed'
      };
    }
  });

  // Document commands
  registry.register({
    id: 'create-page',
    trigger: 'create new page',
    aliases: ['new page', 'add page'],
    description: 'Create a new document page',
    category: 'document',
    parameters: [{
      name: 'title',
      type: 'string',
      required: false,
      defaultValue: 'Untitled'
    }],
    handler: async (params, context) => {
      const title = params.parameters.title || 'Untitled';
      // Trigger page creation
      const event = new CustomEvent('voice:create-page', { 
        detail: { title } 
      });
      document.dispatchEvent(event);
      return {
        success: true,
        message: `Creating page: ${title}`
      };
    }
  });

  // AI commands
  registry.register({
    id: 'ask-ai',
    trigger: 'ask ai',
    aliases: ['hey ai', 'ai help'],
    description: 'Ask AI for assistance',
    category: 'ai',
    parameters: [{
      name: 'query',
      type: 'string',
      required: true
    }],
    handler: async (params, context) => {
      const query = params.parameters.query;
      // Open AI chat panel
      const chatPanel = document.querySelector('[data-testid="ai-chat-panel"]');
      if (chatPanel) {
        chatPanel.dispatchEvent(new CustomEvent('voice:ask', {
          detail: { query }
        }));
      }
      return {
        success: true,
        message: 'Opening AI assistant...'
      };
    }
  });

  // System commands
  registry.register({
    id: 'voice-help',
    trigger: 'voice help',
    aliases: ['help', 'show commands', 'what can you do'],
    description: 'Show available voice commands',
    category: 'system',
    handler: async (params, context) => {
      // Open command palette
      const event = new CustomEvent('voice:show-help');
      document.dispatchEvent(event);
      return {
        success: true,
        message: 'Here are the available voice commands...'
      };
    }
  });

  registry.register({
    id: 'stop-listening',
    trigger: 'stop listening',
    aliases: ['pause voice', 'mute'],
    description: 'Stop voice recognition',
    category: 'system',
    handler: async (params, context) => {
      const event = new CustomEvent('voice:stop');
      document.dispatchEvent(event);
      return {
        success: true,
        message: 'Voice control paused'
      };
    }
  });
}

/**
 * Connect voice control to AFFiNE's existing UI
 */
export function connectToUI(
  voiceControl: VoiceControlService,
  navigationService: VoiceNavigationService
): void {
  // Monitor workspace changes
  const observeWorkspace = () => {
    const workspace = document.querySelector('[data-workspace-id]');
    if (workspace) {
      const id = workspace.getAttribute('data-workspace-id');
      const name = workspace.getAttribute('data-workspace-name');
      if (id) {
        navigationService.setWorkspace({ id, name: name || id });
      }
    }
  };

  // Monitor document changes
  const observeDocument = () => {
    const doc = document.querySelector('[data-doc-id]');
    if (doc) {
      const id = doc.getAttribute('data-doc-id');
      const title = doc.getAttribute('data-doc-title');
      const type = doc.getAttribute('data-doc-type');
      if (id) {
        navigationService.setDocument({ 
          id, 
          title: title || id, 
          type: type || 'page' 
        });
      }
    }
  };

  // Monitor sidebar state
  const observeSidebar = () => {
    const sidebar = document.querySelector('[data-testid="app-sidebar"]');
    if (sidebar) {
      const isOpen = sidebar.getAttribute('data-open') === 'true';
      navigationService.setSidebarState(isOpen);
    }
  };

  // Set up observers
  const observer = new MutationObserver(() => {
    observeWorkspace();
    observeDocument();
    observeSidebar();
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-workspace-id', 'data-doc-id', 'data-open'],
    subtree: true
  });

  // Initial observation
  observeWorkspace();
  observeDocument();
  observeSidebar();

  // Listen for voice events
  voiceControl.on('voice:command:executed', ({ command, result }) => {
    console.log(`[Voice] Executed: ${command.trigger}`, result);
  });

  voiceControl.on('voice:error', ({ error }) => {
    console.error('[Voice] Error:', error);
  });
}

/**
 * Create voice control React hook
 */
export function createVoiceControlHook() {
  let voiceControlInstance: VoiceControlService | null = null;

  return function useVoiceControl() {
    const [isActive, setIsActive] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
      if (!voiceControlInstance) {
        return;
      }

      const unsubscribe = [
        voiceControlInstance.on('voice:started', () => setIsActive(true)),
        voiceControlInstance.on('voice:stopped', () => setIsActive(false)),
        voiceControlInstance.on('voice:listening:start', () => setIsListening(true)),
        voiceControlInstance.on('voice:listening:stop', () => setIsListening(false)),
        voiceControlInstance.on('voice:recognition', (result) => {
          if (result.isFinal) {
            setLastCommand(result.transcript);
          }
        }),
        voiceControlInstance.on('voice:error', ({ error }) => setError(error))
      ];

      return () => {
        unsubscribe.forEach(unsub => unsub && unsub());
      };
    }, []);

    return {
      isActive,
      isListening,
      lastCommand,
      error,
      start: () => voiceControlInstance?.start(),
      stop: () => voiceControlInstance?.stop(),
      toggle: () => {
        if (isActive) {
          voiceControlInstance?.stop();
        } else {
          voiceControlInstance?.start();
        }
      }
    };
  };
}

// Export convenience function for plugin registration
export const VoiceControlPlugin = {
  name: 'voice-control',
  version: '1.0.0',
  
  async install(app: any) {
    const serviceProvider = app.serviceProvider;
    
    // Initialize voice control
    const voiceControl = await initializeVoiceControl(serviceProvider);
    
    // Register default commands
    const registry = serviceProvider.get(VoiceCommandRegistry);
    registerDefaultCommands(registry);
    
    // Connect to UI
    const navigationService = serviceProvider.get(VoiceNavigationService);
    connectToUI(voiceControl, navigationService);
    
    // Make available globally for debugging
    if (typeof window !== 'undefined') {
      (window as any).voiceControl = voiceControl;
    }
    
    return voiceControl;
  }
};

export default VoiceControlPlugin;