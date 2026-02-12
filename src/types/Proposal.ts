/**
 * DWx Traffic Manager - Proposal Management Types
 * Types for the Proposal Management System (Lite) with AI generation,
 * internal approval workflow, and standard proposal sections.
 */

// ============================================================================
// Proposal Status Workflow
// ============================================================================

export type ProposalStatus =
  | 'Draft'
  | 'Internal Review'
  | 'Revision Requested'
  | 'Approved'
  | 'Sent to Client'
  | 'Accepted'
  | 'Declined';

export type ProposalType = 'Standard' | 'Custom' | 'Enterprise';

export const PROPOSAL_STATUS_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  'Draft': ['Internal Review'],
  'Internal Review': ['Approved', 'Revision Requested'],
  'Revision Requested': ['Internal Review'],
  'Approved': ['Sent to Client'],
  'Sent to Client': ['Accepted', 'Declined'],
  'Accepted': [],
  'Declined': [],
};

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  'Draft',
  'Internal Review',
  'Revision Requested',
  'Approved',
  'Sent to Client',
  'Accepted',
  'Declined',
];

// Stepper display order (simplified for the progress bar)
export const PROPOSAL_STEPPER_STAGES: ProposalStatus[] = [
  'Draft',
  'Internal Review',
  'Approved',
  'Sent to Client',
  'Accepted',
];

// ============================================================================
// Section 1: Executive Summary
// ============================================================================

export interface ExecutiveSummary {
  overview: string;
  objectives: string[];
  successCriteria: string[];
}

// ============================================================================
// Section 2: Solution Overview
// ============================================================================

export interface SolutionOverview {
  description: string;
  approach: string;
  differentiators: string[];
}

// ============================================================================
// Section 3: Technology Stack
// ============================================================================

export interface TechnologyItem {
  name: string;
  role: string;
  justification: string;
}

export interface TechnologyStack {
  technologies: TechnologyItem[];
}

// ============================================================================
// Section 4: Scope of Work
// ============================================================================

export interface Deliverable {
  title: string;
  description: string;
  hours: number;
}

export interface ScopeOfWork {
  deliverables: Deliverable[];
  exclusions: string[];
}

// ============================================================================
// Section 5: Pricing Breakdown
// ============================================================================

export interface PricingLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PricingBreakdown {
  lineItems: PricingLineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
}

// ============================================================================
// Section 6: Timeline & Milestones
// ============================================================================

export interface TimelinePhase {
  name: string;
  startWeek: number;
  endWeek: number;
  milestones: string[];
}

export interface ProposalTimeline {
  phases: TimelinePhase[];
  totalWeeks: number;
}

// ============================================================================
// Section 7: Team Composition
// ============================================================================

export interface TeamMember {
  role: string;
  name: string;
  responsibility: string;
}

export interface TeamComposition {
  members: TeamMember[];
}

// ============================================================================
// Section 8: Terms & Conditions
// ============================================================================

export interface ProposalTerms {
  paymentTerms: string;
  warranty: string;
  liability: string;
  confidentiality: string;
  ipOwnership: string;
  termination: string;
}

// ============================================================================
// Section 9: Change Control
// ============================================================================

export interface ChangeControl {
  process: string;
  approvalLevels: string[];
  pricingImpact: string;
}

// ============================================================================
// Section 10: Assumptions & Risks
// ============================================================================

export type RiskLevel = 'High' | 'Medium' | 'Low';

export interface ProposalRisk {
  risk: string;
  impact: RiskLevel;
  mitigation: string;
  likelihood: RiskLevel;
}

// ============================================================================
// Section 11: Signing Page
// ============================================================================

export interface SigningPage {
  clientSignatory: string;
  clientTitle: string;
  dwSignatory: string;
  dwTitle: string;
  proposedDate: string;
}

// ============================================================================
// Template Themes — visual styling per template
// ============================================================================

/** Colour scheme for a proposal template (hex values without #) */
export interface TemplateTheme {
  id: string;
  /** Primary colour — cover page stripe, section headings, table headers */
  primary: string;
  /** Accent colour — subheadings, teal-like accents, secondary tables */
  accent: string;
  /** Dark text colour */
  dark: string;
  /** Grey/muted text */
  grey: string;
  /** Success / pricing table header colour */
  success: string;
  /** Danger / risk table header colour */
  danger: string;
  /** Cover page subtitle text (e.g. "Proposal Document") */
  coverSubtitle: string;
  /** Whether to show CONFIDENTIAL watermark */
  confidentialWatermark: boolean;
  /** Header text on content pages */
  headerSuffix: string;
  /** Footer text on content pages */
  footerText: string;
  /** Company display name on cover page */
  companyName: string;
}

