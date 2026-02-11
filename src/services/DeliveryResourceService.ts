/**
 * DWx Traffic Manager - Delivery Resource Service
 * Manages delivery team resources — developers, PMs, designers, etc. (DWxDeliveryResources SharePoint list)
 */

import { config } from '../config/environmentConfig';
import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import type { DeliveryResource, DeliveryRole, DeliverySkill } from '../types/DeliveryHandover';
import type { ServiceCategory } from '../types/ServiceRequest';

// ---------------------------------------------------------------------------
// Input interfaces
// ---------------------------------------------------------------------------

export interface CreateDeliveryResourceInput {
  name: string;
  email: string;
  phone?: string;
  role: DeliveryRole;
  specializations?: ServiceCategory[];
  maxConcurrentProjects?: number;
  hourlyRate?: number;
  availableFrom?: string;
  skills?: DeliverySkill[];
}

export interface UpdateDeliveryResourceInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: DeliveryRole;
  specializations?: ServiceCategory[];
  maxConcurrentProjects?: number;
  currentProjectCount?: number;
  hourlyRate?: number;
  availableFrom?: string;
  skills?: DeliverySkill[];
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Capacity summary
// ---------------------------------------------------------------------------

export interface CapacitySummary {
  totalResources: number;
  activeResources: number;
  totalCapacity: number;       // Sum of all maxConcurrentProjects
  currentUtilization: number;  // Sum of all currentProjectCount
  utilizationPercent: number;  // (currentUtilization / totalCapacity) * 100
  byRole: Array<{
    role: DeliveryRole;
    count: number;
    available: number;
  }>;
}

// ---------------------------------------------------------------------------
// Service class
// ---------------------------------------------------------------------------

class DeliveryResourceService {
  private readonly listName =
    (config.sharepoint as Record<string, string>).deliveryResourcesListName || 'DWxDeliveryResources';

  // -------------------------------------------------------------------------
  // CRUD — Read
  // -------------------------------------------------------------------------

  /**
   * Get all delivery resources, sorted alphabetically by name.
   */
  async getAllResources(): Promise<DeliveryResource[]> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(this.listName) as Record<string, unknown>[];

      const resources = items.map(item => this.mapToResource(item));
      resources.sort((a, b) => a.Title.localeCompare(b.Title));

