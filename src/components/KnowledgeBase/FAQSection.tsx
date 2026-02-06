/**
 * DWx Traffic Manager - FAQ Section
 * Displays FAQ entries grouped by category in collapsible accordions.
 * Read-only browsing view for Account Managers.
 */

import React, { useMemo } from 'react';
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
}

const useStyles = makeStyles({
  container: {
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
    color: tokens.colorNeutralForeground1,
    ...shorthands.padding('4px', '0'),
    ...shorthands.borderBottom('2px', 'solid', tokens.colorBrandBackground),
    display: 'inline-block',
    marginBottom: '4px',
  },
  accordion: {
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.overflow('hidden'),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  accordionHeader: {
    fontSize: '14px',
    fontWeight: '500',
  },
  accordionPanel: {
    ...shorthands.padding('8px', '16px', '16px', '16px'),
    fontSize: '14px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'pre-wrap' as const,
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

export const FAQSection: React.FC<FAQSectionProps> = ({ entries, searchQuery }) => {
  const styles = useStyles();

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.Title.toLowerCase().includes(query) ||
        entry.Content.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

  const groupedByCategory = useMemo(() => {
    const groups: Partial<Record<KBCategory, KBEntry[]>> = {};
    for (const entry of filteredEntries) {
      if (!groups[entry.Category]) {
        groups[entry.Category] = [];
      }
      groups[entry.Category]!.push(entry);
    }
    // Return in defined order, only categories that have entries
    return KB_CATEGORIES
      .filter((cat) => groups[cat] && groups[cat]!.length > 0)
      .map((cat) => ({ category: cat, items: groups[cat]! }));
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

  return (
    <div className={styles.container}>
      {groupedByCategory.map(({ category, items }) => (
        <div key={category} className={styles.categoryGroup}>
          <Text className={styles.categoryHeading}>{category}</Text>
          <Accordion multiple collapsible className={styles.accordion}>
            {items.map((entry) => (
              <AccordionItem key={entry.Id} value={entry.Id}>
                <AccordionHeader className={styles.accordionHeader}>
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
};
