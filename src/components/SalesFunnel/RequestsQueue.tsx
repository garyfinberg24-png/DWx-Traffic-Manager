/**
 * DWx Traffic Manager - Requests Queue
 * Manager view for approving/managing service requests
 */

import React, { useState } from 'react';
import {
  Text,
  Button,
  makeStyles,
  Tooltip,
  Spinner,
  Dropdown,
  Option,
  Badge,
} from '@fluentui/react-components';
import {
  CheckmarkRegular,
  PersonRegular,
  CalendarLtr24Regular,
  MoneyRegular,
  ArrowRightRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  ServiceRequest,
  FunnelStage,
  Specialist,
  STAGE_METADATA,
} from '../../types/ServiceRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { specialistService } from '../../services/SpecialistService';
import { format } from 'date-fns';

const useStyles = makeStyles({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e8e8e8',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  badge: {
    backgroundColor: '#d13438',
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '10px',
    marginLeft: '8px',
  },
  content: {
    padding: '0',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#616161',
  },
  requestItem: {
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    ':last-child': {
      borderBottom: 'none',
    },
    ':hover': {
      backgroundColor: '#fafafa',
    },
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  clientName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#242424',
  },
  serviceName: {
    fontSize: '13px',
    color: '#616161',
  },
  stageBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  requestMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#616161',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  specialistDropdown: {
    minWidth: '180px',
  },
  advanceButton: {
    backgroundColor: '#1e6b7b',
    ':hover': {
      backgroundColor: '#165a68',
    },
  },
  confirmButton: {
    backgroundColor: '#107c10',
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  interestBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
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

interface RequestsQueueProps {
  requests: ServiceRequest[];
  onRequestUpdated: (request: ServiceRequest) => void;
}

export const RequestsQueue: React.FC<RequestsQueueProps> = ({
  requests,
  onRequestUpdated,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [selectedSpecialists, setSelectedSpecialists] = useState<Record<number, string>>({});

  // Filter to actionable requests (not Won/Lost)
  const actionableRequests = requests.filter(
    (r) => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
  );

  // Load specialists on mount
  React.useEffect(() => {
    const loadSpecialists = async () => {
      try {
        setLoadingSpecialists(true);
        const data = await specialistService.getSpecialists(true);
        setSpecialists(data);
      } catch (err) {
        console.error('Error loading specialists:', err);
      } finally {
        setLoadingSpecialists(false);
      }
    };
    loadSpecialists();
  }, []);

  const formatCurrency = (value?: number): string => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getNextStage = (current: FunnelStage): FunnelStage | null => {
    const order: FunnelStage[] = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won'];
    const currentIndex = order.indexOf(current);
    if (currentIndex >= 0 && currentIndex < order.length - 1) {
      return order[currentIndex + 1];
    }
    return null;
  };

  const handleAdvanceStage = async (request: ServiceRequest) => {
    if (!user) return;

    const nextStage = getNextStage(request.FunnelStage);
    if (!nextStage) return;

    try {
      setProcessingId(request.Id);
      const result = await serviceRequestService.updateStage(
        request.Id,
        nextStage,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showToast(`Request advanced to ${nextStage}`, 'success');
        onRequestUpdated(result.request);
      } else {
        throw new Error(result.error || 'Failed to advance stage');
      }
    } catch (err) {
      console.error('Error advancing stage:', err);
      showToast('Failed to advance stage', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignSpecialist = async (request: ServiceRequest) => {
    if (!user) return;

    const specialistEmail = selectedSpecialists[request.Id];
    if (!specialistEmail) {
      showToast('Please select a specialist', 'warning');
      return;
    }

    const specialist = specialists.find((s) => s.Email === specialistEmail);
    if (!specialist) return;

    try {
      setProcessingId(request.Id);
      const result = await serviceRequestService.assignSpecialist(
        request.Id,
        specialist,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showToast(`Specialist ${specialist.Title} assigned`, 'success');
        onRequestUpdated(result.request);
      } else {
        throw new Error(result.error || 'Failed to assign specialist');
      }
    } catch (err) {
      console.error('Error assigning specialist:', err);
      showToast('Failed to assign specialist', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleConfirmMeeting = async (request: ServiceRequest, slot: string) => {
    if (!user) return;

    try {
      setProcessingId(request.Id);
      const result = await serviceRequestService.confirmDiscovery(
        request.Id,
        slot,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showToast('Meeting confirmed and calendar invite sent', 'success');
        onRequestUpdated(result.request);
      } else {
        throw new Error(result.error || 'Failed to confirm meeting');
      }
    } catch (err) {
      console.error('Error confirming meeting:', err);
      showToast('Failed to confirm meeting', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text className={styles.title}>Action Queue</Text>
          {actionableRequests.length > 0 && (
            <span className={styles.badge}>{actionableRequests.length}</span>
          )}
        </div>
      </div>
      <div className={styles.content}>
        {actionableRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No requests requiring action</Text>
          </div>
        ) : (
          actionableRequests.map((request) => {
            const stageColor = stageColors[request.FunnelStage];
            const isProcessing = processingId === request.Id;
            const nextStage = getNextStage(request.FunnelStage);
            const needsSpecialist = !request.AssignedSpecialistEmail && request.FunnelStage !== 'Lead';

            return (
              <div key={request.Id} className={styles.requestItem}>
                <div className={styles.requestHeader}>
                  <div className={styles.requestInfo}>
                    <Text className={styles.clientName}>{request.ClientName}</Text>
                    <Text className={styles.serviceName}>{request.ServiceName}</Text>
                  </div>
                  <span
                    className={styles.stageBadge}
                    style={{ backgroundColor: stageColor.bg, color: stageColor.text }}
                  >
                    {request.FunnelStage}
                  </span>
                </div>

                <div className={styles.requestMeta}>
                  <span className={styles.metaItem}>
                    <PersonRegular style={{ width: '14px', height: '14px' }} />
                    {request.AccountManagerName}
                  </span>
                  <span className={styles.metaItem}>
                    <MoneyRegular style={{ width: '14px', height: '14px' }} />
                    {formatCurrency(request.DealValue)}
                  </span>
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
                    {request.InterestLevel === 'Hot' ? '🔥' : request.InterestLevel === 'Warm' ? '☀️' : '❄️'}{' '}
                    {request.InterestLevel}
                  </span>
                </div>

                <div className={styles.actions}>
                  {isProcessing ? (
                    <Spinner size="tiny" />
                  ) : (
                    <>
                      {/* Specialist Assignment */}
                      {needsSpecialist && (
                        <>
                          <Dropdown
                            className={styles.specialistDropdown}
                            placeholder="Select specialist..."
                            selectedOptions={selectedSpecialists[request.Id] ? [selectedSpecialists[request.Id]] : []}
                            onOptionSelect={(_, data) =>
                              setSelectedSpecialists((prev) => ({
                                ...prev,
                                [request.Id]: data.optionValue as string,
                              }))
                            }
                            disabled={loadingSpecialists}
                          >
                            {specialists.map((s) => (
                              <Option key={s.Email} value={s.Email}>
                                {s.Title} ({s.Role})
                              </Option>
                            ))}
                          </Dropdown>
                          <Button
                            appearance="secondary"
                            icon={<PersonRegular />}
                            onClick={() => handleAssignSpecialist(request)}
                            disabled={!selectedSpecialists[request.Id]}
                          >
                            Assign
                          </Button>
                        </>
                      )}

                      {/* Confirm Meeting (for Discovery stage) */}
                      {request.FunnelStage === 'Discovery' && !request.ConfirmedDateTime && (
                        <Dropdown
                          placeholder="Confirm slot..."
                          onOptionSelect={(_, data) =>
                            handleConfirmMeeting(request, data.optionValue as string)
                          }
                        >
                          <Option value={request.ProposedSlot1}>
                            {format(new Date(request.ProposedSlot1), 'MMM d @ h:mm a')}
                          </Option>
                          {request.ProposedSlot2 && (
                            <Option value={request.ProposedSlot2}>
                              {format(new Date(request.ProposedSlot2), 'MMM d @ h:mm a')}
                            </Option>
                          )}
                          {request.ProposedSlot3 && (
                            <Option value={request.ProposedSlot3}>
                              {format(new Date(request.ProposedSlot3), 'MMM d @ h:mm a')}
                            </Option>
                          )}
                        </Dropdown>
                      )}

                      {/* Advance Stage */}
                      {nextStage && (
                        <Button
                          className={styles.advanceButton}
                          appearance="primary"
                          icon={<ArrowRightRegular />}
                          onClick={() => handleAdvanceStage(request)}
                        >
                          {nextStage === 'Won' ? 'Mark Won' : `→ ${nextStage}`}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
