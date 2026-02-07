import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Text,
  makeStyles,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  DismissCircle24Regular,
  CalendarLtr24Regular,
  Mail24Regular,
  Briefcase24Regular,
  Star24Filled,
  Clock24Regular,
  CheckmarkCircle24Filled,
  Warning24Filled,
  ClipboardTask24Regular,
  Open24Regular,
  CalendarSync24Regular,
  History24Regular,
  Person24Regular,
  // Receipt24Regular, // Temporarily disabled - Generate Quote feature
  Delete24Regular,
  Notepad24Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { Booking } from '../../types/Booking';
import { deserializeChecklistItems } from '../../types/Checklist';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { DW_COLORS } from '../../utils/buttonStyles';
// Temporarily disabled - Generate Quote feature
// import { notificationService } from '../../services/NotificationService';
// import { referenceDataService } from '../../services/ReferenceDataService';

const useStyles = makeStyles({
  surface: {
    maxWidth: '800px',
    width: '95vw',
    borderRadius: '16px',
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
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2d8a9c 100%)',
    color: 'white',
    gap: '16px',
    flexShrink: 0,
  },
  modalHeaderContent: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginBottom: '12px',
    margin: '0 0 12px 0',
    lineHeight: '1.2',
    wordBreak: 'break-word',
  },
  modalSubtitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  bookingTypeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  premiumBadgeHeader: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    background: 'linear-gradient(135deg, rgba(229, 168, 75, 0.95) 0%, rgba(229, 168, 75, 0.8) 100%)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#1a1a1a',
    whiteSpace: 'nowrap',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    minWidth: '32px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    flexShrink: 0,
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
  },
  modalBody: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  statusBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '24px',
  },
  statusBannerConfirmed: {
    backgroundColor: '#dff6dd',
    border: '1px solid rgba(16, 124, 16, 0.2)',
  },
  statusBannerPending: {
    backgroundColor: '#fff4ce',
    border: '1px solid rgba(247, 99, 12, 0.2)',
  },
  statusBannerAwaiting: {
    backgroundColor: '#deecf9',
    border: '1px solid rgba(0, 120, 212, 0.2)',
  },
  statusBannerRescheduling: {
    backgroundColor: '#e8e8f4',
    border: '1px solid rgba(98, 100, 167, 0.2)',
  },
  statusBannerCancelled: {
    backgroundColor: '#fde7e9',
    border: '1px solid rgba(209, 52, 56, 0.2)',
  },
  statusIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  statusIconConfirmed: { backgroundColor: DW_COLORS.success },
  statusIconPending: { backgroundColor: '#f7630c' },
  statusIconAwaiting: { backgroundColor: '#0078d4' },
  statusIconRescheduling: { backgroundColor: '#6264a7' },
  statusIconCancelled: { backgroundColor: DW_COLORS.danger },
  statusContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statusTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  statusTitleConfirmed: { color: '#107c10' },
  statusTitlePending: { color: '#f7630c' },
  statusTitleAwaiting: { color: '#0078d4' },
  statusTitleRescheduling: { color: '#6264a7' },
  statusTitleCancelled: { color: '#d13438' },
  statusDescription: {
    fontSize: '13px',
    color: '#616161',
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: {
    width: '18px',
    height: '18px',
    color: '#1e6b7b',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  detailCard: {
    padding: '14px 16px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    border: '1px solid #e8e8e8',
  },
  detailCardHighlight: {
    background: 'linear-gradient(135deg, rgba(30, 107, 123, 0.1) 0%, rgba(30, 107, 123, 0.05) 100%)',
    border: '1px solid rgba(30, 107, 123, 0.2)',
  },
  detailLabel: {
    fontSize: '11px',
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
    wordBreak: 'break-word',
  },
  detailValueLarge: {
    fontSize: '20px',
    color: '#1e6b7b',
    fontWeight: '600',
  },
  timeSlotsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  timeSlotItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f8f8f8',
    borderRadius: '8px',
    border: '1px solid #e8e8e8',
  },
  timeSlotItemSelected: {
    backgroundColor: '#e8f5e8',
    border: '1px solid rgba(16, 124, 16, 0.4)',
  },
  slotNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#666666',
    flexShrink: 0,
  },
  slotNumberSelected: {
    backgroundColor: DW_COLORS.success,
    color: 'white',
  },
  slotDate: {
    fontSize: '14px',
    color: '#242424',
    flex: 1,
  },
  slotLabel: {
    fontSize: '11px',
    color: '#107c10',
    fontWeight: '600',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(16, 124, 16, 0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  commentsBox: {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    borderLeft: '3px solid #1e6b7b',
  },
  commentsText: {
    fontSize: '14px',
    color: '#242424',
    lineHeight: '1.5',
    fontStyle: 'italic',
  },
  nextSteps: {
    padding: '16px',
    background: 'linear-gradient(135deg, rgba(16, 124, 16, 0.08) 0%, rgba(16, 124, 16, 0.04) 100%)',
    borderRadius: '8px',
    border: '1px solid rgba(16, 124, 16, 0.15)',
  },
  nextStepsText: {
    fontSize: '14px',
    color: '#242424',
    lineHeight: '1.5',
  },
  checklistSection: {
    marginTop: '16px',
  },
  checklistStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    borderRadius: '8px',
  },
  checklistComplete: {
    backgroundColor: '#dff6dd',
    border: '1px solid rgba(16, 124, 16, 0.2)',
  },
  checklistIncomplete: {
    backgroundColor: '#fff4ce',
    border: '1px solid rgba(247, 99, 12, 0.2)',
  },
  checklistOverdue: {
    backgroundColor: '#fde7e9',
    border: '1px solid rgba(209, 52, 56, 0.2)',
  },
  manageChecklistBtn: {
    marginTop: '12px',
    backgroundColor: DW_COLORS.teal,
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#fafafa',
    gap: '8px',
    flexShrink: 0,
  },
  rescheduleBtn: {
    backgroundColor: '#6264a7',
    ':hover': {
      backgroundColor: '#525499',
    },
  },
  cancelBtn: {
    backgroundColor: DW_COLORS.danger,
    color: 'white',
    ':hover': {
      backgroundColor: '#a52a2d',
    },
  },
  assignedSpecialistCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, rgba(16, 124, 16, 0.1) 0%, rgba(16, 124, 16, 0.05) 100%)',
    borderRadius: '10px',
    border: '1px solid rgba(16, 124, 16, 0.25)',
    marginBottom: '24px',
  },
  specialistAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: DW_COLORS.success,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  specialistInfo: {
    flex: 1,
    minWidth: 0,
  },
  specialistLabel: {
    fontSize: '12px',
    color: '#107c10',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  specialistName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '2px',
  },
  specialistRole: {
    fontSize: '13px',
    color: '#616161',
  },
  quoteBtn: {
    backgroundColor: '#0078d4',
    ':hover': {
      backgroundColor: '#106ebe',
    },
  },
  deleteBtn: {
    backgroundColor: '#a4262c',
    color: 'white',
    ':hover': {
      backgroundColor: '#8b2025',
    },
  },
  feedbackBtn: {
    backgroundColor: DW_COLORS.success,
    color: 'white',
    ':hover': {
      backgroundColor: '#0b5c0b',
    },
  },
});

