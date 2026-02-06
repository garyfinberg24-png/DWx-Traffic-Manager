/**
 * DWx Traffic Manager - Email Timeline
 * Vertical timeline showing sent emails for a service request.
 * Follows the same visual pattern as DealActivityTimeline.
 */

import React, { useState, useEffect } from 'react';
import { makeStyles, Text, Spinner } from '@fluentui/react-components';
import { Mail24Regular } from '@fluentui/react-icons';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { emailTrackingService } from '../../services/EmailTrackingService';
import {
  EmailRecord,
  EMAIL_TYPE_LABELS,
  EMAIL_TYPE_COLORS,
  EmailType,
} from '../../types/EmailTracking';

// ============================================================================
// Types
// ============================================================================

interface EmailTimelineProps {
  requestId: number;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    width: '100%',
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
    gap: '4px',
  },
  subject: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  recipients: {
    fontSize: '12px',
    color: '#616161',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  timestamp: {
    fontSize: '12px',
    color: '#616161',
  },
  typeBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '12px',
    display: 'inline-block',
    lineHeight: '16px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#616161',
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
// Helper: get dot color based on email type
// ============================================================================

function getDotColor(type: EmailType): string {
  return EMAIL_TYPE_COLORS[type]?.text || '#616161';
}

// ============================================================================
// Component (defined at module level)
// ============================================================================

export const EmailTimeline: React.FC<EmailTimelineProps> = ({ requestId }) => {
  const styles = useStyles();
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchEmails = async () => {
      try {
        setLoading(true);
        const records = await emailTrackingService.getEmailsForRequest(requestId);
        if (!cancelled) {
          setEmails(records);
        }
      } catch (err) {
        console.error('[EmailTimeline] Error fetching emails:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchEmails();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="small" />
        <Text size={300}>Loading emails...</Text>
      </div>
    );
  }

  // Empty state
  if (emails.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text size={300}>No emails sent for this request.</Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {emails.map((email, idx) => {
        const isLast = idx === emails.length - 1;
        const dotColor = getDotColor(email.type);
        const typeColors = EMAIL_TYPE_COLORS[email.type] || EMAIL_TYPE_COLORS.other;
        const typeLabel = EMAIL_TYPE_LABELS[email.type] || 'Other';
        const sentDate = parseISO(email.sentAt);
        const relativeTime = formatDistanceToNow(sentDate, { addSuffix: true });
        const fullDate = format(sentDate, 'MMM d, yyyy h:mm a');

        return (
          <div key={email.id} className={styles.entryRow}>
            {/* Timeline connector line */}
            <div
              className={isLast ? styles.timelineLineHidden : styles.timelineLine}
            />

            {/* Icon circle */}
            <div
              className={styles.iconCircle}
              style={{ backgroundColor: `${dotColor}15` }}
            >
              <Mail24Regular style={{ width: '16px', height: '16px', color: dotColor }} />
            </div>

            {/* Entry content */}
            <div className={styles.entryContent}>
              <Text className={styles.subject}>{email.subject}</Text>
              <Text className={styles.recipients}>
                To: {email.sentTo.join(', ')}
              </Text>
              <div className={styles.metaRow}>
                <Text className={styles.timestamp} title={fullDate}>
                  {relativeTime}
                </Text>
                <span
                  className={styles.typeBadge}
                  style={{
                    backgroundColor: typeColors.bg,
                    color: typeColors.text,
                  }}
                >
                  {typeLabel}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
