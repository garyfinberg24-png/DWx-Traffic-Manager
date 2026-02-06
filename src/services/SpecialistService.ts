/**
 * DWx Traffic Manager - Specialist Service
 * Manages pre-sales specialists (DWxSpecialists SharePoint list)
 */

import { config } from '../config/environmentConfig';
import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import {
  Specialist,
  SpecialistInput,
  SpecialistAvailability,
  ServiceCategory,
  SpecialistRole,
} from '../types/ServiceRequest';

class SpecialistService {
  private readonly listName = config.sharepoint.specialistsListName;

  /**
   * Get all specialists
   */
  async getSpecialists(activeOnly: boolean = true): Promise<Specialist[]> {
    try {
      const graphService = getGraphService();

      // Fetch all items and filter/sort client-side (IsActive is not indexed in SharePoint)
      const items = await graphService.getListItems(this.listName) as Record<string, unknown>[];

      let specialists = items.map(this.mapToSpecialist);

      if (activeOnly) {
        specialists = specialists.filter(s => s.IsActive);
      }

      specialists.sort((a, b) => a.Title.localeCompare(b.Title));

      return specialists;
    } catch (error) {
      console.error('Error fetching specialists:', error);
      return [];
    }
  }

  /**
   * Get a single specialist by ID
   */
  async getSpecialistById(id: number): Promise<Specialist | null> {
    try {
      const graphService = getGraphService();
      const item = await graphService.getListItemById(this.listName, id) as Record<string, unknown> | null;

      if (!item) return null;

      return this.mapToSpecialist(item);
    } catch (error) {
      console.error('Error fetching specialist:', error);
      return null;
    }
  }

  /**
   * Get specialist by email
   */
  async getSpecialistByEmail(email: string): Promise<Specialist | null> {
    try {
      const graphService = getGraphService();

      // Fetch all and filter client-side (Email is not indexed in SharePoint)
      const items = await graphService.getListItems(this.listName) as Record<string, unknown>[];

      const specialists = items.map(this.mapToSpecialist);
      const match = specialists.find(s => s.Email.toLowerCase() === email.toLowerCase());

      return match || null;
    } catch (error) {
      console.error('Error fetching specialist by email:', error);
      return null;
    }
  }

  /**
   * Get specialists by role
   */
  async getSpecialistsByRole(role: SpecialistRole): Promise<Specialist[]> {
    try {
      const graphService = getGraphService();

      // Fetch all and filter client-side (IsActive & Role may not be indexed)
      const items = await graphService.getListItems(this.listName) as Record<string, unknown>[];

      return items
        .map(this.mapToSpecialist)
        .filter(s => s.IsActive && s.Role === role);
    } catch (error) {
      console.error('Error fetching specialists by role:', error);
      return [];
    }
  }

  /**
   * Get available specialists for a service category
   * Returns specialists who:
   * 1. Have the service category in their specializations
   * 2. Are active
   * 3. Have capacity (currentDealCount < maxConcurrentDeals)
   */
  async getAvailableSpecialists(
    serviceCategory: ServiceCategory
  ): Promise<Specialist[]> {
    try {
      const allSpecialists = await this.getSpecialists(true);

      return allSpecialists.filter(specialist => {
        // Check specializations
        const hasSpecialization = specialist.Specializations.includes(serviceCategory);

        // Check capacity
        const hasCapacity = specialist.CurrentDealCount < specialist.MaxConcurrentDeals;

        return hasSpecialization && hasCapacity;
      });
    } catch (error) {
      console.error('Error fetching available specialists:', error);
      return [];
    }
  }

  /**
   * Check specialist availability for a specific time slot
   */
  async checkAvailability(
    specialistEmail: string,
    startTime: Date,
    endTime: Date
  ): Promise<SpecialistAvailability> {
    try {
      const specialist = await this.getSpecialistByEmail(specialistEmail);

      if (!specialist) {
        throw new Error('Specialist not found');
      }

      const graphService = getGraphService();

      // Check calendar for conflicts using user schedule API
      let isAvailable = true;

      try {
        const conflictResult = await graphService.checkUserCalendarConflicts(
          specialist.CalendarEmail || specialist.Email,
          startTime,
          endTime
        );

        // If conflict check had an API error, fail closed (unavailable)
        if (conflictResult.error) {
          isAvailable = false;
        } else {
          isAvailable = !conflictResult.hasConflict;
        }
      } catch (calError) {
        console.warn('Could not check calendar availability:', calError);
        // Fail closed — treat as unavailable when calendar check fails
        isAvailable = false;
      }

      // Check capacity
      const hasCapacity = specialist.CurrentDealCount < specialist.MaxConcurrentDeals;

      return {
        specialist,
        isAvailable,
        hasCapacity,
      };
    } catch (error) {
      console.error('Error checking specialist availability:', error);
      throw error;
    }
  }

  /**
   * Check multiple specialists' availability for a time slot
   */
  async checkMultipleAvailability(
    specialistEmails: string[],
    startTime: Date,
    endTime: Date
  ): Promise<SpecialistAvailability[]> {
    const results: SpecialistAvailability[] = [];

    for (const email of specialistEmails) {
      try {
        const availability = await this.checkAvailability(email, startTime, endTime);
        results.push(availability);
      } catch (error) {
        console.error(`Error checking availability for ${email}:`, error);
      }
    }

    return results;
  }

