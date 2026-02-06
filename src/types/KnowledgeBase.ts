/**
 * DWx Traffic Manager - Knowledge Base Types
 * Type definitions for the Knowledge Base, FAQ, and Glossary feature
 * stored in DWxKnowledgeBase SharePoint list.
 */

export type KBType = 'FAQ' | 'Glossary' | 'Article';

export type KBCategory =
  | 'General'
  | 'Services'
  | 'Products'
  | 'Process'
  | 'Technical'
  | 'Commercial';

export const KB_TYPES: KBType[] = ['FAQ', 'Glossary', 'Article'];
export const KB_CATEGORIES: KBCategory[] = ['General', 'Services', 'Products', 'Process', 'Technical', 'Commercial'];

export interface KBEntry {
  Id: number;
  Title: string;
  Content: string;
  Type: KBType;
  Category: KBCategory;
  Tags: string[];
  SortOrder: number;
  IsActive: boolean;
}

export interface KBEntryInput {
  Title: string;
  Content: string;
  Type: KBType;
  Category: KBCategory;
  Tags: string[];
  SortOrder: number;
  IsActive: boolean;
}