/** Standard: DWx brand blue/teal — clean professional layout */
const STANDARD_THEME: TemplateTheme = {
  id: 'standard',
  primary: '1A5A8A',
  accent: '1E6B7B',
  dark: '242424',
  grey: '616161',
  success: '107C10',
  danger: 'D13438',
  coverSubtitle: 'Proposal Document',
  confidentialWatermark: false,
  headerSuffix: 'Proposal',
  footerText: 'Prepared by Digital Workplace | Confidential',
  companyName: 'Digital Workplace',
};

/** Enterprise: Deep navy/gold — executive boardroom feel with CONFIDENTIAL watermark */
const ENTERPRISE_THEME: TemplateTheme = {
  id: 'enterprise',
  primary: '1B2A4A',
  accent: 'B8860B',
  dark: '1A1A2E',
  grey: '555555',
  success: '2E7D32',
  danger: 'B71C1C',
  coverSubtitle: 'Enterprise Proposal',
  confidentialWatermark: true,
  headerSuffix: 'Enterprise Proposal',
  footerText: 'Digital Workplace | Strictly Confidential',
  companyName: 'Digital Workplace',
};

/** Custom: Teal/coral — modern and distinctive for bespoke engagements */
const CUSTOM_THEME: TemplateTheme = {
  id: 'custom',
  primary: '0D7377',
  accent: 'E85D3A',
  dark: '2D2D2D',
  grey: '6B7280',
  success: '059669',
  danger: 'DC2626',
  coverSubtitle: 'Bespoke Proposal',
  confidentialWatermark: false,
  headerSuffix: 'Custom Proposal',
  footerText: 'Prepared by Digital Workplace | Bespoke Engagement',
  companyName: 'Digital Workplace',
};

export const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  standard: STANDARD_THEME,
  enterprise: ENTERPRISE_THEME,
  custom: CUSTOM_THEME,
};

/** Resolve a template theme from template name. Falls back to standard. */
export function getTemplateTheme(templateName?: string): TemplateTheme {
  if (!templateName) return STANDARD_THEME;
  const lower = templateName.toLowerCase();
  if (lower.includes('enterprise')) return ENTERPRISE_THEME;
  if (lower.includes('custom')) return CUSTOM_THEME;
  return STANDARD_THEME;
}

// ============================================================================
// Word Template Selection
// ============================================================================

export interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  suitableFor: ProposalType[];
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'standard',
    name: 'DW Standard Proposal',
    description: 'Clean, professional layout — DWx blue/teal colour scheme',
    suitableFor: ['Standard'],
  },
  {
    id: 'enterprise',
    name: 'DW Enterprise Proposal',
    description: 'Executive-focused layout — navy/gold colour scheme with CONFIDENTIAL watermark',
    suitableFor: ['Enterprise'],
  },
  {
    id: 'custom',
    name: 'DW Custom Proposal',
    description: 'Modern, distinctive layout — teal/coral colour scheme for bespoke engagements',
    suitableFor: ['Standard', 'Custom', 'Enterprise'],
  },
];

// ============================================================================
// Main Proposal Entity
// ============================================================================

export interface Proposal {
  Id: number;
  Title: string;
  ServiceRequestId: number;
  Status: ProposalStatus;
  Version: number;
  ProposalType: ProposalType;
  TemplateName: string;

  // Proposal sections (parsed from JSON columns)
  ExecutiveSummary: ExecutiveSummary | null;
  SolutionOverview: SolutionOverview | null;
  TechnologyStack: TechnologyStack | null;
  ScopeOfWork: ScopeOfWork | null;
  PricingBreakdown: PricingBreakdown | null;
  Timeline: ProposalTimeline | null;
  TeamComposition: TeamComposition | null;
  Terms: ProposalTerms | null;
  ChangeControl: ChangeControl | null;
  Assumptions: string[];
  Risks: ProposalRisk[];
  SigningPage: SigningPage | null;

  // Lifecycle metadata
  ValidUntil: string | null;
  SentDate: string | null;
  ClientResponseDate: string | null;
  ClientFeedback: string;
  InternalNotes: string;
  DocumentUrl: string;

