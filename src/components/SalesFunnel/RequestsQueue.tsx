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
  Dialog,
  DialogSurface,
  DialogActions,
} from '@fluentui/react-components';
import {
  PersonRegular,
  MoneyRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  DismissRegular,
  ArrowForwardRegular,
  DismissCircleRegular,
  Trophy24Regular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';
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
import { Pagination, usePagination } from '../Common/Pagination';
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
    backgroundColor: DW_COLORS.danger,
    color: 'white',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '10px',
    marginLeft: '8px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px 16px',
    maxHeight: '500px',
    overflowY: 'auto',
  },
  emptyState: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#616161',
  },
  requestItem: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    borderLeft: '4px solid transparent',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'all 0.15s ease',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #d1d5db',
      borderLeft: '4px solid transparent',
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
    gap: '3px',
    minWidth: 0,
  },
  clientName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  serviceName: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stageBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    flexShrink: 0,
    letterSpacing: '0.1px',
  },
  requestMeta: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#6b7280',
    padding: '2px 8px',
    borderRadius: '6px',
    backgroundColor: '#f3f4f6',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  actionsSpacer: {
    flex: 1,
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    flexShrink: 0,
  },
  specialistDropdown: {
    minWidth: '220px',
  },
  slotDropdown: {
    minWidth: '220px',
  },
  advanceButton: {
    backgroundColor: DW_COLORS.teal,
    ':hover': {
      backgroundColor: '#165a68',
    },
  },
  confirmButton: {
    backgroundColor: DW_COLORS.success,
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  interestBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: '2px 8px',
    borderRadius: '6px',
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
  // Won dialog styles
  wonSurface: {
    maxWidth: '440px',
    width: '100%',
    overflow: 'hidden',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
  },
  wonHeader: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundImage: 'linear-gradient(135deg, #107c10 0%, #14a114 100%)',
    color: 'white',
  },
  wonHeaderIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wonHeaderContent: {
    flex: 1,
    minWidth: 0,
  },
  wonHeaderTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    display: 'block',
  },
  wonHeaderSubtitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    display: 'block',
    lineHeight: '1.3',
  },
  wonBody: {
    padding: '16px 20px',
  },
  wonActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '12px 20px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fafafa',
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
  /** Open the full details modal for a request */
  onRequestClick?: (request: ServiceRequest) => void;
}

