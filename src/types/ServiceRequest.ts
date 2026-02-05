/**
 * DWx Traffic Manager - Service Request Types
 * Core type definitions for the sales funnel and service booking system
 */

// ============================================================================
// Service Catalog Types
// ============================================================================

/**
 * Service categories offered by Digital Workplace
 * Updated to include 6 service offerings including MS Viva
 */
export type ServiceCategory =
  | 'Power Platform'
  | 'SPFx Development'
  | 'SharePoint Migration'
  | 'M365 Assessment'
  | 'Copilot Agents'
  | 'MS Viva'
  | 'Training';

export type ServiceComplexity = 'Low' | 'Medium' | 'High' | 'Enterprise';
export type PricingModel = 'Fixed' | 'Hourly' | 'Project-based' | 'TBD';
export type ServiceDuration = '30min' | '1hr' | '2hr' | 'Half-day' | 'Full-day' | 'Multi-day';

/**
 * Service definition from DWxServices SharePoint list
 */
export interface DWService {
  Id: number;
  Title: string;
  Description: string;
  ShortDescription: string;
  Category: ServiceCategory;
  TypicalDuration: ServiceDuration;
  ComplexityLevel: ServiceComplexity;
  PricingModel: PricingModel;
  BasePrice?: number;
  RequiredRoles: SpecialistRole[]; // Parsed from JSON
  Prerequisites?: string;
  IsActive: boolean;
  SortOrder: number;
  IconName?: string; // Fluent UI icon name
  // Rich content fields (client-side only, for detail page)
  WhatsIncluded?: string[];
  EngagementPhases?: { name: string; description: string }[];
  RelatedCategories?: ServiceCategory[];
  KeyBenefits?: string[];
  IdealFor?: string[];
  Created?: string;
  Modified?: string;
}

/**
 * Input for creating/updating a service
 */
export interface DWServiceInput {
  Title: string;
  Description: string;
  ShortDescription: string;
  Category: ServiceCategory;
  TypicalDuration: ServiceDuration;
  ComplexityLevel: ServiceComplexity;
  PricingModel: PricingModel;
  BasePrice?: number;
  RequiredRoles: SpecialistRole[];
  Prerequisites?: string;
  IsActive: boolean;
  SortOrder: number;
  IconName?: string;
  // Rich content fields (client-side only, for detail page)
  WhatsIncluded?: string[];
  EngagementPhases?: { name: string; description: string }[];
  RelatedCategories?: ServiceCategory[];
  KeyBenefits?: string[];
  IdealFor?: string[];
}

// ============================================================================
// Sales Funnel Types
// ============================================================================

/**
 * Sales funnel stages for service requests
 */
export type FunnelStage =
  | 'Lead'
  | 'Qualified'
  | 'Discovery'
  | 'Proposal'
  | 'Negotiation'
  | 'Won'
  | 'Lost';

/**
 * Stage transition rules - which stages can transition to which
 */
export const STAGE_TRANSITIONS: Record<FunnelStage, FunnelStage[]> = {
  Lead: ['Qualified', 'Lost'],
  Qualified: ['Discovery', 'Lead', 'Lost'],
  Discovery: ['Proposal', 'Qualified', 'Lost'],
  Proposal: ['Negotiation', 'Discovery', 'Lost'],
  Negotiation: ['Won', 'Lost', 'Proposal'],
  Won: [], // Terminal state
  Lost: ['Lead'], // Can reopen as new lead
};

/**
 * Stage metadata for UI display
 */
export const STAGE_METADATA: Record<FunnelStage, { color: string; icon: string; description: string }> = {
  Lead: { color: '#6B7280', icon: 'PersonAdd', description: 'Initial inquiry captured' },
  Qualified: { color: '#3B82F6', icon: 'CheckmarkCircle', description: 'Interest validated by AM' },
  Discovery: { color: '#8B5CF6', icon: 'Calendar', description: 'Discovery session scheduled' },
  Proposal: { color: '#F59E0B', icon: 'Document', description: 'Proposal in preparation' },
  Negotiation: { color: '#EC4899', icon: 'Chat', description: 'Terms being finalized' },
  Won: { color: '#10B981', icon: 'Trophy', description: 'Contract signed' },
  Lost: { color: '#EF4444', icon: 'Dismiss', description: 'Opportunity closed' },
};

