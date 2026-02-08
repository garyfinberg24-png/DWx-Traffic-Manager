/**
 * PostMortemTab — Per-deal post-mortem view (8th tab in RequestDetails)
 * Manages loading from SP, editing issues/lessons/actions, AI analysis, status workflow, and saving.
 * v2.14.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Spinner,
  Text,
  Textarea,
  makeStyles,
} from '@fluentui/react-components';
import {
  Sparkle24Regular,
  Save24Regular,
  ArrowRight24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { format } from 'date-fns';
import { postMortemService } from '../../services/PostMortemService';
import { ServiceRequest } from '../../types/ServiceRequest';
import {
  PostMortem,
  PostMortemIssue,
  LessonLearned,
  ActionItem,
  PostMortemStatus,
  POST_MORTEM_STATUS_TRANSITIONS,
  PM_STATUS_COLORS,
  PostMortemAIContext,
} from '../../types/PostMortem';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DW_COLORS } from '../../utils/buttonStyles';
import { IssueEditor } from './IssueEditor';
import { LessonEditor } from './LessonEditor';
import { ActionItemsSection } from './ActionItemsSection';
import { TimelineReview } from './TimelineReview';
import { AccountabilityCard } from './AccountabilityCard';

// ============================================================================
// Props
// ============================================================================

interface PostMortemTabProps {
  request: ServiceRequest;
  isManager: boolean;
}

// ============================================================================
// Module-level components (NOT inside render — see CLAUDE.md anti-pattern note)
// ============================================================================

const SectionHeader: React.FC<{ title: string; count?: number }> = ({ title, count }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '24px', marginBottom: '12px' }}>
    <Text weight="semibold" size={400}>{title}</Text>
    {count !== undefined && (
      <span style={{
        backgroundColor: '#e5e7eb',
        color: '#4b5563',
        fontSize: '12px',
        padding: '2px 8px',
        borderRadius: '10px',
      }}>
        {count}
      </span>
    )}
  </div>
);

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px 0',
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
  aiTimestamp: {
    marginTop: '16px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  },
});

// ============================================================================
// Component
// ============================================================================

export const PostMortemTab: React.FC<PostMortemTabProps> = ({ request, isManager }) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // ── State ──────────────────────────────────────────────────────
  const [postMortem, setPostMortem] = useState<PostMortem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [specialistNotes, setSpecialistNotes] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [issues, setIssues] = useState<PostMortemIssue[]>([]);
  const [lessons, setLessons] = useState<LessonLearned[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ── Derived ────────────────────────────────────────────────────
  const readOnly = postMortem?.Status === 'Closed';

  // ── Load on mount ──────────────────────────────────────────────
  const loadPostMortem = useCallback(async () => {
    setLoading(true);
    try {
      const pm = await postMortemService.getPostMortemByRequestId(request.Id);
      if (pm) {
        setPostMortem(pm);
        setIssues(pm.Issues);
        setLessons(pm.Lessons);
        setActionItems(pm.ActionItems);
        setSpecialistNotes(pm.SpecialistNotes || '');
        setManagerNotes(pm.ManagerNotes || '');
      }
    } catch (err) {
      console.error('Failed to load post-mortem:', err);
    } finally {
      setLoading(false);
    }
  }, [request.Id]);

  useEffect(() => {
    loadPostMortem();
  }, [loadPostMortem]);

  // ── Change handlers ────────────────────────────────────────────
  const handleIssuesChange = useCallback((updated: PostMortemIssue[]) => {
    setIssues(updated);
    setHasUnsavedChanges(true);
  }, []);

  const handleLessonsChange = useCallback((updated: LessonLearned[]) => {
    setLessons(updated);
    setHasUnsavedChanges(true);
  }, []);

  const handleActionItemsChange = useCallback((updated: ActionItem[]) => {
    setActionItems(updated);
    setHasUnsavedChanges(true);
  }, []);

  const handleSpecialistNotesChange = useCallback((_: unknown, data: { value: string }) => {
    setSpecialistNotes(data.value);
    setHasUnsavedChanges(true);
  }, []);

  const handleManagerNotesChange = useCallback((_: unknown, data: { value: string }) => {
    setManagerNotes(data.value);
    setHasUnsavedChanges(true);
  }, []);

  // ── Save handler ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!postMortem) return;
    setSaving(true);
    try {
      await postMortemService.updatePostMortem(postMortem.Id, {
        Issues: issues,
        Lessons: lessons,
        ActionItems: actionItems,
        SpecialistNotes: specialistNotes,
        ManagerNotes: managerNotes,
      });
      setHasUnsavedChanges(false);
      showSuccess('Changes saved', 'Post-mortem has been updated successfully.');
      await loadPostMortem();
    } catch (err) {
      console.error('Failed to save post-mortem:', err);
      showError('Save failed', 'Could not save post-mortem changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [postMortem, issues, lessons, actionItems, specialistNotes, managerNotes, showSuccess, showError, loadPostMortem]);

  // ── AI Generation handler ─────────────────────────────────────
  const handleGenerateAI = useCallback(async () => {
    if (!postMortem) return;
    setGeneratingAI(true);
    try {
      // Build AI context from request data
      const context: PostMortemAIContext = {
        clientName: request.ClientName,
        serviceName: request.ServiceName,
        serviceCategory: request.ServiceCategory,
        finalStage: request.FunnelStage as 'Won' | 'Lost',
        winLossReason: request.WinLossReason,
        dealValue: request.DealValue,
        accountManagerName: request.AccountManagerName,
        specialistName: request.AssignedSpecialistName,
        slaBreakdown: [],
        auditLogSummary: [],
      };

      // Try to get SLA breakdown
      try {
        const { slaService } = await import('../../services/SLAService');
        const breakdown = slaService.getStageBreakdown(request);
        context.slaBreakdown = breakdown.map((b) => ({
          stage: b.stage,
          daysInStage: b.daysInStage,
          targetDays: b.targetDays,
          status: b.status,
        }));
      } catch {
        // SLA data not available — continue with empty array
      }

      // Try to get audit log summary
      try {
        const { auditService } = await import('../../services/AuditService');
        const logs = await auditService.getAuditLogs({
          entityType: 'ServiceRequest',
          entityId: String(request.Id),
        });
        context.auditLogSummary = logs.slice(0, 20).map(
          (log) => `${log.Action}: ${log.EntityName} (${log.PerformedBy}, ${log.Timestamp})`
        );
      } catch {
        // Audit log not available — continue with empty array
      }

      // Try to get checklist completion
      if (request.DealChecklist && request.DealChecklist.length > 0) {
        const completed = request.DealChecklist.filter((item) => item.isCompleted).length;
        context.checklistCompletion = Math.round((completed / request.DealChecklist.length) * 100);
      }

      // Call 6 AI methods in parallel
      const {
        generatePostMortemTimelineAnalysis,
        generateAccountabilityAssessment,
        generateRootCauseAnalysis,
        suggestPostMortemIssues,
        suggestPostMortemLessons,
        suggestPostMortemActionItems,
      } = await import('../../services/AIPreparationService');

      const [timeline, accountability, rootCause, suggestedIssues, suggestedLessons, suggestedActions] =
        await Promise.allSettled([
          generatePostMortemTimelineAnalysis(context),
          generateAccountabilityAssessment(context),
          generateRootCauseAnalysis(context),
          suggestPostMortemIssues(context),
          suggestPostMortemLessons(context),
          suggestPostMortemActionItems(context),
        ]);

      // Extract fulfilled values
      const analysisPayload: Parameters<typeof postMortemService.saveAIAnalysis>[1] = {};

      if (timeline.status === 'fulfilled' && timeline.value) {
        analysisPayload.timelineAnalysis = timeline.value;
      }
      if (accountability.status === 'fulfilled' && accountability.value) {
        analysisPayload.accountabilityAssessment = accountability.value;
      }
      if (rootCause.status === 'fulfilled' && rootCause.value) {
        analysisPayload.rootCauseAnalysis = rootCause.value;
      }
      if (suggestedIssues.status === 'fulfilled' && suggestedIssues.value) {
        analysisPayload.suggestedIssues = suggestedIssues.value;
      }
      if (suggestedLessons.status === 'fulfilled' && suggestedLessons.value) {
        analysisPayload.suggestedLessons = suggestedLessons.value;
      }
      if (suggestedActions.status === 'fulfilled' && suggestedActions.value) {
        analysisPayload.suggestedActions = suggestedActions.value;
      }

      // Save all results
      await postMortemService.saveAIAnalysis(postMortem.Id, analysisPayload);

      // Reload post-mortem data
      await loadPostMortem();
      setHasUnsavedChanges(false);
      showSuccess('AI analysis generated', 'AI analysis generated successfully.');
    } catch (err) {
      console.error('Failed to generate AI analysis:', err);
      showError('AI generation failed', 'Could not generate AI analysis. Please try again.');
    } finally {
      setGeneratingAI(false);
    }
  }, [postMortem, request, showSuccess, showError, loadPostMortem]);

  // ── Status transition handler ──────────────────────────────────
  const handleStatusTransition = useCallback(async (newStatus: PostMortemStatus) => {
    if (!postMortem) return;
    setSaving(true);
    try {
      const updates: Parameters<typeof postMortemService.updatePostMortem>[1] = {
        Status: newStatus,
      };

      // Set ReviewedDate/ReviewedBy when completing review
      if (newStatus === 'Review Complete') {
        updates.ReviewedDate = new Date().toISOString();
        updates.ReviewedBy = user?.displayName || user?.email || '';
      }

      // Set ClosedDate when closing
      if (newStatus === 'Closed') {
        updates.ClosedDate = new Date().toISOString();
      }

      await postMortemService.updatePostMortem(postMortem.Id, updates);
      showSuccess('Status updated', `Post-mortem status changed to "${newStatus}".`);
      await loadPostMortem();
    } catch (err) {
      console.error('Failed to update post-mortem status:', err);
      showError('Status update failed', 'Could not update post-mortem status. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [postMortem, user, showSuccess, showError, loadPostMortem]);

  // ── Status transition buttons ──────────────────────────────────
  const renderStatusButtons = () => {
    if (!postMortem || readOnly) return null;

    const currentStatus = postMortem.Status;
    const allowedTransitions = POST_MORTEM_STATUS_TRANSITIONS[currentStatus] || [];

    const buttons: React.ReactNode[] = [];

    if (currentStatus === 'Draft' && allowedTransitions.includes('Under Review')) {
      buttons.push(
        <Button
          key="submit-review"
          appearance="primary"
          icon={<ArrowRight24Regular />}
          disabled={saving}
          onClick={() => handleStatusTransition('Under Review')}
          style={{ backgroundColor: DW_COLORS.primary }}
        >
          Submit for Review
        </Button>
      );
    }

    if (currentStatus === 'Under Review') {
      if (isManager && allowedTransitions.includes('Review Complete')) {
        buttons.push(
          <Button
            key="complete-review"
            appearance="primary"
            icon={<Checkmark24Regular />}
            disabled={saving}
            onClick={() => handleStatusTransition('Review Complete')}
            style={{ backgroundColor: DW_COLORS.success }}
          >
            Complete Review
          </Button>
        );
      }
      if (isManager && allowedTransitions.includes('Draft')) {
        buttons.push(
          <Button
            key="return-draft"
            appearance="secondary"
            disabled={saving}
            onClick={() => handleStatusTransition('Draft')}
          >
            Return to Draft
          </Button>
        );
      }
    }

    if (currentStatus === 'Review Complete' && allowedTransitions.includes('Actions In Progress')) {
      buttons.push(
        <Button
          key="start-actions"
          appearance="primary"
          icon={<ArrowRight24Regular />}
          disabled={saving}
          onClick={() => handleStatusTransition('Actions In Progress')}
          style={{ backgroundColor: DW_COLORS.teal }}
        >
          Start Actions
        </Button>
      );
    }

    if (currentStatus === 'Actions In Progress' && allowedTransitions.includes('Closed')) {
      buttons.push(
        <Button
          key="close"
          appearance="primary"
          icon={<Checkmark24Regular />}
          disabled={saving}
          onClick={() => handleStatusTransition('Closed')}
          style={{ backgroundColor: DW_COLORS.success }}
        >
          Close Post Mortem
        </Button>
      );
    }

    return buttons;
  };

  // ── Render ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" label="Loading post-mortem..." />
      </div>
    );
  }

  if (!postMortem) {
    return (
      <div className={styles.emptyState}>
        <Text size={300} weight="semibold">No post-mortem record found for this deal.</Text>
        <Text size={200} style={{ color: '#616161' }}>
          A post-mortem is automatically created when a deal is marked as Won or Lost.
        </Text>
      </div>
    );
  }

  // Permissions for notes editing
  const canEditSpecialistNotes = !readOnly && (isManager || user?.email === postMortem.SpecialistEmail);
  const canEditManagerNotes = !readOnly && isManager;

  const statusColors = PM_STATUS_COLORS[postMortem.Status];

  return (
    <div className={styles.container}>
      {/* Header bar: Status badge + action buttons */}
      <div className={styles.headerBar}>
        <span style={{
          backgroundColor: statusColors.bg,
          color: statusColors.text,
          fontSize: '13px',
          fontWeight: 600,
          padding: '4px 12px',
          borderRadius: '12px',
        }}>
          {postMortem.Status}
        </span>

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
          {!readOnly && (
            <Button
              appearance="secondary"
              icon={<Sparkle24Regular />}
              disabled={generatingAI}
              onClick={handleGenerateAI}
            >
              {generatingAI ? 'Generating...' : 'Generate AI Analysis'}
            </Button>
          )}
          {renderStatusButtons()}
        </div>
      </div>

      {/* AI generation progress banner */}
      {generatingAI && (
        <div className={styles.progressBanner}>
          <Spinner size="tiny" />
          <Text size={200}>Generating AI analysis... This may take a moment.</Text>
        </div>
      )}

      {/* Timeline & Root Cause Analysis section */}
      <SectionHeader title="Timeline & Root Cause Analysis" />
      <TimelineReview
        timelineAnalysis={postMortem.TimelineAnalysis}
        rootCauseAnalysis={postMortem.RootCauseAnalysis}
      />

      {/* Accountability section */}
      <SectionHeader title="Accountability Assessment" />
      <AccountabilityCard assessment={postMortem.AccountabilityAssessment} />

      {/* Issues section */}
      <SectionHeader title="Issues Identified" count={issues.length} />
      <IssueEditor issues={issues} onChange={handleIssuesChange} readOnly={readOnly} />

      {/* Lessons section */}
      <SectionHeader title="Lessons Learned" count={lessons.length} />
      <LessonEditor lessons={lessons} onChange={handleLessonsChange} readOnly={readOnly} />

      {/* Action Items section */}
      <SectionHeader title="Action Items" count={actionItems.length} />
      <ActionItemsSection actionItems={actionItems} onChange={handleActionItemsChange} readOnly={readOnly} />

      {/* Notes section */}
      <SectionHeader title="Notes" />
      <div className={styles.notesGrid}>
        <div className={styles.noteColumn}>
          <Text weight="semibold" size={300}>Specialist Notes</Text>
          <Textarea
            value={specialistNotes}
            onChange={handleSpecialistNotesChange}
            disabled={!canEditSpecialistNotes}
            placeholder="Notes from the specialist..."
            resize="vertical"
            rows={4}
          />
        </div>
        <div className={styles.noteColumn}>
          <Text weight="semibold" size={300}>Manager Notes</Text>
          <Textarea
            value={managerNotes}
            onChange={handleManagerNotesChange}
            disabled={!canEditManagerNotes}
            placeholder="Notes from the manager..."
            resize="vertical"
            rows={4}
          />
        </div>
      </div>

      {/* AI Generated timestamp */}
      {postMortem.AIGeneratedAt && (
        <div className={styles.aiTimestamp}>
          <Text size={200} style={{ color: '#616161' }}>
            AI analysis generated: {format(new Date(postMortem.AIGeneratedAt), 'MMM d, yyyy h:mm a')}
          </Text>
        </div>
      )}
    </div>
  );
};

export default PostMortemTab;
