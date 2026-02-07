/**
 * DWx Traffic Manager - SLA Service
 * Computes SLA status, stage breakdowns, and bottleneck analysis
 */

import {
  ServiceRequest,
  DWService,
  FunnelStage,
  SLAStatus,
  SLATargets,
  SLAStageBreakdown,
  STAGE_TO_SLA_KEY,
  DEFAULT_SLA_TARGETS,
} from '../types/ServiceRequest';

// Ordered stages for iteration
const STAGE_ORDER: FunnelStage[] = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won'];

class SLAService {
  /**
   * Get the effective SLA targets for a service (service-level overrides or complexity defaults)
   */
  getEffectiveSLATargets(service?: DWService): SLATargets {
    if (service?.SLATargets) {
      return service.SLATargets;
    }
    const complexity = service?.ComplexityLevel || 'Medium';
    return DEFAULT_SLA_TARGETS[complexity];
  }

  /**
   * Get the number of business days a deal has been in its current stage
   */
  getTimeInCurrentStage(request: ServiceRequest): number {
    const timestamps = request.StageTimestamps;
    const currentStage = request.FunnelStage;

    if (timestamps && timestamps[currentStage]) {
      return this.businessDaysBetween(new Date(timestamps[currentStage]!), new Date());
    }

    // Fallback: use Created date for Lead, or Modified if available
    if (currentStage === 'Lead') {
      return this.businessDaysBetween(new Date(request.Created), new Date());
    }

    // No timestamp data available — use Modified or Created as approximation
    const refDate = request.Modified || request.Created;
    return this.businessDaysBetween(new Date(refDate), new Date());
  }

  /**
   * Calculate SLA status for a deal's current stage
   */
  getSLAStatus(request: ServiceRequest, service?: DWService): SLAStatus {
    const stage = request.FunnelStage;
    // Terminal stages have no SLA
    if (stage === 'Won' || stage === 'Lost') return 'on-track';

    const targets = this.getEffectiveSLATargets(service);
    const slaKey = STAGE_TO_SLA_KEY[stage];

    // Lead has no "transition into" SLA key — use LeadToQualified as "how long to stay in Lead"
    const targetDays = slaKey ? targets[slaKey] : targets.LeadToQualified;
    if (!targetDays) return 'on-track';

    const daysInStage = this.getTimeInCurrentStage(request);

    if (daysInStage > targetDays) return 'breached';
    if (daysInStage >= targetDays * 0.75) return 'at-risk';
    return 'on-track';
  }

  /**
   * Get a breakdown of time spent in each completed stage
   */
  getStageBreakdown(request: ServiceRequest, service?: DWService): SLAStageBreakdown[] {
    const timestamps = request.StageTimestamps;
    if (!timestamps) return [];

    const targets = this.getEffectiveSLATargets(service);
    const breakdown: SLAStageBreakdown[] = [];
    const currentStage = request.FunnelStage;
    const currentIdx = STAGE_ORDER.indexOf(currentStage);

    for (let i = 0; i < STAGE_ORDER.length; i++) {
      const stage = STAGE_ORDER[i];
      const enteredAt = timestamps[stage];
      if (!enteredAt) continue;

      // Determine exit time (entry of next stage, or now if current)
      let exitedAt: string | undefined;
      let daysInStage: number;

      if (i < currentIdx) {
        // Completed stage — find when next stage was entered
        const nextStage = STAGE_ORDER[i + 1];
        exitedAt = nextStage ? timestamps[nextStage] : undefined;
        daysInStage = exitedAt
          ? this.businessDaysBetween(new Date(enteredAt), new Date(exitedAt))
          : this.businessDaysBetween(new Date(enteredAt), new Date());
      } else {
        // Current stage
        daysInStage = this.businessDaysBetween(new Date(enteredAt), new Date());
      }

      // Get target for this stage
      const slaKey = STAGE_TO_SLA_KEY[stage] || (stage === 'Lead' ? 'LeadToQualified' : undefined);
      const targetDays = slaKey ? targets[slaKey as keyof SLATargets] : undefined;

      let status: SLAStatus = 'on-track';
      if (targetDays) {
        if (daysInStage > targetDays) status = 'breached';
        else if (daysInStage >= targetDays * 0.75) status = 'at-risk';
      }

      breakdown.push({
        stage,
        enteredAt,
        exitedAt,
        daysInStage,
        targetDays,
        status,
      });
    }

    return breakdown;
  }

  /**
   * Identify bottleneck stages across all deals
   */
  getBottlenecks(
    requests: ServiceRequest[],
    services: DWService[]
  ): { stage: FunnelStage; avgDays: number; targetDays: number; breachRate: number }[] {
    const serviceMap = new Map(services.map(s => [s.Id, s]));
    const stageData: Record<string, { totalDays: number; count: number; breaches: number; targetDays: number }> = {};

    for (const request of requests) {
      if (!request.StageTimestamps) continue;
      const service = request.ServiceId ? serviceMap.get(request.ServiceId) : undefined;
      const breakdown = this.getStageBreakdown(request, service);

      for (const entry of breakdown) {
        if (!stageData[entry.stage]) {
          stageData[entry.stage] = { totalDays: 0, count: 0, breaches: 0, targetDays: entry.targetDays || 0 };
        }
        stageData[entry.stage].totalDays += entry.daysInStage;
        stageData[entry.stage].count += 1;
        if (entry.status === 'breached') stageData[entry.stage].breaches += 1;
        if (entry.targetDays && entry.targetDays > stageData[entry.stage].targetDays) {
          stageData[entry.stage].targetDays = entry.targetDays;
        }
      }
    }

    return Object.entries(stageData)
      .map(([stage, data]) => ({
        stage: stage as FunnelStage,
        avgDays: data.count > 0 ? Math.round((data.totalDays / data.count) * 10) / 10 : 0,
        targetDays: data.targetDays,
        breachRate: data.count > 0 ? Math.round((data.breaches / data.count) * 100) : 0,
      }))
      .sort((a, b) => b.breachRate - a.breachRate);
  }

  /**
   * Count deals currently breaching or at risk
   */
  getSLASummary(
    requests: ServiceRequest[],
    services: DWService[]
  ): { onTrack: number; atRisk: number; breached: number; complianceRate: number } {
    const serviceMap = new Map(services.map(s => [s.Id, s]));
    let onTrack = 0;
    let atRisk = 0;
    let breached = 0;

    const activeRequests = requests.filter(
      r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
    );

    for (const request of activeRequests) {
      const service = request.ServiceId ? serviceMap.get(request.ServiceId) : undefined;
      const status = this.getSLAStatus(request, service);
      if (status === 'on-track') onTrack++;
      else if (status === 'at-risk') atRisk++;
      else breached++;
    }

    const total = activeRequests.length;
    const complianceRate = total > 0 ? Math.round((onTrack / total) * 100) : 100;

    return { onTrack, atRisk, breached, complianceRate };
  }

  /**
   * Calculate business days between two dates (excludes weekends)
   */
  private businessDaysBetween(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (endDate <= startDate) return 0;

    let count = 0;
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    while (current < endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}

export const slaService = new SLAService();
