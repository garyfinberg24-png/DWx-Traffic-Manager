/**
 * DWx Traffic Manager - Session Preparation Service
 * CRUD operations for session preparation records
 */

import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import {
  SessionPreparation,
  SessionPrepStatus,
  CreateSessionPrepInput,
  UpdateSessionPrepInput,
  SessionPrepResult,
  PrepChecklistItem,
  ClientProfile,
  TalkingPoint,
  SuggestedResource,
  MeetingAgenda,
  DEFAULT_PREP_CHECKLIST,
} from '../types/SessionPreparation';

const LIST_NAME = 'DWxSessionPrep';

/**
 * Generate a unique ID for checklist items
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Initialize default checklist with unique IDs
 */
const initializeChecklist = (): PrepChecklistItem[] => {
  return DEFAULT_PREP_CHECKLIST.map((item) => ({
    ...item,
    id: generateId(),
  }));
};

/**
 * Map SharePoint item to SessionPreparation type
 */
const mapSharePointItem = (item: Record<string, unknown>): SessionPreparation => {
  const fields = item.fields as Record<string, unknown>;

  // Parse JSON fields safely
  const parseJson = <T>(value: unknown): T | null => {
    if (!value) return null;
    try {
      return typeof value === 'string' ? JSON.parse(value) : (value as T);
    } catch {
      return null;
    }
  };

  return {
    Id: parseInt(item.id as string, 10),
    Title: (fields.Title as string) || '',
    ServiceRequestId: (fields.ServiceRequestId as number) || 0,
    SpecialistEmail: (fields.SpecialistEmail as string) || '',
    SpecialistName: (fields.SpecialistName as string) || '',
    Status: (fields.Status as SessionPrepStatus) || 'Not Started',

    // AI-generated content
    ClientProfile: parseJson<ClientProfile>(fields.ClientProfile_JSON),
    TalkingPoints: parseJson<TalkingPoint[]>(fields.TalkingPoints_JSON) || [],
    SuggestedResources: parseJson<SuggestedResource[]>(fields.SuggestedResources_JSON) || [],
    MeetingAgenda: parseJson<MeetingAgenda>(fields.MeetingAgenda_JSON),

    // Checklist
    ChecklistItems: parseJson<PrepChecklistItem[]>(fields.ChecklistItems_JSON) || [],

    // Metadata
    AIGeneratedAt: (fields.AIGeneratedAt as string) || null,
    CompletedAt: (fields.CompletedAt as string) || null,
    ReminderSent: (fields.ReminderSent as boolean) || false,

    // SharePoint fields
    Created: (fields.Created as string) || '',
    Modified: (fields.Modified as string) || '',
    CreatedBy: (fields.Author as string) || '',
    ModifiedBy: (fields.Editor as string) || '',
  };
};

class SessionPrepService {
  /**
   * Create a new session preparation record
   */
  async createSessionPrep(
    input: CreateSessionPrepInput,
    clientName: string,
    meetingDate: string
  ): Promise<SessionPrepResult> {
    try {
      const graphService = getGraphService();

      const title = `Prep - ${clientName} - ${new Date(meetingDate).toLocaleDateString()}`;
      const defaultChecklist = initializeChecklist();

      const itemData = {
        Title: title,
        ServiceRequestId: input.serviceRequestId,
        SpecialistEmail: input.specialistEmail,
        SpecialistName: input.specialistName,
        Status: 'Not Started',
        ChecklistItems_JSON: JSON.stringify(defaultChecklist),
        ReminderSent: false,
      };

      const createdItem = await graphService.createListItem(LIST_NAME, itemData);
      const sessionPrep = mapSharePointItem(createdItem as Record<string, unknown>);

      // Log the creation
      await auditService.logCreate('SessionPrep', sessionPrep.Id, title);

      return { success: true, sessionPrep };
    } catch (error) {
      console.error('[SessionPrepService] Failed to create session prep:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session preparation',
      };
    }
  }

