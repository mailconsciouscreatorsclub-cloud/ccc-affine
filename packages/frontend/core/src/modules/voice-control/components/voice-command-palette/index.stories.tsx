import type { Meta, StoryObj } from '@storybook/react';

import type { VoiceCommand } from '../../types';
import type { VoiceCommandHistoryEntry } from '../hooks/use-voice-ui-state';
import { VoiceCommandPalette } from './index';

const sampleCommands: VoiceCommand[] = [
  {
    id: 'open-workspace',
    trigger: 'open workspace',
    aliases: ['switch workspace', 'go to workspace'],
    description: 'Open a workspace by name',
    category: 'workspace',
    parameters: [
      { name: 'workspaceName', type: 'string', required: true },
    ],
    handler: async () => ({ success: true }),
  },
  {
    id: 'create-page',
    trigger: 'create new page',
    aliases: ['new page', 'start new document'],
    description: 'Create a new page in the current workspace',
    category: 'document',
    parameters: [
      { name: 'title', type: 'string', required: true },
      { name: 'template', type: 'string', required: false },
    ],
    handler: async () => ({ success: true }),
  },
  {
    id: 'toggle-sidebar',
    trigger: 'toggle sidebar',
    aliases: ['open sidebar', 'close navigation'],
    description: 'Toggle the navigation sidebar visibility',
    category: 'navigation',
    context: {
      requiredView: 'workspace',
    },
    handler: async () => ({ success: true }),
  },
  {
    id: 'summarize',
    trigger: 'summarize this page',
    aliases: ['give me a summary'],
    description: 'Use AI to summarize the current page',
    category: 'ai',
    requiresConfirmation: true,
    context: {
      requiredDocument: 'document',
      excludedContexts: ['home'],
    },
    handler: async () => ({ success: true }),
  },
  {
    id: 'search',
    trigger: 'search for',
    aliases: ['look up', 'find'],
    description: 'Search across the workspace content',
    category: 'system',
    handler: async () => ({ success: true }),
  },
];

const recentHistory: VoiceCommandHistoryEntry[] = [
  {
    id: 'open-workspace',
    label: 'Open workspace marketing',
    success: true,
    timestamp: Date.now() - 60_000,
  },
  {
    id: 'summarize',
    label: 'Summarize this page',
    success: false,
    message: 'Document too large',
    timestamp: Date.now() - 120_000,
  },
];

const meta: Meta<typeof VoiceCommandPalette> = {
  title: 'Voice Control/Voice Command Palette',
  component: VoiceCommandPalette,
  args: {
    commands: sampleCommands,
    groupByCategory: true,
    recentCommands: recentHistory,
  },
};

export default meta;

type Story = StoryObj<typeof VoiceCommandPalette>;

export const Default: Story = {};

export const PrefilledSearch: Story = {
  args: {
    searchQuery: 'page',
  },
};

export const NavigationCategory: Story = {
  args: {
    groupByCategory: true,
    searchQuery: '',
    commands: sampleCommands,
  },
  play: async ({ canvasElement }) => {
    const navigationButton = canvasElement.querySelector('button[aria-pressed="false"]');
    navigationButton?.dispatchEvent(new Event('click', { bubbles: true }));
  },
};

export const WithoutGrouping: Story = {
  args: {
    groupByCategory: false,
  },
};

export const NoResults: Story = {
  args: {
    searchQuery: 'non-existent command',
  },
};

export const AutoExecuteDisabled: Story = {
  args: {
    autoExecute: false,
  },
};
