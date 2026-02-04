import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Text,
  Field,
  Input,
  Dropdown,
  Option,
  Checkbox,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  Copy24Regular,
  Dismiss24Regular,
  Dismiss16Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { Booking, BookingFormData } from '../../types/Booking';
import { addDays, setHours, setMinutes } from 'date-fns';

const useStyles = makeStyles({
  surface: {
    maxWidth: '540px',
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
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2a8a9d 100%)',
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
  originalInfo: {
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
  },
  originalLabel: {
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
    marginBottom: '4px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 500px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fullWidth: {
    gridColumn: '1 / -1',
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
  submitBtn: {
    backgroundColor: '#1e6b7b',
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
});

interface CloneBookingDialogProps {
  open: boolean;
  onClose: () => void;
  onClone: (data: BookingFormData) => Promise<void>;
  booking: Booking | null;
}

export const CloneBookingDialog: React.FC<CloneBookingDialogProps> = ({
  open,
  onClose,
  onClone,
  booking,
}) => {
  const styles = useStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [clientName, setClientName] = useState('');
  const [bookingType, setBookingType] = useState<'Demo' | 'Deployment'>('Demo');
  const [licenseCount, setLicenseCount] = useState(10);
  const [isPremiumClient, setIsPremiumClient] = useState(false);
  const [comments, setComments] = useState('');
  const [slot1, setSlot1] = useState<Date>(addDays(new Date(), 1));
  const [slot2, setSlot2] = useState<Date>(addDays(new Date(), 2));
  const [slot3, setSlot3] = useState<Date>(addDays(new Date(), 3));

  // Reset form when dialog opens with a new booking
  useEffect(() => {
    if (open && booking) {
      setClientName(booking.ClientName);
      setBookingType(booking.BookingType);
      setLicenseCount(booking.LicenseCount);
      setIsPremiumClient(booking.IsPremiumClient);
      setComments(booking.Comments || '');

      // Set default time slots (tomorrow, day after, etc.)
      const defaultDate = addDays(new Date(), 1);
      defaultDate.setHours(10, 0, 0, 0);
      setSlot1(defaultDate);
      setSlot2(addDays(defaultDate, 1));
      setSlot3(addDays(defaultDate, 2));
    }
  }, [open, booking]);

  if (!booking) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onClone({
        clientName,
        bookingType,
        licenseCount,
        isPremiumClient,
        comments,
        proposedSlot1: slot1,
        proposedSlot2: slot2,
        proposedSlot3: slot3,
      });
      onClose();
    } catch (error) {
      console.error('Failed to clone booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <Copy24Regular />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Clone Booking</div>
              <div className={styles.headerSubtitle}>
                Create a new booking based on existing one
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

          <DialogContent className={styles.body}>
            {/* Original Booking Info */}
            <div className={styles.originalInfo}>
              <div className={styles.originalLabel}>Cloning from:</div>
              <Text>
                {booking.ClientName} - {booking.BookingType} ({booking.LicenseCount} licenses)
              </Text>
            </div>

            {/* Form */}
            <div className={styles.formGrid}>
              <Field label="Client Name" className={styles.fullWidth}>
                <Input
                  value={clientName}
                  onChange={(_, d) => setClientName(d.value)}
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Booking Type">
                <Dropdown
                  value={bookingType}
                  selectedOptions={[bookingType]}
                  onOptionSelect={(_, d) => setBookingType(d.optionValue as 'Demo' | 'Deployment')}
                  disabled={isSubmitting}
                >
                  <Option value="Demo">Demo</Option>
                  <Option value="Deployment">Deployment</Option>
                </Dropdown>
              </Field>

              <Field label="License Count">
                <Input
                  type="number"
                  value={String(licenseCount)}
                  onChange={(_, d) => setLicenseCount(Number(d.value) || 1)}
                  min={1}
                  disabled={isSubmitting}
                />
              </Field>

              <div className={styles.fullWidth}>
                <Checkbox
                  checked={isPremiumClient}
                  onChange={(_, d) => setIsPremiumClient(!!d.checked)}
                  label="Premium Client"
                  disabled={isSubmitting}
                />
              </div>

              <Field label="Option 1">
                <DatePicker
                  value={slot1}
                  onSelectDate={(date) => date && setSlot1(setHours(setMinutes(date, 0), 10))}
                  minDate={new Date()}
                  placeholder="Select date"
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Option 2">
                <DatePicker
                  value={slot2}
                  onSelectDate={(date) => date && setSlot2(setHours(setMinutes(date, 0), 10))}
                  minDate={new Date()}
                  placeholder="Select date"
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Option 3">
                <DatePicker
                  value={slot3}
                  onSelectDate={(date) => date && setSlot3(setHours(setMinutes(date, 0), 10))}
                  minDate={new Date()}
                  placeholder="Select date"
                  disabled={isSubmitting}
                />
              </Field>

              <Field label="Comments" className={styles.fullWidth}>
                <Input
                  value={comments}
                  onChange={(_, d) => setComments(d.value)}
                  placeholder="Optional comments..."
                  disabled={isSubmitting}
                />
              </Field>
            </div>
          </DialogContent>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              appearance="secondary"
              icon={<Dismiss24Regular />}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              className={styles.submitBtn}
              icon={isSubmitting ? <Spinner size="tiny" /> : <Checkmark24Regular />}
              onClick={handleSubmit}
              disabled={isSubmitting || !clientName.trim()}
            >
              {isSubmitting ? 'Creating...' : 'Create Booking'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
