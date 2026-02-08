/**
 * DWx Traffic Manager - Reporting Service (v2.15.0)
 *
 * Orchestrates existing services (PipelineService, WinLossAnalysisService)
 * to generate comprehensive reports. Pure client-side, no SharePoint calls.
 */

import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, parseISO, differenceInDays, subMonths } from 'date-fns';
import { ServiceRequest, FunnelStage } from '../types/ServiceRequest';
import {
  DateRangePreset,
  ReportDateRange,
  ReportConfig,
  PipelineReportData,
  PipelineStageBreakdown,
  PipelineConversionRate,
  DealAgingEntry,
  TopDealEntry,
  PipelineForecastEntry,
  AMPerformanceReportData,
  AMLeaderboardEntry,
  AMWinRateEntry,
  AMRevenueEntry,
  AMActivityTrendEntry,
  RevenueReportData,
  RevenueByServiceEntry,
  RevenueByIndustryEntry,
  MonthlyRevenueTrendEntry,
  DealSizeDistributionEntry,
  RevenueForecastEntry,
} from '../types/Report';
import { pipelineService } from './PipelineService';
import { winLossAnalysisService } from './WinLossAnalysisService';

class ReportingService {

  // ─── Date Range Calculation ──────────────────────────────────────

  getDateRange(preset: DateRangePreset, customStart?: Date, customEnd?: Date): ReportDateRange {
    const now = new Date();

    switch (preset) {
      case 'this-month': {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        return { preset, start, end, label: format(start, 'MMMM yyyy') };
      }
      case 'last-month': {
        const lastMonth = subMonths(now, 1);
        const start = startOfMonth(lastMonth);
        const end = endOfMonth(lastMonth);
        return { preset, start, end, label: format(start, 'MMMM yyyy') };
      }
      case 'this-quarter': {
        const start = startOfQuarter(now);
        const end = endOfQuarter(now);
        const q = Math.ceil((now.getMonth() + 1) / 3);
        return { preset, start, end, label: `Q${q} ${now.getFullYear()}` };
      }
      case 'last-quarter': {
        const lastQ = subMonths(now, 3);
        const start = startOfQuarter(lastQ);
        const end = endOfQuarter(lastQ);
        const q = Math.ceil((lastQ.getMonth() + 1) / 3);
        return { preset, start, end, label: `Q${q} ${lastQ.getFullYear()}` };
      }
      case 'ytd': {
        const start = startOfYear(now);
        return { preset, start, end: now, label: `YTD ${now.getFullYear()}` };
      }
      case 'last-12-months': {
        const start = subMonths(now, 12);
        return {
          preset,
          start,
          end: now,
          label: `${format(start, 'MMM yyyy')} - ${format(now, 'MMM yyyy')}`,
        };
      }
      case 'custom': {
        const start = customStart || subMonths(now, 1);
        const end = customEnd || now;
        return {
          preset,
          start,
          end,
          label: `${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`,
        };
      }
      default:
        return { preset: 'this-month', start: startOfMonth(now), end: endOfMonth(now), label: format(now, 'MMMM yyyy') };
    }
  }

  // ─── Filter Requests by Date Range ───────────────────────────────

  filterByDateRange(requests: ServiceRequest[], range: ReportDateRange): ServiceRequest[] {
    return requests.filter(r => {
      const created = new Date(r.Created);
      return created >= range.start && created <= range.end;
    });
  }

  // ─── Pipeline & Funnel Report ────────────────────────────────────

  generatePipelineReport(
    requests: ServiceRequest[],
    range: ReportDateRange,
    userName: string
  ): PipelineReportData {
    const config: ReportConfig = {
      type: 'pipeline',
      dateRange: range,
      generatedAt: new Date(),
      generatedBy: userName,
    };

    const filtered = this.filterByDateRange(requests, range);

    // Overview KPIs
    const metrics = pipelineService.calculatePipelineMetrics(filtered);
    const interest = pipelineService.calculateInterestBreakdown(filtered);

    // Stage breakdown with percentage
    const totalPipeline = metrics.totalPipelineValue || 1;
    const stageBreakdown: PipelineStageBreakdown[] = metrics.stageBreakdown.map(sb => ({
      stage: sb.stage,
      count: sb.count,
      value: sb.value,
      weightedValue: sb.weightedValue,
      percentage: Math.round((sb.value / totalPipeline) * 100),
    }));

    // Conversion rates
    const rates = pipelineService.calculateConversionRates(filtered);
    const conversionRates: PipelineConversionRate[] = [
      { from: 'Lead', to: 'Qualified', rate: rates.leadToQualified, count: 0, total: 0 },
      { from: 'Qualified', to: 'Discovery', rate: rates.qualifiedToDiscovery, count: 0, total: 0 },
      { from: 'Discovery', to: 'Proposal', rate: rates.discoveryToProposal, count: 0, total: 0 },
      { from: 'Proposal', to: 'Negotiation', rate: rates.proposalToNegotiation, count: 0, total: 0 },
      { from: 'Negotiation', to: 'Won', rate: rates.negotiationToWon, count: 0, total: 0 },
      { from: 'Lead', to: 'Won', rate: rates.overallConversion, count: 0, total: 0 },
    ];

    // Deal aging
    const dealAging = this.calculateDealAging(filtered);

    // Forecast
    const forecastData = pipelineService.calculateForecast(filtered, 3);
    const forecast: PipelineForecastEntry[] = forecastData.map(f => {
      let label = f.period;
      try {
        label = format(parseISO(`${f.period}-01`), 'MMM yyyy');
      } catch { /* keep raw */ }
      return { period: label, expected: f.expected, weighted: f.weighted };
    });

    // Top deals
    const topRaw = pipelineService.getTopDeals(filtered, 10);
    const topDeals: TopDealEntry[] = topRaw.map(r => ({
      id: r.Id,
      client: r.ClientName,
      service: r.ServiceName,
      value: r.DealValue || 0,
      stage: r.FunnelStage,
      daysInPipeline: differenceInDays(new Date(), new Date(r.Created)),
      probability: r.DealProbability || 50,
    }));

    return {
      config,
      overview: {
        totalPipeline: metrics.totalPipelineValue,
        weightedPipeline: metrics.weightedPipelineValue,
        avgDealSize: metrics.averageDealSize,
        hotLeads: interest.hot,
        openDeals: metrics.openRequests,
      },
      stageBreakdown,
      conversionRates,
      dealAging,
      forecast,
      topDeals,
    };
  }

