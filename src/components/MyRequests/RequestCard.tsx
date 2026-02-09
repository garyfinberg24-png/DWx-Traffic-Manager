/**
 * DWx Traffic Manager - Request Card Component
 * Displays a service request in a card format with stage badge, deal value, and next action
 */

import React from 'react';
import {
  Card,
  Text,
  makeStyles,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@fluentui/react-components';
import {
  CalendarLtr24Regular,
  MoneyRegular,
  PersonRegular,
  ArrowRightRegular,
  MoreHorizontalRegular,
  CheckmarkRegular,
  DismissRegular,
  ArrowForwardRegular,
} from '@fluentui/react-icons';
import { Tooltip } from '@fluentui/react-components';
import { ServiceRequest, FunnelStage, InterestLevel, STAGE_TRANSITIONS, SLAStatus } from '../../types/ServiceRequest';
import { followUpService } from '../../services/FollowUpService';
import { slaService } from '../../services/SLAService';
import { StageProgressBar } from './StageProgressBar';
import { DW_COLORS } from '../../utils/buttonStyles';
import { format } from 'date-fns';

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderLeft: `4px solid ${DW_COLORS.teal}`,
    ':hover': {
      boxShadow: '0 3.2px 7.2px 0 rgba(0,0,0,.13), 0 0.6px 1.8px 0 rgba(0,0,0,.11)',
      transform: 'translateY(-2px)',
    },
  },
  cardTop: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  clientName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '260px',
  },
  serviceName: {
    fontSize: '13px',
    color: '#616161',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '260px',
  },
  stageBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  interestBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },
  interestHot: {
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    color: '#d13438',
  },
  interestWarm: {
    backgroundColor: 'rgba(247, 99, 12, 0.1)',
    color: '#f7630c',
  },
  interestCold: {
    backgroundColor: 'rgba(107, 130, 140, 0.1)',
    color: '#6b828c',
  },
  specialistBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#e8f4f6',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: DW_COLORS.teal,
  },
  unassignedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#8a8886',
    fontStyle: 'italic',
  },
  urgencyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },
  urgencyWarning: {
    backgroundColor: 'rgba(247, 99, 12, 0.15)',
    color: '#ca5010',
  },
  urgencyCritical: {
    backgroundColor: 'rgba(209, 52, 56, 0.15)',
    color: '#d13438',
  },
  urgencyOverdue: {
    backgroundColor: 'rgba(209, 52, 56, 0.2)',
    color: '#a80000',
  },
  progressSection: {
    padding: '0 16px',
  },
  cardDetails: {
    padding: '12px 16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    backgroundColor: '#fafafa',
    borderTop: '1px solid #f0f0f0',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '10px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  detailValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  cardFooter: {
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e1e1e1',
  },
  createdDate: {
    fontSize: '12px',
    color: '#616161',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  viewDetailsBtn: {
    padding: '4px 12px',
    backgroundColor: 'transparent',
    border: `1px solid ${DW_COLORS.teal}`,
    color: DW_COLORS.teal,
    fontSize: '12px',
    fontWeight: '500',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: DW_COLORS.teal,
      color: 'white',
    },
  },
  moreButton: {
    minWidth: '28px',
    height: '28px',
    padding: '0',
  },
  footerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  slaDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    marginLeft: '6px',
  },
});

// Stage colors
const stageColors: Record<FunnelStage, { bg: string; text: string; border: string }> = {
  Lead: { bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280', border: '#6B7280' },
  Qualified: { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: '#3B82F6' },
  Discovery: { bg: 'rgba(139, 92, 246, 0.1)', text: '#8B5CF6', border: '#8B5CF6' },
  Proposal: { bg: 'rgba(245, 158, 11, 0.1)', text: '#D97706', border: '#F59E0B' },
  Negotiation: { bg: 'rgba(236, 72, 153, 0.1)', text: '#EC4899', border: '#EC4899' },
  Won: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: '#10B981' },
  Lost: { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: '#EF4444' },
};

interface RequestCardProps {
  request: ServiceRequest;
  onClick: (request: ServiceRequest) => void;
  onQuickAction?: (request: ServiceRequest, action: FunnelStage) => void;
}

