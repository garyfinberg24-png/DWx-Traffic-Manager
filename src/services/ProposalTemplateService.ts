/**
 * ProposalTemplateService - Fetches .docx proposal templates from SharePoint
 *
 * Downloads physical Word template files from the DWxSupportingDocuments library
 * and returns them as ArrayBuffer for use with docxtemplater/PizZip.
 */

import { getAuthService } from './serviceFactory';
import { config } from '../config/environmentConfig';

const authService = getAuthService();

/** Template file configuration */
export interface TemplateFileConfig {
  /** Display name shown in the UI */
  name: string;
  /** Path within DWxSupportingDocuments library */
  path: string;
}

/**
 * Known proposal templates in the document library.
 * The generic template is the default; additional corporate templates
 * can be added here as they are uploaded to SharePoint.
 */
export const PROPOSAL_TEMPLATE_FILES: TemplateFileConfig[] = [
  {
    name: 'DWx Proposal Template v1',
    path: 'ProposalTemplates/DWx Proposal Template v1.docx',
  },
];

/**
 * Default template path used when no specific template is selected
 * or when the selected template cannot be found.
 */
const DEFAULT_TEMPLATE_PATH = PROPOSAL_TEMPLATE_FILES[0].path;

class ProposalTemplateService {
  private driveIdCache: string | null = null;

  /**
   * Get the drive ID for the document library.
   * Cached after first successful lookup.
   */
  private async getDriveId(): Promise<string | null> {
    if (this.driveIdCache) return this.driveIdCache;

    try {
      const token = await authService.getGraphToken();
      const siteUrl = config.sharepoint.siteUrl;
      const libraryName = config.sharepoint.documentLibrary;

      const url = new URL(siteUrl);
      const hostname = url.hostname;
      const sitePath = url.pathname;

      const drivesResponse = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}:/drives`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!drivesResponse.ok) {
        console.error('[ProposalTemplateService] Failed to get drives:', await drivesResponse.text());
        return null;
      }

      const drivesData = await drivesResponse.json();
      const drive = drivesData.value?.find(
        (d: { name: string }) => d.name === libraryName
      );

      if (!drive) {
        console.error(`[ProposalTemplateService] Document library '${libraryName}' not found`);
        return null;
      }

      this.driveIdCache = drive.id as string;
      return this.driveIdCache;
    } catch (error) {
      console.error('[ProposalTemplateService] getDriveId failed:', error);
      return null;
    }
  }

  /**
   * Download a .docx template from SharePoint as an ArrayBuffer.
   * Returns null if the file doesn't exist or download fails.
   */
  async fetchTemplate(templatePath?: string): Promise<ArrayBuffer | null> {
    const path = templatePath || DEFAULT_TEMPLATE_PATH;

    try {
      const driveId = await this.getDriveId();
      if (!driveId) return null;

      const token = await authService.getGraphToken();
      const contentUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURI(path)}:/content`;

      const response = await fetch(contentUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error(`[ProposalTemplateService] Failed to download template '${path}':`, response.status, response.statusText);
        return null;
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error(`[ProposalTemplateService] fetchTemplate failed for '${path}':`, error);
      return null;
    }
  }

  /**
   * Check if a template file exists in the document library.
   */
  async templateExists(templatePath?: string): Promise<boolean> {
    const path = templatePath || DEFAULT_TEMPLATE_PATH;

    try {
      const driveId = await this.getDriveId();
      if (!driveId) return false;

      const token = await authService.getGraphToken();
      const metadataUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURI(path)}`;

      const response = await fetch(metadataUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * List available template files from the Templates folder.
   */
  async listTemplateFiles(): Promise<{ name: string; path: string }[]> {
    try {
      const driveId = await this.getDriveId();
      if (!driveId) return [];

      const token = await authService.getGraphToken();
      const folderUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/ProposalTemplates:/children?$filter=endswith(name,'.docx')`;

      const response = await fetch(folderUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return (data.value || []).map((item: { name: string }) => ({
        name: item.name.replace('.docx', ''),
        path: `ProposalTemplates/${item.name}`,
      }));
    } catch {
      return [];
    }
  }
}

export const proposalTemplateService = new ProposalTemplateService();
