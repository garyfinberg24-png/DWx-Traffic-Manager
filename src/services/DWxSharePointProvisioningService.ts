/**
 * DWx Traffic Manager - SharePoint Provisioning Service
 * Provisions DWx-specific SharePoint lists for the Traffic Manager application
 */

import { getAuthService } from './serviceFactory';
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
  private get siteUrl(): string {
    return config.sharepoint.siteUrl;
  }

  private async getRequestDigest(): Promise<string> {
    const token = await authService.getGraphToken();
    const response = await fetch(`${this.siteUrl}/_api/contextinfo`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json;odata=verbose',
      },
    });
    const data = await response.json();
    return data.d.GetContextWebInformation.FormDigestValue;
  }

  private async listExists(listTitle: string): Promise<boolean> {
    try {
      const token = await authService.getGraphToken();
      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  private async createList(title: string, description: string): Promise<void> {
    const token = await authService.getGraphToken();
    const digest = await this.getRequestDigest();

    const response = await fetch(`${this.siteUrl}/_api/web/lists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json;odata=verbose',
        'Content-Type': 'application/json;odata=verbose',
        'X-RequestDigest': digest,
      },
      body: JSON.stringify({
        __metadata: { type: 'SP.List' },
        Title: title,
        Description: description,
        BaseTemplate: 100, // Generic List
        AllowContentTypes: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create list ${title}: ${error}`);
    }
  }

  private async addField(listTitle: string, field: FieldDefinition): Promise<void> {
    const token = await authService.getGraphToken();
    const digest = await this.getRequestDigest();

    let fieldXml = '';

    switch (field.type) {
      case 'Text':
        fieldXml = `<Field Type="Text" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" />`;
        break;
      case 'Note':
        fieldXml = `<Field Type="Note" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" NumLines="6" RichText="FALSE" />`;
        break;
      case 'Number':
        fieldXml = `<Field Type="Number" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" />`;
        break;
      case 'Currency':
        fieldXml = `<Field Type="Currency" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" LCID="7177" />`;
        break;
      case 'DateTime':
        fieldXml = `<Field Type="DateTime" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}" Format="DateTime" />`;
        break;
      case 'Boolean':
        fieldXml = `<Field Type="Boolean" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}"><Default>${field.defaultValue || '0'}</Default></Field>`;
        break;
      case 'Choice':
        const choicesXml = field.choices?.map((c) => `<CHOICE>${c}</CHOICE>`).join('') || '';
        const defaultXml = field.defaultValue ? `<Default>${field.defaultValue}</Default>` : '';
        fieldXml = `<Field Type="Choice" DisplayName="${field.displayName}" Name="${field.internalName}" Required="${field.required ? 'TRUE' : 'FALSE'}"><CHOICES>${choicesXml}</CHOICES>${defaultXml}</Field>`;
        break;
    }

    const response = await fetch(
      `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/fields/createfieldasxml`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify({
          parameters: {
            __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' },
            SchemaXml: fieldXml,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`[DWx Provisioning] Failed to add field ${field.internalName}:`, error);
      // Don't throw - field might already exist
    }
  }

  private async provisionList(definition: ListDefinition): Promise<ProvisionResult> {
    try {
      // Check if list already exists
      const exists = await this.listExists(definition.title);
      if (exists) {
        return { success: true, message: `List "${definition.title}" already exists` };
      }

      // Create the list
      await this.createList(definition.title, definition.description);

      // Add fields
      for (const field of definition.fields) {
        await this.addField(definition.title, field);
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
          choices: ['ServiceRequest', 'Client', 'Specialist', 'Service', 'User'],
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

  // ==================== PUBLIC METHODS ====================

  /**
   * Check which DWx lists exist
   */
  async checkListsStatus(): Promise<ListStatus[]> {
    const listNames = ['DWxServices', 'DWxServiceRequests', 'DWxClients', 'DWxSpecialists', 'DWxAuditLog'];
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
   * Create the DWxSupportingDocuments document library
   */
  async provisionDocumentLibrary(): Promise<ProvisionResult> {
    try {
      const libraryName = 'DWxSupportingDocuments';

      // Check if library already exists
      const exists = await this.listExists(libraryName);
      if (exists) {
        return { success: true, message: `Document library "${libraryName}" already exists` };
      }

      const token = await authService.getGraphToken();
      const digest = await this.getRequestDigest();

      const response = await fetch(`${this.siteUrl}/_api/web/lists`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.List' },
          Title: libraryName,
          Description: 'Supporting documents for DWx service requests (RFPs, requirements, proposals)',
          BaseTemplate: 101, // Document Library
          AllowContentTypes: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create document library: ${error}`);
      }

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
      { name: 'DWxClients', provision: () => this.provisionClientsList() },
      { name: 'DWxSpecialists', provision: () => this.provisionSpecialistsList() },
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
      const token = await authService.getGraphToken();
      const digest = await this.getRequestDigest();

      for (const service of DW_SERVICES_SEED_DATA) {
        try {
          const response = await fetch(
            `${this.siteUrl}/_api/web/lists/getbytitle('DWxServices')/items`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json;odata=verbose',
                'Content-Type': 'application/json;odata=verbose',
                'X-RequestDigest': digest,
              },
              body: JSON.stringify({
                __metadata: { type: 'SP.Data.DWxServicesListItem' },
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
              }),
            }
          );

          if (!response.ok) {
            const error = await response.text();
            results.push({ service: service.Title, success: false, message: error });
          } else {
            results.push({ service: service.Title, success: true, message: 'Created successfully' });
          }
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
      const token = await authService.getGraphToken();

      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/fields?$filter=Hidden eq false&$select=InternalName,Title,TypeAsString&$orderby=Title`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );

      if (!response.ok) {
        console.error('Failed to get list fields:', await response.text());
        return [];
      }

      const data = await response.json();
      return data.d.results.map((f: { InternalName: string; Title: string; TypeAsString: string }) => ({
        internalName: f.InternalName,
        title: f.Title,
        typeAsString: f.TypeAsString,
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
      const token = await authService.getGraphToken();

      const response = await fetch(
        `${this.siteUrl}/_api/web/lists/getbytitle('${listTitle}')/ItemCount`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json;odata=verbose',
          },
        }
      );

      if (!response.ok) {
        return 0;
      }

      const data = await response.json();
      return data.d.ItemCount || 0;
    } catch {
      return 0;
    }
  }
}

export const dwxSharePointProvisioningService = new DWxSharePointProvisioningService();
