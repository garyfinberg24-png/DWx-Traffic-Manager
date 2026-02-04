import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Text,
  Dropdown,
  Option,
  makeStyles,
  Spinner,
  Field,
  Badge,
  tokens,
} from '@fluentui/react-components';
import {
  PersonSettingsRegular,
  Checkmark24Regular,
  Dismiss24Regular,
  Dismiss16Regular,
  Play16Filled,
  Rocket16Filled,
  CalendarCheckmark20Regular,
  CalendarCancel20Regular,
} from '@fluentui/react-icons';
import { Booking } from '../../types/Booking';
import { TeamMember } from '../../types/ReferenceData';
import { referenceDataService } from '../../services/ReferenceDataService';
import { graphService } from '../../services/GraphService';

const useStyles = makeStyles({
  surface: {
    maxWidth: '500px',
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
    width: '36px',
    height: '36px',
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
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  bookingInfo: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  bookingClient: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bookingType: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  bookingTypeDemo: {
    backgroundColor: 'rgba(30, 107, 123, 0.1)',
    color: '#1e6b7b',
  },
  bookingTypeDeployment: {
    backgroundColor: 'rgba(229, 168, 75, 0.15)',
    color: '#8b6914',
  },
  bookingMeta: {
    fontSize: '13px',
    color: '#616161',
  },
  currentAssignment: {
    padding: '12px 16px',
    backgroundColor: '#e8f4f6',
    borderRadius: '6px',
    borderLeft: '3px solid #1e6b7b',
  },
  currentLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  currentValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
  },
  unassigned: {
    fontStyle: 'italic',
    color: '#8a8886',
  },
  dropdown: {
    width: '100%',
  },
  note: {
    fontSize: '12px',
    color: '#616161',
    fontStyle: 'italic',
    marginTop: '-8px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    padding: '16px 24px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#f9f9f9',
    flexShrink: 0,
  },
  submitBtn: {
    backgroundColor: '#1e6b7b',
    minWidth: '120px',
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  optionContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '8px',
  },
  specialistName: {
    flex: 1,
  },
  availabilityBadge: {
    fontSize: '10px',
    padding: '2px 6px',
  },
  availableBadge: {
    backgroundColor: 'rgba(16, 124, 16, 0.1)',
    color: '#107c10',
  },
  busyBadge: {
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    color: '#d13438',
  },
  checkingBadge: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground3,
  },
  availabilityInfo: {
    padding: '12px 16px',
    backgroundColor: '#fff8e5',
    borderRadius: '6px',
    borderLeft: '3px solid #e5a84b',
    marginTop: '-8px',
  },
  availabilityInfoText: {
    fontSize: '12px',
    color: '#5c5c5c',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  slotInfo: {
    padding: '12px 16px',
    backgroundColor: '#f0f9ff',
    borderRadius: '6px',
    borderLeft: '3px solid #0078d4',
  },
  slotLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
    marginBottom: '4px',
  },
  slotValue: {
    fontSize: '13px',
    color: '#242424',
  },
});

interface AssignSpecialistDialogProps {
  open: boolean;
  onClose: () => void;
  onAssign: (specialistEmail: string, specialistName: string, specialistRole: 'Demo Specialist' | 'Developer') => Promise<void>;
  booking: Booking | null;
}

// Type for availability status
interface AvailabilityStatus {
  available: boolean;
  conflictCount: number;
  checking: boolean;
}

