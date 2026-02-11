/**
 * DWx Traffic Manager - Email Templates
 * DWx-branded inline HTML email templates with gradient headers,
 * key-value rows, coloured callout boxes, and grey footers.
 *
 * Icon style: simple text markers (no emoji). Headers use plain text titles.
 */

import { ServiceRequest, FunnelStage, DWService } from '../types/ServiceRequest';
import { ProductRequest } from '../types/ProductRequest';
import { SessionPreparation } from '../types/SessionPreparation';
import { format } from 'date-fns';

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value?: number): string => {
  if (!value) return 'Not specified';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDateTime = (dateStr?: string): string => {
  if (!dateStr) return 'Not specified';
  try {
    return format(new Date(dateStr), "EEEE, MMMM d, yyyy 'at' h:mm a");
  } catch {
    return 'Invalid date';
  }
};

const interestLabel = (level: string): string => {
  if (level === 'Hot') return 'Hot';
  if (level === 'Warm') return 'Warm';
  return 'Cold';
};

const interestColor = (level: string): string => {
  if (level === 'Hot') return '#d13438';
  if (level === 'Warm') return '#f7630c';
  return '#616161';
};

/** Escape user-controlled values to prevent HTML/XSS injection in emails */
const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ============================================================================
// Header colour presets (solid colours for maximum email client compatibility)
// CSS linear-gradient is NOT supported by Outlook desktop — use solid bg-color.
// ============================================================================

const GRAD = {
  standard: '#1e6b7b',   // DWx teal
  success:  '#107c10',   // Green
  danger:   '#d13438',   // Red
  warning:  '#f7630c',   // Orange
  purple:   '#6264a7',   // Purple (assignments)
  ai:       '#8b5cf6',   // AI / session prep
  neutral:  '#605e5c',   // Grey
};

// ============================================================================
// Stage badge colours
// ============================================================================

const STAGE_STYLES: Record<string, { bg: string; color: string }> = {
  Lead:        { bg: '#e5e7eb', color: '#4b5563' },
  Qualified:   { bg: '#dbeafe', color: '#1d4ed8' },
  Discovery:   { bg: '#ede9fe', color: '#7c3aed' },
  Proposal:    { bg: '#fef3c7', color: '#b45309' },
  Negotiation: { bg: '#fce7f3', color: '#db2777' },
  Won:         { bg: '#d1fae5', color: '#059669' },
  Lost:        { bg: '#fee2e2', color: '#dc2626' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Pending Review':    { bg: '#fff4ce', color: '#f7630c' },
  'Awaiting Approval': { bg: '#e5e7eb', color: '#4b5563' },
  'Confirmed':         { bg: '#d1fae5', color: '#059669' },
  'Completed':         { bg: '#dbeafe', color: '#1d4ed8' },
  'Cancelled':         { bg: '#fee2e2', color: '#dc2626' },
};

// ============================================================================
// Inline building blocks
// ============================================================================

/**
 * Wrap a complete email with header, content, and footer.
 * Uses table-based layout + solid background-color for maximum email client
 * compatibility (Outlook desktop does NOT support CSS linear-gradient).
 */
const wrap = (bgColor: string, title: string, content: string): string => `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0f2f5;">
<tr><td align="center" style="padding:20px 0;">
<table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr>
    <td style="background-color:${bgColor};padding:24px 28px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td width="56" valign="middle" style="padding-right:16px;">
          <div style="width:44px;height:44px;background-color:rgba(255,255,255,0.2);border-radius:50%;text-align:center;line-height:44px;">
            <span style="font-size:20px;color:white;">&#9670;</span>
          </div>
        </td>
        <td valign="middle">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">${title}</h1>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:12px;">DWx Traffic Manager</p>
        </td>
      </tr></table>
    </td>
  </tr>
  <!-- Content -->
  <tr>
    <td style="background-color:#ffffff;padding:28px 28px;">
      ${content}
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="background-color:#1a1a1a;padding:16px 28px;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.6);font-size:12px;">DWx Traffic Manager &bull; Automated Notification</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.4);font-size:11px;">This is an automated message. Please do not reply directly.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body></html>`;

/** Key-value row (table-based for Outlook compatibility). */
const row = (label: string, value: string, style?: string): string =>
  `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:10px;">
    <tr>
      <td width="140" valign="top" style="font-weight:600;color:#616161;padding-right:8px;font-size:14px;">${label}:</td>
      <td valign="top" style="font-size:14px;${style || ''}">${value}</td>
    </tr>
  </table>`;

/** Stage / status badge (pill style matching email mockup). */
const badge = (text: string, styles: { bg: string; color: string }): string =>
  `<span style="display:inline-block;padding:4px 12px;border-radius:16px;font-size:12px;font-weight:500;background:${styles.bg};color:${styles.color};">${text}</span>`;

/** Shorthand: stage badge using STAGE_STYLES lookup. */
const stageBadge = (stage: string): string =>
  badge(stage, STAGE_STYLES[stage] || STAGE_STYLES.Lead);

/** Coloured callout box with left border. */
const callout = (borderColor: string, bgColor: string, inner: string): string =>
  `<div style="background:${bgColor};border-left:4px solid ${borderColor};padding:15px;margin:15px 0;border-radius:4px;">${inner}</div>`;

/** White card section (matches mockup's white card pattern). */
const card = (titleColor: string, title: string, inner: string): string =>
  `<div style="background:white;padding:15px;border-radius:4px;margin-top:15px;">
    <h3 style="margin-top:0;color:${titleColor};">${title}</h3>${inner}
  </div>`;

/** Time slot row (flat style matching email mockup). */
const slot = (label: string, value: string, isLast?: boolean): string =>
  `<div style="padding:8px 0;${isLast ? '' : 'border-bottom:1px solid #e1e1e1;'}">
    <strong>${label}:</strong> ${value}
  </div>`;

/** Premium client indicator. */
const premium = (): string =>
  `<span style="background:#fff4ce;color:#8b6914;padding:2px 8px;border-radius:12px;font-size:12px;">Premium</span>`;

/** Confirmed date banner. */
const confirmedBanner = (dateStr: string): string =>
  `<div style="background:#dff6dd;border:2px solid #107c10;border-radius:8px;padding:15px;margin:15px 0;text-align:center;">
    <h2 style="margin:0;color:#107c10;font-size:18px;">Confirmed Date &amp; Time</h2>
    <p style="margin:5px 0 0;font-size:14px;color:#616161;">${dateStr}</p>
  </div>`;

/** Deal value display. */
const dealValue = (value: string): string =>
  `<span style="font-size:18px;font-weight:700;color:#107c10;">${value}</span>`;

/** Big countdown banner. */
const countdownBanner = (text: string, bgColor: string, textColor: string): string =>
  `<div style="text-align:center;padding:20px;margin:15px 0;background:${bgColor};border-radius:8px;">
    <h2 style="margin:0;color:${textColor};font-size:24px;">${text}</h2>
  </div>`;

// ============================================================================
// Slot list builder
// ============================================================================

const buildSlots = (s1?: string, s2?: string, s3?: string): string => {
  const slots: string[] = [];
  if (s1) slots.push(formatDateTime(s1));
  if (s2) slots.push(formatDateTime(s2));
  if (s3) slots.push(formatDateTime(s3));
  return slots.map((v, i) => slot(`Option ${i + 1}`, v, i === slots.length - 1)).join('');
};

// ============================================================================
// SERVICE REQUEST EMAILS
// ============================================================================

/**
 * 1. Service request submitted — sent to AM
 */
export const requestCreatedAM = (request: ServiceRequest): { subject: string; body: string } => {
  const isPremium = (request as any).IsPremiumClient;
  const content = `
    <p>Hi <strong>${escapeHtml(request.AccountManagerName)}</strong>,</p>
    <p>Your service request for <strong>${escapeHtml(request.ClientName)}</strong> has been successfully submitted and is now in the sales pipeline.</p>
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Client', escapeHtml(request.ClientName) + (isPremium ? ' ' + premium() : ''))}
    ${row('Contact', `${escapeHtml(request.ContactName)} (${escapeHtml(request.ContactEmail)})`)}
    ${row('Stage', badge(request.FunnelStage, STAGE_STYLES[request.FunnelStage] || STAGE_STYLES.Lead))}
    ${row('Interest Level', interestLabel(request.InterestLevel), `color:${interestColor(request.InterestLevel)}`)}
    ${request.DealValue ? row('Deal Value', dealValue(formatCurrency(request.DealValue))) : ''}
    ${card('#1e6b7b', 'Proposed Discovery Meeting Times', buildSlots(request.ProposedSlot1, request.ProposedSlot2, request.ProposedSlot3))}
    <p style="margin-top:20px;">Our pre-sales team will review your request and a specialist will be assigned shortly.</p>
  `;
  return {
    subject: `[DWx] Service Request Submitted: ${escapeHtml(request.ServiceName)} for ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.standard, 'Service Request Submitted', content),
  };
};

/**
 * 2. Service request submitted — sent to managers
 */
export const requestCreatedManager = (request: ServiceRequest): { subject: string; body: string } => {
  const isPremium = (request as any).IsPremiumClient;
  const content = `
    <p>A new service request has been submitted and requires your attention.</p>
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Client', escapeHtml(request.ClientName) + (isPremium ? ' ' + premium() : ''))}
    ${row('Account Manager', `${escapeHtml(request.AccountManagerName)} (${escapeHtml(request.AccountManagerEmail)})`)}
    ${row('Interest Level', interestLabel(request.InterestLevel), `color:${interestColor(request.InterestLevel)}`)}
    ${request.DealValue ? row('Deal Value', dealValue(formatCurrency(request.DealValue))) : ''}
    ${request.DealProbability ? row('Win Probability', `${request.DealProbability}%`) : ''}
    ${request.Requirements ? callout('#1e6b7b', '#e8f4fc', `<strong>Requirements:</strong><p style="margin:5px 0 0;">${escapeHtml(request.Requirements)}</p>`) : ''}
    ${card('#1e6b7b', 'Proposed Discovery Meeting Times', buildSlots(request.ProposedSlot1, request.ProposedSlot2, request.ProposedSlot3))}
    <p style="margin-top:20px;"><strong>Actions Required:</strong></p>
    <ul><li>Review the request details</li><li>Assign a specialist</li><li>Confirm a meeting time slot</li></ul>
  `;
  return {
    subject: `[DWx] New Request: ${escapeHtml(request.ServiceName)} - ${escapeHtml(request.ClientName)} (${request.InterestLevel})`,
    body: wrap(GRAD.standard, 'New Service Request', content),
  };
};

/**
 * 3. Specialist assigned — sent to AM
 */
export const specialistAssignedAM = (
  request: ServiceRequest,
  specialistName: string,
  specialistEmail: string,
  specialistRole: string
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(request.AccountManagerName)}</strong>,</p>
    <p>Great news! A specialist has been assigned to your service request for <strong>${escapeHtml(request.ClientName)}</strong>.</p>
    ${callout('#1e6b7b', '#e8f4fc',
      row('Specialist', `<strong>${escapeHtml(specialistName)}</strong>`) +
      row('Role', specialistRole) +
      row('Email', `<a href="mailto:${escapeHtml(specialistEmail)}" style="color:#1e6b7b;">${escapeHtml(specialistEmail)}</a>`)
    )}
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Current Stage', badge(request.FunnelStage, STAGE_STYLES[request.FunnelStage] || STAGE_STYLES.Lead))}
    <p style="margin-top:20px;">The specialist will reach out to schedule the discovery meeting. You can also contact them directly if needed.</p>
  `;
  return {
    subject: `[DWx] Specialist Assigned: ${escapeHtml(specialistName)} for ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.standard, 'Specialist Assigned', content),
  };
};

/**
 * 4. Specialist assigned — sent to specialist
 */
export const specialistAssignedSpecialist = (
  request: ServiceRequest,
  specialistName: string
): { subject: string; body: string } => {
  const isPremium = (request as any).IsPremiumClient;
  const content = `
    <p>Hi <strong>${escapeHtml(specialistName)}</strong>,</p>
    <p>You have been assigned to a new service request. Please review the details below and schedule a discovery meeting with the client.</p>
    ${row('Service', `<strong>${escapeHtml(request.ServiceName)}</strong>`)}
    ${row('Client', escapeHtml(request.ClientName) + (isPremium ? ' ' + premium() : ''))}
    ${row('Contact', `${escapeHtml(request.ContactName)} (<a href="mailto:${escapeHtml(request.ContactEmail)}" style="color:#1e6b7b;">${escapeHtml(request.ContactEmail)}</a>)`)}
    ${request.ContactPhone ? row('Phone', escapeHtml(request.ContactPhone)) : ''}
    ${row('Interest Level', interestLabel(request.InterestLevel), `color:${interestColor(request.InterestLevel)}`)}
    ${request.DealValue ? row('Deal Value', dealValue(formatCurrency(request.DealValue))) : ''}
    <p><strong>Account Manager:</strong> ${escapeHtml(request.AccountManagerName)} (<a href="mailto:${escapeHtml(request.AccountManagerEmail)}" style="color:#1e6b7b;">${escapeHtml(request.AccountManagerEmail)}</a>)</p>
    ${request.Requirements ? callout('#616161', '#f5f5f5', `<strong>Client Requirements:</strong><p style="margin:5px 0 0;">${escapeHtml(request.Requirements)}</p>`) : ''}
    ${card('#1e6b7b', 'Proposed Meeting Times (Client\'s Preference)', buildSlots(request.ProposedSlot1, request.ProposedSlot2, request.ProposedSlot3))}
    <p style="margin-top:20px;">Please confirm one of the proposed slots or coordinate with the Account Manager to find an alternative time.</p>
  `;
  return {
    subject: `[DWx] New Assignment: ${escapeHtml(request.ServiceName)} for ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.purple, 'New Assignment', content),
  };
};

/**
 * 5. Discovery meeting confirmed — sent to each party
 */
export const discoveryConfirmed = (
  request: ServiceRequest,
  recipientName: string,
  confirmedSlot: string
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
    <p>The discovery meeting for <strong>${escapeHtml(request.ClientName)}</strong> has been confirmed.</p>
    ${confirmedBanner(formatDateTime(confirmedSlot))}
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Contact', `${escapeHtml(request.ContactName)} (${escapeHtml(request.ContactEmail)})`)}
    ${request.AssignedSpecialistName ? row('Specialist', escapeHtml(request.AssignedSpecialistName)) : ''}
    <p style="margin-top:20px;">A calendar invite has been sent to all participants. Please ensure you're prepared for the meeting.</p>
    ${callout('#107c10', '#dff6dd',
      `<strong>Meeting Preparation Checklist:</strong>
      <ul style="margin:8px 0 0;padding-left:20px;">
        <li>Review client requirements and background</li>
        <li>Prepare relevant case studies or demos</li>
        <li>Test your audio/video setup</li>
        <li>Have pricing information ready if needed</li>
      </ul>`
    )}
  `;
  return {
    subject: `[DWx] Meeting Confirmed: ${escapeHtml(request.ServiceName)} - ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.success, 'Discovery Meeting Confirmed', content),
  };
};

