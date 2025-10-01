/**
 * Provider Factory - Creates and configures voice providers
 *
 * This factory handles provider selection, configuration, and fallback logic
 * for speech recognition and synthesis providers.
 */

import type {
  ProviderRequirements,
  ProviderSelectionStrategy,
  ProviderStatus,
  SpeechRecognitionProvider,
  SpeechRecognitionProviderConfig,
  SpeechRecognitionProviderInterface,
  SpeechSynthesisProvider,
  SpeechSynthesisProviderConfig,
  SpeechSynthesisProviderInterface} from '../types/providers';
import { WebSpeechProvider, WebSpeechRecognitionProvider, WebSpeechSynthesisProvider } from './web-speech.provider';

// ============================================================================
// Provider Registry
// ============================================================================

interface ProviderInfo {
  name: string;
  displayName: string;
  description: string;
  isCloudBased: boolean;
  requiresApiKey: boolean;
  supportedLanguages: string[];
  features: {
    recognition?: boolean;
    synthesis?: boolean;
    wakeWordDetection?: boolean;
    streaming?: boolean;
    customVoices?: boolean;
  };
}

const PROVIDER_REGISTRY: Record<SpeechRecognitionProvider | SpeechSynthesisProvider, ProviderInfo> = {
  'web-speech-api': {
    name: 'web-speech-api',
    displayName: 'Web Speech API',
    description: 'Browser native speech processing (offline)',
    isCloudBased: false,
    requiresApiKey: false,
    supportedLanguages: ['*'], // Supports many languages
    features: {
      recognition: true,
      synthesis: true,
      wakeWordDetection: false,
      streaming: true,
      customVoices: false
    }
  },
  'azure-speech': {
    name: 'azure-speech',
    displayName: 'Azure Speech Services',
    description: 'Microsoft Azure Cognitive Services (high accuracy)',
    isCloudBased: true,
    requiresApiKey: true,
    supportedLanguages: ['*'],
    features: {
      recognition: true,
      synthesis: true,
      wakeWordDetection: true,
      streaming: true,
      customVoices: true
    }
  },
  'google-cloud': {
    name: 'google-cloud',
    displayName: 'Google Cloud Speech',
    description: 'Google Cloud Speech-to-Text and Text-to-Speech',
    isCloudBased: true,
    requiresApiKey: true,
    supportedLanguages: ['*'],
    features: {
      recognition: true,
      synthesis: true,
      wakeWordDetection: false,
      streaming: true,
      customVoices: true
    }
  },
  'amazon-transcribe': {
    name: 'amazon-transcribe',
    displayName: 'Amazon Transcribe',
    description: 'AWS speech recognition service',
    isCloudBased: true,
    requiresApiKey: true,
    supportedLanguages: ['*'],
    features: {
      recognition: true,
      synthesis: false,
      wakeWordDetection: false,
      streaming: true,
      customVoices: false
    }
  },
  'amazon-polly': {
    name: 'amazon-polly',
    displayName: 'Amazon Polly',
    description: 'AWS text-to-speech service',
    isCloudBased: true,
    requiresApiKey: true,
    supportedLanguages: ['*'],
    features: {
      recognition: false,
      synthesis: true,
      wakeWordDetection: false,
      streaming: false,
      customVoices: true
    }
  },
  'elevenlabs': {
    name: 'elevenlabs',
    displayName: 'ElevenLabs',
    description: 'Premium AI voice synthesis',
    isCloudBased: true,
    requiresApiKey: true,
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'hi'],
    features: {
      recognition: false,
      synthesis: true,
      wakeWordDetection: false,
      streaming: false,
      customVoices: true
    }
  }
};

// ============================================================================
// Provider Factory
// ============================================================================

export class VoiceProviderFactory {
  private static instance: VoiceProviderFactory;
  private readonly recognitionProviders = new Map<SpeechRecognitionProvider, () => SpeechRecognitionProviderInterface>();
  private readonly synthesisProviders = new Map<SpeechSynthesisProvider, () => SpeechSynthesisProviderInterface>();

  private constructor() {
    this.registerProviders();
  }

  static getInstance(): VoiceProviderFactory {
    if (!VoiceProviderFactory.instance) {
      VoiceProviderFactory.instance = new VoiceProviderFactory();
    }
    return VoiceProviderFactory.instance;
  }

  private registerProviders(): void {
    // Register speech recognition providers
    this.recognitionProviders.set('web-speech-api', () => new WebSpeechRecognitionProvider());

    // Note: Cloud providers would be registered here when implemented
    // this.recognitionProviders.set('azure-speech', () => new AzureSpeechRecognitionProvider());
    // this.recognitionProviders.set('google-cloud', () => new GoogleCloudSpeechProvider());
    // this.recognitionProviders.set('amazon-transcribe', () => new AmazonTranscribeProvider());

    // Register speech synthesis providers
    this.synthesisProviders.set('web-speech-api', () => new WebSpeechSynthesisProvider());

    // Note: Cloud providers would be registered here when implemented
    // this.synthesisProviders.set('azure-speech', () => new AzureSpeechSynthesisProvider());
    // this.synthesisProviders.set('google-cloud', () => new GoogleCloudTTSProvider());
    // this.synthesisProviders.set('amazon-polly', () => new AmazonPollyProvider());
    // this.synthesisProviders.set('elevenlabs', () => new ElevenLabsProvider());
  }

