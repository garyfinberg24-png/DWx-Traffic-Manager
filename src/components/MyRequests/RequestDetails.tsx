/**
 * DWx Traffic Manager - Request Details Modal
 * Full service request details with stage actions and history
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Text,
  Button,
  Divider,
  makeStyles,
  Spinner,
} from '@fluentui/react-components';
import {
  Dismiss16Regular,
  CalendarLtr24Regular,
  PersonRegular,
  MoneyRegular,
  MailRegular,
  PhoneRegular,
  BuildingRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  DismissRegular,
  ClockRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  ServiceRequest,
  FunnelStage,
  STAGE_TRANSITIONS,
} from '../../types/ServiceRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { StageProgressBar } from './StageProgressBar';
import { format } from 'date-fns';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '700px',
    width: '90vw',
    maxHeight: '90vh',
    padding: '0',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  header: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e1e1e1',
    position: 'relative',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#616161',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    minWidth: '28px',
    padding: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#e1e1e1',
    },
  },
  stageBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    maxHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  gridLabel: {
    fontSize: '11px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  gridValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  textBlock: {
    fontSize: '14px',
    color: '#424242',
    lineHeight: '1.6',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  stageActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  advanceButton: {
    backgroundColor: '#1e6b7b',
    ':hover': {
      backgroundColor: '#165a68',
    },
  },
  regressButton: {
    backgroundColor: '#616161',
    ':hover': {
      backgroundColor: '#4d4d4d',
    },
  },
  lostButton: {
    backgroundColor: '#d13438',
    ':hover': {
      backgroundColor: '#a52a2d',
    },
  },
  wonButton: {
    backgroundColor: '#107c10',
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  footer: {
    padding: '16px 24px',
    backgroundColor: '#fafafa',
    borderTop: '1px solid #e1e1e1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    fontSize: '12px',
    color: '#616161',
  },
  interestBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  specialistCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#e8f4f6',
    borderRadius: '8px',
  },
  specialistIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1e6b7b',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialistInfo: {
    flex: 1,
  },
  specialistName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  specialistRole: {
    fontSize: '12px',
    color: '#616161',
  },
  unassigned: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    color: '#616161',
    fontStyle: 'italic',
    fontSize: '13px',
  },
  timeSlotsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  timeSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '6px',
    fontSize: '13px',
  },
  confirmedSlot: {
    backgroundColor: '#dff6dd',
    border: '1px solid #107c10',
  },
});

// Stage colors
const stageColors: Record<FunnelStage, { bg: string; text: string }> = {
  Lead: { bg: 'rgba(107, 114, 128, 0.15)', text: '#4B5563' },
  Qualified: { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563EB' },
  Discovery: { bg: 'rgba(139, 92, 246, 0.15)', text: '#7C3AED' },
  Proposal: { bg: 'rgba(245, 158, 11, 0.15)', text: '#B45309' },
  Negotiation: { bg: 'rgba(236, 72, 153, 0.15)', text: '#DB2777' },
  Won: { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669' },
  Lost: { bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626' },
};

interface RequestDetailsProps {
  request: ServiceRequest;
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdated?: (request: ServiceRequest) => void;
}

export const RequestDetails: React.FC<RequestDetailsProps> = ({
  request,
  isOpen,
  onClose,
  onRequestUpdated,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [updating, setUpdating] = useState(false);

  const stageColor = stageColors[request.FunnelStage];
  const availableTransitions = STAGE_TRANSITIONS[request.FunnelStage] || [];

  const formatCurrency = (value?: number): string => {
    if (!value) return 'Not specified';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (dateStr?: string): string => {
    if (!dateStr) return 'Not specified';
    try {
      return format(new Date(dateStr), 'EEE, MMM d, yyyy @ h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const handleStageChange = async (newStage: FunnelStage) => {
    if (!user) return;

    try {
      setUpdating(true);
      const result = await serviceRequestService.updateStage(
        request.Id,
        newStage,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showToast(`Request moved to ${newStage}`, 'success');
        onRequestUpdated?.(result.request);
      } else {
        throw new Error(result.error || 'Failed to update stage');
      }
    } catch (err) {
      console.error('Error updating stage:', err);
      showToast('Failed to update stage', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getTransitionButton = (stage: FunnelStage) => {
    const currentIndex = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation'].indexOf(
      request.FunnelStage
    );
    const targetIndex = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation'].indexOf(stage);

    if (stage === 'Won') {
      return (
        <Button
          key={stage}
          className={styles.wonButton}
          appearance="primary"
          icon={<CheckmarkRegular />}
          onClick={() => handleStageChange(stage)}
          disabled={updating}
        >
          Mark as Won
        </Button>
      );
    }

    if (stage === 'Lost') {
      return (
        <Button
          key={stage}
          className={styles.lostButton}
          appearance="primary"
          icon={<DismissRegular />}
          onClick={() => handleStageChange(stage)}
          disabled={updating}
        >
          Mark as Lost
        </Button>
      );
    }

    if (targetIndex > currentIndex) {
      return (
        <Button
          key={stage}
          className={styles.advanceButton}
          appearance="primary"
          icon={<ArrowRightRegular />}
          onClick={() => handleStageChange(stage)}
          disabled={updating}
        >
          Advance to {stage}
        </Button>
      );
    }

    return (
      <Button
        key={stage}
        className={styles.regressButton}
        appearance="secondary"
        onClick={() => handleStageChange(stage)}
        disabled={updating}
      >
        Move back to {stage}
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody style={{ padding: 0 }}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerContent}>
                <DialogTitle className={styles.title}>{request.ClientName}</DialogTitle>
                <Text className={styles.subtitle}>{request.ServiceName}</Text>
              </div>
              <span
                className={styles.stageBadge}
                style={{ backgroundColor: stageColor.bg, color: stageColor.text }}
              >
                {request.FunnelStage}
              </span>
            </div>
            <StageProgressBar currentStage={request.FunnelStage} showLabels />
            <Button
              className={styles.closeButton}
              appearance="subtle"
              icon={<Dismiss16Regular />}
              onClick={onClose}
              title="Close"
            />
          </div>

          {/* Content */}
          <DialogContent className={styles.content}>
            {/* Stage Actions */}
            {availableTransitions.length > 0 && (
              <div className={styles.section}>
                <Text className={styles.sectionTitle}>
                  <ArrowRightRegular style={{ width: '16px', height: '16px' }} />
                  Stage Actions
                </Text>
                <div className={styles.stageActions}>
                  {updating && <Spinner size="tiny" />}
                  {availableTransitions.map((stage) => getTransitionButton(stage))}
                </div>
              </div>
            )}

            <Divider />

            {/* Contact Information */}
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>
                <PersonRegular style={{ width: '16px', height: '16px' }} />
                Contact Information
              </Text>
              <div className={styles.grid}>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Contact Name</span>
                  <span className={styles.gridValue}>
                    <PersonRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                    {request.ContactName}
                  </span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Email</span>
                  <span className={styles.gridValue}>
                    <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                    {request.ContactEmail}
                  </span>
                </div>
                {request.ContactPhone && (
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Phone</span>
                    <span className={styles.gridValue}>
                      <PhoneRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                      {request.ContactPhone}
                    </span>
                  </div>
                )}
                {request.Industry && (
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Industry</span>
                    <span className={styles.gridValue}>
                      <BuildingRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                      {request.Industry}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Divider />

            {/* Deal Information */}
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>
                <MoneyRegular style={{ width: '16px', height: '16px' }} />
                Deal Information
              </Text>
              <div className={styles.grid}>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Interest Level</span>
                  <span
                    className={styles.interestBadge}
                    style={{
                      backgroundColor:
                        request.InterestLevel === 'Hot'
                          ? 'rgba(209, 52, 56, 0.1)'
                          : request.InterestLevel === 'Warm'
                          ? 'rgba(247, 99, 12, 0.1)'
                          : 'rgba(107, 130, 140, 0.1)',
                      color:
                        request.InterestLevel === 'Hot'
                          ? '#d13438'
                          : request.InterestLevel === 'Warm'
                          ? '#f7630c'
                          : '#6b828c',
                    }}
                  >
                    {request.InterestLevel === 'Hot'
                      ? '🔥'
                      : request.InterestLevel === 'Warm'
                      ? '☀️'
                      : '❄️'}{' '}
                    {request.InterestLevel}
                  </span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Deal Value</span>
                  <span className={styles.gridValue} style={{ color: '#107c10', fontWeight: '600' }}>
                    {formatCurrency(request.DealValue)}
                  </span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Win Probability</span>
                  <span className={styles.gridValue}>{request.DealProbability || 50}%</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Weighted Value</span>
                  <span className={styles.gridValue}>
                    {formatCurrency((request.DealValue || 0) * ((request.DealProbability || 50) / 100))}
                  </span>
                </div>
                {request.Budget && (
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Client Budget</span>
                    <span className={styles.gridValue}>{request.Budget}</span>
                  </div>
                )}
                {request.Timeline && (
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Client Timeline</span>
                    <span className={styles.gridValue}>{request.Timeline}</span>
                  </div>
                )}
              </div>
            </div>

            <Divider />

            {/* Assigned Specialist */}
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>
                <PersonRegular style={{ width: '16px', height: '16px' }} />
                Assigned Specialist
              </Text>
              {request.AssignedSpecialistName ? (
                <div className={styles.specialistCard}>
                  <div className={styles.specialistIcon}>
                    <PersonRegular style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div className={styles.specialistInfo}>
                    <Text className={styles.specialistName}>{request.AssignedSpecialistName}</Text>
                    <Text className={styles.specialistRole}>
                      {request.AssignedSpecialistRole || 'Specialist'} • {request.AssignedSpecialistEmail}
                    </Text>
                  </div>
                </div>
              ) : (
                <div className={styles.unassigned}>No specialist assigned yet</div>
              )}
            </div>

            <Divider />

            {/* Time Slots */}
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>
                <CalendarLtr24Regular style={{ width: '16px', height: '16px' }} />
                Meeting Schedule
              </Text>
              <div className={styles.timeSlotsList}>
                {request.ConfirmedDateTime ? (
                  <div className={`${styles.timeSlot} ${styles.confirmedSlot}`}>
                    <CheckmarkRegular style={{ width: '16px', height: '16px', color: '#107c10' }} />
                    <strong>Confirmed:</strong> {formatDateTime(request.ConfirmedDateTime)}
                  </div>
                ) : (
                  <>
                    <div className={styles.timeSlot}>
                      <ClockRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                      Option 1: {formatDateTime(request.ProposedSlot1)}
                    </div>
                    {request.ProposedSlot2 && (
                      <div className={styles.timeSlot}>
                        <ClockRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                        Option 2: {formatDateTime(request.ProposedSlot2)}
                      </div>
                    )}
                    {request.ProposedSlot3 && (
                      <div className={styles.timeSlot}>
                        <ClockRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                        Option 3: {formatDateTime(request.ProposedSlot3)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Requirements */}
            {request.Requirements && (
              <>
                <Divider />
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Requirements</Text>
                  <div className={styles.textBlock}>{request.Requirements}</div>
                </div>
              </>
            )}

            {/* Comments */}
            {request.Comments && (
              <>
                <Divider />
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>Additional Comments</Text>
                  <div className={styles.textBlock}>{request.Comments}</div>
                </div>
              </>
            )}

            {/* Win/Loss Reason */}
            {request.WinLossReason && (
              <>
                <Divider />
                <div className={styles.section}>
                  <Text className={styles.sectionTitle}>
                    {request.FunnelStage === 'Won' ? 'Win Reason' : 'Loss Reason'}
                  </Text>
                  <div className={styles.textBlock}>{request.WinLossReason}</div>
                </div>
              </>
            )}
          </DialogContent>

          {/* Footer */}
          <div className={styles.footer}>
            <span className={styles.footerLeft}>
              Created {format(new Date(request.Created), 'MMM d, yyyy')} by{' '}
              {request.AccountManagerName}
            </span>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
