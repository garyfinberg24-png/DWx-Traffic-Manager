/**
 * DWx Traffic Manager - Email Thread Tracking Types
 * Tracks sent emails per service request for visibility into communication history.
 */

export type EmailType =
  | 'request_created'
  | 'stage_changed'
  | 'specialist_assigned'
  | 'discovery_confirmed'
  | 'deal_won'
  | 'deal_lost'
  | 'deal_value_changed'
  | 'proposal_created'
  | 'proposal_submitted'
  | 'proposal_approved'
  | 'proposal_sent'
  | 'follow_up_reminder'
  | 'sla_breach_alert'
  | 'post_mortem_created'
  | 'post_mortem_reviewed'
  | 'action_item_assigned'
  | 'am_accountability_alert'
  | 'handover_created'
  | 'delivery_team_assigned'
  | 'handover_meeting_scheduled'
  | 'handover_complete'
  | 'handover_at_risk'
  | 'delivery_kickoff_reminder'
  | 'milestone_overdue'
  | 'deliverable_submitted'
  | 'deliverable_approved'
  | 'deliverable_rejected'
  | 'final_signoff_recorded'
  | 'csat_recorded'
  | 'other';

export interface EmailRecord {
  id: string;
  subject: string;
  sentTo: string[];
  sentAt: string; // ISO datetime
  sentBy: string; // User display name
  type: EmailType;
}

/** Human-readable labels for email types */
export const EMAIL_TYPE_LABELS: Record<EmailType, string> = {
  request_created: 'Request Created',
  stage_changed: 'Stage Changed',
  specialist_assigned: 'Specialist Assigned',
  discovery_confirmed: 'Discovery Confirmed',
  deal_won: 'Deal Won',
  deal_lost: 'Deal Lost',
  deal_value_changed: 'Deal Value Changed',
  proposal_created: 'Proposal Created',
  proposal_submitted: 'Proposal Submitted',
  proposal_approved: 'Proposal Approved',
  proposal_sent: 'Proposal Sent',
  follow_up_reminder: 'Follow-Up Reminder',
  sla_breach_alert: 'SLA Breach Alert',
  post_mortem_created: 'Post-Mortem Created',
  post_mortem_reviewed: 'Post-Mortem Reviewed',
  action_item_assigned: 'Action Item Assigned',
  am_accountability_alert: 'AM Accountability Alert',
  handover_created: 'Handover Created',
  delivery_team_assigned: 'Delivery Team Assigned',
  handover_meeting_scheduled: 'Handover Meeting Scheduled',
  handover_complete: 'Handover Complete',
  handover_at_risk: 'Handover At Risk',
  delivery_kickoff_reminder: 'Kickoff Reminder',
  milestone_overdue: 'Milestone Overdue',
  deliverable_submitted: 'Deliverable Submitted',
  deliverable_approved: 'Deliverable Approved',
  deliverable_rejected: 'Deliverable Rejected',
  final_signoff_recorded: 'Final Sign-Off Recorded',
  csat_recorded: 'CSAT Recorded',
  other: 'Other',
};

/** Badge colors for email types */
export const EMAIL_TYPE_COLORS: Record<EmailType, { bg: string; text: string }> = {
  request_created: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
  stage_changed: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
  specialist_assigned: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' },
  discovery_confirmed: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
  deal_won: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669' },
  deal_lost: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
  deal_value_changed: { bg: 'rgba(245, 158, 11, 0.1)', text: '#D97706' },
  proposal_created: { bg: 'rgba(245, 158, 11, 0.1)', text: '#D97706' },
  proposal_submitted: { bg: 'rgba(245, 158, 11, 0.15)', text: '#B45309' },
  proposal_approved: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
  proposal_sent: { bg: 'rgba(30, 107, 123, 0.1)', text: '#1e6b7b' },
  follow_up_reminder: { bg: 'rgba(247, 99, 12, 0.1)', text: '#f7630c' },
  sla_breach_alert: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
  post_mortem_created: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' },
  post_mortem_reviewed: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' },
  action_item_assigned: { bg: 'rgba(98, 100, 167, 0.1)', text: '#6264a7' },
  am_accountability_alert: { bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626' },
  handover_created: { bg: 'rgba(30, 107, 123, 0.1)', text: '#1e6b7b' },
  delivery_team_assigned: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' },
  handover_meeting_scheduled: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6' },
  handover_complete: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669' },
  handover_at_risk: { bg: 'rgba(247, 99, 12, 0.1)', text: '#f7630c' },
  delivery_kickoff_reminder: { bg: 'rgba(245, 158, 11, 0.1)', text: '#D97706' },
  milestone_overdue: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
  deliverable_submitted: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6' },
  deliverable_approved: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669' },
  deliverable_rejected: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
  final_signoff_recorded: { bg: 'rgba(16, 185, 129, 0.2)', text: '#047857' },
  csat_recorded: { bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706' },
  other: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280' },
};
