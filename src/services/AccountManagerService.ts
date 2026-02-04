import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';

// Get the appropriate graph service based on test mode
const graphService = getGraphService();
import {
  AccountManager,
  AccountManagerInput,
  AccountManagerStatus,
  AccountManagerRegion,
  AccountManagerSource,
} from '../types/ReferenceData';

// Interface for Graph API list item response
interface GraphListItem {
  id: string;
  fields: Record<string, unknown>;
}

class AccountManagerService {
  private readonly listName = 'AccountManagers';

  // ==================== READ OPERATIONS ====================

  async getAccountManagers(activeOnly = false): Promise<AccountManager[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      let managers = items.map((item) => this.transformItem(item));

      if (activeOnly) {
        managers = managers.filter((m) => m.Status === 'Active');
      }

      // Sort by Title
      managers.sort((a, b) => a.Title.localeCompare(b.Title));

      return managers;
    } catch (error) {
      this.handleError(error, 'Failed to fetch account managers');
      throw error;
    }
  }

  async getAccountManagerById(id: number): Promise<AccountManager> {
    try {
      const item = (await graphService.getListItemById(this.listName, id)) as GraphListItem;
      return this.transformItem(item);
    } catch (error) {
      this.handleError(error, `Failed to fetch account manager ${id}`);
      throw error;
    }
  }

  async getAccountManagerByEmail(email: string): Promise<AccountManager | null> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      const managers = items.map((item) => this.transformItem(item));
      const found = managers.find((m) => m.Email === email);

      return found || null;
    } catch (error) {
      this.handleError(error, `Failed to fetch account manager by email ${email}`);
      throw error;
    }
  }

  async getAccountManagersByStatus(status: AccountManagerStatus): Promise<AccountManager[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      const managers = items
        .map((item) => this.transformItem(item))
        .filter((m) => m.Status === status);

      // Sort by Title
      managers.sort((a, b) => a.Title.localeCompare(b.Title));

      return managers;
    } catch (error) {
      this.handleError(error, `Failed to fetch account managers with status ${status}`);
      throw error;
    }
  }

  async getAccountManagersByRegion(
    region: AccountManagerRegion,
    activeOnly = true
  ): Promise<AccountManager[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      let managers = items
        .map((item) => this.transformItem(item))
        .filter((m) => m.Region === region);

      if (activeOnly) {
        managers = managers.filter((m) => m.Status === 'Active');
      }

      // Sort by Title
      managers.sort((a, b) => a.Title.localeCompare(b.Title));

      return managers;
    } catch (error) {
      this.handleError(error, `Failed to fetch account managers for region ${region}`);
      throw error;
    }
  }

  async getAccountManagersBySource(
    source: AccountManagerSource,
    activeOnly = true
  ): Promise<AccountManager[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      let managers = items
        .map((item) => this.transformItem(item))
        .filter((m) => m.Source === source);

      if (activeOnly) {
        managers = managers.filter((m) => m.Status === 'Active');
      }

      // Sort by Title
      managers.sort((a, b) => a.Title.localeCompare(b.Title));

      return managers;
    } catch (error) {
      this.handleError(error, `Failed to fetch ${source} account managers`);
      throw error;
    }
  }

  async getInternalAccountManagers(activeOnly = true): Promise<AccountManager[]> {
    return this.getAccountManagersBySource('Internal', activeOnly);
  }

  async getExternalAccountManagers(activeOnly = true): Promise<AccountManager[]> {
    return this.getAccountManagersBySource('External', activeOnly);
  }

  // ==================== CREATE OPERATION ====================

  async createAccountManager(data: AccountManagerInput): Promise<AccountManager> {
    try {
      // Minimal fields only - Title, Email, Status, Source
      const fields: Record<string, unknown> = {
        Title: data.Title,
        Email: data.Email,
        Status: data.Status || 'Active',
        Source: data.Source || 'Internal',
      };

      const result = await graphService.createListItem(this.listName, fields);
      console.log('[AccountManagerService] Created item with ID:', result.id);

      const created = await this.getAccountManagerById(parseInt(result.id));
      console.log('[AccountManagerService] Retrieved created AM:', created.Title);

      // Audit log
      await auditService.logCreate(
        'AccountManager',
        created.Id,
        created.Title,
        data as unknown as Record<string, unknown>
      );

      return created;
    } catch (error) {
      this.handleError(error, 'Failed to create account manager');
      throw error;
    }
  }

  // ==================== UPDATE OPERATION ====================

  async updateAccountManager(id: number, data: Partial<AccountManagerInput>): Promise<AccountManager> {
    try {
      // Get existing record for audit comparison
      const existing = await this.getAccountManagerById(id);

      const fields: Record<string, unknown> = {};

      if (data.Title !== undefined) fields.Title = data.Title;
      if (data.Email !== undefined) fields.Email = data.Email;
      // Note: MobilePhone column may not exist in SharePoint - merge into Phone
      if (data.Phone !== undefined || data.MobilePhone !== undefined) {
        fields.Phone = data.Phone || data.MobilePhone || null;
      }
      if (data.Department !== undefined) fields.Department = data.Department || null;
      if (data.JobTitle !== undefined) fields.JobTitle = data.JobTitle || null;
      if (data.Region !== undefined) fields.Region = data.Region || null;
      if (data.Status !== undefined) fields.Status = data.Status;
      if (data.Source !== undefined) fields.Source = data.Source;
      if (data.EntraUserId !== undefined) fields.EntraUserId = data.EntraUserId || null;
      if (data.ExternalTenant !== undefined) fields.ExternalTenant = data.ExternalTenant || null;
      if (data.Company !== undefined) fields.Company = data.Company || null;
      if (data.ManagerEmail !== undefined) fields.ManagerEmail = data.ManagerEmail || null;
      if (data.HireDate !== undefined) fields.HireDate = data.HireDate || null;
      if (data.Notes !== undefined) fields.Notes = data.Notes || null;

      await graphService.updateListItem(this.listName, id, fields);
      const updated = await this.getAccountManagerById(id);

      // Audit log
      await auditService.logUpdate(
        'AccountManager',
        id,
        updated.Title,
        existing as unknown as Record<string, unknown>,
        data as Record<string, unknown>
      );

      return updated;
    } catch (error) {
      this.handleError(error, `Failed to update account manager ${id}`);
      throw error;
    }
  }

  // ==================== DELETE OPERATION ====================

  async deleteAccountManager(id: number): Promise<void> {
    try {
      // Get existing record for audit
      const existing = await this.getAccountManagerById(id);

      await graphService.deleteListItem(this.listName, id);

      // Audit log
      await auditService.logDelete(
        'AccountManager',
        id,
        existing.Title,
        existing as unknown as Record<string, unknown>
      );
    } catch (error) {
      this.handleError(error, `Failed to delete account manager ${id}`);
      throw error;
    }
  }

  // ==================== SOFT DELETE (SET INACTIVE) ====================

  async deactivateAccountManager(id: number): Promise<AccountManager> {
    return this.updateAccountManager(id, { Status: 'Inactive' });
  }

  async activateAccountManager(id: number): Promise<AccountManager> {
    return this.updateAccountManager(id, { Status: 'Active' });
  }

  // ==================== SEARCH ====================

  async searchAccountManagers(searchText: string, activeOnly = true): Promise<AccountManager[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      const searchLower = searchText.toLowerCase();
      let managers = items
        .map((item) => this.transformItem(item))
        .filter(
          (m) =>
            m.Title.toLowerCase().includes(searchLower) ||
            m.Email.toLowerCase().includes(searchLower) ||
            (m.Company && m.Company.toLowerCase().includes(searchLower))
        );

      if (activeOnly) {
        managers = managers.filter((m) => m.Status === 'Active');
      }

      // Sort by Title
      managers.sort((a, b) => a.Title.localeCompare(b.Title));

      return managers;
    } catch (error) {
      this.handleError(error, 'Failed to search account managers');
      throw error;
    }
  }

  // ==================== TRANSFORMER ====================

  private transformItem(item: GraphListItem): AccountManager {
    const fields = item.fields || {};
    return {
      Id: parseInt(item.id) || (fields.id as number),
      Title: (fields.Title as string) || '',
      Email: (fields.Email as string) || '',
      Phone: fields.Phone as string | undefined,
      MobilePhone: fields.MobilePhone as string | undefined,
      Department: fields.Department as string | undefined,
      JobTitle: fields.JobTitle as string | undefined,
      Region: fields.Region as AccountManagerRegion | undefined,
      Status: (fields.Status as AccountManagerStatus) || 'Active',
      Source: (fields.Source as AccountManagerSource) || 'Internal',
      EntraUserId: fields.EntraUserId as string | undefined,
      ExternalTenant: fields.ExternalTenant as string | undefined,
      Company: fields.Company as string | undefined,
      ManagerEmail: fields.ManagerEmail as string | undefined,
      HireDate: fields.HireDate as string | undefined,
      Notes: fields.Notes as string | undefined,
      Created: fields.Created as string,
      Modified: fields.Modified as string,
    };
  }

  // ==================== ERROR HANDLING ====================

  private handleError(error: unknown, message: string): void {
    console.error(message, error);

    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error('You do not have permission to access this resource');
      } else if (errorMessage.includes('404')) {
        throw new Error('AccountManagers list not found. Please create the SharePoint list first.');
      } else if (errorMessage.includes('429')) {
        throw new Error('Too many requests. Please try again later');
      }
    }

    throw new Error(message);
  }
}

export const accountManagerService = new AccountManagerService();
