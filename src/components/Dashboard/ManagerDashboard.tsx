import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  makeStyles,
  Text,
  Spinner,
  Button,
  tokens,
  shorthands,
  Badge,
} from '@fluentui/react-components';
import {
  ArrowClockwise24Regular,
  ArrowDownload24Regular,
  CalendarMonth24Regular,
  Timeline24Regular,
  Trophy24Regular,
  Money24Regular,
  TargetRegular,
  DocumentFolder24Regular,
  ChartMultipleRegular,
  Clock24Regular,
  Board24Regular,
  People24Regular,
  Building24Regular,
  CheckboxChecked24Regular,
  ChevronDownRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardService } from '../../services/DashboardService';
import { DashboardData, DashboardFilters } from '../../types/Dashboard';
import { Booking } from '../../types/Booking';
import { ServiceRequest } from '../../types/ServiceRequest';
import { subDays, startOfDay, endOfDay } from 'date-fns';

import { KPICards } from './KPICards';
import { StatusChart } from './StatusChart';
import { TypeChart } from './TypeChart';
import { TrendsChart } from './TrendsChart';
import { AccountManagerTable } from './AccountManagerTable';
import { ClientTable } from './ClientTable';
import { DashboardFiltersComponent } from './DashboardFilters';
import { CalendarView } from './CalendarView';
import { TimelineView } from './TimelineView';
import { BookingDetails } from '../MyBookings/BookingDetails';
import { downloadBookingsExcel } from '../../utils/excelExport';
import { GamificationTab } from './GamificationTab';
import { CommercialTab } from './CommercialTab';
import { ResourcesTab } from './ResourcesTab';
import { WinLossTab } from './WinLossTab';
import { SLADashboardTab } from './SLADashboardTab';
import { useToast } from '../../contexts/ToastContext';
import { DW_COLORS } from '../../utils/buttonStyles';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';
// DWx Traffic Manager - Pipeline & Service Request Components
import { SalesFunnelDashboard } from '../SalesFunnel/SalesFunnelDashboard';
import { RequestsQueue } from '../SalesFunnel/RequestsQueue';
import { serviceRequestService } from '../../services/ServiceRequestService';

// ============================================================================
// Types
// ============================================================================

type DashboardTab = 'overview' | 'pipeline' | 'approvals' | 'calendar' | 'timeline' | 'performance' | 'clients' | 'commercial' | 'gamification' | 'resources' | 'winloss' | 'sla';

interface NavItem {
  value: DashboardTab;
  label: string;
  icon: React.ElementType;
  badge?: 'count' | 'warning';
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// ============================================================================
// Navigation Structure
// ============================================================================

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    items: [
      { value: 'overview', label: 'Overview', icon: Board24Regular },
      { value: 'pipeline', label: 'Sales Pipeline', icon: TargetRegular },
      { value: 'approvals', label: 'Action Queue', icon: CheckboxChecked24Regular, badge: 'count' },
    ],
  },
  {
    id: 'schedule',
    label: 'Schedule',
    items: [
      { value: 'calendar', label: 'Calendar', icon: CalendarMonth24Regular },
      { value: 'timeline', label: 'Timeline', icon: Timeline24Regular },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { value: 'performance', label: 'AM Performance', icon: People24Regular },
      { value: 'clients', label: 'Client Activity', icon: Building24Regular },
      { value: 'winloss', label: 'Win/Loss', icon: ChartMultipleRegular },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { value: 'commercial', label: 'Commercial', icon: Money24Regular },
      { value: 'gamification', label: 'Gamification', icon: Trophy24Regular },
      { value: 'resources', label: 'Resources', icon: DocumentFolder24Regular },
      { value: 'sla', label: 'SLA Tracking', icon: Clock24Regular, badge: 'warning' },
    ],
  },
];