  /**
   * Create a new specialist
   */
  async createSpecialist(data: SpecialistInput): Promise<Specialist> {
    try {
      const graphService = getGraphService();

      const itemData = {
        Title: data.Title,
        Email: data.Email,
        Role: data.Role,
        Specializations: JSON.stringify(data.Specializations),
        MaxConcurrentDeals: data.MaxConcurrentDeals,
        CurrentDealCount: 0,
        IsActive: data.IsActive,
        CalendarEmail: data.CalendarEmail || data.Email,
        Phone: data.Phone,
      };

      const result = await graphService.createListItem(this.listName, itemData);
      const specialist = this.mapToSpecialist(result);

      // Audit log
      await auditService.logCreate('Specialist', specialist.Id, data.Title, {
        email: data.Email,
        role: data.Role,
        specializations: data.Specializations,
        maxConcurrentDeals: data.MaxConcurrentDeals,
      });

      return specialist;
    } catch (error) {
      console.error('Error creating specialist:', error);
      throw error;
    }
  }

  /**
   * Update an existing specialist
   */
  async updateSpecialist(id: number, data: Partial<SpecialistInput>): Promise<Specialist> {
    try {
      const graphService = getGraphService();

      const itemData: Record<string, unknown> = {};

      if (data.Title !== undefined) itemData.Title = data.Title;
      if (data.Email !== undefined) itemData.Email = data.Email;
      if (data.Role !== undefined) itemData.Role = data.Role;
      if (data.Specializations !== undefined) {
        itemData.Specializations = JSON.stringify(data.Specializations);
      }
      if (data.MaxConcurrentDeals !== undefined) {
        itemData.MaxConcurrentDeals = data.MaxConcurrentDeals;
      }
      if (data.IsActive !== undefined) itemData.IsActive = data.IsActive;
      if (data.CalendarEmail !== undefined) itemData.CalendarEmail = data.CalendarEmail;
      if (data.Phone !== undefined) itemData.Phone = data.Phone;

      const result = await graphService.updateListItem(this.listName, id, itemData);
      const specialist = this.mapToSpecialist(result);

      // Audit log
      await auditService.logUpdate('Specialist', id, specialist.Title,
        undefined,
        itemData as Record<string, unknown>
      );

      return specialist;
    } catch (error) {
      console.error('Error updating specialist:', error);
      throw error;
    }
  }

  /**
   * Increment specialist's current deal count
   */
  async incrementDealCount(specialistId: number): Promise<void> {
    try {
      const specialist = await this.getSpecialistById(specialistId);
      if (!specialist) {
        throw new Error('Specialist not found');
      }

      const graphService = getGraphService();
      await graphService.updateListItem(this.listName, specialistId, {
        CurrentDealCount: specialist.CurrentDealCount + 1,
      });
    } catch (error) {
      console.error('Error incrementing deal count:', error);
      throw error;
    }
  }

  /**
   * Decrement specialist's current deal count
   */
  async decrementDealCount(specialistId: number): Promise<void> {
    try {
      const specialist = await this.getSpecialistById(specialistId);
      if (!specialist) {
        throw new Error('Specialist not found');
      }

      const graphService = getGraphService();
      await graphService.updateListItem(this.listName, specialistId, {
        CurrentDealCount: Math.max(0, specialist.CurrentDealCount - 1),
      });
    } catch (error) {
      console.error('Error decrementing deal count:', error);
      throw error;
    }
  }

  /**
   * Deactivate a specialist
   */
  async deactivateSpecialist(id: number): Promise<void> {
    try {
      const graphService = getGraphService();
      await graphService.updateListItem(this.listName, id, { IsActive: false });

      // Audit log
      await auditService.logUpdate('Specialist', id, 'Specialist',
        { IsActive: true },
        { IsActive: false }
      );
    } catch (error) {
      console.error('Error deactivating specialist:', error);
      throw error;
    }
  }

  /**
   * Get specialist workload summary
   */
  async getWorkloadSummary(): Promise<{
    specialists: Specialist[];
    totalCapacity: number;
    usedCapacity: number;
    availableCapacity: number;
  }> {
    const specialists = await this.getSpecialists(true);

    const totalCapacity = specialists.reduce((sum, s) => sum + s.MaxConcurrentDeals, 0);
    const usedCapacity = specialists.reduce((sum, s) => sum + s.CurrentDealCount, 0);

    return {
      specialists,
      totalCapacity,
      usedCapacity,
      availableCapacity: totalCapacity - usedCapacity,
    };
  }

  /**
   * Map SharePoint list item to Specialist
   */
  private mapToSpecialist(item: Record<string, unknown>): Specialist {
    const fields = (item.fields as Record<string, unknown>) || item;

    let specializations: ServiceCategory[] = [];
    try {
      const specField = fields.Specializations as string;
      if (specField) {
        specializations = JSON.parse(specField);
      }
    } catch {
      specializations = [];
    }

    return {
      Id: item.id as number || fields.Id as number,
      Title: fields.Title as string || '',
      Email: fields.Email as string || '',
      Role: (fields.Role as SpecialistRole) || 'Technical Specialist',
      Specializations: specializations,
      MaxConcurrentDeals: (fields.MaxConcurrentDeals as number) || 5,
      CurrentDealCount: (fields.CurrentDealCount as number) || 0,
      IsActive: fields.IsActive !== false,
      CalendarEmail: (fields.CalendarEmail as string) || (fields.Email as string) || '',
      Phone: fields.Phone as string,
      Created: fields.Created as string,
      Modified: fields.Modified as string,
    };
  }
}

// Export singleton instance
export const specialistService = new SpecialistService();