  /**
   * Get session preparation by ID
   */
  async getSessionPrepById(id: number): Promise<SessionPreparation | null> {
    try {
      const graphService = getGraphService();
      const item = await graphService.getListItemById(LIST_NAME, id);
      return item ? mapSharePointItem(item as Record<string, unknown>) : null;
    } catch (error) {
      console.error('[SessionPrepService] Failed to get session prep:', error);
      return null;
    }
  }

  /**
   * Get session preparation by service request ID
   */
  async getSessionPrepByServiceRequest(serviceRequestId: number): Promise<SessionPreparation | null> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME, {
        filter: `fields/ServiceRequestId eq ${serviceRequestId}`,
      });

      if (items.length === 0) return null;
      return mapSharePointItem(items[0] as Record<string, unknown>);
    } catch (error) {
      console.error('[SessionPrepService] Failed to get session prep by service request:', error);
      return null;
    }
  }

  /**
   * Get all session preparations for a specialist
   */
  async getSessionPrepsBySpecialist(specialistEmail: string): Promise<SessionPreparation[]> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME, {
        filter: `fields/SpecialistEmail eq '${specialistEmail}'`,
        orderBy: 'fields/Created desc',
      });

      return (items as Record<string, unknown>[]).map(mapSharePointItem);
    } catch (error) {
      console.error('[SessionPrepService] Failed to get session preps by specialist:', error);
      return [];
    }
  }

  /**
   * Get all incomplete session preparations
   */
  async getIncompleteSessionPreps(): Promise<SessionPreparation[]> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME, {
        filter: `fields/Status ne 'Ready'`,
        orderBy: 'fields/Created asc',
      });

      return (items as Record<string, unknown>[]).map(mapSharePointItem);
    } catch (error) {
      console.error('[SessionPrepService] Failed to get incomplete session preps:', error);
      return [];
    }
  }

  /**
   * Update session preparation
   */
  async updateSessionPrep(
    id: number,
    updates: UpdateSessionPrepInput
  ): Promise<SessionPrepResult> {
    try {
      const graphService = getGraphService();

      // Get current state for audit
      const current = await this.getSessionPrepById(id);
      if (!current) {
        return { success: false, error: 'Session preparation not found' };
      }

      // Build update payload
      const updateData: Record<string, unknown> = {};

      if (updates.status !== undefined) {
        updateData.Status = updates.status;

        // Set CompletedAt when marked as Ready
        if (updates.status === 'Ready') {
          updateData.CompletedAt = new Date().toISOString();
        }
      }

      if (updates.clientProfile !== undefined) {
        updateData.ClientProfile_JSON = JSON.stringify(updates.clientProfile);
      }

      if (updates.talkingPoints !== undefined) {
        updateData.TalkingPoints_JSON = JSON.stringify(updates.talkingPoints);
      }

      if (updates.suggestedResources !== undefined) {
        updateData.SuggestedResources_JSON = JSON.stringify(updates.suggestedResources);
      }

      if (updates.meetingAgenda !== undefined) {
        updateData.MeetingAgenda_JSON = JSON.stringify(updates.meetingAgenda);
      }

      if (updates.checklistItems !== undefined) {
        updateData.ChecklistItems_JSON = JSON.stringify(updates.checklistItems);
      }

      if (updates.aiGeneratedAt !== undefined) {
        updateData.AIGeneratedAt = updates.aiGeneratedAt;
      }

      if (updates.completedAt !== undefined) {
        updateData.CompletedAt = updates.completedAt;
      }

      if (updates.reminderSent !== undefined) {
        updateData.ReminderSent = updates.reminderSent;
      }

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated item
      const updatedItem = await this.getSessionPrepById(id);
      if (!updatedItem) {
        return { success: false, error: 'Failed to retrieve updated session preparation' };
      }

      // Log the update
      await auditService.logUpdate(
        'SessionPrep',
        id,
        current.Title,
        { status: current.Status },
        { status: updatedItem.Status }
      );

      return { success: true, sessionPrep: updatedItem };
    } catch (error) {
      console.error('[SessionPrepService] Failed to update session prep:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update session preparation',
      };
    }
  }

  /**
   * Update status only
   */
  async updateStatus(
    id: number,
    status: SessionPrepStatus
  ): Promise<SessionPrepResult> {
    return this.updateSessionPrep(id, { status });
  }

  /**
   * Save AI-generated content
   */
  async saveAIContent(
    id: number,
    content: {
      clientProfile?: ClientProfile;
      talkingPoints?: TalkingPoint[];
      suggestedResources?: SuggestedResource[];
      meetingAgenda?: MeetingAgenda;
    }
  ): Promise<SessionPrepResult> {
    const updates: UpdateSessionPrepInput = {
      ...content,
      aiGeneratedAt: new Date().toISOString(),
      status: 'In Progress',
    };

    return this.updateSessionPrep(id, updates);
  }

  /**
   * Update checklist item completion
   */
  async updateChecklistItem(
    id: number,
    itemId: string,
    completed: boolean,
    completedBy?: string
  ): Promise<SessionPrepResult> {
    const current = await this.getSessionPrepById(id);
    if (!current) {
      return { success: false, error: 'Session preparation not found' };
    }

    const updatedChecklist = current.ChecklistItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
          completedBy: completed ? completedBy : undefined,
        };
      }
      return item;
    });

    // Check if all items are completed
    const allCompleted = updatedChecklist.every((item) => item.completed);

    const updates: UpdateSessionPrepInput = {
      checklistItems: updatedChecklist,
    };

    // Auto-set to Ready if all checklist items are completed
    if (allCompleted) {
      updates.status = 'Ready';
    }

    return this.updateSessionPrep(id, updates);
  }

  /**
   * Mark session prep as ready
   */
  async markAsReady(id: number): Promise<SessionPrepResult> {
    return this.updateSessionPrep(id, {
      status: 'Ready',
      completedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark reminder as sent
   */
  async markReminderSent(id: number): Promise<SessionPrepResult> {
    return this.updateSessionPrep(id, { reminderSent: true });
  }

  /**
   * Delete session preparation (soft delete by marking as status change or actual delete)
   */
  async deleteSessionPrep(id: number): Promise<SessionPrepResult> {
    try {
      const graphService = getGraphService();

      // Get current for audit
      const current = await this.getSessionPrepById(id);
      if (!current) {
        return { success: false, error: 'Session preparation not found' };
      }

      await graphService.deleteListItem(LIST_NAME, id);

      // Log the deletion
      await auditService.logDelete('SessionPrep', id, current.Title);

      return { success: true };
    } catch (error) {
      console.error('[SessionPrepService] Failed to delete session prep:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete session preparation',
      };
    }
  }

  /**
   * Get session preps that need reminders
   * Returns preps that are not Ready and meeting is within specified hours
   */
  async getSessionPrepsNeedingReminder(): Promise<SessionPreparation[]> {
    try {
      const graphService = getGraphService();

      // Get all non-ready preps that haven't had a reminder sent
      const items = await graphService.getListItems(LIST_NAME, {
        filter: `fields/Status ne 'Ready' and fields/ReminderSent eq false`,
      });

      return (items as Record<string, unknown>[]).map(mapSharePointItem);
    } catch (error) {
      console.error('[SessionPrepService] Failed to get session preps needing reminder:', error);
      return [];
    }
  }

  /**
   * Calculate preparation completion percentage
   */
  calculateCompletionPercentage(prep: SessionPreparation): number {
    const weights = {
      clientProfile: 20,
      talkingPoints: 20,
      suggestedResources: 15,
      meetingAgenda: 15,
      checklist: 30,
    };

    let score = 0;

    // Client profile
    if (prep.ClientProfile) score += weights.clientProfile;

    // Talking points
    if (prep.TalkingPoints.length > 0) score += weights.talkingPoints;

    // Suggested resources
    if (prep.SuggestedResources.length > 0) score += weights.suggestedResources;

    // Meeting agenda
    if (prep.MeetingAgenda) score += weights.meetingAgenda;

    // Checklist completion
    if (prep.ChecklistItems.length > 0) {
      const completedCount = prep.ChecklistItems.filter((item) => item.completed).length;
      const checklistPercentage = completedCount / prep.ChecklistItems.length;
      score += weights.checklist * checklistPercentage;
    }

    return Math.round(score);
  }
}

// Export singleton instance
export const sessionPrepService = new SessionPrepService();