const formatCurrency = (value?: number): string => {
  if (!value) return '-';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SLA_COLORS: Record<SLAStatus, string> = {
  'on-track': '#10B981',
  'at-risk': '#F59E0B',
  'breached': '#EF4444',
};

const SLA_LABELS: Record<SLAStatus, string> = {
  'on-track': 'SLA: On Track',
  'at-risk': 'SLA: At Risk',
  'breached': 'SLA: Breached',
};

const getInterestStyle = (
  interest: InterestLevel,
  styles: ReturnType<typeof useStyles>
): string => {
  switch (interest) {
    case 'Hot':
      return styles.interestHot;
    case 'Warm':
      return styles.interestWarm;
    case 'Cold':
      return styles.interestCold;
    default:
      return styles.interestWarm;
  }
};

export const RequestCard: React.FC<RequestCardProps> = ({ request, onClick, onQuickAction }) => {
  const styles = useStyles();

  const stageColor = stageColors[request.FunnelStage] || stageColors.Lead;
  const createdDate = format(new Date(request.Created), 'MMM d, yyyy');

  const confirmedDate = request.ConfirmedDateTime
    ? format(new Date(request.ConfirmedDateTime), 'MMM d @ h:mm a')
    : null;

  const expectedClose = request.ExpectedCloseDate
    ? format(new Date(request.ExpectedCloseDate), 'MMM d, yyyy')
    : 'Not set';

  const transitions = STAGE_TRANSITIONS[request.FunnelStage] || [];

  const urgency = followUpService.getDealUrgency(request);
  const slaStatus = slaService.getSLAStatus(request);
  const daysInStage = slaService.getTimeInCurrentStage(request);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(request);
    }
  };

  return (
    <Card
      className={styles.card}
      style={{ borderLeftColor: stageColor.border }}
      onClick={() => onClick(request)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`${request.ClientName} - ${request.ServiceName}, Stage: ${request.FunnelStage}, Value: ${formatCurrency(request.DealValue)}`}
    >
      <div className={styles.cardTop}>
        <div className={styles.cardHeader}>
          <div className={styles.headerLeft}>
            <Text className={styles.clientName}>{request.ClientName}</Text>
            <Text className={styles.serviceName}>{request.ServiceName}</Text>
          </div>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span
              className={styles.stageBadge}
              style={{
                backgroundColor: stageColor.bg,
                color: stageColor.text,
              }}
              role="status"
              aria-label={`Stage: ${request.FunnelStage}`}
            >
              {request.FunnelStage}
            </span>
            {request.FunnelStage !== 'Won' && request.FunnelStage !== 'Lost' && (
              <Tooltip content={`${SLA_LABELS[slaStatus]} (${daysInStage}d in stage)`} relationship="label">
                <span
                  className={styles.slaDot}
                  style={{ backgroundColor: SLA_COLORS[slaStatus] }}
                  aria-label={SLA_LABELS[slaStatus]}
                />
              </Tooltip>
            )}
          </span>
        </div>

        <div className={styles.badgeRow} role="list" aria-label="Request attributes">
          <span
            className={`${styles.interestBadge} ${getInterestStyle(request.InterestLevel, styles)}`}
            role="listitem"
            aria-label={`Interest level: ${request.InterestLevel}`}
          >
            <span aria-hidden="true">
              {request.InterestLevel === 'Hot' ? '🔥' : request.InterestLevel === 'Warm' ? '☀️' : '❄️'}
            </span>{' '}
            {request.InterestLevel}
          </span>

          {request.AssignedSpecialistName ? (
            <span className={styles.specialistBadge} role="listitem" aria-label={`Assigned specialist: ${request.AssignedSpecialistName}`}>
              <PersonRegular style={{ width: '12px', height: '12px' }} aria-hidden="true" />
              {request.AssignedSpecialistName}
            </span>
          ) : (
            request.FunnelStage !== 'Lead' && (
              <span className={styles.unassignedBadge} role="listitem" aria-label="No specialist assigned">
                <PersonRegular style={{ width: '12px', height: '12px' }} aria-hidden="true" />
                Unassigned
              </span>
            )
          )}

          {urgency && (
            <Tooltip content={urgency.reason} relationship="label">
              <span
                className={`${styles.urgencyBadge} ${
                  urgency.level === 'overdue' ? styles.urgencyOverdue
                    : urgency.level === 'critical' ? styles.urgencyCritical
                    : styles.urgencyWarning
                }`}
                role="listitem"
                aria-label={`Deal urgency: ${urgency.level}`}
              >
                {urgency.level === 'overdue' ? 'Overdue'
                  : urgency.level === 'critical' ? `${urgency.daysSinceUpdate}d stale`
                  : `${urgency.daysSinceUpdate}d stale`}
              </span>
            </Tooltip>
          )}
        </div>
      </div>

      <div className={styles.progressSection}>
        <StageProgressBar currentStage={request.FunnelStage} compact showLabels={false} />
      </div>

      <div className={styles.cardDetails}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Deal Value</span>
          <span className={styles.detailValue}>
            <MoneyRegular style={{ width: '14px', height: '14px', color: '#107c10' }} />
            {formatCurrency(request.DealValue)}
          </span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Probability</span>
          <span className={styles.detailValue}>{request.DealProbability || 50}%</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>
            {confirmedDate ? 'Meeting' : 'Expected Close'}
          </span>
          <span className={styles.detailValue}>
            <CalendarLtr24Regular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {confirmedDate || expectedClose}
          </span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.createdDate}>
          <CalendarLtr24Regular style={{ width: '14px', height: '14px' }} />
          Created {createdDate}
        </span>
        <div className={styles.footerActions}>
          {onQuickAction && transitions.length > 0 && (
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button
                  className={styles.moreButton}
                  appearance="subtle"
                  icon={<MoreHorizontalRegular />}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Quick actions for ${request.ClientName}`}
                  title="Quick actions"
                />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  {transitions.map((stage) => {
                    if (stage === 'Won') {
                      return (
                        <MenuItem
                          key={stage}
                          icon={<CheckmarkRegular />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickAction(request, stage);
                          }}
                        >
                          Mark as Won
                        </MenuItem>
                      );
                    }
                    if (stage === 'Lost') {
                      return (
                        <React.Fragment key={stage}>
                          <MenuDivider />
                          <MenuItem
                            icon={<DismissRegular />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickAction(request, stage);
                            }}
                          >
                            Mark as Lost
                          </MenuItem>
                        </React.Fragment>
                      );
                    }
                    return (
                      <MenuItem
                        key={stage}
                        icon={<ArrowForwardRegular />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAction(request, stage);
                        }}
                      >
                        Move to {stage}
                      </MenuItem>
                    );
                  })}
                </MenuList>
              </MenuPopover>
            </Menu>
          )}
          <Button
            className={styles.viewDetailsBtn}
            appearance="outline"
            size="small"
            icon={<ArrowRightRegular style={{ width: '12px', height: '12px' }} />}
            iconPosition="after"
            onClick={(e) => {
              e.stopPropagation();
              onClick(request);
            }}
          >
            View
          </Button>
        </div>
      </div>
    </Card>
  );
};
