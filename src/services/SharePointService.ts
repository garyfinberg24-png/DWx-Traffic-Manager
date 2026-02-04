import { getGraphService, getAuthService } from './serviceFactory';
import { config } from '../config/environmentConfig';
import { Booking, BookingFormData, FilterCriteria } from '../types/Booking';

// Get the appropriate services based on test mode
const graphService = getGraphService();
const authService = getAuthService();

// Interface for SharePoint list item from Graph API
interface GraphListItem {
  id: string;
  fields: {
    id?: string;
    Title?: string;
    AccountManagerName?: string;
    AccountManagerEmail?: string;
    ClientName?: string;
    BookingType?: string;
    LicenseCount?: number;
    ProposedSlot1?: string;
    ProposedSlot2?: string;
    ProposedSlot3?: string;
    ConfirmedDateTime?: string;
    Comments?: string;
    IsPremiumClient?: boolean;
    Status?: string;
    Outcome?: string;
    NextSteps?: string;
    CalendarEventId?: string;
    Created?: string;
    ChecklistData?: string;
    ChecklistComplete?: boolean;
    ChecklistDueDate?: string;
    DealSize?: number;
    DealValue?: string;
    Priority?: string;
    // Assigned specialist fields
    AssignedSpecialistName?: string;
    AssignedSpecialistEmail?: string;
    AssignedSpecialistRole?: string;
  };
}

class SharePointService {
  private get listName(): string {
    return config.sharepoint.listName;
  }

