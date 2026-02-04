import React, { useState, useEffect, useMemo } from 'react';
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
  Popover,
  PopoverTrigger,
  PopoverSurface,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  CalendarSync24Regular,
  Dismiss24Regular,
  Dismiss16Regular,
  Checkmark24Regular,
  Clock24Regular,
} from '@fluentui/react-icons';
import { Booking } from '../../types/Booking';
import { format, addDays, setHours, setMinutes, addHours } from 'date-fns';

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
    background: 'linear-gradient(135deg, #6264a7 0%, #7a7cbf 100%)',
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
  currentSlotInfo: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  currentSlotLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  currentSlotValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '12px',
  },
  slotsHint: {
    fontSize: '13px',
    color: '#616161',
    marginBottom: '16px',
    display: 'block',
  },
  slotRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '20px',
  },
  slotContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  dateTimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  datePickerWrapper: {
    flex: 1,
  },
  timeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: '0',
    border: '1px solid #d1d1d1',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    color: '#616161',
    flexShrink: 0,
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
    backgroundColor: '#6264a7',
    minWidth: '160px',
    ':hover': {
      backgroundColor: '#525499',
    },
  },
  errorBar: {
    marginBottom: '16px',
  },
  slotError: {
    color: '#d13438',
    fontSize: '12px',
    marginTop: '4px',
  },
});

interface RescheduleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newSlots: { slot1: Date; slot2: Date; slot3: Date; reason: string }) => Promise<void>;
  booking: Booking | null;
}

