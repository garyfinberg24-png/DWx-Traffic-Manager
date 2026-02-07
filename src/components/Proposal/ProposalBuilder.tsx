/**
 * DWx Traffic Manager - Proposal Builder Dialog
 * Main tabbed dialog for building, reviewing, and managing proposals.
 * Uses DetailModalShell for consistent look with 11 section tabs.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button,
  Spinner,
  Text,
  Dropdown,
  Option,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  DocumentBulletList24Regular,
  Sparkle24Regular,
  Send24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  ArrowSync24Regular,
  ArrowDownload24Regular,
} from '@fluentui/react-icons';
import { generateProposalPdf } from '../../utils/proposalPdfGenerator';
import { generateProposalWord } from '../../utils/proposalWordGenerator';
import { DW_COLORS } from '../../utils/buttonStyles';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { proposalService } from '../../services/ProposalService';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { aiPreparationService, isAIConfigured } from '../../services/AIPreparationService';
import {
  DetailModalShell,
  ModalTab,
  StepperStep,
} from '../MyRequests/DetailModalShell';
import {
  Proposal,
  ProposalStatus,
  ProposalAIContext,
  PROPOSAL_STEPPER_STAGES,
  PROPOSAL_TEMPLATES,
} from '../../types/Proposal';

// Section editors
import { ExecutiveSummaryEditor } from './ExecutiveSummaryEditor';
import { SolutionOverviewEditor } from './SolutionOverviewEditor';
import { TechStackEditor } from './TechStackEditor';
import { ScopeOfWorkEditor } from './ScopeOfWorkEditor';
import { PricingEditor } from './PricingEditor';
import { TimelineEditor } from './TimelineEditor';
import { TeamCompositionEditor } from './TeamCompositionEditor';
import { TermsEditor } from './TermsEditor';
import { ChangeControlEditor } from './ChangeControlEditor';
import { RisksEditor } from './RisksEditor';
import { SigningPageEditor } from './SigningPageEditor';

// ============================================================================
// Types
// ============================================================================

interface ServiceRequestContext {
  Id: number;
  ClientName: string;
  ServiceName: string;
  ServiceCategory?: string;
  ServiceDescription?: string;
  ServiceComplexity?: string;
  ServiceDuration?: string;
  Requirements?: string;
  DealValue?: number;
  DealProbability?: number;
  AccountManagerName?: string;
  AccountManagerEmail?: string;
  AssignedSpecialistName?: string;
  Industry?: string;
  CompanySize?: string;
}

interface ProposalBuilderProps {
  open: boolean;
  onClose: () => void;
  serviceRequest: ServiceRequestContext;
  onProposalUpdated?: (proposal: Proposal) => void;
  isManager?: boolean;
}

type TabValue =
  | 'overview'
  | 'solution'
  | 'tech-stack'
  | 'scope'
  | 'pricing'
  | 'timeline'
  | 'team'
  | 'terms'
  | 'change-control'
  | 'risks'
  | 'signing';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px',
    gap: tokens.spacingVerticalL,
  },
  actionBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center',
  },
  templateSelector: {
    minWidth: '200px',
  },
  generatingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
  },
});

// ============================================================================
// Tab Definitions
// ============================================================================

const TABS: ModalTab[] = [
  { value: 'overview', label: 'Overview', icon: <span style={{ fontSize: 14 }}>1</span> },
  { value: 'solution', label: 'Solution', icon: <span style={{ fontSize: 14 }}>2</span> },
  { value: 'tech-stack', label: 'Tech Stack', icon: <span style={{ fontSize: 14 }}>3</span> },
  { value: 'scope', label: 'Scope', icon: <span style={{ fontSize: 14 }}>4</span> },
  { value: 'pricing', label: 'Pricing', icon: <span style={{ fontSize: 14 }}>5</span> },
  { value: 'timeline', label: 'Timeline', icon: <span style={{ fontSize: 14 }}>6</span> },
  { value: 'team', label: 'Team', icon: <span style={{ fontSize: 14 }}>7</span> },
  { value: 'terms', label: 'Terms', icon: <span style={{ fontSize: 14 }}>8</span> },
  { value: 'change-control', label: 'Change Ctrl', icon: <span style={{ fontSize: 14 }}>9</span> },
  { value: 'risks', label: 'Risks', icon: <span style={{ fontSize: 14 }}>10</span> },
  { value: 'signing', label: 'Signing', icon: <span style={{ fontSize: 14 }}>11</span> },
];

// ============================================================================
// Helpers
// ============================================================================

function buildSteps(currentStatus: ProposalStatus): StepperStep[] {
  const currentIdx = PROPOSAL_STEPPER_STAGES.indexOf(currentStatus);
  // Handle statuses not in stepper (Revision Requested maps to Internal Review position, Declined maps to last)
  const effectiveIdx = currentStatus === 'Revision Requested'
    ? 1
    : currentStatus === 'Declined'
      ? PROPOSAL_STEPPER_STAGES.length - 1
      : currentIdx;

  return PROPOSAL_STEPPER_STAGES.map((label, i) => ({
    label,
    status: i < effectiveIdx ? 'completed' as const
      : i === effectiveIdx ? 'current' as const
      : 'future' as const,
  }));
}

// ============================================================================
// Component
// ============================================================================

export const ProposalBuilder: React.FC<ProposalBuilderProps> = ({
  open,
  onClose,
  serviceRequest,
  onProposalUpdated,
  isManager = false,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // ------ Load or create proposal ------
  const loadProposal = useCallback(async () => {
    if (!open || !serviceRequest.Id) return;
    setLoading(true);
    try {
      let prop = await proposalService.getProposalByServiceRequest(serviceRequest.Id);

      if (!prop && user) {
        const result = await proposalService.createProposal(
          {
            serviceRequestId: serviceRequest.Id,
            proposalType: 'Standard',
            templateName: PROPOSAL_TEMPLATES[0].name,
            createdByEmail: user.email || '',
            createdByName: user.displayName || '',
          },
          serviceRequest.ClientName,
          serviceRequest.ServiceName
        );
        if (result.success && result.proposal) {
          prop = result.proposal;
        }
      }

      setProposal(prop);
    } catch (error) {
      console.error('[ProposalBuilder] Failed to load proposal:', error);
      showToast('Failed to load proposal', 'error');
    } finally {
      setLoading(false);
    }
  }, [open, serviceRequest.Id, serviceRequest.ClientName, serviceRequest.ServiceName, user, showToast]);

  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  // ------ Save section content ------
  const handleSaveSection = useCallback(async (sectionKey: string, content: unknown) => {
    if (!proposal) return;
    setSaving(true);
    try {
      const result = await proposalService.saveSectionContent(proposal.Id, sectionKey, content);
      if (result.success && result.proposal) {
        setProposal(result.proposal);
        onProposalUpdated?.(result.proposal);
      }
    } catch (error) {
      console.error(`[ProposalBuilder] Failed to save ${sectionKey}:`, error);
      showToast(`Failed to save ${sectionKey}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [proposal, onProposalUpdated, showToast]);

  // ------ AI Generation ------
  const handleGenerateAI = useCallback(async () => {
    if (!proposal || !isAIConfigured()) return;
    setGenerating(true);
    try {
      const context: ProposalAIContext = {
        clientName: serviceRequest.ClientName,
        clientIndustry: serviceRequest.Industry || 'Technology',
        clientSize: serviceRequest.CompanySize || 'Medium',
        serviceName: serviceRequest.ServiceName,
        serviceCategory: serviceRequest.ServiceCategory || '',
        serviceDescription: serviceRequest.ServiceDescription || '',
        serviceComplexity: serviceRequest.ServiceComplexity || 'Medium',
        serviceDuration: serviceRequest.ServiceDuration || '1hr',
        requirements: serviceRequest.Requirements || '',
        discoveryNotes: '',
        dealValue: serviceRequest.DealValue || 0,
        dealProbability: serviceRequest.DealProbability || 50,
        proposalType: proposal.ProposalType,
        specialistName: serviceRequest.AssignedSpecialistName || '',
        accountManagerName: serviceRequest.AccountManagerName || '',
      };

      const result = await aiPreparationService.generateProposalContent(context);

      if (result.success) {
        const updates: Record<string, unknown> = {};
        if (result.executiveSummary) updates.executiveSummary = result.executiveSummary;
        if (result.solutionOverview) updates.solutionOverview = result.solutionOverview;
        if (result.technologyStack) updates.technologyStack = result.technologyStack;
        if (result.scopeOfWork) updates.scopeOfWork = result.scopeOfWork;
        if (result.pricingBreakdown) updates.pricingBreakdown = result.pricingBreakdown;
        if (result.timeline) updates.timeline = result.timeline;
        if (result.teamComposition) updates.teamComposition = result.teamComposition;
        if (result.assumptions) updates.assumptions = result.assumptions;
        if (result.risks) updates.risks = result.risks;

        const updateResult = await proposalService.updateProposal(proposal.Id, updates);
        if (updateResult.success && updateResult.proposal) {
          setProposal(updateResult.proposal);
          onProposalUpdated?.(updateResult.proposal);
          showToast('AI content generated successfully', 'success');
        }
      } else {
        showToast(result.error || 'AI generation failed', 'error');
      }
    } catch (error) {
      console.error('[ProposalBuilder] AI generation failed:', error);
      showToast('AI generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  }, [proposal, serviceRequest, onProposalUpdated, showToast]);

  // ------ Status actions ------
  const handleSubmitForReview = useCallback(async () => {
    if (!proposal || !user) return;
    setSaving(true);
    try {
      const result = await proposalService.submitForReview(
        proposal.Id, user.email || '', user.displayName || ''
      );
      if (result.success && result.proposal) {
        setProposal(result.proposal);
        onProposalUpdated?.(result.proposal);
        showToast('Proposal submitted for review', 'success');
      } else {
        showToast(result.error || 'Failed to submit', 'error');
      }
    } catch (error) {
      showToast('Failed to submit for review', 'error');
    } finally {
      setSaving(false);
    }
  }, [proposal, user, onProposalUpdated, showToast]);

  const handleApprove = useCallback(async () => {
    if (!proposal || !user) return;
    setSaving(true);
    try {
      const result = await proposalService.approveProposal(
        proposal.Id, user.email || '', user.displayName || ''
      );
      if (result.success && result.proposal) {
        setProposal(result.proposal);
        onProposalUpdated?.(result.proposal);
        showToast('Proposal approved', 'success');
      } else {
        showToast(result.error || 'Failed to approve', 'error');
      }
    } catch (error) {
      showToast('Failed to approve proposal', 'error');
    } finally {
      setSaving(false);
    }
  }, [proposal, user, onProposalUpdated, showToast]);

  const handleRequestRevision = useCallback(async () => {
    if (!proposal || !user) return;
    const notes = window.prompt('Please provide revision feedback:');
    if (!notes) return;
    setSaving(true);
    try {
      const result = await proposalService.requestRevision(
        proposal.Id, user.email || '', user.displayName || '', notes
      );
      if (result.success && result.proposal) {
        setProposal(result.proposal);
        onProposalUpdated?.(result.proposal);
        showToast('Revision requested', 'success');
      }
    } catch (error) {
      showToast('Failed to request revision', 'error');
    } finally {
      setSaving(false);
    }
  }, [proposal, user, onProposalUpdated, showToast]);

  const handleSendToClient = useCallback(async () => {
    if (!proposal || !user) return;
    setSaving(true);
    try {
      const result = await proposalService.markSentToClient(
        proposal.Id, user.email || '', user.displayName || ''
      );
      if (result.success && result.proposal) {
        setProposal(result.proposal);
        onProposalUpdated?.(result.proposal);
        showToast('Proposal sent to Account Manager', 'success');
      }
    } catch (error) {
      showToast('Failed to send proposal', 'error');
    } finally {
      setSaving(false);
    }
  }, [proposal, user, onProposalUpdated, showToast]);

  const handleMarkAccepted = useCallback(async () => {
    if (!proposal || !user) return;
    setSaving(true);
    try {
      const result = await proposalService.markAccepted(
        proposal.Id, user.email || '', user.displayName || ''
      );
      if (result.success && result.proposal) {
        setProposal(result.proposal);
        onProposalUpdated?.(result.proposal);
        showToast('Proposal accepted! Moving to Negotiation.', 'success');
        // Auto-advance the deal to Negotiation stage
        try {
          await serviceRequestService.updateStage(
            serviceRequest.Id, 'Negotiation', user.email || '', user.displayName || ''
          );
        } catch (stageError) {
          console.error('[ProposalBuilder] Failed to auto-advance to Negotiation:', stageError);
        }
      }
    } catch (error) {
      showToast('Failed to mark as accepted', 'error');
    } finally {
      setSaving(false);
    }
  }, [proposal, user, serviceRequest.Id, onProposalUpdated, showToast]);

  const handleMarkDeclined = useCallback(async () => {
    if (!proposal || !user) return;
    const reason = window.prompt('Please provide the reason for decline (optional):') || '';
    setSaving(true);
    try {
      const result = await proposalService.markDeclined(
        proposal.Id, user.email || '', user.displayName || '', reason
      );
      if (result.success && result.proposal) {
        setProposal(result.proposal);
        onProposalUpdated?.(result.proposal);
        showToast('Proposal marked as declined', 'warning');
      }
    } catch (error) {
      showToast('Failed to mark as declined', 'error');
    } finally {
      setSaving(false);
    }
  }, [proposal, user, onProposalUpdated, showToast]);

  // ------ Template change ------
  const handleTemplateChange = useCallback(async (templateName: string) => {
    if (!proposal) return;
    await proposalService.updateProposal(proposal.Id, { templateName });
    setProposal(prev => prev ? { ...prev, TemplateName: templateName } : null);
  }, [proposal]);

  // ------ Derived state ------
  const isEditable = proposal?.Status === 'Draft' || proposal?.Status === 'Revision Requested';
  const isTerminal = proposal?.Status === 'Accepted' || proposal?.Status === 'Declined';

  const subtitle = useMemo(() => {
    const parts = [
      serviceRequest.ServiceName,
      serviceRequest.AccountManagerName ? `AM: ${serviceRequest.AccountManagerName}` : undefined,
      proposal ? `v${proposal.Version}` : undefined,
    ].filter(Boolean);
    return parts.join(' · ');
  }, [serviceRequest, proposal]);

  // ------ Footer actions based on status ------
  const footerRight = useMemo(() => {
    if (!proposal) return null;
    const status = proposal.Status;

    return (
      <div className={styles.actionBar}>
        {/* PDF Download button (only for Approved+ statuses) */}
        {['Approved', 'Sent to Client', 'Accepted', 'Declined'].includes(status) && (
          <Button
            appearance="outline"
            icon={<ArrowDownload24Regular />}
            onClick={() => {
              generateProposalPdf({
                proposal,
                clientName: serviceRequest.ClientName,
                serviceName: serviceRequest.ServiceName,
                accountManagerName: serviceRequest.AccountManagerName || '',
                proposalType: proposal.ProposalType || 'Standard',
              });
            }}
          >
            Download PDF
          </Button>
        )}

        {/* Word Download button (same visibility as PDF) */}
        {['Approved', 'Sent to Client', 'Accepted', 'Declined'].includes(status) && (
          <Button
            appearance="outline"
            icon={<ArrowDownload24Regular />}
            onClick={() => {
              generateProposalWord({
                proposal,
                clientName: serviceRequest.ClientName,
                serviceName: serviceRequest.ServiceName,
                accountManagerName: serviceRequest.AccountManagerName || '',
                proposalType: proposal.ProposalType || 'Standard',
              });
            }}
          >
            Download Word
          </Button>
        )}

        {/* AI Generate button (only in editable states) */}
        {isEditable && isAIConfigured() && (
          <Button
            appearance="primary"
            icon={<Sparkle24Regular />}
            onClick={handleGenerateAI}
            disabled={generating || saving}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {generating ? 'Generating...' : 'Generate AI Content'}
          </Button>
        )}

        {/* Status-specific actions */}
        {(status === 'Draft' || status === 'Revision Requested') && (
          <Button
            appearance="primary"
            icon={<Send24Regular />}
            onClick={handleSubmitForReview}
            disabled={saving}
            style={{ backgroundColor: DW_COLORS.primary }}
          >
            Submit for Review
          </Button>
        )}

        {status === 'Internal Review' && isManager && (
          <>
            <Button
              appearance="subtle"
              icon={<ArrowSync24Regular />}
              onClick={handleRequestRevision}
              disabled={saving}
            >
              Request Revision
            </Button>
            <Button
              appearance="primary"
              icon={<Checkmark24Regular />}
              onClick={handleApprove}
              disabled={saving}
              style={{ backgroundColor: DW_COLORS.success }}
            >
              Approve
            </Button>
          </>
        )}

        {status === 'Approved' && (
          <Button
            appearance="primary"
            icon={<Send24Regular />}
            onClick={handleSendToClient}
            disabled={saving}
            style={{ backgroundColor: DW_COLORS.primary }}
          >
            Send to AM
          </Button>
        )}

        {status === 'Sent to Client' && (
          <>
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={handleMarkDeclined}
              disabled={saving}
            >
              Declined
            </Button>
            <Button
              appearance="primary"
              icon={<Checkmark24Regular />}
              onClick={handleMarkAccepted}
              disabled={saving}
              style={{ backgroundColor: DW_COLORS.success }}
            >
              Accepted
            </Button>
          </>
        )}

        {isTerminal && (
          <Button appearance="primary" onClick={onClose} style={{ backgroundColor: DW_COLORS.primary }}>
            Done
          </Button>
        )}
      </div>
    );
  }, [proposal, isEditable, isTerminal, isManager, generating, saving, styles.actionBar, serviceRequest, handleGenerateAI, handleSubmitForReview, handleApprove, handleRequestRevision, handleSendToClient, handleMarkAccepted, handleMarkDeclined, onClose]);

  const footerLeft = useMemo(() => {
    if (!proposal) return null;
    const parts = [
      `Version ${proposal.Version}`,
      proposal.ApprovedByName ? `Approved by ${proposal.ApprovedByName}` : undefined,
      proposal.ValidUntil ? `Valid until ${new Date(proposal.ValidUntil).toLocaleDateString()}` : undefined,
    ].filter(Boolean);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span>{parts.join(' · ')}</span>
        {isEditable && (
          <Dropdown
            className={styles.templateSelector}
            placeholder="Select template"
            value={proposal.TemplateName}
            selectedOptions={[proposal.TemplateName]}
            onOptionSelect={(_, data) => {
              if (data.optionValue) handleTemplateChange(data.optionValue);
            }}
          >
            {PROPOSAL_TEMPLATES.map((t) => (
              <Option key={t.id} value={t.name} text={t.name}>
                {t.name}
              </Option>
            ))}
          </Dropdown>
        )}
      </div>
    );
  }, [proposal, isEditable, styles.templateSelector, handleTemplateChange]);

  // ------ Render tab content ------
  const renderTabContent = () => {
    if (!proposal) return null;

    if (generating) {
      return (
        <div className={styles.generatingOverlay}>
          <Spinner size="large" />
          <Text size={400} weight="semibold">Generating AI Content...</Text>
          <Text size={300}>This may take 30-60 seconds as we generate all proposal sections.</Text>
        </div>
      );
    }

    const readOnly = !isEditable;

    switch (activeTab) {
      case 'overview':
        return (
          <ExecutiveSummaryEditor
            data={proposal.ExecutiveSummary}
            onChange={(data) => handleSaveSection('executiveSummary', data)}
            readOnly={readOnly}
          />
        );
      case 'solution':
        return (
          <SolutionOverviewEditor
            data={proposal.SolutionOverview}
            onChange={(data) => handleSaveSection('solutionOverview', data)}
            readOnly={readOnly}
          />
        );
      case 'tech-stack':
        return (
          <TechStackEditor
            data={proposal.TechnologyStack}
            onChange={(data) => handleSaveSection('technologyStack', data)}
            readOnly={readOnly}
          />
        );
      case 'scope':
        return (
          <ScopeOfWorkEditor
            data={proposal.ScopeOfWork}
            onChange={(data) => handleSaveSection('scopeOfWork', data)}
            readOnly={readOnly}
          />
        );
      case 'pricing':
        return (
          <PricingEditor
            data={proposal.PricingBreakdown}
            onChange={(data) => handleSaveSection('pricingBreakdown', data)}
            readOnly={readOnly}
          />
        );
      case 'timeline':
        return (
          <TimelineEditor
            data={proposal.Timeline}
            onChange={(data) => handleSaveSection('timeline', data)}
            readOnly={readOnly}
          />
        );
      case 'team':
        return (
          <TeamCompositionEditor
            data={proposal.TeamComposition}
            onChange={(data) => handleSaveSection('teamComposition', data)}
            readOnly={readOnly}
          />
        );
      case 'terms':
        return (
          <TermsEditor
            data={proposal.Terms}
            onChange={(data) => handleSaveSection('terms', data)}
            readOnly={readOnly}
          />
        );
      case 'change-control':
        return (
          <ChangeControlEditor
            data={proposal.ChangeControl}
            onChange={(data) => handleSaveSection('changeControl', data)}
            readOnly={readOnly}
          />
        );
      case 'risks':
        return (
          <RisksEditor
            data={{ assumptions: proposal.Assumptions, risks: proposal.Risks }}
            onChange={(data) => {
              handleSaveSection('assumptions', data.assumptions);
              handleSaveSection('risks', data.risks);
            }}
            readOnly={readOnly}
          />
        );
      case 'signing':
        return (
          <SigningPageEditor
            data={proposal.SigningPage}
            onChange={(data) => handleSaveSection('signingPage', data)}
            readOnly={readOnly}
          />
        );
      default:
        return null;
    }
  };

  // ------ Main render ------
  if (loading) {
    return (
      <DetailModalShell
        isOpen={open}
        onClose={onClose}
        icon={<DocumentBulletList24Regular />}
        title="Loading Proposal..."
        subtitle={serviceRequest.ClientName}
        statusBadge="Loading"
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as TabValue)}
        maxWidth="1200px"
      >
        <div className={styles.loadingContainer}>
          <Spinner size="large" label="Loading proposal..." />
        </div>
      </DetailModalShell>
    );
  }

  return (
    <DetailModalShell
      isOpen={open}
      onClose={onClose}
      icon={<DocumentBulletList24Regular />}
      title={`Proposal — ${serviceRequest.ClientName}`}
      subtitle={subtitle}
      statusBadge={proposal ? proposal.Status : 'New'}
      steps={proposal ? buildSteps(proposal.Status) : undefined}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as TabValue)}
      footerLeft={footerLeft}
      footerRight={footerRight}
      maxWidth="1200px"
    >
      {renderTabContent()}
    </DetailModalShell>
  );
};
