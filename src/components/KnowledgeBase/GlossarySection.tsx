/**
 * DWx Traffic Manager - Glossary Section (V3 Magazine)
 * Displays glossary terms as a 3-column card grid with letter indicators
 * and a refined A-Z alphabet bar.
 * Shows 6 terms by default, expandable to show all.
 * Read-only browsing view for Account Managers.
 */

import React, { useState, useMemo } from 'react';
import {
  Text,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import { BookLetter24Regular } from '@fluentui/react-icons';
import { KBEntry } from '../../types/KnowledgeBase';

interface GlossarySectionProps {
  entries: KBEntry[];
  searchQuery: string;
  expanded?: boolean;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },

  // Alphabet bar
  alphaBar: {
    display: 'flex',
    ...shorthands.gap('4px'),
    flexWrap: 'wrap',
    ...shorthands.padding('12px', '16px'),
    backgroundColor: '#fafbfc',
    ...shorthands.borderRadius('12px'),
  },
  alphaButton: {
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('0', 'none', 'transparent'),
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: '600',
    color: '#999',
    cursor: 'pointer',
    transitionProperty: 'background-color, color',
    transitionDuration: '150ms',
    ':hover': {
      backgroundColor: '#e8f4f8',
      color: '#1e6b7b',
    },
  },
  alphaButtonActive: {
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('0', 'none', 'transparent'),
    backgroundColor: '#1e6b7b',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    cursor: 'pointer',
  },
  alphaButtonDisabled: {
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('0', 'none', 'transparent'),
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: '600',
    color: '#ddd',
    cursor: 'default',
  },
  clearButton: {
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    color: '#616161',
    ...shorthands.padding('0', '12px'),
    marginLeft: '8px',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },

  // Card grid
  glossaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('12px'),
  },
  glossaryCard: {
    ...shorthands.padding('18px'),
    ...shorthands.borderRadius('10px'),
    backgroundColor: 'white',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    transitionProperty: 'border-color, background-color',
    transitionDuration: '150ms',
    ':hover': {
      ...shorthands.border('1px', 'solid', '#1e6b7b'),
      backgroundColor: '#fafbfc',
    },
  },
  termLetter: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#1e6b7b',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '6px',
  },
  termTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '6px',
  },
  termContent: {
    fontSize: '12px',
    color: '#999',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    ...shorthands.overflow('hidden'),
  },

  // Filter info
  filterInfo: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding('0', '4px'),
  },

  // Empty state
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

export const GlossarySection: React.FC<GlossarySectionProps> = ({
  entries,
  searchQuery,
  expanded = false,
}) => {
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
  const letterFiltered = useMemo(() => {
    let result = searchFiltered;
    if (activeLetter) {
      result = result.filter(
        (entry) => entry.Title.charAt(0).toUpperCase() === activeLetter
      );
    }
    return result.sort((a, b) => a.Title.localeCompare(b.Title));
  }, [searchFiltered, activeLetter]);

  // Show 6 by default, all when expanded/searching/letter-filtered
  const displayedEntries = useMemo(() => {
    if (expanded || searchQuery.trim() || activeLetter) return letterFiltered;
    return letterFiltered.slice(0, 6);
  }, [letterFiltered, expanded, searchQuery, activeLetter]);

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
      {/* A-Z Alphabet Bar */}
      <div className={styles.alphaBar}>
        {ALPHABET.map((letter) => {
          const hasEntries = lettersWithEntries.has(letter);
          const isActive = activeLetter === letter;

          let className = styles.alphaButtonDisabled;
          if (isActive) {
            className = styles.alphaButtonActive;
          } else if (hasEntries) {
            className = styles.alphaButton;
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
          Showing {displayedEntries.length} term{displayedEntries.length !== 1 ? 's' : ''} starting with &ldquo;{activeLetter}&rdquo;
        </Text>
      )}

      {/* Glossary Card Grid */}
      {displayedEntries.length === 0 && activeLetter ? (
        <div className={styles.emptyState}>
          <Text size={300}>
            No terms starting with &ldquo;{activeLetter}&rdquo; found.
          </Text>
        </div>
      ) : (
        <div className={styles.glossaryGrid}>
          {displayedEntries.map((entry) => (
            <div key={entry.Id} className={styles.glossaryCard}>
              <div className={styles.termLetter}>
                {entry.Title.charAt(0).toUpperCase()}
              </div>
              <Text className={styles.termTitle}>{entry.Title}</Text>
              <Text className={styles.termContent}>{entry.Content}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
