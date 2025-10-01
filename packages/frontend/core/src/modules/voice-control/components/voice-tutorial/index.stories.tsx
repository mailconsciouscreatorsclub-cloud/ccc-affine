import type { Meta, StoryObj } from '@storybook/react';

import { VoiceTutorial } from './index';

const meta: Meta<typeof VoiceTutorial> = {
  title: 'Voice Control/Voice Tutorial',
  component: VoiceTutorial,
  args: {
    persistProgress: false,
  },
};

export default meta;

type Story = StoryObj<typeof VoiceTutorial>;

export const Default: Story = {};

export const CustomSteps: Story = {
  args: {
    persistProgress: false,
    steps: [
      {
        id: 'status',
        title: 'Check voice status',
        description: 'Ask the assistant whether it is actively listening.',
        command: 'Voice status',
        commandId: 'voice-status',
        hint: 'You will hear back if voice control is active.',
      },
      {
        id: 'pause',
        title: 'Pause listening',
        description: 'Stop recognition until you are ready again.',
        command: 'Stop listening',
        commandId: 'stop-listening',
      },
      {
        id: 'feedback',
        title: 'Send feedback',
        description: 'Let the team know when something goes wrong.',
        command: 'Send feedback “Voice navigation is awesome”',
      },
    ],
  },
};

export const Completed: Story = {
  args: {
    persistProgress: false,
  },
  play: async ({ canvasElement }) => {
    const finishButton = Array.from(canvasElement.querySelectorAll('button')).find(button =>
      button.textContent?.includes('Finish'),
    );
    finishButton?.dispatchEvent(new Event('click', { bubbles: true }));
  },
};
