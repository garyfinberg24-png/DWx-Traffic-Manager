import React, { useMemo } from 'react';
import { makeStyles, Text, Button } from '@fluentui/react-components';
import {
  Star24Filled,
  Play24Filled,
  Rocket24Filled,
} from '@fluentui/react-icons';
import { format, isToday, isTomorrow, isYesterday, startOfDay, compareAsc } from 'date-fns';
import { Booking, BookingStatus } from '../../types/Booking';
import { DW_COLORS } from '../../utils/buttonStyles';

const useStyles = makeStyles({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
  },
  timelineWrapper: {
    position: 'relative',
  },
  dateGroup: {
    marginBottom: '32px',
    position: 'relative',
  },
  dateHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    position: 'sticky',
    top: 0,
    backgroundColor: '#ffffff',
    paddingTop: '8px',
    paddingBottom: '8px',
    zIndex: 10,
  },
  dateBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 14px',
    backgroundColor: DW_COLORS.teal,
    color: 'white',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  dateBadgeToday: {
    backgroundColor: DW_COLORS.success,
  },
  dateBadgePast: {
    backgroundColor: DW_COLORS.neutral,
  },
  dateCount: {
    fontSize: '12px',
    color: '#616161',
  },
  timelineLine: {
    position: 'absolute',
    left: '24px',
    top: '48px',
    bottom: '0',
    width: '2px',
    backgroundColor: '#e1e1e1',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingLeft: '48px',
    position: 'relative',
  },
  eventItem: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #e1e1e1',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.15s',
    transitionTimingFunction: 'ease',
    position: 'relative',
  },
  eventItemPremium: {
    borderLeft: '3px solid #e5a84b',
  },
  eventDot: {
    position: 'absolute',
    left: '-37px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '3px solid #ffffff',
    boxShadow: '0 0 0 2px #e1e1e1',
    zIndex: 5,
  },
  eventTime: {
    minWidth: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e1e1e1',
  },
  eventTimeText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  eventTimePeriod: {
    fontSize: '11px',
    color: '#616161',
    textTransform: 'uppercase',
  },
  eventContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  eventClient: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  premiumIcon: {
    color: '#e5a84b',
    width: '16px',
    height: '16px',
  },
  eventType: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },
  eventTypeDemo: {
    backgroundColor: 'rgba(30, 107, 123, 0.1)',
    color: '#1e6b7b',
  },
  eventTypeDeployment: {
    backgroundColor: 'rgba(229, 168, 75, 0.15)',
    color: '#8b6914',
  },
  eventDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#616161',
  },
  eventDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  eventStatus: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '130px',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusDot: {
    width: '6px',
    height: '6px',
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
  viewBtn: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #1e6b7b',
    color: '#1e6b7b',
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '4px',
    minWidth: '70px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px',
    color: '#616161',
  },
});

interface TimelineViewProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}

interface GroupedBookings {
  date: Date;
  dateKey: string;
  bookings: Booking[];
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

const getStatusColor = (status: BookingStatus): string => {
  switch (status) {
    case 'Confirmed':
      return '#107c10';
    case 'Pending Review':
      return '#f7630c';
    case 'Awaiting Approval':
      return '#0078d4';
    case 'Cancelled':
      return '#d13438';
    case 'Rescheduling Required':
      return '#6264a7';
    default:
      return '#616161';
  }
};

const formatDateLabel = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEEE, MMMM d, yyyy');
};

const isDatePast = (date: Date): boolean => {
  const today = startOfDay(new Date());
  const compareDate = startOfDay(date);
  return compareDate < today;
};

