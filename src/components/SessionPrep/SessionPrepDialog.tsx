/**
 * DWx Traffic Manager - Session Preparation Dialog
 * Main dialog for AI-powered session preparation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Button,
  Text,
  Spinner,
  TabList,
  Tab,
  Badge,
  makeStyles,
  tokens,
  ProgressBar,
} from '@fluentui/react-components';
import {
  Dismiss16Regular,
  PersonRegular,
  ChatRegular,
  FolderRegular,
  CalendarRegular,
  CheckmarkRegular,
  SparkleRegular,
  ArrowSyncRegular,
  CheckmarkCircleRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ServiceRequest } from '../../types/ServiceRequest';
import {
  SessionPreparation,
  SessionPrepStatus,
  AIGenerationContext,
  UpdateSessionPrepInput,
} from '../../types/SessionPreparation';
import { sessionPrepService } from '../../services/SessionPrepService';
import { aiPreparationService, isAIConfigured } from '../../services/AIPreparationService';
import { ClientProfileCard } from './ClientProfileCard';
import { TalkingPointsEditor } from './TalkingPointsEditor';
import { ResourcePicker } from './ResourcePicker';
import { MeetingAgendaView } from './MeetingAgendaView';
import { PrepChecklist } from './PrepChecklist';

const useStyles = makeStyles({
  surface: {
    maxWidth: '900px',
    width: '95vw',
    maxHeight: '90vh',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  statusBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  headerMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: '13px',
  },
  closeButton: {
    minWidth: 'auto',
    padding: tokens.spacingHorizontalXS,
  },
  content: {
    paddingTop: tokens.spacingVerticalM,
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  progressSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  progressLabel: {
    fontSize: '13px',
    fontWeight: '500',
    minWidth: '120px',
  },
  progressBar: {
    flex: 1,
  },
  progressPercent: {
    fontSize: '13px',
    fontWeight: '600',
    minWidth: '50px',
    textAlign: 'right',
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: tokens.spacingVerticalS,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  footerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  aiNotConfigured: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
  },
  loadingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalM,
  },
});

type TabValue = 'profile' | 'talking-points' | 'resources' | 'agenda' | 'checklist';

const STATUS_COLORS: Record<SessionPrepStatus, 'warning' | 'informative' | 'success'> = {
  'Not Started': 'warning',
  'In Progress': 'informative',
  'Ready': 'success',
};

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

      // Check if session prep exists for this service request
      let prep = await sessionPrepService.getSessionPrepByServiceRequest(serviceRequest.Id);

      if (!prep && user) {
        // Create new session prep
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
      previousEngagements: [], // Would be fetched from client history
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

  // Calculate completion percentage
  const completionPercent = sessionPrep
    ? sessionPrepService.calculateCompletionPercentage(sessionPrep)
    : 0;

  const aiConfigured = isAIConfigured();

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.headerTitle}>
                <DialogTitle>Session Preparation</DialogTitle>
                {sessionPrep && (
                  <Badge
                    appearance="filled"
                    color={STATUS_COLORS[sessionPrep.Status]}
                    className={styles.statusBadge}
                  >
                    {sessionPrep.Status}
                  </Badge>
                )}
              </div>
              <Text className={styles.headerMeta}>
                {serviceRequest.ClientName} • {serviceRequest.ServiceName}
                {serviceRequest.ConfirmedDateTime && (
                  <> • {new Date(serviceRequest.ConfirmedDateTime).toLocaleDateString()}</>
                )}
              </Text>
            </div>
            <Button
              appearance="subtle"
              icon={<Dismiss16Regular />}
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close"
            />
          </div>

          <DialogContent className={styles.content}>
            {loading ? (
              <div className={styles.loadingOverlay}>
                <Spinner size="large" />
                <Text>Loading session preparation...</Text>
              </div>
            ) : !aiConfigured ? (
              <div className={styles.aiNotConfigured}>
                <SparkleRegular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
                <Text size={500} weight="semibold">
                  AI Features Not Configured
                </Text>
                <Text style={{ color: tokens.colorNeutralForeground3 }}>
                  Azure OpenAI is not configured. Please add the required environment variables
                  to enable AI-powered session preparation.
                </Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                  See the infrastructure/README.md for deployment instructions.
                </Text>
              </div>
            ) : sessionPrep ? (
              <>
                {/* Progress Section */}
                <div className={styles.progressSection}>
                  <Text className={styles.progressLabel}>Preparation Progress</Text>
                  <ProgressBar
                    className={styles.progressBar}
                    value={completionPercent / 100}
                    color={completionPercent >= 100 ? 'success' : 'brand'}
                  />
                  <Text className={styles.progressPercent}>{completionPercent}%</Text>
                </div>

                {/* Tabs */}
                <TabList
                  selectedValue={activeTab}
                  onTabSelect={(_, data) => setActiveTab(data.value as TabValue)}
                >
                  <Tab value="profile" icon={<PersonRegular />}>
                    Client Profile
                  </Tab>
                  <Tab value="talking-points" icon={<ChatRegular />}>
                    Talking Points
                  </Tab>
                  <Tab value="resources" icon={<FolderRegular />}>
                    Resources
                  </Tab>
                  <Tab value="agenda" icon={<CalendarRegular />}>
                    Agenda
                  </Tab>
                  <Tab value="checklist" icon={<CheckmarkRegular />}>
                    Checklist
                  </Tab>
                </TabList>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                  {generating ? (
                    <div className={styles.loadingOverlay}>
                      <Spinner size="large" />
                      <Text>Generating AI content...</Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        This may take a moment
                      </Text>
                    </div>
                  ) : (
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
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.loadingOverlay}>
                <Text>Unable to load session preparation</Text>
              </div>
            )}
          </DialogContent>

          {/* Footer */}
          {sessionPrep && aiConfigured && (
            <div className={styles.footer}>
              <div className={styles.footerLeft}>
                {!sessionPrep.AIGeneratedAt && (
                  <Button
                    appearance="primary"
                    icon={<SparkleRegular />}
                    onClick={handleGenerateContent}
                    disabled={generating || saving}
                  >
                    Generate AI Content
                  </Button>
                )}
                {sessionPrep.AIGeneratedAt && (
                  <Button
                    appearance="subtle"
                    icon={<ArrowSyncRegular />}
                    onClick={handleGenerateContent}
                    disabled={generating || saving}
                  >
                    Regenerate All
                  </Button>
                )}
              </div>
              <div className={styles.footerActions}>
                <Button appearance="secondary" onClick={onClose}>
                  Close
                </Button>
                {sessionPrep.Status !== 'Ready' && (
                  <Button
                    appearance="primary"
                    icon={<CheckmarkCircleRegular />}
                    onClick={handleMarkAsReady}
                    disabled={generating || saving || completionPercent < 50}
                    style={{ backgroundColor: '#107c10' }}
                  >
                    Mark as Ready
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
