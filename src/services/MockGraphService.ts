/**
 * MockGraphService - Mock Microsoft Graph Service for E2E Testing
 *
 * This service mimics the GraphService interface but returns mock data.
 * Used when VITE_TEST_MODE=true to enable automated testing with TestSprite.
 */

import { CalendarEvent } from '../types/ApiResponses';
import { EntraUser } from '../types/ReferenceData';
import {
  isTestMode,
  getTestBookings,
  getTestClients,
  getTestTeamMembers,
  getTestAccountManagers,
  createTestBooking,
  updateTestBooking,
  deleteTestBooking,
  createTestClient,
  getMockUser,
  mockAccountManagers,
} from '../config/testModeConfig';
import type { Booking } from '../types/Booking';
import type { Client, TeamMember, AccountManager } from '../types/ReferenceData';

// Mock calendar events storage
let mockCalendarEvents: CalendarEvent[] = [];
let nextEventId = 1000;

class MockGraphService {
  constructor() {
    if (isTestMode) {
      console.log('[MockGraphService] Initialized in test mode');
    }
  }

  // ==================== CALENDAR OPERATIONS ====================

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    console.log('[MockGraphService] Getting calendar events', { startDate, endDate });

    // Filter mock events by date range
    return mockCalendarEvents.filter((event) => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      return eventStart >= startDate && eventEnd <= endDate;
    });
  }

  async createCalendarEvent(event: {
    subject: string;
    start: Date;
    end: Date;
    body?: string;
    location?: string;
    attendees?: string[];
  }): Promise<CalendarEvent> {
    console.log('[MockGraphService] Creating calendar event', event);

    const newEvent: CalendarEvent = {
      id: `mock-event-${nextEventId++}`,
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
          name: email.split('@')[0],
        },
        type: 'required',
      })),
    };

    mockCalendarEvents.push(newEvent);
    return newEvent;
  }

  async createMyCalendarEvent(event: {
    subject: string;
    start: Date;
    end: Date;
    body?: string;
    location?: string;
    attendees?: string[];
  }): Promise<CalendarEvent> {
    // Same as createCalendarEvent for mock
    return this.createCalendarEvent(event);
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    console.log('[MockGraphService] Deleting calendar event', eventId);
    mockCalendarEvents = mockCalendarEvents.filter((e) => e.id !== eventId);
  }

  async deleteMyCalendarEvent(eventId: string): Promise<void> {
    return this.deleteCalendarEvent(eventId);
  }

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
    console.log('[MockGraphService] Updating calendar event', { eventId, updates });

    const eventIndex = mockCalendarEvents.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) {
      throw new Error(`Calendar event ${eventId} not found`);
    }

    const existingEvent = mockCalendarEvents[eventIndex];
    const updatedEvent: CalendarEvent = {
      ...existingEvent,
      subject: updates.subject || existingEvent.subject,
      start: updates.start
        ? { dateTime: updates.start.toISOString(), timeZone: 'UTC' }
        : existingEvent.start,
      end: updates.end
        ? { dateTime: updates.end.toISOString(), timeZone: 'UTC' }
        : existingEvent.end,
      body: updates.body
        ? { contentType: 'HTML', content: updates.body }
        : existingEvent.body,
      location: updates.location
        ? { displayName: updates.location }
        : existingEvent.location,
      attendees: updates.attendees
        ? updates.attendees.map((email) => ({
            emailAddress: { address: email, name: email.split('@')[0] },
            type: 'required',
          }))
        : existingEvent.attendees,
    };

    mockCalendarEvents[eventIndex] = updatedEvent;
    return updatedEvent;
  }

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
    return this.updateCalendarEvent(eventId, updates);
  }

  async checkCalendarConflicts(
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[] }> {
    console.log('[MockGraphService] Checking calendar conflicts', { startTime, endTime });

    const conflicts = mockCalendarEvents.filter((event) => {
      if (excludeEventId && event.id === excludeEventId) return false;

      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);

      // Check for overlap
      return startTime < eventEnd && endTime > eventStart;
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  async checkMyCalendarConflicts(
    startTime: Date,
    endTime: Date,
    excludeEventId?: string
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[] }> {
    return this.checkCalendarConflicts(startTime, endTime, excludeEventId);
  }

  async checkUserCalendarConflicts(
    userEmail: string,
    _startTime: Date,
    _endTime: Date
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[] }> {
    console.log('[MockGraphService] Checking user calendar conflicts', { userEmail });
    // In mock mode, return no conflicts for simplicity
    return { hasConflict: false, conflicts: [] };
  }

  async checkMultipleUsersAvailability(
    userEmails: string[],
    _startTime: Date,
    _endTime: Date
  ): Promise<Map<string, { available: boolean; conflictCount: number }>> {
    const results = new Map<string, { available: boolean; conflictCount: number }>();

    userEmails.forEach((email) => {
      results.set(email, { available: true, conflictCount: 0 });
    });

    return results;
  }

  async checkMultipleSlotConflicts(
    slots: Array<{ start: Date; end: Date; label: string }>
  ): Promise<Map<string, { hasConflict: boolean; conflicts: CalendarEvent[] }>> {
    const results = new Map<string, { hasConflict: boolean; conflicts: CalendarEvent[] }>();

    for (const slot of slots) {
      const result = await this.checkCalendarConflicts(slot.start, slot.end);
      results.set(slot.label, result);
    }

    return results;
  }

  // ==================== EMAIL OPERATIONS ====================

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
    console.log('[MockGraphService] Mock email sent:', {
      to: options.to,
      cc: options.cc,
      subject: options.subject,
      attachmentCount: options.attachments?.length || 0,
    });
    // In test mode, just log the email - don't actually send
  }

  // ==================== USER OPERATIONS ====================

  async getUserPhoto(userId: string): Promise<Blob | null> {
    console.log('[MockGraphService] Getting user photo', userId);
    return null;
  }

  async getUserGroupMemberships(): Promise<string[]> {
    const user = getMockUser();
    return user.groupMemberships || [];
  }

  async isUserInGroup(groupId: string): Promise<boolean> {
    const memberships = await this.getUserGroupMemberships();
    return memberships.includes(groupId);
  }

  // ==================== ENTRA ID USER OPERATIONS ====================

  async searchEntraUsers(searchText: string, maxResults = 25): Promise<EntraUser[]> {
    console.log('[MockGraphService] Searching Entra users', { searchText, maxResults });

    // Return mock account managers as Entra users
    const searchLower = searchText.toLowerCase();
    return mockAccountManagers
      .filter(
        (am) =>
          am.Title.toLowerCase().includes(searchLower) ||
          am.Email.toLowerCase().includes(searchLower)
      )
      .slice(0, maxResults)
      .map((am) => ({
        id: am.EntraUserId || `entra-${am.Id}`,
        displayName: am.Title,
        mail: am.Email,
        userPrincipalName: am.Email,
        jobTitle: am.JobTitle,
        department: am.Department,
        officeLocation: am.Region,
        mobilePhone: am.MobilePhone,
        businessPhones: am.Phone ? [am.Phone] : [],
      }));
  }

  async getEntraUsers(options?: {
    filter?: string;
    top?: number;
    skipToken?: string;
  }): Promise<{ users: EntraUser[]; nextLink?: string }> {
    console.log('[MockGraphService] Getting Entra users', options);

    const users = mockAccountManagers.slice(0, options?.top || 50).map((am) => ({
      id: am.EntraUserId || `entra-${am.Id}`,
      displayName: am.Title,
      mail: am.Email,
      userPrincipalName: am.Email,
      jobTitle: am.JobTitle,
      department: am.Department,
      officeLocation: am.Region,
      mobilePhone: am.MobilePhone,
      businessPhones: am.Phone ? [am.Phone] : [],
    }));

    return { users };
  }

  async getEntraUserById(userIdOrUpn: string): Promise<EntraUser | null> {
    const am = mockAccountManagers.find(
      (a) => a.EntraUserId === userIdOrUpn || a.Email === userIdOrUpn
    );

    if (!am) return null;

    return {
      id: am.EntraUserId || `entra-${am.Id}`,
      displayName: am.Title,
      mail: am.Email,
      userPrincipalName: am.Email,
      jobTitle: am.JobTitle,
      department: am.Department,
    };
  }

  async getEntraUserByEmail(email: string): Promise<EntraUser | null> {
    return this.getEntraUserById(email);
  }

  async getEntraUsersByDepartment(department: string): Promise<EntraUser[]> {
    return mockAccountManagers
      .filter((am) => am.Department === department)
      .map((am) => ({
        id: am.EntraUserId || `entra-${am.Id}`,
        displayName: am.Title,
        mail: am.Email,
        userPrincipalName: am.Email,
        jobTitle: am.JobTitle,
        department: am.Department,
      }));
  }

  async getGuestUsers(): Promise<EntraUser[]> {
    return mockAccountManagers
      .filter((am) => am.Source === 'Guest' || am.Source === 'External')
      .map((am) => ({
        id: am.EntraUserId || `entra-${am.Id}`,
        displayName: am.Title,
        mail: am.Email,
        userPrincipalName: am.Email,
        jobTitle: am.JobTitle,
        department: am.Department,
      }));
  }

  async getUserManager(_userIdOrUpn: string): Promise<EntraUser | null> {
    // Return null for mock - no manager relationship
    return null;
  }

  async getUserDirectReports(_userIdOrUpn: string): Promise<EntraUser[]> {
    return [];
  }

  async getEntraUserPhotoUrl(_userIdOrUpn: string): Promise<string | null> {
    return null;
  }

  // ==================== SHAREPOINT LIST OPERATIONS ====================

  clearSiteIdCache(): void {
    // No-op for mock - site ID is always the mock value
  }

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
    console.log('[MockGraphService] Getting list items', { listName, options });

    // Return appropriate mock data based on list name (case-insensitive)
    const normalizedListName = listName.toLowerCase();

    // Handle booking list - LPDemoScheduler (the actual SharePoint list name)
    if (normalizedListName.startsWith('lpdemo')) {
      return this.transformBookingsToListItems(getTestBookings());
    }

    if (normalizedListName === 'clients') {
      return this.transformClientsToListItems(getTestClients());
    }

    if (normalizedListName === 'teammembers') {
      return this.transformTeamMembersToListItems(getTestTeamMembers());
    }

    if (normalizedListName === 'accountmanagers') {
      return this.transformAccountManagersToListItems(getTestAccountManagers());
    }

    if (normalizedListName === 'auditlog') {
      return []; // Return empty audit log for tests
    }

    console.warn(`[MockGraphService] Unknown list: ${listName}`);
    return [];
  }

  async getListItemById(listName: string, itemId: string | number): Promise<unknown> {
    console.log('[MockGraphService] Getting list item by ID', { listName, itemId });

    const items = await this.getListItems(listName);
    const item = items.find((i: unknown) => {
      const fields = (i as { fields?: { id?: number } }).fields;
      return fields?.id === Number(itemId);
    });

    if (!item) {
      throw new Error(`Item ${itemId} not found in ${listName}`);
    }

    return item;
  }

  async createListItem(
    listName: string,
    fields: Record<string, unknown>
  ): Promise<{ id: string; fields: Record<string, unknown> }> {
    console.log('[MockGraphService] Creating list item', { listName, fields });

    // Handle booking creation (LPDemoScheduler list)
    if (listName.toLowerCase().startsWith('lpdemo')) {
      const booking = createTestBooking({
        Title: fields.Title as string || '',
        AccountManagerName: fields.AccountManagerName as string || '',
        AccountManagerEmail: fields.AccountManagerEmail as string || '',
        ClientName: fields.ClientName as string || '',
        BookingType: (fields.BookingType as 'Demo' | 'Deployment') || 'Demo',
        LicenseCount: fields.LicenseCount as number || 0,
        ProposedSlot1: fields.ProposedSlot1 as string || '',
        ProposedSlot2: fields.ProposedSlot2 as string || '',
        ProposedSlot3: fields.ProposedSlot3 as string || '',
        IsPremiumClient: fields.IsPremiumClient as boolean || false,
        Status: (fields.Status as Booking['Status']) || 'Pending Review',
        Comments: fields.Comments as string,
        Priority: fields.Priority as Booking['Priority'],
        DealSize: fields.DealSize as number,
        DealValue: fields.DealValue as string,
        Created: new Date().toISOString(),
        CreatedBy: {
          Title: getMockUser().displayName,
          Email: getMockUser().email,
        },
      });

      return {
        id: String(booking.Id),
        fields: { ...fields, id: booking.Id },
      };
    }

    // Handle client creation
    if (listName.toLowerCase() === 'clients') {
      const client = createTestClient({
        Title: fields.Title as string || '',
        PrimaryContactName: fields.PrimaryContactName as string || '',
        PrimaryContactEmail: fields.PrimaryContactEmail as string || '',
        Phone: fields.Phone as string,
        Industry: fields.Industry as Client['Industry'],
        IsPremium: fields.IsPremium as boolean || false,
        ContractStatus: (fields.ContractStatus as Client['ContractStatus']) || 'Active',
        Notes: fields.Notes as string,
        Created: new Date().toISOString(),
      });

      return {
        id: String(client.Id),
        fields: { ...fields, id: client.Id },
      };
    }

    // Generic mock response for other lists
    const mockId = Math.floor(Math.random() * 10000);
    return {
      id: String(mockId),
      fields: { ...fields, id: mockId },
    };
  }

  async updateListItem(
    listName: string,
    itemId: string | number,
    fields: Record<string, unknown>
  ): Promise<{ id: string; fields: Record<string, unknown> }> {
    console.log('[MockGraphService] Updating list item', { listName, itemId, fields });

    // Handle booking update (LPDemoScheduler list)
    if (listName.toLowerCase().startsWith('lpdemo')) {
      const updated = updateTestBooking(Number(itemId), fields as Partial<Booking>);
      if (!updated) {
        throw new Error(`Booking ${itemId} not found`);
      }

      return {
        id: String(itemId),
        fields: { ...fields, id: Number(itemId) },
      };
    }

    // Generic mock response
    return {
      id: String(itemId),
      fields: { ...fields, id: Number(itemId) },
    };
  }

  async deleteListItem(listName: string, itemId: string | number): Promise<void> {
    console.log('[MockGraphService] Deleting list item', { listName, itemId });

    // Handle booking deletion (LPDemoScheduler list)
    if (listName.toLowerCase().startsWith('lpdemo')) {
      const deleted = deleteTestBooking(Number(itemId));
      if (!deleted) {
        throw new Error(`Booking ${itemId} not found`);
      }
    }
  }

  // ==================== TRANSFORM HELPERS ====================

  private transformBookingsToListItems(bookings: Booking[]): unknown[] {
    return bookings.map((booking) => ({
      id: String(booking.Id),
      fields: {
        id: booking.Id,
        Title: booking.Title,
        AccountManagerName: booking.AccountManagerName,
        AccountManagerEmail: booking.AccountManagerEmail,
        ClientName: booking.ClientName,
        BookingType: booking.BookingType,
        LicenseCount: booking.LicenseCount,
        ProposedSlot1: booking.ProposedSlot1,
        ProposedSlot2: booking.ProposedSlot2,
        ProposedSlot3: booking.ProposedSlot3,
        ConfirmedDateTime: booking.ConfirmedDateTime,
        Comments: booking.Comments,
        IsPremiumClient: booking.IsPremiumClient,
        Status: booking.Status,
        Outcome: booking.Outcome,
        NextSteps: booking.NextSteps,
        CalendarEventId: booking.CalendarEventId,
        AssignedSpecialistName: booking.AssignedSpecialistName,
        AssignedSpecialistEmail: booking.AssignedSpecialistEmail,
        AssignedSpecialistRole: booking.AssignedSpecialistRole,
        DealSize: booking.DealSize,
        DealValue: booking.DealValue,
        Priority: booking.Priority,
        Created: booking.Created,
        Author: booking.CreatedBy,
      },
    }));
  }

  private transformClientsToListItems(clients: Client[]): unknown[] {
    return clients.map((client) => ({
      id: String(client.Id),
      fields: {
        id: client.Id,
        Title: client.Title,
        PrimaryContactName: client.PrimaryContactName,
        PrimaryContactEmail: client.PrimaryContactEmail,
        Phone: client.Phone,
        Industry: client.Industry,
        IsPremium: client.IsPremium,
        AccountManagerEmail: client.AccountManagerEmail,
        AccountManagerName: client.AccountManagerName,
        ContractStatus: client.ContractStatus,
        Notes: client.Notes,
        Created: client.Created,
      },
    }));
  }

  private transformTeamMembersToListItems(teamMembers: TeamMember[]): unknown[] {
    return teamMembers.map((member) => ({
      id: String(member.Id),
      fields: {
        id: member.Id,
        Title: member.Title,
        Email: member.Email,
        Phone: member.Phone,
        Role: member.Role,
        Department: member.Department,
        IsActive: member.IsActive,
        Created: member.Created,
      },
    }));
  }

  private transformAccountManagersToListItems(managers: AccountManager[]): unknown[] {
    return managers.map((manager) => ({
      id: String(manager.Id),
      fields: {
        id: manager.Id,
        Title: manager.Title,
        Email: manager.Email,
        Phone: manager.Phone,
        MobilePhone: manager.MobilePhone,
        Department: manager.Department,
        JobTitle: manager.JobTitle,
        Region: manager.Region,
        Status: manager.Status,
        Source: manager.Source,
        EntraUserId: manager.EntraUserId,
        ExternalTenant: manager.ExternalTenant,
        Company: manager.Company,
        ManagerEmail: manager.ManagerEmail,
        HireDate: manager.HireDate,
        Notes: manager.Notes,
        Created: manager.Created,
      },
    }));
  }
}

// Reset mock calendar events (for test cleanup)
export const resetMockCalendarEvents = (): void => {
  mockCalendarEvents = [];
  nextEventId = 1000;
  console.log('[MockGraphService] Calendar events reset');
};

// Export singleton instance
export const mockGraphService = new MockGraphService();
