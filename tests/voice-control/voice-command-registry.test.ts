ï»¿import { describe, beforeEach, expect, it } from 'vitest';

import { VoiceCommandRegistry } from '../../packages/frontend/core/src/modules/voice-control/services/voice-command-registry.service';
import type { VoiceCommand, VoiceNavigationContext } from '../../packages/frontend/core/src/modules/voice-control/types';

describe('VoiceCommandRegistry', () => {
  let registry: VoiceCommandRegistry;
  let idCounter = 0;

  const createCommand = (overrides: Partial<VoiceCommand> = {}): VoiceCommand => ({
    id: overrides.id ?? cmd-,
    trigger: overrides.trigger ?? 'open workspace',
    aliases: overrides.aliases ?? ['switch workspace'],
    description: overrides.description ?? 'Open the specified workspace',
    category: overrides.category ?? 'workspace',
    parameters: overrides.parameters ?? [
      {
        name: 'target',
        type: 'string',
        required: false,
      },
    ],
    handler: overrides.handler ?? (async () => ({ success: true })),
    context: overrides.context,
    requiresConfirmation: overrides.requiresConfirmation,
  });

  beforeEach(async () => {
    registry = new VoiceCommandRegistry();
    await registry.initialize();
  });

  it('registers and retrieves commands', () => {
    const command = createCommand({ id: 'cmd-1' });
    registry.register(command);

    expect(registry.getAllCommands()).toHaveLength(1);
    expect(registry.getCommand('cmd-1')).toBe(command);
  });

  it('matches commands by trigger and aliases', () => {
    const command = createCommand({ trigger: 'go home', aliases: ['navigate home'] });
    registry.register(command);

    const byTrigger = registry.findMatchingCommands('go home');
    const byAlias = registry.findMatchingCommands('navigate home');

    expect(byTrigger[0]?.command.id).toBe(command.id);
    expect(byAlias[0]?.command.id).toBe(command.id);
    expect(byTrigger[0]?.confidence).toBeGreaterThan(0.8);
    expect(byAlias[0]?.confidence).toBeGreaterThan(0.7);
  });

  it('extracts string and numeric parameters from input', () => {
    const command = createCommand({
      trigger: 'resize sidebar',
      parameters: [
        { name: 'width', type: 'number', required: true },
        { name: 'mode', type: 'enum', enumValues: ['compact', 'expanded'], required: false },
      ],
    });
    registry.register(command);

    const matches = registry.findMatchingCommands('resize sidebar 320 compact');
    expect(matches).toHaveLength(1);
    const match = matches[0]!;

    expect(match.parameters.parameters.width).toBe(320);
    expect(match.parameters.parameters.mode).toBe('compact');
    expect(match.confidence).toBeGreaterThan(0.5);
  });

  it('adjusts confidence when context mismatches', () => {
    const command = createCommand({
      trigger: 'toggle sidebar',
      context: { requiredView: 'dashboard' },
    });
    registry.register(command);

    registry.setContext({ currentView: 'dashboard' } as VoiceNavigationContext);
    const matchedInContext = registry.findMatchingCommands('toggle sidebar')[0]!;
    registry.setContext({ currentView: 'editor' } as VoiceNavigationContext);
    const matchedOutOfContext = registry.findMatchingCommands('toggle sidebar')[0]!;

    expect(matchedInContext.confidence).toBeGreaterThan(matchedOutOfContext.confidence);
  });
});