export const RescheduleDialog: React.FC<RescheduleDialogProps> = ({
  open,
  onClose,
  onConfirm,
  booking,
}) => {
  const styles = useStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultDate = addDays(new Date(), 1);
  defaultDate.setHours(10, 0, 0, 0);

  const [slot1, setSlot1] = useState<Date>(defaultDate);
  const [slot2, setSlot2] = useState<Date>(addDays(defaultDate, 1));
  const [slot3, setSlot3] = useState<Date>(addDays(defaultDate, 2));

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const newDefault = addDays(new Date(), 1);
      newDefault.setHours(10, 0, 0, 0);
      setSlot1(newDefault);
      setSlot2(addDays(newDefault, 1));
      setSlot3(addDays(newDefault, 2));
      setReason('');
      setValidationError(null);
      setSubmitError(null);
    }
  }, [open]);

  // Validate slots in real-time
  const slotValidation = useMemo(() => {
    const minTime = addHours(new Date(), 2);
    const errors: { slot1?: string; slot2?: string; slot3?: string } = {};

    if (slot1 < minTime) {
      errors.slot1 = 'Must be at least 2 hours in the future';
    }
    if (slot2 < minTime) {
      errors.slot2 = 'Must be at least 2 hours in the future';
    }
    if (slot3 < minTime) {
      errors.slot3 = 'Must be at least 2 hours in the future';
    }

    // Check for duplicate slots
    if (slot1.getTime() === slot2.getTime()) {
      errors.slot2 = 'Cannot be the same as Option 1';
    }
    if (slot1.getTime() === slot3.getTime() || slot2.getTime() === slot3.getTime()) {
      errors.slot3 = 'Cannot be the same as other options';
    }

    return {
      errors,
      hasErrors: Object.keys(errors).length > 0,
    };
  }, [slot1, slot2, slot3]);

  if (!booking) return null;

  const currentDateTime = booking.ConfirmedDateTime
    ? format(new Date(booking.ConfirmedDateTime), "EEEE, MMMM d, yyyy 'at' h:mm a")
    : booking.ProposedSlot1
    ? format(new Date(booking.ProposedSlot1), "EEEE, MMMM d, yyyy 'at' h:mm a")
    : 'Not scheduled';

  const handleSubmit = async () => {
    // Clear previous errors
    setValidationError(null);
    setSubmitError(null);

    // Validate slots are in the future
    if (slotValidation.hasErrors) {
      setValidationError('Please fix the time slot errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({ slot1, slot2, slot3, reason });
      onClose();
    } catch (error) {
      console.error('Failed to reschedule:', error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Failed to submit reschedule request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to combine date and time
  const combineDateAndTime = (date: Date | null, timeString: string): Date => {
    const baseDate = date || new Date();
    if (!timeString) return baseDate;

    const [hours, minutes] = timeString.split(':').map(Number);
    return setMinutes(setHours(baseDate, hours || 10), minutes || 0);
  };

  // Helper to extract time string from date
  const getTimeString = (date: Date | null): string => {
    if (!date) return '10:00';
    return format(date, 'HH:mm');
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header - direct child of DialogBody, NOT inside DialogContent */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <CalendarSync24Regular />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Request Reschedule</div>
              <div className={styles.headerSubtitle}>
                {booking.ClientName} - {booking.BookingType}
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
            {/* Validation Error */}
            {validationError && (
              <MessageBar intent="error" className={styles.errorBar}>
                <MessageBarBody>
                  <MessageBarTitle>Validation Error</MessageBarTitle>
                  {validationError}
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Submit Error */}
            {submitError && (
              <MessageBar intent="error" className={styles.errorBar}>
                <MessageBarBody>
                  <MessageBarTitle>Submission Failed</MessageBarTitle>
                  {submitError}
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Current Slot Info */}
            <div className={styles.currentSlotInfo}>
              <div className={styles.currentSlotLabel}>Current Scheduled Time</div>
              <div className={styles.currentSlotValue}>{currentDateTime}</div>
            </div>

            {/* New Time Slots */}
            <Text className={styles.sectionTitle}>Propose New Time Slots</Text>
            <Text className={styles.slotsHint}>
              Please provide three alternative time slots (at least 2 hours in the future)
            </Text>

            <div className={styles.slotRow}>
              {/* Slot 1 */}
              <div className={styles.slotContainer}>
                <Field
                  label="Option 1"
                  validationState={slotValidation.errors.slot1 ? 'error' : undefined}
                  validationMessage={slotValidation.errors.slot1}
                >
                  <div className={styles.dateTimeRow}>
                    <div className={styles.datePickerWrapper}>
                      <DatePicker
                        value={slot1}
                        onSelectDate={(date) => {
                          if (date) {
                            const timeStr = getTimeString(slot1);
                            setSlot1(combineDateAndTime(date, timeStr));
                          }
                        }}
                        minDate={new Date()}
                        placeholder="Select date"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Popover withArrow>
                      <PopoverTrigger disableButtonEnhancement>
                        <button type="button" className={styles.timeButton} disabled={isSubmitting}>
                          <Clock24Regular style={{ width: '18px', height: '18px' }} />
                        </button>
                      </PopoverTrigger>
                      <PopoverSurface>
                        <input
                          type="time"
                          value={getTimeString(slot1)}
                          onChange={(e) => setSlot1(combineDateAndTime(slot1, e.target.value))}
                          style={{
                            padding: '8px',
                            border: '1px solid #d1d1d1',
                            borderRadius: '4px',
                            fontSize: '14px',
                          }}
                        />
                      </PopoverSurface>
                    </Popover>
                  </div>
                </Field>
              </div>

              {/* Slot 2 */}
              <div className={styles.slotContainer}>
                <Field
                  label="Option 2"
                  validationState={slotValidation.errors.slot2 ? 'error' : undefined}
                  validationMessage={slotValidation.errors.slot2}
                >
                  <div className={styles.dateTimeRow}>
                    <div className={styles.datePickerWrapper}>
                      <DatePicker
                        value={slot2}
                        onSelectDate={(date) => {
                          if (date) {
                            const timeStr = getTimeString(slot2);
                            setSlot2(combineDateAndTime(date, timeStr));
                          }
                        }}
                        minDate={new Date()}
                        placeholder="Select date"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Popover withArrow>
                      <PopoverTrigger disableButtonEnhancement>
                        <button type="button" className={styles.timeButton} disabled={isSubmitting}>
                          <Clock24Regular style={{ width: '18px', height: '18px' }} />
                        </button>
                      </PopoverTrigger>
                      <PopoverSurface>
                        <input
                          type="time"
                          value={getTimeString(slot2)}
                          onChange={(e) => setSlot2(combineDateAndTime(slot2, e.target.value))}
                          style={{
                            padding: '8px',
                            border: '1px solid #d1d1d1',
                            borderRadius: '4px',
                            fontSize: '14px',
                          }}
                        />
                      </PopoverSurface>
                    </Popover>
                  </div>
                </Field>
              </div>

              {/* Slot 3 */}
              <div className={styles.slotContainer}>
                <Field
                  label="Option 3"
                  validationState={slotValidation.errors.slot3 ? 'error' : undefined}
                  validationMessage={slotValidation.errors.slot3}
                >
                  <div className={styles.dateTimeRow}>
                    <div className={styles.datePickerWrapper}>
                      <DatePicker
                        value={slot3}
                        onSelectDate={(date) => {
                          if (date) {
                            const timeStr = getTimeString(slot3);
                            setSlot3(combineDateAndTime(date, timeStr));
                          }
                        }}
                        minDate={new Date()}
                        placeholder="Select date"
                        disabled={isSubmitting}
                      />
                    </div>
                    <Popover withArrow>
                      <PopoverTrigger disableButtonEnhancement>
                        <button type="button" className={styles.timeButton} disabled={isSubmitting}>
                          <Clock24Regular style={{ width: '18px', height: '18px' }} />
                        </button>
                      </PopoverTrigger>
                      <PopoverSurface>
                        <input
                          type="time"
                          value={getTimeString(slot3)}
                          onChange={(e) => setSlot3(combineDateAndTime(slot3, e.target.value))}
                          style={{
                            padding: '8px',
                            border: '1px solid #d1d1d1',
                            borderRadius: '4px',
                            fontSize: '14px',
                          }}
                        />
                      </PopoverSurface>
                    </Popover>
                  </div>
                </Field>
              </div>
            </div>

            {/* Reason */}
            <Field label="Reason for Reschedule" hint="Optional - explain why you need to reschedule">
              <Textarea
                value={reason}
                onChange={(_, data) => setReason(data.value)}
                placeholder="e.g., Scheduling conflict, client request, etc."
                rows={3}
                disabled={isSubmitting}
              />
            </Field>
          </DialogContent>

          {/* Actions - direct child of DialogBody, NOT DialogActions */}
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
              disabled={isSubmitting || slotValidation.hasErrors}
            >
              {isSubmitting ? 'Submitting...' : 'Request Reschedule'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
