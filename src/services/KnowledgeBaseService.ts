/**
 * DWx Traffic Manager - Knowledge Base Service
 * CRUD operations for FAQ, Glossary, and Article entries
 * stored in the DWxKnowledgeBase SharePoint list.
 */

import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import { config } from '../config/environmentConfig';
import { KBEntry, KBEntryInput, KBType, KBCategory } from '../types/KnowledgeBase';

const graphService = getGraphService();

interface GraphListItem {
  id: string;
  fields: Record<string, unknown>;
}

class KnowledgeBaseService {
  private listName = config.sharepoint.knowledgeBaseListName;

  /**
   * Map a SharePoint list item to a KBEntry
   */
  private mapItem(item: GraphListItem): KBEntry {
    const fields = item.fields || {};

    let tags: string[] = [];
    if (fields.Tags_JSON) {
      try {
        tags = typeof fields.Tags_JSON === 'string'
          ? JSON.parse(fields.Tags_JSON)
          : (fields.Tags_JSON as string[]);
      } catch {
        tags = [];
      }
    }

    return {
      Id: parseInt(item.id) || (fields.id as number),
      Title: (fields.Title as string) || '',
      Content: (fields.Content as string) || '',
      Type: (fields.Type as KBType) || 'FAQ',
      Category: (fields.Category as KBCategory) || 'General',
      Tags: tags,
      SortOrder: (fields.SortOrder as number) || 0,
      IsActive: fields.IsActive !== false,
    };
  }

  /**
   * Fetch all KB entries (active only by default)
   */
  async getAll(includeInactive = false): Promise<KBEntry[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      let entries = items.map((item) => this.mapItem(item));

      if (!includeInactive) {
        entries = entries.filter((e) => e.IsActive);
      }

      return entries.sort((a, b) => a.SortOrder - b.SortOrder);
    } catch (error) {
      console.error('[KnowledgeBaseService] getAll failed:', error);
      return [];
    }
  }

  /**
   * Fetch entries filtered by type
   */
  async getByType(type: KBType): Promise<KBEntry[]> {
    const all = await this.getAll();
    return all.filter((e) => e.Type === type);
  }

  /**
   * Fetch entries filtered by category
   */
  async getByCategory(category: KBCategory): Promise<KBEntry[]> {
    const all = await this.getAll();
    return all.filter((e) => e.Category === category);
  }

  /**
   * Get a single entry by ID
   */
  async getById(id: number): Promise<KBEntry | null> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      const entries = items.map((item) => this.mapItem(item));
      return entries.find((e) => e.Id === id) || null;
    } catch (error) {
      console.error(`[KnowledgeBaseService] getById(${id}) failed:`, error);
      return null;
    }
  }

  /**
   * Create a new KB entry
   */
  async create(input: KBEntryInput): Promise<KBEntry> {
    try {
      const fields: Record<string, unknown> = {
        Title: input.Title,
        Content: input.Content,
        Type: input.Type,
        Category: input.Category,
        Tags_JSON: JSON.stringify(input.Tags),
        SortOrder: input.SortOrder,
        IsActive: input.IsActive,
      };

      const result = await graphService.createListItem(this.listName, fields);

      await auditService.logCreate('KnowledgeBase', (result as { id: string }).id || 'new', input.Title, {
        Type: input.Type,
        Category: input.Category,
      });

      return this.mapItem(result as GraphListItem);
    } catch (error) {
      console.error('[KnowledgeBaseService] create failed:', error);
      throw error;
    }
  }

  /**
   * Update an existing KB entry
   */
  async update(id: number, input: KBEntryInput): Promise<void> {
    try {
      const fields: Record<string, unknown> = {
        Title: input.Title,
        Content: input.Content,
        Type: input.Type,
        Category: input.Category,
        Tags_JSON: JSON.stringify(input.Tags),
        SortOrder: input.SortOrder,
        IsActive: input.IsActive,
      };

      await graphService.updateListItem(this.listName, id, fields);

      await auditService.logUpdate('KnowledgeBase', id, input.Title, undefined, {
        Type: input.Type,
        Category: input.Category,
        IsActive: input.IsActive,
      });
    } catch (error) {
      console.error(`[KnowledgeBaseService] update(${id}) failed:`, error);
      throw error;
    }
  }

  /**
   * Delete a KB entry
   */
  async delete(id: number, title: string): Promise<void> {
    try {
      await graphService.deleteListItem(this.listName, id);

      await auditService.logDelete('KnowledgeBase', id, title);
    } catch (error) {
      console.error(`[KnowledgeBaseService] delete(${id}) failed:`, error);
      throw error;
    }
  }

  /**
   * Toggle a KB entry's IsActive flag
   */
  async toggleActive(id: number, title: string, isActive: boolean): Promise<void> {
    try {
      await graphService.updateListItem(this.listName, id, { IsActive: isActive });

      await auditService.logUpdate('KnowledgeBase', id, title, { IsActive: !isActive }, { IsActive: isActive });
    } catch (error) {
      console.error(`[KnowledgeBaseService] toggleActive(${id}) failed:`, error);
      throw error;
    }
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
