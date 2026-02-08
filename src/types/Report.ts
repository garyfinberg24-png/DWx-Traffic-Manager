/**
 * DWx Traffic Manager - Report Types (v2.15.0)
 * Types for the Reporting module: Pipeline, AM Performance, Revenue reports
 */

import type { FunnelStage } from './ServiceRequest';

// ============================================================================
// Core Report Configuration
// ============================================================================

export type ReportType = 'pipeline' | 'am-performance' | 'revenue';

export type DateRangePreset =
  | 'this-month'
  | 'last-month'
  | 'this-quarter'
  | 'last-quarter'
  | 'ytd'
  | 'last-12-months'
  | 'custom';

export interface ReportDateRange {
  preset: DateRangePreset;
  start: Date;
  end: Date;
  label: string; // e.g. "Jan 2026 - Feb 2026"
}

export interface ReportConfig {
  type: ReportType;
  dateRange: ReportDateRange;
  generatedAt: Date;
  generatedBy: string;
}

// ============================================================================
// Pipeline & Funnel Report
// ============================================================================

export interface PipelineStageBreakdown {
  stage: FunnelStage;
  count: number;
  value: number;
  weightedValue: number;
  percentage: number; // % of total pipeline
}

export interface PipelineConversionRate {
  from: string;
  to: string;
  rate: number; // 0-100
  count: number;
  total: number;
}

export interface DealAgingEntry {
  stage: FunnelStage;
  avgDays: number;
  minDays: number;
  maxDays: number;
  dealCount: number;
}

export interface TopDealEntry {
  id: number;
  client: string;
  service: string;
  value: number;
  stage: FunnelStage;
  daysInPipeline: number;
  probability: number;
}

export interface PipelineForecastEntry {
  period: string; // "Mar 2026"
  expected: number;
  weighted: number;
}

export interface PipelineReportData {
  config: ReportConfig;
  overview: {
    totalPipeline: number;
    weightedPipeline: number;
    avgDealSize: number;
    hotLeads: number;
    openDeals: number;
  };
  stageBreakdown: PipelineStageBreakdown[];
  conversionRates: PipelineConversionRate[];
  dealAging: DealAgingEntry[];
  forecast: PipelineForecastEntry[];
  topDeals: TopDealEntry[];
}

// ============================================================================
// AM Performance Report
// ============================================================================

export interface AMLeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  winRate: number; // 0-100
  totalRevenue: number;
  avgDealSize: number;
  avgCycleDays: number;
}

export interface AMWinRateEntry {
  name: string;
  winRate: number;
  totalDeals: number;
}

export interface AMRevenueEntry {
  name: string;
  revenue: number;
}

export interface AMActivityTrendEntry {
  period: string; // "Jan 2026"
  created: number;
  won: number;
  lost: number;
}

export interface AMPerformanceReportData {
  config: ReportConfig;
  summary: {
    totalAMs: number;
    avgWinRate: number;
    totalRevenue: number;
    avgCycleTime: number;
  };
  leaderboard: AMLeaderboardEntry[];
  winRateByAM: AMWinRateEntry[];
  revenueByAM: AMRevenueEntry[];
  activityTrend: AMActivityTrendEntry[];
}

// ============================================================================
// Revenue & Commercial Report
// ============================================================================

export interface RevenueByServiceEntry {
  service: string;
  revenue: number;
  dealCount: number;
}

export interface RevenueByIndustryEntry {
  industry: string;
  revenue: number;
  dealCount: number;
  percentage: number; // % of total
}

export interface MonthlyRevenueTrendEntry {
  period: string; // "Jan 2026"
  revenue: number;
  dealCount: number;
}

export interface DealSizeDistributionEntry {
  label: string; // "R0-50K"
  min: number;
  max: number;
  wonCount: number;
  lostCount: number;
  wonRevenue: number;
}

export interface RevenueForecastEntry {
  period: string;
  forecasted: number;
  actual?: number;
}

export interface RevenueReportData {
  config: ReportConfig;
  overview: {
    totalWonRevenue: number;
    activePipeline: number;
    avgDealSize: number;
    winRate: number;
    forecastedRevenue: number;
  };
  revenueByService: RevenueByServiceEntry[];
  revenueByIndustry: RevenueByIndustryEntry[];
  monthlyTrends: MonthlyRevenueTrendEntry[];
  dealSizeDistribution: DealSizeDistributionEntry[];
  forecast: RevenueForecastEntry[];
}

// ============================================================================
// Report Display Labels
// ============================================================================

export const REPORT_TYPE_LABELS: Record<ReportType, { title: string; description: string }> = {
  pipeline: {
    title: 'Pipeline & Funnel',
    description: 'Funnel health, stage velocity, deal progression',
  },
  'am-performance': {
    title: 'AM Performance',
    description: 'Individual metrics, leaderboards, activity trends',
  },
  revenue: {
    title: 'Revenue & Commercial',
    description: 'Revenue attribution, trends, forecasting',
  },
};

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-quarter': 'This Quarter',
  'last-quarter': 'Last Quarter',
  'ytd': 'Year to Date',
  'last-12-months': 'Last 12 Months',
  'custom': 'Custom',
};
