import React, { useEffect, useState } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Switch,
  Tooltip,
} from '@fluentui/react-components';
import {
  CalendarLtr24Regular,
  Add24Regular,
  Grid24Regular,
  List24Regular,
  Star24Filled,
  Person24Regular,
  PersonSettingsRegular,
  CalendarMonth24Regular,
  Timeline24Regular,
  Trophy24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useBookings } from '../../contexts/BookingContext';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { BookingCard } from './BookingCard';
import { BookingDetails } from './BookingDetails';
import { BookingFilters } from './BookingFilters';
import { RescheduleDialog } from './RescheduleDialog';
import { ClientHistoryDialog } from './ClientHistoryDialog';
import { CancelBookingDialog } from './CancelBookingDialog';
import { DeleteBookingDialog } from './DeleteBookingDialog';
import { RecordFeedbackDialog } from './RecordFeedbackDialog';
import { PersonalStatsCard } from './PersonalStatsCard';
import { CalendarView } from '../Dashboard/CalendarView';
import { TimelineView } from '../Dashboard/TimelineView';
import { GamificationTab } from '../Dashboard/GamificationTab';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService } from '../../services/BookingService';
import { Booking, BookingStatus } from '../../types/Booking';
import { format } from 'date-fns';

const useStyles = makeStyles({
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  titleIcon: {
    width: '28px',
    height: '28px',
    color: '#1e6b7b',
  },
  titleText: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#242424',
  },
  refreshBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e1e1e1',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  resultsInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  resultsCount: {
    fontSize: '14px',
    color: '#616161',
  },
  resultsCountStrong: {
    color: '#242424',
    fontWeight: '600',
  },
  viewToggle: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    padding: '4px',
  },
  viewToggleBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#616161',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
  },
  viewToggleBtnActive: {
    backgroundColor: '#ffffff',
    color: '#1e6b7b',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '16px',
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    borderLeft: '4px solid #1e6b7b',
    borderTop: '1px solid #d0d0d0',
    gap: '24px',
    ':hover': {
      boxShadow: '0 3.2px 7.2px 0 rgba(0,0,0,.13), 0 0.6px 1.8px 0 rgba(0,0,0,.11)',
      backgroundColor: '#fafafa',
    },
  },
  listItemMain: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: 0,
  },
  listClientName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#242424',
    minWidth: '180px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  listPremiumIcon: {
    color: '#e5a84b',
    width: '16px',
    height: '16px',
    flexShrink: 0,
  },
  listType: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    minWidth: '90px',
    justifyContent: 'center',
  },
  listTypeDemo: {
    backgroundColor: 'rgba(30, 107, 123, 0.1)',
    color: '#1e6b7b',
  },
  listTypeDeployment: {
    backgroundColor: 'rgba(229, 168, 75, 0.15)',
    color: '#8b6914',
  },
  listLicenses: {
    fontSize: '13px',
    color: '#616161',
    minWidth: '100px',
  },
  listDate: {
    fontSize: '13px',
    color: '#616161',
    minWidth: '160px',
  },
  listStatus: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    minWidth: '140px',
    justifyContent: 'center',
  },
  listStatusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
  listStatusPending: {
    backgroundColor: '#fff4ce',
    color: '#f7630c',
  },
  listStatusConfirmed: {
    backgroundColor: '#dff6dd',
    color: '#107c10',
  },
  listStatusCancelled: {
    backgroundColor: '#fde7e9',
    color: '#d13438',
  },
  listStatusRescheduling: {
    backgroundColor: '#e8e8f4',
    color: '#6264a7',
  },
  listStatusAwaiting: {
    backgroundColor: '#deecf9',
    color: '#0078d4',
  },
  listViewBtn: {
    padding: '6px 12px',
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
  emptyState: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    minHeight: '300px',
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    color: '#e1e1e1',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#242424',
  },
  emptyText: {
    fontSize: '14px',
    color: '#616161',
    marginBottom: '24px',
  },
  emptyBtn: {
    padding: '8px 24px',
    backgroundColor: '#1e6b7b',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  errorBar: {
    backgroundColor: '#fde7e9',
    borderLeft: '4px solid #d13438',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '24px',
    borderRadius: '4px',
  },
  errorText: {
    color: '#d13438',
    fontSize: '14px',
  },
  // Manager view styles
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  managerToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#424242',
  },
  managerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    backgroundColor: '#e8f4f6',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#1e6b7b',
  },
  listAccountManager: {
    fontSize: '13px',
    color: '#424242',
    minWidth: '140px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  listAccountManagerIcon: {
    width: '14px',
    height: '14px',
    color: '#616161',
  },
  listSpecialist: {
    fontSize: '12px',
    color: '#616161',
    minWidth: '130px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  listSpecialistIcon: {
    width: '14px',
    height: '14px',
    color: '#1e6b7b',
  },
  unassignedBadge: {
    fontSize: '11px',
    color: '#8a8886',
    fontStyle: 'italic',
  },
  listDeleteBtn: {
    padding: '6px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #a4262c',
    color: '#a4262c',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '4px',
    minWidth: '32px',
    ':hover': {
      backgroundColor: '#a4262c',
      color: 'white',
    },
  },
});

