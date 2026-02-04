import React from 'react';
import {
  Card,
  Text,
  makeStyles,
  Button,
} from '@fluentui/react-components';
import {
  CalendarLtr24Regular,
  Star24Filled,
  PersonSettingsRegular,
  ClipboardTask20Regular,
  CheckmarkCircle20Filled,
  Warning20Filled,
  Delete20Regular,
} from '@fluentui/react-icons';
import { Booking, BookingStatus } from '../../types/Booking';
import { deserializeChecklistItems } from '../../types/Checklist';
import { format } from 'date-fns';

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderLeft: '4px solid #1e6b7b',
    borderTop: '1px solid #d0d0d0',
    ':hover': {
      boxShadow: '0 3.2px 7.2px 0 rgba(0,0,0,.13), 0 0.6px 1.8px 0 rgba(0,0,0,.11)',
      transform: 'translateY(-2px)',
    },
  },
  cardTop: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  bookingMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  bookingType: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#616161',
  },
  premiumBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    background: 'linear-gradient(135deg, rgba(229, 168, 75, 0.15) 0%, rgba(229, 168, 75, 0.08) 100%)',
    border: '1px solid rgba(229, 168, 75, 0.3)',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#b38429',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
  statusPending: {
    backgroundColor: '#fff4ce',
    color: '#f7630c',
  },
  statusConfirmed: {
    backgroundColor: '#dff6dd',
    color: '#107c10',
  },
  statusCancelled: {
    backgroundColor: '#fde7e9',
    color: '#d13438',
  },
  statusRescheduling: {
    backgroundColor: '#e8e8f4',
    color: '#6264a7',
  },
  statusAwaiting: {
    backgroundColor: '#deecf9',
    color: '#0078d4',
  },
  cardDetails: {
    padding: '0 16px 16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '11px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#242424',
  },
  cardFooter: {
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e1e1e1',
  },
  createdDate: {
    fontSize: '12px',
    color: '#616161',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  viewDetailsBtn: {
    padding: '4px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #1e6b7b',
    color: '#1e6b7b',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#1e6b7b',
      color: 'white',
    },
  },
  deleteBtn: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #a4262c',
    color: '#a4262c',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '4px',
    minWidth: '28px',
    ':hover': {
      backgroundColor: '#a4262c',
      color: 'white',
    },
  },
  footerActions: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  specialistBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#e8f4f6',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#1e6b7b',
  },
  specialistIcon: {
    width: '12px',
    height: '12px',
  },
  unassignedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#8a8886',
    fontStyle: 'italic',
  },
  checklistBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },
  checklistComplete: {
    backgroundColor: 'rgba(16, 124, 16, 0.1)',
    color: '#107c10',
  },
  checklistInProgress: {
    backgroundColor: 'rgba(247, 99, 12, 0.1)',
    color: '#f7630c',
  },
  checklistOverdue: {
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    color: '#d13438',
  },
});

interface BookingCardProps {
  booking: Booking;
  onClick: (booking: Booking) => void;
  onDelete?: (booking: Booking) => void;
}

const getStatusClassName = (status: BookingStatus, styles: ReturnType<typeof useStyles>): string => {
  switch (status) {
    case 'Confirmed':
      return styles.statusConfirmed;
    case 'Pending Review':
      return styles.statusPending;
    case 'Awaiting Approval':
      return styles.statusAwaiting;
    case 'Cancelled':
      return styles.statusCancelled;
    case 'Rescheduling Required':
      return styles.statusRescheduling;
    default:
      return styles.statusPending;
  }
};

