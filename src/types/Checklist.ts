/**
 * Service Checklist Types
 * Per-service checklist templates (Admin) + per-deal completion tracking
 * v2.13.0 — Replaces legacy LP Booking deployment checklist
 */

import type { ServiceCategory } from './ServiceRequest';

// ============================================================================
// Template Item (stored on DWxServices as Checklist_JSON)
// ============================================================================

export interface ServiceChecklistItem {
  id: string;
  label: string;
  description: string;
  isRequired: boolean;
  sortOrder: number;
}

// ============================================================================
// Per-Deal Item (stored on DWxServiceRequests as DealChecklist_JSON)
// ============================================================================

export interface DealChecklistItem extends ServiceChecklistItem {
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
}

// ============================================================================
// Completion Summary (computed, not stored)
// ============================================================================

export interface ChecklistSummary {
  total: number;
  completed: number;
  required: number;
  requiredCompleted: number;
  isComplete: boolean; // All required items done
  percentage: number;  // 0-100
}

export const getChecklistSummary = (items: DealChecklistItem[]): ChecklistSummary => {
  const total = items.length;
  const completed = items.filter((i) => i.isCompleted).length;
  const required = items.filter((i) => i.isRequired).length;
  const requiredCompleted = items.filter((i) => i.isRequired && i.isCompleted).length;

  return {
    total,
    completed,
    required,
    requiredCompleted,
    isComplete: requiredCompleted === required && required > 0,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
};

// ============================================================================
// Serialization Helpers
// ============================================================================

export const serializeChecklist = (items: ServiceChecklistItem[] | DealChecklistItem[]): string => {
  return JSON.stringify(items);
};

export const deserializeServiceChecklist = (json: string | null | undefined): ServiceChecklistItem[] => {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const deserializeDealChecklist = (json: string | null | undefined): DealChecklistItem[] => {
  if (!json) return [];
  try {
    return JSON.parse(json);
  } catch {
    return [];
  }
};

/** Convert a service template checklist into a deal checklist (all items unchecked) */
export const createDealChecklist = (templateItems: ServiceChecklistItem[]): DealChecklistItem[] => {
  return templateItems.map((item) => ({
    ...item,
    isCompleted: false,
  }));
};

// ============================================================================
// Default Service Checklists (12 categories)
// ============================================================================

const makeItems = (
  items: Array<{ label: string; description: string; isRequired?: boolean }>
): ServiceChecklistItem[] =>
  items.map((item, index) => ({
    id: `default_${index + 1}`,
    label: item.label,
    description: item.description,
    isRequired: item.isRequired !== false,
    sortOrder: index + 1,
  }));

export const DEFAULT_SERVICE_CHECKLISTS: Record<ServiceCategory, ServiceChecklistItem[]> = {
  'Power Platform': makeItems([
    { label: 'Tenant Access Confirmed', description: 'Client has granted admin/contributor access to the target M365 tenant.' },
    { label: 'Business Requirements Documented', description: 'Functional requirements have been gathered and signed off by the client.' },
    { label: 'Data Sources Identified', description: 'All data sources (SharePoint, Dataverse, SQL, APIs) have been catalogued.' },
    { label: 'Power Platform Environment Provisioned', description: 'A dedicated environment (Dev/Test) has been created in the Power Platform admin centre.' },
    { label: 'Security Review Completed', description: 'DLP policies and connector restrictions have been reviewed with the client.' },
    { label: 'Licensing Confirmed', description: 'Required Power Apps/Automate/BI licences are allocated to project users.', isRequired: false },
  ]),

  'SPFx Development': makeItems([
    { label: 'SharePoint Environment Access', description: 'Developer has site collection admin access to the target SharePoint site.' },
    { label: 'App Catalog Configured', description: 'Tenant-level or site-level app catalog is created and accessible.' },
    { label: 'Development Environment Ready', description: 'Node.js, Yeoman SPFx generator, and dev certificates are set up.' },
    { label: 'Design Specifications Approved', description: 'UI/UX wireframes or mockups have been reviewed and approved by the client.' },
    { label: 'Testing Plan Documented', description: 'Test cases and acceptance criteria have been defined.' },
    { label: 'API Permissions Approved', description: 'Any Graph API or third-party API permissions have been granted by tenant admin.', isRequired: false },
  ]),

  'SharePoint Migration': makeItems([
    { label: 'Source Environment Audit', description: 'Inventory of source sites, lists, libraries, and content types has been completed.' },
    { label: 'Content Inventory Complete', description: 'Volume of data (GB), file counts, and version history requirements are documented.' },
    { label: 'User Mapping Prepared', description: 'Source-to-target user identity mapping (UPN) has been created.' },
    { label: 'Migration Tool Licensed', description: 'ShareGate, AvePoint, or chosen migration tool is licensed and installed.' },
    { label: 'Rollback Plan Documented', description: 'A rollback strategy is in place in case of migration issues.' },
    { label: 'Communication Plan Ready', description: 'End-user notification schedule and training materials are prepared.', isRequired: false },
    { label: 'Target Site Structure Created', description: 'Destination site collections, hubs, and permission groups are provisioned.' },
  ]),

  'M365 Assessment': makeItems([
    { label: 'Tenant Admin Access Granted', description: 'Read-only admin access to M365 admin centre, Azure AD, and compliance portal.' },
    { label: 'Assessment Scope Defined', description: 'Areas of focus agreed (security, governance, adoption, licensing).' },
    { label: 'Stakeholder Interviews Scheduled', description: 'Key IT and business stakeholders have been identified and interviews booked.' },
    { label: 'Current Documentation Gathered', description: 'Existing IT policies, governance docs, and architecture diagrams collected.' },
    { label: 'Secure Score Baseline Captured', description: 'Current Microsoft Secure Score and compliance score recorded.' },
  ]),

  'Copilot Agents': makeItems([
    { label: 'M365 Copilot Licences Allocated', description: 'Copilot licences have been assigned to target users in the M365 admin centre.' },
    { label: 'Plugin Permissions Configured', description: 'API permissions and OAuth app registrations for custom plugins are set up.' },
    { label: 'Compliance Review Completed', description: 'Data residency, DLP, and information barriers have been reviewed.' },
    { label: 'Test Users Identified', description: 'A pilot group of users has been selected for agent testing.' },
    { label: 'Training Material Prepared', description: 'End-user guides and FAQ documents for the custom agent are drafted.' },
    { label: 'Knowledge Sources Connected', description: 'SharePoint sites, Graph connectors, or external data sources are configured.', isRequired: false },
  ]),

  'MS Viva': makeItems([
    { label: 'Viva Licences Assigned', description: 'Microsoft Viva Suite or individual module licences are allocated.' },
    { label: 'Viva Connections Dashboard Designed', description: 'Dashboard cards and layout have been planned with stakeholders.' },
    { label: 'Home Site Designated', description: 'SharePoint home site is configured for Viva Connections.' },
    { label: 'Champion Network Identified', description: 'Internal champions for adoption and feedback have been recruited.' },
    { label: 'Success Metrics Defined', description: 'KPIs for engagement, adoption, and learning completion are agreed.' },
  ]),

  'Training': makeItems([
    { label: 'Training Audience Identified', description: 'Target audience, role levels, and headcount have been confirmed.' },
    { label: 'Training Topics Agreed', description: 'Specific M365 topics, depth level, and learning outcomes are documented.' },
    { label: 'Training Environment Ready', description: 'Demo tenant or sandboxed environment is available for hands-on exercises.' },
    { label: 'Session Logistics Confirmed', description: 'Date, time, venue (Teams/in-person), and calendar invites sent.' },
    { label: 'Training Materials Prepared', description: 'Slide decks, lab guides, and reference documents are ready.', isRequired: false },
  ]),

  'Proposal': makeItems([
    { label: 'Client Requirements Captured', description: 'Discovery notes and RFP/brief have been reviewed and summarised.' },
    { label: 'Solution Approach Agreed', description: 'Internal team has aligned on the proposed solution architecture.' },
    { label: 'Pricing Approved', description: 'Commercial terms, rate cards, and discounts have been signed off internally.' },
    { label: 'Proposal Template Selected', description: 'Standard, Enterprise, or Custom template has been chosen.' },
    { label: 'Review Deadline Set', description: 'Internal review and client submission dates are confirmed.' },
  ]),

  'Tender': makeItems([
    { label: 'Tender Document Downloaded', description: 'Full tender pack (RFP/RFI/RFQ) has been downloaded and distributed.' },
    { label: 'Compliance Checklist Completed', description: 'All mandatory requirements and eligibility criteria have been verified.' },
    { label: 'Submission Deadline Confirmed', description: 'Submission date, time, and method (portal/email) are recorded.' },
    { label: 'Response Team Assigned', description: 'Writers, technical SMEs, and reviewers have been allocated.' },
    { label: 'Pricing Model Finalised', description: 'Bill of quantities, rate schedule, or fixed pricing has been completed.' },
    { label: 'References Prepared', description: 'Client references and case studies have been selected and formatted.', isRequired: false },
    { label: 'Legal Review Completed', description: 'Contract terms and conditions have been reviewed by legal.' },
  ]),

  'Ad-Hoc Support': makeItems([
    { label: 'Issue Description Documented', description: 'The specific issue or request has been clearly described by the client.' },
    { label: 'Access Provided', description: 'Specialist has the necessary access to the client environment to investigate.' },
    { label: 'Priority Level Agreed', description: 'Urgency and expected response time have been agreed with the client.' },
    { label: 'Hours Budget Confirmed', description: 'Estimated hours and billing arrangement have been approved.', isRequired: false },
  ]),

  'SLA': makeItems([
    { label: 'SLA Document Reviewed', description: 'Current SLA terms, response times, and escalation paths have been reviewed.' },
    { label: 'Service Hours Confirmed', description: 'Support window (e.g., 8x5, 24x7) and timezone have been agreed.' },
    { label: 'Monitoring Tools Configured', description: 'Alerting and monitoring for covered services are set up and tested.' },
    { label: 'Escalation Contacts Updated', description: 'Client and DWx escalation contacts and communication channels are current.' },
    { label: 'Quarterly Review Scheduled', description: 'Regular review cadence and reporting format have been agreed.', isRequired: false },
  ]),

  'Strategic Advisory': makeItems([
    { label: 'Executive Sponsor Identified', description: 'Client-side executive sponsor and decision-maker are confirmed.' },
    { label: 'Current State Assessment Complete', description: 'Existing technology landscape, pain points, and maturity level are documented.' },
    { label: 'Strategic Objectives Aligned', description: 'Business goals and digital transformation priorities are agreed.' },
    { label: 'Roadmap Timeframe Set', description: 'Planning horizon (6/12/24 months) and milestone checkpoints are defined.' },
    { label: 'Stakeholder Workshop Scheduled', description: 'Dates for discovery workshops with key business and IT leaders are booked.' },
    { label: 'Budget Envelope Discussed', description: 'High-level investment appetite and funding model have been explored.', isRequired: false },
  ]),
};