  // Author & approval
  CreatedByEmail: string;
  CreatedByName: string;
  ApprovedByEmail: string;
  ApprovedByName: string;
  ApprovedDate: string | null;

  // SharePoint metadata
  Created: string;
  Modified: string;
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateProposalInput {
  serviceRequestId: number;
  proposalType: ProposalType;
  templateName: string;
  createdByEmail: string;
  createdByName: string;
}

export interface UpdateProposalInput {
  status?: ProposalStatus;
  version?: number;
  proposalType?: ProposalType;
  templateName?: string;
  executiveSummary?: ExecutiveSummary;
  solutionOverview?: SolutionOverview;
  technologyStack?: TechnologyStack;
  scopeOfWork?: ScopeOfWork;
  pricingBreakdown?: PricingBreakdown;
  timeline?: ProposalTimeline;
  teamComposition?: TeamComposition;
  terms?: ProposalTerms;
  changeControl?: ChangeControl;
  assumptions?: string[];
  risks?: ProposalRisk[];
  signingPage?: SigningPage;
  validUntil?: string;
  sentDate?: string;
  clientResponseDate?: string;
  clientFeedback?: string;
  internalNotes?: string;
  documentUrl?: string;
  approvedByEmail?: string;
  approvedByName?: string;
  approvedDate?: string;
}

export interface ProposalResult {
  success: boolean;
  proposal?: Proposal;
  error?: string;
}

// ============================================================================
// AI Generation Context
// ============================================================================

export interface ProposalAIContext {
  clientName: string;
  clientIndustry: string;
  clientSize: string;
  serviceName: string;
  serviceCategory: string;
  serviceDescription: string;
  serviceComplexity: string;
  serviceDuration: string;
  requirements: string;
  discoveryNotes: string;
  dealValue: number;
  dealProbability: number;
  proposalType: ProposalType;
  specialistName: string;
  accountManagerName: string;
}

export interface ProposalAIResult {
  success: boolean;
  executiveSummary?: ExecutiveSummary;
  solutionOverview?: SolutionOverview;
  technologyStack?: TechnologyStack;
  scopeOfWork?: ScopeOfWork;
  pricingBreakdown?: PricingBreakdown;
  timeline?: ProposalTimeline;
  teamComposition?: TeamComposition;
  assumptions?: string[];
  risks?: ProposalRisk[];
  error?: string;
}

// Section keys for individual regeneration
export type ProposalSectionKey =
  | 'executiveSummary'
  | 'solutionOverview'
  | 'technologyStack'
  | 'scopeOfWork'
  | 'pricingBreakdown'
  | 'timeline'
  | 'teamComposition'
  | 'assumptions'
  | 'risks';

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_TERMS: ProposalTerms = {
  paymentTerms:
    'Payment is due within 30 days of invoice date. A 50% deposit is required before project commencement, with the remaining 50% due upon completion of each milestone phase.',
  warranty:
    'Digital Workplace provides a 90-day warranty period following project delivery. During this period, any defects or issues related to the delivered solution will be resolved at no additional cost.',
  liability:
    'Digital Workplace\'s total liability under this agreement shall not exceed the total contract value. Neither party shall be liable for indirect, consequential, or incidental damages.',
  confidentiality:
    'Both parties agree to maintain the confidentiality of all proprietary information shared during the engagement. This obligation survives for a period of 2 years after the agreement ends.',
  ipOwnership:
    'All custom-developed intellectual property created specifically for this engagement shall be owned by the Client upon full payment. Pre-existing IP and frameworks remain the property of Digital Workplace.',
  termination:
    'Either party may terminate this agreement with 30 days written notice. In the event of termination, the Client shall pay for all work completed to date plus any non-cancellable commitments.',
};

export const DEFAULT_CHANGE_CONTROL: ChangeControl = {
  process:
    'All changes to the agreed scope of work must be submitted in writing via a formal Change Request (CR). Each CR will include a description of the change, impact assessment, revised timeline, and cost implications. No changes will be implemented until written approval is received from both parties.',
  approvalLevels: [
    'Minor changes (< 8 hours impact): Project Manager approval',
    'Medium changes (8-40 hours impact): Client Sponsor + DW Account Manager approval',
    'Major changes (> 40 hours impact): Steering Committee approval with revised SOW',
  ],
  pricingImpact:
    'Changes that increase scope will be priced at the agreed day rate. Rush requests (requiring timeline compression) may incur an additional 15% premium. Scope reductions will receive proportional credit only if communicated before the relevant phase begins.',
};
