/**
 * DWx Traffic Manager - Glossary Section
 * Displays glossary terms with an A-Z letter navigation bar.
 * Read-only browsing view for Account Managers.
 */

import React, { useState, useMemo } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { BookLetter24Regular } from '@fluentui/react-icons';
import { KBEntry } from '../../types/KnowledgeBase';

interface GlossarySectionProps {
  entries: KBEntry[];
  searchQuery: string;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  letterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('4px'),
    ...shorthands.padding('12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius('8px'),
    justifyContent: 'center',
  },
  letterButton: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    transitionProperty: 'background-color, color, border-color',
    transitionDuration: '150ms',
    ':hover': {
      backgroundColor: tokens.colorBrandBackground,
      color: tokens.colorNeutralForegroundOnBrand,
      ...shorthands.border('1px', 'solid', tokens.colorBrandBackground),
    },
  },
  letterButtonActive: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorBrandBackground),
    backgroundColor: tokens.colorBrandBackground,
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForegroundOnBrand,
  },
  letterButtonDimmed: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'default',
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForegroundDisabled,
  },
  clearButton: {
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('0', '12px'),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  termsList: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  termCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    ...shorthands.padding('16px', '20px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  termHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('12px'),
  },
  termTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  termContent: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap' as const,
  },
  filterInfo: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding('0', '4px'),
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('48px'),
    ...shorthands.gap('12px'),
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  emptyIcon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground3,
  },
});

export const GlossarySection: React.FC<GlossarySectionProps> = ({ entries, searchQuery }) => {
  const styles = useStyles();
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  // Filter by search query first
  const searchFiltered = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.Title.toLowerCase().includes(query) ||
        entry.Content.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  // Determine which letters have entries
  const lettersWithEntries = useMemo(() => {
    const letters = new Set<string>();
    for (const entry of searchFiltered) {
      const firstChar = entry.Title.charAt(0).toUpperCase();
      if (firstChar >= 'A' && firstChar <= 'Z') {
        letters.add(firstChar);
      }
    }
    return letters;
  }, [searchFiltered]);

  // Filter by active letter
  const displayedEntries = useMemo(() => {
    let result = searchFiltered;
    if (activeLetter) {
      result = result.filter(
        (entry) => entry.Title.charAt(0).toUpperCase() === activeLetter
      );
    }
    // Sort alphabetically by title
    return result.sort((a, b) => a.Title.localeCompare(b.Title));
  }, [searchFiltered, activeLetter]);

  const handleLetterClick = (letter: string) => {
    if (!lettersWithEntries.has(letter)) return;
    setActiveLetter((prev) => (prev === letter ? null : letter));
  };

  if (searchFiltered.length === 0) {
    return (
      <div className={styles.emptyState}>
        <BookLetter24Regular className={styles.emptyIcon} />
        <Text size={400} weight="semibold">
          No glossary terms found
        </Text>
        <Text size={300}>
          {searchQuery
            ? `No glossary terms match "${searchQuery}". Try a different search term.`
            : 'There are no glossary terms available yet.'}
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* A-Z Letter Bar */}
      <div className={styles.letterBar}>
        {ALPHABET.map((letter) => {
          const hasEntries = lettersWithEntries.has(letter);
          const isActive = activeLetter === letter;

          let className = styles.letterButtonDimmed;
          if (isActive) {
            className = styles.letterButtonActive;
          } else if (hasEntries) {
            className = styles.letterButton;
          }

          return (
            <button
              key={letter}
              className={className}
              onClick={() => handleLetterClick(letter)}
              aria-label={`Filter by letter ${letter}`}
              aria-pressed={isActive}
              disabled={!hasEntries}
            >
              {letter}
            </button>
          );
        })}
        {activeLetter && (
          <button
            className={styles.clearButton}
            onClick={() => setActiveLetter(null)}
            aria-label="Show all letters"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter info */}
      {activeLetter && (
        <Text className={styles.filterInfo}>
          Showing {displayedEntries.length} term{displayedEntries.length !== 1 ? 's' : ''} starting with "{activeLetter}"
        </Text>
      )}

      {/* Terms List */}
      {displayedEntries.length === 0 && activeLetter ? (
        <div className={styles.emptyState}>
          <Text size={300}>
            No terms starting with "{activeLetter}" found.
          </Text>
        </div>
      ) : (
        <div className={styles.termsList}>
          {displayedEntries.map((entry) => (
            <div key={entry.Id} className={styles.termCard}>
              <div className={styles.termHeader}>
                <Text className={styles.termTitle}>{entry.Title}</Text>
                <Badge
                  appearance="tint"
                  color="informative"
                  size="small"
                >
                  {entry.Category}
                </Badge>
              </div>
              <Text className={styles.termContent}>{entry.Content}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
