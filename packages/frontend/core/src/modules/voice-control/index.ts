/**
 * Voice Control Module - Main Entry Point
 *
 * This module provides voice-controlled navigation for AFFiNE,
 * enabling users to interact with the application using natural speech.
 *
 * @example
 * ```typescript
 * import { VoiceControlService, VoiceCommand } from './voice-control';
 *
 * // Initialize voice control
 * const voiceControl = new VoiceControlService();
 * await voiceControl.initialize();
 *
 * // Start listening for voice commands
 * await voiceControl.start();
 *
 * // Register custom command
 * voiceControl.commandRegistry.register({
 *   id: 'custom-command',
 *   trigger: 'hello world',
 *   description: 'A custom voice command',
 *   category: 'system',
 *   handler: async () => ({ success: true, message: 'Hello from voice!' })
 * });
 * ```
 */

// ============================================================================
// Core Services
// ============================================================================

export { VoiceCommandRegistry } from './services/voice-command-registry.service';
export { VoiceControlService } from './services/voice-control.service';
export { VoiceFeedbackService } from './services/voice-feedback.service';
export { VoiceNavigationService } from './services/voice-navigation.service';

// Providers
export {
  createProviderFactory,
  createWebSpeechProvider,
  VoiceProviderFactory,
  WebSpeechProvider,
  WebSpeechRecognitionProvider,
  WebSpeechSynthesisProvider,
} from './providers';

// ============================================================================
// UI Components
// ============================================================================

export {
  useVoiceControlUIState,
  VoiceCommandPalette,
  VoiceCommandPaletteConnected,
  VoiceIndicator,
  VoiceIndicatorConnected,
  VoiceStatusBar,
  VoiceStatusBarConnected,
  VoiceTutorial,
} from './components';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type {
  VoiceAction,
  // Command types
  VoiceCommand,
  VoiceCommandCategory,
  VoiceCommandContext,
  VoiceCommandHandler,
  VoiceCommandParameter,
  VoiceCommandParameters,
  VoiceCommandResult,
  // Core voice control types
  VoiceControlConfig,
  VoiceControlEvents,
  VoiceControlState,
  VoiceEventHandler,
  // Event types
  VoiceEventListener,
  VoiceFeedback,
  VoiceFeedbackConfig,
  VoiceNavigationContext,
  VoiceRecognitionConfig,
  VoiceRecognitionResult,
  VoiceSession,
  VoiceSessionStats,
} from './types';
export type {
  AccessibilityCommandParams,
  AICommandParams,
  BlockCommandParams,
  BuiltInCommands,
  CommandContextValidator,
  // Pattern matching types
  CommandPattern,
  // Context types
  ContextualCommandProvider,
  FormatCommandParams,
  MindmapCommandParams,
  // Command-specific types
  NavigationCommandParams,
  PageCommandParams,
  PatternMatch,
  PatternMatcher,
  SystemCommandParams,
  TextCommandParams,
  VoiceCommandBuilder,
  VoiceCommandExecutor,
  VoiceCommandMatch,
  WorkspaceCommandParams,
} from './types/commands';
export type {
  AudioProcessorInterface,
  ProviderHealthMonitor,
  ProviderRequirements,
  ProviderSelectionStrategy,
  ProviderStatus,
  SpeechRecognitionError,
  // Provider types
  SpeechRecognitionProvider,
  SpeechRecognitionProviderConfig,
  SpeechRecognitionProviderInterface,
  SpeechRecognitionResult,
  SpeechSynthesisProvider,
  SpeechSynthesisProviderConfig,
  SpeechSynthesisProviderInterface,
  SynthesisOptions,
  SynthesisResult,
  VoiceInfo,
  WakeWordProvider,
  WakeWordProviderConfig,
  WakeWordProviderInterface,
} from './types/providers';

// ============================================================================
// Utilities and Helpers
// ============================================================================

/**
 * Voice Control Module Metadata
 */
