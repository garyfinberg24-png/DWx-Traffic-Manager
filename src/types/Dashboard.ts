import { BookingStatus } from './Booking';

// KPI Metrics
export interface DashboardKPIs {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalLicenses: number;
  premiumClients: number;
  conversionRate: number; // Confirmed / Total %
  avgTimeToConfirmation: number; // In days
}

// Status breakdown for funnel chart
export interface StatusBreakdown {
  status: BookingStatus;
  count: number;
  percentage: number;
}

// Booking type distribution
export interface TypeDistribution {
  type: 'Demo' | 'Deployment';
  count: number;
  percentage: number;
}

// Time series data for trends
export interface TrendDataPoint {
  date: string; // YYYY-MM-DD or YYYY-MM format
  bookings: number;
  licenses: number;
  demos: number;
  deployments: number;
}

// Account Manager performance metrics
export interface AccountManagerMetrics {
  name: string;
  email: string;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalLicenses: number;
  conversionRate: number;
  avgLicensesPerBooking: number;
}

// Client activity metrics
export interface ClientMetrics {
  clientName: string;
  totalBookings: number;
  demos: number;
  deployments: number;
  totalLicenses: number;
  isPremium: boolean;
  lastBookingDate: string;
  accountManager: string;
}

// Dashboard filter options
export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  bookingTypes?: ('Demo' | 'Deployment')[];
  statuses?: BookingStatus[];
  accountManagers?: string[];
  premiumOnly?: boolean;
}

// Aggregated dashboard data
export interface DashboardData {
  kpis: DashboardKPIs;
  statusBreakdown: StatusBreakdown[];
  typeDistribution: TypeDistribution[];
  trends: TrendDataPoint[];
  accountManagerMetrics: AccountManagerMetrics[];
  clientMetrics: ClientMetrics[];
  recentBookings: number; // Last 7 days
  bookingsThisMonth: number;
}

// Time period presets
export type TimePeriod = 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'thisQuarter' | 'thisYear' | 'custom';

export interface TimePeriodOption {
  key: TimePeriod;
  label: string;
  getDateRange: () => { start: Date; end: Date };
}

// Chart color scheme
export const CHART_COLORS = {
  primary: '#0078d4',
  success: '#107c10',
  warning: '#ffb900',
  danger: '#d13438',
  info: '#00bcf2',
  purple: '#8764b8',
  teal: '#008272',
  orange: '#ff8c00',
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  'Pending Review': CHART_COLORS.warning,
  'Awaiting Approval': CHART_COLORS.info,
  'Confirmed': CHART_COLORS.success,
  'Cancelled': CHART_COLORS.danger,
  'Rescheduling Required': CHART_COLORS.orange,
  'Deleted': '#a0a0a0',
};
