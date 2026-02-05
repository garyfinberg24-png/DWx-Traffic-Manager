import { getGraphService, getAuthService } from './serviceFactory';
import { config } from '../config/environmentConfig';

// Get the appropriate services based on test mode
const graphService = getGraphService();
const authService = getAuthService();

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'APPROVE'
  | 'REJECT'
  | 'RESCHEDULE'
  | 'LOGIN'
  | 'LOGOUT';

export type AuditEntity =
  | 'Booking'
  | 'TeamMember'
  | 'Client'
  | 'Checklist'
  | 'User'
  | 'AccountManager'
  | 'ServiceRequest'
  | 'Service'
  | 'Specialist'
  | 'ProductRequest'
  | 'SessionPrep';

export interface AuditLogEntry {
  Id?: number;
  Action: AuditAction;
  EntityType: AuditEntity;
  EntityId: string;
  EntityName: string;
  PerformedBy: string;
  PerformedByEmail: string;
  Timestamp: string;
  Details?: string;
  OldValues?: string;
  NewValues?: string;
}

export interface AuditLogInput {
  action: AuditAction;
  entityType: AuditEntity;
  entityId: string | number;
  entityName: string;
  details?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

// Interface for Graph API list item response
interface GraphListItem {
  id: string;
  fields: Record<string, unknown>;
}

class AuditService {
  private listName = config.sharepoint.auditLogListName;

  async logAction(input: AuditLogInput): Promise<void> {
    try {
      const userProfile = await authService.getUserProfile();

      const fields: Record<string, unknown> = {
        Title: `${input.action} ${input.entityType}: ${input.entityName}`,
        Action: input.action,
        EntityType: input.entityType,
        EntityId: String(input.entityId),
        EntityName: input.entityName,
        PerformedBy: userProfile?.displayName || 'Unknown',
        PerformedByEmail: userProfile?.email || 'Unknown',
        Timestamp: new Date().toISOString(),
        Details: input.details || null,
        OldValues: input.oldValues ? JSON.stringify(input.oldValues) : null,
        NewValues: input.newValues ? JSON.stringify(input.newValues) : null,
      };

      await graphService.createListItem(this.listName, fields);
    } catch (error) {
      // Don't throw - audit logging should not break main functionality
      console.error('[AuditService] logAction failed:', input.action, input.entityType, input.entityId, error);
    }
  }

  async getAuditLogs(filters?: {
    entityType?: AuditEntity;
    entityId?: string;
    action?: AuditAction;
    performedByEmail?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditLogEntry[]> {
    try {
      const items = (await graphService.getListItems(this.listName, {
        top: 100,
      })) as GraphListItem[];

      let auditLogs = items.map((item) => this.transformGraphItem(item));

      // Apply filters client-side
      if (filters?.entityType) {
        auditLogs = auditLogs.filter((log) => log.EntityType === filters.entityType);
      }
      if (filters?.entityId) {
        auditLogs = auditLogs.filter((log) => log.EntityId === filters.entityId);
      }
      if (filters?.action) {
        auditLogs = auditLogs.filter((log) => log.Action === filters.action);
      }
      if (filters?.performedByEmail) {
        auditLogs = auditLogs.filter((log) => log.PerformedByEmail === filters.performedByEmail);
      }
      if (filters?.startDate) {
        auditLogs = auditLogs.filter(
          (log) => new Date(log.Timestamp) >= filters.startDate!
        );
      }
      if (filters?.endDate) {
        auditLogs = auditLogs.filter(
          (log) => new Date(log.Timestamp) <= filters.endDate!
        );
      }

      // Sort by Timestamp descending
      auditLogs.sort(
        (a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
      );

      return auditLogs;
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  private transformGraphItem(item: GraphListItem): AuditLogEntry {
    const fields = item.fields || {};
    return {
      Id: parseInt(item.id) || (fields.id as number),
      Action: (fields.Action as AuditAction) || 'VIEW',
      EntityType: (fields.EntityType as AuditEntity) || 'Booking',
      EntityId: (fields.EntityId as string) || '',
      EntityName: (fields.EntityName as string) || '',
      PerformedBy: (fields.PerformedBy as string) || '',
      PerformedByEmail: (fields.PerformedByEmail as string) || '',
      Timestamp: (fields.Timestamp as string) || new Date().toISOString(),
      Details: fields.Details as string | undefined,
      OldValues: fields.OldValues as string | undefined,
      NewValues: fields.NewValues as string | undefined,
    };
  }

  // Convenience methods for common operations
  async logCreate(
    entityType: AuditEntity,
    entityId: string | number,
    entityName: string,
    newValues?: Record<string, unknown>
  ): Promise<void> {
    await this.logAction({
      action: 'CREATE',
      entityType,
      entityId,
      entityName,
      newValues,
    });
  }

  async logUpdate(
    entityType: AuditEntity,
    entityId: string | number,
    entityName: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ): Promise<void> {
    await this.logAction({
      action: 'UPDATE',
      entityType,
      entityId,
      entityName,
      oldValues,
      newValues,
    });
  }

  async logDelete(
    entityType: AuditEntity,
    entityId: string | number,
    entityName: string,
    oldValues?: Record<string, unknown>
  ): Promise<void> {
    await this.logAction({
      action: 'DELETE',
      entityType,
      entityId,
      entityName,
      oldValues,
    });
  }
}

export const auditService = new AuditService();
