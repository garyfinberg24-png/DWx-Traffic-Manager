/**
 * DWx Traffic Manager - Win/Loss Analysis Service
 *
 * Pure client-side calculation service. All methods take ServiceRequest[]
 * and return analysis results. No SharePoint calls.
 */

import { format, differenceInDays, parseISO } from 'date-fns';
import { ServiceRequest } from '../types/ServiceRequest';
import {
  WinLossOverviewMetrics,
  ServiceWinLoss,
  AMWinLoss,
  IndustryWinLoss,
  WinLossReasons,
  WinLossReasonEntry,
  MonthlyWinLoss,
  DealSizeBucket,
} from '../types/WinLossAnalysis';

class WinLossAnalysisService {

  // ─── Overall Metrics ─────────────────────────────────────────────

  calculateOverallMetrics(requests: ServiceRequest[]): WinLossOverviewMetrics {
    const closed = this.getClosedDeals(requests);
    const won = closed.filter(r => r.FunnelStage === 'Won');
    const lost = closed.filter(r => r.FunnelStage === 'Lost');

    const totalWonRevenue = won.reduce((sum, r) => sum + (r.DealValue || 0), 0);
    const totalLostRevenue = lost.reduce((sum, r) => sum + (r.DealValue || 0), 0);

    return {
      totalClosed: closed.length,
      totalWon: won.length,
      totalLost: lost.length,
      winRate: closed.length > 0 ? (won.length / closed.length) * 100 : 0,
      avgWonDealSize: won.length > 0 ? totalWonRevenue / won.length : 0,
      avgLostDealSize: lost.length > 0 ? totalLostRevenue / lost.length : 0,
      totalWonRevenue,
      avgSalesCycleWon: this.avgSalesCycle(won),
      avgSalesCycleLost: this.avgSalesCycle(lost),
    };
  }

  // ─── By Service ──────────────────────────────────────────────────

  analyzeByService(requests: ServiceRequest[]): ServiceWinLoss[] {
    const closed = this.getClosedDeals(requests);
    const groups = this.groupBy(closed, r => r.ServiceName);

    const results: ServiceWinLoss[] = Object.entries(groups).map(([serviceName, deals]) => {
      const won = deals.filter(r => r.FunnelStage === 'Won');
      const lost = deals.filter(r => r.FunnelStage === 'Lost');
      const totalWonRevenue = won.reduce((sum, r) => sum + (r.DealValue || 0), 0);

      return {
        serviceName,
        wonCount: won.length,
        lostCount: lost.length,
        winRate: deals.length > 0 ? (won.length / deals.length) * 100 : 0,
        totalWonRevenue,
      };
    });

    return results.sort((a, b) => b.totalWonRevenue - a.totalWonRevenue);
  }

  // ─── By Account Manager ──────────────────────────────────────────

  analyzeByAM(requests: ServiceRequest[]): AMWinLoss[] {
    const closed = this.getClosedDeals(requests);
    const groups = this.groupBy(closed, r => r.AccountManagerEmail);

    const results: AMWinLoss[] = Object.entries(groups).map(([amEmail, deals]) => {
      const won = deals.filter(r => r.FunnelStage === 'Won');
      const lost = deals.filter(r => r.FunnelStage === 'Lost');
      const totalWonRevenue = won.reduce((sum, r) => sum + (r.DealValue || 0), 0);
      // Use the name from the first deal in the group
      const amName = deals[0]?.AccountManagerName || amEmail;

      return {
        amName,
        amEmail,
        wonCount: won.length,
        lostCount: lost.length,
        winRate: deals.length > 0 ? (won.length / deals.length) * 100 : 0,
        totalWonRevenue,
      };
    });

    return results.sort((a, b) => b.totalWonRevenue - a.totalWonRevenue);
  }

  // ─── By Industry ─────────────────────────────────────────────────

  analyzeByIndustry(requests: ServiceRequest[]): IndustryWinLoss[] {
    const closed = this.getClosedDeals(requests);
    const groups = this.groupBy(closed, r => r.ClientIndustry || r.Industry || 'Unknown');

    const results: IndustryWinLoss[] = Object.entries(groups).map(([industry, deals]) => {
      const won = deals.filter(r => r.FunnelStage === 'Won');
      const lost = deals.filter(r => r.FunnelStage === 'Lost');
      const totalWonRevenue = won.reduce((sum, r) => sum + (r.DealValue || 0), 0);

      return {
        industry,
        wonCount: won.length,
        lostCount: lost.length,
        winRate: deals.length > 0 ? (won.length / deals.length) * 100 : 0,
        totalWonRevenue,
      };
    });

    return results.sort((a, b) => b.totalWonRevenue - a.totalWonRevenue);
  }

  // ─── Reasons ─────────────────────────────────────────────────────

