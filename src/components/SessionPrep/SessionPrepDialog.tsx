/**
 * DWx Traffic Manager - Session Preparation Dialog
 * Main dialog for AI-powered session preparation.
 * Uses DetailModalShell for consistent modal layout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  makeStyles,
} from '@fluentui/react-components';
import {
  PersonRegular,
  ChatRegular,
  FolderRegular,
  CalendarRegular,
  CheckmarkRegular,
  NoteRegular,
  SparkleRegular,
  ArrowSyncRegular,
  CheckmarkCircleRegular,
  Sparkle24Regular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ServiceRequest } from '../../types/ServiceRequest';
import {
  SessionPreparation,
  SessionPrepStatus,
  AIGenerationContext,
  UpdateSessionPrepInput,
  MeetingNotes,
} from '../../types/SessionPreparation';
import { sessionPrepService } from '../../services/SessionPrepService';
import { aiPreparationService, isAIConfigured } from '../../services/AIPreparationService';
import {
  DetailModalShell,
  StepperStep,
  ModalTab,
} from '../MyRequests/DetailModalShell';
import { ClientProfileCard } from './ClientProfileCard';
import { TalkingPointsEditor } from './TalkingPointsEditor';
import { ResourcePicker } from './ResourcePicker';
import { MeetingAgendaView } from './MeetingAgendaView';
import { PrepChecklist } from './PrepChecklist';
import { MeetingNotesEditor } from './MeetingNotesEditor';
import { format } from 'date-fns';
import { DW_COLORS } from '../../utils/buttonStyles';

// ============================================================================
// Local styles (only things NOT in DetailModalShell)
// ============================================================================

const useStyles = makeStyles({
  loadingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px',
  },
  aiNotConfigured: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px',
    textAlign: 'center',
  },
});

// ============================================================================
// Tabs
// ============================================================================

type TabValue = 'profile' | 'talking-points' | 'resources' | 'agenda' | 'checklist' | 'notes';

const TABS: ModalTab[] = [
  { value: 'profile', label: 'Client Profile', icon: <PersonRegular style={{ width: 16, height: 16 }} /> },
  { value: 'talking-points', label: 'Talking Points', icon: <ChatRegular style={{ width: 16, height: 16 }} /> },
  { value: 'resources', label: 'Resources', icon: <FolderRegular style={{ width: 16, height: 16 }} /> },
  { value: 'agenda', label: 'Agenda', icon: <CalendarRegular style={{ width: 16, height: 16 }} /> },
  { value: 'checklist', label: 'Checklist', icon: <CheckmarkRegular style={{ width: 16, height: 16 }} /> },
  { value: 'notes', label: 'Notes', icon: <NoteRegular style={{ width: 16, height: 16 }} /> },
];

// ============================================================================
// Progress stepper builder
// ============================================================================

const PREP_STEPS: SessionPrepStatus[] = ['Not Started', 'In Progress', 'Ready'];

function buildPrepSteps(currentStatus: SessionPrepStatus): StepperStep[] {
  const currentIdx = PREP_STEPS.indexOf(currentStatus);
  return PREP_STEPS.map((label, i) => ({
    label,
    status: i < currentIdx ? 'completed' as const : i === currentIdx ? 'current' as const : 'future' as const,
  }));
}

// ============================================================================
// Component
// ============================================================================

interface SessionPrepDialogProps {
  open: boolean;
  onClose: () => void;
  serviceRequest: ServiceRequest;
  onSessionPrepUpdated?: (prep: SessionPreparation) => void;
}

export const SessionPrepDialog: React.FC<SessionPrepDialogProps> = ({
  open,
  onClose,
  serviceRequest,
  onSessionPrepUpdated,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [sessionPrep, setSessionPrep] = useState<SessionPreparation | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>('profile');

  // Load or create session prep
  const loadSessionPrep = useCallback(async () => {
    if (!open || !serviceRequest.Id) return;

    try {
      setLoading(true);

      let prep = await sessionPrepService.getSessionPrepByServiceRequest(serviceRequest.Id);

      if (!prep && user) {
        const clientName = serviceRequest.ClientName || 'Unknown Client';
        const meetingDate = serviceRequest.ConfirmedDateTime || new Date().toISOString();

        const result = await sessionPrepService.createSessionPrep(
          {
            serviceRequestId: serviceRequest.Id,
            specialistEmail: serviceRequest.AssignedSpecialistEmail || user.email,
            specialistName: serviceRequest.AssignedSpecialistName || user.displayName,
          },
          clientName,
          meetingDate
        );

        if (result.success && result.sessionPrep) {
          prep = result.sessionPrep;
        }
      }

      setSessionPrep(prep);
    } catch (error) {
      console.error('[SessionPrepDialog] Failed to load session prep:', error);
      showToast('Failed to load session preparation', 'error');
    } finally {
      setLoading(false);
    }
  }, [open, serviceRequest, user, showToast]);

  useEffect(() => {
    loadSessionPrep();
  }, [loadSessionPrep]);

  // Build AI generation context
  const buildAIContext = useCallback((): AIGenerationContext => {
    return {
      clientName: serviceRequest.ClientName || 'Unknown Client',
      clientIndustry: serviceRequest.ClientIndustry || 'Not specified',
      clientSize: serviceRequest.ClientCompanySize || 'Not specified',
      isPremium: serviceRequest.IsPremiumClient || false,
      serviceName: serviceRequest.ServiceName || 'Service',
      serviceCategory: serviceRequest.ServiceCategory || 'General',
      servicePrerequisites: serviceRequest.Prerequisites ? JSON.parse(serviceRequest.Prerequisites) : [],
      serviceEngagementPhases: serviceRequest.EngagementPhases ? JSON.parse(serviceRequest.EngagementPhases) : [],
      dealValue: serviceRequest.DealValue || 0,
      accountManagerName: serviceRequest.AccountManagerName || 'Unknown',
      previousEngagements: [],
      meetingDuration: serviceRequest.DefaultDuration || 60,
      meetingDateTime: serviceRequest.ConfirmedDateTime || new Date().toISOString(),
      additionalNotes: serviceRequest.Comments || undefined,
    };
  }, [serviceRequest]);

  // Generate AI content
  const handleGenerateContent = async () => {
    if (!sessionPrep || !user) return;

    try {
      setGenerating(true);
      const context = buildAIContext();
      const result = await aiPreparationService.generateAllContent(context);

      if (result.success) {
        const saveResult = await sessionPrepService.saveAIContent(
          sessionPrep.Id,
          {
            clientProfile: result.clientProfile,
            talkingPoints: result.talkingPoints,
            suggestedResources: result.suggestedResources,
            meetingAgenda: result.meetingAgenda,
          }
        );

        if (saveResult.success && saveResult.sessionPrep) {
          setSessionPrep(saveResult.sessionPrep);
          onSessionPrepUpdated?.(saveResult.sessionPrep);
          showToast('AI content generated successfully', 'success');
        }
      } else {
        showToast(result.error || 'Failed to generate AI content', 'error');
      }
    } catch (error) {
      console.error('[SessionPrepDialog] Failed to generate content:', error);
      showToast('Failed to generate AI content', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate specific section
  const handleRegenerateSection = async (section: 'clientProfile' | 'talkingPoints' | 'suggestedResources' | 'meetingAgenda') => {
    if (!sessionPrep || !user) return;

    try {
      setGenerating(true);
      const context = buildAIContext();
      const result = await aiPreparationService.regenerateSection(
        section,
        context,
        sessionPrep.ClientProfile || undefined
      );

      if (result.success) {
        const updates: UpdateSessionPrepInput = {};
        if (result.clientProfile) updates.clientProfile = result.clientProfile;
        if (result.talkingPoints) updates.talkingPoints = result.talkingPoints;
        if (result.suggestedResources) updates.suggestedResources = result.suggestedResources;
        if (result.meetingAgenda) updates.meetingAgenda = result.meetingAgenda;

        const saveResult = await sessionPrepService.updateSessionPrep(
          sessionPrep.Id,
          updates
        );

        if (saveResult.success && saveResult.sessionPrep) {
          setSessionPrep(saveResult.sessionPrep);
          onSessionPrepUpdated?.(saveResult.sessionPrep);
          showToast(`${section} regenerated successfully`, 'success');
        }
      } else {
        showToast(result.error || `Failed to regenerate ${section}`, 'error');
      }
    } catch (error) {
      console.error(`[SessionPrepDialog] Failed to regenerate ${section}:`, error);
      showToast(`Failed to regenerate ${section}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Update session prep
  const handleUpdateSessionPrep = async (updates: UpdateSessionPrepInput) => {
    if (!sessionPrep || !user) return;

    try {
      setSaving(true);
      const result = await sessionPrepService.updateSessionPrep(
        sessionPrep.Id,
        updates
      );

      if (result.success && result.sessionPrep) {
        setSessionPrep(result.sessionPrep);
        onSessionPrepUpdated?.(result.sessionPrep);
      }
    } catch (error) {
      console.error('[SessionPrepDialog] Failed to update session prep:', error);
      showToast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Mark as ready
  const handleMarkAsReady = async () => {
    if (!sessionPrep || !user) return;

    try {
      setSaving(true);
      const result = await sessionPrepService.markAsReady(sessionPrep.Id);

      if (result.success && result.sessionPrep) {
        setSessionPrep(result.sessionPrep);
        onSessionPrepUpdated?.(result.sessionPrep);
        showToast('Session preparation marked as ready!', 'success');
      }
    } catch (error) {
      console.error('[SessionPrepDialog] Failed to mark as ready:', error);
      showToast('Failed to mark as ready', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Save meeting notes
  const handleSaveMeetingNotes = async (meetingNotesData: MeetingNotes) => {
    if (!sessionPrep) return;
    try {
      setSaving(true);
      await sessionPrepService.updateSessionPrep(sessionPrep.Id, { meetingNotes: meetingNotesData });
      const updated = { ...sessionPrep, MeetingNotes: meetingNotesData };
      setSessionPrep(updated);
      onSessionPrepUpdated?.(updated);
      showToast('Meeting notes saved', 'success');
    } catch (err) {
      console.error('Failed to save meeting notes:', err);
      showToast('Failed to save meeting notes', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Calculate completion percentage
  const completionPercent = sessionPrep
    ? sessionPrepService.calculateCompletionPercentage(sessionPrep)
    : 0;

  const aiConfigured = isAIConfigured();

  // Build subtitle
  const subtitle = [
    serviceRequest.ServiceName,
    serviceRequest.AssignedSpecialistName ? `Specialist: ${serviceRequest.AssignedSpecialistName}` : undefined,
    serviceRequest.ConfirmedDateTime
      ? format(new Date(serviceRequest.ConfirmedDateTime), 'MMM d, yyyy')
      : undefined,
  ].filter(Boolean).join(' \u00B7 ');

  // Build status badge content
  const statusBadge = sessionPrep ? (
    <>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: sessionPrep.Status === 'Ready' ? '#4ade80'
          : sessionPrep.Status === 'In Progress' ? '#60a5fa'
          : 'rgba(255,255,255,0.5)',
      }} />
      {sessionPrep.Status}
    </>
  ) : 'Loading...';

  // Build footer left
  const footerLeft = sessionPrep?.AIGeneratedAt
    ? `AI generated ${format(new Date(sessionPrep.AIGeneratedAt), 'MMM d, yyyy')}`
    : 'No AI content generated yet';

  // Build footer right
  const footerRight = sessionPrep && aiConfigured ? (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {!sessionPrep.AIGeneratedAt ? (
        <Button
          appearance="primary"
          icon={<SparkleRegular />}
          onClick={handleGenerateContent}
          disabled={generating || saving}
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          size="small"
        >
          Generate AI Content
        </Button>
      ) : (
        <Button
          appearance="subtle"
          icon={<ArrowSyncRegular />}
          onClick={handleGenerateContent}
          disabled={generating || saving}
          size="small"
        >
          Regenerate All
        </Button>
      )}
      <Button appearance="secondary" onClick={onClose} size="small">
        Close
      </Button>
      {sessionPrep.Status !== 'Ready' && (
        <Button
          appearance="primary"
          icon={<CheckmarkCircleRegular />}
          onClick={handleMarkAsReady}
          disabled={generating || saving || completionPercent < 50}
          style={{ backgroundColor: DW_COLORS.success }}
          size="small"
        >
          Mark as Ready
        </Button>
      )}
    </div>
  ) : (
    <Button appearance="primary" onClick={onClose} style={{ backgroundColor: DW_COLORS.primary }}>
      Done
    </Button>
  );

  return (
    <DetailModalShell
      isOpen={open}
      onClose={onClose}
      icon={<Sparkle24Regular style={{ width: 28, height: 28 }} />}
      title={`Session Preparation \u2014 ${serviceRequest.ClientName || 'Client'}`}
      subtitle={subtitle}
      statusBadge={statusBadge}
      steps={sessionPrep ? buildPrepSteps(sessionPrep.Status) : undefined}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as TabValue)}
      footerLeft={footerLeft}
      footerRight={footerRight}
    >
      {loading ? (
        <div className={styles.loadingOverlay}>
          <Spinner size="large" />
          <Text>Loading session preparation...</Text>
        </div>
      ) : !aiConfigured ? (
        <div className={styles.aiNotConfigured}>
          <SparkleRegular style={{ fontSize: '48px', color: '#888' }} />
          <Text size={500} weight="semibold">AI Features Not Configured</Text>
          <Text style={{ color: '#888' }}>
            Azure OpenAI is not configured. Please add the required environment variables
            to enable AI-powered session preparation.
          </Text>
        </div>
      ) : generating ? (
        <div className={styles.loadingOverlay}>
          <Spinner size="large" />
          <Text>Generating AI content...</Text>
          <Text size={200} style={{ color: '#888' }}>This may take a moment</Text>
        </div>
      ) : sessionPrep ? (
        <>
          {activeTab === 'profile' && (
            <ClientProfileCard
              profile={sessionPrep.ClientProfile}
              onRegenerate={() => handleRegenerateSection('clientProfile')}
            />
          )}
          {activeTab === 'talking-points' && (
            <TalkingPointsEditor
              talkingPoints={sessionPrep.TalkingPoints}
              context={buildAIContext()}
              onUpdate={(points) => handleUpdateSessionPrep({ talkingPoints: points })}
              onRegenerate={() => handleRegenerateSection('talkingPoints')}
            />
          )}
          {activeTab === 'resources' && (
            <ResourcePicker
              resources={sessionPrep.SuggestedResources}
              onUpdate={(resources) => handleUpdateSessionPrep({ suggestedResources: resources })}
              onRegenerate={() => handleRegenerateSection('suggestedResources')}
            />
          )}
          {activeTab === 'agenda' && (
            <MeetingAgendaView
              agenda={sessionPrep.MeetingAgenda}
              onRegenerate={() => handleRegenerateSection('meetingAgenda')}
            />
          )}
          {activeTab === 'checklist' && (
            <PrepChecklist
              items={sessionPrep.ChecklistItems}
              onUpdate={(items) => handleUpdateSessionPrep({ checklistItems: items })}
            />
          )}
          {activeTab === 'notes' && (
            <MeetingNotesEditor
              data={sessionPrep.MeetingNotes ?? null}
              onChange={handleSaveMeetingNotes}
              readOnly={sessionPrep.Status === 'Ready'}
              defaultAttendees={[
                serviceRequest.AccountManagerName,
                serviceRequest.AssignedSpecialistName || '',
                serviceRequest.ContactName || '',
              ].filter(Boolean)}
            />
          )}
        </>
      ) : (
        <div className={styles.loadingOverlay}>
          <Text>Unable to load session preparation</Text>
        </div>
      )}
    </DetailModalShell>
  );
};
