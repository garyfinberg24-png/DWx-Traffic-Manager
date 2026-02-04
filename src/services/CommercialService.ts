import { Booking } from '../types/Booking';
import {
  DEPLOYMENT_FEE,
  DEAL_RATE_PER_LICENSE,
  RevenueEntry,
  RevenueStage,
  CommercialKPIs,
  MonthlyRevenueTrend,
  FunnelStep,
  AMRevenuePerformance,
} from '../types/Commercial';
import { format, subMonths } from 'date-fns';

class CommercialService {
  /**
   * Derive the revenue stage from booking status and type.
   * - Demo bookings that are not yet deployments → 'Pending'
   * - Deployment + Pending/Awaiting → 'Pending'
   * - Deployment + Confirmed → 'Confirmed'
   * - Deployment + Confirmed + has Outcome containing 'convert' → 'Converted'
   */
  private getRevenueStage(booking: Booking): RevenueStage {
    // Check if outcome indicates conversion (any booking type)
    const outcome = (booking.Outcome || '').toLowerCase();
    if (booking.Status === 'Confirmed' && (outcome.includes('convert') || outcome.includes('won') || outcome.includes('signed'))) {
      return 'Converted';
    }

    if (booking.Status === 'Confirmed') {
      return booking.BookingType === 'Deployment' ? 'Deployed' : 'Confirmed';
    }

    return 'Pending';
  }

  /**
   * Calculate deal value from DealSize or LicenseCount (× R90)
   * Falls back to LicenseCount when DealSize is not populated
   */
  private calculateDealValue(booking: Booking): number {
    if (booking.DealSize && booking.DealSize > 0) {
      return booking.DealSize * DEAL_RATE_PER_LICENSE;
    }
    // Fallback: use LicenseCount as deal size estimate
    if (booking.LicenseCount && booking.LicenseCount > 0) {
      return booking.LicenseCount * DEAL_RATE_PER_LICENSE;
    }
    return 0;
  }

  /**
   * Build revenue pipeline entries from bookings.
   * Only includes deployments and demos that have financial relevance.
   */
  calculatePipeline(bookings: Booking[]): RevenueEntry[] {
    return bookings
      .filter((b) => b.Status !== 'Cancelled' && b.Status !== 'Deleted')
      .map((b) => ({
        bookingId: b.Id,
        clientName: b.ClientName,
        isPremium: b.IsPremiumClient,
        bookingType: b.BookingType,
        accountManagerName: b.AccountManagerName,
        accountManagerEmail: b.AccountManagerEmail,
        licenseCount: b.LicenseCount,
        deploymentFee: b.BookingType === 'Deployment' ? DEPLOYMENT_FEE : 0,
        dealValue: this.calculateDealValue(b),
        stage: this.getRevenueStage(b),
        created: b.Created,
        confirmedDate: b.ConfirmedDateTime,
      }))
      .sort((a, b) => {
        // Sort by stage priority, then by value descending
        const stagePriority: Record<RevenueStage, number> = {
          Converted: 0,
          Deployed: 1,
          Confirmed: 2,
          Pending: 3,
        };
        const stageA = stagePriority[a.stage];
        const stageB = stagePriority[b.stage];
        if (stageA !== stageB) return stageA - stageB;
        return (b.deploymentFee + b.dealValue) - (a.deploymentFee + a.dealValue);
      });
  }