  // ============================================================================
  // Provider Creation
  // ============================================================================

  createRecognitionProvider(provider: SpeechRecognitionProvider): SpeechRecognitionProviderInterface {
    const providerFactory = this.recognitionProviders.get(provider);
    if (!providerFactory) {
      throw new Error(`Speech recognition provider '${provider}' is not available`);
    }
    return providerFactory();
  }

  createSynthesisProvider(provider: SpeechSynthesisProvider): SpeechSynthesisProviderInterface {
    const providerFactory = this.synthesisProviders.get(provider);
    if (!providerFactory) {
      throw new Error(`Speech synthesis provider '${provider}' is not available`);
    }
    return providerFactory();
  }

  createWebSpeechProvider(): WebSpeechProvider {
    return new WebSpeechProvider();
  }

  // ============================================================================
  // Provider Selection
  // ============================================================================

  /**
   * Select the best speech recognition provider based on requirements
   */
  selectRecognitionProvider(
    requirements: ProviderRequirements,
    strategy: ProviderSelectionStrategy = 'auto'
  ): SpeechRecognitionProvider {
    const availableProviders = this.getAvailableRecognitionProviders();

    switch (strategy) {
      case 'prefer-offline':
        return this.selectOfflineFirstProvider(availableProviders, requirements) || 'web-speech-api';

      case 'prefer-cloud':
        return this.selectCloudFirstProvider(availableProviders, requirements) || 'web-speech-api';

      case 'best-accuracy':
        return this.selectBestAccuracyProvider(availableProviders, requirements) || 'web-speech-api';

      case 'fastest':
        return this.selectFastestProvider(availableProviders, requirements) || 'web-speech-api';

      case 'auto':
      default:
        return this.selectAutoProvider(availableProviders, requirements);
    }
  }

  /**
   * Select the best speech synthesis provider based on requirements
   */
  selectSynthesisProvider(
    requirements: ProviderRequirements,
    strategy: ProviderSelectionStrategy = 'auto'
  ): SpeechSynthesisProvider {
    const availableProviders = this.getAvailableSynthesisProviders();

    switch (strategy) {
      case 'prefer-offline':
        return this.selectOfflineFirstSynthesisProvider(availableProviders, requirements) || 'web-speech-api';

      case 'prefer-cloud':
        return this.selectCloudFirstSynthesisProvider(availableProviders, requirements) || 'web-speech-api';

      case 'best-quality':
        return this.selectBestQualityProvider(availableProviders, requirements) || 'web-speech-api';

      case 'auto':
      default:
        return this.selectAutoSynthesisProvider(availableProviders, requirements);
    }
  }

  // ============================================================================
  // Provider Availability
  // ============================================================================

  getAvailableRecognitionProviders(): SpeechRecognitionProvider[] {
    const available: SpeechRecognitionProvider[] = [];

    // Check Web Speech API availability
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      available.push('web-speech-api');
    }

    // Cloud providers would be checked here based on configuration
    // This would involve checking API keys, network connectivity, etc.

