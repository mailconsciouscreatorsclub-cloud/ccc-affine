import { useService } from '@toeverything/infra';
import { useEffect, useMemo, useState } from 'react';

import { VoiceControlService } from '../../services/voice-control.service';
import { VoiceNavigationService } from '../../services/voice-navigation.service';
import type {
  VoiceCommand,
  VoiceControlEvents,
  VoiceControlState,
  VoiceNavigationContext,
} from '../../types';

export type VoiceControlPhase = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceCommandHistoryEntry {
  id: string;
  label: string;
  success: boolean;
  timestamp: number;
  message?: string;
}

export interface VoiceIndicatorViewState {
  phase: VoiceControlPhase;
  transcript?: string;
  confidence?: number;
  error?: string;
}

export interface VoiceStatusBarViewState {
  isActive: boolean;
  isListening: boolean;
  phase: VoiceControlPhase;
  lastCommand?: string;
  lastCommandSuccess?: boolean;
  microphoneLevel?: number;
  language: string;
}

export interface VoiceControlUIState {
  indicator: VoiceIndicatorViewState;
  statusBar: VoiceStatusBarViewState;
  commands: VoiceCommand[];
  recentCommands: VoiceCommandHistoryEntry[];
  context: VoiceNavigationContext;
}

interface InternalState {
  phase: VoiceControlPhase;
  isActive: boolean;
  isListening: boolean;
  isProcessing: boolean;
  transcript?: string;
  confidence?: number;
  error?: string;
  lastCommand?: string;
  lastCommandSuccess?: boolean;
  lastCommandMessage?: string;
  microphoneLevel?: number;
  language: string;
  commands: VoiceCommand[];
  recentCommands: VoiceCommandHistoryEntry[];
  context: VoiceNavigationContext;
}

const defaultContext: VoiceNavigationContext = {
  workspace: null,
  document: null,
  currentView: 'unknown',
  activeElement: undefined,
  navigationHistory: [],
  sidebarOpen: false,
};

const derivePhase = (state: Pick<InternalState, 'isListening' | 'isProcessing' | 'error'>): VoiceControlPhase => {
  if (state.error) {
    return 'error';
  }
  if (state.isProcessing) {
    return 'processing';
  }
  if (state.isListening) {
    return 'listening';
  }
  return 'idle';
};

const mapHistoryEntry = (
  commandId: string,
  label: string,
  success: boolean,
  message?: string,
): VoiceCommandHistoryEntry => ({
  id: commandId,
  label,
  success,
  message,
  timestamp: Date.now(),
});

const HISTORY_LIMIT = 6;