  /**
   * Calculate commercial KPIs from bookings.
   */
  calculateKPIs(bookings: Booking[]): CommercialKPIs {
    const activeBookings = bookings.filter((b) => b.Status !== 'Cancelled' && b.Status !== 'Deleted');
    const deployments = activeBookings.filter((b) => b.BookingType === 'Deployment');
    const demos = activeBookings.filter((b) => b.BookingType === 'Demo');
    const confirmedDeployments = deployments.filter((b) => b.Status === 'Confirmed');

    const totalDeploymentRevenue = deployments.length * DEPLOYMENT_FEE;

    // Conversion revenue: deal value for confirmed deployments
    const totalConversionRevenue = confirmedDeployments.reduce(
      (sum, b) => sum + this.calculateDealValue(b),
      0
    );

    // All deal values in pipeline (confirmed or pending)
    const allDealValues = deployments.reduce(
      (sum, b) => sum + this.calculateDealValue(b),
      0
    );

    const totalPipeline = totalDeploymentRevenue + allDealValues;
    const realisedRevenue = (confirmedDeployments.length * DEPLOYMENT_FEE) + totalConversionRevenue;
    const pendingRevenue = totalPipeline - realisedRevenue;

    // Average deal value across deployments that have a deal size
    const deploymentsWithDeal = deployments.filter((b) => b.DealSize && b.DealSize > 0);
    const avgDealValue = deploymentsWithDeal.length > 0
      ? deploymentsWithDeal.reduce((sum, b) => sum + this.calculateDealValue(b), 0) / deploymentsWithDeal.length
      : 0;

    // Conversion rate: % of demos that led to deployments (by same client)
    const deploymentClients = new Set(deployments.map((b) => b.ClientName.toLowerCase()));
    const demoClients = new Set(demos.map((b) => b.ClientName.toLowerCase()));
    const convertedClients = [...demoClients].filter((c) => deploymentClients.has(c));
    const conversionRate = demoClients.size > 0
      ? (convertedClients.length / demoClients.size) * 100
      : 0;

    return {
      totalPipeline,
      realisedRevenue,
      pendingRevenue,
      avgDealValue: Math.round(avgDealValue),
      deploymentCount: deployments.length,
      confirmedDeployments: confirmedDeployments.length,
      totalDeploymentRevenue,
      totalConversionRevenue,
      conversionRate: Math.round(conversionRate),
    };
  }

