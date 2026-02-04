import React, { useEffect, useState, useCallback } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Spinner,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
  BreadcrumbButton,
} from '@fluentui/react-components';
import { ArrowLeft24Regular, CalendarLtr24Regular } from '@fluentui/react-icons';
import { useNavigate, useParams } from 'react-router-dom';
import { sharePointService } from '../../services/SharePointService';
import { Booking } from '../../types/Booking';
import { DeploymentChecklistComponent } from './DeploymentChecklist';

const useStyles = makeStyles({
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px',
  },
  header: {
    marginBottom: '24px',
  },
  breadcrumb: {
    marginBottom: '16px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px',
  },
  backBtn: {
    minWidth: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#242424',
  },
  subtitle: {
    fontSize: '14px',
    color: '#616161',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  errorContainer: {
    backgroundColor: '#fde7e9',
    borderLeft: '4px solid #d13438',
    padding: '24px',
    borderRadius: '4px',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#d13438',
    fontWeight: '600',
    marginBottom: '8px',
  },
  errorText: {
    color: '#616161',
    marginBottom: '16px',
  },
  notDeployment: {
    backgroundColor: '#fff4ce',
    borderLeft: '4px solid #f7630c',
    padding: '24px',
    borderRadius: '4px',
    textAlign: 'center',
  },
});

export const ChecklistPage: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBooking = useCallback(async () => {
    if (!bookingId) {
      setError('No booking ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await sharePointService.getBookingById(parseInt(bookingId, 10));
      setBooking(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch booking';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleSave = async (checklistData: string, isComplete: boolean) => {
    if (!booking) return;

    try {
      setIsSaving(true);
      await sharePointService.updateBooking(booking.Id, {
        ChecklistData: checklistData,
        ChecklistComplete: isComplete,
      });
      // Refresh booking data
      await fetchBooking();
    } catch (err) {
      console.error('Failed to save checklist:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/bookings');
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="Loading booking..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <Text className={styles.errorTitle} size={500} block>
            Error Loading Booking
          </Text>
          <Text className={styles.errorText} block>
            {error}
          </Text>
          <Button appearance="primary" onClick={handleBack}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <Text className={styles.errorTitle} size={500} block>
            Booking Not Found
          </Text>
          <Text className={styles.errorText} block>
            The requested booking could not be found.
          </Text>
          <Button appearance="primary" onClick={handleBack}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  if (booking.BookingType !== 'Deployment') {
    return (
      <div className={styles.container}>
        <div className={styles.notDeployment}>
          <Text size={500} weight="semibold" block style={{ color: '#8b6914', marginBottom: '8px' }}>
            Checklist Not Available
          </Text>
          <Text block style={{ color: '#616161', marginBottom: '16px' }}>
            Deployment checklists are only available for Deployment bookings. This is a {booking.BookingType} booking.
          </Text>
          <Button appearance="primary" onClick={handleBack}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  if (!booking.ConfirmedDateTime) {
    return (
      <div className={styles.container}>
        <div className={styles.notDeployment}>
          <Text size={500} weight="semibold" block style={{ color: '#8b6914', marginBottom: '8px' }}>
            Checklist Not Yet Available
          </Text>
          <Text block style={{ color: '#616161', marginBottom: '16px' }}>
            The deployment checklist will be available once this booking has been confirmed with a scheduled date.
          </Text>
          <Button appearance="primary" onClick={handleBack}>
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Breadcrumb className={styles.breadcrumb}>
          <BreadcrumbItem>
            <BreadcrumbButton onClick={() => navigate('/bookings')}>My Bookings</BreadcrumbButton>
          </BreadcrumbItem>
          <BreadcrumbDivider />
          <BreadcrumbItem>
            <BreadcrumbButton onClick={handleBack}>{booking.ClientName}</BreadcrumbButton>
          </BreadcrumbItem>
          <BreadcrumbDivider />
          <BreadcrumbItem>
            <BreadcrumbButton current>Deployment Checklist</BreadcrumbButton>
          </BreadcrumbItem>
        </Breadcrumb>

        <div className={styles.titleRow}>
          <Button
            appearance="subtle"
            icon={<ArrowLeft24Regular />}
            onClick={handleBack}
            className={styles.backBtn}
          />
          <CalendarLtr24Regular style={{ width: '28px', height: '28px', color: '#1e6b7b' }} />
          <Text className={styles.title}>Deployment Checklist</Text>
        </div>
        <Text className={styles.subtitle}>
          {booking.ClientName} - License Pulse Deployment
        </Text>
      </div>

      <DeploymentChecklistComponent
        booking={booking}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </div>
  );
};