  async getBookings(filter?: FilterCriteria): Promise<Booking[]> {
    try {
      // Get current user for filtering
      const user = await authService.getUserProfile();

      // Use Graph API to get list items
      const items = (await graphService.getListItems(this.listName, {
        top: 500, // Increased for managers viewing all bookings
      })) as GraphListItem[];

      // Transform items
      let bookings = items.map((item) => this.transformGraphItem(item));

      // Role-based filtering:
      // - If showAllBookings is true (managers), show all bookings
      // - If accountManagerEmail is specified, filter by that
      // - If assignedSpecialistEmail is specified, filter by that
      // - Otherwise, filter by current user (as AM or assigned specialist)
      if (!filter?.showAllBookings) {
        if (filter?.accountManagerEmail) {
          // Filter by specific Account Manager
          bookings = bookings.filter((b) => b.AccountManagerEmail === filter.accountManagerEmail);
        } else if (filter?.assignedSpecialistEmail) {
          // Filter by assigned specialist
          bookings = bookings.filter((b) => b.AssignedSpecialistEmail === filter.assignedSpecialistEmail);
        } else {
          // Default: show bookings where user is AM or assigned specialist
          bookings = bookings.filter(
            (b) =>
              b.AccountManagerEmail === user.email ||
              b.AssignedSpecialistEmail === user.email
          );
        }
      }

      // Apply additional filters
      if (filter?.status && filter.status.length > 0) {
        bookings = bookings.filter((b) => filter.status!.includes(b.Status));
      }

      if (filter?.bookingType && filter.bookingType.length > 0) {
        bookings = bookings.filter((b) => filter.bookingType!.includes(b.BookingType));
      }

      if (filter?.search) {
        const searchLower = filter.search.toLowerCase();
        bookings = bookings.filter(
          (b) =>
            b.ClientName.toLowerCase().includes(searchLower) ||
            b.AccountManagerName.toLowerCase().includes(searchLower) ||
            (b.AssignedSpecialistName && b.AssignedSpecialistName.toLowerCase().includes(searchLower)) ||
            (b.Comments && b.Comments.toLowerCase().includes(searchLower))
        );
      }

      // Sort by Created descending
      bookings.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

      return bookings;
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  async getBookingById(id: number): Promise<Booking> {
    try {
      const item = (await graphService.getListItemById(this.listName, id)) as GraphListItem;
      return this.transformGraphItem(item);
    } catch (error) {
      console.error(`Failed to fetch booking ${id}:`, error);
      throw new Error(`Failed to fetch booking ${id}`);
    }
  }

  async createBooking(data: BookingFormData, user: { name: string; email: string }): Promise<Booking> {
    try {
      const fields: Record<string, unknown> = {
        Title: data.clientName,
        AccountManagerName: user.name,
        AccountManagerEmail: user.email,
        ClientName: data.clientName,
        BookingType: data.bookingType,
        LicenseCount: data.licenseCount,
        ProposedSlot1: data.proposedSlot1.toISOString(),
        ProposedSlot2: data.proposedSlot2.toISOString(),
        ProposedSlot3: data.proposedSlot3.toISOString(),
        Comments: data.comments || '',
        IsPremiumClient: data.isPremiumClient,
        Status: 'Pending Review',
      };

      // Include optional deal/priority fields if provided
      const optionalFields: Record<string, unknown> = {};
      if (data.dealSize !== undefined && data.dealSize !== null && data.dealSize > 0) {
        optionalFields.DealSize = data.dealSize;
        optionalFields.DealValue = `R ${(data.dealSize * 90).toLocaleString()}`;
      }
      if (data.priority && data.priority !== 'Normal') {
        optionalFields.Priority = data.priority;
      }

      // Attempt with optional fields first, retry without if it fails
      let result;
      try {
        result = await graphService.createListItem(this.listName, { ...fields, ...optionalFields });
      } catch {
        // Optional fields (DealSize, DealValue, Priority) may not exist in SharePoint list
        // Retry without them
        console.warn('Booking create failed with optional fields, retrying without deal/priority fields');
        result = await graphService.createListItem(this.listName, fields);
      }

      // Fetch the created item to get all fields including Created date
      return this.getBookingById(parseInt(result.id));
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  async updateBooking(id: number, updates: Partial<Booking>): Promise<Booking> {
    try {
      // Convert Booking updates to Graph API field format
      const fields: Record<string, unknown> = {};

      if (updates.Title !== undefined) fields.Title = updates.Title;
      if (updates.AccountManagerName !== undefined) fields.AccountManagerName = updates.AccountManagerName;
      if (updates.AccountManagerEmail !== undefined) fields.AccountManagerEmail = updates.AccountManagerEmail;
      if (updates.ClientName !== undefined) fields.ClientName = updates.ClientName;
      if (updates.BookingType !== undefined) fields.BookingType = updates.BookingType;
      if (updates.LicenseCount !== undefined) fields.LicenseCount = updates.LicenseCount;
      if (updates.ProposedSlot1 !== undefined) fields.ProposedSlot1 = updates.ProposedSlot1;
      if (updates.ProposedSlot2 !== undefined) fields.ProposedSlot2 = updates.ProposedSlot2;
      if (updates.ProposedSlot3 !== undefined) fields.ProposedSlot3 = updates.ProposedSlot3;
      if (updates.ConfirmedDateTime !== undefined) fields.ConfirmedDateTime = updates.ConfirmedDateTime;
      if (updates.Comments !== undefined) fields.Comments = updates.Comments;
      if (updates.IsPremiumClient !== undefined) fields.IsPremiumClient = updates.IsPremiumClient;
      if (updates.Status !== undefined) fields.Status = updates.Status;
      if (updates.Outcome !== undefined) fields.Outcome = updates.Outcome;
      if (updates.NextSteps !== undefined) fields.NextSteps = updates.NextSteps;
      if (updates.CalendarEventId !== undefined) fields.CalendarEventId = updates.CalendarEventId;
      if (updates.ChecklistData !== undefined) fields.ChecklistData = updates.ChecklistData;
      if (updates.ChecklistComplete !== undefined) fields.ChecklistComplete = updates.ChecklistComplete;
      if (updates.ChecklistDueDate !== undefined) fields.ChecklistDueDate = updates.ChecklistDueDate;
      if (updates.DealSize !== undefined) fields.DealSize = updates.DealSize;
      if (updates.DealValue !== undefined) fields.DealValue = updates.DealValue;
      if (updates.Priority !== undefined) fields.Priority = updates.Priority;
      // Assigned specialist fields
      if (updates.AssignedSpecialistName !== undefined) fields.AssignedSpecialistName = updates.AssignedSpecialistName;
      if (updates.AssignedSpecialistEmail !== undefined) fields.AssignedSpecialistEmail = updates.AssignedSpecialistEmail;
      if (updates.AssignedSpecialistRole !== undefined) fields.AssignedSpecialistRole = updates.AssignedSpecialistRole;

      await graphService.updateListItem(this.listName, id, fields);
      return this.getBookingById(id);
    } catch (error) {
      console.error(`Failed to update booking ${id}:`, error);
      throw new Error(`Failed to update booking ${id}`);
    }
  }

  async deleteBooking(id: number): Promise<void> {
    try {
      await graphService.deleteListItem(this.listName, id);
    } catch (error) {
      console.error(`Failed to delete booking ${id}:`, error);
      throw new Error(`Failed to delete booking ${id}`);
    }
  }

  // Update checklist data for a booking
  async updateChecklist(id: number, checklistData: string, isComplete: boolean): Promise<Booking> {
    return this.updateBooking(id, {
      ChecklistData: checklistData,
      ChecklistComplete: isComplete,
    } as Partial<Booking>);
  }

  // Get all bookings (for dashboard/admin views - no user filter)
  async getAllBookings(): Promise<Booking[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 500,
      })) as GraphListItem[];

      const bookings = items.map((item) => this.transformGraphItem(item));

      // Sort by Created descending
      bookings.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

      return bookings;
    } catch (error) {
      console.error('Failed to fetch all bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  private transformGraphItem(item: GraphListItem): Booking {
    const fields = item.fields || {};
    return {
      Id: parseInt(item.id) || parseInt(fields.id || '0'),
      Title: fields.Title || '',
      AccountManagerName: fields.AccountManagerName || '',
      AccountManagerEmail: fields.AccountManagerEmail || '',
      ClientName: fields.ClientName || '',
      BookingType: (fields.BookingType as 'Demo' | 'Deployment') || 'Demo',
      LicenseCount: fields.LicenseCount || 0,
      ProposedSlot1: fields.ProposedSlot1 || '',
      ProposedSlot2: fields.ProposedSlot2 || '',
      ProposedSlot3: fields.ProposedSlot3 || '',
      ConfirmedDateTime: fields.ConfirmedDateTime,
      Comments: fields.Comments,
      IsPremiumClient: fields.IsPremiumClient || false,
      Status: (fields.Status as Booking['Status']) || 'Pending Review',
      Outcome: fields.Outcome,
      NextSteps: fields.NextSteps,
      CalendarEventId: fields.CalendarEventId,
      Created: fields.Created || new Date().toISOString(),
      CreatedBy: {
        Title: fields.AccountManagerName || '',
        Email: fields.AccountManagerEmail || '',
      },
      // Assigned specialist fields
      AssignedSpecialistName: fields.AssignedSpecialistName,
      AssignedSpecialistEmail: fields.AssignedSpecialistEmail,
      AssignedSpecialistRole: fields.AssignedSpecialistRole as Booking['AssignedSpecialistRole'],
      // Checklist fields
      ChecklistData: fields.ChecklistData,
      ChecklistComplete: fields.ChecklistComplete,
      ChecklistDueDate: fields.ChecklistDueDate,
      DealSize: fields.DealSize,
      DealValue: fields.DealValue,
      Priority: fields.Priority as Booking['Priority'],
    };
  }
}

export const sharePointService = new SharePointService();
