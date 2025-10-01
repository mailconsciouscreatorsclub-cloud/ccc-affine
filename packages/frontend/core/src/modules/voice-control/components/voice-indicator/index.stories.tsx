import type { Meta, StoryObj } from '@storybook/react';

import { VoiceIndicator } from './index';

const meta: Meta<typeof VoiceIndicator> = {
  title: 'Voice Control/Voice Indicator',
  component: VoiceIndicator,
  parameters: {
    layout: 'centered',
  },
};

export default meta;

type Story = StoryObj<typeof VoiceIndicator>;

export const Idle: Story = {
  args: {
    state: 'idle',
    transcript: 'Voice control is standing by.',
  },
};

export const Listening: Story = {
  args: {
    state: 'listening',
    transcript: 'Open my project notes…',
    confidence: 0.76,
  },
};

export const Processing: Story = {
  args: {
    state: 'processing',
    transcript: 'Creating a new page called Meeting Notes…',
    confidence: 0.92,
  },
};

export const Error: Story = {
  args: {
    state: 'error',
    transcript: 'Could you repeat that command?',
    error: 'Microphone permissions were denied.',
    confidence: 0.35,
  },
};
