/**
 * DWx Traffic Manager - Article Section
 * Displays knowledge base articles as a card grid with search and read-more dialog.
 * Read-only browsing view for Account Managers.
 */

import React, { useState, useMemo } from 'react';
import {
  Text,
  Badge,
  Card,
  makeStyles,
  tokens,
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
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  card: {
    padding: '20px',
    cursor: 'pointer',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '150ms',
    ':hover': {
      boxShadow: tokens.shadow8,
    },
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '8px',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  cardExcerpt: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground2,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
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
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '12px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  emptyIcon: {
    fontSize: '48px',
    color: tokens.colorNeutralForeground3,
  },
});

export const ArticleSection: React.FC<ArticleSectionProps> = ({ entries, searchQuery }) => {
  const styles = useStyles();
  const [selectedArticle, setSelectedArticle] = useState<KBEntry | null>(null);

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(
      (entry) =>
        entry.Title.toLowerCase().includes(query) ||
        entry.Content.toLowerCase().includes(query)
    );
  }, [entries, searchQuery]);

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
    <div className={styles.container}>
      <div className={styles.grid}>
        {filteredEntries.map((entry) => (
          <Card
            key={entry.Id}
            className={styles.card}
            onClick={() => setSelectedArticle(entry)}
          >
            <div className={styles.cardHeader}>
              <Text className={styles.cardTitle}>{entry.Title}</Text>
              <Badge appearance="tint" color="informative" size="small">
                {entry.Category}
              </Badge>
            </div>
            <Text className={styles.cardExcerpt}>{entry.Content}</Text>
            <div className={styles.cardFooter}>
              {entry.Tags &&
                entry.Tags.map((tag) => (
                  <Badge key={tag} appearance="outline" size="small">
                    {tag}
                  </Badge>
                ))}
            </div>
          </Card>
        ))}
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
    </div>
  );
};
