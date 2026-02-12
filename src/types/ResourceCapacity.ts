/**
 * DWx Traffic Manager - Resource Capacity Types
 * Cross-project resource utilization and capacity planning types.
 * v2.17.0
 */

import type { DeliveryRole } from './DeliveryHandover';

// ============================================================================
// Utilization
// ============================================================================

export type UtilizationStatus = 'Available' | 'Near Capacity' | 'Overallocated';

export const UTILIZATION_STATUS_COLORS: Record<UtilizationStatus, { bg: string; text: string; accent: string }> = {
  'Available': { bg: '#d1fae5', text: '#059669', accent: '#10B981' },
  'Near Capacity': { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
  'Overallocated': { bg: '#fee2e2', text: '#dc2626', accent: '#EF4444' },
};

export interface ActiveHandoverLink {
  handoverId: number;
  clientName: string;
  serviceName: string;
  allocation: number; // percentage
  endDate: string | null; // PlannedGoLive
}

export interface ResourceUtilization {
  resourceId: number;
  name: string;
  email: string;
  role: DeliveryRole;
  currentProjects: number;
  maxProjects: number;
  totalAllocatedPercent: number; // Sum of allocation% across active handovers
  utilizationStatus: UtilizationStatus;
  activeHandovers: ActiveHandoverLink[];
}

// ============================================================================
// Weekly Capacity Forecast
// ============================================================================

export interface WeeklyResourceEntry {
  name: string;
  role: DeliveryRole;
  allocatedPercent: number;
  projects: string[];
}

export interface WeeklyCapacity {
  weekStart: string; // ISO date of Monday
  weekLabel: string; // "Wk 1", "Wk 2", etc.
  resources: WeeklyResourceEntry[];
  totalAllocatedPercent: number; // Avg allocation across all resources
  availableCapacityPercent: number; // 100 - totalAllocatedPercent
}

// ============================================================================
// Overallocation Warnings
// ============================================================================

export type OverallocationSeverity = 'Warning' | 'Critical';

export interface OverallocationWarning {
  resourceName: string;
  role: DeliveryRole;
  totalAllocation: number; // % across projects
  projects: string[];
  severity: OverallocationSeverity; // Warning: 100-120%, Critical: >120%
}

// ============================================================================
// Capacity Summary (hero KPI cards)
// ============================================================================

export interface CapacityDashboardSummary {
  totalResources: number;
  activeResources: number;
  avgUtilization: number; // Average utilization % across all active resources
  overallocatedCount: number;
  availableCount: number; // Resources with capacity for more projects
  nearCapacityCount: number;
}
