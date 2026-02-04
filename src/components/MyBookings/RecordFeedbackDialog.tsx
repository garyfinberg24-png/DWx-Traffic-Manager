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
  Dropdown,
  Option,
  makeStyles,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  Dismiss16Regular,
  Notepad24Filled,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { Booking } from '../../types/Booking';
import { format } from 'date-fns';

const useStyles = makeStyles({
  surface: {
    maxWidth: '520px',
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
    background: 'linear-gradient(135deg, #107c10 0%, #28a745 100%)',
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
  bookingInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  bookingInfoLabel: {
    color: '#616161',
    fontSize: '13px',
  },
  bookingInfoValue: {
    fontWeight: '500',
    fontSize: '13px',
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e0e0e0',
    backgroundColor: '#fafafa',
    flexShrink: 0,
  },
  saveBtn: {
    backgroundColor: '#107c10',
    ':hover': {
      backgroundColor: '#0b5c0b',
    },
  },
  existingFeedback: {
    padding: '16px',
    backgroundColor: '#e8f5e9',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #c8e6c9',
  },
  existingLabel: {
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: '8px',
    fontSize: '13px',
  },
  existingValue: {
    color: '#1b5e20',
    fontSize: '14px',
  },
});

const OUTCOME_OPTIONS = [
  'Interested - Follow-up Required',
  'Very Interested - Quote Requested',
  'Deal Closed - Won',
  'Not Interested',
  'Needs More Information',
  'Postponed',
  'No Show',
  'Other',
];

interface RecordFeedbackDialogProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onSave: (bookingId: number, outcome: string, nextSteps: string) => Promise<void>;
}

export const RecordFeedbackDialog: React.FC<RecordFeedbackDialogProps> = ({
  booking,
  open,
  onClose,
  onSave,
}) => {
  const styles = useStyles();
  const [outcome, setOutcome] = useState<string>(booking?.Outcome || '');
  const [nextSteps, setNextSteps] = useState<string>(booking?.NextSteps || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when booking changes
  React.useEffect(() => {
    if (booking) {
      setOutcome(booking.Outcome || '');
      setNextSteps(booking.NextSteps || '');
      setError(null);
    }
  }, [booking]);

  if (!booking) return null;

  const handleSubmit = async () => {
    if (!outcome.trim()) {
      setError('Please select an outcome');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave(booking.Id, outcome.trim(), nextSteps.trim());
      onClose();
    } catch (err) {
      console.error('Failed to save feedback:', err);
      setError(err instanceof Error ? err.message : 'Failed to save feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasExistingFeedback = booking.Outcome || booking.NextSteps;

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <Notepad24Filled />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Record Feedback</div>
              <div className={styles.headerSubtitle}>
                {hasExistingFeedback ? 'Update' : 'Add'} outcome and next steps
              </div>
            </div>
            <Button
              className={styles.closeButton}
              appearance="subtle"
              icon={<Dismiss16Regular />}
              onClick={onClose}
              title="Close"
            />
          </div>

          <DialogContent className={styles.body}>
            {/* Booking Info Summary */}
            <div className={styles.bookingInfo}>
              <div className={styles.bookingInfoRow}>
                <Text className={styles.bookingInfoLabel}>Client</Text>
                <Text className={styles.bookingInfoValue}>{booking.ClientName}</Text>
              </div>
              <div className={styles.bookingInfoRow}>
                <Text className={styles.bookingInfoLabel}>Type</Text>
                <Text className={styles.bookingInfoValue}>{booking.BookingType}</Text>
              </div>
              <div className={styles.bookingInfoRow}>
                <Text className={styles.bookingInfoLabel}>Date</Text>
                <Text className={styles.bookingInfoValue}>
                  {booking.ConfirmedDateTime
                    ? format(new Date(booking.ConfirmedDateTime), 'MMM d, yyyy h:mm a')
                    : 'Not confirmed'}
                </Text>
              </div>
              <div className={styles.bookingInfoRow}>
                <Text className={styles.bookingInfoLabel}>Licenses</Text>
                <Text className={styles.bookingInfoValue}>{booking.LicenseCount}</Text>
              </div>
            </div>

            {/* Existing Feedback Display */}
            {hasExistingFeedback && (
              <div className={styles.existingFeedback}>
                <div className={styles.existingLabel}>Previous Feedback Recorded</div>
                {booking.Outcome && (
                  <div className={styles.existingValue}>
                    <strong>Outcome:</strong> {booking.Outcome}
                  </div>
                )}
                {booking.NextSteps && (
                  <div className={styles.existingValue} style={{ marginTop: '8px' }}>
                    <strong>Next Steps:</strong> {booking.NextSteps}
                  </div>
                )}
              </div>
            )}

            {error && (
              <MessageBar intent="error" style={{ marginBottom: '16px' }}>
                <MessageBarBody>
                  <MessageBarTitle>Error</MessageBarTitle>
                  {error}
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Form Fields */}
            <div className={styles.formFields}>
              <Field label="Outcome" required>
                <Dropdown
                  placeholder="Select outcome..."
                  value={outcome}
                  selectedOptions={outcome ? [outcome] : []}
                  onOptionSelect={(_, data) => setOutcome(data.optionValue || '')}
                >
                  {OUTCOME_OPTIONS.map((opt) => (
                    <Option key={opt} value={opt}>
                      {opt}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              <Field label="Next Steps" hint="What actions need to be taken?">
                <Textarea
                  placeholder="e.g., Schedule follow-up call, Send proposal, Arrange technical deep-dive..."
                  value={nextSteps}
                  onChange={(_, data) => setNextSteps(data.value)}
                  rows={4}
                  resize="vertical"
                />
              </Field>
            </div>
          </DialogContent>

          {/* Footer */}
          <div className={styles.footer}>
            <Button appearance="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              className={styles.saveBtn}
              icon={isSubmitting ? <Spinner size="tiny" /> : <Checkmark24Regular />}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Feedback'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