      return resources;
    } catch (error) {
      console.error('Error fetching delivery resources:', error);
      return [];
    }
  }

  /**
   * Get a single delivery resource by SharePoint ID.
   */
  async getResourceById(id: number): Promise<DeliveryResource | null> {
    try {
      const graphService = getGraphService();
      const item = await graphService.getListItemById(this.listName, id) as Record<string, unknown> | null;

      if (!item) return null;

      return this.mapToResource(item);
    } catch (error) {
      console.error('Error fetching delivery resource by ID:', error);
      return null;
    }
  }

  /**
   * Get available resources, optionally filtered by role and/or specialization.
   *
   * "Available" means:
   *   - isActive === true
   *   - currentProjectCount < maxConcurrentProjects
   *
   * Results sorted by most available capacity first (ascending currentProjectCount).
   */
  async getAvailableResources(
    role?: DeliveryRole,
    specialization?: ServiceCategory
  ): Promise<DeliveryResource[]> {
    try {
      const all = await this.getAllResources();

      return all
        .filter(r => {
          if (!r.IsActive) return false;
          if (r.CurrentProjectCount >= r.MaxConcurrentProjects) return false;
          if (role && r.Role !== role) return false;
          if (specialization && !r.Specializations.includes(specialization)) return false;
          return true;
        })
        .sort((a, b) => {
          // Most available capacity first
          const capacityA = a.MaxConcurrentProjects - a.CurrentProjectCount;
          const capacityB = b.MaxConcurrentProjects - b.CurrentProjectCount;
          return capacityB - capacityA;
        });
    } catch (error) {
      console.error('Error fetching available delivery resources:', error);
      return [];
    }
  }

  /**
   * Get active resources filtered by a specific role.
   */
  async getResourcesByRole(role: DeliveryRole): Promise<DeliveryResource[]> {
    try {
      const all = await this.getAllResources();

      return all.filter(r => r.IsActive && r.Role === role);
    } catch (error) {
      console.error('Error fetching delivery resources by role:', error);
      return [];
    }
  }

  // -------------------------------------------------------------------------
  // CRUD — Create
  // -------------------------------------------------------------------------

  /**
   * Create a new delivery resource in SharePoint.
   * Defaults: maxConcurrentProjects = 3, currentProjectCount = 0, isActive = true.
   */
  async createResource(input: CreateDeliveryResourceInput): Promise<DeliveryResource> {
    try {
      const graphService = getGraphService();

      const itemData = this.serializeForSharePoint({
        ...input,
        maxConcurrentProjects: input.maxConcurrentProjects ?? 3,
      });

      // Ensure defaults for new resources
      itemData.CurrentProjectCount = 0;
      itemData.IsActive = true;

      const result = await graphService.createListItem(this.listName, itemData);
      const resource = this.mapToResource(result);

      // Audit log
      await auditService.logCreate('DeliveryResource' as never, resource.Id, input.name, {
        email: input.email,
        role: input.role,
        specializations: input.specializations,
        maxConcurrentProjects: input.maxConcurrentProjects ?? 3,
      });

      return resource;
    } catch (error) {
      console.error('Error creating delivery resource:', error);
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // CRUD — Update
  // -------------------------------------------------------------------------

  /**
   * Update an existing delivery resource.
   * Only fields present in `updates` are patched — everything else is left unchanged.
   */
  async updateResource(id: number, updates: UpdateDeliveryResourceInput): Promise<DeliveryResource> {
    try {
      const graphService = getGraphService();

      const itemData: Record<string, unknown> = {};

      if (updates.name !== undefined) itemData.Title = updates.name;
      if (updates.email !== undefined) itemData.Email = updates.email;
      if (updates.phone !== undefined) itemData.Phone = updates.phone;
      if (updates.role !== undefined) itemData.Role = updates.role;
      if (updates.specializations !== undefined) {
        itemData.Specializations_JSON = JSON.stringify(updates.specializations);
      }
      if (updates.maxConcurrentProjects !== undefined) {
        itemData.MaxConcurrentProjects = updates.maxConcurrentProjects;
      }
      if (updates.currentProjectCount !== undefined) {
        itemData.CurrentProjectCount = updates.currentProjectCount;
      }
      if (updates.hourlyRate !== undefined) itemData.HourlyRate = updates.hourlyRate;
      if (updates.availableFrom !== undefined) itemData.AvailableFrom = updates.availableFrom;
      if (updates.skills !== undefined) {
        itemData.Skills_JSON = JSON.stringify(updates.skills);
      }
      if (updates.isActive !== undefined) itemData.IsActive = updates.isActive;

      const result = await graphService.updateListItem(this.listName, id, itemData);
      const resource = this.mapToResource(result);

      // Audit log
      await auditService.logUpdate(
        'DeliveryResource' as never,
        id,
        resource.Title,
        undefined,
        itemData as Record<string, unknown>
      );

      return resource;
    } catch (error) {
      console.error('Error updating delivery resource:', error);
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // CRUD — Delete
  // -------------------------------------------------------------------------

  /**
   * Delete a delivery resource.
   * Logs a warning if the resource currently has active project assignments but does NOT block deletion.
   */
  async deleteResource(id: number): Promise<void> {
    try {
      const graphService = getGraphService();

      // Fetch the resource to capture info for audit before deletion
      const resource = await this.getResourceById(id);
      const resourceName = resource?.Title || `Resource #${id}`;

      if (resource && resource.CurrentProjectCount > 0) {
        console.warn(
          `Deleting delivery resource "${resourceName}" who has ${resource.CurrentProjectCount} active project assignment(s).`
        );
      }

      await graphService.deleteListItem(this.listName, id);

      // Audit log
      await auditService.logDelete(
        'DeliveryResource' as never,
        id,
        resourceName,
        resource
          ? {
              email: resource.Email,
              role: resource.Role,
              currentProjectCount: resource.CurrentProjectCount,
            }
          : undefined
      );
    } catch (error) {
      console.error('Error deleting delivery resource:', error);
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Project count management
  // -------------------------------------------------------------------------

  /**
   * Increment a resource's current project count by 1.
   * Used when the resource is assigned to a new delivery project.
   */
  async incrementProjectCount(id: number): Promise<void> {
    try {
      const resource = await this.getResourceById(id);
      if (!resource) {
        throw new Error(`Delivery resource #${id} not found`);
      }

      const graphService = getGraphService();
      await graphService.updateListItem(this.listName, id, {
        CurrentProjectCount: resource.CurrentProjectCount + 1,
      });
    } catch (error) {
      console.error('Error incrementing project count:', error);
      throw error;
    }
  }

  /**
   * Decrement a resource's current project count by 1 (floor at 0).
   * Used when a resource is removed from a project or a project closes.
   */
  async decrementProjectCount(id: number): Promise<void> {
    try {
      const resource = await this.getResourceById(id);
      if (!resource) {
        throw new Error(`Delivery resource #${id} not found`);
      }

      const graphService = getGraphService();
      await graphService.updateListItem(this.listName, id, {
        CurrentProjectCount: Math.max(0, resource.CurrentProjectCount - 1),
      });
    } catch (error) {
      console.error('Error decrementing project count:', error);
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  /**
   * Aggregate capacity data across all active delivery resources.
   */
  async getCapacitySummary(): Promise<CapacitySummary> {
    try {
      const allResources = await this.getAllResources();
      const activeResources = allResources.filter(r => r.IsActive);

      const totalCapacity = activeResources.reduce((sum, r) => sum + r.MaxConcurrentProjects, 0);
      const currentUtilization = activeResources.reduce((sum, r) => sum + r.CurrentProjectCount, 0);

      // Build per-role breakdown
      const roleMap = new Map<DeliveryRole, { count: number; available: number }>();

      for (const r of activeResources) {
        const existing = roleMap.get(r.Role) || { count: 0, available: 0 };
        existing.count += 1;
        if (r.CurrentProjectCount < r.MaxConcurrentProjects) {
          existing.available += 1;
        }
        roleMap.set(r.Role, existing);
      }

      const byRole = Array.from(roleMap.entries()).map(([role, data]) => ({
        role,
        count: data.count,
        available: data.available,
      }));

      return {
        totalResources: allResources.length,
        activeResources: activeResources.length,
        totalCapacity,
        currentUtilization,
        utilizationPercent: totalCapacity > 0
          ? Math.round((currentUtilization / totalCapacity) * 100)
          : 0,
        byRole,
      };
    } catch (error) {
      console.error('Error calculating capacity summary:', error);
      return {
        totalResources: 0,
        activeResources: 0,
        totalCapacity: 0,
        currentUtilization: 0,
        utilizationPercent: 0,
        byRole: [],
      };
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Map a SharePoint list item (Graph API response) to the typed DeliveryResource entity.
   */
  private mapToResource(item: Record<string, unknown>): DeliveryResource {
    const fields = (item.fields as Record<string, unknown>) || item;

    // Deserialize JSON array columns
    let specializations: ServiceCategory[] = [];
    try {
      const specField = fields.Specializations_JSON as string;
      if (specField) {
        specializations = JSON.parse(specField);
      }
    } catch {
      specializations = [];
    }

    let skills: DeliverySkill[] = [];
    try {
      const skillsField = fields.Skills_JSON as string;
      if (skillsField) {
        skills = JSON.parse(skillsField);
      }
    } catch {
      skills = [];
    }

    return {
      Id: (item.id as number) || (fields.Id as number) || 0,
      Title: (fields.Title as string) || '',
      Email: (fields.Email as string) || '',
      Phone: (fields.Phone as string) || '',
      Role: (fields.Role as DeliveryRole) || 'Developer',
      Specializations: specializations,
      MaxConcurrentProjects: (fields.MaxConcurrentProjects as number) ?? 3,
      CurrentProjectCount: (fields.CurrentProjectCount as number) ?? 0,
      HourlyRate: (fields.HourlyRate as number) || 0,
      AvailableFrom: (fields.AvailableFrom as string) || '',
      Skills: skills,
      IsActive: fields.IsActive !== false,
      Created: (fields.Created as string) || new Date().toISOString(),
      Modified: (fields.Modified as string) || undefined,
    };
  }

  /**
   * Convert typed input to SharePoint field values for create/update operations.
   */
  private serializeForSharePoint(
    input: CreateDeliveryResourceInput | UpdateDeliveryResourceInput
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    // Map 'name' to SharePoint 'Title' column
    if ('name' in input && input.name !== undefined) {
      data.Title = input.name;
    }
    if (input.email !== undefined) data.Email = input.email;
    if (input.phone !== undefined) data.Phone = input.phone;
    if (input.role !== undefined) data.Role = input.role;

    if (input.specializations !== undefined) {
      data.Specializations_JSON = JSON.stringify(input.specializations);
    }
    if (input.maxConcurrentProjects !== undefined) {
      data.MaxConcurrentProjects = input.maxConcurrentProjects;
    }
    if (input.hourlyRate !== undefined) data.HourlyRate = input.hourlyRate;
    if (input.availableFrom !== undefined) data.AvailableFrom = input.availableFrom;

    if (input.skills !== undefined) {
      data.Skills_JSON = JSON.stringify(input.skills);
    }

    // Only relevant for update payloads
    if ('currentProjectCount' in input && input.currentProjectCount !== undefined) {
      data.CurrentProjectCount = input.currentProjectCount;
    }
    if ('isActive' in input && input.isActive !== undefined) {
      data.IsActive = input.isActive;
    }

    return data;
  }
}

// Export singleton instance
export const deliveryResourceService = new DeliveryResourceService();