/**
 * 6. Stage changed — sent to AM
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
    <p>Hi <strong>${escapeHtml(request.AccountManagerName)}</strong>,</p>
    <p>Your service request for <strong>${escapeHtml(request.ClientName)}</strong> has ${isProgress ? 'progressed' : 'moved'} in the pipeline.</p>
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Previous Stage', badge(previousStage, STAGE_STYLES[previousStage] || STAGE_STYLES.Lead))}
    ${row('New Stage', badge(newStage, STAGE_STYLES[newStage] || STAGE_STYLES.Lead))}
    ${row('Updated By', escapeHtml(changedBy))}
    ${newStage === 'Won'
      ? `<p style="font-size:16px;color:#107c10;margin-top:20px;"><strong>Congratulations on closing this deal!</strong></p>`
      : newStage === 'Lost'
      ? `<p style="margin-top:20px;">We're sorry this opportunity didn't work out. The learnings from this will help us improve.</p>`
      : `<p style="margin-top:20px;">Keep up the momentum! The deal is progressing well.</p>`
    }
  `;

  const arrow = isProgress ? 'Progress' : 'Update';
  return {
    subject: `[DWx] Stage ${arrow}: ${escapeHtml(request.ClientName)} moved to ${newStage}`,
    body: wrap(newStage === 'Won' ? GRAD.success : newStage === 'Lost' ? GRAD.danger : GRAD.standard, 'Pipeline Stage Updated', content),
  };
};

/**
 * 7. Deal won — sent to managers
 */
export const dealWon = (request: ServiceRequest): { subject: string; body: string } => {
  const content = `
    <p>Great news! A deal has been closed successfully.</p>
    ${callout('#107c10', '#dff6dd',
      row('Client', `<strong>${escapeHtml(request.ClientName)}</strong>`) +
      row('Service', escapeHtml(request.ServiceName)) +
      row('Account Manager', escapeHtml(request.AccountManagerName)) +
      (request.AssignedSpecialistName ? row('Specialist', escapeHtml(request.AssignedSpecialistName)) : '') +
      (request.DealValue ? row('Deal Value', dealValue(formatCurrency(request.DealValue))) : '')
    )}
    ${request.WinLossReason ? callout('#107c10', '#dff6dd', `<strong>Win Reason:</strong><p style="margin:5px 0 0;">${escapeHtml(request.WinLossReason)}</p>`) : ''}
    <p style="margin-top:20px;">Next steps: Transition to delivery team and initiate project kickoff.</p>
  `;
  return {
    subject: `[DWx] DEAL WON: ${escapeHtml(request.ClientName)} - ${escapeHtml(request.ServiceName)} (${formatCurrency(request.DealValue)})`,
    body: wrap(GRAD.success, 'Deal Won', content),
  };
};

/**
 * 8. Deal lost — sent to managers
 */
export const dealLost = (request: ServiceRequest): { subject: string; body: string } => {
  const content = `
    <p>Unfortunately, a deal has been marked as lost.</p>
    <div style="padding:15px;border-left:4px solid #d13438;background:#f9f9f9;border-radius:4px;margin:15px 0;">
      ${row('Client', `<strong>${escapeHtml(request.ClientName)}</strong>`)}
      ${row('Service', escapeHtml(request.ServiceName))}
      ${row('Account Manager', escapeHtml(request.AccountManagerName))}
      ${request.DealValue ? row('Deal Value', `<span style="text-decoration:line-through;color:#888;">${formatCurrency(request.DealValue)}</span>`) : ''}
    </div>
    ${request.WinLossReason ? callout('#d13438', '#fde7e9', `<strong>Loss Reason:</strong><p style="margin:5px 0 0;">${escapeHtml(request.WinLossReason)}</p>`) : ''}
    <p style="margin-top:20px;">Consider scheduling a post-mortem to capture learnings and identify improvement opportunities.</p>
  `;
  return {
    subject: `[DWx] Deal Lost: ${escapeHtml(request.ClientName)} - ${escapeHtml(request.ServiceName)}`,
    body: wrap(GRAD.danger, 'Deal Lost', content),
  };
};

/**
 * 9. Deal value changed — sent to managers
 */
