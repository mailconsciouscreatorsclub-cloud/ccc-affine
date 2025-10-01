import { Service } from '@toeverything/infra';

import type {
  VoiceCommand,
  VoiceCommandMatch,
  VoiceCommandParameter,
} from '../types/commands';
import type { VoiceNavigationContext } from '../types';

interface CommandEntry {
  command: VoiceCommand;
  normalizedTrigger: string;
  normalizedAliases: string[];
}

/**
 * VoiceCommandRegistry keeps track of available voice commands and provides
 * lightweight fuzzy matching to identify the best command for a given user
 * utterance.
 */
export class VoiceCommandRegistry extends Service {
  private readonly commands = new Map<string, CommandEntry>();
  private readonly commandsByCategory = new Map<VoiceCommand['category'], Set<string>>();
  private initialized = false;
  private currentContext: VoiceNavigationContext | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  setContext(context: VoiceNavigationContext | null): void {
    this.currentContext = context;
  }

  register(command: VoiceCommand): void {
    if (this.commands.has(command.id)) {
      throw new Error('Voice command with id "' + command.id + '" is already registered.');
    }

    const entry: CommandEntry = {
      command,
      normalizedTrigger: this.normalizeText(command.trigger),
      normalizedAliases: (command.aliases ?? []).map(alias => this.normalizeText(alias)),
    };

    this.commands.set(command.id, entry);

    if (!this.commandsByCategory.has(command.category)) {
      this.commandsByCategory.set(command.category, new Set());
    }
    this.commandsByCategory.get(command.category)!.add(command.id);
  }

  unregister(commandId: string): void {
    const entry = this.commands.get(commandId);
    if (!entry) {
      return;
    }

    this.commands.delete(commandId);
    this.commandsByCategory.get(entry.command.category)?.delete(commandId);
  }

  getAllCommands(): VoiceCommand[] {
    return Array.from(this.commands.values()).map(entry => entry.command);
  }

  getCommandsByCategory(category: VoiceCommand['category']): VoiceCommand[] {
    const ids = this.commandsByCategory.get(category);
    if (!ids) return [];
    return Array.from(ids).map(id => this.commands.get(id)!.command);
  }

  getCommand(commandId: string): VoiceCommand | undefined {
    return this.commands.get(commandId)?.command;
  }

