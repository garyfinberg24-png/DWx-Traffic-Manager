/**
 * DWx Traffic Manager - Product Request Service
 * Manages product demo and trial deployment requests (DWxProductRequests SharePoint list)
 */

import { config } from '../config/environmentConfig';
import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import { dwxNotificationService } from './DWxNotificationService';
import { specialistService } from './SpecialistService';
import { Specialist } from '../types/ServiceRequest';
import {
  ProductRequest,
  CreateProductRequestInput,
  ProductRequestResult,
  ProductRequestStatus,
  ProductRequestFilters,
} from '../types/ProductRequest';

class ProductRequestService {
  private readonly listName = config.sharepoint.productRequestsListName;

  /**
   * Create a new product request
   */
  async createRequest(
    data: CreateProductRequestInput,
    userEmail: string,
    userName: string
  ): Promise<ProductRequestResult> {
    try {
      const graphService = getGraphService();

      // Generate title: "Client - Product (RequestType)"
      const title = `${data.ClientName} - ${data.ProductName} (${data.RequestType})`;

      const itemData: Record<string, unknown> = {
        Title: title,
        ProductId: data.ProductId,
        ProductName: data.ProductName,
        ProductType: data.ProductType,
        ProductCategory: data.ProductCategory || '',
        RequestType: data.RequestType,
        AccountManagerName: userName,
        AccountManagerEmail: userEmail,
        ClientName: data.ClientName,
        ContactName: data.ContactName,
        ContactEmail: data.ContactEmail,
        ContactPhone: data.ContactPhone || '',
        Industry: data.Industry || '',
        CompanySize: data.CompanySize || '',
        IsPremiumClient: data.IsPremiumClient ? 1 : 0,
        Status: 'Pending Review' as ProductRequestStatus,
        LicenseCount: data.LicenseCount || 0,
        EstimatedValue: data.EstimatedValue || 0,
        ProposedSlot1: data.ProposedSlot1,
        ProposedSlot2: data.ProposedSlot2 || '',
        ProposedSlot3: data.ProposedSlot3 || '',
        ProductRequirements: data.ProductRequirements || '',
        Comments: data.Comments || '',
      };

      const result = await graphService.createListItem(this.listName, itemData);
      const request = this.mapToProductRequest(result);

      // Audit log
      await auditService.logCreate('ProductRequest', request.Id, title, {
        productName: data.ProductName,
        productType: data.ProductType,
        requestType: data.RequestType,
        clientName: data.ClientName,
      });

      // Send notifications to AM and managers
      try {
        await dwxNotificationService.sendProductRequestCreatedNotifications(request);
      } catch (notifError) {
        console.error('Failed to send product request notifications:', notifError);
      }

      return {
        success: true,
        request,
      };
    } catch (error) {
      console.error('Error creating product request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating product request',
      };
    }
  }

  /**
   * Get all product requests with optional filtering
   */
  async getRequests(filters?: ProductRequestFilters): Promise<ProductRequest[]> {
    try {
      const graphService = getGraphService();

      // Fetch all items and filter client-side (avoids non-indexed column issues)
      const items = await graphService.getListItems(this.listName) as Record<string, unknown>[];

      let requests = items.map((item) => this.mapToProductRequest(item));

      // Apply filters client-side
      if (filters?.accountManagerEmail) {
        requests = requests.filter((r) => r.AccountManagerEmail === filters.accountManagerEmail);
      }
      if (filters?.productType) {
        requests = requests.filter((r) => r.ProductType === filters.productType);
      }
      if (filters?.status && filters.status.length > 0) {
        requests = requests.filter((r) => filters.status!.includes(r.Status));
      }

      // Sort by Created descending
      requests.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

      return requests;
    } catch (error) {
      console.error('Error fetching product requests:', error);
      return [];
    }
  }

  /**
   * Get a single product request by ID
   */
  async getRequestById(id: number): Promise<ProductRequest | null> {
    try {
      const graphService = getGraphService();
      const item = await graphService.getListItemById(this.listName, id) as Record<string, unknown> | null;
      if (!item) return null;
      return this.mapToProductRequest(item);
    } catch (error) {
      console.error('Error fetching product request:', error);
      return null;
    }
  }

