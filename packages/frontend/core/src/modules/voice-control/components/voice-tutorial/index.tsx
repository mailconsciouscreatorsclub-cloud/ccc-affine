import { Button } from '@affine/component/ui/button';
import { useService } from '@toeverything/infra';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { VoiceControlService } from '../../services/voice-control.service';
import { VoiceFeedbackService } from '../../services/voice-feedback.service';
import type { VoiceControlEvents } from '../../types';
import * as styles from './index.css';

export interface TutorialStep {
  id?: string;
  title: string;
  description: string;
  command?: string;
  commandId?: string;
  action?: () => void;
  hint?: string;
}

export interface VoiceTutorialProps {
  steps?: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  storageKey?: string;
  persistProgress?: boolean;
}

const DEFAULT_STORAGE_KEY = 'affine:voice-control:tutorial';

const defaultSteps: TutorialStep[] = [
  {
    id: 'wake',
    title: 'Wake voice control',
    description: 'Say “Hey AFFiNE” or press the microphone button to begin listening.',
    command: 'Hey AFFiNE',
    hint: 'You will hear a chime once AFFiNE is listening.',
  },
  {
    id: 'status',
    title: 'Check the status indicator',
    description: 'The Voice Indicator glows when AFFiNE is listening. Confirm you see the blue pulse.',
    command: 'Is voice control on?',
    commandId: 'voice-status',
    hint: 'Look at the bottom corner of your screen for the microphone indicator.',
  },
  {
    id: 'navigate',
    title: 'Navigate to a workspace',
    description: 'Jump straight into the right space. Try “Open workspace design review”.',
    command: 'Open workspace design review',
  },
  {
    id: 'create-note',
    title: 'Create a document',
    description: 'Create content without touching the keyboard with “Create a new page called Meeting Notes”.',
    command: 'Create a new page called Meeting Notes',
  },
  {
    id: 'summarize',
    title: 'Use AI assistance',
    description: 'Let AFFiNE explain a page for you with “Summarize this page in three bullet points”.',
    command: 'Summarize this page in three bullet points',
  },
  {
    id: 'wrap-up',
    title: 'Wrap up your session',
    description: 'Finish by saying “Stop listening” or tapping the microphone again to pause voice control.',
    command: 'Stop listening',
  },
];

const getStepId = (step: TutorialStep, fallback: string) => step.id ?? fallback;

const readStoredProgress = (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('[voice-tutorial] Failed to read stored progress', error);
    return null;
  }
};

const writeStoredProgress = (key: string, payload: unknown) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    console.warn('[voice-tutorial] Failed to persist progress', error);
  }
};

