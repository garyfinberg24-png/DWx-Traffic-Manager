import { getGraphService } from './serviceFactory';
import { config } from '../config/environmentConfig';

// Get the appropriate graph service based on test mode
const graphService = getGraphService();
import { Booking, BookingStatus } from '../types/Booking';
import {
  DashboardData,
  DashboardKPIs,
  StatusBreakdown,
  TypeDistribution,
  TrendDataPoint,
  AccountManagerMetrics,
  ClientMetrics,
  DashboardFilters,
} from '../types/Dashboard';
import { differenceInDays, parseISO, format, startOfMonth } from 'date-fns';

// Interface for Graph API list item response
interface GraphListItem {
  id: string;
  fields: {
    id?: string;
    Title?: string;
    AccountManagerName?: string;
    AccountManagerEmail?: string;
    ClientName?: string;
    BookingType?: string;
    LicenseCount?: number;
    ProposedSlot1?: string;
    ProposedSlot2?: string;
    ProposedSlot3?: string;
    ConfirmedDateTime?: string;
    Comments?: string;
    IsPremiumClient?: boolean;
    Status?: string;
    Outcome?: string;
    NextSteps?: string;
    CalendarEventId?: string;
    Created?: string;
    ChecklistData?: string;
    ChecklistComplete?: boolean;
    ChecklistDueDate?: string;
    DealSize?: number;
    DealValue?: string;
    Priority?: string;
  };
}

class DashboardService {
  private get listName(): string {
    return config.sharepoint.listName;
  }

