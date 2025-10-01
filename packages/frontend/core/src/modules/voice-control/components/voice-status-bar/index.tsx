import clsx from 'clsx';
import { useId, useMemo } from 'react';

import type { VoiceControlPhase } from '../hooks/use-voice-ui-state';
import { useVoiceControlUIState } from '../hooks/use-voice-ui-state';
import * as styles from './index.css';

export interface VoiceStatusBarProps {
  phase: VoiceControlPhase;
  isActive: boolean;
  isListening: boolean;
  lastCommand?: string;
  lastCommandSuccess?: boolean;
  microphoneLevel?: number;
  language?: string;
  onToggle?: () => void;
  onOpenSettings?: () => void;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const phaseDescriptions: Record<VoiceControlPhase, string> = {
  idle: 'Voice control is ready',
  listening: 'Listening for your commands',
  processing: 'Analyzing the latest command',
  error: 'Voice control needs attention',
};

const phaseAction: Record<VoiceControlPhase, string> = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing',
  error: 'Error',
};

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} aria-hidden="true">
    <path
      d="M19.14 12.94a7.184 7.184 0 0 0 .05-.94 7.184 7.184 0 0 0-.05-.94l2.03-1.58a.48.48 0 0 0 .12-.61l-1.92-3.32a.48.48 0 0 0-.58-.22l-2.39.96a6.9 6.9 0 0 0-1.62-.94L14.5 2.5a.48.48 0 0 0-.47-.38h-3.06a.48.48 0 0 0-.47.38l-.36 2.41a6.9 6.9 0 0 0-1.62.94l-2.39-.96a.48.48 0 0 0-.58.22L3.83 8.05a.48.48 0 0 0 .12.61L6 10.24c-.03.31-.05.62-.05.94s.02.63.05.94l-2.03 1.58a.48.48 0 0 0-.12.61l1.92 3.32a.48.48 0 0 0 .58.22l2.39-.96c.5.39 1.05.71 1.62.94l.36 2.41c.06.22.25.38.47.38h3.06c.23 0 .42-.16.47-.38l.36-2.41c.57-.23 1.12-.55 1.62-.94l2.39.96a.48.48 0 0 0 .58-.22l1.92-3.32a.48.48 0 0 0-.12-.61Zm-7.14 2.56a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
      fill="currentColor"
    />
  </svg>
);

export const VoiceStatusBar = ({
  phase,
  isActive,
  isListening,
  lastCommand,
  lastCommandSuccess,
  microphoneLevel,
  language,
  onToggle,
  onOpenSettings,
}: VoiceStatusBarProps) => {
  const meterValue = clamp(microphoneLevel ?? (isListening ? 0.25 : 0));
  const microphonePercent = Math.round(meterValue * 100);
  const phaseLabel = phaseAction[phase];
  const phaseDescription = phaseDescriptions[phase];
  const languageLabel = language ?? 'Auto';
  const statusSummaryId = useId();

  const statusText = useMemo(() => {
    if (!lastCommand) {
      return 'No voice commands yet';
    }
    if (lastCommandSuccess === undefined) {
      return `Current command: ${lastCommand}`;
    }
    return `${lastCommandSuccess ? 'Last command succeeded:' : 'Last command failed:'} ${lastCommand}`;
  }, [lastCommand, lastCommandSuccess]);

  const toggleLabel = isActive ? 'Pause voice control' : 'Resume voice control';
  const statusBadgeLabel = `Voice control ${isActive ? 'active' : 'paused'}. Language ${languageLabel}.`;
  const toggleDisabled = !onToggle;
  const settingsDisabled = !onOpenSettings;

  return (
    <div
      className={styles.container}
      role="status"
      aria-live={phase === 'error' ? 'assertive' : 'polite'}
      aria-describedby={statusSummaryId}
      data-phase={phase}
    >
      <span className={styles.srOnly} id={statusSummaryId}>
        {phaseDescription}. {statusText}. Microphone level {microphonePercent} percent.
      </span>

      <div className={styles.stateIndicator}>
        <span className={styles.stateLabel}>{phaseLabel}</span>
        <span className={styles.subLabel}>{phaseDescription}</span>
      </div>

      <div className={styles.infoColumn}>
        <div
          className={styles.microphoneMeter}
          role="meter"
          aria-label="Microphone input level"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={microphonePercent}
          aria-valuetext={`${microphonePercent}% input level`}
          data-phase={phase}
        >
          <span
            className={clsx(styles.microphoneFill, {
              [styles.microphoneInactive]: !isListening,
            })}
            style={{ transform: `scaleX(${meterValue})` }}
          />
        </div>
        <span className={styles.lastCommand} title={statusText} aria-live="polite">
          {statusText}
        </span>
        <span className={styles.statusBadge} aria-label={statusBadgeLabel} title={statusBadgeLabel}>
          Language: {languageLabel} • {isActive ? 'Active' : 'Paused'}
        </span>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          data-active={isActive}
          aria-pressed={isActive}
          aria-label={toggleLabel}
          disabled={toggleDisabled}
        >
          {toggleLabel}
        </button>
        <button
          type="button"
          className={styles.settings}
          onClick={onOpenSettings}
          aria-label="Open voice control settings"
          disabled={settingsDisabled}
        >
          <SettingsIcon />
        </button>
      </div>
    </div>
  );
};

export interface VoiceStatusBarConnectedProps
  extends Omit<VoiceStatusBarProps, 'phase' | 'isActive' | 'isListening' | 'lastCommand' | 'lastCommandSuccess' | 'microphoneLevel' | 'language'> {}

export const VoiceStatusBarConnected = ({ onToggle, onOpenSettings }: VoiceStatusBarConnectedProps) => {
  const { statusBar } = useVoiceControlUIState();

  return (
    <VoiceStatusBar
      phase={statusBar.phase}
      isActive={statusBar.isActive}
      isListening={statusBar.isListening}
      lastCommand={statusBar.lastCommand}
      lastCommandSuccess={statusBar.lastCommandSuccess}
      microphoneLevel={statusBar.microphoneLevel}
      language={statusBar.language}
      onToggle={onToggle}
      onOpenSettings={onOpenSettings}
    />
  );
};
