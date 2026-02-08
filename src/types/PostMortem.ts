/**
 * Post Mortem & Issues Tracking Types
 * AI-powered post-mortem system for completed deals (Won/Lost)
 * v2.14.0
 */

import type { FunnelStage, ServiceCategory } from './ServiceRequest';

// ============================================================================
// Issue Tracking
// ============================================================================

export type IssueCategory =
  | 'Communication'
  | 'Process'
  | 'Technical'
  | 'Commercial'
  | 'Client-Side'
  | 'Resource'
  | 'Documentation';

export type IssueSeverity = 'Minor' | 'Moderate' | 'Major' | 'Critical';

export type IssueOwner =
  | 'Account Manager'
  | 'Specialist'
  | 'Management'
  | 'Client'
  | 'System';

export interface PostMortemIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  owner: IssueOwner;
  description: string;
  impact: string;
  stage?: FunnelStage;
  dateIdentified?: string;
  aiGenerated: boolean;
}

export const ISSUE_CATEGORIES: IssueCategory[] = [
  'Communication',
  'Process',
  'Technical',
  'Commercial',
  'Client-Side',
  'Resource',
  'Documentation',
];

export const ISSUE_CATEGORY_DESCRIPTIONS: Record<IssueCategory, string> = {
  Communication: 'Delays, miscommunication, unresponsive stakeholders',
  Process: 'Skipped steps, wrong workflow, SLA breaches',
  Technical: 'Environment issues, access problems, integration failures',
  Commercial: 'Pricing disagreements, scope creep, budget constraints',
  'Client-Side': 'Client delays, requirement changes, stakeholder turnover',
  Resource: 'Specialist availability, skill mismatch, capacity issues',
  Documentation: 'Missing docs, incomplete requirements, poor handover',
};

export const ISSUE_SEVERITIES: IssueSeverity[] = ['Minor', 'Moderate', 'Major', 'Critical'];

export const ISSUE_OWNERS: IssueOwner[] = [
  'Account Manager',
  'Specialist',
  'Management',
  'Client',
  'System',
];

export const SEVERITY_COLORS: Record<IssueSeverity, { bg: string; text: string }> = {
  Minor: { bg: '#e5e7eb', text: '#4b5563' },
  Moderate: { bg: '#fef3c7', text: '#92400e' },
  Major: { bg: '#fed7aa', text: '#c2410c' },
  Critical: { bg: '#fee2e2', text: '#991b1b' },
};

export const OWNER_COLORS: Record<IssueOwner, { bg: string; text: string }> = {
  'Account Manager': { bg: '#dbeafe', text: '#1e40af' },
  Specialist: { bg: '#ede9fe', text: '#6d28d9' },
  Management: { bg: '#fce7f3', text: '#be185d' },
  Client: { bg: '#fef3c7', text: '#92400e' },
  System: { bg: '#e5e7eb', text: '#4b5563' },
};

// ============================================================================
// Lessons Learned
// ============================================================================

export type LessonType =
  | 'Process Improvement'
  | 'Best Practice'
  | 'Pitfall to Avoid'
  | 'Client Management'
  | 'Technical Learning';

export const LESSON_TYPES: LessonType[] = [
  'Process Improvement',
  'Best Practice',
  'Pitfall to Avoid',
  'Client Management',
  'Technical Learning',
];

export interface LessonLearned {
  id: string;
  type: LessonType;
  lesson: string;
  context: string;
  applicability: ServiceCategory[];
  aiGenerated: boolean;
}

// ============================================================================
// Action Items
// ============================================================================

export type ActionItemStatus =
  | 'Open'
  | 'In Progress'
  | 'Completed'
  | 'Blocked'
  | 'Cancelled';

export type ActionItemPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ActionItemCategory =
  | 'Process'
  | 'System'
  | 'Training'
  | 'Documentation'
  | 'Template';

export const ACTION_ITEM_STATUSES: ActionItemStatus[] = [
  'Open',
  'In Progress',
  'Completed',
  'Blocked',
  'Cancelled',
];

export const ACTION_ITEM_PRIORITIES: ActionItemPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export const ACTION_ITEM_CATEGORIES: ActionItemCategory[] = [
  'Process',
  'System',
  'Training',
  'Documentation',
  'Template',
];