  /**
   * Get product requests for a specific user
   */
  async getRequestsByUser(email: string): Promise<ProductRequest[]> {
    return this.getRequests({ accountManagerEmail: email });
  }

  /**
   * Update product request status
   */
  async updateStatus(
    id: number,
    status: ProductRequestStatus,
    _userEmail: string,
    userName: string
  ): Promise<ProductRequestResult> {
    try {
      const graphService = getGraphService();

      // Get current request for audit trail
      const current = await this.getRequestById(id);
      if (!current) {
        return { success: false, error: 'Product request not found' };
      }

      const previousStatus = current.Status;
      await graphService.updateListItem(this.listName, id, { Status: status });

      // Decrement specialist deal count when request is completed or cancelled
      const terminalStatuses: ProductRequestStatus[] = ['Completed', 'Cancelled'];
      if (terminalStatuses.includes(status) && !terminalStatuses.includes(previousStatus) && current.AssignedSpecialistEmail) {
        try {
          const specialist = await specialistService.getSpecialistByEmail(current.AssignedSpecialistEmail);
          if (specialist) {
            await specialistService.decrementDealCount(specialist.Id);
          }
        } catch (specError) {
          console.error('Failed to decrement specialist deal count:', specError);
        }
      }

      // Audit log
      await auditService.logUpdate('ProductRequest', id, current.Title,
        { status: previousStatus },
        { status, changedBy: userName }
      );

      // Notify AM of status change
      try {
        await dwxNotificationService.notifyProductRequestStatusChanged(current, previousStatus, status);
      } catch (notifError) {
        console.error('Failed to send status change notification:', notifError);
      }

      // Notify managers of status change (N3)
      try {
        await dwxNotificationService.notifyProductRequestStatusChangedManagers(current, previousStatus, status);
      } catch (notifError) {
        console.error('Failed to send manager status change notification:', notifError);
      }

      const updated = await this.getRequestById(id);
      return {
        success: true,
        request: updated || undefined,
      };
    } catch (error) {
      console.error('Error updating product request status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating status',
      };
    }
  }

  /**
   * Assign a specialist to a product request
   */
  async assignSpecialist(
    requestId: number,
    specialist: Specialist,
    _userEmail: string,
    userName: string
  ): Promise<ProductRequestResult> {
    try {
      const graphService = getGraphService();

      // Check for previously assigned specialist (reassignment case)
      const currentRequest = await this.getRequestById(requestId);
      if (!currentRequest) {
        return { success: false, error: 'Product request not found' };
      }
      const previousSpecialistEmail = currentRequest.AssignedSpecialistEmail;

      const updateData = {
        AssignedSpecialistName: specialist.Title,
        AssignedSpecialistEmail: specialist.Email,
        AssignedSpecialistRole: specialist.Role,
      };

      await graphService.updateListItem(this.listName, requestId, updateData);

      // Get updated request
      const request = await this.getRequestById(requestId);
      if (!request) {
        return { success: false, error: 'Product request not found after update' };
      }

      // Update specialist deal counts
      try {
        // Decrement previous specialist's deal count if reassigning
        if (previousSpecialistEmail && previousSpecialistEmail !== specialist.Email) {
          const previousSpecialist = await specialistService.getSpecialistByEmail(previousSpecialistEmail);
          if (previousSpecialist) {
            await specialistService.decrementDealCount(previousSpecialist.Id);
          }
        }
        // Increment new specialist's deal count
        await specialistService.incrementDealCount(specialist.Id);
      } catch (countError) {
        console.error('Failed to update specialist deal counts:', countError);
      }

      // Audit log
      await auditService.logUpdate(
        'ProductRequest',
        requestId,
        request.Title,
        { specialist: previousSpecialistEmail || null },
        { specialist: specialist.Title, assignedBy: userName }
      );

      // Send specialist assignment notifications (N1)
      try {
        await dwxNotificationService.sendProductSpecialistAssignedNotifications(
          request,
          specialist.Title,
          specialist.Email,
          specialist.Role
        );
      } catch (notifError) {
        console.error('Failed to send product specialist assignment notifications:', notifError);
      }

      // Notify previous specialist of reassignment (N2)
      if (previousSpecialistEmail && previousSpecialistEmail !== specialist.Email && currentRequest.AssignedSpecialistName) {
        try {
          await dwxNotificationService.notifySpecialistReassigned(
            'Product Request',
            request.Title,
            request.ClientName,
            currentRequest.AssignedSpecialistName,
            previousSpecialistEmail,
            specialist.Title
          );
        } catch (notifError) {
          console.error('Failed to send specialist reassignment notification:', notifError);
        }
      }

      return {
        success: true,
        request,
      };
    } catch (error) {
      console.error('Error assigning specialist to product request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error assigning specialist',
      };
    }
  }

