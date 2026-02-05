/**
 * DWx Traffic Manager - Requests Queue
 * Manager view for approving/managing service requests with bulk operations
 */

import React, { useState, useCallback } from 'react';
import {
  Text,
  Button,
  makeStyles,
  Spinner,
  Dropdown,
  Option,
  Checkbox,
  Tooltip,
} from '@fluentui/react-components';
import {
  PersonRegular,
  MoneyRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  DismissRegular,
  ArrowForwardRegular,
  DismissCircleRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  ServiceRequest,
  FunnelStage,
  Specialist,
} from '../../types/ServiceRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { specialistService } from '../../services/SpecialistService';
import { ConfirmDialog } from '../Common/ConfirmDialog';
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
  // Bulk selection styles
  bulkToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    backgroundColor: '#e8f4f6',
    borderBottom: '1px solid #1e6b7b',
  },
  bulkToolbarText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e6b7b',
    flex: 1,
  },
  bulkActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  selectAllCheckbox: {
    marginRight: '8px',
  },
  requestItemWithCheckbox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  },
  requestCheckbox: {
    marginTop: '2px',
    flexShrink: 0,
  },
  requestContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  bulkDropdown: {
    minWidth: '160px',
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
  const [confirmWon, setConfirmWon] = useState<ServiceRequest | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [confirmBulkWon, setConfirmBulkWon] = useState(false);
  const [confirmBulkLost, setConfirmBulkLost] = useState(false);
  const [bulkSpecialist, setBulkSpecialist] = useState<string>('');

  // Filter to actionable requests (not Won/Lost)
  const actionableRequests = requests.filter(
    (r) => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
  );

  // Selection helpers
  const isAllSelected = actionableRequests.length > 0 && selectedIds.size === actionableRequests.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < actionableRequests.length;
  const selectedRequests = actionableRequests.filter(r => selectedIds.has(r.Id));

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(actionableRequests.map(r => r.Id)));
    }
  }, [isAllSelected, actionableRequests]);

  const handleSelectOne = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

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

  const handleAdvanceStage = (request: ServiceRequest) => {
    if (!user) return;

    const nextStage = getNextStage(request.FunnelStage);
    if (!nextStage) return;

    // Confirm Won transition
    if (nextStage === 'Won') {
      setConfirmWon(request);
      return;
    }

    executeAdvanceStage(request, nextStage);
  };

  const executeAdvanceStage = async (request: ServiceRequest, nextStage: FunnelStage) => {
    if (!user) return;

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

  const handleConfirmWon = async () => {
    if (!confirmWon) return;
    setConfirmLoading(true);
    await executeAdvanceStage(confirmWon, 'Won');
    setConfirmLoading(false);
    setConfirmWon(null);
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

  // Bulk operation: Advance stage for all selected
  const handleBulkAdvanceStage = async (targetStage: FunnelStage) => {
    if (!user || selectedRequests.length === 0) return;

    // For Won/Lost, show confirmation first
    if (targetStage === 'Won') {
      setConfirmBulkWon(true);
      return;
    }
    if (targetStage === 'Lost') {
      setConfirmBulkLost(true);
      return;
    }

    await executeBulkAdvance(targetStage);
  };

  const executeBulkAdvance = async (targetStage: FunnelStage) => {
    if (!user) return;

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const request of selectedRequests) {
      try {
        const result = await serviceRequestService.updateStage(
          request.Id,
          targetStage,
          user.email,
          user.displayName
        );

        if (result.success && result.request) {
          onRequestUpdated(result.request);
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Error advancing ${request.Id}:`, err);
        failCount++;
      }
    }

    if (successCount > 0) {
      showToast(`${successCount} request(s) moved to ${targetStage}`, 'success');
    }
    if (failCount > 0) {
      showToast(`${failCount} request(s) failed to update`, 'error');
    }

    clearSelection();
    setBulkProcessing(false);
  };

  const handleConfirmBulkWon = async () => {
    setConfirmBulkWon(false);
    await executeBulkAdvance('Won');
  };

  const handleConfirmBulkLost = async () => {
    setConfirmBulkLost(false);
    await executeBulkAdvance('Lost');
  };

  // Bulk operation: Assign specialist to all selected
  const handleBulkAssignSpecialist = async () => {
    if (!user || !bulkSpecialist || selectedRequests.length === 0) return;

    const specialist = specialists.find(s => s.Email === bulkSpecialist);
    if (!specialist) return;

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const request of selectedRequests) {
      // Skip if already has same specialist
      if (request.AssignedSpecialistEmail === specialist.Email) {
        continue;
      }

      try {
        const result = await serviceRequestService.assignSpecialist(
          request.Id,
          specialist,
          user.email,
          user.displayName
        );

        if (result.success && result.request) {
          onRequestUpdated(result.request);
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.error(`Error assigning specialist to ${request.Id}:`, err);
        failCount++;
      }
    }

    if (successCount > 0) {
      showToast(`${specialist.Title} assigned to ${successCount} request(s)`, 'success');
    }
    if (failCount > 0) {
      showToast(`${failCount} request(s) failed to update`, 'error');
    }

    clearSelection();
    setBulkSpecialist('');
    setBulkProcessing(false);
  };

  // Get common next stage for bulk operations (if all selected are at same stage)
  const getBulkNextStage = (): FunnelStage | null => {
    if (selectedRequests.length === 0) return null;
    const stages = new Set(selectedRequests.map(r => r.FunnelStage));
    if (stages.size !== 1) return null; // Mixed stages
    const currentStage = selectedRequests[0].FunnelStage;
    return getNextStage(currentStage);
  };

  const bulkNextStage = getBulkNextStage();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {actionableRequests.length > 0 && (
            <Tooltip content={isAllSelected ? 'Deselect all' : 'Select all'} relationship="label">
              <Checkbox
                className={styles.selectAllCheckbox}
                checked={isAllSelected ? true : isSomeSelected ? 'mixed' : false}
                onChange={() => handleSelectAll()}
                aria-label={isAllSelected ? 'Deselect all requests' : 'Select all requests'}
              />
            </Tooltip>
          )}
          <Text className={styles.title}>Action Queue</Text>
          {actionableRequests.length > 0 && (
            <span className={styles.badge}>{actionableRequests.length}</span>
          )}
        </div>
        {selectedIds.size > 0 && (
          <Button
            appearance="subtle"
            size="small"
            icon={<DismissCircleRegular />}
            onClick={clearSelection}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className={styles.bulkToolbar}>
          <Text className={styles.bulkToolbarText}>
            {selectedIds.size} request{selectedIds.size !== 1 ? 's' : ''} selected
          </Text>
          <div className={styles.bulkActions}>
            {bulkProcessing ? (
              <Spinner size="tiny" label="Processing..." />
            ) : (
              <>
                {/* Bulk Specialist Assignment */}
                <Dropdown
                  className={styles.bulkDropdown}
                  placeholder="Assign specialist..."
                  selectedOptions={bulkSpecialist ? [bulkSpecialist] : []}
                  onOptionSelect={(_, data) => setBulkSpecialist(data.optionValue as string)}
                  disabled={loadingSpecialists}
                >
                  {specialists.map((s) => (
                    <Option key={s.Email} value={s.Email} text={s.Title}>
                      {s.Title}
                    </Option>
                  ))}
                </Dropdown>
                {bulkSpecialist && (
                  <Button
                    appearance="secondary"
                    icon={<PersonRegular />}
                    onClick={handleBulkAssignSpecialist}
                    size="small"
                  >
                    Assign
                  </Button>
                )}

                {/* Bulk Stage Advance (only if all same stage) */}
                {bulkNextStage && bulkNextStage !== 'Won' && (
                  <Button
                    appearance="primary"
                    icon={<ArrowForwardRegular />}
                    onClick={() => handleBulkAdvanceStage(bulkNextStage)}
                    size="small"
                    style={{ backgroundColor: '#1e6b7b' }}
                  >
                    → {bulkNextStage}
                  </Button>
                )}

                {/* Bulk Mark Won */}
                <Tooltip content="Mark all selected as Won" relationship="label">
                  <Button
                    appearance="secondary"
                    icon={<CheckmarkRegular />}
                    onClick={() => handleBulkAdvanceStage('Won')}
                    size="small"
                    style={{ color: '#107c10' }}
                  >
                    Won
                  </Button>
                </Tooltip>

                {/* Bulk Mark Lost */}
                <Tooltip content="Mark all selected as Lost" relationship="label">
                  <Button
                    appearance="secondary"
                    icon={<DismissRegular />}
                    onClick={() => handleBulkAdvanceStage('Lost')}
                    size="small"
                    style={{ color: '#d13438' }}
                  >
                    Lost
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      )}

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
            const isSelected = selectedIds.has(request.Id);

            return (
              <div
                key={request.Id}
                className={styles.requestItem}
                style={isSelected ? { backgroundColor: 'rgba(30, 107, 123, 0.05)' } : undefined}
              >
                <div className={styles.requestItemWithCheckbox}>
                  <Checkbox
                    className={styles.requestCheckbox}
                    checked={isSelected}
                    onChange={(_, data) => handleSelectOne(request.Id, data.checked === true)}
                    aria-label={`Select ${request.ClientName} - ${request.ServiceName}`}
                  />
                  <div className={styles.requestContent}>
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
                              <Option key={s.Email} value={s.Email} text={`${s.Title} (${s.Role})`}>
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
                          <Option value={request.ProposedSlot1} text={format(new Date(request.ProposedSlot1), 'MMM d @ h:mm a')}>
                            {format(new Date(request.ProposedSlot1), 'MMM d @ h:mm a')}
                          </Option>
                          {request.ProposedSlot2 && (
                            <Option value={request.ProposedSlot2} text={format(new Date(request.ProposedSlot2), 'MMM d @ h:mm a')}>
                              {format(new Date(request.ProposedSlot2), 'MMM d @ h:mm a')}
                            </Option>
                          )}
                          {request.ProposedSlot3 && (
                            <Option value={request.ProposedSlot3} text={format(new Date(request.ProposedSlot3), 'MMM d @ h:mm a')}>
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
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Won Confirmation */}
      <ConfirmDialog
        open={!!confirmWon}
        title="Mark as Won"
        message={
          confirmWon
            ? `Are you sure you want to mark "${confirmWon.ClientName} — ${confirmWon.ServiceName}" as Won? This will update the client lifetime value and close the deal.`
            : ''
        }
        confirmLabel="Mark as Won"
        onConfirm={handleConfirmWon}
        onCancel={() => setConfirmWon(null)}
        isLoading={confirmLoading}
      />

      {/* Bulk Won Confirmation */}
      <ConfirmDialog
        open={confirmBulkWon}
        title="Mark All as Won"
        message={`Are you sure you want to mark ${selectedRequests.length} request(s) as Won? This will update client lifetime values and close these deals.`}
        confirmLabel={`Mark ${selectedRequests.length} as Won`}
        onConfirm={handleConfirmBulkWon}
        onCancel={() => setConfirmBulkWon(false)}
        isLoading={bulkProcessing}
      />

      {/* Bulk Lost Confirmation */}
      <ConfirmDialog
        open={confirmBulkLost}
        title="Mark All as Lost"
        message={`Are you sure you want to mark ${selectedRequests.length} request(s) as Lost? This action cannot be undone.`}
        confirmLabel={`Mark ${selectedRequests.length} as Lost`}
        onConfirm={handleConfirmBulkLost}
        onCancel={() => setConfirmBulkLost(false)}
        isLoading={bulkProcessing}
        intent="danger"
      />
    </div>
  );
};
