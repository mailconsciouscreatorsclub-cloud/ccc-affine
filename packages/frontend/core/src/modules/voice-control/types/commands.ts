/**
 * Voice Command Types - Specific command definitions and interfaces
 */

import type {
  VoiceCommand,
  VoiceCommandHandler,
  VoiceCommandParameters,
  VoiceCommandResult,
  VoiceNavigationContext
} from './index';

// ============================================================================
// Navigation Commands
// ============================================================================

export interface NavigationCommandParams {
  target: string;
  mode?: 'focus' | 'open' | 'switch';
}

export interface WorkspaceCommandParams {
  workspaceName?: string;
  workspaceId?: string;
  action: 'open' | 'create' | 'switch' | 'list';
}

export interface PageCommandParams {
  pageTitle?: string;
  pageId?: string;
  action: 'open' | 'create' | 'search' | 'delete' | 'duplicate';
}

// ============================================================================
// Document Commands
// ============================================================================

export interface TextCommandParams {
  text: string;
  position?: 'current' | 'end' | 'beginning';
  format?: 'plain' | 'heading1' | 'heading2' | 'heading3' | 'bold' | 'italic';
}

export interface BlockCommandParams {
  blockType: 'text' | 'heading' | 'list' | 'code' | 'quote' | 'image' | 'table';
  content?: string;
  properties?: Record<string, any>;
}

export interface FormatCommandParams {
  operation: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';
  target?: 'selection' | 'word' | 'paragraph';
  value?: string; // For link URLs, etc.
}

// ============================================================================
// AI Commands
// ============================================================================

export interface AICommandParams {
  action: 'chat' | 'summarize' | 'translate' | 'explain' | 'improve' | 'brainstorm';
  input?: string;
  language?: string; // For translation
  context?: 'page' | 'selection' | 'workspace';
  options?: {
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    format?: 'text' | 'list' | 'outline';
  };
}

export interface MindmapCommandParams {
  topic: string;
  action: 'create' | 'expand' | 'edit';
  nodeId?: string;
}

// ============================================================================
// System Commands
// ============================================================================

export interface SystemCommandParams {
  action: 'help' | 'settings' | 'shortcuts' | 'about' | 'feedback';
  category?: string;
}

export interface AccessibilityCommandParams {
  feature: 'narrator' | 'zoom' | 'contrast' | 'focus' | 'navigation';
  action: 'enable' | 'disable' | 'toggle';
  value?: number; // For zoom level, etc.
}

// ============================================================================
// Command Builders
// ============================================================================

export interface VoiceCommandBuilder {
  /** Set command ID */
  id(id: string): VoiceCommandBuilder;
  /** Set primary trigger phrase */
  trigger(phrase: string): VoiceCommandBuilder;
  /** Add alternative trigger phrases */
  alias(...phrases: string[]): VoiceCommandBuilder;
  /** Set command description */
  description(desc: string): VoiceCommandBuilder;
  /** Set command category */
  category(cat: VoiceCommand['category']): VoiceCommandBuilder;
  /** Add parameter definition */
  parameter(param: VoiceCommand['parameters'][0]): VoiceCommandBuilder;
  /** Set context requirements */
  context(ctx: VoiceCommand['context']): VoiceCommandBuilder;
  /** Require confirmation before execution */
  requireConfirmation(): VoiceCommandBuilder;
  /** Set command handler */
  handler(fn: VoiceCommandHandler): VoiceCommandBuilder;
  /** Build the final command */
  build(): VoiceCommand;
}

// ============================================================================
// Command Registry Types
// ============================================================================

export interface VoiceCommandRegistry {
  /** Register a new command */
  register(command: VoiceCommand): void;
  /** Unregister a command */
  unregister(commandId: string): void;
  /** Get all registered commands */
  getAllCommands(): VoiceCommand[];
  /** Get commands by category */
  getCommandsByCategory(category: VoiceCommand['category']): VoiceCommand[];
  /** Find matching commands for input text */
  findMatchingCommands(input: string): VoiceCommandMatch[];
  /** Get command by ID */
  getCommand(id: string): VoiceCommand | undefined;
}

export interface VoiceCommandMatch {
  /** Matched command */
  command: VoiceCommand;
  /** Match confidence (0-1) */
  confidence: number;
  /** Extracted parameters */
  parameters: Record<string, any>;
  /** Matching score details */
  score: {
    triggerMatch: number;
    parameterMatch: number;
    contextMatch: number;
  };
}

// ============================================================================
// Command Execution Types
// ============================================================================

export interface VoiceCommandExecutor {
  /** Execute a command with parameters */
  execute(
    command: VoiceCommand,
    parameters: VoiceCommandParameters,
    context: VoiceNavigationContext
  ): Promise<VoiceCommandResult>;
  /** Check if command can be executed in current context */
  canExecute(command: VoiceCommand, context: VoiceNavigationContext): boolean;
  /** Get execution history */
  getHistory(): VoiceCommand['id'][];
}

// ============================================================================
// Built-in Command Categories
// ============================================================================

export interface BuiltInCommands {
  navigation: {
    openSidebar: VoiceCommand;
    closeSidebar: VoiceCommand;
    openWorkspace: VoiceCommand;
    createPage: VoiceCommand;
    searchPages: VoiceCommand;
    goBack: VoiceCommand;
    goForward: VoiceCommand;
    goHome: VoiceCommand;
  };
  document: {
    insertText: VoiceCommand;
    formatText: VoiceCommand;
    insertBlock: VoiceCommand;
    deleteBlock: VoiceCommand;
    selectAll: VoiceCommand;
    undo: VoiceCommand;
    redo: VoiceCommand;
  };
  ai: {
    askAI: VoiceCommand;
    summarizePage: VoiceCommand;
    translateText: VoiceCommand;
    improveWriting: VoiceCommand;
    createMindmap: VoiceCommand;
    explainCode: VoiceCommand;
  };
  system: {
    showHelp: VoiceCommand;
    openSettings: VoiceCommand;
    toggleVoiceControl: VoiceCommand;
    showShortcuts: VoiceCommand;
  };
}

// ============================================================================
// Command Pattern Matching
// ============================================================================

export interface CommandPattern {
  /** Pattern template with placeholders */
  template: string;
  /** Named capture groups */
  captures: Record<string, {
    type: 'string' | 'number' | 'enum';
    required: boolean;
    options?: string[];
  }>;
  /** Pattern weight for prioritization */
  weight: number;
}

export interface PatternMatcher {
  /** Add a pattern for command matching */
  addPattern(commandId: string, pattern: CommandPattern): void;
  /** Match input against all patterns */
  match(input: string): PatternMatch[];
  /** Remove pattern */
  removePattern(commandId: string, patternIndex?: number): void;
}

export interface PatternMatch {
  /** Command ID that matched */
  commandId: string;
  /** Matched pattern */
  pattern: CommandPattern;
  /** Extracted captures */
  captures: Record<string, any>;
  /** Match confidence */
  confidence: number;
}

// ============================================================================
// Context-Aware Command Types
// ============================================================================

export interface ContextualCommandProvider {
  /** Get commands available in current context */
  getAvailableCommands(context: VoiceNavigationContext): VoiceCommand[];
  /** Get context-specific help text */
  getContextHelp(context: VoiceNavigationContext): string;
  /** Check if context supports voice commands */
  supportsVoiceCommands(context: VoiceNavigationContext): boolean;
}

export interface CommandContextValidator {
  /** Validate if command can execute in context */
  validate(command: VoiceCommand, context: VoiceNavigationContext): {
    valid: boolean;
    reason?: string;
    suggestions?: string[];
  };
}