export type InterestLevel = 'Hot' | 'Warm' | 'Cold';
export type CompanySize = 'SMB' | 'Medium' | 'Large' | 'Enterprise';
export type SpecialistRole = 'Solution Architect' | 'Technical Specialist' | 'Consultant';

/**
 * Client industry verticals
 */
export type ClientIndustry =
  | 'Technology'
  | 'Finance'
  | 'Healthcare'
  | 'Retail'
  | 'Manufacturing'
  | 'Government'
  | 'Education'
  | 'Legal'
  | 'Non-Profit'
  | 'Other';

// ============================================================================
// Service Request Types
// ============================================================================

/**
 * Service request from DWxServiceRequests SharePoint list
 */
export interface ServiceRequest {
  Id: number;
  Title: string; // Auto-generated: "Client - Service"

  // Service Reference
  ServiceId?: number;
  ServiceName: string;

  // Account Manager
  AccountManagerName: string;
  AccountManagerEmail: string;
  AccountManagerTenant: 'Internal' | 'External';

  // Client Information
  ClientName: string;
  ClientId?: number;
  ContactName: string;
  ContactEmail: string;
  ContactPhone?: string;
  ClientIndustry?: ClientIndustry;
  ClientCompanySize?: CompanySize;
  IsPremiumClient?: boolean;
  // Deprecated aliases (use ClientIndustry/ClientCompanySize instead)
  Industry?: ClientIndustry;
  CompanySize?: CompanySize;

  // Funnel State
  FunnelStage: FunnelStage;
  InterestLevel: InterestLevel;

  // Deal Information
  DealValue?: number;
  DealProbability?: number; // 0-100
  WeightedPipeline?: number; // Calculated: DealValue * Probability
  ExpectedCloseDate?: string;
  Budget?: string;
  Timeline?: string;

  // Scheduling
  ProposedSlot1: string;
  ProposedSlot2: string;
  ProposedSlot3: string;
  ConfirmedDateTime?: string;
  CalendarEventId?: string;

  // Assignment
  AssignedSpecialistName?: string;
  AssignedSpecialistEmail?: string;
  AssignedSpecialistRole?: SpecialistRole;

  // Service Metadata (from DWService)
  ServiceCategory?: ServiceCategory;
  Prerequisites?: string;
  EngagementPhases?: string;
  DefaultDuration?: number;

  // Additional Info
  Requirements?: string;
  ServiceHistory?: string;
  WinLossReason?: string;
  NextSteps?: string;
  Comments?: string;

  // Document References
  DocumentIds?: string; // JSON array of document IDs

  // Audit
  Created: string;
  Modified?: string;
  CreatedBy?: { Title: string; Email: string };
}

/**
 * Input for creating a new service request
 */
export interface CreateServiceRequestInput {
  ServiceId?: number;
  ServiceName: string;
  ClientName: string;
  ClientId?: number;
  ContactName: string;
  ContactEmail: string;
  ContactPhone?: string;
  Industry?: ClientIndustry;
  CompanySize?: CompanySize;
  InterestLevel: InterestLevel;
  DealValue?: number;
  DealProbability?: number;
  ExpectedCloseDate?: string;
  Budget?: string;
  Timeline?: string;
  ProposedSlot1: string;
  ProposedSlot2?: string;
  ProposedSlot3?: string;
  Requirements?: string;
  ServiceHistory?: string;
  Comments?: string;
}

/**
 * Input for updating funnel stage
 */
export interface StageUpdateInput {
  newStage: FunnelStage;
  reason?: string;
  nextSteps?: string;
}

/**
 * Result of a service request operation
 */
