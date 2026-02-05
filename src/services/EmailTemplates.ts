/**
 * DWx Traffic Manager - Email Templates
 * Digital Workplace branded email templates for notifications
 */

import { ServiceRequest, FunnelStage, DWService } from '../types/ServiceRequest';
import { ProductRequest } from '../types/ProductRequest';
import { SessionPreparation } from '../types/SessionPreparation';
import { format } from 'date-fns';

// DW Brand Colors
const DW_COLORS = {
  primary: '#1e6b7b',      // Teal - Primary brand
  secondary: '#2d8a9c',    // Light teal
  accent: '#107c10',       // Green - Success
  warning: '#f7630c',      // Orange - Warning
  danger: '#d13438',       // Red - Error/Lost
  text: '#242424',         // Dark text
  textLight: '#616161',    // Light text
  background: '#f5f5f5',   // Light background
  white: '#ffffff',
};

// Common email styles
const emailStyles = `
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: ${DW_COLORS.background}; }
  .email-container { max-width: 600px; margin: 0 auto; background-color: ${DW_COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, ${DW_COLORS.primary} 0%, ${DW_COLORS.secondary} 100%); padding: 24px 32px; color: white; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
  .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.9; }
  .content { padding: 32px; }
  .content h2 { color: ${DW_COLORS.text}; font-size: 18px; margin: 0 0 16px; }
  .content p { color: ${DW_COLORS.textLight}; line-height: 1.6; margin: 0 0 16px; }
  .info-box { background-color: ${DW_COLORS.background}; border-radius: 8px; padding: 20px; margin: 20px 0; }
  .info-row { display: flex; margin-bottom: 12px; }
  .info-label { font-weight: 600; color: ${DW_COLORS.text}; min-width: 140px; }
  .info-value { color: ${DW_COLORS.textLight}; }
  .stage-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  .stage-lead { background-color: #e5e7eb; color: #4b5563; }
  .stage-qualified { background-color: #dbeafe; color: #1d4ed8; }
  .stage-discovery { background-color: #ede9fe; color: #7c3aed; }
  .stage-proposal { background-color: #fef3c7; color: #b45309; }
  .stage-negotiation { background-color: #fce7f3; color: #db2777; }
  .stage-won { background-color: #d1fae5; color: #059669; }
  .stage-lost { background-color: #fee2e2; color: #dc2626; }
  .interest-hot { color: ${DW_COLORS.danger}; }
  .interest-warm { color: ${DW_COLORS.warning}; }
  .interest-cold { color: ${DW_COLORS.textLight}; }
  .cta-button { display: inline-block; padding: 12px 24px; background-color: ${DW_COLORS.primary}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 16px; }
  .cta-button:hover { background-color: ${DW_COLORS.secondary}; }
  .footer { padding: 24px 32px; background-color: ${DW_COLORS.background}; border-top: 1px solid #e1e1e1; text-align: center; }
  .footer p { color: ${DW_COLORS.textLight}; font-size: 12px; margin: 0; }
  .footer a { color: ${DW_COLORS.primary}; text-decoration: none; }
  .time-slots { margin: 16px 0; }
  .time-slot { padding: 12px 16px; background-color: ${DW_COLORS.background}; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid ${DW_COLORS.primary}; }
  .time-slot.confirmed { border-left-color: ${DW_COLORS.accent}; background-color: #d1fae5; }
  .deal-value { font-size: 24px; font-weight: 700; color: ${DW_COLORS.accent}; }
`;

/**
 * Get stage badge class
 */
const getStageBadgeClass = (stage: FunnelStage): string => {
  return `stage-badge stage-${stage.toLowerCase()}`;
};

/**
 * Format currency in ZAR
 */
const formatCurrency = (value?: number): string => {
  if (!value) return 'Not specified';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(value);
};

/**
 * Format date/time
 */
const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return 'Not specified';
  try {
    return format(new Date(dateStr), 'EEEE, MMMM d, yyyy \'at\' h:mm a');
  } catch {
    return 'Invalid date';
  }
};

/**
 * Email wrapper with DW branding
 */
