/**
 * Voice Provider Types - External service integrations for speech recognition and synthesis
 */

// ============================================================================
// Speech Recognition Providers
// ============================================================================

export type SpeechRecognitionProvider = 'web-speech-api' | 'azure-speech' | 'google-cloud' | 'amazon-transcribe';

export interface SpeechRecognitionProviderConfig {
  /** Provider type */
  provider: SpeechRecognitionProvider;
  /** API endpoint (for cloud providers) */
  endpoint?: string;
  /** API key or credentials */
  credentials?: {
    apiKey?: string;
    region?: string;
    subscriptionKey?: string;
    accessToken?: string;
  };
  /** Provider-specific options */
  options?: Record<string, any>;
}

export interface SpeechRecognitionProviderInterface {
  /** Initialize the provider */
  initialize(config: SpeechRecognitionProviderConfig): Promise<void>;
  /** Start recognition */
  startRecognition(): Promise<void>;
  /** Stop recognition */
  stopRecognition(): Promise<void>;
  /** Check if provider is available */
  isAvailable(): boolean;
  /** Get supported languages */
  getSupportedLanguages(): string[];
  /** Set recognition language */
  setLanguage(language: string): void;
  /** Subscribe to recognition events */
  onResult(callback: (result: SpeechRecognitionResult) => void): void;
  /** Subscribe to error events */
  onError(callback: (error: SpeechRecognitionError) => void): void;
  /** Clean up resources */
  cleanup(): Promise<void>;
}

export interface SpeechRecognitionResult {
  /** Recognized text */
  text: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether this is the final result */
  isFinal: boolean;
  /** Alternative transcriptions */
  alternatives?: Array<{
    text: string;
    confidence: number;
  }>;
  /** Recognition timestamp */
  timestamp: number;
  /** Provider-specific metadata */
  metadata?: Record<string, any>;
}

export interface SpeechRecognitionError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Provider-specific error details */
  details?: any;
}

// ============================================================================
// Speech Synthesis Providers
// ============================================================================

export type SpeechSynthesisProvider = 'web-speech-api' | 'azure-speech' | 'google-cloud' | 'amazon-polly' | 'elevenlabs';

export interface SpeechSynthesisProviderConfig {
  /** Provider type */
  provider: SpeechSynthesisProvider;
  /** API endpoint (for cloud providers) */
  endpoint?: string;
  /** API key or credentials */
  credentials?: {
    apiKey?: string;
    region?: string;
    subscriptionKey?: string;
    accessToken?: string;
  };
  /** Default voice settings */
  voice?: {
    name?: string;
    language?: string;
    gender?: 'male' | 'female' | 'neutral';
    style?: string;
  };
  /** Audio settings */
  audio?: {
    format?: string;
    sampleRate?: number;
    bitRate?: number;
  };
}

export interface SpeechSynthesisProviderInterface {
  /** Initialize the provider */
  initialize(config: SpeechSynthesisProviderConfig): Promise<void>;
  /** Synthesize text to speech */
  synthesize(text: string, options?: SynthesisOptions): Promise<SynthesisResult>;
  /** Get available voices */
  getVoices(): Promise<VoiceInfo[]>;
  /** Check if provider is available */
  isAvailable(): boolean;
  /** Clean up resources */
  cleanup(): Promise<void>;
}

export interface SynthesisOptions {
  /** Voice to use */
  voice?: string;
  /** Speech rate (0.1-10) */
  rate?: number;
  /** Speech pitch (0-2) */
  pitch?: number;
  /** Speech volume (0-1) */
  volume?: number;
  /** Speech style/emotion */
  style?: string;
  /** Audio format */
  format?: string;
}

export interface SynthesisResult {
  /** Audio data (blob or URL) */
  audio: Blob | string;
  /** Text that was synthesized */
  text: string;
  /** Synthesis duration (ms) */
  duration: number;
  /** Provider-specific metadata */
  metadata?: Record<string, any>;
}

export interface VoiceInfo {
  /** Voice identifier */
  id: string;
  /** Display name */
  name: string;
  /** Language code */
  language: string;
  /** Voice gender */
  gender: 'male' | 'female' | 'neutral';
  /** Voice styles available */
  styles?: string[];
  /** Whether voice is premium/paid */
  premium?: boolean;
}

// ============================================================================
// Wake Word Detection
// ============================================================================

export type WakeWordProvider = 'picovoice' | 'snowboy' | 'mozilla-deepspeech' | 'custom';

export interface WakeWordProviderConfig {
  /** Provider type */
  provider: WakeWordProvider;
  /** Wake word(s) to detect */
  wakeWords: string[];
  /** Sensitivity threshold (0-1) */
  sensitivity: number;
  /** Model files or configuration */
  models?: {
    [wakeWord: string]: string | Uint8Array;
  };
  /** Provider-specific options */
  options?: Record<string, any>;
}

