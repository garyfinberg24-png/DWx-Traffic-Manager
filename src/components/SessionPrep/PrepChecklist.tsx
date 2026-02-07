/**
 * DWx Traffic Manager - Preparation Checklist
 * Interactive checklist for session preparation tasks.
 * Styled to match DetailModalShell section patterns.
 */

import React from 'react';
import {
  Text,
  makeStyles,
} from '@fluentui/react-components';
import {
  SearchRegular,
  DesktopRegular,
  FolderRegular,
  CalendarRegular,
  CheckmarkRegular,
} from '@fluentui/react-icons';
import { PrepChecklistItem, PrepChecklistCategory } from '../../types/SessionPreparation';
import { DetailSection } from '../MyRequests/DetailModalShell';
import { format } from 'date-fns';
import { DW_COLORS } from '../../utils/buttonStyles';

const useStyles = makeStyles({
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px',
    textAlign: 'center',
    color: '#888',
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  progressLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#424242',
    minWidth: '60px',
  },
  progressTrack: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  progressPct: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a5a8a',
    minWidth: '40px',
    textAlign: 'right',
  },
  category: {
    marginBottom: '16px',
    border: '1px solid #eee',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #eee',
  },
  catIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#424242',
    flex: 1,
  },
  catProgress: {
    fontSize: '12px',
    color: '#888',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderBottom: '1px solid #f5f5f5',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: '2px solid #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  checkboxDone: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: `2px solid ${DW_COLORS.success}`,
    backgroundColor: DW_COLORS.success,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    flex: 1,
    fontSize: '13px',
    color: '#424242',
  },
  labelDone: {
    flex: 1,
    fontSize: '13px',
    color: '#888',
    textDecoration: 'line-through',
  },
  meta: {
    fontSize: '11px',
    color: '#aaa',
  },
});

const CATEGORY_CONFIG: Record<PrepChecklistCategory, {
  label: string;
  icon: React.ReactElement;
  color: { bg: string; text: string };
}> = {
  research: {
    label: 'Client Research',
    icon: <SearchRegular style={{ width: 14, height: 14 }} />,
    color: { bg: '#e8f4f6', text: '#1e6b7b' },
  },
  technical: {
    label: 'Technical Preparation',
    icon: <DesktopRegular style={{ width: 14, height: 14 }} />,
    color: { bg: '#f5eefa', text: '#8b5cf6' },
  },
  resources: {
    label: 'Resource Gathering',
    icon: <FolderRegular style={{ width: 14, height: 14 }} />,
    color: { bg: '#e8f6e8', text: '#107c10' },
  },
  logistics: {
    label: 'Meeting Logistics',
    icon: <CalendarRegular style={{ width: 14, height: 14 }} />,
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

  const itemsByCategory = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = items.filter((item) => item.category === category);
    return acc;
  }, {} as Record<PrepChecklistCategory, PrepChecklistItem[]>);

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
        <Text size={400} weight="semibold">No Checklist Items</Text>
        <Text>Checklist items will be created automatically when the session preparation is initialized.</Text>
      </div>
    );
  }

  return (
    <DetailSection
      icon={<CheckmarkRegular />}
      title="Preparation Checklist"
      editButton={
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10,
          fontSize: 11, fontWeight: 600, background: 'rgba(26,90,138,0.1)', color: '#1a5a8a',
        }}>
          {completedCount} of {totalCount}
        </span>
      }
      last
    >
      {/* Overall progress bar */}
      <div className={styles.progressBar}>
        <span className={styles.progressLabel}>Progress</span>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: `${overallProgress}%`,
              backgroundColor: overallProgress >= 100 ? DW_COLORS.success : DW_COLORS.primary,
            }}
          />
        </div>
        <span className={styles.progressPct}>{overallProgress}%</span>
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map((category) => {
        const categoryItems = itemsByCategory[category];
        const config = CATEGORY_CONFIG[category];
        const categoryCompleted = categoryItems.filter((item) => item.completed).length;

        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className={styles.category}>
            <div className={styles.categoryHeader}>
              <div
                className={styles.catIcon}
                style={{ backgroundColor: config.color.bg, color: config.color.text }}
              >
                {config.icon}
              </div>
              <span className={styles.catName}>{config.label}</span>
              <span className={styles.catProgress}>{categoryCompleted} of {categoryItems.length} complete</span>
            </div>

            <div>
              {categoryItems.map((item, index) => (
                <div
                  key={item.id}
                  className={styles.item}
                  onClick={() => handleToggleItem(item.id)}
                  style={index === categoryItems.length - 1 ? { borderBottom: 'none' } : undefined}
                >
                  <div className={item.completed ? styles.checkboxDone : styles.checkbox}>
                    {item.completed && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={item.completed ? styles.labelDone : styles.label}>
                    {item.label}
                  </span>
                  {item.completed && item.completedAt && (
                    <span className={styles.meta}>
                      {format(new Date(item.completedAt), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </DetailSection>
  );
};
