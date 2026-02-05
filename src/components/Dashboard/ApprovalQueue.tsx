import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Badge,
  Card,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  DialogActions,
  Field,
  Textarea,
  RadioGroup,
  Radio,
  Dropdown,
  Option,
  tokens,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Tooltip,
} from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Dismiss24Regular,
  Calendar24Regular,
  Clock24Regular,
  Person24Regular,
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
  CalendarError24Regular,
  Star16Filled,
  Play16Filled,
  Rocket16Filled,
  PersonSettingsRegular,
  CalendarSync24Regular,
  CalendarCheckmark20Regular,
  CalendarCancel20Regular,
} from '@fluentui/react-icons';
import { Booking, BookingStatus } from '../../types/Booking';
import { TeamMember } from '../../types/ReferenceData';
import { format, addHours } from 'date-fns';
import { useNotifications } from '../../contexts/NotificationContext';
import { graphService, CalendarEvent } from '../../services/GraphService';
import { referenceDataService } from '../../services/ReferenceDataService';
import { sharePointService } from '../../services/SharePointService';
import { notificationService } from '../../services/NotificationService';
import { useAuth } from '../../contexts/AuthContext';
import { ApprovalResult } from '../../types/Booking';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,.08)',
    marginBottom: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e8e8e8',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  countBadge: {
    backgroundColor: '#e74c3c',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    minWidth: '24px',
    height: '24px',
    borderRadius: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 32px',
    color: '#616161',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
  },
  queueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  bookingCard: {
    padding: '0',
    border: 'none',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,.08)',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,.12)',
      transform: 'translateY(-2px)',
    },
  },
  bookingCardPremium: {
    boxShadow: '0 1px 4px rgba(229, 168, 75, 0.3)',
    ':hover': {
      boxShadow: '0 4px 16px rgba(229, 168, 75, 0.25)',
    },
  },
  bookingCardHighlighted: {
    boxShadow: '0 0 0 3px #1e6b7b, 0 4px 16px rgba(30, 107, 123, 0.3)',
    animation: 'pulse 2s ease-in-out',
    '@keyframes pulse': {
      '0%': { boxShadow: '0 0 0 3px #1e6b7b, 0 4px 16px rgba(30, 107, 123, 0.3)' },
      '50%': { boxShadow: '0 0 0 6px rgba(30, 107, 123, 0.5), 0 4px 20px rgba(30, 107, 123, 0.4)' },
      '100%': { boxShadow: '0 0 0 3px #1e6b7b, 0 4px 16px rgba(30, 107, 123, 0.3)' },
    },
  },
  cardInner: {
    display: 'flex',
  },
  cardAccent: {
    width: '5px',
    flexShrink: 0,
    background: 'linear-gradient(180deg, #1e6b7b 0%, #2d8a9c 100%)',
  },
  cardAccentPremium: {
    background: 'linear-gradient(180deg, #e5a84b 0%, #d4973a 100%)',
  },
  cardContent: {
    flex: 1,
    padding: '16px 20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  clientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  clientNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  clientName: {
    fontSize: '17px',
    fontWeight: '600',
    color: '#1a1a1a',
  },
  premiumBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    background: 'linear-gradient(135deg, rgba(229, 168, 75, 0.15) 0%, rgba(229, 168, 75, 0.1) 100%)',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#8b6914',
  },
  bookingMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  bookingTypeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#e8f4f6',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#1e6b7b',
  },
  licenseBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#f3f2f1',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#424242',
  },
  dealValueBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#dff6dd',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#107c10',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '600',
    padding: '4px 10px',
  },
  cardDetails: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '12px',
    fontSize: '13px',
    color: '#616161',
    flexWrap: 'wrap',
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#616161',
  },
  detailIcon: {
    color: '#1e6b7b',
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  detailLabel: {
    fontWeight: '500',
    color: '#424242',
    marginRight: '4px',
  },
  detailSeparator: {
    color: '#d1d1d1',
    margin: '0 4px',
  },
  slotsSection: {
    marginBottom: '12px',
  },
  slotsLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#616161',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  slotsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  slotItem: {
    padding: '10px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
  },
  slotNumber: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#1e6b7b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  slotDate: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#242424',
  },
  slotTime: {
    fontSize: '12px',
    color: '#616161',
  },
  commentsSection: {
    padding: '10px 14px',
    backgroundColor: '#f8f8f8',
    borderRadius: '6px',
    borderLeft: '3px solid #1e6b7b',
    marginBottom: '12px',
  },
  commentsLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '2px',
  },
  commentsText: {
    fontSize: '12px',
    color: '#424242',
    lineHeight: '1.4',
    fontStyle: 'italic',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    paddingTop: '12px',
    borderTop: '1px solid #e8e8e8',
  },
  actionBtn: {
    minWidth: '100px',
  },
  approveBtn: {
    backgroundColor: '#107c10',
    minWidth: '150px',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#0b5c0b',
    },
  },
  rejectBtn: {
    borderLeftColor: '#d13438',
    borderRightColor: '#d13438',
    borderTopColor: '#d13438',
    borderBottomColor: '#d13438',
    color: '#d13438',
    minWidth: '100px',
    ':hover': {
      backgroundColor: 'rgba(209, 52, 56, 0.1)',
    },
  },
  // Dialog styles
  dialogSurface: {
    maxWidth: '480px',
    width: '100%',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  dialogIcon: {
    width: '36px',
    height: '36px',
  },
  slotSelection: {
    marginTop: '16px',
  },
  conflictWarning: {
    marginBottom: '16px',
  },
  slotRadioContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
  },
  slotRadioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  conflictBadge: {
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  noConflictBadge: {
    color: '#107c10',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  checkingSpinner: {
    marginLeft: '8px',
  },
  conflictDetails: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
    fontSize: '12px',
  },
  conflictEvent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 0',
    color: tokens.colorNeutralForeground2,
  },
  assignBtn: {
    borderLeftColor: '#1e6b7b',
    borderRightColor: '#1e6b7b',
    borderTopColor: '#1e6b7b',
    borderBottomColor: '#1e6b7b',
    color: '#1e6b7b',
    minWidth: '110px',
    ':hover': {
      backgroundColor: 'rgba(30, 107, 123, 0.1)',
    },
  },
  assignedInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#1e6b7b',
    padding: '4px 10px',
    backgroundColor: '#e8f4f6',
    borderRadius: '4px',
  },
  assignedIcon: {
    width: '14px',
    height: '14px',
  },
  // Inline specialist picker in approval dialog
  specialistSection: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  specialistSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontWeight: '600',
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  specialistDropdown: {
    width: '100%',
  },
  specialistOption: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: '8px',
  },
  specialistAvailability: {
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
  specialistNote: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    marginTop: '8px',
  },
  allConflictsWarning: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#fff4ce',
    borderRadius: '8px',
    borderLeft: '4px solid #f7630c',
  },
  allConflictsTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '600',
    color: '#8b6914',
    marginBottom: '8px',
  },
  allConflictsText: {
    fontSize: '13px',
    color: '#5c5c5c',
    marginBottom: '12px',
  },
  requestNewSlotsBtn: {
    backgroundColor: '#f7630c',
    ':hover': {
      backgroundColor: '#e55a00',
    },
  },
  // Success dialog styles
  successDialog: {
    maxWidth: '420px',
    width: '100%',
  },
  successContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '24px',
    gap: '16px',
  },
  successIcon: {
    width: '64px',
    height: '64px',
    color: '#107c10',
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  successDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    width: '100%',
  },
  successDetailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
  },
  successDetailLabel: {
    color: '#616161',
  },
  successDetailValue: {
    fontWeight: '500',
    color: '#242424',
  },
  successCloseBtn: {
    backgroundColor: '#107c10',
    minWidth: '120px',
    ':hover': {
      backgroundColor: '#0b5c0b',
    },
  },
});