export interface WakeWordProviderInterface {
  /** Initialize the provider */
  initialize(config: WakeWordProviderConfig): Promise<void>;
  /** Start wake word detection */
  start(): Promise<void>;
  /** Stop wake word detection */
  stop(): Promise<void>;
  /** Check if provider is available */
  isAvailable(): boolean;
  /** Subscribe to wake word events */
  onWakeWord(callback: (wakeWord: string) => void): void;
  /** Clean up resources */
  cleanup(): Promise<void>;
}

// ============================================================================
// Audio Processing
// ============================================================================

export interface AudioProcessorInterface {
  /** Initialize audio processing */
  initialize(): Promise<void>;
  /** Start audio capture */
  startCapture(): Promise<MediaStream>;
  /** Stop audio capture */
  stopCapture(): Promise<void>;
  /** Apply noise suppression */
  suppressNoise(enabled: boolean): void;
  /** Apply echo cancellation */
  cancelEcho(enabled: boolean): void;
  /** Set gain level */
  setGain(level: number): void;
  /** Get audio level */
  getAudioLevel(): number;
  /** Check microphone permissions */
  checkPermissions(): Promise<boolean>;
  /** Request microphone permissions */
  requestPermissions(): Promise<boolean>;
}

// ============================================================================
// Provider Factory
// ============================================================================

export interface VoiceProviderFactory {
  /** Create speech recognition provider */
  createSpeechRecognition(
    provider: SpeechRecognitionProvider,
    config: SpeechRecognitionProviderConfig
  ): Promise<SpeechRecognitionProviderInterface>;
  
  /** Create speech synthesis provider */
  createSpeechSynthesis(
    provider: SpeechSynthesisProvider,
    config: SpeechSynthesisProviderConfig
  ): Promise<SpeechSynthesisProviderInterface>;
  
  /** Create wake word detection provider */
  createWakeWordDetection(
    provider: WakeWordProvider,
    config: WakeWordProviderConfig
  ): Promise<WakeWordProviderInterface>;
  
  /** Create audio processor */
  createAudioProcessor(): Promise<AudioProcessorInterface>;
  
  /** Get available providers */
  getAvailableProviders(): {
    speechRecognition: SpeechRecognitionProvider[];
    speechSynthesis: SpeechSynthesisProvider[];
    wakeWord: WakeWordProvider[];
  };
}

// ============================================================================
// Provider Selection Strategy
// ============================================================================

export interface ProviderSelectionStrategy {
  /** Select best speech recognition provider */
  selectSpeechRecognition(
    available: SpeechRecognitionProvider[],
    requirements?: ProviderRequirements
  ): SpeechRecognitionProvider | null;
  
  /** Select best speech synthesis provider */
  selectSpeechSynthesis(
    available: SpeechSynthesisProvider[],
    requirements?: ProviderRequirements
  ): SpeechSynthesisProvider | null;
  
  /** Select best wake word provider */
  selectWakeWordProvider(
    available: WakeWordProvider[],
    requirements?: ProviderRequirements
  ): WakeWordProvider | null;
}

export interface ProviderRequirements {
  /** Required languages */
  languages?: string[];
  /** Offline capability required */
  offline?: boolean;
  /** Maximum latency (ms) */
  maxLatency?: number;
  /** Minimum accuracy */
  minAccuracy?: number;
  /** Cost constraints */
  cost?: 'free' | 'low' | 'medium' | 'high';
  /** Privacy requirements */
  privacy?: 'local' | 'cloud-encrypted' | 'any';
}

// ============================================================================
// Provider Health Monitoring
// ============================================================================

export interface ProviderHealthMonitor {
  /** Monitor provider health */
  monitor(): void;
  /** Get provider status */
  getStatus(): ProviderStatus;
  /** Subscribe to status changes */
  onStatusChange(callback: (status: ProviderStatus) => void): void;
  /** Stop monitoring */
  stop(): void;
}

export interface ProviderStatus {
  /** Recognition provider status */
  recognition: {
    provider: SpeechRecognitionProvider;
    status: 'healthy' | 'degraded' | 'error';
    latency?: number;
    accuracy?: number;
    error?: string;
  };
  
  /** Synthesis provider status */
  synthesis: {
    provider: SpeechSynthesisProvider;
    status: 'healthy' | 'degraded' | 'error';
    latency?: number;
    error?: string;
  };
  
  /** Wake word provider status */
  wakeWord?: {
    provider: WakeWordProvider;
    status: 'healthy' | 'degraded' | 'error';
    error?: string;
  };
  
  /** Overall system status */
  overall: 'healthy' | 'degraded' | 'error';
}