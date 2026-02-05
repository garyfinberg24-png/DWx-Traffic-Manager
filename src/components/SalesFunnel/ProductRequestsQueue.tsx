/**
 * DWx Traffic Manager - Product Requests Queue
 * Manager view for approving/managing product demo and trial requests
 */

import React, { useState } from 'react';
import {
  Text,
  Button,
  makeStyles,
  Spinner,
  Dropdown,
  Option,
  Badge,
} from '@fluentui/react-components';
import {
  PersonRegular,
  CheckmarkRegular,
  DismissRegular,
  ArrowRightRegular,
  CalendarRegular,
  BoxRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ProductRequest, ProductRequestStatus } from '../../types/ProductRequest';
import { Specialist } from '../../types/ServiceRequest';
import { productRequestService } from '../../services/ProductRequestService';
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
  productName: {
    fontSize: '13px',
    color: '#616161',
  },
  statusBadge: {
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
  approveButton: {
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
  rejectButton: {
    backgroundColor: '#d13438',
    ':hover': {
      backgroundColor: '#a4262c',
    },
  },
  typeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
  },
});

// Status colors
const statusColors: Record<ProductRequestStatus, { bg: string; text: string }> = {
  'Pending Review': { bg: 'rgba(107, 114, 128, 0.15)', text: '#4B5563' },
  'Awaiting Approval': { bg: 'rgba(245, 158, 11, 0.15)', text: '#B45309' },
  'Confirmed': { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669' },
  'Completed': { bg: 'rgba(59, 130, 246, 0.15)', text: '#2563EB' },
  'Cancelled': { bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626' },
};

// Allowed status transitions from the queue
const STATUS_TRANSITIONS: Record<ProductRequestStatus, ProductRequestStatus[]> = {
  'Pending Review': ['Awaiting Approval', 'Cancelled'],
  'Awaiting Approval': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Completed', 'Cancelled'],
  'Completed': [],
  'Cancelled': [],
};

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

  // Filter to actionable requests (not Completed/Cancelled)
  const actionableRequests = requests.filter(
    (r) => r.Status !== 'Completed' && r.Status !== 'Cancelled'
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text className={styles.title}>Product Request Queue</Text>
          {actionableRequests.length > 0 && (
            <span className={styles.badge}>{actionableRequests.length}</span>
          )}
        </div>
      </div>
      <div className={styles.content}>
        {actionableRequests.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>No product requests requiring action</Text>
          </div>
        ) : (
          actionableRequests.map((request) => {
            const statusColor = statusColors[request.Status];
            const isProcessing = processingId === request.Id;
            const needsSpecialist = !request.AssignedSpecialistEmail;
            const transitions = STATUS_TRANSITIONS[request.Status];
            const canConfirmDemo =
              request.Status === 'Awaiting Approval' &&
              request.AssignedSpecialistEmail &&
              !request.ConfirmedDateTime;

            return (
              <div key={request.Id} className={styles.requestItem}>
                {/* Header row: client + status */}
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

                {/* Meta row: AM, type, value, premium */}
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

                {/* Actions row */}
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
                            placeholder="Assign specialist..."
                            selectedOptions={
                              selectedSpecialists[request.Id]
                                ? [selectedSpecialists[request.Id]]
                                : []
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

                      {/* Confirm Demo/Trial slot */}
                      {canConfirmDemo && (
                        <Dropdown
                          placeholder="Confirm slot..."
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

                      {/* Status advancement buttons */}
                      {transitions.map((nextStatus) => {
                        // Skip Confirmed if we can confirm demo (handled by slot dropdown above)
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
                          >
                            {nextStatus === 'Awaiting Approval' ? 'Approve' : `→ ${nextStatus}`}
                          </Button>
                        );
                      })}
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