  // Fetch ALL bookings (no user filter) for manager dashboard
  async getAllBookings(filters?: DashboardFilters): Promise<Booking[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 1000, // Higher limit for dashboard analytics
      })) as GraphListItem[];

      let bookings = items.map((item) => this.transformGraphItem(item));

      // Apply filters client-side (Graph API list filtering is limited)
      if (filters?.dateRange) {
        bookings = bookings.filter((b) => {
          const created = parseISO(b.Created);
          return created >= filters.dateRange!.start && created <= filters.dateRange!.end;
        });
      }

      if (filters?.bookingTypes && filters.bookingTypes.length > 0) {
        bookings = bookings.filter((b) => filters.bookingTypes!.includes(b.BookingType));
      }

      if (filters?.statuses && filters.statuses.length > 0) {
        bookings = bookings.filter((b) => filters.statuses!.includes(b.Status));
      }

      if (filters?.premiumOnly) {
        bookings = bookings.filter((b) => b.IsPremiumClient === true);
      }

      if (filters?.accountManagers && filters.accountManagers.length > 0) {
        bookings = bookings.filter((b) =>
          filters.accountManagers!.includes(b.AccountManagerEmail)
        );
      }

      // Sort by Created descending
      bookings.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

      return bookings;
    } catch (error) {
      this.handleError(error, 'Failed to fetch bookings for dashboard');
      throw error;
    }
  }

  // Calculate all dashboard metrics from bookings
  calculateDashboardData(bookings: Booking[]): DashboardData {
    const kpis = this.calculateKPIs(bookings);
    const statusBreakdown = this.calculateStatusBreakdown(bookings);
    const typeDistribution = this.calculateTypeDistribution(bookings);
    const trends = this.calculateTrends(bookings);
    const accountManagerMetrics = this.calculateAccountManagerMetrics(bookings);
    const clientMetrics = this.calculateClientMetrics(bookings);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = startOfMonth(now);

    const recentBookings = bookings.filter((b) => {
      const created = parseISO(b.Created);
      return created >= sevenDaysAgo;
    }).length;

    const bookingsThisMonth = bookings.filter((b) => {
      const created = parseISO(b.Created);
      return created >= startOfThisMonth;
    }).length;

    return {
      kpis,
      statusBreakdown,
      typeDistribution,
      trends,
      accountManagerMetrics,
      clientMetrics,
      recentBookings,
      bookingsThisMonth,
    };
  }

  private calculateKPIs(bookings: Booking[]): DashboardKPIs {
    // Exclude soft-deleted bookings from KPI calculations
    bookings = bookings.filter((b) => b.Status !== 'Deleted');
    const total = bookings.length;
    const pending = bookings.filter(
      (b) => b.Status === 'Pending Review' || b.Status === 'Awaiting Approval'
    ).length;
    const confirmed = bookings.filter((b) => b.Status === 'Confirmed').length;
    const cancelled = bookings.filter((b) => b.Status === 'Cancelled').length;
    const totalLicenses = bookings.reduce((sum, b) => sum + (b.LicenseCount || 0), 0);
    const premiumClients = new Set(
      bookings.filter((b) => b.IsPremiumClient).map((b) => b.ClientName)
    ).size;
    const conversionRate = total > 0 ? (confirmed / total) * 100 : 0;

    // Calculate average time to confirmation
    const confirmedBookings = bookings.filter(
      (b) => b.Status === 'Confirmed' && b.ConfirmedDateTime
    );
    let avgTimeToConfirmation = 0;
    if (confirmedBookings.length > 0) {
      const totalDays = confirmedBookings.reduce((sum, b) => {
        const created = parseISO(b.Created);
        const confirmed = parseISO(b.ConfirmedDateTime!);
        return sum + differenceInDays(confirmed, created);
      }, 0);
      avgTimeToConfirmation = totalDays / confirmedBookings.length;
    }

    return {
      totalBookings: total,
      pendingBookings: pending,
      confirmedBookings: confirmed,
      cancelledBookings: cancelled,
      totalLicenses,
      premiumClients,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgTimeToConfirmation: Math.round(avgTimeToConfirmation * 10) / 10,
    };
  }

  private calculateStatusBreakdown(bookings: Booking[]): StatusBreakdown[] {
    const total = bookings.length;
    const statusCounts: Record<BookingStatus, number> = {
      'Pending Review': 0,
      'Awaiting Approval': 0,
      'Confirmed': 0,
      'Cancelled': 0,
      'Rescheduling Required': 0,
      'Deleted': 0,
    };

    bookings.forEach((b) => {
      if (statusCounts[b.Status] !== undefined) {
        statusCounts[b.Status]++;
      }
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: status as BookingStatus,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }));
  }

  private calculateTypeDistribution(bookings: Booking[]): TypeDistribution[] {
    const total = bookings.length;
    const demos = bookings.filter((b) => b.BookingType === 'Demo').length;
    const deployments = bookings.filter((b) => b.BookingType === 'Deployment').length;

    return [
      {
        type: 'Demo',
        count: demos,
        percentage: total > 0 ? Math.round((demos / total) * 1000) / 10 : 0,
      },
      {
        type: 'Deployment',
        count: deployments,
        percentage: total > 0 ? Math.round((deployments / total) * 1000) / 10 : 0,
      },
    ];
  }

  private calculateTrends(bookings: Booking[]): TrendDataPoint[] {
    // Group by month
    const monthlyData: Record<
      string,
      { bookings: number; licenses: number; demos: number; deployments: number }
    > = {};

    bookings.forEach((b) => {
      const monthKey = format(parseISO(b.Created), 'yyyy-MM');
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { bookings: 0, licenses: 0, demos: 0, deployments: 0 };
      }
      monthlyData[monthKey].bookings++;
      monthlyData[monthKey].licenses += b.LicenseCount || 0;
      if (b.BookingType === 'Demo') {
        monthlyData[monthKey].demos++;
      } else {
        monthlyData[monthKey].deployments++;
      }
    });

    // Sort by date and return
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        ...data,
      }));
  }

  private calculateAccountManagerMetrics(bookings: Booking[]): AccountManagerMetrics[] {
    const managerMap: Record<string, Booking[]> = {};

    bookings.forEach((b) => {
      const key = b.AccountManagerEmail;
      if (!managerMap[key]) {
        managerMap[key] = [];
      }
      managerMap[key].push(b);
    });

    return Object.entries(managerMap)
      .map(([email, managerBookings]) => {
        const total = managerBookings.length;
        const confirmed = managerBookings.filter((b) => b.Status === 'Confirmed').length;
        const pending = managerBookings.filter(
          (b) => b.Status === 'Pending Review' || b.Status === 'Awaiting Approval'
        ).length;
        const cancelled = managerBookings.filter((b) => b.Status === 'Cancelled').length;
        const totalLicenses = managerBookings.reduce((sum, b) => sum + (b.LicenseCount || 0), 0);

        return {
          name: managerBookings[0].AccountManagerName,
          email,
          totalBookings: total,
          confirmedBookings: confirmed,
          pendingBookings: pending,
          cancelledBookings: cancelled,
          totalLicenses,
          conversionRate: total > 0 ? Math.round((confirmed / total) * 1000) / 10 : 0,
          avgLicensesPerBooking: total > 0 ? Math.round((totalLicenses / total) * 10) / 10 : 0,
        };
      })
      .sort((a, b) => b.totalBookings - a.totalBookings);
  }

  private calculateClientMetrics(bookings: Booking[]): ClientMetrics[] {
    const clientMap: Record<string, Booking[]> = {};

    bookings.forEach((b) => {
      const key = b.ClientName;
      if (!clientMap[key]) {
        clientMap[key] = [];
      }
      clientMap[key].push(b);
    });

    return Object.entries(clientMap)
      .map(([clientName, clientBookings]) => {
        const demos = clientBookings.filter((b) => b.BookingType === 'Demo').length;
        const deployments = clientBookings.filter((b) => b.BookingType === 'Deployment').length;
        const totalLicenses = clientBookings.reduce((sum, b) => sum + (b.LicenseCount || 0), 0);
        const isPremium = clientBookings.some((b) => b.IsPremiumClient);

        // Find most recent booking
        const sortedBookings = [...clientBookings].sort(
          (a, b) => parseISO(b.Created).getTime() - parseISO(a.Created).getTime()
        );
        const lastBooking = sortedBookings[0];

        return {
          clientName,
          totalBookings: clientBookings.length,
          demos,
          deployments,
          totalLicenses,
          isPremium,
          lastBookingDate: lastBooking.Created,
          accountManager: lastBooking.AccountManagerName,
        };
      })
      .sort((a, b) => b.totalBookings - a.totalBookings);
  }

  // Get unique account managers for filter dropdown
  getUniqueAccountManagers(bookings: Booking[]): { name: string; email: string }[] {
    const managerMap = new Map<string, string>();
    bookings.forEach((b) => {
      if (!managerMap.has(b.AccountManagerEmail)) {
        managerMap.set(b.AccountManagerEmail, b.AccountManagerName);
      }
    });
    return Array.from(managerMap.entries())
      .map(([email, name]) => ({ email, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private transformGraphItem(item: GraphListItem): Booking {
    const fields = item.fields || {};
    return {
      Id: parseInt(item.id) || parseInt(fields.id || '0'),
      Title: fields.Title || '',
      AccountManagerName: fields.AccountManagerName || '',
      AccountManagerEmail: fields.AccountManagerEmail || '',
      ClientName: fields.ClientName || '',
      BookingType: (fields.BookingType as 'Demo' | 'Deployment') || 'Demo',
      LicenseCount: fields.LicenseCount || 0,
      ProposedSlot1: fields.ProposedSlot1 || '',
      ProposedSlot2: fields.ProposedSlot2 || '',
      ProposedSlot3: fields.ProposedSlot3 || '',
      ConfirmedDateTime: fields.ConfirmedDateTime,
      Comments: fields.Comments,
      IsPremiumClient: fields.IsPremiumClient || false,
      Status: (fields.Status as Booking['Status']) || 'Pending Review',
      Outcome: fields.Outcome,
      NextSteps: fields.NextSteps,
      CalendarEventId: fields.CalendarEventId,
      Created: fields.Created || new Date().toISOString(),
      CreatedBy: {
        Title: fields.AccountManagerName || '',
        Email: fields.AccountManagerEmail || '',
      },
      ChecklistData: fields.ChecklistData,
      ChecklistComplete: fields.ChecklistComplete,
      ChecklistDueDate: fields.ChecklistDueDate,
      DealSize: fields.DealSize,
      DealValue: fields.DealValue,
      Priority: fields.Priority as Booking['Priority'],
    };
  }

  private handleError(error: unknown, message: string): void {
    console.error(message, error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error('You do not have permission to access dashboard data');
      } else if (errorMessage.includes('404')) {
        throw new Error('Dashboard data not found');
      } else if (errorMessage.includes('429')) {
        throw new Error('Too many requests. Please try again later');
      }
    }

    throw new Error(message);
  }
}

export const dashboardService = new DashboardService();
