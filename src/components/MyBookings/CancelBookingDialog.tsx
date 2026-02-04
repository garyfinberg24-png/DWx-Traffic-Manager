import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Text,
  Textarea,
  Field,
  makeStyles,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Dismiss16Regular,
  DismissCircle24Filled,
} from '@fluentui/react-icons';
import { Booking } from '../../types/Booking';
import { format } from 'date-fns';

const useStyles = makeStyles({
  surface: {
    maxWidth: '480px',
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
    background: 'linear-gradient(135deg, #d13438 0%, #e74c4c 100%)',
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
  bookingInfo: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  infoLabel: {
    fontSize: '13px',
    color: '#616161',
  },
  infoValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#242424',
  },
  warningBox: {
    marginBottom: '20px',
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
  cancelBtn: {
    backgroundColor: '#d13438',
    ':hover': {
      backgroundColor: '#a52a2d',
    },
  },
  error: {
    marginBottom: '16px',
  },
});

interface CancelBookingDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  booking: Booking | null;
}

export const CancelBookingDialog: React.FC<CancelBookingDialogProps> = ({
  open,
  onClose,
  onConfirm,
  booking,
}) => {
  const styles = useStyles();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      setReason('');
      setError(null);
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;

  const isConfirmed = booking.Status === 'Confirmed';

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <DismissCircle24Filled />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Cancel Booking</div>
              <div className={styles.headerSubtitle}>
                {booking.ClientName} - {booking.BookingType}
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close dialog"
            >
              <Dismiss16Regular />
            </button>
          </div>

          <DialogContent className={styles.body}>
            {error && (
              <MessageBar intent="error" className={styles.error}>
                <MessageBarBody>
                  <MessageBarTitle>Error</MessageBarTitle>
                  {error}
                </MessageBarBody>
              </MessageBar>
            )}

            {isConfirmed && (
              <MessageBar intent="warning" className={styles.warningBox}>
                <MessageBarBody>
                  <MessageBarTitle>Confirmed Booking</MessageBarTitle>
                  This booking is already confirmed. Cancelling will remove the calendar event and notify the management team.
                </MessageBarBody>
              </MessageBar>
            )}

            <div className={styles.bookingInfo}>
              <div className={styles.infoRow}>
                <Text className={styles.infoLabel}>Client</Text>
                <Text className={styles.infoValue}>{booking.ClientName}</Text>
              </div>
              <div className={styles.infoRow}>
                <Text className={styles.infoLabel}>Type</Text>
                <Text className={styles.infoValue}>{booking.BookingType}</Text>
              </div>
              <div className={styles.infoRow}>
                <Text className={styles.infoLabel}>Licenses</Text>
                <Text className={styles.infoValue}>{booking.LicenseCount.toLocaleString()}</Text>
              </div>
              <div className={styles.infoRow}>
                <Text className={styles.infoLabel}>Status</Text>
                <Text className={styles.infoValue}>{booking.Status}</Text>
              </div>
              {booking.ConfirmedDateTime && (
                <div className={styles.infoRow}>
                  <Text className={styles.infoLabel}>Scheduled</Text>
                  <Text className={styles.infoValue}>
                    {format(new Date(booking.ConfirmedDateTime), "MMM d, yyyy 'at' h:mm a")}
                  </Text>
                </div>
              )}
            </div>

            <Field
              label="Cancellation Reason"
              required
              hint="Please explain why this booking needs to be cancelled (e.g., client requested, schedule conflict)"
            >
              <Textarea
                value={reason}
                onChange={(_, data) => setReason(data.value)}
                placeholder="Enter the reason for cancellation..."
                rows={4}
                disabled={isSubmitting}
              />
            </Field>
          </DialogContent>

          <div className={styles.actions}>
            <Button
              appearance="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Keep Booking
            </Button>
            <Button
              appearance="primary"
              className={styles.cancelBtn}
              onClick={handleConfirm}
              disabled={isSubmitting || !reason.trim()}
              icon={isSubmitting ? <Spinner size="tiny" /> : <Dismiss24Regular />}
            >
              {isSubmitting ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