// Helper to get checklist info for Deployment bookings
const getChecklistInfo = (booking: Booking) => {
  if (booking.BookingType !== 'Deployment' || !booking.ConfirmedDateTime) {
    return null;
  }

  const items = deserializeChecklistItems(booking.ChecklistData || null);
  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;
  const isComplete = completedCount === totalCount;
  const dueDate = new Date(new Date(booking.ConfirmedDateTime).getTime() - 3 * 24 * 60 * 60 * 1000);
  const isOverdue = new Date() > dueDate && !isComplete;

  return { completedCount, totalCount, isComplete, isOverdue };
};

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick, onDelete }) => {
  const styles = useStyles();

  const confirmedDate = booking.ConfirmedDateTime
    ? format(new Date(booking.ConfirmedDateTime), 'MMM d, yyyy @ h:mm a')
    : null;

  const proposedSlot = booking.ProposedSlot1
    ? format(new Date(booking.ProposedSlot1), 'MMM d, yyyy @ h:mm a')
    : null;

  const createdDate = format(new Date(booking.Created), 'MMM d, yyyy');

  // Get checklist info for Deployment bookings
  const checklistInfo = getChecklistInfo(booking);

  return (
    <Card className={styles.card} onClick={() => onClick(booking)}>
      <div className={styles.cardTop}>
        <div className={styles.cardHeader}>
          <Text className={styles.clientName}>{booking.ClientName}</Text>
          <span className={`${styles.statusBadge} ${getStatusClassName(booking.Status, styles)}`}>
            <span className={styles.statusDot}></span>
            {booking.Status}
          </span>
        </div>
        <div className={styles.bookingMeta}>
          <span className={styles.bookingType}>
            <CalendarLtr24Regular style={{ width: '14px', height: '14px' }} />
            {booking.BookingType}
          </span>
          {booking.IsPremiumClient && (
            <span className={styles.premiumBadge}>
              <Star24Filled style={{ width: '12px', height: '12px', color: '#e5a84b' }} />
              Premium
            </span>
          )}
          {/* Show assigned specialist for Confirmed, Cancelled, or Rescheduling bookings */}
          {(booking.Status === 'Confirmed' || booking.Status === 'Cancelled' || booking.Status === 'Rescheduling Required') && (
            booking.AssignedSpecialistName ? (
              <span className={styles.specialistBadge}>
                <PersonSettingsRegular className={styles.specialistIcon} />
                {booking.AssignedSpecialistName}
              </span>
            ) : (
              <span className={styles.unassignedBadge}>
                <PersonSettingsRegular className={styles.specialistIcon} />
                Unassigned
              </span>
            )
          )}
          {/* Show checklist status for Confirmed Deployment bookings */}
          {checklistInfo && booking.Status === 'Confirmed' && (
            <span
              className={`${styles.checklistBadge} ${
                checklistInfo.isComplete
                  ? styles.checklistComplete
                  : checklistInfo.isOverdue
                  ? styles.checklistOverdue
                  : styles.checklistInProgress
              }`}
            >
              {checklistInfo.isComplete ? (
                <CheckmarkCircle20Filled style={{ width: '12px', height: '12px' }} />
              ) : checklistInfo.isOverdue ? (
                <Warning20Filled style={{ width: '12px', height: '12px' }} />
              ) : (
                <ClipboardTask20Regular style={{ width: '12px', height: '12px' }} />
              )}
              Checklist {checklistInfo.completedCount}/{checklistInfo.totalCount}
            </span>
          )}
        </div>
      </div>

      <div className={styles.cardDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>License Count</span>
          <span className={styles.detailValue}>{booking.LicenseCount.toLocaleString()}</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>
            {confirmedDate ? 'Confirmed Date' : 'Proposed Slot'}
          </span>
          <span className={styles.detailValue}>
            {confirmedDate || proposedSlot || 'Not set'}
          </span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.createdDate}>
          <CalendarLtr24Regular style={{ width: '14px', height: '14px' }} />
          Created {createdDate}
        </span>
        <div className={styles.footerActions}>
          <Button
            className={styles.viewDetailsBtn}
            appearance="outline"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClick(booking);
            }}
          >
            View Details
          </Button>
          {onDelete && (
            <Button
              className={styles.deleteBtn}
              appearance="outline"
              size="small"
              icon={<Delete20Regular style={{ width: '14px', height: '14px' }} />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(booking);
              }}
              title="Delete booking"
            />
          )}
        </div>
      </div>
    </Card>
  );
};
