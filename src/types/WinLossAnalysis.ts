/**
 * DWx Traffic Manager - Win/Loss Analysis Types
 */

/** Overall win/loss metrics */
export interface WinLossOverviewMetrics {
  totalClosed: number;
  totalWon: number;
  totalLost: number;
  winRate: number; // 0-100
  avgWonDealSize: number;
  avgLostDealSize: number;
  totalWonRevenue: number;
  avgSalesCycleWon: number; // days
  avgSalesCycleLost: number; // days
}

/** Win/loss breakdown per service category */
export interface ServiceWinLoss {
  serviceName: string;
  wonCount: number;
  lostCount: number;
  winRate: number;
  totalWonRevenue: number;
}

/** Win/loss breakdown per account manager */
export interface AMWinLoss {
  amName: string;
  amEmail: string;
  wonCount: number;
  lostCount: number;
  winRate: number;
  totalWonRevenue: number;
}

/** Win/loss breakdown per industry */
export interface IndustryWinLoss {
  industry: string;
  wonCount: number;
  lostCount: number;
  winRate: number;
  totalWonRevenue: number;
}

/** Reason analysis */
export interface WinLossReasonEntry {
  reason: string;
  count: number;
  percentage: number;
}

export interface WinLossReasons {
  topWinReasons: WinLossReasonEntry[];
  topLossReasons: WinLossReasonEntry[];
}

/** Monthly trend data */
export interface MonthlyWinLoss {
  period: string; // YYYY-MM
  periodLabel: string; // "Jan 2026"
  wonCount: number;
  lostCount: number;
  winRate: number;
  wonRevenue: number;
}

/** Deal size bucket analysis */
export interface DealSizeBucket {
  label: string; // "R0-50K", "R50-100K", etc.
  min: number;
  max: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
}
