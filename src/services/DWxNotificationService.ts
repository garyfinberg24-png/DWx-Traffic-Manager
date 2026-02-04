/**
 * DWx Traffic Manager - Notification Service
 * Sends DW-branded email notifications for service request events
 */

import { getGraphService } from './serviceFactory';
import { ServiceRequest, FunnelStage, DWService } from '../types/ServiceRequest';
import { config } from '../config/environmentConfig';
import { EmailTemplates } from './EmailTemplates';

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
   * Send email via Graph API
   */
  private async sendEmail(
    toRecipients: string[],
    subject: string,
    htmlBody: string,
    ccRecipients?: string[]
  ): Promise<NotificationResult> {
    try {
      await graphService.sendEmail(toRecipients, subject, htmlBody, ccRecipients);
      console.log(`[DWxNotificationService] Email sent: ${subject}`);
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
    return this.sendEmail([request.AccountManagerEmail], subject, body);
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
    return this.sendEmail([request.AccountManagerEmail], subject, body);
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
    results.push(await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body));

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
    return this.sendEmail([request.AccountManagerEmail], subject, body);
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
    results.push(await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body));

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
    results.push(await this.sendEmail([request.AccountManagerEmail], amTemplate.subject, amTemplate.body));

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
}

export const dwxNotificationService = new DWxNotificationService();