  // ─── AM Performance Report ───────────────────────────────────────

  generateAMReport(
    requests: ServiceRequest[],
    range: ReportDateRange,
    userName: string
  ): AMPerformanceReportData {
    const config: ReportConfig = {
      type: 'am-performance',
      dateRange: range,
      generatedAt: new Date(),
      generatedBy: userName,
    };

    const filtered = this.filterByDateRange(requests, range);

    // Group all requests by AM
    const amGroups = this.groupBy(filtered, r => r.AccountManagerEmail);

    // Build leaderboard
    const leaderboard: AMLeaderboardEntry[] = Object.entries(amGroups).map(([email, deals]) => {
      const won = deals.filter(r => r.FunnelStage === 'Won');
      const lost = deals.filter(r => r.FunnelStage === 'Lost');
      const open = deals.filter(r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost');
      const closed = won.length + lost.length;
      const totalRevenue = won.reduce((sum, r) => sum + (r.DealValue || 0), 0);

      // Average cycle time for won deals
      const cycleTimes = won.map(r => {
        try {
          const created = parseISO(r.Created);
          const closed = r.Modified ? parseISO(r.Modified) : created;
          return differenceInDays(closed, created);
        } catch { return 0; }
      });
      const avgCycle = cycleTimes.length > 0
        ? Math.round(cycleTimes.reduce((s, d) => s + d, 0) / cycleTimes.length)
        : 0;

      return {
        rank: 0,
        name: deals[0]?.AccountManagerName || email,
        email,
        totalDeals: deals.length,
        wonDeals: won.length,
        lostDeals: lost.length,
        openDeals: open.length,
        winRate: closed > 0 ? Math.round((won.length / closed) * 100) : 0,
        totalRevenue,
        avgDealSize: won.length > 0 ? Math.round(totalRevenue / won.length) : 0,
        avgCycleDays: avgCycle,
      };
    });

    // Sort by revenue and assign rank
    leaderboard.sort((a, b) => b.totalRevenue - a.totalRevenue);
    leaderboard.forEach((entry, i) => { entry.rank = i + 1; });

    // Win rate by AM
    const winRateByAM: AMWinRateEntry[] = leaderboard.map(e => ({
      name: e.name,
      winRate: e.winRate,
      totalDeals: e.totalDeals,
    })).sort((a, b) => b.winRate - a.winRate);

    // Revenue by AM
    const revenueByAM: AMRevenueEntry[] = leaderboard.map(e => ({
      name: e.name,
      revenue: e.totalRevenue,
    })).sort((a, b) => b.revenue - a.revenue);

    // Activity trend (monthly: created / won / lost)
    const activityTrend = this.calculateActivityTrend(filtered);

    // Summary KPIs
    const totalAMs = leaderboard.length;
    const avgWinRate = totalAMs > 0
      ? Math.round(leaderboard.reduce((s, e) => s + e.winRate, 0) / totalAMs)
      : 0;
    const totalRevenue = leaderboard.reduce((s, e) => s + e.totalRevenue, 0);
    const avgCycleTime = totalAMs > 0
      ? Math.round(leaderboard.reduce((s, e) => s + e.avgCycleDays, 0) / totalAMs)
      : 0;

    return {
      config,
      summary: { totalAMs, avgWinRate, totalRevenue, avgCycleTime },
      leaderboard,
      winRateByAM,
      revenueByAM,
      activityTrend,
    };
  }

  // ─── Revenue & Commercial Report ─────────────────────────────────

  generateRevenueReport(
    requests: ServiceRequest[],
    range: ReportDateRange,
    userName: string
  ): RevenueReportData {
    const config: ReportConfig = {
      type: 'revenue',
      dateRange: range,
      generatedAt: new Date(),
      generatedBy: userName,
    };

    const filtered = this.filterByDateRange(requests, range);
    const overallMetrics = winLossAnalysisService.calculateOverallMetrics(filtered);
    const pipelineMetrics = pipelineService.calculatePipelineMetrics(filtered);

    // Revenue by service
    const serviceAnalysis = winLossAnalysisService.analyzeByService(filtered);
    const revenueByService: RevenueByServiceEntry[] = serviceAnalysis.map(s => ({
      service: s.serviceName,
      revenue: s.totalWonRevenue,
      dealCount: s.wonCount,
    }));

    // Revenue by industry
    const industryAnalysis = winLossAnalysisService.analyzeByIndustry(filtered);
    const totalIndustryRevenue = industryAnalysis.reduce((s, i) => s + i.totalWonRevenue, 0) || 1;
    const revenueByIndustry: RevenueByIndustryEntry[] = industryAnalysis.map(i => ({
      industry: i.industry,
      revenue: i.totalWonRevenue,
      dealCount: i.wonCount,
      percentage: Math.round((i.totalWonRevenue / totalIndustryRevenue) * 100),
    }));

    // Monthly revenue trends
    const trends = winLossAnalysisService.analyzeTrends(filtered);
    const monthlyTrends: MonthlyRevenueTrendEntry[] = trends.map(t => ({
      period: t.periodLabel,
      revenue: t.wonRevenue,
      dealCount: t.wonCount,
    }));

    // Deal size distribution
    const buckets = winLossAnalysisService.analyzeByDealSize(filtered);
    const dealSizeDistribution: DealSizeDistributionEntry[] = buckets.map(b => ({
      label: b.label,
      min: b.min,
      max: b.max,
      wonCount: b.wonCount,
      lostCount: b.lostCount,
      wonRevenue: filtered
        .filter(r => r.FunnelStage === 'Won' && (r.DealValue || 0) > b.min && (r.DealValue || 0) <= b.max)
        .reduce((sum, r) => sum + (r.DealValue || 0), 0),
    }));

    // Revenue forecast
    const forecastData = pipelineService.calculateForecast(filtered, 3);
    const forecast: RevenueForecastEntry[] = forecastData.map(f => {
      let label = f.period;
      try {
        label = format(parseISO(`${f.period}-01`), 'MMM yyyy');
      } catch { /* keep raw */ }
      return { period: label, forecasted: f.weighted, actual: f.actual };
    });

    return {
      config,
      overview: {
        totalWonRevenue: overallMetrics.totalWonRevenue,
        activePipeline: pipelineMetrics.totalPipelineValue,
        avgDealSize: overallMetrics.avgWonDealSize,
        winRate: overallMetrics.winRate,
        forecastedRevenue: pipelineMetrics.forecastedRevenue,
      },
      revenueByService,
      revenueByIndustry,
      monthlyTrends,
      dealSizeDistribution,
      forecast,
    };
  }

  // ─── Private Helpers ─────────────────────────────────────────────

  private calculateDealAging(requests: ServiceRequest[]): DealAgingEntry[] {
    const activeStages: FunnelStage[] = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation'];
    const now = new Date();

    return activeStages.map(stage => {
      const stageDeals = requests.filter(r => r.FunnelStage === stage);
      if (stageDeals.length === 0) {
        return { stage, avgDays: 0, minDays: 0, maxDays: 0, dealCount: 0 };
      }

      const days = stageDeals.map(r => {
        // Use StageTimestamps if available for accurate stage entry time
        const stageTimestamps = (r as any).StageTimestamps_JSON;
        let entryDate: Date;
        if (stageTimestamps) {
          try {
            const timestamps = typeof stageTimestamps === 'string' ? JSON.parse(stageTimestamps) : stageTimestamps;
            entryDate = timestamps[stage] ? new Date(timestamps[stage]) : new Date(r.Created);
          } catch {
            entryDate = new Date(r.Created);
          }
        } else {
          entryDate = new Date(r.Created);
        }
        return Math.max(0, differenceInDays(now, entryDate));
      });

      return {
        stage,
        avgDays: Math.round(days.reduce((s, d) => s + d, 0) / days.length),
        minDays: Math.min(...days),
        maxDays: Math.max(...days),
        dealCount: stageDeals.length,
      };
    });
  }

  private calculateActivityTrend(requests: ServiceRequest[]): AMActivityTrendEntry[] {
    const monthGroups = this.groupBy(requests, r => {
      try {
        return format(parseISO(r.Created), 'yyyy-MM');
      } catch { return 'Unknown'; }
    });
    delete monthGroups['Unknown'];

    return Object.entries(monthGroups)
      .map(([period, deals]) => {
        let label = period;
        try { label = format(parseISO(`${period}-01`), 'MMM yyyy'); } catch { /* keep */ }
        return {
          period: label,
          created: deals.length,
          won: deals.filter(r => r.FunnelStage === 'Won').length,
          lost: deals.filter(r => r.FunnelStage === 'Lost').length,
        };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }

  // ─── Currency Formatting ─────────────────────────────────────────

  formatZAR(value: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}

export const reportingService = new ReportingService();