interface BookingDetailsProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onRequestReschedule?: (booking: Booking) => void;
  onRequestCancel?: (booking: Booking) => void;
  onRequestDelete?: (booking: Booking) => void;
  onViewClientHistory?: (clientName: string, isPremium: boolean) => void;
  onRecordFeedback?: (booking: Booking) => void;
}

const getStatusBannerClass = (status: string, styles: ReturnType<typeof useStyles>): string => {
  switch (status) {
    case 'Confirmed':
      return styles.statusBannerConfirmed;
    case 'Pending Review':
      return styles.statusBannerPending;
    case 'Awaiting Approval':
      return styles.statusBannerAwaiting;
    case 'Rescheduling Required':
      return styles.statusBannerRescheduling;
    case 'Cancelled':
      return styles.statusBannerCancelled;
    default:
      return styles.statusBannerPending;
  }
};

const getStatusIconClass = (status: string, styles: ReturnType<typeof useStyles>): string => {
  switch (status) {
    case 'Confirmed':
      return styles.statusIconConfirmed;
    case 'Pending Review':
      return styles.statusIconPending;
    case 'Awaiting Approval':
      return styles.statusIconAwaiting;
    case 'Rescheduling Required':
      return styles.statusIconRescheduling;
    case 'Cancelled':
      return styles.statusIconCancelled;
    default:
      return styles.statusIconPending;
  }
};

