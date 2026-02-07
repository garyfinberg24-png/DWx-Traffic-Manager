import React, { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { makeStyles } from '@fluentui/react-components';
import { Booking, BookingStatus } from '../../types/Booking';
import { DW_COLORS } from '../../utils/buttonStyles';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const useStyles = makeStyles({
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
    minHeight: '600px',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#616161',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
  },
});

// Custom CSS for react-big-calendar styling
const calendarStyles = `
  .lp-calendar .rbc-header {
    background-color: #f5f5f5;
    padding: 12px 8px;
    font-weight: 600;
    color: #242424;
    border-bottom: 1px solid #e1e1e1;
  }
  .lp-calendar .rbc-today {
    background-color: rgba(30, 107, 123, 0.08);
  }
  .lp-calendar .rbc-event {
    border-radius: 4px;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: 500;
    border: none;
  }
  .lp-calendar .rbc-toolbar {
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .lp-calendar .rbc-toolbar button {
    color: #242424;
    border-color: #e1e1e1;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.15s ease;
  }
  .lp-calendar .rbc-toolbar button:hover {
    background-color: #f5f5f5;
    border-color: #c7c7c7;
  }
  .lp-calendar .rbc-toolbar button.rbc-active {
    background-color: #1e6b7b;
    color: white;
    border-color: #1e6b7b;
  }
  .lp-calendar .rbc-toolbar button.rbc-active:hover {
    background-color: #154f5c;
    border-color: #154f5c;
  }
  .lp-calendar .rbc-month-view {
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    overflow: hidden;
  }
  .lp-calendar .rbc-date-cell {
    padding: 4px 8px;
    font-size: 13px;
  }
  .lp-calendar .rbc-off-range-bg {
    background-color: #fafafa;
  }
  .lp-calendar .rbc-show-more {
    color: #1e6b7b;
    font-weight: 500;
    font-size: 12px;
  }
`;

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
}

interface CalendarViewProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}

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

export const CalendarView: React.FC<CalendarViewProps> = ({ bookings, onBookingClick }) => {
  const styles = useStyles();

  const events: CalendarEvent[] = useMemo(() => {
    return bookings.map((booking) => {
      const dateStr = booking.ConfirmedDateTime || booking.ProposedSlot1;
      const startDate = dateStr ? new Date(dateStr) : new Date();
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

      return {
        id: booking.Id,
        title: `${booking.ClientName} - ${booking.BookingType}`,
        start: startDate,
        end: endDate,
        resource: booking,
      };
    });
  }, [bookings]);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      onBookingClick(event.resource);
    },
    [onBookingClick]
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const booking = event.resource;
    const statusColor = getStatusColor(booking.Status);

    return {
      style: {
        backgroundColor: statusColor,
        color: 'white',
        border: booking.IsPremiumClient ? '2px solid #e5a84b' : 'none',
        opacity: booking.Status === 'Cancelled' ? 0.6 : 1,
      },
    };
  }, []);

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const booking = event.resource;
    return (
      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {booking.IsPremiumClient && '⭐ '}
        {booking.ClientName}
        <span style={{ opacity: 0.8, marginLeft: '4px' }}>
          ({booking.BookingType})
        </span>
      </div>
    );
  };

  return (
    <div className={styles.calendarContainer}>
      <style>{calendarStyles}</style>
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: DW_COLORS.success }} />
          Confirmed
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#f7630c' }} />
          Pending Review
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#0078d4' }} />
          Awaiting Approval
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#6264a7' }} />
          Rescheduling Required
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: DW_COLORS.danger, opacity: 0.6 }} />
          Cancelled
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDot} style={{ backgroundColor: '#e5a84b', border: '2px solid #e5a84b' }} />
          Premium Client
        </div>
      </div>
      <div className="lp-calendar">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 550 }}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
          }}
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          defaultView={Views.MONTH}
          popup
          selectable={false}
          tooltipAccessor={(event) =>
            `${event.resource.ClientName}\n${event.resource.BookingType} - ${event.resource.Status}\n${event.resource.LicenseCount} licenses`
          }
        />
      </div>
    </div>
  );
};