export const ACTION_STATUS_TRANSITIONS: Record<ActionItemStatus, ActionItemStatus[]> = {
  Open: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Blocked', 'Open'],
  Completed: [],
  Blocked: ['In Progress', 'Cancelled'],
  Cancelled: ['Open'],
};

export const ACTION_STATUS_COLORS: Record<ActionItemStatus, { bg: string; text: string }> = {
  Open: { bg: '#dbeafe', text: '#1e40af' },
  'In Progress': { bg: '#fef3c7', text: '#92400e' },
  Completed: { bg: '#d1fae5', text: '#065f46' },
  Blocked: { bg: '#fee2e2', text: '#991b1b' },
  Cancelled: { bg: '#e5e7eb', text: '#4b5563' },
};

export const PRIORITY_COLORS: Record<ActionItemPriority, { bg: string; text: string }> = {
  Low: { bg: '#e5e7eb', text: '#4b5563' },
  Medium: { bg: '#dbeafe', text: '#1e40af' },
  High: { bg: '#fed7aa', text: '#c2410c' },
  Urgent: { bg: '#fee2e2', text: '#991b1b' },
};

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  category: ActionItemCategory;
  assignedTo?: string;
  assignedToName?: string;
  dueDate?: string;
  completedDate?: string;
  completedBy?: string;
  aiGenerated: boolean;
}

// ============================================================================
// AI Analysis Types
// ============================================================================

export interface TimelineAnalysis {
  totalDuration: number;
  stageBreakdown: {
    stage: FunnelStage;
    daysInStage: number;
    targetDays: number;
    variance: number;
    bottleneck: boolean;
  }[];
  criticalPath: FunnelStage[];
  delayFactors: string[];
  slaBreachCount: number;
  efficiency: 'Excellent' | 'Good' | 'Acceptable' | 'Poor';
  summary: string;
}

export interface AccountabilityAssessment {
  amAccountability: {
    score: number;
    strengths: string[];
    improvementAreas: string[];
    specificIssues: string[];
  };
  specialistAccountability: {
    score: number;
    strengths: string[];
    improvementAreas: string[];
    specificIssues: string[];
  };
  clientFactors: {
    score: number;
    positiveFactors: string[];
    challenges: string[];
  };
  systemGaps: string[];
  overallAssessment: string;
}

export interface RootCauseAnalysis {
  primaryCause: string;
  contributingFactors: string[];
  preventability: 'Highly Preventable' | 'Somewhat Preventable' | 'Unavoidable';
  recommendations: string[];
}

// ============================================================================
// Post Mortem Entity
// ============================================================================

export type PostMortemStatus =
  | 'Draft'
  | 'Under Review'
  | 'Review Complete'
  | 'Actions In Progress'
  | 'Closed';

export const POST_MORTEM_STATUSES: PostMortemStatus[] = [
  'Draft',
  'Under Review',
  'Review Complete',
  'Actions In Progress',
  'Closed',
];

export const POST_MORTEM_STATUS_TRANSITIONS: Record<PostMortemStatus, PostMortemStatus[]> = {
  Draft: ['Under Review'],
  'Under Review': ['Review Complete', 'Draft'],
  'Review Complete': ['Actions In Progress', 'Draft'],
  'Actions In Progress': ['Closed', 'Review Complete'],
  Closed: ['Actions In Progress'],
};

export const PM_STATUS_COLORS: Record<PostMortemStatus, { bg: string; text: string }> = {
  Draft: { bg: '#e5e7eb', text: '#4b5563' },
  'Under Review': { bg: '#fef3c7', text: '#92400e' },
  'Review Complete': { bg: '#dbeafe', text: '#1e40af' },
  'Actions In Progress': { bg: '#ede9fe', text: '#6d28d9' },
  Closed: { bg: '#d1fae5', text: '#065f46' },
};

export interface PostMortem {
  Id: number;
  Title: string;

  // Deal reference
  ServiceRequestId: number;
  ClientName: string;
  ServiceName: string;
  FinalStage: 'Won' | 'Lost';
  WinLossReason?: string;
  DealValue?: number;

  // Ownership
  AccountManagerName: string;
  AccountManagerEmail: string;
  SpecialistName?: string;
  SpecialistEmail?: string;