export const dealValueChanged = (
  request: ServiceRequest,
  changes: { previousDealValue?: number; newDealValue?: number; previousProbability?: number; newProbability?: number; previousWeightedPipeline?: number; newWeightedPipeline?: number },
  changedBy: string
): { subject: string; body: string } => {
  const content = `
    <p>A deal's financial details have been updated in the pipeline.</p>
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Account Manager', escapeHtml(request.AccountManagerName))}
    ${row('Stage', badge(request.FunnelStage, STAGE_STYLES[request.FunnelStage] || STAGE_STYLES.Lead))}
    ${row('Updated By', escapeHtml(changedBy))}
    <div style="padding:15px;border-left:4px solid #f7630c;background:#fff8f0;border-radius:4px;margin:15px 0;">
      ${changes.previousDealValue !== undefined ? row('Deal Value', `<span style="text-decoration:line-through;color:#888;">${formatCurrency(changes.previousDealValue)}</span> &rarr; <strong>${formatCurrency(changes.newDealValue)}</strong>`) : ''}
      ${changes.previousProbability !== undefined ? row('Win Probability', `<span style="text-decoration:line-through;color:#888;">${changes.previousProbability}%</span> &rarr; <strong>${changes.newProbability}%</strong>`) : ''}
      ${changes.newWeightedPipeline !== undefined ? row('Weighted Pipeline', `<span style="text-decoration:line-through;color:#888;">${formatCurrency(changes.previousWeightedPipeline)}</span> &rarr; ${dealValue(formatCurrency(changes.newWeightedPipeline))}`) : ''}
    </div>
  `;
  return {
    subject: `[DWx] Deal Value Updated: ${escapeHtml(request.ClientName)} - ${escapeHtml(request.ServiceName)}`,
    body: wrap(GRAD.warning, 'Deal Value Updated', content),
  };
};

/**
 * 10. Specialist reassigned — sent to previous specialist
 */
export const specialistReassigned = (
  entityType: 'Service Request' | 'Product Request',
  entityTitle: string,
  clientName: string,
  previousSpecialistName: string,
  newSpecialistName: string
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(previousSpecialistName)}</strong>,</p>
    <p>You have been unassigned from the following ${entityType.toLowerCase()}. A different specialist has been assigned to continue.</p>
    ${row(entityType, escapeHtml(entityTitle))}
    ${row('Client', escapeHtml(clientName))}
    ${row('New Specialist', escapeHtml(newSpecialistName))}
    <p style="margin-top:20px;">Your workload has been updated accordingly. No further action is needed on this request.</p>
  `;
  return {
    subject: `[DWx] Assignment Update: ${escapeHtml(clientName)} - reassigned to ${escapeHtml(newSpecialistName)}`,
    body: wrap(GRAD.neutral, 'Assignment Update', content),
  };
};

// ============================================================================
// Calendar event description (plain text, not HTML email)
// ============================================================================

export const calendarEventDescription = (
  request: ServiceRequest,
  service?: DWService
): string => {
  return `
Discovery Meeting - ${request.ServiceName}

CLIENT INFORMATION
Company: ${request.ClientName}
Contact: ${request.ContactName}
Email: ${request.ContactEmail}
${request.ContactPhone ? `Phone: ${request.ContactPhone}` : ''}
${request.Industry ? `Industry: ${request.Industry}` : ''}
${request.CompanySize ? `Company Size: ${request.CompanySize}` : ''}

SERVICE DETAILS
Service: ${request.ServiceName}
${service?.Description ? `Description: ${service.Description}` : ''}

DEAL INFORMATION
Interest Level: ${request.InterestLevel}
${request.DealValue ? `Estimated Value: ${formatCurrency(request.DealValue)}` : ''}
${request.Budget ? `Client Budget: ${request.Budget}` : ''}
${request.Timeline ? `Client Timeline: ${request.Timeline}` : ''}

${request.Requirements ? `REQUIREMENTS\n${request.Requirements}\n` : ''}
TEAM
Account Manager: ${request.AccountManagerName} (${request.AccountManagerEmail})
${request.AssignedSpecialistName ? `Specialist: ${request.AssignedSpecialistName} (${request.AssignedSpecialistEmail})` : ''}

---
Managed by DWx Traffic Manager
  `.trim();
};

// ============================================================================
// PRODUCT REQUEST EMAILS
// ============================================================================

/**
 * 11. Product request submitted — sent to AM
 */
export const productRequestCreatedAM = (request: ProductRequest): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(request.AccountManagerName)}</strong>,</p>
    <p>Your ${request.RequestType.toLowerCase()} request for <strong>${escapeHtml(request.ProductName)}</strong> has been successfully submitted.</p>
    ${row('Product', escapeHtml(request.ProductName))}
    ${row('Type', `${request.ProductType} &mdash; ${request.RequestType}`)}
    ${row('Client', escapeHtml(request.ClientName) + (request.IsPremiumClient ? ' ' + premium() : ''))}
    ${row('Contact', `${escapeHtml(request.ContactName)} (${escapeHtml(request.ContactEmail)})`)}
    ${row('Status', badge(request.Status, STATUS_STYLES[request.Status] || STATUS_STYLES['Pending Review']))}
    ${request.LicenseCount ? row('Licenses', String(request.LicenseCount)) : ''}
    ${request.EstimatedValue ? row('Estimated Value', dealValue(formatCurrency(request.EstimatedValue))) : ''}
    ${request.ProposedSlot1 ? card('#1e6b7b', 'Proposed Time Slots',
      buildSlots(request.ProposedSlot1, request.ProposedSlot2, request.ProposedSlot3)
    ) : ''}
    <p style="margin-top:20px;">You'll be notified when the request is reviewed and a specialist is assigned.</p>
  `;
  return {
    subject: `[DWx] Product ${request.RequestType} Request Submitted - ${escapeHtml(request.ProductName)} for ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.standard, 'Product Request Submitted', content),
  };
};

/**
 * 12. Product request submitted — sent to managers
 */
export const productRequestCreatedManager = (request: ProductRequest): { subject: string; body: string } => {
  const content = `
    <p>A new product request requires your review.</p>
    ${row('Product', `${escapeHtml(request.ProductName)} (${request.ProductType})`)}
    ${row('Request Type', request.RequestType)}
    ${row('Client', escapeHtml(request.ClientName) + (request.IsPremiumClient ? ' ' + premium() : ''))}
    ${row('Contact', `${escapeHtml(request.ContactName)} (${escapeHtml(request.ContactEmail)})`)}
    ${row('Submitted By', `${escapeHtml(request.AccountManagerName)} (${escapeHtml(request.AccountManagerEmail)})`)}
    ${request.LicenseCount ? row('Licenses', String(request.LicenseCount)) : ''}
    ${request.EstimatedValue ? row('Estimated Value', dealValue(formatCurrency(request.EstimatedValue))) : ''}
    ${request.ProposedSlot1 ? card('#1e6b7b', 'Proposed Time Slots',
      buildSlots(request.ProposedSlot1, request.ProposedSlot2, request.ProposedSlot3)
    ) : ''}
    ${request.Comments ? callout('#616161', '#f5f5f5', `<strong>Comments:</strong><p style="margin:5px 0 0;">${escapeHtml(request.Comments)}</p>`) : ''}
    <p style="margin-top:20px;">Please review this request and assign a specialist.</p>
  `;
  return {
    subject: `[DWx] New Product ${request.RequestType} - ${escapeHtml(request.ProductName)} for ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.standard, 'New Product Request', content),
  };
};

/**
 * 13. Product specialist assigned — sent to AM
 */
