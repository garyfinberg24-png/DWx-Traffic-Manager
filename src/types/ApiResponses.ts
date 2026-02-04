export interface SharePointListResponse<T> {
  value: T[];
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
}

export interface SharePointItemResponse {
  d: SharePointItem;
}

export interface SharePointItem {
  Id: number;
  Title: string;
  AccountManagerName: string;
  AccountManagerEmail: string;
  ClientName: string;
  BookingType: string;
  LicenseCount: number;
  ProposedSlot1: string;
  ProposedSlot2: string;
  ProposedSlot3: string;
  ConfirmedDateTime?: string;
  Comments?: string;
  IsPremiumClient: boolean;
  Status: string;
  Outcome?: string;
  NextSteps?: string;
  CalendarEventId?: string;
  Created: string;
  Author?: {
    Title: string;
    Email: string;
  };
  __metadata?: {
    type: string;
  };
  // Assigned specialist fields
  AssignedSpecialistName?: string;
  AssignedSpecialistEmail?: string;
  AssignedSpecialistRole?: string;
  // Checklist fields
  ChecklistData?: string;
  ChecklistComplete?: boolean;
  ChecklistDueDate?: string;
  // Deal size and priority fields
  DealSize?: number;
  DealValue?: string;
  Priority?: string;
}

export interface GraphEventResponse {
  value: CalendarEvent[];
}

export interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  body?: {
    contentType: string;
    content: string;
  };
  location?: {
    displayName: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
    type: string;
  }>;
}

export interface PowerAutomateResponse {
  success: boolean;
  bookingId?: number;
  message?: string;
  calendarEventId?: string;
}

export interface PowerAutomatePayload {
  accountManagerName: string;
  accountManagerEmail: string;
  clientName: string;
  bookingType: 'Demo' | 'Deployment';
  licenseCount: number;
  proposedSlot1: string;
  proposedSlot2: string;
  proposedSlot3: string;
  comments: string;
  isPremiumClient: boolean;
}
