/**
 * Web Speech API Provider - Browser native speech recognition and synthesis
 *
 * This provider implements both speech recognition and synthesis using the
 * browser's native Web Speech API, providing offline voice processing
 * with zero external dependencies.
 */

import type {
  SpeechRecognitionError,
  SpeechRecognitionProviderConfig,
  SpeechRecognitionProviderInterface,
  SpeechRecognitionResult,
  SpeechSynthesisProviderConfig,
  SpeechSynthesisProviderInterface,
  SynthesisOptions,
  SynthesisResult,
  VoiceInfo
} from '../types/providers';

// ============================================================================
// Web Speech Recognition Provider
// ============================================================================

export class WebSpeechRecognitionProvider implements SpeechRecognitionProviderInterface {
  private recognition?: SpeechRecognition;
  private config?: SpeechRecognitionProviderConfig;
  private isInitialized = false;
  private isRecognizing = false;
  private resultCallback?: (result: SpeechRecognitionResult) => void;
  private errorCallback?: (error: SpeechRecognitionError) => void;

  async initialize(config: SpeechRecognitionProviderConfig): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Web Speech API is not available in this browser');
    }

    this.config = config;

    // Create SpeechRecognition instance (handle vendor prefixes)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configure recognition settings
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;
    this.recognition.lang = config.options?.language || 'en-US';

    // Set up event handlers
    this.setupEventHandlers();

    this.isInitialized = true;
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.debug('[WebSpeechProvider] Recognition started');
    };

    this.recognition.onend = () => {
      console.debug('[WebSpeechProvider] Recognition ended');
      this.isRecognizing = false;
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!this.resultCallback) return;

      // Process recognition results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0];

        const speechResult: SpeechRecognitionResult = {
          text: alternative.transcript,
          confidence: alternative.confidence || 0.5,
          isFinal: result.isFinal,
          alternatives: Array.from(result)
            .slice(1, 3) // Get up to 2 additional alternatives
            .map(alt => ({
              text: alt.transcript,
              confidence: alt.confidence || 0.5
            })),
          timestamp: Date.now(),
          metadata: {
            resultIndex: i,
            provider: 'web-speech-api'
          }
        };

        this.resultCallback(speechResult);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!this.errorCallback) return;

      const error: SpeechRecognitionError = {
        code: this.mapErrorCode(event.error),
        message: this.getErrorMessage(event.error),
        details: {
          originalError: event.error,
          provider: 'web-speech-api'
        }
      };

      this.errorCallback(error);
    };

    this.recognition.onnomatch = () => {
      if (this.errorCallback) {
        this.errorCallback({
          code: 'NO_MATCH',
          message: 'No speech was recognized',
          details: { provider: 'web-speech-api' }
        });
      }
    };
  }

  async startRecognition(): Promise<void> {
    if (!this.isInitialized || !this.recognition) {
      throw new Error('Provider not initialized');
    }

    if (this.isRecognizing) {
      console.warn('[WebSpeechProvider] Recognition already in progress');
      return;
    }

    try {
      this.recognition.start();
      this.isRecognizing = true;
    } catch (error) {
      throw new Error(`Failed to start recognition: ${error.message}`);
    }
  }

  async stopRecognition(): Promise<void> {
    if (!this.recognition || !this.isRecognizing) {
      return;
    }

    try {
      this.recognition.stop();
      this.isRecognizing = false;
    } catch (error) {
      console.error('[WebSpeechProvider] Error stopping recognition:', error);
    }
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' &&
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  getSupportedLanguages(): string[] {
    // Web Speech API supports a wide range of languages
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN', 'en-NZ', 'en-ZA',
      'es-ES', 'es-MX', 'es-US', 'es-AR', 'es-CO', 'es-CL',
      'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH',
      'de-DE', 'de-AT', 'de-CH',
      'it-IT', 'it-CH',
      'pt-BR', 'pt-PT',
      'zh-CN', 'zh-TW', 'zh-HK',
      'ja-JP',
      'ko-KR',
      'ru-RU',
      'ar-SA', 'ar-EG',
      'hi-IN',
      'th-TH',
      'vi-VN',
      'tr-TR',
      'pl-PL',
      'nl-NL', 'nl-BE',
      'sv-SE',
      'da-DK',
      'no-NO',
      'fi-FI',
      'cs-CZ',
      'hu-HU',
      'el-GR',
      'he-IL',
      'id-ID',
      'ms-MY'
    ];
  }

  setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }

  onResult(callback: (result: SpeechRecognitionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: SpeechRecognitionError) => void): void {
    this.errorCallback = callback;
  }

  async cleanup(): Promise<void> {
    await this.stopRecognition();
    this.recognition = undefined;
    this.resultCallback = undefined;
    this.errorCallback = undefined;
    this.isInitialized = false;
  }

  private mapErrorCode(browserError: string): string {
    const errorMap: Record<string, string> = {
      'no-speech': 'NO_SPEECH',
      'aborted': 'ABORTED',
      'audio-capture': 'AUDIO_CAPTURE_FAILED',
      'network': 'NETWORK_ERROR',
      'not-allowed': 'PERMISSION_DENIED',
      'service-not-allowed': 'SERVICE_NOT_ALLOWED',
      'bad-grammar': 'BAD_GRAMMAR',
      'language-not-supported': 'LANGUAGE_NOT_SUPPORTED'
    };

    return errorMap[browserError] || 'UNKNOWN_ERROR';
  }

  private getErrorMessage(browserError: string): string {
    const messageMap: Record<string, string> = {
      'no-speech': 'No speech was detected',
      'aborted': 'Speech recognition was aborted',
      'audio-capture': 'Failed to capture audio from microphone',
      'network': 'Network error occurred during recognition',
      'not-allowed': 'Microphone permission denied',
      'service-not-allowed': 'Speech recognition service not allowed',
      'bad-grammar': 'Invalid grammar specified',
      'language-not-supported': 'Language not supported by this browser'
    };

    return messageMap[browserError] || `Unknown speech recognition error: ${browserError}`;
  }
}

