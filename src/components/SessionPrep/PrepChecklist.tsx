/**
 * DWx Traffic Manager - Preparation Checklist
 * Interactive checklist for session preparation tasks
 */

import React from 'react';
import {
  Text,
  Checkbox,
  Card,
  makeStyles,
  tokens,
  Badge,
  ProgressBar,
} from '@fluentui/react-components';
import {
  SearchRegular,
  DesktopRegular,
  FolderRegular,
  CalendarRegular,
} from '@fluentui/react-icons';
import { PrepChecklistItem, PrepChecklistCategory } from '../../types/SessionPreparation';
import { format } from 'date-fns';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  progressSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  progressLabel: {
    fontSize: '13px',
    fontWeight: '500',
    minWidth: '80px',
  },
  progressBar: {
    flex: 1,
  },
  progressPercent: {
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '50px',
    textAlign: 'right',
  },
  categorySection: {
    marginBottom: tokens.spacingVerticalL,
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
  },
  categoryIcon: {
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontWeight: '600',
    fontSize: '14px',
  },
  categoryProgress: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  checklistItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: 'background-color 0.1s ease',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  completedItem: {
    textDecoration: 'line-through',
    color: tokens.colorNeutralForeground3,
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  itemLabel: {
    fontSize: '14px',
  },
  completedMeta: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground4,
    marginTop: '2px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
});

const CATEGORY_CONFIG: Record<PrepChecklistCategory, {
  label: string;
  icon: React.ReactElement;
  color: { bg: string; text: string };
}> = {
  research: {
    label: 'Client Research',
    icon: <SearchRegular />,
    color: { bg: '#e8f4f6', text: '#1e6b7b' },
  },
  technical: {
    label: 'Technical Preparation',
    icon: <DesktopRegular />,
    color: { bg: '#f5eefa', text: '#8b5cf6' },
  },
  resources: {
    label: 'Resource Gathering',
    icon: <FolderRegular />,
    color: { bg: '#e8f6e8', text: '#107c10' },
  },
  logistics: {
    label: 'Meeting Logistics',
    icon: <CalendarRegular />,
    color: { bg: '#fff4e5', text: '#f59e0b' },
  },
};

const CATEGORY_ORDER: PrepChecklistCategory[] = ['research', 'technical', 'resources', 'logistics'];

interface PrepChecklistProps {
  items: PrepChecklistItem[];
  onUpdate: (items: PrepChecklistItem[]) => void;
}

export const PrepChecklist: React.FC<PrepChecklistProps> = ({
  items,
  onUpdate,
}) => {
  const styles = useStyles();

  // Group items by category
  const itemsByCategory = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = items.filter((item) => item.category === category);
    return acc;
  }, {} as Record<PrepChecklistCategory, PrepChecklistItem[]>);

  // Calculate overall progress
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleItem = (itemId: string) => {
    const updated = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            completed: !item.completed,
            completedAt: !item.completed ? new Date().toISOString() : undefined,
          }
        : item
    );
    onUpdate(updated);
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={400} weight="semibold">
          No Checklist Items
        </Text>
        <Text>
          Checklist items will be created automatically when the session preparation is initialized.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text weight="semibold">Preparation Checklist</Text>
          <Badge appearance="filled" color={overallProgress >= 100 ? 'success' : 'informative'}>
            {completedCount}/{totalCount} complete
          </Badge>
        </div>
      </div>

      {/* Overall Progress */}
      <div className={styles.progressSection}>
        <Text className={styles.progressLabel}>Progress</Text>
        <ProgressBar
          className={styles.progressBar}
          value={overallProgress / 100}
          color={overallProgress >= 100 ? 'success' : 'brand'}
        />
        <Text className={styles.progressPercent}>{overallProgress}%</Text>
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = itemsByCategory[category];
        const config = CATEGORY_CONFIG[category];
        const categoryCompleted = categoryItems.filter((item) => item.completed).length;

        if (categoryItems.length === 0) return null;

        return (
          <Card key={category} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <div
                className={styles.categoryIcon}
                style={{ backgroundColor: config.color.bg, color: config.color.text }}
              >
                {config.icon}
              </div>
              <div className={styles.categoryInfo}>
                <Text className={styles.categoryTitle}>{config.label}</Text>
                <Text className={styles.categoryProgress}>
                  {categoryCompleted} of {categoryItems.length} complete
                </Text>
              </div>
              <Badge
                appearance="outline"
                color={categoryCompleted === categoryItems.length ? 'success' : 'warning'}
              >
                {categoryCompleted === categoryItems.length ? 'Done' : `${categoryItems.length - categoryCompleted} left`}
              </Badge>
            </div>

            {categoryItems.map((item) => (
              <div
                key={item.id}
                className={styles.checklistItem}
                onClick={() => handleToggleItem(item.id)}
              >
                <Checkbox
                  checked={item.completed}
                  onChange={() => handleToggleItem(item.id)}
                  aria-label={item.label}
                />
                <div className={styles.itemInfo}>
                  <Text className={`${styles.itemLabel} ${item.completed ? styles.completedItem : ''}`}>
                    {item.label}
                  </Text>
                  {item.completed && item.completedAt && (
                    <Text className={styles.completedMeta}>
                      Completed {format(new Date(item.completedAt), 'MMM d, h:mm a')}
                      {item.completedBy && ` by ${item.completedBy}`}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </Card>
        );
      })}
    </div>
  );
};