  findMatchingCommands(input: string): VoiceCommandMatch[] {
    const normalizedInput = this.normalizeText(input);
    if (!normalizedInput) {
      return [];
    }

    const matches: VoiceCommandMatch[] = [];

    for (const { command, normalizedTrigger, normalizedAliases } of this.commands.values()) {
      const phrases = [normalizedTrigger, ...normalizedAliases];
      let bestScore = 0;
      let bestPhrase = normalizedTrigger;

      for (const phrase of phrases) {
        const { score } = this.computePhraseScore(normalizedInput, phrase);
        if (score > bestScore) {
          bestScore = score;
          bestPhrase = phrase;
        }
      }

      if (bestScore < 0.45) {
        continue;
      }

      const { parameters, matchRatio } = this.extractParameters(input, command, bestPhrase);
      const contextMatch = this.evaluateContext(command, this.currentContext);
      const parameterMatch = command.parameters?.length ? matchRatio : 1;

      const confidence = this.toConfidence({
        triggerMatch: bestScore,
        parameterMatch,
        contextMatch,
      });

      matches.push({
        command,
        parameters,
        confidence,
        score: {
          triggerMatch: bestScore,
          parameterMatch,
          contextMatch,
        },
      });
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  clear(): void {
    this.commands.clear();
    this.commandsByCategory.clear();
  }

  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private computePhraseScore(input: string, phrase: string): { score: number; remainder: string } {
    if (!phrase) {
      return { score: 0, remainder: input };
    }

    if (input === phrase) {
      return { score: 1, remainder: '' };
    }

    if (input.startsWith(phrase)) {
      const remainder = input.slice(phrase.length).trim();
      return { score: 0.9, remainder };
    }

    if (input.includes(phrase)) {
      const remainder = input.replace(phrase, '').trim();
      return { score: 0.7, remainder };
    }

    const distance = this.levenshteinDistance(input, phrase);
    const maxLength = Math.max(input.length, phrase.length);
    const similarity = maxLength === 0 ? 0 : 1 - distance / maxLength;

    return { score: similarity, remainder: '' };
  }

  private extractParameters(
    originalInput: string,
    command: VoiceCommand,
    matchedPhrase: string,
  ): { parameters: Record<string, any>; matchRatio: number } {
    if (!command.parameters?.length) {
      return { parameters: {}, matchRatio: 1 };
    }

    const parameters: Record<string, any> = {};
    let matched = 0;

    const normalizedOriginal = originalInput.toLowerCase();
    const normalizedPhrase = matchedPhrase.toLowerCase();
    const matchIndex = normalizedOriginal.indexOf(normalizedPhrase);
    let remainder = matchIndex >= 0
      ? originalInput.slice(matchIndex + matchedPhrase.length).trim()
      : originalInput.trim();

    for (const definition of command.parameters) {
      const { value, consumed } = this.parseParameter(definition, remainder);
      if (value !== undefined) {
        parameters[definition.name] = value;
        matched += 1;
      } else if (definition.required) {
        parameters[definition.name] = definition.defaultValue ?? null;
      }

      if (consumed) {
        remainder = remainder.slice(consumed).trimStart();
      }
    }

    const matchRatio = matched / command.parameters.length;
    return { parameters, matchRatio: Number.isFinite(matchRatio) ? matchRatio : 1 };
  }

  private parseParameter(definition: VoiceCommandParameter, remainder: string): { value: any; consumed: number } {
    const working = remainder.trim();
    if (!working) {
      return { value: undefined, consumed: 0 };
    }

    switch (definition.type) {
      case 'boolean': {
        const match = working.match(/^(?<value>enable|disable|on|off|true|false)\b/i);
        if (!match?.groups?.value) {
          return { value: undefined, consumed: 0 };
        }
        const keyword = match.groups.value.toLowerCase();
        const value = keyword === 'enable' || keyword === 'on' || keyword === 'true';
        return { value, consumed: match.groups.value.length };
      }

      case 'number': {
        const match = working.match(/^-?\d+(?:\.\d+)?/);
        if (!match) {
          return { value: undefined, consumed: 0 };
        }
        return { value: Number(match[0]), consumed: match[0].length };
      }

      case 'enum': {
        const { enumValues = [] } = definition;
        const lower = working.toLowerCase();
        const found = enumValues.find(value => lower.startsWith(value.toLowerCase()))
          ?? enumValues.find(value => lower.includes(value.toLowerCase()));
        if (!found) {
          return { value: undefined, consumed: 0 };
        }
        const index = lower.indexOf(found.toLowerCase());
        return { value: found, consumed: index + found.length };
      }

      case 'string':
      default: {
        return { value: working, consumed: working.length };
      }
    }
  }

  private evaluateContext(command: VoiceCommand, context: VoiceNavigationContext | null): number {
    if (!command.context || !context) {
      return 1;
    }

    let score = 1;

    if (command.context.requiredView && command.context.requiredView !== context.currentView) {
      score *= 0.5;
    }

    if (
      command.context.requiredWorkspace &&
      command.context.requiredWorkspace !== context.workspace?.id
    ) {
      score *= 0.5;
    }

    if (
      command.context.requiredDocument &&
      command.context.requiredDocument !== context.document?.id
    ) {
      score *= 0.5;
    }

    if (command.context.excludedContexts?.includes(context.currentView)) {
      score *= 0.2;
    }

    return score;
  }

  private toConfidence(score: {
    triggerMatch: number;
    parameterMatch: number;
    contextMatch: number;
  }): number {
    const weighted = score.triggerMatch * 0.7 + score.parameterMatch * 0.2 + score.contextMatch * 0.1;
    return Math.max(0, Math.min(1, Number.isFinite(weighted) ? weighted : 0));
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) {
      matrix[i][0] = i;
    }
    for (let j = 0; j < cols; j += 1) {
      matrix[0][j] = j;
    }

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[rows - 1][cols - 1];
  }
}