export const VOICE_CONTROL_MODULE = {
  name: 'voice-control',
  version: '1.0.0-alpha',
  description: 'Voice-controlled navigation and interaction for AFFiNE',
  author: 'Conscious Creators Club',
  features: [
    'Speech recognition with multiple provider support',
    'Natural language command processing',
    'Context-aware navigation',
    'AI-powered command suggestions',
    'Multi-modal interaction support',
    'Accessibility compliance',
    'Real-time voice feedback',
    'Custom command registration',
  ],
  supportedLanguages: [
    'en-US',
    'en-GB',
    'en-AU',
    'en-CA',
    'es-ES',
    'es-MX',
    'es-US',
    'fr-FR',
    'fr-CA',
    'de-DE',
    'it-IT',
    'pt-BR',
    'pt-PT',
    'zh-CN',
    'zh-TW',
    'ja-JP',
    'ko-KR',
  ],
  providers: {
    speechRecognition: ['web-speech-api', 'azure-speech', 'google-cloud'],
    speechSynthesis: ['web-speech-api', 'azure-speech', 'elevenlabs'],
    wakeWord: ['picovoice', 'custom'],
  },
} as const;

/**
 * Default voice control configuration
 */
export const DEFAULT_VOICE_CONFIG = {
  recognition: {
    language: 'en-US',
    continuous: true,
    interimResults: true,
    maxAlternatives: 3,
    confidenceThreshold: 0.7,
    wakeWord: 'hey affine',
    commandTimeout: 10000,
  },
  feedback: {
    audioEnabled: true,
    visualEnabled: true,
    speechRate: 1.0,
    speechPitch: 1.0,
    speechVolume: 0.8,
  },
  enabledCategories: [
    'navigation',
    'document',
    'ai',
    'workspace',
    'system',
  ] as const,
  debug: false,
} as const;

/**
 * Voice control feature flags and environment variables
 */
export const VOICE_FEATURE_FLAGS = {
  ENABLED: 'ENABLE_VOICE_CONTROL',
  DEBUG: 'VOICE_DEBUG',
  WAKE_WORD: 'VOICE_WAKE_WORD',
  PROVIDER: 'VOICE_PROVIDER',
  API_KEY: 'VOICE_API_KEY',
  REGION: 'VOICE_REGION',
} as const;

/**
 * Voice control error codes
 */
export const VOICE_ERROR_CODES = {
  INITIALIZATION_FAILED: 'VOICE_INIT_FAILED',
  PERMISSION_DENIED: 'VOICE_PERMISSION_DENIED',
  NOT_SUPPORTED: 'VOICE_NOT_SUPPORTED',
  RECOGNITION_FAILED: 'VOICE_RECOGNITION_FAILED',
  SYNTHESIS_FAILED: 'VOICE_SYNTHESIS_FAILED',
  COMMAND_NOT_FOUND: 'VOICE_COMMAND_NOT_FOUND',
  COMMAND_EXECUTION_FAILED: 'VOICE_COMMAND_EXEC_FAILED',
  PROVIDER_ERROR: 'VOICE_PROVIDER_ERROR',
  NETWORK_ERROR: 'VOICE_NETWORK_ERROR',
  TIMEOUT: 'VOICE_TIMEOUT',
} as const;

// ============================================================================
// Development Utilities
// ============================================================================

/**
 * Check if voice control is supported in the current environment
 */
export function isVoiceControlSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for basic Web Speech API support
  const hasWebSpeechAPI =
    'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  const hasAudioContext =
    'AudioContext' in window || 'webkitAudioContext' in window;
  const hasMediaDevices =
    'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

  return hasWebSpeechAPI && hasAudioContext && hasMediaDevices;
}

/**
 * Get voice control capabilities of the current environment
 */
export function getVoiceCapabilities(): {
  speechRecognition: boolean;
  speechSynthesis: boolean;
  mediaDevices: boolean;
  audioContext: boolean;
  wakeWordDetection: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      speechRecognition: false,
      speechSynthesis: false,
      mediaDevices: false,
      audioContext: false,
      wakeWordDetection: false,
    };
  }

  return {
    speechRecognition:
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
    mediaDevices:
      'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    audioContext: 'AudioContext' in window || 'webkitAudioContext' in window,
    wakeWordDetection: false, // Requires additional libraries
  };
}

