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
