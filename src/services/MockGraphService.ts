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
  getTestClients,
  getTestTeamMembers,
  getTestAccountManagers,
  getTestServiceRequests,
  getTestProposals,
  createTestServiceRequest,
  updateTestServiceRequest,
  deleteTestServiceRequest,
  createTestClient,
  createTestProposal,
  updateTestProposal,
  getMockUser,
  mockAccountManagers,
} from '../config/testModeConfig';
import type { ServiceRequest } from '../types/ServiceRequest';
import type { Client, TeamMember, AccountManager } from '../types/ReferenceData';
import type { Proposal } from '../types/Proposal';

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
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }> {
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
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }> {
    return this.checkCalendarConflicts(startTime, endTime, excludeEventId);
  }

  async checkUserCalendarConflicts(
    userEmail: string,
    _startTime: Date,
    _endTime: Date
  ): Promise<{ hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }> {
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
  ): Promise<Map<string, { hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }>> {
    const results = new Map<string, { hasConflict: boolean; conflicts: CalendarEvent[]; error?: boolean }>();

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

    // DWx Traffic Manager lists — return proper ServiceRequest mock data
    if (normalizedListName.includes('servicerequests')) {
      return this.transformServiceRequestsToListItems(getTestServiceRequests());
    }

    if (normalizedListName.includes('clients')) {
      return this.transformClientsToListItems(getTestClients());
    }

    if (normalizedListName.includes('teammembers')) {
      return this.transformTeamMembersToListItems(getTestTeamMembers());
    }

    if (normalizedListName.includes('accountmanagers')) {
      return this.transformAccountManagersToListItems(getTestAccountManagers());
    }

    if (normalizedListName.includes('auditlog')) {
      return []; // Return empty audit log for tests
    }

    if (normalizedListName.includes('services') && !normalizedListName.includes('request')) {
      return []; // Return empty services catalog for tests
    }

    if (normalizedListName.includes('specialists')) {
      return []; // Return empty specialists for tests
    }

    if (normalizedListName.includes('proposals')) {
      const allProposals = this.transformProposalsToListItems(getTestProposals());
      // Apply basic ServiceRequestId filter if present
      if (options?.filter) {
        const serviceRequestIdMatch = options.filter.match(/ServiceRequestId\s+eq\s+(\d+)/);
        if (serviceRequestIdMatch) {
          const targetId = parseInt(serviceRequestIdMatch[1], 10);
          return allProposals.filter((item: unknown) => {
            const fields = (item as { fields: Record<string, unknown> }).fields;
            return fields.ServiceRequestId === targetId;
          });
        }
        const idMatch = options.filter.match(/fields\/id\s+eq\s+(\d+)/);
        if (idMatch) {
          const targetId = parseInt(idMatch[1], 10);
          return allProposals.filter((item: unknown) => {
            const fields = (item as { fields: Record<string, unknown> }).fields;
            return fields.id === targetId;
          });
        }
      }
      return allProposals;
    }

    if (normalizedListName.includes('productrequests')) {
      return []; // Return empty product requests for tests
    }

    if (normalizedListName.includes('managers') && !normalizedListName.includes('account')) {
      return []; // Return empty managers list for tests
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

    // Handle service request creation (DWxServiceRequests list)
    if (listName.toLowerCase().includes('servicerequests')) {
      const request = createTestServiceRequest({
        Title: fields.Title as string || '',
        ServiceId: fields.ServiceId as number,
        ServiceName: fields.ServiceName as string || '',
        AccountManagerName: fields.AccountManagerName as string || '',
        AccountManagerEmail: fields.AccountManagerEmail as string || '',
        AccountManagerTenant: (fields.AccountManagerTenant as 'Internal' | 'External') || 'Internal',
        ClientName: fields.ClientName as string || '',
        ClientId: fields.ClientId as number,
        ContactName: fields.ContactName as string || '',
        ContactEmail: fields.ContactEmail as string || '',
        ContactPhone: fields.ContactPhone as string,
        Industry: fields.Industry as ServiceRequest['Industry'],
        CompanySize: fields.CompanySize as ServiceRequest['CompanySize'],
        FunnelStage: (fields.FunnelStage as ServiceRequest['FunnelStage']) || 'Lead',
        InterestLevel: (fields.InterestLevel as ServiceRequest['InterestLevel']) || 'Warm',
        DealValue: fields.DealValue as number,
        DealProbability: fields.DealProbability as number,
        WeightedPipeline: fields.WeightedPipeline as number,
        ExpectedCloseDate: fields.ExpectedCloseDate as string,
        ProposedSlot1: fields.ProposedSlot1 as string || '',
        ProposedSlot2: fields.ProposedSlot2 as string || '',
        ProposedSlot3: fields.ProposedSlot3 as string || '',
        Comments: fields.Comments as string,
        Requirements: fields.Requirements as string,
        Created: new Date().toISOString(),
      });

      return {
        id: String(request.Id),
        fields: { ...fields, id: request.Id },
      };
    }

    // Handle client creation (DWxClients list)
    if (listName.toLowerCase().includes('clients')) {
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

    // Handle proposal creation (DWxProposals list)
    if (listName.toLowerCase().includes('proposals')) {
      const now = new Date().toISOString();
      const proposal = createTestProposal({
        Title: (fields.Title as string) || '',
        ServiceRequestId: (fields.ServiceRequestId as number) || 0,
        Status: (fields.Status as Proposal['Status']) || 'Draft',
        Version: (fields.Version as number) || 1,
        ProposalType: (fields.ProposalType as Proposal['ProposalType']) || 'Standard',
        TemplateName: (fields.TemplateName as string) || '',
        ExecutiveSummary: null,
        SolutionOverview: null,
        TechnologyStack: null,
        ScopeOfWork: null,
        PricingBreakdown: null,
        Timeline: null,
        TeamComposition: null,
        Terms: fields.TermsAndConditions_JSON ? JSON.parse(fields.TermsAndConditions_JSON as string) : null,
        ChangeControl: fields.ChangeControl_JSON ? JSON.parse(fields.ChangeControl_JSON as string) : null,
        Assumptions: [],
        Risks: [],
        SigningPage: null,
        ValidUntil: (fields.ValidUntil as string) || null,
        SentDate: null,
        ClientResponseDate: null,
        ClientFeedback: '',
        InternalNotes: '',
        DocumentUrl: '',
        CreatedByEmail: (fields.CreatedByEmail as string) || '',
        CreatedByName: (fields.CreatedByName as string) || '',
        ApprovedByEmail: '',
        ApprovedByName: '',
        ApprovedDate: null,
        Created: now,
        Modified: now,
      });

      return {
        id: String(proposal.Id),
        fields: { ...fields, id: proposal.Id },
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

    // Handle service request update (DWxServiceRequests list)
    if (listName.toLowerCase().includes('servicerequests')) {
      const updated = updateTestServiceRequest(Number(itemId), fields as Partial<ServiceRequest>);
      if (!updated) {
        throw new Error(`Service request ${itemId} not found`);
      }

      return {
        id: String(itemId),
        fields: { ...fields, id: Number(itemId) },
      };
    }

    // Handle proposal update (DWxProposals list)
    if (listName.toLowerCase().includes('proposals')) {
      updateTestProposal(Number(itemId), fields as Partial<Proposal>);
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

    // Handle service request deletion (DWxServiceRequests list)
    if (listName.toLowerCase().includes('servicerequests')) {
      const deleted = deleteTestServiceRequest(Number(itemId));
      if (!deleted) {
        throw new Error(`Service request ${itemId} not found`);
      }
    }
  }

  // ==================== TRANSFORM HELPERS ====================

  private transformServiceRequestsToListItems(requests: ServiceRequest[]): unknown[] {
    return requests.map((req) => ({
      id: String(req.Id),
      fields: {
        id: req.Id,
        Title: req.Title,
        ServiceId: req.ServiceId,
        ServiceName: req.ServiceName,
        AccountManagerName: req.AccountManagerName,
        AccountManagerEmail: req.AccountManagerEmail,
        AccountManagerTenant: req.AccountManagerTenant,
        ClientName: req.ClientName,
        ClientId: req.ClientId,
        ContactName: req.ContactName,
        ContactEmail: req.ContactEmail,
        ContactPhone: req.ContactPhone,
        Industry: req.Industry || req.ClientIndustry,
        CompanySize: req.CompanySize || req.ClientCompanySize,
        IsPremiumClient: req.IsPremiumClient,
        FunnelStage: req.FunnelStage,
        InterestLevel: req.InterestLevel,
        DealValue: req.DealValue,
        DealProbability: req.DealProbability,
        WeightedPipeline: req.WeightedPipeline,
        ExpectedCloseDate: req.ExpectedCloseDate,
        Budget: req.Budget,
        Timeline: req.Timeline,
        ProposedSlot1: req.ProposedSlot1,
        ProposedSlot2: req.ProposedSlot2,
        ProposedSlot3: req.ProposedSlot3,
        ConfirmedDateTime: req.ConfirmedDateTime,
        CalendarEventId: req.CalendarEventId,
        AssignedSpecialistName: req.AssignedSpecialistName,
        AssignedSpecialistEmail: req.AssignedSpecialistEmail,
        AssignedSpecialistRole: req.AssignedSpecialistRole,
        ServiceCategory: req.ServiceCategory,
        Requirements: req.Requirements,
        ServiceHistory: req.ServiceHistory,
        WinLossReason: req.WinLossReason,
        NextSteps: req.NextSteps,
        Comments: req.Comments,
        StageTimestamps_JSON: req.StageTimestamps ? JSON.stringify(req.StageTimestamps) : undefined,
        Created: req.Created,
        Modified: req.Modified,
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

  private transformProposalsToListItems(proposals: Proposal[]): unknown[] {
    return proposals.map((p) => ({
      id: String(p.Id),
      fields: {
        id: p.Id,
        Title: p.Title,
        ServiceRequestId: p.ServiceRequestId,
        Status: p.Status,
        Version: p.Version,
        ProposalType: p.ProposalType,
        TemplateName: p.TemplateName,
        ValidUntil: p.ValidUntil,
        SentDate: p.SentDate,
        ClientResponseDate: p.ClientResponseDate,
        ClientFeedback: p.ClientFeedback,
        InternalNotes: p.InternalNotes,
        DocumentUrl: p.DocumentUrl,
        CreatedByEmail: p.CreatedByEmail,
        CreatedByName: p.CreatedByName,
        ApprovedByEmail: p.ApprovedByEmail,
        ApprovedByName: p.ApprovedByName,
        ApprovedDate: p.ApprovedDate,
        // JSON section columns — serialize to strings as SharePoint would store them
        ExecutiveSummary_JSON: p.ExecutiveSummary ? JSON.stringify(p.ExecutiveSummary) : null,
        SolutionOverview_JSON: p.SolutionOverview ? JSON.stringify(p.SolutionOverview) : null,
        TechnologyStack_JSON: p.TechnologyStack ? JSON.stringify(p.TechnologyStack) : null,
        ScopeOfWork_JSON: p.ScopeOfWork ? JSON.stringify(p.ScopeOfWork) : null,
        PricingBreakdown_JSON: p.PricingBreakdown ? JSON.stringify(p.PricingBreakdown) : null,
        Timeline_JSON: p.Timeline ? JSON.stringify(p.Timeline) : null,
        TeamComposition_JSON: p.TeamComposition ? JSON.stringify(p.TeamComposition) : null,
        TermsAndConditions_JSON: p.Terms ? JSON.stringify(p.Terms) : null,
        ChangeControl_JSON: p.ChangeControl ? JSON.stringify(p.ChangeControl) : null,
        Assumptions_JSON: p.Assumptions.length > 0 ? JSON.stringify(p.Assumptions) : null,
        RisksAndMitigations_JSON: p.Risks.length > 0 ? JSON.stringify(p.Risks) : null,
        SigningPage_JSON: p.SigningPage ? JSON.stringify(p.SigningPage) : null,
        Created: p.Created,
        Modified: p.Modified,
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