export const TimelineView: React.FC<TimelineViewProps> = ({ bookings, onBookingClick }) => {
  const styles = useStyles();

  const groupedBookings = useMemo((): GroupedBookings[] => {
    const groups = new Map<string, { date: Date; bookings: Booking[] }>();

    bookings.forEach((booking) => {
      const dateStr = booking.ConfirmedDateTime || booking.ProposedSlot1;
      if (!dateStr) return;

      const date = startOfDay(new Date(dateStr));
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!groups.has(dateKey)) {
        groups.set(dateKey, { date, bookings: [] });
      }
      groups.get(dateKey)!.bookings.push(booking);
    });

    // Sort groups by date
    const sortedGroups = Array.from(groups.entries())
      .sort(([, a], [, b]) => compareAsc(a.date, b.date))
      .map(([dateKey, { date, bookings: groupBookings }]) => ({
        dateKey,
        date,
        bookings: groupBookings.sort((a, b) => {
          const timeA = new Date(a.ConfirmedDateTime || a.ProposedSlot1 || 0).getTime();
          const timeB = new Date(b.ConfirmedDateTime || b.ProposedSlot1 || 0).getTime();
          return timeA - timeB;
        }),
      }));

    return sortedGroups;
  }, [bookings]);

  if (bookings.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <Text>No bookings to display in timeline</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.timelineWrapper}>
        {groupedBookings.map((group) => {
          const isPast = isDatePast(group.date);
          const isTodayDate = isToday(group.date);

          return (
            <div key={group.dateKey} className={styles.dateGroup}>
              <div className={styles.dateHeader}>
                <span
                  className={`${styles.dateBadge} ${
                    isTodayDate ? styles.dateBadgeToday : isPast ? styles.dateBadgePast : ''
                  }`}
                >
                  {formatDateLabel(group.date)}
                </span>
                <span className={styles.dateCount}>
                  {group.bookings.length} booking{group.bookings.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className={styles.timelineLine} />
              <div className={styles.eventsList}>
                {group.bookings.map((booking) => {
                  const dateStr = booking.ConfirmedDateTime || booking.ProposedSlot1;
                  const time = dateStr ? new Date(dateStr) : null;

                  return (
                    <div
                      key={booking.Id}
                      className={`${styles.eventItem} ${
                        booking.IsPremiumClient ? styles.eventItemPremium : ''
                      }`}
                      onClick={() => onBookingClick(booking)}
                    >
                      <div
                        className={styles.eventDot}
                        style={{ backgroundColor: getStatusColor(booking.Status) }}
                      />
                      <div className={styles.eventTime}>
                        {time && (
                          <>
                            <span className={styles.eventTimeText}>
                              {format(time, 'h:mm')}
                            </span>
                            <span className={styles.eventTimePeriod}>
                              {format(time, 'a')}
                            </span>
                          </>
                        )}
                      </div>
                      <div className={styles.eventContent}>
                        <div className={styles.eventHeader}>
                          <span className={styles.eventClient}>
                            {booking.ClientName}
                            {booking.IsPremiumClient && (
                              <Star24Filled className={styles.premiumIcon} />
                            )}
                          </span>
                          <span
                            className={`${styles.eventType} ${
                              booking.BookingType === 'Demo'
                                ? styles.eventTypeDemo
                                : styles.eventTypeDeployment
                            }`}
                          >
                            {booking.BookingType === 'Demo' ? (
                              <Play24Filled style={{ width: '12px', height: '12px' }} />
                            ) : (
                              <Rocket24Filled style={{ width: '12px', height: '12px' }} />
                            )}
                            {booking.BookingType}
                          </span>
                        </div>
                        <div className={styles.eventDetails}>
                          <span className={styles.eventDetailItem}>
                            {booking.LicenseCount.toLocaleString()} licenses
                          </span>
                          <span className={styles.eventDetailItem}>
                            AM: {booking.AccountManagerName}
                          </span>
                        </div>
                      </div>
                      <div className={styles.eventStatus}>
                        <span
                          className={`${styles.statusBadge} ${getStatusClassName(
                            booking.Status,
                            styles
                          )}`}
                        >
                          <span className={styles.statusDot} />
                          {booking.Status}
                        </span>
                      </div>
                      <Button
                        className={styles.viewBtn}
                        appearance="outline"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBookingClick(booking);
                        }}
                      >
                        View
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
