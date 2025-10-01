/**
 * Voice Control System - Type Definitions
 * Core types for the voice-controlled AI navigation system
 */

// ============================================================================
// Voice Recognition Types
// ============================================================================

export interface VoiceRecognitionConfig {
  /** Language for speech recognition (default: 'en-US') */
  language: string;
  /** Enable continuous recognition mode */
  continuous: boolean;
  /** Return interim results during recognition */
  interimResults: boolean;
  /** Maximum number of alternative transcriptions */
  maxAlternatives: number;
  /** Confidence threshold for accepting commands (0-1) */
  confidenceThreshold: number;
  /** Wake word to activate voice commands */
  wakeWord?: string;
  /** Timeout for voice command completion (ms) */
  commandTimeout: number;
}

export interface VoiceRecognitionResult {
  /** Recognized text */
  transcript: string;
  /** Confidence level (0-1) */
  confidence: number;
  /** Whether this is a final result */
  isFinal: boolean;
  /** Alternative transcriptions */
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
  /** Timestamp of recognition */
  timestamp: number;
}

// ============================================================================
// Voice Command Types
// ============================================================================

export interface VoiceCommand {
  /** Unique identifier for the command */
  id: string;
  /** Primary trigger phrase */
  trigger: string;
  /** Alternative phrases that trigger this command */
  aliases: string[];
  /** Human-readable description */
  description: string;
  /** Command category for organization */
  category: VoiceCommandCategory;
  /** Parameters that can be extracted from speech */
  parameters?: VoiceCommandParameter[];
  /** Context requirements for command execution */
  context?: VoiceCommandContext;
  /** Whether command requires confirmation */
  requiresConfirmation?: boolean;
  /** Command execution handler */
  handler: VoiceCommandHandler;
}

export type VoiceCommandCategory = 
  | 'navigation'
  | 'document'
  | 'ai'
  | 'workspace'
  | 'system'
  | 'accessibility';

export interface VoiceCommandParameter {
  /** Parameter name */
  name: string;
  /** Parameter type */
  type: 'string' | 'number' | 'boolean' | 'enum';
  /** Whether parameter is required */
  required: boolean;
  /** Default value if not provided */
  defaultValue?: any;
  /** Possible values for enum type */
  enumValues?: string[];
  /** Regular expression for validation */
  pattern?: string;
}

export interface VoiceCommandContext {
  /** Required UI context */
  requiredView?: string;
  /** Required workspace state */
  requiredWorkspace?: string;
  /** Required document state */
  requiredDocument?: string;
  /** Excluded contexts where command is not available */
  excludedContexts?: string[];
}

export type VoiceCommandHandler = (
  params: VoiceCommandParameters,
  context: VoiceNavigationContext
) => Promise<VoiceCommandResult>;

export interface VoiceCommandParameters {
  /** Original voice input */
  originalInput: string;
  /** Extracted parameters */
  parameters: Record<string, any>;
  /** Recognition confidence */
  confidence: number;
}

export interface VoiceCommandResult {
  /** Whether command executed successfully */
  success: boolean;
  /** Result message for user feedback */
  message?: string;
  /** Follow-up actions to perform */
  actions?: VoiceAction[];
  /** Data to be used by subsequent commands */
  data?: any;
}

// ============================================================================
// Voice Navigation Types
// ============================================================================

export interface VoiceNavigationContext {
  /** Current workspace information */
  workspace: {
    id: string;
    name: string;
  } | null;
  /** Current document/page information */
  document: {
    id: string;
    title: string;
    type: string;
  } | null;
  /** Current UI view/route */
  currentView: string;
  /** Active UI element */
  activeElement?: string;
  /** User navigation history */
  navigationHistory: string[];
  /** Current sidebar state */
  sidebarOpen: boolean;
}

export interface VoiceAction {
  /** Type of action to perform */
  type: 'navigate' | 'execute' | 'speak' | 'highlight' | 'confirm';
  /** Target for the action */
  target?: string;
  /** Payload data for the action */
  payload?: any;
  /** Delay before executing action (ms) */
  delay?: number;
}

