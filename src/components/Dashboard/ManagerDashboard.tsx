import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  makeStyles,
  Text,
  Spinner,
  Button,
  Tab,
  TabList,
} from '@fluentui/react-components';
import { ArrowClockwise24Regular, ArrowDownload24Regular, CalendarMonth24Regular, Timeline24Regular, Trophy24Regular, Money24Regular } from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/DashboardService';
import { DashboardData, DashboardFilters } from '../../types/Dashboard';
import { Booking } from '../../types/Booking';
import { subDays, startOfDay, endOfDay } from 'date-fns';

import { KPICards } from './KPICards';
import { StatusChart } from './StatusChart';
import { TypeChart } from './TypeChart';
import { TrendsChart } from './TrendsChart';
import { AccountManagerTable } from './AccountManagerTable';
import { ClientTable } from './ClientTable';
import { DashboardFiltersComponent } from './DashboardFilters';
import { ApprovalQueue } from './ApprovalQueue';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';
import { BookingDetails } from '../MyBookings/BookingDetails';
import { downloadBookingsExcel } from '../../utils/excelExport';
import { GamificationTab } from './GamificationTab';
import { CommercialTab } from './CommercialTab';
import { bookingService, ApprovalResult } from '../../services/BookingService';
import { useToast } from '../../contexts/ToastContext';

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#616161',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  refreshBtn: {
    backgroundColor: '#1e6b7b',
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  exportBtn: {
    backgroundColor: '#107c10',
    ':hover': {
      backgroundColor: '#0b5c0b',
    },
  },
  refreshTime: {
    fontSize: '12px',
    color: '#616161',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
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
    padding: '16px',
    marginBottom: '24px',
    borderRadius: '4px',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  trendsSection: {
    marginBottom: '24px',
  },
  tablesRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '1fr',
    },
  },
  tabContent: {
    marginTop: '24px',
  },
  tabList: {
    borderBottom: '1px solid #e1e1e1',
    marginBottom: '0',
  },
});

type DashboardTab = 'overview' | 'approvals' | 'calendar' | 'timeline' | 'performance' | 'clients' | 'commercial' | 'gamification';

