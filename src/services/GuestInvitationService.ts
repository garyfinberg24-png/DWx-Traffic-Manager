import { authService } from './AuthService';

export interface GuestInvitation {
  invitedUserEmailAddress: string;
  invitedUserDisplayName: string;
  inviteRedirectUrl: string;
  sendInvitationMessage: boolean;
  invitedUserMessageInfo?: {
    customizedMessageBody?: string;
  };
}

export interface InvitationResult {
  id: string;
  inviteRedeemUrl: string;
  invitedUserEmailAddress: string;
  invitedUserDisplayName: string;
  status: string;
  invitedUser?: {
    id: string;
  };
}

export interface PendingInvitation {
  id: string;
  invitedUserEmailAddress: string;
  invitedUserDisplayName: string;
  inviteRedeemUrl: string;
  status: string;
  invitedUserType: string;
  sendInvitationMessage: boolean;
}

export interface BulkInvitationEntry {
  email: string;
  displayName: string;
  customMessage?: string;
}

export interface BulkInvitationResult {
  email: string;
  displayName: string;
  success: boolean;
  error?: string;
  inviteRedeemUrl?: string;
}

class GuestInvitationService {
  private graphBaseUrl = 'https://graph.microsoft.com/v1.0';

  /**
   * Send a guest invitation to an external user
   */
  async sendInvitation(
    email: string,
    displayName: string,
    customMessage?: string
  ): Promise<InvitationResult> {
    const token = await authService.getGraphToken();

    const invitation: GuestInvitation = {
      invitedUserEmailAddress: email,
      invitedUserDisplayName: displayName,
      inviteRedirectUrl: 'https://wonderful-ocean-036cdeb10.4.azurestaticapps.net',
      sendInvitationMessage: true,
    };

    if (customMessage) {
      invitation.invitedUserMessageInfo = {
        customizedMessageBody: customMessage,
      };
    }

    const response = await fetch(`${this.graphBaseUrl}/invitations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invitation),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Failed to send invitation: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Get list of guest users in the tenant
   * Note: $orderby is not supported with $filter on userType, so we sort client-side
   */
  async getGuestUsers(): Promise<Array<{
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
    createdDateTime: string;
    externalUserState: string;
  }>> {
    const token = await authService.getGraphToken();

    // Note: Cannot use $orderby with $filter on userType - Graph API limitation
    const response = await fetch(
      `${this.graphBaseUrl}/users?$filter=userType eq 'Guest'&$select=id,displayName,mail,userPrincipalName,createdDateTime,externalUserState`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Failed to get guest users: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const guests = data.value || [];

    // Sort by displayName client-side since $orderby isn't supported with this filter
    return guests.sort((a: { displayName: string }, b: { displayName: string }) =>
      (a.displayName || '').localeCompare(b.displayName || '')
    );
  }

  /**
   * Resend invitation to a pending guest user
   */
  async resendInvitation(
    email: string,
    displayName: string,
    customMessage?: string
  ): Promise<InvitationResult> {
    // Resending is the same as sending a new invitation
    // Azure AD will update the existing invitation
    return this.sendInvitation(email, displayName, customMessage);
  }

  /**
   * Delete a guest user from the tenant
   * Note: Requires User.ReadWrite.All permission
   */
  async deleteGuestUser(userId: string): Promise<void> {
    const token = await authService.getGraphToken();

    const response = await fetch(`${this.graphBaseUrl}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `Failed to delete guest user: ${response.status}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Send bulk invitations from a list of entries
   * @param entries Array of invitation entries
   * @param customMessage Optional custom message for all invitations
   * @param onProgress Callback for progress updates
   */
  async sendBulkInvitations(
    entries: BulkInvitationEntry[],
    customMessage?: string,
    onProgress?: (current: number, total: number, result: BulkInvitationResult) => void
  ): Promise<BulkInvitationResult[]> {
    const results: BulkInvitationResult[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      try {
        const result = await this.sendInvitation(
          entry.email,
          entry.displayName,
          entry.customMessage || customMessage
        );

        const bulkResult: BulkInvitationResult = {
          email: entry.email,
          displayName: entry.displayName,
          success: true,
          inviteRedeemUrl: result.inviteRedeemUrl,
        };
        results.push(bulkResult);

        if (onProgress) {
          onProgress(i + 1, entries.length, bulkResult);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        const bulkResult: BulkInvitationResult = {
          email: entry.email,
          displayName: entry.displayName,
          success: false,
          error: errorMessage,
        };
        results.push(bulkResult);

        if (onProgress) {
          onProgress(i + 1, entries.length, bulkResult);
        }
      }

      // Add a small delay between invitations to avoid rate limiting
      if (i < entries.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return results;
  }

  /**
   * Parse a CSV file content into invitation entries
   * Expected format: email,displayName (with optional header row)
   */
  parseCSV(content: string): BulkInvitationEntry[] {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const entries: BulkInvitationEntry[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Skip header row if it looks like headers
      if (i === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
        continue;
      }

      // Parse CSV line (handle quoted values)
      const values = this.parseCSVLine(line);

      if (values.length >= 2) {
        const email = values[0].trim();
        const displayName = values[1].trim();

        // Basic email validation
        if (email && email.includes('@') && displayName) {
          entries.push({ email, displayName });
        }
      }
    }

    return entries;
  }

  /**
   * Parse a single CSV line, handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Parse Excel-like content (tab-separated or CSV)
   * This handles both CSV and TSV formats
   */
  parseSpreadsheet(content: string): BulkInvitationEntry[] {
    // Detect delimiter (tab or comma)
    const firstLine = content.split(/\r?\n/)[0];
    const hasTab = firstLine.includes('\t');

    if (hasTab) {
      // Parse as TSV
      const lines = content.split(/\r?\n/).filter(line => line.trim());
      const entries: BulkInvitationEntry[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Skip header row
        if (i === 0 && (line.toLowerCase().includes('email') || line.toLowerCase().includes('name'))) {
          continue;
        }

        const values = line.split('\t');

        if (values.length >= 2) {
          const email = values[0].trim();
          const displayName = values[1].trim();

          if (email && email.includes('@') && displayName) {
            entries.push({ email, displayName });
          }
        }
      }

      return entries;
    }

    // Default to CSV parsing
    return this.parseCSV(content);
  }
}

export const guestInvitationService = new GuestInvitationService();
