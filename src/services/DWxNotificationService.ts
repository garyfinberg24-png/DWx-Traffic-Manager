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
  // SLA Breach / At-Risk Notifications
  // ==========================================================================

  /**
   * Send SLA breach/at-risk alert to the Account Manager
   */
  async notifySLABreachAM(
    request: ServiceRequest,
    slaInfo: { status: 'at-risk' | 'breached'; daysInStage: number; targetDays: number; stage: string }
  ): Promise<NotificationResult> {
    try {
      const { subject, body } = EmailTemplates.slaBreachAlertAM(request, slaInfo);
      return await this.sendEmail([request.AccountManagerEmail], subject, body, undefined, {
        requestId: request.Id,
        emailType: 'sla_breach_alert',
        sentBy: 'System',
      });
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send SLA breach alert to AM:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send SLA breach/at-risk escalation alert to all managers
   */
  async notifySLABreachManagers(
    request: ServiceRequest,
    slaInfo: { status: 'at-risk' | 'breached'; daysInStage: number; targetDays: number; stage: string }
  ): Promise<NotificationResult> {
    try {
      const managers = this.getManagerEmails();
      if (managers.length === 0) return { success: false, error: 'No manager emails configured' };
      const { subject, body } = EmailTemplates.slaBreachAlertManagers(request, slaInfo);
      return await this.sendEmail(managers, subject, body, undefined, {
        requestId: request.Id,
        emailType: 'sla_breach_alert',
        sentBy: 'System',
      });
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send SLA breach alert to managers:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Send SLA alerts to both AM and managers for a breaching/at-risk deal
   */
  async sendSLAAlertNotifications(
    request: ServiceRequest,
    slaInfo: { status: 'at-risk' | 'breached'; daysInStage: number; targetDays: number; stage: string }
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];
    results.push(await this.notifySLABreachAM(request, slaInfo));
    results.push(await this.notifySLABreachManagers(request, slaInfo));
    return results;
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

  // ==========================================================================
  // Post-Mortem Notifications
  // ==========================================================================

  /**
   * Notify specialist that a post-mortem has been created for their closed deal
   */
  async notifyPostMortemCreated(
    specialistEmail: string,
    specialistName: string,
    clientName: string,
    serviceName: string,
    finalStage: string,
    dealValue?: number,
    requestId?: number
  ): Promise<void> {
    try {
      const htmlBody = EmailTemplates.postMortemCreated(
        specialistName, clientName, serviceName, finalStage, dealValue
      );
      const subject = `[DWx] Post-Mortem Created: ${clientName} - ${serviceName}`;
      await this.sendEmail([specialistEmail], subject, htmlBody, undefined,
        requestId ? { requestId, emailType: 'post_mortem_created' as EmailType, sentBy: 'System' } : undefined
      );
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send post-mortem created notification:', error);
    }
  }

  /**
   * Notify AM + specialist that a post-mortem review is complete
   */
  async notifyPostMortemReviewed(
    recipients: string[],
    recipientName: string,
    clientName: string,
    serviceName: string,
    reviewerName: string,
    managerNotes: string,
    actionItemCount: number,
    requestId?: number
  ): Promise<void> {
    try {
      const htmlBody = EmailTemplates.postMortemReviewed(
        recipientName, clientName, serviceName, reviewerName, managerNotes, actionItemCount
      );
      const subject = `[DWx] Post-Mortem Review Complete: ${clientName} - ${serviceName}`;
      await this.sendEmail(recipients, subject, htmlBody, undefined,
        requestId ? { requestId, emailType: 'post_mortem_reviewed' as EmailType, sentBy: 'System' } : undefined
      );
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send post-mortem reviewed notification:', error);
    }
  }

  /**
   * Notify assignee that an improvement action item has been assigned
   */
  async notifyActionItemAssigned(
    assigneeEmail: string,
    assigneeName: string,
    actionTitle: string,
    actionDescription: string,
    priority: string,
    category: string,
    clientName: string,
    serviceName: string,
    dueDate?: string,
    requestId?: number
  ): Promise<void> {
    try {
      const htmlBody = EmailTemplates.actionItemAssigned(
        assigneeName, actionTitle, actionDescription, priority, category, clientName, serviceName, dueDate
      );
      const subject = `[DWx] Action Item Assigned: ${actionTitle}`;
      await this.sendEmail([assigneeEmail], subject, htmlBody, undefined,
        requestId ? { requestId, emailType: 'action_item_assigned' as EmailType, sentBy: 'System' } : undefined
      );
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send action item assigned notification:', error);
    }
  }

  /**
   * Notify all managers of AM accountability issues identified in a post-mortem
   */
  async notifyAMAccountabilityAlert(
    amName: string,
    amEmail: string,
    clientName: string,
    serviceName: string,
    finalStage: string,
    issueCount: number,
    dealValue?: number,
    requestId?: number
  ): Promise<void> {
    try {
      const managerEmails = this.getManagerEmails();
      if (managerEmails.length === 0) return;
      const htmlBody = EmailTemplates.amAccountabilityAlert(
        'Manager', amName, amEmail, clientName, serviceName, finalStage, issueCount, dealValue
      );
      const subject = `[DWx] AM Accountability Alert: ${clientName} - ${serviceName}`;
      await this.sendEmail(managerEmails, subject, htmlBody, undefined,
        requestId ? { requestId, emailType: 'am_accountability_alert' as EmailType, sentBy: 'System' } : undefined
      );
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send AM accountability alert:', error);
    }
  }
  // ==========================================================================
  // Delivery Handover Notifications
  // ==========================================================================

  /**
   * Notify AM + specialist that a delivery handover has been created (on Won)
   */
  async notifyHandoverCreated(request: ServiceRequest): Promise<void> {
    try {
      // Notify AM
      const amTemplate = EmailTemplates.handoverCreated(
        request.AccountManagerName,
        request.ClientName,
        request.ServiceName,
        request.DealValue,
        request.AssignedSpecialistName
      );
      await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body, undefined, {
        requestId: request.Id,
        emailType: 'handover_created',
        sentBy: 'System',
      });

      // Notify specialist if assigned
      if (request.AssignedSpecialistEmail && request.AssignedSpecialistName) {
        const specTemplate = EmailTemplates.handoverCreated(
          request.AssignedSpecialistName,
          request.ClientName,
          request.ServiceName,
          request.DealValue,
          request.AssignedSpecialistName
        );
        await this.sendEmail([request.AssignedSpecialistEmail], specTemplate.subject, specTemplate.body);
      }
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send handover created notification:', error);
    }
  }

  /**
   * Notify delivery team members when assigned to a handover
   */
  async notifyDeliveryTeamAssigned(
    members: Array<{ email: string; name: string; role: string }>,
    clientName: string,
    serviceName: string,
    projectManagerName?: string,
    kickoffDate?: string,
    dealValue?: number,
    requestId?: number
  ): Promise<void> {
    try {
      for (const member of members) {
        const { subject, body } = EmailTemplates.deliveryTeamAssigned(
          member.name,
          member.role,
          clientName,
          serviceName,
          projectManagerName,
          kickoffDate,
          dealValue
        );
        await this.sendEmail([member.email], subject, body, undefined,
          requestId ? { requestId, emailType: 'delivery_team_assigned' as EmailType, sentBy: 'System' } : undefined
        );
      }
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send delivery team assigned notifications:', error);
    }
  }

  /**
   * Notify all stakeholders when kickoff meeting is scheduled
   */
  async notifyHandoverMeetingScheduled(
    recipients: string[],
    recipientNames: string[],
    clientName: string,
    serviceName: string,
    meetingDate: string,
    meetingLink?: string,
    attendeeNames: string[] = [],
    requestId?: number
  ): Promise<void> {
    try {
      for (let i = 0; i < recipients.length; i++) {
        const recipientName = recipientNames[i] || recipients[i];
        const { subject, body } = EmailTemplates.handoverMeetingScheduled(
          recipientName,
          clientName,
          serviceName,
          meetingDate,
          meetingLink,
          attendeeNames
        );
        await this.sendEmail([recipients[i]], subject, body, undefined,
          requestId ? { requestId, emailType: 'handover_meeting_scheduled' as EmailType, sentBy: 'System' } : undefined
        );
      }
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send handover meeting scheduled notifications:', error);
    }
  }

  /**
   * Notify stakeholders when handover is marked as Delivered
   */
  async notifyHandoverComplete(
    recipients: string[],
    clientName: string,
    serviceName: string,
    deliveryManagerName?: string,
    handoverDays: number = 0,
    requestId?: number
  ): Promise<void> {
    try {
      for (const email of recipients) {
        const { subject, body } = EmailTemplates.handoverComplete(
          email, // Use email as fallback recipient name (individual personalised emails not needed here)
          clientName,
          serviceName,
          deliveryManagerName,
          handoverDays
        );
        await this.sendEmail([email], subject, body, undefined,
          requestId ? { requestId, emailType: 'handover_complete' as EmailType, sentBy: 'System' } : undefined
        );
      }
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send handover complete notifications:', error);
    }
  }

  /**
   * Notify managers when a handover exceeds 14 days without progressing
   */
  async notifyHandoverAtRisk(
    clientName: string,
    serviceName: string,
    amName: string,
    daysSinceWon: number,
    currentStatus: string,
    dealValue?: number,
    requestId?: number
  ): Promise<void> {
    try {
      const managerEmails = this.getManagerEmails();
      if (managerEmails.length === 0) return;

      for (const managerEmail of managerEmails) {
        const { subject, body } = EmailTemplates.handoverAtRisk(
          'Manager',
          clientName,
          serviceName,
          amName,
          daysSinceWon,
          currentStatus,
          dealValue
        );
        await this.sendEmail([managerEmail], subject, body, undefined,
          requestId ? { requestId, emailType: 'handover_at_risk' as EmailType, sentBy: 'System' } : undefined
        );
      }
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send handover at risk notifications:', error);
    }
  }

  /**
   * Send delivery kickoff reminder 24h before scheduled meeting
   */
  async notifyDeliveryKickoffReminder(
    recipients: string[],
    clientName: string,
    serviceName: string,
    kickoffDate: string,
    meetingLink?: string,
    requestId?: number
  ): Promise<void> {
    try {
      for (const email of recipients) {
        const { subject, body } = EmailTemplates.deliveryKickoffReminder(
          email, // Use email as fallback name
          clientName,
          serviceName,
          kickoffDate,
          meetingLink
        );
        await this.sendEmail([email], subject, body, undefined,
          requestId ? { requestId, emailType: 'delivery_kickoff_reminder' as EmailType, sentBy: 'System' } : undefined
        );
      }
    } catch (error) {
      console.error('[DWxNotificationService] Failed to send delivery kickoff reminder notifications:', error);
    }
  }
}

export const dwxNotificationService = new DWxNotificationService();
