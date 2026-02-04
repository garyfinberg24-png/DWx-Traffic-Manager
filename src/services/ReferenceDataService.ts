import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';

// Get the appropriate graph service based on test mode
const graphService = getGraphService();
import {
  TeamMember,
  TeamMemberInput,
  TeamMemberRole,
  Client,
  ClientInput,
  ClientContractStatus,
  ClientIndustry,
} from '../types/ReferenceData';

// Interface for Graph API list item response
interface GraphListItem {
  id: string;
  fields: Record<string, unknown>;
}

class ReferenceDataService {
  private readonly teamMembersListName = 'TeamMembers';
  private readonly clientsListName = 'Clients';

  // ==================== TEAM MEMBERS ====================

  async getTeamMembers(activeOnly = false): Promise<TeamMember[]> {
    try {
      const items = (await graphService.getListItems(this.teamMembersListName, {
        top: 500,
      })) as GraphListItem[];

      let teamMembers = items.map((item) => this.transformTeamMemberItem(item));

      if (activeOnly) {
        teamMembers = teamMembers.filter((tm) => tm.IsActive === true);
      }

      // Sort by Title
      teamMembers.sort((a, b) => a.Title.localeCompare(b.Title));

      return teamMembers;
    } catch (error) {
      this.handleError(error, 'Failed to fetch team members');
      throw error;
    }
  }

  async getTeamMemberById(id: number): Promise<TeamMember> {
    try {
      const item = (await graphService.getListItemById(
        this.teamMembersListName,
        id
      )) as GraphListItem;
      return this.transformTeamMemberItem(item);
    } catch (error) {
      this.handleError(error, `Failed to fetch team member ${id}`);
      throw error;
    }
  }

  async getTeamMembersByRole(role: TeamMemberRole, activeOnly = true): Promise<TeamMember[]> {
    try {
      const items = (await graphService.getListItems(this.teamMembersListName, {
        top: 500,
      })) as GraphListItem[];

      let teamMembers = items.map((item) => this.transformTeamMemberItem(item));

      // Filter by role
      teamMembers = teamMembers.filter((tm) => tm.Role === role);

      if (activeOnly) {
        teamMembers = teamMembers.filter((tm) => tm.IsActive === true);
      }

      // Sort by Title
      teamMembers.sort((a, b) => a.Title.localeCompare(b.Title));

      return teamMembers;
    } catch (error) {
      this.handleError(error, `Failed to fetch team members with role ${role}`);
      throw error;
    }
  }

  async createTeamMember(data: TeamMemberInput): Promise<TeamMember> {
    try {
      const fields: Record<string, unknown> = {
        Title: data.Title,
        Email: data.Email,
        Phone: data.Phone || null,
        Role: data.Role,
        Department: data.Department || null,
        IsActive: data.IsActive,
      };

      const result = await graphService.createListItem(this.teamMembersListName, fields);
      const created = await this.getTeamMemberById(parseInt(result.id));

      // Audit log
      await auditService.logCreate(
        'TeamMember',
        created.Id,
        created.Title,
        data as unknown as Record<string, unknown>
      );

      return created;
    } catch (error) {
      this.handleError(error, 'Failed to create team member');
      throw error;
    }
  }

  async updateTeamMember(id: number, data: Partial<TeamMemberInput>): Promise<TeamMember> {
    try {
      // Get existing record for audit comparison
      const existing = await this.getTeamMemberById(id);

      const fields: Record<string, unknown> = {};

      if (data.Title !== undefined) fields.Title = data.Title;
      if (data.Email !== undefined) fields.Email = data.Email;
      if (data.Phone !== undefined) fields.Phone = data.Phone || null;
      if (data.Role !== undefined) fields.Role = data.Role;
      if (data.Department !== undefined) fields.Department = data.Department || null;
      if (data.IsActive !== undefined) fields.IsActive = data.IsActive;

      await graphService.updateListItem(this.teamMembersListName, id, fields);
      const updated = await this.getTeamMemberById(id);

      // Audit log
      await auditService.logUpdate(
        'TeamMember',
        id,
        updated.Title,
        existing as unknown as Record<string, unknown>,
        data as Record<string, unknown>
      );

      return updated;
    } catch (error) {
      this.handleError(error, `Failed to update team member ${id}`);
      throw error;
    }
  }

