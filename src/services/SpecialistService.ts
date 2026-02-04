/**
 * DWx Traffic Manager - Specialist Service
 * Manages pre-sales specialists (DWxSpecialists SharePoint list)
 */

import { config } from '../config/environmentConfig';
import { getGraphService } from './serviceFactory';
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
      const filter = activeOnly ? "IsActive eq 1" : undefined;

      const items = await graphService.getListItems(this.listName, filter, "Title");

      return items.map(this.mapToSpecialist);
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
      const item = await graphService.getListItemById(this.listName, id);

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
      const filter = `Email eq '${email}'`;

      const items = await graphService.getListItems(this.listName, filter);

      if (items.length === 0) return null;

      return this.mapToSpecialist(items[0]);
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
      const filter = `Role eq '${role}' and IsActive eq 1`;

      const items = await graphService.getListItems(this.listName, filter);

      return items.map(this.mapToSpecialist);
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

      // Check calendar for conflicts
      const calendarEmail = specialist.CalendarEmail || specialist.Email;
      let conflicts: { start: string; end: string; subject: string }[] = [];
      let isAvailable = true;

      try {
        const conflictResult = await graphService.checkCalendarConflicts(
          startTime.toISOString(),
          endTime.toISOString(),
          undefined,
          calendarEmail
        );

        isAvailable = !conflictResult.hasConflict;
        conflicts = conflictResult.conflicts || [];
      } catch (calError) {
        console.warn('Could not check calendar availability:', calError);
        // Default to available if calendar check fails
        isAvailable = true;
      }

      // Check capacity
      const hasCapacity = specialist.CurrentDealCount < specialist.MaxConcurrentDeals;

      return {
        specialist,
        isAvailable,
        hasCapacity,
        conflicts: isAvailable ? undefined : conflicts,
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

      return this.mapToSpecialist(result);
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

      return this.mapToSpecialist(result);
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
