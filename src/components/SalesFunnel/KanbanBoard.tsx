/**
 * DWx Traffic Manager - Kanban Board
 * Drag-and-drop board with 5 columns (Lead through Negotiation).
 * Validates stage transitions, performs optimistic UI updates, and reverts on failure.
 * Won/Lost are accessible only via card context menus (not as drag columns).
 */

import React, { useMemo, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { makeStyles } from '@fluentui/react-components';
import {
  type ServiceRequest,
  type FunnelStage,
  STAGE_TRANSITIONS,
  STAGE_METADATA,
} from '../../types/ServiceRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import KanbanColumn from './KanbanColumn';

// ============================================================================
// Props
// ============================================================================

interface KanbanBoardProps {
  requests: ServiceRequest[];
  onRequestUpdated: (r: ServiceRequest) => void;
  onCardClick?: (request: ServiceRequest) => void;
}

// ============================================================================
// Constants
// ============================================================================

const KANBAN_STAGES: FunnelStage[] = [
  'Lead',
  'Qualified',
  'Discovery',
  'Proposal',
  'Negotiation',
];

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  board: {
    display: 'flex',
    gap: '16px',
    padding: '8px',
    overflowX: 'auto',
    height: '100%',
    alignItems: 'flex-start',
  },
});

// ============================================================================
// Component
// ============================================================================

const KanbanBoard: React.FC<KanbanBoardProps> = ({ requests, onRequestUpdated, onCardClick }) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  // Group requests by stage, excluding Won and Lost
  const groupedByStage = useMemo(() => {
    const groups: Record<FunnelStage, ServiceRequest[]> = {
      Lead: [],
      Qualified: [],
      Discovery: [],
      Proposal: [],
      Negotiation: [],
      Won: [],
      Lost: [],
    };

    for (const req of requests) {
      if (groups[req.FunnelStage]) {
        groups[req.FunnelStage].push(req);
      }
    }

    return groups;
  }, [requests]);

  // Handle drag-and-drop between columns
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;

      // Dropped outside any column or in same position
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const sourceStage = source.droppableId as FunnelStage;
      const destStage = destination.droppableId as FunnelStage;
      const requestId = Number(draggableId);

      // Validate transition is allowed
      const allowedTransitions = STAGE_TRANSITIONS[sourceStage];
      if (!allowedTransitions.includes(destStage)) {
        showError(
          'Invalid transition',
          `Cannot move from ${sourceStage} to ${destStage}`
        );
        return;
      }

      // Find the request being moved
      const movedRequest = requests.find((r) => r.Id === requestId);
      if (!movedRequest) return;

      // Optimistic update: immediately reflect the new stage
      const optimisticRequest: ServiceRequest = {
        ...movedRequest,
        FunnelStage: destStage,
      };
      onRequestUpdated(optimisticRequest);

      // Call API
      try {
        const apiResult = await serviceRequestService.updateStage(
          requestId,
          destStage,
          user?.email || '',
          user?.displayName || ''
        );

        if (!apiResult.success) {
          // Revert on failure
          onRequestUpdated({ ...movedRequest, FunnelStage: sourceStage });
          showError('Stage update failed', apiResult.error || 'Unknown error');
          return;
        }

        // Update with server response if available
        if (apiResult.request) {
          onRequestUpdated(apiResult.request);
        }

        showSuccess(
          'Stage updated',
          `${movedRequest.ClientName} moved to ${destStage}`
        );
      } catch (err) {
        // Revert on exception
        onRequestUpdated({ ...movedRequest, FunnelStage: sourceStage });
        showError(
          'Stage update failed',
          err instanceof Error ? err.message : 'Network error'
        );
      }
    },
    [requests, onRequestUpdated, user, showError, showSuccess]
  );

  // Handle Mark Won via context menu (not drag)
  const handleMarkWon = useCallback(
    async (request: ServiceRequest) => {
      const allowedTransitions = STAGE_TRANSITIONS[request.FunnelStage];
      if (!allowedTransitions.includes('Won')) {
        showError(
          'Invalid transition',
          `Cannot mark as Won from ${request.FunnelStage}`
        );
        return;
      }

      // Optimistic update
      const optimistic: ServiceRequest = { ...request, FunnelStage: 'Won' };
      onRequestUpdated(optimistic);

      try {
        const result = await serviceRequestService.updateStage(
          request.Id,
          'Won',
          user?.email || '',
          user?.displayName || ''
        );

        if (!result.success) {
          onRequestUpdated(request); // revert
          showError('Failed to mark as Won', result.error || 'Unknown error');
          return;
        }

        if (result.request) {
          onRequestUpdated(result.request);
        }

        showSuccess('Deal Won', `${request.ClientName} marked as Won`);
      } catch (err) {
        onRequestUpdated(request); // revert
        showError(
          'Failed to mark as Won',
          err instanceof Error ? err.message : 'Network error'
        );
      }
    },
    [onRequestUpdated, user, showError, showSuccess]
  );

  // Handle Mark Lost via context menu (not drag)
  const handleMarkLost = useCallback(
    async (request: ServiceRequest) => {
      const allowedTransitions = STAGE_TRANSITIONS[request.FunnelStage];
      if (!allowedTransitions.includes('Lost')) {
        showError(
          'Invalid transition',
          `Cannot mark as Lost from ${request.FunnelStage}`
        );
        return;
      }

      // Optimistic update
      const optimistic: ServiceRequest = { ...request, FunnelStage: 'Lost' };
      onRequestUpdated(optimistic);

      try {
        const result = await serviceRequestService.updateStage(
          request.Id,
          'Lost',
          user?.email || '',
          user?.displayName || ''
        );

        if (!result.success) {
          onRequestUpdated(request); // revert
          showError('Failed to mark as Lost', result.error || 'Unknown error');
          return;
        }

        if (result.request) {
          onRequestUpdated(result.request);
        }

        showSuccess('Deal Lost', `${request.ClientName} marked as Lost`);
      } catch (err) {
        onRequestUpdated(request); // revert
        showError(
          'Failed to mark as Lost',
          err instanceof Error ? err.message : 'Network error'
        );
      }
    },
    [onRequestUpdated, user, showError, showSuccess]
  );

  const handleCardClick = useCallback((request: ServiceRequest) => {
    onCardClick?.(request);
  }, [onCardClick]);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className={styles.board}>
        {KANBAN_STAGES.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            requests={groupedByStage[stage]}
            stageColor={STAGE_METADATA[stage].color}
            onCardClick={handleCardClick}
            onMarkWon={handleMarkWon}
            onMarkLost={handleMarkLost}
          />
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
