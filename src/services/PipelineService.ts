/**
 * DWx Traffic Manager - Pipeline Service
 * Calculates sales funnel metrics and analytics for the dashboard
 */

import {
  ServiceRequest,
  PipelineMetrics,
  StageBreakdown,
  WinRateData,
  ConversionRates,
  ForecastData,
  FunnelStage,
  STAGE_METADATA,
} from '../types/ServiceRequest';

class PipelineService {
  /**
   * Calculate comprehensive pipeline metrics
   */
  calculatePipelineMetrics(requests: ServiceRequest[]): PipelineMetrics {
    // Filter to open deals (not Won or Lost)
    const openDeals = requests.filter(
      r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
    );

    // Total pipeline value (unweighted)
    const totalPipelineValue = openDeals.reduce(
      (sum, r) => sum + (r.DealValue || 0),
      0
    );

    // Weighted pipeline value
    const weightedPipelineValue = openDeals.reduce(
      (sum, r) => sum + (r.WeightedPipeline || (r.DealValue || 0) * ((r.DealProbability || 50) / 100)),
      0
    );

    // Stage breakdown
    const stageBreakdown = this.calculateStageBreakdown(requests);

    // Average deal size (from all deals with value)
    const dealsWithValue = requests.filter(r => r.DealValue && r.DealValue > 0);
    const averageDealSize = dealsWithValue.length > 0
      ? dealsWithValue.reduce((sum, r) => sum + (r.DealValue || 0), 0) / dealsWithValue.length
      : 0;

    // Average probability
    const dealsWithProbability = openDeals.filter(r => r.DealProbability !== undefined);
    const averageDealProbability = dealsWithProbability.length > 0
      ? dealsWithProbability.reduce((sum, r) => sum + (r.DealProbability || 0), 0) / dealsWithProbability.length
      : 50;

    // Forecasted revenue (weighted pipeline for deals expected to close by end of this month, including overdue)
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const forecastedRevenue = openDeals
      .filter(r => {
        if (!r.ExpectedCloseDate) return false;
        const closeDate = new Date(r.ExpectedCloseDate);
        return closeDate <= endOfMonth;
      })
      .reduce(
        (sum, r) => sum + (r.WeightedPipeline || (r.DealValue || 0) * ((r.DealProbability || 50) / 100)),
        0
      );

    return {
      totalPipelineValue: Math.round(totalPipelineValue),
      weightedPipelineValue: Math.round(weightedPipelineValue),
      stageBreakdown,
      averageDealSize: Math.round(averageDealSize),
      averageDealProbability: Math.round(averageDealProbability),
      forecastedRevenue: Math.round(forecastedRevenue),
      totalRequests: requests.length,
      openRequests: openDeals.length,
    };
  }

  /**
   * Calculate breakdown by funnel stage
   */
  calculateStageBreakdown(requests: ServiceRequest[]): StageBreakdown[] {
    const stages: FunnelStage[] = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'];

    return stages.map(stage => {
      const stageRequests = requests.filter(r => r.FunnelStage === stage);
      const value = stageRequests.reduce((sum, r) => sum + (r.DealValue || 0), 0);
      const weightedValue = stageRequests.reduce(
        (sum, r) => sum + (r.WeightedPipeline || (r.DealValue || 0) * ((r.DealProbability || 50) / 100)),
        0
      );

      return {
        stage,
        count: stageRequests.length,
        value: Math.round(value),
        weightedValue: Math.round(weightedValue),
      };
    });
  }

  /**
   * Calculate win rate analytics
   */
  calculateWinRates(requests: ServiceRequest[]): WinRateData {
    // Only consider closed deals (Won or Lost)
    const closedDeals = requests.filter(
      r => r.FunnelStage === 'Won' || r.FunnelStage === 'Lost'
    );

    const wonDeals = closedDeals.filter(r => r.FunnelStage === 'Won');

    // Overall win rate
    const overall = closedDeals.length > 0
      ? (wonDeals.length / closedDeals.length) * 100
      : 0;

    // Win rate by service
    const serviceMap = new Map<string, { won: number; total: number }>();
    closedDeals.forEach(r => {
      const service = r.ServiceName || 'Unknown';
      const current = serviceMap.get(service) || { won: 0, total: 0 };
      current.total++;
      if (r.FunnelStage === 'Won') current.won++;
      serviceMap.set(service, current);
    });

    const byService = Array.from(serviceMap.entries()).map(([service, data]) => ({
      service,
      winRate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
      count: data.total,
      won: data.won,
    }));

    // Win rate by AM
    const amMap = new Map<string, { email: string; won: number; total: number }>();
    closedDeals.forEach(r => {
      const am = r.AccountManagerName || 'Unknown';
      const current = amMap.get(am) || { email: r.AccountManagerEmail, won: 0, total: 0 };
      current.total++;
      if (r.FunnelStage === 'Won') current.won++;
      amMap.set(am, current);
    });

    const byAM = Array.from(amMap.entries()).map(([am, data]) => ({
      am,
      email: data.email,
      winRate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
      count: data.total,
      won: data.won,
    }));

    // Win rate trend (by month)
    const monthMap = new Map<string, { won: number; total: number }>();
    closedDeals.forEach(r => {
      const date = new Date(r.Modified || r.Created);
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthMap.get(period) || { won: 0, total: 0 };
      current.total++;
      if (r.FunnelStage === 'Won') current.won++;
      monthMap.set(period, current);
    });

    const trend = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([period, data]) => ({
        period,
        winRate: data.total > 0 ? Math.round((data.won / data.total) * 100) : 0,
        count: data.total,
      }));