export const productSpecialistAssignedAM = (
  request: ProductRequest,
  specialistName: string,
  specialistEmail: string,
  specialistRole: string
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(request.AccountManagerName)}</strong>,</p>
    <p>A specialist has been assigned to your ${request.RequestType.toLowerCase()} request for <strong>${escapeHtml(request.ProductName)}</strong>.</p>
    ${callout('#1e6b7b', '#e8f4fc',
      row('Specialist', `<strong>${escapeHtml(specialistName)}</strong>`) +
      row('Role', specialistRole) +
      row('Email', `<a href="mailto:${escapeHtml(specialistEmail)}" style="color:#1e6b7b;">${escapeHtml(specialistEmail)}</a>`)
    )}
    ${row('Product', `${escapeHtml(request.ProductName)} (${request.ProductType})`)}
    ${row('Request Type', request.RequestType)}
    ${row('Client', escapeHtml(request.ClientName))}
    <p style="margin-top:20px;">The specialist will coordinate with you to schedule the ${request.RequestType.toLowerCase()}.</p>
  `;
  return {
    subject: `[DWx] Specialist Assigned: ${escapeHtml(specialistName)} for ${escapeHtml(request.ProductName)} (${escapeHtml(request.ClientName)})`,
    body: wrap(GRAD.standard, 'Specialist Assigned', content),
  };
};

/**
 * 14. Product specialist assigned — sent to specialist
 */
export const productSpecialistAssignedSpecialist = (
  request: ProductRequest,
  specialistName: string
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(specialistName)}</strong>,</p>
    <p>You have been assigned to a product ${request.RequestType.toLowerCase()} request. Please review the details below.</p>
    ${row('Product', `<strong>${escapeHtml(request.ProductName)}</strong> (${request.ProductType})`)}
    ${row('Request Type', request.RequestType)}
    ${row('Client', escapeHtml(request.ClientName) + (request.IsPremiumClient ? ' ' + premium() : ''))}
    ${row('Contact', `${escapeHtml(request.ContactName)} (<a href="mailto:${escapeHtml(request.ContactEmail)}" style="color:#1e6b7b;">${escapeHtml(request.ContactEmail)}</a>)`)}
    ${request.ContactPhone ? row('Phone', escapeHtml(request.ContactPhone)) : ''}
    ${request.LicenseCount ? row('Licenses', String(request.LicenseCount)) : ''}
    ${request.EstimatedValue ? row('Estimated Value', dealValue(formatCurrency(request.EstimatedValue))) : ''}
    <p><strong>Account Manager:</strong> ${escapeHtml(request.AccountManagerName)} (<a href="mailto:${escapeHtml(request.AccountManagerEmail)}" style="color:#1e6b7b;">${escapeHtml(request.AccountManagerEmail)}</a>)</p>
    ${request.ProposedSlot1 ? card('#1e6b7b', 'Proposed Time Slots',
      buildSlots(request.ProposedSlot1, request.ProposedSlot2, request.ProposedSlot3)
    ) : ''}
    <p style="margin-top:20px;">Please confirm one of the proposed slots or coordinate with the Account Manager.</p>
  `;
  return {
    subject: `[DWx] New Assignment: ${escapeHtml(request.ProductName)} ${request.RequestType} for ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.purple, 'New Product Assignment', content),
  };
};

/**
 * 15. Product request status changed — sent to AM
 */
export const productRequestStatusChanged = (
  request: ProductRequest,
  previousStatus: string,
  newStatus: string
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(request.AccountManagerName)}</strong>,</p>
    <p>The status of your product request has been updated.</p>
    ${row('Product', `${escapeHtml(request.ProductName)} (${request.ProductType})`)}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Previous Status', badge(previousStatus, STATUS_STYLES[previousStatus] || STATUS_STYLES['Pending Review']))}
    ${row('New Status', badge(newStatus, STATUS_STYLES[newStatus] || STATUS_STYLES['Pending Review']))}
  `;
  return {
    subject: `[DWx] Product Request ${newStatus} - ${escapeHtml(request.ProductName)} for ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.standard, 'Product Request Status Updated', content),
  };
};

/**
 * 16. Product request status changed — sent to managers
 */
export const productRequestStatusChangedManager = (
  request: ProductRequest,
  previousStatus: string,
  newStatus: string
): { subject: string; body: string } => {
  const content = `
    <p>A product request status has changed and may require your attention.</p>
    ${row('Product', `${escapeHtml(request.ProductName)} (${request.ProductType})`)}
    ${row('Client', escapeHtml(request.ClientName) + (request.IsPremiumClient ? ' ' + premium() : ''))}
    ${row('Account Manager', escapeHtml(request.AccountManagerName))}
    ${row('Previous Status', badge(previousStatus, STATUS_STYLES[previousStatus] || STATUS_STYLES['Pending Review']))}
    ${row('New Status', badge(newStatus, STATUS_STYLES[newStatus] || STATUS_STYLES['Pending Review']))}
    ${request.AssignedSpecialistName ? row('Specialist', escapeHtml(request.AssignedSpecialistName)) : ''}
  `;

  const statusEmoji = newStatus === 'Confirmed' ? 'Confirmed' : newStatus === 'Completed' ? 'Completed' : newStatus === 'Cancelled' ? 'Cancelled' : 'Updated';
  return {
    subject: `[DWx] Product Request ${statusEmoji}: ${escapeHtml(request.ProductName)} - ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.standard, 'Product Request Update', content),
  };
};

/**
 * 17. Product demo confirmed — sent to specialist
 */
export const productDemoConfirmedSpecialist = (
  request: ProductRequest,
  specialistName: string,
  confirmedSlot: string
): { subject: string; body: string } => {
  const typeLabel = request.RequestType === 'Demo' ? 'Product Demo' : 'Trial Deployment';
  const content = `
    <p>Hi <strong>${escapeHtml(specialistName)}</strong>,</p>
    <p>A ${typeLabel.toLowerCase()} for <strong>${escapeHtml(request.ProductName)}</strong> has been confirmed. Please ensure you are prepared for the session.</p>
    ${confirmedBanner(formatDateTime(confirmedSlot))}
    ${row('Product', `${escapeHtml(request.ProductName)} (${request.ProductType})`)}
    ${row('Request Type', request.RequestType)}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Contact', `${escapeHtml(request.ContactName)} (${escapeHtml(request.ContactEmail)})`)}
    ${row('Account Manager', `${escapeHtml(request.AccountManagerName)} (<a href="mailto:${escapeHtml(request.AccountManagerEmail)}" style="color:#1e6b7b;">${escapeHtml(request.AccountManagerEmail)}</a>)`)}
    ${callout('#107c10', '#dff6dd',
      `<strong>Preparation Checklist:</strong>
      <ul style="margin:8px 0 0;padding-left:20px;">
        <li>Review the product requirements and client background</li>
        <li>Ensure the ${typeLabel.toLowerCase()} environment is ready</li>
        <li>Test your audio/video setup</li>
        <li>Have relevant documentation and pricing ready</li>
      </ul>`
    )}
  `;
  return {
    subject: `[DWx] ${typeLabel} Confirmed: ${escapeHtml(request.ProductName)} for ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.success, `${typeLabel} Confirmed`, content),
  };
};

// ============================================================================
// SESSION PREPARATION EMAILS
// ============================================================================

/**
 * 18. Session preparation created — sent to specialist
 */
export const sessionPrepCreated = (
  request: ServiceRequest,
  sessionPrep: SessionPreparation,
  confirmedSlot: string
): { subject: string; body: string } => {
  const isPremium = (request as any).IsPremiumClient;
  const content = `
    <p>Hi <strong>${escapeHtml(sessionPrep.SpecialistName)}</strong>,</p>
    <p>A session preparation has been created for your upcoming discovery meeting with <strong>${escapeHtml(request.ClientName)}</strong>. Use the AI-powered preparation tools to get ready for a successful meeting.</p>
    <div style="background:#f5eefa;border-left:4px solid #8b5cf6;padding:15px;border-radius:4px;margin:15px 0;">
      ${row('Meeting Date', `<strong>${formatDateTime(confirmedSlot)}</strong>`)}
      ${row('Service', escapeHtml(request.ServiceName))}
      ${row('Client', escapeHtml(request.ClientName) + (isPremium ? ' ' + premium() : ''))}
      ${row('Contact', `${escapeHtml(request.ContactName)} (${escapeHtml(request.ContactEmail)})`)}
      ${row('Interest Level', interestLabel(request.InterestLevel), `color:${interestColor(request.InterestLevel)}`)}
      ${request.DealValue ? row('Deal Value', dealValue(formatCurrency(request.DealValue))) : ''}
    </div>
    ${card('#8b5cf6', 'AI-Powered Preparation Tools',
      `<p>Access the Session Preparation panel in DWx Traffic Manager to:</p>
      <ul>
        <li><strong>Client Profile:</strong> AI-generated overview of the client, key stakeholders, and pain points</li>
        <li><strong>Talking Points:</strong> Customisable conversation guide with discovery questions and value propositions</li>
        <li><strong>Resource Suggestions:</strong> AI-recommended slide decks, case studies, and materials</li>
        <li><strong>Meeting Agenda:</strong> Suggested timeline and structure for the discovery session</li>
        <li><strong>Prep Checklist:</strong> Track your preparation progress</li>
      </ul>`
    )}
    ${request.Requirements ? callout('#616161', '#f5f5f5', `<strong>Client Requirements:</strong><p style="margin:5px 0 0;">${escapeHtml(request.Requirements)}</p>`) : ''}
    <p style="margin-top:20px;"><strong>Account Manager:</strong> ${escapeHtml(request.AccountManagerName)} (<a href="mailto:${escapeHtml(request.AccountManagerEmail)}" style="color:#1e6b7b;">${escapeHtml(request.AccountManagerEmail)}</a>)</p>
  `;
  return {
    subject: `[DWx] Session Preparation Ready: ${escapeHtml(request.ServiceName)} - ${escapeHtml(request.ClientName)}`,
    body: wrap(GRAD.ai, 'Session Preparation Ready', content),
  };
};

/**
 * 19/20. Session preparation reminder — sent to specialist
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

  const statusColor = isReady ? '#107c10' : '#f7630c';
  const statusLabel = isReady ? 'Ready' : 'Incomplete';
  const gradient = isReady ? GRAD.success : GRAD.warning;
  const headerTitle = isReady ? `Meeting Reminder - You're All Set` : `Meeting Reminder - ${hoursUntilMeeting} Hours Away`;

  const content = `
    <p>Hi <strong>${escapeHtml(sessionPrep.SpecialistName)}</strong>,</p>
    <p>This is a reminder that your discovery meeting with <strong>${escapeHtml(request.ClientName)}</strong> is scheduled for <strong>${formatDateTime(confirmedSlot)}</strong>.</p>
    ${!isReady ? countdownBanner(`${hoursUntilMeeting} Hours Until Meeting`, '#fff4ce', '#f7630c') : ''}
    <div style="background:${isReady ? '#dff6dd' : '#fff8f0'};border-left:4px solid ${statusColor};padding:15px;border-radius:4px;margin:15px 0;">
      ${row('Preparation Status', `<strong style="color:${statusColor};">${statusLabel}</strong>`)}
      ${row('Checklist Progress', `${completedItems} of ${totalItems} items (${completionPercentage}%)`)}
      ${row('AI Content', sessionPrep.AIGeneratedAt ? 'Generated' : 'Not generated')}
    </div>
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Contact', `${escapeHtml(request.ContactName)} (${escapeHtml(request.ContactEmail)})`)}
    ${!isReady
      ? callout('#f7630c', '#fef3c7', `<strong>Action Required:</strong> Your session preparation is not yet complete. Please review and complete your checklist items before the meeting.`)
      : callout('#107c10', '#d1fae5', `<strong>You're all set!</strong> Your session preparation is complete. Good luck with your meeting!`)
    }
  `;
  return {
    subject: `[DWx] Meeting in ${hoursUntilMeeting}h: ${escapeHtml(request.ClientName)} - ${isReady ? 'Ready' : 'Prep Incomplete'}`,
    body: wrap(gradient, headerTitle, content),
  };
};

// ============================================================================
// SYSTEM / ALERT EMAILS
// ============================================================================

/**
 * 21. Calendar event creation failed — sent to managers
 */
export const calendarEventFailed = (
  entityType: 'Service Request' | 'Product Request',
  entityTitle: string,
  clientName: string,
  confirmedSlot: string,
  accountManagerName: string
): { subject: string; body: string } => {
  const content = `
    <p>A calendar event could not be created automatically. Manual intervention may be needed.</p>
    <div style="background:#fde7e9;border-left:4px solid #d13438;padding:15px;border-radius:4px;margin:15px 0;">
      ${row(entityType, escapeHtml(entityTitle))}
      ${row('Client', escapeHtml(clientName))}
      ${row('Confirmed Slot', `<strong>${formatDateTime(confirmedSlot)}</strong>`)}
      ${row('Account Manager', escapeHtml(accountManagerName))}
    </div>
    <p><strong>Recommended Actions:</strong></p>
    <ul>
      <li>Manually create a Teams meeting for the confirmed time slot</li>
      <li>Ensure all attendees receive the meeting invitation</li>
      <li>Check that calendar permissions are correctly configured</li>
    </ul>
  `;
  return {
    subject: `[DWx] Calendar Event Failed: ${escapeHtml(clientName)} - ${formatDateTime(confirmedSlot)}`,
    body: wrap(GRAD.danger, 'Calendar Event Failed', content),
  };
};

/**
 * 22. Welcome new Account Manager — sent to AM
 */
export const welcomeAccountManager = (
  name: string,
  email: string,
  region: string,
  source: string
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(name)}</strong>,</p>
    <p>You've been added as an Account Manager in the DWx Traffic Manager system. You can now submit service and product requests for your clients.</p>
    ${card('#1e6b7b', 'What You Can Do',
      `<ul>
        <li><strong>Browse Services:</strong> Explore our 6 service categories &mdash; Power Platform, SPFx, Migrations, Assessments, Copilot Agents, and Viva</li>
        <li><strong>Browse Products:</strong> View 29 DWx products across Apps, Web Parts, and Adaptive Cards</li>
        <li><strong>Submit Requests:</strong> Create service or product demo/trial requests for your clients</li>
        <li><strong>Track Progress:</strong> Monitor your requests through the sales pipeline</li>
      </ul>`
    )}
    ${callout('#1e6b7b', '#e8f4fc', row('Email', escapeHtml(email)) + row('Your Region', region) + row('Source', source))}
    <p style="margin-top:20px;">If you have any questions, please reach out to your DWx manager. Happy selling!</p>
  `;
  return {
    subject: `[DWx] Welcome to DWx Traffic Manager!`,
    body: wrap(GRAD.standard, 'Welcome to DWx Traffic Manager', content),
  };
};