  analyzeReasons(requests: ServiceRequest[]): WinLossReasons {
    const closed = this.getClosedDeals(requests);
    const won = closed.filter(r => r.FunnelStage === 'Won');
    const lost = closed.filter(r => r.FunnelStage === 'Lost');

    const topWinReasons = this.countReasons(won, 5);
    const topLossReasons = this.countReasons(lost, 5);

    return { topWinReasons, topLossReasons };
  }

  // ─── Monthly Trends ──────────────────────────────────────────────

  analyzeTrends(requests: ServiceRequest[]): MonthlyWinLoss[] {
    const closed = this.getClosedDeals(requests);
    if (closed.length === 0) return [];

    const groups = this.groupBy(closed, r => {
      const dateStr = r.Modified || r.Created;
      try {
        const date = parseISO(dateStr);
        return format(date, 'yyyy-MM');
      } catch {
        return 'Unknown';
      }
    });

    // Remove any deals with unparseable dates
    delete groups['Unknown'];

    const results: MonthlyWinLoss[] = Object.entries(groups).map(([period, deals]) => {
      const won = deals.filter(r => r.FunnelStage === 'Won');
      const lost = deals.filter(r => r.FunnelStage === 'Lost');
      const wonRevenue = won.reduce((sum, r) => sum + (r.DealValue || 0), 0);

      // Build a readable label from the period string
      let periodLabel = period;
      try {
        const date = parseISO(`${period}-01`);
        periodLabel = format(date, 'MMM yyyy');
      } catch {
        // keep raw period as label
      }

      return {
        period,
        periodLabel,
        wonCount: won.length,
        lostCount: lost.length,
        winRate: deals.length > 0 ? (won.length / deals.length) * 100 : 0,
        wonRevenue,
      };
    });

    return results.sort((a, b) => a.period.localeCompare(b.period));
  }

  // ─── Deal Size Buckets ───────────────────────────────────────────

  analyzeByDealSize(requests: ServiceRequest[]): DealSizeBucket[] {
    const closed = this.getClosedDeals(requests).filter(r => (r.DealValue || 0) > 0);

    const buckets: { label: string; min: number; max: number }[] = [
      { label: 'R0-50K', min: 0, max: 50000 },
      { label: 'R50-100K', min: 50000, max: 100000 },
      { label: 'R100-250K', min: 100000, max: 250000 },
      { label: 'R250-500K', min: 250000, max: 500000 },
      { label: 'R500K+', min: 500000, max: Infinity },
    ];

    return buckets.map(bucket => {
      const inBucket = closed.filter(r => {
        const val = r.DealValue || 0;
        return val > bucket.min && val <= bucket.max;
      });
      // Special case: first bucket includes deals exactly equal to min (0)
      // Since we already filter DealValue > 0, the lower bound check (val > bucket.min)
      // naturally excludes 0 for the first bucket. Adjust first bucket to include val === 0
      // Actually, we already filtered out DealValue <= 0 above, so min boundary
      // for first bucket (0) works correctly with > 0.
      // Re-check: first bucket is 0-50K. A deal with value 1 should be in it.
      // val > 0 (bucket.min) => true. val <= 50000 => true. Correct.
      // A deal with value 50000 should be in R0-50K (val > 0 && val <= 50000). Correct.
      // A deal with value 50001 should be in R50-100K (val > 50000 && val <= 100000). Correct.

      const won = inBucket.filter(r => r.FunnelStage === 'Won');
      const lost = inBucket.filter(r => r.FunnelStage === 'Lost');

      return {
        label: bucket.label,
        min: bucket.min,
        max: bucket.max,
        wonCount: won.length,
        lostCount: lost.length,
        winRate: inBucket.length > 0 ? (won.length / inBucket.length) * 100 : 0,
      };
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────────

  private getClosedDeals(requests: ServiceRequest[]): ServiceRequest[] {
    return requests.filter(r => r.FunnelStage === 'Won' || r.FunnelStage === 'Lost');
  }

  private avgSalesCycle(deals: ServiceRequest[]): number {
    if (deals.length === 0) return 0;

    const cycles = deals
      .map(r => {
        try {
          const created = parseISO(r.Created);
          const closed = r.Modified ? parseISO(r.Modified) : created;
          return differenceInDays(closed, created);
        } catch {
          return null;
        }
      })
      .filter((d): d is number => d !== null && d >= 0);

    if (cycles.length === 0) return 0;
    return cycles.reduce((sum, d) => sum + d, 0) / cycles.length;
  }

  private countReasons(deals: ServiceRequest[], topN: number): WinLossReasonEntry[] {
    const withReason = deals.filter(r => r.WinLossReason && r.WinLossReason.trim() !== '');
    if (withReason.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const deal of withReason) {
      const reason = deal.WinLossReason!.trim();
      counts[reason] = (counts[reason] || 0) + 1;
    }

    const total = withReason.length;

    return Object.entries(counts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
  }

  private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    }
    return groups;
  }
}

export const winLossAnalysisService = new WinLossAnalysisService();
