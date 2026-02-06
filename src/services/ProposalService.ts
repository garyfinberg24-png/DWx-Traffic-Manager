/**
 * DWx Traffic Manager - Proposal Service
 * CRUD operations for proposal management with status workflow,
 * internal approval tracking, and section-level content persistence.
 */

import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import { config } from '../config/environmentConfig';
import {
  Proposal, ProposalStatus, ProposalType, ProposalResult,
  CreateProposalInput, UpdateProposalInput,
  ExecutiveSummary, SolutionOverview, TechnologyStack, ScopeOfWork,
  PricingBreakdown, ProposalTimeline, TeamComposition, ProposalTerms,
  ChangeControl, ProposalRisk, SigningPage,
  PROPOSAL_STATUS_TRANSITIONS, DEFAULT_TERMS, DEFAULT_CHANGE_CONTROL,
} from '../types/Proposal';

const LIST_NAME = config.sharepoint.proposalsListName;

interface GraphListItem {
  id: string;
  fields: Record<string, unknown>;
}

/**
 * Safely parse a JSON string, returning a typed fallback on failure
 */
const parseJson = <T>(value: unknown, fallback: T): T => {
  if (!value) return fallback;
  try {
    return typeof value === 'string' ? JSON.parse(value) : (value as T);
  } catch {
    return fallback;
  }
};

/**
 * Map SharePoint Graph API item to Proposal type
 */
const mapItem = (item: GraphListItem): Proposal => {
  const fields = item.fields;

  return {
    Id: parseInt(item.id, 10),
    Title: (fields.Title as string) || '',
    ServiceRequestId: (fields.ServiceRequestId as number) || 0,
    Status: (fields.Status as ProposalStatus) || 'Draft',
    Version: (fields.Version as number) || 1,
    ProposalType: (fields.ProposalType as ProposalType) || 'Standard',
    TemplateName: (fields.TemplateName as string) || '',

    // Dates
    ValidUntil: (fields.ValidUntil as string) || null,
    SentDate: (fields.SentDate as string) || null,
    ClientResponseDate: (fields.ClientResponseDate as string) || null,

    // Client feedback
    ClientFeedback: (fields.ClientFeedback as string) || '',
    InternalNotes: (fields.InternalNotes as string) || '',

    // Document
    DocumentUrl: (fields.DocumentUrl as string) || '',

    // Created/Approved by
    CreatedByEmail: (fields.CreatedByEmail as string) || '',
    CreatedByName: (fields.CreatedByName as string) || '',
    ApprovedByEmail: (fields.ApprovedByEmail as string) || '',
    ApprovedByName: (fields.ApprovedByName as string) || '',
    ApprovedDate: (fields.ApprovedDate as string) || null,

    // JSON content sections
    ExecutiveSummary: parseJson<ExecutiveSummary | null>(fields.ExecutiveSummary_JSON, null),
    SolutionOverview: parseJson<SolutionOverview | null>(fields.SolutionOverview_JSON, null),
    TechnologyStack: parseJson<TechnologyStack | null>(fields.TechnologyStack_JSON, null),
    ScopeOfWork: parseJson<ScopeOfWork | null>(fields.ScopeOfWork_JSON, null),
    PricingBreakdown: parseJson<PricingBreakdown | null>(fields.PricingBreakdown_JSON, null),
    Timeline: parseJson<ProposalTimeline | null>(fields.Timeline_JSON, null),
    TeamComposition: parseJson<TeamComposition | null>(fields.TeamComposition_JSON, null),
    Terms: parseJson<ProposalTerms | null>(fields.TermsAndConditions_JSON, null),
    ChangeControl: parseJson<ChangeControl | null>(fields.ChangeControl_JSON, null),
    Assumptions: parseJson<string[]>(fields.Assumptions_JSON, []),
    Risks: parseJson<ProposalRisk[]>(fields.RisksAndMitigations_JSON, []),
    SigningPage: parseJson<SigningPage | null>(fields.SigningPage_JSON, null),

    // SharePoint metadata
    Created: (fields.Created as string) || '',
    Modified: (fields.Modified as string) || '',
  };
};

