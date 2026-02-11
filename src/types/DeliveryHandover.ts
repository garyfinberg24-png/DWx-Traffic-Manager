/**
 * Delivery Handover Types
 * Pre-sales to delivery transition system with team assignment,
 * scope transfer, and AI-generated client briefs.
 * v2.16.0
 */

import type { ServiceCategory } from './ServiceRequest';
import type { Deliverable, TimelinePhase, TechnologyItem } from './Proposal';

// ============================================================================
// Handover Status Workflow
// ============================================================================

export type HandoverStatus =
  | 'Pending'
  | 'In Progress'
  | 'Kickoff Scheduled'
  | 'Delivered'
  | 'Closed'
  | 'On Hold';

export const HANDOVER_STATUSES: HandoverStatus[] = [
  'Pending',
  'In Progress',
  'Kickoff Scheduled',
  'Delivered',
  'Closed',
  'On Hold',
];

export const HANDOVER_STATUS_TRANSITIONS: Record<HandoverStatus, HandoverStatus[]> = {
  'Pending': ['In Progress', 'On Hold'],
  'In Progress': ['Kickoff Scheduled', 'On Hold'],
  'Kickoff Scheduled': ['Delivered'],
  'Delivered': ['Closed'],
  'Closed': [],
  'On Hold': ['Pending', 'In Progress'],
};

/** Stepper display order (simplified for progress bar, excludes On Hold) */
export const HANDOVER_STEPPER_STAGES: HandoverStatus[] = [
  'Pending',
  'In Progress',
  'Kickoff Scheduled',
  'Delivered',
  'Closed',
];