/**
 * 23. Weekly pipeline digest — sent to managers
 */
export const weeklyPipelineDigest = (
  weekLabel: string,
  kpis: { totalPipeline: number; weightedPipeline: number; winRate: number },
  activity: { newRequests: number; dealsWon: number; wonRevenue: number; dealsLost: number; lostRevenue: number; meetingsScheduled: number; productDemos: number },
  stageBreakdown: Array<{ stage: string; count: number; value: number }>,
  hotDeals: Array<{ client: string; service: string; value: number; stage: string }>
): { subject: string; body: string } => {
  const kpiBox = (label: string, value: string, bg: string, color: string) =>
    `<div style="flex:1;background:${bg};padding:16px;border-radius:8px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:${color};">${value}</div>
      <div style="font-size:12px;color:#616161;margin-top:4px;">${label}</div>
    </div>`;

  const stageRows = stageBreakdown.map(s =>
    `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid #eee;">
      ${badge(s.stage, STAGE_STYLES[s.stage] || STAGE_STYLES.Lead)}
      <span style="flex:1;">${s.count} requests</span>
      <span style="font-weight:600;">${formatCurrency(s.value)}</span>
    </div>`
  ).join('');

  const hotDealItems = hotDeals.map(d =>
    `<li>${escapeHtml(d.client)} &mdash; ${escapeHtml(d.service)} (${formatCurrency(d.value)}) &mdash; ${d.stage}</li>`
  ).join('');

  const content = `
    <p>Here's your weekly summary of DWx Traffic Manager pipeline activity.</p>
    <div style="display:flex;gap:12px;margin:20px 0;">
      ${kpiBox('Total Pipeline', formatCurrency(kpis.totalPipeline), '#e8f4fc', '#1e6b7b')}
      ${kpiBox('Weighted Pipeline', formatCurrency(kpis.weightedPipeline), '#dff6dd', '#107c10')}
      ${kpiBox('Win Rate', `${kpis.winRate}%`, '#f5eefa', '#8b5cf6')}
    </div>
    ${card('#1e6b7b', "This Week's Activity",
      row('New Requests', String(activity.newRequests)) +
      row('Deals Won', `<span style="color:#107c10;font-weight:600;">${activity.dealsWon} (${formatCurrency(activity.wonRevenue)})</span>`) +
      row('Deals Lost', `<span style="color:#d13438;">${activity.dealsLost} (${formatCurrency(activity.lostRevenue)})</span>`) +
      row('Meetings Scheduled', String(activity.meetingsScheduled)) +
      row('Product Demos', String(activity.productDemos))
    )}
    ${card('#1e6b7b', 'Pipeline by Stage', stageRows)}
    ${hotDeals.length > 0 ? callout('#d13438', '#fde7e9', `<strong>Hot Leads Requiring Attention:</strong><ul style="margin:8px 0 0;padding-left:20px;">${hotDealItems}</ul>`) : ''}
  `;
  return {
    subject: `[DWx] Weekly Pipeline Digest - ${weekLabel}`,
    body: wrap(GRAD.standard, 'Weekly Pipeline Digest', content),
  };
};

// ============================================================================
// PROPOSAL EMAILS
// ============================================================================

export interface ProposalEmailContext {
  clientName: string;
  serviceName: string;
  proposalType: string;
  version: number;
  status: string;
  createdByName: string;
  createdByEmail: string;
  approvedByName?: string;
  accountManagerName: string;
  accountManagerEmail: string;
  grandTotal?: number;
  validUntil?: string;
  internalNotes?: string;
  clientFeedback?: string;
}

/**
 * 24. Proposal created — sent to creator + AM
 */
export const proposalCreated = (ctx: ProposalEmailContext): { subject: string; body: string } => {
  const content = `
    <p>A new proposal has been created for <strong>${escapeHtml(ctx.clientName)}</strong>.</p>
    ${row('Client', escapeHtml(ctx.clientName))}
    ${row('Service', escapeHtml(ctx.serviceName))}
    ${row('Proposal Type', ctx.proposalType)}
    ${row('Created By', `${escapeHtml(ctx.createdByName)} (${escapeHtml(ctx.createdByEmail)})`)}
    ${row('Version', String(ctx.version))}
    ${row('Status', ctx.status)}
    <p style="margin-top:20px;">Open the proposal in DWx Traffic Manager to start building content.</p>
  `;
  return {
    subject: `[DWx] New Proposal Created: ${escapeHtml(ctx.serviceName)} for ${escapeHtml(ctx.clientName)}`,
    body: wrap(GRAD.standard, 'New Proposal Created', content),
  };
};

/**
 * 25. Proposal submitted for review — sent to managers
 */
export const proposalSubmittedForReview = (ctx: ProposalEmailContext): { subject: string; body: string } => {
  const content = `
    <p>A proposal has been submitted for your review and requires your approval.</p>
    ${row('Client', escapeHtml(ctx.clientName))}
    ${row('Service', escapeHtml(ctx.serviceName))}
    ${row('Proposal Type', ctx.proposalType)}
    ${row('Version', String(ctx.version))}
    ${row('Submitted By', `${escapeHtml(ctx.createdByName)} (${escapeHtml(ctx.createdByEmail)})`)}
    ${ctx.grandTotal ? row('Grand Total', dealValue(formatCurrency(ctx.grandTotal))) : ''}
    <p style="margin-top:20px;">Please review and approve or request revisions.</p>
  `;
  return {
    subject: `[DWx] Proposal Awaiting Review: ${escapeHtml(ctx.serviceName)} for ${escapeHtml(ctx.clientName)}`,
    body: wrap(GRAD.warning, 'Proposal Awaiting Review', content),
  };
};

/**
 * 26. Proposal revision requested — sent to creator
 */
