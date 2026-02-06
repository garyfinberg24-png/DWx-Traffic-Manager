/**
 * DWx Traffic Manager - Notification Service
 * Sends DW-branded email notifications for service request events
 */

import { getGraphService } from './serviceFactory';
import { ServiceRequest, FunnelStage, DWService } from '../types/ServiceRequest';
import { ProductRequest } from '../types/ProductRequest';
import { SessionPreparation } from '../types/SessionPreparation';
import { config } from '../config/environmentConfig';
import { EmailTemplates, ProposalEmailContext } from './EmailTemplates';
import { emailTrackingService } from './EmailTrackingService';
import { EmailType } from '../types/EmailTracking';

const graphService = getGraphService();

interface NotificationResult {
  success: boolean;
  error?: string;
}

class DWxNotificationService {
  /**
   * Get manager emails from configuration
   */
  private getManagerEmails(): string[] {
    const emails = config.notifications.managerEmails;
    if (emails.length === 0) {
      console.warn('[DWxNotificationService] No manager emails configured');
    }
    return emails;
  }

  /**
   * Send email via Graph API, optionally tracking it against a service request.
   */
  private async sendEmail(
    toRecipients: string[],
    subject: string,
    htmlBody: string,
    ccRecipients?: string[],
    trackingOptions?: { requestId: number; emailType: EmailType; sentBy: string }
  ): Promise<NotificationResult> {
    try {
      await graphService.sendEmail({
        to: toRecipients,
        subject: subject,
        body: htmlBody,
        cc: ccRecipients,
      });
      console.log(`[DWxNotificationService] Email sent: ${subject}`);

      // Track the email if requestId provided (fire-and-forget, never blocks)
      if (trackingOptions) {
        emailTrackingService.logEmail(trackingOptions.requestId, {
          subject,
          sentTo: toRecipients,
          sentAt: new Date().toISOString(),
          sentBy: trackingOptions.sentBy,
          type: trackingOptions.emailType,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Notify AM that their service request was created
   */
  async notifyRequestCreatedAM(request: ServiceRequest): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.requestCreatedAM(request);
    return this.sendEmail([request.AccountManagerEmail], subject, body, undefined, {
      requestId: request.Id,
      emailType: 'request_created',
      sentBy: 'System',
    });
  }

  /**
   * Notify managers of new service request requiring action
   */
  async notifyRequestCreatedManagers(request: ServiceRequest): Promise<NotificationResult> {
    const managerEmails = this.getManagerEmails();
    if (managerEmails.length === 0) {
      return { success: true }; // No managers to notify
    }

    const { subject, body } = EmailTemplates.requestCreatedManager(request);
    return this.sendEmail(managerEmails, subject, body);
  }

  /**
   * Send all notifications for a new request
   */
  async sendRequestCreatedNotifications(request: ServiceRequest): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Notify AM
    results.push(await this.notifyRequestCreatedAM(request));

    // Notify managers
    results.push(await this.notifyRequestCreatedManagers(request));

    return results;
  }

  /**
   * Notify AM that a specialist was assigned
   */
  async notifySpecialistAssignedAM(
    request: ServiceRequest,
    specialistName: string,
    specialistEmail: string,
    specialistRole: string
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.specialistAssignedAM(
      request,
      specialistName,
      specialistEmail,
      specialistRole
    );
    return this.sendEmail([request.AccountManagerEmail], subject, body, undefined, {
      requestId: request.Id,
      emailType: 'specialist_assigned',
      sentBy: 'System',
    });
  }

  /**
   * Notify specialist of their assignment
   */
  async notifySpecialistAssigned(
    request: ServiceRequest,
    specialistName: string,
    specialistEmail: string
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.specialistAssignedSpecialist(request, specialistName);
    return this.sendEmail([specialistEmail], subject, body);
  }

  /**
   * Send all notifications for specialist assignment
   */
  async sendSpecialistAssignedNotifications(
    request: ServiceRequest,
    specialistName: string,
    specialistEmail: string,
    specialistRole: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Notify AM
    results.push(
      await this.notifySpecialistAssignedAM(request, specialistName, specialistEmail, specialistRole)
    );

    // Notify specialist
    results.push(await this.notifySpecialistAssigned(request, specialistName, specialistEmail));

    return results;
  }

  /**
   * Notify all parties of confirmed discovery meeting
   */
  async notifyDiscoveryConfirmed(
    request: ServiceRequest,
    confirmedSlot: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Notify AM
    const amTemplate = EmailTemplates.discoveryConfirmed(
      request,
      request.AccountManagerName,
      confirmedSlot
    );
    results.push(await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body, undefined, {
      requestId: request.Id,
      emailType: 'discovery_confirmed',
      sentBy: 'System',
    }));

    // Notify specialist if assigned
    if (request.AssignedSpecialistEmail && request.AssignedSpecialistName) {
      const specialistTemplate = EmailTemplates.discoveryConfirmed(
        request,
        request.AssignedSpecialistName,
        confirmedSlot
      );
      results.push(
        await this.sendEmail([request.AssignedSpecialistEmail], specialistTemplate.subject, specialistTemplate.body)
      );
    }

    // Notify client contact
    const clientTemplate = EmailTemplates.discoveryConfirmed(request, request.ContactName, confirmedSlot);
    results.push(await this.sendEmail([request.ContactEmail], clientTemplate.subject, clientTemplate.body));

    return results;
  }

  /**
   * Notify AM of stage change
   */
  async notifyStageChanged(
    request: ServiceRequest,
    previousStage: FunnelStage,
    newStage: FunnelStage,
    changedBy: string
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.stageChanged(request, previousStage, newStage, changedBy);
    return this.sendEmail([request.AccountManagerEmail], subject, body, undefined, {
      requestId: request.Id,
      emailType: 'stage_changed',
      sentBy: 'System',
    });
  }

  /**
   * Notify managers of deal won
   */
  async notifyDealWon(request: ServiceRequest): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const managerEmails = this.getManagerEmails();

    // Notify AM with stage change
    const amTemplate = EmailTemplates.stageChanged(
      request,
      'Negotiation',
      'Won',
      'System'
    );
    results.push(await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body, undefined, {
      requestId: request.Id,
      emailType: 'deal_won',
      sentBy: 'System',
    }));

    // Notify managers with deal won details
    if (managerEmails.length > 0) {
      const { subject, body } = EmailTemplates.dealWon(request);
      results.push(await this.sendEmail(managerEmails, subject, body));
    }

    return results;
  }

