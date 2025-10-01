/**
 * Voice Control Providers - Speech recognition and synthesis implementations
 *
 * This module provides various speech providers including Web Speech API,
 * Azure Speech Services, Google Cloud Speech, Amazon services, and ElevenLabs.
 */

// ============================================================================
// Core Provider Exports
// ============================================================================

export {
  createProviderFactory,
  createRecognitionProvider,
  createSynthesisProvider,
  createWebSpeechProvider,
  VoiceProviderFactory} from './provider-factory';
export {
  WebSpeechProvider,
  WebSpeechRecognitionProvider,
  WebSpeechSynthesisProvider
} from './web-speech.provider';

// ============================================================================
// Type Re-exports for Convenience
// ============================================================================

export type {
  AudioProcessorInterface,
  ProviderHealthMonitor,
  ProviderRequirements,
  ProviderSelectionStrategy,
  ProviderStatus,
  SpeechRecognitionError,
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
  VoiceProviderFactory as VoiceProviderFactoryType,
  WakeWordProvider,
  WakeWordProviderConfig,
  WakeWordProviderInterface} from '../types/providers';

// ============================================================================
// Default Exports
// ============================================================================

export { default as VoiceProviderFactoryDefault } from './provider-factory';
export { default as WebSpeechProviderDefault } from './web-speech.provider';