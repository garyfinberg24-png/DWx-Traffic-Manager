/**
 * DWx Traffic Manager - Service Catalog Service
 * Manages the service catalog (DWxServices SharePoint list)
 */

import { config } from '../config/environmentConfig';
import { getGraphService } from './serviceFactory';
import {
  DWService,
  DWServiceInput,
  ServiceCategory,
  DEFAULT_SERVICES,
  SpecialistRole,
} from '../types/ServiceRequest';

class ServiceCatalogService {
  private readonly listName = config.sharepoint.servicesListName;

  /**
   * Get all services from the catalog
   */
  async getServices(activeOnly: boolean = true): Promise<DWService[]> {
    try {
      const graphService = getGraphService();
      const filter = activeOnly ? "fields/IsActive eq true" : undefined;

      const items = await graphService.getListItems(this.listName, {
        filter,
        orderBy: "fields/SortOrder",
      }) as Record<string, unknown>[];

      return items.map(this.mapToService);
    } catch (error) {
      console.error('Error fetching services:', error);
      // Return default services as fallback
      return this.getDefaultServices(activeOnly);
    }
  }

  /**
   * Get a single service by ID
   */
  async getServiceById(id: number): Promise<DWService | null> {
    try {
      const graphService = getGraphService();
      const item = await graphService.getListItemById(this.listName, id) as Record<string, unknown> | null;

      if (!item) return null;

      return this.mapToService(item);
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  }

  /**
   * Get services by category
   */
  async getServicesByCategory(category: ServiceCategory): Promise<DWService[]> {
    try {
      const graphService = getGraphService();
      const filter = `fields/Category eq '${category}' and fields/IsActive eq true`;

      const items = await graphService.getListItems(this.listName, {
        filter,
      }) as Record<string, unknown>[];

      return items.map(this.mapToService);
    } catch (error) {
      console.error('Error fetching services by category:', error);
      return [];
    }
  }

  /**
   * Create a new service
   */
  async createService(data: DWServiceInput): Promise<DWService> {
    try {
      const graphService = getGraphService();

      const itemData = {
        Title: data.Title,
        Description: data.Description,
        ShortDescription: data.ShortDescription,
        Category: data.Category,
        TypicalDuration: data.TypicalDuration,
        ComplexityLevel: data.ComplexityLevel,
        PricingModel: data.PricingModel,
        BasePrice: data.BasePrice,
        RequiredRoles: JSON.stringify(data.RequiredRoles),
        Prerequisites: data.Prerequisites,
        IsActive: data.IsActive,
        SortOrder: data.SortOrder,
        IconName: data.IconName,
      };

      const result = await graphService.createListItem(this.listName, itemData);

      return this.mapToService(result);
    } catch (error) {
      console.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Update an existing service
   */
  async updateService(id: number, data: Partial<DWServiceInput>): Promise<DWService> {
    try {
      const graphService = getGraphService();

      const itemData: Record<string, unknown> = {};

      if (data.Title !== undefined) itemData.Title = data.Title;
      if (data.Description !== undefined) itemData.Description = data.Description;
      if (data.ShortDescription !== undefined) itemData.ShortDescription = data.ShortDescription;
      if (data.Category !== undefined) itemData.Category = data.Category;
      if (data.TypicalDuration !== undefined) itemData.TypicalDuration = data.TypicalDuration;
      if (data.ComplexityLevel !== undefined) itemData.ComplexityLevel = data.ComplexityLevel;
      if (data.PricingModel !== undefined) itemData.PricingModel = data.PricingModel;
      if (data.BasePrice !== undefined) itemData.BasePrice = data.BasePrice;
      if (data.RequiredRoles !== undefined) itemData.RequiredRoles = JSON.stringify(data.RequiredRoles);
      if (data.Prerequisites !== undefined) itemData.Prerequisites = data.Prerequisites;
      if (data.IsActive !== undefined) itemData.IsActive = data.IsActive;
      if (data.SortOrder !== undefined) itemData.SortOrder = data.SortOrder;
      if (data.IconName !== undefined) itemData.IconName = data.IconName;

      const result = await graphService.updateListItem(this.listName, id, itemData);

      return this.mapToService(result);
    } catch (error) {
      console.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Deactivate a service (soft delete)
   */
  async deactivateService(id: number): Promise<void> {
    try {
      const graphService = getGraphService();
      await graphService.updateListItem(this.listName, id, { IsActive: false });
    } catch (error) {
      console.error('Error deactivating service:', error);
      throw error;
    }
  }

  /**
   * Seed the service catalog with default services
   */
  async seedDefaultServices(): Promise<DWService[]> {
    const createdServices: DWService[] = [];

    for (const serviceInput of DEFAULT_SERVICES) {
      try {
        const service = await this.createService(serviceInput);
        createdServices.push(service);
      } catch (error) {
        console.error(`Error creating service ${serviceInput.Title}:`, error);
      }
    }

    return createdServices;
  }

  /**
   * Get default services (fallback when SharePoint unavailable)
   */
  private getDefaultServices(activeOnly: boolean): DWService[] {
    return DEFAULT_SERVICES
      .filter(s => !activeOnly || s.IsActive)
      .map((s, index) => ({
        Id: -(index + 1), // Negative IDs for default services
        Title: s.Title,
        Description: s.Description,
        ShortDescription: s.ShortDescription,
        Category: s.Category,
        TypicalDuration: s.TypicalDuration,
        ComplexityLevel: s.ComplexityLevel,
        PricingModel: s.PricingModel,
        BasePrice: s.BasePrice,
        RequiredRoles: s.RequiredRoles,
        Prerequisites: s.Prerequisites,
        IsActive: s.IsActive,
        SortOrder: s.SortOrder,
        IconName: s.IconName,
      }));
  }

  /**
   * Map SharePoint list item to DWService
   */
  private mapToService(item: Record<string, unknown>): DWService {
    let requiredRoles: SpecialistRole[] = [];
    try {
      const rolesField = this.getFieldValue(item, 'RequiredRoles', '');
      if (rolesField) {
        requiredRoles = JSON.parse(rolesField as string) as SpecialistRole[];
      }
    } catch {
      requiredRoles = [];
    }

    return {
      Id: item.id as number,
      Title: (item.fields as Record<string, unknown>)?.Title as string || item.Title as string || '',
      Description: this.getFieldValue(item, 'Description', ''),
      ShortDescription: this.getFieldValue(item, 'ShortDescription', ''),
      Category: this.getFieldValue(item, 'Category', 'Power Platform') as ServiceCategory,
      TypicalDuration: this.getFieldValue(item, 'TypicalDuration', '1hr'),
      ComplexityLevel: this.getFieldValue(item, 'ComplexityLevel', 'Medium'),
      PricingModel: this.getFieldValue(item, 'PricingModel', 'TBD'),
      BasePrice: this.getFieldValue(item, 'BasePrice', undefined),
      RequiredRoles: requiredRoles,
      Prerequisites: this.getFieldValue(item, 'Prerequisites', ''),
      IsActive: this.getFieldValue(item, 'IsActive', true),
      SortOrder: this.getFieldValue(item, 'SortOrder', 0),
      IconName: this.getFieldValue(item, 'IconName', ''),
      Created: this.getFieldValue(item, 'Created', ''),
      Modified: this.getFieldValue(item, 'Modified', ''),
    };
  }

  /**
   * Helper to get field value from SharePoint item (handles nested fields structure)
   */
  private getFieldValue<T>(item: Record<string, unknown>, fieldName: string, defaultValue: T): T {
    // Try fields object first (Graph API format)
    const fields = item.fields as Record<string, unknown> | undefined;
    if (fields && fields[fieldName] !== undefined) {
      return fields[fieldName] as T;
    }
    // Try direct property
    if (item[fieldName] !== undefined) {
      return item[fieldName] as T;
    }
    return defaultValue;
  }
}

// Export singleton instance
export const serviceCatalogService = new ServiceCatalogService();