const getListStatusClassName = (status: BookingStatus, styles: ReturnType<typeof useStyles>): string => {
  switch (status) {
    case 'Confirmed':
      return styles.listStatusConfirmed;
    case 'Pending Review':
      return styles.listStatusPending;
    case 'Awaiting Approval':
      return styles.listStatusAwaiting;
    case 'Cancelled':
      return styles.listStatusCancelled;
    case 'Rescheduling Required':
      return styles.listStatusRescheduling;
    default:
      return styles.listStatusPending;
  }
};

export const MyBookings: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();
  const {
    bookings,
    isLoading,
    error,
    filters,
    setFilters,
    fetchBookings,
    refreshBookings,
    updateBooking,
    clearError,
    showAllBookings,
    setShowAllBookings,
  } = useBookings();
  const { showSuccess, showError } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [clientHistoryOpen, setClientHistoryOpen] = useState(false);
  const [clientHistoryName, setClientHistoryName] = useState('');
  const [clientHistoryPremium, setClientHistoryPremium] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list' | 'calendar' | 'timeline' | 'leaderboard'>('cards');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBookingItem, setDeleteBookingItem] = useState<Booking | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackBooking, setFeedbackBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedBooking(null);
  };

  const handleNewBooking = () => {
    navigate('/booking');
  };

  const handleRequestReschedule = (booking: Booking) => {
    setDetailsOpen(false);
    setRescheduleBooking(booking);
    setRescheduleOpen(true);
  };

  const handleRescheduleClose = () => {
    setRescheduleOpen(false);
    setRescheduleBooking(null);
  };

  const handleRescheduleConfirm = async (newSlots: { slot1: Date; slot2: Date; slot3: Date; reason: string }) => {
    if (!rescheduleBooking) return;

    try {
      await updateBooking(rescheduleBooking.Id, {
        Status: 'Rescheduling Required',
        ProposedSlot1: newSlots.slot1.toISOString(),
        ProposedSlot2: newSlots.slot2.toISOString(),
        ProposedSlot3: newSlots.slot3.toISOString(),
        ConfirmedDateTime: undefined, // Clear confirmed date
        Comments: newSlots.reason
          ? `Reschedule request: ${newSlots.reason}${rescheduleBooking.Comments ? ` | Previous: ${rescheduleBooking.Comments}` : ''}`
          : rescheduleBooking.Comments,
      });
      showSuccess('Reschedule Requested', 'Your reschedule request has been submitted for review.');
      setRescheduleOpen(false);
      setRescheduleBooking(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit reschedule request';
      showError('Reschedule Failed', message);
      throw err;
    }
  };

  // Client history handlers
  const handleViewClientHistory = (clientName: string, isPremium: boolean) => {
    setDetailsOpen(false);
    setClientHistoryName(clientName);
    setClientHistoryPremium(isPremium);
    setClientHistoryOpen(true);
  };

  const handleClientHistoryClose = () => {
    setClientHistoryOpen(false);
    setClientHistoryName('');
    setClientHistoryPremium(false);
  };

  // Cancel booking handlers
  const handleRequestCancel = (booking: Booking) => {
    setDetailsOpen(false);
    setCancelBooking(booking);
    setCancelOpen(true);
  };

  const handleCancelClose = () => {
    setCancelOpen(false);
    setCancelBooking(null);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!cancelBooking || !user) return;

    try {
      const result = await bookingService.cancelBooking(
        cancelBooking.Id,
        reason,
        user.email,
        user.displayName
      );

      if (result.success) {
        showSuccess(
          'Booking Cancelled',
          `Your booking for ${cancelBooking.ClientName} has been cancelled.`
        );
        setCancelOpen(false);
        setCancelBooking(null);
        // Refresh bookings to show updated status
        refreshBookings();
      } else {
        throw new Error(result.error || 'Failed to cancel booking');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel booking';
      showError('Cancellation Failed', message);
      throw err;
    }
  };

  // Delete booking handlers (managers/admins only)
  const handleRequestDelete = (booking: Booking) => {
    setDetailsOpen(false);
    setDeleteBookingItem(booking);
    setDeleteOpen(true);
  };

  const handleDeleteClose = () => {
    setDeleteOpen(false);
    setDeleteBookingItem(null);
  };

  const handleRestoreBooking = async (booking: Booking) => {
    if (!user) return;
    try {
      const result = await bookingService.restoreBooking(booking.Id, user.displayName);
      if (result.success) {
        showSuccess('Booking Restored', `The booking for ${booking.ClientName} has been restored.`);
        refreshBookings();
      } else {
        showError('Restore Failed', result.error || 'Failed to restore booking');
      }
    } catch (err) {
      showError('Restore Failed', err instanceof Error ? err.message : 'Failed to restore booking');
    }
  };

  const handlePermanentDelete = async (booking: Booking) => {
    if (!user) return;
    if (!window.confirm(`Permanently delete "${booking.ClientName}"? This cannot be undone.`)) return;
    try {
      const result = await bookingService.permanentlyDeleteBooking(booking.Id, user.displayName);
      if (result.success) {
        showSuccess('Permanently Deleted', `The booking for ${booking.ClientName} has been permanently removed.`);
        refreshBookings();
      } else {
        showError('Delete Failed', result.error || 'Failed to permanently delete booking');
      }
    } catch (err) {
      showError('Delete Failed', err instanceof Error ? err.message : 'Failed to permanently delete');
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!deleteBookingItem || !user) return;

    try {
      const result = await bookingService.deleteBooking(
        deleteBookingItem.Id,
        reason,
        user.email,
        user.displayName
      );

      if (result.success) {
        showSuccess(
          'Booking Deleted',
          `The booking for ${deleteBookingItem.ClientName} has been moved to Recently Deleted. You can restore it if needed.`
        );
        setDeleteOpen(false);
        setDeleteBookingItem(null);
        refreshBookings();
      } else {
        throw new Error(result.error || 'Failed to delete booking');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete booking';
      showError('Deletion Failed', message);
      throw err;
    }
  };

  // Record Feedback handlers
  const handleRequestFeedback = (booking: Booking) => {
    setDetailsOpen(false);
    setFeedbackBooking(booking);
    setFeedbackOpen(true);
  };

  const handleFeedbackClose = () => {
    setFeedbackOpen(false);
    setFeedbackBooking(null);
  };

  const handleFeedbackSave = async (bookingId: number, outcome: string, nextSteps: string) => {
    try {
      await updateBooking(bookingId, {
        Outcome: outcome,
        NextSteps: nextSteps,
      });
      showSuccess('Feedback Recorded', 'The outcome and next steps have been saved.');
      setFeedbackOpen(false);
      setFeedbackBooking(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save feedback';
      showError('Save Failed', message);
      throw err;
    }
  };

  // Separate active and deleted bookings
  const activeBookings = bookings.filter((b) => b.Status !== 'Deleted');
  const deletedBookings = isManager ? bookings.filter((b) => b.Status === 'Deleted') : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>
            <CalendarLtr24Regular className={styles.titleIcon} />
            <Text className={styles.titleText}>Bookings</Text>
          </div>
          <div className={styles.managerToggle}>
            <Tooltip content="View all bookings across all account managers" relationship="description">
              <Switch
                checked={showAllBookings}
                onChange={(_, data) => setShowAllBookings(data.checked)}
                label={showAllBookings ? 'All Bookings' : 'My Bookings'}
              />
            </Tooltip>
            {showAllBookings && (
              <span className={styles.managerBadge}>
                <Person24Regular style={{ width: '12px', height: '12px' }} />
                All Users
              </span>
            )}
          </div>
        </div>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={handleNewBooking}
        >
          New Booking
        </Button>
      </div>

      {error && (
        <div className={styles.errorBar}>
          <Text className={styles.errorText}>
            {error}
          </Text>
          <Button appearance="subtle" size="small" onClick={clearError} style={{ marginLeft: 'auto' }}>
            Dismiss
          </Button>
        </div>
      )}

      {user?.email && bookings.length > 0 && (
        <PersonalStatsCard userEmail={user.email} bookings={bookings} />
      )}

      <BookingFilters
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={refreshBookings}
        isLoading={isLoading}
      />

      {!isLoading && activeBookings.length > 0 && (
        <div className={styles.resultsInfo}>
          <Text className={styles.resultsCount}>
            Showing <span className={styles.resultsCountStrong}>{activeBookings.length}</span> bookings
          </Text>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'cards' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('cards')}
            >
              <Grid24Regular style={{ width: '16px', height: '16px' }} />
              Cards
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List24Regular style={{ width: '16px', height: '16px' }} />
              List
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'calendar' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <CalendarMonth24Regular style={{ width: '16px', height: '16px' }} />
              Calendar
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'timeline' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              <Timeline24Regular style={{ width: '16px', height: '16px' }} />
              Timeline
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'leaderboard' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('leaderboard')}
            >
              <Trophy24Regular style={{ width: '16px', height: '16px' }} />
              Leaderboard
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner label="Loading bookings..." />
      ) : activeBookings.length === 0 ? (
        <div className={styles.grid}>
          <div className={styles.emptyState}>
            <CalendarLtr24Regular className={styles.emptyIcon} />
            <Text className={styles.emptyTitle}>No bookings found</Text>
            <Text className={styles.emptyText}>
              {filters.search || filters.status?.length || filters.bookingType?.length
                ? 'Try adjusting your filters'
                : "You haven't submitted any booking requests yet"}
            </Text>
            {!filters.search && !filters.status?.length && !filters.bookingType?.length && (
              <Button
                appearance="primary"
                className={styles.emptyBtn}
                icon={<Add24Regular />}
                onClick={handleNewBooking}
              >
                Create Your First Booking
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className={styles.grid}>
          {activeBookings.map((booking) => (
            <BookingCard
              key={booking.Id}
              booking={booking}
              onClick={handleBookingClick}
              onDelete={isManager ? handleRequestDelete : undefined}
            />
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className={styles.listContainer}>
          {activeBookings.map((booking) => {
            const displayDate = booking.ConfirmedDateTime
              ? format(new Date(booking.ConfirmedDateTime), 'MMM d, yyyy @ h:mm a')
              : booking.ProposedSlot1
                ? format(new Date(booking.ProposedSlot1), 'MMM d, yyyy @ h:mm a')
                : 'Not set';

            return (
              <div
                key={booking.Id}
                className={styles.listItem}
                onClick={() => handleBookingClick(booking)}
              >
                <div className={styles.listItemMain}>
                  <span className={styles.listClientName}>
                    {booking.ClientName}
                    {booking.IsPremiumClient && (
                      <Star24Filled className={styles.listPremiumIcon} />
                    )}
                  </span>
                  <span className={`${styles.listType} ${booking.BookingType === 'Demo' ? styles.listTypeDemo : styles.listTypeDeployment}`}>
                    {booking.BookingType}
                  </span>
                  {/* Account Manager column - visible in "All Bookings" mode */}
                  {showAllBookings && (
                    <span className={styles.listAccountManager}>
                      <Person24Regular className={styles.listAccountManagerIcon} />
                      {booking.AccountManagerName || 'Unknown'}
                    </span>
                  )}
                  {/* Assigned Specialist column - visible for confirmed/cancelled/rescheduling bookings */}
                  {(booking.Status === 'Confirmed' || booking.Status === 'Cancelled' || booking.Status === 'Rescheduling Required') && (
                    <span className={styles.listSpecialist}>
                      <PersonSettingsRegular className={styles.listSpecialistIcon} />
                      {booking.AssignedSpecialistName || (
                        <span className={styles.unassignedBadge}>Unassigned</span>
                      )}
                    </span>
                  )}
                  <span className={styles.listLicenses}>
                    {booking.LicenseCount.toLocaleString()} licenses
                  </span>
                  <span className={styles.listDate}>
                    {displayDate}
                  </span>
                </div>
                <span className={`${styles.listStatus} ${getListStatusClassName(booking.Status, styles)}`}>
                  <span className={styles.listStatusDot}></span>
                  {booking.Status}
                </span>
                <Button
                  className={styles.listViewBtn}
                  appearance="outline"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookingClick(booking);
                  }}
                >
                  View
                </Button>
                {isManager && (
                  <Tooltip content="Delete booking permanently" relationship="description">
                    <Button
                      className={styles.listDeleteBtn}
                      appearance="outline"
                      size="small"
                      icon={<Delete24Regular style={{ width: '16px', height: '16px' }} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestDelete(booking);
                      }}
                    />
                  </Tooltip>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView
          bookings={activeBookings}
          onBookingClick={handleBookingClick}
        />
      ) : viewMode === 'timeline' ? (
        <TimelineView
          bookings={activeBookings}
          onBookingClick={handleBookingClick}
        />
      ) : (
        <GamificationTab
          bookings={bookings}
          currentUserEmail={user?.email}
          isManager={false}
        />
      )}

      {/* Recently Deleted section (manager only) */}
      {isManager && deletedBookings.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '2px solid #d13438',
          }}>
            <Delete24Regular style={{ color: '#d13438' }} />
            <Text style={{ fontSize: '16px', fontWeight: 600, color: '#d13438' }}>
              Recently Deleted ({deletedBookings.length})
            </Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deletedBookings.map((booking) => (
              <div
                key={booking.Id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#fdf3f3',
                  borderRadius: '8px',
                  border: '1px solid #f0d0d0',
                }}
              >
                <div>
                  <Text style={{ fontWeight: 600 }}>{booking.ClientName}</Text>
                  <Text style={{ fontSize: '12px', color: '#616161', marginLeft: '12px' }}>
                    {booking.BookingType} · {booking.AccountManagerName}
                  </Text>
                  {booking.Outcome && (
                    <Text style={{ fontSize: '11px', color: '#a0a0a0', display: 'block', marginTop: '2px' }}>
                      {booking.Outcome}
                    </Text>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    appearance="primary"
                    size="small"
                    onClick={() => handleRestoreBooking(booking)}
                  >
                    Restore
                  </Button>
                  <Button
                    appearance="outline"
                    size="small"
                    style={{ color: '#d13438', borderColor: '#d13438' }}
                    onClick={() => handlePermanentDelete(booking)}
                  >
                    Permanently Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <BookingDetails
        booking={selectedBooking}
        open={detailsOpen}
        onClose={handleDetailsClose}
        onRequestReschedule={handleRequestReschedule}
        onRequestCancel={handleRequestCancel}
        onRequestDelete={isManager ? handleRequestDelete : undefined}
        onViewClientHistory={handleViewClientHistory}
        onRecordFeedback={handleRequestFeedback}
      />

      <RescheduleDialog
        open={rescheduleOpen}
        onClose={handleRescheduleClose}
        onConfirm={handleRescheduleConfirm}
        booking={rescheduleBooking}
      />

      <ClientHistoryDialog
        open={clientHistoryOpen}
        onClose={handleClientHistoryClose}
        clientName={clientHistoryName}
        isPremium={clientHistoryPremium}
      />

      <CancelBookingDialog
        open={cancelOpen}
        onClose={handleCancelClose}
        onConfirm={handleCancelConfirm}
        booking={cancelBooking}
      />

      <DeleteBookingDialog
        open={deleteOpen}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
        booking={deleteBookingItem}
      />

      <RecordFeedbackDialog
        open={feedbackOpen}
        onClose={handleFeedbackClose}
        onSave={handleFeedbackSave}
        booking={feedbackBooking}
      />
    </div>
  );
};