export const proposalRevisionRequested = (ctx: ProposalEmailContext): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(ctx.createdByName)}</strong>,</p>
    <p>Your proposal for <strong>${escapeHtml(ctx.clientName)}</strong> requires revisions before it can be approved.</p>
    ${row('Client', escapeHtml(ctx.clientName))}
    ${row('Service', escapeHtml(ctx.serviceName))}
    ${ctx.internalNotes ? callout('#f7630c', '#fff8f0', `<strong>Reviewer Notes:</strong><p style="margin:5px 0 0;">${escapeHtml(ctx.internalNotes)}</p>`) : ''}
    <p style="margin-top:20px;">Please address the feedback and re-submit.</p>
  `;
  return {
    subject: `[DWx] Proposal Revision Requested: ${escapeHtml(ctx.serviceName)} for ${escapeHtml(ctx.clientName)}`,
    body: wrap(GRAD.warning, 'Proposal Revision Requested', content),
  };
};

/**
 * 27. Proposal approved — sent to creator + AM
 */
export const proposalApproved = (ctx: ProposalEmailContext): { subject: string; body: string } => {
  const content = `
    <p>The proposal for <strong>${escapeHtml(ctx.clientName)}</strong> has been approved and is ready for delivery.</p>
    ${row('Client', escapeHtml(ctx.clientName))}
    ${row('Service', escapeHtml(ctx.serviceName))}
    ${ctx.approvedByName ? row('Approved By', escapeHtml(ctx.approvedByName)) : ''}
    ${ctx.grandTotal ? row('Grand Total', dealValue(formatCurrency(ctx.grandTotal))) : ''}
    ${callout('#107c10', '#dff6dd', `<strong>Next Step:</strong> The proposal is ready to send to the Account Manager for client delivery.`)}
  `;
  return {
    subject: `[DWx] Proposal Approved: ${escapeHtml(ctx.serviceName)} for ${escapeHtml(ctx.clientName)}`,
    body: wrap(GRAD.success, 'Proposal Approved', content),
  };
};

/**
 * 28. Proposal sent to client — sent to AM
 */
export const proposalSentToClient = (ctx: ProposalEmailContext): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(ctx.accountManagerName)}</strong>,</p>
    <p>The proposal for <strong>${escapeHtml(ctx.clientName)}</strong> has been sent for client review.</p>
    ${row('Client', escapeHtml(ctx.clientName))}
    ${row('Service', escapeHtml(ctx.serviceName))}
    ${row('Account Manager', `${escapeHtml(ctx.accountManagerName)} (${escapeHtml(ctx.accountManagerEmail)})`)}
    ${ctx.validUntil ? row('Valid Until', ctx.validUntil) : ''}
    ${ctx.grandTotal ? row('Grand Total', dealValue(formatCurrency(ctx.grandTotal))) : ''}
    <p style="margin-top:20px;">The proposal has been sent. Please follow up with the client.</p>
  `;
  return {
    subject: `[DWx] Proposal Sent for Client Review: ${escapeHtml(ctx.serviceName)} for ${escapeHtml(ctx.clientName)}`,
    body: wrap(GRAD.standard, 'Proposal Sent for Client Review', content),
  };
};

/**
 * 29. Proposal accepted — sent to AM + creator + managers
 */
export const proposalAccepted = (ctx: ProposalEmailContext): { subject: string; body: string } => {
  const content = `
    <p>Great news! The proposal for <strong>${escapeHtml(ctx.clientName)}</strong> has been accepted by the client.</p>
    ${callout('#107c10', '#dff6dd',
      row('Client', `<strong>${escapeHtml(ctx.clientName)}</strong>`) +
      row('Service', escapeHtml(ctx.serviceName)) +
      (ctx.grandTotal ? row('Deal Value', dealValue(formatCurrency(ctx.grandTotal))) : '')
    )}
    ${row('Account Manager', escapeHtml(ctx.accountManagerName))}
    ${row('Proposal Type', ctx.proposalType)}
    <p style="margin-top:20px;">The deal is moving to Negotiation stage.</p>
  `;
  return {
    subject: `[DWx] Proposal Accepted: ${escapeHtml(ctx.serviceName)} for ${escapeHtml(ctx.clientName)}`,
    body: wrap(GRAD.success, 'Proposal Accepted!', content),
  };
};

/**
 * 30. Proposal declined — sent to AM + creator + managers
 */
export const proposalDeclined = (ctx: ProposalEmailContext): { subject: string; body: string } => {
  const content = `
    <p>Unfortunately, the proposal for <strong>${escapeHtml(ctx.clientName)}</strong> has been declined by the client.</p>
    ${row('Client', escapeHtml(ctx.clientName))}
    ${row('Service', escapeHtml(ctx.serviceName))}
    ${row('Account Manager', escapeHtml(ctx.accountManagerName))}
    ${ctx.clientFeedback ? callout('#d13438', '#fde7e9', `<strong>Client Feedback:</strong><p style="margin:5px 0 0;">${escapeHtml(ctx.clientFeedback)}</p>`) : ''}
    <p style="margin-top:20px;">Review the feedback and consider next steps.</p>
  `;
  return {
    subject: `[DWx] Proposal Declined: ${escapeHtml(ctx.serviceName)} for ${escapeHtml(ctx.clientName)}`,
    body: wrap(GRAD.danger, 'Proposal Declined', content),
  };
};

// ============================================================================
// FOLLOW-UP REMINDER EMAILS
// ============================================================================

/**
 * 31. Follow-up reminder — sent to Account Manager
 */
const followUpReminderAM = (
  request: ServiceRequest,
  urgency: { level: string; reason: string; daysSinceUpdate: number; daysOverdue?: number }
): { subject: string; body: string } => {
  const isOverdue = urgency.level === 'overdue';
  const isCritical = urgency.level === 'critical';
  const gradient = isOverdue ? GRAD.danger : isCritical ? GRAD.danger : GRAD.warning;
  const urgencyLabel = isOverdue ? 'OVERDUE' : isCritical ? 'CRITICAL' : 'NEEDS ATTENTION';

  const content = `
    ${callout(
      isOverdue ? '#dc2626' : isCritical ? '#dc2626' : '#f7630c',
      isOverdue ? '#fee2e2' : isCritical ? '#fee2e2' : '#fff4ce',
      `<strong>${urgencyLabel}:</strong> ${escapeHtml(urgency.reason)}${urgency.daysOverdue ? ` (${urgency.daysOverdue} days overdue)` : ''}`
    )}
    <p style="margin:0 0 16px;color:#323130;">Hi ${escapeHtml(request.AccountManagerName)},</p>
    <p style="margin:0 0 16px;color:#323130;">The following deal requires your attention:</p>
    ${row('Deal', escapeHtml(request.Title))}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Stage', stageBadge(request.FunnelStage))}
    ${row('Deal Value', formatCurrency(request.DealValue))}
    ${row('Last Updated', formatDateTime(request.Modified || request.Created))}
    ${request.ExpectedCloseDate ? row('Expected Close', formatDateTime(request.ExpectedCloseDate)) : ''}
    ${row('Days Since Update', `<strong>${urgency.daysSinceUpdate}</strong>`)}
    <p style="margin:16px 0 0;color:#323130;">Please review this deal and take appropriate action — update the status, schedule a follow-up, or close the deal.</p>
  `;

  return {
    subject: `[${urgencyLabel}] Follow-Up Required: ${request.ClientName} - ${request.ServiceName}`,
    body: wrap(gradient, `Follow-Up Required — ${escapeHtml(request.ClientName)}`, content),
  };
};

/**
 * 32. Follow-up reminder — sent to managers (stale deal alert)
 */
const followUpReminderManager = (
  request: ServiceRequest,
  urgency: { level: string; reason: string; daysSinceUpdate: number; daysOverdue?: number }
): { subject: string; body: string } => {
  const isOverdue = urgency.level === 'overdue';
  const isCritical = urgency.level === 'critical';
  const gradient = isOverdue ? GRAD.danger : isCritical ? GRAD.danger : GRAD.warning;
  const urgencyLabel = isOverdue ? 'OVERDUE' : isCritical ? 'CRITICAL' : 'NEEDS ATTENTION';

  const content = `
    ${callout(
      isOverdue ? '#dc2626' : isCritical ? '#dc2626' : '#f7630c',
      isOverdue ? '#fee2e2' : isCritical ? '#fee2e2' : '#fff4ce',
      `<strong>${urgencyLabel}:</strong> ${escapeHtml(urgency.reason)}`
    )}
    <p style="margin:0 0 16px;color:#323130;">A deal in the pipeline requires management attention:</p>
    ${row('Deal', escapeHtml(request.Title))}
    ${row('Account Manager', escapeHtml(request.AccountManagerName))}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Stage', stageBadge(request.FunnelStage))}
    ${row('Deal Value', formatCurrency(request.DealValue))}
    ${row('Last Updated', formatDateTime(request.Modified || request.Created))}
    ${request.ExpectedCloseDate ? row('Expected Close', formatDateTime(request.ExpectedCloseDate)) : ''}
    ${row('Days Since Update', `<strong>${urgency.daysSinceUpdate}</strong>`)}
    <p style="margin:16px 0 0;color:#323130;">A follow-up reminder has been sent to ${escapeHtml(request.AccountManagerName)}. Please consider escalating if no action is taken.</p>
  `;

  return {
    subject: `[Manager Alert] Stale Deal: ${request.ClientName} - ${request.ServiceName} (${urgencyLabel})`,
    body: wrap(gradient, `Stale Deal Alert — ${escapeHtml(request.ClientName)}`, content),
  };
};

// ============================================================================
// SLA Breach / At-Risk Templates
// ============================================================================

/**
 * 33. SLA breach/at-risk alert — sent to Account Manager
 */
const slaBreachAlertAM = (
  request: ServiceRequest,
  slaInfo: { status: 'at-risk' | 'breached'; daysInStage: number; targetDays: number; stage: string }
): { subject: string; body: string } => {
  const isBreached = slaInfo.status === 'breached';
  const gradient = isBreached ? GRAD.danger : GRAD.warning;
  const statusLabel = isBreached ? 'SLA BREACHED' : 'SLA AT RISK';
  const overBy = slaInfo.daysInStage - slaInfo.targetDays;

  const content = `
    ${callout(
      isBreached ? '#dc2626' : '#f7630c',
      isBreached ? '#fee2e2' : '#fff4ce',
      `<strong>${statusLabel}:</strong> This deal has been in the ${escapeHtml(slaInfo.stage)} stage for ${slaInfo.daysInStage} business days (target: ${slaInfo.targetDays} days)${isBreached ? ` — ${overBy} day${overBy !== 1 ? 's' : ''} over target` : ''}`
    )}
    <p style="margin:0 0 16px;color:#323130;">Hi ${escapeHtml(request.AccountManagerName)},</p>
    <p style="margin:0 0 16px;color:#323130;">The following deal ${isBreached ? 'has breached' : 'is approaching'} its SLA target and requires your immediate attention:</p>
    ${row('Deal', escapeHtml(request.Title))}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Current Stage', stageBadge(slaInfo.stage))}
    ${row('Days in Stage', `<strong style="color:${isBreached ? '#dc2626' : '#f7630c'};">${slaInfo.daysInStage}</strong> / ${slaInfo.targetDays} target`)}
    ${row('Deal Value', formatCurrency(request.DealValue))}
    ${request.AssignedSpecialistName ? row('Specialist', escapeHtml(request.AssignedSpecialistName)) : ''}
    <p style="margin:16px 0 0;color:#323130;">${isBreached ? 'Please take immediate action to progress this deal or update the pipeline.' : 'Please review and take action before the SLA target is exceeded.'}</p>
  `;

  return {
    subject: `[${statusLabel}] ${request.ClientName} - ${request.ServiceName} (${slaInfo.stage}: ${slaInfo.daysInStage}/${slaInfo.targetDays} days)`,
    body: wrap(gradient, `${statusLabel} — ${escapeHtml(request.ClientName)}`, content),
  };
};

