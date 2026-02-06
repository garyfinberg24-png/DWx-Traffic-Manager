/**
 * DWx Traffic Manager - Kanban Column
 * Droppable column for a single funnel stage in the Kanban board.
 * Shows stage header with colored dot, deal count, total value, and a scrollable list of KanbanCards.
 */

import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import {
  makeStyles,
  Text,
  tokens,
} from '@fluentui/react-components';
import type { ServiceRequest, FunnelStage } from '../../types/ServiceRequest';
import KanbanCard from './KanbanCard';

// ============================================================================
// Props
// ============================================================================

interface KanbanColumnProps {
  stage: FunnelStage;
  requests: ServiceRequest[];
  stageColor: string;
  onCardClick: (r: ServiceRequest) => void;
  onMarkWon: (r: ServiceRequest) => void;
  onMarkLost: (r: ServiceRequest) => void;
}

// ============================================================================
// Helpers
// ============================================================================

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(value);

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  column: {
    width: '260px',
    minWidth: '260px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    maxHeight: '100%',
  },
  header: {
    padding: '14px 14px 10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  stageName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  countBadge: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    color: '#ffffff',
    borderRadius: '10px',
    padding: '1px 7px',
    lineHeight: '16px',
    marginLeft: 'auto',
  },
  totalValue: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    paddingLeft: '16px',
  },
  scrollArea: {
    flex: '1 1 auto',
    overflowY: 'auto',
    padding: '0 8px 8px 8px',
    minHeight: '200px',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minHeight: '200px',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    color: tokens.colorNeutralForeground4,
    fontSize: '13px',
    fontStyle: 'italic',
  },
});

// ============================================================================
// Component
// ============================================================================

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  stage,
  requests,
  stageColor,
  onCardClick,
  onMarkWon,
  onMarkLost,
}) => {
  const styles = useStyles();

  const totalValue = requests.reduce((sum, r) => sum + (r.DealValue || 0), 0);

  return (
    <div className={styles.column}>
      {/* Column header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <span className={styles.dot} style={{ backgroundColor: stageColor }} />
          <Text className={styles.stageName}>{stage}</Text>
          <span
            className={styles.countBadge}
            style={{ backgroundColor: stageColor }}
          >
            {requests.length}
          </span>
        </div>
        {totalValue > 0 && (
          <Text className={styles.totalValue}>
            {formatCurrency(totalValue)}
          </Text>
        )}
      </div>

      {/* Droppable area */}
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={styles.scrollArea}
            style={{
              backgroundColor: snapshot.isDraggingOver ? `${stageColor}10` : undefined,
              borderRadius: '0 0 10px 10px',
            }}
          >
            <div className={styles.cardList}>
              {requests.length === 0 && !snapshot.isDraggingOver && (
                <div className={styles.emptyState}>No deals in this stage</div>
              )}
              {requests.map((request, index) => (
                <KanbanCard
                  key={request.Id}
                  request={request}
                  index={index}
                  stageColor={stageColor}
                  onClick={onCardClick}
                  onMarkWon={onMarkWon}
                  onMarkLost={onMarkLost}
                />
              ))}
              {provided.placeholder}
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
