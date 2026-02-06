/**
 * DWx Traffic Manager - Kanban Card
 * Draggable card representing a single deal in the Kanban board.
 * Displays client, service, deal value, interest level, specialist, and days-in-stage.
 * Three-dot context menu provides Mark Won, Mark Lost, and Open Details actions.
 */

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import {
  makeStyles,
  Text,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
  tokens,
} from '@fluentui/react-components';
import {
  MoreHorizontalRegular,
  CheckmarkRegular,
  DismissRegular,
  OpenRegular,
} from '@fluentui/react-icons';
import type { ServiceRequest } from '../../types/ServiceRequest';

// ============================================================================
// Props
// ============================================================================

interface KanbanCardProps {
  request: ServiceRequest;
  index: number;
  stageColor: string;
  onClick: (r: ServiceRequest) => void;
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

const getDaysInStage = (request: ServiceRequest): number => {
  const dateStr = request.Created || request.Modified || '';
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

const getSpecialistInitials = (name?: string): string => {
  if (!name) return '';
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
};

const INTEREST_COLORS: Record<string, { bg: string; text: string }> = {
  Hot: { bg: '#FEE2E2', text: '#DC2626' },
  Warm: { bg: '#FFF7ED', text: '#EA580C' },
  Cold: { bg: '#EFF6FF', text: '#2563EB' },
};

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    cursor: 'grab',
    position: 'relative',
    transitionProperty: 'box-shadow',
    transitionDuration: '150ms',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
    },
  },
  cardInner: {
    padding: '12px 12px 12px 16px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  clientName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '14px',
    lineHeight: '20px',
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: '1 1 auto',
    minWidth: 0,
  },
  menuButton: {
    minWidth: '24px',
    width: '24px',
    height: '24px',
    padding: '0',
    flexShrink: 0,
  },
  serviceName: {
    fontSize: '12px',
    lineHeight: '16px',
    color: tokens.colorNeutralForeground3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '8px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
    flexWrap: 'wrap',
  },
  dealValue: {
    fontSize: '13px',
    fontWeight: tokens.fontWeightSemibold,
    color: '#059669',
  },
  interestBadge: {
    fontSize: '11px',
    fontWeight: tokens.fontWeightSemibold,
    padding: '2px 8px',
    borderRadius: '10px',
    lineHeight: '16px',
    whiteSpace: 'nowrap',
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '8px',
    gap: '6px',
  },
  specialistChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  initialsCircle: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: tokens.fontWeightSemibold,
    color: '#6B7280',
  },
  daysLabel: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
  },
});

// ============================================================================
// Component
// ============================================================================

const KanbanCard: React.FC<KanbanCardProps> = ({
  request,
  index,
  stageColor,
  onClick,
  onMarkWon,
  onMarkLost,
}) => {
  const styles = useStyles();
  const days = getDaysInStage(request);
  const initials = getSpecialistInitials(request.AssignedSpecialistName);
  const interestStyle = INTEREST_COLORS[request.InterestLevel] || INTEREST_COLORS.Cold;

  return (
    <Draggable draggableId={String(request.Id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={styles.card}
          style={{
            ...provided.draggableProps.style,
            borderLeft: `4px solid ${stageColor}`,
            opacity: snapshot.isDragging ? 0.9 : 1,
          }}
          onClick={() => onClick(request)}
        >
          <div className={styles.cardInner}>
            {/* Client name + menu */}
            <div className={styles.headerRow}>
              <Text className={styles.clientName}>{request.ClientName}</Text>
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Button
                    className={styles.menuButton}
                    appearance="subtle"
                    icon={<MoreHorizontalRegular />}
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  />
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem
                      icon={<CheckmarkRegular />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkWon(request);
                      }}
                    >
                      Mark Won
                    </MenuItem>
                    <MenuItem
                      icon={<DismissRegular />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkLost(request);
                      }}
                    >
                      Mark Lost
                    </MenuItem>
                    <MenuItem
                      icon={<OpenRegular />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick(request);
                      }}
                    >
                      Open Details
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>

            {/* Service name */}
            <Text className={styles.serviceName}>{request.ServiceName}</Text>

            {/* Deal value + interest badge */}
            <div className={styles.metaRow}>
              {request.DealValue != null && request.DealValue > 0 ? (
                <Text className={styles.dealValue}>{formatCurrency(request.DealValue)}</Text>
              ) : (
                <Text className={styles.dealValue} style={{ color: '#9CA3AF' }}>
                  No value
                </Text>
              )}
              <span
                className={styles.interestBadge}
                style={{
                  backgroundColor: interestStyle.bg,
                  color: interestStyle.text,
                }}
              >
                {request.InterestLevel}
              </span>
            </div>

            {/* Specialist + days-in-stage */}
            <div className={styles.footerRow}>
              <div className={styles.specialistChip}>
                {initials ? (
                  <>
                    <span className={styles.initialsCircle}>{initials}</span>
                    <span>{request.AssignedSpecialistName}</span>
                  </>
                ) : (
                  <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Unassigned</span>
                )}
              </div>
              <span className={styles.daysLabel}>
                {days}d
              </span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default KanbanCard;
