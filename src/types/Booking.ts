export type BookingPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface DealSize {
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
}

export interface Booking {
  Id: number;
  Title: string;
  AccountManagerName: string;
  AccountManagerEmail: string;
  ClientName: string;
  BookingType: 'Demo' | 'Deployment';
  LicenseCount: number;
  ProposedSlot1: string; // ISO date string
  ProposedSlot2: string;
  ProposedSlot3: string;
  ConfirmedDateTime?: string;
  Comments?: string;
  IsPremiumClient: boolean;
  Status: BookingStatus;
  Outcome?: string;
  NextSteps?: string;
  CalendarEventId?: string;
  Created: string;
  CreatedBy: {
    Title: string;
    Email: string;
  };
  // Assigned specialist (Demo Specialist or Developer for deployments)
  AssignedSpecialistName?: string;
  AssignedSpecialistEmail?: string;
  AssignedSpecialistRole?: 'Demo Specialist' | 'Developer' | 'Implementer' | 'Support' | 'Project Manager';
  // Deployment checklist fields (JSON stored in SharePoint)
  ChecklistData?: string; // JSON string of ChecklistItem[]
  ChecklistComplete?: boolean;
  ChecklistDueDate?: string;
  // Deal size and priority fields
  DealSize?: number;
  DealValue?: string; // Free-form deal value/currency description
  Priority?: BookingPriority;
}

export type BookingStatus =
  | 'Pending Review'
  | 'Awaiting Approval'
  | 'Confirmed'
  | 'Cancelled'
  | 'Rescheduling Required'
  | 'Deleted';

export interface BookingFormData {
  clientName: string;
  bookingType: 'Demo' | 'Deployment';
  licenseCount: number;
  proposedSlot1: Date;
  proposedSlot2: Date;
  proposedSlot3: Date;
  comments?: string;
  isPremiumClient: boolean;
  dealSize?: number;
  dealValue?: string; // Free-form deal value/currency description
  priority?: BookingPriority;
}

export interface FilterCriteria {
  status?: BookingStatus[];
  bookingType?: ('Demo' | 'Deployment')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  // Role-based filtering
  accountManagerEmail?: string; // Filter by specific AM
  assignedSpecialistEmail?: string; // Filter by assigned specialist
  showAllBookings?: boolean; // For managers to see all bookings
}

export const BOOKING_STATUS_OPTIONS: BookingStatus[] = [
  'Pending Review',
  'Awaiting Approval',
  'Confirmed',
  'Cancelled',
  'Rescheduling Required',
];

export const BOOKING_TYPE_OPTIONS: ('Demo' | 'Deployment')[] = ['Demo', 'Deployment'];

export const BOOKING_PRIORITY_OPTIONS: BookingPriority[] = ['Low', 'Normal', 'High', 'Urgent'];

/**
 * Data required to create a new booking (used by BookingService)
 */
export interface CreateBookingData {
  clientName: string;
  bookingType: 'Demo' | 'Deployment';
  licenseCount: number;
  proposedSlot1: string; // ISO date string
  proposedSlot2: string;
  proposedSlot3: string;
  comments?: string;
  isPremiumClient: boolean;
  dealSize?: number;
  dealValue?: string;
  priority?: BookingPriority;
}

/**
 * Result types for booking operations (moved from BookingService)
 */
export interface ApprovalResult {
  success: boolean;
  booking?: Booking;
  calendarEventUpdated: boolean;
  notificationSent: boolean;
  error?: string;
  warnings?: string[];
}

export interface RescheduleResult {
  success: boolean;
  booking?: Booking;
  oldCalendarEventDeleted: boolean;
  notificationSent: boolean;
  error?: string;
}

export interface CancellationResult {
  success: boolean;
  booking?: Booking;
  calendarEventDeleted: boolean;
  notificationSent: boolean;
  error?: string;
}

export interface DeletionResult {
  success: boolean;
  calendarEventDeleted: boolean;
  notificationSent: boolean;
  error?: string;
}