// ============================================================================
// Web Speech Synthesis Provider
// ============================================================================

export class WebSpeechSynthesisProvider implements SpeechSynthesisProviderInterface {
  private config?: SpeechSynthesisProviderConfig;
  private isInitialized = false;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private selectedVoice?: SpeechSynthesisVoice;

  async initialize(config: SpeechSynthesisProviderConfig): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Web Speech Synthesis API is not available in this browser');
    }

    this.config = config;

    // Wait for voices to be loaded
    await this.loadVoices();

    // Select default voice based on config
    this.selectVoice(config.voice);

    this.isInitialized = true;
  }

  private async loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      // Voices might already be available
      this.availableVoices = speechSynthesis.getVoices();

      if (this.availableVoices.length > 0) {
        resolve();
        return;
      }

      // Wait for voices to be loaded
      const handleVoicesChanged = () => {
        this.availableVoices = speechSynthesis.getVoices();
        if (this.availableVoices.length > 0) {
          speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          resolve();
        }
      };

      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

      // Fallback timeout
      setTimeout(() => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
        resolve();
      }, 3000);
    });
  }

  private selectVoice(voiceConfig?: SpeechSynthesisProviderConfig['voice']): void {
    if (!voiceConfig) {
      // Use default voice (first available)
      this.selectedVoice = this.availableVoices[0];
      return;
    }

    // Find voice by name, language, or gender preference
    const matchingVoice = this.availableVoices.find(voice => {
      if (voiceConfig.name && voice.name === voiceConfig.name) return true;
      if (voiceConfig.language && voice.lang.startsWith(voiceConfig.language)) return true;
      return false;
    });

    this.selectedVoice = matchingVoice || this.availableVoices[0];
  }

  async speak(text: string, options?: SynthesisOptions): Promise<SynthesisResult> {
    if (!this.isInitialized) {
      throw new Error('Provider not initialized');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Configure utterance
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.rate = options?.rate || this.config?.audio?.rate || 1.0;
      utterance.pitch = options?.pitch || this.config?.audio?.pitch || 1.0;
      utterance.volume = options?.volume || this.config?.audio?.volume || 1.0;

      // Set up event handlers
      utterance.onstart = () => {
        console.debug('[WebSpeechProvider] Speech synthesis started');
      };

      utterance.onend = () => {
        console.debug('[WebSpeechProvider] Speech synthesis completed');
        resolve({
          success: true,
          text,
          duration: 0, // Web Speech API doesn't provide duration
          audioData: undefined, // No audio data available
          metadata: {
            voice: this.selectedVoice?.name,
            language: this.selectedVoice?.lang,
            provider: 'web-speech-api'
          }
        });
      };

      utterance.onerror = (event) => {
        console.error('[WebSpeechProvider] Speech synthesis error:', event.error);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      // Start speaking
      speechSynthesis.speak(utterance);
    });
  }

  async stop(): Promise<void> {
    speechSynthesis.cancel();
  }

  async pause(): Promise<void> {
    speechSynthesis.pause();
  }

  async resume(): Promise<void> {
    speechSynthesis.resume();
  }

  isAvailable(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  getAvailableVoices(): VoiceInfo[] {
    return this.availableVoices.map(voice => ({
      id: voice.name,
      name: voice.name,
      language: voice.lang,
      gender: this.guessVoiceGender(voice.name),
      isLocal: voice.localService,
      isDefault: voice.default,
      styles: [], // Web Speech API doesn't support styles
      metadata: {
        voiceURI: voice.voiceURI,
        provider: 'web-speech-api'
      }
    }));
  }

  async setVoice(voiceId: string): Promise<void> {
    const voice = this.availableVoices.find(v => v.name === voiceId);
    if (!voice) {
      throw new Error(`Voice not found: ${voiceId}`);
    }
    this.selectedVoice = voice;
  }

  async cleanup(): Promise<void> {
    await this.stop();
    this.selectedVoice = undefined;
    this.availableVoices = [];
    this.isInitialized = false;
  }

  private guessVoiceGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const name = voiceName.toLowerCase();

    // Common patterns for identifying voice gender
    const malePatterns = ['male', 'man', 'masculine', 'alex', 'daniel', 'jorge', 'luca', 'thomas', 'aaron', 'fred'];
    const femalePatterns = ['female', 'woman', 'feminine', 'alice', 'allison', 'ava', 'bella', 'emily', 'fiona', 'karen', 'marie', 'nora', 'samantha', 'sara', 'tessa', 'victoria', 'zoe'];

    if (malePatterns.some(pattern => name.includes(pattern))) {
      return 'male';
    }

    if (femalePatterns.some(pattern => name.includes(pattern))) {
      return 'female';
    }

    return 'neutral';
  }
}