    return {
      overall: Math.round(overall),
      byService,
      byAM,
      trend,
    };
  }

  /**
   * Calculate conversion rates between stages
   */
  calculateConversionRates(requests: ServiceRequest[]): ConversionRates {
    // Count deals that have reached or passed each stage
    const reachedStage = (request: ServiceRequest, targetStage: FunnelStage): boolean => {
      const stageOrder: FunnelStage[] = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won'];
      const targetIndex = stageOrder.indexOf(targetStage);

      // Lost deals: use StageTimestamps to determine how far they progressed
      if (request.FunnelStage === 'Lost') {
        if (request.StageTimestamps) {
          // Check if the deal ever entered the target stage
          return !!request.StageTimestamps[targetStage];
        }
        // No timestamps — only count as reaching Lead
        return targetStage === 'Lead';
      }

      const currentIndex = stageOrder.indexOf(request.FunnelStage);
      return currentIndex >= targetIndex;
    };

    // For simplicity, use current stage counts
    const leadCount = requests.filter(r => reachedStage(r, 'Lead')).length;
    const qualifiedCount = requests.filter(r => reachedStage(r, 'Qualified')).length;
    const discoveryCount = requests.filter(r => reachedStage(r, 'Discovery')).length;
    const proposalCount = requests.filter(r => reachedStage(r, 'Proposal')).length;
    const negotiationCount = requests.filter(r => reachedStage(r, 'Negotiation')).length;
    const wonCount = requests.filter(r => r.FunnelStage === 'Won').length;

    return {
      leadToQualified: leadCount > 0 ? Math.round((qualifiedCount / leadCount) * 100) : 0,
      qualifiedToDiscovery: qualifiedCount > 0 ? Math.round((discoveryCount / qualifiedCount) * 100) : 0,
      discoveryToProposal: discoveryCount > 0 ? Math.round((proposalCount / discoveryCount) * 100) : 0,
      proposalToNegotiation: proposalCount > 0 ? Math.round((negotiationCount / proposalCount) * 100) : 0,
      negotiationToWon: negotiationCount > 0 ? Math.round((wonCount / negotiationCount) * 100) : 0,
      overallConversion: leadCount > 0 ? Math.round((wonCount / leadCount) * 100) : 0,
    };
  }

  /**
   * Generate forecast data for upcoming periods
   */
  calculateForecast(requests: ServiceRequest[], months: number = 3): ForecastData[] {
    const now = new Date();
    const forecasts: ForecastData[] = [];

    // Filter to open deals with expected close dates
    const openDeals = requests.filter(
      r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost' && r.ExpectedCloseDate
    );

    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0);
      const period = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

      // Find deals expected to close in this month
      const monthDeals = openDeals.filter(r => {
        const closeDate = new Date(r.ExpectedCloseDate!);
        return closeDate >= monthStart && closeDate <= monthEnd;
      });

      const expected = monthDeals.reduce((sum, r) => sum + (r.DealValue || 0), 0);
      const weighted = monthDeals.reduce(
        (sum, r) => sum + (r.WeightedPipeline || (r.DealValue || 0) * ((r.DealProbability || 50) / 100)),
        0
      );

      // Get actual won revenue for past months
      let actual: number | undefined;
      if (monthEnd < now) {
        const wonThisMonth = requests.filter(r => {
          if (r.FunnelStage !== 'Won') return false;
          const modifiedDate = new Date(r.Modified || r.Created);
          return modifiedDate >= monthStart && modifiedDate <= monthEnd;
        });
        actual = wonThisMonth.reduce((sum, r) => sum + (r.DealValue || 0), 0);
      }

      forecasts.push({
        period,
        expected: Math.round(expected),
        weighted: Math.round(weighted),
        actual: actual !== undefined ? Math.round(actual) : undefined,
        deals: monthDeals.map(d => ({
          id: d.Id,
          client: d.ClientName,
          value: d.DealValue || 0,
          probability: d.DealProbability || 50,
        })),
      });
    }

    return forecasts;
  }

  /**
   * Get interest level breakdown
   */
  calculateInterestBreakdown(requests: ServiceRequest[]): {
    hot: number;
    warm: number;
    cold: number;
    hotValue: number;
    warmValue: number;
    coldValue: number;
  } {
    const openDeals = requests.filter(
      r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
    );

    const hot = openDeals.filter(r => r.InterestLevel === 'Hot');
    const warm = openDeals.filter(r => r.InterestLevel === 'Warm');
    const cold = openDeals.filter(r => r.InterestLevel === 'Cold');

    return {
      hot: hot.length,
      warm: warm.length,
      cold: cold.length,
      hotValue: hot.reduce((sum, r) => sum + (r.DealValue || 0), 0),
      warmValue: warm.reduce((sum, r) => sum + (r.DealValue || 0), 0),
      coldValue: cold.reduce((sum, r) => sum + (r.DealValue || 0), 0),
    };
  }

  /**
   * Calculate average sales cycle duration (days from Lead to Won)
   */
  calculateAverageSalesCycle(requests: ServiceRequest[]): number {
    const wonDeals = requests.filter(r => r.FunnelStage === 'Won');

    if (wonDeals.length === 0) return 0;

    const cycleTimes = wonDeals.map(r => {
      const createdDate = new Date(r.Created);
      const closedDate = new Date(r.Modified || r.Created);
      return (closedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24); // Days
    });

    const totalDays = cycleTimes.reduce((sum, days) => sum + days, 0);
    return Math.round(totalDays / cycleTimes.length);
  }

  /**
   * Get top deals by value
   */
  getTopDeals(requests: ServiceRequest[], limit: number = 10): ServiceRequest[] {
    return requests
      .filter(r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost')
      .sort((a, b) => (b.DealValue || 0) - (a.DealValue || 0))
      .slice(0, limit);
  }

  /**
   * Get deals requiring attention (stale deals, overdue, etc.)
   */
  getDealsRequiringAttention(requests: ServiceRequest[]): {
    stale: ServiceRequest[];
    overdue: ServiceRequest[];
    noActivity: ServiceRequest[];
  } {
    const now = new Date();
    const openDeals = requests.filter(
      r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
    );

    // Stale deals: No update in 14+ days
    const staleDays = 14;
    const stale = openDeals.filter(r => {
      const modified = new Date(r.Modified || r.Created);
      const daysSinceUpdate = (now.getTime() - modified.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate >= staleDays;
    });

    // Overdue: Expected close date has passed
    const overdue = openDeals.filter(r => {
      if (!r.ExpectedCloseDate) return false;
      const closeDate = new Date(r.ExpectedCloseDate);
      return closeDate < now;
    });

    // No activity: In Lead stage for 7+ days
    const noActivityDays = 7;
    const noActivity = openDeals.filter(r => {
      if (r.FunnelStage !== 'Lead') return false;
      const created = new Date(r.Created);
      const daysSinceCreated = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated >= noActivityDays;
    });

    return { stale, overdue, noActivity };
  }

  /**
   * Calculate period-over-period comparison
   * Compares current period metrics to previous period
   */
  calculatePeriodComparison(requests: ServiceRequest[], periodDays: number = 30): {
    currentPeriod: PipelineMetrics;
    previousPeriod: PipelineMetrics;
    changes: {
      pipelineValue: number;
      weightedPipeline: number;
      openRequests: number;
      avgDealSize: number;
    };
  } {
    const now = new Date();
    const currentStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousStart = new Date(currentStart.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Filter requests by creation date
    const currentPeriodRequests = requests.filter(r => {
      const created = new Date(r.Created);
      return created >= currentStart && created <= now;
    });

    const previousPeriodRequests = requests.filter(r => {
      const created = new Date(r.Created);
      return created >= previousStart && created < currentStart;
    });

    const currentMetrics = this.calculatePipelineMetrics(currentPeriodRequests);
    const previousMetrics = this.calculatePipelineMetrics(previousPeriodRequests);

    // Calculate percentage changes
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      currentPeriod: currentMetrics,
      previousPeriod: previousMetrics,
      changes: {
        pipelineValue: calcChange(currentMetrics.totalPipelineValue, previousMetrics.totalPipelineValue),
        weightedPipeline: calcChange(currentMetrics.weightedPipelineValue, previousMetrics.weightedPipelineValue),
        openRequests: calcChange(currentMetrics.openRequests, previousMetrics.openRequests),
        avgDealSize: calcChange(currentMetrics.averageDealSize, previousMetrics.averageDealSize),
      },
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Get stage color from metadata
   */
  getStageColor(stage: FunnelStage): string {
    return STAGE_METADATA[stage]?.color || '#6B7280';
  }

  /**
   * Get stage icon from metadata
   */
  getStageIcon(stage: FunnelStage): string {
    return STAGE_METADATA[stage]?.icon || 'Circle';
  }
}

// Export singleton instance
export const pipelineService = new PipelineService();
