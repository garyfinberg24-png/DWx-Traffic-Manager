/**
 * DWx Traffic Manager - Product Request Details Modal
 * Full product request details with tabbed layout using DetailModalShell.
 * Tabs: Overview, People, Schedule, Actions, Notes
 */

import React, { useState, useEffect } from 'react';
import {
  Text,
  Button,
  Spinner,
  Dropdown,
  Option,
  makeStyles,
} from '@fluentui/react-components';
import {
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
  InfoRegular,
  History24Regular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ProductRequest, ProductRequestStatus } from '../../types/ProductRequest';
import { Specialist } from '../../types/ServiceRequest';
import { productRequestService } from '../../services/ProductRequestService';
import { specialistService } from '../../services/SpecialistService';
import { DW_COLORS } from '../../utils/buttonStyles';
import { format } from 'date-fns';
import { DealActivityTimeline } from './DealActivityTimeline';
import {
  DetailModalShell,
  DetailSection,
  DetailGrid,
  DetailField,
  Divider,
  TextBlock,
  StepperStep,
  ModalTab,
} from './DetailModalShell';

// ============================================================================
// Local styles (only for things NOT in DetailModalShell)
// ============================================================================

const useStyles = makeStyles({
  // Status badge colors for header
  statusPending: {
    backgroundColor: 'rgba(255, 183, 77, 0.2)',
    color: '#f57c00',
  },
  statusAwaiting: {
    backgroundColor: 'rgba(100, 181, 246, 0.2)',
    color: '#1976d2',
  },
  statusConfirmed: {
    backgroundColor: 'rgba(129, 199, 132, 0.2)',
    color: '#388e3c',
  },
  statusCompleted: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    color: '#2e7d32',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 83, 80, 0.2)',
    color: '#c62828',
  },

  // Type and request badges
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

  // Specialist card
  specialistCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#e8f4fc',
    borderRadius: '8px',
    border: '1px solid #cce4f0',
  },
  specialistAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: DW_COLORS.primary,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    flexShrink: 0,
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

  // Assignment row
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

  // Time slots
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

  // Action buttons
  statusActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
  },
  advanceButton: {
    backgroundColor: DW_COLORS.primary,
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
  confirmButton: {
    backgroundColor: DW_COLORS.success,
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  cancelStatusButton: {
    backgroundColor: DW_COLORS.danger,
    ':hover': {
      backgroundColor: '#a52a2d',
    },
  },
  completeButton: {
    backgroundColor: DW_COLORS.success,
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },

  // Italic placeholder text
  italicPlaceholder: {
    fontStyle: 'italic',
    color: '#888',
    fontSize: '13px',
    padding: '14px 16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
});

// ============================================================================
// Status workflow transitions
// ============================================================================

const STATUS_TRANSITIONS: Record<ProductRequestStatus, ProductRequestStatus[]> = {
  'Pending Review': ['Awaiting Approval', 'Cancelled'],
  'Awaiting Approval': ['Confirmed', 'Cancelled'],
  'Confirmed': ['Completed', 'Cancelled'],
  'Completed': [],
  'Cancelled': [],
};

// ============================================================================
// Progress stepper builder
// ============================================================================

const PRODUCT_STAGES: ProductRequestStatus[] = [
  'Pending Review',
  'Awaiting Approval',
  'Confirmed',
  'Completed',
];

function buildProductSteps(status: ProductRequestStatus): StepperStep[] {
  if (status === 'Cancelled') {
    return PRODUCT_STAGES.map((s) => ({ label: s, status: 'future' as const }));
  }
  const currentIdx = PRODUCT_STAGES.indexOf(status);
  return PRODUCT_STAGES.map((s, i) => ({
    label: s,
    status:
      i < currentIdx
        ? ('completed' as const)
        : i === currentIdx
          ? ('current' as const)
          : ('future' as const),
  }));
}

// ============================================================================
// Tab definitions
// ============================================================================

const TABS: ModalTab[] = [
  { value: 'overview', label: 'Overview', icon: <BoxRegular style={{ width: '14px', height: '14px' }} /> },
  { value: 'people', label: 'People', icon: <PersonRegular style={{ width: '14px', height: '14px' }} /> },
  { value: 'schedule', label: 'Schedule', icon: <CalendarLtr24Regular style={{ width: '14px', height: '14px' }} /> },
  { value: 'actions', label: 'Actions', icon: <ArrowRightRegular style={{ width: '14px', height: '14px' }} /> },
  { value: 'notes', label: 'Notes', icon: <ChatRegular style={{ width: '14px', height: '14px' }} /> },
  { value: 'activity', label: 'Activity', icon: <History24Regular style={{ width: '14px', height: '14px' }} /> },
];

// ============================================================================
// Component
// ============================================================================

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

  const [activeTab, setActiveTab] = useState('overview');
  const [updating, setUpdating] = useState(false);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);
  const [selectedSpecialistEmail, setSelectedSpecialistEmail] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const availableTransitions = STATUS_TRANSITIONS[request.Status] || [];
  const isTerminal = request.Status === 'Completed' || request.Status === 'Cancelled';

  // Load specialists when modal opens and user is manager
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

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen]);

  // ---- Formatters ----

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

  // ---- Handlers ----

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
    request.ProposedSlot1 &&
    request.AssignedSpecialistEmail;

  // ---- Specialist initials helper ----

  const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // ---- Steps ----

  const steps = buildProductSteps(request.Status);

  // ---- Footer ----

  const footerLeft = (
    <>
      Created {format(new Date(request.Created), 'MMM d, yyyy')} &middot; Account Manager: {request.AccountManagerName}
    </>
  );

  const footerRight = (
    <Button
      appearance="primary"
      onClick={onClose}
      style={{ backgroundColor: DW_COLORS.primary }}
    >
      Done
    </Button>
  );

  // ---- Tab content renderers ----

  const renderOverviewTab = () => (
    <>
      <DetailSection icon={<BoxRegular />} title="Product Information">
        <DetailGrid>
          <DetailField label="Product Name">{request.ProductName}</DetailField>
          <DetailField label="Product Type">
            <span className={styles.metaBadge}>{request.ProductType}</span>
          </DetailField>
          <DetailField label="Request Type">
            <span className={styles.metaBadge}>{request.RequestType}</span>
          </DetailField>
          <DetailField label="Category">{request.ProductCategory || 'Not specified'}</DetailField>
          <DetailField label="License Count">
            {request.LicenseCount ? String(request.LicenseCount) : 'Not specified'}
          </DetailField>
          <DetailField label="Estimated Value">
            <span style={{ color: '#107c10', fontWeight: '600' }}>
              {formatCurrency(request.EstimatedValue)}
            </span>
          </DetailField>
        </DetailGrid>
      </DetailSection>

      <Divider />

      <DetailSection icon={<BuildingRegular />} title="Client Information">
        <DetailGrid>
          <DetailField label="Client Name">
            {request.ClientName}
            {request.IsPremiumClient && (
              <span className={styles.premiumBadge}>Premium</span>
            )}
          </DetailField>
          <DetailField label="Industry">{request.Industry || 'Not specified'}</DetailField>
          <DetailField label="Contact Name">{request.ContactName}</DetailField>
          <DetailField label="Email">
            <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {request.ContactEmail}
          </DetailField>
          <DetailField label="Phone">
            {request.ContactPhone ? (
              <>
                <PhoneRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                {request.ContactPhone}
              </>
            ) : (
              'Not specified'
            )}
          </DetailField>
          <DetailField label="Company Size">{request.CompanySize || 'Not specified'}</DetailField>
        </DetailGrid>
      </DetailSection>

      <Divider />

      <DetailSection icon={<PersonRegular />} title="Account Manager" last>
        <DetailGrid>
          <DetailField label="Name">{request.AccountManagerName}</DetailField>
          <DetailField label="Email">
            <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {request.AccountManagerEmail}
          </DetailField>
        </DetailGrid>
      </DetailSection>
    </>
  );

  const renderPeopleTab = () => (
    <>
      <DetailSection icon={<PersonRegular />} title="Assigned Specialist">
        {request.AssignedSpecialistName ? (
          <div className={styles.specialistCard}>
            <div className={styles.specialistAvatar}>
              {getInitials(request.AssignedSpecialistName)}
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
      </DetailSection>

      <DetailSection icon={<PhoneRegular />} title="Contact Details" last>
        <DetailGrid>
          <DetailField label="Contact Name">{request.ContactName}</DetailField>
          <DetailField label="Email">
            <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {request.ContactEmail}
          </DetailField>
          <DetailField label="Phone">
            {request.ContactPhone ? (
              <>
                <PhoneRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
                {request.ContactPhone}
              </>
            ) : (
              'Not specified'
            )}
          </DetailField>
        </DetailGrid>
      </DetailSection>
    </>
  );

  const renderScheduleTab = () => (
    <>
      <DetailSection
        icon={<CalendarLtr24Regular />}
        title="Proposed Time Slots"
        last={!canConfirmDemo}
      >
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
              {!request.ProposedSlot1 && !request.ProposedSlot2 && !request.ProposedSlot3 && (
                <div className={styles.italicPlaceholder}>No time slots proposed yet</div>
              )}
            </>
          )}
        </div>

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
      </DetailSection>
    </>
  );

  const renderActionsTab = () => (
    <>
      <DetailSection icon={<ArrowRightRegular />} title="Status Actions (Manager)" last>
        {isManager && !isTerminal && availableTransitions.length > 0 ? (
          <div className={styles.statusActions}>
            {updating && <Spinner size="tiny" />}
            {availableTransitions
              .filter((s) => s !== 'Confirmed') // Confirm goes through demo flow
              .map((status) => getStatusActionButton(status))}
          </div>
        ) : isTerminal ? (
          <div className={styles.italicPlaceholder}>
            This request is {request.Status.toLowerCase()} and no further actions are available.
          </div>
        ) : !isManager ? (
          <div className={styles.italicPlaceholder}>
            Only managers can perform status actions on product requests.
          </div>
        ) : (
          <div className={styles.italicPlaceholder}>
            No status transitions available for the current status.
          </div>
        )}
      </DetailSection>
    </>
  );

  const renderNotesTab = () => (
    <>
      <DetailSection icon={<DocumentRegular />} title="Product Requirements">
        {request.ProductRequirements ? (
          <TextBlock>{request.ProductRequirements}</TextBlock>
        ) : (
          <div className={styles.italicPlaceholder}>No product requirements recorded yet</div>
        )}
      </DetailSection>

      <DetailSection icon={<ChatRegular />} title="Comments">
        {request.Comments ? (
          <TextBlock>{request.Comments}</TextBlock>
        ) : (
          <div className={styles.italicPlaceholder}>No comments recorded yet</div>
        )}
      </DetailSection>

      <DetailSection icon={<InfoRegular />} title="Outcome">
        {request.Outcome ? (
          <TextBlock>{request.Outcome}</TextBlock>
        ) : (
          <div className={styles.italicPlaceholder}>No outcome recorded yet</div>
        )}
      </DetailSection>

      <DetailSection icon={<ArrowRightRegular />} title="Next Steps" last>
        {request.NextSteps ? (
          <TextBlock>{request.NextSteps}</TextBlock>
        ) : (
          <div className={styles.italicPlaceholder}>No next steps recorded yet</div>
        )}
      </DetailSection>
    </>
  );

  const renderActivityTab = () => (
    <DealActivityTimeline entityId={request.Id} entityType="ProductRequest" />
  );

  // ---- Render active tab ----

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'people':
        return renderPeopleTab();
      case 'schedule':
        return renderScheduleTab();
      case 'actions':
        return renderActionsTab();
      case 'notes':
        return renderNotesTab();
      case 'activity':
        return renderActivityTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <DetailModalShell
      isOpen={isOpen}
      onClose={onClose}
      icon={<BoxRegular style={{ width: '24px', height: '24px', color: 'white' }} />}
      title={request.ProductName}
      subtitle={`${request.ClientName} \u00b7 ${request.RequestType}`}
      statusBadge={request.Status}
      steps={steps}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      footerLeft={footerLeft}
      footerRight={footerRight}
    >
      {renderTabContent()}
    </DetailModalShell>
  );
};
