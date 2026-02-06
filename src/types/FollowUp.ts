/**
 * DWx Traffic Manager - Follow-Up / Stale Deal Detection Types
 */

import { ServiceRequest } from './ServiceRequest';

/** Urgency level for stale deals */
export type DealUrgencyLevel = 'warning' | 'critical' | 'overdue';

/** Urgency classification for a single deal */
export interface DealUrgency {
  level: DealUrgencyLevel;
  reason: string;
  daysSinceUpdate: number;
  daysOverdue?: number;
}

/** A stale deal with its urgency details */
export interface StaleDealInfo {
  request: ServiceRequest;
  urgency: DealUrgency;
}

/** Summary of deals requiring attention */
export interface AttentionSummary {
  warningCount: number;
  criticalCount: number;
  overdueCount: number;
  totalAtRiskValue: number;
  staleDeals: StaleDealInfo[];
}