const VALID_TABS = NAV_GROUPS.flatMap(g => g.items.map(i => i.value));

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('0', '64px', '24px'),
    maxWidth: '1400px',
    ...shorthands.margin('0', 'auto'),
    width: '100%',
  },
  heroWrapper: {
    position: 'relative',
    marginBottom: '20px',
  },
  heroBanner: {
    ...shorthands.borderRadius('0', '0', '16px', '16px'),
    ...shorthands.padding('0'),
    position: 'relative',
    ...shorthands.overflow('hidden'),
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 100%)',
  },
  heroExpanded: {
    maxHeight: '200px',
    transitionProperty: 'max-height',
    transitionDuration: '350ms',
    transitionTimingFunction: 'ease',
  },
  heroCollapsed: {
    maxHeight: '56px',
    transitionProperty: 'max-height',
    transitionDuration: '350ms',
    transitionTimingFunction: 'ease',
  },
  heroDecoration: {
    position: 'absolute',
    top: '-80px',
    right: '-40px',
    width: '300px',
    height: '300px',
    ...shorthands.borderRadius('50%'),
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('32px'),
    ...shorthands.padding('24px', '32px'),
  },
  heroTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    whiteSpace: 'nowrap',
    marginBottom: '4px',
  },
  heroTitleAccent: {
    color: '#7dd3fc',
  },
  heroIcon: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '22px',
  },
  heroSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
  },
  heroRightSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    flexShrink: 0,
  },
  collapsedStrip: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('0', '32px'),
    height: '56px',
    position: 'relative',
    zIndex: 2,
  },
  collapsedTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
  },
  collapsedBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('10px'),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '2px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#616161',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  refreshBtn: {
    backgroundColor: DW_COLORS.teal,
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  exportBtn: {
    backgroundColor: DW_COLORS.success,
    ':hover': {
      backgroundColor: '#0b5c0b',
    },
  },
  refreshTime: {
    fontSize: '11px',
    color: '#9e9e9e',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  debugBar: {
    ...shorthands.padding('6px', '12px'),
    backgroundColor: '#f3f2f1',
    ...shorthands.borderRadius('4px'),
    marginBottom: '12px',
    fontSize: '11px',
    color: '#616161',
    display: 'flex',
    gap: '16px',
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
    ...shorthands.padding('16px'),
    marginBottom: '16px',
    ...shorthands.borderRadius('4px'),
  },

  // Layout: sidebar + content
  layoutCard: {
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e1e1e1'),
    ...shorthands.borderRadius('8px'),
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    ...shorthands.overflow('hidden'),
  },
  layoutWrapper: {
    display: 'flex',
    minHeight: '600px',
  },

  // Sidebar
  sidebar: {
    width: '220px',
    flexShrink: 0,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: '#fafbfc',
    ...shorthands.padding('8px', '0'),
  },
  navGroup: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('10px', '16px'),
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    width: '100%',
    textAlign: 'left' as const,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  groupLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  chevronIcon: {
    color: tokens.colorNeutralForeground3,
    width: '14px',
    height: '14px',
  },
  navItems: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('2px', '0', '8px'),
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding('9px', '16px', '9px', '20px'),
    cursor: 'pointer',
    ...shorthands.border('none'),
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    borderLeft: '3px solid transparent',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  navItemActive: {
    backgroundColor: 'rgba(30, 107, 123, 0.08)',
    borderLeft: `3px solid ${DW_COLORS.teal}`,
    ':hover': {
      backgroundColor: 'rgba(30, 107, 123, 0.12)',
    },
  },
  navIcon: {
    width: '18px',
    height: '18px',
    color: tokens.colorNeutralForeground2,
    flexShrink: 0,
  },
  navIconActive: {
    color: DW_COLORS.teal,
  },
  navLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
  },
  navLabelActive: {
    fontWeight: tokens.fontWeightSemibold,
    color: DW_COLORS.teal,
  },
  navBadge: {
    marginLeft: 'auto',
  },

  // Content area
  contentArea: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    ...shorthands.padding('24px'),
    maxHeight: 'calc(100vh - 220px)',
  },

  // Overview tab sub-styles
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
});

// ============================================================================
// Component
// ============================================================================

