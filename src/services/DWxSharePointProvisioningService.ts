/**
 * DWx Traffic Manager - SharePoint Provisioning Service
 * Provisions DWx-specific SharePoint lists using Microsoft Graph API
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { getAuthService, getGraphService } from './serviceFactory';
import { config } from '../config/environmentConfig';
import { DW_SERVICES_SEED_DATA, DEFAULT_SERVICES, DEFAULT_SLA_TARGETS } from '../types/ServiceRequest';
import type { ServiceComplexity } from '../types/ServiceRequest';

// Get the appropriate auth service based on test mode
const authService = getAuthService();

interface FieldDefinition {
  internalName: string;
  displayName: string;
  type: 'Text' | 'Note' | 'Number' | 'DateTime' | 'Choice' | 'Boolean' | 'Currency';
  required?: boolean;
  choices?: string[];
  defaultValue?: string;
}

interface ListDefinition {
  title: string;
  description: string;
  fields: FieldDefinition[];
  template?: 'genericList' | 'documentLibrary';
}

interface ProvisionResult {
  success: boolean;
  message: string;
}

interface ListStatus {
  list: string;
  exists: boolean;
}

class DWxSharePointProvisioningService {
  // Cache for site ID
  private siteIdCache: string | null = null;
  private siteIdPromise: Promise<string> | null = null;

  private getClient(): Client {
    return Client.init({
      authProvider: async (done) => {
        try {
          const token = await authService.getGraphToken();
          done(null, token);
        } catch (error) {
          done(error as Error, null);
        }
      },
    });
  }

  private async getSiteId(): Promise<string> {
    if (this.siteIdCache) {
      return this.siteIdCache;
    }

    if (this.siteIdPromise) {
      return this.siteIdPromise;
    }

    this.siteIdPromise = this.fetchSiteId();

    try {
      this.siteIdCache = await this.siteIdPromise;
      return this.siteIdCache;
    } finally {
      this.siteIdPromise = null;
    }
  }

  private async fetchSiteId(): Promise<string> {
    const client = this.getClient();
    const siteUrl = config.sharepoint.siteUrl;

    const url = new URL(siteUrl);
    const hostname = url.hostname;
    const sitePath = url.pathname;

    const response = await client
      .api(`/sites/${hostname}:${sitePath}`)
      .select('id')
      .get();

    return response.id;
  }

  /**
   * Check if a list exists via Graph API
   */
  private async listExists(listTitle: string): Promise<boolean> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedName = encodeURIComponent(listTitle);

      await client
        .api(`/sites/${siteId}/lists/${encodedName}`)
        .select('id')
        .get();

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the set of column internal names that actually exist on a SharePoint list.
   * Used to filter seed data so we only send fields the list recognises.
   */
  private async getListColumnNames(listTitle: string): Promise<Set<string>> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedName = encodeURIComponent(listTitle);

      const response = await client
        .api(`/sites/${siteId}/lists/${encodedName}/columns`)
        .select('name')
        .top(200)
        .get();

      const names = new Set<string>();
      for (const col of (response.value || [])) {
        if (col.name) names.add(col.name);
      }
      return names;
    } catch {
      // If we can't read columns, return empty set — caller will send all fields
      return new Set<string>();
    }
  }

  /**
   * Filter a seed data record to only include fields that exist on the SP list.
   * Always keeps 'Title' (built-in). If validColumns is empty, returns all fields (fallback).
   */
  private filterFieldsForList(
    fields: Record<string, unknown>,
    validColumns: Set<string>
  ): Record<string, unknown> {
    if (validColumns.size === 0) return fields; // fallback: send everything
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (key === 'Title' || validColumns.has(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }

  /**
   * Create a list via Graph API
   */
  private async createList(title: string, description: string, template: 'genericList' | 'documentLibrary' = 'genericList'): Promise<string> {
    const client = this.getClient();
    const siteId = await this.getSiteId();

    const response = await client
      .api(`/sites/${siteId}/lists`)
      .post({
        displayName: title,
        description: description,
        list: {
          template: template,
        },
      });

    return response.id;
  }

  /**
   * Add a column to a list via Graph API
   */
  private async addColumn(listTitle: string, field: FieldDefinition): Promise<void> {
    const client = this.getClient();
    const siteId = await this.getSiteId();
    const encodedListName = encodeURIComponent(listTitle);

    // Build the column definition based on type
    const columnDef: Record<string, unknown> = {
      name: field.internalName,
      displayName: field.displayName,
      enforceUniqueValues: false,
    };

    // Required field handling - Graph API uses 'required' at the column level
    if (field.required) {
      columnDef.required = true;
    }

    switch (field.type) {
      case 'Text':
        columnDef.text = {
          allowMultipleLines: false,
          maxLength: 255,
        };
        break;

      case 'Note':
        columnDef.text = {
          allowMultipleLines: true,
        };
        break;

      case 'Number':
        columnDef.number = {
          decimalPlaces: 'automatic',
        };
        break;

      case 'Currency':
        columnDef.currency = {
          locale: 'en-za',
        };
        break;

      case 'DateTime':
        columnDef.dateTime = {
          format: 'dateTime',
        };
        break;

      case 'Boolean':
        columnDef.boolean = {};
        if (field.defaultValue) {
          columnDef.defaultValue = {
            value: field.defaultValue === '1' ? 'true' : 'false',
          };
        }
        break;

      case 'Choice':
        columnDef.choice = {
          allowTextEntry: false,
          choices: field.choices || [],
          displayAs: 'dropDownMenu',
        };
        if (field.defaultValue) {
          columnDef.defaultValue = {
            value: field.defaultValue,
          };
        }
        break;
    }

    try {
      await client
        .api(`/sites/${siteId}/lists/${encodedListName}/columns`)
        .post(columnDef);
    } catch (error) {
      const err = error as { statusCode?: number; message?: string };
      // Column might already exist - log but don't throw
      if (err.statusCode === 409 || (err.message && err.message.includes('already exists'))) {
        console.log(`[DWx Provisioning] Column '${field.internalName}' already exists in '${listTitle}' - skipping`);
      } else {
        console.error(`[DWx Provisioning] Failed to add column '${field.internalName}' to '${listTitle}':`, err.message);
        // Don't throw - continue with other fields
      }
    }
  }

  /**
   * Provision a list with all its fields
   */
  private async provisionList(definition: ListDefinition): Promise<ProvisionResult> {
    try {
      // Check if list already exists
      const exists = await this.listExists(definition.title);
      if (exists) {
        // Try to add any missing columns (silently skip columns that already exist)
        let columnsAdded = 0;
        for (const field of definition.fields) {
          try {
            await this.addColumn(definition.title, field);
            columnsAdded++;
          } catch {
            // Column already exists — skip silently
          }
        }
        const msg = columnsAdded > 0
          ? `List "${definition.title}" already exists — added ${columnsAdded} missing column(s)`
          : `List "${definition.title}" already exists`;
        return { success: true, message: msg };
      }

      // Create the list
      const template = definition.template || 'genericList';
      await this.createList(definition.title, definition.description, template);

      // Add fields
      for (const field of definition.fields) {
        await this.addColumn(definition.title, field);
      }

      return { success: true, message: `List "${definition.title}" created successfully` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : `Failed to provision list "${definition.title}"`,
      };
    }
  }

  // ==================== DWx LIST DEFINITIONS ====================

  private get servicesListDefinition(): ListDefinition {
    return {
      title: 'DWxServices',
      description: 'DWx Service Catalog - Available services for pre-sales requests',
      fields: [
        { internalName: 'Description', displayName: 'Description', type: 'Note' },
        { internalName: 'ShortDescription', displayName: 'Short Description', type: 'Text' },
        {
          internalName: 'Category',
          displayName: 'Category',
          type: 'Choice',
          required: true,
          choices: ['Power Platform', 'SPFx Development', 'SharePoint Migration', 'M365 Assessment', 'Copilot Agents', 'MS Viva', 'Training'],
        },
        {
          internalName: 'TypicalDuration',
          displayName: 'Typical Duration',
          type: 'Choice',
          choices: ['30min', '1hr', '2hr', 'Half-day', 'Full-day', 'Multi-day'],
        },
        {
          internalName: 'ComplexityLevel',
          displayName: 'Complexity Level',
          type: 'Choice',
          choices: ['Low', 'Medium', 'High', 'Enterprise'],
        },
        {
          internalName: 'PricingModel',
          displayName: 'Pricing Model',
          type: 'Choice',
          choices: ['Fixed', 'Hourly', 'Project-based', 'TBD'],
        },
        { internalName: 'BasePrice', displayName: 'Base Price (ZAR)', type: 'Currency' },
        { internalName: 'RequiredRoles', displayName: 'Required Roles', type: 'Note' },
        { internalName: 'Prerequisites', displayName: 'Prerequisites', type: 'Note' },
        { internalName: 'IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1' },
        { internalName: 'SortOrder', displayName: 'Sort Order', type: 'Number' },
        { internalName: 'IconName', displayName: 'Icon Name', type: 'Text' },
        // Rich content fields (stored as JSON strings)
        { internalName: 'WhatsIncluded_JSON', displayName: 'Whats Included (JSON)', type: 'Note' },
        { internalName: 'EngagementPhases_JSON', displayName: 'Engagement Phases (JSON)', type: 'Note' },
        { internalName: 'KeyBenefits_JSON', displayName: 'Key Benefits (JSON)', type: 'Note' },
        { internalName: 'IdealFor_JSON', displayName: 'Ideal For (JSON)', type: 'Note' },
        { internalName: 'RelatedCategories_JSON', displayName: 'Related Categories (JSON)', type: 'Note' },
        // SLA Targets (v2.12.0)
        { internalName: 'SLATargets_JSON', displayName: 'SLA Targets JSON', type: 'Note' },
        // Service Checklist Template (v2.13.0)
        { internalName: 'Checklist_JSON', displayName: 'Checklist JSON', type: 'Note' },
      ],
    };
  }

  private get serviceRequestsListDefinition(): ListDefinition {
    return {
      title: 'DWxServiceRequests',
      description: 'DWx Service Requests - Sales funnel and pre-sales pipeline',
      fields: [
        // Service Info
        { internalName: 'ServiceId', displayName: 'Service ID', type: 'Number' },
        { internalName: 'ServiceName', displayName: 'Service Name', type: 'Text' },
        // Request Context
        { internalName: 'RequestTitle', displayName: 'Request Title', type: 'Text' },
        { internalName: 'RequestDetails', displayName: 'Request Details', type: 'Note' },
        // Account Manager Info
        { internalName: 'AccountManagerName', displayName: 'Account Manager Name', type: 'Text', required: true },
        { internalName: 'AccountManagerEmail', displayName: 'Account Manager Email', type: 'Text', required: true },
        { internalName: 'AccountManagerTenant', displayName: 'Account Manager Tenant', type: 'Text' },
        // Client Info
        { internalName: 'ClientName', displayName: 'Client Name', type: 'Text', required: true },
        { internalName: 'ClientId', displayName: 'Client ID', type: 'Number' },
        { internalName: 'ContactName', displayName: 'Contact Name', type: 'Text' },
        { internalName: 'ContactEmail', displayName: 'Contact Email', type: 'Text' },
        { internalName: 'ContactPhone', displayName: 'Contact Phone', type: 'Text' },
        {
          internalName: 'Industry',
          displayName: 'Industry',
          type: 'Choice',
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Energy', 'Government', 'Education', 'Other'],
        },
        {
          internalName: 'CompanySize',
          displayName: 'Company Size',
          type: 'Choice',
          choices: ['SMB (<50)', 'Medium (50-250)', 'Large (250-1000)', 'Enterprise (1000+)'],
        },
        // Funnel Stage
        {
          internalName: 'FunnelStage',
          displayName: 'Funnel Stage',
          type: 'Choice',
          required: true,
          choices: ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'],
          defaultValue: 'Lead',
        },
        {
          internalName: 'InterestLevel',
          displayName: 'Interest Level',
          type: 'Choice',
          choices: ['Hot', 'Warm', 'Cold'],
          defaultValue: 'Warm',
        },
        // Deal Info
        { internalName: 'DealValue', displayName: 'Deal Value (ZAR)', type: 'Currency' },
        { internalName: 'DealProbability', displayName: 'Deal Probability (%)', type: 'Number' },
        { internalName: 'ExpectedCloseDate', displayName: 'Expected Close Date', type: 'DateTime' },
        { internalName: 'Budget', displayName: 'Budget', type: 'Text' },
        { internalName: 'Timeline', displayName: 'Timeline', type: 'Text' },
        // Discovery Scheduling
        { internalName: 'ProposedSlot1', displayName: 'Proposed Slot 1', type: 'DateTime' },
        { internalName: 'ProposedSlot2', displayName: 'Proposed Slot 2', type: 'DateTime' },
        { internalName: 'ProposedSlot3', displayName: 'Proposed Slot 3', type: 'DateTime' },
        { internalName: 'ConfirmedDateTime', displayName: 'Confirmed DateTime', type: 'DateTime' },
        { internalName: 'CalendarEventId', displayName: 'Calendar Event ID', type: 'Text' },
        // Specialist Assignment
        { internalName: 'AssignedSpecialistName', displayName: 'Assigned Specialist Name', type: 'Text' },
        { internalName: 'AssignedSpecialistEmail', displayName: 'Assigned Specialist Email', type: 'Text' },
        {
          internalName: 'AssignedSpecialistRole',
          displayName: 'Assigned Specialist Role',
          type: 'Choice',
          choices: ['Solution Architect', 'Technical Specialist', 'Consultant', 'Senior Consultant'],
        },
        // Pipeline
        { internalName: 'WeightedPipeline', displayName: 'Weighted Pipeline (ZAR)', type: 'Currency' },
        // Requirements & Notes
        { internalName: 'Requirements', displayName: 'Requirements', type: 'Note' },
        { internalName: 'ServiceHistory', displayName: 'Service History', type: 'Note' },
        { internalName: 'WinLossReason', displayName: 'Win/Loss Reason', type: 'Text' },
        { internalName: 'NextSteps', displayName: 'Next Steps', type: 'Note' },
        { internalName: 'Comments', displayName: 'Comments', type: 'Note' },
        // Tender-specific fields
        { internalName: 'TenderReferenceNumber', displayName: 'Tender Reference Number', type: 'Text' },
        { internalName: 'BriefingSessionDate', displayName: 'Briefing Session Date', type: 'DateTime' },
        { internalName: 'SubmissionDeadline', displayName: 'Submission Deadline', type: 'DateTime' },
        { internalName: 'TenderManagerName', displayName: 'Tender Manager Name', type: 'Text' },
        { internalName: 'TenderManagerEmail', displayName: 'Tender Manager Email', type: 'Text' },
        { internalName: 'TechnicalSectionOnly', displayName: 'Technical Section Only', type: 'Boolean' },
        { internalName: 'CVRequired', displayName: 'CV Required', type: 'Boolean' },
        // Email Thread Tracking (v2.11.0)
        { internalName: 'EmailThread_JSON', displayName: 'Email Thread JSON', type: 'Note' },
        // SLA Tracking (v2.12.0)
        { internalName: 'StageTimestamps_JSON', displayName: 'Stage Timestamps JSON', type: 'Note' },
        // Deal Checklist (v2.13.0)
        { internalName: 'DealChecklist_JSON', displayName: 'Deal Checklist JSON', type: 'Note' },
      ],
    };
  }

  private get clientsListDefinition(): ListDefinition {
    return {
      title: 'DWxClients',
      description: 'DWx Clients - Client master data for pre-sales',
      fields: [
        { internalName: 'PrimaryContactName', displayName: 'Primary Contact Name', type: 'Text' },
        { internalName: 'PrimaryContactEmail', displayName: 'Primary Contact Email', type: 'Text' },
        { internalName: 'DecisionMakerName', displayName: 'Decision Maker Name', type: 'Text' },
        { internalName: 'DecisionMakerEmail', displayName: 'Decision Maker Email', type: 'Text' },
        {
          internalName: 'Industry',
          displayName: 'Industry',
          type: 'Choice',
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Energy', 'Government', 'Education', 'Other'],
        },
        {
          internalName: 'CompanySize',
          displayName: 'Company Size',
          type: 'Choice',
          choices: ['SMB (<50)', 'Medium (50-250)', 'Large (250-1000)', 'Enterprise (1000+)'],
        },
        { internalName: 'IsPremium', displayName: 'Is Premium', type: 'Boolean', defaultValue: '0' },
        { internalName: 'AccountManagerEmail', displayName: 'Account Manager Email', type: 'Text' },
        { internalName: 'EngagementCount', displayName: 'Engagement Count', type: 'Number' },
        { internalName: 'TotalRevenue', displayName: 'Total Revenue (ZAR)', type: 'Currency' },
        { internalName: 'LastEngagementDate', displayName: 'Last Engagement Date', type: 'DateTime' },
        {
          internalName: 'ContractStatus',
          displayName: 'Contract Status',
          type: 'Choice',
          choices: ['Prospect', 'Active', 'Churned'],
          defaultValue: 'Prospect',
        },
        { internalName: 'Phone', displayName: 'Phone', type: 'Text' },
        { internalName: 'Address', displayName: 'Address', type: 'Text' },
        { internalName: 'Notes', displayName: 'Notes', type: 'Note' },
      ],
    };
  }

  private get specialistsListDefinition(): ListDefinition {
    return {
      title: 'DWxSpecialists',
      description: 'DWx Specialists - Pre-sales team members',
      fields: [
        { internalName: 'Email', displayName: 'Email', type: 'Text', required: true },
        {
          internalName: 'Role',
          displayName: 'Role',
          type: 'Choice',
          required: true,
          choices: ['Solution Architect', 'Technical Specialist', 'Consultant', 'Senior Consultant'],
        },
        { internalName: 'Specializations', displayName: 'Specializations (JSON)', type: 'Note' },
        { internalName: 'MaxConcurrentDeals', displayName: 'Max Concurrent Deals', type: 'Number' },
        { internalName: 'CurrentDealCount', displayName: 'Current Deal Count', type: 'Number' },
        { internalName: 'IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1' },
        { internalName: 'CalendarEmail', displayName: 'Calendar Email', type: 'Text' },
        { internalName: 'Phone', displayName: 'Phone', type: 'Text' },
      ],
    };
  }

  private get auditLogListDefinition(): ListDefinition {
    return {
      title: 'DWxAuditLog',
      description: 'DWx Audit Log - Tracks all changes and actions',
      fields: [
        {
          internalName: 'Action',
          displayName: 'Action',
          type: 'Choice',
          required: true,
          choices: ['CREATE', 'UPDATE', 'DELETE', 'STAGE_CHANGE', 'ASSIGN', 'APPROVE', 'REJECT', 'CONFIRM', 'LOGIN'],
        },
        {
          internalName: 'EntityType',
          displayName: 'Entity Type',
          type: 'Choice',
          required: true,
          choices: ['ServiceRequest', 'ProductRequest', 'Client', 'Specialist', 'Service', 'User'],
        },
        { internalName: 'EntityId', displayName: 'Entity ID', type: 'Text', required: true },
        { internalName: 'EntityName', displayName: 'Entity Name', type: 'Text' },
        { internalName: 'PerformedBy', displayName: 'Performed By', type: 'Text', required: true },
        { internalName: 'PerformedByEmail', displayName: 'Performed By Email', type: 'Text', required: true },
        { internalName: 'Timestamp', displayName: 'Timestamp', type: 'DateTime', required: true },
        { internalName: 'Details', displayName: 'Details', type: 'Note' },
        { internalName: 'OldValues', displayName: 'Old Values (JSON)', type: 'Note' },
        { internalName: 'NewValues', displayName: 'New Values (JSON)', type: 'Note' },
      ],
    };
  }

  private get productRequestsListDefinition(): ListDefinition {
    return {
      title: 'DWxProductRequests',
      description: 'DWx Product Requests - Demo and deployment requests for DWx Apps, Web Parts, Adaptive Cards, and Agents',
      fields: [
        // Product Info
        { internalName: 'ProductId', displayName: 'Product ID', type: 'Text' },
        { internalName: 'ProductName', displayName: 'Product Name', type: 'Text', required: true },
        {
          internalName: 'ProductType',
          displayName: 'Product Type',
          type: 'Choice',
          required: true,
          choices: ['App', 'Web Part', 'Adaptive Card', 'Agent'],
        },
        { internalName: 'ProductCategory', displayName: 'Product Category', type: 'Text' },
        // Request Type
        {
          internalName: 'RequestType',
          displayName: 'Request Type',
          type: 'Choice',
          required: true,
          choices: ['Demo', 'Trial Deployment'],
        },
        // Account Manager Info
        { internalName: 'AccountManagerName', displayName: 'Account Manager Name', type: 'Text', required: true },
        { internalName: 'AccountManagerEmail', displayName: 'Account Manager Email', type: 'Text', required: true },
        { internalName: 'AccountManagerTenant', displayName: 'Account Manager Tenant', type: 'Text' },
        // Client Info
        { internalName: 'ClientName', displayName: 'Client Name', type: 'Text', required: true },
        { internalName: 'ContactName', displayName: 'Contact Name', type: 'Text', required: true },
        { internalName: 'ContactEmail', displayName: 'Contact Email', type: 'Text', required: true },
        { internalName: 'ContactPhone', displayName: 'Contact Phone', type: 'Text' },
        {
          internalName: 'Industry',
          displayName: 'Industry',
          type: 'Choice',
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Energy', 'Government', 'Education', 'Other'],
        },
        {
          internalName: 'CompanySize',
          displayName: 'Company Size',
          type: 'Choice',
          choices: ['SMB (<50)', 'Medium (50-250)', 'Large (250-1000)', 'Enterprise (1000+)'],
        },
        { internalName: 'IsPremiumClient', displayName: 'Is Premium Client', type: 'Boolean', defaultValue: '0' },
        // Status
        {
          internalName: 'Status',
          displayName: 'Status',
          type: 'Choice',
          required: true,
          choices: ['Pending Review', 'Awaiting Approval', 'Confirmed', 'Completed', 'Cancelled'],
          defaultValue: 'Pending Review',
        },
        // Deal Info
        { internalName: 'LicenseCount', displayName: 'License Count', type: 'Number' },
        { internalName: 'EstimatedValue', displayName: 'Estimated Value (ZAR)', type: 'Currency' },
        // Scheduling
        { internalName: 'ProposedSlot1', displayName: 'Proposed Slot 1', type: 'DateTime' },
        { internalName: 'ProposedSlot2', displayName: 'Proposed Slot 2', type: 'DateTime' },
        { internalName: 'ProposedSlot3', displayName: 'Proposed Slot 3', type: 'DateTime' },
        { internalName: 'ConfirmedDateTime', displayName: 'Confirmed DateTime', type: 'DateTime' },
        { internalName: 'CalendarEventId', displayName: 'Calendar Event ID', type: 'Text' },
        // Specialist Assignment
        { internalName: 'AssignedSpecialistName', displayName: 'Assigned Specialist Name', type: 'Text' },
        { internalName: 'AssignedSpecialistEmail', displayName: 'Assigned Specialist Email', type: 'Text' },
        {
          internalName: 'AssignedSpecialistRole',
          displayName: 'Assigned Specialist Role',
          type: 'Choice',
          choices: ['Demo Specialist', 'Solution Architect', 'Technical Specialist', 'Consultant'],
        },
        // Product-Specific Requirements (stored as JSON)
        { internalName: 'ProductRequirements', displayName: 'Product Requirements (JSON)', type: 'Note' },
        // Notes
        { internalName: 'Comments', displayName: 'Comments', type: 'Note' },
        { internalName: 'Outcome', displayName: 'Outcome', type: 'Text' },
        { internalName: 'NextSteps', displayName: 'Next Steps', type: 'Note' },
      ],
    };
  }

  private get managersListDefinition(): ListDefinition {
    return {
      title: 'DWxManagers',
      description: 'DWx Managers - Users with manager access to Dashboard, Approvals, and Admin',
      fields: [
        { internalName: 'Email', displayName: 'Email', type: 'Text', required: true },
        { internalName: 'AddedBy', displayName: 'Added By', type: 'Text' },
        { internalName: 'AddedDate', displayName: 'Added Date', type: 'DateTime' },
      ],
    };
  }

  private get teamMembersListDefinition(): ListDefinition {
    return {
      title: 'DWxTeamMembers',
      description: 'DWx Team Members - Internal team members for assignments',
      fields: [
        { internalName: 'Email', displayName: 'Email', type: 'Text', required: true },
        { internalName: 'Phone', displayName: 'Phone', type: 'Text' },
        {
          internalName: 'Role',
          displayName: 'Role',
          type: 'Choice',
          choices: ['Solution Architect', 'Technical Specialist', 'Consultant', 'Senior Consultant', 'Demo Specialist', 'Project Manager'],
        },
        { internalName: 'IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1' },
      ],
    };
  }

  private get accountManagersListDefinition(): ListDefinition {
    return {
      title: 'DWxAccountManagers',
      description: 'DWx Account Managers - Account managers who submit service requests',
      fields: [
        { internalName: 'Email', displayName: 'Email', type: 'Text', required: true },
        { internalName: 'Phone', displayName: 'Phone', type: 'Text' },
        { internalName: 'MobilePhone', displayName: 'Mobile Phone', type: 'Text' },
        { internalName: 'Department', displayName: 'Department', type: 'Text' },
        { internalName: 'JobTitle', displayName: 'Job Title', type: 'Text' },
        {
          internalName: 'Region',
          displayName: 'Region',
          type: 'Choice',
          choices: ['Western Cape', 'Gauteng', 'KZN', 'UK'],
        },
        {
          internalName: 'Status',
          displayName: 'Status',
          type: 'Choice',
          choices: ['Active', 'Inactive', 'On Leave'],
          defaultValue: 'Active',
        },
        {
          internalName: 'Source',
          displayName: 'Source',
          type: 'Choice',
          choices: ['Internal', 'External', 'Guest'],
          defaultValue: 'Internal',
        },
        { internalName: 'EntraUserId', displayName: 'Entra User ID', type: 'Text' },
        { internalName: 'ExternalTenant', displayName: 'External Tenant', type: 'Text' },
        { internalName: 'Company', displayName: 'Company', type: 'Text' },
        { internalName: 'ManagerEmail', displayName: 'Manager Email', type: 'Text' },
        { internalName: 'HireDate', displayName: 'Hire Date', type: 'DateTime' },
        { internalName: 'Notes', displayName: 'Notes', type: 'Note' },
      ],
    };
  }

  private get sessionPrepListDefinition(): ListDefinition {
    return {
      title: 'DWxSessionPrep',
      description: 'DWx Session Preparation - AI-powered preparation for client sessions',
      fields: [
        { internalName: 'ServiceRequestId', displayName: 'Service Request ID', type: 'Number', required: true },
        { internalName: 'SpecialistEmail', displayName: 'Specialist Email', type: 'Text', required: true },
        { internalName: 'SpecialistName', displayName: 'Specialist Name', type: 'Text' },
        {
          internalName: 'Status',
          displayName: 'Status',
          type: 'Choice',
          choices: ['Not Started', 'In Progress', 'Ready'],
          defaultValue: 'Not Started',
        },
        // AI-generated content (stored as JSON)
        { internalName: 'ClientProfile_JSON', displayName: 'Client Profile (JSON)', type: 'Note' },
        { internalName: 'TalkingPoints_JSON', displayName: 'Talking Points (JSON)', type: 'Note' },
        { internalName: 'SuggestedResources_JSON', displayName: 'Suggested Resources (JSON)', type: 'Note' },
        { internalName: 'MeetingAgenda_JSON', displayName: 'Meeting Agenda (JSON)', type: 'Note' },
        { internalName: 'ChecklistItems_JSON', displayName: 'Checklist Items (JSON)', type: 'Note' },
        { internalName: 'MeetingNotes_JSON', displayName: 'Meeting Notes JSON', type: 'Note', required: false },
        // Metadata
        { internalName: 'AIGeneratedAt', displayName: 'AI Generated At', type: 'DateTime' },
        { internalName: 'CompletedAt', displayName: 'Completed At', type: 'DateTime' },
        { internalName: 'ReminderSent', displayName: 'Reminder Sent', type: 'Boolean', defaultValue: '0' },
      ],
    };
  }

  private get landingPageContentListDefinition(): ListDefinition {
    return {
      title: 'DWxLandingPageContent',
      description: 'DWx Landing Page Content - Admin-manageable content sections for the landing page',
      fields: [
        { internalName: 'Content_JSON', displayName: 'Content (JSON)', type: 'Note', required: true },
        { internalName: 'SortOrder', displayName: 'Sort Order', type: 'Number' },
        { internalName: 'IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1' },
      ],
    };
  }

  private get knowledgeBaseListDefinition(): ListDefinition {
    return {
      title: 'DWxKnowledgeBase',
      description: 'DWx Knowledge Base - FAQ, Glossary, and Articles for Account Managers',
      fields: [
        { internalName: 'Content', displayName: 'Content', type: 'Note', required: true },
        {
          internalName: 'Type',
          displayName: 'Type',
          type: 'Choice',
          choices: ['FAQ', 'Glossary', 'Article'],
          required: true,
        },
        {
          internalName: 'Category',
          displayName: 'Category',
          type: 'Choice',
          choices: ['General', 'Services', 'Products', 'Process', 'Technical', 'Commercial'],
          defaultValue: 'General',
        },
        { internalName: 'Tags_JSON', displayName: 'Tags (JSON)', type: 'Note' },
        { internalName: 'SortOrder', displayName: 'Sort Order', type: 'Number' },
        { internalName: 'IsActive', displayName: 'Is Active', type: 'Boolean', defaultValue: '1' },
      ],
    };
  }

  private get proposalsListDefinition(): ListDefinition {
    return {
      title: 'DWxProposals',
      description: 'DWx Proposals - Structured proposal management with AI generation and approval workflow',
      fields: [
        { internalName: 'ServiceRequestId', displayName: 'Service Request ID', type: 'Number', required: true },
        {
          internalName: 'Status',
          displayName: 'Status',
          type: 'Choice',
          choices: ['Draft', 'Internal Review', 'Revision Requested', 'Approved', 'Sent to Client', 'Accepted', 'Declined'],
          defaultValue: 'Draft',
        },
        { internalName: 'Version', displayName: 'Version', type: 'Number' },
        {
          internalName: 'ProposalType',
          displayName: 'Proposal Type',
          type: 'Choice',
          choices: ['Standard', 'Custom', 'Enterprise'],
          defaultValue: 'Standard',
        },
        { internalName: 'TemplateName', displayName: 'Template Name', type: 'Text' },
        // Proposal sections (stored as JSON)
        { internalName: 'ExecutiveSummary_JSON', displayName: 'Executive Summary (JSON)', type: 'Note' },
        { internalName: 'SolutionOverview_JSON', displayName: 'Solution Overview (JSON)', type: 'Note' },
        { internalName: 'TechnologyStack_JSON', displayName: 'Technology Stack (JSON)', type: 'Note' },
        { internalName: 'ScopeOfWork_JSON', displayName: 'Scope of Work (JSON)', type: 'Note' },
        { internalName: 'PricingBreakdown_JSON', displayName: 'Pricing Breakdown (JSON)', type: 'Note' },
        { internalName: 'Timeline_JSON', displayName: 'Timeline (JSON)', type: 'Note' },
        { internalName: 'TeamComposition_JSON', displayName: 'Team Composition (JSON)', type: 'Note' },
        { internalName: 'TermsAndConditions_JSON', displayName: 'Terms and Conditions (JSON)', type: 'Note' },
        { internalName: 'ChangeControl_JSON', displayName: 'Change Control (JSON)', type: 'Note' },
        { internalName: 'Assumptions_JSON', displayName: 'Assumptions (JSON)', type: 'Note' },
        { internalName: 'RisksAndMitigations_JSON', displayName: 'Risks and Mitigations (JSON)', type: 'Note' },
        { internalName: 'SigningPage_JSON', displayName: 'Signing Page (JSON)', type: 'Note' },
        // Lifecycle metadata
        { internalName: 'ValidUntil', displayName: 'Valid Until', type: 'DateTime' },
        { internalName: 'SentDate', displayName: 'Sent Date', type: 'DateTime' },
        { internalName: 'ClientResponseDate', displayName: 'Client Response Date', type: 'DateTime' },
        { internalName: 'ClientFeedback', displayName: 'Client Feedback', type: 'Note' },
        { internalName: 'InternalNotes', displayName: 'Internal Notes', type: 'Note' },
        { internalName: 'DocumentUrl', displayName: 'Document URL', type: 'Text' },
        // Author & approval
        { internalName: 'CreatedByEmail', displayName: 'Created By Email', type: 'Text' },
        { internalName: 'CreatedByName', displayName: 'Created By Name', type: 'Text' },
        { internalName: 'ApprovedByEmail', displayName: 'Approved By Email', type: 'Text' },
        { internalName: 'ApprovedByName', displayName: 'Approved By Name', type: 'Text' },
        { internalName: 'ApprovedDate', displayName: 'Approved Date', type: 'DateTime' },
      ],
    };
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Check which DWx lists exist
   */
  async checkListsStatus(): Promise<ListStatus[]> {
    const listNames = ['DWxServices', 'DWxServiceRequests', 'DWxProductRequests', 'DWxClients', 'DWxSpecialists', 'DWxManagers', 'DWxTeamMembers', 'DWxAccountManagers', 'DWxAuditLog', 'DWxSessionPrep', 'DWxLandingPageContent', 'DWxKnowledgeBase', 'DWxProposals'];
    const results: ListStatus[] = [];

    for (const name of listNames) {
      const exists = await this.listExists(name);
      results.push({ list: name, exists });
    }

    return results;
  }

  /**
   * Check if document library exists
   */
  async checkDocumentLibraryStatus(): Promise<ListStatus> {
    const exists = await this.listExists('DWxSupportingDocuments');
    return { list: 'DWxSupportingDocuments', exists };
  }

  /**
   * Provision the DWxServices list
   */
  async provisionServicesList(): Promise<ProvisionResult> {
    return this.provisionList(this.servicesListDefinition);
  }

  /**
   * Provision the DWxServiceRequests list
   */
  async provisionServiceRequestsList(): Promise<ProvisionResult> {
    return this.provisionList(this.serviceRequestsListDefinition);
  }

  /**
   * Provision the DWxClients list
   */
  async provisionClientsList(): Promise<ProvisionResult> {
    return this.provisionList(this.clientsListDefinition);
  }

  /**
   * Provision the DWxSpecialists list
   */
  async provisionSpecialistsList(): Promise<ProvisionResult> {
    return this.provisionList(this.specialistsListDefinition);
  }

  /**
   * Provision the DWxAuditLog list
   */
  async provisionAuditLogList(): Promise<ProvisionResult> {
    return this.provisionList(this.auditLogListDefinition);
  }

  /**
   * Provision the DWxProductRequests list
   */
  async provisionProductRequestsList(): Promise<ProvisionResult> {
    return this.provisionList(this.productRequestsListDefinition);
  }

  /**
   * Provision the DWxManagers list
   */
  async provisionManagersList(): Promise<ProvisionResult> {
    return this.provisionList(this.managersListDefinition);
  }

  /**
   * Provision the DWxTeamMembers list
   */
  async provisionTeamMembersList(): Promise<ProvisionResult> {
    return this.provisionList(this.teamMembersListDefinition);
  }

  /**
   * Provision the DWxAccountManagers list
   */
  async provisionAccountManagersList(): Promise<ProvisionResult> {
    return this.provisionList(this.accountManagersListDefinition);
  }

  /**
   * Provision the DWxSessionPrep list
   */
  async provisionSessionPrepList(): Promise<ProvisionResult> {
    return this.provisionList(this.sessionPrepListDefinition);
  }

  /**
   * Provision the DWxLandingPageContent list
   */
  async provisionLandingPageContentList(): Promise<ProvisionResult> {
    return this.provisionList(this.landingPageContentListDefinition);
  }

  /**
   * Provision the DWxKnowledgeBase list
   */
  async provisionKnowledgeBaseList(): Promise<ProvisionResult> {
    return this.provisionList(this.knowledgeBaseListDefinition);
  }

  /**
   * Provision the DWxProposals list
   */
  async provisionProposalsList(): Promise<ProvisionResult> {
    return this.provisionList(this.proposalsListDefinition);
  }

  /**
   * Create the DWxSupportingDocuments document library
   */
  async provisionDocumentLibrary(): Promise<ProvisionResult> {
    try {
      const libraryName = 'DWxSupportingDocuments';

      const exists = await this.listExists(libraryName);
      if (exists) {
        return { success: true, message: `Document library "${libraryName}" already exists` };
      }

      await this.createList(libraryName, 'Supporting documents for DWx service requests (RFPs, requirements, proposals)', 'documentLibrary');

      return { success: true, message: `Document library "${libraryName}" created successfully` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create document library',
      };
    }
  }

  /**
   * Provision all required DWx lists
   */
  async provisionAllLists(): Promise<{ results: Array<{ list: string; success: boolean; message: string }> }> {
    const results: Array<{ list: string; success: boolean; message: string }> = [];

    const lists = [
      { name: 'DWxServices', provision: () => this.provisionServicesList() },
      { name: 'DWxServiceRequests', provision: () => this.provisionServiceRequestsList() },
      { name: 'DWxProductRequests', provision: () => this.provisionProductRequestsList() },
      { name: 'DWxClients', provision: () => this.provisionClientsList() },
      { name: 'DWxSpecialists', provision: () => this.provisionSpecialistsList() },
      { name: 'DWxManagers', provision: () => this.provisionManagersList() },
      { name: 'DWxTeamMembers', provision: () => this.provisionTeamMembersList() },
      { name: 'DWxAccountManagers', provision: () => this.provisionAccountManagersList() },
      { name: 'DWxAuditLog', provision: () => this.provisionAuditLogList() },
      { name: 'DWxSessionPrep', provision: () => this.provisionSessionPrepList() },
      { name: 'DWxLandingPageContent', provision: () => this.provisionLandingPageContentList() },
      { name: 'DWxKnowledgeBase', provision: () => this.provisionKnowledgeBaseList() },
      { name: 'DWxProposals', provision: () => this.provisionProposalsList() },
      { name: 'DWxSupportingDocuments', provision: () => this.provisionDocumentLibrary() },
    ];

    for (const list of lists) {
      const result = await list.provision();
      results.push({ list: list.name, ...result });
    }

    return { results };
  }

  // ==================== DEFAULT VIEW CONFIGURATION ====================

  /**
   * Get the default view ID for a list
   */
  private async getDefaultViewId(listTitle: string): Promise<string | null> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedListName = encodeURIComponent(listTitle);

      // Get all views and find the default one (usually "All Items")
      const response = await client
        .api(`/sites/${siteId}/lists/${encodedListName}/views`)
        .select('id,displayName,defaultView')
        .get();

      const views = response.value || [];
      // Prefer the view explicitly marked as default
      const defaultView = views.find((v: { defaultView?: boolean }) => v.defaultView);
      if (defaultView) return defaultView.id;

      // Fallback: find "All Items" or first view
      const allItemsView = views.find((v: { displayName?: string }) =>
        v.displayName === 'All Items' || v.displayName === 'All Documents'
      );
      return allItemsView?.id || views[0]?.id || null;
    } catch (error) {
      console.error(`[DWx Provisioning] Failed to get default view for '${listTitle}':`, error);
      return null;
    }
  }

  /**
   * Configure the default view for a list to show all custom columns.
   * Uses SharePoint REST via Graph to set the view fields.
   */
  async configureDefaultView(listTitle: string): Promise<ProvisionResult> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedListName = encodeURIComponent(listTitle);

      // Get the default view ID
      const viewId = await this.getDefaultViewId(listTitle);
      if (!viewId) {
        return { success: false, message: `No default view found for "${listTitle}"` };
      }

      // Get all columns on this list (to find custom column internal names)
      const columnsResponse = await client
        .api(`/sites/${siteId}/lists/${encodedListName}/columns`)
        .select('name,displayName,readOnly,columnGroup')
        .top(100)
        .get();

      const columns = columnsResponse.value || [];

      // Find the list definition to get the expected custom field names
      const listDef = this.getListDefinitionByTitle(listTitle);

      // Build the view fields array: start with LinkTitle (clickable Title), then add all custom fields
      const viewFields: string[] = ['LinkTitle'];

      if (listDef) {
        // Use the known field internal names from our definition (guaranteed correct order)
        for (const field of listDef.fields) {
          // Verify the column actually exists on the list
          const exists = columns.find((c: { name?: string }) => c.name === field.internalName);
          if (exists) {
            viewFields.push(field.internalName);
          }
        }
      } else {
        // Fallback for lists without a definition (e.g., doc library):
        // Add all non-system columns
        const systemColumns = new Set([
          'ContentType', 'Title', 'Modified', 'Created', 'Author', 'Editor',
          '_ModerationComments', '_ModerationStatus', 'LinkTitle', 'LinkTitleNoMenu',
          'Edit', 'DocIcon', 'ItemChildCount', 'FolderChildCount', 'AppAuthor', 'AppEditor',
          '_ComplianceFlags', '_ComplianceTag', '_ComplianceTagWrittenTime', '_ComplianceTagUserId',
          '_IsRecord', '_UIVersionString', 'ID', 'ContentTypeId', 'Attachments',
          '_HasCopyDestinations', '_CopySource',
        ]);

        for (const col of columns) {
          if (col.name && !systemColumns.has(col.name) && !col.readOnly) {
            viewFields.push(col.name);
          }
        }
      }

      // Update the default view with these fields using Graph API
      // Graph API: PATCH /sites/{siteId}/lists/{listId}/views/{viewId}
      // The viewQuery property accepts CAML-based column refs
      // But the simpler approach is to use the columns endpoint on the view

      // First, get current view columns to know what's there
      const currentViewCols = await client
        .api(`/sites/${siteId}/lists/${encodedListName}/views/${viewId}/columns`)
        .select('name')
        .top(100)
        .get();

      const currentNames = new Set(
        (currentViewCols.value || []).map((c: { name?: string }) => c.name)
      );

      // Add missing columns to the view
      let addedCount = 0;
      for (const fieldName of viewFields) {
        if (!currentNames.has(fieldName)) {
          try {
            await client
              .api(`/sites/${siteId}/lists/${encodedListName}/views/${viewId}/columns`)
              .post({ name: fieldName });
            addedCount++;
          } catch (err) {
            const error = err as { statusCode?: number; message?: string };
            // 409 = already exists, skip
            if (error.statusCode !== 409) {
              console.warn(`[DWx Provisioning] Could not add '${fieldName}' to view of '${listTitle}':`, error.message);
            }
          }
        }
      }

      if (addedCount === 0) {
        return { success: true, message: `"${listTitle}" default view already has all columns` };
      }

      return { success: true, message: `"${listTitle}" — added ${addedCount} column(s) to default view` };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : `Failed to configure view for "${listTitle}"`,
      };
    }
  }

  /**
   * Look up a list definition by its title
   */
  private getListDefinitionByTitle(title: string): ListDefinition | null {
    const map: Record<string, ListDefinition> = {
      DWxServices: this.servicesListDefinition,
      DWxServiceRequests: this.serviceRequestsListDefinition,
      DWxProductRequests: this.productRequestsListDefinition,
      DWxClients: this.clientsListDefinition,
      DWxSpecialists: this.specialistsListDefinition,
      DWxManagers: this.managersListDefinition,
      DWxTeamMembers: this.teamMembersListDefinition,
      DWxAccountManagers: this.accountManagersListDefinition,
      DWxAuditLog: this.auditLogListDefinition,
      DWxSessionPrep: this.sessionPrepListDefinition,
      DWxLandingPageContent: this.landingPageContentListDefinition,
      DWxKnowledgeBase: this.knowledgeBaseListDefinition,
      DWxProposals: this.proposalsListDefinition,
    };
    return map[title] || null;
  }

  /**
   * Configure default views for all DWx lists
   */
  async configureAllDefaultViews(
    onProgress?: (listName: string, current: number, total: number) => void
  ): Promise<{ results: Array<{ list: string; success: boolean; message: string }> }> {
    const results: Array<{ list: string; success: boolean; message: string }> = [];

    const listNames = [
      'DWxServices', 'DWxServiceRequests', 'DWxProductRequests', 'DWxClients',
      'DWxSpecialists', 'DWxManagers', 'DWxTeamMembers', 'DWxAccountManagers',
      'DWxAuditLog', 'DWxSessionPrep', 'DWxLandingPageContent', 'DWxKnowledgeBase',
      'DWxProposals',
    ];

    for (let i = 0; i < listNames.length; i++) {
      const listName = listNames[i];
      if (onProgress) onProgress(listName, i + 1, listNames.length);

      const result = await this.configureDefaultView(listName);
      results.push({ list: listName, ...result });
    }

    return { results };
  }

  /**
   * Seed the DWxServices list with default services
   */
  async seedServicesData(): Promise<{ results: Array<{ service: string; success: boolean; message: string }> }> {
    const results: Array<{ service: string; success: boolean; message: string }> = [];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxServices');

      for (const service of DW_SERVICES_SEED_DATA) {
        try {
          // Find matching DEFAULT_SERVICES entry for rich content
          const richContent = DEFAULT_SERVICES.find(s => s.Title === service.Title);

          const fields = {
            Title: service.Title,
            Description: service.Description,
            ShortDescription: service.ShortDescription,
            Category: service.Category,
            TypicalDuration: service.TypicalDuration,
            ComplexityLevel: service.ComplexityLevel,
            PricingModel: service.PricingModel,
            BasePrice: service.BasePrice,
            RequiredRoles: JSON.stringify(service.RequiredRoles),
            Prerequisites: service.Prerequisites,
            IsActive: true,
            SortOrder: service.SortOrder,
            IconName: service.IconName,
            // Rich content fields (JSON-serialized)
            WhatsIncluded_JSON: richContent?.WhatsIncluded ? JSON.stringify(richContent.WhatsIncluded) : null,
            EngagementPhases_JSON: richContent?.EngagementPhases ? JSON.stringify(richContent.EngagementPhases) : null,
            KeyBenefits_JSON: richContent?.KeyBenefits ? JSON.stringify(richContent.KeyBenefits) : null,
            IdealFor_JSON: richContent?.IdealFor ? JSON.stringify(richContent.IdealFor) : null,
            RelatedCategories_JSON: richContent?.RelatedCategories ? JSON.stringify(richContent.RelatedCategories) : null,
            // SLA targets based on complexity level
            SLATargets_JSON: JSON.stringify(DEFAULT_SLA_TARGETS[service.ComplexityLevel as ServiceComplexity] || DEFAULT_SLA_TARGETS.Medium),
          };

          await graphService.createListItem('DWxServices', this.filterFieldsForList(fields, validColumns));

          results.push({ service: service.Title, success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({
            service: service.Title,
            success: false,
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    } catch (error) {
      results.push({
        service: 'All',
        success: false,
        message: error instanceof Error ? error.message : 'Failed to seed services',
      });
    }

    return { results };
  }

  /**
   * Seed the DWxTeamMembers list with sample team members
   */
  async seedTeamMembersData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const seedData = [
      { Title: 'Gary Finberg', Email: 'gary@firsttech.digital', Phone: '+27 82 555 0001', Role: 'Solution Architect', IsActive: true },
      { Title: 'Wimpie Baard', Email: 'wimpie.baard@firsttech.digital', Phone: '+27 82 555 0002', Role: 'Technical Specialist', IsActive: true },
      { Title: 'Gulzar Ismail', Email: 'Gulzar.Ismail@firsttech.digital', Phone: '+27 82 555 0003', Role: 'Senior Consultant', IsActive: true },
      { Title: 'Chris van Niekerk', Email: 'chris@firsttech.digital', Phone: '+27 82 555 0004', Role: 'Consultant', IsActive: true },
      { Title: 'Sarah Mitchell', Email: 'sarah.mitchell@firsttech.digital', Phone: '+27 82 555 0005', Role: 'Demo Specialist', IsActive: true },
      { Title: 'James Peterson', Email: 'james.peterson@firsttech.digital', Phone: '+27 82 555 0006', Role: 'Project Manager', IsActive: true },
    ];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxTeamMembers');
      for (const member of seedData) {
        try {
          const filtered = this.filterFieldsForList(member, validColumns);
          await graphService.createListItem('DWxTeamMembers', filtered);
          results.push({ name: member.Title, success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: member.Title, success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    } catch (error) {
      results.push({ name: 'All', success: false, message: error instanceof Error ? error.message : 'Failed to seed team members' });
    }

    return { results };
  }

  /**
   * Seed the DWxClients list with top SA enterprise companies
   */
  async seedClientsData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const seedData = [
      { Title: 'Woolworths Holdings', PrimaryContactName: 'Anita Naidoo', PrimaryContactEmail: 'anita.naidoo@woolworths.co.za', DecisionMakerName: 'Roy Memory', DecisionMakerEmail: 'roy.memory@woolworths.co.za', Phone: '+27 21 407 9111', Industry: 'Retail', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'gary@firsttech.digital', EngagementCount: 6, TotalRevenue: 950000, LastEngagementDate: '2026-01-15T00:00:00Z', Address: 'Woolworths House, 93 Longmarket Street, Cape Town, 8001' },
      { Title: 'SASOL Limited', PrimaryContactName: 'Johan Botha', PrimaryContactEmail: 'johan.botha@sasol.com', DecisionMakerName: 'Lindiwe Nkosi', DecisionMakerEmail: 'lindiwe.nkosi@sasol.com', Phone: '+27 10 344 5000', Industry: 'Manufacturing', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', EngagementCount: 4, TotalRevenue: 1150000, LastEngagementDate: '2025-12-10T00:00:00Z', Address: 'Sasol Place, 50 Katherine Street, Sandton, 2196' },
      { Title: 'Nampak Limited', PrimaryContactName: 'Hennie van Zyl', PrimaryContactEmail: 'hennie.vanzyl@nampak.com', DecisionMakerName: 'Phildon Memory', DecisionMakerEmail: 'phildon.memory@nampak.com', Phone: '+27 11 719 6300', Industry: 'Manufacturing', CompanySize: 'Large (250-1000)', IsPremium: false, ContractStatus: 'Active', AccountManagerEmail: 'chris@firsttech.digital', EngagementCount: 2, TotalRevenue: 280000, LastEngagementDate: '2025-10-20T00:00:00Z', Address: 'Office G6, 1 Waterhouse Place, Century City, 7441' },
      { Title: 'Old Mutual', PrimaryContactName: 'David Tshabalala', PrimaryContactEmail: 'david.tshabalala@oldmutual.co.za', DecisionMakerName: 'Iain Williamson', DecisionMakerEmail: 'iain.williamson@oldmutual.co.za', Phone: '+27 21 509 9111', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'gary@firsttech.digital', EngagementCount: 8, TotalRevenue: 1350000, LastEngagementDate: '2026-01-22T00:00:00Z', Address: 'Mutualpark, Jan Smuts Drive, Pinelands, Cape Town, 7405' },
      { Title: 'Sanlam', PrimaryContactName: 'Liezel du Plessis', PrimaryContactEmail: 'liezel.duplessis@sanlam.co.za', DecisionMakerName: 'Paul Hanratty', DecisionMakerEmail: 'paul.hanratty@sanlam.co.za', Phone: '+27 21 947 9111', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'james.peterson@firsttech.digital', EngagementCount: 5, TotalRevenue: 780000, LastEngagementDate: '2025-11-28T00:00:00Z', Address: '2 Strand Road, Bellville, Cape Town, 7530' },
      { Title: 'Shoprite Holdings', PrimaryContactName: 'Fathima Patel', PrimaryContactEmail: 'fathima.patel@shoprite.co.za', DecisionMakerName: 'Pieter Engelbrecht', DecisionMakerEmail: 'pieter.engelbrecht@shoprite.co.za', Phone: '+27 21 980 4000', Industry: 'Retail', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'wimpie.baard@firsttech.digital', EngagementCount: 3, TotalRevenue: 620000, LastEngagementDate: '2025-11-05T00:00:00Z', Address: 'Cnr William Dabs & Old Paarl Roads, Brackenfell, Cape Town, 7560' },
      { Title: 'Ackermans', PrimaryContactName: 'Riana Steyn', PrimaryContactEmail: 'riana.steyn@ackermans.co.za', DecisionMakerName: 'Charl de Villiers', DecisionMakerEmail: 'charl.devilliers@ackermans.co.za', Phone: '+27 21 928 1040', Industry: 'Retail', CompanySize: 'Large (250-1000)', IsPremium: false, ContractStatus: 'Active', AccountManagerEmail: 'chris@firsttech.digital', EngagementCount: 1, TotalRevenue: 145000, LastEngagementDate: '2025-09-12T00:00:00Z', Address: 'Produksie Street, Kuilsriver, Cape Town, 7579' },
      { Title: 'The Foschini Group (TFG)', PrimaryContactName: 'Thabo Mokoena', PrimaryContactEmail: 'thabo.mokoena@tfg.co.za', DecisionMakerName: 'Anthony Memory', DecisionMakerEmail: 'anthony.memory@tfg.co.za', Phone: '+27 21 938 1911', Industry: 'Retail', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', EngagementCount: 4, TotalRevenue: 520000, LastEngagementDate: '2025-12-18T00:00:00Z', Address: 'Stanley Lewis Centre, 340 Voortrekker Road, Parow East, Cape Town, 7500' },
      { Title: 'Feltex', PrimaryContactName: 'Pieter Swanepoel', PrimaryContactEmail: 'pieter.swanepoel@feltex.co.za', DecisionMakerName: 'Andre Memory', DecisionMakerEmail: 'andre.memory@feltex.co.za', Phone: '+27 31 460 4200', Industry: 'Manufacturing', CompanySize: 'Medium (50-250)', IsPremium: false, ContractStatus: 'Prospect', AccountManagerEmail: 'wimpie.baard@firsttech.digital', EngagementCount: 0, TotalRevenue: 0, Address: '291 Paisley Road, Jacobs, Durban, KwaZulu-Natal, 4026' },
      { Title: 'Clicks Group', PrimaryContactName: 'Nomsa Dlamini', PrimaryContactEmail: 'nomsa.dlamini@clicks.co.za', DecisionMakerName: 'Bertina Engelbrecht', DecisionMakerEmail: 'bertina.engelbrecht@clicks.co.za', Phone: '+27 21 460 1911', Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'gary@firsttech.digital', EngagementCount: 5, TotalRevenue: 680000, LastEngagementDate: '2026-01-08T00:00:00Z', Address: 'Cnr Searle & Pontac Streets, Cape Town, 8000' },
      { Title: 'Nedbank', PrimaryContactName: 'Pieter van der Merwe', PrimaryContactEmail: 'pieter.vandermerwe@nedbank.co.za', DecisionMakerName: 'Zanele Mthembu', DecisionMakerEmail: 'zanele.mthembu@nedbank.co.za', Phone: '+27 11 294 4444', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'james.peterson@firsttech.digital', EngagementCount: 7, TotalRevenue: 1250000, LastEngagementDate: '2026-01-20T00:00:00Z', Address: '135 Rivonia Road, Sandown, Sandton, 2196' },
      { Title: 'ABSA Group', PrimaryContactName: 'Lerato Khumalo', PrimaryContactEmail: 'lerato.khumalo@absa.co.za', DecisionMakerName: 'Arrie Rautenbach', DecisionMakerEmail: 'arrie.rautenbach@absa.co.za', Phone: '+27 11 350 4000', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', EngagementCount: 9, TotalRevenue: 1580000, LastEngagementDate: '2026-02-01T00:00:00Z', Address: '7th Floor, Absa Towers West, 15 Troye Street, Johannesburg, 2001' },
      { Title: 'Netcare', PrimaryContactName: 'Sipho Mabena', PrimaryContactEmail: 'sipho.mabena@netcare.co.za', DecisionMakerName: 'Richard Memory', DecisionMakerEmail: 'richard.memory@netcare.co.za', Phone: '+27 11 301 0499', Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'wimpie.baard@firsttech.digital', EngagementCount: 3, TotalRevenue: 450000, LastEngagementDate: '2025-11-15T00:00:00Z', Address: '76 Maude Street, Corner West Street, Sandton, 2196' },
      { Title: 'SPAR Group', PrimaryContactName: 'Derek van Niekerk', PrimaryContactEmail: 'derek.vanniekerk@spar.co.za', DecisionMakerName: 'Brett Memory', DecisionMakerEmail: 'brett.memory@spar.co.za', Phone: '+27 31 719 1900', Industry: 'Retail', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', EngagementCount: 2, TotalRevenue: 310000, LastEngagementDate: '2025-12-05T00:00:00Z', Address: '22 Chancery Lane, Pinetown, KwaZulu-Natal, 3610' },
      { Title: 'OUTsurance', PrimaryContactName: 'Marelize Joubert', PrimaryContactEmail: 'marelize.joubert@outsurance.co.za', DecisionMakerName: 'Marthinus Memory', DecisionMakerEmail: 'marthinus.memory@outsurance.co.za', Phone: '+27 10 753 2430', Industry: 'Finance', CompanySize: 'Large (250-1000)', IsPremium: false, ContractStatus: 'Active', AccountManagerEmail: 'james.peterson@firsttech.digital', EngagementCount: 1, TotalRevenue: 95000, LastEngagementDate: '2025-10-22T00:00:00Z', Address: '1241 Embankment Road, Zwartkop Ext 7, Centurion, 0157' },
      { Title: 'Discovery Health', PrimaryContactName: 'Thabo Mokoena', PrimaryContactEmail: 'thabo.mokoena@discovery.co.za', DecisionMakerName: 'Adrian Gore', DecisionMakerEmail: 'adrian.gore@discovery.co.za', Phone: '+27 11 529 2888', Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'gary@firsttech.digital', EngagementCount: 5, TotalRevenue: 920000, LastEngagementDate: '2026-01-10T00:00:00Z', Address: '1 Discovery Place, Sandton, Gauteng, 2196' },
      { Title: 'MTN South Africa', PrimaryContactName: 'Nomsa Dlamini', PrimaryContactEmail: 'nomsa.dlamini@mtn.com', DecisionMakerName: 'Ralph Mupita', DecisionMakerEmail: 'ralph.mupita@mtn.com', Phone: '+27 11 912 3000', Industry: 'Technology', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'wimpie.baard@firsttech.digital', EngagementCount: 4, TotalRevenue: 780000, LastEngagementDate: '2025-12-18T00:00:00Z', Address: '216 14th Avenue, Fairland, Johannesburg, Gauteng, 2195' },
      { Title: 'Standard Bank', PrimaryContactName: 'Johan Botha', PrimaryContactEmail: 'johan.botha@standardbank.co.za', DecisionMakerName: 'Lungisa Fuzile', DecisionMakerEmail: 'lungisa.fuzile@standardbank.co.za', Phone: '+27 11 636 1061', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', EngagementCount: 6, TotalRevenue: 1100000, LastEngagementDate: '2026-01-28T00:00:00Z', Address: '5 Simmonds Street, Johannesburg, Gauteng, 2001' },
      { Title: 'Pick n Pay', PrimaryContactName: 'Anele Mthembu', PrimaryContactEmail: 'anele.mthembu@pnp.co.za', DecisionMakerName: 'Sean Summers', DecisionMakerEmail: 'sean.summers@pnp.co.za', Phone: '+27 21 658 1000', Industry: 'Retail', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'chris@firsttech.digital', EngagementCount: 3, TotalRevenue: 420000, LastEngagementDate: '2025-11-30T00:00:00Z', Address: '101 Rosmead Avenue, Kenilworth, Cape Town, Western Cape, 7708' },
      { Title: 'Vivo Energy', PrimaryContactName: 'Francois du Plessis', PrimaryContactEmail: 'francois.duplessis@vivoenergy.com', DecisionMakerName: 'Stan Mittelman', DecisionMakerEmail: 'stan.mittelman@vivoenergy.com', Phone: '+27 21 403 4911', Industry: 'Energy', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Prospect', AccountManagerEmail: 'gary@firsttech.digital', EngagementCount: 0, TotalRevenue: 0, Address: 'Engen Court, Thibault Square, Cape Town, Western Cape, 8001' },
    ];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxClients');
      for (const client of seedData) {
        try {
          const filtered = this.filterFieldsForList(client, validColumns);
          await graphService.createListItem('DWxClients', filtered);
          results.push({ name: client.Title, success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: client.Title, success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    } catch (error) {
      results.push({ name: 'All', success: false, message: error instanceof Error ? error.message : 'Failed to seed clients' });
    }

    return { results };
  }

  /**
   * Seed the DWxAccountManagers list with sample account managers
   */
  async seedAccountManagersData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const seedData = [
      { Title: 'Gary Finberg', Email: 'gary@firsttech.digital', Phone: '+27 21 555 0001', Department: 'Sales', JobTitle: 'Senior Account Manager', Region: 'Western Cape', Status: 'Active', Source: 'Internal', Company: 'First Technology Digital' },
      { Title: 'Wimpie Baard', Email: 'wimpie.baard@firsttech.digital', Phone: '+27 11 555 0002', Department: 'Sales', JobTitle: 'Account Manager', Region: 'Gauteng', Status: 'Active', Source: 'Internal', Company: 'First Technology Digital' },
      { Title: 'Gulzar Ismail', Email: 'Gulzar.Ismail@firsttech.digital', Phone: '+27 31 555 0003', Department: 'Sales', JobTitle: 'Account Manager', Region: 'KZN', Status: 'Active', Source: 'Internal', Company: 'First Technology Digital' },
      { Title: 'Chris van Niekerk', Email: 'chris@firsttech.digital', Phone: '+27 21 555 0004', Department: 'Sales', JobTitle: 'Account Executive', Region: 'Western Cape', Status: 'Active', Source: 'Internal', Company: 'First Technology Digital' },
      { Title: 'James Peterson', Email: 'james.peterson@firsttech.digital', Phone: '+44 20 555 0005', Department: 'International Sales', JobTitle: 'Account Manager', Region: 'UK', Status: 'Active', Source: 'Internal', Company: 'First Technology Digital' },
    ];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxAccountManagers');
      for (const am of seedData) {
        try {
          const filtered = this.filterFieldsForList(am, validColumns);
          await graphService.createListItem('DWxAccountManagers', filtered);
          results.push({ name: am.Title, success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: am.Title, success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    } catch (error) {
      results.push({ name: 'All', success: false, message: error instanceof Error ? error.message : 'Failed to seed account managers' });
    }

    return { results };
  }

  /**
   * Seed the DWxSpecialists list with pre-sales specialists
   */
  async seedSpecialistsData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const seedData = [
      { Title: 'Gary Finberg', Email: 'gary@firsttech.digital', Role: 'Solution Architect', Specializations: JSON.stringify(['Power Platform', 'M365 Assessment', 'Copilot Agents']), MaxConcurrentDeals: 5, CurrentDealCount: 3, IsActive: true, CalendarEmail: 'gary@firsttech.digital', Phone: '+27 82 555 0001' },
      { Title: 'Wimpie Baard', Email: 'wimpie.baard@firsttech.digital', Role: 'Technical Specialist', Specializations: JSON.stringify(['SPFx Development', 'SharePoint Migration', 'Power Platform']), MaxConcurrentDeals: 4, CurrentDealCount: 2, IsActive: true, CalendarEmail: 'wimpie.baard@firsttech.digital', Phone: '+27 82 555 0002' },
      { Title: 'Gulzar Ismail', Email: 'Gulzar.Ismail@firsttech.digital', Role: 'Senior Consultant', Specializations: JSON.stringify(['M365 Assessment', 'MS Viva', 'SharePoint Migration']), MaxConcurrentDeals: 4, CurrentDealCount: 2, IsActive: true, CalendarEmail: 'Gulzar.Ismail@firsttech.digital', Phone: '+27 82 555 0003' },
      { Title: 'Chris van Niekerk', Email: 'chris@firsttech.digital', Role: 'Consultant', Specializations: JSON.stringify(['Power Platform', 'MS Viva', 'Training']), MaxConcurrentDeals: 3, CurrentDealCount: 1, IsActive: true, CalendarEmail: 'chris@firsttech.digital', Phone: '+27 82 555 0004' },
      { Title: 'Sarah Mitchell', Email: 'sarah.mitchell@firsttech.digital', Role: 'Technical Specialist', Specializations: JSON.stringify(['SPFx Development', 'Copilot Agents']), MaxConcurrentDeals: 3, CurrentDealCount: 0, IsActive: true, CalendarEmail: 'sarah.mitchell@firsttech.digital', Phone: '+27 82 555 0005' },
    ];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxSpecialists');
      for (const specialist of seedData) {
        try {
          const filtered = this.filterFieldsForList(specialist, validColumns);
          await graphService.createListItem('DWxSpecialists', filtered);
          results.push({ name: specialist.Title, success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: specialist.Title, success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    } catch (error) {
      results.push({ name: 'All', success: false, message: error instanceof Error ? error.message : 'Failed to seed specialists' });
    }

    return { results };
  }

  /**
   * Seed the DWxManagers list with manager access entries
   */
  async seedManagersData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const seedData = [
      { Title: 'Gary Finberg', Email: 'gary@firsttech.digital', AddedBy: 'System Seed', AddedDate: new Date().toISOString() },
      { Title: 'James Peterson', Email: 'james.peterson@firsttech.digital', AddedBy: 'System Seed', AddedDate: new Date().toISOString() },
    ];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxManagers');
      for (const manager of seedData) {
        try {
          const filtered = this.filterFieldsForList(manager, validColumns);
          await graphService.createListItem('DWxManagers', filtered);
          results.push({ name: manager.Title, success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: manager.Title, success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    } catch (error) {
      results.push({ name: 'All', success: false, message: error instanceof Error ? error.message : 'Failed to seed managers' });
    }

    return { results };
  }

  /**
   * Seed the DWxServiceRequests list with 14 sample requests across all funnel stages
   */
  async seedServiceRequestsData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const seedData = [
      // Lead Stage (2) - New inquiries, no specialist assigned
      {
        Title: 'Feltex - M365 Tenant Assessment',
        ServiceName: 'M365 Tenant Assessment',
        AccountManagerName: 'Wimpie Baard', AccountManagerEmail: 'wimpie.baard@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Feltex', ContactName: 'Pieter Swanepoel', ContactEmail: 'pieter.swanepoel@feltex.co.za', ContactPhone: '+27 11 688 2000',
        Industry: 'Manufacturing', CompanySize: 'Medium (50-250)',
        FunnelStage: 'Lead', InterestLevel: 'Warm',
        DealValue: 120000, DealProbability: 20, ExpectedCloseDate: '2026-06-30T00:00:00Z',
        Budget: 'R100K - R150K', Timeline: 'Q3 2026',
        Requirements: 'Security and compliance audit of their M365 environment. Feltex is modernising their manufacturing IT stack and needs POPIA compliance verification across their collaboration tools.',
        Comments: 'New prospect - Pieter attended our webinar on M365 security best practices for manufacturing.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2026-02-01T08:30:00Z' }),
      },
      {
        Title: 'Nampak Limited - SharePoint Migration',
        ServiceName: 'SharePoint Migration',
        AccountManagerName: 'Chris van Niekerk', AccountManagerEmail: 'chris@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Nampak Limited', ContactName: 'Hennie van Zyl', ContactEmail: 'hennie.vanzyl@nampak.com', ContactPhone: '+27 11 719 6300',
        Industry: 'Manufacturing', CompanySize: 'Large (250-1000)',
        FunnelStage: 'Lead', InterestLevel: 'Cold',
        DealValue: 480000, DealProbability: 10, ExpectedCloseDate: '2026-09-30T00:00:00Z',
        Budget: 'R400K - R600K', Timeline: 'H2 2026',
        Requirements: 'Migration of on-premises SharePoint 2016 farm to SharePoint Online. Approximately 1.5TB of content across packaging design documents, compliance records, and operational manuals for SA, UK, and African operations.',
        Comments: 'Initial inquiry via website contact form. Large-scale migration with complex permissions across multiple subsidiaries.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2026-01-28T10:15:00Z' }),
      },
      // Qualified Stage (2) - Interest validated, specialist being assigned
      {
        Title: 'The Foschini Group (TFG) - Enterprise Copilot Agents',
        ServiceName: 'Enterprise Copilot Agents',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'The Foschini Group (TFG)', ContactName: 'Thabo Mokoena', ContactEmail: 'thabo.mokoena@tfg.co.za', ContactPhone: '+27 21 938 1911',
        Industry: 'Retail', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Qualified', InterestLevel: 'Hot',
        DealValue: 750000, DealProbability: 40, ExpectedCloseDate: '2026-05-31T00:00:00Z',
        Budget: 'R600K - R900K', Timeline: 'Q2 2026',
        AssignedSpecialistName: 'Gary Finberg', AssignedSpecialistEmail: 'gary@firsttech.digital', AssignedSpecialistRole: 'Solution Architect',
        Requirements: 'Design and implement Copilot agents for TFG\'s retail operations across Foschini, Markham, Sportscene, and @home. Agents will assist store managers with stock queries, HR self-service, and customer service escalations.',
        Comments: 'Premium client with strong executive sponsorship. CTO is driving the AI transformation agenda across all retail brands.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2026-01-10T09:00:00Z', Qualified: '2026-01-15T14:30:00Z' }),
      },
      {
        Title: 'Shoprite Holdings - Power Platform Development',
        ServiceName: 'Power Platform Development',
        AccountManagerName: 'Wimpie Baard', AccountManagerEmail: 'wimpie.baard@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Shoprite Holdings', ContactName: 'Fathima Patel', ContactEmail: 'fathima.patel@shoprite.co.za', ContactPhone: '+27 21 980 4000',
        Industry: 'Retail', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Qualified', InterestLevel: 'Warm',
        DealValue: 280000, DealProbability: 35, ExpectedCloseDate: '2026-06-15T00:00:00Z',
        Budget: 'R250K - R350K', Timeline: 'Q2-Q3 2026',
        AssignedSpecialistName: 'Wimpie Baard', AssignedSpecialistEmail: 'wimpie.baard@firsttech.digital', AssignedSpecialistRole: 'Technical Specialist',
        Requirements: 'Power Apps for store inventory auditing across 3,000+ Shoprite, Checkers, and Usave stores. Need offline capability for rural locations and integration with their existing SAP inventory system.',
        Comments: 'Follow-up from a successful initial engagement. They need offline-first Power Apps for store managers.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2026-01-18T11:00:00Z', Qualified: '2026-01-24T09:45:00Z' }),
      },
      // Discovery Stage (2) - Meeting scheduled, specialist assigned
      {
        Title: 'Nedbank - Power Platform Development',
        ServiceName: 'Power Platform Development',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Nedbank', ContactName: 'Pieter van der Merwe', ContactEmail: 'pieter.vandermerwe@nedbank.co.za', ContactPhone: '+27 11 294 4444',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Discovery', InterestLevel: 'Hot',
        DealValue: 450000, DealProbability: 60, ExpectedCloseDate: '2026-04-15T00:00:00Z',
        Budget: 'R400K - R500K', Timeline: 'Q2 2026',
        ConfirmedDateTime: '2026-03-15T10:00:00Z',
        AssignedSpecialistName: 'Gary Finberg', AssignedSpecialistEmail: 'gary@firsttech.digital', AssignedSpecialistRole: 'Solution Architect',
        Requirements: 'Custom Power Apps for branch operations digitisation. Currently 200+ branches use paper-based processes for customer onboarding, account opening, and compliance checks. Need integration with Nedbank core banking APIs and Azure AD for branch staff authentication.',
        Comments: 'Premium client - priority engagement. Discovery session confirmed for March 15. Previous M365 Assessment was a success.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2026-01-05T08:00:00Z', Qualified: '2026-01-08T15:00:00Z', Discovery: '2026-01-12T10:00:00Z' }),
      },
      {
        Title: 'Netcare - SPFx Development',
        ServiceName: 'SPFx Development',
        AccountManagerName: 'Wimpie Baard', AccountManagerEmail: 'wimpie.baard@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Netcare', ContactName: 'Sipho Mabena', ContactEmail: 'sipho.mabena@netcare.co.za', ContactPhone: '+27 11 301 0000',
        Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Discovery', InterestLevel: 'Hot',
        DealValue: 520000, DealProbability: 55, ExpectedCloseDate: '2026-04-30T00:00:00Z',
        Budget: 'R450K - R600K', Timeline: 'Q2 2026',
        ConfirmedDateTime: '2026-03-18T14:00:00Z',
        AssignedSpecialistName: 'Wimpie Baard', AssignedSpecialistEmail: 'wimpie.baard@firsttech.digital', AssignedSpecialistRole: 'Technical Specialist',
        Requirements: 'Custom SPFx web parts for Netcare\'s hospital intranet. Need interactive patient flow dashboards, staff rostering views, and compliance tracking web parts that integrate with their hospital management system across 54 hospitals.',
        Comments: 'Complex SPFx project with healthcare system integration. Discovery session scheduled for March 18.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2026-01-08T09:30:00Z', Qualified: '2026-01-14T11:00:00Z', Discovery: '2026-01-20T14:00:00Z' }),
      },
      // Proposal Stage (2) - Discovery complete, proposal being prepared
      {
        Title: 'SASOL Limited - SharePoint Migration',
        ServiceName: 'SharePoint Migration',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'SASOL Limited', ContactName: 'Johan Botha', ContactEmail: 'johan.botha@sasol.com', ContactPhone: '+27 10 344 5000',
        Industry: 'Manufacturing', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Proposal', InterestLevel: 'Warm',
        DealValue: 850000, DealProbability: 50, ExpectedCloseDate: '2026-04-30T00:00:00Z',
        Budget: 'R750K - R1M', Timeline: 'Q2-Q3 2026',
        ConfirmedDateTime: '2026-02-10T09:00:00Z',
        AssignedSpecialistName: 'Gulzar Ismail', AssignedSpecialistEmail: 'Gulzar.Ismail@firsttech.digital', AssignedSpecialistRole: 'Senior Consultant',
        Requirements: 'Migration of engineering document management system from SharePoint 2019 on-prem to SharePoint Online. 5TB of technical drawings, safety documents, and project files. Must preserve metadata, version history, and complex permission structures. Compliance with mining safety regulations (MHSA) required.',
        Comments: 'Discovery completed Feb 10. Preparing phased migration proposal. Key concern is maintaining uptime during migration for Secunda and Sasolburg plants.',
        NextSteps: 'Finalise migration roadmap and present proposal by March 1',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2025-12-02T08:00:00Z', Qualified: '2025-12-10T14:00:00Z', Discovery: '2025-12-20T09:00:00Z', Proposal: '2026-02-10T09:00:00Z' }),
      },
      {
        Title: 'Sanlam - Microsoft Viva Suite',
        ServiceName: 'Microsoft Viva Suite',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Sanlam', ContactName: 'Liezel du Plessis', ContactEmail: 'liezel.duplessis@sanlam.co.za', ContactPhone: '+27 21 947 9111',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Proposal', InterestLevel: 'Warm',
        DealValue: 380000, DealProbability: 45, ExpectedCloseDate: '2026-05-15T00:00:00Z',
        Budget: 'R300K - R450K', Timeline: 'Q2-Q3 2026',
        ConfirmedDateTime: '2026-02-05T11:00:00Z',
        AssignedSpecialistName: 'Gulzar Ismail', AssignedSpecialistEmail: 'Gulzar.Ismail@firsttech.digital', AssignedSpecialistRole: 'Senior Consultant',
        Requirements: 'Full Microsoft Viva implementation across Sanlam: Viva Connections for their intranet, Viva Learning for FAIS compliance training, Viva Insights for hybrid work analytics, and Viva Engage for cross-departmental collaboration. 4,500 employees in scope.',
        Comments: 'Discovery session completed. Sanlam is particularly interested in Viva Learning for regulatory compliance training tracking.',
        NextSteps: 'Draft proposal with phased rollout starting with Viva Connections and Learning',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2025-11-15T10:00:00Z', Qualified: '2025-11-22T09:00:00Z', Discovery: '2025-12-05T11:00:00Z', Proposal: '2026-02-05T11:00:00Z' }),
      },
      // Negotiation Stage (2) - Proposal sent, terms being finalised
      {
        Title: 'Old Mutual - Enterprise Copilot Agents',
        ServiceName: 'Enterprise Copilot Agents',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Old Mutual', ContactName: 'David Tshabalala', ContactEmail: 'david.tshabalala@oldmutual.co.za', ContactPhone: '+27 21 509 9111',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Negotiation', InterestLevel: 'Hot',
        DealValue: 920000, DealProbability: 75, ExpectedCloseDate: '2026-03-31T00:00:00Z',
        Budget: 'R800K - R1M', Timeline: 'Q1-Q2 2026',
        ConfirmedDateTime: '2026-01-20T10:00:00Z',
        AssignedSpecialistName: 'Gary Finberg', AssignedSpecialistEmail: 'gary@firsttech.digital', AssignedSpecialistRole: 'Solution Architect',
        Requirements: 'Enterprise Copilot agents for wealth management advisors and policy servicing. Agents will surface client portfolio information, product recommendations, and compliance checklists. Integration with Old Mutual\'s existing Salesforce CRM and policy administration systems.',
        Comments: 'Proposal approved by technical team. Negotiating final pricing and SLA terms. Legal review of data processing agreement in progress.',
        NextSteps: 'Finalise contract terms and sign by end of March',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2025-10-01T08:00:00Z', Qualified: '2025-10-08T10:00:00Z', Discovery: '2025-10-20T10:00:00Z', Proposal: '2025-11-15T09:00:00Z', Negotiation: '2026-01-20T10:00:00Z' }),
      },
      {
        Title: 'ABSA Group - M365 Tenant Assessment',
        ServiceName: 'M365 Tenant Assessment',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'ABSA Group', ContactName: 'Lerato Khumalo', ContactEmail: 'lerato.khumalo@absa.co.za', ContactPhone: '+27 11 350 4000',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Negotiation', InterestLevel: 'Warm',
        DealValue: 250000, DealProbability: 65, ExpectedCloseDate: '2026-03-15T00:00:00Z',
        Budget: 'R200K - R300K', Timeline: 'Q1 2026',
        ConfirmedDateTime: '2026-01-15T09:00:00Z',
        AssignedSpecialistName: 'Chris van Niekerk', AssignedSpecialistEmail: 'chris@firsttech.digital', AssignedSpecialistRole: 'Consultant',
        Requirements: 'Comprehensive M365 security and governance assessment ahead of their planned migration of retail banking teams to Teams. Focus on DLP policies, sensitivity labels, conditional access, and SARB (South African Reserve Bank) regulatory compliance.',
        Comments: 'Assessment scope agreed. Negotiating timeline - ABSA wants completion before Q2 board meeting.',
        NextSteps: 'Confirm start date and provision access to tenant analytics',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2025-10-15T09:00:00Z', Qualified: '2025-10-22T14:00:00Z', Discovery: '2025-11-05T09:00:00Z', Proposal: '2025-12-01T10:00:00Z', Negotiation: '2026-01-15T09:00:00Z' }),
      },
      // Won Stage (2) - Contract signed, deal closed
      {
        Title: 'Woolworths Holdings - Power Platform Development',
        ServiceName: 'Power Platform Development',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Woolworths Holdings', ContactName: 'Anita Naidoo', ContactEmail: 'anita.naidoo@woolworths.co.za', ContactPhone: '+27 21 407 9111',
        Industry: 'Retail', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Won', InterestLevel: 'Hot',
        DealValue: 320000, DealProbability: 100, ExpectedCloseDate: '2026-01-31T00:00:00Z',
        Budget: 'R300K - R350K', Timeline: 'Q1 2026',
        ConfirmedDateTime: '2025-12-10T10:00:00Z',
        AssignedSpecialistName: 'Wimpie Baard', AssignedSpecialistEmail: 'wimpie.baard@firsttech.digital', AssignedSpecialistRole: 'Technical Specialist',
        Requirements: 'Power Automate workflows for supply chain approvals and Power BI dashboards for store performance analytics across Woolworths Food, Fashion, and Beauty divisions.',
        WinLossReason: 'Strong demo of retail-specific Power Platform solutions. Competitive pricing and proven experience with SA retail sector.',
        Comments: 'Contract signed January 31. Project kickoff scheduled for February 15.',
        NextSteps: 'Project initiation and environment setup',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2025-09-01T08:00:00Z', Qualified: '2025-09-05T10:00:00Z', Discovery: '2025-09-15T10:00:00Z', Proposal: '2025-10-10T09:00:00Z', Negotiation: '2025-11-15T14:00:00Z', Won: '2026-01-31T11:00:00Z' }),
      },
      {
        Title: 'Clicks Group - M365 Tenant Assessment',
        ServiceName: 'M365 Tenant Assessment',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Clicks Group', ContactName: 'Nomsa Dlamini', ContactEmail: 'nomsa.dlamini@clicks.co.za', ContactPhone: '+27 21 460 1911',
        Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Won', InterestLevel: 'Hot',
        DealValue: 175000, DealProbability: 100, ExpectedCloseDate: '2025-12-15T00:00:00Z',
        Budget: 'R150K - R200K', Timeline: 'Q4 2025',
        ConfirmedDateTime: '2025-11-01T09:00:00Z',
        AssignedSpecialistName: 'Gulzar Ismail', AssignedSpecialistEmail: 'Gulzar.Ismail@firsttech.digital', AssignedSpecialistRole: 'Senior Consultant',
        Requirements: 'Full M365 tenant security and governance assessment. Review of Secure Score, DLP policies, compliance center configuration, and identity management across 800+ Clicks and Musica stores.',
        WinLossReason: 'Strong healthcare retail expertise and deep understanding of POPIA requirements. Fast turnaround commitment.',
        Comments: 'Assessment completed successfully. Led to further discussions about SPFx intranet enhancements.',
        NextSteps: 'Remediation tracking in progress. Follow-up assessment in 6 months.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2025-08-15T08:00:00Z', Qualified: '2025-08-18T11:00:00Z', Discovery: '2025-08-25T09:00:00Z', Proposal: '2025-09-15T10:00:00Z', Negotiation: '2025-10-10T14:00:00Z', Won: '2025-12-15T09:00:00Z' }),
      },
      // Lost Stage (2) - Opportunities that didn't convert
      {
        Title: 'Ackermans - SharePoint Migration',
        ServiceName: 'SharePoint Migration',
        AccountManagerName: 'Chris van Niekerk', AccountManagerEmail: 'chris@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Ackermans', ContactName: 'Riana Steyn', ContactEmail: 'riana.steyn@ackermans.co.za', ContactPhone: '+27 21 938 1000',
        Industry: 'Retail', CompanySize: 'Large (250-1000)',
        FunnelStage: 'Lost', InterestLevel: 'Cold',
        DealValue: 220000, DealProbability: 0, ExpectedCloseDate: '2025-09-30T00:00:00Z',
        Budget: 'R180K - R250K', Timeline: 'Q4 2025',
        Requirements: 'Migration of SharePoint 2013 intranet to SharePoint Online. 800GB of content across store operations and HR documents.',
        WinLossReason: 'Parent company (Pepkor/TFG) decided to consolidate migration across all brands with a single vendor. May revisit for brand-specific customisation.',
        Comments: 'Lost to group-wide consolidation decision. Ackermans IT team was satisfied with our proposal but decision was taken at holding company level.',
        NextSteps: 'Follow up in Q3 2026 to discuss brand-specific SharePoint customisation post-migration.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2025-05-10T08:00:00Z', Qualified: '2025-05-20T10:00:00Z', Discovery: '2025-06-05T14:00:00Z', Proposal: '2025-07-01T09:00:00Z', Negotiation: '2025-08-15T10:00:00Z', Lost: '2025-09-30T16:00:00Z' }),
      },
      {
        Title: 'Nedbank - Microsoft Viva Suite',
        ServiceName: 'Microsoft Viva Suite',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Nedbank', ContactName: 'Pieter van der Merwe', ContactEmail: 'pieter.vandermerwe@nedbank.co.za', ContactPhone: '+27 11 294 4444',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Lost', InterestLevel: 'Warm',
        DealValue: 350000, DealProbability: 0, ExpectedCloseDate: '2025-12-31T00:00:00Z',
        Budget: 'R300K - R400K', Timeline: 'Q4 2025',
        Requirements: 'Viva Connections and Viva Learning implementation for Nedbank retail and corporate banking staff. 12,000 employees in scope.',
        WinLossReason: 'Budget constraints - Nedbank reallocated digital workplace budget to core banking platform upgrade. Interest remains for 2026.',
        Comments: 'Nedbank still interested in Power Platform (separate active deal). Viva may be revisited once banking platform upgrade completes.',
        NextSteps: 'Maintain relationship through Power Platform engagement. Revisit Viva conversation in Q3 2026.',
        StageTimestamps_JSON: JSON.stringify({ Lead: '2025-07-01T09:00:00Z', Qualified: '2025-07-15T11:00:00Z', Discovery: '2025-08-10T10:00:00Z', Proposal: '2025-09-20T09:00:00Z', Lost: '2025-12-31T17:00:00Z' }),
      },
    ];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxServiceRequests');
      for (const request of seedData) {
        try {
          const filtered = this.filterFieldsForList(request, validColumns);
          await graphService.createListItem('DWxServiceRequests', filtered);
          results.push({ name: request.Title, success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: request.Title, success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    } catch (error) {
      results.push({ name: 'All', success: false, message: error instanceof Error ? error.message : 'Failed to seed service requests' });
    }

    return { results };
  }

  /**
   * Seed the DWxProductRequests list with 8 sample product requests across all statuses
   */
  async seedProductRequestsData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const seedData = [
      // Pending Review (2)
      {
        Title: 'Nedbank - Asset Dashboard Demo',
        ProductId: 'asset-dashboard', ProductName: 'Asset Dashboard', ProductType: 'App', ProductCategory: 'Operations & IT',
        RequestType: 'Demo',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital',
        ClientName: 'Nedbank', ContactName: 'Pieter van der Merwe', ContactEmail: 'pieter.vandermerwe@nedbank.co.za', ContactPhone: '+27 11 294 4444',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Pending Review',
        LicenseCount: 500, EstimatedValue: 85000,
        Comments: 'Interested in tracking IT assets across 50+ branches nationwide. Need to see integration with their existing ServiceNow CMDB.',
      },
      {
        Title: 'Discovery Health - Employee Directory Trial',
        ProductId: 'employee-directory', ProductName: 'Employee Directory', ProductType: 'App', ProductCategory: 'HR & People',
        RequestType: 'Trial Deployment',
        AccountManagerName: 'Wimpie Baard', AccountManagerEmail: 'wimpie.baard@firsttech.digital',
        ClientName: 'Discovery Health', ContactName: 'Nomsa Dlamini', ContactEmail: 'nomsa.dlamini@discovery.co.za', ContactPhone: '+27 11 529 2888',
        Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Pending Review',
        LicenseCount: 3000, EstimatedValue: 45000,
        Comments: 'Need employee directory with org chart for their 12,000+ employees across Discovery Health, Insure, and Invest divisions.',
      },
      // Awaiting Approval (2)
      {
        Title: 'MTN South Africa - Leave Request Card Demo',
        ProductId: 'leave-request-card', ProductName: 'Leave Request', ProductType: 'Adaptive Card', ProductCategory: 'HR & People',
        RequestType: 'Demo',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital',
        ClientName: 'MTN South Africa', ContactName: 'Thabo Mokoena', ContactEmail: 'thabo.mokoena@mtn.co.za', ContactPhone: '+27 83 180 0000',
        Industry: 'Technology', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Awaiting Approval',
        LicenseCount: 8000, EstimatedValue: 25000,
        AssignedSpecialistName: 'Sarah Mitchell', AssignedSpecialistEmail: 'sarah.mitchell@firsttech.digital', AssignedSpecialistRole: 'Demo Specialist',
        Comments: 'Want to replace their current leave management system with Teams-native adaptive cards for all employees.',
      },
      {
        Title: 'Standard Bank - Knowledge Base Trial',
        ProductId: 'knowledge-base', ProductName: 'Knowledge Base', ProductType: 'App', ProductCategory: 'Document & Content',
        RequestType: 'Trial Deployment',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital',
        ClientName: 'Standard Bank', ContactName: 'Lerato Khumalo', ContactEmail: 'lerato.khumalo@standardbank.co.za', ContactPhone: '+27 11 636 9111',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Awaiting Approval',
        LicenseCount: 2000, EstimatedValue: 120000,
        AssignedSpecialistName: 'Wimpie Baard', AssignedSpecialistEmail: 'wimpie.baard@firsttech.digital', AssignedSpecialistRole: 'Technical Specialist',
        Comments: 'Enterprise knowledge management solution for their wealth management and corporate banking divisions. Need to consolidate 5 existing wikis.',
      },
      // Confirmed (2)
      {
        Title: 'Sasol Limited - News Carousel Demo',
        ProductId: 'news-carousel', ProductName: 'News Carousel', ProductType: 'Web Part', ProductCategory: 'Intranet',
        RequestType: 'Demo',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital',
        ClientName: 'Sasol Limited', ContactName: 'Johan Botha', ContactEmail: 'johan.botha@sasol.com', ContactPhone: '+27 10 344 5000',
        Industry: 'Manufacturing', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Confirmed',
        LicenseCount: 1500, EstimatedValue: 55000,
        ConfirmedDateTime: '2026-03-20T10:00:00Z',
        AssignedSpecialistName: 'Gulzar Ismail', AssignedSpecialistEmail: 'Gulzar.Ismail@firsttech.digital', AssignedSpecialistRole: 'Consultant',
        Comments: 'Demo confirmed for March 20. Sasol wants to modernise their intranet homepage with dynamic news from multiple SharePoint sites.',
      },
      {
        Title: 'Old Mutual - Org Chart Web Part Demo',
        ProductId: 'org-chart-webpart', ProductName: 'Org Chart Web Part', ProductType: 'Web Part', ProductCategory: 'HR & People',
        RequestType: 'Demo',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital',
        ClientName: 'Old Mutual', ContactName: 'David Tshabalala', ContactEmail: 'david.tshabalala@oldmutual.co.za', ContactPhone: '+27 21 509 9111',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Confirmed',
        LicenseCount: 5000, EstimatedValue: 95000,
        ConfirmedDateTime: '2026-03-22T14:00:00Z',
        AssignedSpecialistName: 'Gary Finberg', AssignedSpecialistEmail: 'gary@firsttech.digital', AssignedSpecialistRole: 'Solution Architect',
        Comments: 'Demo confirmed for March 22. Old Mutual needs interactive org chart web part that integrates with Azure AD and shows reporting lines across their subsidiaries.',
      },
      // Completed (1)
      {
        Title: 'Woolworths Holdings - Contract Manager Trial',
        ProductId: 'contract-manager', ProductName: 'Contract Manager', ProductType: 'App', ProductCategory: 'Document & Content',
        RequestType: 'Trial Deployment',
        AccountManagerName: 'Chris van Niekerk', AccountManagerEmail: 'chris@firsttech.digital',
        ClientName: 'Woolworths Holdings', ContactName: 'Anita Naidoo', ContactEmail: 'anita.naidoo@woolworths.co.za', ContactPhone: '+27 21 407 9111',
        Industry: 'Retail', CompanySize: 'Large (250-1000)', IsPremiumClient: false,
        Status: 'Completed',
        LicenseCount: 200, EstimatedValue: 110000,
        ConfirmedDateTime: '2026-01-15T09:00:00Z',
        AssignedSpecialistName: 'Chris van Niekerk', AssignedSpecialistEmail: 'chris@firsttech.digital', AssignedSpecialistRole: 'Consultant',
        Outcome: 'Client signed annual license agreement for 200 users across legal and procurement departments.',
        Comments: 'Successful trial - Woolworths legal team confirmed the Contract Manager meets their supplier agreement management needs.',
        NextSteps: 'Full deployment scheduled for March 2026. Training sessions for legal and procurement teams.',
      },
      // Cancelled (1)
      {
        Title: 'Pick n Pay - Approval Card Demo',
        ProductId: 'approval-card', ProductName: 'Approval Card', ProductType: 'Adaptive Card', ProductCategory: 'Workflows',
        RequestType: 'Demo',
        AccountManagerName: 'Wimpie Baard', AccountManagerEmail: 'wimpie.baard@firsttech.digital',
        ClientName: 'Pick n Pay', ContactName: 'Rajan Govender', ContactEmail: 'rajan.govender@pnp.co.za', ContactPhone: '+27 21 658 1000',
        Industry: 'Retail', CompanySize: 'Large (250-1000)', IsPremiumClient: false,
        Status: 'Cancelled',
        LicenseCount: 500, EstimatedValue: 15000,
        Comments: 'Budget reallocated to other priorities following their migration project decision. May revisit in Q4 2026.',
      },
      // Additional product requests for new SA clients
      {
        Title: 'Clicks Group - Employee Directory Trial',
        ProductId: 'employee-directory', ProductName: 'Employee Directory', ProductType: 'App', ProductCategory: 'HR & People',
        RequestType: 'Trial Deployment',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital',
        ClientName: 'Clicks Group', ContactName: 'Nomsa Dlamini', ContactEmail: 'nomsa.dlamini@clicks.co.za', ContactPhone: '+27 21 460 1911',
        Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Pending Review',
        LicenseCount: 2500, EstimatedValue: 40000,
        Comments: 'Need employee directory with org chart for their 8,000+ staff across Clicks, Musica, and The Body Shop divisions.',
      },
      {
        Title: 'SPAR Group - Leave Request Card Demo',
        ProductId: 'leave-request-card', ProductName: 'Leave Request', ProductType: 'Adaptive Card', ProductCategory: 'HR & People',
        RequestType: 'Demo',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital',
        ClientName: 'SPAR Group', ContactName: 'Derek van Niekerk', ContactEmail: 'derek.vanniekerk@spar.co.za', ContactPhone: '+27 31 719 1900',
        Industry: 'Retail', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Awaiting Approval',
        LicenseCount: 5000, EstimatedValue: 30000,
        AssignedSpecialistName: 'Chris van Niekerk', AssignedSpecialistEmail: 'chris@firsttech.digital', AssignedSpecialistRole: 'Consultant',
        Comments: 'Leave management via Teams adaptive cards for SPAR distribution centre and regional office staff across KZN.',
      },
      {
        Title: 'ABSA Group - Contract Manager Trial',
        ProductId: 'contract-manager', ProductName: 'Contract Manager', ProductType: 'App', ProductCategory: 'Document & Content',
        RequestType: 'Trial Deployment',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital',
        ClientName: 'ABSA Group', ContactName: 'Lerato Khumalo', ContactEmail: 'lerato.khumalo@absa.co.za', ContactPhone: '+27 11 350 4000',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Confirmed',
        LicenseCount: 1500, EstimatedValue: 95000,
        ConfirmedDateTime: '2026-03-25T11:00:00Z',
        AssignedSpecialistName: 'Gary Finberg', AssignedSpecialistEmail: 'gary@firsttech.digital', AssignedSpecialistRole: 'Solution Architect',
        Comments: 'Contract lifecycle management for their legal and procurement departments across corporate and retail banking divisions.',
      },
      {
        Title: 'OUTsurance - Approval Card Demo',
        ProductId: 'approval-card', ProductName: 'Approval Card', ProductType: 'Adaptive Card', ProductCategory: 'Workflows',
        RequestType: 'Demo',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital',
        ClientName: 'OUTsurance', ContactName: 'Marelize Joubert', ContactEmail: 'marelize.joubert@outsurance.co.za', ContactPhone: '+27 10 753 2430',
        Industry: 'Finance', CompanySize: 'Large (250-1000)', IsPremiumClient: false,
        Status: 'Pending Review',
        LicenseCount: 800, EstimatedValue: 18000,
        Comments: 'Multi-stage approval workflows for claims processing and underwriting decisions via Teams adaptive cards.',
      },
      {
        Title: 'Sanlam - Survey Management Trial',
        ProductId: 'survey-management', ProductName: 'Survey Management', ProductType: 'App', ProductCategory: 'Learning & Engagement',
        RequestType: 'Trial Deployment',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital',
        ClientName: 'Sanlam', ContactName: 'Liezel du Plessis', ContactEmail: 'liezel.duplessis@sanlam.co.za', ContactPhone: '+27 21 947 9111',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremiumClient: true,
        Status: 'Completed',
        LicenseCount: 4000, EstimatedValue: 55000,
        ConfirmedDateTime: '2026-01-20T09:00:00Z',
        AssignedSpecialistName: 'Gulzar Ismail', AssignedSpecialistEmail: 'Gulzar.Ismail@firsttech.digital', AssignedSpecialistRole: 'Consultant',
        Outcome: 'Sanlam signed for 4,000 licences to run quarterly pulse surveys across all business units.',
        Comments: 'Employee feedback platform for quarterly engagement surveys across Sanlam Life, Investments, and Corporate divisions.',
        NextSteps: 'Full rollout for Q2 2026 pulse survey. Training sessions for HR team leaders in March.',
      },
    ];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxProductRequests');
      for (const request of seedData) {
        try {
          const filtered = this.filterFieldsForList(request, validColumns);
          await graphService.createListItem('DWxProductRequests', filtered);
          results.push({ name: request.Title, success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: request.Title, success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    } catch (error) {
      results.push({ name: 'All', success: false, message: error instanceof Error ? error.message : 'Failed to seed product requests' });
    }

    return { results };
  }

  /**
   * Seed the DWxSessionPrep list with 3 session preparation records (one per status)
   */
  async seedSessionPrepData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    try {
      const graphService = getGraphService();
      const validColumns = await this.getListColumnNames('DWxSessionPrep');

      // Find Discovery-stage service requests to link session prep records
      const serviceRequests = await graphService.getListItems('DWxServiceRequests') as Array<{ id: string; fields?: { FunnelStage?: string; ClientName?: string } }>;
      const discoveryRequests = serviceRequests.filter(
        (r) => r.fields?.FunnelStage === 'Discovery'
      );

      // Session Prep #1: Nedbank Discovery - Ready (fully prepared)
      const nedbankReq = discoveryRequests.find(
        (r) => r.fields?.ClientName === 'Nedbank'
      );
      if (nedbankReq) {
        try {
          await graphService.createListItem('DWxSessionPrep', this.filterFieldsForList({
            Title: 'Prep - Nedbank - 2026-03-15',
            ServiceRequestId: parseInt(nedbankReq.id),
            SpecialistEmail: 'gary@firsttech.digital',
            SpecialistName: 'Gary Finberg',
            Status: 'Ready',
            ClientProfile_JSON: JSON.stringify({
              companyOverview: 'Nedbank is one of South Africa\'s "Big Four" banking groups, headquartered in Johannesburg. With over 200 branches and 30,000 employees, they serve 7.8 million clients across personal, business, corporate, and wealth management segments. Their "Old Mutual Two Degrees" partnership focuses on shared-value banking.',
              industry: 'Finance',
              companySize: 'Enterprise',
              keyStakeholders: ['Pieter van der Merwe (IT Director, Branch Technology)', 'Zanele Mthembu (CTO)', 'Busi Mavuso (Head of Digital Channels)'],
              previousEngagements: [{ id: 1, serviceName: 'M365 Tenant Assessment', outcome: 'Won', date: '2025-11-01', value: 175000, notes: 'Comprehensive security and governance review - all recommendations accepted' }],
              recentNews: ['Nedbank reported 12% growth in headline earnings for H2 2025', 'Announced R2.5B investment in digital banking platform modernisation', 'Launched new digital onboarding process for retail clients'],
              potentialPainPoints: ['200+ branches still using paper-based customer onboarding forms', 'No centralised view of branch operations performance', 'Manual compliance checking processes for FICA and FAIS regulations', 'Integration gap between Power Platform and core banking APIs'],
              competitorContext: 'Accenture and Deloitte have existing relationships with Nedbank corporate IT. Local firms like BBD and Entelect focus on custom development. Our advantage is M365 platform depth and recent successful assessment.',
              generatedAt: '2026-02-01T10:00:00Z',
            }),
            TalkingPoints_JSON: JSON.stringify([
              { id: 'tp-1', category: 'opening', content: 'Reference the successful M365 Tenant Assessment and the positive feedback from Zanele on our compliance recommendations', isCustom: false, order: 1 },
              { id: 'tp-2', category: 'opening', content: 'Congratulate them on the strong H2 2025 earnings and the digital transformation commitment', isCustom: false, order: 2 },
              { id: 'tp-3', category: 'discovery', content: 'Which branch operations are currently most paper-intensive and causing the biggest compliance risks?', isCustom: false, order: 3 },
              { id: 'tp-4', category: 'discovery', content: 'How are branch managers currently tracking performance metrics? What visibility does head office have?', isCustom: false, order: 4 },
              { id: 'tp-5', category: 'discovery', content: 'What existing systems need to integrate with the Power Platform solution (core banking, CRM, compliance)?', isCustom: false, order: 5 },
              { id: 'tp-6', category: 'value_prop', content: 'Rapid prototyping: we can deliver a working app for one branch process within 4 weeks, with full rollout in 3 months', isCustom: false, order: 6 },
              { id: 'tp-7', category: 'value_prop', content: 'Power Platform governance and security meets banking compliance requirements (POPIA, SARB, FAIS) - we validated this in the assessment', isCustom: false, order: 7 },
              { id: 'tp-8', category: 'objection', content: 'Security concern: Power Platform inherits Azure AD security, sensitivity labels, and DLP policies we already configured in the assessment', isCustom: false, order: 8 },
              { id: 'tp-9', category: 'objection', content: 'Scalability: Power Apps can handle the 200+ branch load with proper architecture - we\'ll demonstrate with load testing', isCustom: false, order: 9 },
              { id: 'tp-10', category: 'closing', content: 'Propose a 2-week pilot for one branch process (e.g., customer onboarding) to prove the concept before full engagement', isCustom: false, order: 10 },
            ]),
            SuggestedResources_JSON: JSON.stringify([
              { id: 'sr-1', name: 'Banking Power Platform Case Study - Absa', type: 'case_study', url: '/resources/banking-pp-case-study.pdf', relevanceScore: 95, reason: 'SA banking Power Platform success story with similar branch digitisation scope', selected: true },
              { id: 'sr-2', name: 'Power Platform Security & Compliance Datasheet', type: 'datasheet', url: '/resources/pp-security-compliance.pdf', relevanceScore: 90, reason: 'Addresses POPIA and financial services regulatory compliance', selected: true },
              { id: 'sr-3', name: 'Branch Operations Demo Script', type: 'demo_script', url: '/resources/branch-ops-demo.pdf', relevanceScore: 85, reason: 'Step-by-step demo showing customer onboarding app prototype', selected: true },
              { id: 'sr-4', name: 'Power Platform ROI Calculator', type: 'datasheet', url: '/resources/pp-roi-calculator.xlsx', relevanceScore: 80, reason: 'Customisable ROI model for branch digitisation initiatives', selected: false },
              { id: 'sr-5', name: 'Digital Workplace Credentials Deck', type: 'slide_deck', url: '/resources/dw-credentials-2026.pptx', relevanceScore: 70, reason: 'Company credentials and client references', selected: false },
            ]),
            MeetingAgenda_JSON: JSON.stringify({
              totalDuration: 120,
              items: [
                { id: 'a-1', title: 'Welcome & Relationship Recap', duration: 10, description: 'Review M365 Assessment outcomes and acknowledge Nedbank\'s digital transformation journey', order: 1 },
                { id: 'a-2', title: 'Current State Discovery', duration: 25, description: 'Understand branch operations pain points, paper-based processes, and compliance challenges', order: 2 },
                { id: 'a-3', title: 'Live Power Platform Demo', duration: 30, description: 'Demonstrate customer onboarding app prototype and branch performance dashboard', order: 3 },
                { id: 'a-4', title: 'Technical Architecture Discussion', duration: 20, description: 'Propose integration approach with core banking APIs and Azure AD authentication', order: 4 },
                { id: 'a-5', title: 'Security & Compliance Review', duration: 15, description: 'Show how Power Platform governance aligns with SARB and POPIA requirements', order: 5 },
                { id: 'a-6', title: 'Commercial & Next Steps', duration: 20, description: 'Discuss budget alignment, pilot scope for one branch process, and project timeline', order: 6 },
              ],
              generatedAt: '2026-02-01T10:00:00Z',
            }),
            ChecklistItems_JSON: JSON.stringify([
              { id: 'ck-1', category: 'research', label: 'Review company background and industry', completed: true, completedAt: '2026-02-02T09:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-2', category: 'research', label: 'Identify key stakeholders and decision makers', completed: true, completedAt: '2026-02-02T09:30:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-3', category: 'research', label: 'Review previous engagement history', completed: true, completedAt: '2026-02-02T10:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-4', category: 'research', label: 'Research recent company news and developments', completed: true, completedAt: '2026-02-02T11:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-5', category: 'technical', label: 'Confirm technical prerequisites with client', completed: true, completedAt: '2026-02-03T09:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-6', category: 'technical', label: 'Prepare demo environment', completed: true, completedAt: '2026-02-03T14:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-7', category: 'technical', label: 'Test all demo scenarios', completed: true, completedAt: '2026-02-03T16:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-8', category: 'resources', label: 'Select appropriate slide deck', completed: true, completedAt: '2026-02-04T08:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-9', category: 'resources', label: 'Prepare relevant case studies', completed: true, completedAt: '2026-02-04T08:30:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-10', category: 'resources', label: 'Gather pricing/proposal materials', completed: true, completedAt: '2026-02-04T09:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-11', category: 'logistics', label: 'Confirm meeting time with all attendees', completed: true, completedAt: '2026-02-04T10:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-12', category: 'logistics', label: 'Test meeting link and audio/video', completed: true, completedAt: '2026-02-04T11:00:00Z', completedBy: 'gary@firsttech.digital' },
              { id: 'ck-13', category: 'logistics', label: 'Prepare recording consent if needed', completed: true, completedAt: '2026-02-04T11:30:00Z', completedBy: 'gary@firsttech.digital' },
            ]),
            AIGeneratedAt: '2026-02-01T10:00:00Z',
            CompletedAt: '2026-02-04T12:00:00Z',
            ReminderSent: true,
          }, validColumns));
          results.push({ name: 'Nedbank - Ready', success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: 'Nedbank - Ready', success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      } else {
        results.push({ name: 'Nedbank - Ready', success: false, message: 'Could not find Nedbank Discovery service request to link' });
      }

      // Session Prep #2: Discovery Health SPFx - In Progress (partial checklist)
      const discoveryHealthReq = discoveryRequests.find(
        (r) => r.fields?.ClientName === 'Discovery Health'
      );
      if (discoveryHealthReq) {
        try {
          await graphService.createListItem('DWxSessionPrep', this.filterFieldsForList({
            Title: 'Prep - Discovery Health - 2026-03-18',
            ServiceRequestId: parseInt(discoveryHealthReq.id),
            SpecialistEmail: 'wimpie.baard@firsttech.digital',
            SpecialistName: 'Wimpie Baard',
            Status: 'In Progress',
            ClientProfile_JSON: JSON.stringify({
              companyOverview: 'Discovery Health is South Africa\'s largest private health insurer and a pioneer in shared-value insurance. Part of Discovery Limited, they cover over 3.7 million lives and operate the Vitality wellness programme used by 30+ global partners.',
              industry: 'Healthcare',
              companySize: 'Enterprise',
              keyStakeholders: ['Nomsa Dlamini (IT Manager, Digital Platforms)', 'Rethabile Molefe (Head of Employee Experience)', 'Dr. Jonathan Broomberg (CEO, Discovery Health)'],
              previousEngagements: [{ id: 1, serviceName: 'Power Platform Development', outcome: 'Won', date: '2025-06-01', value: 280000, notes: 'Power BI dashboards for claims analytics' }],
              recentNews: ['Discovery Vitality expanded to 40th global partner', 'Launched AI-driven claims processing for faster turnaround', 'Named Best Employer in Healthcare by Top Employer Institute 2025'],
              potentialPainPoints: ['Outdated SharePoint 2016 intranet for 12,000+ employees', 'No integration between Vitality wellness data and employee intranet', 'Multiple disconnected employee portals across divisions', 'Need real-time wellness dashboard for HR and line managers'],
              competitorContext: 'Microsoft partner ecosystem is strong - Avanade has existing relationship. Our SPFx expertise and Vitality API integration experience is a differentiator.',
              generatedAt: '2026-02-05T14:00:00Z',
            }),
            TalkingPoints_JSON: JSON.stringify([
              { id: 'tp-1', category: 'opening', content: 'Reference the successful Power BI claims analytics project and how it transformed their reporting', isCustom: false, order: 1 },
              { id: 'tp-2', category: 'discovery', content: 'What employee engagement metrics are you currently tracking, and where do gaps exist?', isCustom: false, order: 2 },
              { id: 'tp-3', category: 'value_prop', content: 'SPFx web parts can surface Vitality wellness data directly in SharePoint, creating a single pane of glass for employee wellbeing', isCustom: false, order: 3 },
              { id: 'tp-4', category: 'objection', content: 'API security: SPFx uses Azure AD app registrations with scoped permissions - no direct credential sharing with Vitality APIs', isCustom: false, order: 4 },
              { id: 'tp-5', category: 'closing', content: 'Propose building one web part (wellness dashboard) as a proof of concept within 3 weeks', isCustom: false, order: 5 },
            ]),
            SuggestedResources_JSON: JSON.stringify([
              { id: 'sr-1', name: 'SPFx Healthcare Integration Case Study', type: 'case_study', url: '/resources/spfx-healthcare-case-study.pdf', relevanceScore: 92, reason: 'Healthcare SPFx project with external API integration', selected: true },
              { id: 'sr-2', name: 'SPFx Demo - Interactive Dashboard Web Part', type: 'demo_script', url: '/resources/spfx-dashboard-demo.pdf', relevanceScore: 88, reason: 'Shows real-time data integration in SharePoint', selected: false },
            ]),
            MeetingAgenda_JSON: JSON.stringify({
              totalDuration: 120,
              items: [
                { id: 'a-1', title: 'Introduction & Context', duration: 10, description: 'Recap previous engagement and establish meeting objectives', order: 1 },
                { id: 'a-2', title: 'Current Intranet Assessment', duration: 20, description: 'Review existing SharePoint environment and pain points', order: 2 },
                { id: 'a-3', title: 'SPFx Web Part Demonstration', duration: 35, description: 'Show wellness dashboard web part prototype with mock Vitality data', order: 3 },
                { id: 'a-4', title: 'Technical Deep Dive', duration: 25, description: 'Discuss Vitality API integration, authentication, and data flow', order: 4 },
                { id: 'a-5', title: 'Next Steps & Timeline', duration: 30, description: 'Agree on POC scope, timeline, and success criteria', order: 5 },
              ],
              generatedAt: '2026-02-05T14:00:00Z',
            }),
            ChecklistItems_JSON: JSON.stringify([
              { id: 'ck-1', category: 'research', label: 'Review company background and industry', completed: true, completedAt: '2026-02-06T09:00:00Z', completedBy: 'wimpie.baard@firsttech.digital' },
              { id: 'ck-2', category: 'research', label: 'Identify key stakeholders and decision makers', completed: true, completedAt: '2026-02-06T09:30:00Z', completedBy: 'wimpie.baard@firsttech.digital' },
              { id: 'ck-3', category: 'research', label: 'Review previous engagement history', completed: true, completedAt: '2026-02-06T10:00:00Z', completedBy: 'wimpie.baard@firsttech.digital' },
              { id: 'ck-4', category: 'research', label: 'Research recent company news and developments', completed: false },
              { id: 'ck-5', category: 'technical', label: 'Confirm technical prerequisites with client', completed: false },
              { id: 'ck-6', category: 'technical', label: 'Prepare demo environment', completed: false },
              { id: 'ck-7', category: 'technical', label: 'Test all demo scenarios', completed: false },
              { id: 'ck-8', category: 'resources', label: 'Select appropriate slide deck', completed: false },
              { id: 'ck-9', category: 'resources', label: 'Prepare relevant case studies', completed: true, completedAt: '2026-02-06T11:00:00Z', completedBy: 'wimpie.baard@firsttech.digital' },
              { id: 'ck-10', category: 'resources', label: 'Gather pricing/proposal materials', completed: false },
              { id: 'ck-11', category: 'logistics', label: 'Confirm meeting time with all attendees', completed: true, completedAt: '2026-02-06T08:00:00Z', completedBy: 'wimpie.baard@firsttech.digital' },
              { id: 'ck-12', category: 'logistics', label: 'Test meeting link and audio/video', completed: false },
              { id: 'ck-13', category: 'logistics', label: 'Prepare recording consent if needed', completed: false },
            ]),
            AIGeneratedAt: '2026-02-05T14:00:00Z',
            ReminderSent: false,
          }, validColumns));
          results.push({ name: 'Discovery Health - In Progress', success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: 'Discovery Health - In Progress', success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      } else {
        results.push({ name: 'Discovery Health - In Progress', success: false, message: 'Could not find Discovery Health Discovery service request to link' });
      }

      // Session Prep #3: Placeholder Not Started record (for a future Qualified→Discovery transition)
      // Link to any existing service request or use a placeholder
      const qualifiedRequests = serviceRequests.filter(
        (r) => r.fields?.FunnelStage === 'Qualified'
      );
      const mtnReq = qualifiedRequests.find(
        (r) => r.fields?.ClientName === 'MTN South Africa'
      );
      if (mtnReq) {
        try {
          await graphService.createListItem('DWxSessionPrep', this.filterFieldsForList({
            Title: 'Prep - MTN South Africa - Pending',
            ServiceRequestId: parseInt(mtnReq.id),
            SpecialistEmail: 'gary@firsttech.digital',
            SpecialistName: 'Gary Finberg',
            Status: 'Not Started',
            ChecklistItems_JSON: JSON.stringify([
              { id: 'ck-1', category: 'research', label: 'Review company background and industry', completed: false },
              { id: 'ck-2', category: 'research', label: 'Identify key stakeholders and decision makers', completed: false },
              { id: 'ck-3', category: 'research', label: 'Review previous engagement history', completed: false },
              { id: 'ck-4', category: 'research', label: 'Research recent company news and developments', completed: false },
              { id: 'ck-5', category: 'technical', label: 'Confirm technical prerequisites with client', completed: false },
              { id: 'ck-6', category: 'technical', label: 'Prepare demo environment', completed: false },
              { id: 'ck-7', category: 'technical', label: 'Test all demo scenarios', completed: false },
              { id: 'ck-8', category: 'resources', label: 'Select appropriate slide deck', completed: false },
              { id: 'ck-9', category: 'resources', label: 'Prepare relevant case studies', completed: false },
              { id: 'ck-10', category: 'resources', label: 'Gather pricing/proposal materials', completed: false },
              { id: 'ck-11', category: 'logistics', label: 'Confirm meeting time with all attendees', completed: false },
              { id: 'ck-12', category: 'logistics', label: 'Test meeting link and audio/video', completed: false },
              { id: 'ck-13', category: 'logistics', label: 'Prepare recording consent if needed', completed: false },
            ]),
            ReminderSent: false,
          }, validColumns));
          results.push({ name: 'MTN South Africa - Not Started', success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: 'MTN South Africa - Not Started', success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      } else {
        results.push({ name: 'MTN South Africa - Not Started', success: false, message: 'Could not find MTN Qualified service request to link' });
      }
    } catch (error) {
      results.push({ name: 'All', success: false, message: error instanceof Error ? error.message : 'Failed to seed session prep' });
    }

    return { results };
  }

  /**
   * Seed Knowledge Base with comprehensive FAQ, Glossary, and Article content for Account Managers
   */
  async seedKnowledgeBaseData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];
    const graphService = getGraphService();
    const validColumns = await this.getListColumnNames('DWxKnowledgeBase');

    const entries: Array<{
      Title: string;
      Content: string;
      Type: string;
      Category: string;
      Tags_JSON: string;
      SortOrder: number;
      IsActive: boolean;
    }> = [
      // ═══════════════════════════════════════════════════════════════════════
      // FAQs (20 entries)
      // ═══════════════════════════════════════════════════════════════════════

      // --- General FAQs ---
      {
        Title: 'What is the DWx Traffic Manager?',
        Content: 'The DWx Traffic Manager is Digital Workplace\'s internal pre-sales coordination platform. It manages the full sales lifecycle from initial lead through to closed deal. Account Managers use it to submit service requests, schedule discovery sessions with technical specialists, track deal progression through the sales funnel, and collaborate with the pre-sales team. The system integrates with Microsoft Teams, Outlook calendars, and SharePoint for seamless workflow.',
        Type: 'FAQ', Category: 'General',
        Tags_JSON: JSON.stringify(['getting-started', 'overview', 'platform']),
        SortOrder: 1, IsActive: true,
      },
      {
        Title: 'How do I submit a new service request?',
        Content: 'Navigate to "New Request" in the top navigation bar or click "Submit a New Request" on the landing page. The 5-step wizard guides you through: (1) Select the service category, (2) Enter client details or select an existing client, (3) Describe requirements and upload supporting documents like RFPs, (4) Propose up to 3 time slots for the discovery session, and (5) Review and submit. You\'ll receive an email confirmation immediately, and a manager will review and assign a specialist within 24 hours.',
        Type: 'FAQ', Category: 'Process',
        Tags_JSON: JSON.stringify(['request', 'wizard', 'how-to', 'submission']),
        SortOrder: 2, IsActive: true,
      },
      {
        Title: 'What happens after I submit a request?',
        Content: 'Your request enters the sales funnel at the "Lead" stage. Here\'s the typical flow:\n\n1. **Lead**: Your request is received. A manager reviews it within 24 hours.\n2. **Qualified**: The manager validates the opportunity and assigns a technical specialist.\n3. **Discovery**: A discovery meeting is scheduled with the client. Calendar invites with Teams links are sent automatically.\n4. **Proposal**: After the discovery session, the specialist prepares a formal proposal with pricing.\n5. **Negotiation**: The proposal is sent to the client for review.\n6. **Won/Lost**: The deal closes. Won deals update the client\'s lifetime value automatically.\n\nYou\'ll receive email notifications at each stage transition.',
        Type: 'FAQ', Category: 'Process',
        Tags_JSON: JSON.stringify(['funnel', 'stages', 'workflow', 'lifecycle']),
        SortOrder: 3, IsActive: true,
      },
      {
        Title: 'How do I track my existing requests?',
        Content: 'Click "My Requests" in the top navigation bar. This view shows all your service requests and product requests in separate tabs. You can:\n\n- **Filter by stage**: Use the stage pills (Lead, Qualified, Discovery, etc.) to see requests at specific funnel stages.\n- **Search**: Type a client name, service, or keyword in the search bar.\n- **View details**: Click any request card to open the full detail view with timeline, documents, and action buttons.\n- **Quick actions**: Use the three-dot menu on each card for common actions like advancing the stage.\n\nManagers also have access to the Pipeline Dashboard for a bird\'s-eye view of all active deals.',
        Type: 'FAQ', Category: 'Process',
        Tags_JSON: JSON.stringify(['tracking', 'my-requests', 'filter', 'search']),
        SortOrder: 4, IsActive: true,
      },
      {
        Title: 'What\'s the difference between a Service Request and a Product Request?',
        Content: 'A **Service Request** is for professional consulting engagements — things like Power Platform development, SharePoint migrations, M365 assessments, or Copilot agent builds. These go through the full 7-stage sales funnel (Lead → Won) and involve specialist assignment, discovery meetings, and proposals.\n\nA **Product Request** is for one of our 29 ready-made DWx products (15 apps, 8 web parts, 6 adaptive cards). These follow a simpler 5-status workflow: Pending Review → Awaiting Approval → Confirmed → Completed. Product requests are typically for demos, trials, or deployments of existing products rather than custom development.',
        Type: 'FAQ', Category: 'General',
        Tags_JSON: JSON.stringify(['service-request', 'product-request', 'difference']),
        SortOrder: 5, IsActive: true,
      },

      // --- Services FAQs ---
      {
        Title: 'What services does Digital Workplace offer?',
        Content: 'Digital Workplace offers six core service categories:\n\n1. **Power Platform Development** (Medium complexity) — Custom Power Apps, Power Automate flows, Power BI dashboards, and Power Virtual Agents. Ideal for business process automation and rapid application development.\n\n2. **SPFx Development** (High complexity) — SharePoint Framework web parts, extensions, and Teams apps. For organisations needing custom intranet experiences and Teams integrations.\n\n3. **SharePoint Migration** (High complexity) — On-premises to SharePoint Online migrations, including content, permissions, and workflows. Supports hybrid scenarios.\n\n4. **M365 Tenant Assessment** (Medium complexity) — Security, compliance, and governance reviews. Includes Microsoft Secure Score analysis, DLP policy review, and best-practice recommendations.\n\n5. **Enterprise Copilot Agents** (Enterprise complexity) — Custom Microsoft 365 Copilot plugins and autonomous agents for enterprise knowledge management and workflow automation.\n\n6. **Microsoft Viva Suite** (Medium complexity) — Viva Connections, Engage, Learning, Insights, and Goals implementations for employee experience platforms.',
        Type: 'FAQ', Category: 'Services',
        Tags_JSON: JSON.stringify(['services', 'catalog', 'categories', 'offerings']),
        SortOrder: 10, IsActive: true,
      },
      {
        Title: 'How should I position Power Platform vs SPFx to clients?',
        Content: 'This is one of the most common questions from AMs. Here\'s the decision framework:\n\n**Choose Power Platform when:**\n- The client needs rapid prototyping (days/weeks, not months)\n- Business users need to maintain and extend the solution themselves\n- The solution involves forms, approvals, workflows, or dashboards\n- Budget is constrained (lower development cost, citizen developer model)\n- The client wants iterative delivery with quick wins\n\n**Choose SPFx when:**\n- The client needs a highly customised intranet or portal experience\n- The solution must integrate deeply with SharePoint pages and sites\n- Complex UI requirements beyond what Power Apps canvas offers\n- The client has strict branding requirements for their intranet\n- Teams app with complex tab experiences is needed\n\n**Hybrid approach** (often the best answer):\n- SPFx for the intranet/Teams UI layer\n- Power Automate for backend workflows and integrations\n- Power BI embedded in SPFx web parts for analytics\n\nWhen in doubt, suggest a Discovery session — the specialist will recommend the right approach.',
        Type: 'FAQ', Category: 'Services',
        Tags_JSON: JSON.stringify(['power-platform', 'spfx', 'positioning', 'decision-framework']),
        SortOrder: 11, IsActive: true,
      },
      {
        Title: 'What is a typical engagement timeline?',
        Content: 'Timelines vary by service complexity:\n\n| Service | Discovery | Proposal | Delivery |\n|---------|-----------|----------|----------|\n| Power Platform | 1 session (1-2 hrs) | 3-5 days | 4-12 weeks |\n| SPFx Development | 1-2 sessions | 5-10 days | 8-20 weeks |\n| SharePoint Migration | 2-3 sessions + assessment | 10-15 days | 12-24 weeks |\n| M365 Assessment | 1 session + data collection | 5-7 days | 2-4 weeks |\n| Copilot Agents | 2-3 sessions | 7-14 days | 8-16 weeks |\n| Viva Suite | 1-2 sessions | 5-7 days | 6-12 weeks |\n\n**Tips for setting client expectations:**\n- Always add 20% buffer for client-side delays (approvals, access provisioning, stakeholder availability)\n- Migration projects depend heavily on content volume — get a site inventory early\n- Enterprise Copilot projects require Copilot licensing verification before proposal',
        Type: 'FAQ', Category: 'Services',
        Tags_JSON: JSON.stringify(['timeline', 'delivery', 'planning', 'expectations']),
        SortOrder: 12, IsActive: true,
      },

      // --- Commercial FAQs ---
      {
        Title: 'How are deal values estimated?',
        Content: 'Deal values should be estimated using the following guidelines:\n\n**Hourly rates** (standard, before discounts):\n- Solution Architect: R1,800/hr\n- Senior Developer: R1,500/hr\n- Consultant: R1,200/hr\n- Project Manager: R1,100/hr\n\n**Fixed-price packages** (starting from):\n- Power App (single app): R80,000 - R250,000\n- Power Platform suite: R200,000 - R750,000\n- SPFx web part: R60,000 - R180,000\n- SharePoint migration (per TB): R150,000 - R400,000\n- M365 Assessment: R120,000 - R200,000\n- Copilot Agent: R250,000 - R800,000\n- Viva implementation: R180,000 - R500,000\n\n**Probability guidelines:**\n- Lead stage: 10-20%\n- Qualified: 25-40%\n- Discovery completed: 40-60%\n- Proposal sent: 50-70%\n- Negotiation: 70-90%\n\nThe system automatically calculates Weighted Pipeline = Deal Value × Probability.',
        Type: 'FAQ', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['pricing', 'deal-value', 'rates', 'estimation']),
        SortOrder: 20, IsActive: true,
      },
      {
        Title: 'What discount authority do Account Managers have?',
        Content: 'Discount authority is tiered:\n\n| Discount Level | Authority | Approval Required |\n|----------------|-----------|-------------------|\n| 0-10% | Account Manager | Self-approved |\n| 11-20% | Regional Manager | Written approval |\n| 21-30% | Head of Sales | Business case required |\n| 30%+ | MD/CEO | Exceptional approval |\n\n**When discounting is appropriate:**\n- Strategic accounts with multi-year potential\n- Bundled engagements (3+ services)\n- Reference client agreements (client allows case study)\n- Competitive displacement situations\n\n**Never discount:**\n- First engagement with a new client (sets wrong precedent)\n- Without understanding the client\'s budget first\n- Under time pressure without proper approval\n\nAlways document the business justification in the deal\'s Comments field.',
        Type: 'FAQ', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['discount', 'pricing', 'authority', 'approval']),
        SortOrder: 21, IsActive: true,
      },
      {
        Title: 'How does the Weighted Pipeline calculation work?',
        Content: 'The Weighted Pipeline is a key metric used to forecast revenue. It\'s calculated as:\n\n**Weighted Pipeline = Deal Value × Deal Probability ÷ 100**\n\nFor example:\n- R500,000 deal at Discovery (50% probability) = R250,000 weighted\n- R200,000 deal at Negotiation (80% probability) = R160,000 weighted\n- R1,000,000 deal at Lead (15% probability) = R150,000 weighted\n\nThe system automatically recalculates when you update either Deal Value or Probability in the request details. Managers use the total Weighted Pipeline across all active deals for monthly and quarterly revenue forecasting.\n\n**Best practice:** Update probability whenever the deal situation changes, not just at stage transitions. A Discovery meeting that went poorly should be marked down even if the stage hasn\'t changed yet.',
        Type: 'FAQ', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['pipeline', 'weighted', 'forecasting', 'probability']),
        SortOrder: 22, IsActive: true,
      },

      // --- Technical FAQs ---
      {
        Title: 'What Microsoft 365 licenses does the client need?',
        Content: 'Licensing requirements vary by service:\n\n**Power Platform:**\n- Power Apps per user: R350/user/month (standalone apps)\n- Power Apps per app: R85/app/user/month (up to 2 apps)\n- Power Automate per user: R250/user/month\n- Power BI Pro: R170/user/month (included in M365 E5)\n- Power BI Premium per user: R340/user/month\n\n**SPFx Development:**\n- SharePoint Online Plan 1 or 2 (included in M365 E3/E5)\n- No additional licensing for SPFx solutions\n\n**Copilot Agents:**\n- Microsoft 365 Copilot: R530/user/month\n- Copilot Studio: R340/user/month (for custom agents)\n\n**Viva Suite:**\n- Viva suite: R200/user/month\n- Individual modules available separately\n\n**Important:** Always verify the client\'s current licensing in the Discovery session. Many clients already have Power Platform and SharePoint through their M365 E3/E5 subscriptions. The DWx assessment team can do a license audit during the M365 Tenant Assessment.',
        Type: 'FAQ', Category: 'Technical',
        Tags_JSON: JSON.stringify(['licensing', 'microsoft-365', 'costs', 'requirements']),
        SortOrder: 30, IsActive: true,
      },
      {
        Title: 'What does the client need to provide before a Discovery session?',
        Content: 'To ensure a productive Discovery session, ask the client to prepare:\n\n**Essential (before the meeting):**\n1. A brief description of the business problem or opportunity\n2. Names and roles of attendees from their side\n3. Any existing documentation (RFPs, process maps, architecture diagrams)\n4. Current technology stack overview (what M365 licenses they have)\n\n**Nice to have:**\n- Access to their current solution/system (screenshots or demo access)\n- Sample data or content they want to work with\n- Success criteria — how they\'ll measure if the project is successful\n- Budget range (even approximate helps shape the proposal)\n- Decision-making timeline and stakeholders involved\n\n**Upload these to the request:** Use the document upload feature in the Service Request form or add them later via the request detail view. The specialist will review all materials before the session.\n\nThe AI-powered Session Prep feature will automatically generate talking points and a meeting agenda based on the client profile and submitted materials.',
        Type: 'FAQ', Category: 'Process',
        Tags_JSON: JSON.stringify(['discovery', 'preparation', 'client', 'documents']),
        SortOrder: 31, IsActive: true,
      },
      {
        Title: 'How do I handle requests from external partner AMs?',
        Content: 'External partner Account Managers (from tenant hallofd.com or other partners) can be onboarded through the Guest Invitation system:\n\n1. Go to **Admin > Guest Invitations** and send a B2B guest invite to the partner\'s email\n2. The partner receives an email invitation to join the DWx tenant\n3. Once accepted, their account appears in the **Account Managers** list with Source = "External"\n4. They can log in via Teams SSO using their own credentials\n5. External AMs see only their own requests — they cannot view other AMs\' deals\n\n**Key differences for external AMs:**\n- Their requests are tagged with AccountManagerTenant = "External"\n- They don\'t have access to the Pipeline Dashboard or Admin panel\n- Notifications go to both the external AM and their DW point of contact\n- Revenue attribution is tracked separately for partner-sourced deals\n\nAlways ensure the partner has signed the appropriate NDA and referral agreement before granting system access.',
        Type: 'FAQ', Category: 'Process',
        Tags_JSON: JSON.stringify(['external', 'partner', 'guest', 'onboarding']),
        SortOrder: 32, IsActive: true,
      },

      // --- Products FAQs ---
      {
        Title: 'Which DWx products are the best sellers?',
        Content: 'Based on 2025/2026 deployment data, our top-performing products by category:\n\n**DWx Apps (Top 5):**\n1. **Employee Onboarding** — Most requested by HR departments. Automates the entire onboarding workflow from offer acceptance to Day 1.\n2. **Leave Manager** — High volume, every company needs it. Integrates with payroll and Outlook calendars.\n3. **Knowledge Base** — Popular with knowledge-intensive industries (legal, consulting, financial services).\n4. **Asset Dashboard** — IT departments love the visibility. Works with Intune for automatic asset discovery.\n5. **Contract Manager** — Legal and procurement teams. Automates renewal reminders and approval workflows.\n\n**SharePoint Web Parts (Top 3):**\n1. News Carousel — Immediate visual impact on intranets\n2. People Directory — Solves a universal pain point\n3. Quick Links Grid — Simple but effective navigation\n\n**Adaptive Cards (Top 2):**\n1. Approval Card — Enables in-chat approvals without leaving Teams\n2. Leave Request — Combines with Leave Manager app\n\n**Tip:** Lead with the client\'s pain point, not the product. Ask "How do you handle X today?" before suggesting a specific product.',
        Type: 'FAQ', Category: 'Products',
        Tags_JSON: JSON.stringify(['products', 'best-sellers', 'recommendations', 'top-products']),
        SortOrder: 40, IsActive: true,
      },
      {
        Title: 'Can DWx products be customised?',
        Content: 'Yes, all DWx products support varying levels of customisation:\n\n**Tier 1 — Configuration (included in base price):**\n- Company branding (logo, colours, fonts)\n- Field labels and terminology\n- Enable/disable features\n- Notification recipients and templates\n- Integration endpoints (SharePoint site URLs, mailboxes)\n\n**Tier 2 — Extension (quoted separately):**\n- Additional fields and data capture\n- Custom workflow steps\n- Integration with third-party systems\n- Additional dashboards and reports\n- Multi-language support\n\n**Tier 3 — Bespoke development (custom engagement):**\n- Major feature additions\n- Complete UI redesign\n- Enterprise-specific business logic\n- Custom API connectors\n\nWhen a client asks for customisation, log the specific requirements in the Product Request form. This helps the specialist scope the effort accurately. Tier 1 changes typically take 1-2 days, Tier 2 is 1-4 weeks, and Tier 3 becomes a service engagement.',
        Type: 'FAQ', Category: 'Products',
        Tags_JSON: JSON.stringify(['customisation', 'products', 'tiers', 'branding']),
        SortOrder: 41, IsActive: true,
      },

      // --- More General/Process FAQs ---
      {
        Title: 'What should I do if a deal is going cold?',
        Content: 'Cold deals are normal — here\'s how to handle them:\n\n**Immediate actions:**\n1. Update the Interest Level to "Cold" in the request details\n2. Add notes about why the deal has cooled (budget freeze, champion left, competitor, timing)\n3. Agree on a follow-up date with the client and add it to Next Steps\n\n**Re-engagement strategies:**\n- Share a relevant case study or industry insight (not a sales pitch)\n- Invite them to a DW webinar or event\n- Ask if a different stakeholder should be involved\n- Offer a free 30-minute consultation on a related topic\n- Wait for a trigger event (fiscal year start, leadership change, competitor issue)\n\n**When to mark as Lost:**\n- Client explicitly declines or goes with a competitor\n- No response after 3 follow-up attempts over 6 weeks\n- Budget has been reallocated with no recovery timeline\n- Champion has left the organisation with no replacement\n\nAlways capture the Win/Loss Reason — this data is gold for improving our approach. Lost deals can be reopened as new Leads when circumstances change.',
        Type: 'FAQ', Category: 'Process',
        Tags_JSON: JSON.stringify(['cold-deal', 'follow-up', 're-engagement', 'lost']),
        SortOrder: 50, IsActive: true,
      },
      {
        Title: 'How do I prepare for a client discovery meeting?',
        Content: 'The system helps you prepare automatically, but here\'s what great AMs do:\n\n**Before the meeting (your responsibility):**\n1. Review the client\'s website and recent news (leadership changes, earnings, press releases)\n2. Check the client record in DWx for previous engagements and lifetime value\n3. Prepare 3-5 open-ended discovery questions specific to their industry\n4. Know your ask: what outcome do you want from this meeting?\n\n**System-assisted preparation:**\n- The AI Session Prep feature generates a client profile, talking points, suggested resources, and a meeting agenda\n- Access it from the request detail view once a specialist is assigned and discovery is confirmed\n- Review the talking points and customise them to your style\n- Select the resources you want to share in the meeting\n\n**During the meeting:**\n- Let the specialist lead the technical discussion\n- Focus on relationship building and business outcomes\n- Take notes on budget signals, decision-making process, and competitive landscape\n- Confirm next steps before ending\n\n**After the meeting:**\n- Update the request with discovery notes and any changed deal information\n- The specialist will advance the deal to Proposal stage when ready',
        Type: 'FAQ', Category: 'Process',
        Tags_JSON: JSON.stringify(['discovery', 'preparation', 'meeting', 'best-practice']),
        SortOrder: 51, IsActive: true,
      },
      {
        Title: 'What regions does Digital Workplace operate in?',
        Content: 'Digital Workplace operates across South Africa and the UK:\n\n**South Africa:**\n- **Western Cape** (Cape Town) — Head office, largest team\n- **Gauteng** (Johannesburg) — Key enterprise clients, financial services hub\n- **KwaZulu-Natal** (Durban) — Growing presence, manufacturing and logistics focus\n\n**United Kingdom:**\n- **London** — Partnership-driven, targeting UK enterprises expanding into Africa\n\n**How regions affect requests:**\n- When submitting a request, the AM\'s assigned region is automatically captured\n- Specialists may be allocated from any region (remote delivery is standard)\n- For on-site requirements, note this in the Requirements field\n- Client meetings default to Microsoft Teams unless an in-person session is requested\n\nThe Pipeline Dashboard breaks down metrics by region for territory management.',
        Type: 'FAQ', Category: 'General',
        Tags_JSON: JSON.stringify(['regions', 'locations', 'territory', 'geography']),
        SortOrder: 52, IsActive: true,
      },
      {
        Title: 'How do proposals work in the system?',
        Content: 'The Proposal system is integrated into the sales funnel. When a deal moves from Discovery to Proposal stage, the system automatically creates a proposal record. Here\'s the workflow:\n\n1. **Draft**: The specialist populates 11 proposal sections (Executive Summary, Solution Overview, Tech Stack, Scope of Work, Pricing, Timeline, Team Composition, Terms & Conditions, Change Control, Risks & Assumptions, Signing Page). AI can generate initial content.\n\n2. **Internal Review**: The specialist submits for manager review. Managers can approve or request revisions with notes.\n\n3. **Approved**: Once approved internally, the proposal is ready for the client. The AM can download it as a Word document using a DW-branded template.\n\n4. **Sent to Client**: The AM sends the proposal to the client and marks it as sent in the system.\n\n5. **Accepted/Declined**: When the client responds, the AM updates the status. Accepted proposals automatically advance the deal to Negotiation stage.\n\n**Important:** The pricing section auto-syncs the Deal Value back to the service request, keeping your pipeline numbers accurate.',
        Type: 'FAQ', Category: 'Process',
        Tags_JSON: JSON.stringify(['proposal', 'workflow', 'approval', 'document']),
        SortOrder: 53, IsActive: true,
      },

      // ═══════════════════════════════════════════════════════════════════════
      // GLOSSARY (20 entries)
      // ═══════════════════════════════════════════════════════════════════════
      {
        Title: 'Account Manager (AM)',
        Content: 'The primary client relationship owner responsible for identifying opportunities, submitting service requests, and managing the commercial relationship. AMs can be Internal (DW employees) or External (partner organisation employees invited as guests).',
        Type: 'Glossary', Category: 'General',
        Tags_JSON: JSON.stringify(['role', 'people']),
        SortOrder: 100, IsActive: true,
      },
      {
        Title: 'Copilot Agent',
        Content: 'A custom AI-powered assistant built on Microsoft 365 Copilot and Copilot Studio. Agents can be configured to answer questions from enterprise knowledge bases, automate multi-step workflows, and integrate with line-of-business systems. DW builds bespoke agents tailored to the client\'s data, processes, and compliance requirements.',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['ai', 'copilot', 'microsoft-365']),
        SortOrder: 101, IsActive: true,
      },
      {
        Title: 'Deal Probability',
        Content: 'A percentage (0-100%) representing the likelihood that a deal will close as Won. Used together with Deal Value to calculate Weighted Pipeline. Should be updated whenever the deal outlook changes — not just at stage transitions. Industry benchmarks: Lead 10-20%, Qualified 25-40%, Discovery 40-60%, Proposal 50-70%, Negotiation 70-90%.',
        Type: 'Glossary', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['metrics', 'pipeline', 'forecasting']),
        SortOrder: 102, IsActive: true,
      },
      {
        Title: 'Discovery Session',
        Content: 'A structured meeting between the client, Account Manager, and assigned Technical Specialist to understand the client\'s business requirements, technical landscape, and success criteria. Typically 1-2 hours via Microsoft Teams. The outcome informs the proposal scope and pricing. Discovery corresponds to the third stage of the sales funnel.',
        Type: 'Glossary', Category: 'Process',
        Tags_JSON: JSON.stringify(['meeting', 'funnel', 'stage']),
        SortOrder: 103, IsActive: true,
      },
      {
        Title: 'DLP (Data Loss Prevention)',
        Content: 'Microsoft 365 policies that prevent sensitive information (credit card numbers, ID numbers, health records) from being shared inappropriately. Relevant to M365 Assessments where DW reviews and configures DLP policies. Key regulation alignment: POPIA (South Africa), GDPR (EU/UK), HIPAA (healthcare).',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['security', 'compliance', 'microsoft-365']),
        SortOrder: 104, IsActive: true,
      },
      {
        Title: 'Funnel Stage',
        Content: 'One of 7 stages in the DWx sales funnel: Lead, Qualified, Discovery, Proposal, Negotiation, Won, Lost. Each stage has defined entry criteria, exit criteria, and allowed transitions. The funnel tracks deal progression and enables pipeline reporting. Stage transitions trigger automated notifications and, in some cases, system actions like calendar event creation or proposal record generation.',
        Type: 'Glossary', Category: 'Process',
        Tags_JSON: JSON.stringify(['sales', 'funnel', 'workflow', 'stages']),
        SortOrder: 105, IsActive: true,
      },
      {
        Title: 'Interest Level',
        Content: 'A qualitative measure of the client\'s buying intent: Hot (actively seeking a solution, budget approved, short timeline), Warm (interested but no urgency, exploring options), or Cold (early stage, no defined need, future potential). Updated by the Account Manager based on client interactions. Influences deal prioritisation in the pipeline.',
        Type: 'Glossary', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['qualification', 'lead', 'priority']),
        SortOrder: 106, IsActive: true,
      },
      {
        Title: 'M365 Tenant',
        Content: 'A dedicated instance of Microsoft 365 services (Azure AD, SharePoint, Exchange, Teams) provisioned for an organisation. Each client has their own tenant identified by a domain name (e.g., contoso.onmicrosoft.com). DW specialists need appropriate access or consent to work within a client\'s tenant, typically granted through admin consent or delegated permissions.',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['microsoft-365', 'infrastructure', 'azure-ad']),
        SortOrder: 107, IsActive: true,
      },
      {
        Title: 'POPIA (Protection of Personal Information Act)',
        Content: 'South Africa\'s data privacy legislation (effective 1 July 2021) that regulates how organisations collect, store, process, and share personal information. Similar to GDPR. Relevant to all DW engagements as our solutions handle personal data. Key requirements: lawful basis for processing, data minimisation, security safeguards, data subject rights, breach notification within 72 hours.',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['compliance', 'privacy', 'south-africa', 'regulation']),
        SortOrder: 108, IsActive: true,
      },
      {
        Title: 'Power Platform',
        Content: 'Microsoft\'s low-code/no-code platform comprising Power Apps (application building), Power Automate (workflow automation), Power BI (business intelligence), Power Pages (external-facing websites), and Power Virtual Agents (chatbots). DW\'s most popular service category, ideal for rapid business process digitisation.',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['microsoft', 'low-code', 'platform']),
        SortOrder: 109, IsActive: true,
      },
      {
        Title: 'Pre-Sales Specialist',
        Content: 'A technical team member (Solution Architect, Technical Specialist, or Consultant) assigned by a manager to lead the discovery session and prepare the proposal. Specialists have defined specialisations and maximum concurrent deal capacities. They are never self-assigned — only managers allocate specialists to requests.',
        Type: 'Glossary', Category: 'General',
        Tags_JSON: JSON.stringify(['role', 'people', 'specialist']),
        SortOrder: 110, IsActive: true,
      },
      {
        Title: 'Secure Score',
        Content: 'A Microsoft 365 security posture metric (0-100%) calculated based on security configurations, identity protection, device management, and information protection settings. A key deliverable of the M365 Tenant Assessment service. DW typically improves client scores by 15-30 percentage points through recommended configuration changes.',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['security', 'microsoft-365', 'assessment']),
        SortOrder: 111, IsActive: true,
      },
      {
        Title: 'Session Prep (AI)',
        Content: 'An AI-powered feature that automatically generates meeting preparation materials for discovery sessions. Uses Azure OpenAI (GPT-4o) to create: client profiles with industry context, categorised talking points, suggested resources with relevance scores, and a time-boxed meeting agenda. Created automatically when a discovery slot is confirmed.',
        Type: 'Glossary', Category: 'Services',
        Tags_JSON: JSON.stringify(['ai', 'preparation', 'automation']),
        SortOrder: 112, IsActive: true,
      },
      {
        Title: 'SharePoint Framework (SPFx)',
        Content: 'Microsoft\'s modern development framework for building client-side SharePoint and Teams solutions. SPFx solutions run in the browser using React or other frameworks and can be deployed to SharePoint App Catalog or Teams. DW\'s second-most popular service category, used for intranet customisation, Teams tabs, and custom web parts.',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['development', 'sharepoint', 'framework']),
        SortOrder: 113, IsActive: true,
      },
      {
        Title: 'Viva Suite',
        Content: 'Microsoft\'s employee experience platform consisting of: Viva Connections (company intranet in Teams), Viva Engage (social networking, formerly Yammer), Viva Learning (training and upskilling), Viva Insights (work patterns and wellbeing), and Viva Goals (OKR tracking). DW implements all modules individually or as a comprehensive suite.',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['microsoft', 'employee-experience', 'viva']),
        SortOrder: 114, IsActive: true,
      },
      {
        Title: 'Weighted Pipeline',
        Content: 'The risk-adjusted value of all active deals, calculated as the sum of (Deal Value × Deal Probability) across all non-terminal funnel stages. Used for revenue forecasting. Example: 3 deals worth R500K at 60%, R300K at 40%, and R200K at 80% = R300K + R120K + R160K = R580K weighted pipeline.',
        Type: 'Glossary', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['metrics', 'pipeline', 'forecasting', 'revenue']),
        SortOrder: 115, IsActive: true,
      },
      {
        Title: 'Win Rate',
        Content: 'The percentage of closed deals that resulted in a Win (as opposed to Lost). Calculated as Won ÷ (Won + Lost) × 100. DW\'s target win rate is 35-45%. A win rate below 30% suggests qualification issues (pursuing too many unqualified leads), while above 50% may indicate not enough deals in the pipeline (being too selective).',
        Type: 'Glossary', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['metrics', 'performance', 'kpi']),
        SortOrder: 116, IsActive: true,
      },
      {
        Title: 'RFP (Request for Proposal)',
        Content: 'A formal document issued by a client organisation inviting vendors to submit proposals for a specific project or service. RFPs should be uploaded to the service request as supporting documents. DW typically responds within 10-15 business days. The service request form has a dedicated Requirements field and document upload for RFP materials.',
        Type: 'Glossary', Category: 'Process',
        Tags_JSON: JSON.stringify(['document', 'procurement', 'tender']),
        SortOrder: 117, IsActive: true,
      },
      {
        Title: 'Client Lifetime Value (LTV)',
        Content: 'The total revenue generated from a client across all engagements. Automatically updated in the DWxClients list when a deal is marked as Won. Used to identify high-value accounts for premium treatment, cross-sell opportunities, and account development strategies. Premium clients (LTV > R1M) receive priority specialist assignment.',
        Type: 'Glossary', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['metrics', 'client', 'revenue']),
        SortOrder: 118, IsActive: true,
      },
      {
        Title: 'Graph API',
        Content: 'Microsoft\'s unified API endpoint (graph.microsoft.com) for accessing Microsoft 365 data including users, calendars, mail, SharePoint, Teams, and more. DWx Traffic Manager uses Graph API for authentication, calendar event creation, email notifications, and SharePoint list CRUD operations. Client solutions may also leverage Graph API for integrations.',
        Type: 'Glossary', Category: 'Technical',
        Tags_JSON: JSON.stringify(['api', 'microsoft', 'integration']),
        SortOrder: 119, IsActive: true,
      },

      // ═══════════════════════════════════════════════════════════════════════
      // ARTICLES (10 entries)
      // ═══════════════════════════════════════════════════════════════════════
      {
        Title: 'Winning the Enterprise Deal: A Guide for Account Managers',
        Content: 'Enterprise deals (R500K+) require a different approach than mid-market engagements. Here\'s the DW playbook:\n\n## 1. Multi-Threading the Relationship\nNever rely on a single champion. Identify and build relationships with:\n- **The Economic Buyer** — Controls the budget (CFO, CIO, or business unit head)\n- **The Technical Evaluator** — Assesses the solution (IT Manager, Enterprise Architect)\n- **The Champion** — Advocates internally for your solution\n- **The End User** — Will actually use the solution daily\n\n## 2. Discovery Is Everything\nEnterprise clients won\'t tolerate generic proposals. Invest in thorough discovery:\n- Request 2-3 discovery sessions rather than trying to cover everything in one meeting\n- Ask for access to their current systems (even screenshots help)\n- Understand their procurement process, approval chain, and timeline\n- Map their existing Microsoft 365 investments and utilisation\n\n## 3. Building the Business Case\nEnterprise decisions are justified with numbers:\n- Calculate ROI using time savings, error reduction, and compliance risk mitigation\n- Compare cost of DW solution vs. status quo (manual processes, legacy systems)\n- Include soft benefits: employee satisfaction, talent retention, competitive advantage\n- Reference similar enterprise deployments (with permission)\n\n## 4. Proposal Strategy\n- Lead with business outcomes, not technology\n- Include a phased approach with a quick-win first phase (de-risks the decision)\n- Offer a pilot or proof-of-concept for the most sceptical stakeholders\n- Price confidently — enterprise clients expect premium pricing for quality\n\n## 5. Navigating Procurement\n- Ask early about procurement requirements (preferred vendor status, tender process)\n- Prepare for security questionnaires and compliance assessments\n- Have references ready (especially in the same industry)\n- Be patient — enterprise sales cycles are typically 3-6 months',
        Type: 'Article', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['enterprise', 'strategy', 'sales', 'best-practice']),
        SortOrder: 200, IsActive: true,
      },
      {
        Title: 'Understanding the South African Enterprise IT Landscape',
        Content: '## Key Trends Shaping SA Enterprise IT in 2025/2026\n\n### 1. Cloud-First Mandates\nMost JSE Top 40 companies have committed to cloud-first strategies. Microsoft 365 adoption is particularly strong in financial services, mining, and retail. This creates natural demand for our services.\n\n### 2. Regulatory Compliance Pressure\n- **POPIA** enforcement has intensified — clients need compliant data handling solutions\n- **SARB** (banking) and **FSCA** (financial services) require stringent IT governance\n- **King IV** corporate governance principles demand IT risk management\n- **BEE/BBBEE** reporting increasingly digital — opportunity for Power BI solutions\n\n### 3. Industry-Specific Opportunities\n\n**Financial Services** (Nedbank, Standard Bank, Sanlam, Old Mutual, Capitec):\n- Branch digitisation and customer onboarding automation\n- Regulatory reporting dashboards (Power BI)\n- Copilot agents for internal knowledge management\n\n**Mining** (Anglo American, Sibanye, Impala Platinum):\n- Safety incident reporting apps (Power Apps)\n- Environmental compliance tracking\n- Remote workforce management solutions\n\n**Retail** (Woolworths, Shoprite, Pick n Pay):\n- Store operations management\n- Employee scheduling and communication (Viva)\n- Supply chain visibility dashboards\n\n**Healthcare** (Discovery, Netcare, Life Healthcare):\n- Patient data compliance (POPIA + Health Act)\n- Staff onboarding and training portals (Viva Learning)\n- Clinical process automation\n\n### 4. Load Shedding & Remote Work\nSouth Africa\'s unique power challenges have accelerated cloud adoption and remote work tooling. Clients need:\n- Offline-capable Power Apps\n- Teams-first collaboration strategies\n- Cloud-based disaster recovery planning\n\n### 5. Skills Shortage\nSA has a significant digital skills gap. Position DW as:\n- Knowledge transfer partner (not just a vendor)\n- Citizen developer enablement through Power Platform training\n- Centre of Excellence (CoE) setup and mentoring',
        Type: 'Article', Category: 'General',
        Tags_JSON: JSON.stringify(['south-africa', 'market', 'trends', 'industry']),
        SortOrder: 201, IsActive: true,
      },
      {
        Title: 'Objection Handling Playbook',
        Content: '## Common Client Objections and How to Handle Them\n\n### "We don\'t have the budget right now"\n**Response:** "I understand budget timing. Can I ask — is this a budget availability issue or a budget prioritisation issue? If the right solution could save your team 20 hours per week, would that change the priority?"\n**Follow-up:** Offer a free assessment to quantify the ROI, then revisit when the next budget cycle opens.\n\n### "We\'re already working with [Competitor]"\n**Response:** "That\'s great that you\'re investing in this area. We often work alongside other partners — our M365 platform specialisation is quite niche. Could I show you where we add value that\'s complementary to what they\'re doing?"\n**Follow-up:** Don\'t compete on price. Compete on specialisation and depth of Microsoft expertise.\n\n### "We can build it ourselves with our internal IT team"\n**Response:** "Your internal team is a fantastic asset. Many of our clients start internal builds but find the specialised skills and acceleration we bring gets them to production 3x faster. Would a hybrid model work — we build the foundation, your team maintains and extends it?"\n**Follow-up:** Offer a Power Platform CoE setup as a middle ground.\n\n### "The pricing seems high"\n**Response:** "I appreciate the feedback on pricing. Let me understand what you\'re comparing against. Our pricing reflects [SA-based team / M365 depth / post-go-live support]. Would it help to see a phased approach that spreads the investment?"\n**Follow-up:** Never lead with a discount. First understand their benchmark, then adjust scope if needed.\n\n### "We need to think about it"\n**Response:** "Absolutely — this is an important decision. Can I ask what specific aspects you need to think through? That way I can provide any additional information that might help."\n**Follow-up:** Agree on a specific follow-up date. "I\'ll send you the case study we discussed and touch base on Thursday — does that work?"\n\n### "We had a bad experience with a similar project"\n**Response:** "I\'m sorry to hear that. Would you mind sharing what went wrong? Understanding that helps us specifically address those risks in our approach. We have a structured methodology specifically designed to prevent [common failure they describe]."\n**Follow-up:** Use this intelligence to build explicit risk mitigation into the proposal.',
        Type: 'Article', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['objections', 'sales', 'negotiation', 'tactics']),
        SortOrder: 202, IsActive: true,
      },
      {
        Title: 'Power Platform vs SPFx: Decision Framework for Account Managers',
        Content: '## Quick Decision Matrix\n\nUse this matrix when a client asks "What technology should we use?"\n\n### Choose Power Platform When:\n- **Speed matters**: Client wants a working solution in weeks, not months\n- **Business users will own it**: Non-technical users need to maintain the app\n- **The problem is process-centric**: Forms, approvals, workflows, notifications\n- **Budget is limited**: Lower development cost, faster ROI\n- **Integration is standard**: Connecting to SharePoint, Dataverse, common APIs\n\n### Choose SPFx When:\n- **UX is paramount**: Pixel-perfect intranet pages, custom branding\n- **Deep SharePoint integration**: Custom web parts that need full page context\n- **Complex Teams tabs**: Beyond what Adaptive Cards or Power Apps embedded in Teams can do\n- **Performance critical**: Large datasets, complex rendering, real-time updates\n- **Enterprise deployment**: Tenant-wide solutions through App Catalog\n\n### The Hybrid Sweet Spot\nMany of our best engagements combine both:\n- SPFx web parts on the intranet → Power Automate flows for backend processing\n- Power Apps for data entry → SPFx dashboard for executive reporting\n- Power BI dashboards → Embedded in SPFx pages for contextual analytics\n\n### Red Flags (When Neither Is Right)\n- Client needs a consumer-facing website → Suggest Power Pages or custom web app\n- Client has no Microsoft 365 → This isn\'t our space (yet)\n- Client needs real-time millisecond processing → Suggest Azure Functions / custom API\n\n### What to Say to the Client\n"Based on what you\'ve described, I think [Power Platform/SPFx/a hybrid approach] would be the best fit because [reason]. Our specialist will confirm this in the discovery session and may recommend a different approach if the technical details suggest it. The beauty of our process is that the recommendation is always tailored to your specific needs, not a one-size-fits-all answer."',
        Type: 'Article', Category: 'Technical',
        Tags_JSON: JSON.stringify(['power-platform', 'spfx', 'decision', 'technology']),
        SortOrder: 203, IsActive: true,
      },
      {
        Title: 'How to Run a Great Discovery Meeting',
        Content: '## The DW Discovery Meeting Playbook\n\n### Before the Meeting\n1. Review the AI-generated Session Prep materials in DWx Traffic Manager\n2. Research the client\'s company, industry, and recent news\n3. Align with the specialist on who leads which parts of the conversation\n4. Test your Teams meeting link and any demo environments\n\n### Meeting Structure (Recommended 90 minutes)\n\n**Opening (10 min)**\n- Introductions and role clarification\n- Confirm the agenda and desired outcomes\n- Reference any previous engagements or shared connections\n\n**Current State Discovery (25 min)**\n- "Walk me through how you handle [process] today"\n- "What are the biggest pain points for your team?"\n- "What have you tried before? What worked and what didn\'t?"\n- "Who are the key stakeholders affected by this?"\n\n**Solution Exploration (25 min)**\n- Specialist demonstrates relevant capabilities\n- Show similar work (case studies, demos)\n- Discuss technology options and trade-offs\n- "If we could solve one thing for you, what would have the biggest impact?"\n\n**Scope & Approach (15 min)**\n- Outline a potential approach (phases, timeline)\n- Discuss dependencies and assumptions\n- "What does success look like for you in 6 months?"\n\n**Next Steps (15 min)**\n- Summarise key findings and action items\n- Agree on proposal timeline\n- Identify additional stakeholders for follow-up\n- Confirm decision-making process and timeline\n\n### After the Meeting\n1. Send a thank-you email within 2 hours summarising key points\n2. Update the DWx request with discovery notes\n3. Debrief with the specialist on proposal approach\n4. Schedule internal proposal review before sending to client',
        Type: 'Article', Category: 'Process',
        Tags_JSON: JSON.stringify(['discovery', 'meeting', 'playbook', 'best-practice']),
        SortOrder: 204, IsActive: true,
      },
      {
        Title: 'Cross-Selling and Upselling DWx Services',
        Content: '## Expanding Client Engagements\n\nThe most profitable growth comes from existing clients. Here\'s how to spot and pursue expansion opportunities:\n\n### Natural Cross-Sell Paths\n\n| If the client bought... | Suggest next... | Why it works |\n|------------------------|----------------|---------------|\n| Power Platform app | M365 Assessment | Optimise the platform they\'re building on |\n| M365 Assessment | Power Platform | Assessment reveals automation opportunities |\n| SPFx intranet | Viva Suite | Modern intranet → full employee experience |\n| SharePoint Migration | Power Platform | Now they have the data in the cloud, automate around it |\n| Copilot Agent | Training (Power Platform CoE) | Empower their team to build simpler agents internally |\n| Any service | Support retainer | Ongoing maintenance and enhancement |\n\n### Signals That a Client Is Ready for More\n- They mention other departments with similar challenges\n- They ask "Can this also do X?"\n- They\'re pleased with the current engagement outcome\n- Their organisation announces digital transformation initiatives\n- A new CIO/CTO joins with a modernisation mandate\n\n### How to Raise It\nDon\'t pitch during an active engagement — wait for the right moment:\n\n1. **During delivery** (specialist mentions it): "Our team noticed your HR department could benefit from the same approach. Would you like us to include a brief assessment?"\n\n2. **At project close**: "Now that we\'ve successfully delivered X, many clients find that Y is a natural next step. Shall we schedule a brief call to explore that?"\n\n3. **During QBR/account review**: "Looking at your M365 usage data, there\'s an opportunity to drive 3x more value from your existing licenses through Power Platform automation."\n\n### Tracking Cross-Sell in DWx\n- Submit a new service request linked to the same client\n- Reference the previous engagement in the Requirements field\n- The system automatically tracks the client\'s engagement count and lifetime value',
        Type: 'Article', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['cross-sell', 'upsell', 'expansion', 'growth']),
        SortOrder: 205, IsActive: true,
      },
      {
        Title: 'Microsoft Copilot: What Account Managers Need to Know',
        Content: '## The Copilot Landscape (2025/2026)\n\nMicrosoft Copilot is the #1 topic clients are asking about. Here\'s what you need to know:\n\n### What Is Copilot?\nMicrosoft 365 Copilot is an AI assistant embedded across Office apps (Word, Excel, PowerPoint, Outlook, Teams) that uses the client\'s organisational data (emails, documents, chats) to generate content, summarise information, and automate tasks.\n\n### DW\'s Copilot Offering\n\n**1. Copilot Readiness Assessment** (part of M365 Assessment)\n- Evaluate data quality and governance\n- Check licensing requirements\n- Identify high-impact use cases\n- Assess information architecture readiness\n\n**2. Custom Copilot Agents** (Enterprise service)\n- Build agents that answer questions from specific knowledge bases\n- Create workflow agents that automate multi-step processes\n- Develop agents that integrate with line-of-business systems\n- Deploy agents to Teams, SharePoint, or custom channels\n\n### Common Client Questions\n\n**"Is our data safe with Copilot?"**\nYes — Copilot respects all existing Microsoft 365 permissions. If a user can\'t access a document, Copilot can\'t either. No data leaves the Microsoft 365 boundary. However, this means permission hygiene is critical — the M365 Assessment addresses this.\n\n**"How much does it cost?"**\nMicrosoft 365 Copilot: R530/user/month on top of E3/E5. Copilot Studio: R340/user/month. Most clients start with 50-100 users in a pilot before full rollout.\n\n**"What ROI can we expect?"**\nMicrosoft\'s studies show 1.2 hours saved per user per day. At R500/hr loaded cost, that\'s R600/user/day or R13,200/user/month — significantly more than the license cost.\n\n### Qualifying Copilot Opportunities\n- Does the client have M365 E3 or E5? (Required foundation)\n- Is their SharePoint content well-organised? (Copilot needs good data)\n- Do they have a change management capability? (Adoption is key)\n- Are they willing to start with a focused pilot? (Best approach)',
        Type: 'Article', Category: 'Services',
        Tags_JSON: JSON.stringify(['copilot', 'ai', 'microsoft-365', 'strategy']),
        SortOrder: 206, IsActive: true,
      },
      {
        Title: 'Competitive Intelligence: How DW Wins Against Competitors',
        Content: '## Understanding the SA Microsoft Partner Landscape\n\n### Our Key Competitors and How We Differentiate\n\n**Large Consultancies (Accenture, Deloitte, PwC, EY)**\n- *Their strength*: Brand recognition, existing C-suite relationships, broad capability\n- *Their weakness*: Expensive, slow to mobilise, junior resources on projects\n- *Our play*: We\'re faster, more specialised, and offer senior resources throughout. "You get the A-team, not the B-team."\n\n**Local IT Services (BBD, Entelect, DVT, Synthesis)**\n- *Their strength*: Strong .NET/Java development, established SA presence\n- *Their weakness*: Microsoft 365 is not their core focus, often treat SharePoint as an afterthought\n- *Our play*: We live and breathe Microsoft 365. Our depth in Power Platform, SharePoint, and Copilot is unmatched.\n\n**Microsoft Direct (FastTrack, Unified Support)**\n- *Their strength*: It\'s Microsoft. Free/included services.\n- *Their weakness*: Generic advice, no customisation, limited availability\n- *Our play*: We build ON TOP of what FastTrack provides. FastTrack gives you the platform; we build the custom solution.\n\n**Boutique M365 Partners (Mint, Siatik, Digital Matter)**\n- *Their strength*: Niche expertise, flexible, competitive pricing\n- *Their weakness*: Limited scale, fewer reference clients, narrower capability\n- *Our play*: Our product portfolio (29 DWx products) and full-stack capability (consulting + development + products) set us apart.\n\n### When We\'re in a Competitive Situation\n1. **Don\'t compete on price** — compete on value, speed, and specialisation\n2. **Ask who else they\'re talking to** — it\'s a fair question and helps you position\n3. **Offer a proof-of-concept** — seeing is believing, and it\'s hard to replicate\n4. **Leverage references** — offer to connect them with a similar client\n5. **Highlight our product portfolio** — 29 ready-made products accelerate delivery',
        Type: 'Article', Category: 'Commercial',
        Tags_JSON: JSON.stringify(['competition', 'positioning', 'strategy', 'differentiation']),
        SortOrder: 207, IsActive: true,
      },
      {
        Title: 'Understanding Client Industries: Tailoring Your Pitch',
        Content: '## Industry-Specific Messaging Guide\n\n### Financial Services (Banking, Insurance, Asset Management)\n**Pain points:** Regulatory compliance, branch operations efficiency, customer experience\n**Lead with:** Compliance automation, secure document management, customer-facing Power Pages\n**Avoid:** Mentioning cloud concerns — most banks are already cloud-first\n**Key regulations:** POPIA, SARB regulations, FAIS, FICA\n**Decision cycle:** Long (4-8 months), multi-stakeholder procurement\n\n### Mining & Resources\n**Pain points:** Safety reporting, remote worker communication, environmental compliance\n**Lead with:** Mobile-first Power Apps that work offline, safety incident tracking, ESG reporting dashboards\n**Avoid:** Assuming low tech maturity — SA mines are increasingly digital\n**Key regulations:** Mine Health and Safety Act, Environmental Management Act\n**Decision cycle:** Medium (3-5 months), often driven by safety events\n\n### Retail & FMCG\n**Pain points:** Store operations, staff scheduling, supply chain visibility, employee training\n**Lead with:** Frontline worker solutions (Teams + Viva), operational dashboards, training portals\n**Avoid:** Complex technical jargon — retail buyers want business outcomes\n**Key regulations:** Consumer Protection Act, POPIA\n**Decision cycle:** Short-Medium (2-4 months), driven by seasonal cycles\n\n### Healthcare\n**Pain points:** Patient data compliance, staff onboarding, clinical process efficiency\n**Lead with:** POPIA-compliant document management, Viva Learning for staff training, Power Apps for clinical workflows\n**Avoid:** Any solution that stores patient data without explicit compliance discussion\n**Key regulations:** National Health Act, POPIA, Health Professions Act\n**Decision cycle:** Long (4-6 months), procurement-heavy\n\n### Professional Services (Legal, Consulting, Accounting)\n**Pain points:** Knowledge management, document automation, matter/project tracking\n**Lead with:** Knowledge Base (our DWx app), Copilot for document generation, Power Platform for time tracking\n**Avoid:** Competing with their existing practice management software\n**Key regulations:** POPIA, relevant professional body regulations\n**Decision cycle:** Short (1-3 months), partner/director decision',
        Type: 'Article', Category: 'Services',
        Tags_JSON: JSON.stringify(['industry', 'vertical', 'messaging', 'positioning']),
        SortOrder: 208, IsActive: true,
      },
      {
        Title: 'DWx Traffic Manager: Tips and Tricks for Power Users',
        Content: '## Getting the Most Out of the System\n\n### Request Submission Tips\n- **Be specific in Requirements**: The more detail you provide, the better the specialist can prepare. Include client pain points, current systems, and desired outcomes.\n- **Upload documents early**: RFPs, architecture diagrams, and process maps help the specialist prepare for discovery before the meeting.\n- **Propose realistic time slots**: Offer 3 slots spread across different days and times. Avoid Mondays and Fridays if possible.\n\n### Pipeline Management\n- **Update deal values regularly**: Don\'t wait for the proposal — enter estimated values at Lead stage based on the service pricing guidelines.\n- **Adjust probability honestly**: Under-forecasting is as harmful as over-forecasting. Use the guidelines in the Glossary.\n- **Add Next Steps after every interaction**: This creates a paper trail and helps managers support you.\n\n### Using the Knowledge Base\n- **Search by tag**: Tags are more specific than categories. Try searching for "pricing" or "objection" for targeted results.\n- **Bookmark Articles**: Keep the "Objection Handling Playbook" and "Industry Messaging Guide" handy for client calls.\n- **Suggest new entries**: If you find yourself answering the same question repeatedly, ask a manager to add it to the KB.\n\n### Notifications\n- **Check the bell icon**: The Notification Center shows all system notifications. Click to mark as read.\n- **Email notifications**: You receive emails for key events (specialist assigned, stage changed, proposal approved). These link directly to the relevant request.\n\n### Quick Actions\n- **Three-dot menu on request cards**: Advance stages, add comments, or view details without opening the full modal.\n- **Bulk operations** (Managers): The Pipeline Dashboard supports bulk stage transitions for request queue management.',
        Type: 'Article', Category: 'General',
        Tags_JSON: JSON.stringify(['tips', 'power-user', 'system', 'productivity']),
        SortOrder: 209, IsActive: true,
      },
    ];

    // Create all entries
    for (const entry of entries) {
      try {
        await graphService.createListItem('DWxKnowledgeBase', this.filterFieldsForList(entry, validColumns));
        results.push({ name: entry.Title, success: true, message: `Created ${entry.Type}: ${entry.Title}` });
      } catch (error) {
        results.push({ name: entry.Title, success: false, message: error instanceof Error ? error.message : 'Failed to create KB entry' });
      }
    }

    return { results };
  }

  /**
   * Seed all sample data in dependency order with progress reporting
   */
  async seedAllSampleData(
    onProgress?: (step: string, current: number, total: number) => void
  ): Promise<{ results: Array<{ list: string; itemCount: number; success: boolean; message: string }> }> {
    const results: Array<{ list: string; itemCount: number; success: boolean; message: string }> = [];
    const totalSteps = 10;

    const steps: Array<{ list: string; label: string; seed: () => Promise<{ results: Array<{ success: boolean; [key: string]: unknown }> }> }> = [
      { list: 'DWxClients', label: 'Seeding SA clients...', seed: () => this.seedClientsData() },
      { list: 'DWxTeamMembers', label: 'Seeding team members...', seed: () => this.seedTeamMembersData() },
      { list: 'DWxAccountManagers', label: 'Seeding account managers...', seed: () => this.seedAccountManagersData() },
      { list: 'DWxSpecialists', label: 'Seeding specialists...', seed: () => this.seedSpecialistsData() },
      { list: 'DWxManagers', label: 'Seeding managers...', seed: () => this.seedManagersData() },
      { list: 'DWxServices', label: 'Seeding services...', seed: () => this.seedServicesData() },
      { list: 'DWxServiceRequests', label: 'Seeding service requests...', seed: () => this.seedServiceRequestsData() },
      { list: 'DWxProductRequests', label: 'Seeding product requests...', seed: () => this.seedProductRequestsData() },
      { list: 'DWxKnowledgeBase', label: 'Seeding knowledge base...', seed: () => this.seedKnowledgeBaseData() },
    ];

    for (let i = 0; i < steps.length; i++) {
      onProgress?.(steps[i].label, i + 1, totalSteps);
      const count = await this.getListItemCount(steps[i].list);
      if (count > 0) {
        results.push({ list: steps[i].list, itemCount: count, success: true, message: `Already has ${count} items - skipped` });
        continue;
      }
      try {
        const seedResult = await steps[i].seed();
        const successCount = seedResult.results.filter(r => r.success).length;
        results.push({ list: steps[i].list, itemCount: successCount, success: true, message: `Seeded ${successCount} items` });
      } catch (err) {
        results.push({ list: steps[i].list, itemCount: 0, success: false, message: err instanceof Error ? err.message : 'Failed' });
      }
    }

    // Session prep last - depends on service request IDs
    onProgress?.('Seeding session prep...', totalSteps, totalSteps);
    const sessionPrepCount = await this.getListItemCount('DWxSessionPrep');
    if (sessionPrepCount > 0) {
      results.push({ list: 'DWxSessionPrep', itemCount: sessionPrepCount, success: true, message: `Already has ${sessionPrepCount} items - skipped` });
    } else {
      try {
        const spResult = await this.seedSessionPrepData();
        const successCount = spResult.results.filter(r => r.success).length;
        results.push({ list: 'DWxSessionPrep', itemCount: successCount, success: true, message: `Seeded ${successCount} items` });
      } catch (err) {
        results.push({ list: 'DWxSessionPrep', itemCount: 0, success: false, message: err instanceof Error ? err.message : 'Failed' });
      }
    }

    return { results };
  }

  /**
   * Get all fields for a list (for diagnostics)
   */
  async getListFields(listTitle: string): Promise<Array<{
    internalName: string;
    title: string;
    typeAsString: string;
  }>> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedListName = encodeURIComponent(listTitle);

      const response = await client
        .api(`/sites/${siteId}/lists/${encodedListName}/columns`)
        .select('name,displayName,text,choice,dateTime,boolean,number,currency')
        .get();

      return response.value.map((col: { name: string; displayName: string; text?: object; choice?: object; dateTime?: object; boolean?: object; number?: object; currency?: object }) => ({
        internalName: col.name,
        title: col.displayName,
        typeAsString: col.text ? 'Text' : col.choice ? 'Choice' : col.dateTime ? 'DateTime' : col.boolean ? 'Boolean' : col.number ? 'Number' : col.currency ? 'Currency' : 'Other',
      }));
    } catch (error) {
      console.error('Failed to get list fields:', error);
      return [];
    }
  }

  /**
   * Get item count for a list
   */
  async getListItemCount(listTitle: string): Promise<number> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(listTitle);
      return items.length;
    } catch {
      return 0;
    }
  }
}

export const dwxSharePointProvisioningService = new DWxSharePointProvisioningService();
