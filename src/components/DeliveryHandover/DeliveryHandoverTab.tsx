/**
 * DeliveryHandoverTab — Per-deal delivery handover view (9th tab in RequestDetails)
 * Manages loading from SP, scope snapshot, delivery team, checklist,
 * AI client brief, risks, environment setup, notes, and status workflow.
 * v2.16.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  Textarea,
  Input,
  ProgressBar,
  Checkbox,
  makeStyles,
  Tooltip,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import {
  Sparkle24Regular,
  Save24Regular,
  ArrowRight24Regular,
  Add24Regular,
  Delete24Regular,
  Checkmark24Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  PersonAdd24Regular,
  Dismiss24Regular,
  Warning24Regular,
} from '@fluentui/react-icons';
import { format } from 'date-fns';
import { ServiceRequest } from '../../types/ServiceRequest';
import { deliveryHandoverService } from '../../services/DeliveryHandoverService';
import {
  DeliveryHandover,
  HandoverStatus,
  HANDOVER_STATUS_TRANSITIONS,
  HANDOVER_STATUS_COLORS,
  HandoverChecklistItem,
  HANDOVER_CHECKLIST_CATEGORIES,
  getHandoverChecklistSummary,
  getHandoverDaysSinceWon,
  RiskAssumption,
  TeamAssignment,
  DELIVERY_ROLE_COLORS,
  DELIVERY_ROLES,
  DeliveryRole,
  generateHandoverId,
  ClientBrief,
  EnvironmentSetup,
  EnvironmentEntry,
  ScopeSnapshot,
} from '../../types/DeliveryHandover';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DW_COLORS } from '../../utils/buttonStyles';
import { formatCurrency, formatDate } from '../../utils/formatters';

// ============================================================================
// Props
// ============================================================================

interface DeliveryHandoverTabProps {
  request: ServiceRequest;
  isManager: boolean;
}

// ============================================================================
// Module-level components (NOT inside render — see CLAUDE.md anti-pattern note)
// ============================================================================

interface SectionCardProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, count, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '12px' }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen); }}
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          cursor: 'pointer',
          backgroundColor: '#f9fafb',
          borderRadius: isOpen ? '8px 8px 0 0' : '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Text weight="semibold" size={300}>{title}</Text>
          {count !== undefined && (
            <span style={{
              backgroundColor: '#e5e7eb',
              color: '#4b5563',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '10px',
            }}>
              {count}
            </span>
          )}
        </div>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 200ms',
          display: 'flex',
          alignItems: 'center',
        }}>
          {isOpen ? <ChevronUp20Regular /> : <ChevronDown20Regular />}
        </span>
      </div>
      {isOpen && <div style={{ padding: '16px' }}>{children}</div>}
    </div>
  );
};

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '16px',
    paddingBottom: '16px',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    gap: '8px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
  },
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '8px',
  },
  teamCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  notesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '8px',
  },
  noteColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  envGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '8px',
  },
  scopeTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
  },
  riskTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
  },
  progressBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe',
    marginTop: '8px',
  },
  aiTimestamp: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  },
});

// ============================================================================
// Component
// ============================================================================

export const DeliveryHandoverTab: React.FC<DeliveryHandoverTabProps> = ({ request, isManager }) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // -- State ----------------------------------------------------------------
  const [handover, setHandover] = useState<DeliveryHandover | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Editable local state
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [clientExpectations, setClientExpectations] = useState('');
  const [handoverMeetingNotes, setHandoverMeetingNotes] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Team inline form
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState<Partial<TeamAssignment>>({
    role: 'Developer',
    allocationPercent: 100,
    resourceName: '',
    resourceEmail: '',
    responsibilities: '',
  });

  // Risk inline form
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [newRisk, setNewRisk] = useState<Partial<RiskAssumption>>({
    type: 'Risk',
    impact: 'Medium',
    description: '',
    mitigation: '',
    owner: '',
    source: 'Delivery',
  });

  // Environment setup
  const [envSetup, setEnvSetup] = useState<EnvironmentSetup>({
    environments: [
      { name: 'Development', url: '', status: 'Not Started', notes: '' },
      { name: 'UAT', url: '', status: 'Not Started', notes: '' },
      { name: 'Staging', url: '', status: 'Not Started', notes: '' },
      { name: 'Production', url: '', status: 'Not Started', notes: '' },
    ],
    accessRequirements: [],
    tooling: [],
    repositoryUrl: '',
    cicdPipeline: '',
  });

  // -- Derived --------------------------------------------------------------
  const readOnly = handover?.HandoverStatus === 'Closed';

  // -- Load on mount --------------------------------------------------------
  const loadHandover = useCallback(async () => {
    setLoading(true);
    try {
      const h = await deliveryHandoverService.getHandoverByRequestId(request.Id);
      if (h) {
        setHandover(h);
        setDeliveryNotes(h.DeliveryNotes || '');
        setClientExpectations(h.ClientExpectations || '');
        setHandoverMeetingNotes(h.HandoverMeetingNotes || '');
        if (h.EnvironmentSetup) {
          setEnvSetup(h.EnvironmentSetup);
        }
      }
    } catch (err) {
      console.error('Failed to load delivery handover:', err);
    } finally {
      setLoading(false);
    }
  }, [request.Id]);

  useEffect(() => {
    loadHandover();
  }, [loadHandover]);

  // -- Create handover handler ----------------------------------------------
  const handleCreateHandover = useCallback(async () => {
    setCreating(true);
    try {
      await deliveryHandoverService.createHandover({
        ServiceRequestId: request.Id,
        ClientName: request.ClientName,
        ProjectName: `${request.ClientName} - ${request.ServiceName}`,
        ServiceName: request.ServiceName,
        ServiceCategory: request.ServiceCategory || '' as never,
        ContractValue: request.DealValue || 0,
        WonDate: request.StageTimestamps?.Won || request.Modified || new Date().toISOString(),
        AccountManagerName: request.AccountManagerName,
        AccountManagerEmail: request.AccountManagerEmail,
        PreSalesSpecialistName: request.AssignedSpecialistName,
        PreSalesSpecialistEmail: request.AssignedSpecialistEmail,
        PreSalesNotes: request.Comments || '',
        ClientExpectations: request.Requirements || '',
      });
      showSuccess('Handover created', 'Delivery handover record has been created.');
      await loadHandover();
    } catch (err) {
      console.error('Failed to create handover:', err);
      showError('Creation failed', 'Could not create delivery handover. Please try again.');
    } finally {
      setCreating(false);
    }
  }, [request, showSuccess, showError, loadHandover]);

  // -- Save notes handler ---------------------------------------------------
  const handleSave = useCallback(async () => {
    if (!handover) return;
    setSaving(true);
    try {
      await deliveryHandoverService.updateHandover(handover.Id, {
        DeliveryNotes: deliveryNotes,
        ClientExpectations: clientExpectations,
        HandoverMeetingNotes: handoverMeetingNotes,
        EnvironmentSetup: envSetup,
      });
      setHasUnsavedChanges(false);
      showSuccess('Changes saved', 'Delivery handover has been updated.');
      await loadHandover();
    } catch (err) {
      console.error('Failed to save handover:', err);
      showError('Save failed', 'Could not save handover changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [handover, deliveryNotes, clientExpectations, handoverMeetingNotes, envSetup, showSuccess, showError, loadHandover]);

  // -- Status transition handler --------------------------------------------
  const handleStatusTransition = useCallback(async (newStatus: HandoverStatus) => {
    if (!handover || !user) return;
    setSaving(true);
    try {
      const result = await deliveryHandoverService.updateStatus(
        handover.Id,
        newStatus,
        user.email || '',
        user.displayName || ''
      );
      if (result.success) {
        showSuccess('Status updated', `Handover status changed to "${newStatus}".`);
        await loadHandover();
      } else {
        showError('Status update failed', result.error || 'Invalid status transition.');
      }
    } catch (err) {
      console.error('Failed to update handover status:', err);
      showError('Status update failed', 'Could not update handover status.');
    } finally {
      setSaving(false);
    }
  }, [handover, user, showSuccess, showError, loadHandover]);

  // -- Checklist toggle handler ---------------------------------------------
  const handleChecklistToggle = useCallback(async (itemId: string, checked: boolean) => {
    if (!handover || readOnly) return;
    const updatedChecklist = handover.HandoverChecklist.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          isCompleted: checked,
          completedBy: checked ? (user?.displayName || user?.email || '') : undefined,
          completedAt: checked ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });
    try {
      await deliveryHandoverService.updateChecklist(handover.Id, updatedChecklist);
      setHandover({ ...handover, HandoverChecklist: updatedChecklist });
    } catch (err) {
      console.error('Failed to update checklist:', err);
      showError('Checklist update failed', 'Could not update checklist item.');
    }
  }, [handover, readOnly, user, showError]);

  // -- Add team member handler ----------------------------------------------
  const handleAddTeamMember = useCallback(async () => {
    if (!handover || !newTeamMember.resourceName) return;
    const assignment: TeamAssignment = {
      id: generateHandoverId(),
      resourceId: 0,
      resourceName: newTeamMember.resourceName || '',
      resourceEmail: newTeamMember.resourceEmail || '',
      role: (newTeamMember.role as DeliveryRole) || 'Developer',
      allocationPercent: newTeamMember.allocationPercent || 100,
      startDate: newTeamMember.startDate || '',
      endDate: newTeamMember.endDate || '',
      responsibilities: newTeamMember.responsibilities || '',
      isConfirmed: false,
    };
    const updatedTeam = [...handover.DeliveryTeam, assignment];
    setSaving(true);
    try {
      const result = await deliveryHandoverService.assignDeliveryTeam(handover.Id, updatedTeam);
      if (result.success) {
        showSuccess('Team member added', `${assignment.resourceName} has been added to the delivery team.`);
        setShowTeamForm(false);
        setNewTeamMember({ role: 'Developer', allocationPercent: 100, resourceName: '', resourceEmail: '', responsibilities: '' });
        await loadHandover();
      } else {
        showError('Assignment failed', result.error || 'Could not add team member.');
      }
    } catch (err) {
      console.error('Failed to add team member:', err);
      showError('Assignment failed', 'Could not add team member.');
    } finally {
      setSaving(false);
    }
  }, [handover, newTeamMember, showSuccess, showError, loadHandover]);

  // -- Remove team member handler -------------------------------------------
  const handleRemoveTeamMember = useCallback(async (memberId: string) => {
    if (!handover) return;
    const updatedTeam = handover.DeliveryTeam.filter((m) => m.id !== memberId);
    setSaving(true);
    try {
      const result = await deliveryHandoverService.assignDeliveryTeam(handover.Id, updatedTeam);
      if (result.success) {
        showSuccess('Team member removed', 'Team member has been removed from the delivery team.');
        await loadHandover();
      } else {
        showError('Removal failed', result.error || 'Could not remove team member.');
      }
    } catch (err) {
      console.error('Failed to remove team member:', err);
      showError('Removal failed', 'Could not remove team member.');
    } finally {
      setSaving(false);
    }
  }, [handover, showSuccess, showError, loadHandover]);

  // -- Add risk handler -----------------------------------------------------
  const handleAddRisk = useCallback(async () => {
    if (!handover || !newRisk.description) return;
    const risk: RiskAssumption = {
      id: generateHandoverId(),
      type: (newRisk.type as 'Risk' | 'Assumption') || 'Risk',
      description: newRisk.description || '',
      impact: (newRisk.impact as 'High' | 'Medium' | 'Low') || 'Medium',
      mitigation: newRisk.mitigation || '',
      owner: newRisk.owner || '',
      source: 'Delivery',
    };
    const updatedRisks = [...handover.RisksAndAssumptions, risk];
    setSaving(true);
    try {
      await deliveryHandoverService.updateHandover(handover.Id, { RisksAndAssumptions: updatedRisks });
      showSuccess('Item added', `${risk.type} has been added.`);
      setShowRiskForm(false);
      setNewRisk({ type: 'Risk', impact: 'Medium', description: '', mitigation: '', owner: '', source: 'Delivery' });
      await loadHandover();
    } catch (err) {
      console.error('Failed to add risk:', err);
      showError('Add failed', 'Could not add risk/assumption.');
    } finally {
      setSaving(false);
    }
  }, [handover, newRisk, showSuccess, showError, loadHandover]);

  // -- Remove risk handler --------------------------------------------------
  const handleRemoveRisk = useCallback(async (riskId: string) => {
    if (!handover) return;
    const updatedRisks = handover.RisksAndAssumptions.filter((r) => r.id !== riskId);
    setSaving(true);
    try {
      await deliveryHandoverService.updateHandover(handover.Id, { RisksAndAssumptions: updatedRisks });
      showSuccess('Item removed', 'Risk/assumption has been removed.');
      await loadHandover();
    } catch (err) {
      console.error('Failed to remove risk:', err);
      showError('Remove failed', 'Could not remove risk/assumption.');
    } finally {
      setSaving(false);
    }
  }, [handover, showSuccess, showError, loadHandover]);

  // -- AI generation handler ------------------------------------------------
  const generateAIBrief = useCallback(async () => {
    if (!handover) return;
    setAiLoading(true);
    try {
      const { generateClientBrief } = await import('../../services/AIPreparationService');
      const brief = await generateClientBrief({
        clientName: request.ClientName,
        serviceName: request.ServiceName,
        serviceCategory: request.ServiceCategory || '',
        dealValue: request.DealValue,
        industry: request.ClientIndustry || request.Industry,
        companySize: request.ClientCompanySize || request.CompanySize,
        winReason: request.WinLossReason,
        requirements: request.Requirements,
        contactName: request.ContactName,
        contactEmail: request.ContactEmail,
        contactPhone: request.ContactPhone,
        amName: request.AccountManagerName,
        specialistName: request.AssignedSpecialistName,
      });
      await deliveryHandoverService.saveClientBrief(handover.Id, brief);
      showSuccess('AI brief generated', 'Client brief has been generated and saved.');
      await loadHandover();
    } catch (err) {
      console.error('Failed to generate AI brief:', err);
      showError('AI generation failed', 'Could not generate client brief. Please try again.');
    } finally {
      setAiLoading(false);
    }
  }, [handover, request, showSuccess, showError, loadHandover]);

  // -- Populate from proposal handler ---------------------------------------
  const handlePopulateFromProposal = useCallback(async () => {
    if (!handover) return;
    setSaving(true);
    try {
      const { proposalService } = await import('../../services/ProposalService');
      const proposal = await proposalService.getProposalByServiceRequest(request.Id);
      if (!proposal) {
        showError('No proposal found', 'No proposal is linked to this deal.');
        return;
      }
      await deliveryHandoverService.populateFromProposal(handover.Id, proposal);
      showSuccess('Scope imported', 'Scope snapshot has been populated from the proposal.');
      await loadHandover();
    } catch (err) {
      console.error('Failed to populate from proposal:', err);
      showError('Import failed', 'Could not import scope from proposal.');
    } finally {
      setSaving(false);
    }
  }, [handover, request.Id, showSuccess, showError, loadHandover]);

  // -- Status transition buttons -------------------------------------------
  const renderStatusButtons = () => {
    if (!handover || readOnly || !isManager) return null;

    const currentStatus = handover.HandoverStatus;
    const allowedTransitions = HANDOVER_STATUS_TRANSITIONS[currentStatus] || [];

    const buttons: React.ReactNode[] = [];

    if (allowedTransitions.includes('In Progress')) {
      buttons.push(
        <Button
          key="in-progress"
          appearance="primary"
          icon={<ArrowRight24Regular />}
          disabled={saving}
          onClick={() => handleStatusTransition('In Progress')}
          style={{ backgroundColor: DW_COLORS.teal }}
        >
          Start Handover
        </Button>
      );
    }

    if (allowedTransitions.includes('Kickoff Scheduled')) {
      buttons.push(
        <Button
          key="kickoff"
          appearance="primary"
          icon={<ArrowRight24Regular />}
          disabled={saving}
          onClick={() => handleStatusTransition('Kickoff Scheduled')}
          style={{ backgroundColor: DW_COLORS.primary }}
        >
          Kickoff Scheduled
        </Button>
      );
    }

    if (allowedTransitions.includes('Delivered')) {
      buttons.push(
        <Button
          key="delivered"
          appearance="primary"
          icon={<Checkmark24Regular />}
          disabled={saving}
          onClick={() => handleStatusTransition('Delivered')}
          style={{ backgroundColor: '#8b5cf6' }}
        >
          Mark Delivered
        </Button>
      );
    }

    if (allowedTransitions.includes('Closed')) {
      buttons.push(
        <Button
          key="closed"
          appearance="primary"
          icon={<Checkmark24Regular />}
          disabled={saving}
          onClick={() => handleStatusTransition('Closed')}
          style={{ backgroundColor: DW_COLORS.success }}
        >
          Close Handover
        </Button>
      );
    }

    if (allowedTransitions.includes('On Hold')) {
      buttons.push(
        <Button
          key="on-hold"
          appearance="secondary"
          icon={<Warning24Regular />}
          disabled={saving}
          onClick={() => handleStatusTransition('On Hold')}
        >
          Put On Hold
        </Button>
      );
    }

    if (allowedTransitions.includes('Pending')) {
      buttons.push(
        <Button
          key="resume-pending"
          appearance="secondary"
          disabled={saving}
          onClick={() => handleStatusTransition('Pending')}
        >
          Resume (Pending)
        </Button>
      );
    }

    return buttons;
  };

  // -- Render scope snapshot ------------------------------------------------
  const renderScopeSnapshot = (scope: ScopeSnapshot | null) => {
    if (!scope) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: '#616161' }}>
          <Text size={200}>No scope snapshot yet.</Text>
          {isManager && !readOnly && (
            <div style={{ marginTop: '12px' }}>
              <Button
                appearance="primary"
                onClick={handlePopulateFromProposal}
                disabled={saving}
                style={{ backgroundColor: DW_COLORS.primary }}
              >
                {saving ? 'Importing...' : 'Import from Proposal'}
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        {/* Deliverables */}
        {scope.deliverables && scope.deliverables.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Deliverables
            </Text>
            <table className={styles.scopeTable}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Item</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Description</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Hours</th>
                </tr>
              </thead>
              <tbody>
                {scope.deliverables.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', fontSize: '13px', fontWeight: 500 }}>{d.title}</td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>{d.description}</td>
                    <td style={{ padding: '8px', fontSize: '13px', textAlign: 'right' }}>{d.hours || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary row */}
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '8px' }}>
          {scope.totalHours > 0 && (
            <div>
              <Text size={200} style={{ color: '#6b7280' }}>Total Hours</Text>
              <Text weight="semibold" size={300} style={{ display: 'block' }}>{scope.totalHours}h</Text>
            </div>
          )}
          {scope.totalWeeks > 0 && (
            <div>
              <Text size={200} style={{ color: '#6b7280' }}>Duration</Text>
              <Text weight="semibold" size={300} style={{ display: 'block' }}>{scope.totalWeeks} weeks</Text>
            </div>
          )}
          {scope.contractValue > 0 && (
            <div>
              <Text size={200} style={{ color: '#6b7280' }}>Contract Value</Text>
              <Text weight="semibold" size={300} style={{ display: 'block' }}>{formatCurrency(scope.contractValue)}</Text>
            </div>
          )}
          {scope.pricingModel && (
            <div>
              <Text size={200} style={{ color: '#6b7280' }}>Pricing Model</Text>
              <Text weight="semibold" size={300} style={{ display: 'block' }}>{scope.pricingModel}</Text>
            </div>
          )}
        </div>

        {/* Technologies */}
        {scope.technologies && scope.technologies.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Technology Stack
            </Text>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {scope.technologies.map((t, i) => (
                <Tooltip key={i} content={t.role} relationship="description">
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'default',
                  }}>
                    {t.name}
                  </span>
                </Tooltip>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // -- Render delivery team ------------------------------------------------
  const renderDeliveryTeam = (team: TeamAssignment[]) => {
    return (
      <div>
        {team.length === 0 && (
          <Text size={200} style={{ color: '#616161', display: 'block', textAlign: 'center', padding: '16px' }}>
            No delivery team members assigned yet.
          </Text>
        )}
        <div className={styles.teamGrid}>
          {team.map((member) => {
            const roleColor = DELIVERY_ROLE_COLORS[member.role] || { bg: '#e5e7eb', text: '#4b5563' };
            return (
              <div key={member.id} className={styles.teamCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    backgroundColor: roleColor.bg,
                    color: roleColor.text,
                  }}>
                    {member.role}
                  </span>
                  {isManager && !readOnly && (
                    <Tooltip content="Remove team member" relationship="label">
                      <Button
                        appearance="subtle"
                        icon={<Dismiss24Regular />}
                        size="small"
                        onClick={() => handleRemoveTeamMember(member.id)}
                        disabled={saving}
                      />
                    </Tooltip>
                  )}
                </div>
                <Text weight="semibold" size={300}>{member.resourceName}</Text>
                <Text size={200} style={{ color: '#616161' }}>{member.resourceEmail}</Text>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <Text size={200} style={{ color: '#6b7280' }}>
                    Allocation: <strong>{member.allocationPercent}%</strong>
                  </Text>
                  {member.startDate && (
                    <Text size={200} style={{ color: '#6b7280' }}>
                      From: {formatDate(member.startDate)}
                    </Text>
                  )}
                  {member.endDate && (
                    <Text size={200} style={{ color: '#6b7280' }}>
                      To: {formatDate(member.endDate)}
                    </Text>
                  )}
                </div>
                {member.responsibilities && (
                  <Text size={200} style={{ color: '#4b5563', marginTop: '4px' }}>{member.responsibilities}</Text>
                )}
              </div>
            );
          })}
        </div>

        {/* Inline add form */}
        {isManager && !readOnly && (
          <div style={{ marginTop: '12px' }}>
            {!showTeamForm ? (
              <Button
                appearance="secondary"
                icon={<PersonAdd24Regular />}
                onClick={() => setShowTeamForm(true)}
              >
                Add Team Member
              </Button>
            ) : (
              <div style={{
                padding: '16px',
                border: '1px solid #dbeafe',
                borderRadius: '8px',
                backgroundColor: '#f0f7ff',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Text weight="semibold" size={300}>Assign Resource</Text>
                  <Button appearance="subtle" icon={<Dismiss24Regular />} size="small" onClick={() => setShowTeamForm(false)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Text size={200} style={{ color: '#4b5563' }}>Name *</Text>
                    <Input
                      value={newTeamMember.resourceName || ''}
                      onChange={(_, d) => setNewTeamMember({ ...newTeamMember, resourceName: d.value })}
                      placeholder="Full name"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <Text size={200} style={{ color: '#4b5563' }}>Email</Text>
                    <Input
                      value={newTeamMember.resourceEmail || ''}
                      onChange={(_, d) => setNewTeamMember({ ...newTeamMember, resourceEmail: d.value })}
                      placeholder="Email address"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <Text size={200} style={{ color: '#4b5563' }}>Role</Text>
                    <Dropdown
                      value={newTeamMember.role || 'Developer'}
                      selectedOptions={[newTeamMember.role || 'Developer']}
                      onOptionSelect={(_, d) => setNewTeamMember({ ...newTeamMember, role: d.optionValue as DeliveryRole })}
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      {DELIVERY_ROLES.map((role) => (
                        <Option key={role} value={role}>{role}</Option>
                      ))}
                    </Dropdown>
                  </div>
                  <div>
                    <Text size={200} style={{ color: '#4b5563' }}>Allocation %</Text>
                    <Input
                      type="number"
                      value={String(newTeamMember.allocationPercent || 100)}
                      onChange={(_, d) => setNewTeamMember({ ...newTeamMember, allocationPercent: Number(d.value) || 0 })}
                      min={0}
                      max={100}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Text size={200} style={{ color: '#4b5563' }}>Responsibilities</Text>
                    <Input
                      value={newTeamMember.responsibilities || ''}
                      onChange={(_, d) => setNewTeamMember({ ...newTeamMember, responsibilities: d.value })}
                      placeholder="Key responsibilities on this project"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button
                    appearance="primary"
                    icon={<Add24Regular />}
                    onClick={handleAddTeamMember}
                    disabled={saving || !newTeamMember.resourceName}
                    style={{ backgroundColor: DW_COLORS.primary }}
                  >
                    {saving ? 'Adding...' : 'Add'}
                  </Button>
                  <Button
                    appearance="secondary"
                    onClick={() => setShowTeamForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // -- Render checklist ----------------------------------------------------
  const renderChecklist = (checklist: HandoverChecklistItem[]) => {
    const summary = getHandoverChecklistSummary(checklist);

    return (
      <div>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <ProgressBar
            value={summary.percentage / 100}
            thickness="large"
            style={{ flex: 1 }}
          />
          <Text size={200} weight="semibold" style={{ color: '#4b5563', minWidth: '60px', textAlign: 'right' }}>
            {summary.completed}/{summary.total} ({summary.percentage}%)
          </Text>
        </div>

        {/* Items grouped by category */}
        {HANDOVER_CHECKLIST_CATEGORIES.map((category) => {
          const catSummary = summary.byCategory[category];
          if (!catSummary || catSummary.total === 0) return null;

          const categoryItems = checklist.filter((item) => item.category === category);

          return (
            <div key={category} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Text weight="semibold" size={200} style={{ color: '#4b5563' }}>{category}</Text>
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  backgroundColor: catSummary.completed === catSummary.total ? '#d1fae5' : '#f3f4f6',
                  color: catSummary.completed === catSummary.total ? '#065f46' : '#6b7280',
                }}>
                  {catSummary.completed}/{catSummary.total}
                </span>
              </div>
              {categoryItems.map((item) => (
                <div key={item.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '6px 0',
                  borderBottom: '1px solid #f3f4f6',
                }}>
                  <Checkbox
                    checked={item.isCompleted}
                    onChange={(_, data) => handleChecklistToggle(item.id, !!data.checked)}
                    disabled={readOnly}
                  />
                  <div style={{ flex: 1 }}>
                    <Text size={200} style={{
                      color: item.isCompleted ? '#9ca3af' : '#1f2937',
                      textDecoration: item.isCompleted ? 'line-through' : 'none',
                    }}>
                      {item.description}
                      {item.isRequired && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
                    </Text>
                    {item.isCompleted && item.completedBy && (
                      <Text size={100} style={{ color: '#9ca3af', display: 'block', marginTop: '2px' }}>
                        Completed by {item.completedBy}
                        {item.completedAt && ` on ${formatDate(item.completedAt)}`}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Legend */}
        <Text size={100} style={{ color: '#9ca3af', marginTop: '8px', display: 'block' }}>
          <span style={{ color: '#ef4444' }}>*</span> Required items must be completed before handover can be closed.
        </Text>
      </div>
    );
  };

  // -- Render client brief --------------------------------------------------
  const renderClientBrief = (brief: ClientBrief | null) => {
    if (!brief) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: '#616161' }}>
          <Text size={200}>No client brief generated yet.</Text>
          {!readOnly && (
            <div style={{ marginTop: '12px' }}>
              <Button
                appearance="primary"
                icon={<Sparkle24Regular />}
                onClick={generateAIBrief}
                disabled={aiLoading}
                style={{ backgroundColor: DW_COLORS.teal }}
              >
                {aiLoading ? 'Generating...' : 'Generate AI Brief'}
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        {/* Executive Summary */}
        {brief.executiveSummary && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Executive Summary
            </Text>
            <Text size={300} style={{ display: 'block', marginTop: '6px', lineHeight: '1.5' }}>
              {brief.executiveSummary}
            </Text>
          </div>
        )}

        {/* Client Context */}
        {brief.clientContext && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Client Context
            </Text>
            <Text size={200} style={{ display: 'block', marginTop: '6px', lineHeight: '1.5', color: '#374151' }}>
              {brief.clientContext}
            </Text>
          </div>
        )}

        {/* Key Stakeholders */}
        {brief.keyStakeholders && brief.keyStakeholders.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Key Stakeholders
            </Text>
            <div style={{ marginTop: '8px' }}>
              {brief.keyStakeholders.map((s, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '8px 12px',
                  borderLeft: '3px solid #3b82f6',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0 4px 4px 0',
                  marginBottom: '8px',
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Text weight="semibold" size={200}>{s.name}</Text>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>{s.role}</span>
                  </div>
                  <Text size={200} style={{ color: '#4b5563' }}>{s.relationship}</Text>
                  {s.notes && <Text size={100} style={{ color: '#6b7280', fontStyle: 'italic' }}>{s.notes}</Text>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Communication Preferences */}
        {brief.communicationPreferences && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Communication Preferences
            </Text>
            <Text size={200} style={{ display: 'block', marginTop: '6px', color: '#374151' }}>
              {brief.communicationPreferences}
            </Text>
          </div>
        )}

        {/* Critical Success Factors */}
        {brief.criticalSuccessFactors && brief.criticalSuccessFactors.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Critical Success Factors
            </Text>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
              {brief.criticalSuccessFactors.map((f, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Potential Risks */}
        {brief.potentialRisks && brief.potentialRisks.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Potential Risks
            </Text>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
              {brief.potentialRisks.map((r, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Win Reason */}
        {brief.winReason && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Why the Client Chose DW
            </Text>
            <Text size={200} style={{ display: 'block', marginTop: '6px', color: '#374151' }}>
              {brief.winReason}
            </Text>
          </div>
        )}

        {/* Regenerate button */}
        {!readOnly && (
          <div style={{ marginTop: '12px' }}>
            <Button
              appearance="secondary"
              icon={<Sparkle24Regular />}
              onClick={generateAIBrief}
              disabled={aiLoading}
            >
              {aiLoading ? 'Regenerating...' : 'Regenerate AI Brief'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // -- Render risks & assumptions -------------------------------------------
  const renderRisks = (risks: RiskAssumption[]) => {
    const IMPACT_COLORS: Record<string, { bg: string; text: string }> = {
      'High': { bg: '#fee2e2', text: '#991b1b' },
      'Medium': { bg: '#fef3c7', text: '#92400e' },
      'Low': { bg: '#d1fae5', text: '#065f46' },
    };

    return (
      <div>
        {risks.length === 0 && (
          <Text size={200} style={{ color: '#616161', display: 'block', textAlign: 'center', padding: '16px' }}>
            No risks or assumptions recorded yet.
          </Text>
        )}
        {risks.length > 0 && (
          <table className={styles.riskTable}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280', width: '60px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280', width: '70px' }}>Impact</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Mitigation</th>
                <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280', width: '70px' }}>Source</th>
                {isManager && !readOnly && (
                  <th style={{ width: '40px', padding: '8px' }}></th>
                )}
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => {
                const impactColor = IMPACT_COLORS[risk.impact] || IMPACT_COLORS['Medium'];
                return (
                  <tr key={risk.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: risk.type === 'Risk' ? '#fee2e2' : '#dbeafe',
                        color: risk.type === 'Risk' ? '#991b1b' : '#1e40af',
                      }}>
                        {risk.type}
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontSize: '13px' }}>{risk.description}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: impactColor.bg,
                        color: impactColor.text,
                      }}>
                        {risk.impact}
                      </span>
                    </td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>{risk.mitigation || '-'}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{risk.source}</span>
                    </td>
                    {isManager && !readOnly && (
                      <td style={{ padding: '8px' }}>
                        {risk.source === 'Delivery' && (
                          <Tooltip content="Remove" relationship="label">
                            <Button
                              appearance="subtle"
                              icon={<Delete24Regular />}
                              size="small"
                              onClick={() => handleRemoveRisk(risk.id)}
                              disabled={saving}
                            />
                          </Tooltip>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Inline add form */}
        {isManager && !readOnly && (
          <div style={{ marginTop: '12px' }}>
            {!showRiskForm ? (
              <Button
                appearance="secondary"
                icon={<Add24Regular />}
                onClick={() => setShowRiskForm(true)}
              >
                Add Risk / Assumption
              </Button>
            ) : (
              <div style={{
                padding: '16px',
                border: '1px solid #dbeafe',
                borderRadius: '8px',
                backgroundColor: '#f0f7ff',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <Text weight="semibold" size={300}>New Risk / Assumption</Text>
                  <Button appearance="subtle" icon={<Dismiss24Regular />} size="small" onClick={() => setShowRiskForm(false)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <Text size={200} style={{ color: '#4b5563' }}>Type</Text>
                    <Dropdown
                      value={newRisk.type || 'Risk'}
                      selectedOptions={[newRisk.type || 'Risk']}
                      onOptionSelect={(_, d) => setNewRisk({ ...newRisk, type: d.optionValue as 'Risk' | 'Assumption' })}
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      <Option value="Risk">Risk</Option>
                      <Option value="Assumption">Assumption</Option>
                    </Dropdown>
                  </div>
                  <div>
                    <Text size={200} style={{ color: '#4b5563' }}>Impact</Text>
                    <Dropdown
                      value={newRisk.impact || 'Medium'}
                      selectedOptions={[newRisk.impact || 'Medium']}
                      onOptionSelect={(_, d) => setNewRisk({ ...newRisk, impact: d.optionValue as 'High' | 'Medium' | 'Low' })}
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      <Option value="High">High</Option>
                      <Option value="Medium">Medium</Option>
                      <Option value="Low">Low</Option>
                    </Dropdown>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Text size={200} style={{ color: '#4b5563' }}>Description *</Text>
                    <Textarea
                      value={newRisk.description || ''}
                      onChange={(_, d) => setNewRisk({ ...newRisk, description: d.value })}
                      placeholder="Describe the risk or assumption"
                      rows={2}
                      resize="vertical"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Text size={200} style={{ color: '#4b5563' }}>Mitigation / Validation</Text>
                    <Input
                      value={newRisk.mitigation || ''}
                      onChange={(_, d) => setNewRisk({ ...newRisk, mitigation: d.value })}
                      placeholder="Mitigation strategy or how to validate"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <Text size={200} style={{ color: '#4b5563' }}>Owner</Text>
                    <Input
                      value={newRisk.owner || ''}
                      onChange={(_, d) => setNewRisk({ ...newRisk, owner: d.value })}
                      placeholder="Who owns this item"
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button
                    appearance="primary"
                    icon={<Add24Regular />}
                    onClick={handleAddRisk}
                    disabled={saving || !newRisk.description}
                    style={{ backgroundColor: DW_COLORS.primary }}
                  >
                    {saving ? 'Adding...' : 'Add'}
                  </Button>
                  <Button
                    appearance="secondary"
                    onClick={() => setShowRiskForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // -- Render environment setup ---------------------------------------------
  const renderEnvironmentSetup = () => {
    const handleEnvChange = (index: number, field: keyof EnvironmentEntry, value: string) => {
      const updated = [...envSetup.environments];
      updated[index] = { ...updated[index], [field]: value };
      setEnvSetup({ ...envSetup, environments: updated });
      setHasUnsavedChanges(true);
    };

    return (
      <div>
        {/* Environments grid */}
        <div className={styles.envGrid}>
          {envSetup.environments.map((env, i) => (
            <div key={env.name} style={{
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fafafa',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text weight="semibold" size={200}>{env.name}</Text>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: env.status === 'Ready' ? '#d1fae5' : env.status === 'In Progress' ? '#fef3c7' : '#f3f4f6',
                  color: env.status === 'Ready' ? '#065f46' : env.status === 'In Progress' ? '#92400e' : '#6b7280',
                }}>
                  {env.status}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Input
                  value={env.url}
                  onChange={(_, d) => handleEnvChange(i, 'url', d.value)}
                  placeholder="Environment URL"
                  size="small"
                  disabled={readOnly}
                  style={{ width: '100%' }}
                />
                {!readOnly && (
                  <Dropdown
                    value={env.status}
                    selectedOptions={[env.status]}
                    onOptionSelect={(_, d) => handleEnvChange(i, 'status', d.optionValue || 'Not Started')}
                    size="small"
                    style={{ width: '100%' }}
                  >
                    <Option value="Not Started">Not Started</Option>
                    <Option value="In Progress">In Progress</Option>
                    <Option value="Ready">Ready</Option>
                  </Dropdown>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Repo + CI/CD */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          <div>
            <Text size={200} style={{ color: '#4b5563' }}>Repository URL</Text>
            <Input
              value={envSetup.repositoryUrl}
              onChange={(_, d) => { setEnvSetup({ ...envSetup, repositoryUrl: d.value }); setHasUnsavedChanges(true); }}
              placeholder="https://github.com/..."
              disabled={readOnly}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
          <div>
            <Text size={200} style={{ color: '#4b5563' }}>CI/CD Pipeline</Text>
            <Input
              value={envSetup.cicdPipeline}
              onChange={(_, d) => { setEnvSetup({ ...envSetup, cicdPipeline: d.value }); setHasUnsavedChanges(true); }}
              placeholder="Azure DevOps / GitHub Actions URL"
              disabled={readOnly}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
        </div>
      </div>
    );
  };

  // -- Render ---------------------------------------------------------------
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" label="Loading delivery handover..." />
      </div>
    );
  }

  if (!handover) {
    return (
      <div className={styles.emptyState}>
        <Text size={300} weight="semibold">No delivery handover record found for this deal.</Text>
        <Text size={200} style={{ color: '#616161', marginBottom: '16px' }}>
          Create a handover record to begin the pre-sales to delivery transition.
        </Text>
        {isManager && (
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={handleCreateHandover}
            disabled={creating}
            style={{ backgroundColor: DW_COLORS.primary }}
          >
            {creating ? <><Spinner size="tiny" />&nbsp;Creating...</> : 'Create Handover'}
          </Button>
        )}
      </div>
    );
  }

  const statusColors = HANDOVER_STATUS_COLORS[handover.HandoverStatus];
  const daysSinceWon = handover.WonDate ? getHandoverDaysSinceWon(handover.WonDate) : 0;
  const checklistSummary = getHandoverChecklistSummary(handover.HandoverChecklist);

  return (
    <div className={styles.container}>
      {/* ===== Status Bar ===== */}
      <div className={styles.headerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: statusColors.bg,
            color: statusColors.text,
          }}>
            {handover.HandoverStatus}
          </span>
          <span style={{ fontSize: '13px', color: '#616161' }}>
            {daysSinceWon} business day{daysSinceWon !== 1 ? 's' : ''} since Won
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            Checklist: {checklistSummary.completed}/{checklistSummary.total} ({checklistSummary.percentage}%)
          </span>
          <ProgressBar
            value={checklistSummary.percentage / 100}
            style={{ width: '120px' }}
          />
        </div>
        <div className={styles.buttonGroup}>
          {!readOnly && (
            <Button
              appearance="primary"
              icon={<Save24Regular />}
              disabled={!hasUnsavedChanges || saving}
              onClick={handleSave}
              style={{ backgroundColor: DW_COLORS.primary }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
          {renderStatusButtons()}
        </div>
      </div>

      {/* ===== AI Loading Banner ===== */}
      {aiLoading && (
        <div className={styles.progressBanner}>
          <Spinner size="tiny" />
          <Text size={200}>Generating AI client brief... This may take a moment.</Text>
        </div>
      )}

      {/* ===== Scope Snapshot ===== */}
      <SectionCard
        title="Scope Snapshot"
        count={handover.ScopeSnapshot?.deliverables?.length}
        defaultOpen={true}
      >
        {renderScopeSnapshot(handover.ScopeSnapshot)}
      </SectionCard>

      {/* ===== Delivery Team ===== */}
      <SectionCard
        title="Delivery Team"
        count={handover.DeliveryTeam.length}
        defaultOpen={true}
      >
        {renderDeliveryTeam(handover.DeliveryTeam)}
      </SectionCard>

      {/* ===== Handover Checklist ===== */}
      <SectionCard
        title="Handover Checklist"
        count={handover.HandoverChecklist.length}
        defaultOpen={true}
      >
        {renderChecklist(handover.HandoverChecklist)}
      </SectionCard>

      {/* ===== Client Brief ===== */}
      <SectionCard
        title="Client Brief"
        defaultOpen={true}
      >
        {renderClientBrief(handover.ClientBrief)}
      </SectionCard>

      {/* ===== Risks & Assumptions ===== */}
      <SectionCard
        title="Risks & Assumptions"
        count={handover.RisksAndAssumptions.length}
        defaultOpen={false}
      >
        {renderRisks(handover.RisksAndAssumptions)}
      </SectionCard>

      {/* ===== Environment Setup ===== */}
      <SectionCard
        title="Environment Setup"
        defaultOpen={false}
      >
        {renderEnvironmentSetup()}
      </SectionCard>

      {/* ===== Notes ===== */}
      <SectionCard
        title="Notes"
        defaultOpen={false}
      >
        <div className={styles.notesGrid}>
          <div className={styles.noteColumn}>
            <Text weight="semibold" size={300}>Pre-Sales Notes</Text>
            <Textarea
              value={handover.PreSalesNotes || ''}
              disabled
              placeholder="No pre-sales notes."
              resize="vertical"
              rows={3}
            />
          </div>
          <div className={styles.noteColumn}>
            <Text weight="semibold" size={300}>Delivery Notes</Text>
            <Textarea
              value={deliveryNotes}
              onChange={(_, d) => { setDeliveryNotes(d.value); setHasUnsavedChanges(true); }}
              disabled={readOnly}
              placeholder="Notes from the delivery team..."
              resize="vertical"
              rows={3}
            />
          </div>
          <div className={styles.noteColumn}>
            <Text weight="semibold" size={300}>Client Expectations</Text>
            <Textarea
              value={clientExpectations}
              onChange={(_, d) => { setClientExpectations(d.value); setHasUnsavedChanges(true); }}
              disabled={readOnly}
              placeholder="Key client expectations and constraints..."
              resize="vertical"
              rows={3}
            />
          </div>
          <div className={styles.noteColumn}>
            <Text weight="semibold" size={300}>Handover Meeting Notes</Text>
            <Textarea
              value={handoverMeetingNotes}
              onChange={(_, d) => { setHandoverMeetingNotes(d.value); setHasUnsavedChanges(true); }}
              disabled={readOnly}
              placeholder="Notes from the handover meeting..."
              resize="vertical"
              rows={3}
            />
          </div>
        </div>
      </SectionCard>

      {/* ===== AI Timestamp ===== */}
      {handover.AIGeneratedAt && (
        <div className={styles.aiTimestamp}>
          <Text size={200} style={{ color: '#616161' }}>
            AI brief generated: {format(new Date(handover.AIGeneratedAt), 'MMM d, yyyy h:mm a')}
          </Text>
        </div>
      )}
    </div>
  );
};

export default DeliveryHandoverTab;
