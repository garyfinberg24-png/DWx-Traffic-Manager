/**
 * DWx Traffic Manager - Resource Capacity Service
 * Cross-project resource utilization analytics.
 * Joins DeliveryResource data with active DeliveryHandover team assignments
 * to compute utilization, capacity forecasts, and overallocation warnings.
 * v2.17.0
 */

import { deliveryResourceService } from './DeliveryResourceService';
import { deliveryHandoverService } from './DeliveryHandoverService';
import type { DeliveryHandover, DeliveryResource, TeamAssignment } from '../types/DeliveryHandover';
import type {
  ResourceUtilization,
  UtilizationStatus,
  ActiveHandoverLink,
  WeeklyCapacity,
  WeeklyResourceEntry,
  OverallocationWarning,
  OverallocationSeverity,
  CapacityDashboardSummary,
} from '../types/ResourceCapacity';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the Monday of the current week (00:00:00 UTC).
 */
function getNextMonday(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun .. 6=Sat
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  const monday = new Date(now);
  monday.setDate(monday.getDate() + daysUntilMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Format a Date as ISO date string (YYYY-MM-DD).
 */
function toISODateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Determine whether a handover is "active" (not terminal).
 */
function isActiveHandover(h: DeliveryHandover): boolean {
  return h.HandoverStatus !== 'Closed' && h.HandoverStatus !== 'Delivered';
}

/**
 * Find all team assignments for a given resource within a list of handovers.
 * Matches by resourceId (primary) or email (fallback).
 */
function findAssignmentsForResource(
  resource: DeliveryResource,
  handovers: DeliveryHandover[]
): Array<{ handover: DeliveryHandover; assignment: TeamAssignment }> {
  const results: Array<{ handover: DeliveryHandover; assignment: TeamAssignment }> = [];

  for (const handover of handovers) {
    if (!handover.DeliveryTeam || handover.DeliveryTeam.length === 0) continue;

    for (const assignment of handover.DeliveryTeam) {
      const matchById = assignment.resourceId === resource.Id;
      const matchByEmail =
        assignment.resourceEmail &&
        resource.Email &&
        assignment.resourceEmail.toLowerCase() === resource.Email.toLowerCase();

      if (matchById || matchByEmail) {
        results.push({ handover, assignment });
      }
    }
  }

  return results;
}

/**
 * Check whether a handover's end date (PlannedGoLive) is after a given date.
 * If no end date exists, the handover is assumed to still be active.
 */
function isHandoverActiveInWeek(handover: DeliveryHandover, weekStart: Date): boolean {
  if (!handover.PlannedGoLive) return true; // No end date = still active
  const goLive = new Date(handover.PlannedGoLive);
  return goLive >= weekStart;
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

class ResourceCapacityService {
  /**
   * Get utilization details for all delivery resources, joined with their
   * active handover assignments.
   *
   * For each resource, sums allocation percentages across all active handovers
   * where the resource appears in the DeliveryTeam, and determines a
   * utilization status:
   *   - Available: totalAllocatedPercent < 80
   *   - Near Capacity: 80 <= totalAllocatedPercent < 100
   *   - Overallocated: totalAllocatedPercent >= 100
   *
   * Results are sorted by totalAllocatedPercent descending (most utilized first).
   */
  async getAllResourceUtilization(): Promise<ResourceUtilization[]> {
    try {
      // Fetch resources and handovers in parallel
      const [allResources, allHandovers] = await Promise.all([
        deliveryResourceService.getAllResources(),
        deliveryHandoverService.getAllHandovers(),
      ]);

      // Filter to active handovers only
      const activeHandovers = allHandovers.filter(isActiveHandover);

      const utilizations: ResourceUtilization[] = allResources.map((resource) => {
        // Find all assignments for this resource across active handovers
        const matches = findAssignmentsForResource(resource, activeHandovers);

        // Sum allocation percentages
        const totalAllocatedPercent = matches.reduce(
          (sum, { assignment }) => sum + (assignment.allocationPercent ?? 0),
          0
        );

        // Determine utilization status
        let utilizationStatus: UtilizationStatus;
        if (totalAllocatedPercent >= 100) {
          utilizationStatus = 'Overallocated';
        } else if (totalAllocatedPercent >= 80) {
          utilizationStatus = 'Near Capacity';
        } else {
          utilizationStatus = 'Available';
        }

        // Build active handover links
        const activeHandoverLinks: ActiveHandoverLink[] = matches.map(
          ({ handover, assignment }) => ({
            handoverId: handover.Id,
            clientName: handover.ClientName,
            serviceName: handover.ServiceName,
            allocation: assignment.allocationPercent ?? 0,
            endDate: handover.PlannedGoLive || null,
          })
        );

        return {
          resourceId: resource.Id,
          name: resource.Title,
          email: resource.Email,
          role: resource.Role,
          currentProjects: matches.length,
          maxProjects: resource.MaxConcurrentProjects,
          totalAllocatedPercent,
          utilizationStatus,
          activeHandovers: activeHandoverLinks,
        };
      });

      // Sort by most utilized first
      utilizations.sort((a, b) => b.totalAllocatedPercent - a.totalAllocatedPercent);

      return utilizations;
    } catch (error) {
      console.error('[ResourceCapacityService] Failed to get resource utilization:', error);
      return [];
    }
  }

  /**
   * Get a capacity forecast for the next N weeks.
   *
   * For each week (starting from the next Monday), checks which handovers
   * are still active (PlannedGoLive is after the week start, or has no end
   * date). Sums allocation percentages per resource for that week, then
   * computes an average utilization across all active resources.
   *
   * @param weeks Number of weeks to forecast (default 8).
   */
  async getCapacityForecast(weeks: number = 8): Promise<WeeklyCapacity[]> {
    try {
      const [allResources, allHandovers] = await Promise.all([
        deliveryResourceService.getAllResources(),
        deliveryHandoverService.getAllHandovers(),
      ]);

      const activeResources = allResources.filter((r) => r.IsActive);
      const activeHandovers = allHandovers.filter(isActiveHandover);

      if (activeResources.length === 0) {
        return [];
      }

      const forecast: WeeklyCapacity[] = [];
      const startMonday = getNextMonday();

      for (let w = 0; w < weeks; w++) {
        const weekStart = new Date(startMonday);
        weekStart.setDate(weekStart.getDate() + w * 7);

        const weekLabel = `Wk ${w + 1}`;

        // Filter handovers that are still active in this week
        const handoversThisWeek = activeHandovers.filter((h) =>
          isHandoverActiveInWeek(h, weekStart)
        );

        // For each resource, compute allocation for this week
        const resources: WeeklyResourceEntry[] = activeResources.map((resource) => {
          const matches = findAssignmentsForResource(resource, handoversThisWeek);

          const allocatedPercent = matches.reduce(
            (sum, { assignment }) => sum + (assignment.allocationPercent ?? 0),
            0
          );

          const projects = matches.map(
            ({ handover }) => `${handover.ClientName} - ${handover.ServiceName}`
          );

          return {
            name: resource.Title,
            role: resource.Role,
            allocatedPercent,
            projects,
          };
        });

        // Compute average allocation across all active resources
        const totalAllocation = resources.reduce(
          (sum, r) => sum + r.allocatedPercent,
          0
        );
        const totalAllocatedPercent =
          activeResources.length > 0
            ? Math.round(totalAllocation / activeResources.length)
            : 0;

        const availableCapacityPercent = Math.max(0, 100 - totalAllocatedPercent);

        forecast.push({
          weekStart: toISODateString(weekStart),
          weekLabel,
          resources,
          totalAllocatedPercent,
          availableCapacityPercent,
        });
      }

      return forecast;
    } catch (error) {
      console.error('[ResourceCapacityService] Failed to get capacity forecast:', error);
      return [];
    }
  }

  /**
   * Get resources that are overallocated (>= 100% total allocation).
   *
   * Severity levels:
   *   - Warning: 100% to 120% allocation
   *   - Critical: above 120% allocation
   */
  async getOverallocationWarnings(): Promise<OverallocationWarning[]> {
    try {
      const utilizations = await this.getAllResourceUtilization();

      return utilizations
        .filter((u) => u.totalAllocatedPercent >= 100)
        .map((u) => {
          const severity: OverallocationSeverity =
            u.totalAllocatedPercent > 120 ? 'Critical' : 'Warning';

          const projects = u.activeHandovers.map(
            (h) => `${h.clientName} - ${h.serviceName}`
          );

          return {
            resourceName: u.name,
            role: u.role,
            totalAllocation: u.totalAllocatedPercent,
            projects,
            severity,
          };
        });
    } catch (error) {
      console.error('[ResourceCapacityService] Failed to get overallocation warnings:', error);
      return [];
    }
  }

  /**
   * Get aggregate capacity summary for hero KPI cards.
   *
   * Computes:
   *   - totalResources: count of all resources
   *   - activeResources: count of active (IsActive) resources
   *   - avgUtilization: average allocation % across active resources
   *   - overallocatedCount: resources with >= 100% allocation
   *   - availableCount: resources with < 80% allocation
   *   - nearCapacityCount: resources with 80-99% allocation
   */
  async getCapacitySummary(): Promise<CapacityDashboardSummary> {
    try {
      const utilizations = await this.getAllResourceUtilization();

      const totalResources = utilizations.length;

      // Count active resources by checking original resource data
      const [allResources] = await Promise.all([
        deliveryResourceService.getAllResources(),
      ]);
      const activeResources = allResources.filter((r) => r.IsActive).length;

      // Compute average utilization across all resources
      const totalAllocation = utilizations.reduce(
        (sum, u) => sum + u.totalAllocatedPercent,
        0
      );
      const avgUtilization =
        utilizations.length > 0
          ? Math.round(totalAllocation / utilizations.length)
          : 0;

      const overallocatedCount = utilizations.filter(
        (u) => u.totalAllocatedPercent >= 100
      ).length;

      const availableCount = utilizations.filter(
        (u) => u.totalAllocatedPercent < 80
      ).length;

      const nearCapacityCount = utilizations.filter(
        (u) => u.totalAllocatedPercent >= 80 && u.totalAllocatedPercent < 100
      ).length;

      return {
        totalResources,
        activeResources,
        avgUtilization,
        overallocatedCount,
        availableCount,
        nearCapacityCount,
      };
    } catch (error) {
      console.error('[ResourceCapacityService] Failed to get capacity summary:', error);
      return {
        totalResources: 0,
        activeResources: 0,
        avgUtilization: 0,
        overallocatedCount: 0,
        availableCount: 0,
        nearCapacityCount: 0,
      };
    }
  }
}

// Export singleton instance
export const resourceCapacityService = new ResourceCapacityService();
