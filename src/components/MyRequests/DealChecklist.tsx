/**
 * DWx Traffic Manager - Deal Checklist
 * Displays per-deal checklist items with completion tracking.
 * Purely presentational — parent (RequestDetails) handles SharePoint persistence.
 */

import React, { useMemo } from 'react';
import {
  makeStyles,
  Text,
  Checkbox,
  Badge,
  ProgressBar,
  Tooltip,
} from '@fluentui/react-components';
import {
  CheckboxChecked24Regular,
  CheckmarkCircle24Regular,
  Circle24Regular,
  Star24Filled,
} from '@fluentui/react-icons';
import { DealChecklistItem, getChecklistSummary } from '../../types/Checklist';
import { DW_COLORS } from '../../utils/buttonStyles';

// ============================================================================
// Types
// ============================================================================

interface DealChecklistProps {
  requestId: number;
  items: DealChecklistItem[];
  onUpdate: (updatedItems: DealChecklistItem[]) => void;
  readOnly?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  // -- Progress header --
  progressHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e8e8e8',
  },
  progressTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  progressLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  progressBadges: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  allRequiredBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '12px',
    backgroundColor: '#e6f4ea',
    color: DW_COLORS.success,
    fontSize: '12px',
    fontWeight: '600',
  },
  progressBarWrapper: {
    width: '100%',
  },

  // -- Checklist items --
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '10px 12px',
    borderRadius: '6px',
    transition: 'background-color 150ms ease',
  },
  itemRowUnchecked: {
    backgroundColor: 'transparent',
  },
  itemRowChecked: {
    backgroundColor: '#f0faf0',
  },
  itemContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  itemLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  itemLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  itemLabelChecked: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#616161',
    textDecoration: 'line-through',
  },
  requiredBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    padding: '1px 6px',
    borderRadius: '4px',
    backgroundColor: '#fde8e8',
    color: '#c4314b',
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '16px',
  },
  itemDescription: {
    fontSize: '12px',
    color: '#616161',
    lineHeight: '18px',
  },
  completionInfo: {
    fontSize: '11px',
    color: '#919191',
    marginTop: '2px',
  },
  statusIcon: {
    flexShrink: 0,
    marginTop: '2px',
  },

  // -- Empty state --
  emptyState: {
    textAlign: 'center',
    padding: '40px 24px',
    color: '#616161',
  },
  emptyIcon: {
    display: 'block',
    margin: '0 auto 8px',
    color: '#c8c8c8',
  },
});

// ============================================================================
// Helper: format completion timestamp
// ============================================================================

function formatCompletedAt(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDate;
  }
}

// ============================================================================
// Component
// ============================================================================

export const DealChecklist: React.FC<DealChecklistProps> = ({
  requestId: _requestId,
  items,
  onUpdate,
  readOnly = false,
}) => {
  const styles = useStyles();

  const summary = useMemo(() => getChecklistSummary(items), [items]);

  // Sort items by sortOrder
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder),
    [items]
  );

  // Handle checkbox toggle
  const handleToggle = (itemId: string, checked: boolean) => {
    if (readOnly) return;

    const updatedItems = items.map((item) => {
      if (item.id !== itemId) return item;

      if (checked) {
        return {
          ...item,
          isCompleted: true,
          completedBy: 'current user',
          completedAt: new Date().toISOString(),
        };
      } else {
        return {
          ...item,
          isCompleted: false,
          completedBy: undefined,
          completedAt: undefined,
        };
      }
    });

    onUpdate(updatedItems);
  };

  // -- Empty state --
  if (items.length === 0) {
    return (
      <div className={styles.emptyState}>
        <CheckboxChecked24Regular className={styles.emptyIcon} />
        <Text size={300}>No checklist items for this deal.</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Progress header */}
      <div className={styles.progressHeader}>
        <div className={styles.progressTopRow}>
          <Text className={styles.progressLabel}>
            {summary.completed} of {summary.total} completed
            {summary.required > 0 && (
              <span style={{ fontWeight: 400, color: '#616161', marginLeft: '8px' }}>
                ({summary.requiredCompleted} of {summary.required} required)
              </span>
            )}
          </Text>

          <div className={styles.progressBadges}>
            <Badge
              appearance="filled"
              color={summary.percentage === 100 ? 'success' : 'informative'}
              size="small"
            >
              {summary.percentage}%
            </Badge>

            {summary.isComplete && (
              <Tooltip
                content="All required checklist items have been completed"
                relationship="description"
              >
                <span className={styles.allRequiredBadge}>
                  <CheckmarkCircle24Regular style={{ width: '14px', height: '14px' }} />
                  All required done
                </span>
              </Tooltip>
            )}
          </div>
        </div>

        <div className={styles.progressBarWrapper}>
          <ProgressBar
            value={summary.total > 0 ? summary.completed / summary.total : 0}
            thickness="large"
            color="success"
            style={{
              // @ts-ignore — override the track/bar color via CSS custom property
              '--fui-ProgressBar__bar--background': DW_COLORS.primary,
            }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className={styles.itemsList}>
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.itemRow} ${
              item.isCompleted ? styles.itemRowChecked : styles.itemRowUnchecked
            }`}
          >
            {/* Checkbox or status icon */}
            <Checkbox
              checked={item.isCompleted}
              disabled={readOnly}
              onChange={(_ev, data) => handleToggle(item.id, !!data.checked)}
              style={{ marginTop: '-2px' }}
            />

            {/* Content */}
            <div className={styles.itemContent}>
              <div className={styles.itemLabelRow}>
                <Text
                  className={
                    item.isCompleted ? styles.itemLabelChecked : styles.itemLabel
                  }
                >
                  {item.label}
                </Text>

                {item.isRequired && (
                  <span className={styles.requiredBadge}>
                    <Star24Filled style={{ width: '10px', height: '10px' }} />
                    Required
                  </span>
                )}
              </div>

              {item.description && (
                <Text className={styles.itemDescription}>{item.description}</Text>
              )}

              {item.isCompleted && item.completedBy && item.completedAt && (
                <Text className={styles.completionInfo}>
                  Completed by {item.completedBy} on {formatCompletedAt(item.completedAt)}
                </Text>
              )}
            </div>

            {/* Status indicator icon (right side) */}
            <div className={styles.statusIcon}>
              {item.isCompleted ? (
                <CheckmarkCircle24Regular
                  style={{ width: '20px', height: '20px', color: DW_COLORS.success }}
                />
              ) : (
                <Circle24Regular
                  style={{ width: '20px', height: '20px', color: '#c8c8c8' }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealChecklist;
