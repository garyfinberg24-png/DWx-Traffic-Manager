/**
 * DWx Traffic Manager - Article Section (V3 Magazine)
 * Featured article cards with gradient banners, category badges, and tag pills.
 * Shows 3 featured by default, expandable to show all.
 * Read-only browsing view for Account Managers.
 */

import React, { useState, useMemo } from 'react';
import {
  Text,
  Badge,
  makeStyles,
  tokens,
  shorthands,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@fluentui/react-components';
import { BookOpen24Regular, Dismiss24Regular } from '@fluentui/react-icons';
import { KBEntry } from '../../types/KnowledgeBase';

interface ArticleSectionProps {
  entries: KBEntry[];
  searchQuery: string;
  expanded?: boolean;
  categoryGradients?: Record<string, string>;
}

const DEFAULT_GRADIENTS: Record<string, string> = {
  Process: 'linear-gradient(135deg, #0d3a5c, #1e6b7b)',
  Services: 'linear-gradient(135deg, #1e6b7b, #2a8d6e)',
  Technical: 'linear-gradient(135deg, #1a5a8a, #3a7bd5)',
  Products: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
  General: 'linear-gradient(135deg, #0d3a5c, #1a5a8a)',
  Commercial: 'linear-gradient(135deg, #1e6b7b, #1a5a8a)',
};

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('20px'),
  },
  card: {
    ...shorthands.borderRadius('16px'),
    ...shorthands.overflow('hidden'),
    cursor: 'pointer',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '200ms',
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    ':hover': {
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      transform: 'translateY(-2px)',
    },
  },
  cardBanner: {
    height: '120px',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    ...shorthands.padding('16px'),
  },
  cardBannerTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '1.3',
  },
  categoryBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(8px)',
    color: 'white',
    ...shorthands.padding('4px', '10px'),
    ...shorthands.borderRadius('12px'),
    fontSize: '11px',
    fontWeight: '600',
  },
  cardBody: {
    ...shorthands.padding('16px'),
    backgroundColor: 'white',
  },
  cardExcerpt: {
    fontSize: '13px',
    color: '#616161',
    lineHeight: '1.6',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    ...shorthands.overflow('hidden'),
  },
  cardTags: {
    display: 'flex',
    ...shorthands.gap('6px'),
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f4f8',
    color: '#1e6b7b',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('10px'),
    fontSize: '11px',
    fontWeight: '500',
  },

  // Dialog
  dialogSurface: {
    maxWidth: '700px',
    width: '100%',
  },
  dialogContent: {
    fontSize: '14px',
    lineHeight: '1.7',
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'pre-wrap' as const,
  },
  dialogMeta: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginBottom: '16px',
    flexWrap: 'wrap',
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

export const ArticleSection: React.FC<ArticleSectionProps> = ({
  entries,
  searchQuery,
  expanded = false,
  categoryGradients,
}) => {
  const styles = useStyles();
  const [selectedArticle, setSelectedArticle] = useState<KBEntry | null>(null);
  const gradients = categoryGradients || DEFAULT_GRADIENTS;

  const filteredEntries = useMemo(() => {
    let result = entries;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.Title.toLowerCase().includes(query) ||
          entry.Content.toLowerCase().includes(query)
      );
    }
    return result;
  }, [entries, searchQuery]);

  // Show 3 featured by default, all when expanded or searching
  const displayedEntries = useMemo(() => {
    if (expanded || searchQuery.trim()) return filteredEntries;
    return filteredEntries.slice(0, 3);
  }, [filteredEntries, expanded, searchQuery]);

  if (filteredEntries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <BookOpen24Regular className={styles.emptyIcon} />
        <Text size={400} weight="semibold">
          No articles found
        </Text>
        <Text size={300}>
          {searchQuery
            ? `No articles match "${searchQuery}". Try a different search term.`
            : 'There are no articles available yet.'}
        </Text>
      </div>
    );
  }

  return (
    <>
      <div className={styles.grid}>
        {displayedEntries.map((entry) => {
          const gradient = gradients[entry.Category] || gradients.General;
          return (
            <div
              key={entry.Id}
              className={styles.card}
              onClick={() => setSelectedArticle(entry)}
            >
              <div
                className={styles.cardBanner}
                style={{ background: gradient }}
              >
                <span className={styles.categoryBadge}>{entry.Category}</span>
                <Text className={styles.cardBannerTitle}>{entry.Title}</Text>
              </div>
              <div className={styles.cardBody}>
                <Text className={styles.cardExcerpt}>{entry.Content}</Text>
                {entry.Tags && entry.Tags.length > 0 && (
                  <div className={styles.cardTags}>
                    {entry.Tags.map((tag) => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Article detail dialog */}
      <Dialog
        open={!!selectedArticle}
        onOpenChange={(_, data) => {
          if (!data.open) setSelectedArticle(null);
        }}
      >
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  onClick={() => setSelectedArticle(null)}
                />
              }
            >
              {selectedArticle?.Title}
            </DialogTitle>
            <DialogContent>
              {selectedArticle && (
                <>
                  <div className={styles.dialogMeta}>
                    <Badge appearance="tint" color="informative">
                      {selectedArticle.Category}
                    </Badge>
                    {selectedArticle.Tags &&
                      selectedArticle.Tags.map((tag) => (
                        <Badge key={tag} appearance="outline" size="small">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                  <Text className={styles.dialogContent}>
                    {selectedArticle.Content}
                  </Text>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setSelectedArticle(null)}
              >
                Close
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};
