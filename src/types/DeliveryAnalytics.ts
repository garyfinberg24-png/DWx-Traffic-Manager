/**
 * Delivery Analytics Types
 * KPI tracking, CSAT, cycle time trends, and service category metrics
 * for the delivery handover system.
 * v2.17.0
 */

// ============================================================================
// Delivery KPIs
// ============================================================================

export interface DeliveryKPIs {
  totalHandovers: number;
  completedHandovers: number;
  avgCycleTimeDays: number;        // Won → Closed
  avgHandoverTimeDays: number;     // Won → Delivered
  onTimeDeliveryRate: number;      // % of milestones completed on/before planned
  avgChecklistCompletion: number;  // % at Delivered status
  avgCSAT: number;                 // 1-5 average
  totalContractValue: number;      // ZAR
}

// ============================================================================
// CSAT (Customer Satisfaction)
// ============================================================================

export type CSATCategoryName = 'Communication' | 'Quality' | 'Timeliness' | 'Professionalism' | 'Value for Money';

export const CSAT_CATEGORIES: CSATCategoryName[] = [
  'Communication',
  'Quality',
  'Timeliness',
  'Professionalism',
  'Value for Money',
];

export interface CSATCategoryScore {
  name: CSATCategoryName;
  score: number;  // 1-5
}

export interface CSATEntry {
  overallScore: number;             // 1-5
  feedback: string;
  submittedBy: string;
  submittedDate: string;            // ISO date
  categories: CSATCategoryScore[];
}

export const DEFAULT_CSAT_ENTRY: CSATEntry = {
  overallScore: 0,
  feedback: '',
  submittedBy: '',
  submittedDate: '',
  categories: CSAT_CATEGORIES.map((name) => ({ name, score: 0 })),
};

// ============================================================================
// Cycle Time Trends
// ============================================================================

export interface DeliveryCycleTrend {
  month: string;                   // "Jan 2026", "Feb 2026", etc.
  avgCycleTimeDays: number;
  completedCount: number;
  onTimeRate: number;              // 0-100%
}

// ============================================================================
// Service Category Metrics
// ============================================================================

export interface ServiceCategoryMetrics {
  category: string;                // ServiceCategory value
  completedCount: number;
  avgCycleTimeDays: number;
  avgCSAT: number;
  onTimeRate: number;              // 0-100%
  totalValue: number;              // ZAR
}

// ============================================================================
// CSAT Distribution
// ============================================================================

export interface CSATDistributionEntry {
  rating: number;                  // 1-5
  count: number;
  percentage: number;              // 0-100%
}

// ============================================================================
// Recent CSAT Feedback
// ============================================================================

export interface RecentCSATFeedback {
  handoverId: number;
  clientName: string;
  serviceName: string;
  overallScore: number;
  feedback: string;
  submittedDate: string;
  categories: CSATCategoryScore[];
}

// ============================================================================
// Full Analytics Data (used by DeliveryAnalyticsTab)
// ============================================================================

export interface DeliveryAnalyticsData {
  kpis: DeliveryKPIs;
  cycleTrends: DeliveryCycleTrend[];
  categoryMetrics: ServiceCategoryMetrics[];
  csatDistribution: CSATDistributionEntry[];
  recentFeedback: RecentCSATFeedback[];
}

// ============================================================================
// Serialization Helpers
// ============================================================================

const safeParseJSON = <T>(json: string | null | undefined): T | null => {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

export const serializeCSAT = (data: CSATEntry): string => JSON.stringify(data);
export const deserializeCSAT = (json: string | null | undefined): CSATEntry | null =>
  safeParseJSON<CSATEntry>(json);
