/**
 * DWx Traffic Manager - Follow-Up / Stale Deal Detection Service
 *
 * Pure client-side computation service that analyzes ServiceRequest[] data
 * to identify stale deals requiring follow-up action.
 *
 * Urgency thresholds:
 *   - warning:  7+ days since last update
 *   - critical: 14+ days since last update
 *   - overdue:  ExpectedCloseDate has passed
 */

import { ServiceRequest, FunnelStage } from '../types/ServiceRequest';
import { DealUrgency, StaleDealInfo, AttentionSummary } from '../types/FollowUp';
import { dwxNotificationService } from './DWxNotificationService';
import { auditService } from './AuditService';

/** Terminal stages that should be excluded from stale-deal checks */
const TERMINAL_STAGES: FunnelStage[] = ['Won', 'Lost'];

/** Days of inactivity before a deal is flagged as warning */
const WARNING_THRESHOLD_DAYS = 7;

/** Days of inactivity before a deal is flagged as critical */
const CRITICAL_THRESHOLD_DAYS = 14;

class FollowUpService {
  /**
   * Evaluate urgency for a single service request.
   * Returns null if the deal is healthy or in a terminal stage.
   */
  getDealUrgency(request: ServiceRequest): DealUrgency | null {
    // Skip terminal stages
    if (TERMINAL_STAGES.includes(request.FunnelStage)) {
      return null;
    }

    const now = new Date();

    // Use Modified date if available, otherwise fall back to Created
    const lastUpdateStr = request.Modified || request.Created;
    const lastUpdate = new Date(lastUpdateStr);
    const daysSinceUpdate = Math.floor(
      (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if ExpectedCloseDate has passed (overdue takes highest priority)
    if (request.ExpectedCloseDate) {
      const expectedClose = new Date(request.ExpectedCloseDate);
      if (expectedClose.getTime() < now.getTime()) {
        const daysOverdue = Math.floor(
          (now.getTime() - expectedClose.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          level: 'overdue',
          reason: `Expected close date was ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} ago`,
          daysSinceUpdate,
          daysOverdue,
        };
      }
    }

    // Check for critical inactivity (14+ days)
    if (daysSinceUpdate >= CRITICAL_THRESHOLD_DAYS) {
      return {
        level: 'critical',
        reason: `No activity for ${daysSinceUpdate} days`,
        daysSinceUpdate,
      };
    }

    // Check for warning inactivity (7+ days)
    if (daysSinceUpdate >= WARNING_THRESHOLD_DAYS) {
      return {
        level: 'warning',
        reason: `No activity for ${daysSinceUpdate} days`,
        daysSinceUpdate,
      };
    }

    // Deal is healthy
    return null;
  }

  /**
   * Filter an array of service requests to find stale deals with urgency info.
   */
  getStaleDeals(requests: ServiceRequest[]): StaleDealInfo[] {
    const staleDeals: StaleDealInfo[] = [];

    for (const request of requests) {
      const urgency = this.getDealUrgency(request);
      if (urgency !== null) {
        staleDeals.push({ request, urgency });
      }
    }

    return staleDeals;
  }

  /**
   * Build an attention summary with counts by urgency level and total at-risk value.
   */
  getAttentionSummary(requests: ServiceRequest[]): AttentionSummary {
    const staleDeals = this.getStaleDeals(requests);

    let warningCount = 0;
    let criticalCount = 0;
    let overdueCount = 0;
    let totalAtRiskValue = 0;

    for (const staleDeal of staleDeals) {
      switch (staleDeal.urgency.level) {
        case 'warning':
          warningCount++;
          break;
        case 'critical':
          criticalCount++;
          break;
        case 'overdue':
          overdueCount++;
          break;
      }

      if (staleDeal.request.DealValue) {
        totalAtRiskValue += staleDeal.request.DealValue;
      }
    }

    return {
      warningCount,
      criticalCount,
      overdueCount,
      totalAtRiskValue,
      staleDeals,
    };
  }

  /**
   * Send follow-up reminder emails for a stale deal.
   * Notifies the Account Manager and all configured managers, then logs an audit entry.
   */
  async sendFollowUpReminder(
    request: ServiceRequest,
    urgency: DealUrgency,
    senderEmail: string,
    senderName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Notify the Account Manager about the stale deal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dwxNotificationService as any).notifyFollowUpReminderAM(request, urgency);

      // Notify all configured managers about the stale deal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dwxNotificationService as any).notifyFollowUpReminderManagers(request, urgency);

      // Log the follow-up reminder in the audit trail
      await auditService.logAction({
        action: 'UPDATE',
        entityType: 'ServiceRequest',
        entityId: String(request.Id),
        entityName: request.Title,
        details: `Follow-up reminder sent by ${senderName} (${senderEmail})`,
        oldValues: {},
        newValues: {
          reminderSent: true,
          urgencyLevel: urgency.level,
        },
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to send follow-up reminder';
      console.error('[FollowUpService] sendFollowUpReminder failed:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

export const followUpService = new FollowUpService();