  async deleteTeamMember(id: number): Promise<void> {
    try {
      // Get existing record for audit
      const existing = await this.getTeamMemberById(id);

      await graphService.deleteListItem(this.teamMembersListName, id);

      // Audit log
      await auditService.logDelete(
        'TeamMember',
        id,
        existing.Title,
        existing as unknown as Record<string, unknown>
      );
    } catch (error) {
      this.handleError(error, `Failed to delete team member ${id}`);
      throw error;
    }
  }

  // ==================== CLIENTS ====================

  async getClients(activeOnly = false): Promise<Client[]> {
    try {
      const items = (await graphService.getListItems(this.clientsListName, {
        top: 500,
      })) as GraphListItem[];

      let clients = items.map((item) => this.transformClientItem(item));

      if (activeOnly) {
        clients = clients.filter((c) => c.ContractStatus === 'Active');
      }

      // Sort by Title
      clients.sort((a, b) => a.Title.localeCompare(b.Title));

      return clients;
    } catch (error) {
      this.handleError(error, 'Failed to fetch clients');
      throw error;
    }
  }

  async getClientById(id: number): Promise<Client> {
    try {
      const item = (await graphService.getListItemById(this.clientsListName, id)) as GraphListItem;
      return this.transformClientItem(item);
    } catch (error) {
      this.handleError(error, `Failed to fetch client ${id}`);
      throw error;
    }
  }

  async getClientsByStatus(status: ClientContractStatus): Promise<Client[]> {
    try {
      const items = (await graphService.getListItems(this.clientsListName, {
        top: 500,
      })) as GraphListItem[];

      const clients = items
        .map((item) => this.transformClientItem(item))
        .filter((c) => c.ContractStatus === status);

      // Sort by Title
      clients.sort((a, b) => a.Title.localeCompare(b.Title));

      return clients;
    } catch (error) {
      this.handleError(error, `Failed to fetch clients with status ${status}`);
      throw error;
    }
  }

  async getPremiumClients(): Promise<Client[]> {
    try {
      const items = (await graphService.getListItems(this.clientsListName, {
        top: 500,
      })) as GraphListItem[];

      const clients = items
        .map((item) => this.transformClientItem(item))
        .filter((c) => c.IsPremium === true);

      // Sort by Title
      clients.sort((a, b) => a.Title.localeCompare(b.Title));

      return clients;
    } catch (error) {
      this.handleError(error, 'Failed to fetch premium clients');
      throw error;
    }
  }

  async createClient(data: ClientInput, accountManagerName?: string): Promise<Client> {
    try {
      // Only include fields with values - SharePoint doesn't handle null well
      const fields: Record<string, unknown> = {
        Title: data.Title,
        ContractStatus: data.ContractStatus || 'Active',
        IsPremium: data.IsPremium ?? false,
      };

      // Add optional fields only if they have values
      if (data.PrimaryContactName) fields.PrimaryContactName = data.PrimaryContactName;
      if (data.PrimaryContactEmail) fields.PrimaryContactEmail = data.PrimaryContactEmail;
      if (data.Phone) fields.Phone = data.Phone;
      if (data.Industry) fields.Industry = data.Industry;
      if (data.AccountManagerEmail) fields.AccountManagerEmail = data.AccountManagerEmail;
      if (accountManagerName) fields.AccountManagerName = accountManagerName;
      if (data.BusinessUnit) fields.BusinessUnit = data.BusinessUnit;
      if (data.Notes) fields.Notes = data.Notes;

      const result = await graphService.createListItem(this.clientsListName, fields);
      const created = await this.getClientById(parseInt(result.id));

      // Audit log
      await auditService.logCreate('Client', created.Id, created.Title, {
        ...data,
        accountManagerName,
      } as Record<string, unknown>);

      return created;
    } catch (error) {
      this.handleError(error, 'Failed to create client');
      throw error;
    }
  }