  /**
   * Confirm a product demo/trial slot and create a calendar event
   */
  async confirmProductDemo(
    requestId: number,
    confirmedSlot: string,
    _userEmail: string,
    userName: string
  ): Promise<ProductRequestResult> {
    const warnings: string[] = [];

    try {
      const graphService = getGraphService();

      // Get current request
      const request = await this.getRequestById(requestId);
      if (!request) {
        return { success: false, error: 'Product request not found' };
      }

      // Check for calendar conflicts before booking
      try {
        const conflictStart = new Date(confirmedSlot);
        const conflictEnd = new Date(conflictStart.getTime() + 60 * 60 * 1000); // 1hr default
        const conflictResult = await graphService.checkCalendarConflicts(conflictStart, conflictEnd);
        if (conflictResult.hasConflict) {
          return {
            success: false,
            error: `Calendar conflict detected: ${conflictResult.conflicts?.map((c: { subject?: string }) => c.subject || 'Busy').join(', ')}`,
          };
        }
      } catch (conflictError) {
        console.error('Failed to check calendar conflicts:', conflictError);
        warnings.push('Could not verify calendar availability');
      }

      // Create calendar event
      let calendarEventId: string | undefined;
      try {
        const eventResult = await this.createProductDemoCalendarEvent(request, confirmedSlot);
        calendarEventId = eventResult.id;
      } catch (calError) {
        console.error('Failed to create calendar event for product demo:', calError);
        warnings.push('Calendar event could not be created');

        // Escalate calendar failure to managers (N5)
        try {
          await dwxNotificationService.notifyCalendarEventFailed(
            'Product Request', request.Title, request.ClientName, confirmedSlot, request.AccountManagerName
          );
        } catch (escalateError) {
          console.error('Failed to escalate calendar failure:', escalateError);
        }
      }

      // Update request with confirmed slot and calendar event ID
      const updateData: Record<string, unknown> = {
        Status: 'Confirmed' as ProductRequestStatus,
        ConfirmedDateTime: confirmedSlot,
      };

      if (calendarEventId) {
        updateData.CalendarEventId = calendarEventId;
      }

      await graphService.updateListItem(this.listName, requestId, updateData);

      // Audit log
      await auditService.logUpdate(
        'ProductRequest',
        requestId,
        request.Title,
        { status: request.Status },
        { status: 'Confirmed', confirmedSlot, confirmedBy: userName }
      );

      // Notify AM of confirmation
      try {
        await dwxNotificationService.notifyProductRequestStatusChanged(request, request.Status, 'Confirmed');
      } catch (notifError) {
        console.error('Failed to send product demo confirmation notification:', notifError);
        warnings.push('Demo confirmed but notifications failed to send');
      }

      // Notify managers of confirmation (N3)
      try {
        await dwxNotificationService.notifyProductRequestStatusChangedManagers(request, request.Status, 'Confirmed');
      } catch (notifError) {
        console.error('Failed to send manager confirmation notification:', notifError);
      }

      // Notify specialist of confirmed demo slot (N6)
      if (request.AssignedSpecialistEmail && request.AssignedSpecialistName) {
        try {
          await dwxNotificationService.notifyProductDemoConfirmedSpecialist(
            request, request.AssignedSpecialistName, request.AssignedSpecialistEmail, confirmedSlot
          );
        } catch (notifError) {
          console.error('Failed to send specialist confirmation notification:', notifError);
        }
      }

      const updated = await this.getRequestById(requestId);
      return {
        success: true,
        request: updated || undefined,
        calendarEventId,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Error confirming product demo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error confirming demo',
      };
    }
  }

