/**
 * DWx Traffic Manager - FAQ Section (V3 Magazine)
 * Displays FAQ entries as numbered cards in a 2-column grid.
 * Shows top 6 by default, expandable to show all with accordions grouped by category.
 * Read-only browsing view for Account Managers.
 */

import React, { useState, useMemo } from 'react';
import {
  Text,
  makeStyles,
  tokens,
  shorthands,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import { QuestionCircle24Regular } from '@fluentui/react-icons';
import { KBEntry, KBCategory, KB_CATEGORIES } from '../../types/KnowledgeBase';

interface FAQSectionProps {
  entries: KBEntry[];
  searchQuery: string;
  expanded?: boolean;
}

const useStyles = makeStyles({
  // Numbered card grid (compact view — top 6)
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
  },
  card: {
    display: 'flex',
    alignItems: 'flex-start',
    ...shorthands.gap('14px'),
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: 'white',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    cursor: 'pointer',
    transitionProperty: 'border-color, box-shadow',
    transitionDuration: '150ms',
    ':hover': {
      ...shorthands.border('1px', 'solid', '#cde5ec'),
      boxShadow: '0 2px 12px rgba(30,107,123,0.06)',
    },
  },
  cardNumber: {
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('10px'),
    background: 'linear-gradient(135deg, #1e6b7b, #2a8faa)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0,
  },
  cardContent: {
    flex: '1',
    minWidth: '0',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '6px',
  },
  cardExcerpt: {
    fontSize: '13px',
    color: '#616161',
    lineHeight: '1.5',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    ...shorthands.overflow('hidden'),
  },

  // Expanded accordion view (all FAQs grouped by category)
  expandedContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  categoryGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  categoryHeading: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0d3a5c',
    ...shorthands.padding('4px', '0'),
    ...shorthands.borderBottom('2px', 'solid', '#1e6b7b'),
    display: 'inline-block',
    marginBottom: '4px',
  },
  accordion: {
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.overflow('hidden'),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  accordionPanel: {
    ...shorthands.padding('8px', '16px', '16px', '16px'),
    fontSize: '14px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap' as const,
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

export const FAQSection: React.FC<FAQSectionProps> = ({
  entries,
  searchQuery,
  expanded = false,
}) => {
  const styles = useStyles();
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.Title.toLowerCase().includes(query) ||
        entry.Content.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  // Grouped by category (for expanded view)
  const groupedByCategory = useMemo(() => {
    const groups: Partial<Record<KBCategory, KBEntry[]>> = {};
    for (const entry of filteredEntries) {
      if (!groups[entry.Category]) {
        groups[entry.Category] = [];
      }
      groups[entry.Category]!.push(entry);
    }
    return KB_CATEGORIES
      .filter((cat) => groups[cat] && groups[cat]!.length > 0)
      .map((cat) => ({ category: cat, items: groups[cat]! }));
  }, [filteredEntries]);

  // Top entries for card view
  const cardEntries = useMemo(() => {
    return filteredEntries.slice(0, 6);
  }, [filteredEntries]);

  if (filteredEntries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <QuestionCircle24Regular className={styles.emptyIcon} />
        <Text size={400} weight="semibold">
          No FAQs found
        </Text>
        <Text size={300}>
          {searchQuery
            ? `No frequently asked questions match "${searchQuery}". Try a different search term.`
            : 'There are no FAQs available yet.'}
        </Text>
      </div>
    );
  }

  // Expanded view — full accordion grouped by category
  if (expanded || searchQuery.trim()) {
    return (
      <div className={styles.expandedContainer}>
        {groupedByCategory.map(({ category, items }) => (
          <div key={category} className={styles.categoryGroup}>
            <Text className={styles.categoryHeading}>{category}</Text>
            <Accordion multiple collapsible className={styles.accordion}>
              {items.map((entry) => (
                <AccordionItem key={entry.Id} value={entry.Id}>
                  <AccordionHeader>
                    {entry.Title}
                  </AccordionHeader>
                  <AccordionPanel className={styles.accordionPanel}>
                    {entry.Content}
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>
    );
  }

  // Default: numbered card grid (top 6)
  return (
    <div className={styles.cardGrid}>
      {cardEntries.map((entry, index) => (
        <div
          key={entry.Id}
          className={styles.card}
          onClick={() => setExpandedCard(expandedCard === entry.Id ? null : entry.Id)}
        >
          <div className={styles.cardNumber}>{index + 1}</div>
          <div className={styles.cardContent}>
            <Text className={styles.cardTitle}>{entry.Title}</Text>
            <Text className={styles.cardExcerpt}>
              {expandedCard === entry.Id ? entry.Content : entry.Content}
            </Text>
          </div>
        </div>
      ))}
    </div>
  );
};
