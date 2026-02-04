/**
 * Commercial Dashboard Types
 *
 * Revenue model:
 * 1. Deployment Fee: R50,000 flat fee per deployment booking
 * 2. Conversion Revenue: DealSize × R90 when a customer converts from trial
 */

/** Flat deployment fee in ZAR */
export const DEPLOYMENT_FEE = 50_000;

/** Per-license rate for deal value calculation */
export const DEAL_RATE_PER_LICENSE = 90;

/** Revenue stages for pipeline tracking */
export type RevenueStage = 'Pending' | 'Confirmed' | 'Deployed' | 'Converted';

/** A single revenue pipeline entry derived from a booking */
export interface RevenueEntry {
  bookingId: number;
  clientName: string;
  isPremium: boolean;
  bookingType: 'Demo' | 'Deployment';
  accountManagerName: string;
  accountManagerEmail: string;
  licenseCount: number;
  deploymentFee: number; // R50,000 for deployments, 0 for demos
  dealValue: number; // DealSize × R90 (or 0 if no DealSize)
  stage: RevenueStage;
  created: string;
  confirmedDate?: string;
}

/** Summary KPIs for the commercial dashboard */
export interface CommercialKPIs {
  totalPipeline: number; // All deployment fees + all deal values
  realisedRevenue: number; // Confirmed deployment fees + converted deal values
  pendingRevenue: number; // Pipeline minus realised
  avgDealValue: number; // Average deal value across deployments with DealSize
  deploymentCount: number;
  confirmedDeployments: number;
  totalDeploymentRevenue: number; // deploymentCount × R50,000
  totalConversionRevenue: number; // Sum of deal values for confirmed deployments
  conversionRate: number; // % of demos that became deployments
}

/** Monthly revenue trend data point */
export interface MonthlyRevenueTrend {
  month: string; // YYYY-MM
  label: string; // e.g., "Jan"
  deploymentRevenue: number;
  conversionRevenue: number;
  total: number;
}

/** Revenue funnel step */
export interface FunnelStep {
  label: string;
  count: number;
  value: number;
  percentage: number; // of total demos
}

/** AM revenue performance row */
export interface AMRevenuePerformance {
  name: string;
  email: string;
  deployments: number;
  deploymentRevenue: number;
  conversions: number;
  conversionRevenue: number;
  totalRevenue: number;
}