export const RequestsQueue: React.FC<RequestsQueueProps> = ({
  requests,
  onRequestUpdated,
  onRequestClick,
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

  // Pagination
  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedRequests,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(actionableRequests, 20);

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
    if (!user || bulkProcessing) return;

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
    if (!user || !bulkSpecialist || selectedRequests.length === 0 || bulkProcessing) return;

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
          <Text className={styles.title}>Service Queue</Text>
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
                  size="small"
                  selectedOptions={bulkSpecialist ? [bulkSpecialist] : []}
                  value={bulkSpecialist ? specialists.find(s => s.Email === bulkSpecialist)?.Title || '' : ''}
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
                    style={{ backgroundColor: DW_COLORS.teal }}
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
          paginatedRequests.map((request) => {
            const stageColor = stageColors[request.FunnelStage];
            const isProcessing = processingId === request.Id;
            const nextStage = getNextStage(request.FunnelStage);
            const needsSpecialist = !request.AssignedSpecialistEmail && request.FunnelStage !== 'Lead';
            const isSelected = selectedIds.has(request.Id);

            return (
              <div
                key={request.Id}
                className={styles.requestItem}
                style={{
                  borderLeftColor: stageColor.text,
                  ...(isSelected ? { backgroundColor: 'rgba(30, 107, 123, 0.05)' } : {}),
                }}
              >
                <div className={styles.requestItemWithCheckbox}>
                  <Checkbox
                    className={styles.requestCheckbox}
                    checked={isSelected}
                    onChange={(_, data) => handleSelectOne(request.Id, data.checked === true)}
                    aria-label={`Select ${request.ClientName} - ${request.ServiceName}`}
                  />
                  <div
                    className={styles.requestContent}
                    onClick={() => onRequestClick?.(request)}
                    style={onRequestClick ? { cursor: 'pointer' } : undefined}
                    role={onRequestClick ? 'button' : undefined}
                    tabIndex={onRequestClick ? 0 : undefined}
                    onKeyDown={onRequestClick ? (e) => { if (e.key === 'Enter') onRequestClick(request); } : undefined}
                  >
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

                    {/* Row 2: Meta pills */}
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
                        {request.InterestLevel}
                      </span>
                      {request.AssignedSpecialistName && (
                        <span className={styles.metaItem}>
                          <PersonRegular style={{ width: '14px', height: '14px' }} />
                          {request.AssignedSpecialistName}
                        </span>
                      )}
                    </div>

                    {/* Row 3: Dropdowns (left) + action buttons (right) */}
                    {!isProcessing ? (
                      <div className={styles.actionsRow}>
                        {needsSpecialist && (
                          <Dropdown
                            className={styles.specialistDropdown}
                            placeholder="Assign specialist..."
                            size="small"
                            selectedOptions={
                              selectedSpecialists[request.Id]
                                ? [selectedSpecialists[request.Id]]
                                : []
                            }
                            value={
                              selectedSpecialists[request.Id]
                                ? specialists.find(s => s.Email === selectedSpecialists[request.Id])?.Title || ''
                                : ''
                            }
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
                                {s.Title} ({s.Role}) — {s.CurrentDealCount}/{s.MaxConcurrentDeals}
                              </Option>
                            ))}
                          </Dropdown>
                        )}

                        {needsSpecialist && (
                          <Button
                            appearance="secondary"
                            icon={<PersonRegular />}
                            onClick={() => handleAssignSpecialist(request)}
                            disabled={!selectedSpecialists[request.Id]}
                            size="small"
                          >
                            Assign
                          </Button>
                        )}

                        {/* Confirm Meeting (for Discovery stage — only if valid proposed slots exist) */}
                        {request.FunnelStage === 'Discovery' && !request.ConfirmedDateTime && request.ProposedSlot1 && !isNaN(new Date(request.ProposedSlot1).getTime()) && (
                          <Dropdown
                            className={styles.slotDropdown}
                            placeholder="Confirm slot..."
                            size="small"
                            selectedOptions={[]}
                            value=""
                            onOptionSelect={(_, data) =>
                              handleConfirmMeeting(request, data.optionValue as string)
                            }
                          >
                            <Option value={request.ProposedSlot1} text={format(new Date(request.ProposedSlot1), 'MMM d @ h:mm a')}>
                              {format(new Date(request.ProposedSlot1), 'MMM d @ h:mm a')}
                            </Option>
                            {request.ProposedSlot2 && !isNaN(new Date(request.ProposedSlot2).getTime()) && (
                              <Option value={request.ProposedSlot2} text={format(new Date(request.ProposedSlot2), 'MMM d @ h:mm a')}>
                                {format(new Date(request.ProposedSlot2), 'MMM d @ h:mm a')}
                              </Option>
                            )}
                            {request.ProposedSlot3 && !isNaN(new Date(request.ProposedSlot3).getTime()) && (
                              <Option value={request.ProposedSlot3} text={format(new Date(request.ProposedSlot3), 'MMM d @ h:mm a')}>
                                {format(new Date(request.ProposedSlot3), 'MMM d @ h:mm a')}
                              </Option>
                            )}
                          </Dropdown>
                        )}

                        {/* Spacer pushes buttons to right */}
                        <div className={styles.actionsSpacer} />

                        {/* Action buttons */}
                        <div className={styles.actionButtons}>
                          {nextStage && (
                            <Button
                              className={styles.advanceButton}
                              appearance="primary"
                              icon={<ArrowRightRegular />}
                              onClick={() => handleAdvanceStage(request)}
                              size="small"
                            >
                              {nextStage === 'Won' ? 'Mark Won' : `→ ${nextStage}`}
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Spinner size="tiny" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalItems > 20 && (
        <div style={{ padding: '0 16px 12px' }}>
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Won Confirmation */}
      <Dialog open={!!confirmWon} onOpenChange={(_, data) => { if (!data.open) setConfirmWon(null); }}>
        <DialogSurface className={styles.wonSurface} style={{ padding: 0 }}>
          <div className={styles.wonHeader}>
            <div className={styles.wonHeaderIcon}>
              <Trophy24Regular style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div className={styles.wonHeaderContent}>
              <Text className={styles.wonHeaderTitle}>Close Deal</Text>
              <Text className={styles.wonHeaderSubtitle}>Mark as Won</Text>
            </div>
          </div>
          <div className={styles.wonBody}>
            <Text style={{ fontSize: '13px', color: '#323130', lineHeight: '1.5' }}>
              {confirmWon
                ? `Are you sure you want to mark "${confirmWon.ClientName} \u2014 ${confirmWon.ServiceName}" as Won? This will update the client lifetime value and close the deal.`
                : ''}
            </Text>
          </div>
          <DialogActions className={styles.wonActions}>
            <Button appearance="secondary" onClick={() => setConfirmWon(null)} disabled={confirmLoading}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              icon={<Trophy24Regular />}
              onClick={handleConfirmWon}
              disabled={confirmLoading}
              style={{ backgroundColor: '#107c10', whiteSpace: 'nowrap' }}
            >
              {confirmLoading ? 'Processing...' : 'Mark as Won'}
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

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
