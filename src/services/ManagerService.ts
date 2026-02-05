import { getGraphService } from './serviceFactory';
import { FALLBACK_MANAGER_EMAILS } from '../types/User';
import { config } from '../config/environmentConfig';

// Get the appropriate graph service based on test mode
const graphService = getGraphService();

export interface Manager {
  id: number;
  email: string;
  displayName: string;
  addedBy: string;
  addedDate: string;
}

export interface ManagerInput {
  email: string;
  displayName: string;
}

const MANAGERS_LIST_NAME = config.sharepoint.managersListName;

class ManagerService {
  // Get all managers from SharePoint list via Graph API
  async getManagers(): Promise<Manager[]> {
    try {
      // Use Graph API to fetch list items
      const items = await graphService.getListItems(MANAGERS_LIST_NAME);

      const managers: Manager[] = items.map((item: unknown) => {
        const record = item as { id: string; fields: Record<string, unknown> };
        return {
          id: parseInt(record.id, 10),
          email: (record.fields.Email as string) || '',
          displayName: (record.fields.Title as string) || '', // Title column renamed to DisplayName
          addedBy: (record.fields.AddedBy as string) || '',
          addedDate: (record.fields.AddedDate as string) || '',
        };
      });

      // Merge with fallback managers (in case some are not in SharePoint yet)
      const spEmails = managers.map(m => m.email.toLowerCase()).filter(e => e);
      const fallbackManagers = FALLBACK_MANAGER_EMAILS
        .filter(email => !spEmails.includes(email.toLowerCase()))
        .map((email, index) => ({
          id: -(index + 1),
          email,
          displayName: email.split('@')[0],
          addedBy: 'System (Fallback)',
          addedDate: new Date().toISOString(),
        }));

      return [...managers, ...fallbackManagers];
    } catch (error) {
      console.error('[ManagerService] Error fetching managers:', error);
      // Return fallback on error
      return FALLBACK_MANAGER_EMAILS.map((email, index) => ({
        id: -(index + 1),
        email,
        displayName: email.split('@')[0],
        addedBy: 'System',
        addedDate: new Date().toISOString(),
      }));
    }
  }

  // Get all manager emails (for authorization checks)
  async getManagerEmails(): Promise<string[]> {
    const managers = await this.getManagers();
    return managers.map(m => m.email.toLowerCase());
  }

  // Add a new manager via Graph API
  async addManager(input: ManagerInput, addedBy: string): Promise<Manager> {
    console.log('[ManagerService] Adding manager:', input);

    try {
      // Use Graph API to create list item
      // Note: Title column was renamed to DisplayName in SharePoint UI, but internal name is still "Title"
      const fields = {
        Title: input.displayName,
        Email: input.email,
        AddedBy: addedBy,
        AddedDate: new Date().toISOString(),
      };

      console.log('[ManagerService] Creating item with fields:', fields);

      const result = await graphService.createListItem(MANAGERS_LIST_NAME, fields);

      console.log('[ManagerService] Manager added successfully, result:', JSON.stringify(result, null, 2));

      // Verify the item was created by checking the returned ID
      if (!result.id) {
        throw new Error('Item was created but no ID was returned');
      }

      return {
        id: parseInt(result.id, 10),
        email: (result.fields?.Email as string) || input.email,
        displayName: (result.fields?.Title as string) || input.displayName,
        addedBy: (result.fields?.AddedBy as string) || addedBy,
        addedDate: (result.fields?.AddedDate as string) || new Date().toISOString(),
      };
    } catch (error) {
      console.error('[ManagerService] Failed to add manager:', error);

      // Provide helpful error message
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('403') || message.includes('Access denied')) {
        throw new Error(`Permission denied. You may not have write access to the ${MANAGERS_LIST_NAME} list.`);
      } else if (message.includes('401') || message.includes('Unauthorized')) {
        throw new Error('Authentication failed. Please sign out and sign back in.');
      } else if (message.includes('404') || message.includes('not found')) {
        throw new Error(`The ${MANAGERS_LIST_NAME} list was not found. Please provision it from Admin > SP Provisioning.`);
      } else {
        throw new Error(`Failed to add manager: ${message}`);
      }
    }
  }

  // Remove a manager (only managers from SharePoint, not fallback)
  async removeManager(id: number): Promise<void> {
    if (id < 0) {
      throw new Error('Cannot remove fallback managers. Edit FALLBACK_MANAGER_EMAILS in User.ts to remove them.');
    }

    console.log('[ManagerService] Removing manager with ID:', id);

    try {
      await graphService.deleteListItem(MANAGERS_LIST_NAME, id);
      console.log('[ManagerService] Manager removed successfully');
    } catch (error) {
      console.error('[ManagerService] Failed to remove manager:', error);
      throw new Error('Failed to remove manager');
    }
  }

  // Check if an email is a manager
  async isManager(email: string): Promise<boolean> {
    const managerEmails = await this.getManagerEmails();
    return managerEmails.includes(email.toLowerCase());
  }
}

export const managerService = new ManagerService();
