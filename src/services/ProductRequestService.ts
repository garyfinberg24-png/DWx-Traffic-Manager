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

      const filterParts: string[] = [];
      if (filters?.accountManagerEmail) {
        filterParts.push(`fields/AccountManagerEmail eq '${filters.accountManagerEmail}'`);
      }
      if (filters?.productType) {
        filterParts.push(`fields/ProductType eq '${filters.productType}'`);
      }

      const items = await graphService.getListItems(this.listName, {
        filter: filterParts.length > 0 ? filterParts.join(' and ') : undefined,
        orderBy: 'fields/Created desc',
      }) as Record<string, unknown>[];

      let requests = items.map((item) => this.mapToProductRequest(item));

      // Client-side status filtering (OData choice filtering can be unreliable)
      if (filters?.status && filters.status.length > 0) {
        requests = requests.filter((r) => filters.status!.includes(r.Status));
      }

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

      // Increment specialist deal count
      try {
        await specialistService.incrementDealCount(specialist.Id);
      } catch (countError) {
        console.error('Failed to increment specialist deal count:', countError);
      }

      // Audit log
      await auditService.logUpdate(
        'ProductRequest',
        requestId,
        request.Title,
        { specialist: null },
        { specialist: specialist.Title, assignedBy: userName }
      );

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
