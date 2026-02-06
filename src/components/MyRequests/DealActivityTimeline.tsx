/**
 * DWx Traffic Manager - Deal Activity Timeline
 * Displays audit log entries for a deal, grouped by date, sorted newest first.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { makeStyles, Text, Spinner } from '@fluentui/react-components';
import { formatDistanceToNow, parseISO, isToday, isYesterday, format, startOfDay } from 'date-fns';
import {
  Add24Regular,
  Edit24Regular,
  ArrowForward24Regular,
  Delete24Regular,
  Checkmark24Regular,
  Eye24Regular,
  PersonRegular,
  CalendarLtr24Regular,
} from '@fluentui/react-icons';
import { auditService, AuditLogEntry } from '../../services/AuditService';

// ============================================================================
// Types
// ============================================================================

interface DealActivityTimelineProps {
  entityId: number;
  entityType: 'ServiceRequest' | 'ProductRequest';
}

interface DateGroup {
  dateKey: string;
  label: string;
  entries: AuditLogEntry[];
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    width: '100%',
  },
  dateGroup: {
    marginBottom: '20px',
  },
  dateLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e8e8e8',
  },
  entryRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    position: 'relative',
  },
  iconCircle: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: '#f0f0f0',
  },
  timelineLine: {
    position: 'absolute',
    left: '15px',
    top: '36px',
    bottom: '-8px',
    width: '2px',
    backgroundColor: '#e8e8e8',
  },
  timelineLineHidden: {
    display: 'none',
  },
  entryContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  entryDescription: {
    fontSize: '14px',
    color: '#242424',
  },
  entryMeta: {
    fontSize: '12px',
    color: '#616161',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#616161',
  },
  errorState: {
    textAlign: 'center',
    padding: '40px',
    color: '#d13438',
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    gap: '8px',
  },
});

// ============================================================================
// Helper: format activity description from audit entry
// ============================================================================

function formatActivityDescription(entry: AuditLogEntry): string {
  try {
    const newValues = entry.NewValues ? JSON.parse(entry.NewValues) : null;

    if (newValues) {
      if (newValues.FunnelStage) {
        return `Stage changed to ${newValues.FunnelStage}`;
      }
      if (newValues.Status && !newValues.FunnelStage) {
        return `Status changed to ${newValues.Status}`;
      }
      if (newValues.AssignedSpecialistName) {
        return `Specialist ${newValues.AssignedSpecialistName} assigned`;
      }
      if (newValues.DealValue !== undefined) {
        const formatted = new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
          minimumFractionDigits: 0,
        }).format(newValues.DealValue);
        return `Deal value updated to ${formatted}`;
      }
      if (newValues.reminderSent !== undefined) {
        return 'Follow-up reminder sent';
      }
    }
  } catch {
    // JSON parse failed, fall through to defaults
  }

  if (entry.Action === 'CREATE') {
    return 'Created';
  }

  if (entry.Details) {
    return entry.Details;
  }

  return `${entry.Action} ${entry.EntityType}`;
}

// ============================================================================
// Helper: get icon and color for an audit action
// ============================================================================

interface ActionIconConfig {
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  color: string;
}

function getActionIcon(action: string): ActionIconConfig {
  switch (action) {
    case 'CREATE':
      return { Icon: Add24Regular, color: '#107c10' };
    case 'UPDATE':
      return { Icon: Edit24Regular, color: '#1a5a8a' };
    case 'DELETE':
      return { Icon: Delete24Regular, color: '#d13438' };
    case 'APPROVE':
      return { Icon: Checkmark24Regular, color: '#107c10' };
    case 'REJECT':
      return { Icon: Delete24Regular, color: '#d13438' };
    case 'RESCHEDULE':
      return { Icon: CalendarLtr24Regular, color: '#f7630c' };
    case 'VIEW':
      return { Icon: Eye24Regular, color: '#616161' };
    case 'LOGIN':
    case 'LOGOUT':
      return { Icon: PersonRegular, color: '#616161' };
    default:
      return { Icon: ArrowForward24Regular, color: '#616161' };
  }
}

// ============================================================================
// Helper: format date group label
// ============================================================================

function formatDateLabel(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d, yyyy');
}

// ============================================================================
// Component
// ============================================================================

export const DealActivityTimeline: React.FC<DealActivityTimelineProps> = ({
  entityId,
  entityType,
}) => {
  const styles = useStyles();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const logs = await auditService.getAuditLogs({
          entityType,
          entityId: String(entityId),
        });

        if (!cancelled) {
          // Sort by Timestamp descending (service already does this, but ensure)
          logs.sort(
            (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
          );
          setEntries(logs);
        }
      } catch (err) {
        console.error('[DealActivityTimeline] Error fetching audit logs:', err);
        if (!cancelled) {
          setError('Failed to load activity log. Please try again later.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchLogs();

    return () => {
      cancelled = true;
    };
  }, [entityId, entityType]);

  // Group entries by date
  const dateGroups = useMemo((): DateGroup[] => {
    const groupMap = new Map<string, AuditLogEntry[]>();

    for (const entry of entries) {
      const entryDate = startOfDay(parseISO(entry.Timestamp));
      const dateKey = entryDate.toISOString();

      if (!groupMap.has(dateKey)) {
        groupMap.set(dateKey, []);
      }
      groupMap.get(dateKey)!.push(entry);
    }

    const groups: DateGroup[] = [];
    for (const [dateKey, groupEntries] of groupMap.entries()) {
      groups.push({
        dateKey,
        label: formatDateLabel(new Date(dateKey)),
        entries: groupEntries,
      });
    }

    return groups;
  }, [entries]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="small" />
        <Text size={300}>Loading activity...</Text>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorState}>
        <Text size={300}>{error}</Text>
      </div>
    );
  }

  // Empty state
  if (entries.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={300}>No activity recorded for this deal yet.</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {dateGroups.map((group) => (
        <div key={group.dateKey} className={styles.dateGroup}>
          <div className={styles.dateLabel}>{group.label}</div>
          {group.entries.map((entry, idx) => {
            const { Icon, color } = getActionIcon(entry.Action);
            const isLast = idx === group.entries.length - 1;
            const relativeTime = formatDistanceToNow(parseISO(entry.Timestamp), {
              addSuffix: true,
            });

            return (
              <div key={entry.Id || `${entry.Timestamp}-${idx}`} className={styles.entryRow}>
                {/* Timeline connector line */}
                <div
                  className={isLast ? styles.timelineLineHidden : styles.timelineLine}
                />

                {/* Icon circle */}
                <div className={styles.iconCircle} style={{ backgroundColor: `${color}15` }}>
                  <Icon style={{ width: '16px', height: '16px', color }} />
                </div>

                {/* Entry content */}
                <div className={styles.entryContent}>
                  <Text className={styles.entryDescription}>
                    {formatActivityDescription(entry)}
                  </Text>
                  <Text className={styles.entryMeta}>
                    by {entry.PerformedBy} &middot; {relativeTime}
                  </Text>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};
