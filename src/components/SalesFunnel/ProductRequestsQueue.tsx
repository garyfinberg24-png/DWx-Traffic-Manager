/**
 * DWx Traffic Manager - Product Requests Queue
 * Manager view for approving/managing product demo and trial requests with bulk operations
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Text,
  Button,
  makeStyles,
  Spinner,
  Dropdown,
  Option,
  Badge,
  Checkbox,
  Tooltip,
} from '@fluentui/react-components';
import {
  PersonRegular,
  CheckmarkRegular,
  DismissRegular,
  ArrowRightRegular,
  CalendarRegular,
  BoxRegular,
  DismissCircleRegular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ProductRequest, ProductRequestStatus, PRODUCT_STATUS_TRANSITIONS } from '../../types/ProductRequest';
import { Specialist } from '../../types/ServiceRequest';
import { productRequestService } from '../../services/ProductRequestService';
import { specialistService } from '../../services/SpecialistService';
import { Pagination, usePagination } from '../Common/Pagination';
import { format } from 'date-fns';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  header: {
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#10b981',
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
    gap: '12px',
    padding: '0 16px 16px',
    maxHeight: '600px',
    overflowY: 'auto',
  },
  emptyState: {
    padding: '48px 20px',
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: '13px',
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
    gap: '12px',
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
  productName: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  statusBadge: {
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
  approveButton: {
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
  rejectButton: {
    backgroundColor: DW_COLORS.danger,
    ':hover': {
      backgroundColor: '#a4262c',
    },
  },
  typeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
  },
  // Bulk selection styles
  bulkToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    margin: '0 16px 12px',
    backgroundColor: 'rgba(30, 107, 123, 0.06)',
    border: '1px solid rgba(30, 107, 123, 0.2)',
    borderRadius: '10px',
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

// Status colors with accent border
const statusColors: Record<ProductRequestStatus, { bg: string; text: string; accent: string }> = {
  'Pending Review': { bg: '#f3f4f6', text: '#4B5563', accent: '#9ca3af' },
  'Awaiting Approval': { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
  'Confirmed': { bg: '#d1fae5', text: '#065f46', accent: '#10b981' },
  'Completed': { bg: '#dbeafe', text: '#1e40af', accent: '#3b82f6' },
  'Cancelled': { bg: '#fee2e2', text: '#991b1b', accent: '#ef4444' },
};

// Use shared status transitions from types
const STATUS_TRANSITIONS = PRODUCT_STATUS_TRANSITIONS;

interface ProductRequestsQueueProps {
  requests: ProductRequest[];
  onRequestUpdated: (request: ProductRequest) => void;
}

export const ProductRequestsQueue: React.FC<ProductRequestsQueueProps> = ({
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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkSpecialist, setBulkSpecialist] = useState<string>('');

  // Filter to actionable requests (not Completed/Cancelled)
  const actionableRequests = requests.filter(
    (r) => r.Status !== 'Completed' && r.Status !== 'Cancelled'
  );

  // Clean up stale selections when actionable list changes
  useEffect(() => {
    if (selectedIds.size === 0) return;
    const actionableIds = new Set(actionableRequests.map(r => r.Id));
    setSelectedIds(prev => {
      const cleaned = new Set(Array.from(prev).filter(id => actionableIds.has(id)));
      return cleaned.size === prev.size ? prev : cleaned;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionableRequests.length]);

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

  const handleAdvanceStatus = async (request: ProductRequest, newStatus: ProductRequestStatus) => {
    if (!user) return;

    try {
      setProcessingId(request.Id);
      const result = await productRequestService.updateStatus(
        request.Id,
        newStatus,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showToast(`Product request status updated to ${newStatus}`, 'success');
        onRequestUpdated(result.request);
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating product request status:', err);
      showToast('Failed to update product request status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAssignSpecialist = async (request: ProductRequest) => {
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
      const result = await productRequestService.assignSpecialist(
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

  const handleConfirmDemo = async (request: ProductRequest, slot: string) => {
    if (!user) return;

    try {
      setProcessingId(request.Id);
      const result = await productRequestService.confirmProductDemo(
        request.Id,
        slot,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        const typeLabel = request.RequestType === 'Demo' ? 'Demo' : 'Trial deployment';
        showToast(`${typeLabel} confirmed and calendar invite sent`, 'success');
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach((w) => showToast(w, 'warning'));
        }
        onRequestUpdated(result.request);
      } else {
        throw new Error(result.error || 'Failed to confirm demo');
      }
    } catch (err) {
      console.error('Error confirming product demo:', err);
      showToast('Failed to confirm demo', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Bulk operation: Update status for all selected
  const handleBulkStatusChange = async (newStatus: ProductRequestStatus) => {
    if (!user || selectedRequests.length === 0) return;

    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const request of selectedRequests) {
      // Check if transition is allowed
      const allowedTransitions = STATUS_TRANSITIONS[request.Status];
      if (!allowedTransitions.includes(newStatus)) {
        failCount++;
        continue;
      }

      try {
        const result = await productRequestService.updateStatus(
          request.Id,
          newStatus,
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
        console.error(`Error updating ${request.Id}:`, err);
        failCount++;
      }
    }

    if (successCount > 0) {
      showToast(`${successCount} request(s) updated to ${newStatus}`, 'success');
    }
    if (failCount > 0) {
      showToast(`${failCount} request(s) failed or skipped (invalid transition)`, 'error');
    }

    clearSelection();
    setBulkProcessing(false);
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
        const result = await productRequestService.assignSpecialist(
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
          <Text className={styles.title}>Product Request Queue</Text>
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

                {/* Bulk Status Transitions */}
                <Tooltip content="Advance to Awaiting Approval" relationship="label">
                  <Button
                    appearance="primary"
                    icon={<ArrowRightRegular />}
                    onClick={() => handleBulkStatusChange('Awaiting Approval')}
                    size="small"
                    style={{ backgroundColor: DW_COLORS.teal }}
                  >
                    Approve
                  </Button>
                </Tooltip>

                <Tooltip content="Mark all selected as Completed" relationship="label">
                  <Button
                    appearance="secondary"
                    icon={<CheckmarkRegular />}
                    onClick={() => handleBulkStatusChange('Completed')}
                    size="small"
                    style={{ color: '#107c10' }}
                  >
                    Complete
                  </Button>
                </Tooltip>

                <Tooltip content="Cancel all selected requests" relationship="label">
                  <Button
                    appearance="secondary"
                    icon={<DismissRegular />}
                    onClick={() => handleBulkStatusChange('Cancelled')}
                    size="small"
                    style={{ color: '#d13438' }}
                  >
                    Cancel
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
            <Text>No product requests requiring action</Text>
          </div>
        ) : (
          paginatedRequests.map((request) => {
            const statusColor = statusColors[request.Status];
            const isProcessing = processingId === request.Id;
            const needsSpecialist = !request.AssignedSpecialistEmail;
            const transitions = STATUS_TRANSITIONS[request.Status];
            const canConfirmDemo =
              request.Status === 'Awaiting Approval' &&
              request.AssignedSpecialistEmail &&
              !request.ConfirmedDateTime;
            const isSelected = selectedIds.has(request.Id);

            return (
              <div
                key={request.Id}
                className={styles.requestItem}
                style={{
                  borderLeftColor: statusColor.accent,
                  ...(isSelected ? { backgroundColor: 'rgba(30, 107, 123, 0.04)', borderColor: 'rgba(30, 107, 123, 0.2)' } : {}),
                }}
              >
                <div className={styles.requestItemWithCheckbox}>
                  <Checkbox
                    className={styles.requestCheckbox}
                    checked={isSelected}
                    onChange={(_, data) => handleSelectOne(request.Id, data.checked === true)}
                    aria-label={`Select ${request.ClientName} - ${request.ProductName}`}
                  />
                  <div className={styles.requestContent}>
                    {/* Row 1: Client name + status badge */}
                    <div className={styles.requestHeader}>
                      <div className={styles.requestInfo}>
                        <Text className={styles.clientName}>{request.ClientName}</Text>
                        <Text className={styles.productName}>
                          {request.ProductName} ({request.ProductType})
                        </Text>
                      </div>
                      <span
                        className={styles.statusBadge}
                        style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      >
                        {request.Status}
                      </span>
                    </div>

                    {/* Row 2: Meta pills */}
                    <div className={styles.requestMeta}>
                      <span className={styles.metaItem}>
                        <PersonRegular style={{ width: '14px', height: '14px' }} />
                        {request.AccountManagerName}
                      </span>
                      <span
                        className={styles.typeBadge}
                        style={{
                          backgroundColor: request.RequestType === 'Demo'
                            ? 'rgba(139, 92, 246, 0.1)'
                            : 'rgba(59, 130, 246, 0.1)',
                          color: request.RequestType === 'Demo' ? '#7C3AED' : '#2563EB',
                        }}
                      >
                        <BoxRegular style={{ width: '12px', height: '12px' }} />
                        {request.RequestType}
                      </span>
                      {request.EstimatedValue && (
                        <span className={styles.metaItem}>
                          {formatCurrency(request.EstimatedValue)}
                        </span>
                      )}
                      {request.IsPremiumClient && (
                        <Badge appearance="filled" color="warning" size="small">
                          Premium
                        </Badge>
                      )}
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
                              <Option
                                key={s.Email}
                                value={s.Email}
                                text={`${s.Title} (${s.Role})`}
                              >
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

                        {canConfirmDemo && (
                          <Dropdown
                            className={styles.slotDropdown}
                            placeholder="Confirm slot..."
                            size="small"
                            selectedOptions={[]}
                            value=""
                            onOptionSelect={(_, data) =>
                              handleConfirmDemo(request, data.optionValue as string)
                            }
                          >
                            {request.ProposedSlot1 && (
                              <Option
                                value={request.ProposedSlot1}
                                text={format(new Date(request.ProposedSlot1), 'MMM d @ h:mm a')}
                              >
                                <CalendarRegular style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {format(new Date(request.ProposedSlot1), 'MMM d @ h:mm a')}
                              </Option>
                            )}
                            {request.ProposedSlot2 && (
                              <Option
                                value={request.ProposedSlot2}
                                text={format(new Date(request.ProposedSlot2), 'MMM d @ h:mm a')}
                              >
                                <CalendarRegular style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {format(new Date(request.ProposedSlot2), 'MMM d @ h:mm a')}
                              </Option>
                            )}
                            {request.ProposedSlot3 && (
                              <Option
                                value={request.ProposedSlot3}
                                text={format(new Date(request.ProposedSlot3), 'MMM d @ h:mm a')}
                              >
                                <CalendarRegular style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                                {format(new Date(request.ProposedSlot3), 'MMM d @ h:mm a')}
                              </Option>
                            )}
                          </Dropdown>
                        )}

                        {/* Spacer pushes buttons to right */}
                        <div className={styles.actionsSpacer} />

                        {/* Action buttons */}
                        <div className={styles.actionButtons}>
                          {transitions.map((nextStatus) => {
                            if (nextStatus === 'Confirmed' && canConfirmDemo) return null;

                            if (nextStatus === 'Cancelled') {
                              return (
                                <Button
                                  key={nextStatus}
                                  className={styles.rejectButton}
                                  appearance="primary"
                                  icon={<DismissRegular />}
                                  onClick={() => handleAdvanceStatus(request, nextStatus)}
                                  size="small"
                                >
                                  Cancel
                                </Button>
                              );
                            }

                            if (nextStatus === 'Completed') {
                              return (
                                <Button
                                  key={nextStatus}
                                  className={styles.confirmButton}
                                  appearance="primary"
                                  icon={<CheckmarkRegular />}
                                  onClick={() => handleAdvanceStatus(request, nextStatus)}
                                  size="small"
                                >
                                  Complete
                                </Button>
                              );
                            }

                            return (
                              <Button
                                key={nextStatus}
                                className={styles.approveButton}
                                appearance="primary"
                                icon={<ArrowRightRegular />}
                                onClick={() => handleAdvanceStatus(request, nextStatus)}
                                size="small"
                              >
                                {nextStatus === 'Awaiting Approval' ? 'Approve' : nextStatus}
                              </Button>
                            );
                          })}
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
    </div>
  );
};
