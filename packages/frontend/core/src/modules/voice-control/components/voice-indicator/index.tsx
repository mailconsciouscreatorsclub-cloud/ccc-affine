import clsx from 'clsx';
import { useCallback, useId, useMemo, useState } from 'react';

import { useVoiceControlUIState } from '../hooks/use-voice-ui-state';
import * as styles from './index.css';

export type VoiceIndicatorState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceIndicatorProps {
  state: VoiceIndicatorState;
  confidence?: number;
  transcript?: string;
  error?: string;
  position?: 'bottom-right' | 'top-right' | 'bottom-left' | 'top-left';
  ariaLabel?: string;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onToggle?: () => void;
}

const stateLabels: Record<VoiceIndicatorState, string> = {
  idle: 'Voice control is idle',
  listening: 'Voice control is listening',
  processing: 'Voice control is processing a command',
  error: 'Voice control encountered an error',
};

const stateAccent: Record<VoiceIndicatorState, string> = {
  idle: 'Idle',
  listening: 'Listening…',
  processing: 'Processing…',
  error: 'Needs attention',
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const MicrophoneIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    role="img"
    aria-hidden="true"
  >
    <path
      d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V22h2v-3.08A7 7 0 0 0 19 12h-2Z"
      fill="currentColor"
    />
  </svg>
);

export const VoiceIndicator = ({
  state,
  confidence,
  transcript,
  error,
  position = 'bottom-right',
  ariaLabel,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onToggle,
}: VoiceIndicatorProps) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const panelId = useId();
  const messageId = useId();

  const isControlled = expanded !== undefined;
  const derivedExpanded = isControlled ? expanded : internalExpanded;

  const trimmedTranscript = transcript?.trim();
  const errorMessage = error?.trim();
  const hasTranscript = Boolean(trimmedTranscript);
  const hasError = Boolean(errorMessage);
  const hasSupplementalInfo = hasTranscript || hasError;

  const handleToggleExpanded = useCallback(() => {
    const next = !derivedExpanded;
    if (!isControlled) {
      setInternalExpanded(next);
    }
    onExpandedChange?.(next);
  }, [derivedExpanded, isControlled, onExpandedChange]);

  const handleIndicatorClick = useCallback(() => {
    onToggle?.();
    if (hasSupplementalInfo) {
      handleToggleExpanded();
    }
  }, [handleToggleExpanded, hasSupplementalInfo, onToggle]);

  const confidencePercent = useMemo(() => {
    if (typeof confidence !== 'number') return undefined;
    return Math.round(clamp(confidence) * 100);
  }, [confidence]);

  const toggleLabel = derivedExpanded
    ? hasTranscript
      ? 'Hide transcript preview'
      : 'Hide voice details'
    : hasTranscript
      ? 'Show transcript preview'
      : 'Show voice details';

  const computedAriaLabel =
    ariaLabel ?? (hasError && errorMessage ? `${stateLabels[state]}: ${errorMessage}` : stateLabels[state]);

  return (
    <div
      className={clsx(styles.container, styles.containerPosition[position])}
      role="status"
      aria-live={state === 'error' ? 'assertive' : 'polite'}
      aria-label={computedAriaLabel}
      aria-busy={state === 'processing'}
      aria-describedby={messageId}
      data-state={state}
    >
      <span className={styles.srOnly} id={messageId}>
        {stateLabels[state]}
        {hasError && errorMessage ? `. ${errorMessage}` : ''}
        {hasTranscript ? '. Transcript preview available.' : ''}
      </span>
      <div className={styles.indicatorWrapper}>
        <button
          type="button"
          className={styles.indicatorButton}
          data-state={state}
          onClick={handleIndicatorClick}
          aria-controls={hasSupplementalInfo ? panelId : undefined}
          aria-expanded={hasSupplementalInfo ? derivedExpanded : undefined}
        >
          <MicrophoneIcon className={styles.icon} />
          <span className={styles.pulse} aria-hidden="true" />
          <span className={styles.processingSpinner} aria-hidden="true" />
          <span className={styles.statusBadge} aria-hidden="true" />
        </button>
        {hasSupplementalInfo && derivedExpanded ? (
          <div
            className={styles.transcriptPanel}
            data-state={state}
            id={panelId}
            role="region"
            aria-live={state === 'error' ? 'assertive' : 'polite'}
          >
            <div className={styles.transcriptHeader}>
              <span>{stateAccent[state]}</span>
              {confidencePercent !== undefined && state !== 'error' ? (
                <span>{confidencePercent}% confidence</span>
              ) : null}
            </div>
            {hasTranscript ? (
              <p className={styles.transcriptText}>{trimmedTranscript}</p>
            ) : null}
            {hasError ? (
              <p className={styles.errorMessage}>{errorMessage}</p>
            ) : null}
            {confidencePercent !== undefined && state !== 'error' ? (
              <div>
                <div className={styles.confidenceBar}>
                  <span
                    className={styles.confidenceFill}
                    style={{ width: `${confidencePercent}%` }}
                    aria-hidden="true"
                  />
                </div>
                <p className={styles.confidenceLabel}>
                  {confidencePercent >= 80
                    ? 'High'
                    : confidencePercent >= 50
                      ? 'Medium'
                      : 'Low'}{' '}
                  confidence
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {hasSupplementalInfo ? (
        <button
          type="button"
          className={styles.transcriptToggle}
          onClick={handleToggleExpanded}
          aria-expanded={derivedExpanded}
          aria-controls={panelId}
        >
          {toggleLabel}
        </button>
      ) : null}
    </div>
  );
};

export interface VoiceIndicatorConnectedProps
  extends Omit<VoiceIndicatorProps, 'state' | 'confidence' | 'transcript' | 'error'> {}

export const VoiceIndicatorConnected = ({
  position,
  ariaLabel,
  expanded,
  defaultExpanded,
  onExpandedChange,
  onToggle,
}: VoiceIndicatorConnectedProps) => {
  const { indicator } = useVoiceControlUIState();

  return (
    <VoiceIndicator
      state={indicator.phase}
      confidence={indicator.confidence}
      transcript={indicator.transcript}
      error={indicator.error}
      position={position}
      ariaLabel={ariaLabel}
      expanded={expanded}
      defaultExpanded={defaultExpanded}
      onExpandedChange={onExpandedChange}
      onToggle={onToggle}
    />
  );
};