  /**
   * Notify managers of deal lost
   */
  async notifyDealLost(request: ServiceRequest): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    const managerEmails = this.getManagerEmails();

    // Notify AM with stage change
    const amTemplate = EmailTemplates.stageChanged(
      request,
      request.FunnelStage === 'Lost' ? 'Negotiation' : request.FunnelStage,
      'Lost',
      'System'
    );
    results.push(await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body, undefined, {
      requestId: request.Id,
      emailType: 'deal_lost',
      sentBy: 'System',
    }));

    // Notify managers
    if (managerEmails.length > 0) {
      const { subject, body } = EmailTemplates.dealLost(request);
      results.push(await this.sendEmail(managerEmails, subject, body));
    }

    return results;
  }

  /**
   * Get calendar event description for discovery meeting
   */
  getCalendarEventDescription(request: ServiceRequest, service?: DWService): string {
    return EmailTemplates.calendarEventDescription(request, service);
  }

  // ==========================================================================
  // Product Request Notifications
  // ==========================================================================

  /**
   * Send all notifications for a new product request
   */
  async sendProductRequestCreatedNotifications(request: ProductRequest): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Notify AM
    const amTemplate = EmailTemplates.productRequestCreatedAM(request);
    results.push(await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body));

    // Notify managers
    const managerEmails = this.getManagerEmails();
    if (managerEmails.length > 0) {
      const managerTemplate = EmailTemplates.productRequestCreatedManager(request);
      results.push(await this.sendEmail(managerEmails, managerTemplate.subject, managerTemplate.body));
    }

    return results;
  }

  /**
   * Notify AM of product request status change
   */
  async notifyProductRequestStatusChanged(
    request: ProductRequest,
    previousStatus: string,
    newStatus: string
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.productRequestStatusChanged(request, previousStatus, newStatus);
    return this.sendEmail([request.AccountManagerEmail], subject, body);
  }

  /**
   * Notify managers of product request status change (N3)
   */
  async notifyProductRequestStatusChangedManagers(
    request: ProductRequest,
    previousStatus: string,
    newStatus: string
  ): Promise<NotificationResult> {
    const managerEmails = this.getManagerEmails();
    if (managerEmails.length === 0) {
      return { success: true };
    }
    const { subject, body } = EmailTemplates.productRequestStatusChangedManager(request, previousStatus, newStatus);
    return this.sendEmail(managerEmails, subject, body);
  }

  /**
   * Send specialist assignment notifications for product requests (N1)
   */
  async sendProductSpecialistAssignedNotifications(
    request: ProductRequest,
    specialistName: string,
    specialistEmail: string,
    specialistRole: string
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Notify AM
    const amTemplate = EmailTemplates.productSpecialistAssignedAM(
      request, specialistName, specialistEmail, specialistRole
    );
    results.push(await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body));

    // Notify specialist
    const specTemplate = EmailTemplates.productSpecialistAssignedSpecialist(request, specialistName);
    results.push(await this.sendEmail([specialistEmail], specTemplate.subject, specTemplate.body));

    return results;
  }

  /**
   * Notify previous specialist they've been reassigned (N2)
   */
  async notifySpecialistReassigned(
    entityType: 'Service Request' | 'Product Request',
    entityTitle: string,
    clientName: string,
    previousSpecialistName: string,
    previousSpecialistEmail: string,
    newSpecialistName: string
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.specialistReassigned(
      entityType, entityTitle, clientName, previousSpecialistName, newSpecialistName
    );
    return this.sendEmail([previousSpecialistEmail], subject, body);
  }

  /**
   * Notify managers of deal value/probability change (N4)
   */
  async notifyDealValueChanged(
    request: ServiceRequest,
    changes: { previousDealValue?: number; newDealValue?: number; previousProbability?: number; newProbability?: number; previousWeightedPipeline?: number; newWeightedPipeline?: number },
    changedBy: string
  ): Promise<NotificationResult> {
    const managerEmails = this.getManagerEmails();
    if (managerEmails.length === 0) {
      return { success: true };
    }
    const { subject, body } = EmailTemplates.dealValueChanged(request, changes, changedBy);
    return this.sendEmail(managerEmails, subject, body, undefined, {
      requestId: request.Id,
      emailType: 'deal_value_changed',
      sentBy: 'System',
    });
  }

  /**
   * Notify managers of calendar event creation failure (N5)
   */
  async notifyCalendarEventFailed(
    entityType: 'Service Request' | 'Product Request',
    entityTitle: string,
    clientName: string,
    confirmedSlot: string,
    accountManagerName: string
  ): Promise<NotificationResult> {
    const managerEmails = this.getManagerEmails();
    if (managerEmails.length === 0) {
      return { success: true };
    }
    const { subject, body } = EmailTemplates.calendarEventFailed(
      entityType, entityTitle, clientName, confirmedSlot, accountManagerName
    );
    return this.sendEmail(managerEmails, subject, body);
  }

  /**
   * Notify specialist of confirmed product demo/trial slot (N6)
   */
  async notifyProductDemoConfirmedSpecialist(
    request: ProductRequest,
    specialistName: string,
    specialistEmail: string,
    confirmedSlot: string
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.productDemoConfirmedSpecialist(
      request, specialistName, confirmedSlot
    );
    return this.sendEmail([specialistEmail], subject, body);
  }

  // ==========================================================================
  // Session Preparation Notifications
  // ==========================================================================

  /**
   * Notify specialist that session preparation has been created
   */
  async notifySessionPrepCreated(
    request: ServiceRequest,
    sessionPrep: SessionPreparation,
    confirmedSlot: string
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.sessionPrepCreated(request, sessionPrep, confirmedSlot);
    return this.sendEmail([sessionPrep.SpecialistEmail], subject, body);
  }

  /**
   * Send session preparation reminder to specialist
   */
  async notifySessionPrepReminder(
    request: ServiceRequest,
    sessionPrep: SessionPreparation,
    confirmedSlot: string,
    hoursUntilMeeting: number
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.sessionPrepReminder(
      request,
      sessionPrep,
      confirmedSlot,
      hoursUntilMeeting
    );
    return this.sendEmail([sessionPrep.SpecialistEmail], subject, body);
  }

  // ==========================================================================
  // New Notifications (v2.6.0)
  // ==========================================================================

  /**
   * Send welcome email to a newly added Account Manager
   */
  async notifyWelcomeAccountManager(
    name: string,
    email: string,
    region: string,
    source: string
  ): Promise<NotificationResult> {
    const { subject, body } = EmailTemplates.welcomeAccountManager(name, email, region, source);
    return this.sendEmail([email], subject, body);
  }

  /**
   * Send weekly pipeline digest to managers
   */
  async sendWeeklyPipelineDigest(
    weekLabel: string,
    kpis: { totalPipeline: number; weightedPipeline: number; winRate: number },
    activity: { newRequests: number; dealsWon: number; wonRevenue: number; dealsLost: number; lostRevenue: number; meetingsScheduled: number; productDemos: number },
    stageBreakdown: Array<{ stage: string; count: number; value: number }>,
    hotDeals: Array<{ client: string; service: string; value: number; stage: string }>
  ): Promise<NotificationResult> {
    const managerEmails = this.getManagerEmails();
    if (managerEmails.length === 0) {
      return { success: true };
    }
    const { subject, body } = EmailTemplates.weeklyPipelineDigest(
      weekLabel, kpis, activity, stageBreakdown, hotDeals
    );
    return this.sendEmail(managerEmails, subject, body);
  }

  // ==========================================================================
  // Proposal Notifications
  // ==========================================================================

  /**
   * Notify creator + AM that a proposal was created
   */
  async notifyProposalCreated(ctx: ProposalEmailContext): Promise<void> {
    try {
      const { subject, body } = EmailTemplates.proposalCreated(ctx);
      const recipients = [ctx.createdByEmail];
      if (ctx.accountManagerEmail && ctx.accountManagerEmail !== ctx.createdByEmail) {
        recipients.push(ctx.accountManagerEmail);
      }
      await this.sendEmail(recipients, subject, body);
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send proposal created notification:', error);
    }
  }

  /**
   * Notify all managers that a proposal is awaiting review
   */
  async notifyProposalSubmittedForReview(ctx: ProposalEmailContext): Promise<void> {
    try {
      const managerEmails = this.getManagerEmails();
      if (managerEmails.length === 0) return;
      const { subject, body } = EmailTemplates.proposalSubmittedForReview(ctx);
      await this.sendEmail(managerEmails, subject, body);
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send proposal submitted for review notification:', error);
    }
  }

  /**
   * Notify creator that revisions are requested on their proposal
   */
  async notifyProposalRevisionRequested(ctx: ProposalEmailContext): Promise<void> {
    try {
      const { subject, body } = EmailTemplates.proposalRevisionRequested(ctx);
      await this.sendEmail([ctx.createdByEmail], subject, body);
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send proposal revision requested notification:', error);
    }
  }

  /**
   * Notify creator + AM that a proposal was approved
   */
  async notifyProposalApproved(ctx: ProposalEmailContext): Promise<void> {
    try {
      const { subject, body } = EmailTemplates.proposalApproved(ctx);
      const recipients = [ctx.createdByEmail];
      if (ctx.accountManagerEmail && ctx.accountManagerEmail !== ctx.createdByEmail) {
        recipients.push(ctx.accountManagerEmail);
      }
      await this.sendEmail(recipients, subject, body);
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send proposal approved notification:', error);
    }
  }

  /**
   * Notify AM that proposal has been sent to the client
   */
  async notifyProposalSentToClient(ctx: ProposalEmailContext): Promise<void> {
    try {
      const { subject, body } = EmailTemplates.proposalSentToClient(ctx);
      await this.sendEmail([ctx.accountManagerEmail], subject, body);
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send proposal sent to client notification:', error);
    }
  }

  /**
   * Notify AM + creator + managers that proposal was accepted
   */
  async notifyProposalAccepted(ctx: ProposalEmailContext): Promise<void> {
    try {
      const { subject, body } = EmailTemplates.proposalAccepted(ctx);
      const recipients = new Set<string>();
      recipients.add(ctx.accountManagerEmail);
      recipients.add(ctx.createdByEmail);
      for (const email of this.getManagerEmails()) {
        recipients.add(email);
      }
      await this.sendEmail(Array.from(recipients), subject, body);
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send proposal accepted notification:', error);
    }
  }

  /**
   * Notify AM + creator + managers that proposal was declined
   */
  async notifyProposalDeclined(ctx: ProposalEmailContext): Promise<void> {
    try {
      const { subject, body } = EmailTemplates.proposalDeclined(ctx);
      const recipients = new Set<string>();
      recipients.add(ctx.accountManagerEmail);
      recipients.add(ctx.createdByEmail);
      for (const email of this.getManagerEmails()) {
        recipients.add(email);
      }
      await this.sendEmail(Array.from(recipients), subject, body);
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send proposal declined notification:', error);
    }
  }

  // ==========================================================================
  // Follow-Up Reminder Notifications
  // ==========================================================================

  /**
   * Send follow-up reminder to Account Manager about a stale deal
   */
  async notifyFollowUpReminderAM(
    request: ServiceRequest,
    urgency: { level: string; reason: string; daysSinceUpdate: number; daysOverdue?: number }
  ): Promise<NotificationResult> {
    try {
      const { subject, body } = EmailTemplates.followUpReminderAM(request, urgency);
      return await this.sendEmail([request.AccountManagerEmail], subject, body, undefined, {
        requestId: request.Id,
        emailType: 'follow_up_reminder',
        sentBy: 'System',
      });
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send follow-up reminder to AM:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send stale deal alert to all managers
   */
  async notifyFollowUpReminderManagers(
    request: ServiceRequest,
    urgency: { level: string; reason: string; daysSinceUpdate: number; daysOverdue?: number }
  ): Promise<NotificationResult> {
    try {
      const managers = this.getManagerEmails();
      if (managers.length === 0) return { success: false, error: 'No manager emails configured' };
      const { subject, body } = EmailTemplates.followUpReminderManager(request, urgency);
      return await this.sendEmail(managers, subject, body, undefined, {
        requestId: request.Id,
        emailType: 'follow_up_reminder',
        sentBy: 'System',
      });
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send stale deal alert to managers:', error);
      return { success: false, error: String(error) };
    }
  }
}

export const dwxNotificationService = new DWxNotificationService();