export const ManagerDashboard: React.FC = () => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<number | null>(null);

  // Read tab from URL params, default to 'overview'
  const tabFromUrl = searchParams.get('tab') as DashboardTab | null;
  const [selectedTab, setSelectedTab] = useState<DashboardTab>(
    tabFromUrl && ['overview', 'approvals', 'calendar', 'timeline', 'leaderboard', 'commercial'].includes(tabFromUrl)
      ? tabFromUrl
      : 'overview'
  );

  // Handle URL parameters for deep linking
  useEffect(() => {
    const tab = searchParams.get('tab') as DashboardTab | null;
    const bookingId = searchParams.get('bookingId');

    if (tab && ['overview', 'approvals', 'calendar', 'timeline', 'leaderboard', 'commercial'].includes(tab)) {
      setSelectedTab(tab);
    }

    if (bookingId) {
      setHighlightedBookingId(parseInt(bookingId, 10));
      // Clear the bookingId from URL after reading it (keeps the tab)
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('bookingId');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: {
      start: startOfDay(subDays(new Date(), 30)),
      end: endOfDay(new Date()),
    },
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allBookings = await dashboardService.getAllBookings(filters);
      setBookings(allBookings);

      const data = dashboardService.calculateDashboardData(allBookings);
      setDashboardData(data);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const handleFiltersChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExport = () => {
    if (bookings.length > 0) {
      downloadBookingsExcel(bookings);
    }
  };

  const handleApproveBooking = async (bookingId: number, confirmedSlot: string, comments?: string): Promise<ApprovalResult> => {
    const approverName = user?.displayName || 'Manager';
    const approverEmail = user?.email || '';

    try {
      const result = await bookingService.approveBooking(
        bookingId,
        confirmedSlot,
        comments || '',
        approverEmail,
        approverName
      );

      if (!result.success) {
        console.error('Booking approval failed:', result.error);
        showToast(result.error || 'Approval failed', 'error');
        throw new Error(result.error || 'Approval failed');
      }

      // Show warnings if any (e.g., calendar event failed but booking was approved)
      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          showToast(warning, 'warning');
        });
      }

      return result;
    } finally {
      // Always refresh data so the UI updates even if there were partial errors
      await fetchDashboardData();
    }
  };

  const handleRejectBooking = async (bookingId: number, reason: string) => {
    const rejecterName = user?.displayName || 'Manager';
    const rejecterEmail = user?.email || '';

    try {
      const result = await bookingService.rejectBooking(
        bookingId,
        reason,
        rejecterEmail,
        rejecterName
      );

      if (!result.success) {
        console.error('Booking rejection failed:', result.error);
        throw new Error(result.error || 'Rejection failed');
      }
    } finally {
      // Always refresh data so the UI updates
      await fetchDashboardData();
    }
  };

  const accountManagers = dashboardService.getUniqueAccountManagers(bookings);
  const pendingApprovalsCount = bookings.filter(
    (b) => b.Status === 'Pending Review' || b.Status === 'Awaiting Approval'
  ).length;

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedBooking(null);
  };

  if (isLoading && !dashboardData) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Text className={styles.title}>Manager Dashboard</Text>
          <Text className={styles.subtitle}>
            Overview of all License Pulse booking activity
          </Text>
        </div>
        <div className={styles.actions}>
          {lastUpdated && (
            <span className={styles.refreshTime}>
              <ArrowClockwise24Regular style={{ width: '14px', height: '14px' }} />
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <Button
            appearance="primary"
            className={styles.exportBtn}
            icon={<ArrowDownload24Regular />}
            onClick={handleExport}
            disabled={isLoading || bookings.length === 0}
          >
            Export to Excel
          </Button>
          <Button
            appearance="primary"
            className={styles.refreshBtn}
            icon={<ArrowClockwise24Regular />}
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Debug info - helps diagnose user-specific issues */}
      <div style={{
        padding: '6px 12px',
        backgroundColor: '#f3f2f1',
        borderRadius: '4px',
        marginBottom: '12px',
        fontSize: '11px',
        color: '#616161',
        display: 'flex',
        gap: '16px',
      }}>
        <span>Logged in: <strong>{user?.email || 'unknown'}</strong></span>
        <span>Manager: <strong>{user?.isManager ? 'Yes' : 'No'}</strong></span>
        <span>Bookings loaded: <strong>{bookings.length}</strong></span>
        {error && <span style={{ color: '#d13438' }}>Error: {error}</span>}
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.errorContainer}>
          <Text style={{ color: '#d13438', fontWeight: 600, marginBottom: '4px', display: 'block' }}>
            Error loading dashboard
          </Text>
          <Text style={{ color: '#616161' }}>{error}</Text>
        </div>
      )}

      {/* Filters */}
      <DashboardFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        accountManagers={accountManagers}
      />

      {/* Tabs */}
      <TabList
        className={styles.tabList}
        selectedValue={selectedTab}
        onTabSelect={(_, data) => setSelectedTab(data.value as DashboardTab)}
      >
        <Tab value="overview">Overview</Tab>
        <Tab value="approvals">
          Approvals {pendingApprovalsCount > 0 && `(${pendingApprovalsCount})`}
        </Tab>
        <Tab value="calendar" icon={<CalendarMonth24Regular />}>Calendar</Tab>
        <Tab value="timeline" icon={<Timeline24Regular />}>Timeline</Tab>
        <Tab value="performance">Account Manager Performance</Tab>
        <Tab value="clients">Client Activity</Tab>
        <Tab value="commercial" icon={<Money24Regular />}>Commercial</Tab>
        <Tab value="gamification" icon={<Trophy24Regular />}>Gamification</Tab>
      </TabList>

      {dashboardData && (
        <div className={styles.tabContent}>
          {/* Overview Tab */}
          {selectedTab === 'overview' && (
            <>
              {/* KPI Cards */}
              <KPICards
                kpis={dashboardData.kpis}
                recentBookings={dashboardData.recentBookings}
                bookingsThisMonth={dashboardData.bookingsThisMonth}
              />

              {/* Charts Row */}
              <div className={styles.chartsRow}>
                <StatusChart data={dashboardData.statusBreakdown} />
                <TypeChart data={dashboardData.typeDistribution} />
              </div>

              {/* Trends Chart */}
              <div className={styles.trendsSection}>
                <TrendsChart data={dashboardData.trends} />
              </div>
            </>
          )}

          {/* Approvals Tab */}
          {selectedTab === 'approvals' && (
            <ApprovalQueue
              bookings={bookings}
              onApprove={handleApproveBooking}
              onReject={handleRejectBooking}
              isLoading={isLoading}
              highlightedBookingId={highlightedBookingId}
              onHighlightClear={() => setHighlightedBookingId(null)}
            />
          )}

          {/* Performance Tab */}
          {selectedTab === 'performance' && (
            <AccountManagerTable data={dashboardData.accountManagerMetrics} />
          )}

          {/* Clients Tab */}
          {selectedTab === 'clients' && (
            <ClientTable data={dashboardData.clientMetrics} />
          )}

          {/* Calendar Tab */}
          {selectedTab === 'calendar' && (
            <CalendarView
              bookings={bookings}
              onBookingClick={handleBookingClick}
            />
          )}

          {/* Timeline Tab */}
          {selectedTab === 'timeline' && (
            <TimelineView
              bookings={bookings}
              onBookingClick={handleBookingClick}
            />
          )}

          {/* Commercial Tab */}
          {selectedTab === 'commercial' && (
            <CommercialTab bookings={bookings} />
          )}

          {/* Gamification Tab */}
          {selectedTab === 'gamification' && (
            <GamificationTab
              bookings={bookings}
              currentUserEmail={user?.email}
              isManager={true}
            />
          )}
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetails
        booking={selectedBooking}
        open={detailsOpen}
        onClose={handleDetailsClose}
      />
    </div>
  );
};
