/**
 * DWx Traffic Manager - Product Request Details Modal
 * Full product request details with status actions, specialist assignment, and demo confirmation
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Text,
  Button,
  makeStyles,
  Spinner,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  CalendarLtr24Regular,
  PersonRegular,
  MailRegular,
  PhoneRegular,
  BuildingRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  DismissRegular,
  ClockRegular,
  DocumentRegular,
  ChatRegular,
  BoxRegular,
  AppGenericRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ProductRequest, ProductRequestStatus } from '../../types/ProductRequest';
import { Specialist } from '../../types/ServiceRequest';
import { productRequestService } from '../../services/ProductRequestService';
import { specialistService } from '../../services/SpecialistService';
import { format } from 'date-fns';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '640px',
    width: '90vw',
    maxHeight: '90vh',
    padding: '0',
    borderRadius: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#1a5a8a',
    color: 'white',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    marginBottom: '2px',
  },
  subtitle: {
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  closeButton: {
    minWidth: '36px',
    height: '36px',
    padding: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
  },
  content: {
    padding: '0',
    overflowY: 'auto',
    maxHeight: '55vh',
  },
  section: {
    padding: '20px 24px',
    borderBottom: '1px solid #e8e8e8',
  },
  sectionLast: {
    padding: '20px 24px',
    borderBottom: 'none',
  },
  sectionHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#1a5a8a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '12px',
    borderLeft: '3px solid #1a5a8a',
    paddingLeft: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
    whiteSpace: 'pre-wrap',
  },
  statusActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  advanceButton: {
    backgroundColor: '#1a5a8a',
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
  confirmButton: {
    backgroundColor: '#107c10',
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  cancelStatusButton: {
    backgroundColor: '#d13438',
    ':hover': {
      backgroundColor: '#a52a2d',
    },
  },
  completeButton: {
    backgroundColor: '#107c10',
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  specialistCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#e8f4fc',
    borderRadius: '8px',
    border: '1px solid #cce4f0',
  },
  specialistIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#1a5a8a',
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
  assignRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    alignItems: 'center',
  },
  specialistDropdown: {
    minWidth: '220px',
    flex: 1,
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
  confirmSlotRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    alignItems: 'center',
  },
  metaBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: 'rgba(30, 107, 123, 0.1)',
    color: '#1e6b7b',
  },
  premiumBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: 'rgba(247, 99, 12, 0.1)',
    color: '#f7630c',
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
  cancelButton: {
    minWidth: '80px',
  },
  submitButton: {
    backgroundColor: '#1a5a8a',
    color: 'white',
    fontWeight: '600',
    minWidth: '100px',
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
});

// Status workflow transitions
const STATUS_TRANSITIONS: Record<ProductRequestStatus, ProductRequestStatus[]> = {
  'Pending Review': ['Awaiting Approval', 'Cancelled'],
  'Awaiting Approval': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Completed', 'Cancelled'],
  'Completed': [],
  'Cancelled': [],
};

interface ProductRequestDetailsProps {
  request: ProductRequest;
  isOpen: boolean;
  onClose: () => void;
  onRequestUpdated?: (request: ProductRequest) => void;
  isManager?: boolean;
}

export const ProductRequestDetails: React.FC<ProductRequestDetailsProps> = ({
  request,
  isOpen,
  onClose,
  onRequestUpdated,
  isManager = false,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [updating, setUpdating] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const [selectedSpecialistEmail, setSelectedSpecialistEmail] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const availableTransitions = STATUS_TRANSITIONS[request.Status] || [];
  const isTerminal = request.Status === 'Completed' || request.Status === 'Cancelled';

  // Load specialists when modal opens and specialist not yet assigned
  useEffect(() => {
    if (isOpen && isManager && !loadingSpecialists && specialists.length === 0) {
      const load = async () => {
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
      load();
    }
  }, [isOpen, isManager]);

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

  const handleStatusChange = async (newStatus: ProductRequestStatus) => {
    if (!user) return;

    try {
      setUpdating(true);
      const result = await productRequestService.updateStatus(
        request.Id,
        newStatus,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showToast(`Status updated to ${newStatus}`, 'success');
        onRequestUpdated?.(result.request);
      } else {
        throw new Error(result.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignSpecialist = async () => {
    if (!user || !selectedSpecialistEmail) return;

    const specialist = specialists.find((s) => s.Email === selectedSpecialistEmail);
    if (!specialist) return;

    try {
      setUpdating(true);
      const result = await productRequestService.assignSpecialist(
        request.Id,
        specialist,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showToast(`Specialist ${specialist.Title} assigned`, 'success');
        setSelectedSpecialistEmail('');
        onRequestUpdated?.(result.request);
      } else {
        throw new Error(result.error || 'Failed to assign specialist');
      }
    } catch (err) {
      console.error('Error assigning specialist:', err);
      showToast('Failed to assign specialist', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDemo = async () => {
    if (!user || !selectedSlot) return;

    try {
      setUpdating(true);
      const result = await productRequestService.confirmProductDemo(
        request.Id,
        selectedSlot,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        const msg = result.warnings?.length
          ? `Demo confirmed (${result.warnings.join(', ')})`
          : 'Demo confirmed and calendar invite sent';
        showToast(msg, result.warnings?.length ? 'warning' : 'success');
        setSelectedSlot('');
        onRequestUpdated?.(result.request);
      } else {
        throw new Error(result.error || 'Failed to confirm demo');
      }
    } catch (err) {
      console.error('Error confirming demo:', err);
      showToast('Failed to confirm demo', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusActionButton = (status: ProductRequestStatus) => {
    if (status === 'Cancelled') {
      return (
        <Button
          key={status}
          className={styles.cancelStatusButton}
          appearance="primary"
          icon={<DismissRegular />}
          onClick={() => handleStatusChange(status)}
          disabled={updating}
          size="small"
        >
          Cancel Request
        </Button>
      );
    }

    if (status === 'Completed') {
      return (
        <Button
          key={status}
          className={styles.completeButton}
          appearance="primary"
          icon={<CheckmarkRegular />}
          onClick={() => handleStatusChange(status)}
          disabled={updating}
          size="small"
        >
          Mark Completed
        </Button>
      );
    }

    if (status === 'Confirmed') {
      // Confirmation goes through the dedicated confirm flow
      return null;
    }

    return (
      <Button
        key={status}
        className={styles.advanceButton}
        appearance="primary"
        icon={<ArrowRightRegular />}
        onClick={() => handleStatusChange(status)}
        disabled={updating}
        size="small"
      >
        {status}
      </Button>
    );
  };

  // Determine if we should show the confirm demo action
  const canConfirmDemo =
    isManager &&
    (request.Status === 'Awaiting Approval' || request.Status === 'Pending Review') &&
    !request.ConfirmedDateTime &&
    request.ProposedSlot1;

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody style={{ padding: 0 }}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.iconContainer}>
              <BoxRegular style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div className={styles.headerContent}>
              <Text className={styles.title}>{request.ProductName}</Text>
              <Text className={styles.subtitle}>
                {request.ClientName} &middot; {request.RequestType}
              </Text>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.statusBadge}>{request.Status}</span>
              <button
                className={styles.closeButton}
                onClick={onClose}
                title="Close"
              >
                <Dismiss24Regular />
              </button>
            </div>
          </div>

          {/* Content */}
          <DialogContent className={styles.content}>
            {/* Status Actions (manager only, non-terminal) */}
            {isManager && !isTerminal && availableTransitions.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <ArrowRightRegular style={{ width: '14px', height: '14px' }} />
                  Status Actions
                </div>
                <div className={styles.statusActions}>
                  {updating && <Spinner size="tiny" />}
                  {availableTransitions
                    .filter((s) => s !== 'Confirmed') // Confirm goes through demo flow
                    .map((status) => getStatusActionButton(status))}
                </div>
              </div>
            )}

            {/* Product Information */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <AppGenericRegular style={{ width: '14px', height: '14px' }} />
                Product Information
              </div>
              <div className={styles.grid}>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Product Name</span>
                  <span className={styles.gridValue}>{request.ProductName}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Product Type</span>
                  <span className={styles.metaBadge}>{request.ProductType}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Request Type</span>
                  <span className={styles.metaBadge}>{request.RequestType}</span>
                </div>
                {request.ProductCategory && (
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Category</span>
                    <span className={styles.gridValue}>{request.ProductCategory}</span>
                  </div>
                )}
                {request.LicenseCount && (
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>License Count</span>
                    <span className={styles.gridValue}>{request.LicenseCount}</span>
                  </div>
                )}
                {request.EstimatedValue && (
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Estimated Value</span>
                    <span className={styles.gridValue} style={{ color: '#107c10', fontWeight: '600' }}>
                      {formatCurrency(request.EstimatedValue)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Client & Contact Information */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PersonRegular style={{ width: '14px', height: '14px' }} />
                Client & Contact
              </div>
              <div className={styles.grid}>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Client</span>
                  <span className={styles.gridValue}>
                    <BuildingRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                    {request.ClientName}
                    {request.IsPremiumClient && (
                      <span className={styles.premiumBadge}>Premium</span>
                    )}
                  </span>
                </div>
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
                    <span className={styles.gridValue}>{request.Industry}</span>
                  </div>
                )}
                {request.CompanySize && (
                  <div className={styles.gridItem}>
                    <span className={styles.gridLabel}>Company Size</span>
                    <span className={styles.gridValue}>{request.CompanySize}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Account Manager */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PersonRegular style={{ width: '14px', height: '14px' }} />
                Account Manager
              </div>
              <div className={styles.grid}>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Name</span>
                  <span className={styles.gridValue}>{request.AccountManagerName}</span>
                </div>
                <div className={styles.gridItem}>
                  <span className={styles.gridLabel}>Email</span>
                  <span className={styles.gridValue}>
                    <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                    {request.AccountManagerEmail}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Specialist */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <PersonRegular style={{ width: '14px', height: '14px' }} />
                Assigned Specialist
              </div>
              {request.AssignedSpecialistName ? (
                <div className={styles.specialistCard}>
                  <div className={styles.specialistIcon}>
                    <PersonRegular style={{ width: '20px', height: '20px' }} />
                  </div>
                  <div className={styles.specialistInfo}>
                    <Text className={styles.specialistName}>{request.AssignedSpecialistName}</Text>
                    <Text className={styles.specialistRole}>
                      {request.AssignedSpecialistRole || 'Specialist'} &middot; {request.AssignedSpecialistEmail}
                    </Text>
                  </div>
                </div>
              ) : (
                <div className={styles.unassigned}>No specialist assigned yet</div>
              )}

              {/* Specialist Assignment (manager only, not terminal) */}
              {isManager && !isTerminal && (
                <div className={styles.assignRow}>
                  <Dropdown
                    className={styles.specialistDropdown}
                    placeholder={loadingSpecialists ? 'Loading...' : 'Select specialist...'}
                    selectedOptions={selectedSpecialistEmail ? [selectedSpecialistEmail] : []}
                    onOptionSelect={(_, data) =>
                      setSelectedSpecialistEmail(data.optionValue as string)
                    }
                    disabled={loadingSpecialists || updating}
                  >
                    {specialists.map((s) => (
                      <Option key={s.Email} value={s.Email} text={`${s.Title} (${s.Role})`}>
                        {s.Title} ({s.Role}) - {s.CurrentDealCount || 0}/{s.MaxConcurrentDeals || 5}
                      </Option>
                    ))}
                  </Dropdown>
                  <Button
                    appearance="primary"
                    className={styles.advanceButton}
                    icon={<PersonRegular />}
                    onClick={handleAssignSpecialist}
                    disabled={!selectedSpecialistEmail || updating}
                    size="small"
                  >
                    {request.AssignedSpecialistName ? 'Reassign' : 'Assign'}
                  </Button>
                </div>
              )}
            </div>

            {/* Schedule / Time Slots */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <CalendarLtr24Regular style={{ width: '14px', height: '14px' }} />
                Schedule
              </div>
              <div className={styles.timeSlotsList}>
                {request.ConfirmedDateTime ? (
                  <div className={`${styles.timeSlot} ${styles.confirmedSlot}`}>
                    <CheckmarkRegular style={{ width: '16px', height: '16px', color: '#107c10' }} />
                    <strong>Confirmed:</strong> {formatDateTime(request.ConfirmedDateTime)}
                  </div>
                ) : (
                  <>
                    {request.ProposedSlot1 && (
                      <div className={styles.timeSlot}>
                        <ClockRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                        Option 1: {formatDateTime(request.ProposedSlot1)}
                      </div>
                    )}
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

              {/* Confirm Demo/Trial Slot (manager only) */}
              {canConfirmDemo && (
                <div className={styles.confirmSlotRow}>
                  <Dropdown
                    placeholder="Select slot to confirm..."
                    selectedOptions={selectedSlot ? [selectedSlot] : []}
                    onOptionSelect={(_, data) =>
                      setSelectedSlot(data.optionValue as string)
                    }
                    disabled={updating}
                    style={{ flex: 1 }}
                  >
                    {request.ProposedSlot1 && (
                      <Option value={request.ProposedSlot1} text={formatDateTime(request.ProposedSlot1)}>
                        {formatDateTime(request.ProposedSlot1)}
                      </Option>
                    )}
                    {request.ProposedSlot2 && (
                      <Option value={request.ProposedSlot2} text={formatDateTime(request.ProposedSlot2)}>
                        {formatDateTime(request.ProposedSlot2)}
                      </Option>
                    )}
                    {request.ProposedSlot3 && (
                      <Option value={request.ProposedSlot3} text={formatDateTime(request.ProposedSlot3)}>
                        {formatDateTime(request.ProposedSlot3)}
                      </Option>
                    )}
                  </Dropdown>
                  <Button
                    className={styles.confirmButton}
                    appearance="primary"
                    icon={<CheckmarkRegular />}
                    onClick={handleConfirmDemo}
                    disabled={!selectedSlot || updating}
                    size="small"
                  >
                    Confirm {request.RequestType}
                  </Button>
                </div>
              )}
            </div>

            {/* Requirements */}
            {request.ProductRequirements && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <DocumentRegular style={{ width: '14px', height: '14px' }} />
                  Product Requirements
                </div>
                <div className={styles.textBlock}>{request.ProductRequirements}</div>
              </div>
            )}

            {/* Comments */}
            {request.Comments && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <ChatRegular style={{ width: '14px', height: '14px' }} />
                  Comments
                </div>
                <div className={styles.textBlock}>{request.Comments}</div>
              </div>
            )}

            {/* Outcome & Next Steps */}
            {(request.Outcome || request.NextSteps) && (
              <div className={styles.sectionLast}>
                {request.Outcome && (
                  <>
                    <div className={styles.sectionHeader}>Outcome</div>
                    <div className={styles.textBlock} style={{ marginBottom: request.NextSteps ? '16px' : 0 }}>
                      {request.Outcome}
                    </div>
                  </>
                )}
                {request.NextSteps && (
                  <>
                    <div className={styles.sectionHeader} style={{ marginTop: request.Outcome ? '16px' : 0 }}>
                      Next Steps
                    </div>
                    <div className={styles.textBlock}>{request.NextSteps}</div>
                  </>
                )}
              </div>
            )}
          </DialogContent>

          {/* Footer */}
          <div className={styles.footer}>
            <span className={styles.footerLeft}>
              Created {format(new Date(request.Created), 'MMM d, yyyy')} by{' '}
              {request.AccountManagerName}
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button
                appearance="secondary"
                onClick={onClose}
                className={styles.cancelButton}
              >
                Close
              </Button>
              <Button
                className={styles.submitButton}
                appearance="primary"
                onClick={onClose}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