/**
 * Create a voice control configuration with environment variable overrides
 */
export function createVoiceConfig(
  overrides?: Partial<typeof DEFAULT_VOICE_CONFIG>
): any {
  const envOverrides: Partial<typeof DEFAULT_VOICE_CONFIG> = {};

  // Override with environment variables if available
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[VOICE_FEATURE_FLAGS.WAKE_WORD]) {
      (envOverrides as any).recognition = {
        ...DEFAULT_VOICE_CONFIG.recognition,
        wakeWord: process.env[VOICE_FEATURE_FLAGS.WAKE_WORD],
      };
    }

    if (process.env[VOICE_FEATURE_FLAGS.DEBUG] === 'true') {
      (envOverrides as any).debug = true;
    }
  }

  return {
    ...DEFAULT_VOICE_CONFIG,
    ...envOverrides,
    ...overrides,
  };
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

// Re-export everything from types for easy access
export * from './types';
export * from './types/commands';
export * from './types/providers';

// ============================================================================
// AFFiNE DI Framework Integration
// ============================================================================

import type { Framework } from '@toeverything/infra';

import { VoiceProviderFactory as VoiceProviderFactoryClass } from './providers/provider-factory';
import { WebSpeechProvider as WebSpeechProviderClass } from './providers/web-speech.provider';
import { VoiceCommandRegistry as VoiceCommandRegistryClass } from './services/voice-command-registry.service';
import { VoiceControlService as VoiceControlServiceClass } from './services/voice-control.service';
import { VoiceFeedbackService as VoiceFeedbackServiceClass } from './services/voice-feedback.service';
import { VoiceNavigationService as VoiceNavigationServiceClass } from './services/voice-navigation.service';

/**
 * Configures the Voice Control module with the AFFiNE DI framework
 *
 * This function registers all voice control services, providers, and dependencies
 * with the dependency injection framework. It ensures proper initialization order
 * and manages service lifecycle.
 *
 * @param framework - The AFFiNE framework instance
 *
 * @example
 * ```typescript
 * import { configureVoiceControlModule } from '@affine/core/modules/voice-control';
 *
 * export function configureAppModules(framework: Framework) {
 *   // Configure other modules...
 *   configureVoiceControlModule(framework);
 * }
 * ```
 *
 * @remarks
 * Service dependencies and initialization order:
 * 1. VoiceCommandRegistry: No dependencies (standalone)
 * 2. VoiceProviderFactory: No dependencies (standalone)
 * 3. WebSpeechProvider: No dependencies (standalone)
 * 4. VoiceFeedbackService: No dependencies (standalone)
 * 5. VoiceNavigationService: No dependencies (standalone)
 * 6. VoiceControlService: Depends on all above services (orchestrator)
 *
 * Team Credits:
 * - VoiceControlService: Warp (601 lines) - Main orchestration
 * - VoiceCommandRegistry: Codex (321 lines) - Command matching
 * - VoiceNavigationService: Codex (200 lines) - Navigation context
 * - VoiceFeedbackService: Codex (200 lines) - User feedback
 * - WebSpeechProvider: Claude (435 lines) - Speech API integration
 * - VoiceProviderFactory: Claude (350 lines) - Provider management
 * - Test Suite: Claude (3400+ lines) - Comprehensive testing
 */
export function configureVoiceControlModule(framework: Framework) {
  framework
    // Register command registry (no dependencies)
    .service(VoiceCommandRegistryClass)

    // Register provider factory
    .service(VoiceProviderFactoryClass)

    // Register Web Speech provider
    .service(WebSpeechProviderClass)

    // Register feedback service
    .service(VoiceFeedbackServiceClass)

    // Register navigation service
    .service(VoiceNavigationServiceClass)

    // Register main voice control service (depends on command registry, navigation, and feedback)
    .service(VoiceControlServiceClass, [
      VoiceCommandRegistryClass,
      VoiceNavigationServiceClass,
      VoiceFeedbackServiceClass,
    ]);
}