/**
 * Map section key to its SharePoint JSON column name
 */
const sectionColumnMap: Record<string, string> = {
  executiveSummary: 'ExecutiveSummary_JSON',
  solutionOverview: 'SolutionOverview_JSON',
  technologyStack: 'TechnologyStack_JSON',
  scopeOfWork: 'ScopeOfWork_JSON',
  pricingBreakdown: 'PricingBreakdown_JSON',
  timeline: 'Timeline_JSON',
  teamComposition: 'TeamComposition_JSON',
  terms: 'TermsAndConditions_JSON',
  changeControl: 'ChangeControl_JSON',
  assumptions: 'Assumptions_JSON',
  risks: 'RisksAndMitigations_JSON',
  signingPage: 'SigningPage_JSON',
};

class ProposalService {
  /**
   * Create a new proposal with default terms and change control
   */
  async createProposal(
    input: CreateProposalInput,
    clientName: string,
    serviceName: string
  ): Promise<ProposalResult> {
    try {
      const graphService = getGraphService();

      const title = `${clientName} - ${serviceName} Proposal`;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const itemData: Record<string, unknown> = {
        Title: title,
        ServiceRequestId: input.serviceRequestId,
        Status: 'Draft',
        Version: 1,
        ProposalType: input.proposalType || 'Standard',
        TemplateName: input.templateName || '',
        ValidUntil: validUntil.toISOString(),
        CreatedByEmail: input.createdByEmail,
        CreatedByName: input.createdByName,
        TermsAndConditions_JSON: JSON.stringify(DEFAULT_TERMS),
        ChangeControl_JSON: JSON.stringify(DEFAULT_CHANGE_CONTROL),
      };

      const createdItem = await graphService.createListItem(LIST_NAME, itemData);
      const proposal = mapItem(createdItem as GraphListItem);

      // Log the creation
      await auditService.logCreate('Proposal', proposal.Id, title, {
        serviceRequestId: input.serviceRequestId,
        proposalType: input.proposalType || 'Standard',
        createdBy: input.createdByEmail,
      });

      return { success: true, proposal };
    } catch (error) {
      console.error('[ProposalService] Failed to create proposal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create proposal',
      };
    }
  }

