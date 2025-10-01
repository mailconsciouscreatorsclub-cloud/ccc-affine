import type { Meta, StoryObj } from '@storybook/react';

import { VoiceStatusBar } from './index';

const noop = () => undefined;

const meta: Meta<typeof VoiceStatusBar> = {
  title: 'Voice Control/Voice Status Bar',
  component: VoiceStatusBar,
  parameters: {
    layout: 'centered',
  },
  args: {
    onToggle: noop,
    onOpenSettings: noop,
  },
};

export default meta;

type Story = StoryObj<typeof VoiceStatusBar>;

export const Idle: Story = {
  args: {
    phase: 'idle',
    isActive: true,
    isListening: false,
    language: 'English (US)',
  },
};

export const Listening: Story = {
  args: {
    phase: 'listening',
    isActive: true,
    isListening: true,
    lastCommand: 'Open workspace design review',
    lastCommandSuccess: true,
    microphoneLevel: 0.68,
    language: 'English (US)',
  },
};

export const Processing: Story = {
  args: {
    phase: 'processing',
    isActive: true,
    isListening: true,
    lastCommand: 'Summarize this page',
    lastCommandSuccess: undefined,
    microphoneLevel: 0.3,
    language: 'English (US)',
  },
};

export const Error: Story = {
  args: {
    phase: 'error',
    isActive: false,
    isListening: false,
    lastCommand: 'Toggle sidebar',
    lastCommandSuccess: false,
    language: 'English (US)',
  },
};