const wrapEmail = (title: string, subtitle: string, content: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${emailStyles}</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Digital Workplace</h1>
      <p>${subtitle}</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>This is an automated message from <a href="#">DWx Traffic Manager</a></p>
      <p style="margin-top: 8px;">&copy; ${new Date().getFullYear()} Digital Workplace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// ============================================================================
// Email Templates
// ============================================================================

/**
 * New service request submitted - sent to AM
 */
export const requestCreatedAM = (request: ServiceRequest): { subject: string; body: string } => {
  const content = `
    <h2>Your Service Request Has Been Submitted</h2>
    <p>Hi ${request.AccountManagerName},</p>
    <p>Your service request for <strong>${request.ClientName}</strong> has been successfully submitted and is now in the sales pipeline.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (${request.ContactEmail})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Stage:</span>
        <span class="info-value"><span class="${getStageBadgeClass(request.FunnelStage)}">${request.FunnelStage}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Interest Level:</span>
        <span class="info-value interest-${request.InterestLevel.toLowerCase()}">${request.InterestLevel === 'Hot' ? '🔥 ' : request.InterestLevel === 'Warm' ? '☀️ ' : '❄️ '}${request.InterestLevel}</span>
      </div>
      ${request.DealValue ? `
      <div class="info-row">
        <span class="info-label">Deal Value:</span>
        <span class="info-value deal-value">${formatCurrency(request.DealValue)}</span>
      </div>
      ` : ''}
    </div>

    <p><strong>Proposed Discovery Meeting Times:</strong></p>
    <div class="time-slots">
      <div class="time-slot">Option 1: ${formatDateTime(request.ProposedSlot1)}</div>
      ${request.ProposedSlot2 ? `<div class="time-slot">Option 2: ${formatDateTime(request.ProposedSlot2)}</div>` : ''}
      ${request.ProposedSlot3 ? `<div class="time-slot">Option 3: ${formatDateTime(request.ProposedSlot3)}</div>` : ''}
    </div>

    <p>Our pre-sales team will review your request and a specialist will be assigned shortly.</p>
  `;

  return {
    subject: `[DWx] Service Request Submitted: ${request.ServiceName} for ${request.ClientName}`,
    body: wrapEmail('Service Request Submitted', 'DWx Traffic Manager', content),
  };
};

/**
 * New service request - sent to managers
 */
export const requestCreatedManager = (request: ServiceRequest): { subject: string; body: string } => {
  const content = `
    <h2>New Service Request Requires Action</h2>
    <p>A new service request has been submitted and requires your attention.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Manager:</span>
        <span class="info-value">${request.AccountManagerName} (${request.AccountManagerEmail})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Interest Level:</span>
        <span class="info-value interest-${request.InterestLevel.toLowerCase()}">${request.InterestLevel === 'Hot' ? '🔥 ' : request.InterestLevel === 'Warm' ? '☀️ ' : '❄️ '}${request.InterestLevel}</span>
      </div>
      ${request.DealValue ? `
      <div class="info-row">
        <span class="info-label">Deal Value:</span>
        <span class="info-value deal-value">${formatCurrency(request.DealValue)}</span>
      </div>
      ` : ''}
      ${request.DealProbability ? `
      <div class="info-row">
        <span class="info-label">Win Probability:</span>
        <span class="info-value">${request.DealProbability}%</span>
      </div>
      ` : ''}
    </div>

    ${request.Requirements ? `
    <p><strong>Requirements:</strong></p>
    <p style="background-color: ${DW_COLORS.background}; padding: 12px; border-radius: 6px;">${request.Requirements}</p>
    ` : ''}

    <p><strong>Proposed Discovery Meeting Times:</strong></p>
    <div class="time-slots">
      <div class="time-slot">Option 1: ${formatDateTime(request.ProposedSlot1)}</div>
      ${request.ProposedSlot2 ? `<div class="time-slot">Option 2: ${formatDateTime(request.ProposedSlot2)}</div>` : ''}
      ${request.ProposedSlot3 ? `<div class="time-slot">Option 3: ${formatDateTime(request.ProposedSlot3)}</div>` : ''}
    </div>

    <p><strong>Actions Required:</strong></p>
    <ul>
      <li>Review the request details</li>
      <li>Assign a specialist</li>
      <li>Confirm a meeting time slot</li>
    </ul>
  `;

  return {
    subject: `[DWx] 🆕 New Request: ${request.ServiceName} - ${request.ClientName} (${request.InterestLevel})`,
    body: wrapEmail('New Service Request', 'Action Required', content),
  };
};

/**
 * Specialist assigned notification - sent to AM
 */
export const specialistAssignedAM = (
  request: ServiceRequest,
  specialistName: string,
  specialistEmail: string,
  specialistRole: string
): { subject: string; body: string } => {
  const content = `
    <h2>Specialist Assigned to Your Request</h2>
    <p>Hi ${request.AccountManagerName},</p>
    <p>Great news! A specialist has been assigned to your service request for <strong>${request.ClientName}</strong>.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Specialist:</span>
        <span class="info-value"><strong>${specialistName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Role:</span>
        <span class="info-value">${specialistRole}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value"><a href="mailto:${specialistEmail}">${specialistEmail}</a></span>
      </div>
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Current Stage:</span>
        <span class="info-value"><span class="${getStageBadgeClass(request.FunnelStage)}">${request.FunnelStage}</span></span>
      </div>
    </div>

    <p>The specialist will reach out to schedule the discovery meeting. You can also contact them directly if needed.</p>
  `;

  return {
    subject: `[DWx] Specialist Assigned: ${specialistName} for ${request.ClientName}`,
    body: wrapEmail('Specialist Assigned', 'DWx Traffic Manager', content),
  };
};

/**
 * Specialist assigned notification - sent to specialist
 */
export const specialistAssignedSpecialist = (
  request: ServiceRequest,
  specialistName: string
): { subject: string; body: string } => {
  const content = `
    <h2>You've Been Assigned a New Request</h2>
    <p>Hi ${specialistName},</p>
    <p>You have been assigned to a new service request. Please review the details below and schedule a discovery meeting with the client.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value"><strong>${request.ServiceName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (<a href="mailto:${request.ContactEmail}">${request.ContactEmail}</a>)</span>
      </div>
      ${request.ContactPhone ? `
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">${request.ContactPhone}</span>
      </div>
      ` : ''}
      <div class="info-row">
        <span class="info-label">Interest Level:</span>
        <span class="info-value interest-${request.InterestLevel.toLowerCase()}">${request.InterestLevel === 'Hot' ? '🔥 ' : request.InterestLevel === 'Warm' ? '☀️ ' : '❄️ '}${request.InterestLevel}</span>
      </div>
      ${request.DealValue ? `
      <div class="info-row">
        <span class="info-label">Deal Value:</span>
        <span class="info-value deal-value">${formatCurrency(request.DealValue)}</span>
      </div>
      ` : ''}
    </div>

    <p><strong>Account Manager:</strong> ${request.AccountManagerName} (<a href="mailto:${request.AccountManagerEmail}">${request.AccountManagerEmail}</a>)</p>

    ${request.Requirements ? `
    <p><strong>Client Requirements:</strong></p>
    <p style="background-color: ${DW_COLORS.background}; padding: 12px; border-radius: 6px;">${request.Requirements}</p>
    ` : ''}

    <p><strong>Proposed Meeting Times (Client's Preference):</strong></p>
    <div class="time-slots">
      <div class="time-slot">Option 1: ${formatDateTime(request.ProposedSlot1)}</div>
      ${request.ProposedSlot2 ? `<div class="time-slot">Option 2: ${formatDateTime(request.ProposedSlot2)}</div>` : ''}
      ${request.ProposedSlot3 ? `<div class="time-slot">Option 3: ${formatDateTime(request.ProposedSlot3)}</div>` : ''}
    </div>

    <p>Please confirm one of the proposed slots or coordinate with the Account Manager to find an alternative time.</p>
  `;

  return {
    subject: `[DWx] 📋 New Assignment: ${request.ServiceName} for ${request.ClientName}`,
    body: wrapEmail('New Assignment', 'Action Required', content),
  };
};

/**
 * Discovery meeting confirmed - sent to all parties
 */
export const discoveryConfirmed = (
  request: ServiceRequest,
  recipientName: string,
  confirmedSlot: string
): { subject: string; body: string } => {
  const content = `
    <h2>Discovery Meeting Confirmed</h2>
    <p>Hi ${recipientName},</p>
    <p>The discovery meeting for <strong>${request.ClientName}</strong> has been confirmed.</p>

    <div class="info-box" style="border-left: 4px solid ${DW_COLORS.accent};">
      <div class="info-row">
        <span class="info-label">Date & Time:</span>
        <span class="info-value"><strong>${formatDateTime(confirmedSlot)}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (${request.ContactEmail})</span>
      </div>
      ${request.AssignedSpecialistName ? `
      <div class="info-row">
        <span class="info-label">Specialist:</span>
        <span class="info-value">${request.AssignedSpecialistName}</span>
      </div>
      ` : ''}
    </div>

    <p>A calendar invite has been sent to all participants. Please ensure you're prepared for the meeting.</p>

    <p><strong>Meeting Preparation Checklist:</strong></p>
    <ul>
      <li>Review client requirements and background</li>
      <li>Prepare relevant case studies or demos</li>
      <li>Test your audio/video setup</li>
      <li>Have pricing information ready if needed</li>
    </ul>
  `;

  return {
    subject: `[DWx] ✅ Meeting Confirmed: ${request.ServiceName} - ${request.ClientName}`,
    body: wrapEmail('Meeting Confirmed', 'DWx Traffic Manager', content),
  };
};

/**
 * Stage changed notification - sent to AM
 */
export const stageChanged = (
  request: ServiceRequest,
  previousStage: FunnelStage,
  newStage: FunnelStage,
  changedBy: string
): { subject: string; body: string } => {
  const isProgress = ['Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won'].indexOf(newStage) >
    ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation'].indexOf(previousStage);

  const content = `
    <h2>Request Stage Updated</h2>
    <p>Hi ${request.AccountManagerName},</p>
    <p>Your service request for <strong>${request.ClientName}</strong> has ${isProgress ? 'progressed' : 'moved'} in the pipeline.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Previous Stage:</span>
        <span class="info-value"><span class="${getStageBadgeClass(previousStage)}">${previousStage}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">New Stage:</span>
        <span class="info-value"><span class="${getStageBadgeClass(newStage)}">${newStage}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Updated By:</span>
        <span class="info-value">${changedBy}</span>
      </div>
    </div>

    ${newStage === 'Won' ? `
    <p style="font-size: 18px; color: ${DW_COLORS.accent};">🎉 <strong>Congratulations on closing this deal!</strong></p>
    ` : newStage === 'Lost' ? `
    <p>We're sorry this opportunity didn't work out. The learnings from this will help us improve.</p>
    ` : `
    <p>Keep up the momentum! The deal is progressing well.</p>
    `}
  `;

  const emoji = newStage === 'Won' ? '🏆' : newStage === 'Lost' ? '❌' : isProgress ? '📈' : '📉';

  return {
    subject: `[DWx] ${emoji} Stage Update: ${request.ClientName} moved to ${newStage}`,
    body: wrapEmail('Stage Update', 'DWx Traffic Manager', content),
  };
};

/**
 * Deal won notification - sent to managers
 */
export const dealWon = (request: ServiceRequest): { subject: string; body: string } => {
  const content = `
    <h2>🏆 Deal Won!</h2>
    <p>Great news! A deal has been closed successfully.</p>

    <div class="info-box" style="border-left: 4px solid ${DW_COLORS.accent};">
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value"><strong>${request.ClientName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Manager:</span>
        <span class="info-value">${request.AccountManagerName}</span>
      </div>
      ${request.AssignedSpecialistName ? `
      <div class="info-row">
        <span class="info-label">Specialist:</span>
        <span class="info-value">${request.AssignedSpecialistName}</span>
      </div>
      ` : ''}
      ${request.DealValue ? `
      <div class="info-row">
        <span class="info-label">Deal Value:</span>
        <span class="info-value deal-value">${formatCurrency(request.DealValue)}</span>
      </div>
      ` : ''}
    </div>

    ${request.WinLossReason ? `
    <p><strong>Win Reason:</strong></p>
    <p style="background-color: #d1fae5; padding: 12px; border-radius: 6px; color: #059669;">${request.WinLossReason}</p>
    ` : ''}

    <p>Next steps: Transition to delivery team and initiate project kickoff.</p>
  `;

  return {
    subject: `[DWx] 🏆 DEAL WON: ${request.ClientName} - ${request.ServiceName} (${formatCurrency(request.DealValue)})`,
    body: wrapEmail('Deal Won', 'Congratulations!', content),
  };
};

/**
 * Deal lost notification - sent to managers
 */
export const dealLost = (request: ServiceRequest): { subject: string; body: string } => {
  const content = `
    <h2>Deal Lost</h2>
    <p>Unfortunately, a deal has been marked as lost.</p>

    <div class="info-box" style="border-left: 4px solid ${DW_COLORS.danger};">
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value"><strong>${request.ClientName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Manager:</span>
        <span class="info-value">${request.AccountManagerName}</span>
      </div>
      ${request.DealValue ? `
      <div class="info-row">
        <span class="info-label">Deal Value:</span>
        <span class="info-value" style="text-decoration: line-through;">${formatCurrency(request.DealValue)}</span>
      </div>
      ` : ''}
    </div>

    ${request.WinLossReason ? `
    <p><strong>Loss Reason:</strong></p>
    <p style="background-color: #fee2e2; padding: 12px; border-radius: 6px; color: #dc2626;">${request.WinLossReason}</p>
    ` : ''}

    <p>Consider scheduling a post-mortem to capture learnings and identify improvement opportunities.</p>
  `;

  return {
    subject: `[DWx] ❌ Deal Lost: ${request.ClientName} - ${request.ServiceName}`,
    body: wrapEmail('Deal Lost', 'Pipeline Update', content),
  };
};

/**
 * Calendar event description template
 */
export const calendarEventDescription = (
  request: ServiceRequest,
  service?: DWService
): string => {
  return `
Discovery Meeting - ${request.ServiceName}

CLIENT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company: ${request.ClientName}
Contact: ${request.ContactName}
Email: ${request.ContactEmail}
${request.ContactPhone ? `Phone: ${request.ContactPhone}` : ''}
${request.Industry ? `Industry: ${request.Industry}` : ''}
${request.CompanySize ? `Company Size: ${request.CompanySize}` : ''}

SERVICE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service: ${request.ServiceName}
${service?.Description ? `Description: ${service.Description}` : ''}

DEAL INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Interest Level: ${request.InterestLevel}
${request.DealValue ? `Estimated Value: ${formatCurrency(request.DealValue)}` : ''}
${request.Budget ? `Client Budget: ${request.Budget}` : ''}
${request.Timeline ? `Client Timeline: ${request.Timeline}` : ''}

${request.Requirements ? `
REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${request.Requirements}
` : ''}

TEAM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account Manager: ${request.AccountManagerName} (${request.AccountManagerEmail})
${request.AssignedSpecialistName ? `Specialist: ${request.AssignedSpecialistName} (${request.AssignedSpecialistEmail})` : ''}

---
Managed by DWx Traffic Manager
  `.trim();
};

// ============================================================================
// Product Request Email Templates
// ============================================================================

/**
 * Product request submitted - sent to AM
 */
export const productRequestCreatedAM = (request: ProductRequest): { subject: string; body: string } => {
  const content = `
    <h2>Your Product Request Has Been Submitted</h2>
    <p>Hi ${request.AccountManagerName},</p>
    <p>Your ${request.RequestType.toLowerCase()} request for <strong>${request.ProductName}</strong> has been successfully submitted.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Product:</span>
        <span class="info-value">${request.ProductName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type:</span>
        <span class="info-value">${request.ProductType} — ${request.RequestType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}${request.IsPremiumClient ? ' ⭐ Premium' : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (${request.ContactEmail})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status:</span>
        <span class="info-value"><span class="stage-badge stage-lead">${request.Status}</span></span>
      </div>
      ${request.LicenseCount ? `
      <div class="info-row">
        <span class="info-label">Licenses:</span>
        <span class="info-value">${request.LicenseCount}</span>
      </div>` : ''}
      ${request.EstimatedValue ? `
      <div class="info-row">
        <span class="info-label">Estimated Value:</span>
        <span class="info-value deal-value">${formatCurrency(request.EstimatedValue)}</span>
      </div>` : ''}
    </div>

    ${request.ProposedSlot1 ? `
    <h3>Proposed Time Slots</h3>
    <div class="time-slots">
      <div class="time-slot">📅 Slot 1: ${formatDateTime(request.ProposedSlot1)}</div>
      ${request.ProposedSlot2 ? `<div class="time-slot">📅 Slot 2: ${formatDateTime(request.ProposedSlot2)}</div>` : ''}
      ${request.ProposedSlot3 ? `<div class="time-slot">📅 Slot 3: ${formatDateTime(request.ProposedSlot3)}</div>` : ''}
    </div>` : ''}

    <p>You'll be notified when the request is reviewed and a specialist is assigned.</p>
  `;

  return {
    subject: `[DWx] Product ${request.RequestType} Request Submitted — ${request.ProductName} for ${request.ClientName}`,
    body: wrapEmail(
      'Product Request Submitted',
      `${request.RequestType} request for ${request.ProductName}`,
      content
    ),
  };
};

/**
 * Product request submitted - sent to managers
 */
export const productRequestCreatedManager = (request: ProductRequest): { subject: string; body: string } => {
  const content = `
    <h2>New Product ${request.RequestType} Request</h2>
    <p>A new product request requires your review.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Product:</span>
        <span class="info-value">${request.ProductName} (${request.ProductType})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Request Type:</span>
        <span class="info-value">${request.RequestType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}${request.IsPremiumClient ? ' ⭐ Premium' : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (${request.ContactEmail})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted By:</span>
        <span class="info-value">${request.AccountManagerName} (${request.AccountManagerEmail})</span>
      </div>
      ${request.LicenseCount ? `
      <div class="info-row">
        <span class="info-label">Licenses:</span>
        <span class="info-value">${request.LicenseCount}</span>
      </div>` : ''}
      ${request.EstimatedValue ? `
      <div class="info-row">
        <span class="info-label">Estimated Value:</span>
        <span class="info-value deal-value">${formatCurrency(request.EstimatedValue)}</span>
      </div>` : ''}
    </div>

    ${request.ProposedSlot1 ? `
    <h3>Proposed Time Slots</h3>
    <div class="time-slots">
      <div class="time-slot">📅 Slot 1: ${formatDateTime(request.ProposedSlot1)}</div>
      ${request.ProposedSlot2 ? `<div class="time-slot">📅 Slot 2: ${formatDateTime(request.ProposedSlot2)}</div>` : ''}
      ${request.ProposedSlot3 ? `<div class="time-slot">📅 Slot 3: ${formatDateTime(request.ProposedSlot3)}</div>` : ''}
    </div>` : ''}

    ${request.Comments ? `
    <h3>Comments</h3>
    <p>${request.Comments}</p>` : ''}

    <p>Please review this request and assign a specialist.</p>
  `;

  return {
    subject: `[DWx] 🆕 Product ${request.RequestType} — ${request.ProductName} for ${request.ClientName}`,
    body: wrapEmail(
      'New Product Request',
      `${request.RequestType} request from ${request.AccountManagerName}`,
      content
    ),
  };
};

/**
 * Product request status changed - sent to AM
 */
export const productRequestStatusChanged = (
  request: ProductRequest,
  previousStatus: string,
  newStatus: string
): { subject: string; body: string } => {
  const statusColors: Record<string, string> = {
    'Pending Review': 'stage-lead',
    'Awaiting Approval': 'stage-qualified',
    'Confirmed': 'stage-won',
    'Completed': 'stage-discovery',
    'Cancelled': 'stage-lost',
  };

  const content = `
    <h2>Product Request Status Updated</h2>
    <p>Hi ${request.AccountManagerName},</p>
    <p>The status of your product request has been updated.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Product:</span>
        <span class="info-value">${request.ProductName} (${request.ProductType})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Previous Status:</span>
        <span class="info-value"><span class="stage-badge ${statusColors[previousStatus] || 'stage-lead'}">${previousStatus}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">New Status:</span>
        <span class="info-value"><span class="stage-badge ${statusColors[newStatus] || 'stage-lead'}">${newStatus}</span></span>
      </div>
    </div>
  `;

  return {
    subject: `[DWx] Product Request ${newStatus} — ${request.ProductName} for ${request.ClientName}`,
    body: wrapEmail(
      'Status Update',
      `${request.ProductName} — ${previousStatus} → ${newStatus}`,
      content
    ),
  };
};

// ============================================================================
// Product Request Specialist Assignment Templates
// ============================================================================

/**
 * Product request specialist assigned - sent to AM
 */
export const productSpecialistAssignedAM = (
  request: ProductRequest,
  specialistName: string,
  specialistEmail: string,
  specialistRole: string
): { subject: string; body: string } => {
  const content = `
    <h2>Specialist Assigned to Your Product Request</h2>
    <p>Hi ${request.AccountManagerName},</p>
    <p>A specialist has been assigned to your ${request.RequestType.toLowerCase()} request for <strong>${request.ProductName}</strong>.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Specialist:</span>
        <span class="info-value"><strong>${specialistName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Role:</span>
        <span class="info-value">${specialistRole}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value"><a href="mailto:${specialistEmail}">${specialistEmail}</a></span>
      </div>
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Product:</span>
        <span class="info-value">${request.ProductName} (${request.ProductType})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Request Type:</span>
        <span class="info-value">${request.RequestType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
    </div>

    <p>The specialist will coordinate with you to schedule the ${request.RequestType.toLowerCase()}.</p>
  `;

  return {
    subject: `[DWx] Specialist Assigned: ${specialistName} for ${request.ProductName} (${request.ClientName})`,
    body: wrapEmail('Specialist Assigned', `${request.RequestType} Request`, content),
  };
};

/**
 * Product request specialist assigned - sent to specialist
 */
export const productSpecialistAssignedSpecialist = (
  request: ProductRequest,
  specialistName: string
): { subject: string; body: string } => {
  const content = `
    <h2>You've Been Assigned a Product ${request.RequestType} Request</h2>
    <p>Hi ${specialistName},</p>
    <p>You have been assigned to a product ${request.RequestType.toLowerCase()} request. Please review the details below.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Product:</span>
        <span class="info-value"><strong>${request.ProductName}</strong> (${request.ProductType})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Request Type:</span>
        <span class="info-value">${request.RequestType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}${request.IsPremiumClient ? ' ⭐ Premium' : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (<a href="mailto:${request.ContactEmail}">${request.ContactEmail}</a>)</span>
      </div>
      ${request.ContactPhone ? `
      <div class="info-row">
        <span class="info-label">Phone:</span>
        <span class="info-value">${request.ContactPhone}</span>
      </div>` : ''}
      ${request.LicenseCount ? `
      <div class="info-row">
        <span class="info-label">Licenses:</span>
        <span class="info-value">${request.LicenseCount}</span>
      </div>` : ''}
      ${request.EstimatedValue ? `
      <div class="info-row">
        <span class="info-label">Estimated Value:</span>
        <span class="info-value deal-value">${formatCurrency(request.EstimatedValue)}</span>
      </div>` : ''}
    </div>

    <p><strong>Account Manager:</strong> ${request.AccountManagerName} (<a href="mailto:${request.AccountManagerEmail}">${request.AccountManagerEmail}</a>)</p>

    ${request.ProposedSlot1 ? `
    <h3>Proposed Time Slots</h3>
    <div class="time-slots">
      <div class="time-slot">📅 Slot 1: ${formatDateTime(request.ProposedSlot1)}</div>
      ${request.ProposedSlot2 ? `<div class="time-slot">📅 Slot 2: ${formatDateTime(request.ProposedSlot2)}</div>` : ''}
      ${request.ProposedSlot3 ? `<div class="time-slot">📅 Slot 3: ${formatDateTime(request.ProposedSlot3)}</div>` : ''}
    </div>` : ''}

    <p>Please confirm one of the proposed slots or coordinate with the Account Manager.</p>
  `;

  return {
    subject: `[DWx] 📋 New Assignment: ${request.ProductName} ${request.RequestType} for ${request.ClientName}`,
    body: wrapEmail('New Assignment', 'Action Required', content),
  };
};

// ============================================================================
// Specialist Reassignment Template
// ============================================================================

/**
 * Specialist unassigned/reassigned notification - sent to previous specialist
 */
export const specialistReassigned = (
  entityType: 'Service Request' | 'Product Request',
  entityTitle: string,
  clientName: string,
  previousSpecialistName: string,
  newSpecialistName: string
): { subject: string; body: string } => {
  const content = `
    <h2>Assignment Update</h2>
    <p>Hi ${previousSpecialistName},</p>
    <p>You have been unassigned from the following ${entityType.toLowerCase()}. A different specialist has been assigned to continue.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">${entityType}:</span>
        <span class="info-value">${entityTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${clientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">New Specialist:</span>
        <span class="info-value">${newSpecialistName}</span>
      </div>
    </div>

    <p>Your workload has been updated accordingly. No further action is needed on this request.</p>
  `;

  return {
    subject: `[DWx] Assignment Update: ${clientName} — reassigned to ${newSpecialistName}`,
    body: wrapEmail('Assignment Update', 'DWx Traffic Manager', content),
  };
};

// ============================================================================
// Product Request Status Change - Manager Notification
// ============================================================================

/**
 * Product request status changed - sent to managers
 */
export const productRequestStatusChangedManager = (
  request: ProductRequest,
  previousStatus: string,
  newStatus: string
): { subject: string; body: string } => {
  const statusColors: Record<string, string> = {
    'Pending Review': 'stage-lead',
    'Awaiting Approval': 'stage-qualified',
    'Confirmed': 'stage-won',
    'Completed': 'stage-discovery',
    'Cancelled': 'stage-lost',
  };

  const content = `
    <h2>Product Request Status Update</h2>
    <p>A product request status has changed and may require your attention.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Product:</span>
        <span class="info-value">${request.ProductName} (${request.ProductType})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}${request.IsPremiumClient ? ' ⭐ Premium' : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Manager:</span>
        <span class="info-value">${request.AccountManagerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Previous Status:</span>
        <span class="info-value"><span class="stage-badge ${statusColors[previousStatus] || 'stage-lead'}">${previousStatus}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">New Status:</span>
        <span class="info-value"><span class="stage-badge ${statusColors[newStatus] || 'stage-lead'}">${newStatus}</span></span>
      </div>
      ${request.AssignedSpecialistName ? `
      <div class="info-row">
        <span class="info-label">Specialist:</span>
        <span class="info-value">${request.AssignedSpecialistName}</span>
      </div>` : ''}
    </div>
  `;

  const emoji = newStatus === 'Confirmed' ? '✅' : newStatus === 'Completed' ? '🎉' : newStatus === 'Cancelled' ? '❌' : '📋';

  return {
    subject: `[DWx] ${emoji} Product Request ${newStatus}: ${request.ProductName} — ${request.ClientName}`,
    body: wrapEmail('Product Request Update', `${previousStatus} → ${newStatus}`, content),
  };
};

// ============================================================================
// Deal Value Changed Template
// ============================================================================

/**
 * Deal value/probability changed - sent to managers
 */
export const dealValueChanged = (
  request: ServiceRequest,
  changes: { previousDealValue?: number; newDealValue?: number; previousProbability?: number; newProbability?: number; previousWeightedPipeline?: number; newWeightedPipeline?: number },
  changedBy: string
): { subject: string; body: string } => {
  const content = `
    <h2>Deal Value Updated</h2>
    <p>A deal's financial details have been updated in the pipeline.</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Manager:</span>
        <span class="info-value">${request.AccountManagerName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Stage:</span>
        <span class="info-value"><span class="${getStageBadgeClass(request.FunnelStage)}">${request.FunnelStage}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Updated By:</span>
        <span class="info-value">${changedBy}</span>
      </div>
    </div>

    <div class="info-box" style="border-left: 4px solid ${DW_COLORS.warning};">
      ${changes.previousDealValue !== undefined ? `
      <div class="info-row">
        <span class="info-label">Deal Value:</span>
        <span class="info-value"><span style="text-decoration: line-through;">${formatCurrency(changes.previousDealValue)}</span> → <strong>${formatCurrency(changes.newDealValue)}</strong></span>
      </div>` : ''}
      ${changes.previousProbability !== undefined ? `
      <div class="info-row">
        <span class="info-label">Win Probability:</span>
        <span class="info-value"><span style="text-decoration: line-through;">${changes.previousProbability}%</span> → <strong>${changes.newProbability}%</strong></span>
      </div>` : ''}
      ${changes.newWeightedPipeline !== undefined ? `
      <div class="info-row">
        <span class="info-label">Weighted Pipeline:</span>
        <span class="info-value"><span style="text-decoration: line-through;">${formatCurrency(changes.previousWeightedPipeline)}</span> → <strong class="deal-value">${formatCurrency(changes.newWeightedPipeline)}</strong></span>
      </div>` : ''}
    </div>
  `;

  return {
    subject: `[DWx] 💰 Deal Value Updated: ${request.ClientName} — ${request.ServiceName}`,
    body: wrapEmail('Deal Value Update', 'Pipeline Change', content),
  };
};

// ============================================================================
// Calendar Event Failure Template
// ============================================================================

/**
 * Calendar event creation failed - sent to managers
 */
export const calendarEventFailed = (
  entityType: 'Service Request' | 'Product Request',
  entityTitle: string,
  clientName: string,
  confirmedSlot: string,
  accountManagerName: string
): { subject: string; body: string } => {
  const content = `
    <h2>Calendar Event Creation Failed</h2>
    <p>A calendar event could not be created automatically. Manual intervention may be needed.</p>

    <div class="info-box" style="border-left: 4px solid ${DW_COLORS.warning};">
      <div class="info-row">
        <span class="info-label">${entityType}:</span>
        <span class="info-value">${entityTitle}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${clientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Confirmed Slot:</span>
        <span class="info-value"><strong>${formatDateTime(confirmedSlot)}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Manager:</span>
        <span class="info-value">${accountManagerName}</span>
      </div>
    </div>

    <p><strong>Recommended Actions:</strong></p>
    <ul>
      <li>Manually create a Teams meeting for the confirmed time slot</li>
      <li>Ensure all attendees receive the meeting invitation</li>
      <li>Check that calendar permissions are correctly configured</li>
    </ul>
  `;

  return {
    subject: `[DWx] ⚠️ Calendar Event Failed: ${clientName} — ${formatDateTime(confirmedSlot)}`,
    body: wrapEmail('Calendar Event Failed', 'Action Required', content),
  };
};

// ============================================================================
// Product Demo Confirmed - Specialist Notification
// ============================================================================

/**
 * Product demo/trial confirmed - sent to specialist
 */
export const productDemoConfirmedSpecialist = (
  request: ProductRequest,
  specialistName: string,
  confirmedSlot: string
): { subject: string; body: string } => {
  const typeLabel = request.RequestType === 'Demo' ? 'Product Demo' : 'Trial Deployment';

  const content = `
    <h2>${typeLabel} Confirmed</h2>
    <p>Hi ${specialistName},</p>
    <p>A ${typeLabel.toLowerCase()} for <strong>${request.ProductName}</strong> has been confirmed. Please ensure you are prepared for the session.</p>

    <div class="info-box" style="border-left: 4px solid ${DW_COLORS.accent};">
      <div class="info-row">
        <span class="info-label">Date & Time:</span>
        <span class="info-value"><strong>${formatDateTime(confirmedSlot)}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Product:</span>
        <span class="info-value">${request.ProductName} (${request.ProductType})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Request Type:</span>
        <span class="info-value">${request.RequestType}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (${request.ContactEmail})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Account Manager:</span>
        <span class="info-value">${request.AccountManagerName} (<a href="mailto:${request.AccountManagerEmail}">${request.AccountManagerEmail}</a>)</span>
      </div>
    </div>

    <p><strong>Preparation Checklist:</strong></p>
    <ul>
      <li>Review the product requirements and client background</li>
      <li>Ensure the ${typeLabel.toLowerCase()} environment is ready</li>
      <li>Test your audio/video setup</li>
      <li>Have relevant documentation and pricing ready</li>
    </ul>
  `;

  return {
    subject: `[DWx] ✅ ${typeLabel} Confirmed: ${request.ProductName} for ${request.ClientName}`,
    body: wrapEmail(`${typeLabel} Confirmed`, 'DWx Traffic Manager', content),
  };
};

// ============================================================================
// Session Preparation Email Templates
// ============================================================================

/**
 * Session preparation created - sent to specialist
 */
export const sessionPrepCreated = (
  request: ServiceRequest,
  sessionPrep: SessionPreparation,
  confirmedSlot: string
): { subject: string; body: string } => {
  const content = `
    <h2>Session Preparation Ready</h2>
    <p>Hi ${sessionPrep.SpecialistName},</p>
    <p>A session preparation has been created for your upcoming discovery meeting with <strong>${request.ClientName}</strong>. Use the preparation tools to research the client and prepare for a successful meeting.</p>

    <div class="info-box" style="border-left: 4px solid ${DW_COLORS.primary};">
      <div class="info-row">
        <span class="info-label">Meeting Date:</span>
        <span class="info-value"><strong>${formatDateTime(confirmedSlot)}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}${request.IsPremiumClient ? ' ⭐ Premium' : ''}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (${request.ContactEmail})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Interest Level:</span>
        <span class="info-value interest-${request.InterestLevel.toLowerCase()}">${request.InterestLevel === 'Hot' ? '🔥 ' : request.InterestLevel === 'Warm' ? '☀️ ' : '❄️ '}${request.InterestLevel}</span>
      </div>
      ${request.DealValue ? `
      <div class="info-row">
        <span class="info-label">Deal Value:</span>
        <span class="info-value deal-value">${formatCurrency(request.DealValue)}</span>
      </div>` : ''}
    </div>

    <h3>🤖 AI-Powered Preparation Tools</h3>
    <p>Access the Session Preparation panel in DWx Traffic Manager to:</p>
    <ul>
      <li><strong>Client Profile:</strong> AI-generated overview of the client, key stakeholders, and pain points</li>
      <li><strong>Talking Points:</strong> Customizable conversation guide with discovery questions and value propositions</li>
      <li><strong>Resource Suggestions:</strong> AI-recommended slide decks, case studies, and materials</li>
      <li><strong>Meeting Agenda:</strong> Suggested timeline and structure for the discovery session</li>
      <li><strong>Prep Checklist:</strong> Track your preparation progress</li>
    </ul>

    ${request.Requirements ? `
    <h3>Client Requirements</h3>
    <p style="background-color: ${DW_COLORS.background}; padding: 12px; border-radius: 6px;">${request.Requirements}</p>
    ` : ''}

    <p style="margin-top: 20px;"><strong>Account Manager:</strong> ${request.AccountManagerName} (<a href="mailto:${request.AccountManagerEmail}">${request.AccountManagerEmail}</a>)</p>
  `;

  return {
    subject: `[DWx] 📋 Session Preparation Ready: ${request.ServiceName} - ${request.ClientName}`,
    body: wrapEmail('Session Preparation', 'Prepare for your discovery meeting', content),
  };
};

/**
 * Session preparation reminder - sent to specialist before meeting
 */
export const sessionPrepReminder = (
  request: ServiceRequest,
  sessionPrep: SessionPreparation,
  confirmedSlot: string,
  hoursUntilMeeting: number
): { subject: string; body: string } => {
  const completedItems = sessionPrep.ChecklistItems.filter(item => item.completed).length;
  const totalItems = sessionPrep.ChecklistItems.length;
  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const isReady = sessionPrep.Status === 'Ready';
  const statusColor = isReady ? DW_COLORS.accent : DW_COLORS.warning;
  const statusLabel = isReady ? '✅ Ready' : '⚠️ Incomplete';

  const content = `
    <h2>Meeting Reminder: ${hoursUntilMeeting} Hours Away</h2>
    <p>Hi ${sessionPrep.SpecialistName},</p>
    <p>This is a reminder that your discovery meeting with <strong>${request.ClientName}</strong> is scheduled for <strong>${formatDateTime(confirmedSlot)}</strong>.</p>

    <div class="info-box" style="border-left: 4px solid ${statusColor};">
      <div class="info-row">
        <span class="info-label">Preparation Status:</span>
        <span class="info-value"><strong style="color: ${statusColor};">${statusLabel}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Checklist Progress:</span>
        <span class="info-value">${completedItems} of ${totalItems} items (${completionPercentage}%)</span>
      </div>
      <div class="info-row">
        <span class="info-label">AI Content:</span>
        <span class="info-value">${sessionPrep.AIGeneratedAt ? '✅ Generated' : '❌ Not generated'}</span>
      </div>
    </div>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Service:</span>
        <span class="info-value">${request.ServiceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Client:</span>
        <span class="info-value">${request.ClientName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Contact:</span>
        <span class="info-value">${request.ContactName} (${request.ContactEmail})</span>
      </div>
    </div>

    ${!isReady ? `
    <p style="background-color: #fef3c7; padding: 12px; border-radius: 6px; border-left: 4px solid ${DW_COLORS.warning};">
      <strong>⚠️ Action Required:</strong> Your session preparation is not yet complete. Please review and complete your checklist items before the meeting.
    </p>
    ` : `
    <p style="background-color: #d1fae5; padding: 12px; border-radius: 6px; border-left: 4px solid ${DW_COLORS.accent};">
      <strong>✅ You're all set!</strong> Your session preparation is complete. Good luck with your meeting!
    </p>
    `}
  `;

  return {
    subject: `[DWx] ⏰ Meeting in ${hoursUntilMeeting}h: ${request.ClientName} - ${sessionPrep.Status === 'Ready' ? 'Ready' : 'Prep Incomplete'}`,
    body: wrapEmail('Meeting Reminder', `${hoursUntilMeeting} hours until your discovery meeting`, content),
  };
};

export const EmailTemplates = {
  requestCreatedAM,
  requestCreatedManager,
  specialistAssignedAM,
  specialistAssignedSpecialist,
  discoveryConfirmed,
  stageChanged,
  dealWon,
  dealLost,
  calendarEventDescription,
  productRequestCreatedAM,
  productRequestCreatedManager,
  productRequestStatusChanged,
  productSpecialistAssignedAM,
  productSpecialistAssignedSpecialist,
  specialistReassigned,
  productRequestStatusChangedManager,
  dealValueChanged,
  calendarEventFailed,
  productDemoConfirmedSpecialist,
  sessionPrepCreated,
  sessionPrepReminder,
};