export interface ServiceRequestResult {
  success: boolean;
  request?: ServiceRequest;
  calendarEventId?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Result of a stage transition
 */
export interface StageTransitionResult {
  success: boolean;
  previousStage: FunnelStage;
  newStage: FunnelStage;
  request?: ServiceRequest;
  error?: string;
}

// ============================================================================
// Specialist Types
// ============================================================================

/**
 * Pre-sales specialist from DWxSpecialists SharePoint list
 */
export interface Specialist {
  Id: number;
  Title: string; // Full name
  Email: string;
  Role: SpecialistRole;
  Specializations: ServiceCategory[]; // Parsed from JSON
  MaxConcurrentDeals: number;
  CurrentDealCount: number;
  IsActive: boolean;
  CalendarEmail: string; // For availability checking
  Phone?: string;
  Created?: string;
  Modified?: string;
}

/**
 * Input for creating/updating a specialist
 */
export interface SpecialistInput {
  Title: string;
  Email: string;
  Role: SpecialistRole;
  Specializations: ServiceCategory[];
  MaxConcurrentDeals: number;
  IsActive: boolean;
  CalendarEmail: string;
  Phone?: string;
}

/**
 * Specialist availability result
 */
export interface SpecialistAvailability {
  specialist: Specialist;
  isAvailable: boolean;
  hasCapacity: boolean;
  conflicts?: { start: string; end: string; subject: string }[];
}

// ============================================================================
// Client Types (Extended)
// ============================================================================

/**
 * Extended client information from DWxClients SharePoint list
 */
export interface DWClient {
  Id: number;
  Title: string; // Company name
  PrimaryContactName: string;
  PrimaryContactEmail: string;
  DecisionMakerName?: string;
  DecisionMakerEmail?: string;
  Phone?: string;
  Industry?: ClientIndustry;
  CompanySize?: CompanySize;
  Address?: string;
  Website?: string;
  TenantId?: string; // M365 tenant ID if known
  IsPremium: boolean;
  AccountManagerEmail?: string;
  EngagementCount: number;
  TotalRevenue: number;
  LastEngagementDate?: string;
  ContractStatus: 'Prospect' | 'Active' | 'Churned';
  Notes?: string;
  Created?: string;
  Modified?: string;
}

/**
 * Input for creating/updating a client
 */
export interface DWClientInput {
  Title: string;
  PrimaryContactName: string;
  PrimaryContactEmail: string;
  DecisionMakerName?: string;
  DecisionMakerEmail?: string;
  Phone?: string;
  Industry?: ClientIndustry;
  CompanySize?: CompanySize;
  Address?: string;
  Website?: string;
  TenantId?: string;
  IsPremium: boolean;
  AccountManagerEmail?: string;
  ContractStatus: 'Prospect' | 'Active' | 'Churned';
  Notes?: string;
}

// ============================================================================
// Pipeline & Analytics Types
// ============================================================================

/**
 * Pipeline metrics for dashboard
 */
export interface PipelineMetrics {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  stageBreakdown: StageBreakdown[];
  averageDealSize: number;
  averageDealProbability: number;
  forecastedRevenue: number;
  totalRequests: number;
  openRequests: number;
}

export interface StageBreakdown {
  stage: FunnelStage;
  count: number;
  value: number;
  weightedValue: number;
}

/**
 * Win rate analytics
 */
export interface WinRateData {
  overall: number;
  byService: { service: string; winRate: number; count: number; won: number }[];
  byAM: { am: string; email: string; winRate: number; count: number; won: number }[];
  trend: { period: string; winRate: number; count: number }[];
}

/**
 * Conversion rate analytics
 */
export interface ConversionRates {
  leadToQualified: number;
  qualifiedToDiscovery: number;
  discoveryToProposal: number;
  proposalToNegotiation: number;
  negotiationToWon: number;
  overallConversion: number;
}

/**
 * Forecast data
 */
export interface ForecastData {
  period: string;
  expected: number;
  weighted: number;
  actual?: number;
  deals: { id: number; client: string; value: number; probability: number }[];
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filter criteria for service requests
 */
export interface ServiceRequestFilterCriteria {
  stages?: FunnelStage[];
  services?: string[];
  interestLevels?: InterestLevel[];
  accountManagerEmail?: string;
  specialistEmail?: string;
  clientId?: number;
  dateRange?: { start: string; end: string };
  minDealValue?: number;
  maxDealValue?: number;
  searchText?: string;
}

// ============================================================================
// Default Service Catalog
// ============================================================================

/**
 * Default service offerings for Digital Workplace
 * Includes all 6 services: Power Platform, SPFx, Migrations, Assessment, Copilot, Viva
 */
export const DEFAULT_SERVICES: DWServiceInput[] = [
  {
    Title: 'Power Platform Development',
    Description: 'Custom Power Apps, Power Automate flows, Power BI dashboards, and Power Pages solutions tailored to your business needs.',
    ShortDescription: 'Custom Power Apps & Automation',
    Category: 'Power Platform',
    TypicalDuration: '2hr',
    ComplexityLevel: 'Medium',
    PricingModel: 'Project-based',
    RequiredRoles: ['Solution Architect', 'Technical Specialist'],
    Prerequisites: 'M365 license with Power Platform access',
    IsActive: true,
    SortOrder: 1,
    IconName: 'LightningBolt',
    WhatsIncluded: [
      'Requirements analysis and solution design',
      'Custom Power Apps (Canvas or Model-driven)',
      'Power Automate workflow development',
      'Power BI dashboard creation',
      'User acceptance testing and deployment',
      'Knowledge transfer and documentation',
    ],
    EngagementPhases: [
      { name: 'Discovery', description: 'Requirements gathering and feasibility assessment' },
      { name: 'Design', description: 'Solution architecture and UI/UX wireframes' },
      { name: 'Build', description: 'Iterative development with sprint demos' },
      { name: 'Test', description: 'UAT and performance validation' },
      { name: 'Deploy', description: 'Go-live support and handover' },
    ],
    RelatedCategories: ['SPFx Development', 'Copilot Agents'],
    KeyBenefits: [
      'Rapid prototyping with low-code tools',
      'Seamless M365 ecosystem integration',
      'Citizen developer enablement',
      'Reduced development costs vs custom code',
    ],
    IdealFor: [
      'Departmental business process automation',
      'Self-service reporting and dashboards',
      'Form-based data collection apps',
      'Approval workflows and notifications',
    ],
  },
  {
    Title: 'SPFx Development',
    Description: 'Custom SharePoint Framework solutions including web parts, extensions, adaptive cards, and Teams apps integrated with SharePoint.',
    ShortDescription: 'Custom SharePoint & Teams Apps',
    Category: 'SPFx Development',
    TypicalDuration: '2hr',
    ComplexityLevel: 'High',
    PricingModel: 'Project-based',
    RequiredRoles: ['Technical Specialist'],
    Prerequisites: 'SharePoint Online tenant with App Catalog',
    IsActive: true,
    SortOrder: 2,
    IconName: 'Code',
    WhatsIncluded: [
      'Technical feasibility assessment',
      'Custom SPFx web part development',
      'SharePoint Framework extensions (command sets, field customizers)',
      'Adaptive Card Extensions for Viva Connections',
      'Teams personal and group tab applications',
      'Deployment to App Catalog and documentation',
    ],
    EngagementPhases: [
      { name: 'Scoping', description: 'Technical requirements and environment assessment' },
      { name: 'Architecture', description: 'Component design and API integration planning' },
      { name: 'Development', description: 'Sprint-based SPFx development with code reviews' },
      { name: 'Testing', description: 'Cross-browser testing and SharePoint compatibility' },
      { name: 'Deployment', description: 'App Catalog deployment and tenant-wide rollout' },
    ],
    RelatedCategories: ['Power Platform', 'Copilot Agents'],
    KeyBenefits: [
      'Native SharePoint and Teams integration',
      'Enterprise-grade performance and security',
      'Reusable components across sites',
      'Full customization with React and TypeScript',
    ],
    IdealFor: [
      'Custom intranet experiences',
      'Interactive data visualization dashboards',
      'Teams-embedded business applications',
      'Document management enhancements',
    ],
  },
  {
    Title: 'SharePoint Migration',
    Description: 'End-to-end migration services from on-premises SharePoint, file shares, or other platforms to SharePoint Online and OneDrive.',
    ShortDescription: 'Cloud Migration Services',
    Category: 'SharePoint Migration',
    TypicalDuration: 'Half-day',
    ComplexityLevel: 'High',
    PricingModel: 'Project-based',
    RequiredRoles: ['Solution Architect', 'Technical Specialist'],
    Prerequisites: 'Source environment access, target M365 tenant',
    IsActive: true,
    SortOrder: 3,
    IconName: 'CloudArrowUp',
    WhatsIncluded: [
      'Source environment discovery and content audit',
      'Migration strategy and roadmap development',
      'Content mapping and metadata transformation',
      'Pilot migration with validation checkpoints',
      'Full migration execution with rollback plan',
      'Post-migration verification and user training',
    ],
    EngagementPhases: [
      { name: 'Assessment', description: 'Source inventory, content analysis, and risk identification' },
      { name: 'Planning', description: 'Migration strategy, timeline, and communication plan' },
      { name: 'Pilot', description: 'Test migration of representative content subset' },
      { name: 'Migration', description: 'Phased content migration with validation gates' },
      { name: 'Cutover', description: 'Final sync, DNS changes, and user redirection' },
    ],
    RelatedCategories: ['M365 Assessment', 'MS Viva'],
    KeyBenefits: [
      'Minimal business disruption during migration',
      'Complete metadata and permission preservation',
      'Reduced on-premises infrastructure costs',
      'Modern collaboration capabilities unlocked',
    ],
    IdealFor: [
      'On-premises SharePoint to SharePoint Online moves',
      'File share consolidation to OneDrive/SharePoint',
      'Third-party platform migrations (Box, Dropbox, Google)',
      'Tenant-to-tenant migrations during M&A',
    ],
  },
  {
    Title: 'M365 Tenant Assessment',
    Description: 'Comprehensive assessment of your Microsoft 365 environment including security, compliance, governance, and adoption recommendations.',
    ShortDescription: 'Environment Health Check',
    Category: 'M365 Assessment',
    TypicalDuration: 'Full-day',
    ComplexityLevel: 'Medium',
    PricingModel: 'Fixed',
    RequiredRoles: ['Solution Architect'],
    Prerequisites: 'Global Admin or Reports Reader access',
    IsActive: true,
    SortOrder: 4,
    IconName: 'ShieldCheckmark',
    WhatsIncluded: [
      'Security posture review and Secure Score analysis',
      'Compliance and data governance audit',
      'License optimization recommendations',
      'Adoption and usage analytics review',
      'Identity and access management assessment',
      'Executive summary report with prioritized actions',
    ],
    EngagementPhases: [
      { name: 'Preparation', description: 'Access provisioning and data collection setup' },
      { name: 'Analysis', description: 'Automated scanning and manual review of tenant configuration' },
      { name: 'Review', description: 'Findings compilation and severity classification' },
      { name: 'Report', description: 'Executive presentation and detailed recommendations' },
    ],
    RelatedCategories: ['SharePoint Migration', 'MS Viva'],
    KeyBenefits: [
      'Identify security vulnerabilities before they are exploited',
      'Optimize license spend with usage-based insights',
      'Improve compliance posture for audit readiness',
      'Actionable roadmap for M365 maturity improvement',
    ],
    IdealFor: [
      'Organizations new to Microsoft 365',
      'Pre-migration readiness validation',
      'Annual security and compliance reviews',
      'Post-acquisition tenant consolidation planning',
    ],
  },
  {
    Title: 'Enterprise Copilot Agents',
    Description: 'Design and implementation of Microsoft Copilot agents for enterprise scenarios including custom plugins, knowledge bases, and workflow automation.',
    ShortDescription: 'AI-Powered Copilot Solutions',
    Category: 'Copilot Agents',
    TypicalDuration: '2hr',
    ComplexityLevel: 'Enterprise',
    PricingModel: 'Project-based',
    RequiredRoles: ['Solution Architect', 'Technical Specialist'],
    Prerequisites: 'Copilot license, Azure subscription for custom plugins',
    IsActive: true,
    SortOrder: 5,
    IconName: 'Bot',
    WhatsIncluded: [
      'AI readiness assessment and use case identification',
      'Custom Copilot agent design and configuration',
      'Knowledge base setup and grounding data integration',
      'Custom plugin and connector development',
      'Prompt engineering and response tuning',
      'Pilot rollout with user feedback collection',
    ],
    EngagementPhases: [
      { name: 'Assessment', description: 'Use case prioritization and data readiness evaluation' },
      { name: 'Design', description: 'Agent architecture, knowledge sources, and plugin mapping' },
      { name: 'Build', description: 'Agent configuration, plugin development, and testing' },
      { name: 'Pilot', description: 'Limited rollout with feedback iteration' },
      { name: 'Scale', description: 'Organization-wide deployment and adoption support' },
    ],
    RelatedCategories: ['Power Platform', 'SPFx Development'],
    KeyBenefits: [
      'Accelerate knowledge discovery across the organization',
      'Automate repetitive tasks with conversational AI',
      'Leverage existing M365 data with enterprise security',
      'Measurable productivity gains from day one',
    ],
    IdealFor: [
      'Enterprise knowledge management and search',
      'IT help desk and employee self-service',
      'Sales enablement and CRM integration',
      'Custom line-of-business process automation',
    ],
  },
  {
    Title: 'Microsoft Viva Suite',
    Description: 'Implementation of Microsoft Viva modules including Viva Connections, Viva Engage, Viva Learning, Viva Insights, and Viva Goals for employee experience.',
    ShortDescription: 'Employee Experience Platform',
    Category: 'MS Viva',
    TypicalDuration: 'Half-day',
    ComplexityLevel: 'Medium',
    PricingModel: 'Project-based',
    RequiredRoles: ['Solution Architect', 'Consultant'],
    Prerequisites: 'Viva license, SharePoint home site configured',
    IsActive: true,
    SortOrder: 6,
    IconName: 'PeopleTeam',
    WhatsIncluded: [
      'Viva module readiness assessment',
      'Viva Connections dashboard design and deployment',
      'Viva Learning content source configuration',
      'Viva Insights privacy and analytics setup',
      'Viva Engage community structure planning',
      'Change management and adoption strategy',
    ],
    EngagementPhases: [
      { name: 'Assessment', description: 'Current employee experience baseline and Viva licensing review' },
      { name: 'Design', description: 'Module selection, dashboard layout, and content strategy' },
      { name: 'Configure', description: 'Module deployment, integrations, and branding' },
      { name: 'Launch', description: 'Phased rollout with champion network activation' },
      { name: 'Adopt', description: 'Adoption tracking, feedback loops, and continuous improvement' },
    ],
    RelatedCategories: ['M365 Assessment', 'SharePoint Migration'],
    KeyBenefits: [
      'Unified employee experience within Microsoft Teams',
      'Data-driven insights into employee wellbeing',
      'Centralized learning and development platform',
      'Improved internal communications and engagement',
    ],
    IdealFor: [
      'Organizations investing in employee experience',
      'Companies with hybrid or remote workforces',
      'HR-driven digital transformation initiatives',
      'Intranet modernization projects',
    ],
  },
  {
    Title: 'Zero to AI Copilot Chat Hero',
    Description: 'Comprehensive Copilot Studio training program covering planning, setup, and mastery of Copilot Chat. Includes 6 training sessions (13 hours) plus 8 hours of follow-up support through "The AI Guy" managed service. Takes participants from zero knowledge to confident Copilot Chat users with community setup and reporting.',
    ShortDescription: 'Copilot Studio Training Program',
    Category: 'Training',
    TypicalDuration: 'Multi-day',
    ComplexityLevel: 'Medium',
    PricingModel: 'Fixed',
    RequiredRoles: ['Consultant', 'Technical Specialist'],
    Prerequisites: 'M365 license with Copilot Studio access, max 50 participants per cohort',
    IsActive: true,
    SortOrder: 7,
    IconName: 'LightningBolt',
    WhatsIncluded: [
      'Plan & Setup session (1 hour)',
      'Zero to Hero training sessions (8 hours across 4 sessions)',
      'Community and reporting setup (4 hours)',
      'The AI Guy managed service (8 hours over 4 months)',
      'Training materials and quick-reference guides',
      'Post-training assessment and certification',
    ],
    EngagementPhases: [
      { name: 'Plan & Setup', description: 'Environment preparation and participant onboarding' },
      { name: 'Training', description: 'Interactive sessions covering Copilot Chat fundamentals to advanced topics' },
      { name: 'Community', description: 'Champion network setup and internal community launch' },
      { name: 'Support', description: 'Ongoing managed service with The AI Guy for 4 months' },
    ],
    RelatedCategories: ['Copilot Agents', 'Power Platform'],
    KeyBenefits: [
      'Structured learning path from beginner to proficient',
      'Hands-on labs with real business scenarios',
      'Ongoing support ensures knowledge retention',
      'Internal champions drive organic adoption',
    ],
    IdealFor: [
      'Organizations rolling out Microsoft Copilot',
      'Teams wanting to maximize AI productivity gains',
      'Change management programs for AI adoption',
      'Departments exploring Copilot Studio capabilities',
    ],
  },
];

/**
 * Seed data for DWxServices SharePoint list provisioning
 * Used by DWxSharePointProvisioningService to populate the service catalog
 */
export const DW_SERVICES_SEED_DATA = [
  {
    Title: 'Power Platform Development',
    Description: 'Custom Power Apps, Power Automate flows, Power BI dashboards, and Power Pages solutions tailored to your business needs.',
    ShortDescription: 'Custom Power Apps & Automation',
    Category: 'Power Platform',
    TypicalDuration: '2hr',
    ComplexityLevel: 'Medium',
    PricingModel: 'Project-based',
    BasePrice: 25000,
    RequiredRoles: ['Solution Architect', 'Technical Specialist'],
    Prerequisites: 'M365 license with Power Platform access',
    SortOrder: 1,
    IconName: 'LightningBolt',
  },
  {
    Title: 'SPFx Development',
    Description: 'Custom SharePoint Framework solutions including web parts, extensions, adaptive cards, and Teams apps integrated with SharePoint.',
    ShortDescription: 'Custom SharePoint & Teams Apps',
    Category: 'SPFx',
    TypicalDuration: '2hr',
    ComplexityLevel: 'High',
    PricingModel: 'Project-based',
    BasePrice: 35000,
    RequiredRoles: ['Technical Specialist'],
    Prerequisites: 'SharePoint Online tenant with App Catalog',
    SortOrder: 2,
    IconName: 'Code',
  },
  {
    Title: 'SharePoint Migration',
    Description: 'End-to-end migration services from on-premises SharePoint, file shares, or other platforms to SharePoint Online and OneDrive.',
    ShortDescription: 'Cloud Migration Services',
    Category: 'Migrations',
    TypicalDuration: 'Half-day',
    ComplexityLevel: 'High',
    PricingModel: 'Project-based',
    BasePrice: 50000,
    RequiredRoles: ['Solution Architect', 'Technical Specialist'],
    Prerequisites: 'Source environment access, target M365 tenant',
    SortOrder: 3,
    IconName: 'CloudArrowUp',
  },
  {
    Title: 'M365 Tenant Assessment',
    Description: 'Comprehensive assessment of your Microsoft 365 environment including security, compliance, governance, and adoption recommendations.',
    ShortDescription: 'Environment Health Check',
    Category: 'Assessment',
    TypicalDuration: 'Full-day',
    ComplexityLevel: 'Medium',
    PricingModel: 'Fixed',
    BasePrice: 15000,
    RequiredRoles: ['Solution Architect'],
    Prerequisites: 'Global Admin or Reports Reader access',
    SortOrder: 4,
    IconName: 'ShieldCheckmark',
  },
  {
    Title: 'Enterprise Copilot Agents',
    Description: 'Design and implementation of Microsoft Copilot agents for enterprise scenarios including custom plugins, knowledge bases, and workflow automation.',
    ShortDescription: 'AI-Powered Copilot Solutions',
    Category: 'Copilot',
    TypicalDuration: '2hr',
    ComplexityLevel: 'Enterprise',
    PricingModel: 'Project-based',
    BasePrice: 75000,
    RequiredRoles: ['Solution Architect', 'Technical Specialist'],
    Prerequisites: 'Copilot license, Azure subscription for custom plugins',
    SortOrder: 5,
    IconName: 'Bot',
  },
  {
    Title: 'Microsoft Viva Suite',
    Description: 'Implementation of Microsoft Viva modules including Viva Connections, Viva Engage, Viva Learning, Viva Insights, and Viva Goals for employee experience.',
    ShortDescription: 'Employee Experience Platform',
    Category: 'Viva',
    TypicalDuration: 'Half-day',
    ComplexityLevel: 'Medium',
    PricingModel: 'Project-based',
    BasePrice: 40000,
    RequiredRoles: ['Solution Architect', 'Consultant'],
    Prerequisites: 'Viva license, SharePoint home site configured',
    SortOrder: 6,
    IconName: 'PeopleTeam',
  },
  {
    Title: 'Zero to AI Copilot Chat Hero',
    Description: 'Comprehensive Copilot Studio training: Plan & Setup (1hr), Zero to Hero sessions (8hrs), Community & Reports setup (4hrs), plus The AI Guy managed service (8hrs over 4 months). Max 50 participants per cohort.',
    ShortDescription: 'Copilot Studio Training Program',
    Category: 'Training',
    TypicalDuration: 'Multi-day',
    ComplexityLevel: 'Medium',
    PricingModel: 'Fixed',
    BasePrice: 35000,
    RequiredRoles: ['Consultant', 'Technical Specialist'],
    Prerequisites: 'M365 license with Copilot Studio access',
    SortOrder: 7,
    IconName: 'LightningBolt',
  },
];