  async updateClient(
    id: number,
    data: Partial<ClientInput>,
    accountManagerName?: string
  ): Promise<Client> {
    try {
      // Get existing record for audit comparison
      const existing = await this.getClientById(id);

      const fields: Record<string, unknown> = {};

      if (data.Title !== undefined) fields.Title = data.Title;
      if (data.PrimaryContactName !== undefined) fields.PrimaryContactName = data.PrimaryContactName;
      if (data.PrimaryContactEmail !== undefined)
        fields.PrimaryContactEmail = data.PrimaryContactEmail;
      if (data.Phone !== undefined) fields.Phone = data.Phone || null;
      if (data.Industry !== undefined) fields.Industry = data.Industry || null;
      if (data.IsPremium !== undefined) fields.IsPremium = data.IsPremium;
      if (data.AccountManagerEmail !== undefined) {
        fields.AccountManagerEmail = data.AccountManagerEmail || null;
        fields.AccountManagerName = accountManagerName || null;
      }
      if (data.ContractStatus !== undefined) fields.ContractStatus = data.ContractStatus;
      if (data.BusinessUnit !== undefined) fields.BusinessUnit = data.BusinessUnit || null;
      if (data.Notes !== undefined) fields.Notes = data.Notes || null;

      await graphService.updateListItem(this.clientsListName, id, fields);
      const updated = await this.getClientById(id);

      // Audit log
      await auditService.logUpdate(
        'Client',
        id,
        updated.Title,
        existing as unknown as Record<string, unknown>,
        data as Record<string, unknown>
      );

      return updated;
    } catch (error) {
      this.handleError(error, `Failed to update client ${id}`);
      throw error;
    }
  }

  async deleteClient(id: number): Promise<void> {
    try {
      // Get existing record for audit
      const existing = await this.getClientById(id);

      await graphService.deleteListItem(this.clientsListName, id);

      // Audit log
      await auditService.logDelete(
        'Client',
        id,
        existing.Title,
        existing as unknown as Record<string, unknown>
      );
    } catch (error) {
      this.handleError(error, `Failed to delete client ${id}`);
      throw error;
    }
  }

  // ==================== TRANSFORMERS ====================

  private transformTeamMemberItem(item: GraphListItem): TeamMember {
    const fields = item.fields || {};
    return {
      Id: parseInt(item.id) || (fields.id as number),
      Title: (fields.Title as string) || '',
      Email: (fields.Email as string) || '',
      Phone: fields.Phone as string | undefined,
      Role: (fields.Role as TeamMemberRole) || 'Team Member',
      Department: fields.Department as string | undefined,
      IsActive: (fields.IsActive as boolean) ?? true,
      Created: fields.Created as string,
      Modified: fields.Modified as string,
    };
  }

  private transformClientItem(item: GraphListItem): Client {
    const fields = item.fields || {};
    return {
      Id: parseInt(item.id) || (fields.id as number),
      Title: (fields.Title as string) || '',
      PrimaryContactName: (fields.PrimaryContactName as string) || '',
      PrimaryContactEmail: (fields.PrimaryContactEmail as string) || '',
      Phone: fields.Phone as string | undefined,
      Industry: fields.Industry as ClientIndustry | undefined,
      IsPremium: (fields.IsPremium as boolean) || false,
      AccountManagerEmail: fields.AccountManagerEmail as string | undefined,
      AccountManagerName: fields.AccountManagerName as string | undefined,
      ContractStatus: (fields.ContractStatus as ClientContractStatus) || 'Active',
      BusinessUnit: fields.BusinessUnit as string | undefined,
      Notes: fields.Notes as string | undefined,
      Created: fields.Created as string,
      Modified: fields.Modified as string,
    };
  }

  // ==================== ERROR HANDLING ====================

  private handleError(error: unknown, message: string): void {
    console.error(message, error);

    if (error instanceof Error) {
      // Check for common Graph API error patterns
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error('You do not have permission to access this resource');
      } else if (errorMessage.includes('404')) {
        throw new Error('Resource not found. Please check if the SharePoint list exists.');
      } else if (errorMessage.includes('429')) {
        throw new Error('Too many requests. Please try again later');
      }
    }

    throw new Error(message);
  }
}

export const referenceDataService = new ReferenceDataService();
