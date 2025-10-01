import { Service } from '@toeverything/infra';

import type { VoiceFeedback, VoiceFeedbackConfig } from '../types';

interface SpeakOptions extends Partial<VoiceFeedback> {}

/**
 * Provides audio (speech synthesis) and visual feedback for voice interactions.
 */
export class VoiceFeedbackService extends Service {
  private config: VoiceFeedbackConfig = {
    audioEnabled: true,
    visualEnabled: true,
    speechRate: 1,
    speechPitch: 1,
    speechVolume: 1,
  };

  private initialized = false;
  private speechSynthesis?: SpeechSynthesis;
  private currentUtterance?: SpeechSynthesisUtterance;
  private visualContainer?: HTMLElement;
  private hideTimer: number | undefined;

  async initialize(config: VoiceFeedbackConfig): Promise<void> {
    this.config = { ...this.config, ...config };
    this.speechSynthesis = this.resolveSpeechSynthesis();

    if (this.config.visualEnabled) {
      this.ensureVisualContainer();
    }

    this.initialized = true;
  }

  async updateConfig(config: Partial<VoiceFeedbackConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    if (this.config.visualEnabled) {
      this.ensureVisualContainer();
    } else {
      this.teardownVisualContainer();
    }
  }

  async speak(text: string, type: VoiceFeedback['type'] = 'info', options: SpeakOptions = {}): Promise<void> {
    const feedback: VoiceFeedback = {
      text,
      type,
      duration: options.duration ?? (type === 'error' ? 4000 : 2400),
      interrupt: options.interrupt ?? true,
    };

    if (this.config.visualEnabled) {
      this.showVisualFeedback(feedback);
    }

    if (this.config.audioEnabled) {
      await this.playAudioFeedback(feedback);
    }
  }

  stopSpeaking(): void {
    if (!this.speechSynthesis) {
      return;
    }
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }
  }

  private async playAudioFeedback(feedback: VoiceFeedback): Promise<void> {
    if (!this.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
      return;
    }

    if (feedback.interrupt !== false) {
      this.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(feedback.text);
    utterance.rate = this.config.speechRate;
    utterance.pitch = this.config.speechPitch;
    utterance.volume = this.config.speechVolume;

    const voice = await this.resolveVoice();
    if (voice) {
      utterance.voice = voice;
    }

    this.currentUtterance = utterance;

    await new Promise<void>((resolve) => {
      const clearHandlers = () => {
        utterance.onend = null;
        utterance.onerror = null;
        this.currentUtterance = undefined;
        resolve();
      };

      utterance.onend = clearHandlers;
      utterance.onerror = clearHandlers;

      this.speechSynthesis!.speak(utterance);
    });
  }

  private showVisualFeedback(feedback: VoiceFeedback): void {
    const container = this.ensureVisualContainer();
    if (!container) {
      return;
    }

    container.textContent = feedback.text;
    container.setAttribute('data-feedback-type', feedback.type);
    container.classList.add('visible');

    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
    }

    const duration = Math.max(1000, feedback.duration ?? 2000);
    this.hideTimer = window.setTimeout(() => {
      container.classList.remove('visible');
    }, duration);
  }

  private resolveSpeechSynthesis(): SpeechSynthesis | undefined {
    if (typeof window === 'undefined') {
      return undefined;
    }
    return window.speechSynthesis;
  }

  private async resolveVoice(): Promise<SpeechSynthesisVoice | undefined> {
    if (!this.speechSynthesis) {
      return undefined;
    }

    const preferred = this.config.voice;
    const voices = this.speechSynthesis.getVoices();

    if (!voices.length) {
      await new Promise<void>(resolve => {
        const handler = () => {
          this.speechSynthesis?.removeEventListener('voiceschanged', handler);
          resolve();
        };
        this.speechSynthesis?.addEventListener('voiceschanged', handler, { once: true });
      });
    }

    const available = this.speechSynthesis.getVoices();

    if (preferred) {
      const match = available.find(voice => voice.name === preferred || voice.lang === preferred);
      if (match) {
        return match;
      }
    }

    return available[0];
  }

  private ensureVisualContainer(): HTMLElement | undefined {
    if (typeof document === 'undefined') {
      return undefined;
    }

    if (this.visualContainer && document.body.contains(this.visualContainer)) {
      return this.visualContainer;
    }

    const container = document.createElement('div');
    container.id = 'voice-feedback-banner';
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('data-feedback-type', 'info');
    container.style.position = 'fixed';
    container.style.bottom = '1.5rem';
    container.style.right = '1.5rem';
    container.style.padding = '0.75rem 1rem';
    container.style.borderRadius = '0.75rem';
    container.style.background = 'rgba(32, 33, 36, 0.9)';
    container.style.color = '#fff';
    container.style.fontSize = '0.875rem';
    container.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.25)';
    container.style.zIndex = '9999';
    container.style.opacity = '0';
    container.style.transition = 'opacity 120ms ease, transform 160ms ease';
    container.style.transform = 'translateY(12px)';

    container.classList.add('hidden');

    const style = document.createElement('style');
    style.textContent = `
      #voice-feedback-banner.visible {
        opacity: 1;
        transform: translateY(0);
      }
      #voice-feedback-banner.hidden {
        opacity: 0;
        pointer-events: none;
      }
      #voice-feedback-banner[data-feedback-type="success"] {
        background: rgba(16, 124, 16, 0.92);
      }
      #voice-feedback-banner[data-feedback-type="error"] {
        background: rgba(189, 0, 0, 0.92);
      }
      #voice-feedback-banner[data-feedback-type="warning"] {
        background: rgba(202, 138, 4, 0.92);
      }
      #voice-feedback-banner[data-feedback-type="info"] {
        background: rgba(32, 33, 36, 0.9);
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(container);

    this.visualContainer = container;
    return container;
  }

  private teardownVisualContainer(): void {
    if (this.hideTimer) {
      window.clearTimeout(this.hideTimer);
      this.hideTimer = undefined;
    }

    if (this.visualContainer?.parentElement) {
      this.visualContainer.parentElement.removeChild(this.visualContainer);
    }
    this.visualContainer = undefined;
  }
}