// ============================================================================
// Combined Web Speech Provider
// ============================================================================

/**
 * Combined Web Speech Provider - Provides both recognition and synthesis
 * This is the main class that VoiceControlService will use
 */
export class WebSpeechProvider {
  public readonly recognition: WebSpeechRecognitionProvider;
  public readonly synthesis: WebSpeechSynthesisProvider;

  constructor() {
    this.recognition = new WebSpeechRecognitionProvider();
    this.synthesis = new WebSpeechSynthesisProvider();
  }

  /**
   * Check if both recognition and synthesis are available
   */
  isFullySupported(): boolean {
    return this.recognition.isAvailable() && this.synthesis.isAvailable();
  }

  /**
   * Get provider capabilities
   */
  getCapabilities(): {
    recognition: boolean;
    synthesis: boolean;
    wakeWordDetection: boolean;
  } {
    return {
      recognition: this.recognition.isAvailable(),
      synthesis: this.synthesis.isAvailable(),
      wakeWordDetection: false // Web Speech API doesn't support wake word detection
    };
  }

  /**
   * Initialize both recognition and synthesis
   */
  async initialize(recognitionConfig: SpeechRecognitionProviderConfig, synthesisConfig: SpeechSynthesisProviderConfig): Promise<void> {
    await Promise.all([
      this.recognition.initialize(recognitionConfig),
      this.synthesis.initialize(synthesisConfig)
    ]);
  }

  /**
   * Clean up both providers
   */
  async cleanup(): Promise<void> {
    await Promise.all([
      this.recognition.cleanup(),
      this.synthesis.cleanup()
    ]);
  }
}

// Export default instance
export default WebSpeechProvider;