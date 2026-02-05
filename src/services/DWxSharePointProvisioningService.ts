/**
 * DWx Traffic Manager - SharePoint Provisioning Service
 * Provisions DWx-specific SharePoint lists using Microsoft Graph API
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { getAuthService, getGraphService } from './serviceFactory';
import { config } from '../config/environmentConfig';
import { DW_SERVICES_SEED_DATA } from '../types/ServiceRequest';

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
        return { success: true, message: `List "${definition.title}" already exists` };
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
          choices: ['Power Platform', 'SPFx', 'Migrations', 'Assessment', 'Copilot', 'Viva'],
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
        // Requirements & Notes
        { internalName: 'Requirements', displayName: 'Requirements', type: 'Note' },
        { internalName: 'ServiceHistory', displayName: 'Service History', type: 'Note' },
        { internalName: 'WinLossReason', displayName: 'Win/Loss Reason', type: 'Text' },
        { internalName: 'NextSteps', displayName: 'Next Steps', type: 'Note' },
        { internalName: 'Comments', displayName: 'Comments', type: 'Note' },
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

  // ==================== PUBLIC METHODS ====================

  /**
   * Check which DWx lists exist
   */
  async checkListsStatus(): Promise<ListStatus[]> {
    const listNames = ['DWxServices', 'DWxServiceRequests', 'DWxProductRequests', 'DWxClients', 'DWxSpecialists', 'DWxAuditLog', 'DWxTeamMembers', 'DWxAccountManagers'];
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
      { name: 'DWxTeamMembers', provision: () => this.provisionTeamMembersList() },
      { name: 'DWxAccountManagers', provision: () => this.provisionAccountManagersList() },
      { name: 'DWxAuditLog', provision: () => this.provisionAuditLogList() },
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
