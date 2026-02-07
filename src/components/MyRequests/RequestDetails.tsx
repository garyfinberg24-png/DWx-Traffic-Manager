/**
 * DWx Traffic Manager - Request Details Modal
 * Full service request details with tabbed layout using DetailModalShell.
 * Tabs: Overview, People, Commercial, Schedule, Actions
 */

import React, { useState, useCallback } from 'react';
import { Input, Textarea, Spinner, Button, Text } from '@fluentui/react-components';
import {
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
  DocumentRegular,
  ChatRegular,
  Sparkle24Regular,
  BoxRegular,
  History24Regular,
} from '@fluentui/react-icons';
import { makeStyles } from '@fluentui/react-components';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  ServiceRequest,
  FunnelStage,
  STAGE_TRANSITIONS,
} from '../../types/ServiceRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { followUpService } from '../../services/FollowUpService';
import { SessionPrepDialog } from '../SessionPrep';
import { ProposalBuilder, ProposalTracker } from '../Proposal';
import { DW_COLORS } from '../../utils/buttonStyles';
import { format } from 'date-fns';
import { DealActivityTimeline } from './DealActivityTimeline';
import { EmailTimeline } from './EmailTimeline';
import {
  DetailModalShell,
  DetailSection,
  DetailGrid,
  DetailField,
  TextBlock,
  EditButton,
  EditingIndicator,
  EditActions,
  StepperStep,
  ModalTab,
} from './DetailModalShell';

// ============================================================================
// Local styles (only things NOT provided by DetailModalShell)
// ============================================================================

