import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Text,
  makeStyles,
  Spinner,
  Divider,
} from '@fluentui/react-components';
import {
  CalendarLtr24Regular,
  Person24Regular,
  Building24Regular,
  Star24Filled,
  Clock24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Dismiss16Regular,
  DocumentText24Regular,
} from '@fluentui/react-icons';
import { BookingFormData } from '../../types/Booking';
import { format } from 'date-fns';

const useStyles = makeStyles({
  surface: {
    maxWidth: '560px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25.6px 57.6px 0 rgba(0,0,0,.22), 0 4.8px 14.4px 0 rgba(0,0,0,.18)',
  },
  dialogBody: {
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2d8a9c 100%)',
    color: 'white',
    position: 'relative',
    flexShrink: 0,
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  headerSubtitle: {
    fontSize: '13px',
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    minWidth: '28px',
    width: '28px',
    height: '28px',
    padding: '0',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    color: '#1e6b7b',
    width: '16px',
    height: '16px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  detailCard: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
  },
  detailLabel: {
    fontSize: '11px',
    color: '#616161',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
  },
  detailValueLarge: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e6b7b',
  },
  premiumBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: 'linear-gradient(135deg, rgba(229, 168, 75, 0.15) 0%, rgba(229, 168, 75, 0.1) 100%)',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#8b6914',
    marginLeft: '8px',
  },
  timeSlots: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  timeSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
  },
  slotNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#1e6b7b',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  slotDate: {
    fontSize: '14px',
    color: '#242424',
  },
  commentsBox: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    borderLeft: '3px solid #1e6b7b',
  },
  commentsText: {
    fontSize: '14px',
    color: '#242424',
    fontStyle: 'italic',
    lineHeight: '1.5',
  },
  noComments: {
    fontSize: '13px',
    color: '#616161',
    fontStyle: 'italic',
  },
  actions: {
    padding: '16px 24px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0,
  },
  actionButton: {
    minWidth: '120px',
    whiteSpace: 'nowrap',
  },
  submitBtn: {
    backgroundColor: '#1e6b7b',
    minWidth: '150px',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
});

interface BookingPreviewProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data: BookingFormData | null;
  accountManager: { name: string; email: string };
  isSubmitting: boolean;
}

export const BookingPreview: React.FC<BookingPreviewProps> = ({
  open,
  onClose,
  onConfirm,
  data,
  accountManager,
  isSubmitting,
}) => {
  const styles = useStyles();

  if (!data) return null;

  const formatDateTime = (date: Date) => {
    return format(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header - direct child of DialogBody, NOT inside DialogContent */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <CalendarLtr24Regular />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Confirm Booking Request</div>
              <div className={styles.headerSubtitle}>
                Please review the details before submitting
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close dialog"
            >
              <Dismiss16Regular />
            </button>
          </div>

          {/* Content - wrapped in DialogContent for scrolling */}
          <DialogContent className={styles.body}>
            {/* Client & Type Section */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <Building24Regular className={styles.sectionIcon} />
                Client Information
              </div>
              <div className={styles.detailsGrid}>
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>Client Name</div>
                  <div className={styles.detailValue}>
                    {data.clientName}
                    {data.isPremiumClient && (
                      <span className={styles.premiumBadge}>
                        <Star24Filled style={{ width: '12px', height: '12px' }} />
                        Premium
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>Booking Type</div>
                  <div className={styles.detailValue}>
                    License Pulse {data.bookingType}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Manager & License Count */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <Person24Regular className={styles.sectionIcon} />
                Booking Details
              </div>
              <div className={styles.detailsGrid}>
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>Account Manager</div>
                  <div className={styles.detailValue}>{accountManager.name}</div>
                </div>
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>License Count</div>
                  <div className={styles.detailValueLarge}>
                    {data.licenseCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <Divider style={{ margin: '4px 0 20px' }} />

            {/* Time Slots */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <Clock24Regular className={styles.sectionIcon} />
                Proposed Time Slots
              </div>
              <div className={styles.timeSlots}>
                <div className={styles.timeSlot}>
                  <span className={styles.slotNumber}>1</span>
                  <span className={styles.slotDate}>
                    {formatDateTime(data.proposedSlot1)}
                  </span>
                </div>
                <div className={styles.timeSlot}>
                  <span className={styles.slotNumber}>2</span>
                  <span className={styles.slotDate}>
                    {formatDateTime(data.proposedSlot2)}
                  </span>
                </div>
                <div className={styles.timeSlot}>
                  <span className={styles.slotNumber}>3</span>
                  <span className={styles.slotDate}>
                    {formatDateTime(data.proposedSlot3)}
                  </span>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                <DocumentText24Regular className={styles.sectionIcon} />
                Comments
              </div>
              {data.comments ? (
                <div className={styles.commentsBox}>
                  <div className={styles.commentsText}>"{data.comments}"</div>
                </div>
              ) : (
                <Text className={styles.noComments}>No additional comments provided</Text>
              )}
            </div>
          </DialogContent>

          {/* Actions - direct child of DialogBody, NOT DialogActions */}
          <div className={styles.actions}>
            <Button
              appearance="secondary"
              className={styles.actionButton}
              icon={<Dismiss24Regular />}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Go Back
            </Button>
            <Button
              appearance="primary"
              className={styles.submitBtn}
              icon={isSubmitting ? <Spinner size="tiny" /> : <Checkmark24Regular />}
              onClick={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