/**
 * 34. SLA breach/at-risk alert — sent to managers (escalation)
 */
const slaBreachAlertManagers = (
  request: ServiceRequest,
  slaInfo: { status: 'at-risk' | 'breached'; daysInStage: number; targetDays: number; stage: string }
): { subject: string; body: string } => {
  const isBreached = slaInfo.status === 'breached';
  const gradient = isBreached ? GRAD.danger : GRAD.warning;
  const statusLabel = isBreached ? 'SLA BREACHED' : 'SLA AT RISK';
  const overBy = slaInfo.daysInStage - slaInfo.targetDays;

  const content = `
    ${callout(
      isBreached ? '#dc2626' : '#f7630c',
      isBreached ? '#fee2e2' : '#fff4ce',
      `<strong>${statusLabel}:</strong> ${slaInfo.daysInStage} business days in ${escapeHtml(slaInfo.stage)} stage (target: ${slaInfo.targetDays} days)${isBreached ? ` — ${overBy} day${overBy !== 1 ? 's' : ''} over target` : ''}`
    )}
    <p style="margin:0 0 16px;color:#323130;">A deal in the pipeline ${isBreached ? 'has breached' : 'is approaching'} its SLA target:</p>
    ${row('Deal', escapeHtml(request.Title))}
    ${row('Account Manager', escapeHtml(request.AccountManagerName))}
    ${row('Client', escapeHtml(request.ClientName))}
    ${row('Service', escapeHtml(request.ServiceName))}
    ${row('Current Stage', stageBadge(slaInfo.stage))}
    ${row('Days in Stage', `<strong style="color:${isBreached ? '#dc2626' : '#f7630c'};">${slaInfo.daysInStage}</strong> / ${slaInfo.targetDays} target`)}
    ${row('Deal Value', formatCurrency(request.DealValue))}
    ${request.AssignedSpecialistName ? row('Specialist', escapeHtml(request.AssignedSpecialistName)) : ''}
    <p style="margin:16px 0 0;color:#323130;">${isBreached ? 'This deal has exceeded its SLA target. Please escalate or reassign as needed.' : 'An SLA alert has been sent to the Account Manager. Please monitor for follow-up.'}</p>
  `;

  return {
    subject: `[Manager Alert] ${statusLabel}: ${request.ClientName} - ${request.ServiceName} (${slaInfo.stage})`,
    body: wrap(gradient, `${statusLabel} — ${escapeHtml(request.ClientName)}`, content),
  };
};

// ============================================================================
// POST-MORTEM EMAILS
// ============================================================================

/**
 * 35. Post-mortem created — sent to specialist
 */
export const postMortemCreated = (
  specialistName: string,
  clientName: string,
  serviceName: string,
  finalStage: string,
  dealValue?: number
): string => {
  const outcomeStyle = finalStage === 'Won'
    ? 'color:#059669;font-weight:600;'
    : 'color:#dc2626;font-weight:600;';

  const content = `
    <p>Hi <strong>${escapeHtml(specialistName)}</strong>,</p>
    <p>A post-mortem has been created for your recently closed deal:</p>
    ${row('Client', escapeHtml(clientName))}
    ${row('Service', escapeHtml(serviceName))}
    ${row('Outcome', `<span style="${outcomeStyle}">${escapeHtml(finalStage)}</span>`)}
    ${dealValue ? row('Deal Value', dealValue ? formatCurrency(dealValue) : 'Not specified') : ''}
    <p style="margin-top:20px;"><strong>Please take a few minutes to:</strong></p>
    <ul>
      <li>Review the AI-generated analysis</li>
      <li>Add any issues or blockers encountered</li>
      <li>Share lessons learned</li>
      <li>Add your specialist notes</li>
    </ul>
    <p style="margin-top:15px;color:#616161;font-size:13px;">Your input helps us continuously improve our delivery quality.</p>
  `;
  return wrap(GRAD.ai, 'Post-Mortem Created', content);
};

/**
 * 36. Post-mortem reviewed — sent to AM + specialist
 */
export const postMortemReviewed = (
  recipientName: string,
  clientName: string,
  serviceName: string,
  reviewerName: string,
  managerNotes: string,
  actionItemCount: number
): string => {
  const content = `
    <p>Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
    <p><strong>${escapeHtml(reviewerName)}</strong> has completed the post-mortem review for:</p>
    ${row('Client', escapeHtml(clientName))}
    ${row('Service', escapeHtml(serviceName))}
    ${managerNotes ? callout('#107c10', '#dff6dd', `<strong>Manager Notes:</strong><p style="margin:5px 0 0;">${escapeHtml(managerNotes)}</p>`) : ''}
    ${actionItemCount > 0 ? `<p style="margin-top:15px;"><strong>${actionItemCount}</strong> action item${actionItemCount !== 1 ? 's have' : ' has'} been assigned. Please check your tasks.</p>` : ''}
    <p style="margin-top:15px;color:#616161;font-size:13px;">Thank you for contributing to our continuous improvement process.</p>
  `;
  return wrap(GRAD.success, 'Post-Mortem Review Complete', content);
};

/**
 * 37. Improvement action item assigned — sent to assignee
 */
export const actionItemAssigned = (
  assigneeName: string,
  actionTitle: string,
  actionDescription: string,
  priority: string,
  category: string,
  clientName: string,
  serviceName: string,
  dueDate?: string
): string => {
  const content = `
    <p>Hi <strong>${escapeHtml(assigneeName)}</strong>,</p>
    <p>You've been assigned an improvement action from a post-mortem:</p>
    ${row('Action', `<strong>${escapeHtml(actionTitle)}</strong>`)}
    ${row('Priority', escapeHtml(priority))}
    ${row('Category', escapeHtml(category))}
    ${dueDate ? row('Due Date', formatDateTime(dueDate)) : ''}
    ${row('Related Deal', `${escapeHtml(clientName)} - ${escapeHtml(serviceName)}`)}
    <div style="background:#f5f5f5;padding:15px;border-radius:4px;margin:15px 0;">
      <p style="margin:0;color:#323130;">${escapeHtml(actionDescription)}</p>
    </div>
    <p style="margin-top:15px;color:#616161;font-size:13px;">Completing improvement actions helps the team deliver better outcomes.</p>
  `;
  return wrap(GRAD.purple, 'Improvement Action Assigned', content);
};

/**
 * 38. AM accountability alert — sent to managers
 */
export const amAccountabilityAlert = (
  managerName: string,
  amName: string,
  amEmail: string,
  clientName: string,
  serviceName: string,
  finalStage: string,
  issueCount: number,
  dealValue?: number
): string => {
  const content = `
    <p>Hi <strong>${escapeHtml(managerName)}</strong>,</p>
    <p>The post-mortem for <strong>${escapeHtml(clientName)}</strong> has identified <strong>${issueCount}</strong> issue${issueCount !== 1 ? 's' : ''} attributed to the Account Manager:</p>
    ${row('Account Manager', `${escapeHtml(amName)} (${escapeHtml(amEmail)})`)}
    ${row('Service', escapeHtml(serviceName))}
    ${row('Deal Outcome', `<span style="color:${finalStage === 'Won' ? '#059669' : '#dc2626'};font-weight:600;">${escapeHtml(finalStage)}</span>`)}
    ${dealValue ? row('Deal Value', formatCurrency(dealValue)) : ''}
    ${callout('#f7630c', '#fff8f0', `<strong>Coaching Opportunity:</strong><p style="margin:5px 0 0;">This may indicate a coaching opportunity. Please review the post-mortem and consider 1-on-1 feedback.</p>`)}
    <p style="margin-top:15px;color:#616161;font-size:13px;">Proactive coaching helps Account Managers grow and improves overall team performance.</p>
  `;
  return wrap(GRAD.danger, 'AM Accountability Alert', content);
};

// ============================================================================
// DELIVERY HANDOVER EMAILS
// ============================================================================

/**
 * 39. Handover created — sent to AM + specialist when deal moves to Won
 */
