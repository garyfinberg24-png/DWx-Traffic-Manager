import { Client } from '@microsoft/microsoft-graph-client';
import { authService } from './AuthService';
import { CalendarEvent } from '../types/ApiResponses';
import { config } from '../config/environmentConfig';
import { EntraUser } from '../types/ReferenceData';

// Re-export CalendarEvent for consumers
export type { CalendarEvent } from '../types/ApiResponses';

interface GroupMembership {
  id: string;
  displayName?: string;
}

interface GraphUser {
  id: string;
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
}

class GraphService {
  // Cache for site ID to prevent multiple API calls and race conditions
  private siteIdCache: string | null = null;
  private siteIdPromise: Promise<string> | null = null;

  private getClient(): Client {
    return Client.init({
      authProvider: async (done) => {
        try {
          const token = await authService.getGraphToken();
          done(null, token);
        } catch (error) {
          done(error as Error, null);
        }
      },
    });
  }

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const client = this.getClient();
      const calendarEmail = config.calendar.demoEmail;

      const response = await client
        .api(`/users/${calendarEmail}/calendar/events`)
        .select('id,subject,start,end,body,location,attendees')
        .filter(
          `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`
        )
        .orderby('start/dateTime')
        .get();

      return response.value;
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      throw new Error('Failed to retrieve calendar events');
    }
  }

  async createCalendarEvent(event: {
    subject: string;
    start: Date;
    end: Date;
    body?: string;
    location?: string;
    attendees?: string[];
  }): Promise<CalendarEvent> {
    try {
      const client = this.getClient();
      const calendarEmail = config.calendar.demoEmail;

      const eventPayload = {
        subject: event.subject,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'UTC',
        },
        body: event.body
          ? {
              contentType: 'HTML',
              content: event.body,
            }
          : undefined,
        location: event.location
          ? {
              displayName: event.location,
            }
          : undefined,
        attendees: event.attendees?.map((email) => ({
          emailAddress: {
            address: email,
          },
          type: 'required',
        })),
      };

      const response = await client.api(`/users/${calendarEmail}/calendar/events`).post(eventPayload);

      return response;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  // Create event in current user's calendar (for testing without shared mailbox)
  async createMyCalendarEvent(event: {
    subject: string;
    start: Date;
    end: Date;
    body?: string;
    location?: string;
    attendees?: string[];
  }): Promise<CalendarEvent> {
    try {
      const client = this.getClient();

      const eventPayload = {
        subject: event.subject,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'UTC',
        },
        body: event.body
          ? {
              contentType: 'HTML',
              content: event.body,
            }
          : undefined,
        location: event.location
          ? {
              displayName: event.location,
            }
          : undefined,
        attendees: event.attendees?.map((email) => ({
          emailAddress: {
            address: email,
          },
          type: 'required',
        })),
      };

      // Use /me/calendar/events for current user's calendar
      const response = await client.api('/me/calendar/events').post(eventPayload);

      return response;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      const client = this.getClient();
      const calendarEmail = config.calendar.demoEmail;

      await client.api(`/users/${calendarEmail}/calendar/events/${eventId}`).delete();
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  // Delete event from current user's calendar
  async deleteMyCalendarEvent(eventId: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.api(`/me/calendar/events/${eventId}`).delete();
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw new Error('Failed to delete calendar event');
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(
    eventId: string,
    updates: {
      subject?: string;
      start?: Date;
      end?: Date;
      body?: string;
      location?: string;
      attendees?: string[];
    }
  ): Promise<CalendarEvent> {
    try {
      const client = this.getClient();
      const calendarEmail = config.calendar.demoEmail;

      const updatePayload: Record<string, unknown> = {};

      if (updates.subject) {
        updatePayload.subject = updates.subject;
      }
      if (updates.start) {
        updatePayload.start = {
          dateTime: updates.start.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.end) {
        updatePayload.end = {
          dateTime: updates.end.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.body) {
        updatePayload.body = {
          contentType: 'HTML',
          content: updates.body,
        };
      }
      if (updates.location) {
        updatePayload.location = {
          displayName: updates.location,
        };
      }
      if (updates.attendees) {
        updatePayload.attendees = updates.attendees.map((email) => ({
          emailAddress: {
            address: email,
          },
          type: 'required',
        }));
      }

      const response = await client
        .api(`/users/${calendarEmail}/calendar/events/${eventId}`)
        .patch(updatePayload);

      return response;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Update an event in current user's calendar
   */
  async updateMyCalendarEvent(
    eventId: string,
    updates: {
      subject?: string;
      start?: Date;
      end?: Date;
      body?: string;
      location?: string;
      attendees?: string[];
    }
  ): Promise<CalendarEvent> {
    try {
      const client = this.getClient();

      const updatePayload: Record<string, unknown> = {};

      if (updates.subject) {
        updatePayload.subject = updates.subject;
      }
      if (updates.start) {
        updatePayload.start = {
          dateTime: updates.start.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.end) {
        updatePayload.end = {
          dateTime: updates.end.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.body) {
        updatePayload.body = {
          contentType: 'HTML',
          content: updates.body,
        };
      }
      if (updates.location) {
        updatePayload.location = {
          displayName: updates.location,
        };
      }
      if (updates.attendees) {
        updatePayload.attendees = updates.attendees.map((email) => ({
          emailAddress: {
            address: email,
          },
          type: 'required',
        }));
      }

      const response = await client.api(`/me/calendar/events/${eventId}`).patch(updatePayload);

      return response;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw new Error('Failed to update calendar event');
    }
  }

  /**
   * Check for calendar conflicts in a given time slot
   * Returns conflicting events if any exist
   */
  async checkCalendarConflicts(
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }> {
    try {
      const client = this.getClient();
      const calendarEmail = config.calendar.demoEmail;

      // Add buffer around the time slot to catch overlapping events
      const bufferStart = new Date(startTime.getTime() - 60000); // 1 minute before
      const bufferEnd = new Date(endTime.getTime() + 60000); // 1 minute after

      const response = await client
        .api(`/users/${calendarEmail}/calendar/events`)
        .select('id,subject,start,end,body,location,attendees')
        .filter(
          `start/dateTime lt '${bufferEnd.toISOString()}' and end/dateTime gt '${bufferStart.toISOString()}'`
        )
        .orderby('start/dateTime')
        .get();

      const events: CalendarEvent[] = response.value || [];

      // Filter out the excluded event (useful when updating an existing booking)
      const conflicts = excludeEventId
        ? events.filter((e) => e.id !== excludeEventId)
        : events;

      return {
        hasConflict: conflicts.length > 0,
        conflicts,
      };
    } catch (error) {
      console.error('Failed to check calendar conflicts:', error);
      // Return error flag so callers can distinguish "no conflicts" from "check failed"
      return { hasConflict: false, conflicts: [], error: true };
    }
  }

  /**
   * Check for calendar conflicts in current user's calendar
   */
  async checkMyCalendarConflicts(
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }> {
    try {
      const client = this.getClient();

      const bufferStart = new Date(startTime.getTime() - 60000);
      const bufferEnd = new Date(endTime.getTime() + 60000);

      const response = await client
        .api('/me/calendar/events')
        .select('id,subject,start,end,body,location,attendees')
        .filter(
          `start/dateTime lt '${bufferEnd.toISOString()}' and end/dateTime gt '${bufferStart.toISOString()}'`
        )
        .orderby('start/dateTime')
        .get();

      const events: CalendarEvent[] = response.value || [];

      const conflicts = excludeEventId
        ? events.filter((e) => e.id !== excludeEventId)
        : events;

      return {
        hasConflict: conflicts.length > 0,
        conflicts,
      };
    } catch (error) {
      console.error('Failed to check calendar conflicts:', error);
      return { hasConflict: false, conflicts: [], error: true };
    }
  }

  /**
   * Check calendar availability for a specific user by their email
   * Uses the getSchedule API which works with delegated permissions
   * Requires Calendars.Read or Calendars.Read.Shared permission
   */
  async checkUserCalendarConflicts(
    userEmail: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }> {
    try {
      const client = this.getClient();

      // Use the getSchedule API which is designed for checking free/busy availability
      // This works with delegated permissions unlike reading other users' calendar events directly
      const response = await client
        .api('/me/calendar/getSchedule')
        .post({
          schedules: [userEmail],
          startTime: {
            dateTime: startTime.toISOString(),
            timeZone: 'UTC',
          },
          endTime: {
            dateTime: endTime.toISOString(),
            timeZone: 'UTC',
          },
          availabilityViewInterval: 15, // 15-minute intervals
        });

      const schedules = response.value || [];

      if (schedules.length === 0) {
        console.warn(`No schedule returned for ${userEmail}`);
        return { hasConflict: false, conflicts: [] };
      }

      const schedule = schedules[0];

      // Check for errors in the response (e.g., mailbox not found, access denied)
      if (schedule.error) {
        console.warn(`Schedule error for ${userEmail}:`, schedule.error.message);
        return { hasConflict: false, conflicts: [] };
      }

      // Check if there are any busy/tentative/OOF items in the schedule
      const scheduleItems = schedule.scheduleItems || [];
      const busyItems = scheduleItems.filter(
        (item: { status: string }) =>
          item.status === 'busy' ||
          item.status === 'tentative' ||
          item.status === 'oof' ||
          item.status === 'workingElsewhere'
      );

      // Also check the availabilityView string for any non-free time
      // 0 = free, 1 = tentative, 2 = busy, 3 = oof, 4 = working elsewhere
      const availabilityView = schedule.availabilityView || '';
      const hasBusySlots = /[1-4]/.test(availabilityView);

      // Convert schedule items to CalendarEvent-like objects for compatibility
      const conflicts: CalendarEvent[] = busyItems.map((item: {
        subject?: string;
        start: { dateTime: string; timeZone: string };
        end: { dateTime: string; timeZone: string };
        status: string;
      }) => ({
        id: `schedule-${item.start.dateTime}`,
        subject: item.subject || `Busy (${item.status})`,
        start: item.start,
        end: item.end,
      }));

      return {
        hasConflict: busyItems.length > 0 || hasBusySlots,
        conflicts,
      };
    } catch (error) {
      console.error(`Failed to check calendar availability for ${userEmail}:`, error);
      return { hasConflict: false, conflicts: [], error: true };
    }
  }

  /**
   * Check availability for multiple users at a specific time slot
   * Uses a single getSchedule API call for efficiency
   * Returns a map of email to availability status
   */
  async checkMultipleUsersAvailability(
    userEmails: string[],
    startTime: Date,
    endTime: Date
  ): Promise<Map<string, { available: boolean; conflictCount: number }>> {
    const results = new Map<string, { available: boolean; conflictCount: number }>();

    if (userEmails.length === 0) {
      return results;
    }

    try {
      const client = this.getClient();

      // Use a single getSchedule API call for all users (more efficient)
      const response = await client
        .api('/me/calendar/getSchedule')
        .post({
          schedules: userEmails,
          startTime: {
            dateTime: startTime.toISOString(),
            timeZone: 'UTC',
          },
          endTime: {
            dateTime: endTime.toISOString(),
            timeZone: 'UTC',
          },
          availabilityViewInterval: 15,
        });

      const schedules = response.value || [];

      // Process each schedule in the response
      schedules.forEach((schedule: {
        scheduleId: string;
        availabilityView: string;
        scheduleItems?: Array<{ status: string }>;
        error?: { message: string };
      }) => {
        const email = schedule.scheduleId;

        // Handle errors (e.g., mailbox not found, access denied)
        if (schedule.error) {
          console.warn(`Schedule error for ${email}:`, schedule.error.message);
          results.set(email, { available: true, conflictCount: 0 });
          return;
        }

        // Check the availabilityView string for busy time
        // 0 = free, 1 = tentative, 2 = busy, 3 = oof, 4 = working elsewhere
        const availabilityView = schedule.availabilityView || '';
        const hasBusySlots = /[1-4]/.test(availabilityView);

        // Count busy schedule items
        const scheduleItems = schedule.scheduleItems || [];
        const busyCount = scheduleItems.filter(
          (item) =>
            item.status === 'busy' ||
            item.status === 'tentative' ||
            item.status === 'oof' ||
            item.status === 'workingElsewhere'
        ).length;

        results.set(email, {
          available: !hasBusySlots && busyCount === 0,
          conflictCount: busyCount,
        });
      });

      // Set default for any emails not in the response
      userEmails.forEach((email) => {
        if (!results.has(email)) {
          console.warn(`No schedule response for ${email}, assuming available`);
          results.set(email, { available: true, conflictCount: 0 });
        }
      });

    } catch (error) {
      console.error('Failed to check multiple users availability:', error);
      // On error, set all users as available to not block workflow
      userEmails.forEach((email) => {
        results.set(email, { available: true, conflictCount: 0 });
      });
    }

    return results;
  }

  /**
   * Check conflicts for multiple time slots at once
   * Returns an object with conflict status for each slot
   */
  async checkMultipleSlotConflicts(
    slots: Array<{ start: Date; end: Date; label: string }>
  ): Promise<Map<string, { hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }>> {
    const results = new Map<string, { hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }>();

    // Check all slots in parallel
    const checks = await Promise.all(
      slots.map(async (slot) => {
        const result = await this.checkCalendarConflicts(slot.start, slot.end);
        return { label: slot.label, result };
      })
    );

    checks.forEach(({ label, result }) => {
      results.set(label, result);
    });

    return results;
  }

  async sendEmail(options: {
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
    attachments?: Array<{
      name: string;
      contentType: string;
      contentBytes: string;
    }>;
  }): Promise<void> {
    try {
      const client = this.getClient();

      const message: {
        message: {
          subject: string;
          body: { contentType: string; content: string };
          toRecipients: Array<{ emailAddress: { address: string } }>;
          ccRecipients?: Array<{ emailAddress: { address: string } }>;
          attachments?: Array<{
            '@odata.type': string;
            name: string;
            contentType: string;
            contentBytes: string;
          }>;
        };
      } = {
        message: {
          subject: options.subject,
          body: {
            contentType: 'HTML',
            content: options.body,
          },
          toRecipients: options.to.map((email) => ({
            emailAddress: {
              address: email,
            },
          })),
          attachments: options.attachments?.map((att) => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: att.name,
            contentType: att.contentType,
            contentBytes: att.contentBytes,
          })),
        },
      };

      // Add CC recipients if provided
      if (options.cc && options.cc.length > 0) {
        message.message.ccRecipients = options.cc.map((email) => ({
          emailAddress: {
            address: email,
          },
        }));
      }

      await client.api('/me/sendMail').post(message);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async getUserPhoto(userId: string): Promise<Blob | null> {
    try {
      const client = this.getClient();
      const response = await client.api(`/users/${userId}/photo/$value`).get();
      return response;
    } catch {
      return null;
    }
  }

  // Get user's group memberships for role-based access control
  async getUserGroupMemberships(): Promise<string[]> {
    try {
      const client = this.getClient();
      const response = await client
        .api('/me/memberOf')
        .select('id,displayName')
        .filter("@odata.type eq '#microsoft.graph.group'")
        .get();

      const groups: GroupMembership[] = response.value || [];
      return groups.map((g) => g.id);
    } catch (error) {
      console.warn('Failed to get user group memberships:', error);
      return [];
    }
  }

  // Check if user is member of a specific group
  async isUserInGroup(groupId: string): Promise<boolean> {
    try {
      const memberships = await this.getUserGroupMemberships();
      return memberships.includes(groupId);
    } catch {
      return false;
    }
  }

  // ==================== ENTRA ID (AZURE AD) USER OPERATIONS ====================

  /**
   * Sanitize input for OData filter expressions to prevent injection attacks
   * Removes or escapes characters that could be used for OData injection
   */
  private sanitizeODataInput(input: string): string {
    // First, trim and limit length to prevent abuse
    let sanitized = input.trim().slice(0, 100);

    // Escape single quotes (OData standard)
    sanitized = sanitized.replace(/'/g, "''");

    // Remove or escape OData special characters that could be used for injection
    // These could be used to break out of string literals or inject operators
    sanitized = sanitized.replace(/[()[\]{}$&;|\\]/g, '');

    return sanitized;
  }

  /**
   * Search users in Entra ID (Azure AD) by name, email, or display name
   * Requires User.Read.All permission
   */
  async searchEntraUsers(searchText: string, maxResults = 25): Promise<EntraUser[]> {
    try {
      const client = this.getClient();

      // Sanitize input to prevent OData injection
      const sanitizedText = this.sanitizeODataInput(searchText);

      // Return empty if sanitized text is too short
      if (sanitizedText.length < 1) {
        return [];
      }

      // Build search filter - searches displayName, mail, and userPrincipalName
      // Note: Cannot use orderby with 'or' filters in Graph API
      const filter = `startswith(displayName,'${sanitizedText}') or startswith(mail,'${sanitizedText}') or startswith(userPrincipalName,'${sanitizedText}')`;

      const response = await client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones')
        .filter(filter)
        .top(maxResults)
        .get();

      const users: GraphUser[] = response.value || [];
      // Sort client-side since we can't use orderby with 'or' filters
      return users
        .map(this.transformGraphUser)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
    } catch (error) {
      console.error('Failed to search Entra users:', error);
      throw new Error('Failed to search users in directory');
    }
  }

  /**
   * Get all users in Entra ID with pagination support
   * Requires User.Read.All permission
   */
  async getEntraUsers(options?: {
    filter?: string;
    top?: number;
    skipToken?: string;
  }): Promise<{ users: EntraUser[]; nextLink?: string }> {
    try {
      const client = this.getClient();

      let request = client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones')
        .orderby('displayName')
        .top(options?.top || 50);

      if (options?.filter) {
        request = request.filter(options.filter);
      }

      if (options?.skipToken) {
        request = request.skipToken(options.skipToken);
      }

      const response = await request.get();

      const users: GraphUser[] = response.value || [];
      return {
        users: users.map(this.transformGraphUser),
        nextLink: response['@odata.nextLink'],
      };
    } catch (error) {
      console.error('Failed to get Entra users:', error);
      throw new Error('Failed to retrieve users from directory');
    }
  }

  /**
   * Get a specific user by ID or UPN from Entra ID
   * Requires User.Read.All permission
   */
  async getEntraUserById(userIdOrUpn: string): Promise<EntraUser | null> {
    try {
      const client = this.getClient();

      const response = await client
        .api(`/users/${userIdOrUpn}`)
        .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones')
        .get();

      return this.transformGraphUser(response);
    } catch (error) {
      console.warn(`Failed to get Entra user ${userIdOrUpn}:`, error);
      return null;
    }
  }

  /**
   * Get user by email address from Entra ID
   */
  async getEntraUserByEmail(email: string): Promise<EntraUser | null> {
    try {
      const client = this.getClient();
      const sanitizedEmail = this.sanitizeODataInput(email);

      const response = await client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones')
        .filter(`mail eq '${sanitizedEmail}' or userPrincipalName eq '${sanitizedEmail}'`)
        .top(1)
        .get();

      const users: GraphUser[] = response.value || [];
      return users.length > 0 ? this.transformGraphUser(users[0]) : null;
    } catch (error) {
      console.warn(`Failed to get Entra user by email ${email}:`, error);
      return null;
    }
  }

  /**
   * Get users by department from Entra ID
   */
  async getEntraUsersByDepartment(department: string): Promise<EntraUser[]> {
    try {
      const client = this.getClient();
      const sanitizedDepartment = this.sanitizeODataInput(department);

      const response = await client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones')
        .filter(`department eq '${sanitizedDepartment}'`)
        .orderby('displayName')
        .get();

      const users: GraphUser[] = response.value || [];
      return users.map(this.transformGraphUser);
    } catch (error) {
      console.error('Failed to get Entra users by department:', error);
      throw new Error('Failed to retrieve users by department');
    }
  }

  /**
   * Get guest users (external users) from Entra ID
   */
  async getGuestUsers(): Promise<EntraUser[]> {
    try {
      const client = this.getClient();

      const response = await client
        .api('/users')
        .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones')
        .filter("userType eq 'Guest'")
        .orderby('displayName')
        .get();

      const users: GraphUser[] = response.value || [];
      return users.map(this.transformGraphUser);
    } catch (error) {
      console.error('Failed to get guest users:', error);
      throw new Error('Failed to retrieve guest users');
    }
  }

  /**
   * Get user's manager from Entra ID
   */
  async getUserManager(userIdOrUpn: string): Promise<EntraUser | null> {
    try {
      const client = this.getClient();

      const response = await client
        .api(`/users/${userIdOrUpn}/manager`)
        .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones')
        .get();

      return this.transformGraphUser(response);
    } catch {
      // User may not have a manager
      return null;
    }
  }

  /**
   * Get user's direct reports from Entra ID
   */
  async getUserDirectReports(userIdOrUpn: string): Promise<EntraUser[]> {
    try {
      const client = this.getClient();

      const response = await client
        .api(`/users/${userIdOrUpn}/directReports`)
        .select('id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones')
        .get();

      const users: GraphUser[] = response.value || [];
      return users.map(this.transformGraphUser);
    } catch (error) {
      console.warn('Failed to get direct reports:', error);
      return [];
    }
  }

  /**
   * Get user's profile photo URL (returns base64 data URL)
   */
  async getEntraUserPhotoUrl(userIdOrUpn: string): Promise<string | null> {
    try {
      const client = this.getClient();
      const response = await client.api(`/users/${userIdOrUpn}/photo/$value`).get();

      // Convert blob to base64
      if (response instanceof Blob) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(response);
        });
      }
      return null;
    } catch {
      return null;
    }
  }

  // Transform Graph API user to EntraUser type
  private transformGraphUser(user: GraphUser): EntraUser {
    return {
      id: user.id,
      displayName: user.displayName,
      mail: user.mail,
      userPrincipalName: user.userPrincipalName,
      jobTitle: user.jobTitle,
      department: user.department,
      officeLocation: user.officeLocation,
      mobilePhone: user.mobilePhone,
      businessPhones: user.businessPhones,
    };
  }

  // ==================== SHAREPOINT LIST OPERATIONS VIA GRAPH API ====================

  /**
   * Get the site ID for the configured SharePoint site
   * Uses caching to prevent duplicate API calls and race conditions
   */
  private async getSiteId(): Promise<string> {
    // Return cached value if available
    if (this.siteIdCache) {
      return this.siteIdCache;
    }

    // If a request is already in progress, wait for it (prevents race conditions)
    if (this.siteIdPromise) {
      return this.siteIdPromise;
    }

    // Create and cache the promise to prevent duplicate requests
    this.siteIdPromise = this.fetchSiteId();

    try {
      this.siteIdCache = await this.siteIdPromise;
      return this.siteIdCache;
    } finally {
      // Clear the promise after completion (success or failure)
      this.siteIdPromise = null;
    }
  }

  /**
   * Internal method to fetch site ID from Graph API
   */
  private async fetchSiteId(): Promise<string> {
    const client = this.getClient();
    const siteUrl = config.sharepoint.siteUrl;

    // Extract hostname and site path from URL
    // e.g., "https://hallofd.sharepoint.com/sites/LicensePulseDemoScheduler"
    const url = new URL(siteUrl);
    const hostname = url.hostname; // hallofd.sharepoint.com
    const sitePath = url.pathname; // /sites/LicensePulseDemoScheduler

    const response = await client
      .api(`/sites/${hostname}:${sitePath}`)
      .select('id')
      .get();

    return response.id;
  }

  /**
   * Clear the site ID cache (useful if site URL changes)
   */
  clearSiteIdCache(): void {
    this.siteIdCache = null;
    this.siteIdPromise = null;
  }

  /**
   * Get list items from a SharePoint list via Graph API
   */
  async getListItems(
    listName: string,
    options?: {
      filter?: string;
      select?: string[];
      orderBy?: string;
      top?: number;
      expand?: string[];
    }
  ): Promise<unknown[]> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();

      // URL-encode the list name to handle spaces and special characters
      const encodedListName = encodeURIComponent(listName);
      let request = client.api(`/sites/${siteId}/lists/${encodedListName}/items`);

      // Always expand fields to get the actual column values
      request = request.expand('fields');

      if (options?.select) {
        request = request.select(options.select.join(','));
      }

      if (options?.filter) {
        // Graph API filter syntax for list items
        request = request.filter(options.filter);
      }

      if (options?.orderBy) {
        request = request.orderby(options.orderBy);
      }

      // Allow filtering/sorting on non-indexed columns (required for small lists like DWxServices)
      if (options?.filter || options?.orderBy) {
        request = request.header('Prefer', 'HonorNonIndexedQueriesWarningMayFailRandomly');
      }

      if (options?.top) {
        request = request.top(options.top);
      }

      const response = await request.get();
      return response.value || [];
    } catch (error) {
      console.error(`Failed to get list items from ${listName}:`, error);
      // Provide more specific error messages
      const err = error as { statusCode?: number; message?: string };
      if (err.statusCode === 404) {
        throw new Error(`SharePoint list "${listName}" not found. Please verify the list exists.`);
      } else if (err.statusCode === 403 || err.statusCode === 401) {
        throw new Error(`Permission denied accessing list "${listName}". Please check your permissions.`);
      }
      throw new Error(`Failed to fetch items from ${listName}: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Get a single list item by ID via Graph API
   */
  async getListItemById(listName: string, itemId: string | number): Promise<unknown> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedListName = encodeURIComponent(listName);

      const response = await client
        .api(`/sites/${siteId}/lists/${encodedListName}/items/${itemId}`)
        .expand('fields')
        .get();

      return response;
    } catch (error) {
      console.error(`Failed to get list item ${itemId} from ${listName}:`, error);
      const err = error as { statusCode?: number; message?: string };
      if (err.statusCode === 404) {
        throw new Error(`Item ${itemId} not found in list "${listName}".`);
      } else if (err.statusCode === 403 || err.statusCode === 401) {
        throw new Error(`Permission denied accessing item in list "${listName}".`);
      }
      throw new Error(`Failed to fetch item ${itemId} from ${listName}: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Create a new list item via Graph API
   */
  async createListItem(
    listName: string,
    fields: Record<string, unknown>
  ): Promise<{ id: string; fields: Record<string, unknown> }> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedListName = encodeURIComponent(listName);

      const response = await client
        .api(`/sites/${siteId}/lists/${encodedListName}/items`)
        .post({
          fields,
        });

      return {
        id: response.id,
        fields: response.fields,
      };
    } catch (error) {
      console.error(`Failed to create list item in ${listName}:`, error);
      const err = error as { statusCode?: number; message?: string; body?: { error?: { message?: string } } };
      if (err.statusCode === 404) {
        throw new Error(`SharePoint list "${listName}" not found. Please verify the list exists.`);
      } else if (err.statusCode === 403 || err.statusCode === 401) {
        throw new Error(`Permission denied creating item in list "${listName}". Please check your permissions.`);
      } else if (err.statusCode === 400) {
        // Bad request - often a field name mismatch
        const bodyMsg = err.body?.error?.message || err.message || '';
        throw new Error(`Failed to create item - invalid field or data: ${bodyMsg}`);
      }
      throw new Error(`Failed to create item in ${listName}: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Update a list item via Graph API
   */
  async updateListItem(
    listName: string,
    itemId: string | number,
    fields: Record<string, unknown>
  ): Promise<{ id: string; fields: Record<string, unknown> }> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedListName = encodeURIComponent(listName);

      const response = await client
        .api(`/sites/${siteId}/lists/${encodedListName}/items/${itemId}/fields`)
        .patch(fields);

      return {
        id: String(itemId),
        fields: response,
      };
    } catch (error) {
      console.error(`Failed to update list item ${itemId} in ${listName}:`, error);
      const err = error as { statusCode?: number; message?: string };
      if (err.statusCode === 404) {
        throw new Error(`Item ${itemId} not found in list "${listName}".`);
      } else if (err.statusCode === 403 || err.statusCode === 401) {
        throw new Error(`Permission denied updating item in list "${listName}".`);
      }
      throw new Error(`Failed to update item ${itemId} in ${listName}: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Delete a list item via Graph API
   */
  async deleteListItem(listName: string, itemId: string | number): Promise<void> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedListName = encodeURIComponent(listName);

      await client.api(`/sites/${siteId}/lists/${encodedListName}/items/${itemId}`).delete();
    } catch (error) {
      console.error(`Failed to delete list item ${itemId} from ${listName}:`, error);
      const err = error as { statusCode?: number; message?: string };
      if (err.statusCode === 404) {
        throw new Error(`Item ${itemId} not found in list "${listName}".`);
      } else if (err.statusCode === 403 || err.statusCode === 401) {
        throw new Error(`Permission denied deleting item from list "${listName}".`);
      }
      throw new Error(`Failed to delete item ${itemId} from ${listName}: ${err.message || 'Unknown error'}`);
    }
  }

  /**
   * Get list columns/fields schema - useful for debugging field name issues
   */
  async getListColumns(listName: string): Promise<Array<{ name: string; displayName: string; type: string }>> {
    try {
      const client = this.getClient();
      const siteId = await this.getSiteId();
      const encodedListName = encodeURIComponent(listName);

      const response = await client
        .api(`/sites/${siteId}/lists/${encodedListName}/columns`)
        .select('name,displayName,text,choice,dateTime,boolean,number')
        .get();

      return response.value.map((col: { name: string; displayName: string; text?: object; choice?: object; dateTime?: object; boolean?: object; number?: object }) => ({
        name: col.name,
        displayName: col.displayName,
        type: col.text ? 'text' : col.choice ? 'choice' : col.dateTime ? 'dateTime' : col.boolean ? 'boolean' : col.number ? 'number' : 'other',
      }));
    } catch (error) {
      console.error(`Failed to get columns for list ${listName}:`, error);
      throw error;
    }
  }
}

export const graphService = new GraphService();
