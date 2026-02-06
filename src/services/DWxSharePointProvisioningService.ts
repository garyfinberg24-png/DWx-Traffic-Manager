/**
 * DWx Traffic Manager - SharePoint Provisioning Service
 * Provisions DWx-specific SharePoint lists using Microsoft Graph API
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { getAuthService, getGraphService } from './serviceFactory';
import { config } from '../config/environmentConfig';
import { DW_SERVICES_SEED_DATA, DEFAULT_SERVICES } from '../types/ServiceRequest';

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
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Government', 'Education', 'Other'],
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
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Government', 'Education', 'Other'],
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
          choices: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Government', 'Education', 'Other'],
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
        { internalName: 'Department', displayName: 'Department', type: 'Text' },
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
        // Metadata
        { internalName: 'AIGeneratedAt', displayName: 'AI Generated At', type: 'DateTime' },
        { internalName: 'CompletedAt', displayName: 'Completed At', type: 'DateTime' },
        { internalName: 'ReminderSent', displayName: 'Reminder Sent', type: 'Boolean', defaultValue: '0' },
      ],
    };
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Check which DWx lists exist
   */
  async checkListsStatus(): Promise<ListStatus[]> {
    const listNames = ['DWxServices', 'DWxServiceRequests', 'DWxProductRequests', 'DWxClients', 'DWxSpecialists', 'DWxManagers', 'DWxTeamMembers', 'DWxAccountManagers', 'DWxAuditLog', 'DWxSessionPrep'];
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
      { name: 'DWxSupportingDocuments', provision: () => this.provisionDocumentLibrary() },
    ];

    for (const list of lists) {
      const result = await list.provision();
      results.push({ list: list.name, ...result });
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

      for (const service of DW_SERVICES_SEED_DATA) {
        try {
          // Find matching DEFAULT_SERVICES entry for rich content
          const richContent = DEFAULT_SERVICES.find(s => s.Title === service.Title);

          await graphService.createListItem('DWxServices', {
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
          });

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
      { Title: 'Gary Finberg', Email: 'gary@firsttech.digital', Phone: '+27 82 555 0001', Role: 'Solution Architect', Department: 'Digital Workplace', IsActive: true },
      { Title: 'Wimpie Baard', Email: 'wimpie.baard@firsttech.digital', Phone: '+27 82 555 0002', Role: 'Technical Specialist', Department: 'Digital Workplace', IsActive: true },
      { Title: 'Gulzar Ismail', Email: 'Gulzar.Ismail@firsttech.digital', Phone: '+27 82 555 0003', Role: 'Senior Consultant', Department: 'Digital Workplace', IsActive: true },
      { Title: 'Chris van Niekerk', Email: 'chris@firsttech.digital', Phone: '+27 82 555 0004', Role: 'Consultant', Department: 'Digital Workplace', IsActive: true },
      { Title: 'Sarah Mitchell', Email: 'sarah.mitchell@firsttech.digital', Phone: '+27 82 555 0005', Role: 'Demo Specialist', Department: 'Pre-Sales', IsActive: true },
      { Title: 'James Peterson', Email: 'james.peterson@firsttech.digital', Phone: '+27 82 555 0006', Role: 'Project Manager', Department: 'Digital Workplace', IsActive: true },
    ];

    try {
      const graphService = getGraphService();
      for (const member of seedData) {
        try {
          await graphService.createListItem('DWxTeamMembers', member);
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
   * Seed the DWxClients list with sample client organizations
   */
  async seedClientsData(): Promise<{ results: Array<{ name: string; success: boolean; message: string }> }> {
    const results: Array<{ name: string; success: boolean; message: string }> = [];

    const seedData = [
      { Title: 'Nedbank Group', PrimaryContactName: 'Pieter van der Merwe', PrimaryContactEmail: 'pieter.vandermerwe@nedbank.co.za', DecisionMakerName: 'Zanele Mthembu', DecisionMakerEmail: 'zanele.mthembu@nedbank.co.za', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'gary@firsttech.digital', EngagementCount: 8, TotalRevenue: 1250000, LastEngagementDate: '2025-11-15T00:00:00Z' },
      { Title: 'Discovery Health', PrimaryContactName: 'Nomsa Dlamini', PrimaryContactEmail: 'nomsa.dlamini@discovery.co.za', DecisionMakerName: 'Rethabile Molefe', DecisionMakerEmail: 'rethabile.molefe@discovery.co.za', Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'wimpie.baard@firsttech.digital', EngagementCount: 5, TotalRevenue: 890000, LastEngagementDate: '2025-12-01T00:00:00Z' },
      { Title: 'Sasol Limited', PrimaryContactName: 'Johan Botha', PrimaryContactEmail: 'johan.botha@sasol.com', DecisionMakerName: 'Lindiwe Nkosi', DecisionMakerEmail: 'lindiwe.nkosi@sasol.com', Industry: 'Manufacturing', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', EngagementCount: 3, TotalRevenue: 675000, LastEngagementDate: '2025-10-20T00:00:00Z' },
      { Title: 'MTN South Africa', PrimaryContactName: 'Thabo Mokoena', PrimaryContactEmail: 'thabo.mokoena@mtn.co.za', DecisionMakerName: 'Charles Molapisi', DecisionMakerEmail: 'charles.molapisi@mtn.co.za', Industry: 'Technology', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'gary@firsttech.digital', EngagementCount: 6, TotalRevenue: 1050000, LastEngagementDate: '2026-01-10T00:00:00Z' },
      { Title: 'Woolworths Holdings', PrimaryContactName: 'Anita Naidoo', PrimaryContactEmail: 'anita.naidoo@woolworths.co.za', DecisionMakerName: 'Roy Bagattini', DecisionMakerEmail: 'roy.bagattini@woolworths.co.za', Industry: 'Retail', CompanySize: 'Large (250-1000)', IsPremium: false, ContractStatus: 'Active', AccountManagerEmail: 'chris@firsttech.digital', EngagementCount: 2, TotalRevenue: 320000, LastEngagementDate: '2025-09-05T00:00:00Z' },
      { Title: 'Sanlam Life', PrimaryContactName: 'Liezel du Plessis', PrimaryContactEmail: 'liezel.duplessis@sanlam.co.za', DecisionMakerName: 'Paul Hanratty', DecisionMakerEmail: 'paul.hanratty@sanlam.co.za', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'james.peterson@firsttech.digital', EngagementCount: 4, TotalRevenue: 580000, LastEngagementDate: '2025-11-28T00:00:00Z' },
      { Title: 'Capitec Bank', PrimaryContactName: 'Sipho Mabena', PrimaryContactEmail: 'sipho.mabena@capitecbank.co.za', DecisionMakerName: 'Gerrie Fourie', DecisionMakerEmail: 'gerrie.fourie@capitecbank.co.za', Industry: 'Finance', CompanySize: 'Large (250-1000)', IsPremium: false, ContractStatus: 'Prospect', AccountManagerEmail: 'gary@firsttech.digital', EngagementCount: 0, TotalRevenue: 0 },
      { Title: 'Shoprite Holdings', PrimaryContactName: 'Fathima Patel', PrimaryContactEmail: 'fathima.patel@shoprite.co.za', DecisionMakerName: 'Pieter Engelbrecht', DecisionMakerEmail: 'pieter.engelbrecht@shoprite.co.za', Industry: 'Retail', CompanySize: 'Enterprise (1000+)', IsPremium: false, ContractStatus: 'Active', AccountManagerEmail: 'wimpie.baard@firsttech.digital', EngagementCount: 1, TotalRevenue: 150000, LastEngagementDate: '2025-08-15T00:00:00Z' },
      { Title: 'Old Mutual', PrimaryContactName: 'David Tshabalala', PrimaryContactEmail: 'david.tshabalala@oldmutual.co.za', DecisionMakerName: 'Iain Williamson', DecisionMakerEmail: 'iain.williamson@oldmutual.co.za', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', EngagementCount: 7, TotalRevenue: 920000, LastEngagementDate: '2026-01-05T00:00:00Z' },
      { Title: 'Anglo American SA', PrimaryContactName: 'Heinrich Kruger', PrimaryContactEmail: 'heinrich.kruger@angloamerican.com', DecisionMakerName: 'Duncan Wanblad', DecisionMakerEmail: 'duncan.wanblad@angloamerican.com', Industry: 'Manufacturing', CompanySize: 'Enterprise (1000+)', IsPremium: false, ContractStatus: 'Prospect', AccountManagerEmail: 'chris@firsttech.digital', EngagementCount: 0, TotalRevenue: 0 },
      { Title: 'Standard Bank', PrimaryContactName: 'Lerato Khumalo', PrimaryContactEmail: 'lerato.khumalo@standardbank.co.za', DecisionMakerName: 'Sim Tshabalala', DecisionMakerEmail: 'sim.tshabalala@standardbank.co.za', Industry: 'Finance', CompanySize: 'Enterprise (1000+)', IsPremium: true, ContractStatus: 'Active', AccountManagerEmail: 'james.peterson@firsttech.digital', EngagementCount: 10, TotalRevenue: 1800000, LastEngagementDate: '2026-01-20T00:00:00Z' },
      { Title: 'Pick n Pay', PrimaryContactName: 'Rajan Govender', PrimaryContactEmail: 'rajan.govender@pnp.co.za', DecisionMakerName: 'Sean Summers', DecisionMakerEmail: 'sean.summers@pnp.co.za', Industry: 'Retail', CompanySize: 'Large (250-1000)', IsPremium: false, ContractStatus: 'Churned', AccountManagerEmail: 'wimpie.baard@firsttech.digital', EngagementCount: 2, TotalRevenue: 180000, LastEngagementDate: '2024-06-10T00:00:00Z' },
    ];

    try {
      const graphService = getGraphService();
      for (const client of seedData) {
        try {
          await graphService.createListItem('DWxClients', client);
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
      for (const am of seedData) {
        try {
          await graphService.createListItem('DWxAccountManagers', am);
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
      for (const specialist of seedData) {
        try {
          await graphService.createListItem('DWxSpecialists', specialist);
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
      for (const manager of seedData) {
        try {
          await graphService.createListItem('DWxManagers', manager);
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
        Title: 'Capitec Bank - M365 Tenant Assessment',
        ServiceName: 'M365 Tenant Assessment',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Capitec Bank', ContactName: 'Sipho Mabena', ContactEmail: 'sipho.mabena@capitecbank.co.za', ContactPhone: '+27 21 809 0000',
        Industry: 'Finance', CompanySize: 'Large (250-1000)',
        FunnelStage: 'Lead', InterestLevel: 'Warm',
        DealValue: 180000, DealProbability: 20, ExpectedCloseDate: '2026-06-30T00:00:00Z',
        Budget: 'R150K - R200K', Timeline: 'Q3 2026',
        Requirements: 'Full security and compliance audit of their M365 environment. Capitec is expanding their digital banking platform and needs to ensure their M365 tenant meets financial services compliance requirements including POPIA and the South African Reserve Bank regulations.',
        Comments: 'New prospect - Sipho attended our webinar on M365 security best practices for financial services.',
      },
      {
        Title: 'Anglo American SA - SharePoint Migration',
        ServiceName: 'SharePoint Migration',
        AccountManagerName: 'Chris van Niekerk', AccountManagerEmail: 'chris@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Anglo American SA', ContactName: 'Heinrich Kruger', ContactEmail: 'heinrich.kruger@angloamerican.com', ContactPhone: '+27 11 638 9111',
        Industry: 'Manufacturing', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Lead', InterestLevel: 'Cold',
        DealValue: 650000, DealProbability: 10, ExpectedCloseDate: '2026-09-30T00:00:00Z',
        Budget: 'R500K - R800K', Timeline: 'H2 2026',
        Requirements: 'Migration of on-premises SharePoint 2016 farm to SharePoint Online. Approximately 2TB of content across 150 site collections used by mining operations, engineering, and corporate teams across South Africa.',
        Comments: 'Initial inquiry via website contact form. Large-scale migration with complex permissions and custom workflows.',
      },
      // Qualified Stage (2) - Interest validated, specialist being assigned
      {
        Title: 'MTN South Africa - Enterprise Copilot Agents',
        ServiceName: 'Enterprise Copilot Agents',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'MTN South Africa', ContactName: 'Thabo Mokoena', ContactEmail: 'thabo.mokoena@mtn.co.za', ContactPhone: '+27 83 180 0000',
        Industry: 'Technology', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Qualified', InterestLevel: 'Hot',
        DealValue: 750000, DealProbability: 40, ExpectedCloseDate: '2026-05-31T00:00:00Z',
        Budget: 'R600K - R900K', Timeline: 'Q2 2026',
        AssignedSpecialistName: 'Gary Finberg', AssignedSpecialistEmail: 'gary@firsttech.digital', AssignedSpecialistRole: 'Solution Architect',
        Requirements: 'Design and implement Copilot agents for their customer service and internal IT help desk. MTN wants to reduce call centre load by 30% through AI-powered self-service for both customers and employees.',
        Comments: 'Premium client with strong executive sponsorship. CTO is driving the AI transformation agenda.',
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
      },
      // Discovery Stage (2) - Meeting scheduled, specialist assigned
      {
        Title: 'Nedbank Group - Power Platform Development',
        ServiceName: 'Power Platform Development',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Nedbank Group', ContactName: 'Pieter van der Merwe', ContactEmail: 'pieter.vandermerwe@nedbank.co.za', ContactPhone: '+27 11 294 4444',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Discovery', InterestLevel: 'Hot',
        DealValue: 450000, DealProbability: 60, ExpectedCloseDate: '2026-04-15T00:00:00Z',
        Budget: 'R400K - R500K', Timeline: 'Q2 2026',
        ConfirmedDateTime: '2026-03-15T10:00:00Z',
        AssignedSpecialistName: 'Gary Finberg', AssignedSpecialistEmail: 'gary@firsttech.digital', AssignedSpecialistRole: 'Solution Architect',
        Requirements: 'Custom Power Apps for branch operations digitisation. Currently 200+ branches use paper-based processes for customer onboarding, account opening, and compliance checks. Need integration with Nedbank core banking APIs and Azure AD for branch staff authentication.',
        Comments: 'Premium client - priority engagement. Discovery session confirmed for March 15. Previous M365 Assessment was a success.',
      },
      {
        Title: 'Discovery Health - SPFx Development',
        ServiceName: 'SPFx Development',
        AccountManagerName: 'Wimpie Baard', AccountManagerEmail: 'wimpie.baard@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Discovery Health', ContactName: 'Nomsa Dlamini', ContactEmail: 'nomsa.dlamini@discovery.co.za', ContactPhone: '+27 11 529 2888',
        Industry: 'Healthcare', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Discovery', InterestLevel: 'Hot',
        DealValue: 520000, DealProbability: 55, ExpectedCloseDate: '2026-04-30T00:00:00Z',
        Budget: 'R450K - R600K', Timeline: 'Q2 2026',
        ConfirmedDateTime: '2026-03-18T14:00:00Z',
        AssignedSpecialistName: 'Wimpie Baard', AssignedSpecialistEmail: 'wimpie.baard@firsttech.digital', AssignedSpecialistRole: 'Technical Specialist',
        Requirements: 'Custom SPFx web parts for their Vitality wellness programme intranet. Need interactive health dashboard web parts that integrate with Discovery Vitality APIs to show employee wellness metrics, gym booking, and rewards tracking within SharePoint.',
        Comments: 'Complex SPFx project with external API integration. Discovery session scheduled for March 18.',
      },
      // Proposal Stage (2) - Discovery complete, proposal being prepared
      {
        Title: 'Sasol Limited - SharePoint Migration',
        ServiceName: 'SharePoint Migration',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Sasol Limited', ContactName: 'Johan Botha', ContactEmail: 'johan.botha@sasol.com', ContactPhone: '+27 10 344 5000',
        Industry: 'Manufacturing', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Proposal', InterestLevel: 'Warm',
        DealValue: 850000, DealProbability: 50, ExpectedCloseDate: '2026-04-30T00:00:00Z',
        Budget: 'R750K - R1M', Timeline: 'Q2-Q3 2026',
        ConfirmedDateTime: '2026-02-10T09:00:00Z',
        AssignedSpecialistName: 'Gulzar Ismail', AssignedSpecialistEmail: 'Gulzar.Ismail@firsttech.digital', AssignedSpecialistRole: 'Senior Consultant',
        Requirements: 'Migration of engineering document management system from SharePoint 2019 on-prem to SharePoint Online. 5TB of technical drawings, safety documents, and project files. Must preserve metadata, version history, and complex permission structures. Compliance with mining safety regulations (MHSA) required.',
        Comments: 'Discovery completed Feb 10. Preparing phased migration proposal. Key concern is maintaining uptime during migration for Secunda and Sasolburg plants.',
        NextSteps: 'Finalise migration roadmap and present proposal by March 1',
      },
      {
        Title: 'Sanlam Life - Microsoft Viva Suite',
        ServiceName: 'Microsoft Viva Suite',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Sanlam Life', ContactName: 'Liezel du Plessis', ContactEmail: 'liezel.duplessis@sanlam.co.za', ContactPhone: '+27 21 947 9111',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Proposal', InterestLevel: 'Warm',
        DealValue: 380000, DealProbability: 45, ExpectedCloseDate: '2026-05-15T00:00:00Z',
        Budget: 'R300K - R450K', Timeline: 'Q2-Q3 2026',
        ConfirmedDateTime: '2026-02-05T11:00:00Z',
        AssignedSpecialistName: 'Gulzar Ismail', AssignedSpecialistEmail: 'Gulzar.Ismail@firsttech.digital', AssignedSpecialistRole: 'Senior Consultant',
        Requirements: 'Full Microsoft Viva implementation across Sanlam Life division: Viva Connections for their intranet, Viva Learning for FAIS compliance training, Viva Insights for hybrid work analytics, and Viva Engage for cross-departmental collaboration. 4,500 employees in scope.',
        Comments: 'Discovery session completed. Sanlam is particularly interested in Viva Learning for regulatory compliance training tracking.',
        NextSteps: 'Draft proposal with phased rollout starting with Viva Connections and Learning',
      },
      // Negotiation Stage (2) - Proposal sent, terms being finalised
      {
        Title: 'Old Mutual - Enterprise Copilot Agents',
        ServiceName: 'Enterprise Copilot Agents',
        AccountManagerName: 'Gulzar Ismail', AccountManagerEmail: 'Gulzar.Ismail@firsttech.digital', AccountManagerTenant: 'Internal',
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
      },
      {
        Title: 'Standard Bank - M365 Tenant Assessment',
        ServiceName: 'M365 Tenant Assessment',
        AccountManagerName: 'James Peterson', AccountManagerEmail: 'james.peterson@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Standard Bank', ContactName: 'Lerato Khumalo', ContactEmail: 'lerato.khumalo@standardbank.co.za', ContactPhone: '+27 11 636 9111',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Negotiation', InterestLevel: 'Warm',
        DealValue: 250000, DealProbability: 65, ExpectedCloseDate: '2026-03-15T00:00:00Z',
        Budget: 'R200K - R300K', Timeline: 'Q1 2026',
        ConfirmedDateTime: '2026-01-15T09:00:00Z',
        AssignedSpecialistName: 'Chris van Niekerk', AssignedSpecialistEmail: 'chris@firsttech.digital', AssignedSpecialistRole: 'Consultant',
        Requirements: 'Comprehensive M365 security and governance assessment ahead of their planned migration of retail banking teams to Teams. Focus on DLP policies, sensitivity labels, conditional access, and SARB (South African Reserve Bank) regulatory compliance.',
        Comments: 'Assessment scope agreed. Negotiating timeline - Standard Bank wants completion before Q2 board meeting.',
        NextSteps: 'Confirm start date and provision access to tenant analytics',
      },
      // Won Stage (2) - Contract signed, deal closed
      {
        Title: 'Woolworths Holdings - Power Platform Development',
        ServiceName: 'Power Platform Development',
        AccountManagerName: 'Chris van Niekerk', AccountManagerEmail: 'chris@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Woolworths Holdings', ContactName: 'Anita Naidoo', ContactEmail: 'anita.naidoo@woolworths.co.za', ContactPhone: '+27 21 407 9111',
        Industry: 'Retail', CompanySize: 'Large (250-1000)',
        FunnelStage: 'Won', InterestLevel: 'Hot',
        DealValue: 320000, DealProbability: 100, ExpectedCloseDate: '2026-01-31T00:00:00Z',
        Budget: 'R300K - R350K', Timeline: 'Q1 2026',
        ConfirmedDateTime: '2025-12-10T10:00:00Z',
        AssignedSpecialistName: 'Sarah Mitchell', AssignedSpecialistEmail: 'sarah.mitchell@firsttech.digital', AssignedSpecialistRole: 'Technical Specialist',
        Requirements: 'Power Automate workflows for supply chain approvals and Power BI dashboards for store performance analytics across Woolworths Food, Fashion, and Beauty divisions.',
        WinLossReason: 'Strong demo of retail-specific Power Platform solutions. Competitive pricing and proven experience with SA retail sector.',
        Comments: 'Contract signed January 31. Project kickoff scheduled for February 15.',
        NextSteps: 'Project initiation and environment setup',
      },
      {
        Title: 'Nedbank Group - M365 Tenant Assessment',
        ServiceName: 'M365 Tenant Assessment',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Nedbank Group', ContactName: 'Pieter van der Merwe', ContactEmail: 'pieter.vandermerwe@nedbank.co.za', ContactPhone: '+27 11 294 4444',
        Industry: 'Finance', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Won', InterestLevel: 'Hot',
        DealValue: 175000, DealProbability: 100, ExpectedCloseDate: '2025-12-15T00:00:00Z',
        Budget: 'R150K - R200K', Timeline: 'Q4 2025',
        ConfirmedDateTime: '2025-11-01T09:00:00Z',
        AssignedSpecialistName: 'Gulzar Ismail', AssignedSpecialistEmail: 'Gulzar.Ismail@firsttech.digital', AssignedSpecialistRole: 'Senior Consultant',
        Requirements: 'Full M365 tenant security and governance assessment. Review of Secure Score, DLP policies, compliance center configuration, and identity management practices.',
        WinLossReason: 'Existing relationship and deep understanding of banking compliance requirements. Fast turnaround commitment.',
        Comments: 'Assessment completed successfully. Led to the current Power Platform Development opportunity.',
        NextSteps: 'Remediation tracking in progress. Follow-up assessment in 6 months.',
      },
      // Lost Stage (2) - Opportunities that didn't convert
      {
        Title: 'Pick n Pay - SharePoint Migration',
        ServiceName: 'SharePoint Migration',
        AccountManagerName: 'Wimpie Baard', AccountManagerEmail: 'wimpie.baard@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'Pick n Pay', ContactName: 'Rajan Govender', ContactEmail: 'rajan.govender@pnp.co.za', ContactPhone: '+27 21 658 1000',
        Industry: 'Retail', CompanySize: 'Large (250-1000)',
        FunnelStage: 'Lost', InterestLevel: 'Cold',
        DealValue: 420000, DealProbability: 0, ExpectedCloseDate: '2025-09-30T00:00:00Z',
        Budget: 'R350K - R500K', Timeline: 'Q4 2025',
        Requirements: 'Migration of legacy SharePoint 2013 intranet to SharePoint Online. 1.2TB of content across 80 site collections.',
        WinLossReason: 'Client chose competitor with lower pricing. Also concerns about disruption during peak trading season (November-December).',
        Comments: 'Lost to a Johannesburg-based consultancy. Client indicated they may revisit in Q3 2026 after settling into the new platform.',
        NextSteps: 'Schedule follow-up call in July 2026 to discuss potential remediation or Phase 2 work.',
      },
      {
        Title: 'MTN South Africa - Microsoft Viva Suite',
        ServiceName: 'Microsoft Viva Suite',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital', AccountManagerTenant: 'Internal',
        ClientName: 'MTN South Africa', ContactName: 'Thabo Mokoena', ContactEmail: 'thabo.mokoena@mtn.co.za', ContactPhone: '+27 83 180 0000',
        Industry: 'Technology', CompanySize: 'Enterprise (1000+)',
        FunnelStage: 'Lost', InterestLevel: 'Warm',
        DealValue: 350000, DealProbability: 0, ExpectedCloseDate: '2025-12-31T00:00:00Z',
        Budget: 'R300K - R400K', Timeline: 'Q4 2025',
        Requirements: 'Viva Connections and Viva Learning implementation for MTN call centre and retail store staff. 8,000 frontline workers in scope.',
        WinLossReason: 'Budget constraints - MTN reallocated digital workplace budget to 5G network rollout. Interest remains for 2026.',
        Comments: 'MTN still interested in Copilot Agents (separate active deal). Viva may be revisited once 5G investment phase completes.',
        NextSteps: 'Maintain relationship through Copilot Agents engagement. Revisit Viva conversation in Q3 2026.',
      },
    ];

    try {
      const graphService = getGraphService();
      for (const request of seedData) {
        try {
          await graphService.createListItem('DWxServiceRequests', request);
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
        Title: 'Nedbank Group - Asset Dashboard Demo',
        ProductId: 'asset-dashboard', ProductName: 'Asset Dashboard', ProductType: 'App', ProductCategory: 'Operations & IT',
        RequestType: 'Demo',
        AccountManagerName: 'Gary Finberg', AccountManagerEmail: 'gary@firsttech.digital',
        ClientName: 'Nedbank Group', ContactName: 'Pieter van der Merwe', ContactEmail: 'pieter.vandermerwe@nedbank.co.za', ContactPhone: '+27 11 294 4444',
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
    ];

    try {
      const graphService = getGraphService();
      for (const request of seedData) {
        try {
          await graphService.createListItem('DWxProductRequests', request);
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

      // Find Discovery-stage service requests to link session prep records
      const serviceRequests = await graphService.getListItems('DWxServiceRequests') as Array<{ id: string; fields?: { FunnelStage?: string; ClientName?: string } }>;
      const discoveryRequests = serviceRequests.filter(
        (r) => r.fields?.FunnelStage === 'Discovery'
      );

      // Session Prep #1: Nedbank Discovery - Ready (fully prepared)
      const nedbankReq = discoveryRequests.find(
        (r) => r.fields?.ClientName === 'Nedbank Group'
      );
      if (nedbankReq) {
        try {
          await graphService.createListItem('DWxSessionPrep', {
            Title: 'Prep - Nedbank Group - 2026-03-15',
            ServiceRequestId: parseInt(nedbankReq.id),
            SpecialistEmail: 'gary@firsttech.digital',
            SpecialistName: 'Gary Finberg',
            Status: 'Ready',
            ClientProfile_JSON: JSON.stringify({
              companyOverview: 'Nedbank Group is one of South Africa\'s "Big Four" banking groups, headquartered in Johannesburg. With over 200 branches and 30,000 employees, they serve 7.8 million clients across personal, business, corporate, and wealth management segments. Their "Old Mutual Two Degrees" partnership focuses on shared-value banking.',
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
          });
          results.push({ name: 'Nedbank Group - Ready', success: true, message: 'Created successfully' });
        } catch (err) {
          results.push({ name: 'Nedbank Group - Ready', success: false, message: err instanceof Error ? err.message : 'Unknown error' });
        }
      } else {
        results.push({ name: 'Nedbank Group - Ready', success: false, message: 'Could not find Nedbank Discovery service request to link' });
      }

      // Session Prep #2: Discovery Health SPFx - In Progress (partial checklist)
      const discoveryHealthReq = discoveryRequests.find(
        (r) => r.fields?.ClientName === 'Discovery Health'
      );
      if (discoveryHealthReq) {
        try {
          await graphService.createListItem('DWxSessionPrep', {
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
          });
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
          await graphService.createListItem('DWxSessionPrep', {
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
          });
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
   * Seed all sample data in dependency order with progress reporting
   */
  async seedAllSampleData(
    onProgress?: (step: string, current: number, total: number) => void
  ): Promise<{ results: Array<{ list: string; itemCount: number; success: boolean; message: string }> }> {
    const results: Array<{ list: string; itemCount: number; success: boolean; message: string }> = [];
    const totalSteps = 9;

    const steps: Array<{ list: string; label: string; seed: () => Promise<{ results: Array<{ success: boolean; [key: string]: unknown }> }> }> = [
      { list: 'DWxClients', label: 'Seeding SA clients...', seed: () => this.seedClientsData() },
      { list: 'DWxTeamMembers', label: 'Seeding team members...', seed: () => this.seedTeamMembersData() },
      { list: 'DWxAccountManagers', label: 'Seeding account managers...', seed: () => this.seedAccountManagersData() },
      { list: 'DWxSpecialists', label: 'Seeding specialists...', seed: () => this.seedSpecialistsData() },
      { list: 'DWxManagers', label: 'Seeding managers...', seed: () => this.seedManagersData() },
      { list: 'DWxServices', label: 'Seeding services...', seed: () => this.seedServicesData() },
      { list: 'DWxServiceRequests', label: 'Seeding service requests...', seed: () => this.seedServiceRequestsData() },
      { list: 'DWxProductRequests', label: 'Seeding product requests...', seed: () => this.seedProductRequestsData() },
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
