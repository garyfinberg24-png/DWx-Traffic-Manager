/**
 * DWx Traffic Manager - Service Request Service
 * Orchestrates service request operations including funnel stage transitions
 */

import { config } from '../config/environmentConfig';
import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import { dwxNotificationService } from './DWxNotificationService';
import { specialistService } from './SpecialistService';
import { sessionPrepService } from './SessionPrepService';
import { proposalService } from './ProposalService';
import {
  ServiceRequest,
  CreateServiceRequestInput,
  ServiceRequestResult,
  StageTransitionResult,
  FunnelStage,
  STAGE_TRANSITIONS,
  ServiceRequestFilterCriteria,
  Specialist,
  StageTimestamps,
} from '../types/ServiceRequest';

class ServiceRequestService {
  private readonly listName = config.sharepoint.listName;

  /**
   * Create a new service request
   */
  async createRequest(
    data: CreateServiceRequestInput,
    userEmail: string,
    userName: string,
    isExternal: boolean = false
  ): Promise<ServiceRequestResult> {
    const warnings: string[] = [];

    try {
      const graphService = getGraphService();

      // Validate proposed slots are not in the past
      const now = new Date();
      const pastSlots = [data.ProposedSlot1, data.ProposedSlot2, data.ProposedSlot3]
        .filter(Boolean)
        .filter(slot => new Date(slot!) < now);
      if (pastSlots.length > 0) {
        return { success: false, error: 'Proposed time slots cannot be in the past' };
      }

      // Generate title: "Client - Service"
      const title = `${data.ClientName} - ${data.ServiceName}`;

      // Calculate weighted pipeline if deal value and probability provided
      const weightedPipeline = data.DealValue && data.DealProbability
        ? Math.round(data.DealValue * (data.DealProbability / 100))
        : undefined;

      const itemData = {
        Title: title,
        ServiceId: data.ServiceId,
        ServiceName: data.ServiceName,
        AccountManagerName: userName,
        AccountManagerEmail: userEmail,
        AccountManagerTenant: isExternal ? 'External' : 'Internal',
        ClientName: data.ClientName,
        ClientId: data.ClientId,
        ContactName: data.ContactName,
        ContactEmail: data.ContactEmail,
        ContactPhone: data.ContactPhone,
        Industry: data.Industry,
        CompanySize: data.CompanySize,
        FunnelStage: 'Lead' as FunnelStage, // Always starts as Lead
        InterestLevel: data.InterestLevel,
        DealValue: data.DealValue,
        DealProbability: data.DealProbability,
        WeightedPipeline: weightedPipeline,
        ExpectedCloseDate: data.ExpectedCloseDate,
        Budget: data.Budget,
        Timeline: data.Timeline,
        ProposedSlot1: data.ProposedSlot1,
        ProposedSlot2: data.ProposedSlot2 || '',
        ProposedSlot3: data.ProposedSlot3 || '',
        Requirements: data.Requirements,
        ServiceHistory: data.ServiceHistory,
        Comments: data.Comments,
        // SLA: Record initial stage timestamp
        StageTimestamps_JSON: JSON.stringify({ Lead: new Date().toISOString() }),
        // Tender-specific fields (only included when provided)
        ...(data.TenderReferenceNumber && { TenderReferenceNumber: data.TenderReferenceNumber }),
        ...(data.BriefingSessionDate && { BriefingSessionDate: data.BriefingSessionDate }),
        ...(data.SubmissionDeadline && { SubmissionDeadline: data.SubmissionDeadline }),
        ...(data.TenderManagerName && { TenderManagerName: data.TenderManagerName }),
        ...(data.TenderManagerEmail && { TenderManagerEmail: data.TenderManagerEmail }),
        ...(data.TechnicalSectionOnly !== undefined && { TechnicalSectionOnly: data.TechnicalSectionOnly }),
        ...(data.CVRequired !== undefined && { CVRequired: data.CVRequired }),
      };

      // Create the request in SharePoint
      const result = await graphService.createListItem(this.listName, itemData);
      const request = this.mapToServiceRequest(result);

      // Log audit entry
      await auditService.logCreate('ServiceRequest', request.Id, title, {
        serviceName: data.ServiceName,
        clientName: data.ClientName,
        interestLevel: data.InterestLevel,
        dealValue: data.DealValue,
      });

      // Send DW-branded notifications
      try {
        const notifResults = await dwxNotificationService.sendRequestCreatedNotifications(request);
        const failures = notifResults.filter(r => !r.success);
        if (failures.length > 0) {
          warnings.push(`${failures.length} notification(s) failed to send`);
        }
      } catch (notifError) {
        console.error('Failed to send notifications:', notifError);
        warnings.push('Request created but notifications failed to send');
      }

      return {
        success: true,
        request,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Error creating service request:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating request',
      };
    }
  }