  /**
   * Calculate monthly revenue trends (last 6 months).
   */
  calculateMonthlyTrends(bookings: Booking[]): MonthlyRevenueTrend[] {
    const activeBookings = bookings.filter((b) => b.Status !== 'Cancelled' && b.Status !== 'Deleted');

    // Group by month
    const monthMap = new Map<string, { deploymentRevenue: number; conversionRevenue: number }>();

    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, 'yyyy-MM');
      monthMap.set(key, { deploymentRevenue: 0, conversionRevenue: 0 });
    }

    for (const b of activeBookings) {
      const dateStr = b.ConfirmedDateTime || b.Created;
      if (!dateStr) continue;
      const month = format(new Date(dateStr), 'yyyy-MM');
      const entry = monthMap.get(month);
      if (!entry) continue;

      if (b.BookingType === 'Deployment') {
        entry.deploymentRevenue += DEPLOYMENT_FEE;
        if (b.Status === 'Confirmed') {
          entry.conversionRevenue += this.calculateDealValue(b);
        }
      }
    }

    return Array.from(monthMap.entries()).map(([month, data]) => ({
      month,
      label: format(new Date(month + '-01'), 'MMM'),
      deploymentRevenue: data.deploymentRevenue,
      conversionRevenue: data.conversionRevenue,
      total: data.deploymentRevenue + data.conversionRevenue,
    }));
  }

  /**
   * Calculate the revenue funnel: Demos → Deployments → Confirmed → Converted.
   */
  calculateFunnel(bookings: Booking[]): FunnelStep[] {
    const activeBookings = bookings.filter((b) => b.Status !== 'Cancelled' && b.Status !== 'Deleted');
    const totalDemos = activeBookings.filter((b) => b.BookingType === 'Demo').length;
    const totalDeployments = activeBookings.filter((b) => b.BookingType === 'Deployment').length;
    const confirmedDeployments = activeBookings.filter(
      (b) => b.BookingType === 'Deployment' && b.Status === 'Confirmed'
    );
    const convertedDeployments = confirmedDeployments.filter((b) => {
      const outcome = (b.Outcome || '').toLowerCase();
      return outcome.includes('convert') || outcome.includes('won') || outcome.includes('signed');
    });

    const totalAll = totalDemos + totalDeployments;
    const base = totalAll || 1;

    return [
      {
        label: 'All Bookings',
        count: totalAll,
        value: 0,
        percentage: 100,
      },
      {
        label: 'Deployments',
        count: totalDeployments,
        value: totalDeployments * DEPLOYMENT_FEE,
        percentage: Math.round((totalDeployments / base) * 100),
      },
      {
        label: 'Confirmed',
        count: confirmedDeployments.length,
        value: confirmedDeployments.length * DEPLOYMENT_FEE,
        percentage: Math.round((confirmedDeployments.length / base) * 100),
      },
      {
        label: 'Converted',
        count: convertedDeployments.length,
        value: convertedDeployments.reduce((sum, b) => sum + this.calculateDealValue(b), 0),
        percentage: Math.round((convertedDeployments.length / base) * 100),
      },
    ];
  }

  /**
   * Calculate per-AM revenue performance.
   */
  calculateAMRevenue(bookings: Booking[]): AMRevenuePerformance[] {
    const activeBookings = bookings.filter((b) => b.Status !== 'Cancelled' && b.Status !== 'Deleted');
    const amMap = new Map<string, AMRevenuePerformance>();

    for (const b of activeBookings) {
      const key = b.AccountManagerEmail.toLowerCase();
      let entry = amMap.get(key);
      if (!entry) {
        entry = {
          name: b.AccountManagerName,
          email: b.AccountManagerEmail,
          deployments: 0,
          deploymentRevenue: 0,
          conversions: 0,
          conversionRevenue: 0,
          totalRevenue: 0,
        };
        amMap.set(key, entry);
      }

      if (b.BookingType === 'Deployment') {
        entry.deployments += 1;
        entry.deploymentRevenue += DEPLOYMENT_FEE;

        if (b.Status === 'Confirmed') {
          const dealVal = this.calculateDealValue(b);
          if (dealVal > 0) {
            entry.conversions += 1;
            entry.conversionRevenue += dealVal;
          }
        }
      }
    }

    // Calculate totals and sort
    return Array.from(amMap.values())
      .map((am) => ({
        ...am,
        totalRevenue: am.deploymentRevenue + am.conversionRevenue,
      }))
      .filter((am) => am.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /**
   * Check if real data has meaningful commercial content.
   * Used to decide whether to supplement with demo data.
   */
  hasSignificantData(bookings: Booking[]): boolean {
    const kpis = this.calculateKPIs(bookings);
    return kpis.totalPipeline > 0 || kpis.deploymentCount > 0;
  }

  /**
   * Generate demonstration data for showcasing the commercial dashboard.
   * Merges real booking pipeline data with synthetic deployment/conversion data.
   */
  getDemoKPIs(bookings: Booking[]): CommercialKPIs {
    const real = this.calculateKPIs(bookings);
    // Supplement with realistic demo numbers
    return {
      totalPipeline: real.totalPipeline + 850_000,
      realisedRevenue: real.realisedRevenue + 520_000,
      pendingRevenue: real.pendingRevenue + 330_000,
      avgDealValue: 45_000,
      deploymentCount: real.deploymentCount + 8,
      confirmedDeployments: real.confirmedDeployments + 5,
      totalDeploymentRevenue: real.totalDeploymentRevenue + 400_000,
      totalConversionRevenue: real.totalConversionRevenue + 120_000,
      conversionRate: 38,
    };
  }

  getDemoPipeline(bookings: Booking[]): RevenueEntry[] {
    const real = this.calculatePipeline(bookings);
    const now = new Date();
    const demoEntries: RevenueEntry[] = [
      {
        bookingId: 9001,
        clientName: 'Nedbank',
        isPremium: true,
        bookingType: 'Deployment',
        accountManagerName: 'Wimpie Baard',
        accountManagerEmail: 'wimpie.baard@firsttech.digital',
        licenseCount: 500,
        deploymentFee: DEPLOYMENT_FEE,
        dealValue: 500 * DEAL_RATE_PER_LICENSE,
        stage: 'Converted' as RevenueStage,
        created: format(subMonths(now, 2), "yyyy-MM-dd'T'HH:mm:ss"),
        confirmedDate: format(subMonths(now, 1), "yyyy-MM-dd'T'HH:mm:ss"),
      },
      {
        bookingId: 9002,
        clientName: 'Ignition Group',
        isPremium: true,
        bookingType: 'Deployment',
        accountManagerName: 'Gary Memory',
        accountManagerEmail: 'gary@firsttech.digital',
        licenseCount: 350,
        deploymentFee: DEPLOYMENT_FEE,
        dealValue: 350 * DEAL_RATE_PER_LICENSE,
        stage: 'Deployed' as RevenueStage,
        created: format(subMonths(now, 1), "yyyy-MM-dd'T'HH:mm:ss"),
        confirmedDate: format(subMonths(now, 0), "yyyy-MM-dd'T'HH:mm:ss"),
      },
      {
        bookingId: 9003,
        clientName: 'Discovery Health',
        isPremium: true,
        bookingType: 'Deployment',
        accountManagerName: 'Wimpie Baard',
        accountManagerEmail: 'wimpie.baard@firsttech.digital',
        licenseCount: 800,
        deploymentFee: DEPLOYMENT_FEE,
        dealValue: 800 * DEAL_RATE_PER_LICENSE,
        stage: 'Confirmed' as RevenueStage,
        created: format(subMonths(now, 1), "yyyy-MM-dd'T'HH:mm:ss"),
        confirmedDate: format(now, "yyyy-MM-dd'T'HH:mm:ss"),
      },
      {
        bookingId: 9004,
        clientName: 'Standard Bank',
        isPremium: false,
        bookingType: 'Deployment',
        accountManagerName: 'Chris Moller',
        accountManagerEmail: 'chris@firsttech.digital',
        licenseCount: 250,
        deploymentFee: DEPLOYMENT_FEE,
        dealValue: 250 * DEAL_RATE_PER_LICENSE,
        stage: 'Pending' as RevenueStage,
        created: format(now, "yyyy-MM-dd'T'HH:mm:ss"),
      },
      {
        bookingId: 9005,
        clientName: 'Sanlam',
        isPremium: true,
        bookingType: 'Deployment',
        accountManagerName: 'Gary Memory',
        accountManagerEmail: 'gary@firsttech.digital',
        licenseCount: 600,
        deploymentFee: DEPLOYMENT_FEE,
        dealValue: 600 * DEAL_RATE_PER_LICENSE,
        stage: 'Converted' as RevenueStage,
        created: format(subMonths(now, 3), "yyyy-MM-dd'T'HH:mm:ss"),
        confirmedDate: format(subMonths(now, 2), "yyyy-MM-dd'T'HH:mm:ss"),
      },
      {
        bookingId: 9006,
        clientName: 'Vodacom',
        isPremium: false,
        bookingType: 'Deployment',
        accountManagerName: 'Chris Moller',
        accountManagerEmail: 'chris@firsttech.digital',
        licenseCount: 150,
        deploymentFee: DEPLOYMENT_FEE,
        dealValue: 150 * DEAL_RATE_PER_LICENSE,
        stage: 'Deployed' as RevenueStage,
        created: format(subMonths(now, 2), "yyyy-MM-dd'T'HH:mm:ss"),
        confirmedDate: format(subMonths(now, 1), "yyyy-MM-dd'T'HH:mm:ss"),
      },
      {
        bookingId: 9007,
        clientName: 'MTN South Africa',
        isPremium: true,
        bookingType: 'Deployment',
        accountManagerName: 'Wimpie Baard',
        accountManagerEmail: 'wimpie.baard@firsttech.digital',
        licenseCount: 1200,
        deploymentFee: DEPLOYMENT_FEE,
        dealValue: 1200 * DEAL_RATE_PER_LICENSE,
        stage: 'Pending' as RevenueStage,
        created: format(now, "yyyy-MM-dd'T'HH:mm:ss"),
      },
      {
        bookingId: 9008,
        clientName: 'Capitec',
        isPremium: false,
        bookingType: 'Deployment',
        accountManagerName: 'Gary Memory',
        accountManagerEmail: 'gary@firsttech.digital',
        licenseCount: 200,
        deploymentFee: DEPLOYMENT_FEE,
        dealValue: 200 * DEAL_RATE_PER_LICENSE,
        stage: 'Confirmed' as RevenueStage,
        created: format(subMonths(now, 1), "yyyy-MM-dd'T'HH:mm:ss"),
        confirmedDate: format(now, "yyyy-MM-dd'T'HH:mm:ss"),
      },
    ];

    // Merge: real pipeline entries first, then demo entries
    const realIds = new Set(real.map((r) => r.bookingId));
    const merged = [...real, ...demoEntries.filter((d) => !realIds.has(d.bookingId))];

    // Sort by stage then value
    const stagePriority: Record<RevenueStage, number> = {
      Converted: 0,
      Deployed: 1,
      Confirmed: 2,
      Pending: 3,
    };
    return merged.sort((a, b) => {
      const sa = stagePriority[a.stage];
      const sb = stagePriority[b.stage];
      if (sa !== sb) return sa - sb;
      return (b.deploymentFee + b.dealValue) - (a.deploymentFee + a.dealValue);
    });
  }

  getDemoTrends(): MonthlyRevenueTrend[] {
    const now = new Date();
    const months: MonthlyRevenueTrend[] = [];
    const deploymentValues = [100_000, 150_000, 100_000, 200_000, 150_000, 250_000];
    const conversionValues = [30_000, 45_000, 60_000, 40_000, 72_000, 108_000];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = format(d, 'yyyy-MM');
      const depRev = deploymentValues[5 - i];
      const conRev = conversionValues[5 - i];
      months.push({
        month: monthKey,
        label: format(d, 'MMM'),
        deploymentRevenue: depRev,
        conversionRevenue: conRev,
        total: depRev + conRev,
      });
    }
    return months;
  }

  getDemoFunnel(): FunnelStep[] {
    return [
      { label: 'All Bookings', count: 24, value: 0, percentage: 100 },
      { label: 'Deployments', count: 8, value: 400_000, percentage: 33 },
      { label: 'Confirmed', count: 5, value: 250_000, percentage: 21 },
      { label: 'Converted', count: 3, value: 153_000, percentage: 13 },
    ];
  }

  getDemoAMRevenue(): AMRevenuePerformance[] {
    return [
      {
        name: 'Wimpie Baard',
        email: 'wimpie.baard@firsttech.digital',
        deployments: 3,
        deploymentRevenue: 150_000,
        conversions: 2,
        conversionRevenue: 117_000,
        totalRevenue: 267_000,
      },
      {
        name: 'Gary Memory',
        email: 'gary@firsttech.digital',
        deployments: 3,
        deploymentRevenue: 150_000,
        conversions: 1,
        conversionRevenue: 54_000,
        totalRevenue: 204_000,
      },
      {
        name: 'Chris Moller',
        email: 'chris@firsttech.digital',
        deployments: 2,
        deploymentRevenue: 100_000,
        conversions: 0,
        conversionRevenue: 0,
        totalRevenue: 100_000,
      },
    ];
  }
}

export const commercialService = new CommercialService();
