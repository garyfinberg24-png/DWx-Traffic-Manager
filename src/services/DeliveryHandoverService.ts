/**
 * DWx Traffic Manager - Delivery Handover Service
 * CRUD operations for delivery handover records with status workflow,
 * proposal/post-mortem integration, checklist tracking, and aggregate stats.
 */

import { config } from '../config/environmentConfig';
import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import {
  HANDOVER_STATUS_TRANSITIONS,
  serializeScopeSnapshot,
  deserializeScopeSnapshot,
  serializeDeliveryTeam,
  deserializeDeliveryTeam,
  serializeHandoverChecklist,
  deserializeHandoverChecklist,
  serializeRisksAndAssumptions,
  deserializeRisksAndAssumptions,
  serializeClientBrief,
  deserializeClientBrief,
  serializeEnvironmentSetup,
  deserializeEnvironmentSetup,
  serializeProjectPlan,
  deserializeProjectPlan,
  serializeMilestoneCompletions,
  deserializeMilestoneCompletions,
  serializeProjectHealth,
  deserializeProjectHealth,
  serializeDeliverableSignOffs,
  deserializeDeliverableSignOffs,
  serializeFinalSignOff,
  deserializeFinalSignOff,
  serializeCSAT,
  deserializeCSAT,
  SIGN_OFF_STATUS_TRANSITIONS,
  createDefaultHandoverChecklist,
} from '../types/DeliveryHandover';
import type {
  DeliveryHandover,
  CreateHandoverInput,
  UpdateHandoverInput,
  HandoverStatus,
  HandoverChecklistItem,
  TeamAssignment,
  ScopeSnapshot,
  ClientBrief,
  EnvironmentSetup,
  RiskAssumption,
  ProjectPlan,
  MilestoneCompletion,
  MilestoneStatus,
  ProjectHealth,
  ProjectHealthStatus,
  DeliverableSignOff,
  SignOffStatus,
  FinalHandoverSignOff,
} from '../types/DeliveryHandover';
// CSATEntry type used via DeliveryHandover.CSAT field (imported via DeliveryHandover.ts re-export)
import type { Proposal } from '../types/Proposal';
import type { PostMortem } from '../types/PostMortem';
import type { ServiceCategory } from '../types/ServiceRequest';

// ─── Types ──────────────────────────────────────────────────────────

export interface HandoverStats {
  total: number;
  pending: number;
  inProgress: number;
  kickoffScheduled: number;
  delivered: number;
  closed: number;
  onHold: number;
  avgHandoverDays: number;
  totalContractValue: number;
}

// ─── Constants ──────────────────────────────────────────────────────

const LIST_NAME = config.sharepoint.deliveryHandoversListName;

// ─── Service Class ──────────────────────────────────────────────────

class DeliveryHandoverService {
  // ─── CRUD Methods ───────────────────────────────────────────────

  /**
   * Create a new delivery handover record
   * Title auto-generated: "Handover - {ClientName} - {ServiceName}"
   * Initializes default checklist based on service category
   */
  async createHandover(input: CreateHandoverInput): Promise<DeliveryHandover> {
    try {
      const graphService = getGraphService();

      const title = `Handover - ${input.ClientName} - ${input.ServiceName}`;

      // Create default checklist based on service category
      const defaultChecklist = createDefaultHandoverChecklist(
        input.ServiceCategory as ServiceCategory
      );

      const itemData: Record<string, unknown> = {
        Title: title,
        ServiceRequestId: input.ServiceRequestId,
        ProposalId: input.ProposalId || null,
        PostMortemId: input.PostMortemId || null,
        ClientName: input.ClientName,
        ProjectName: input.ProjectName || '',
        ServiceName: input.ServiceName,
        ServiceCategory: input.ServiceCategory || '',
        ContractValue: input.ContractValue || 0,
        AccountManagerName: input.AccountManagerName || '',
        AccountManagerEmail: input.AccountManagerEmail || '',
        PreSalesSpecialistName: input.PreSalesSpecialistName || '',
        PreSalesSpecialistEmail: input.PreSalesSpecialistEmail || '',
        HandoverStatus: 'Pending',
        WonDate: input.WonDate || new Date().toISOString(),
        DeliveryTeam_JSON: JSON.stringify([]),
        ScopeSnapshot_JSON: JSON.stringify(null),
        HandoverChecklist_JSON: serializeHandoverChecklist(defaultChecklist),
        RisksAndAssumptions_JSON: JSON.stringify([]),
        ClientBrief_JSON: JSON.stringify(null),
        EnvironmentSetup_JSON: JSON.stringify(null),
        ProjectPlan_JSON: JSON.stringify(null),
        MilestoneCompletions_JSON: JSON.stringify([]),
        ProjectHealth_JSON: JSON.stringify(null),
        DeliverableSignOffs_JSON: JSON.stringify([]),
        FinalHandoverSignOff_JSON: JSON.stringify(null),
        CSAT_JSON: JSON.stringify(null),
        PreSalesNotes: input.PreSalesNotes || '',
        ClientExpectations: input.ClientExpectations || '',
      };

      const createdItem = await graphService.createListItem(LIST_NAME, itemData);
      const handover = this.mapToHandover(createdItem as Record<string, unknown>);

      // Audit log
      await auditService.logCreate('DeliveryHandover' as never, handover.Id, title, {
        serviceRequestId: input.ServiceRequestId,
        clientName: input.ClientName,
        serviceName: input.ServiceName,
        serviceCategory: input.ServiceCategory,
        contractValue: input.ContractValue,
      });

      return handover;
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to create handover:', error);
      throw error;
    }
  }

