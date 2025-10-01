import { Input } from '@affine/component/ui/input';
import { useService } from '@toeverything/infra';
import clsx from 'clsx';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';

import { VoiceControlService } from '../../services/voice-control.service';
import type { VoiceCommand } from '../../types';
import type { VoiceCommandHistoryEntry } from '../hooks/use-voice-ui-state';
import { useVoiceControlUIState } from '../hooks/use-voice-ui-state';
import * as styles from './index.css';

export interface VoiceCommandPaletteProps {
  commands: VoiceCommand[];
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  onCommandSelect?: (command: VoiceCommand) => void;
  groupByCategory?: boolean;
  recentCommands?: VoiceCommandHistoryEntry[];
}

type CategoryKey = VoiceCommand['category'] | 'other';
type CategoryFilterKey = 'all' | CategoryKey;

const normalize = (value: string) => value.trim().toLowerCase();

const getCommandTokens = (command: VoiceCommand) =>
  [command.trigger, ...(command.aliases ?? []), command.description ?? '']
    .join(' ')
    .toLowerCase();

const sortCommands = (commands: VoiceCommand[]) =>
  [...commands].sort((a, b) => a.trigger.localeCompare(b.trigger));

const formatCategoryLabel = (value: CategoryFilterKey) => {
  if (value === 'all') {
    return 'All';
  }
  if (value === 'ai') {
    return 'AI';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const getCategoryKey = (command: VoiceCommand): CategoryKey => command.category ?? 'other';

const buildContextDescription = (context?: VoiceCommand['context']) => {
  if (!context) {
    return [] as string[];
  }
  const descriptions: string[] = [];
  if (context.requiredView) {
    descriptions.push(`Requires view: ${context.requiredView}`);
  }
  if (context.requiredWorkspace) {
    descriptions.push(`Requires workspace: ${context.requiredWorkspace}`);
  }
  if (context.requiredDocument) {
    descriptions.push(`Requires document: ${context.requiredDocument}`);
  }
  if (context.excludedContexts?.length) {
    descriptions.push(`Not available in: ${context.excludedContexts.join(', ')}`);
  }
  return descriptions;
};

const optionId = (command: VoiceCommand) => `voice-command-${command.id}`;

const coerceInputValue = (
  valueOrEvent: string | ChangeEvent<HTMLInputElement>,
): string => {
  if (typeof valueOrEvent === 'string') {
    return valueOrEvent;
  }
  return valueOrEvent.target.value;
};

export const VoiceCommandPalette = ({
  commands,
  searchQuery,
  onSearchQueryChange,
  onCommandSelect,
  groupByCategory = true,
  recentCommands = [],
}: VoiceCommandPaletteProps) => {
  const isControlled = searchQuery !== undefined;
  const [internalQuery, setInternalQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilterKey>('all');
  const [focusedIndex, setFocusedIndex] = useState(0);

  const query = isControlled ? searchQuery! : internalQuery;

  const headingId = useId();
  const detailsTitleId = useId();
  const resultsAnnouncementId = useId();

  const handleSearchChange = useCallback(
    (next: string | ChangeEvent<HTMLInputElement>) => {
      const value = coerceInputValue(next);
      if (!isControlled) {
        setInternalQuery(value);
      }
      onSearchQueryChange?.(value);
    },
    [isControlled, onSearchQueryChange],
  );

  const categories = useMemo(() => {
    const counts = new Map<CategoryKey, number>();
    for (const command of commands) {
      const key = getCategoryKey(command);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const entries = Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
    const total = commands.length;
    return [
      { key: 'all' as CategoryFilterKey, label: 'All', count: total },
      ...entries.map(([key, count]) => ({
        key: key as CategoryFilterKey,
        label: formatCategoryLabel(key as CategoryFilterKey),
        count,
      })),
    ];
  }, [commands]);

  const filteredBySearch = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      return sortCommands(commands);
    }
    return sortCommands(
      commands.filter(command => getCommandTokens(command).includes(normalizedQuery)),
    );
  }, [commands, query]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') {
      return filteredBySearch;
    }
    return filteredBySearch.filter(command => getCategoryKey(command) === activeCategory);
  }, [filteredBySearch, activeCategory]);

  const grouped = useMemo(() => {
    if (!groupByCategory) {
      return [{ category: undefined as string | undefined, items: filtered }];
    }
    const map = new Map<string, VoiceCommand[]>();
    for (const command of filtered) {
      const key = command.category ?? 'other';
      map.set(key, [...(map.get(key) ?? []), command]);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => ({ category, items }));
  }, [filtered, groupByCategory]);

  const flatList = useMemo(
    () => grouped.flatMap(section => section.items),
    [grouped],
  );

  useEffect(() => {
    setFocusedIndex(0);
  }, [query, activeCategory, filtered.length]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!flatList.length) {
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedIndex(index => (index + 1) % flatList.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedIndex(index => (index - 1 + flatList.length) % flatList.length);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        setFocusedIndex(0);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        setFocusedIndex(flatList.length - 1);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        const command = flatList[focusedIndex];
        if (command) {
          onCommandSelect?.(command);
        }
      }
    },
    [flatList, focusedIndex, onCommandSelect],
  );

  const handleSelect = useCallback(
    (command: VoiceCommand) => {
      onCommandSelect?.(command);
    },
    [onCommandSelect],
  );

  const selectedCommand = flatList[focusedIndex];
  const contextDescriptions = buildContextDescription(selectedCommand?.context);

  const resultsSummary = useMemo(() => {
    const countLabel = filtered.length === 1 ? '1 command' : `${filtered.length} commands`;
    const categoryLabel = formatCategoryLabel(activeCategory);
    if (query) {
      return `${countLabel} match "${query}" in ${categoryLabel}`;
    }
    return `${countLabel} shown for ${categoryLabel}`;
  }, [filtered.length, activeCategory, query]);

  return (
    <div
      className={styles.container}
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-describedby={resultsAnnouncementId}
    >
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h2 id={headingId} className={styles.title}>
            Voice Commands
          </h2>
          <span className={styles.badge}>{commands.length}</span>
        </div>
        <div className={styles.hint}>
          Search or use arrow keys to explore. Press Enter to trigger a command.
        </div>
        <div className={styles.searchWrapper}>
          <Input
            value={query}
            onChange={handleSearchChange}
            placeholder='Try "open workspace"'
            aria-label="Search voice commands"
          />
        </div>
      </div>

      {categories.length > 1 ? (
        <div className={styles.filterBar} role="toolbar" aria-label="Command categories">
          {categories.map(filter => (
            <button
              key={filter.key}
              type="button"
              className={clsx(
                styles.filterButton,
                styles.filterButtonActive[filter.key === activeCategory ? 'true' : 'false'],
              )}
              aria-pressed={filter.key === activeCategory}
              onClick={() => setActiveCategory(filter.key)}
            >
              <span>{filter.label}</span>
              <span className={styles.filterCount}>{filter.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.content}>
        <div className={styles.resultsColumn}>
          <div
            className={styles.listWrapper}
            role="listbox"
            aria-label="Available voice commands"
            aria-activedescendant={selectedCommand ? optionId(selectedCommand) : undefined}
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {flatList.length === 0 ? (
              <div className={styles.emptyState}>No commands match your filters.</div>
            ) : (
              grouped.map(section => (
                <section
                  key={section.category ?? 'all'}
                  className={styles.section}
                  aria-label={section.category ? formatCategoryLabel(section.category as CategoryFilterKey) : 'Commands'}
                >
                  {groupByCategory && section.category ? (
                    <header className={styles.sectionHeader}>
                      {formatCategoryLabel(section.category as CategoryFilterKey)}
                    </header>
                  ) : null}
                  <ul className={styles.commandList}>
                    {section.items.map(command => {
                      const index = flatList.indexOf(command);
                      const isActive = index === focusedIndex;
                      return (
                        <li key={command.id}>
                          <button
                            id={optionId(command)}
                            type="button"
                            className={clsx(
                              styles.commandItem,
                              styles.commandItemActive[isActive ? 'true' : 'false'],
                            )}
                            onMouseEnter={() => setFocusedIndex(index)}
                            onClick={() => handleSelect(command)}
                            role="option"
                            aria-selected={isActive}
                          >
                            <div className={styles.commandMeta}>
                              <span className={styles.commandTitle}>{command.trigger}</span>
                              {command.description ? <span>{command.description}</span> : null}
                              {command.aliases?.length ? (
                                <span className={styles.shortcut}>
                                  Aliases: {command.aliases.slice(0, 3).join(', ')}
                                </span>
                              ) : null}
                            </div>
                            {command.requiresConfirmation ? (
                              <span className={styles.metaBadge}>Needs confirmation</span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>

          {recentCommands.length ? (
            <section className={styles.section} aria-label="Recently used commands">
              <header className={styles.sectionHeader}>Recently used</header>
              <div className={styles.recentList}>
                {recentCommands.slice(0, 5).map(entry => (
                  <div key={`${entry.id}-${entry.timestamp}`} className={styles.recentItem}>
                    <span>{entry.label}</span>
                    <span>{entry.success ? 'Success' : entry.message ?? 'Error'}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside
          className={styles.details}
          role="complementary"
          aria-labelledby={selectedCommand ? detailsTitleId : undefined}
        >
          {selectedCommand ? (
            <>
              <h3 id={detailsTitleId} className={styles.detailTitle}>
                {selectedCommand.trigger}
              </h3>
              {selectedCommand.description ? (
                <p className={styles.detailDescription}>{selectedCommand.description}</p>
              ) : (
                <p className={styles.detailDescriptionMuted}>
                  No description provided for this command.
                </p>
              )}

              <div className={styles.detailTags}>
                <span className={styles.detailTag}>{formatCategoryLabel(getCategoryKey(selectedCommand))}</span>
                {selectedCommand.requiresConfirmation ? (
                  <span className={styles.detailTagAccent}>Requires confirmation</span>
                ) : null}
              </div>

              {selectedCommand.aliases?.length ? (
                <div>
                  <h4 className={styles.detailSectionTitle}>Example phrases</h4>
                  <ul className={styles.detailList}>
                    {selectedCommand.aliases.map(alias => (
                      <li key={alias} className={styles.detailListItem}>
                        {alias}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selectedCommand.parameters?.length ? (
                <div>
                  <h4 className={styles.detailSectionTitle}>Parameters</h4>
                  <ul className={styles.detailList}>
                    {selectedCommand.parameters.map(parameter => (
                      <li key={parameter.name} className={styles.detailListItem}>
                        <span className={styles.detailListLabel}>{parameter.name}</span>
                        <span>
                          {parameter.type}
                          {parameter.required ? ' • required' : ' • optional'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {contextDescriptions.length ? (
                <div>
                  <h4 className={styles.detailSectionTitle}>Context</h4>
                  <ul className={styles.detailList}>
                    {contextDescriptions.map(item => (
                      <li key={item} className={styles.detailListItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.detailsEmpty}>
              Select a command to view descriptions, example phrases, and context tips.
            </div>
          )}
        </aside>
      </div>

      <span id={resultsAnnouncementId} className={styles.srOnly} aria-live="polite">
        {resultsSummary}
      </span>
    </div>
  );
};

export interface VoiceCommandPaletteConnectedProps
  extends Omit<VoiceCommandPaletteProps, 'commands' | 'recentCommands' | 'onCommandSelect'> {
  autoExecute?: boolean;
  onCommandSelect?: (command: VoiceCommand) => void;
}

export const VoiceCommandPaletteConnected = ({
  searchQuery,
  onSearchQueryChange,
  onCommandSelect,
  groupByCategory,
  autoExecute = true,
}: VoiceCommandPaletteConnectedProps) => {
  const { commands, recentCommands } = useVoiceControlUIState();
  const voiceControl = useService(VoiceControlService);

  const handleSelect = useCallback(
    (command: VoiceCommand) => {
      if (autoExecute && voiceControl) {
        void voiceControl.triggerCommand(command.id).catch(error => {
          console.error('[voice-control] failed to trigger command', error);
        });
      }
      onCommandSelect?.(command);
    },
    [autoExecute, onCommandSelect, voiceControl],
  );

  return (
    <VoiceCommandPalette
      commands={commands}
      recentCommands={recentCommands}
      searchQuery={searchQuery}
      onSearchQueryChange={onSearchQueryChange}
      onCommandSelect={handleSelect}
      groupByCategory={groupByCategory}
    />
  );
};



