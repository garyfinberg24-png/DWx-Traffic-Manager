/**
 * Delivery Analytics Service
 * Computes delivery KPIs, cycle time trends, CSAT analytics,
 * and service category metrics from delivery handover data.
 * v2.17.0
 */

import { differenceInCalendarDays, format, parseISO, subMonths, startOfMonth } from 'date-fns';
import { deliveryHandoverService } from './DeliveryHandoverService';
import { getGraphService } from './serviceFactory';
import { config } from '../config/environmentConfig';
import type { DeliveryHandover } from '../types/DeliveryHandover';
import type {
  DeliveryKPIs,
  DeliveryCycleTrend,
  ServiceCategoryMetrics,
  CSATDistributionEntry,
  RecentCSATFeedback,
  DeliveryAnalyticsData,
  CSATEntry,
} from '../types/DeliveryAnalytics';
import { serializeCSAT } from '../types/DeliveryAnalytics';


class DeliveryAnalyticsService {

  // ==================== HELPER ====================

  /**
   * Get CSAT from a handover record.
   * The CSAT field is being added to the DeliveryHandover interface;
   * access it loosely until the type is updated.
   */
  private getCSAT(handover: DeliveryHandover): CSATEntry | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (handover as any).CSAT as CSATEntry | null ?? null;
  }

  /**
   * Compute days from WonDate to completion for a closed handover
   */
  private getCycleTimeDays(handover: DeliveryHandover): number | null {
    if (handover.HandoverStatus !== 'Closed') return null;
    const endDate = handover.HandoverCompletedDate || handover.Modified;
    if (!endDate || !handover.WonDate) return null;
    try {
      return differenceInCalendarDays(parseISO(endDate), parseISO(handover.WonDate));
    } catch {
      return null;
    }
  }

  /**
   * Compute checklist completion percentage for a single handover (0-100)
   */
  private getChecklistCompletion(handover: DeliveryHandover): number | null {
    const checklist = handover.HandoverChecklist;
    if (!checklist || checklist.length === 0) return null;
    const completed = checklist.filter(item => item.isCompleted).length;
    return Math.round((completed / checklist.length) * 100);
  }

  // ==================== KPIs ====================

  /**
   * Calculate aggregate delivery KPIs across all handovers
   */
  async calculateDeliveryKPIs(): Promise<DeliveryKPIs> {
    const handovers = await deliveryHandoverService.getAllHandovers();

    const totalHandovers = handovers.length;
    const closedHandovers = handovers.filter(h => h.HandoverStatus === 'Closed');
    const completedHandovers = closedHandovers.length;

    // Average cycle time (Won -> Closed)
    const cycleTimes = closedHandovers
      .map(h => this.getCycleTimeDays(h))
      .filter((d): d is number => d !== null && d >= 0);
    const avgCycleTimeDays = cycleTimes.length > 0
      ? Math.round(cycleTimes.reduce((sum, d) => sum + d, 0) / cycleTimes.length)
      : 0;

    // Average handover time (Won -> Delivered) — use Delivered/Closed handovers
    const deliveredOrClosed = handovers.filter(
      h => h.HandoverStatus === 'Delivered' || h.HandoverStatus === 'Closed'
    );
    const handoverTimes = deliveredOrClosed
      .map(h => {
        const endDate = h.HandoverCompletedDate || h.Modified;
        if (!endDate || !h.WonDate) return null;
        try {
          return differenceInCalendarDays(parseISO(endDate), parseISO(h.WonDate));
        } catch {
          return null;
        }
      })
      .filter((d): d is number => d !== null && d >= 0);
    const avgHandoverTimeDays = handoverTimes.length > 0
      ? Math.round(handoverTimes.reduce((sum, d) => sum + d, 0) / handoverTimes.length)
      : 0;

    // On-time delivery rate (across all milestones)
    let totalCompletedMilestones = 0;
    let onTimeMilestones = 0;
    for (const h of handovers) {
      const milestones = h.MilestoneCompletions || [];
      const completed = milestones.filter(m => m.status === 'Completed');
      totalCompletedMilestones += completed.length;
      onTimeMilestones += completed.filter(m => (m.daysVariance ?? 0) <= 0).length;
    }
    const onTimeDeliveryRate = totalCompletedMilestones > 0
      ? Math.round((onTimeMilestones / totalCompletedMilestones) * 100)
      : 0;

    // Average checklist completion
    const checklistPercentages = handovers
      .map(h => this.getChecklistCompletion(h))
      .filter((p): p is number => p !== null);
    const avgChecklistCompletion = checklistPercentages.length > 0
      ? Math.round(checklistPercentages.reduce((sum, p) => sum + p, 0) / checklistPercentages.length)
      : 0;

    // Average CSAT
    const csatScores = handovers
      .map(h => this.getCSAT(h))
      .filter((c): c is CSATEntry => c !== null && c.overallScore > 0)
      .map(c => c.overallScore);
    const avgCSAT = csatScores.length > 0
      ? Math.round((csatScores.reduce((sum, s) => sum + s, 0) / csatScores.length) * 10) / 10
      : 0;

    // Total contract value
    const totalContractValue = handovers.reduce(
      (sum, h) => sum + (h.ContractValue ?? 0), 0
    );

    return {
      totalHandovers,
      completedHandovers,
      avgCycleTimeDays,
      avgHandoverTimeDays,
      onTimeDeliveryRate,
      avgChecklistCompletion,
      avgCSAT,
      totalContractValue,
    };
  }

  // ==================== TRENDS ====================

  /**
   * Get monthly cycle time trends for the last N months
   */
  async getCycleTrends(months: number = 12): Promise<DeliveryCycleTrend[]> {
    const handovers = await deliveryHandoverService.getAllHandovers();
    const closedHandovers = handovers.filter(h => h.HandoverStatus === 'Closed');

    const now = new Date();
    const trends: DeliveryCycleTrend[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthLabel = format(monthStart, 'MMM yyyy');

      const monthHandovers = closedHandovers.filter(h => {
        const completedDate = h.HandoverCompletedDate || h.Modified;
        if (!completedDate) return false;
        try {
          const d = parseISO(completedDate);
          return format(d, 'MMM yyyy') === monthLabel;
        } catch {
          return false;
        }
      });

      const cycleTimes = monthHandovers
        .map(h => this.getCycleTimeDays(h))
        .filter((d): d is number => d !== null && d >= 0);

      const avgCycleTimeDays = cycleTimes.length > 0
        ? Math.round(cycleTimes.reduce((sum, d) => sum + d, 0) / cycleTimes.length)
        : 0;

      // On-time rate for this month's completed handovers
      let totalCompleted = 0;
      let onTime = 0;
      for (const h of monthHandovers) {
        const milestones = h.MilestoneCompletions || [];
        const completed = milestones.filter(m => m.status === 'Completed');
        totalCompleted += completed.length;
        onTime += completed.filter(m => (m.daysVariance ?? 0) <= 0).length;
      }
      const onTimeRate = totalCompleted > 0
        ? Math.round((onTime / totalCompleted) * 100)
        : 0;

      trends.push({
        month: monthLabel,
        avgCycleTimeDays,
        completedCount: monthHandovers.length,
        onTimeRate,
      });
    }

    return trends;
  }

  // ==================== BY CATEGORY ====================

  /**
   * Get KPIs broken down by service category
   */
  async getServiceCategoryMetrics(): Promise<ServiceCategoryMetrics[]> {
    const handovers = await deliveryHandoverService.getAllHandovers();

    const categoryMap = new Map<string, DeliveryHandover[]>();
    for (const h of handovers) {
      const cat = h.ServiceCategory || 'Unknown';
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(h);
    }

    const metrics: ServiceCategoryMetrics[] = [];
    for (const [category, catHandovers] of categoryMap) {
      const closed = catHandovers.filter(h => h.HandoverStatus === 'Closed');
      const completedCount = closed.length;

      const cycleTimes = closed
        .map(h => this.getCycleTimeDays(h))
        .filter((d): d is number => d !== null && d >= 0);
      const avgCycleTimeDays = cycleTimes.length > 0
        ? Math.round(cycleTimes.reduce((sum, d) => sum + d, 0) / cycleTimes.length)
        : 0;

      const csatScores = catHandovers
        .map(h => this.getCSAT(h))
        .filter((c): c is CSATEntry => c !== null && c.overallScore > 0)
        .map(c => c.overallScore);
      const avgCSAT = csatScores.length > 0
        ? Math.round((csatScores.reduce((sum, s) => sum + s, 0) / csatScores.length) * 10) / 10
        : 0;

      // On-time rate for category
      let totalCompleted = 0;
      let onTime = 0;
      for (const h of catHandovers) {
        const milestones = h.MilestoneCompletions || [];
        const completed = milestones.filter(m => m.status === 'Completed');
        totalCompleted += completed.length;
        onTime += completed.filter(m => (m.daysVariance ?? 0) <= 0).length;
      }
      const onTimeRate = totalCompleted > 0
        ? Math.round((onTime / totalCompleted) * 100)
        : 0;

      const totalValue = catHandovers.reduce(
        (sum, h) => sum + (h.ContractValue ?? 0), 0
      );

      metrics.push({
        category,
        completedCount,
        avgCycleTimeDays,
        avgCSAT,
        onTimeRate,
        totalValue,
      });
    }

    // Sort by completed count descending
    metrics.sort((a, b) => b.completedCount - a.completedCount);
    return metrics;
  }

  // ==================== CSAT ====================

  /**
   * Get CSAT score distribution (1-5 stars)
   */
  async getCSATDistribution(): Promise<CSATDistributionEntry[]> {
    const handovers = await deliveryHandoverService.getAllHandovers();
    const csatEntries = handovers
      .map(h => this.getCSAT(h))
      .filter((c): c is CSATEntry => c !== null && c.overallScore > 0);

    const counts = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
    for (const entry of csatEntries) {
      const idx = Math.max(0, Math.min(4, Math.round(entry.overallScore) - 1));
      counts[idx]++;
    }

    const total = csatEntries.length || 1; // avoid division by zero
    return [1, 2, 3, 4, 5].map((rating, idx) => ({
      rating,
      count: counts[idx],
      percentage: Math.round((counts[idx] / total) * 100),
    }));
  }

  /**
   * Get recent CSAT feedback entries
   */
  async getRecentCSATFeedback(limit: number = 10): Promise<RecentCSATFeedback[]> {
    const handovers = await deliveryHandoverService.getAllHandovers();

    const feedback: RecentCSATFeedback[] = [];
    for (const h of handovers) {
      const csat = this.getCSAT(h);
      if (!csat || csat.overallScore <= 0) continue;
      feedback.push({
        handoverId: h.Id,
        clientName: h.ClientName,
        serviceName: h.ServiceName,
        overallScore: csat.overallScore,
        feedback: csat.feedback,
        submittedDate: csat.submittedDate,
        categories: csat.categories,
      });
    }

    // Sort by submittedDate descending
    feedback.sort((a, b) => {
      try {
        return parseISO(b.submittedDate).getTime() - parseISO(a.submittedDate).getTime();
      } catch {
        return 0;
      }
    });

    return feedback.slice(0, limit);
  }

  /**
   * Record CSAT for a handover.
   * Updates the CSAT_JSON field directly on the SharePoint list item.
   */
  async recordCSAT(
    handoverId: number,
    csat: CSATEntry
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const graphService = getGraphService();
      const listName = config.sharepoint.deliveryHandoversListName;

      await graphService.updateListItem(listName, handoverId, {
        CSAT_JSON: serializeCSAT(csat),
      });

      return { success: true };
    } catch (error) {
      console.error('[DeliveryAnalyticsService] Failed to record CSAT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record CSAT',
      };
    }
  }

  // ==================== FULL ANALYTICS ====================

  /**
   * Get full analytics data (convenience method for the dashboard tab)
   */
  async getFullAnalytics(): Promise<DeliveryAnalyticsData> {
    const [kpis, cycleTrends, categoryMetrics, csatDistribution, recentFeedback] =
      await Promise.all([
        this.calculateDeliveryKPIs(),
        this.getCycleTrends(12),
        this.getServiceCategoryMetrics(),
        this.getCSATDistribution(),
        this.getRecentCSATFeedback(10),
      ]);

    return {
      kpis,
      cycleTrends,
      categoryMetrics,
      csatDistribution,
      recentFeedback,
    };
  }
}

export const deliveryAnalyticsService = new DeliveryAnalyticsService();
