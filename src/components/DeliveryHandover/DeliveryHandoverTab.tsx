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
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogActions,
  DialogContent,
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
  SlideLayout24Regular,
  Timer24Regular,
  Play24Regular,
  Shield24Regular,
  DocumentCheckmark24Regular,
  Star24Filled,
  Star24Regular,
} from '@fluentui/react-icons';
import { format } from 'date-fns';
import { ServiceRequest } from '../../types/ServiceRequest';
import { deliveryHandoverService } from '../../services/DeliveryHandoverService';
import { deliveryAnalyticsService } from '../../services/DeliveryAnalyticsService';
import type { CSATEntry } from '../../types/DeliveryAnalytics';
import { CSAT_CATEGORIES } from '../../types/DeliveryAnalytics';
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
  ProjectPlan,
  MILESTONE_STATUS_COLORS,
  PROJECT_HEALTH_STATUS_COLORS,
  SIGN_OFF_STATUS_COLORS,
  SIGN_OFF_STATUS_TRANSITIONS,
  DeliverableSignOff,
  FinalHandoverSignOff,
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
  const [generatingDeck, setGeneratingDeck] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);

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

  // Deliverable sign-off
  const [rejectingDeliverable, setRejectingDeliverable] = useState<DeliverableSignOff | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showFinalSignOff, setShowFinalSignOff] = useState(false);
  const [finalSignOffData, setFinalSignOffData] = useState<FinalHandoverSignOff>({
    clientSignatory: '',
    clientTitle: '',
    dwSignatory: user?.displayName || '',
    dwTitle: '',
    signedDate: null,
    clientFeedback: '',
    overallRating: 0,
    isComplete: false,
  });

  // CSAT rating widget state
  const [csatScore, setCsatScore] = useState<number>(0);
  const [csatFeedback, setCsatFeedback] = useState('');
  const [csatCategoryScores, setCsatCategoryScores] = useState<Record<string, number>>({});
  const [csatSubmitting, setCsatSubmitting] = useState(false);

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

  // Initialize CSAT state from handover data
  useEffect(() => {
    if (handover?.CSAT) {
      setCsatScore(handover.CSAT.overallScore);
      setCsatFeedback(handover.CSAT.feedback);
      const catMap: Record<string, number> = {};
      handover.CSAT.categories?.forEach(c => { catMap[c.name] = c.score; });
      setCsatCategoryScores(catMap);
    }
  }, [handover?.CSAT]);

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

  // -- Download PPTX deck --------------------------------------------------
  const handleDownloadDeck = useCallback(async () => {
    if (!handover) return;
    setGeneratingDeck(true);
    try {
      const { generateHandoverPptx } = await import('../../utils/handoverPptxGenerator');
      await generateHandoverPptx({ handover, request });
      showSuccess('Handover deck downloaded');
    } catch (err) {
      console.error('[DeliveryHandoverTab] PPTX generation failed:', err);
      showError('Failed to generate handover deck');
    } finally {
      setGeneratingDeck(false);
    }
  }, [handover, request, showSuccess, showError]);

  // -- AI project plan generation handler ----------------------------------
  const generateAIProjectPlan = useCallback(async () => {
    if (!handover) return;
    setGeneratingPlan(true);
    try {
      const { generateProjectPlan } = await import('../../services/AIPreparationService');
      const plan = await generateProjectPlan({
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
        scopeSnapshot: handover.ScopeSnapshot,
        deliveryTeam: handover.DeliveryTeam,
        successFactors: handover.ClientBrief?.criticalSuccessFactors || [],
        risks: handover.RisksAndAssumptions.map((r) => `${r.type}: ${r.description} (${r.impact})`),
      });
      await deliveryHandoverService.saveProjectPlan(handover.Id, plan);
      showSuccess('AI project plan generated', 'Project plan has been generated and saved.');
      await loadHandover();
    } catch (err) {
      console.error('Failed to generate AI project plan:', err);
      showError('AI generation failed', 'Could not generate project plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  }, [handover, request, showSuccess, showError, loadHandover]);

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

  // -- CSAT submit handler ---------------------------------------------------
  const handleCSATSubmit = async () => {
    if (!handover || csatScore === 0) return;
    setCsatSubmitting(true);
    try {
      const csatEntry: CSATEntry = {
        overallScore: csatScore,
        feedback: csatFeedback,
        submittedBy: user?.displayName || user?.email || '',
        submittedDate: new Date().toISOString(),
        categories: CSAT_CATEGORIES.map(name => ({
          name,
          score: csatCategoryScores[name] || 0,
        })),
      };
      const result = await deliveryAnalyticsService.recordCSAT(handover.Id, csatEntry);
      if (result.success) {
        showSuccess('CSAT Recorded', 'Thank you for submitting client feedback');
        await loadHandover();
      } else {
        showError('CSAT Error', result.error || 'Failed to record CSAT');
      }
    } catch (error) {
      showError('Error', 'Failed to record CSAT rating');
    } finally {
      setCsatSubmitting(false);
    }
  };

  // -- Render CSAT widget ---------------------------------------------------
  const renderCSATWidget = () => {
    if (!handover) return null;

    const isSubmitted = handover.CSAT && handover.CSAT.overallScore > 0;

    // Helper: render a row of 5 stars for a given score + click handler
    const renderStarRow = (
      score: number,
      onSelect?: (value: number) => void,
      size: number = 20
    ) => (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(v => (
          <div
            key={v}
            role={onSelect ? 'button' : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(v)}
            onKeyDown={(e) => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) onSelect(v); }}
            style={{
              cursor: onSelect ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {v <= score ? (
              <Star24Filled style={{ color: '#f59e0b', fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }} />
            ) : (
              <Star24Regular style={{ color: '#d1d5db', fontSize: `${size}px`, width: `${size}px`, height: `${size}px` }} />
            )}
          </div>
        ))}
      </div>
    );

    if (isSubmitted) {
      // Read-only display
      const csat = handover.CSAT!;
      return (
        <div>
          {/* Overall score */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Text weight="semibold" size={300}>Overall Rating</Text>
            {renderStarRow(csat.overallScore)}
            <Text size={300} style={{ color: '#6b7280' }}>{csat.overallScore}/5</Text>
          </div>

          {/* Category scores */}
          {csat.categories && csat.categories.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <Text weight="semibold" size={200} style={{ display: 'block', marginBottom: '8px', color: '#6b7280' }}>
                Category Scores
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {csat.categories.filter(c => c.score > 0).map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text size={200} style={{ width: '120px', color: '#4b5563' }}>{c.name}</Text>
                    {renderStarRow(c.score, undefined, 16)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback */}
          {csat.feedback && (
            <div style={{ marginBottom: '12px' }}>
              <Text size={200} style={{ display: 'block', fontStyle: 'italic', color: '#4b5563', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px', borderLeft: '3px solid #f59e0b' }}>
                &ldquo;{csat.feedback}&rdquo;
              </Text>
            </div>
          )}

          {/* Submitted info */}
          <Text size={200} style={{ color: '#9ca3af' }}>
            Submitted by {csat.submittedBy} on {csat.submittedDate ? format(new Date(csat.submittedDate), 'MMM d, yyyy h:mm a') : 'N/A'}
          </Text>
        </div>
      );
    }

    // Editable form
    return (
      <div>
        <Text weight="semibold" size={400} style={{ display: 'block', marginBottom: '16px' }}>
          Rate this delivery
        </Text>

        {/* Overall score */}
        <div style={{ marginBottom: '20px' }}>
          <Text size={300} style={{ display: 'block', marginBottom: '8px' }}>Overall Score</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {renderStarRow(csatScore, (v) => setCsatScore(v), 28)}
            {csatScore > 0 && (
              <Text size={300} style={{ color: '#6b7280', marginLeft: '4px' }}>{csatScore}/5</Text>
            )}
          </div>
        </div>

        {/* Category scores */}
        <div style={{ marginBottom: '20px' }}>
          <Text size={300} style={{ display: 'block', marginBottom: '8px' }}>Category Scores</Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {CSAT_CATEGORIES.map(name => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text size={200} style={{ width: '140px', color: '#4b5563' }}>{name}</Text>
                {renderStarRow(
                  csatCategoryScores[name] || 0,
                  (v) => setCsatCategoryScores(prev => ({ ...prev, [name]: v })),
                  20
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback */}
        <div style={{ marginBottom: '20px' }}>
          <Text size={300} style={{ display: 'block', marginBottom: '8px' }}>Client Feedback</Text>
          <Textarea
            value={csatFeedback}
            onChange={(_, d) => setCsatFeedback(d.value)}
            placeholder="Enter client feedback and comments..."
            resize="vertical"
            rows={3}
          />
        </div>

        {/* Submit */}
        <Button
          appearance="primary"
          disabled={csatScore === 0 || csatSubmitting}
          onClick={handleCSATSubmit}
          icon={csatSubmitting ? <Spinner size="tiny" /> : <Star24Filled />}
        >
          {csatSubmitting ? 'Submitting...' : 'Submit CSAT Rating'}
        </Button>
      </div>
    );
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

  // -- Render project plan --------------------------------------------------
  const renderProjectPlan = (plan: ProjectPlan | null | undefined) => {
    if (!plan) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: '#616161' }}>
          <Text size={200}>No project plan generated yet.</Text>
          {!readOnly && (
            <div style={{ marginTop: '12px' }}>
              <Button
                appearance="primary"
                icon={generatingPlan ? <Spinner size="tiny" /> : <Sparkle24Regular />}
                onClick={generateAIProjectPlan}
                disabled={generatingPlan}
                style={{ backgroundColor: DW_COLORS.teal }}
              >
                {generatingPlan ? 'Generating...' : 'Generate AI Plan'}
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        {/* Summary bar */}
        <div style={{
          display: 'flex',
          gap: '24px',
          flexWrap: 'wrap',
          padding: '12px 16px',
          backgroundColor: '#f0fdfa',
          borderRadius: '8px',
          border: '1px solid #99f6e4',
          marginBottom: '16px',
        }}>
          <div>
            <Text size={200} style={{ color: '#6b7280' }}>Duration</Text>
            <Text weight="semibold" size={300} style={{ display: 'block' }}>{plan.totalWeeks} weeks</Text>
          </div>
          <div>
            <Text size={200} style={{ color: '#6b7280' }}>Total Effort</Text>
            <Text weight="semibold" size={300} style={{ display: 'block' }}>{plan.totalHours} hours</Text>
          </div>
          <div>
            <Text size={200} style={{ color: '#6b7280' }}>Phases</Text>
            <Text weight="semibold" size={300} style={{ display: 'block' }}>{plan.phases.length}</Text>
          </div>
          <div>
            <Text size={200} style={{ color: '#6b7280' }}>Milestones</Text>
            <Text weight="semibold" size={300} style={{ display: 'block' }}>{plan.milestones.length}</Text>
          </div>
          <div>
            <Text size={200} style={{ color: '#6b7280' }}>Risk Buffer</Text>
            <Text weight="semibold" size={300} style={{ display: 'block' }}>{plan.riskBuffer}%</Text>
          </div>
        </div>

        {/* Phase Timeline */}
        {plan.phases.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Phase Timeline
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Phase</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Description</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Weeks</th>
                  <th style={{ textAlign: 'center', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Tasks</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Effort</th>
                </tr>
              </thead>
              <tbody>
                {plan.phases.map((phase, i) => {
                  const phaseHours = phase.tasks?.reduce((sum, t) => sum + (t.estimatedHours || 0), 0) || 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px', fontSize: '13px', fontWeight: 500 }}>{phase.name}</td>
                      <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>{phase.description}</td>
                      <td style={{ padding: '8px', fontSize: '13px', textAlign: 'center' }}>Wk {phase.startWeek}–{phase.endWeek}</td>
                      <td style={{ padding: '8px', fontSize: '13px', textAlign: 'center' }}>{phase.tasks?.length || 0}</td>
                      <td style={{ padding: '8px', fontSize: '13px', textAlign: 'right' }}>{phaseHours}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Critical Path */}
        {plan.criticalPath && plan.criticalPath.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Critical Path
            </Text>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
              {plan.criticalPath.map((phase, i) => (
                <React.Fragment key={i}>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {phase}
                  </span>
                  {i < plan.criticalPath.length - 1 && (
                    <span style={{ color: '#9ca3af', fontSize: '14px' }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Resource Allocation */}
        {plan.resourceAllocation && plan.resourceAllocation.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resource Allocation
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Role</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Name</th>
                  <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Hours</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Phases</th>
                </tr>
              </thead>
              <tbody>
                {plan.resourceAllocation.map((res, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', fontSize: '13px', fontWeight: 500 }}>{res.role}</td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>{res.name}</td>
                    <td style={{ padding: '8px', fontSize: '13px', textAlign: 'right' }}>{res.totalHours}h</td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>
                      {res.phases.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RACI Matrix */}
        {plan.raci && plan.raci.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              RACI Matrix
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Deliverable</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Responsible</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Accountable</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Consulted</th>
                  <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', color: '#6b7280' }}>Informed</th>
                </tr>
              </thead>
              <tbody>
                {plan.raci.map((entry, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px', fontSize: '13px', fontWeight: 500 }}>{entry.deliverable}</td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>{entry.responsible}</td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>{entry.accountable}</td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>{entry.consulted.join(', ')}</td>
                    <td style={{ padding: '8px', fontSize: '13px', color: '#4b5563' }}>{entry.informed.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Milestones */}
        {plan.milestones && plan.milestones.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Milestones
            </Text>
            <div style={{ marginTop: '8px' }}>
              {plan.milestones.map((ms, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '8px 12px',
                  borderLeft: '3px solid #1e6b7b',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0 4px 4px 0',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}>
                    Wk {ms.week}
                  </span>
                  <div style={{ flex: 1 }}>
                    <Text weight="semibold" size={200}>{ms.name}</Text>
                    {ms.deliverables.length > 0 && (
                      <Text size={200} style={{ color: '#4b5563', display: 'block', marginTop: '2px' }}>
                        Deliverables: {ms.deliverables.join(', ')}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assumptions */}
        {plan.assumptions && plan.assumptions.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text weight="semibold" size={200} style={{ color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assumptions
            </Text>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
              {plan.assumptions.map((a, i) => (
                <li key={i} style={{ fontSize: '13px', color: '#374151', marginBottom: '4px' }}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Regenerate button */}
        {!readOnly && (
          <div style={{ marginTop: '12px' }}>
            <Button
              appearance="secondary"
              icon={generatingPlan ? <Spinner size="tiny" /> : <Sparkle24Regular />}
              onClick={generateAIProjectPlan}
              disabled={generatingPlan}
            >
              {generatingPlan ? 'Regenerating...' : 'Regenerate AI Plan'}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // -- Render project health card (v2.17.0) ---------------------------------
  const renderProjectHealth = () => {
    const health = handover?.ProjectHealth;
    if (!health) {
      return (
        <div style={{ textAlign: 'center', padding: '16px', color: '#616161' }}>
          <Text size={200}>No health data yet. Initialize milestone tracking from the Project Plan first.</Text>
        </div>
      );
    }

    const statusColors = PROJECT_HEALTH_STATUS_COLORS[health.status];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Health score + status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: statusColors.bg,
            border: `3px solid ${statusColors.accent}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text weight="bold" size={500} style={{ color: statusColors.text }}>{health.overallScore}</Text>
          </div>
          <div>
            <div style={{
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: statusColors.bg,
              color: statusColors.text,
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-block',
            }}>
              {health.status}
            </div>
            {health.lastUpdated && (
              <Text size={100} style={{ display: 'block', color: '#9ca3af', marginTop: '4px' }}>
                Last updated: {formatDate(health.lastUpdated)}
              </Text>
            )}
          </div>
        </div>

        {/* Factor breakdown bars */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <Text size={200} weight="semibold">Milestones</Text>
            <ProgressBar
              value={health.milestoneProgress / 100}
              thickness="large"
              color={health.milestoneProgress >= 70 ? 'success' : health.milestoneProgress >= 40 ? 'warning' : 'error'}
            />
            <Text size={100} style={{ color: '#6b7280' }}>{health.milestoneProgress}% complete</Text>
          </div>
          <div>
            <Text size={200} weight="semibold">Checklist</Text>
            <ProgressBar
              value={health.checklistProgress / 100}
              thickness="large"
              color={health.checklistProgress >= 70 ? 'success' : health.checklistProgress >= 40 ? 'warning' : 'error'}
            />
            <Text size={100} style={{ color: '#6b7280' }}>{health.checklistProgress}% complete</Text>
          </div>
          <div>
            <Text size={200} weight="semibold">Overdue</Text>
            <div style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: health.overdueCount > 0 ? '#fee2e2' : '#d1fae5',
              color: health.overdueCount > 0 ? '#991b1b' : '#065f46',
              fontSize: '14px',
              fontWeight: 600,
              textAlign: 'center',
              marginTop: '4px',
            }}>
              {health.overdueCount} milestone{health.overdueCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -- Render milestone progress (v2.17.0) ---------------------------------
  const renderMilestoneProgress = () => {
    if (!handover) return null;

    const milestones = handover.MilestoneCompletions;
    const hasPlan = handover.ProjectPlan && handover.ProjectPlan.milestones?.length > 0;
    const completedCount = milestones.filter((m) => m.status === 'Completed').length;

    // No milestones initialized yet
    if (milestones.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: '#616161' }}>
          {hasPlan ? (
            <>
              <Text size={200} style={{ display: 'block', marginBottom: '12px' }}>
                Project plan has {handover.ProjectPlan!.milestones.length} milestones ready for tracking.
              </Text>
              {!readOnly && (
                <Button
                  appearance="primary"
                  icon={<Play24Regular />}
                  onClick={async () => {
                    const result = await deliveryHandoverService.initializeMilestoneTracking(handover.Id);
                    if (result.success) {
                      showSuccess('Initialized', 'Milestone tracking has been initialized from the project plan.');
                      // Reload handover
                      const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                      if (updated) setHandover(updated);
                    } else {
                      showError('Failed', result.error || 'Could not initialize milestone tracking.');
                    }
                  }}
                >
                  Initialize Milestone Tracking
                </Button>
              )}
            </>
          ) : (
            <Text size={200}>Generate a project plan first to enable milestone tracking.</Text>
          )}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Progress summary bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <ProgressBar
              value={milestones.length > 0 ? completedCount / milestones.length : 0}
              thickness="large"
              color={completedCount === milestones.length ? 'success' : 'brand'}
            />
          </div>
          <Text size={200} weight="semibold" style={{ whiteSpace: 'nowrap' }}>
            {completedCount} / {milestones.length}
          </Text>
        </div>

        {/* Milestone table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }}>Milestone</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '80px' }}>Week</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '110px' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '100px' }}>Completed</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '80px' }}>Variance</th>
                {!readOnly && (
                  <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '140px' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {milestones.map((m) => {
                const statusColor = MILESTONE_STATUS_COLORS[m.status];
                return (
                  <tr key={m.milestoneIndex} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <Text weight="semibold" size={200}>{m.name}</Text>
                      {m.notes && (
                        <Text size={100} style={{ display: 'block', color: '#9ca3af', marginTop: '2px' }}>{m.notes}</Text>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                      <Text size={200}>Wk {m.plannedWeek}</Text>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '10px',
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {m.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                      {m.actualCompletionDate ? (
                        <Text size={100}>{formatDate(m.actualCompletionDate)}</Text>
                      ) : (
                        <Text size={100} style={{ color: '#9ca3af' }}>-</Text>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                      {m.daysVariance !== null ? (
                        <Text
                          size={200}
                          weight="semibold"
                          style={{
                            color: m.daysVariance <= 0 ? '#059669' : '#dc2626',
                          }}
                        >
                          {m.daysVariance <= 0 ? `${Math.abs(m.daysVariance)}d early` : `${m.daysVariance}d late`}
                        </Text>
                      ) : (
                        <Text size={100} style={{ color: '#9ca3af' }}>-</Text>
                      )}
                    </td>
                    {!readOnly && (
                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          {m.status === 'Not Started' && (
                            <Tooltip content="Mark In Progress" relationship="label">
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Timer24Regular />}
                                onClick={async () => {
                                  const result = await deliveryHandoverService.updateMilestoneStatus(
                                    handover.Id, m.milestoneIndex, 'In Progress'
                                  );
                                  if (result.success) {
                                    showSuccess('In Progress', `"${m.name}" marked as In Progress.`);
                                    const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                                    if (updated) setHandover(updated);
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                          {(m.status === 'In Progress' || m.status === 'Overdue') && (
                            <Tooltip content="Mark Complete" relationship="label">
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Checkmark24Regular />}
                                onClick={async () => {
                                  const result = await deliveryHandoverService.updateMilestoneStatus(
                                    handover.Id, m.milestoneIndex, 'Completed',
                                    user?.displayName || ''
                                  );
                                  if (result.success) {
                                    showSuccess('Completed', `"${m.name}" has been marked as complete.`);
                                    const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                                    if (updated) setHandover(updated);
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                          {m.status === 'Not Started' && (
                            <Tooltip content="Mark Overdue" relationship="label">
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<Warning24Regular />}
                                onClick={async () => {
                                  const result = await deliveryHandoverService.updateMilestoneStatus(
                                    handover.Id, m.milestoneIndex, 'Overdue'
                                  );
                                  if (result.success) {
                                    const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                                    if (updated) setHandover(updated);
                                  }
                                }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // -- Render deliverable sign-offs (v2.17.0) ---------------------------------
  const renderDeliverableSignOffs = () => {
    if (!handover) return null;

    const signOffs = handover.DeliverableSignOffs;
    const hasScope = handover.ScopeSnapshot && handover.ScopeSnapshot.deliverables?.length > 0;
    const approvedCount = signOffs.filter((s) => s.status === 'Approved').length;

    // No sign-offs initialized yet
    if (signOffs.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '24px', color: '#616161' }}>
          {hasScope ? (
            <>
              <Text size={200} style={{ display: 'block', marginBottom: '12px' }}>
                Scope has {handover.ScopeSnapshot!.deliverables.length} deliverables ready for sign-off tracking.
              </Text>
              {!readOnly && (
                <Button
                  appearance="primary"
                  icon={<DocumentCheckmark24Regular />}
                  onClick={async () => {
                    const result = await deliveryHandoverService.initializeDeliverableSignOffs(handover.Id);
                    if (result.success) {
                      showSuccess('Initialized', 'Deliverable sign-offs have been initialized from scope.');
                      const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                      if (updated) setHandover(updated);
                    } else {
                      showError('Failed', result.error || 'Could not initialize deliverable sign-offs.');
                    }
                  }}
                >
                  Initialize Deliverable Sign-Offs
                </Button>
              )}
            </>
          ) : (
            <Text size={200}>Generate scope snapshot first to enable deliverable sign-off tracking.</Text>
          )}
        </div>
      );
    }

    // Render sign-off table
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <ProgressBar
              value={signOffs.length > 0 ? approvedCount / signOffs.length : 0}
              thickness="large"
              color={approvedCount === signOffs.length ? 'success' : 'brand'}
            />
          </div>
          <Text size={200} weight="semibold" style={{ whiteSpace: 'nowrap' }}>
            {approvedCount} / {signOffs.length} approved
          </Text>
        </div>

        {/* All approved callout */}
        {approvedCount === signOffs.length && signOffs.length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10B981',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <Text size={200} weight="semibold" style={{ color: '#059669' }}>
              All deliverables approved — ready for final sign-off!
            </Text>
          </div>
        )}

        {/* Sign-off table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }}>Deliverable</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '110px' }}>Status</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '100px' }}>Criteria</th>
                <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '100px' }}>Date</th>
                {!readOnly && (
                  <th style={{ textAlign: 'center', padding: '8px 10px', fontWeight: 600, width: '150px' }}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {signOffs.map((so) => {
                const statusColor = SIGN_OFF_STATUS_COLORS[so.status];
                const criteriaCompleted = so.criteriaCompleted.filter(Boolean).length;
                const allowedTransitions = SIGN_OFF_STATUS_TRANSITIONS[so.status];
                return (
                  <tr key={so.deliverableIndex} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <Text weight="semibold" size={200}>{so.title}</Text>
                      {so.rejectionReason && (
                        <Text size={100} style={{ display: 'block', color: '#dc2626', marginTop: '2px' }}>
                          Rejection: {so.rejectionReason}
                        </Text>
                      )}
                      {so.notes && (
                        <Text size={100} style={{ display: 'block', color: '#9ca3af', marginTop: '2px' }}>{so.notes}</Text>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '10px',
                        backgroundColor: statusColor.bg,
                        color: statusColor.text,
                        fontSize: '11px',
                        fontWeight: 600,
                      }}>
                        {so.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                      {so.acceptanceCriteria.length > 0 ? (
                        <Text size={100}>{criteriaCompleted}/{so.acceptanceCriteria.length}</Text>
                      ) : (
                        <Text size={100} style={{ color: '#9ca3af' }}>-</Text>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                      {so.approvedDate ? (
                        <Text size={100}>{formatDate(so.approvedDate)}</Text>
                      ) : so.submittedDate ? (
                        <Text size={100}>{formatDate(so.submittedDate)}</Text>
                      ) : (
                        <Text size={100} style={{ color: '#9ca3af' }}>-</Text>
                      )}
                    </td>
                    {!readOnly && (
                      <td style={{ textAlign: 'center', padding: '8px 10px' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          {allowedTransitions.includes('Submitted') && (
                            <Button
                              appearance="subtle"
                              size="small"
                              onClick={async () => {
                                const result = await deliveryHandoverService.updateDeliverableSignOff(
                                  handover.Id, so.deliverableIndex, 'Submitted',
                                  user?.displayName || 'Unknown'
                                );
                                if (result.success) {
                                  showSuccess('Submitted', `"${so.title}" has been submitted for review.`);
                                  const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                                  if (updated) setHandover(updated);
                                } else {
                                  showError('Failed', result.error || 'Could not submit deliverable.');
                                }
                              }}
                            >
                              Submit
                            </Button>
                          )}
                          {allowedTransitions.includes('Approved') && isManager && (
                            <Button
                              appearance="subtle"
                              size="small"
                              style={{ color: '#059669' }}
                              onClick={async () => {
                                const result = await deliveryHandoverService.updateDeliverableSignOff(
                                  handover.Id, so.deliverableIndex, 'Approved',
                                  user?.displayName || 'Unknown'
                                );
                                if (result.success) {
                                  showSuccess('Approved', `"${so.title}" has been approved.`);
                                  const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                                  if (updated) setHandover(updated);
                                } else {
                                  showError('Failed', result.error || 'Could not approve deliverable.');
                                }
                              }}
                            >
                              Approve
                            </Button>
                          )}
                          {allowedTransitions.includes('Rejected') && isManager && (
                            <Button
                              appearance="subtle"
                              size="small"
                              style={{ color: '#dc2626' }}
                              onClick={() => {
                                setRejectingDeliverable(so);
                              }}
                            >
                              Reject
                            </Button>
                          )}
                          {allowedTransitions.includes('Resubmitted') && (
                            <Button
                              appearance="subtle"
                              size="small"
                              onClick={async () => {
                                const result = await deliveryHandoverService.updateDeliverableSignOff(
                                  handover.Id, so.deliverableIndex, 'Resubmitted',
                                  user?.displayName || 'Unknown'
                                );
                                if (result.success) {
                                  showSuccess('Resubmitted', `"${so.title}" has been resubmitted for review.`);
                                  const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                                  if (updated) setHandover(updated);
                                } else {
                                  showError('Failed', result.error || 'Could not resubmit deliverable.');
                                }
                              }}
                            >
                              Resubmit
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
          <Tooltip content="Download handover slide deck" relationship="label">
            <Button
              appearance="secondary"
              icon={generatingDeck ? <Spinner size="tiny" /> : <SlideLayout24Regular />}
              disabled={generatingDeck}
              onClick={handleDownloadDeck}
            >
              {generatingDeck ? 'Generating...' : 'Download Deck'}
            </Button>
          </Tooltip>
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

      {/* ===== AI Loading Banners ===== */}
      {aiLoading && (
        <div className={styles.progressBanner}>
          <Spinner size="tiny" />
          <Text size={200}>Generating AI client brief... This may take a moment.</Text>
        </div>
      )}
      {generatingPlan && (
        <div className={styles.progressBanner}>
          <Spinner size="tiny" />
          <Text size={200}>Generating AI project plan... This may take a moment.</Text>
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

      {/* ===== Project Plan ===== */}
      <SectionCard
        title="Project Plan"
        count={handover.ProjectPlan?.phases?.length}
        defaultOpen={!!handover.ProjectPlan}
      >
        {renderProjectPlan(handover.ProjectPlan)}
      </SectionCard>

      {/* ===== Project Health (v2.17.0) ===== */}
      <SectionCard
        title="Project Health"
        defaultOpen={!!handover.ProjectHealth}
      >
        {renderProjectHealth()}
      </SectionCard>

      {/* ===== Milestone Progress (v2.17.0) ===== */}
      <SectionCard
        title="Milestone Progress"
        count={handover.MilestoneCompletions.length > 0
          ? handover.MilestoneCompletions.filter((m) => m.status === 'Completed').length
          : undefined
        }
        defaultOpen={handover.MilestoneCompletions.length > 0}
      >
        {renderMilestoneProgress()}
      </SectionCard>

      {/* ===== Deliverable Sign-Off (v2.17.0) ===== */}
      <SectionCard
        title="Deliverable Sign-Off"
        count={handover.DeliverableSignOffs.length > 0
          ? handover.DeliverableSignOffs.filter((s) => s.status === 'Approved').length
          : undefined
        }
        defaultOpen={handover.DeliverableSignOffs.length > 0}
      >
        {renderDeliverableSignOffs()}
      </SectionCard>

      {/* ===== Final Sign-Off (v2.17.0) ===== */}
      <SectionCard
        title="Final Sign-Off"
        defaultOpen={!!handover.FinalSignOff}
      >
        {handover.FinalSignOff ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid #10B981',
              borderRadius: '8px',
              textAlign: 'center',
            }}>
              <Text size={400} weight="bold" style={{ color: '#059669', display: 'block' }}>
                Handover Formally Signed Off
              </Text>
              {handover.FinalSignOff.signedDate && (
                <Text size={200} style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                  {formatDate(handover.FinalSignOff.signedDate)}
                </Text>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <Text size={100} style={{ color: '#6b7280', display: 'block' }}>Client Signatory</Text>
                <Text size={200} weight="semibold">{handover.FinalSignOff.clientSignatory}</Text>
                {handover.FinalSignOff.clientTitle && (
                  <Text size={100} style={{ color: '#9ca3af', display: 'block' }}>{handover.FinalSignOff.clientTitle}</Text>
                )}
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <Text size={100} style={{ color: '#6b7280', display: 'block' }}>DW Signatory</Text>
                <Text size={200} weight="semibold">{handover.FinalSignOff.dwSignatory}</Text>
                {handover.FinalSignOff.dwTitle && (
                  <Text size={100} style={{ color: '#9ca3af', display: 'block' }}>{handover.FinalSignOff.dwTitle}</Text>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Text size={100} style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Overall Rating</Text>
              <div style={{ fontSize: '24px', color: '#f59e0b' }}>
                {Array.from({ length: 5 }, (_, i) =>
                  i < handover.FinalSignOff!.overallRating ? '\u2605' : '\u2606'
                ).join('')}
                <Text size={200} style={{ color: '#6b7280', marginLeft: '8px' }}>
                  ({handover.FinalSignOff.overallRating}/5)
                </Text>
              </div>
            </div>
            {handover.FinalSignOff.clientFeedback && (
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                <Text size={100} style={{ color: '#6b7280', display: 'block', marginBottom: '4px' }}>Client Feedback</Text>
                <Text size={200}>{handover.FinalSignOff.clientFeedback}</Text>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            {handover.DeliverableSignOffs.length > 0 &&
             handover.DeliverableSignOffs.every((s) => s.status === 'Approved') ? (
              <>
                <Text size={200} style={{ display: 'block', marginBottom: '12px', color: '#059669' }}>
                  All deliverables approved. Ready for final sign-off.
                </Text>
                {!readOnly && (
                  <Button
                    appearance="primary"
                    icon={<Shield24Regular />}
                    onClick={() => setShowFinalSignOff(true)}
                  >
                    Record Final Sign-Off
                  </Button>
                )}
              </>
            ) : (
              <Text size={200} style={{ color: '#616161' }}>
                {handover.DeliverableSignOffs.length === 0
                  ? 'Initialize deliverable sign-offs first.'
                  : `${handover.DeliverableSignOffs.filter((s) => s.status === 'Approved').length} of ${handover.DeliverableSignOffs.length} deliverables approved. All must be approved before final sign-off.`}
              </Text>
            )}
          </div>
        )}
      </SectionCard>

      {/* ===== CSAT Rating (only for Delivered/Closed) ===== */}
      {(handover.HandoverStatus === 'Delivered' || handover.HandoverStatus === 'Closed') && (
        <SectionCard
          title="Client Satisfaction (CSAT)"
          defaultOpen={!!(handover.CSAT && handover.CSAT.overallScore > 0)}
        >
          {renderCSATWidget()}
        </SectionCard>
      )}

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

      {/* Rejection Dialog */}
      <Dialog
        open={!!rejectingDeliverable}
        onOpenChange={(_e, data) => { if (!data.open) { setRejectingDeliverable(null); setRejectionReason(''); } }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Reject Deliverable</DialogTitle>
            <DialogContent>
              <Text size={200} style={{ display: 'block', marginBottom: '12px' }}>
                Please provide a reason for rejecting &quot;{rejectingDeliverable?.title}&quot;.
              </Text>
              <Textarea
                value={rejectionReason}
                onChange={(_e, data) => setRejectionReason(data.value)}
                placeholder="Describe what needs to be changed..."
                resize="vertical"
                style={{ width: '100%', minHeight: '100px' }}
              />
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => { setRejectingDeliverable(null); setRejectionReason(''); }}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: '#dc2626' }}
                disabled={!rejectionReason.trim()}
                onClick={async () => {
                  if (!handover || !rejectingDeliverable) return;
                  const result = await deliveryHandoverService.updateDeliverableSignOff(
                    handover.Id, rejectingDeliverable.deliverableIndex, 'Rejected',
                    user?.displayName || 'Unknown',
                    { rejectionReason: rejectionReason.trim() }
                  );
                  if (result.success) {
                    showSuccess('Rejected', `"${rejectingDeliverable.title}" has been rejected.`);
                    setRejectingDeliverable(null);
                    setRejectionReason('');
                    const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                    if (updated) setHandover(updated);
                  } else {
                    showError('Failed', result.error || 'Could not reject deliverable.');
                  }
                }}
              >
                Reject
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Final Sign-Off Dialog */}
      <Dialog
        open={showFinalSignOff}
        onOpenChange={(_e, data) => { if (!data.open) setShowFinalSignOff(false); }}
      >
        <DialogSurface style={{ maxWidth: '520px' }}>
          <DialogBody>
            <DialogTitle>Final Handover Sign-Off</DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Text size={200} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>Client Signatory</Text>
                  <Input
                    value={finalSignOffData.clientSignatory}
                    onChange={(_e, data) => setFinalSignOffData((prev) => ({ ...prev, clientSignatory: data.value }))}
                    placeholder="Client representative name"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Text size={200} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>Client Title</Text>
                  <Input
                    value={finalSignOffData.clientTitle}
                    onChange={(_e, data) => setFinalSignOffData((prev) => ({ ...prev, clientTitle: data.value }))}
                    placeholder="e.g., CTO, IT Director"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Text size={200} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>DW Signatory</Text>
                  <Input
                    value={finalSignOffData.dwSignatory}
                    onChange={(_e, data) => setFinalSignOffData((prev) => ({ ...prev, dwSignatory: data.value }))}
                    placeholder="DW representative name"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Text size={200} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>DW Title</Text>
                  <Input
                    value={finalSignOffData.dwTitle}
                    onChange={(_e, data) => setFinalSignOffData((prev) => ({ ...prev, dwTitle: data.value }))}
                    placeholder="e.g., Delivery Manager"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <Text size={200} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>Overall Rating</Text>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        role="button"
                        tabIndex={0}
                        onClick={() => setFinalSignOffData((prev) => ({ ...prev, overallRating: star }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') setFinalSignOffData((prev) => ({ ...prev, overallRating: star })); }}
                        style={{
                          cursor: 'pointer',
                          fontSize: '24px',
                          color: star <= finalSignOffData.overallRating ? '#f59e0b' : '#d1d5db',
                        }}
                      >
                        {star <= finalSignOffData.overallRating ? '\u2605' : '\u2606'}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Text size={200} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>Client Feedback</Text>
                  <Textarea
                    value={finalSignOffData.clientFeedback}
                    onChange={(_e, data) => setFinalSignOffData((prev) => ({ ...prev, clientFeedback: data.value }))}
                    placeholder="Optional client feedback..."
                    resize="vertical"
                    style={{ width: '100%', minHeight: '80px' }}
                  />
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setShowFinalSignOff(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                disabled={!finalSignOffData.clientSignatory.trim() || !finalSignOffData.dwSignatory.trim() || finalSignOffData.overallRating === 0}
                onClick={async () => {
                  if (!handover) return;
                  const signOff: FinalHandoverSignOff = {
                    ...finalSignOffData,
                    signedDate: new Date().toISOString(),
                    isComplete: true,
                  };
                  const result = await deliveryHandoverService.recordFinalSignOff(handover.Id, signOff);
                  if (result.success) {
                    showSuccess('Signed Off', 'Final handover sign-off has been recorded.');
                    setShowFinalSignOff(false);
                    const updated = await deliveryHandoverService.getHandoverByRequestId(request.Id);
                    if (updated) setHandover(updated);
                  } else {
                    showError('Failed', result.error || 'Could not record final sign-off.');
                  }
                }}
              >
                Record Sign-Off
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default DeliveryHandoverTab;