export const useVoiceControlUIState = (): VoiceControlUIState => {
  const voiceControl = useService(VoiceControlService);
  const navigationService = useService(VoiceNavigationService);

  const [state, setState] = useState<InternalState>(() => {
    const controlState: VoiceControlState = voiceControl.getState();
    const config = voiceControl.getConfig();
    let context: VoiceNavigationContext = defaultContext;
    try {
      context = navigationService.getCurrentContext();
    } catch (error) {
      console.warn('[voice-control] Unable to read navigation context', error);
    }

    const phase = derivePhase({
      isListening: controlState.isListening,
      isProcessing: controlState.isProcessing,
      error: controlState.error,
    });

    return {
      phase,
      isActive: controlState.isActive,
      isListening: controlState.isListening,
      isProcessing: controlState.isProcessing,
      transcript: controlState.lastRecognizedText,
      confidence: undefined,
      error: controlState.error,
      lastCommand: undefined,
      lastCommandSuccess: undefined,
      lastCommandMessage: undefined,
      microphoneLevel: undefined,
      language: config.recognition.language,
      commands: voiceControl.getCommands(),
      recentCommands: [],
      context,
    };
  });

  useEffect(() => {
    const handleEvent = <K extends keyof VoiceControlEvents>(
      event: K,
      handler: (payload: VoiceControlEvents[K]) => void,
    ) => {
      voiceControl.on(event, handler);
      return () => voiceControl.off(event, handler);
    };

    const cleaners: Array<() => void> = [];

    cleaners.push(
      handleEvent('voice:started', () => {
        setState(prev => {
          const next = { ...prev, isActive: true, error: undefined };
          next.phase = derivePhase(next);
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:stopped', () => {
        setState(prev => {
          const next = {
            ...prev,
            isActive: false,
            isListening: false,
            isProcessing: false,
            error: undefined,
          };
          next.phase = derivePhase(next);
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:listening:start', () => {
        setState(prev => {
          const next = {
            ...prev,
            isListening: true,
            error: undefined,
          };
          next.phase = derivePhase(next);
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:listening:stop', () => {
        setState(prev => {
          const next = {
            ...prev,
            isListening: false,
          };
          next.phase = derivePhase(next);
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:recognition', result => {
        setState(prev => {
          const next = {
            ...prev,
            transcript: result.transcript,
            confidence: result.confidence,
            microphoneLevel: result.confidence,
          };
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:command:matched', ({ command }) => {
        setState(prev => {
          const next = {
            ...prev,
            isProcessing: true,
            lastCommand: command.trigger,
            lastCommandSuccess: undefined,
            lastCommandMessage: undefined,
          };
          next.phase = derivePhase(next);
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:command:executed', ({ command, result }) => {
        setState(prev => {
          const historyEntry = mapHistoryEntry(
            command.id,
            command.trigger,
            result.success,
            result.message,
          );
          const recentCommands = [historyEntry, ...prev.recentCommands].slice(
            0,
            HISTORY_LIMIT,
          );
          const next = {
            ...prev,
            isProcessing: false,
            error: undefined,
            lastCommand: command.trigger,
            lastCommandSuccess: result.success,
            lastCommandMessage: result.message,
            recentCommands,
          };
          next.phase = derivePhase(next);
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:command:failed', ({ command, error }) => {
        setState(prev => {
          const label = command?.trigger ?? 'Unknown command';
          const historyEntry = mapHistoryEntry(
            command?.id ?? `failed-${Date.now()}`,
            label,
            false,
            error,
          );
          const recentCommands = [historyEntry, ...prev.recentCommands].slice(
            0,
            HISTORY_LIMIT,
          );
          const next = {
            ...prev,
            isProcessing: false,
            error,
            lastCommand: label,
            lastCommandSuccess: false,
            lastCommandMessage: error,
            recentCommands,
          };
          next.phase = derivePhase(next);
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:error', ({ error }) => {
        setState(prev => {
          const next = {
            ...prev,
            error,
            isProcessing: false,
          };
          next.phase = derivePhase(next);
          return next;
        });
      }),
    );

    cleaners.push(
      handleEvent('voice:feedback', feedback => {
        if (!feedback) {
          return;
        }
        setState(prev => ({
          ...prev,
          confidence:
            typeof feedback.duration === 'number'
              ? Math.min(1, Math.max(0, 1 - feedback.duration / 5000))
              : prev.confidence,
        }));
      }),
    );

    return () => {
      for (const clean of cleaners) {
        try {
          clean();
        } catch (error) {
          console.error('[voice-control] failed to remove listener', error);
        }
      }
    };
  }, [voiceControl]);

  useEffect(() => {
    const applyContext = (context: VoiceNavigationContext) => {
      setState(prev => ({ ...prev, context }));
    };
    const unsubscribe = navigationService.onContextChange(applyContext);
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigationService]);

  useEffect(() => {
    const updateCommands = () => {
      setState(prev => ({ ...prev, commands: voiceControl.getCommands() }));
    };
    updateCommands();
    const unsubscribe = voiceControl.onCommandsChanged(updateCommands);
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [voiceControl]);

  const derived = useMemo<VoiceControlUIState>(() => {
    const indicator: VoiceIndicatorViewState = {
      phase: state.phase,
      transcript: state.transcript,
      confidence: state.confidence,
      error: state.error,
    };

    const statusBar: VoiceStatusBarViewState = {
      isActive: state.isActive,
      isListening: state.isListening,
      phase: state.phase,
      lastCommand: state.lastCommand,
      lastCommandSuccess: state.lastCommandSuccess,
      microphoneLevel: state.microphoneLevel,
      language: state.language,
    };

    return {
      indicator,
      statusBar,
      commands: state.commands,
      recentCommands: state.recentCommands,
      context: state.context,
    };
  }, [state]);

  return derived;
};