export const VoiceTutorial = ({
  steps = defaultSteps,
  onComplete,
  onSkip,
  storageKey = DEFAULT_STORAGE_KEY,
  persistProgress = true,
}: VoiceTutorialProps) => {
  const total = steps.length;
  const [index, setIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [practiceTarget, setPracticeTarget] = useState<{ stepId: string; commandId: string } | null>(null);
  const practiceTargetRef = useRef(practiceTarget);
  const voiceFeedback = useService(VoiceFeedbackService);
  const voiceControl = useService(VoiceControlService);

  useEffect(() => {
    practiceTargetRef.current = practiceTarget;
  }, [practiceTarget]);

  useEffect(() => {
    if (!persistProgress || !total) {
      return;
    }
    const stored = readStoredProgress(storageKey);
    if (stored) {
      const safeIndex = Math.min(stored.index ?? 0, total - 1);
      setIndex(safeIndex);
      setIsComplete(Boolean(stored.isComplete));
      if (Array.isArray(stored.completedSteps)) {
        setCompletedSteps(new Set(stored.completedSteps));
      }
    }
  }, [persistProgress, storageKey, total]);

  useEffect(() => {
    if (!persistProgress) {
      return;
    }
    const payload = {
      index,
      isComplete,
      completedSteps: Array.from(completedSteps),
    };
    writeStoredProgress(storageKey, payload);
  }, [index, isComplete, completedSteps, persistProgress, storageKey]);

  const current = steps[index] ?? steps[steps.length - 1];

  const progress = useMemo(() => {
    if (!total) {
      return 0;
    }
    if (isComplete) {
      return 100;
    }
    const completedCount = completedSteps.size + 1;
    return Math.min(100, Math.round((completedCount / total) * 100));
  }, [completedSteps.size, isComplete, total]);

  const progressLabel = isComplete
    ? 'Tutorial complete'
    : `Step ${index + 1} of ${total}`;

  const announceProgress = `${progressLabel}. ${progress}% complete.`;

  const completeStepById = useCallback((stepId: string) => {
    setCompletedSteps(prev => {
      if (prev.has(stepId)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(stepId);
      return next;
    });
  }, []);

  const completeCurrentStep = useCallback(() => {
    const id = getStepId(current, String(index));
    completeStepById(id);
  }, [completeStepById, current, index]);

  useEffect(() => {
    if (!voiceControl) {
      return;
    }

    const handleExecuted = ({ command }: VoiceControlEvents['voice:command:executed']) => {
      const target = practiceTargetRef.current;
      if (target && command.id === target.commandId) {
        completeStepById(target.stepId);
        setPracticeTarget(null);
      }
    };

    const handleFailed = ({ command }: VoiceControlEvents['voice:command:failed']) => {
      const target = practiceTargetRef.current;
      if (target && command?.id === target.commandId) {
        setPracticeTarget(null);
      }
    };

    voiceControl.on('voice:command:executed', handleExecuted);
    voiceControl.on('voice:command:failed', handleFailed);

    return () => {
      voiceControl.off('voice:command:executed', handleExecuted);
      voiceControl.off('voice:command:failed', handleFailed);
    };
  }, [voiceControl, completeStepById]);

  const handlePractice = useCallback(() => {
    if (!current) {
      return;
    }

    setPracticeTarget(null);

    if (current.action) {
      current.action();
      return;
    }

    if (current.commandId && voiceControl) {
      const stepId = getStepId(current, String(index));
      setPracticeTarget({ stepId, commandId: current.commandId });
      void voiceControl
        .triggerCommand(current.commandId, {
          originalInput: current.command ?? current.title,
          suppressErrorFeedback: true,
        })
        .catch(error => {
          setPracticeTarget(null);
          console.error('[voice-control] failed to trigger tutorial command', error);
          if (voiceFeedback) {
            void voiceFeedback
              .speak('Unable to run that command automatically. Try it manually.', 'warning', {
                duration: 2200,
                interrupt: false,
              })
              .catch(error => {
                console.error('[voice-control] tutorial feedback failed', error);
              });
          }
        });
      return;
    }

    if (current.command && voiceFeedback) {
      void voiceFeedback
        .speak(`Practicing command: ${current.command}`, 'info', {
          duration: 2200,
          interrupt: false,
        })
        .catch(error => {
          console.error('[voice-control] tutorial feedback failed', error);
        });
      return;
    }

    if (voiceFeedback) {
      void voiceFeedback
        .speak('Try repeating the step aloud to continue practicing.', 'info', {
          duration: 2000,
          interrupt: false,
        })
        .catch(error => {
          console.error('[voice-control] tutorial feedback failed', error);
        });
    }
  }, [current, index, setPracticeTarget, voiceControl, voiceFeedback]);

  const handleNext = useCallback(() => {
    if (!total) {
      return;
    }
    completeCurrentStep();
    setPracticeTarget(null);
    if (index + 1 >= total) {
      setIsComplete(true);
      onComplete?.();
    } else {
      setIndex(i => Math.min(total - 1, i + 1));
    }
  }, [completeCurrentStep, index, setPracticeTarget, total, onComplete]);

  const handleRestart = useCallback(() => {
    setPracticeTarget(null);
    setIndex(0);
    setIsComplete(false);
    setCompletedSteps(new Set());
    if (persistProgress && typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey);
    }
  }, [persistProgress, setPracticeTarget, storageKey]);

  const handleSkip = useCallback(() => {
    setPracticeTarget(null);
    setIsComplete(true);
    onSkip?.();
  }, [onSkip, setPracticeTarget]);

  const handleSelectStep = useCallback(
    (stepIndex: number) => {
      setPracticeTarget(null);
      setIndex(stepIndex);
      setIsComplete(false);
    },
    [setPracticeTarget],
  );

  if (!total) {
    return null;
  }

  const activeStepId = getStepId(current, String(index));
  const canPractice = Boolean(current?.command || current?.commandId || current?.action);
  const practiceLabel = current?.commandId ? 'Run command' : 'Practice';
  const practiceAgainLabel = current?.commandId ? 'Run again' : 'Practice again';
  const practiceCardLabel = current?.commandId
    ? 'Run command'
    : current?.command
      ? 'Try saying'
      : 'Practice this step';
  const practiceDescription = current?.command ?? current?.hint ?? 'Follow the step instructions to continue.';
  const practiceInProgress = practiceTarget?.stepId === activeStepId;
  const practiceButtonLabel = practiceInProgress
    ? current?.commandId
      ? 'Running...'
      : 'Practicing...'
    : practiceLabel;
  const practiceAgainButtonLabel = practiceInProgress
    ? current?.commandId
      ? 'Running...'
      : 'Practicing...'
    : practiceAgainLabel;
  const practiceStatusMessage = practiceInProgress
    ? current?.commandId
      ? 'Running command now'
      : 'Practicing this step'
    : null;

  return (
    <div className={styles.container} role="dialog" aria-labelledby="voice-tutorial-heading">
      <div className={styles.header}>
        <div>
          <h2 id="voice-tutorial-heading" className={styles.title}>
            Voice control tour
          </h2>
          <p className={styles.subtitle}>
            Master the essentials in under two minutes.
          </p>
        </div>
        <span className={styles.stepBadge}>{progressLabel}</span>
      </div>

      <div className={styles.timelineWrapper}>
        <div className={styles.progressBar} aria-hidden>
          <span className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.srOnly} aria-live="polite">
          {announceProgress}
        </span>
        <ol className={styles.timeline}>
          {steps.map((step, stepIndex) => {
            const id = getStepId(step, String(stepIndex));
            const isActive = id === activeStepId && !isComplete;
            const isDone = completedSteps.has(id);
            const status = isComplete || isDone ? 'complete' : isActive ? 'active' : 'upcoming';
            const statusLabel = isDone ? 'Completed' : isActive ? 'In progress' : 'Not started';
            return (
              <li key={id} className={styles.timelineItem[status]}>
                <button
                  type="button"
                  className={clsx(styles.timelineButton, styles.timelineButtonVariants[status])}
                  onClick={() => handleSelectStep(stepIndex)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`${step.title} – ${statusLabel}`}
                >
                  <span className={styles.timelineIndex}>{stepIndex + 1}</span>
                  <span className={styles.timelineTitle}>{step.title}</span>
                  <span className={styles.srOnly}>{statusLabel}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {isComplete ? (
        <div className={styles.completionCard} role="status" aria-live="polite">
          <span className={styles.completionTitle}>You’re ready to command</span>
          <span className={styles.completionSubtitle}>
            Voice control is set up and ready. Try saying “Create a new note”.
          </span>
          <div className={styles.footerActions}>
            <Button type="plain" onClick={handleRestart}>
              Restart tour
            </Button>
            <Button type="primary" onClick={onComplete}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.body}>
          <div>
            <h3 className={styles.stepTitle}>{current.title}</h3>
            <p className={styles.stepDescription}>{current.description}</p>
            {current.hint ? (
              <p className={styles.stepHint}>{current.hint}</p>
            ) : null}
          </div>

          {canPractice ? (
            <div className={styles.commandCard}>
              <div>
                <span className={styles.commandLabel}>{practiceCardLabel}</span>
                <span className={styles.commandText}>{practiceDescription}</span>
                {practiceStatusMessage ? (
                  <span className={styles.practiceStatus} aria-live="polite">
                    {practiceStatusMessage}
                  </span>
                ) : null}
              </div>
              <Button type="secondary" onClick={handlePractice} disabled={practiceInProgress}>
                {practiceButtonLabel}
              </Button>
            </div>
          ) : null}

          <div className={styles.footer}>
            <Button type="plain" onClick={handleSkip}>
              Skip tour
            </Button>
            <div className={styles.footerActions}>
              {canPractice ? (
                <Button type="secondary" onClick={handlePractice} disabled={practiceInProgress}>
                  {practiceAgainButtonLabel}
                </Button>
              ) : null}
              <Button type="primary" onClick={handleNext}>
                {index + 1 >= total ? 'Finish' : 'Next step'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