  // Status
  Status: PostMortemStatus;
  ReviewedDate?: string;
  ReviewedBy?: string;
  ClosedDate?: string;

  // Core content (JSON columns)
  Issues: PostMortemIssue[];
  Lessons: LessonLearned[];
  ActionItems: ActionItem[];

  // AI analysis (JSON columns)
  TimelineAnalysis?: TimelineAnalysis;
  AccountabilityAssessment?: AccountabilityAssessment;
  RootCauseAnalysis?: RootCauseAnalysis;

  // Manual notes
  SpecialistNotes?: string;
  ManagerNotes?: string;

  // Metadata
  AIGeneratedAt?: string;

  Created: string;
  Modified?: string;
}

export interface PostMortemInput {
  ServiceRequestId: number;
  ClientName: string;
  ServiceName: string;
  FinalStage: 'Won' | 'Lost';
  WinLossReason?: string;
  DealValue?: number;
  AccountManagerName: string;
  AccountManagerEmail: string;
  SpecialistName?: string;
  SpecialistEmail?: string;
  Status?: PostMortemStatus;
  Issues?: PostMortemIssue[];
  Lessons?: LessonLearned[];
  ActionItems?: ActionItem[];
  SpecialistNotes?: string;
  ManagerNotes?: string;
}

// ============================================================================
// AI Context (assembled for AI generation)
// ============================================================================

export interface PostMortemAIContext {
  clientName: string;
  serviceName: string;
  serviceCategory?: ServiceCategory;
  finalStage: 'Won' | 'Lost';
  winLossReason?: string;
  dealValue?: number;
  accountManagerName: string;
  specialistName?: string;
  totalDurationDays?: number;
  slaBreakdown: {
    stage: string;
    daysInStage: number;
    targetDays?: number;
    status: string;
  }[];
  auditLogSummary: string[];
  checklistCompletion?: number;
  emailCount?: number;
  sessionPrepStatus?: string;
  proposalStatus?: string;
}

// ============================================================================
// Aggregate Analytics Types (for Dashboard InsightsTab)
// ============================================================================

export interface RecurringPattern {
  issueCategory: IssueCategory;
  frequency: number;
  affectedDeals: number;
  primaryOwner: IssueOwner;
  trend: 'Increasing' | 'Stable' | 'Decreasing';
  topDescription: string;
}

export interface AMPerformancePattern {
  amEmail: string;
  amName: string;
  totalDeals: number;
  issuesAttributed: number;
  issueRate: number;
  topIssueCategories: { category: IssueCategory; count: number }[];
  avgAccountabilityScore?: number;
}

export interface InsightsSummary {
  totalPostMortems: number;
  wonPostMortems: number;
  lostPostMortems: number;
  totalIssues: number;
  issuesByOwner: { owner: IssueOwner; count: number }[];
  issuesByCategory: { category: IssueCategory; count: number }[];
  issuesBySeverity: { severity: IssueSeverity; count: number }[];
  recurringPatterns: RecurringPattern[];
  amPerformance: AMPerformancePattern[];
  actionItemsOpen: number;
  actionItemsCompleted: number;
  lessonsLearned: number;
  avgSLABreachesPerDeal: number;
}

// ============================================================================
// Serialization Helpers
// ============================================================================

const safeParseJSON = <T>(json: string | null | undefined): T | null => {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

export const deserializeIssues = (json: string | null | undefined): PostMortemIssue[] =>
  safeParseJSON<PostMortemIssue[]>(json) || [];

export const deserializeLessons = (json: string | null | undefined): LessonLearned[] =>
  safeParseJSON<LessonLearned[]>(json) || [];

export const deserializeActionItems = (json: string | null | undefined): ActionItem[] =>
  safeParseJSON<ActionItem[]>(json) || [];

export const deserializeTimelineAnalysis = (json: string | null | undefined): TimelineAnalysis | undefined =>
  safeParseJSON<TimelineAnalysis>(json) || undefined;

export const deserializeAccountability = (json: string | null | undefined): AccountabilityAssessment | undefined =>
  safeParseJSON<AccountabilityAssessment>(json) || undefined;

export const deserializeRootCause = (json: string | null | undefined): RootCauseAnalysis | undefined =>
  safeParseJSON<RootCauseAnalysis>(json) || undefined;

export const generateItemId = (): string =>
  `pm_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
