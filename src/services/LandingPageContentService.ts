/**
 * DWx Traffic Manager - Landing Page Content Service
 * CRUD operations for landing page content stored in DWxLandingPageContent SharePoint list.
 * Uses key-value pattern: one row per content section with JSON payload.
 */

import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import { config } from '../config/environmentConfig';
import {
  ContentSectionKey,
  ContentSection,
  LandingPageContent,
  DEFAULT_LANDING_PAGE_CONTENT,
} from '../types/LandingPageContent';

const graphService = getGraphService();

interface GraphListItem {
  id: string;
  fields: Record<string, unknown>;
}

class LandingPageContentService {
  private listName = config.sharepoint.landingPageContentListName;

  /**
   * Parse a SharePoint list item into a ContentSection
   */
  private mapItem(item: GraphListItem): ContentSection {
    const fields = item.fields || {};
    return {
      Id: parseInt(item.id) || (fields.id as number),
      Title: (fields.Title as ContentSectionKey) || 'slogans',
      Content_JSON: (fields.Content_JSON as string) || '[]',
      SortOrder: (fields.SortOrder as number) || 0,
      IsActive: fields.IsActive !== false,
    };
  }

  /**
   * Parse JSON safely with fallback
   */
  private parseJson<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  /**
   * Fetch all content sections and build a complete LandingPageContent object.
   * Returns defaults for any missing/inactive sections.
   */
  async getAllContent(): Promise<LandingPageContent> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 50,
      })) as GraphListItem[];

      const sections = items.map((item) => this.mapItem(item));
      const activeSections = sections.filter((s) => s.IsActive);

      // Build content from active sections, falling back to defaults
      const content: LandingPageContent = { ...DEFAULT_LANDING_PAGE_CONTENT };

      for (const section of activeSections) {
        const key = section.Title;
        if (key in DEFAULT_LANDING_PAGE_CONTENT) {
          const parsed = this.parseJson(section.Content_JSON, DEFAULT_LANDING_PAGE_CONTENT[key]);
          (content as unknown as Record<string, unknown>)[key] = parsed;
        }
      }

      return content;
    } catch (error) {
      console.error('[LandingPageContentService] getAllContent failed, using defaults:', error);
      return { ...DEFAULT_LANDING_PAGE_CONTENT };
    }
  }

  /**
   * Fetch all raw content sections (for admin management)
   */
  async getAllSections(): Promise<ContentSection[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 50,
      })) as GraphListItem[];

      return items
        .map((item) => this.mapItem(item))
        .sort((a, b) => a.SortOrder - b.SortOrder);
    } catch (error) {
      console.error('[LandingPageContentService] getAllSections failed:', error);
      return [];
    }
  }

  /**
   * Fetch a single content section by key
   */
  async getSection<K extends ContentSectionKey>(key: K): Promise<LandingPageContent[K]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 50,
      })) as GraphListItem[];

      const sections = items.map((item) => this.mapItem(item));
      const section = sections.find((s) => s.Title === key && s.IsActive);

      if (section) {
        return this.parseJson(section.Content_JSON, DEFAULT_LANDING_PAGE_CONTENT[key]);
      }

      return DEFAULT_LANDING_PAGE_CONTENT[key];
    } catch (error) {
      console.error(`[LandingPageContentService] getSection(${key}) failed:`, error);
      return DEFAULT_LANDING_PAGE_CONTENT[key];
    }
  }

  /**
   * Update (or create) a content section.
   * Upserts: if a row with the given key exists, updates it; otherwise creates a new row.
   */
  async updateSection(key: ContentSectionKey, content: unknown): Promise<void> {
    try {
      const jsonContent = JSON.stringify(content);

      // Find existing row
      const items = (await graphService.getListItems(this.listName, {
        top: 50,
      })) as GraphListItem[];

      const sections = items.map((item) => this.mapItem(item));
      const existing = sections.find((s) => s.Title === key);

      if (existing && existing.Id) {
        // Update existing row
        const oldJson = existing.Content_JSON;
        await graphService.updateListItem(this.listName, existing.Id, {
          Content_JSON: jsonContent,
        });

        await auditService.logUpdate(
          'LandingPageContent',
          existing.Id,
          key,
          { Content_JSON: oldJson },
          { Content_JSON: jsonContent }
        );
      } else {
        // Create new row
        await graphService.createListItem(this.listName, {
          Title: key,
          Content_JSON: jsonContent,
          SortOrder: this.getSortOrder(key),
          IsActive: true,
        });

        await auditService.logCreate('LandingPageContent', key, key, {
          Content_JSON: jsonContent,
        });
      }
    } catch (error) {
      console.error(`[LandingPageContentService] updateSection(${key}) failed:`, error);
      throw error;
    }
  }

  /**
   * Toggle a section's IsActive flag
   */
  async toggleSection(sectionId: number, key: ContentSectionKey, isActive: boolean): Promise<void> {
    try {
      await graphService.updateListItem(this.listName, sectionId, {
        IsActive: isActive,
      });

      await auditService.logUpdate(
        'LandingPageContent',
        sectionId,
        key,
        { IsActive: !isActive },
        { IsActive: isActive }
      );
    } catch (error) {
      console.error(`[LandingPageContentService] toggleSection failed:`, error);
      throw error;
    }
  }

  /**
   * Get default sort order for a section key
   */
  private getSortOrder(key: ContentSectionKey): number {
    const order: Record<ContentSectionKey, number> = {
      mastheadText: 1,
      slogans: 2,
      stats: 3,
      whatWeDo: 4,
      testimonial: 5,
      teamPanelText: 6,
      teamMembers: 7,
      footerText: 8,
      footerServices: 9,
      footerProducts: 10,
      footerResources: 11,
    };
    return order[key] || 99;
  }
}

export const landingPageContentService = new LandingPageContentService();