const useStyles = makeStyles({
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
  stageActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  advanceButton: {
    backgroundColor: DW_COLORS.primary,
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
  regressButton: {
    backgroundColor: DW_COLORS.neutral,
    ':hover': {
      backgroundColor: '#4d4d4d',
    },
  },
  lostButton: {
    backgroundColor: DW_COLORS.danger,
    ':hover': {
      backgroundColor: '#a52a2d',
    },
  },
  wonButton: {
    backgroundColor: DW_COLORS.success,
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
  editInput: {
    width: '100%',
  },
  editTextarea: {
    width: '100%',
    minHeight: '80px',
  },
});

// ============================================================================
// Stepper logic
// ============================================================================

const FUNNEL_STAGES: FunnelStage[] = [
  'Lead',
  'Qualified',
  'Discovery',
  'Proposal',
  'Negotiation',
  'Won',
];

function buildSteps(currentStage: FunnelStage): StepperStep[] {
  if (currentStage === 'Lost') {
    return FUNNEL_STAGES.map((s) => ({ label: s, status: 'future' as const }));
  }
  const currentIdx = FUNNEL_STAGES.indexOf(currentStage);
  return FUNNEL_STAGES.map((s, i) => ({
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
  { value: 'overview', label: 'Overview', icon: <BoxRegular style={{ width: '16px', height: '16px' }} /> },
  { value: 'people', label: 'People', icon: <PersonRegular style={{ width: '16px', height: '16px' }} /> },
  { value: 'commercial', label: 'Commercial', icon: <MoneyRegular style={{ width: '16px', height: '16px' }} /> },
  { value: 'schedule', label: 'Schedule', icon: <CalendarLtr24Regular style={{ width: '16px', height: '16px' }} /> },
  { value: 'actions', label: 'Actions', icon: <ArrowRightRegular style={{ width: '16px', height: '16px' }} /> },
  { value: 'activity', label: 'Activity', icon: <History24Regular style={{ width: '16px', height: '16px' }} /> },
];

// ============================================================================
// Helper: initials from name
// ============================================================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || '?').toUpperCase();
}

// ============================================================================
// Component
// ============================================================================

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

  const [activeTab, setActiveTab] = useState('overview');
  const [updating, setUpdating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSessionPrep, setShowSessionPrep] = useState(false);
  const [showProposal, setShowProposal] = useState(false);

  // Edit mode state
  const [editingSection, setEditingSection] = useState<
    'contact' | 'deal' | 'requirements' | 'comments' | null
  >(null);
  const [editValues, setEditValues] = useState<Record<string, string | number>>({});

  const availableTransitions = STAGE_TRANSITIONS[request.FunnelStage] || [];
  const isTerminal = request.FunnelStage === 'Won' || request.FunnelStage === 'Lost';

  // When switching tabs, auto-cancel any in-progress edit
  const handleTabChange = useCallback(
    (tab: string) => {
      if (editingSection) {
        setEditingSection(null);
        setEditValues({});
      }
      setActiveTab(tab);
    },
    [editingSection]
  );

  const startEditing = useCallback(
    (section: 'contact' | 'deal' | 'requirements' | 'comments') => {
      const values: Record<string, string | number> = {};
      if (section === 'contact') {
        values.ContactName = request.ContactName || '';
        values.ContactEmail = request.ContactEmail || '';
        values.ContactPhone = request.ContactPhone || '';
        values.Industry = request.Industry || '';
      } else if (section === 'deal') {
        values.DealValue = request.DealValue || 0;
        values.DealProbability = request.DealProbability || 50;
      } else if (section === 'requirements') {
        values.Requirements = request.Requirements || '';
      } else if (section === 'comments') {
        values.Comments = request.Comments || '';
      }
      setEditValues(values);
      setEditingSection(section);
    },
    [request]
  );

  const cancelEditing = useCallback(() => {
    setEditingSection(null);
    setEditValues({});
  }, []);

  const handleSaveEdit = async () => {
    if (!user || !editingSection) return;

    try {
      setSaving(true);

      if (editingSection === 'deal') {
        // Use updateDealInfo for deal values (recalculates WeightedPipeline + notifications)
        const result = await serviceRequestService.updateDealInfo(
          request.Id,
          {
            DealValue: editValues.DealValue as number,
            DealProbability: editValues.DealProbability as number,
          },
          user.email,
          user.displayName
        );

        if (result.success && result.request) {
          showToast('Deal information updated', 'success');
          onRequestUpdated?.(result.request);
        } else {
          throw new Error(result.error || 'Failed to update deal info');
        }
      } else {
        // Use updateRequestFields for contact/requirements/comments
        const updates: Record<string, string> = {};
        for (const [key, value] of Object.entries(editValues)) {
          updates[key] = String(value);
        }

        const result = await serviceRequestService.updateRequestFields(
          request.Id,
          updates,
          user.email,
          user.displayName
        );

        if (result.success && result.request) {
          const sectionLabel =
            editingSection === 'contact'
              ? 'Contact information'
              : editingSection === 'requirements'
              ? 'Requirements'
              : 'Comments';
          showToast(`${sectionLabel} updated`, 'success');
          onRequestUpdated?.(result.request);
        } else {
          throw new Error(result.error || 'Failed to update');
        }
      }

      setEditingSection(null);
      setEditValues({});
    } catch (err) {
      console.error('Error saving edit:', err);
      showToast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

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
    const currentIndex = [
      'Lead',
      'Qualified',
      'Discovery',
      'Proposal',
      'Negotiation',
    ].indexOf(request.FunnelStage);
    const targetIndex = [
      'Lead',
      'Qualified',
      'Discovery',
      'Proposal',
      'Negotiation',
    ].indexOf(stage);

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

  // ========================================================================
  // Interest badge helper
  // ========================================================================

  const renderInterestBadge = () => {
    const level = request.InterestLevel;
    const bgColor =
      level === 'Hot'
        ? 'rgba(209, 52, 56, 0.1)'
        : level === 'Warm'
        ? 'rgba(247, 99, 12, 0.1)'
        : 'rgba(107, 130, 140, 0.1)';
    const textColor =
      level === 'Hot'
        ? '#d13438'
        : level === 'Warm'
        ? '#f7630c'
        : '#6b828c';
    const emoji = level === 'Hot' ? '\uD83D\uDD25' : level === 'Warm' ? '\u2600\uFE0F' : '\u2744\uFE0F';

    return (
      <span
        className={styles.interestBadge}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        {emoji} {level}
      </span>
    );
  };

  // ========================================================================
  // Tab: Overview
  // ========================================================================

  const renderOverviewTab = () => (
    <>
      <DetailSection
        icon={<BuildingRegular style={{ width: '16px', height: '16px' }} />}
        title="Client Information"
      >
        <DetailGrid>
          <DetailField label="Client Name">{request.ClientName || 'N/A'}</DetailField>
          <DetailField label="Contact Name">
            <PersonRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {request.ContactName || 'N/A'}
          </DetailField>
          <DetailField label="Email">
            <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {request.ContactEmail || 'N/A'}
          </DetailField>
          <DetailField label="Phone">
            <PhoneRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {request.ContactPhone || 'N/A'}
          </DetailField>
          <DetailField label="Industry">
            <BuildingRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {request.Industry || 'N/A'}
          </DetailField>
          <DetailField label="Company Size">{request.CompanySize || 'N/A'}</DetailField>
        </DetailGrid>
      </DetailSection>

      <DetailSection
        icon={<DocumentRegular style={{ width: '16px', height: '16px' }} />}
        title="Service Information"
        last
      >
        <DetailGrid>
          <DetailField label="Service Name">{request.ServiceName || 'N/A'}</DetailField>
          <DetailField label="Category">{request.ServiceCategory || 'N/A'}</DetailField>
          <DetailField label="Account Manager">{request.AccountManagerName || 'N/A'}</DetailField>
          <DetailField label="AM Email">
            <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
            {request.AccountManagerEmail || 'N/A'}
          </DetailField>
        </DetailGrid>
      </DetailSection>
    </>
  );

  // ========================================================================
  // Tab: People
  // ========================================================================

  const renderPeopleTab = () => (
    <>
      <DetailSection
        icon={<PersonRegular style={{ width: '16px', height: '16px' }} />}
        title="Contact Details"
        editButton={
          !isTerminal && editingSection !== 'contact' ? (
            <EditButton onClick={() => startEditing('contact')} title="Edit contact info" />
          ) : editingSection === 'contact' ? (
            <EditingIndicator />
          ) : undefined
        }
      >
        {editingSection === 'contact' ? (
          <>
            <DetailGrid>
              <DetailField label="Contact Name">
                <Input
                  className={styles.editInput}
                  value={String(editValues.ContactName || '')}
                  onChange={(_, data) =>
                    setEditValues((prev) => ({ ...prev, ContactName: data.value }))
                  }
                />
              </DetailField>
              <DetailField label="Email">
                <Input
                  className={styles.editInput}
                  type="email"
                  value={String(editValues.ContactEmail || '')}
                  onChange={(_, data) =>
                    setEditValues((prev) => ({ ...prev, ContactEmail: data.value }))
                  }
                />
              </DetailField>
              <DetailField label="Phone">
                <Input
                  className={styles.editInput}
                  value={String(editValues.ContactPhone || '')}
                  onChange={(_, data) =>
                    setEditValues((prev) => ({ ...prev, ContactPhone: data.value }))
                  }
                />
              </DetailField>
              <DetailField label="Industry">
                <Input
                  className={styles.editInput}
                  value={String(editValues.Industry || '')}
                  onChange={(_, data) =>
                    setEditValues((prev) => ({ ...prev, Industry: data.value }))
                  }
                />
              </DetailField>
            </DetailGrid>
            <EditActions onSave={handleSaveEdit} onCancel={cancelEditing} saving={saving} />
          </>
        ) : (
          <DetailGrid>
            <DetailField label="Contact Name">
              <PersonRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
              {request.ContactName || 'N/A'}
            </DetailField>
            <DetailField label="Email">
              <MailRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
              {request.ContactEmail || 'N/A'}
            </DetailField>
            <DetailField label="Phone">
              <PhoneRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
              {request.ContactPhone || 'N/A'}
            </DetailField>
            <DetailField label="Industry">
              <BuildingRegular style={{ width: '14px', height: '14px', color: '#616161' }} />
              {request.Industry || 'N/A'}
            </DetailField>
          </DetailGrid>
        )}
      </DetailSection>

      <DetailSection
        icon={<PersonRegular style={{ width: '16px', height: '16px' }} />}
        title="Assigned Specialist"
      >
        {request.AssignedSpecialistName ? (
          <div className={styles.specialistCard}>
            <div className={styles.specialistAvatar}>
              {getInitials(request.AssignedSpecialistName)}
            </div>
            <div className={styles.specialistInfo}>
              <div className={styles.specialistName}>{request.AssignedSpecialistName}</div>
              <div className={styles.specialistRole}>
                {request.AssignedSpecialistRole || 'Specialist'} &bull;{' '}
                {request.AssignedSpecialistEmail}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.unassigned}>No specialist assigned yet</div>
        )}
      </DetailSection>

      {['Discovery', 'Proposal', 'Negotiation', 'Won'].includes(request.FunnelStage) &&
        request.AssignedSpecialistEmail && (
          <DetailSection
            icon={<Sparkle24Regular style={{ width: '16px', height: '16px' }} />}
            title="Session Preparation"
            last={!['Proposal', 'Negotiation', 'Won'].includes(request.FunnelStage)}
          >
            <Button
              appearance="primary"
              icon={<Sparkle24Regular />}
              onClick={() => setShowSessionPrep(true)}
              style={{ backgroundColor: DW_COLORS.teal }}
            >
              Open Session Prep
            </Button>
          </DetailSection>
        )}

      {['Proposal', 'Negotiation', 'Won'].includes(request.FunnelStage) && (
        <DetailSection
          icon={<DocumentRegular style={{ width: '16px', height: '16px' }} />}
          title="Proposal"
          last
        >
          <ProposalTracker
            serviceRequestId={request.Id}
            onOpenProposal={() => setShowProposal(true)}
            onCreateProposal={() => setShowProposal(true)}
          />
        </DetailSection>
      )}
    </>
  );

  // ========================================================================
  // Tab: Commercial
  // ========================================================================

  const renderCommercialTab = () => (
    <DetailSection
      icon={<MoneyRegular style={{ width: '16px', height: '16px' }} />}
      title="Deal Information"
      last
      editButton={
        !isTerminal && editingSection !== 'deal' ? (
          <EditButton onClick={() => startEditing('deal')} title="Edit deal info" />
        ) : editingSection === 'deal' ? (
          <EditingIndicator />
        ) : undefined
      }
    >
      {editingSection === 'deal' ? (
        <>
          <DetailGrid>
            <DetailField label="Interest Level">{renderInterestBadge()}</DetailField>
            <DetailField label="Deal Value (ZAR)">
              <Input
                className={styles.editInput}
                type="number"
                value={String(editValues.DealValue || 0)}
                onChange={(_, data) =>
                  setEditValues((prev) => ({
                    ...prev,
                    DealValue: Number(data.value) || 0,
                  }))
                }
              />
            </DetailField>
            <DetailField label="Win Probability (%)">
              <Input
                className={styles.editInput}
                type="number"
                min={0}
                max={100}
                value={String(editValues.DealProbability || 50)}
                onChange={(_, data) => {
                  const val = Math.min(100, Math.max(0, Number(data.value) || 0));
                  setEditValues((prev) => ({ ...prev, DealProbability: val }));
                }}
              />
            </DetailField>
            <DetailField label="Weighted Value (auto)">
              {formatCurrency(
                ((editValues.DealValue as number) || 0) *
                  (((editValues.DealProbability as number) || 50) / 100)
              )}
            </DetailField>
          </DetailGrid>
          <EditActions onSave={handleSaveEdit} onCancel={cancelEditing} saving={saving} />
        </>
      ) : (
        <DetailGrid>
          <DetailField label="Interest Level">{renderInterestBadge()}</DetailField>
          <DetailField label="Deal Value">
            <span style={{ color: '#107c10', fontWeight: '600' }}>
              {formatCurrency(request.DealValue)}
            </span>
          </DetailField>
          <DetailField label="Win Probability">
            {request.DealProbability || 50}%
          </DetailField>
          <DetailField label="Weighted Value">
            {formatCurrency(
              (request.DealValue || 0) * ((request.DealProbability || 50) / 100)
            )}
          </DetailField>
          <DetailField label="Budget">{request.Budget || 'Not specified'}</DetailField>
          <DetailField label="Timeline">{request.Timeline || 'Not specified'}</DetailField>
          <DetailField label="Expected Close Date">
            {request.ExpectedCloseDate
              ? format(new Date(request.ExpectedCloseDate), 'MMM d, yyyy')
              : 'Not specified'}
          </DetailField>
        </DetailGrid>
      )}
    </DetailSection>
  );

  // ========================================================================
  // Tab: Schedule
  // ========================================================================

  const renderScheduleTab = () => (
    <DetailSection
      icon={<CalendarLtr24Regular style={{ width: '16px', height: '16px' }} />}
      title="Meeting Schedule"
      last
    >
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
    </DetailSection>
  );

  // ========================================================================
  // Tab: Actions
  // ========================================================================

  const renderActionsTab = () => {
    const urgency = followUpService.getDealUrgency(request);

    return (
    <>
      {urgency && user?.isManager && (
        <DetailSection title="Follow-Up Required" icon={<ClockRegular style={{ width: '16px', height: '16px', color: '#f7630c' }} />}>
          <div style={{
            backgroundColor: urgency.level === 'overdue' ? '#fee2e2' : urgency.level === 'critical' ? '#fee2e2' : '#fff4ce',
            border: `1px solid ${urgency.level === 'overdue' ? '#d13438' : urgency.level === 'critical' ? '#d13438' : '#f7630c'}`,
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '12px',
          }}>
            <Text style={{ fontSize: '13px', fontWeight: '600', color: urgency.level === 'overdue' ? '#d13438' : '#f7630c', display: 'block', marginBottom: '4px' }}>
              {urgency.level === 'overdue' ? 'OVERDUE' : urgency.level === 'critical' ? 'CRITICAL' : 'NEEDS ATTENTION'}
            </Text>
            <Text style={{ fontSize: '13px', color: '#323130' }}>{urgency.reason}</Text>
          </div>
          <Button
            appearance="primary"
            style={{ backgroundColor: urgency.level === 'overdue' ? '#d13438' : '#f7630c' }}
            onClick={async () => {
              if (!user) return;
              const result = await followUpService.sendFollowUpReminder(
                request,
                urgency,
                user.email,
                user.displayName || user.email
              );
              if (result.success) {
                showToast('Follow-up reminder sent successfully', 'success');
              } else {
                showToast(`Failed to send reminder: ${result.error}`, 'error');
              }
            }}
          >
            Send Follow-Up Reminder
          </Button>
        </DetailSection>
      )}

      {availableTransitions.length > 0 && (
        <DetailSection
          icon={<ArrowRightRegular style={{ width: '16px', height: '16px' }} />}
          title="Stage Actions"
        >
          <div className={styles.stageActions}>
            {updating && <Spinner size="tiny" />}
            {availableTransitions.map((stage) => getTransitionButton(stage))}
          </div>
        </DetailSection>
      )}

      <DetailSection
        icon={<DocumentRegular style={{ width: '16px', height: '16px' }} />}
        title="Requirements"
        editButton={
          !isTerminal && editingSection !== 'requirements' ? (
            <EditButton onClick={() => startEditing('requirements')} title="Edit requirements" />
          ) : editingSection === 'requirements' ? (
            <EditingIndicator />
          ) : undefined
        }
      >
        {editingSection === 'requirements' ? (
          <>
            <Textarea
              className={styles.editTextarea}
              value={String(editValues.Requirements || '')}
              onChange={(_, data) =>
                setEditValues((prev) => ({ ...prev, Requirements: data.value }))
              }
              resize="vertical"
            />
            <EditActions onSave={handleSaveEdit} onCancel={cancelEditing} saving={saving} />
          </>
        ) : request.Requirements ? (
          <TextBlock>{request.Requirements}</TextBlock>
        ) : (
          <div className={styles.unassigned}>No requirements specified</div>
        )}
      </DetailSection>

      <DetailSection
        icon={<ChatRegular style={{ width: '16px', height: '16px' }} />}
        title="Comments"
        editButton={
          !isTerminal && editingSection !== 'comments' ? (
            <EditButton onClick={() => startEditing('comments')} title="Edit comments" />
          ) : editingSection === 'comments' ? (
            <EditingIndicator />
          ) : undefined
        }
      >
        {editingSection === 'comments' ? (
          <>
            <Textarea
              className={styles.editTextarea}
              value={String(editValues.Comments || '')}
              onChange={(_, data) =>
                setEditValues((prev) => ({ ...prev, Comments: data.value }))
              }
              resize="vertical"
            />
            <EditActions onSave={handleSaveEdit} onCancel={cancelEditing} saving={saving} />
          </>
        ) : request.Comments ? (
          <TextBlock>{request.Comments}</TextBlock>
        ) : (
          <div className={styles.unassigned}>No comments</div>
        )}
      </DetailSection>

      {/* Email Communication Timeline */}
      <DetailSection
        icon={<MailRegular style={{ width: '16px', height: '16px' }} />}
        title="Email History"
      >
        <EmailTimeline requestId={request.Id} />
      </DetailSection>

      {request.WinLossReason && (
        <DetailSection
          icon={
            request.FunnelStage === 'Won' ? (
              <CheckmarkRegular style={{ width: '16px', height: '16px' }} />
            ) : (
              <DismissRegular style={{ width: '16px', height: '16px' }} />
            )
          }
          title={request.FunnelStage === 'Won' ? 'Win Reason' : 'Loss Reason'}
          last
        >
          <TextBlock>{request.WinLossReason}</TextBlock>
        </DetailSection>
      )}
    </>
  );
  };

  // ========================================================================
  // Render active tab content
  // ========================================================================

  const renderActivityTab = () => (
    <DealActivityTimeline entityId={request.Id} entityType="ServiceRequest" />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'people':
        return renderPeopleTab();
      case 'commercial':
        return renderCommercialTab();
      case 'schedule':
        return renderScheduleTab();
      case 'actions':
        return renderActionsTab();
      case 'activity':
        return renderActivityTab();
      default:
        return renderOverviewTab();
    }
  };

  // ========================================================================
  // Main render
  // ========================================================================

  return (
    <>
      <DetailModalShell
        isOpen={isOpen}
        onClose={onClose}
        icon={<DocumentRegular style={{ width: '24px', height: '24px', color: 'white' }} />}
        title={request.ClientName}
        subtitle={request.ServiceName}
        statusBadge={request.FunnelStage}
        steps={buildSteps(request.FunnelStage)}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        footerLeft={
          <>
            Created {format(new Date(request.Created), 'MMM d, yyyy')} by{' '}
            {request.AccountManagerName}
          </>
        }
        footerRight={
          <Button
            appearance="primary"
            onClick={onClose}
            style={{ backgroundColor: DW_COLORS.primary }}
          >
            Done
          </Button>
        }
      >
        {renderTabContent()}
      </DetailModalShell>

      {/* Session Preparation Dialog */}
      <SessionPrepDialog
        open={showSessionPrep}
        onClose={() => setShowSessionPrep(false)}
        serviceRequest={request}
      />

      {/* Proposal Builder Dialog */}
      <ProposalBuilder
        open={showProposal}
        onClose={() => setShowProposal(false)}
        serviceRequest={request}
        isManager={user?.isManager ?? false}
      />
    </>
  );
};