  /**
   * Create a calendar event for a product demo/trial
   */
  private async createProductDemoCalendarEvent(
    request: ProductRequest,
    confirmedSlot: string
  ): Promise<{ id: string }> {
    const graphService = getGraphService();

    const startTime = new Date(confirmedSlot);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour

    const attendees = [
      request.AccountManagerEmail,
      request.ContactEmail,
    ];

    if (request.AssignedSpecialistEmail) {
      attendees.push(request.AssignedSpecialistEmail);
    }

    const typeLabel = request.RequestType === 'Demo' ? 'Product Demo' : 'Trial Deployment';

    const body = `
      <h2>${typeLabel}: ${request.ProductName}</h2>
      <p><strong>Client:</strong> ${request.ClientName}</p>
      <p><strong>Contact:</strong> ${request.ContactName} (${request.ContactEmail})</p>
      <p><strong>Product:</strong> ${request.ProductName} (${request.ProductType})</p>
      <p><strong>Request Type:</strong> ${request.RequestType}</p>
      ${request.LicenseCount ? `<p><strong>License Count:</strong> ${request.LicenseCount}</p>` : ''}
      ${request.EstimatedValue ? `<p><strong>Estimated Value:</strong> R${request.EstimatedValue.toLocaleString()}</p>` : ''}
      ${request.ProductRequirements ? `<hr/><h3>Requirements</h3><p>${request.ProductRequirements}</p>` : ''}
    `;

    return await graphService.createMyCalendarEvent({
      subject: `${typeLabel}: ${request.ClientName} - ${request.ProductName}`,
      start: startTime,
      end: endTime,
      body,
      location: 'Microsoft Teams Meeting',
      attendees,
    });
  }

  /**
   * Map SharePoint list item to ProductRequest
   */
  private mapToProductRequest(item: Record<string, unknown>): ProductRequest {
    const fields = (item.fields as Record<string, unknown>) || item;

    return {
      Id: (item.id as number) || (fields.Id as number) || (fields.id as number),
      Title: (fields.Title as string) || '',
      ProductId: (fields.ProductId as string) || '',
      ProductName: (fields.ProductName as string) || '',
      ProductType: (fields.ProductType as ProductRequest['ProductType']) || 'App',
      ProductCategory: fields.ProductCategory as string,
      RequestType: (fields.RequestType as ProductRequest['RequestType']) || 'Demo',
      AccountManagerName: (fields.AccountManagerName as string) || '',
      AccountManagerEmail: (fields.AccountManagerEmail as string) || '',
      AccountManagerTenant: fields.AccountManagerTenant as string,
      ClientName: (fields.ClientName as string) || '',
      ContactName: (fields.ContactName as string) || '',
      ContactEmail: (fields.ContactEmail as string) || '',
      ContactPhone: fields.ContactPhone as string,
      Industry: fields.Industry as string,
      CompanySize: fields.CompanySize as string,
      IsPremiumClient: !!(fields.IsPremiumClient),
      Status: (fields.Status as ProductRequestStatus) || 'Pending Review',
      LicenseCount: fields.LicenseCount as number,
      EstimatedValue: fields.EstimatedValue as number,
      ProposedSlot1: fields.ProposedSlot1 as string,
      ProposedSlot2: fields.ProposedSlot2 as string,
      ProposedSlot3: fields.ProposedSlot3 as string,
      ConfirmedDateTime: fields.ConfirmedDateTime as string,
      CalendarEventId: fields.CalendarEventId as string,
      AssignedSpecialistName: fields.AssignedSpecialistName as string,
      AssignedSpecialistEmail: fields.AssignedSpecialistEmail as string,
      AssignedSpecialistRole: fields.AssignedSpecialistRole as string,
      ProductRequirements: fields.ProductRequirements as string,
      Comments: fields.Comments as string,
      Outcome: fields.Outcome as string,
      NextSteps: fields.NextSteps as string,
      Created: (fields.Created as string) || new Date().toISOString(),
      Modified: fields.Modified as string,
    };
  }
}

export const productRequestService = new ProductRequestService();