export const HANDOVER_STATUS_COLORS: Record<HandoverStatus, { bg: string; text: string; accent: string }> = {
  'Pending': { bg: '#e5e7eb', text: '#4b5563', accent: '#9ca3af' },
  'In Progress': { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
  'Kickoff Scheduled': { bg: '#dbeafe', text: '#1e40af', accent: '#3b82f6' },
  'Delivered': { bg: '#ede9fe', text: '#6d28d9', accent: '#8b5cf6' },
  'Closed': { bg: '#d1fae5', text: '#065f46', accent: '#10b981' },
  'On Hold': { bg: '#fee2e2', text: '#991b1b', accent: '#ef4444' },
};

// ============================================================================
// Delivery Roles
// ============================================================================

export type DeliveryRole =
  | 'Project Manager'
  | 'Delivery Manager'
  | 'Developer'
  | 'Senior Developer'
  | 'Business Analyst'
  | 'UX Designer'
  | 'QA Engineer'
  | 'DevOps Engineer';

export const DELIVERY_ROLES: DeliveryRole[] = [
  'Project Manager',
  'Delivery Manager',
  'Developer',
  'Senior Developer',
  'Business Analyst',
  'UX Designer',
  'QA Engineer',
  'DevOps Engineer',
];

export const DELIVERY_ROLE_COLORS: Record<DeliveryRole, { bg: string; text: string }> = {
  'Project Manager': { bg: '#dbeafe', text: '#1e40af' },
  'Delivery Manager': { bg: '#fce7f3', text: '#be185d' },
  'Developer': { bg: '#d1fae5', text: '#065f46' },
  'Senior Developer': { bg: '#a7f3d0', text: '#047857' },
  'Business Analyst': { bg: '#fef3c7', text: '#92400e' },
  'UX Designer': { bg: '#ede9fe', text: '#6d28d9' },
  'QA Engineer': { bg: '#fed7aa', text: '#c2410c' },
  'DevOps Engineer': { bg: '#e5e7eb', text: '#4b5563' },
};

// ============================================================================
// Delivery Skills
// ============================================================================

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export const SKILL_PROFICIENCIES: SkillProficiency[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert',
];

export interface DeliverySkill {
  name: string;
  proficiency: SkillProficiency;
}

// ============================================================================
// Team Assignment (per-project resource allocation)
// ============================================================================

export interface TeamAssignment {
  id: string;
  resourceId: number;
  resourceName: string;
  resourceEmail: string;
  role: DeliveryRole;
  allocationPercent: number; // 0-100
  startDate: string;
  endDate: string;
  responsibilities: string;
  isConfirmed: boolean;
}

// ============================================================================
// Scope Snapshot (auto-populated from Proposal)
// ============================================================================

export interface ScopeSnapshot {
  deliverables: Deliverable[];
  exclusions: string[];
  timeline: TimelinePhase[];
  technologies: Pick<TechnologyItem, 'name' | 'role'>[];
  totalHours: number;
  totalWeeks: number;
  contractValue: number;
  pricingModel: string;
}

// ============================================================================
// Client Brief (AI-generated)
// ============================================================================

export interface ClientStakeholder {
  name: string;
  role: string;
  relationship: string;
  notes: string;
}

export interface ClientBrief {
  executiveSummary: string;
  clientContext: string;
  keyStakeholders: ClientStakeholder[];
  communicationPreferences: string;
  criticalSuccessFactors: string[];
  potentialRisks: string[];
  winReason: string;
  relationshipDynamics: string;
  lessonsFromSales: string[];
}

// ============================================================================
// Environment Setup
// ============================================================================

export type EnvironmentName = 'Development' | 'UAT' | 'Staging' | 'Production';

export type EnvironmentStatus = 'Not Started' | 'In Progress' | 'Ready';

export interface EnvironmentEntry {
  name: EnvironmentName;
  url: string;
  status: EnvironmentStatus;
  notes: string;
}

export interface EnvironmentSetup {
  environments: EnvironmentEntry[];
  accessRequirements: string[];
  tooling: string[];
  repositoryUrl: string;
  cicdPipeline: string;
}

// ============================================================================
// Handover Checklist
// ============================================================================

export type HandoverChecklistCategory =
  | 'Documentation'
  | 'Access & Environment'
  | 'Team & Resources'
  | 'Client Communication'
  | 'Technical Setup'
  | 'Governance';

export const HANDOVER_CHECKLIST_CATEGORIES: HandoverChecklistCategory[] = [
  'Documentation',
  'Access & Environment',
  'Team & Resources',
  'Client Communication',
  'Technical Setup',
  'Governance',
];

export interface HandoverChecklistItem {
  id: string;
  category: HandoverChecklistCategory;
  description: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
  sortOrder: number;
}

export interface HandoverChecklistSummary {
  total: number;
  completed: number;
  required: number;
  requiredCompleted: number;
  isComplete: boolean;
  percentage: number;
  byCategory: Record<HandoverChecklistCategory, { total: number; completed: number }>;
}

// ============================================================================
// Risks & Assumptions
// ============================================================================

export type RiskAssumptionType = 'Risk' | 'Assumption';
export type RiskImpact = 'High' | 'Medium' | 'Low';
export type RiskSource = 'Proposal' | 'Post-Mortem' | 'Delivery';

export interface RiskAssumption {
  id: string;
  type: RiskAssumptionType;
  description: string;
  impact: RiskImpact;
  mitigation: string;
  owner: string;
  source: RiskSource;
}

// ============================================================================
// Delivery Resource Entity (DWxDeliveryResources list)
// ============================================================================

export interface DeliveryResource {
  Id: number;
  Title: string; // Full name
  Email: string;
  Phone: string;
  Role: DeliveryRole;
  Specializations: ServiceCategory[];
  MaxConcurrentProjects: number;
  CurrentProjectCount: number;
  HourlyRate: number; // ZAR
  AvailableFrom: string;
  Skills: DeliverySkill[];
  IsActive: boolean;
  Created: string;
  Modified?: string;
}

// ============================================================================
// Main Delivery Handover Entity (DWxDeliveryHandovers list)
// ============================================================================

export interface DeliveryHandover {
  Id: number;
  Title: string; // Auto: "Handover - {Client} - {Service}"

  // Related entities
  ServiceRequestId: number;
  ProposalId?: number;
  PostMortemId?: number;

  // Deal context
  ClientName: string;
  ProjectName: string;
  ServiceName: string;
  ServiceCategory: ServiceCategory;
  ContractValue: number; // ZAR

  // Status
  HandoverStatus: HandoverStatus;

  // Key dates
  WonDate: string;
  HandoverMeetingDate?: string;
  PlannedKickoffDate?: string;
  ActualKickoffDate?: string;
  PlannedGoLive?: string;
  HandoverCompletedDate?: string;

  // Pre-sales team
  AccountManagerName: string;
  AccountManagerEmail: string;
  PreSalesSpecialistName?: string;
  PreSalesSpecialistEmail?: string;

  // Delivery team
  DeliveryManagerName?: string;
  DeliveryManagerEmail?: string;
  ProjectManagerName?: string;
  ProjectManagerEmail?: string;

  // JSON content (parsed)
  ScopeSnapshot: ScopeSnapshot | null;
  DeliveryTeam: TeamAssignment[];
  HandoverChecklist: HandoverChecklistItem[];
  RisksAndAssumptions: RiskAssumption[];
  ClientBrief: ClientBrief | null;
  EnvironmentSetup: EnvironmentSetup | null;

  // Free-text notes
  PreSalesNotes?: string;
  DeliveryNotes?: string;
  ClientExpectations?: string;
  HandoverMeetingNotes?: string;

  // AI metadata
  AIGeneratedAt?: string;

  // SharePoint metadata
  Created: string;
  Modified?: string;
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateHandoverInput {
  ServiceRequestId: number;
  ProposalId?: number;
  PostMortemId?: number;
  ClientName: string;
  ProjectName: string;
  ServiceName: string;
  ServiceCategory: ServiceCategory;
  ContractValue: number;
  WonDate: string;
  AccountManagerName: string;
  AccountManagerEmail: string;
  PreSalesSpecialistName?: string;
  PreSalesSpecialistEmail?: string;
  PreSalesNotes?: string;
  ClientExpectations?: string;
}

export interface UpdateHandoverInput {
  HandoverStatus?: HandoverStatus;
  HandoverMeetingDate?: string;
  PlannedKickoffDate?: string;
  ActualKickoffDate?: string;
  PlannedGoLive?: string;
  HandoverCompletedDate?: string;
  DeliveryManagerName?: string;
  DeliveryManagerEmail?: string;
  ProjectManagerName?: string;
  ProjectManagerEmail?: string;
  ScopeSnapshot?: ScopeSnapshot;
  DeliveryTeam?: TeamAssignment[];
  HandoverChecklist?: HandoverChecklistItem[];
  RisksAndAssumptions?: RiskAssumption[];
  ClientBrief?: ClientBrief;
  EnvironmentSetup?: EnvironmentSetup;
  PreSalesNotes?: string;
  DeliveryNotes?: string;
  ClientExpectations?: string;
  HandoverMeetingNotes?: string;
  AIGeneratedAt?: string;
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

export const serializeScopeSnapshot = (data: ScopeSnapshot): string => JSON.stringify(data);
export const deserializeScopeSnapshot = (json: string | null | undefined): ScopeSnapshot | null =>
  safeParseJSON<ScopeSnapshot>(json);

export const serializeDeliveryTeam = (data: TeamAssignment[]): string => JSON.stringify(data);
export const deserializeDeliveryTeam = (json: string | null | undefined): TeamAssignment[] =>
  safeParseJSON<TeamAssignment[]>(json) || [];

export const serializeHandoverChecklist = (data: HandoverChecklistItem[]): string => JSON.stringify(data);
export const deserializeHandoverChecklist = (json: string | null | undefined): HandoverChecklistItem[] =>
  safeParseJSON<HandoverChecklistItem[]>(json) || [];

export const serializeRisksAndAssumptions = (data: RiskAssumption[]): string => JSON.stringify(data);
export const deserializeRisksAndAssumptions = (json: string | null | undefined): RiskAssumption[] =>
  safeParseJSON<RiskAssumption[]>(json) || [];

export const serializeClientBrief = (data: ClientBrief): string => JSON.stringify(data);
export const deserializeClientBrief = (json: string | null | undefined): ClientBrief | null =>
  safeParseJSON<ClientBrief>(json);

export const serializeEnvironmentSetup = (data: EnvironmentSetup): string => JSON.stringify(data);
export const deserializeEnvironmentSetup = (json: string | null | undefined): EnvironmentSetup | null =>
  safeParseJSON<EnvironmentSetup>(json);

export const generateHandoverId = (): string =>
  `ho_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ============================================================================
// Utility Functions
// ============================================================================

/** Compute checklist completion summary grouped by category */
export const getHandoverChecklistSummary = (items: HandoverChecklistItem[]): HandoverChecklistSummary => {
  const total = items.length;
  const completed = items.filter((i) => i.isCompleted).length;
  const required = items.filter((i) => i.isRequired).length;
  const requiredCompleted = items.filter((i) => i.isRequired && i.isCompleted).length;

  const byCategory = {} as Record<HandoverChecklistCategory, { total: number; completed: number }>;
  for (const cat of HANDOVER_CHECKLIST_CATEGORIES) {
    const catItems = items.filter((i) => i.category === cat);
    byCategory[cat] = {
      total: catItems.length,
      completed: catItems.filter((i) => i.isCompleted).length,
    };
  }

  return {
    total,
    completed,
    required,
    requiredCompleted,
    isComplete: required > 0 && requiredCompleted === required,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    byCategory,
  };
};

/** Create a default handover checklist combining universal + category-specific items */
export const createDefaultHandoverChecklist = (category?: ServiceCategory): HandoverChecklistItem[] => {
  const universal = DEFAULT_HANDOVER_CHECKLIST.map((item) => ({
    ...item,
    isCompleted: false,
  }));

  if (category && DEFAULT_CATEGORY_HANDOVER_CHECKLISTS[category]) {
    const categoryItems = DEFAULT_CATEGORY_HANDOVER_CHECKLISTS[category].map((item) => ({
      ...item,
      isCompleted: false,
      sortOrder: item.sortOrder + universal.length,
    }));
    return [...universal, ...categoryItems];
  }

  return universal;
};

/** Calculate business days since Won date (excludes weekends) */
export const getHandoverDaysSinceWon = (wonDate: string): number => {
  const start = new Date(wonDate);
  const today = new Date();

  if (isNaN(start.getTime())) return 0;

  let businessDays = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  while (current < today) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
  }

  return businessDays;
};

// ============================================================================
// Default Handover Checklists
// ============================================================================

const makeHandoverItems = (
  category: HandoverChecklistCategory,
  items: Array<{ description: string; isRequired?: boolean }>
): HandoverChecklistItem[] =>
  items.map((item, index) => ({
    id: `ho_default_${category.replace(/[^a-zA-Z]/g, '').toLowerCase()}_${index + 1}`,
    category,
    description: item.description,
    isRequired: item.isRequired !== false,
    isCompleted: false,
    sortOrder: index + 1,
  }));

/** Universal checklist items that apply to every handover regardless of service category */
export const DEFAULT_HANDOVER_CHECKLIST: HandoverChecklistItem[] = [
  // Documentation
  ...makeHandoverItems('Documentation', [
    { description: 'Signed proposal and SOW uploaded to document library' },
    { description: 'Discovery meeting notes and requirements summary shared with delivery team' },
    { description: 'Client contact details and org chart documented' },
    { description: 'Service history and previous engagement notes reviewed' },
  ]),
  // Access & Environment
  ...makeHandoverItems('Access & Environment', [
    { description: 'Client tenant access request submitted' },
    { description: 'SharePoint project site created for delivery artefacts' },
    { description: 'Azure DevOps or Planner board provisioned for task tracking', isRequired: false },
  ]),
  // Team & Resources
  ...makeHandoverItems('Team & Resources', [
    { description: 'Delivery Manager assigned and notified' },
    { description: 'Project Manager assigned and notified' },
    { description: 'Core delivery team confirmed and allocation percentages agreed' },
  ]),
  // Client Communication
  ...makeHandoverItems('Client Communication', [
    { description: 'Handover meeting scheduled with AM, specialist, and delivery lead' },
    { description: 'Client introduction email sent from delivery lead' },
    { description: 'Kickoff meeting date proposed to client', isRequired: false },
  ]),
  // Technical Setup
  ...makeHandoverItems('Technical Setup', [
    { description: 'Development environment requirements documented' },
    { description: 'Source control repository created or identified' },
  ]),
  // Governance
  ...makeHandoverItems('Governance', [
    { description: 'Project governance model agreed (RACI, escalation, reporting cadence)' },
    { description: 'Risk register initialised from proposal risks and post-mortem findings' },
    { description: 'Change control process confirmed with client' },
  ]),
];

/** Category-specific additional checklist items */
export const DEFAULT_CATEGORY_HANDOVER_CHECKLISTS: Partial<Record<ServiceCategory, HandoverChecklistItem[]>> = {
  'Power Platform': makeHandoverItems('Technical Setup', [
    { description: 'Power Platform environment (Dev/Test/Prod) provisioned' },
    { description: 'DLP policies reviewed and connectors whitelisted' },
    { description: 'Dataverse database created with security roles configured' },
    { description: 'Power Automate service account or connection references set up', isRequired: false },
  ]),

  'SPFx Development': makeHandoverItems('Technical Setup', [
    { description: 'App catalog (tenant or site-level) confirmed and accessible' },
    { description: 'SPFx development toolchain version agreed (Node.js, Yeoman)' },
    { description: 'API permissions pre-approved in Azure AD for Graph calls' },
    { description: 'CI/CD pipeline configured for SPFx package deployment', isRequired: false },
    { description: 'Target SharePoint sites and page layouts identified' },
  ]),

  'SharePoint Migration': makeHandoverItems('Technical Setup', [
    { description: 'Source environment inventory (sites, libraries, volumes) finalised' },
    { description: 'Migration tool licensed and installed (ShareGate/AvePoint/native)' },
    { description: 'User identity mapping (UPN) file prepared and validated' },
    { description: 'Target site structure and hub associations provisioned' },
    { description: 'Pilot migration scope agreed for initial test run' },
    { description: 'Rollback and communication plan documented' },
  ]),

  'M365 Assessment': makeHandoverItems('Documentation', [
    { description: 'Assessment scope and workstreams documented (security, governance, adoption)' },
    { description: 'Read-only admin access to M365 admin centre granted' },
    { description: 'Stakeholder interview schedule confirmed' },
    { description: 'Current Secure Score and compliance baseline captured' },
  ]),

  'Copilot Agents': makeHandoverItems('Technical Setup', [
    { description: 'M365 Copilot licences confirmed for development and pilot users' },
    { description: 'Azure AD app registration created for custom plugin OAuth' },
    { description: 'Knowledge sources (SharePoint sites, Graph connectors) identified and connected' },
    { description: 'Responsible AI review checklist completed', isRequired: false },
  ]),

  'Training': makeHandoverItems('Client Communication', [
    { description: 'Training audience list with role levels and headcount confirmed' },
    { description: 'Training topics, depth, and learning outcomes agreed' },
    { description: 'Demo/sandbox tenant provisioned for hands-on labs' },
    { description: 'Session logistics (dates, venue, Teams links) confirmed and invites sent' },
  ]),
};