// ============================================================================
// Voice Feedback Types
// ============================================================================

export interface VoiceFeedbackConfig {
  /** Enable audio feedback */
  audioEnabled: boolean;
  /** Enable visual feedback */
  visualEnabled: boolean;
  /** Speech synthesis voice */
  voice?: string;
  /** Speech rate (0.1-10) */
  speechRate: number;
  /** Speech pitch (0-2) */
  speechPitch: number;
  /** Speech volume (0-1) */
  speechVolume: number;
}

export interface VoiceFeedback {
  /** Text to be spoken */
  text: string;
  /** Feedback type for styling */
  type: 'success' | 'error' | 'info' | 'warning';
  /** Duration to display visual feedback (ms) */
  duration?: number;
  /** Whether to interrupt current speech */
  interrupt?: boolean;
}

// ============================================================================
// Voice Session Types
// ============================================================================

export interface VoiceSession {
  /** Unique session identifier */
  id: string;
  /** Session start time */
  startTime: number;
  /** Session end time */
  endTime?: number;
  /** Commands executed in this session */
  commands: VoiceCommandExecution[];
  /** Session context */
  context: VoiceNavigationContext;
  /** Session statistics */
  stats: VoiceSessionStats;
}

export interface VoiceCommandExecution {
  /** Command that was executed */
  command: VoiceCommand;
  /** Parameters used */
  parameters: VoiceCommandParameters;
  /** Execution result */
  result: VoiceCommandResult;
  /** Execution timestamp */
  timestamp: number;
  /** Execution duration (ms) */
  duration: number;
}

export interface VoiceSessionStats {
  /** Total commands executed */
  totalCommands: number;
  /** Successful command executions */
  successfulCommands: number;
  /** Failed command executions */
  failedCommands: number;
  /** Average confidence score */
  averageConfidence: number;
  /** Total session duration (ms) */
  totalDuration: number;
}

// ============================================================================
// Service Configuration Types
// ============================================================================

export interface VoiceControlConfig {
  /** Recognition configuration */
  recognition: VoiceRecognitionConfig;
  /** Feedback configuration */
  feedback: VoiceFeedbackConfig;
  /** Enabled command categories */
  enabledCategories: VoiceCommandCategory[];
  /** Custom command definitions */
  customCommands?: VoiceCommand[];
  /** Debug mode settings */
  debug: boolean;
}

export interface VoiceControlState {
  /** Whether voice control is active */
  isActive: boolean;
  /** Whether currently listening for commands */
  isListening: boolean;
  /** Whether processing a command */
  isProcessing: boolean;
  /** Current voice session */
  currentSession?: VoiceSession;
  /** Last recognized text */
  lastRecognizedText?: string;
  /** Current error state */
  error?: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface VoiceControlEvents {
  /** Voice control system started */
  'voice:started': void;
  /** Voice control system stopped */
  'voice:stopped': void;
  /** Started listening for voice input */
  'voice:listening:start': void;
  /** Stopped listening for voice input */
  'voice:listening:stop': void;
  /** Voice recognition result received */
  'voice:recognition': VoiceRecognitionResult;
  /** Voice command matched and about to execute */
  'voice:command:matched': { command: VoiceCommand; parameters: VoiceCommandParameters };
  /** Voice command execution completed */
  'voice:command:executed': { command: VoiceCommand; result: VoiceCommandResult };
  /** Voice command execution failed */
  'voice:command:failed': { command?: VoiceCommand; error: string };
  /** Feedback provided to user */
  'voice:feedback': VoiceFeedback;
  /** Voice control error occurred */
  'voice:error': { error: string; context?: any };
}

// ============================================================================
// Utility Types
// ============================================================================

export type VoiceEventListener<K extends keyof VoiceControlEvents> = (
  event: VoiceControlEvents[K]
) => void;

export type VoiceEventHandler<K extends keyof VoiceControlEvents> = (
  event: VoiceControlEvents[K]
) => Promise<void> | void;

// Re-export for convenience
export * from './commands';
export * from './providers';