export const AssignSpecialistDialog: React.FC<AssignSpecialistDialogProps> = ({
  open,
  onClose,
  onAssign,
  booking,
}) => {
  const styles = useStyles();
  const [specialists, setSpecialists] = useState<TeamMember[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availability, setAvailability] = useState<Map<string, AvailabilityStatus>>(new Map());

  // Determine which role to show based on booking type
  const requiredRole = booking?.BookingType === 'Demo' ? 'Demo Specialist' : 'Developer';

  // Get the booking time slot to check availability against
  const getBookingTimeSlot = (): { start: Date; end: Date } | null => {
    if (!booking) return null;

    // Use confirmed date if available, otherwise use first proposed slot
    const bookingDate = booking.ConfirmedDateTime || booking.ProposedSlot1;
    if (!bookingDate) return null;

    const start = new Date(bookingDate);
    // Assume 1 hour duration for demos, 2 hours for deployments
    const durationHours = booking.BookingType === 'Demo' ? 1 : 2;
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);

    return { start, end };
  };

  useEffect(() => {
    if (open) {
      loadSpecialists();
      // Pre-select current assignment if exists
      if (booking?.AssignedSpecialistEmail) {
        setSelectedSpecialist(booking.AssignedSpecialistEmail);
      } else {
        setSelectedSpecialist('');
      }
    }
  }, [open, booking]);

  // Check availability when specialists are loaded
  useEffect(() => {
    if (specialists.length > 0 && open) {
      checkSpecialistAvailability();
    }
  }, [specialists, open]);

  const loadSpecialists = async () => {
    setIsLoading(true);
    setAvailability(new Map()); // Reset availability when loading
    try {
      const teamMembers = await referenceDataService.getTeamMembers();
      // Filter to only show team members with the required role
      const filtered = teamMembers.filter(
        (member) => member.Role === requiredRole && member.IsActive
      );
      setSpecialists(filtered);
    } catch (error) {
      console.error('Failed to load specialists:', error);
      setSpecialists([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSpecialistAvailability = async () => {
    const timeSlot = getBookingTimeSlot();
    if (!timeSlot || specialists.length === 0) return;

    // Set all specialists to "checking" state
    const checkingMap = new Map<string, AvailabilityStatus>();
    specialists.forEach(s => {
      checkingMap.set(s.Email, { available: true, conflictCount: 0, checking: true });
    });
    setAvailability(checkingMap);

    try {
      const emails = specialists.map(s => s.Email);
      const results = await graphService.checkMultipleUsersAvailability(
        emails,
        timeSlot.start,
        timeSlot.end
      );

      // Convert results to our state format
      const availabilityMap = new Map<string, AvailabilityStatus>();
      results.forEach((result, email) => {
        availabilityMap.set(email, {
          available: result.available,
          conflictCount: result.conflictCount,
          checking: false,
        });
      });
      setAvailability(availabilityMap);
    } catch (error) {
      console.error('Failed to check specialist availability:', error);
      // On error, set all to available (don't block workflow)
      const fallbackMap = new Map<string, AvailabilityStatus>();
      specialists.forEach(s => {
        fallbackMap.set(s.Email, { available: true, conflictCount: 0, checking: false });
      });
      setAvailability(fallbackMap);
    }
  };

  const handleSubmit = async () => {
    if (!selectedSpecialist || !booking) return;

    const specialist = specialists.find((s) => s.Email === selectedSpecialist);
    if (!specialist) return;

    setIsSubmitting(true);
    try {
      await onAssign(
        specialist.Email,
        specialist.Title,
        requiredRole as 'Demo Specialist' | 'Developer'
      );
      onClose();
    } catch (error) {
      console.error('Failed to assign specialist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async () => {
    if (!booking) return;

    setIsSubmitting(true);
    try {
      // Pass empty values to unassign
      await onAssign('', '', requiredRole as 'Demo Specialist' | 'Developer');
      onClose();
    } catch (error) {
      console.error('Failed to unassign specialist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to render availability badge for a specialist
  const renderAvailabilityBadge = (email: string) => {
    const status = availability.get(email);
    if (!status) return null;

    if (status.checking) {
      return (
        <Badge
          className={`${styles.availabilityBadge} ${styles.checkingBadge}`}
          appearance="filled"
        >
          Checking...
        </Badge>
      );
    }

    if (status.available) {
      return (
        <Badge
          className={`${styles.availabilityBadge} ${styles.availableBadge}`}
          appearance="filled"
          icon={<CalendarCheckmark20Regular style={{ width: '12px', height: '12px' }} />}
        >
          Available
        </Badge>
      );
    }

    return (
      <Badge
        className={`${styles.availabilityBadge} ${styles.busyBadge}`}
        appearance="filled"
        icon={<CalendarCancel20Regular style={{ width: '12px', height: '12px' }} />}
      >
        Busy ({status.conflictCount})
      </Badge>
    );
  };

  // Format the booking time for display
  const formatBookingTime = () => {
    const slot = getBookingTimeSlot();
    if (!slot) return 'No time slot specified';

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    };
    return slot.start.toLocaleString('en-US', options);
  };

  // Check if selected specialist is busy
  const isSelectedSpecialistBusy = () => {
    if (!selectedSpecialist) return false;
    const status = availability.get(selectedSpecialist);
    return status && !status.available && !status.checking;
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header - direct child of DialogBody, NOT inside DialogContent */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <PersonSettingsRegular />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Assign {requiredRole}</div>
              <div className={styles.headerSubtitle}>
                Select a team member to handle this {booking.BookingType.toLowerCase()}
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close dialog"
            >
              <Dismiss16Regular />
            </button>
          </div>

          {/* Content - wrapped in DialogContent for scrolling */}
          <DialogContent className={styles.content}>
            {/* Booking info */}
            <div className={styles.bookingInfo}>
              <div className={styles.bookingClient}>
                {booking.ClientName}
                <span
                  className={`${styles.bookingType} ${
                    booking.BookingType === 'Demo'
                      ? styles.bookingTypeDemo
                      : styles.bookingTypeDeployment
                  }`}
                >
                  {booking.BookingType === 'Demo' ? (
                    <Play16Filled style={{ width: '12px', height: '12px' }} />
                  ) : (
                    <Rocket16Filled style={{ width: '12px', height: '12px' }} />
                  )}
                  {booking.BookingType}
                </span>
              </div>
              <div className={styles.bookingMeta}>
                Account Manager: {booking.AccountManagerName}
              </div>
              <div className={styles.bookingMeta}>
                Licenses: {booking.LicenseCount.toLocaleString()}
              </div>
            </div>

            {/* Booking time slot info */}
            {getBookingTimeSlot() && (
              <div className={styles.slotInfo}>
                <div className={styles.slotLabel}>Scheduled Time</div>
                <div className={styles.slotValue}>{formatBookingTime()}</div>
              </div>
            )}

            {/* Current assignment */}
            {booking.AssignedSpecialistName && (
              <div className={styles.currentAssignment}>
                <div className={styles.currentLabel}>Currently Assigned</div>
                <div className={styles.currentValue}>
                  {booking.AssignedSpecialistName}
                </div>
              </div>
            )}

            {/* Specialist dropdown */}
            <Field label={`Select ${requiredRole}`}>
              {isLoading ? (
                <Spinner size="small" label="Loading specialists..." />
              ) : specialists.length === 0 ? (
                <Text className={styles.note}>
                  No active {requiredRole.toLowerCase()}s found. Please add team members in the Admin section.
                </Text>
              ) : (
                <Dropdown
                  className={styles.dropdown}
                  placeholder={`Choose a ${requiredRole.toLowerCase()}`}
                  value={
                    specialists.find((s) => s.Email === selectedSpecialist)?.Title || ''
                  }
                  selectedOptions={selectedSpecialist ? [selectedSpecialist] : []}
                  onOptionSelect={(_, data) => {
                    setSelectedSpecialist(data.optionValue as string);
                  }}
                >
                  {specialists.map((specialist) => (
                    <Option key={specialist.Email} value={specialist.Email} text={specialist.Title}>
                      <div className={styles.optionContent}>
                        <span className={styles.specialistName}>{specialist.Title}</span>
                        {renderAvailabilityBadge(specialist.Email)}
                      </div>
                    </Option>
                  ))}
                </Dropdown>
              )}
            </Field>

            {/* Warning if selected specialist is busy */}
            {isSelectedSpecialistBusy() && (
              <div className={styles.availabilityInfo}>
                <Text className={styles.availabilityInfoText}>
                  <CalendarCancel20Regular style={{ color: '#d13438' }} />
                  This specialist has conflicting calendar events at this time. You can still assign them, but consider choosing someone who is available.
                </Text>
              </div>
            )}

            <Text className={styles.note}>
              The assigned {requiredRole.toLowerCase()} will be notified and can see this booking in their view.
            </Text>
          </DialogContent>

          {/* Actions - direct child of DialogBody, NOT DialogActions */}
          <div className={styles.actions}>
            {booking.AssignedSpecialistName && (
              <Button
                appearance="subtle"
                onClick={handleUnassign}
                disabled={isSubmitting}
              >
                Unassign
              </Button>
            )}
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
              disabled={isSubmitting || !selectedSpecialist || specialists.length === 0}
            >
              {isSubmitting ? 'Assigning...' : 'Assign'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