  /**
   * Update deal value and/or probability, recalculating WeightedPipeline
   */
  async updateDealInfo(
    requestId: number,
    updates: { DealValue?: number; DealProbability?: number },
    _userEmail: string,
    userName: string
  ): Promise<ServiceRequestResult> {
    try {
      const graphService = getGraphService();

      const currentItem = await graphService.getListItemById(this.listName, requestId) as Record<string, unknown> | null;
      if (!currentItem) {
        return { success: false, error: 'Request not found' };
      }

      const currentRequest = this.mapToServiceRequest(currentItem);
      const previousValues: Record<string, unknown> = {};
      const updateData: Record<string, unknown> = {};

      const newDealValue = updates.DealValue ?? currentRequest.DealValue;
      const newDealProbability = updates.DealProbability ?? currentRequest.DealProbability;

      if (updates.DealValue !== undefined) {
        previousValues.DealValue = currentRequest.DealValue;
        updateData.DealValue = updates.DealValue;
      }

      if (updates.DealProbability !== undefined) {
        previousValues.DealProbability = currentRequest.DealProbability;
        updateData.DealProbability = updates.DealProbability;
      }

      // Recalculate WeightedPipeline
      if (newDealValue && newDealProbability) {
        previousValues.WeightedPipeline = currentRequest.WeightedPipeline;
        updateData.WeightedPipeline = Math.round(newDealValue * (newDealProbability / 100));
      }

      const result = await graphService.updateListItem(this.listName, requestId, updateData);
      const updatedRequest = this.mapToServiceRequest(result);

      // Audit log
      await auditService.logUpdate(
        'ServiceRequest',
        requestId,
        currentRequest.Title,
        previousValues,
        { ...updateData, changedBy: userName }
      );

      // Notify managers of deal value change (N4)
      try {
        await dwxNotificationService.notifyDealValueChanged(
          updatedRequest,
          {
            previousDealValue: updates.DealValue !== undefined ? currentRequest.DealValue : undefined,
            newDealValue: updates.DealValue,
            previousProbability: updates.DealProbability !== undefined ? currentRequest.DealProbability : undefined,
            newProbability: updates.DealProbability,
            previousWeightedPipeline: updateData.WeightedPipeline !== undefined ? currentRequest.WeightedPipeline : undefined,
            newWeightedPipeline: updateData.WeightedPipeline as number | undefined,
          },
          userName
        );
      } catch (notifError) {
        console.error('Failed to send deal value change notification:', notifError);
      }

      return { success: true, request: updatedRequest };
    } catch (error) {
      console.error('Error updating deal info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update editable fields on a service request (contact info, requirements, comments)
   */
  async updateRequestFields(
    requestId: number,
    updates: {
      ContactName?: string;
      ContactEmail?: string;
      ContactPhone?: string;
      Industry?: string;
      Requirements?: string;
      Comments?: string;
    },
    _userEmail: string,
    userName: string
  ): Promise<ServiceRequestResult> {
    try {
      const graphService = getGraphService();

      const currentItem = await graphService.getListItemById(this.listName, requestId) as Record<string, unknown> | null;
      if (!currentItem) {
        return { success: false, error: 'Request not found' };
      }

      const currentRequest = this.mapToServiceRequest(currentItem);
      const previousValues: Record<string, unknown> = {};
      const updateData: Record<string, unknown> = {};

      // Build diff for audit trail
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          previousValues[key] = (currentRequest as unknown as Record<string, unknown>)[key];
          updateData[key] = value;
        }
      }

      if (Object.keys(updateData).length === 0) {
        return { success: true, request: currentRequest };
      }

      const result = await graphService.updateListItem(this.listName, requestId, updateData);
      const updatedRequest = this.mapToServiceRequest(result);

      // Audit log
      await auditService.logUpdate(
        'ServiceRequest',
        requestId,
        currentRequest.Title,
        previousValues,
        { ...updateData, changedBy: userName }
      );

      return { success: true, request: updatedRequest };
    } catch (error) {
      console.error('Error updating request fields:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update the funnel stage of a request
   */
  async updateStage(
    requestId: number,
    newStage: FunnelStage,
    userEmail: string,
    userName: string,
    reason?: string,
    nextSteps?: string
  ): Promise<StageTransitionResult> {
    try {
      const graphService = getGraphService();

      // Get current request
      const currentItem = await graphService.getListItemById(this.listName, requestId) as Record<string, unknown> | null;
      if (!currentItem) {
        return {
          success: false,
          previousStage: 'Lead',
          newStage,
          error: 'Request not found',
        };
      }

      const currentRequest = this.mapToServiceRequest(currentItem);
      const previousStage = currentRequest.FunnelStage;

      // Validate transition
      const allowedTransitions = STAGE_TRANSITIONS[previousStage] || [];
      if (!allowedTransitions.includes(newStage)) {
        return {
          success: false,
          previousStage,
          newStage,
          error: `Cannot transition from ${previousStage} to ${newStage}. Allowed: ${allowedTransitions.join(', ')}`,
        };
      }

      // Prepare update data
      const updateData: Record<string, unknown> = {
        FunnelStage: newStage,
      };

      // SLA: Record stage entry timestamp
      const existingTimestamps: StageTimestamps = currentRequest.StageTimestamps || {};
      const updatedTimestamps: StageTimestamps = {
        ...existingTimestamps,
        [newStage]: new Date().toISOString(),
      };
      updateData.StageTimestamps_JSON = JSON.stringify(updatedTimestamps);

      // Handle Won/Lost specific fields
      if (newStage === 'Won' || newStage === 'Lost') {
        if (reason) {
          updateData.WinLossReason = reason;
        }
        // Update deal probability
        updateData.DealProbability = newStage === 'Won' ? 100 : 0;
        updateData.WeightedPipeline = newStage === 'Won' ? currentRequest.DealValue : 0;
      }

      if (nextSteps) {
        updateData.NextSteps = nextSteps;
      }

      // Update in SharePoint
      const result = await graphService.updateListItem(this.listName, requestId, updateData);
      const updatedRequest = this.mapToServiceRequest(result);

      // If Won, update client lifetime value (TotalRevenue, EngagementCount, etc.)
      if (newStage === 'Won') {
        try {
          await this.updateClientLifetimeValue(updatedRequest);
        } catch (ltvError) {
          console.error('Failed to update client lifetime value:', ltvError);
          // Don't fail the stage transition for LTV update failure
        }
      }

      // Audit log
      await auditService.logUpdate(
        'ServiceRequest',
        requestId,
        currentRequest.Title,
        { stage: previousStage },
        { stage: newStage, reason, changedBy: userName }
      );

      // Handle stage-specific actions
      await this.handleStageTransitionActions(updatedRequest, previousStage, newStage, userEmail);

      return {
        success: true,
        previousStage,
        newStage,
        request: updatedRequest,
      };
    } catch (error) {
      console.error('Error updating stage:', error);
      return {
        success: false,
        previousStage: 'Lead',
        newStage,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Assign a specialist to a request
   */
  async assignSpecialist(
    requestId: number,
    specialist: Specialist,
    _userEmail: string,
    userName: string
  ): Promise<ServiceRequestResult> {
    try {
      const graphService = getGraphService();

      // Check if there's a previously assigned specialist (reassignment case)
      const currentItem = await graphService.getListItemById(this.listName, requestId) as Record<string, unknown> | null;
      const currentRequest = currentItem ? this.mapToServiceRequest(currentItem) : null;
      const previousSpecialistEmail = currentRequest?.AssignedSpecialistEmail;

      const updateData = {
        AssignedSpecialistName: specialist.Title,
        AssignedSpecialistEmail: specialist.Email,
        AssignedSpecialistRole: specialist.Role,
      };

      const result = await graphService.updateListItem(this.listName, requestId, updateData);
      const request = this.mapToServiceRequest(result);

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
        'ServiceRequest',
        requestId,
        request.Title,
        { specialist: previousSpecialistEmail || null },
        { specialist: specialist.Title, assignedBy: userName }
      );

      // Send DW-branded assignment notifications
      try {
        await dwxNotificationService.sendSpecialistAssignedNotifications(
          request,
          specialist.Title,
          specialist.Email,
          specialist.Role
        );
      } catch (notifError) {
        console.error('Failed to send assignment notifications:', notifError);
      }

      // Notify previous specialist of reassignment (N2)
      if (previousSpecialistEmail && previousSpecialistEmail !== specialist.Email && currentRequest?.AssignedSpecialistName) {
        try {
          await dwxNotificationService.notifySpecialistReassigned(
            'Service Request',
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
      console.error('Error assigning specialist:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Confirm a discovery meeting slot
   */
  async confirmDiscovery(
    requestId: number,
    confirmedSlot: string,
    _userEmail: string,
    userName: string
  ): Promise<ServiceRequestResult> {
    const warnings: string[] = [];

    try {
      const graphService = getGraphService();

      // Get current request
      const currentItem = await graphService.getListItemById(this.listName, requestId) as Record<string, unknown> | null;
      if (!currentItem) {
        return { success: false, error: 'Request not found' };
      }

      const request = this.mapToServiceRequest(currentItem);

      // Validate confirmed slot is not in the past
      if (new Date(confirmedSlot) < new Date()) {
        return { success: false, error: 'Confirmed time slot cannot be in the past' };
      }

      // Create calendar event with Teams meeting
      let calendarEventId: string | undefined;
      try {
        const eventResult = await this.createDiscoveryCalendarEvent(request, confirmedSlot);
        calendarEventId = eventResult.id;
      } catch (calError) {
        console.error('Failed to create calendar event:', calError);
        warnings.push('Calendar event could not be created');

        // Escalate calendar failure to managers (N5)
        try {
          await dwxNotificationService.notifyCalendarEventFailed(
            'Service Request', request.Title, request.ClientName, confirmedSlot, request.AccountManagerName
          );
        } catch (escalateError) {
          console.error('Failed to escalate calendar failure:', escalateError);
        }
      }

      // Update request
      const updateData: Record<string, unknown> = {
        FunnelStage: 'Discovery',
        ConfirmedDateTime: confirmedSlot,
      };

      if (calendarEventId) {
        updateData.CalendarEventId = calendarEventId;
      }

      const result = await graphService.updateListItem(this.listName, requestId, updateData);
      const updatedRequest = this.mapToServiceRequest(result);

      // Audit log
      await auditService.logUpdate(
        'ServiceRequest',
        requestId,
        request.Title,
        { stage: request.FunnelStage },
        { stage: 'Discovery', confirmedSlot, confirmedBy: userName }
      );

      // Send DW-branded discovery confirmed notifications
      try {
        await dwxNotificationService.notifyDiscoveryConfirmed(updatedRequest, confirmedSlot);
      } catch (notifError) {
        console.error('Failed to send discovery confirmation notifications:', notifError);
        warnings.push('Meeting confirmed but notifications failed to send');
      }

      // Create session preparation record for the specialist
      if (updatedRequest.AssignedSpecialistEmail) {
        try {
          const prepResult = await sessionPrepService.createSessionPrep(
            {
              serviceRequestId: requestId,
              specialistEmail: updatedRequest.AssignedSpecialistEmail,
              specialistName: updatedRequest.AssignedSpecialistName || 'Specialist',
            },
            updatedRequest.ClientName,
            confirmedSlot
          );

          if (prepResult.success) {
            // Send prep notification to specialist
            try {
              await dwxNotificationService.notifySessionPrepCreated(
                updatedRequest,
                prepResult.sessionPrep!,
                confirmedSlot
              );
            } catch (prepNotifError) {
              console.error('Failed to send session prep notification:', prepNotifError);
            }
          }
        } catch (prepError) {
          console.error('Failed to create session preparation:', prepError);
          warnings.push('Session preparation could not be created');
        }
      }

      return {
        success: true,
        request: updatedRequest,
        calendarEventId,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      console.error('Error confirming discovery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Record the outcome of a request (Won or Lost)
   */
  async recordOutcome(
    requestId: number,
    outcome: 'Won' | 'Lost',
    reason: string,
    userEmail: string,
    userName: string
  ): Promise<ServiceRequestResult> {
    const result = await this.updateStage(
      requestId,
      outcome,
      userEmail,
      userName,
      reason
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Note: Client LTV update is now handled inside updateStage() for Won transitions

    return {
      success: true,
      request: result.request,
    };
  }

  /**
   * Get all requests with optional filtering
   */
  async getRequests(filters?: ServiceRequestFilterCriteria): Promise<ServiceRequest[]> {
    try {
      const graphService = getGraphService();

      // Fetch all items and filter client-side (avoids non-indexed column and missing fields/ prefix issues)
      const items = await graphService.getListItems(this.listName) as Record<string, unknown>[];

      let requests = items.map(this.mapToServiceRequest);

      // Apply filters client-side
      if (filters?.stages && filters.stages.length > 0) {
        requests = requests.filter(r => filters.stages!.includes(r.FunnelStage));
      }

      if (filters?.accountManagerEmail) {
        requests = requests.filter(r => r.AccountManagerEmail === filters.accountManagerEmail);
      }

      if (filters?.specialistEmail) {
        requests = requests.filter(r => r.AssignedSpecialistEmail === filters.specialistEmail);
      }

      // Sort by Created descending
      requests.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

      return requests;
    } catch (error) {
      console.error('Error fetching requests:', error);
      return [];
    }
  }

  /**
   * Get requests by funnel stage
   */
  async getRequestsByStage(stage: FunnelStage): Promise<ServiceRequest[]> {
    return this.getRequests({ stages: [stage] });
  }

  /**
   * Get requests for a specific AM
   */
  async getRequestsByAM(email: string): Promise<ServiceRequest[]> {
    return this.getRequests({ accountManagerEmail: email });
  }

  /**
   * Get a single request by ID
   */
  async getRequestById(id: number): Promise<ServiceRequest | null> {
    try {
      const graphService = getGraphService();
      const item = await graphService.getListItemById(this.listName, id) as Record<string, unknown> | null;

      if (!item) return null;

      return this.mapToServiceRequest(item);
    } catch (error) {
      console.error('Error fetching request:', error);
      return null;
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Handle actions triggered by stage transitions
   */
  private async handleStageTransitionActions(
    request: ServiceRequest,
    previousStage: FunnelStage,
    newStage: FunnelStage,
    userEmail: string
  ): Promise<void> {
    // Send DW-branded stage change notification
    try {
      // For Won/Lost, send special notifications
      if (newStage === 'Won') {
        await dwxNotificationService.notifyDealWon(request);
      } else if (newStage === 'Lost') {
        await dwxNotificationService.notifyDealLost(request);
      } else {
        await dwxNotificationService.notifyStageChanged(request, previousStage, newStage, userEmail);
      }
    } catch (error) {
      console.error('Failed to send stage change notification:', error);
    }

    // Stage-specific side effects (notifications are already sent above)
    switch (newStage) {
      case 'Won':
        // Decrement specialist deal count (deal is complete)
        if (request.AssignedSpecialistEmail) {
          try {
            const specialist = await specialistService.getSpecialistByEmail(request.AssignedSpecialistEmail);
            if (specialist) {
              await specialistService.decrementDealCount(specialist.Id);
            }
          } catch (specError) {
            console.error('Failed to decrement specialist deal count on Won:', specError);
          }
        }
        break;
      case 'Lost':
        // Clean up calendar event if one exists
        if (request.CalendarEventId) {
          const graphService = getGraphService();
          try {
            try {
              await graphService.deleteCalendarEvent(request.CalendarEventId);
            } catch {
              await graphService.deleteMyCalendarEvent(request.CalendarEventId);
            }
          } catch (calError) {
            console.error('Failed to delete calendar event for Lost deal:', calError);
          }
          // Always clear CalendarEventId regardless of delete success
          try {
            await graphService.updateListItem(this.listName, request.Id, { CalendarEventId: '' });
          } catch (clearError) {
            console.error('Failed to clear CalendarEventId:', clearError);
          }
        }
        // Decrement specialist deal count if assigned
        if (request.AssignedSpecialistEmail) {
          try {
            const specialist = await specialistService.getSpecialistByEmail(request.AssignedSpecialistEmail);
            if (specialist) {
              await specialistService.decrementDealCount(specialist.Id);
            }
          } catch (specError) {
            console.error('Failed to decrement specialist deal count on Lost:', specError);
          }
        }
        break;
      case 'Proposal':
        // Auto-create a proposal record when entering Proposal stage
        try {
          const existingProposal = await proposalService.getProposalByServiceRequest(request.Id);
          if (!existingProposal) {
            const proposalResult = await proposalService.createProposal(
              {
                serviceRequestId: request.Id,
                proposalType: 'Standard',
                templateName: '',
                createdByEmail: userEmail,
                createdByName: request.AssignedSpecialistName || userEmail,
              },
              request.ClientName,
              request.ServiceName
            );
            if (proposalResult.success) {
              console.log(`[ServiceRequestService] Auto-created proposal for request ${request.Id}`);
              // Send proposal created notification
              try {
                await dwxNotificationService.notifyProposalCreated({
                  clientName: request.ClientName,
                  serviceName: request.ServiceName,
                  proposalType: 'Standard',
                  version: 1,
                  status: 'Draft',
                  createdByName: request.AssignedSpecialistName || userEmail,
                  createdByEmail: userEmail,
                  accountManagerName: request.AccountManagerName,
                  accountManagerEmail: request.AccountManagerEmail,
                });
              } catch (notifError) {
                console.error('Failed to send proposal created notification:', notifError);
              }
            }
          }
        } catch (proposalError) {
          console.error('Failed to auto-create proposal:', proposalError);
        }
        break;
    }
  }

  /**
   * Create calendar event for discovery meeting
   */
  private async createDiscoveryCalendarEvent(
    request: ServiceRequest,
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

    const body = `
      <h2>Discovery Meeting: ${request.ServiceName}</h2>
      <p><strong>Client:</strong> ${request.ClientName}</p>
      <p><strong>Contact:</strong> ${request.ContactName} (${request.ContactEmail})</p>
      <p><strong>Service:</strong> ${request.ServiceName}</p>
      <p><strong>Interest Level:</strong> ${request.InterestLevel}</p>
      ${request.DealValue ? `<p><strong>Deal Value:</strong> R${request.DealValue.toLocaleString()}</p>` : ''}
      ${request.Requirements ? `<hr/><h3>Requirements</h3><p>${request.Requirements}</p>` : ''}
    `;

    // Use the current user's calendar for creating events
    return await graphService.createMyCalendarEvent({
      subject: `Discovery: ${request.ClientName} - ${request.ServiceName}`,
      start: startTime,
      end: endTime,
      body,
      location: 'Microsoft Teams Meeting',
      attendees,
    });
  }

  /**
   * Update client lifetime value after Won deal
   */
  private async updateClientLifetimeValue(request: ServiceRequest): Promise<void> {
    if (!request.ClientId || !request.DealValue) return;

    try {
      const graphService = getGraphService();
      const clientsListName = config.sharepoint.clientsListName;

      // Get current client
      const client = await graphService.getListItemById(clientsListName, request.ClientId) as Record<string, unknown> | null;
      if (!client) return;

      const fields = (client.fields as Record<string, unknown>) || client;
      const currentRevenue = (fields.TotalRevenue as number) || 0;
      const currentEngagements = (fields.EngagementCount as number) || 0;

      await graphService.updateListItem(clientsListName, request.ClientId, {
        TotalRevenue: currentRevenue + request.DealValue,
        EngagementCount: currentEngagements + 1,
        LastEngagementDate: new Date().toISOString(),
        ContractStatus: 'Active',
      });
    } catch (error) {
      console.error('Failed to update client lifetime value:', error);
    }
  }

  /**
   * Map SharePoint list item to ServiceRequest
   */
  private mapToServiceRequest(item: Record<string, unknown>): ServiceRequest {
    const fields = (item.fields as Record<string, unknown>) || item;

    return {
      Id: item.id as number || fields.Id as number,
      Title: fields.Title as string || '',
      ServiceId: fields.ServiceId as number,
      ServiceName: fields.ServiceName as string || '',
      AccountManagerName: fields.AccountManagerName as string || '',
      AccountManagerEmail: fields.AccountManagerEmail as string || '',
      AccountManagerTenant: (fields.AccountManagerTenant as 'Internal' | 'External') || 'Internal',
      ClientName: fields.ClientName as string || '',
      ClientId: fields.ClientId as number,
      ContactName: fields.ContactName as string || '',
      ContactEmail: fields.ContactEmail as string || '',
      ContactPhone: fields.ContactPhone as string,
      Industry: fields.Industry as ServiceRequest['Industry'],
      CompanySize: fields.CompanySize as ServiceRequest['CompanySize'],
      FunnelStage: (fields.FunnelStage as FunnelStage) || 'Lead',
      InterestLevel: (fields.InterestLevel as ServiceRequest['InterestLevel']) || 'Warm',
      DealValue: fields.DealValue as number,
      DealProbability: fields.DealProbability as number,
      WeightedPipeline: fields.WeightedPipeline as number,
      ExpectedCloseDate: fields.ExpectedCloseDate as string,
      Budget: fields.Budget as string,
      Timeline: fields.Timeline as string,
      ProposedSlot1: fields.ProposedSlot1 as string || '',
      ProposedSlot2: fields.ProposedSlot2 as string || '',
      ProposedSlot3: fields.ProposedSlot3 as string || '',
      ConfirmedDateTime: fields.ConfirmedDateTime as string,
      CalendarEventId: fields.CalendarEventId as string,
      AssignedSpecialistName: fields.AssignedSpecialistName as string,
      AssignedSpecialistEmail: fields.AssignedSpecialistEmail as string,
      AssignedSpecialistRole: fields.AssignedSpecialistRole as ServiceRequest['AssignedSpecialistRole'],
      Requirements: fields.Requirements as string,
      ServiceHistory: fields.ServiceHistory as string,
      WinLossReason: fields.WinLossReason as string,
      NextSteps: fields.NextSteps as string,
      Comments: fields.Comments as string,
      StageTimestamps: this.parseStageTimestamps(fields.StageTimestamps_JSON as string),
      Created: fields.Created as string || '',
      Modified: fields.Modified as string,
    };
  }

  private parseStageTimestamps(json: string | undefined | null): StageTimestamps | undefined {
    if (!json) return undefined;
    try {
      return JSON.parse(json) as StageTimestamps;
    } catch {
      return undefined;
    }
  }
}

// Export singleton instance
export const serviceRequestService = new ServiceRequestService();
