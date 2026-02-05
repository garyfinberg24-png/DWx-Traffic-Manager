/**
 * NotificationService - Email notification service for booking events
 *
 * Sends formatted HTML emails for:
 * - Booking creation confirmation
 * - Booking approval notification
 * - Booking rejection notification
 * - Reschedule request notification
 * - Checklist reminders
 */

import { getGraphService } from './serviceFactory';
import { Booking } from '../types/Booking';
import { format } from 'date-fns';
import { config } from '../config/environmentConfig';
import { documentService, DocumentInfo } from './DocumentService';

// Get the appropriate graph service based on test mode
const graphService = getGraphService();

interface NotificationResult {
  success: boolean;
  error?: string;
  attachmentsFailed?: boolean;
}

class NotificationService {
  /**
   * Get manager emails from configuration
   * Falls back to empty array if not configured
   */
  private getManagerEmails(): string[] {
    const emails = config.notifications.managerEmails;
    if (emails.length === 0) {
      console.warn('No manager emails configured. Set VITE_MANAGER_EMAILS in environment');
    }
    return emails;
  }
  /**
   * Convert DocumentInfo to email attachment format
   */
  private formatAttachment(doc: DocumentInfo): {
    name: string;
    contentType: string;
    contentBytes: string;
  } {
    return {
      name: doc.name,
      contentType: doc.contentType,
      contentBytes: doc.contentBytes,
    };
  }