interface ApprovalQueueProps {
  bookings: Booking[];
  onApprove: (bookingId: number, confirmedSlot: string, comments?: string) => Promise<ApprovalResult>;
  onReject: (bookingId: number, reason: string) => Promise<void>;
  isLoading?: boolean;
  highlightedBookingId?: number | null;
  onHighlightClear?: () => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  bookings,
  onApprove,
  onReject,
  isLoading = false,
  highlightedBookingId,
  onHighlightClear,
}) => {
  const styles = useStyles();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogType, setDialogType] = useState<'approve' | 'reject' | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Conflict detection state
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [slotConflicts, setSlotConflicts] = useState<Map<string, { hasConflict: boolean; conflicts: CalendarEvent[] }>>(new Map());
  const [conflictCheckError, setConflictCheckError] = useState<string | null>(null);


  // Inline specialist picker state for approval dialog
  const [specialists, setSpecialists] = useState<TeamMember[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>('');
  const [isLoadingSpecialists, setIsLoadingSpecialists] = useState(false);
  const [specialistAvailability, setSpecialistAvailability] = useState<Map<string, { available: boolean; conflictCount: number; checking: boolean }>>(new Map());
  const [isSendingNewSlotsRequest, setIsSendingNewSlotsRequest] = useState(false);

  // Success confirmation dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    clientName: string;
    confirmedDateTime: string;
    specialistName?: string;
  } | null>(null);

  // Ref for highlighted booking card (for auto-scroll)
  const highlightedCardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to highlighted booking when it changes
  useEffect(() => {
    if (highlightedBookingId && highlightedCardRef.current) {
      highlightedCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      // Clear the highlight after 5 seconds
      const timer = setTimeout(() => {
        if (onHighlightClear) {
          onHighlightClear();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedBookingId, onHighlightClear]);

  // Filter for bookings that need approval (Pending Review or Awaiting Approval)
  const pendingBookings = bookings.filter(
    (b) => b.Status === 'Pending Review' || b.Status === 'Awaiting Approval'
  );

  // Check for calendar conflicts when approval dialog opens
  const checkConflictsForBooking = useCallback(async (booking: Booking) => {
    setIsCheckingConflicts(true);
    setConflictCheckError(null);
    setSlotConflicts(new Map());

    try {
      // Get duration based on booking type: Demo = 1 hour, Deployment = 2 hours
      const duration = booking.BookingType === 'Demo' ? 1 : 2;

      const slots = [
        { start: new Date(booking.ProposedSlot1), end: addHours(new Date(booking.ProposedSlot1), duration), label: 'slot1' },
        { start: new Date(booking.ProposedSlot2), end: addHours(new Date(booking.ProposedSlot2), duration), label: 'slot2' },
        { start: new Date(booking.ProposedSlot3), end: addHours(new Date(booking.ProposedSlot3), duration), label: 'slot3' },
      ];

      const conflicts = await graphService.checkMultipleSlotConflicts(slots);

      // Convert the map to use the actual slot values as keys for easier lookup
      const slotConflictMap = new Map<string, { hasConflict: boolean; conflicts: CalendarEvent[] }>();
      slotConflictMap.set(booking.ProposedSlot1, conflicts.get('slot1') || { hasConflict: false, conflicts: [] });
      slotConflictMap.set(booking.ProposedSlot2, conflicts.get('slot2') || { hasConflict: false, conflicts: [] });
      slotConflictMap.set(booking.ProposedSlot3, conflicts.get('slot3') || { hasConflict: false, conflicts: [] });

      setSlotConflicts(slotConflictMap);
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      setConflictCheckError('Unable to check calendar conflicts. You can still proceed with approval.');
    } finally {
      setIsCheckingConflicts(false);
    }
  }, []);

  // Trigger conflict check when approval dialog opens
  useEffect(() => {
    if (dialogType === 'approve' && selectedBooking) {
      checkConflictsForBooking(selectedBooking);
    }
  }, [dialogType, selectedBooking, checkConflictsForBooking]);

  // Load specialists when approval dialog opens
  const loadSpecialistsForBooking = useCallback(async (booking: Booking) => {
    setIsLoadingSpecialists(true);
    setSpecialists([]);
    setSelectedSpecialist(booking.AssignedSpecialistEmail || '');
    setSpecialistAvailability(new Map());

    try {
      const teamMembers = await referenceDataService.getTeamMembers();
      const requiredRole = booking.BookingType === 'Demo' ? 'Demo Specialist' : 'Developer';
      const filtered = teamMembers.filter(
        (member) => member.Role === requiredRole && member.IsActive
      );
      setSpecialists(filtered);

      // Check availability for each specialist against the first proposed slot
      if (filtered.length > 0) {
        const checkingMap = new Map<string, { available: boolean; conflictCount: number; checking: boolean }>();
        filtered.forEach(s => {
          checkingMap.set(s.Email, { available: true, conflictCount: 0, checking: true });
        });
        setSpecialistAvailability(checkingMap);

        const duration = booking.BookingType === 'Demo' ? 1 : 2;
        const start = new Date(booking.ProposedSlot1);
        const end = addHours(start, duration);

        try {
          const emails = filtered.map(s => s.Email);
          const results = await graphService.checkMultipleUsersAvailability(emails, start, end);

          const availabilityMap = new Map<string, { available: boolean; conflictCount: number; checking: boolean }>();
          results.forEach((result, email) => {
            availabilityMap.set(email, {
              available: result.available,
              conflictCount: result.conflictCount,
              checking: false,
            });
          });
          setSpecialistAvailability(availabilityMap);
        } catch (error) {
          console.error('Failed to check specialist availability:', error);
          // On error, set all to available
          const fallbackMap = new Map<string, { available: boolean; conflictCount: number; checking: boolean }>();
          filtered.forEach(s => {
            fallbackMap.set(s.Email, { available: true, conflictCount: 0, checking: false });
          });
          setSpecialistAvailability(fallbackMap);
        }
      }
    } catch (error) {
      console.error('Failed to load specialists:', error);
    } finally {
      setIsLoadingSpecialists(false);
    }
  }, []);

  // Trigger specialist load when approval dialog opens
  useEffect(() => {
    if (dialogType === 'approve' && selectedBooking) {
      loadSpecialistsForBooking(selectedBooking);
    }
  }, [dialogType, selectedBooking, loadSpecialistsForBooking]);

  // Recheck specialist availability when selected slot changes
  const recheckSpecialistAvailability = useCallback(async (slotDateTime: string, booking: Booking) => {
    if (specialists.length === 0) return;

    // Set all specialists to "checking" state
    const checkingMap = new Map<string, { available: boolean; conflictCount: number; checking: boolean }>();
    specialists.forEach(s => {
      checkingMap.set(s.Email, { available: true, conflictCount: 0, checking: true });
    });
    setSpecialistAvailability(checkingMap);

    try {
      const duration = booking.BookingType === 'Demo' ? 1 : 2;
      const start = new Date(slotDateTime);
      const end = addHours(start, duration);

      const emails = specialists.map(s => s.Email);
      const results = await graphService.checkMultipleUsersAvailability(emails, start, end);

      const availabilityMap = new Map<string, { available: boolean; conflictCount: number; checking: boolean }>();
      results.forEach((result, email) => {
        availabilityMap.set(email, {
          available: result.available,
          conflictCount: result.conflictCount,
          checking: false,
        });
      });
      setSpecialistAvailability(availabilityMap);
    } catch (error) {
      console.error('Failed to recheck specialist availability:', error);
      // On error, set all to available (don't block the workflow)
      const fallbackMap = new Map<string, { available: boolean; conflictCount: number; checking: boolean }>();
      specialists.forEach(s => {
        fallbackMap.set(s.Email, { available: true, conflictCount: 0, checking: false });
      });
      setSpecialistAvailability(fallbackMap);
    }
  }, [specialists]);

  // Track the previously checked slot to avoid redundant checks
  const [lastCheckedSlot, setLastCheckedSlot] = useState<string>('');

  // Trigger availability recheck when selected slot changes (after initial load)
  useEffect(() => {
    // Only recheck if:
    // 1. We're in the approval dialog
    // 2. We have a selected booking
    // 3. We have specialists loaded (not loading)
    // 4. The selected slot is different from the last checked slot
    if (
      dialogType === 'approve' &&
      selectedBooking &&
      !isLoadingSpecialists &&
      specialists.length > 0 &&
      selectedSlot &&
      selectedSlot !== lastCheckedSlot
    ) {
      // Skip recheck for the initial slot (ProposedSlot1) if it was already checked during load
      if (selectedSlot === selectedBooking.ProposedSlot1 && lastCheckedSlot === '') {
        setLastCheckedSlot(selectedSlot);
        return;
      }

      setLastCheckedSlot(selectedSlot);
      recheckSpecialistAvailability(selectedSlot, selectedBooking);
    }
  }, [selectedSlot, dialogType, selectedBooking, isLoadingSpecialists, specialists.length, lastCheckedSlot, recheckSpecialistAvailability]);

  // Check if all slots have conflicts
  const allSlotsHaveConflicts = useCallback(() => {
    if (slotConflicts.size !== 3) return false;
    return Array.from(slotConflicts.values()).every(c => c.hasConflict);
  }, [slotConflicts]);

  // Handle request new slots
  const handleRequestNewSlots = async () => {
    if (!selectedBooking) return;

    setIsSendingNewSlotsRequest(true);
    try {
      // Send email to AM requesting new slots
      await notificationService.sendSlotsUnavailableNotification(
        selectedBooking,
        user?.displayName || 'Manager',
        comments || undefined
      );

      // Update booking status to Rescheduling Required
      await sharePointService.updateBooking(selectedBooking.Id, {
        Status: 'Rescheduling Required',
      });

      addNotification({
        type: 'info',
        category: 'approval',
        title: 'New Slots Requested',
        message: `${selectedBooking.AccountManagerName} has been notified to propose new time slots for ${selectedBooking.ClientName}`,
        bookingId: selectedBooking.Id,
      });

      handleCloseDialog();
    } catch (error) {
      console.error('Failed to request new slots:', error);
      addNotification({
        type: 'error',
        category: 'approval',
        title: 'Request Failed',
        message: 'Failed to send new slots request. Please try again.',
      });
    } finally {
      setIsSendingNewSlotsRequest(false);
    }
  };

  const handleApproveClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDialogType('approve');
    setSelectedSlot(booking.ProposedSlot1);
    setComments('');
  };

  const handleRejectClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDialogType('reject');
    setComments('');
  };

  const handleCloseDialog = () => {
    setSelectedBooking(null);
    setDialogType(null);
    setSelectedSlot('');
    setComments('');
    setSelectedSpecialist('');
    setSpecialists([]);
    setSpecialistAvailability(new Map());
    setLastCheckedSlot('');
  };

  const handleConfirmApprove = async () => {
    if (!selectedBooking || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      // First approve the booking
      const approvalResult = await onApprove(selectedBooking.Id, selectedSlot, comments);

      // If a specialist was selected, assign them
      if (selectedSpecialist) {
        const specialist = specialists.find(s => s.Email === selectedSpecialist);
        if (specialist) {
          const requiredRole = selectedBooking.BookingType === 'Demo' ? 'Demo Specialist' : 'Developer';
          try {
            await sharePointService.updateBooking(selectedBooking.Id, {
              AssignedSpecialistEmail: specialist.Email,
              AssignedSpecialistName: specialist.Title,
              AssignedSpecialistRole: requiredRole,
            });

            // Send notification to specialist
            await notificationService.sendSpecialistAssignedNotification(
              { ...selectedBooking, ConfirmedDateTime: selectedSlot },
              specialist.Email,
              specialist.Title,
              requiredRole as 'Demo Specialist' | 'Developer',
              user?.displayName || 'Manager'
            );
          } catch (assignError) {
            console.error('Failed to assign specialist:', assignError);
            // Don't fail the approval, just log the error
          }
        }
      }

      const specialistName = selectedSpecialist
        ? specialists.find(s => s.Email === selectedSpecialist)?.Title
        : undefined;

      // Close the approval dialog first, then show success dialog
      // This prevents the brief flash of the approval dialog closing
      const clientName = selectedBooking.ClientName;
      const confirmedDateTime = selectedSlot;
      const bookingId = selectedBooking.Id;

      // Close the approval dialog
      setSelectedBooking(null);
      setDialogType(null);
      setSelectedSlot('');
      setComments('');
      setSelectedSpecialist('');
      setSpecialists([]);
      setSpecialistAvailability(new Map());
      setLastCheckedSlot('');

      // Now show the success dialog
      setSuccessDetails({
        clientName,
        confirmedDateTime,
        specialistName,
      });
      setShowSuccessDialog(true);

      // Show success notification
      addNotification({
        type: 'success',
        category: 'approval',
        title: 'Booking Approved',
        message: `Booking for ${clientName} has been confirmed for ${format(new Date(confirmedDateTime), 'MMM d, yyyy h:mm a')}.${specialistName ? ` ${specialistName} has been assigned.` : ''}`,
        bookingId,
        actionUrl: '/bookings',
        actionLabel: 'View Bookings',
      });

      // Show warnings if calendar or notification failed (booking is still approved)
      if (approvalResult?.warnings && approvalResult.warnings.length > 0) {
        approvalResult.warnings.forEach(warning => {
          addNotification({
            type: 'warning',
            category: 'approval',
            title: 'Partial Success',
            message: warning,
            bookingId,
          });
        });
      }
    } catch (error) {
      console.error('Approval failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Approval failed. Please try again.';
      addNotification({
        type: 'error',
        category: 'approval',
        title: 'Approval Failed',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedBooking || !comments.trim()) return;

    setIsSubmitting(true);
    try {
      await onReject(selectedBooking.Id, comments);
      addNotification({
        type: 'warning',
        category: 'approval',
        title: 'Booking Rejected',
        message: `Booking for ${selectedBooking.ClientName} has been rejected`,
        bookingId: selectedBooking.Id,
      });
      handleCloseDialog();
    } catch (error) {
      console.error('Rejection failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Rejection failed. Please try again.';
      addNotification({
        type: 'error',
        category: 'approval',
        title: 'Rejection Failed',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSlot = (slot: string) => {
    try {
      return format(new Date(slot), 'EEE, MMM d, yyyy \'at\' h:mm a');
    } catch {
      return slot;
    }
  };

  const getStatusColor = (status: BookingStatus): 'warning' | 'important' | 'informative' => {
    switch (status) {
      case 'Pending Review':
        return 'warning';
      case 'Awaiting Approval':
        return 'important';
      default:
        return 'informative';
    }
  };


  if (isLoading) {
    return (
      <div className={styles.container}>
        <Spinner size="small" label="Loading approval queue..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>
          Approval Queue
          {pendingBookings.length > 0 && (
            <Badge
              appearance="filled"
              className={styles.countBadge}
              size="small"
            >
              {pendingBookings.length}
            </Badge>
          )}
        </Text>
      </div>

      {pendingBookings.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckmarkCircle24Filled style={{ width: '48px', height: '48px', color: '#107c10', marginBottom: '12px' }} />
          <Text>All bookings have been reviewed</Text>
        </div>
      ) : (
        <div className={styles.queueList}>
          {pendingBookings.map((booking) => {
            const isHighlighted = highlightedBookingId === booking.Id;
            return (
            <Card
              key={booking.Id}
              ref={isHighlighted ? highlightedCardRef : undefined}
              className={`${styles.bookingCard} ${booking.IsPremiumClient ? styles.bookingCardPremium : ''} ${isHighlighted ? styles.bookingCardHighlighted : ''}`}
            >
              <div className={styles.cardInner}>
                {/* Colored accent bar */}
                <div className={`${styles.cardAccent} ${booking.IsPremiumClient ? styles.cardAccentPremium : ''}`} />

                <div className={styles.cardContent}>
                  {/* Header: Client name, all badges on same row, and status */}
                  <div className={styles.cardHeader}>
                    <div className={styles.clientNameRow}>
                      <Text className={styles.clientName}>{booking.ClientName}</Text>
                      {booking.IsPremiumClient && (
                        <span className={styles.premiumBadge}>
                          <Star16Filled style={{ width: '12px', height: '12px' }} />
                          Premium
                        </span>
                      )}
                      <span className={styles.bookingTypeBadge}>
                        {booking.BookingType === 'Demo' ? (
                          <Play16Filled style={{ width: '12px', height: '12px' }} />
                        ) : (
                          <Rocket16Filled style={{ width: '12px', height: '12px' }} />
                        )}
                        {booking.BookingType}
                      </span>
                      <span className={styles.licenseBadge}>
                        {booking.LicenseCount.toLocaleString()} licenses
                      </span>
                      {(booking.DealValue || booking.DealSize) && (
                        <span className={styles.dealValueBadge}>
                          💰 {booking.DealSize
                            ? `R ${(booking.DealSize * 90).toLocaleString()}`
                            : booking.DealValue}
                        </span>
                      )}
                    </div>
                    <Badge
                      appearance="filled"
                      color={getStatusColor(booking.Status)}
                      className={styles.statusBadge}
                    >
                      {booking.Status}
                    </Badge>
                  </div>

                  {/* Details row - compact inline */}
                  <div className={styles.cardDetails}>
                    <div className={styles.detailItem}>
                      <Person24Regular className={styles.detailIcon} />
                      <span className={styles.detailLabel}>AM:</span>
                      <span>{booking.AccountManagerName}</span>
                    </div>
                    <span className={styles.detailSeparator}>•</span>
                    <div className={styles.detailItem}>
                      <Calendar24Regular className={styles.detailIcon} />
                      <span className={styles.detailLabel}>Submitted:</span>
                      <span>{format(new Date(booking.Created), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  {/* Time slots - 3 column grid */}
                  <div className={styles.slotsSection}>
                    <Text className={styles.slotsLabel}>
                      <Clock24Regular style={{ width: '12px', height: '12px' }} />
                      Proposed Time Slots
                    </Text>
                    <div className={styles.slotsList}>
                      <div className={styles.slotItem}>
                        <span className={styles.slotNumber}>Option 1</span>
                        <span className={styles.slotDate}>
                          {format(new Date(booking.ProposedSlot1), 'EEE, MMM d')}
                        </span>
                        <span className={styles.slotTime}>
                          {format(new Date(booking.ProposedSlot1), 'h:mm a')}
                        </span>
                      </div>
                      <div className={styles.slotItem}>
                        <span className={styles.slotNumber}>Option 2</span>
                        <span className={styles.slotDate}>
                          {format(new Date(booking.ProposedSlot2), 'EEE, MMM d')}
                        </span>
                        <span className={styles.slotTime}>
                          {format(new Date(booking.ProposedSlot2), 'h:mm a')}
                        </span>
                      </div>
                      <div className={styles.slotItem}>
                        <span className={styles.slotNumber}>Option 3</span>
                        <span className={styles.slotDate}>
                          {format(new Date(booking.ProposedSlot3), 'EEE, MMM d')}
                        </span>
                        <span className={styles.slotTime}>
                          {format(new Date(booking.ProposedSlot3), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Comments section */}
                  {booking.Comments && (
                    <div className={styles.commentsSection}>
                      <div className={styles.commentsLabel}>Comments</div>
                      <div className={styles.commentsText}>"{booking.Comments}"</div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className={styles.actions}>
                    <Button
                      appearance="outline"
                      className={styles.rejectBtn}
                      icon={<Dismiss24Regular />}
                      onClick={() => handleRejectClick(booking)}
                    >
                      Reject
                    </Button>
                    <Button
                      appearance="primary"
                      className={styles.approveBtn}
                      icon={<Checkmark24Regular />}
                      onClick={() => handleApproveClick(booking)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={dialogType === 'approve' && !!selectedBooking} onOpenChange={(_, d) => !d.open && handleCloseDialog()}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogContent>
              <div className={styles.dialogHeader}>
                <CheckmarkCircle24Filled className={styles.dialogIcon} style={{ color: '#107c10' }} />
                <div>
                  <Text weight="semibold" size={500}>Approve Booking</Text>
                  <Text size={200} style={{ color: '#616161', display: 'block' }}>
                    Confirm the booking for {selectedBooking?.ClientName}
                  </Text>
                </div>
              </div>

              {/* Conflict Check Error */}
              {conflictCheckError && (
                <MessageBar intent="warning" className={styles.conflictWarning}>
                  <MessageBarBody>
                    <MessageBarTitle>Calendar Check</MessageBarTitle>
                    {conflictCheckError}
                  </MessageBarBody>
                </MessageBar>
              )}

              {/* Warning if selected slot has conflicts */}
              {selectedSlot && slotConflicts.get(selectedSlot)?.hasConflict && (
                <MessageBar intent="error" className={styles.conflictWarning}>
                  <MessageBarBody>
                    <MessageBarTitle>Scheduling Conflict</MessageBarTitle>
                    The selected time slot has conflicts with existing calendar events. Consider choosing a different slot or confirming with the parties involved.
                  </MessageBarBody>
                </MessageBar>
              )}

              <Field
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>Select Confirmed Time Slot</span>
                    {isCheckingConflicts && <Spinner size="tiny" label="Checking calendar..." />}
                  </div>
                }
                className={styles.slotSelection}
              >
                <RadioGroup value={selectedSlot} onChange={(_, data) => setSelectedSlot(data.value)}>
                  {selectedBooking && (
                    <>
                      {[
                        { slot: selectedBooking.ProposedSlot1, label: 'Option 1' },
                        { slot: selectedBooking.ProposedSlot2, label: 'Option 2' },
                        { slot: selectedBooking.ProposedSlot3, label: 'Option 3' },
                      ].map(({ slot, label: _label }) => {
                        const conflictInfo = slotConflicts.get(slot);
                        const hasConflict = conflictInfo?.hasConflict || false;

                        return (
                          <div key={slot} className={styles.slotRadioContainer}>
                            <Radio
                              value={slot}
                              label={
                                <div className={styles.slotRadioLabel}>
                                  <span>{formatSlot(slot)}</span>
                                  {isCheckingConflicts ? (
                                    <span className={styles.checkingSpinner}>
                                      <Spinner size="extra-tiny" />
                                    </span>
                                  ) : hasConflict ? (
                                    <Tooltip content={`Conflicts: ${conflictInfo?.conflicts.map(c => c.subject).join(', ')}`} relationship="label">
                                      <Badge
                                        appearance="filled"
                                        color="danger"
                                        className={styles.conflictBadge}
                                      >
                                        <CalendarError24Regular style={{ width: '12px', height: '12px' }} />
                                        Conflict
                                      </Badge>
                                    </Tooltip>
                                  ) : slotConflicts.size > 0 ? (
                                    <Badge
                                      appearance="ghost"
                                      color="success"
                                      className={styles.noConflictBadge}
                                    >
                                      <CheckmarkCircle24Filled style={{ width: '12px', height: '12px' }} />
                                      Available
                                    </Badge>
                                  ) : null}
                                </div>
                              }
                            />
                          </div>
                        );
                      })}
                    </>
                  )}
                </RadioGroup>
              </Field>

              {/* Show conflict details if selected slot has conflicts */}
              {selectedSlot && slotConflicts.get(selectedSlot)?.hasConflict && (
                <div className={styles.conflictDetails}>
                  <Text weight="semibold" size={200}>Conflicting Events:</Text>
                  {slotConflicts.get(selectedSlot)?.conflicts.map((event, idx) => (
                    <div key={idx} className={styles.conflictEvent}>
                      <Calendar24Regular style={{ width: '14px', height: '14px' }} />
                      <span>{event.subject}</span>
                      <span>({format(new Date(event.start.dateTime), 'h:mm a')} - {format(new Date(event.end.dateTime), 'h:mm a')})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* All Slots Have Conflicts Warning */}
              {!isCheckingConflicts && allSlotsHaveConflicts() && (
                <div className={styles.allConflictsWarning}>
                  <div className={styles.allConflictsTitle}>
                    <CalendarError24Regular />
                    All Time Slots Unavailable
                  </div>
                  <div className={styles.allConflictsText}>
                    All three proposed time slots have calendar conflicts. You can request the Account Manager to propose new times.
                  </div>
                  <Button
                    appearance="primary"
                    className={styles.requestNewSlotsBtn}
                    icon={isSendingNewSlotsRequest ? <Spinner size="tiny" /> : <CalendarSync24Regular />}
                    onClick={handleRequestNewSlots}
                    disabled={isSendingNewSlotsRequest}
                  >
                    {isSendingNewSlotsRequest ? 'Sending Request...' : 'Request New Slots'}
                  </Button>
                </div>
              )}

              {/* Inline Specialist Picker */}
              {selectedBooking && (
                <div className={styles.specialistSection}>
                  <div className={styles.specialistSectionTitle}>
                    <PersonSettingsRegular />
                    Assign {selectedBooking.BookingType === 'Demo' ? 'Demo Specialist' : 'Developer'} (Optional)
                  </div>
                  {isLoadingSpecialists ? (
                    <Spinner size="small" label="Loading specialists..." />
                  ) : specialists.length === 0 ? (
                    <Text className={styles.specialistNote}>
                      No active {selectedBooking.BookingType === 'Demo' ? 'demo specialists' : 'developers'} found. You can assign one later.
                    </Text>
                  ) : (
                    <>
                      <Dropdown
                        className={styles.specialistDropdown}
                        placeholder={`Select a ${selectedBooking.BookingType === 'Demo' ? 'demo specialist' : 'developer'}...`}
                        value={specialists.find(s => s.Email === selectedSpecialist)?.Title || ''}
                        selectedOptions={selectedSpecialist ? [selectedSpecialist] : []}
                        onOptionSelect={(_, data) => setSelectedSpecialist(data.optionValue as string || '')}
                      >
                        <Option value="" text="(No assignment)">
                          <span style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
                            Skip assignment
                          </span>
                        </Option>
                        {specialists.map((specialist) => {
                          const status = specialistAvailability.get(specialist.Email);
                          return (
                            <Option key={specialist.Email} value={specialist.Email} text={specialist.Title}>
                              <div className={styles.specialistOption}>
                                <span>{specialist.Title}</span>
                                {status?.checking ? (
                                  <Badge className={`${styles.specialistAvailability} ${styles.checkingBadge}`} appearance="filled">
                                    Checking...
                                  </Badge>
                                ) : status?.available ? (
                                  <Badge
                                    className={`${styles.specialistAvailability} ${styles.availableBadge}`}
                                    appearance="filled"
                                    icon={<CalendarCheckmark20Regular style={{ width: '12px', height: '12px' }} />}
                                  >
                                    Available
                                  </Badge>
                                ) : (
                                  <Badge
                                    className={`${styles.specialistAvailability} ${styles.busyBadge}`}
                                    appearance="filled"
                                    icon={<CalendarCancel20Regular style={{ width: '12px', height: '12px' }} />}
                                  >
                                    Busy
                                  </Badge>
                                )}
                              </div>
                            </Option>
                          );
                        })}
                      </Dropdown>
                      <Text className={styles.specialistNote}>
                        The specialist will be notified and can see this booking in their view.
                      </Text>
                    </>
                  )}
                </div>
              )}

              <Field label="Comments (Optional)" style={{ marginTop: '16px' }}>
                <Textarea
                  value={comments}
                  onChange={(_, data) => setComments(data.value)}
                  placeholder="Add any notes for the account manager..."
                  rows={3}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCloseDialog} disabled={isSubmitting || isSendingNewSlotsRequest}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                className={styles.approveBtn}
                onClick={handleConfirmApprove}
                disabled={isSubmitting || !selectedSlot || isCheckingConflicts || isSendingNewSlotsRequest}
                icon={isSubmitting ? <Spinner size="tiny" /> : <Checkmark24Regular />}
              >
                {isSubmitting ? 'Approving...' : slotConflicts.get(selectedSlot)?.hasConflict ? 'Approve Anyway' : 'Confirm Approval'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={dialogType === 'reject' && !!selectedBooking} onOpenChange={(_, d) => !d.open && handleCloseDialog()}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogContent>
              <div className={styles.dialogHeader}>
                <DismissCircle24Filled className={styles.dialogIcon} style={{ color: '#d13438' }} />
                <div>
                  <Text weight="semibold" size={500}>Reject Booking</Text>
                  <Text size={200} style={{ color: '#616161', display: 'block' }}>
                    Reject the booking for {selectedBooking?.ClientName}
                  </Text>
                </div>
              </div>

              <Field label="Rejection Reason" required style={{ marginTop: '8px' }}>
                <Textarea
                  value={comments}
                  onChange={(_, data) => setComments(data.value)}
                  placeholder="Please provide a reason for rejecting this booking..."
                  rows={4}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={handleCloseDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                className={styles.rejectBtn}
                onClick={handleConfirmReject}
                disabled={isSubmitting || !comments.trim()}
                icon={isSubmitting ? <Spinner size="tiny" /> : <Dismiss24Regular />}
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Success Confirmation Dialog */}
      <Dialog open={showSuccessDialog} modalType="alert">
        <DialogSurface className={styles.successDialog}>
          <DialogBody>
            <DialogContent>
              <div className={styles.successContent}>
                <CheckmarkCircle24Filled className={styles.successIcon} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Text className={styles.successTitle}>Booking Approved!</Text>
                  <Text size={300} style={{ color: '#616161' }}>
                    The booking has been confirmed and all parties have been notified.
                  </Text>
                </div>
                {successDetails && (
                  <div className={styles.successDetails}>
                    <div className={styles.successDetailRow}>
                      <span className={styles.successDetailLabel}>Client:</span>
                      <span className={styles.successDetailValue}>{successDetails.clientName}</span>
                    </div>
                    <div className={styles.successDetailRow}>
                      <span className={styles.successDetailLabel}>Confirmed Date:</span>
                      <span className={styles.successDetailValue}>
                        {format(new Date(successDetails.confirmedDateTime), 'EEE, MMM d, yyyy')}
                      </span>
                    </div>
                    <div className={styles.successDetailRow}>
                      <span className={styles.successDetailLabel}>Confirmed Time:</span>
                      <span className={styles.successDetailValue}>
                        {format(new Date(successDetails.confirmedDateTime), 'h:mm a')}
                      </span>
                    </div>
                    {successDetails.specialistName && (
                      <div className={styles.successDetailRow}>
                        <span className={styles.successDetailLabel}>Assigned To:</span>
                        <span className={styles.successDetailValue}>{successDetails.specialistName}</span>
                      </div>
                    )}
                  </div>
                )}
                <Button
                  appearance="primary"
                  className={styles.successCloseBtn}
                  onClick={() => {
                    setShowSuccessDialog(false);
                    setSuccessDetails(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

    </div>
  );
};