  /**
   * Get a proposal by its ID
   */
  async getProposalById(id: number): Promise<Proposal | null> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME, {
        filter: `fields/id eq ${id}`,
      });

      if (items.length === 0) return null;
      return mapItem(items[0] as GraphListItem);
    } catch (error) {
      console.error('[ProposalService] Failed to get proposal by ID:', error);
      return null;
    }
  }

  /**
   * Get proposal linked to a service request
   */
  async getProposalByServiceRequest(serviceRequestId: number): Promise<Proposal | null> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME, {
        filter: `fields/ServiceRequestId eq ${serviceRequestId}`,
      });

      if (items.length === 0) return null;
      return mapItem(items[0] as GraphListItem);
    } catch (error) {
      console.error('[ProposalService] Failed to get proposal by service request:', error);
      return null;
    }
  }

  /**
   * Get all proposals with a given status
   */
  async getProposalsByStatus(status: ProposalStatus): Promise<Proposal[]> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME, {
        filter: `fields/Status eq '${status}'`,
        orderBy: 'fields/Modified desc',
      });

      return (items as GraphListItem[]).map(mapItem);
    } catch (error) {
      console.error('[ProposalService] Failed to get proposals by status:', error);
      return [];
    }
  }

  /**
   * Update a proposal with partial data
   */
  async updateProposal(id: number, updates: UpdateProposalInput): Promise<ProposalResult> {
    try {
      const graphService = getGraphService();

      // Get current state for audit
      const current = await this.getProposalById(id);
      if (!current) {
        return { success: false, error: 'Proposal not found' };
      }

      // Build update payload
      const updateData: Record<string, unknown> = {};

      // Standard fields
      if (updates.status !== undefined) updateData.Status = updates.status;
      if (updates.version !== undefined) updateData.Version = updates.version;
      if (updates.proposalType !== undefined) updateData.ProposalType = updates.proposalType;
      if (updates.templateName !== undefined) updateData.TemplateName = updates.templateName;
      if (updates.validUntil !== undefined) updateData.ValidUntil = updates.validUntil;
      if (updates.clientFeedback !== undefined) updateData.ClientFeedback = updates.clientFeedback;
      if (updates.internalNotes !== undefined) updateData.InternalNotes = updates.internalNotes;
      if (updates.documentUrl !== undefined) updateData.DocumentUrl = updates.documentUrl;
      if (updates.sentDate !== undefined) updateData.SentDate = updates.sentDate;
      if (updates.clientResponseDate !== undefined) updateData.ClientResponseDate = updates.clientResponseDate;
      if (updates.approvedByEmail !== undefined) updateData.ApprovedByEmail = updates.approvedByEmail;
      if (updates.approvedByName !== undefined) updateData.ApprovedByName = updates.approvedByName;
      if (updates.approvedDate !== undefined) updateData.ApprovedDate = updates.approvedDate;

      // JSON section fields
      if (updates.executiveSummary !== undefined) {
        updateData.ExecutiveSummary_JSON = JSON.stringify(updates.executiveSummary);
      }
      if (updates.solutionOverview !== undefined) {
        updateData.SolutionOverview_JSON = JSON.stringify(updates.solutionOverview);
      }
      if (updates.technologyStack !== undefined) {
        updateData.TechnologyStack_JSON = JSON.stringify(updates.technologyStack);
      }
      if (updates.scopeOfWork !== undefined) {
        updateData.ScopeOfWork_JSON = JSON.stringify(updates.scopeOfWork);
      }
      if (updates.pricingBreakdown !== undefined) {
        updateData.PricingBreakdown_JSON = JSON.stringify(updates.pricingBreakdown);
      }
      if (updates.timeline !== undefined) {
        updateData.Timeline_JSON = JSON.stringify(updates.timeline);
      }
      if (updates.teamComposition !== undefined) {
        updateData.TeamComposition_JSON = JSON.stringify(updates.teamComposition);
      }
      if (updates.terms !== undefined) {
        updateData.TermsAndConditions_JSON = JSON.stringify(updates.terms);
      }
      if (updates.changeControl !== undefined) {
        updateData.ChangeControl_JSON = JSON.stringify(updates.changeControl);
      }
      if (updates.assumptions !== undefined) {
        updateData.Assumptions_JSON = JSON.stringify(updates.assumptions);
      }
      if (updates.risks !== undefined) {
        updateData.RisksAndMitigations_JSON = JSON.stringify(updates.risks);
      }
      if (updates.signingPage !== undefined) {
        updateData.SigningPage_JSON = JSON.stringify(updates.signingPage);
      }

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated item
      const updatedProposal = await this.getProposalById(id);
      if (!updatedProposal) {
        return { success: false, error: 'Failed to retrieve updated proposal' };
      }

      // Log the update
      await auditService.logUpdate(
        'Proposal',
        id,
        current.Title,
        { status: current.Status, version: current.Version },
        { status: updatedProposal.Status, version: updatedProposal.Version }
      );

      return { success: true, proposal: updatedProposal };
    } catch (error) {
      console.error('[ProposalService] Failed to update proposal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update proposal',
      };
    }
  }

  /**
   * Update proposal status with transition validation
   */
  async updateStatus(
    id: number,
    newStatus: ProposalStatus,
    userEmail: string,
    userName: string,
    notes?: string
  ): Promise<ProposalResult> {
    try {
      const graphService = getGraphService();

      // Get current proposal
      const current = await this.getProposalById(id);
      if (!current) {
        return { success: false, error: 'Proposal not found' };
      }

      // Validate status transition
      const allowedTransitions = PROPOSAL_STATUS_TRANSITIONS[current.Status];
      if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        return {
          success: false,
          error: `Cannot transition from '${current.Status}' to '${newStatus}'. Allowed: ${(allowedTransitions || []).join(', ')}`,
        };
      }

      // Build update payload
      const updateData: Record<string, unknown> = {
        Status: newStatus,
      };

      // Set metadata based on target status
      if (newStatus === 'Approved') {
        updateData.ApprovedByEmail = userEmail;
        updateData.ApprovedByName = userName;
        updateData.ApprovedDate = new Date().toISOString();
      }

      if (newStatus === 'Sent to Client') {
        updateData.SentDate = new Date().toISOString();
      }

      if (newStatus === 'Accepted' || newStatus === 'Declined') {
        updateData.ClientResponseDate = new Date().toISOString();
      }

      if (notes) {
        updateData.InternalNotes = notes;
      }

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated proposal
      const updatedProposal = await this.getProposalById(id);
      if (!updatedProposal) {
        return { success: false, error: 'Failed to retrieve updated proposal' };
      }

      // Audit log
      await auditService.logUpdate(
        'Proposal',
        id,
        current.Title,
        { status: current.Status },
        { status: newStatus, updatedBy: userEmail }
      );

      return { success: true, proposal: updatedProposal };
    } catch (error) {
      console.error('[ProposalService] Failed to update proposal status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update proposal status',
      };
    }
  }

  /**
   * Submit proposal for internal review
   */
  async submitForReview(
    id: number,
    userEmail: string,
    userName: string
  ): Promise<ProposalResult> {
    return this.updateStatus(id, 'Internal Review', userEmail, userName);
  }

  /**
   * Approve proposal (manager action)
   */
  async approveProposal(
    id: number,
    managerEmail: string,
    managerName: string
  ): Promise<ProposalResult> {
    return this.updateStatus(id, 'Approved', managerEmail, managerName);
  }

  /**
   * Request revision on a proposal (manager action) - increments version
   */
  async requestRevision(
    id: number,
    managerEmail: string,
    _managerName: string,
    notes?: string
  ): Promise<ProposalResult> {
    try {
      const graphService = getGraphService();

      // Get current proposal to increment version
      const current = await this.getProposalById(id);
      if (!current) {
        return { success: false, error: 'Proposal not found' };
      }

      // Validate status transition
      const allowedTransitions = PROPOSAL_STATUS_TRANSITIONS[current.Status];
      if (!allowedTransitions || !allowedTransitions.includes('Revision Requested')) {
        return {
          success: false,
          error: `Cannot request revision from '${current.Status}'. Allowed: ${(allowedTransitions || []).join(', ')}`,
        };
      }

      const updateData: Record<string, unknown> = {
        Status: 'Revision Requested',
        Version: (current.Version || 1) + 1,
      };

      if (notes) {
        updateData.InternalNotes = notes;
      }

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated proposal
      const updatedProposal = await this.getProposalById(id);
      if (!updatedProposal) {
        return { success: false, error: 'Failed to retrieve updated proposal' };
      }

      // Audit log
      await auditService.logUpdate(
        'Proposal',
        id,
        current.Title,
        { status: current.Status, version: current.Version },
        { status: 'Revision Requested', version: updatedProposal.Version, revisedBy: managerEmail }
      );

      return { success: true, proposal: updatedProposal };
    } catch (error) {
      console.error('[ProposalService] Failed to request revision:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request revision',
      };
    }
  }

  /**
   * Mark proposal as sent to client
   */
  async markSentToClient(
    id: number,
    userEmail: string,
    userName: string
  ): Promise<ProposalResult> {
    return this.updateStatus(id, 'Sent to Client', userEmail, userName);
  }

  /**
   * Mark proposal as accepted by client
   */
  async markAccepted(
    id: number,
    userEmail: string,
    userName: string
  ): Promise<ProposalResult> {
    return this.updateStatus(id, 'Accepted', userEmail, userName);
  }

  /**
   * Mark proposal as declined by client
   */
  async markDeclined(
    id: number,
    userEmail: string,
    _userName: string,
    reason?: string
  ): Promise<ProposalResult> {
    try {
      const graphService = getGraphService();

      // Get current proposal
      const current = await this.getProposalById(id);
      if (!current) {
        return { success: false, error: 'Proposal not found' };
      }

      // Validate status transition
      const allowedTransitions = PROPOSAL_STATUS_TRANSITIONS[current.Status];
      if (!allowedTransitions || !allowedTransitions.includes('Declined')) {
        return {
          success: false,
          error: `Cannot decline from '${current.Status}'. Allowed: ${(allowedTransitions || []).join(', ')}`,
        };
      }

      const updateData: Record<string, unknown> = {
        Status: 'Declined',
        ClientResponseDate: new Date().toISOString(),
      };

      if (reason) {
        updateData.ClientFeedback = reason;
      }

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated proposal
      const updatedProposal = await this.getProposalById(id);
      if (!updatedProposal) {
        return { success: false, error: 'Failed to retrieve updated proposal' };
      }

      // Audit log
      await auditService.logUpdate(
        'Proposal',
        id,
        current.Title,
        { status: current.Status },
        { status: 'Declined', declinedBy: userEmail, reason: reason || '' }
      );

      return { success: true, proposal: updatedProposal };
    } catch (error) {
      console.error('[ProposalService] Failed to mark proposal as declined:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark proposal as declined',
      };
    }
  }

  /**
   * Save individual section content by section key
   */
  async saveSectionContent(
    id: number,
    sectionKey: string,
    content: unknown
  ): Promise<ProposalResult> {
    try {
      const graphService = getGraphService();

      // Validate section key
      const columnName = sectionColumnMap[sectionKey];
      if (!columnName) {
        return {
          success: false,
          error: `Unknown section key '${sectionKey}'. Valid keys: ${Object.keys(sectionColumnMap).join(', ')}`,
        };
      }

      // Get current proposal for audit
      const current = await this.getProposalById(id);
      if (!current) {
        return { success: false, error: 'Proposal not found' };
      }

      const updateData: Record<string, unknown> = {
        [columnName]: JSON.stringify(content),
      };

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated proposal
      const updatedProposal = await this.getProposalById(id);
      if (!updatedProposal) {
        return { success: false, error: 'Failed to retrieve updated proposal' };
      }

      // Audit log
      await auditService.logUpdate(
        'Proposal',
        id,
        current.Title,
        { section: sectionKey, action: 'content_update' },
        { section: sectionKey, updatedAt: new Date().toISOString() }
      );

      return { success: true, proposal: updatedProposal };
    } catch (error) {
      console.error('[ProposalService] Failed to save section content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save section content',
      };
    }
  }

  /**
   * Delete a proposal with audit logging
   */
  async deleteProposal(id: number): Promise<ProposalResult> {
    try {
      const graphService = getGraphService();

      // Get current for audit
      const current = await this.getProposalById(id);
      if (!current) {
        return { success: false, error: 'Proposal not found' };
      }

      await graphService.deleteListItem(LIST_NAME, id);

      // Log the deletion
      await auditService.logDelete('Proposal', id, current.Title, {
        serviceRequestId: current.ServiceRequestId,
        status: current.Status,
        version: current.Version,
      });

      return { success: true };
    } catch (error) {
      console.error('[ProposalService] Failed to delete proposal:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete proposal',
      };
    }
  }
}

// Export singleton instance
export const proposalService = new ProposalService();