export const handoverCreated = (
  recipientName: string,
  clientName: string,
  serviceName: string,
  dealValue?: number,
  specialistName?: string
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
    <p>Congratulations on closing the deal with <strong>${escapeHtml(clientName)}</strong>! A delivery handover has been created to transition from pre-sales to delivery.</p>
    ${callout('#107c10', '#dff6dd',
      `<strong>Deal Closed Successfully!</strong><p style="margin:5px 0 0;">It's time to prepare for a smooth handover to the delivery team.</p>`
    )}
    ${row('Client', escapeHtml(clientName))}
    ${row('Service', escapeHtml(serviceName))}
    ${dealValue ? row('Deal Value', dealValue ? formatCurrency(dealValue) : 'Not specified') : ''}
    ${specialistName ? row('Specialist', escapeHtml(specialistName)) : ''}
    <p style="margin-top:20px;"><strong>Next Steps:</strong></p>
    <ul>
      <li>Delivery team members will be assigned to the project</li>
      <li>Scope of work and requirements will be reviewed</li>
      <li>A kickoff meeting will be scheduled with the client</li>
    </ul>
    <p style="margin-top:15px;color:#616161;font-size:13px;">You will be notified as the handover progresses through each stage.</p>
  `;
  return {
    subject: `[DWx] Delivery Handover Created: ${escapeHtml(serviceName)} for ${escapeHtml(clientName)}`,
    body: wrap(GRAD.success, 'Delivery Handover Created', content),
  };
};

/**
 * 40. Delivery team assigned — sent to each delivery team member
 */
export const deliveryTeamAssigned = (
  recipientName: string,
  roleName: string,
  clientName: string,
  serviceName: string,
  projectManagerName?: string,
  kickoffDate?: string,
  dealValue?: number
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
    <p>You have been assigned to the delivery team for <strong>${escapeHtml(clientName)}</strong>. Please review the details below and prepare for the engagement.</p>
    ${callout('#6264a7', '#ede9fe',
      row('Your Role', `<strong>${escapeHtml(roleName)}</strong>`) +
      row('Client', escapeHtml(clientName)) +
      row('Service', escapeHtml(serviceName))
    )}
    ${projectManagerName ? row('Project Manager', escapeHtml(projectManagerName)) : ''}
    ${kickoffDate ? row('Kickoff Date', formatDateTime(kickoffDate)) : ''}
    ${dealValue ? row('Deal Value', dealValue ? formatCurrency(dealValue) : 'Not specified') : ''}
    ${card('#6264a7', 'Onboarding Checklist',
      `<ul>
        <li>Review the scope of work and deliverables</li>
        <li>Check the client brief and requirements documentation</li>
        <li>Attend the kickoff meeting when scheduled</li>
      </ul>`
    )}
    <p style="margin-top:15px;color:#616161;font-size:13px;">Contact the Project Manager if you have any questions about your assignment.</p>
  `;
  return {
    subject: `[DWx] Delivery Assignment: ${escapeHtml(roleName)} for ${escapeHtml(clientName)} - ${escapeHtml(serviceName)}`,
    body: wrap(GRAD.purple, 'Delivery Team Assignment', content),
  };
};

/**
 * 41. Handover meeting scheduled — sent to all stakeholders
 */
export const handoverMeetingScheduled = (
  recipientName: string,
  clientName: string,
  serviceName: string,
  meetingDate: string,
  meetingLink?: string,
  attendeeNames: string[] = []
): { subject: string; body: string } => {
  const attendeeList = attendeeNames.length > 0
    ? `<ul style="margin:8px 0 0;padding-left:20px;">${attendeeNames.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>`
    : '';

  const meetingButton = meetingLink
    ? `<div style="text-align:center;margin:20px 0;">
        <a href="${escapeHtml(meetingLink)}" style="display:inline-block;padding:12px 28px;background-color:#1e6b7b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Join Meeting</a>
      </div>`
    : '';

  const content = `
    <p>Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
    <p>A kickoff meeting has been scheduled for the <strong>${escapeHtml(serviceName)}</strong> delivery for <strong>${escapeHtml(clientName)}</strong>.</p>
    ${row('Client', escapeHtml(clientName))}
    ${row('Service', escapeHtml(serviceName))}
    ${row('Date & Time', `<strong>${formatDateTime(meetingDate)}</strong>`)}
    ${meetingButton}
    ${attendeeNames.length > 0 ? card('#1e6b7b', 'Attendees', attendeeList) : ''}
    ${callout('#1e6b7b', '#e8f4fc',
      `<strong>Preparation Items:</strong>
      <ul style="margin:8px 0 0;padding-left:20px;">
        <li>Review the scope of work and deliverables</li>
        <li>Prepare any questions for the client</li>
        <li>Test your audio/video setup before the meeting</li>
      </ul>`
    )}
  `;
  return {
    subject: `[DWx] Kickoff Meeting Scheduled: ${escapeHtml(serviceName)} for ${escapeHtml(clientName)}`,
    body: wrap(GRAD.standard, 'Kickoff Meeting Scheduled', content),
  };
};

/**
 * 42. Handover complete — sent when handover is marked as Delivered
 */
export const handoverComplete = (
  recipientName: string,
  clientName: string,
  serviceName: string,
  deliveryManagerName?: string,
  handoverDays: number = 0
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
    <p>The delivery handover for <strong>${escapeHtml(clientName)}</strong> has been completed successfully.</p>
    ${callout('#107c10', '#dff6dd',
      `<strong>Handover Complete!</strong><p style="margin:5px 0 0;">The project is now fully transitioned to the delivery team and ready for kickoff.</p>`
    )}
    ${row('Client', escapeHtml(clientName))}
    ${row('Service', escapeHtml(serviceName))}
    ${deliveryManagerName ? row('Delivery Manager', escapeHtml(deliveryManagerName)) : ''}
    ${row('Handover Duration', `${handoverDays} day${handoverDays !== 1 ? 's' : ''}`)}
    <p style="margin-top:20px;"><strong>Next Steps for Delivery:</strong></p>
    <ul>
      <li>Confirm the project kickoff date with the client</li>
      <li>Finalise resource allocation and project plan</li>
      <li>Set up project communication channels</li>
    </ul>
    <p style="margin-top:15px;color:#616161;font-size:13px;">Thank you for ensuring a smooth transition from pre-sales to delivery.</p>
  `;
  return {
    subject: `[DWx] Handover Complete: ${escapeHtml(serviceName)} for ${escapeHtml(clientName)}`,
    body: wrap(GRAD.success, 'Handover Complete', content),
  };
};

/**
 * 43. Handover at risk — sent to managers when handover exceeds 14 days without progressing
 */
export const handoverAtRisk = (
  managerName: string,
  clientName: string,
  serviceName: string,
  amName: string,
  daysSinceWon: number,
  currentStatus: string,
  dealValue?: number
): { subject: string; body: string } => {
  const content = `
    <p>Hi <strong>${escapeHtml(managerName)}</strong>,</p>
    <p>A delivery handover is at risk of stalling and requires your attention.</p>
    ${callout('#d13438', '#fde7e9',
      `<strong>Handover At Risk:</strong> This handover has been pending for <strong>${daysSinceWon}</strong> day${daysSinceWon !== 1 ? 's' : ''} since the deal was won without progressing past the current status.`
    )}
    ${row('Client', escapeHtml(clientName))}
    ${row('Service', escapeHtml(serviceName))}
    ${row('Account Manager', escapeHtml(amName))}
    ${row('Days Since Won', `<strong style="color:#d13438;">${daysSinceWon}</strong>`)}
    ${row('Current Status', escapeHtml(currentStatus))}
    ${dealValue ? row('Deal Value', dealValue ? formatCurrency(dealValue) : 'Not specified') : ''}
    <p style="margin-top:20px;"><strong>Recommended Actions:</strong></p>
    <ul>
      <li>Contact the Account Manager to understand the delay</li>
      <li>Assign delivery team members if not yet done</li>
      <li>Schedule the kickoff meeting with the client</li>
      <li>Escalate if resources are unavailable</li>
    </ul>
  `;
  return {
    subject: `[DWx] HANDOVER AT RISK: ${escapeHtml(clientName)} - ${escapeHtml(serviceName)} (${daysSinceWon} days)`,
    body: wrap(GRAD.danger, 'Handover At Risk', content),
  };
};

/**
 * 44. Delivery kickoff reminder — sent 24h before scheduled kickoff meeting
 */
export const deliveryKickoffReminder = (
  recipientName: string,
  clientName: string,
  serviceName: string,
  kickoffDate: string,
  meetingLink?: string
): { subject: string; body: string } => {
  const meetingButton = meetingLink
    ? `<div style="text-align:center;margin:20px 0;">
        <a href="${escapeHtml(meetingLink)}" style="display:inline-block;padding:12px 28px;background-color:#1e6b7b;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">Join Meeting</a>
      </div>`
    : '';

  const content = `
    <p>Hi <strong>${escapeHtml(recipientName)}</strong>,</p>
    <p>This is a reminder that the delivery kickoff meeting for <strong>${escapeHtml(clientName)}</strong> is scheduled for tomorrow.</p>
    ${callout('#f7630c', '#fff8f0',
      `<strong>Meeting Tomorrow:</strong> ${formatDateTime(kickoffDate)}`
    )}
    ${row('Client', escapeHtml(clientName))}
    ${row('Service', escapeHtml(serviceName))}
    ${row('Date & Time', `<strong>${formatDateTime(kickoffDate)}</strong>`)}
    ${meetingButton}
    ${card('#f7630c', 'Preparation Checklist',
      `<ul>
        <li>Review the scope of work and client requirements</li>
        <li>Prepare your introduction and role overview</li>
        <li>Have the project timeline and milestones ready</li>
        <li>Test your audio/video setup</li>
        <li>Prepare any client-facing materials or demos</li>
      </ul>`
    )}
  `;
  return {
    subject: `[DWx] Kickoff Meeting Tomorrow: ${escapeHtml(serviceName)} for ${escapeHtml(clientName)}`,
    body: wrap(GRAD.warning, 'Kickoff Meeting Reminder', content),
  };
};

// ============================================================================
// Export map
// ============================================================================

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
  // New templates
  welcomeAccountManager,
  weeklyPipelineDigest,
  // Proposal templates
  proposalCreated,
  proposalSubmittedForReview,
  proposalRevisionRequested,
  proposalApproved,
  proposalSentToClient,
  proposalAccepted,
  proposalDeclined,
  // Follow-up reminder templates
  followUpReminderAM,
  followUpReminderManager,
  // SLA breach/at-risk templates
  slaBreachAlertAM,
  slaBreachAlertManagers,
  // Post-mortem templates
  postMortemCreated,
  postMortemReviewed,
  actionItemAssigned,
  amAccountabilityAlert,
  // Delivery handover templates
  handoverCreated,
  deliveryTeamAssigned,
  handoverMeetingScheduled,
  handoverComplete,
  handoverAtRisk,
  deliveryKickoffReminder,
};