  /**
   * Build the shared email wrapper (compact-A layout)
   */
  private buildEmailWrapper(
    headerBg: string,
    iconHtml: string,
    title: string,
    subtitle: string,
    contentHtml: string,
    bandHtml?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"></head>
      <body style="margin: 0; padding: 20px; background-color: #f0f2f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

            <!-- Compact Header -->
            <div style="background: ${headerBg}; padding: 20px 24px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
                <td width="68" valign="middle">
                  <div style="width: 52px; height: 52px; background: white; border-radius: 50%; text-align: center; line-height: 52px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    ${iconHtml}
                  </div>
                </td>
                <td valign="middle">
                  <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">${title}</h1>
                  <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">${subtitle}</p>
                </td>
              </tr></table>
            </div>

            ${bandHtml || ''}

            <!-- Content -->
            <div style="padding: 28px 24px;">
              ${contentHtml}
            </div>

            <!-- Footer -->
            <div style="background: #1a1a1a; padding: 16px 24px; text-align: center;">
              <div style="color: rgba(255,255,255,0.6); font-size: 12px;">
                DWx Traffic Manager &bull; Automated Notification
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Build the 2x2 info grid used in most templates
   */
  private buildInfoGrid(cells: Array<{ label: string; value: string }>): string {
    let html = '<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">';
    for (let i = 0; i < cells.length; i += 2) {
      html += '<tr>';
      html += `<td style="padding: 14px; border: 1px solid #e8e8e8; width: 50%;">
        <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${cells[i].label}</div>
        <div style="font-size: 15px; font-weight: 600; color: #1a1a1a;">${cells[i].value}</div>
      </td>`;
      if (i + 1 < cells.length) {
        html += `<td style="padding: 14px; border: 1px solid #e8e8e8; width: 50%;">
          <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${cells[i + 1].label}</div>
          <div style="font-size: 15px; font-weight: 600; color: #1a1a1a;">${cells[i + 1].value}</div>
        </td>`;
      } else {
        html += `<td style="padding: 14px; border: 1px solid #e8e8e8; width: 50%;"></td>`;
      }
      html += '</tr>';
    }
    html += '</table>';
    return html;
  }

  /**
   * Build a notice card (icon + title + description)
   */
  private buildNoticeCard(
    bgGradient: string,
    iconBg: string,
    iconHtml: string,
    title: string,
    titleColor: string,
    description: string,
    descColor: string
  ): string {
    return `
      <div style="background: linear-gradient(135deg, ${bgGradient}); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="50" valign="top">
            <div style="width: 36px; height: 36px; background: ${iconBg}; border-radius: 8px; text-align: center; line-height: 36px;">
              ${iconHtml}
            </div>
          </td>
          <td valign="top">
            <div style="font-weight: 600; color: ${titleColor}; margin-bottom: 2px; font-size: 14px;">${title}</div>
            <div style="font-size: 13px; color: ${descColor};">${description}</div>
          </td>
        </tr></table>
      </div>
    `;
  }

  /**
   * Build a reason/alert box with left border accent
   */
  private buildReasonBox(bg: string, borderColor: string, titleColor: string, textColor: string, title: string, text: string): string {
    return `
      <div style="background: ${bg}; border-left: 4px solid ${borderColor}; border-radius: 0 12px 12px 0; padding: 16px; margin-bottom: 24px;">
        <div style="font-weight: 600; color: ${titleColor}; margin-bottom: 6px; font-size: 14px;">${title}</div>
        <div style="font-size: 14px; color: ${textColor};">${text}</div>
      </div>
    `;
  }

  /**
   * Build attachment cards
   */
  private buildAttachmentCards(attachments: Array<{ name: string; contentType: string }>): string {
    if (attachments.length === 0) return '';
    return attachments.map((a) => `
      <div style="background: #fafafa; border: 1px solid #e8e8e8; border-radius: 12px; padding: 14px; margin-bottom: 8px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="58" valign="middle">
            <div style="width: 44px; height: 44px; background: #dc3545; border-radius: 8px; text-align: center; line-height: 44px;">
              <span style="color: white; font-size: 22px;">&#128196;</span>
            </div>
          </td>
          <td valign="middle">
            <div style="font-weight: 600; color: #1a1a1a; margin-bottom: 2px; font-size: 14px;">${a.name}</div>
            <div style="font-size: 12px; color: #888;">${a.contentType.includes('pdf') ? 'PDF Document' : 'Document'}</div>
          </td>
        </tr></table>
      </div>
    `).join('');
  }

  /**
   * Format client name with optional premium badge
   */
  private formatClientName(clientName: string, isPremium: boolean): string {
    return `${clientName}${isPremium ? ' <span style="background: #ff9800; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 8px;">PREMIUM</span>' : ''}`;
  }

  /**
   * Send booking created confirmation to account manager
   * Automatically attaches the appropriate document based on booking type
   */
  async sendBookingCreatedNotification(
    booking: Booking,
    accountManagerEmail: string,
    additionalDocKeys: string[] = []
  ): Promise<NotificationResult> {
    let attachmentsFailed = false;

    try {
      const subject = `Booking Request Submitted: ${booking.ClientName} - ${booking.BookingType}`;

      // Get documents to attach based on booking type
      let attachments: Array<{ name: string; contentType: string; contentBytes: string }> = [];
      try {
        const documents = await documentService.getBookingDocuments(
          booking.BookingType,
          additionalDocKeys
        );
        attachments = documents.map(this.formatAttachment);
        console.log(`Attaching ${attachments.length} document(s) to booking notification`);
      } catch (docError) {
        console.warn('Failed to retrieve documents for attachment:', docError);
        attachmentsFailed = true;
      }

      const slotsHtml = `
        <div style="background: linear-gradient(135deg, #e8f4f6 0%, #d0ecf0 100%); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-weight: 600; color: #1e6b7b; margin-bottom: 10px; font-size: 14px;">Proposed Time Slots</div>
          <div style="background: white; border-radius: 8px; overflow: hidden;">
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 1</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot1), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 2</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot2), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
            <div style="padding: 10px 14px;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 3</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot3), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
          </div>
        </div>
      `;

      const commentsHtml = booking.Comments ? `
        <div style="background: #f5f5f5; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
          <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Comments</div>
          <div style="font-size: 14px; color: #333;">${booking.Comments}</div>
        </div>
      ` : '';

      const contentHtml = `
        ${this.buildInfoGrid([
          { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
          { label: 'Booking Type', value: booking.BookingType },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
          { label: 'Status', value: `<span style="color: #f7630c;">${booking.Status}</span>` },
        ])}
        ${commentsHtml}
        ${slotsHtml}
        ${this.buildNoticeCard(
          '#e3f2fd 0%, #bbdefb 100%', '#0078d4',
          '<span style="color: white; font-size: 18px;">&#128276;</span>',
          'What Happens Next', '#1565c0',
          'You will receive another notification once your booking has been reviewed and a time slot confirmed.', '#1976d2'
        )}
        ${this.buildAttachmentCards(attachments)}
      `;

      const bandHtml = `
        <div style="background: #fff4ce; border-bottom: 2px solid #f7630c; padding: 12px 24px; text-align: center;">
          <span style="font-size: 13px; font-weight: 700; color: #8b6914; text-transform: uppercase; letter-spacing: 1px;">Awaiting Approval</span>
        </div>
      `;

      const body = this.buildEmailWrapper(
        '#1e6b7b',
        '<span style="font-size: 26px; color: #f7630c;">&#9203;</span>',
        'Booking Request Submitted',
        'Pending Review &bull; DWx Traffic Manager',
        contentHtml,
        bandHtml
      );

      await graphService.sendEmail({
        to: [accountManagerEmail],
        subject,
        body,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      return { success: true, attachmentsFailed };
    } catch (error) {
      console.error('Failed to send booking created notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
        attachmentsFailed,
      };
    }
  }

  /**
   * Send booking approved notification to account manager
   * Also attaches relevant documents for the confirmed booking
   */
  async sendBookingApprovedNotification(
    booking: Booking,
    confirmedSlot: string,
    approverName: string,
    additionalDocKeys: string[] = []
  ): Promise<NotificationResult> {
    let attachmentsFailed = false;

    try {
      const subject = `✅ Booking Approved: ${booking.ClientName} - ${booking.BookingType}`;

      // Get documents to attach based on booking type
      let attachments: Array<{ name: string; contentType: string; contentBytes: string }> = [];
      try {
        const documents = await documentService.getBookingDocuments(
          booking.BookingType,
          additionalDocKeys
        );
        attachments = documents.map(this.formatAttachment);
        console.log(`Attaching ${attachments.length} document(s) to approval notification`);
      } catch (docError) {
        console.warn('Failed to retrieve documents for attachment:', docError);
        attachmentsFailed = true;
      }

      const confirmedDate = new Date(confirmedSlot);
      const formattedDate = format(confirmedDate, 'MMMM d, yyyy');
      const formattedDayTime = format(confirmedDate, "EEEE 'at' h:mm a");
      const dealValue = booking.DealValue ? `R ${Number(booking.DealValue).toLocaleString()}` : '';

      const deploymentChecklistHtml = booking.BookingType === 'Deployment' ? `
        <div style="background: #fff4ce; border-left: 4px solid #f7630c; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <div style="font-weight: 700; color: #8b6914; margin-bottom: 8px; font-size: 14px;">Deployment Readiness Checklist</div>
          <p style="margin: 0 0 12px; font-size: 13px; color: #616161;"><strong>Important:</strong> Please complete the following items at least 3 days before the deployment date.</p>
          <div style="background: white; padding: 12px; border-radius: 4px;">
            <div style="padding: 6px 0; border-bottom: 1px solid #e1e1e1;">&#9744; <strong>Bill of Materials Available</strong> - The BOM document has been prepared</div>
            <div style="padding: 6px 0; border-bottom: 1px solid #e1e1e1;">&#9744; <strong>Licenses Provisioned</strong> - All required licenses have been provisioned</div>
            <div style="padding: 6px 0; border-bottom: 1px solid #e1e1e1;">&#9744; <strong>Service Account Provisioned</strong> - Service account created with appropriate permissions</div>
            <div style="padding: 6px 0; border-bottom: 1px solid #e1e1e1;">&#9744; <strong>Environment Created</strong> - Deployment environment has been set up</div>
            <div style="padding: 6px 0;">&#9744; <strong>Power BI Workspace Created</strong> - Power BI workspace created and access granted</div>
          </div>
        </div>
      ` : '';

      const contentHtml = `
        <!-- Date/Time Hero -->
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Confirmed Date &amp; Time</div>
          <div style="font-size: 26px; font-weight: 700; color: #1a1a1a;">${formattedDate}</div>
          <div style="font-size: 16px; color: #0078d4; font-weight: 600; margin-top: 2px;">${formattedDayTime}</div>
        </div>

        ${this.buildInfoGrid([
          { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
          { label: 'Booking Type', value: booking.BookingType },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
          { label: 'Deal Value', value: dealValue || 'N/A' },
        ])}

        ${deploymentChecklistHtml}

        ${this.buildNoticeCard(
          '#e3f2fd 0%, #bbdefb 100%', '#0078d4',
          '<span style="color: white; font-size: 18px;">&#128197;</span>',
          'Calendar Invite Sent', '#1565c0',
          `A calendar invitation has been sent to your email. Please ensure you're prepared for the ${booking.BookingType.toLowerCase()}.`, '#1976d2'
        )}

        ${this.buildAttachmentCards(attachments)}
      `;

      const body = this.buildEmailWrapper(
        '#0078d4',
        '<span style="font-size: 26px; color: #00c853;">&#10004;</span>',
        'Booking Approved!',
        `Approved by ${approverName}`,
        contentHtml
      );

      await graphService.sendEmail({
        to: [booking.AccountManagerEmail],
        subject,
        body,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      return { success: true, attachmentsFailed };
    } catch (error) {
      console.error('Failed to send booking approved notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
        attachmentsFailed,
      };
    }
  }

  /**
   * Send booking rejected notification to account manager
   */
  async sendBookingRejectedNotification(
    booking: Booking,
    reason: string,
    rejecterName: string
  ): Promise<NotificationResult> {
    try {
      const subject = `❌ Booking Request Declined: ${booking.ClientName} - ${booking.BookingType}`;
      const dealValue = booking.DealValue ? `R ${Number(booking.DealValue).toLocaleString()}` : '';

      const contentHtml = `
        ${this.buildReasonBox('#fde7e9', '#d13438', '#a4262c', '#5c2d30', 'Reason for Decline', reason)}

        ${this.buildInfoGrid([
          { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
          { label: 'Booking Type', value: booking.BookingType },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
          { label: 'Deal Value', value: dealValue || 'N/A' },
        ])}

        ${this.buildNoticeCard(
          '#fce4ec 0%, #f8bbd0 100%', '#d13438',
          '<span style="color: white; font-size: 18px;">&#128172;</span>',
          'What You Can Do', '#a4262c',
          'If you believe this was declined in error or would like to discuss alternative arrangements, please contact your manager directly.', '#880e4f'
        )}
      `;

      const body = this.buildEmailWrapper(
        '#d13438',
        '<span style="font-size: 26px; color: #d13438;">&#10006;</span>',
        'Booking Request Declined',
        `Declined by ${rejecterName}`,
        contentHtml
      );

      await graphService.sendEmail({
        to: [booking.AccountManagerEmail],
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send booking rejected notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send reschedule notification to approvers
   */
  async sendBookingRescheduledNotification(
    booking: Booking,
    newSlots: { slot1: Date; slot2: Date; slot3: Date },
    previousSlots: { slot1?: string; slot2?: string; slot3?: string },
    reason: string,
    requestedBy: string
  ): Promise<NotificationResult> {
    try {
      const subject = `🔄 Reschedule Request: ${booking.ClientName} - ${booking.BookingType}`;

      // Get approver emails from configuration
      const approverEmails = this.getManagerEmails();

      const reasonHtml = reason ? this.buildReasonBox('#e8e8f4', '#6264a7', '#484aa8', '#3b3d73', 'Reason for Reschedule', reason) : '';

      const slotComparisonHtml = `
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 8px;">
              <div style="background: #f5f5f5; border-radius: 12px; padding: 14px; border-top: 3px solid #999;">
                <div style="font-weight: 600; color: #666; margin-bottom: 10px; font-size: 13px;">Previous Slots</div>
                ${previousSlots.slot1 ? `<div style="font-size: 13px; color: #888; padding: 6px 0; border-bottom: 1px solid #e0e0e0;">${format(new Date(previousSlots.slot1), "MMM d, yyyy h:mm a")}</div>` : ''}
                ${previousSlots.slot2 ? `<div style="font-size: 13px; color: #888; padding: 6px 0; border-bottom: 1px solid #e0e0e0;">${format(new Date(previousSlots.slot2), "MMM d, yyyy h:mm a")}</div>` : ''}
                ${previousSlots.slot3 ? `<div style="font-size: 13px; color: #888; padding: 6px 0;">${format(new Date(previousSlots.slot3), "MMM d, yyyy h:mm a")}</div>` : ''}
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 8px;">
              <div style="background: #ededf7; border-radius: 12px; padding: 14px; border-top: 3px solid #6264a7;">
                <div style="font-weight: 600; color: #6264a7; margin-bottom: 10px; font-size: 13px;">New Proposed Slots</div>
                <div style="font-size: 13px; color: #3b3d73; font-weight: 600; padding: 6px 0; border-bottom: 1px solid #d5d5e8;">${format(newSlots.slot1, "MMM d, yyyy h:mm a")}</div>
                <div style="font-size: 13px; color: #3b3d73; font-weight: 600; padding: 6px 0; border-bottom: 1px solid #d5d5e8;">${format(newSlots.slot2, "MMM d, yyyy h:mm a")}</div>
                <div style="font-size: 13px; color: #3b3d73; font-weight: 600; padding: 6px 0;">${format(newSlots.slot3, "MMM d, yyyy h:mm a")}</div>
              </div>
            </td>
          </tr>
        </table>
      `;

      const contentHtml = `
        ${reasonHtml}

        ${this.buildInfoGrid([
          { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
          { label: 'Booking Type', value: booking.BookingType },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
          { label: 'Account Manager', value: booking.AccountManagerName },
        ])}

        ${slotComparisonHtml}

        ${this.buildNoticeCard(
          '#ede7f6 0%, #d1c4e9 100%', '#6264a7',
          '<span style="color: white; font-size: 18px;">&#9989;</span>',
          'Action Required', '#4527a0',
          'Please review and approve one of the new proposed time slots in the DWx Traffic Manager dashboard.', '#5e35b1'
        )}
      `;

      const body = this.buildEmailWrapper(
        '#6264a7',
        '<span style="font-size: 26px; color: #6264a7;">&#128260;</span>',
        'Reschedule Request',
        `Requested by ${requestedBy}`,
        contentHtml
      );

      await graphService.sendEmail({
        to: approverEmails,
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send reschedule notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send booking cancelled notification to managers
   */
  async sendBookingCancelledNotification(
    booking: Booking,
    reason: string,
    cancellerName: string
  ): Promise<NotificationResult> {
    try {
      const subject = `🚫 Booking Cancelled: ${booking.ClientName} - ${booking.BookingType}`;

      // Notify managers about the cancellation
      const managerEmails = this.getManagerEmails();

      const gridCells: Array<{ label: string; value: string }> = [
        { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
        { label: 'Booking Type', value: booking.BookingType },
        { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
        { label: 'Account Manager', value: booking.AccountManagerName },
        { label: 'Previous Status', value: `<span style="color: #605e5c;">${booking.Status}</span>` },
      ];
      if (booking.ConfirmedDateTime) {
        gridCells.push({ label: 'Was Scheduled', value: `<span style="color: #605e5c;">${format(new Date(booking.ConfirmedDateTime), "MMM d, yyyy 'at' h:mm a")}</span>` });
      }

      const contentHtml = `
        ${this.buildReasonBox('#f3f2f1', '#605e5c', '#3b3a39', '#605e5c', 'Cancellation Reason', reason)}

        ${this.buildInfoGrid(gridCells)}

        ${this.buildNoticeCard(
          '#f3f2f1 0%, #e8e6e4 100%', '#605e5c',
          '<span style="color: white; font-size: 18px;">&#128197;</span>',
          'Calendar Event Removed', '#3b3a39',
          'The calendar event has been removed. No further action is required unless you wish to follow up with the account manager.', '#605e5c'
        )}
      `;

      const body = this.buildEmailWrapper(
        '#605e5c',
        '<span style="font-size: 26px; color: #605e5c;">&#128683;</span>',
        'Booking Cancelled',
        `Cancelled by ${cancellerName}`,
        contentHtml
      );

      await graphService.sendEmail({
        to: managerEmails,
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send booking cancelled notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send booking deleted notification to the AM and assigned specialist
   */
  async sendBookingDeletedNotification(
    booking: Booking,
    reason: string,
    deleterName: string
  ): Promise<NotificationResult> {
    try {
      const subject = `🗑️ Booking Deleted: ${booking.ClientName} - ${booking.BookingType}`;

      // Notify the account manager + assigned specialist (if any)
      const recipients: string[] = [booking.AccountManagerEmail];
      if (booking.AssignedSpecialistEmail && booking.AssignedSpecialistEmail !== booking.AccountManagerEmail) {
        recipients.push(booking.AssignedSpecialistEmail);
      }

      const gridCells: Array<{ label: string; value: string }> = [
        { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
        { label: 'Booking Type', value: booking.BookingType },
        { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
        { label: 'Account Manager', value: booking.AccountManagerName },
        { label: 'Previous Status', value: `<span style="color: #a4262c;">${booking.Status}</span>` },
      ];
      if (booking.AssignedSpecialistName) {
        gridCells.push({ label: 'Was Assigned To', value: `${booking.AssignedSpecialistName} (${booking.AssignedSpecialistRole || 'Specialist'})` });
      }

      const contentHtml = `
        ${this.buildReasonBox('#fde7e9', '#a4262c', '#a4262c', '#5c2d30', 'Reason for Deletion', reason)}

        ${this.buildInfoGrid(gridCells)}

        ${this.buildNoticeCard(
          '#fde7e9 0%, #f8c9cc 100%', '#a4262c',
          '<span style="color: white; font-size: 18px;">&#9888;</span>',
          'Permanently Removed', '#a4262c',
          'This booking has been permanently removed from the system. The calendar event (if any) has also been deleted. If this was done in error, please contact the administrator.', '#5c2d30'
        )}
      `;

      const bandHtml = `
        <div style="background: #fde7e9; border-bottom: 2px solid #a4262c; padding: 12px 24px; text-align: center;">
          <span style="font-size: 13px; font-weight: 700; color: #a4262c; text-transform: uppercase; letter-spacing: 1px;">&#9888; Permanent Deletion</span>
        </div>
      `;

      const body = this.buildEmailWrapper(
        '#a4262c',
        '<span style="font-size: 26px; color: #a4262c;">&#128465;</span>',
        'Booking Permanently Deleted',
        `Deleted by ${deleterName}`,
        contentHtml,
        bandHtml
      );

      await graphService.sendEmail({
        to: recipients,
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send booking deleted notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send specialist assigned notification to the assigned specialist
   */
  async sendSpecialistAssignedNotification(
    booking: Booking,
    specialistEmail: string,
    specialistName: string,
    specialistRole: 'Demo Specialist' | 'Developer',
    assignedByName: string
  ): Promise<NotificationResult> {
    try {
      const roleLabel = specialistRole === 'Demo Specialist' ? 'Demo' : 'Deployment';
      const subject = `📋 You've been assigned to a ${roleLabel}: ${booking.ClientName}`;

      const dateHeroHtml = booking.ConfirmedDateTime ? `
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">Scheduled Date &amp; Time</div>
          <div style="font-size: 26px; font-weight: 700; color: #1a1a1a;">${format(new Date(booking.ConfirmedDateTime), 'MMMM d, yyyy')}</div>
          <div style="font-size: 16px; color: #1e6b7b; font-weight: 600; margin-top: 2px;">${format(new Date(booking.ConfirmedDateTime), "EEEE 'at' h:mm a")}</div>
        </div>
      ` : `
        <div style="text-align: center; margin-bottom: 28px; background: #fff4ce; border-radius: 12px; padding: 16px;">
          <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">Status</div>
          <div style="font-size: 18px; font-weight: 700; color: #8b6914;">Awaiting Confirmation</div>
        </div>
      `;

      const proposedSlotsHtml = !booking.ConfirmedDateTime ? `
        <div style="background: linear-gradient(135deg, #e8f4f6 0%, #d0ecf0 100%); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-weight: 600; color: #1e6b7b; margin-bottom: 10px; font-size: 14px;">Proposed Time Slots</div>
          <div style="background: white; border-radius: 8px; overflow: hidden;">
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 1</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot1), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 2</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot2), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
            <div style="padding: 10px 14px;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 3</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot3), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
          </div>
        </div>
      ` : '';

      const gridCells: Array<{ label: string; value: string }> = [
        { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
        { label: 'Booking Type', value: booking.BookingType },
        { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
        { label: 'Account Manager', value: booking.AccountManagerName },
        { label: 'Status', value: `<span style="color: #1e6b7b;">${booking.Status}</span>` },
      ];

      const commentsHtml = booking.Comments ? `
        <div style="background: #f5f5f5; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
          <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Comments</div>
          <div style="font-size: 14px; color: #333;">${booking.Comments}</div>
        </div>
      ` : '';

      const contentHtml = `
        <p style="font-size: 15px; color: #333; margin: 0 0 20px;">Hi ${specialistName}, you've been assigned to handle the following ${booking.BookingType.toLowerCase()}:</p>

        ${dateHeroHtml}

        ${this.buildInfoGrid(gridCells)}

        ${commentsHtml}
        ${proposedSlotsHtml}

        ${this.buildNoticeCard(
          '#e8f4f6 0%, #d0ecf0 100%', '#1e6b7b',
          '<span style="color: white; font-size: 18px;">&#128197;</span>',
          'Calendar Invite', '#1e6b7b',
          `You can view this booking in the DWx Traffic Manager. ${booking.ConfirmedDateTime ? 'A calendar invite has been sent.' : 'You will be notified when the booking is confirmed.'}`, '#2d8a9c'
        )}
      `;

      const body = this.buildEmailWrapper(
        '#1e6b7b',
        '<span style="font-size: 26px; color: #1e6b7b;">&#128100;</span>',
        `New ${roleLabel} Assignment`,
        `Assigned by ${assignedByName}`,
        contentHtml
      );

      await graphService.sendEmail({
        to: [specialistEmail],
        cc: [booking.AccountManagerEmail], // CC the account manager
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send specialist assigned notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send checklist due reminder.
   * NOTE: This method is implemented but not yet triggered. A scheduler or
   * Power Automate flow is needed to call this based on ChecklistDueDate
   * proximity. See email mockup: email-mockups/state-08-checklist-due.html
   */
  async sendChecklistDueReminder(
    booking: Booking,
    daysUntilDue: number
  ): Promise<NotificationResult> {
    try {
      const isUrgent = daysUntilDue <= 1;
      const urgency = isUrgent ? '🚨 URGENT' : '⏰';
      const subject = `${urgency} Checklist Due: ${booking.ClientName} Deployment - ${daysUntilDue === 0 ? 'TODAY' : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining`}`;
      const headerBg = isUrgent ? '#d13438' : '#f7630c';
      const countdownColor = isUrgent ? '#d13438' : '#f7630c';

      const checklistHtml = `
        <div style="background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-weight: 600; color: #8b6914; margin-bottom: 10px; font-size: 14px;">Required Checklist Items</div>
          <div style="background: white; border-radius: 8px; overflow: hidden;">
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;"><span style="color: ${countdownColor};">&#9744;</span> <span style="font-weight: 600;">Bill of Materials Available</span></div>
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;"><span style="color: ${countdownColor};">&#9744;</span> <span style="font-weight: 600;">Licenses Provisioned</span></div>
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;"><span style="color: ${countdownColor};">&#9744;</span> <span style="font-weight: 600;">Service Account Provisioned</span></div>
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;"><span style="color: ${countdownColor};">&#9744;</span> <span style="font-weight: 600;">Environment Created</span></div>
            <div style="padding: 10px 14px;"><span style="color: ${countdownColor};">&#9744;</span> <span style="font-weight: 600;">Power BI Workspace Created</span></div>
          </div>
        </div>
      `;

      const contentHtml = `
        ${this.buildInfoGrid([
          { label: 'Client', value: booking.ClientName },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
        ])}

        ${checklistHtml}

        ${this.buildNoticeCard(
          '#fff3e0 0%, #ffe0b2 100%', headerBg,
          '<span style="color: white; font-size: 18px;">&#9889;</span>',
          'Action Required', '#e65100',
          'Please complete the checklist in DWx Traffic Manager to ensure a smooth deployment.', '#bf360c'
        )}
      `;

      const bandHtml = `
        <div style="background: ${isUrgent ? '#fde7e9' : '#fff4ce'}; border-bottom: 2px solid ${countdownColor}; padding: 16px 24px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: ${countdownColor};">${daysUntilDue === 0 ? 'Due Today!' : `${daysUntilDue} Day${daysUntilDue !== 1 ? 's' : ''} Remaining`}</div>
          <div style="font-size: 13px; color: ${isUrgent ? '#a4262c' : '#8b6914'}; margin-top: 2px;">Deployment: ${format(new Date(booking.ConfirmedDateTime!), "EEEE, MMMM d, yyyy")}</div>
        </div>
      `;

      const body = this.buildEmailWrapper(
        headerBg,
        `<span style="font-size: 26px; color: ${countdownColor};">&#9200;</span>`,
        'Checklist Reminder',
        'Deployment Readiness &bull; DWx Traffic Manager',
        contentHtml,
        bandHtml
      );

      await graphService.sendEmail({
        to: [booking.AccountManagerEmail],
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send checklist reminder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send checklist overdue notification.
   * NOTE: This method is implemented but not yet triggered. A scheduler or
   * Power Automate flow is needed to call this based on ChecklistDueDate.
   * See email mockup: email-mockups/state-09-checklist-overdue.html
   */
  async sendChecklistOverdueNotification(
    booking: Booking,
    daysOverdue: number
  ): Promise<NotificationResult> {
    try {
      const subject = `🚨 OVERDUE: Deployment Checklist for ${booking.ClientName} - ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} past due`;

      // Notify both AM and managers
      const managerEmails = this.getManagerEmails();
      const recipients = [
        booking.AccountManagerEmail,
        ...managerEmails,
      ];

      const contentHtml = `
        ${this.buildInfoGrid([
          { label: 'Client', value: booking.ClientName },
          { label: 'Account Manager', value: booking.AccountManagerName },
          { label: 'Deployment Date', value: `<span style="color: #d13438;">${format(new Date(booking.ConfirmedDateTime!), "MMM d, yyyy 'at' h:mm a")}</span>` },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
        ])}

        ${this.buildNoticeCard(
          '#fde7e9 0%, #f8c9cc 100%', '#d13438',
          '<span style="color: white; font-size: 18px;">&#9888;</span>',
          'Immediate Action Required', '#a4262c',
          'The deployment may need to be rescheduled if the checklist cannot be completed in time. Please complete the checklist immediately in DWx Traffic Manager.', '#5c2d30'
        )}
      `;

      const bandHtml = `
        <div style="background: #fde7e9; border-bottom: 2px solid #d13438; padding: 16px 24px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: #d13438;">${daysOverdue} Day${daysOverdue !== 1 ? 's' : ''} Overdue</div>
          <div style="font-size: 13px; color: #a4262c; margin-top: 2px;">The deployment readiness checklist has not been completed</div>
        </div>
      `;

      const body = this.buildEmailWrapper(
        '#d13438',
        '<span style="font-size: 26px; color: #d13438;">&#128680;</span>',
        'Checklist Overdue',
        'Immediate Action Required',
        contentHtml,
        bandHtml
      );

      await graphService.sendEmail({
        to: recipients,
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send checklist overdue notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send notification when all proposed slots have conflicts and new slots are needed
   */
  async sendSlotsUnavailableNotification(
    booking: Booking,
    managerName: string,
    conflictDetails?: string
  ): Promise<NotificationResult> {
    try {
      const subject = `⚠️ Time Slots Unavailable: ${booking.ClientName} - Please Propose New Times`;

      const unavailableSlotsHtml = `
        <div style="background: linear-gradient(135deg, #fde7e9 0%, #f8c9cc 100%); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-weight: 600; color: #a4262c; margin-bottom: 10px; font-size: 14px;">Unavailable Time Slots</div>
          <div style="background: white; border-radius: 8px; overflow: hidden;">
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;">
              <span style="color: #d13438; font-size: 14px;">&#10006;</span>
              <span style="font-size: 14px; color: #1a1a1a; margin-left: 8px;">${format(new Date(booking.ProposedSlot1), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
            </div>
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;">
              <span style="color: #d13438; font-size: 14px;">&#10006;</span>
              <span style="font-size: 14px; color: #1a1a1a; margin-left: 8px;">${format(new Date(booking.ProposedSlot2), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
            </div>
            <div style="padding: 10px 14px;">
              <span style="color: #d13438; font-size: 14px;">&#10006;</span>
              <span style="font-size: 14px; color: #1a1a1a; margin-left: 8px;">${format(new Date(booking.ProposedSlot3), "EEEE, MMMM d, yyyy 'at' h:mm a")}</span>
            </div>
          </div>
        </div>
      `;

      const contentHtml = `
        ${this.buildReasonBox('#fff4ce', '#f7630c', '#8b6914', '#6d5a10', 'Action Required', `${managerName} has reviewed your booking request and found that all three proposed time slots have scheduling conflicts.`)}

        ${this.buildInfoGrid([
          { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
          { label: 'Booking Type', value: booking.BookingType },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
        ])}

        ${unavailableSlotsHtml}

        ${conflictDetails ? `<p style="font-size: 14px; color: #333; margin-bottom: 20px;"><strong>Note from Manager:</strong> ${conflictDetails}</p>` : ''}

        ${this.buildNoticeCard(
          '#e8f4f6 0%, #d0ecf0 100%', '#1e6b7b',
          '<span style="color: white; font-size: 18px;">&#128197;</span>',
          'What to Do Next', '#1e6b7b',
          'Please log into the DWx Traffic Manager and reschedule this booking with three new proposed time slots. Once submitted, the booking will be reviewed again for approval.', '#2d8a9c'
        )}
      `;

      const body = this.buildEmailWrapper(
        '#f7630c',
        '<span style="font-size: 26px; color: #f7630c;">&#9888;</span>',
        'Time Slots Unavailable',
        `Reviewed by ${managerName}`,
        contentHtml
      );

      await graphService.sendEmail({
        to: [booking.AccountManagerEmail],
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send slots unavailable notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }
  /**
   * Send notification to account manager that a quote has been generated for their booking
   */
  async sendQuoteGeneratedNotification(
    booking: Booking,
    generatedByName: string
  ): Promise<NotificationResult> {
    try {
      const subject = `Quote Generated – ${booking.ClientName} (${booking.BookingType})`;

      const confirmedSlot = booking.ConfirmedDateTime
        ? format(new Date(booking.ConfirmedDateTime), "MMM d, yyyy 'at' h:mm a")
        : 'Not yet confirmed';

      const contentHtml = `
        <p style="font-size: 15px; color: #333; margin: 0 0 24px;">A quote has been initiated for one of your bookings.</p>

        ${this.buildInfoGrid([
          { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
          { label: 'Booking Type', value: booking.BookingType },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
          { label: 'Confirmed Slot', value: confirmedSlot },
        ])}

        ${this.buildNoticeCard(
          '#e3f2fd 0%, #bbdefb 100%', '#0078d4',
          '<span style="color: white; font-size: 18px;">&#128276;</span>',
          'What Happens Next', '#1565c0',
          'The quote is being prepared in the Quotations app. You will receive the finalised quote once it has been completed.', '#1976d2'
        )}
      `;

      const body = this.buildEmailWrapper(
        '#0078d4',
        '<span style="font-size: 26px; color: #0078d4;">&#128203;</span>',
        'Quote Generated',
        `Generated by ${generatedByName}`,
        contentHtml
      );

      await graphService.sendEmail({
        to: [booking.AccountManagerEmail],
        subject,
        body,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send quote generated notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  /**
   * Send new booking notification to ALL managers
   * Called when a new booking is submitted and needs review
   * Includes deep link to Approval Queue for quick access
   * Managers configured via VITE_MANAGER_EMAILS environment variable (comma-separated)
   */
  async sendNewBookingToManagersNotification(
    booking: Booking,
    submittedByName: string
  ): Promise<NotificationResult> {
    try {
      const managerEmails = this.getManagerEmails();
      if (managerEmails.length === 0) {
        console.warn('No manager emails configured - skipping manager notification');
        return { success: true };
      }

      const subject = `🆕 New Booking Request: ${booking.ClientName} - ${booking.BookingType}`;

      const slotsHtml = `
        <div style="background: linear-gradient(135deg, #e8f4f6 0%, #d0ecf0 100%); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-weight: 600; color: #1e6b7b; margin-bottom: 10px; font-size: 14px;">Proposed Time Slots</div>
          <div style="background: white; border-radius: 8px; overflow: hidden;">
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 1</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot1), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
            <div style="padding: 10px 14px; border-bottom: 1px solid #e8e8e8;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 2</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot2), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
            <div style="padding: 10px 14px;">
              <span style="color: #1e6b7b; font-weight: 600; font-size: 12px;">OPTION 3</span>
              <div style="font-size: 14px; font-weight: 600; color: #1a1a1a; margin-top: 2px;">${format(new Date(booking.ProposedSlot3), "EEEE, MMMM d, yyyy 'at' h:mm a")}</div>
            </div>
          </div>
        </div>
      `;

      const commentsHtml = booking.Comments ? `
        <div style="background: #f5f5f5; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
          <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">Comments</div>
          <div style="font-size: 14px; color: #333;">${booking.Comments}</div>
        </div>
      ` : '';

      // Deep link to the Dashboard Approval Queue
      const appUrl = 'https://wonderful-ocean-036cdeb10.4.azurestaticapps.net';
      const approvalQueueUrl = `${appUrl}/dashboard?tab=approvals&bookingId=${booking.Id}`;

      const actionButtonHtml = `
        <div style="text-align: center; margin: 24px 0;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${approvalQueueUrl}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" strokecolor="#1e6b7b" fillcolor="#1e6b7b">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Review in Approval Queue →</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${approvalQueueUrl}" style="display: inline-block; background-color: #1e6b7b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; font-family: Arial, sans-serif; mso-hide: all;">
            Review in Approval Queue &rarr;
          </a>
          <!--<![endif]-->
        </div>
      `;

      const contentHtml = `
        <p style="font-size: 15px; color: #333; margin: 0 0 24px;">A new booking request has been submitted and requires your review.</p>

        ${this.buildInfoGrid([
          { label: 'Client', value: this.formatClientName(booking.ClientName, booking.IsPremiumClient) },
          { label: 'Booking Type', value: booking.BookingType },
          { label: 'Licenses', value: booking.LicenseCount.toLocaleString() },
          { label: 'Account Manager', value: booking.AccountManagerName },
          { label: 'AM Email', value: booking.AccountManagerEmail },
          { label: 'Status', value: `<span style="color: #f7630c;">${booking.Status}</span>` },
        ])}

        ${commentsHtml}
        ${slotsHtml}

        ${actionButtonHtml}

        ${this.buildNoticeCard(
          '#fff3e0 0%, #ffe0b2 100%', '#f7630c',
          '<span style="color: white; font-size: 18px;">&#9889;</span>',
          'Action Required', '#e65100',
          'Click the button above to review this booking in the DWx Traffic Manager.', '#bf360c'
        )}
      `;

      const bandHtml = `
        <div style="background: #fff4ce; border-bottom: 2px solid #f7630c; padding: 12px 24px; text-align: center;">
          <span style="font-size: 13px; font-weight: 700; color: #8b6914; text-transform: uppercase; letter-spacing: 1px;">Requires Approval</span>
        </div>
      `;

      const body = this.buildEmailWrapper(
        '#1e6b7b',
        '<span style="font-size: 26px; color: #f7630c;">&#128229;</span>',
        'New Booking Request',
        `Submitted by ${submittedByName}`,
        contentHtml,
        bandHtml
      );

      await graphService.sendEmail({
        to: managerEmails,
        subject,
        body,
      });

      console.log(`New booking notification sent to ${managerEmails.length} manager(s)`);
      return { success: true };
    } catch (error) {
      console.error('Failed to send new booking notification to managers:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }
}

export const notificationService = new NotificationService();