const getStatusTitleClass = (status: string, styles: ReturnType<typeof useStyles>): string => {
  switch (status) {
    case 'Confirmed':
      return styles.statusTitleConfirmed;
    case 'Pending Review':
      return styles.statusTitlePending;
    case 'Awaiting Approval':
      return styles.statusTitleAwaiting;
    case 'Rescheduling Required':
      return styles.statusTitleRescheduling;
    case 'Cancelled':
      return styles.statusTitleCancelled;
    default:
      return styles.statusTitlePending;
  }
};

const getStatusTitle = (status: string): string => {
  switch (status) {
    case 'Confirmed':
      return 'Booking Confirmed';
    case 'Pending Review':
      return 'Pending Review';
    case 'Awaiting Approval':
      return 'Awaiting Approval';
    case 'Rescheduling Required':
      return 'Rescheduling Required';
    case 'Cancelled':
      return 'Booking Cancelled';
    default:
      return status;
  }
};

export const BookingDetails: React.FC<BookingDetailsProps> = ({
  booking,
  open,
  onClose,
  onRequestReschedule,
  onRequestCancel,
  onRequestDelete,
  onViewClientHistory,
  onRecordFeedback,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { isManager } = useAuth();

  if (!booking) return null;

  const handleManageChecklist = () => {
    onClose();
    navigate(`/checklist/${booking.Id}`);
  };

  const handleReschedule = () => {
    if (onRequestReschedule) {
      onRequestReschedule(booking);
    }
  };

  const handleCancel = () => {
    if (onRequestCancel) {
      onRequestCancel(booking);
    }
  };

  const handleDelete = () => {
    if (onRequestDelete) {
      onRequestDelete(booking);
    }
  };

  const handleRecordFeedback = () => {
    if (onRecordFeedback) {
      onRecordFeedback(booking);
    }
  };

  // Generate Quote functionality temporarily disabled - pending Power App Param() configuration
  // const handleGenerateQuote = async () => { ... };

  // Can reschedule if not cancelled and not already rescheduling
  const canReschedule = booking.Status !== 'Cancelled' && booking.Status !== 'Rescheduling Required';

  // Can cancel if not already cancelled
  const canCancel = booking.Status !== 'Cancelled';

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'EEEE, MMMM d, yyyy \'at\' h:mm a');
    } catch {
      return dateString;
    }
  };

  const formatShortDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy @ h:mm a');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Teal Header with Close Button */}
          <div className={styles.modalHeader}>
            <div className={styles.modalHeaderContent}>
              <h2 className={styles.modalTitle}>{booking.ClientName}</h2>
              <div className={styles.modalSubtitle}>
                <span className={styles.bookingTypeBadge}>
                  <CalendarLtr24Regular style={{ width: '14px', height: '14px' }} />
                  DWx {booking.BookingType}
                </span>
                {booking.IsPremiumClient && (
                  <span className={styles.premiumBadgeHeader}>
                    <Star24Filled style={{ width: '12px', height: '12px' }} />
                    Premium Client
                  </span>
                )}
              </div>
            </div>
            <Button
              className={styles.closeBtn}
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={onClose}
              title="Close"
            />
          </div>

          <DialogContent className={styles.modalBody}>
            {/* Status Banner */}
            <div className={`${styles.statusBanner} ${getStatusBannerClass(booking.Status, styles)}`}>
              <div className={`${styles.statusIcon} ${getStatusIconClass(booking.Status, styles)}`}>
                <CheckmarkCircle24Filled style={{ width: '20px', height: '20px' }} />
              </div>
              <div className={styles.statusContent}>
                <h4 className={`${styles.statusTitle} ${getStatusTitleClass(booking.Status, styles)}`}>
                  {getStatusTitle(booking.Status)}
                </h4>
                <p className={styles.statusDescription}>
                  {booking.Status === 'Confirmed' && booking.ConfirmedDateTime
                    ? `This booking has been confirmed for ${formatShortDateTime(booking.ConfirmedDateTime)}`
                    : `This booking is currently ${booking.Status.toLowerCase()}`}
                </p>
              </div>
            </div>

            {/* Assigned Specialist - shown when booking is confirmed and has an assigned resource */}
            {booking.AssignedSpecialistName && (
              <div className={styles.assignedSpecialistCard}>
                <div className={styles.specialistAvatar}>
                  <Person24Regular style={{ width: '24px', height: '24px' }} />
                </div>
                <div className={styles.specialistInfo}>
                  <div className={styles.specialistLabel}>
                    Assigned {booking.BookingType === 'Demo' ? 'Demo Specialist' : 'Resource'}
                  </div>
                  <div className={styles.specialistName}>{booking.AssignedSpecialistName}</div>
                  {booking.AssignedSpecialistRole && (
                    <div className={styles.specialistRole}>{booking.AssignedSpecialistRole}</div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Details Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionHeading}>
                <Briefcase24Regular className={styles.sectionIcon} />
                Booking Details
              </h3>
              <div className={styles.detailsGrid}>
                <div className={`${styles.detailCard} ${styles.detailCardHighlight}`}>
                  <div className={styles.detailLabel}>License Count</div>
                  <div className={styles.detailValueLarge}>{booking.LicenseCount.toLocaleString()}</div>
                </div>
                <div className={`${styles.detailCard} ${styles.detailCardHighlight}`}>
                  <div className={styles.detailLabel}>
                    {booking.ConfirmedDateTime ? 'Confirmed Date & Time' : 'Created'}
                  </div>
                  <div className={styles.detailValueLarge}>
                    {booking.ConfirmedDateTime
                      ? formatShortDateTime(booking.ConfirmedDateTime)
                      : formatShortDateTime(booking.Created)}
                  </div>
                </div>
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>Account Manager</div>
                  <div className={styles.detailValue}>{booking.AccountManagerName}</div>
                </div>
                <div className={styles.detailCard}>
                  <div className={styles.detailLabel}>Account Manager Email</div>
                  <div className={styles.detailValue}>{booking.AccountManagerEmail}</div>
                </div>
                {booking.DealSize && (
                  <>
                    <div className={styles.detailCard}>
                      <div className={styles.detailLabel}>Deal Size</div>
                      <div className={styles.detailValue}>{booking.DealSize.toLocaleString()}</div>
                    </div>
                    <div className={styles.detailCard}>
                      <div className={styles.detailLabel}>Deal Value (ZAR)</div>
                      <div className={styles.detailValue}>
                        R {(booking.DealSize * 90).toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
                {booking.Priority && (
                  <div className={styles.detailCard}>
                    <div className={styles.detailLabel}>Priority</div>
                    <div className={styles.detailValue}>{booking.Priority}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Time Slots Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionHeading}>
                <Clock24Regular className={styles.sectionIcon} />
                Proposed Time Slots
              </h3>
              <div className={styles.timeSlotsList}>
                <div className={`${styles.timeSlotItem} ${booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot1 ? styles.timeSlotItemSelected : ''}`}>
                  <span className={`${styles.slotNumber} ${booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot1 ? styles.slotNumberSelected : ''}`}>1</span>
                  <span className={styles.slotDate}>{formatDateTime(booking.ProposedSlot1)}</span>
                  {booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot1 && (
                    <span className={styles.slotLabel}>Confirmed</span>
                  )}
                </div>
                <div className={`${styles.timeSlotItem} ${booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot2 ? styles.timeSlotItemSelected : ''}`}>
                  <span className={`${styles.slotNumber} ${booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot2 ? styles.slotNumberSelected : ''}`}>2</span>
                  <span className={styles.slotDate}>{formatDateTime(booking.ProposedSlot2)}</span>
                  {booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot2 && (
                    <span className={styles.slotLabel}>Confirmed</span>
                  )}
                </div>
                <div className={`${styles.timeSlotItem} ${booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot3 ? styles.timeSlotItemSelected : ''}`}>
                  <span className={`${styles.slotNumber} ${booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot3 ? styles.slotNumberSelected : ''}`}>3</span>
                  <span className={styles.slotDate}>{formatDateTime(booking.ProposedSlot3)}</span>
                  {booking.ConfirmedDateTime && booking.ConfirmedDateTime === booking.ProposedSlot3 && (
                    <span className={styles.slotLabel}>Confirmed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Comments */}
            {booking.Comments && (
              <div className={styles.section}>
                <h3 className={styles.sectionHeading}>
                  <Mail24Regular className={styles.sectionIcon} />
                  Comments
                </h3>
                <div className={styles.commentsBox}>
                  <p className={styles.commentsText}>"{booking.Comments}"</p>
                </div>
              </div>
            )}

            {/* Outcome */}
            {booking.Outcome && (
              <div className={styles.section}>
                <h3 className={styles.sectionHeading}>
                  <Briefcase24Regular className={styles.sectionIcon} />
                  Outcome
                </h3>
                <Text>{booking.Outcome}</Text>
              </div>
            )}

            {/* Next Steps */}
            {booking.NextSteps && (
              <div className={styles.section}>
                <h3 className={styles.sectionHeading}>
                  <CalendarLtr24Regular className={styles.sectionIcon} />
                  Next Steps
                </h3>
                <div className={styles.nextSteps}>
                  <p className={styles.nextStepsText}>{booking.NextSteps}</p>
                </div>
              </div>
            )}

            {/* Deployment Checklist Status */}
            {booking.BookingType === 'Deployment' && booking.ConfirmedDateTime && (
              <div className={styles.checklistSection}>
                <h3 className={styles.sectionHeading}>
                  <ClipboardTask24Regular className={styles.sectionIcon} />
                  Deployment Readiness Checklist
                </h3>
                {(() => {
                  const items = deserializeChecklistItems(booking.ChecklistData || null);
                  const completedCount = items.filter((i) => i.isCompleted).length;
                  const totalCount = items.length;
                  const isComplete = completedCount === totalCount;
                  const dueDate = new Date(new Date(booking.ConfirmedDateTime!).getTime() - 3 * 24 * 60 * 60 * 1000);
                  const isOverdue = new Date() > dueDate && !isComplete;

                  const statusClass = isComplete
                    ? styles.checklistComplete
                    : isOverdue
                    ? styles.checklistOverdue
                    : styles.checklistIncomplete;

                  const statusIcon = isComplete ? (
                    <CheckmarkCircle24Filled style={{ color: '#107c10' }} />
                  ) : isOverdue ? (
                    <Warning24Filled style={{ color: '#d13438' }} />
                  ) : (
                    <ClipboardTask24Regular style={{ color: '#f7630c' }} />
                  );

                  return (
                    <>
                      <div className={`${styles.checklistStatus} ${statusClass}`}>
                        {statusIcon}
                        <div>
                          <Text weight="semibold">
                            {isComplete ? 'Complete' : isOverdue ? 'Overdue' : 'In Progress'}
                          </Text>
                          <Text size={200} block>
                            {completedCount} of {totalCount} items completed
                          </Text>
                          <Text size={200} block style={{ color: '#616161' }}>
                            Due: {format(dueDate, 'dd MMM yyyy')} (3 days before deployment)
                          </Text>
                        </div>
                      </div>
                      <Button
                        appearance="primary"
                        icon={<Open24Regular />}
                        className={styles.manageChecklistBtn}
                        onClick={handleManageChecklist}
                      >
                        Manage Checklist
                      </Button>
                    </>
                  );
                })()}
              </div>
            )}
          </DialogContent>

          {/* Footer with Action Buttons */}
          <div className={styles.modalFooter}>
              {isManager && onRequestDelete && (
                <Button
                  size="small"
                  appearance="primary"
                  className={styles.deleteBtn}
                  icon={<Delete24Regular />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
              {/* Generate Quote button temporarily disabled - pending Power App Param() configuration
              {isManager && (
                <Button
                  size="small"
                  appearance="primary"
                  className={styles.quoteBtn}
                  icon={<Receipt24Regular />}
                  onClick={handleGenerateQuote}
                >
                  Generate Quote
                </Button>
              )}
              */}
              {onViewClientHistory && (
                <Button
                  size="small"
                  appearance="secondary"
                  icon={<History24Regular />}
                  onClick={() => onViewClientHistory(booking.ClientName, booking.IsPremiumClient)}
                >
                  Client History
                </Button>
              )}
              {booking.Status === 'Confirmed' && onRecordFeedback && (
                <Button
                  size="small"
                  appearance="primary"
                  className={styles.feedbackBtn}
                  icon={<Notepad24Regular />}
                  onClick={handleRecordFeedback}
                >
                  {booking.Outcome ? 'Update Feedback' : 'Record Feedback'}
                </Button>
              )}
              {canCancel && onRequestCancel && (
                <Button
                  size="small"
                  appearance="primary"
                  className={styles.cancelBtn}
                  icon={<DismissCircle24Regular />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              )}
              {canReschedule && onRequestReschedule && (
                <Button
                  size="small"
                  appearance="primary"
                  className={styles.rescheduleBtn}
                  icon={<CalendarSync24Regular />}
                  onClick={handleReschedule}
                >
                  Reschedule
                </Button>
              )}
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