export const ManagerDashboard: React.FC = () => {
  const styles = useStyles();
  const { isCollapsed, toggle } = useHeroCollapse('dashboard');
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Read tab from URL params, default to 'overview'
  const tabFromUrl = searchParams.get('tab') as DashboardTab | null;
  const [selectedTab, setSelectedTab] = useState<DashboardTab>(
    tabFromUrl && VALID_TABS.includes(tabFromUrl)
      ? tabFromUrl
      : 'overview'
  );

  // Sidebar group expand/collapse
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(NAV_GROUPS.map(g => g.id))
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Handle URL parameters for deep linking
  useEffect(() => {
    const tab = searchParams.get('tab') as DashboardTab | null;
    if (tab && VALID_TABS.includes(tab)) {
      setSelectedTab(tab);
    }
  }, [searchParams]);

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

      // Load service requests (primary data for DWx Traffic Manager)
      let allRequests: ServiceRequest[] = [];
      try {
        allRequests = await serviceRequestService.getRequests();
      } catch (requestErr) {
        console.warn('Could not load service requests:', requestErr);
      }
      setServiceRequests(allRequests);

      // Load legacy bookings (optional - for backward compatibility during migration)
      let allBookings: Booking[] = [];
      try {
        allBookings = await dashboardService.getAllBookings(filters);
      } catch (bookingErr) {
        console.warn('Could not load legacy bookings:', bookingErr);
      }
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

  // Handle service request updates from RequestsQueue
  const handleRequestUpdated = (updatedRequest: ServiceRequest) => {
    setServiceRequests((prev) =>
      prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
    );
    showToast('Request updated successfully', 'success');
  };

  const accountManagers = dashboardService.getUniqueAccountManagers(bookings);

  // Count actionable service requests (not Won/Lost)
  const pendingRequestsCount = serviceRequests.filter(
    (r) => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
  ).length;

  const heroStats = useMemo(() => {
    return {
      total: serviceRequests.length,
      pending: pendingRequestsCount,
    };
  }, [serviceRequests.length, pendingRequestsCount]);

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsOpen(false);
    setSelectedBooking(null);
  };

  // Helper to get badge for nav item
  const renderNavBadge = (item: NavItem) => {
    if (item.badge === 'count' && pendingRequestsCount > 0) {
      return (
        <Badge
          size="small"
          appearance="filled"
          color="danger"
          className={styles.navBadge}
        >
          {pendingRequestsCount}
        </Badge>
      );
    }
    return null;
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
      {/* Hero Banner */}
      <div className={styles.heroWrapper}>
        <div className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}>
          <div className={styles.heroDecoration} />
          {isCollapsed ? (
            <div className={styles.collapsedStrip}>
              <span className={styles.collapsedTitle}>Manager Dashboard</span>
              <span className={styles.collapsedBadge}>{heroStats.total} Total</span>
              <span className={styles.collapsedBadge}>{heroStats.pending} Pending</span>
            </div>
          ) : (
            <div className={styles.heroContent}>
              <div>
                <div className={styles.heroTitle}>
                  <Board24Regular className={styles.heroIcon} />
                  <span>Manager <span className={styles.heroTitleAccent}>Dashboard</span></span>
                </div>
                <div className={styles.heroSubtitle}>Overview of bookings, metrics, and team performance</div>
              </div>
              <div className={styles.heroRightSection}>
                <span className={styles.collapsedBadge}>{heroStats.total} Total</span>
                <span className={styles.collapsedBadge}>{heroStats.pending} Pending</span>
                {lastUpdated && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowClockwise24Regular style={{ width: '12px', height: '12px' }} />
                    {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                <Button
                  appearance="primary"
                  icon={<ArrowDownload24Regular />}
                  onClick={handleExport}
                  size="small"
                  disabled={isLoading || bookings.length === 0}
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                >
                  Export
                </Button>
                <Button
                  appearance="primary"
                  icon={<ArrowClockwise24Regular />}
                  onClick={handleRefresh}
                  size="small"
                  disabled={isLoading}
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
            </div>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

      {/* Debug info */}
      <div className={styles.debugBar}>
        <span>Logged in: <strong>{user?.email || 'unknown'}</strong></span>
        <span>Manager: <strong>{user?.isManager ? 'Yes' : 'No'}</strong></span>
        <span>Service Requests: <strong>{serviceRequests.length}</strong></span>
        <span>Legacy Bookings: <strong>{bookings.length}</strong></span>
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

      {/* Sidebar + Content Layout */}
      <div className={styles.layoutCard}>
        <div className={styles.layoutWrapper}>
          {/* Sidebar Navigation */}
          <nav className={styles.sidebar}>
            {NAV_GROUPS.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              return (
                <div key={group.id} className={styles.navGroup}>
                  <button
                    className={styles.groupHeader}
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${group.label} section`}
                  >
                    <Text className={styles.groupLabel}>{group.label}</Text>
                    {isExpanded ? (
                      <ChevronDownRegular className={styles.chevronIcon} />
                    ) : (
                      <ChevronRightRegular className={styles.chevronIcon} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className={styles.navItems}>
                      {group.items.map((item) => {
                        const isActive = selectedTab === item.value;
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.value}
                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                            onClick={() => setSelectedTab(item.value)}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <IconComponent
                              className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`}
                            />
                            <Text
                              className={`${styles.navLabel} ${isActive ? styles.navLabelActive : ''}`}
                            >
                              {item.label}
                            </Text>
                            {renderNavBadge(item)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Content Area */}
          {dashboardData && (
            <div className={styles.contentArea}>
              {/* Overview Tab */}
              {selectedTab === 'overview' && (
                <>
                  <KPICards
                    kpis={dashboardData.kpis}
                    recentBookings={dashboardData.recentBookings}
                    bookingsThisMonth={dashboardData.bookingsThisMonth}
                  />
                  <div className={styles.chartsRow}>
                    <StatusChart data={dashboardData.statusBreakdown} />
                    <TypeChart data={dashboardData.typeDistribution} />
                  </div>
                  <div className={styles.trendsSection}>
                    <TrendsChart data={dashboardData.trends} />
                  </div>
                </>
              )}

              {/* Pipeline Tab */}
              {selectedTab === 'pipeline' && (
                <SalesFunnelDashboard />
              )}

              {/* Action Queue Tab */}
              {selectedTab === 'approvals' && (
                <RequestsQueue
                  requests={serviceRequests}
                  onRequestUpdated={handleRequestUpdated}
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

              {/* Resources Tab */}
              {selectedTab === 'resources' && (
                <ResourcesTab />
              )}

              {/* Win/Loss Tab */}
              {selectedTab === 'winloss' && (
                <WinLossTab requests={serviceRequests} />
              )}

              {/* SLA Tab */}
              {selectedTab === 'sla' && (
                <SLADashboardTab requests={serviceRequests} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      <BookingDetails
        booking={selectedBooking}
        open={detailsOpen}
        onClose={handleDetailsClose}
      />
    </div>
  );
};
