/**
 * DocumentService - Handles SharePoint document library operations
 *
 * Retrieves documents from SharePoint document library for email attachments
 * Used for attaching product documents to booking notifications
 */

import { getAuthService } from './serviceFactory';
import { config } from '../config/environmentConfig';

// Get the appropriate auth service based on test mode
const authService = getAuthService();

export interface DocumentInfo {
  name: string;
  contentType: string;
  contentBytes: string; // Base64 encoded
  size: number;
}

export interface BookingDocumentConfig {
  fileName: string;
  path: string;
  contentType: string;
}

// Document configuration for different booking types
// Primary documents are automatically attached based on booking type
export const BOOKING_DOCUMENTS: Record<'Demo' | 'Deployment', BookingDocumentConfig> = {
  Demo: {
    fileName: 'DWx Service Catalog.pdf',
    path: 'DWx%20Service%20Catalog.pdf',
    contentType: 'application/pdf',
  },
  Deployment: {
    fileName: 'DWx Setup Requirements.docx',
    path: 'DWx%20Setup%20Requirements.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
};

// Additional documents that can be optionally attached to any booking
// Add new documents here as needed
export const ADDITIONAL_DOCUMENTS: Record<string, BookingDocumentConfig> = {
  // Example: Add more documents here
  // 'pricing': {
  //   fileName: 'DWx Pricing Guide.pdf',
  //   path: 'DWx%20Pricing%20Guide.pdf',
  //   contentType: 'application/pdf',
  // },
};

class DocumentService {
  /**
   * Get document from SharePoint document library
   * Returns the document as base64 for email attachment
   */
  async getDocument(documentPath: string): Promise<DocumentInfo | null> {
    try {
      const token = await authService.getGraphToken();
      const siteUrl = config.sharepoint.siteUrl;
      const libraryName = config.sharepoint.documentLibrary;

      // Parse site URL to get components
      const url = new URL(siteUrl);
      const hostname = url.hostname;
      const sitePath = url.pathname;

      // Build the document URL using SharePoint REST API
      // Format: /sites/{hostname}:{sitePath}:/drives/{libraryName}/root:/{documentPath}:/content
      const driveEndpoint = `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}:/drives`;

      // First, get the drive ID for the document library
      const drivesResponse = await fetch(driveEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!drivesResponse.ok) {
        console.error('Failed to get drives:', await drivesResponse.text());
        return null;
      }

      const drivesData = await drivesResponse.json();
      const drive = drivesData.value?.find(
        (d: { name: string }) => d.name === libraryName
      );

      if (!drive) {
        console.error(`Document library '${libraryName}' not found`);
        return null;
      }

      // Get the document content
      const documentUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${documentPath}:/content`;

      const documentResponse = await fetch(documentUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!documentResponse.ok) {
        console.error('Failed to get document:', await documentResponse.text());
        return null;
      }

      // Get document as blob and convert to base64
      const blob = await documentResponse.blob();
      const contentBytes = await this.blobToBase64(blob);

      // Extract filename from path (decode URL encoding)
      const fileName = decodeURIComponent(documentPath.split('/').pop() || documentPath);

      return {
        name: fileName,
        contentType: blob.type || 'application/octet-stream',
        contentBytes,
        size: blob.size,
      };
    } catch (error) {
      console.error('Failed to get document from SharePoint:', error);
      return null;
    }
  }

  /**
   * Get the appropriate document for a booking type
   */
  async getBookingDocument(bookingType: 'Demo' | 'Deployment'): Promise<DocumentInfo | null> {
    const docConfig = BOOKING_DOCUMENTS[bookingType];
    if (!docConfig) {
      console.warn(`No document configured for booking type: ${bookingType}`);
      return null;
    }

    const document = await this.getDocument(docConfig.path);

    if (document) {
      // Override content type with known type
      document.contentType = docConfig.contentType;
      document.name = docConfig.fileName;
    }

    return document;
  }

  /**
   * Get an additional document by key
   */
  async getAdditionalDocument(documentKey: string): Promise<DocumentInfo | null> {
    const docConfig = ADDITIONAL_DOCUMENTS[documentKey];
    if (!docConfig) {
      console.warn(`No additional document configured for key: ${documentKey}`);
      return null;
    }

    const document = await this.getDocument(docConfig.path);

    if (document) {
      document.contentType = docConfig.contentType;
      document.name = docConfig.fileName;
    }

    return document;
  }

  /**
   * Get multiple documents at once
   * Returns all successfully retrieved documents (skips failures)
   */
  async getMultipleDocuments(documentPaths: string[]): Promise<DocumentInfo[]> {
    const results = await Promise.all(
      documentPaths.map((path) => this.getDocument(path))
    );

    return results.filter((doc): doc is DocumentInfo => doc !== null);
  }

  /**
   * Get booking document plus any additional documents
   * @param bookingType - The booking type (Demo or Deployment)
   * @param additionalDocKeys - Array of additional document keys to include
   */
  async getBookingDocuments(
    bookingType: 'Demo' | 'Deployment',
    additionalDocKeys: string[] = []
  ): Promise<DocumentInfo[]> {
    const documents: DocumentInfo[] = [];

    // Get primary booking document
    const primaryDoc = await this.getBookingDocument(bookingType);
    if (primaryDoc) {
      documents.push(primaryDoc);
    }

    // Get additional documents
    for (const key of additionalDocKeys) {
      const additionalDoc = await this.getAdditionalDocument(key);
      if (additionalDoc) {
        documents.push(additionalDoc);
      }
    }

    return documents;
  }

  /**
   * List available additional document keys
   */
  getAvailableAdditionalDocuments(): string[] {
    return Object.keys(ADDITIONAL_DOCUMENTS);
  }

  /**
   * Convert blob to base64 string (without data URL prefix)
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Check if a document exists in the library
   */
  async documentExists(documentPath: string): Promise<boolean> {
    try {
      const token = await authService.getGraphToken();
      const siteUrl = config.sharepoint.siteUrl;
      const libraryName = config.sharepoint.documentLibrary;

      const url = new URL(siteUrl);
      const hostname = url.hostname;
      const sitePath = url.pathname;

      // Get drives
      const drivesResponse = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${hostname}:${sitePath}:/drives`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!drivesResponse.ok) return false;

      const drivesData = await drivesResponse.json();
      const drive = drivesData.value?.find(
        (d: { name: string }) => d.name === libraryName
      );

      if (!drive) return false;

      // Check if document exists (metadata only, no content download)
      const metadataUrl = `https://graph.microsoft.com/v1.0/drives/${drive.id}/root:/${documentPath}`;
      const metadataResponse = await fetch(metadataUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return metadataResponse.ok;
    } catch {
      return false;
    }
  }
}

export const documentService = new DocumentService();