    return available;
  }

  getAvailableSynthesisProviders(): SpeechSynthesisProvider[] {
    const available: SpeechSynthesisProvider[] = [];

    // Check Web Speech Synthesis API availability
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      available.push('web-speech-api');
    }

    // Cloud providers would be checked here

    return available;
  }

  /**
   * Get provider information
   */
  getProviderInfo(provider: SpeechRecognitionProvider | SpeechSynthesisProvider): ProviderInfo {
    return PROVIDER_REGISTRY[provider];
  }

  /**
   * Get provider status (available, requires setup, etc.)
   */
  async getProviderStatus(provider: SpeechRecognitionProvider | SpeechSynthesisProvider): Promise<ProviderStatus> {
    const info = this.getProviderInfo(provider);

    if (provider === 'web-speech-api') {
      const webProvider = new WebSpeechProvider();
      const capabilities = webProvider.getCapabilities();

      return {
        provider,
        available: capabilities.recognition || capabilities.synthesis,
        requiresSetup: false,
        setupInstructions: [],
        capabilities,
        lastChecked: Date.now()
      };
    }

    // For cloud providers, we would check API keys, network, etc.
    return {
      provider,
      available: false,
      requiresSetup: true,
      setupInstructions: [`Configure API key for ${info.displayName}`],
      capabilities: {
        recognition: info.features.recognition || false,
        synthesis: info.features.synthesis || false,
        wakeWordDetection: info.features.wakeWordDetection || false
      },
      lastChecked: Date.now()
    };
  }

  // ============================================================================
  // Provider Selection Logic
  // ============================================================================

  private selectProviderByCloudPreference<T extends SpeechRecognitionProvider | SpeechSynthesisProvider>(
    providers: T[],
    preferCloud: boolean,
  ): T | null {
    const match = providers.find(provider => PROVIDER_REGISTRY[provider].isCloudBased === preferCloud);
    return match ?? providers[0] ?? null;
  }

  private selectOfflineFirstProvider(
    providers: SpeechRecognitionProvider[],
    requirements: ProviderRequirements
  ): SpeechRecognitionProvider | null {
    return this.selectProviderByCloudPreference(providers, false);
  }

  private selectCloudFirstProvider(
    providers: SpeechRecognitionProvider[],
    requirements: ProviderRequirements
  ): SpeechRecognitionProvider | null {
    return this.selectProviderByCloudPreference(providers, true);
  }

  private selectBestAccuracyProvider(
    providers: SpeechRecognitionProvider[],
    requirements: ProviderRequirements
  ): SpeechRecognitionProvider | null {
    // For recognition, typically: Azure > Google Cloud > Amazon > Web Speech API
    const accuracyOrder: SpeechRecognitionProvider[] = ['azure-speech', 'google-cloud', 'amazon-transcribe', 'web-speech-api'];

    for (const preferred of accuracyOrder) {
      if (providers.includes(preferred)) {
        return preferred;
      }
    }

    return providers[0] || null;
  }

  private selectFastestProvider(
    providers: SpeechRecognitionProvider[],
    requirements: ProviderRequirements
  ): SpeechRecognitionProvider | null {
    // For speed, offline is typically faster due to no network latency
    return this.selectOfflineFirstProvider(providers, requirements);
  }

  private selectAutoProvider(
    providers: SpeechRecognitionProvider[],
    requirements: ProviderRequirements
  ): SpeechRecognitionProvider {
    // Auto selection logic:
    // 1. If offline is available and no specific accuracy requirements, use offline
    // 2. If high accuracy is required and cloud is available, use cloud
    // 3. Otherwise use first available

    if (requirements.preferOffline && providers.includes('web-speech-api')) {
      return 'web-speech-api';
    }

    if (requirements.highAccuracy) {
      const cloudProvider = providers.find(p => PROVIDER_REGISTRY[p].isCloudBased);
      if (cloudProvider) return cloudProvider;
    }

    return providers[0] || 'web-speech-api';
  }

  private selectOfflineFirstSynthesisProvider(
    providers: SpeechSynthesisProvider[],
    requirements: ProviderRequirements
  ): SpeechSynthesisProvider | null {
    return this.selectProviderByCloudPreference(providers, false);
  }

  private selectCloudFirstSynthesisProvider(
    providers: SpeechSynthesisProvider[],
    requirements: ProviderRequirements
  ): SpeechSynthesisProvider | null {
    return this.selectProviderByCloudPreference(providers, true);
  }

  private selectBestQualityProvider(
    providers: SpeechSynthesisProvider[],
    requirements: ProviderRequirements
  ): SpeechSynthesisProvider | null {
    // For synthesis quality: ElevenLabs > Azure > Google Cloud > Amazon Polly > Web Speech API
    const qualityOrder: SpeechSynthesisProvider[] = ['elevenlabs', 'azure-speech', 'google-cloud', 'amazon-polly', 'web-speech-api'];

    for (const preferred of qualityOrder) {
      if (providers.includes(preferred)) {
        return preferred;
      }
    }

    return providers[0] || null;
  }

  private selectAutoSynthesisProvider(
    providers: SpeechSynthesisProvider[],
    requirements: ProviderRequirements
  ): SpeechSynthesisProvider {
    if (requirements.preferOffline && providers.includes('web-speech-api')) {
      return 'web-speech-api';
    }

    if (requirements.highQuality) {
      const qualityProvider = this.selectBestQualityProvider(providers, requirements);
      if (qualityProvider) return qualityProvider;
    }

    return providers[0] || 'web-speech-api';
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a provider factory instance
 */
export function createProviderFactory(): VoiceProviderFactory {
  return VoiceProviderFactory.getInstance();
}

/**
 * Quick provider creation functions
 */
export function createWebSpeechProvider(): WebSpeechProvider {
  return new WebSpeechProvider();
}

export function createRecognitionProvider(provider: SpeechRecognitionProvider): SpeechRecognitionProviderInterface {
  return VoiceProviderFactory.getInstance().createRecognitionProvider(provider);
}

export function createSynthesisProvider(provider: SpeechSynthesisProvider): SpeechSynthesisProviderInterface {
  return VoiceProviderFactory.getInstance().createSynthesisProvider(provider);
}

// Export default factory instance
export default VoiceProviderFactory;