  /**
   * Get a delivery handover by its SharePoint list item ID
   */
  async getHandoverById(id: number): Promise<DeliveryHandover | null> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME) as Record<string, unknown>[];

      const mapped = items.map((item) => this.mapToHandover(item));
      const match = mapped.find((h) => h.Id === id);
      return match || null;
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to get handover by ID:', error);
      return null;
    }
  }

  /**
   * Get delivery handover linked to a service request
   * Returns null if not found
   */
  async getHandoverByRequestId(requestId: number): Promise<DeliveryHandover | null> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME) as Record<string, unknown>[];

      const mapped = items.map((item) => this.mapToHandover(item));
      const match = mapped.find((h) => Number(h.ServiceRequestId) === Number(requestId));
      return match || null;
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to get handover by request ID:', error);
      return null;
    }
  }

  /**
   * Get all delivery handover records, sorted by Created descending
   */
  async getAllHandovers(): Promise<DeliveryHandover[]> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME) as Record<string, unknown>[];

      const handovers = items.map((item) => this.mapToHandover(item));

      // Sort by Created descending
      handovers.sort((a, b) => {
        const dateA = new Date(a.Created).getTime();
        const dateB = new Date(b.Created).getTime();
        return dateB - dateA;
      });

      return handovers;
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to get all handovers:', error);
      return [];
    }
  }

  /**
   * Update a delivery handover with partial data
   * Handles JSON serialization for content columns
   */
  async updateHandover(id: number, updates: UpdateHandoverInput): Promise<DeliveryHandover> {
    try {
      const graphService = getGraphService();

      // Get current state for audit
      const current = await this.getHandoverById(id);
      if (!current) {
        throw new Error('Delivery handover not found');
      }

      // Build update payload
      const updateData = this.serializeForSharePoint(updates);

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated item
      const updated = await this.getHandoverById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated delivery handover');
      }

      // Audit log
      await auditService.logUpdate(
        'DeliveryHandover' as never,
        id,
        current.Title,
        { status: current.HandoverStatus },
        {
          status: updated.HandoverStatus,
          ...(updates.HandoverStatus
            ? { statusChange: `${current.HandoverStatus} -> ${updates.HandoverStatus}` }
            : {}),
        }
      );

      return updated;
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to update handover:', error);
      throw error;
    }
  }

  /**
   * Update handover status with transition validation
   * Validates against HANDOVER_STATUS_TRANSITIONS before applying
   */
  async updateStatus(
    id: number,
    newStatus: HandoverStatus,
    userEmail: string,
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const graphService = getGraphService();

      // Get current handover
      const current = await this.getHandoverById(id);
      if (!current) {
        return { success: false, error: 'Delivery handover not found' };
      }

      // Validate status transition
      const allowedTransitions = HANDOVER_STATUS_TRANSITIONS[current.HandoverStatus];
      if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        return {
          success: false,
          error: `Cannot transition from '${current.HandoverStatus}' to '${newStatus}'. Allowed: ${(allowedTransitions || []).join(', ')}`,
        };
      }

      // Gate: Closing requires all deliverables approved + final sign-off
      if (newStatus === 'Closed') {
        const closeCheck = this.canCloseHandover(current);
        if (!closeCheck.canClose) {
          return { success: false, error: closeCheck.reason };
        }
      }

      // Build update payload
      const updateData: Record<string, unknown> = {
        HandoverStatus: newStatus,
      };

      // Set metadata based on target status
      if (newStatus === 'Kickoff Scheduled' && !current.PlannedKickoffDate) {
        updateData.PlannedKickoffDate = new Date().toISOString();
      }

      if (newStatus === 'Delivered') {
        updateData.HandoverCompletedDate = new Date().toISOString();
      }

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Audit log
      await auditService.logUpdate(
        'DeliveryHandover' as never,
        id,
        current.Title,
        { status: current.HandoverStatus },
        { status: newStatus, updatedBy: userEmail, updatedByName: userName }
      );

      return { success: true };
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to update handover status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update handover status',
      };
    }
  }

  /**
   * Assign delivery team members to a handover
   * If a Delivery Manager or Project Manager is in the team, also sets their name/email fields
   */
  async assignDeliveryTeam(
    id: number,
    team: TeamAssignment[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const graphService = getGraphService();

      // Get current handover
      const current = await this.getHandoverById(id);
      if (!current) {
        return { success: false, error: 'Delivery handover not found' };
      }

      const updateData: Record<string, unknown> = {
        DeliveryTeam_JSON: serializeDeliveryTeam(team),
      };

      // Auto-set Delivery Manager and Project Manager fields if found in team
      const deliveryManager = team.find(
        (member) => member.role === 'Delivery Manager'
      );
      if (deliveryManager) {
        updateData.DeliveryManagerName = deliveryManager.resourceName;
        updateData.DeliveryManagerEmail = deliveryManager.resourceEmail;
      }

      const projectManager = team.find(
        (member) => member.role === 'Project Manager'
      );
      if (projectManager) {
        updateData.ProjectManagerName = projectManager.resourceName;
        updateData.ProjectManagerEmail = projectManager.resourceEmail;
      }

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Audit log
      await auditService.logUpdate(
        'DeliveryHandover' as never,
        id,
        current.Title,
        {
          deliveryTeamCount: current.DeliveryTeam.length,
          deliveryManager: current.DeliveryManagerName || 'None',
          projectManager: current.ProjectManagerName || 'None',
        },
        {
          deliveryTeamCount: team.length,
          deliveryManager: deliveryManager?.resourceName || current.DeliveryManagerName || 'None',
          projectManager: projectManager?.resourceName || current.ProjectManagerName || 'None',
          teamMembers: team.map((m) => `${m.resourceName} (${m.role})`),
        }
      );

      return { success: true };
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to assign delivery team:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign delivery team',
      };
    }
  }

  /**
   * Update handover checklist items
   */
  async updateChecklist(id: number, checklist: HandoverChecklistItem[]): Promise<void> {
    try {
      const graphService = getGraphService();

      // Get current handover for audit
      const current = await this.getHandoverById(id);
      if (!current) {
        throw new Error('Delivery handover not found');
      }

      const completedBefore = current.HandoverChecklist.filter((item) => item.isCompleted).length;
      const completedAfter = checklist.filter((item) => item.isCompleted).length;

      await graphService.updateListItem(LIST_NAME, id, {
        HandoverChecklist_JSON: serializeHandoverChecklist(checklist),
      });

      // Audit log
      await auditService.logUpdate(
        'DeliveryHandover' as never,
        id,
        current.Title,
        {
          checklistCompletion: `${completedBefore}/${current.HandoverChecklist.length}`,
        },
        {
          checklistCompletion: `${completedAfter}/${checklist.length}`,
        }
      );
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to update checklist:', error);
      throw error;
    }
  }

  /**
   * Populate handover scope from a linked proposal
   * Copies deliverables, timeline, technologies, contract value, risks, and assumptions
   */
  async populateFromProposal(handoverId: number, proposal: Proposal): Promise<void> {
    try {
      const graphService = getGraphService();

      // Get current handover
      const current = await this.getHandoverById(handoverId);
      if (!current) {
        throw new Error('Delivery handover not found');
      }

      // Build scope snapshot from proposal data
      const scopeSnapshot: ScopeSnapshot = {
        deliverables: [],
        exclusions: [],
        timeline: [],
        technologies: [],
        totalHours: 0,
        totalWeeks: 0,
        contractValue: 0,
        pricingModel: '',
      };

      // Extract deliverables and exclusions from ScopeOfWork
      if (proposal.ScopeOfWork) {
        scopeSnapshot.deliverables = (proposal.ScopeOfWork.deliverables || []).map(
          (d) => ({
            title: d.title || '',
            description: d.description || '',
            hours: d.hours || 0,
          })
        );
        scopeSnapshot.exclusions = proposal.ScopeOfWork.exclusions || [];
        scopeSnapshot.totalHours = scopeSnapshot.deliverables.reduce(
          (sum, d) => sum + (d.hours || 0),
          0
        );
      }

      // Extract timeline phases from proposal
      if (proposal.Timeline) {
        scopeSnapshot.timeline = (proposal.Timeline.phases || []).map((p) => ({
          name: p.name || '',
          startWeek: p.startWeek || 0,
          endWeek: p.endWeek || 0,
          milestones: p.milestones || [],
        }));
        scopeSnapshot.totalWeeks = proposal.Timeline.totalWeeks || 0;
      }

      // Extract technologies from TechnologyStack (pick name + role only)
      if (proposal.TechnologyStack) {
        scopeSnapshot.technologies = (proposal.TechnologyStack.technologies || []).map(
          (t) => ({
            name: t.name || '',
            role: t.role || '',
          })
        );
      }

      // Extract contract value from PricingBreakdown
      if (proposal.PricingBreakdown) {
        scopeSnapshot.contractValue = proposal.PricingBreakdown.grandTotal || 0;
      }

      // Build risks and assumptions from proposal
      const risksAndAssumptions: RiskAssumption[] = [];

      // Add risks from proposal
      if (proposal.Risks && Array.isArray(proposal.Risks)) {
        for (const risk of proposal.Risks) {
          risksAndAssumptions.push({
            id: `ra_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'Risk',
            description: risk.risk || '',
            impact: (risk.impact as RiskAssumption['impact']) || 'Medium',
            mitigation: risk.mitigation || '',
            owner: '',
            source: 'Proposal',
          });
        }
      }

      // Add assumptions from proposal
      if (proposal.Assumptions && Array.isArray(proposal.Assumptions)) {
        for (const assumption of proposal.Assumptions) {
          risksAndAssumptions.push({
            id: `ra_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'Assumption',
            description: assumption,
            impact: 'Medium',
            mitigation: '',
            owner: '',
            source: 'Proposal',
          });
        }
      }

      // Update SharePoint item
      const updateData: Record<string, unknown> = {
        ScopeSnapshot_JSON: serializeScopeSnapshot(scopeSnapshot),
        RisksAndAssumptions_JSON: serializeRisksAndAssumptions(risksAndAssumptions),
      };

      // Also update ContractValue from proposal if available
      if (scopeSnapshot.contractValue) {
        updateData.ContractValue = scopeSnapshot.contractValue;
      }

      await graphService.updateListItem(LIST_NAME, handoverId, updateData);

      // Audit log
      await auditService.logUpdate(
        'DeliveryHandover' as never,
        handoverId,
        current.Title,
        { scopeSource: 'none' },
        {
          scopeSource: 'proposal',
          proposalVersion: proposal.Version,
          deliverablesCount: scopeSnapshot.deliverables.length,
          risksCount: risksAndAssumptions.filter((r) => r.type === 'Risk').length,
          assumptionsCount: risksAndAssumptions.filter((r) => r.type === 'Assumption').length,
          contractValue: scopeSnapshot.contractValue,
        }
      );
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to populate from proposal:', error);
      throw error;
    }
  }

  /**
   * Populate handover context from a linked post-mortem
   * Extracts relevant lessons and issues for delivery context
   * Adds post-mortem insights to ClientBrief context
   */
  async populateFromPostMortem(handoverId: number, postMortem: PostMortem): Promise<void> {
    try {
      const graphService = getGraphService();

      // Get current handover
      const current = await this.getHandoverById(handoverId);
      if (!current) {
        throw new Error('Delivery handover not found');
      }

      // Extract relevant lessons for delivery context
      const deliveryRelevantLessons = postMortem.Lessons
        .filter((lesson) =>
          lesson.type === 'Best Practice' ||
          lesson.type === 'Technical Learning' ||
          lesson.type === 'Client Management'
        )
        .map((lesson) => lesson.lesson);

      // Extract relevant issues for delivery awareness
      const deliveryRelevantIssues = postMortem.Issues
        .filter((issue) =>
          issue.category === 'Communication' ||
          issue.category === 'Process' ||
          issue.category === 'Technical' ||
          issue.category === 'Client-Side'
        )
        .map((issue) => `[${issue.category}/${issue.severity}] ${issue.description}`);

      // Build or augment client brief
      const existingBrief = current.ClientBrief;
      const clientBrief: ClientBrief = {
        executiveSummary: existingBrief?.executiveSummary || '',
        clientContext: existingBrief?.clientContext || '',
        keyStakeholders: existingBrief?.keyStakeholders || [],
        communicationPreferences: existingBrief?.communicationPreferences || '',
        criticalSuccessFactors: existingBrief?.criticalSuccessFactors || [],
        potentialRisks: [
          ...(existingBrief?.potentialRisks || []),
          ...deliveryRelevantIssues,
        ],
        winReason: existingBrief?.winReason || postMortem.WinLossReason || '',
        relationshipDynamics: existingBrief?.relationshipDynamics || '',
        lessonsFromSales: [
          ...(existingBrief?.lessonsFromSales || []),
          ...deliveryRelevantLessons,
        ],
      };

      await graphService.updateListItem(LIST_NAME, handoverId, {
        ClientBrief_JSON: serializeClientBrief(clientBrief),
      });

      // Audit log
      await auditService.logUpdate(
        'DeliveryHandover' as never,
        handoverId,
        current.Title,
        { postMortemLinked: false },
        {
          postMortemLinked: true,
          postMortemId: postMortem.Id,
          lessonsImported: deliveryRelevantLessons.length,
          issuesImported: deliveryRelevantIssues.length,
        }
      );
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to populate from post mortem:', error);
      throw error;
    }
  }

  /**
   * Save or update the client brief section
   * Sets AIGeneratedAt timestamp for AI-generated content
   */
  async saveClientBrief(id: number, brief: ClientBrief): Promise<void> {
    try {
      const graphService = getGraphService();

      // Get current handover for audit
      const current = await this.getHandoverById(id);
      if (!current) {
        throw new Error('Delivery handover not found');
      }

      await graphService.updateListItem(LIST_NAME, id, {
        ClientBrief_JSON: serializeClientBrief(brief),
        AIGeneratedAt: new Date().toISOString(),
      });

      // Audit log
      await auditService.logUpdate(
        'DeliveryHandover' as never,
        id,
        current.Title,
        { clientBriefExists: !!current.ClientBrief },
        {
          clientBriefExists: true,
          aiGeneratedAt: new Date().toISOString(),
          stakeholderCount: brief.keyStakeholders?.length || 0,
        }
      );
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to save client brief:', error);
      throw error;
    }
  }

  /**
   * Save AI-generated project plan
   */
  async saveProjectPlan(id: number, plan: ProjectPlan): Promise<void> {
    try {
      const graphService = getGraphService();

      const current = await this.getHandoverById(id);
      if (!current) throw new Error('Delivery handover not found');

      await graphService.updateListItem(LIST_NAME, id, {
        ProjectPlan_JSON: serializeProjectPlan(plan),
        AIGeneratedAt: new Date().toISOString(),
      });

      await auditService.logUpdate(
        'DeliveryHandover' as never,
        id,
        current.Title,
        { projectPlanExists: !!current.ProjectPlan },
        {
          projectPlanExists: true,
          aiGeneratedAt: new Date().toISOString(),
          phaseCount: plan.phases?.length || 0,
          totalHours: plan.totalHours || 0,
        }
      );
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to save project plan:', error);
      throw error;
    }
  }

  /**
   * Save or update the environment setup section
   */
  async saveEnvironmentSetup(id: number, setup: EnvironmentSetup): Promise<void> {
    try {
      const graphService = getGraphService();

      // Get current handover for audit
      const current = await this.getHandoverById(id);
      if (!current) {
        throw new Error('Delivery handover not found');
      }

      await graphService.updateListItem(LIST_NAME, id, {
        EnvironmentSetup_JSON: serializeEnvironmentSetup(setup),
      });

      // Audit log
      await auditService.logUpdate(
        'DeliveryHandover' as never,
        id,
        current.Title,
        { environmentSetupExists: !!current.EnvironmentSetup },
        {
          environmentSetupExists: true,
          accessItemCount: setup.accessRequirements?.length || 0,
          toolCount: setup.tooling?.length || 0,
        }
      );
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to save environment setup:', error);
      throw error;
    }
  }

  // ─── Milestone & Progress Tracking (v2.17.0) ───────────────────

  /**
   * Initialize milestone tracking from an existing ProjectPlan.
   * Copies milestones into MilestoneCompletion[] with "Not Started" status.
   * Only runs if MilestoneCompletions is empty and ProjectPlan exists.
   */
  async initializeMilestoneTracking(handoverId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const handover = await this.getHandoverById(handoverId);
      if (!handover) return { success: false, error: 'Delivery handover not found' };

      if (!handover.ProjectPlan || !handover.ProjectPlan.milestones?.length) {
        return { success: false, error: 'No project plan milestones to initialize from' };
      }

      if (handover.MilestoneCompletions.length > 0) {
        return { success: false, error: 'Milestone tracking already initialized' };
      }

      const completions: MilestoneCompletion[] = handover.ProjectPlan.milestones.map(
        (milestone, index) => ({
          milestoneIndex: index,
          name: milestone.name,
          plannedWeek: milestone.week,
          status: 'Not Started' as MilestoneStatus,
          actualCompletionDate: null,
          daysVariance: null,
          completedBy: '',
          notes: '',
        })
      );

      const graphService = getGraphService();
      await graphService.updateListItem(LIST_NAME, handoverId, {
        MilestoneCompletions_JSON: serializeMilestoneCompletions(completions),
      });

      // Recalculate health after initialization
      await this.recalculateProjectHealth(handoverId);

      await auditService.logUpdate(
        'DeliveryHandover' as never,
        handoverId,
        handover.Title,
        { milestoneTrackingInitialized: false },
        { milestoneTrackingInitialized: true, milestoneCount: completions.length }
      );

      return { success: true };
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to initialize milestone tracking:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to initialize' };
    }
  }

  /**
   * Update a single milestone's status.
   * Auto-computes daysVariance when marking as Completed.
   */
  async updateMilestoneStatus(
    handoverId: number,
    milestoneIndex: number,
    newStatus: MilestoneStatus,
    completedBy?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const handover = await this.getHandoverById(handoverId);
      if (!handover) return { success: false, error: 'Delivery handover not found' };

      const completions = [...handover.MilestoneCompletions];
      const milestone = completions.find((m) => m.milestoneIndex === milestoneIndex);
      if (!milestone) return { success: false, error: `Milestone index ${milestoneIndex} not found` };

      const oldStatus = milestone.status;
      milestone.status = newStatus;

      if (notes !== undefined) milestone.notes = notes;

      if (newStatus === 'Completed') {
        milestone.actualCompletionDate = new Date().toISOString();
        milestone.completedBy = completedBy || '';

        // Compute variance: compare actual completion to planned date
        // Planned date = WonDate + (plannedWeek * 7 business days)
        if (handover.WonDate) {
          const wonDate = new Date(handover.WonDate);
          const plannedDate = new Date(wonDate);
          plannedDate.setDate(plannedDate.getDate() + milestone.plannedWeek * 7);

          const actualDate = new Date();
          const diffMs = actualDate.getTime() - plannedDate.getTime();
          milestone.daysVariance = Math.round(diffMs / (1000 * 60 * 60 * 24));
        }
      } else if (newStatus === 'In Progress') {
        // Clear completion data if reverting
        milestone.actualCompletionDate = null;
        milestone.daysVariance = null;
        milestone.completedBy = '';
      }

      const graphService = getGraphService();
      await graphService.updateListItem(LIST_NAME, handoverId, {
        MilestoneCompletions_JSON: serializeMilestoneCompletions(completions),
      });

      // Recalculate project health
      await this.recalculateProjectHealth(handoverId);

      await auditService.logUpdate(
        'DeliveryHandover' as never,
        handoverId,
        handover.Title,
        { milestone: milestone.name, oldStatus },
        { milestone: milestone.name, newStatus, completedBy: completedBy || '', daysVariance: milestone.daysVariance }
      );

      return { success: true };
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to update milestone status:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update milestone' };
    }
  }

  /**
   * Recalculate and persist project health score.
   * Weighted: 50% milestone progress + 30% checklist progress + 20% overdue penalty.
   */
  async recalculateProjectHealth(handoverId: number): Promise<ProjectHealth | null> {
    try {
      const handover = await this.getHandoverById(handoverId);
      if (!handover) return null;

      const milestones = handover.MilestoneCompletions;
      const checklist = handover.HandoverChecklist;

      // Milestone progress (% completed)
      const totalMilestones = milestones.length;
      const completedMilestones = milestones.filter((m) => m.status === 'Completed').length;
      const milestoneProgress = totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : 0;

      // Checklist progress (% completed)
      const totalChecklist = checklist.length;
      const completedChecklist = checklist.filter((c) => c.isCompleted).length;
      const checklistProgress = totalChecklist > 0
        ? Math.round((completedChecklist / totalChecklist) * 100)
        : 0;

      // Overdue count
      const overdueCount = milestones.filter((m) => m.status === 'Overdue').length;

      // Overdue penalty: 10 points per overdue milestone
      const overduePenalty = Math.min(overdueCount * 10, 20); // Cap at 20

      // Weighted score: 50% milestone + 30% checklist - overdue penalty
      const rawScore = (milestoneProgress * 0.5) + (checklistProgress * 0.3) + (20 - overduePenalty);
      const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));

      // Determine health status
      let status: ProjectHealthStatus = 'On Track';
      if (overallScore < 40 || overdueCount >= 3) {
        status = 'Off Track';
      } else if (overallScore < 70 || overdueCount >= 1) {
        status = 'At Risk';
      }

      const health: ProjectHealth = {
        overallScore,
        status,
        milestoneProgress,
        checklistProgress,
        overdueCount,
        lastUpdated: new Date().toISOString(),
      };

      const graphService = getGraphService();
      await graphService.updateListItem(LIST_NAME, handoverId, {
        ProjectHealth_JSON: serializeProjectHealth(health),
      });

      return health;
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to recalculate project health:', error);
      return null;
    }
  }

  /**
   * Get milestones that are past their planned week but not completed.
   * Uses WonDate + plannedWeek to determine if a milestone is overdue.
   */
  getOverdueMilestones(handover: DeliveryHandover): MilestoneCompletion[] {
    if (!handover.WonDate || !handover.MilestoneCompletions.length) return [];

    const wonDate = new Date(handover.WonDate);
    const now = new Date();

    return handover.MilestoneCompletions.filter((m) => {
      if (m.status === 'Completed') return false;

      const plannedDate = new Date(wonDate);
      plannedDate.setDate(plannedDate.getDate() + m.plannedWeek * 7);

      return now > plannedDate;
    });
  }

  /**
   * Mark overdue milestones — scans all active handovers and updates status.
   * Returns list of handover IDs with newly overdue milestones.
   */
  async markOverdueMilestones(): Promise<number[]> {
    try {
      const allHandovers = await this.getAllHandovers();
      const activeHandovers = allHandovers.filter(
        (h) => h.HandoverStatus !== 'Closed' && h.HandoverStatus !== 'On Hold'
      );

      const updatedIds: number[] = [];

      for (const handover of activeHandovers) {
        if (!handover.MilestoneCompletions.length || !handover.WonDate) continue;

        const overdue = this.getOverdueMilestones(handover);
        const needsUpdate = overdue.some((m) => m.status !== 'Overdue');

        if (needsUpdate) {
          const completions = handover.MilestoneCompletions.map((m) => {
            const isOverdue = overdue.find((o) => o.milestoneIndex === m.milestoneIndex);
            if (isOverdue && m.status !== 'Overdue' && m.status !== 'Completed') {
              return { ...m, status: 'Overdue' as MilestoneStatus };
            }
            return m;
          });

          const graphService = getGraphService();
          await graphService.updateListItem(LIST_NAME, handover.Id, {
            MilestoneCompletions_JSON: serializeMilestoneCompletions(completions),
          });

          await this.recalculateProjectHealth(handover.Id);
          updatedIds.push(handover.Id);
        }
      }

      return updatedIds;
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to mark overdue milestones:', error);
      return [];
    }
  }

  // ─── Client Sign-Off & Acceptance (v2.17.0) ────────────────────

  /**
   * Initialize deliverable sign-offs from ScopeSnapshot.deliverables.
   * Each deliverable gets a Pending sign-off record.
   */
  async initializeDeliverableSignOffs(handoverId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const handover = await this.getHandoverById(handoverId);
      if (!handover) return { success: false, error: 'Delivery handover not found' };

      if (!handover.ScopeSnapshot || !handover.ScopeSnapshot.deliverables?.length) {
        return { success: false, error: 'No deliverables in scope snapshot to initialize from' };
      }

      if (handover.DeliverableSignOffs.length > 0) {
        return { success: false, error: 'Deliverable sign-offs already initialized' };
      }

      const signOffs: DeliverableSignOff[] = handover.ScopeSnapshot.deliverables.map(
        (deliverable, index) => ({
          deliverableIndex: index,
          title: deliverable.title,
          status: 'Pending' as SignOffStatus,
          acceptanceCriteria: [],
          criteriaCompleted: [],
          submittedDate: null,
          submittedBy: '',
          approvedDate: null,
          approvedBy: '',
          rejectionReason: '',
          resubmittedDate: null,
          notes: '',
        })
      );

      const graphService = getGraphService();
      await graphService.updateListItem(LIST_NAME, handoverId, {
        DeliverableSignOffs_JSON: serializeDeliverableSignOffs(signOffs),
      });

      await auditService.logUpdate(
        'DeliveryHandover' as never,
        handoverId,
        handover.Title,
        { signOffsInitialized: false },
        { signOffsInitialized: true, deliverableCount: signOffs.length }
      );

      return { success: true };
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to initialize deliverable sign-offs:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to initialize' };
    }
  }

  /**
   * Update a deliverable sign-off status with transition validation.
   */
  async updateDeliverableSignOff(
    handoverId: number,
    deliverableIndex: number,
    newStatus: SignOffStatus,
    userName: string,
    extra?: { rejectionReason?: string; notes?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const handover = await this.getHandoverById(handoverId);
      if (!handover) return { success: false, error: 'Delivery handover not found' };

      const signOffs = [...handover.DeliverableSignOffs];
      const signOff = signOffs.find((s) => s.deliverableIndex === deliverableIndex);
      if (!signOff) return { success: false, error: `Deliverable sign-off index ${deliverableIndex} not found` };

      // Validate transition
      const allowed = SIGN_OFF_STATUS_TRANSITIONS[signOff.status];
      if (!allowed.includes(newStatus)) {
        return { success: false, error: `Cannot transition from '${signOff.status}' to '${newStatus}'` };
      }

      const oldStatus = signOff.status;
      signOff.status = newStatus;

      if (extra?.notes !== undefined) signOff.notes = extra.notes;

      switch (newStatus) {
        case 'Submitted':
          signOff.submittedDate = new Date().toISOString();
          signOff.submittedBy = userName;
          break;
        case 'Approved':
          signOff.approvedDate = new Date().toISOString();
          signOff.approvedBy = userName;
          signOff.rejectionReason = '';
          break;
        case 'Rejected':
          signOff.rejectionReason = extra?.rejectionReason || '';
          signOff.approvedDate = null;
          signOff.approvedBy = '';
          break;
        case 'Resubmitted':
          signOff.resubmittedDate = new Date().toISOString();
          signOff.submittedBy = userName;
          break;
      }

      const graphService = getGraphService();
      await graphService.updateListItem(LIST_NAME, handoverId, {
        DeliverableSignOffs_JSON: serializeDeliverableSignOffs(signOffs),
      });

      await auditService.logUpdate(
        'DeliveryHandover' as never,
        handoverId,
        handover.Title,
        { deliverable: signOff.title, oldStatus },
        { deliverable: signOff.title, newStatus, updatedBy: userName }
      );

      return { success: true };
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to update deliverable sign-off:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update' };
    }
  }

  /**
   * Record the final handover sign-off.
   * Validates all deliverables are approved before allowing.
   */
  async recordFinalSignOff(
    handoverId: number,
    signOff: FinalHandoverSignOff
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const handover = await this.getHandoverById(handoverId);
      if (!handover) return { success: false, error: 'Delivery handover not found' };

      // Validate all deliverables approved
      const canClose = this.canCloseHandover(handover);
      if (!canClose.canClose) {
        return { success: false, error: canClose.reason || 'Not all deliverables have been approved' };
      }

      const graphService = getGraphService();
      await graphService.updateListItem(LIST_NAME, handoverId, {
        FinalHandoverSignOff_JSON: serializeFinalSignOff({ ...signOff, isComplete: true }),
      });

      await auditService.logUpdate(
        'DeliveryHandover' as never,
        handoverId,
        handover.Title,
        { finalSignOff: false },
        {
          finalSignOff: true,
          clientSignatory: signOff.clientSignatory,
          dwSignatory: signOff.dwSignatory,
          overallRating: signOff.overallRating,
        }
      );

      return { success: true };
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to record final sign-off:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to record' };
    }
  }

  /**
   * Check if a handover can be closed.
   * Requires: all deliverable sign-offs approved + final sign-off recorded.
   */
  canCloseHandover(handover: DeliveryHandover): { canClose: boolean; reason?: string } {
    if (handover.DeliverableSignOffs.length > 0) {
      const unapproved = handover.DeliverableSignOffs.filter((s) => s.status !== 'Approved');
      if (unapproved.length > 0) {
        return {
          canClose: false,
          reason: `${unapproved.length} deliverable${unapproved.length !== 1 ? 's' : ''} not yet approved: ${unapproved.map((s) => s.title).join(', ')}`,
        };
      }
    }

    return { canClose: true };
  }

  // ─── Analytics ──────────────────────────────────────────────────

  /**
   * Get aggregate handover statistics
   * Returns counts by status, average handover duration, and total contract value
   */
  async getHandoverStats(): Promise<HandoverStats> {
    try {
      const allHandovers = await this.getAllHandovers();

      const stats: HandoverStats = {
        total: allHandovers.length,
        pending: 0,
        inProgress: 0,
        kickoffScheduled: 0,
        delivered: 0,
        closed: 0,
        onHold: 0,
        avgHandoverDays: 0,
        totalContractValue: 0,
      };

      // Count by status
      for (const handover of allHandovers) {
        switch (handover.HandoverStatus) {
          case 'Pending':
            stats.pending += 1;
            break;
          case 'In Progress':
            stats.inProgress += 1;
            break;
          case 'Kickoff Scheduled':
            stats.kickoffScheduled += 1;
            break;
          case 'Delivered':
            stats.delivered += 1;
            break;
          case 'Closed':
            stats.closed += 1;
            break;
          case 'On Hold':
            stats.onHold += 1;
            break;
        }

        // Sum contract value
        stats.totalContractValue += handover.ContractValue || 0;
      }

      // Calculate average handover days (Won date to HandoverCompletedDate)
      const deliveredHandovers = allHandovers.filter(
        (h) =>
          (h.HandoverStatus === 'Delivered' || h.HandoverStatus === 'Closed') &&
          h.WonDate &&
          h.HandoverCompletedDate
      );

      if (deliveredHandovers.length > 0) {
        const totalDays = deliveredHandovers.reduce((sum, h) => {
          const wonDate = new Date(h.WonDate).getTime();
          const completedDate = new Date(h.HandoverCompletedDate!).getTime();
          const days = Math.max(0, (completedDate - wonDate) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);

        stats.avgHandoverDays = Math.round((totalDays / deliveredHandovers.length) * 10) / 10;
      }

      return stats;
    } catch (error) {
      console.error('[DeliveryHandoverService] Failed to get handover stats:', error);
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        kickoffScheduled: 0,
        delivered: 0,
        closed: 0,
        onHold: 0,
        avgHandoverDays: 0,
        totalContractValue: 0,
      };
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────

  /**
   * Map raw SharePoint item to DeliveryHandover interface
   * Deserializes all JSON columns using helpers from DeliveryHandover types
   */
  private mapToHandover(item: Record<string, unknown>): DeliveryHandover {
    const fields = (item.fields as Record<string, unknown>) || item;

    return {
      Id: Number(item.id || item.Id || fields.id || fields.Id || 0),
      Title: String(fields.Title || ''),

      // Related entities
      ServiceRequestId: Number(fields.ServiceRequestId || 0),
      ProposalId: fields.ProposalId ? Number(fields.ProposalId) : undefined,
      PostMortemId: fields.PostMortemId ? Number(fields.PostMortemId) : undefined,

      // Deal context
      ClientName: String(fields.ClientName || ''),
      ProjectName: String(fields.ProjectName || ''),
      ServiceName: String(fields.ServiceName || ''),
      ServiceCategory: (fields.ServiceCategory || '') as ServiceCategory,
      ContractValue: fields.ContractValue ? Number(fields.ContractValue) : 0,

      // Status
      HandoverStatus: (fields.HandoverStatus as HandoverStatus) || 'Pending',

      // Key dates
      WonDate: String(fields.WonDate || ''),
      HandoverMeetingDate: (fields.HandoverMeetingDate as string) || undefined,
      PlannedKickoffDate: (fields.PlannedKickoffDate as string) || undefined,
      ActualKickoffDate: (fields.ActualKickoffDate as string) || undefined,
      PlannedGoLive: (fields.PlannedGoLive as string) || undefined,
      HandoverCompletedDate: (fields.HandoverCompletedDate as string) || undefined,

      // Pre-sales team
      AccountManagerName: String(fields.AccountManagerName || ''),
      AccountManagerEmail: String(fields.AccountManagerEmail || ''),
      PreSalesSpecialistName: (fields.PreSalesSpecialistName as string) || undefined,
      PreSalesSpecialistEmail: (fields.PreSalesSpecialistEmail as string) || undefined,

      // Delivery team
      DeliveryManagerName: (fields.DeliveryManagerName as string) || undefined,
      DeliveryManagerEmail: (fields.DeliveryManagerEmail as string) || undefined,
      ProjectManagerName: (fields.ProjectManagerName as string) || undefined,
      ProjectManagerEmail: (fields.ProjectManagerEmail as string) || undefined,

      // JSON columns — deserialized via type helpers
      ScopeSnapshot: deserializeScopeSnapshot(fields.ScopeSnapshot_JSON as string),
      DeliveryTeam: deserializeDeliveryTeam(fields.DeliveryTeam_JSON as string),
      HandoverChecklist: deserializeHandoverChecklist(fields.HandoverChecklist_JSON as string),
      RisksAndAssumptions: deserializeRisksAndAssumptions(fields.RisksAndAssumptions_JSON as string),
      ClientBrief: deserializeClientBrief(fields.ClientBrief_JSON as string),
      EnvironmentSetup: deserializeEnvironmentSetup(fields.EnvironmentSetup_JSON as string),
      ProjectPlan: deserializeProjectPlan(fields.ProjectPlan_JSON as string),
      MilestoneCompletions: deserializeMilestoneCompletions(fields.MilestoneCompletions_JSON as string),
      ProjectHealth: deserializeProjectHealth(fields.ProjectHealth_JSON as string),
      DeliverableSignOffs: deserializeDeliverableSignOffs(fields.DeliverableSignOffs_JSON as string),
      FinalSignOff: deserializeFinalSignOff(fields.FinalHandoverSignOff_JSON as string),
      CSAT: deserializeCSAT(fields.CSAT_JSON as string),

      // Free-text notes
      PreSalesNotes: (fields.PreSalesNotes as string) || undefined,
      DeliveryNotes: (fields.DeliveryNotes as string) || undefined,
      ClientExpectations: (fields.ClientExpectations as string) || undefined,
      HandoverMeetingNotes: (fields.HandoverMeetingNotes as string) || undefined,

      // AI metadata
      AIGeneratedAt: (fields.AIGeneratedAt as string) || undefined,

      // SharePoint metadata
      Created: String(fields.Created || new Date().toISOString()),
      Modified: (fields.Modified as string) || undefined,
    };
  }

  /**
   * Convert typed update input to SharePoint field values
   * Serializes JSON columns for storage
   */
  private serializeForSharePoint(updates: UpdateHandoverInput): Record<string, unknown> {
    const data: Record<string, unknown> = {};

    // Status and date fields
    if (updates.HandoverStatus !== undefined) data.HandoverStatus = updates.HandoverStatus;
    if (updates.HandoverMeetingDate !== undefined) data.HandoverMeetingDate = updates.HandoverMeetingDate;
    if (updates.PlannedKickoffDate !== undefined) data.PlannedKickoffDate = updates.PlannedKickoffDate;
    if (updates.ActualKickoffDate !== undefined) data.ActualKickoffDate = updates.ActualKickoffDate;
    if (updates.PlannedGoLive !== undefined) data.PlannedGoLive = updates.PlannedGoLive;
    if (updates.HandoverCompletedDate !== undefined) data.HandoverCompletedDate = updates.HandoverCompletedDate;

    // Delivery team leads
    if (updates.DeliveryManagerName !== undefined) data.DeliveryManagerName = updates.DeliveryManagerName;
    if (updates.DeliveryManagerEmail !== undefined) data.DeliveryManagerEmail = updates.DeliveryManagerEmail;
    if (updates.ProjectManagerName !== undefined) data.ProjectManagerName = updates.ProjectManagerName;
    if (updates.ProjectManagerEmail !== undefined) data.ProjectManagerEmail = updates.ProjectManagerEmail;

    // Free-text notes
    if (updates.PreSalesNotes !== undefined) data.PreSalesNotes = updates.PreSalesNotes;
    if (updates.DeliveryNotes !== undefined) data.DeliveryNotes = updates.DeliveryNotes;
    if (updates.ClientExpectations !== undefined) data.ClientExpectations = updates.ClientExpectations;
    if (updates.HandoverMeetingNotes !== undefined) data.HandoverMeetingNotes = updates.HandoverMeetingNotes;

    // AI metadata
    if (updates.AIGeneratedAt !== undefined) data.AIGeneratedAt = updates.AIGeneratedAt;

    // JSON columns — serialize via type helpers
    if (updates.ScopeSnapshot !== undefined) {
      data.ScopeSnapshot_JSON = updates.ScopeSnapshot
        ? serializeScopeSnapshot(updates.ScopeSnapshot)
        : JSON.stringify(null);
    }
    if (updates.DeliveryTeam !== undefined) {
      data.DeliveryTeam_JSON = serializeDeliveryTeam(updates.DeliveryTeam);
    }
    if (updates.HandoverChecklist !== undefined) {
      data.HandoverChecklist_JSON = serializeHandoverChecklist(updates.HandoverChecklist);
    }
    if (updates.RisksAndAssumptions !== undefined) {
      data.RisksAndAssumptions_JSON = serializeRisksAndAssumptions(updates.RisksAndAssumptions);
    }
    if (updates.ClientBrief !== undefined) {
      data.ClientBrief_JSON = updates.ClientBrief
        ? serializeClientBrief(updates.ClientBrief)
        : JSON.stringify(null);
    }
    if (updates.EnvironmentSetup !== undefined) {
      data.EnvironmentSetup_JSON = updates.EnvironmentSetup
        ? serializeEnvironmentSetup(updates.EnvironmentSetup)
        : JSON.stringify(null);
    }
    if (updates.ProjectPlan !== undefined) {
      data.ProjectPlan_JSON = updates.ProjectPlan
        ? serializeProjectPlan(updates.ProjectPlan)
        : JSON.stringify(null);
    }
    if (updates.MilestoneCompletions !== undefined) {
      data.MilestoneCompletions_JSON = serializeMilestoneCompletions(updates.MilestoneCompletions);
    }
    if (updates.ProjectHealth !== undefined) {
      data.ProjectHealth_JSON = updates.ProjectHealth
        ? serializeProjectHealth(updates.ProjectHealth)
        : JSON.stringify(null);
    }
    if (updates.DeliverableSignOffs !== undefined) {
      data.DeliverableSignOffs_JSON = serializeDeliverableSignOffs(updates.DeliverableSignOffs);
    }
    if (updates.FinalSignOff !== undefined) {
      data.FinalHandoverSignOff_JSON = updates.FinalSignOff
        ? serializeFinalSignOff(updates.FinalSignOff)
        : JSON.stringify(null);
    }
    if (updates.CSAT !== undefined) {
      data.CSAT_JSON = updates.CSAT
        ? serializeCSAT(updates.CSAT)
        : JSON.stringify(null);
    }

    return data;
  }
}

// Export singleton instance
export const deliveryHandoverService = new DeliveryHandoverService();
