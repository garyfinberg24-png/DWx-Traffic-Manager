/**
 * DWx Traffic Manager - Email Tracking Service
 * Logs sent emails to the EmailThread_JSON column on DWxServiceRequests.
 * Silent failure pattern -- never throws, logs errors to console.
 */

import { EmailRecord, EmailType } from '../types/EmailTracking';
import { getGraphService } from './serviceFactory';
import { config } from '../config/environmentConfig';

class EmailTrackingService {
  /**
   * Log a sent email to the request's email thread.
   * Reads current thread, appends new record, writes back.
   */
  async logEmail(
    requestId: number,
    record: Omit<EmailRecord, 'id'>
  ): Promise<void> {
    try {
      const graphService = getGraphService();
      const listName = config.sharepoint.listName;

      // Read current item to get existing EmailThread_JSON
      const item = (await graphService.getListItemById(listName, requestId)) as {
        id: string;
        fields?: { EmailThread_JSON?: string };
      };

      let existingThread: EmailRecord[] = [];
      if (item?.fields?.EmailThread_JSON) {
        try {
          existingThread = JSON.parse(item.fields.EmailThread_JSON);
        } catch {
          existingThread = [];
        }
      }

      // Append new record with generated UUID
      const newRecord: EmailRecord = {
        ...record,
        id: crypto.randomUUID(),
      };
      existingThread.push(newRecord);

      // Write back (retry without EmailThread_JSON if column not provisioned)
      try {
        await graphService.updateListItem(listName, requestId, {
          EmailThread_JSON: JSON.stringify(existingThread),
        });
      } catch (writeErr: unknown) {
        const errMsg = writeErr instanceof Error ? writeErr.message : String(writeErr);
        if (errMsg.includes('EmailThread_JSON') && (errMsg.includes('is not recognized') || errMsg.includes('invalid field'))) {
          // Column not provisioned yet — silently skip
          console.warn('[EmailTrackingService] EmailThread_JSON column not provisioned, skipping email log');
        } else {
          throw writeErr; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
      // Silent failure -- email tracking should never break notification flow
      console.error('[EmailTrackingService] logEmail failed:', error);
    }
  }

  /**
   * Retrieve all email records for a service request.
   */
  async getEmailsForRequest(requestId: number): Promise<EmailRecord[]> {
    try {
      const graphService = getGraphService();
      const listName = config.sharepoint.listName;

      const item = (await graphService.getListItemById(listName, requestId)) as {
        id: string;
        fields?: { EmailThread_JSON?: string };
      };

      if (item?.fields?.EmailThread_JSON) {
        const thread: EmailRecord[] = JSON.parse(item.fields.EmailThread_JSON);
        // Sort by sentAt descending (newest first)
        return thread.sort(
          (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
        );
      }

      return [];
    } catch (error) {
      console.error('[EmailTrackingService] getEmailsForRequest failed:', error);
      return [];
    }
  }
}

export const emailTrackingService = new EmailTrackingService();

// Re-export EmailType for consumers
export type { EmailType };
