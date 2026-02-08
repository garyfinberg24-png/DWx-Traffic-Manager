/**
 * DWx Traffic Manager - Post Mortem Service
 * CRUD operations for post-mortem records with AI analysis orchestration,
 * action item tracking, and aggregate analytics computation.
 */

import { config } from '../config/environmentConfig';
import { getGraphService } from './serviceFactory';
import { auditService } from './AuditService';
import {
  PostMortem,
  PostMortemInput,
  PostMortemIssue,
  LessonLearned,
  ActionItem,
  PostMortemStatus,
  TimelineAnalysis,
  AccountabilityAssessment,
  RootCauseAnalysis,
  InsightsSummary,
  RecurringPattern,
  AMPerformancePattern,
  IssueCategory,
  IssueOwner,
  IssueSeverity,
  ISSUE_CATEGORIES,
  ISSUE_OWNERS,
  deserializeIssues,
  deserializeLessons,
  deserializeActionItems,
  deserializeTimelineAnalysis,
  deserializeAccountability,
  deserializeRootCause,
  ACTION_STATUS_TRANSITIONS,
} from '../types/PostMortem';

const LIST_NAME = config.sharepoint.postMortemsListName;

class PostMortemService {
  // ─── CRUD Methods ───────────────────────────────────────────────

  /**
   * Create a new post-mortem record
   */
  async createPostMortem(input: PostMortemInput): Promise<PostMortem> {
    try {
      const graphService = getGraphService();

      const title = `Post Mortem - ${input.ClientName} - ${input.ServiceName}`;

      const itemData: Record<string, unknown> = {
        Title: title,
        ServiceRequestId: input.ServiceRequestId,
        ClientName: input.ClientName,
        ServiceName: input.ServiceName,
        FinalStage: input.FinalStage,
        WinLossReason: input.WinLossReason || '',
        DealValue: input.DealValue || 0,
        AccountManagerName: input.AccountManagerName,
        AccountManagerEmail: input.AccountManagerEmail,
        SpecialistName: input.SpecialistName || '',
        SpecialistEmail: input.SpecialistEmail || '',
        Status: input.Status || 'Draft',
        Issues_JSON: JSON.stringify(input.Issues || []),
        Lessons_JSON: JSON.stringify(input.Lessons || []),
        ActionItems_JSON: JSON.stringify(input.ActionItems || []),
        SpecialistNotes: input.SpecialistNotes || '',
        ManagerNotes: input.ManagerNotes || '',
      };

      const createdItem = await graphService.createListItem(LIST_NAME, itemData);
      const postMortem = this.mapToPostMortem(createdItem as Record<string, unknown>);

      // Audit log
      await auditService.logCreate('PostMortem', postMortem.Id, title, {
        serviceRequestId: input.ServiceRequestId,
        clientName: input.ClientName,
        serviceName: input.ServiceName,
        finalStage: input.FinalStage,
      });

      return postMortem;
    } catch (error) {
      console.error('[PostMortemService] Failed to create post mortem:', error);
      throw error;
    }
  }

  /**
   * Get a post-mortem by its SharePoint list item ID
   */
  async getPostMortemById(id: number): Promise<PostMortem | null> {
    try {
      const graphService = getGraphService();
      const item = await graphService.getListItemById(LIST_NAME, id) as Record<string, unknown> | null;
      if (!item) return null;
      return this.mapToPostMortem(item);
    } catch (error) {
      console.error('[PostMortemService] Failed to get post mortem by ID:', error);
      return null;
    }
  }

  /**
   * Get post-mortem linked to a service request
   */
  async getPostMortemByRequestId(requestId: number): Promise<PostMortem | null> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME) as Record<string, unknown>[];

      const mapped = items.map((item) => this.mapToPostMortem(item));
      const match = mapped.find((pm) => pm.ServiceRequestId === requestId);
      return match || null;
    } catch (error) {
      console.error('[PostMortemService] Failed to get post mortem by request ID:', error);
      return null;
    }
  }

  /**
   * Get all post-mortem records
   */
  async getAllPostMortems(): Promise<PostMortem[]> {
    try {
      const graphService = getGraphService();
      const items = await graphService.getListItems(LIST_NAME) as Record<string, unknown>[];
      return items.map((item) => this.mapToPostMortem(item));
    } catch (error) {
      console.error('[PostMortemService] Failed to get all post mortems:', error);
      return [];
    }
  }

  /**
   * Update a post-mortem with partial data
   */
  async updatePostMortem(
    id: number,
    updates: Partial<PostMortemInput> & {
      Status?: PostMortemStatus;
      ReviewedDate?: string;
      ReviewedBy?: string;
      ClosedDate?: string;
      ManagerNotes?: string;
      SpecialistNotes?: string;
    }
  ): Promise<PostMortem> {
    try {
      const graphService = getGraphService();

      // Get current state for audit
      const current = await this.getPostMortemById(id);
      if (!current) {
        throw new Error('Post mortem not found');
      }

      // Build update payload
      const updateData: Record<string, unknown> = {};

      if (updates.ClientName !== undefined) updateData.ClientName = updates.ClientName;
      if (updates.ServiceName !== undefined) updateData.ServiceName = updates.ServiceName;
      if (updates.FinalStage !== undefined) updateData.FinalStage = updates.FinalStage;
      if (updates.WinLossReason !== undefined) updateData.WinLossReason = updates.WinLossReason;
      if (updates.DealValue !== undefined) updateData.DealValue = updates.DealValue;
      if (updates.AccountManagerName !== undefined) updateData.AccountManagerName = updates.AccountManagerName;
      if (updates.AccountManagerEmail !== undefined) updateData.AccountManagerEmail = updates.AccountManagerEmail;
      if (updates.SpecialistName !== undefined) updateData.SpecialistName = updates.SpecialistName;
      if (updates.SpecialistEmail !== undefined) updateData.SpecialistEmail = updates.SpecialistEmail;
      if (updates.Status !== undefined) updateData.Status = updates.Status;
      if (updates.ReviewedDate !== undefined) updateData.ReviewedDate = updates.ReviewedDate;
      if (updates.ReviewedBy !== undefined) updateData.ReviewedBy = updates.ReviewedBy;
      if (updates.ClosedDate !== undefined) updateData.ClosedDate = updates.ClosedDate;
      if (updates.SpecialistNotes !== undefined) updateData.SpecialistNotes = updates.SpecialistNotes;
      if (updates.ManagerNotes !== undefined) updateData.ManagerNotes = updates.ManagerNotes;

      // JSON columns
      if (updates.Issues !== undefined) {
        updateData.Issues_JSON = JSON.stringify(updates.Issues);
      }
      if (updates.Lessons !== undefined) {
        updateData.Lessons_JSON = JSON.stringify(updates.Lessons);
      }
      if (updates.ActionItems !== undefined) {
        updateData.ActionItems_JSON = JSON.stringify(updates.ActionItems);
      }

      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated item
      const updated = await this.getPostMortemById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated post mortem');
      }

      // Audit log
      await auditService.logUpdate(
        'PostMortem',
        id,
        current.Title,
        { status: current.Status },
        { status: updated.Status, ...updates.Status ? { statusChange: `${current.Status} -> ${updates.Status}` } : {} }
      );

      return updated;
    } catch (error) {
      console.error('[PostMortemService] Failed to update post mortem:', error);
      throw error;
    }
  }

  /**
   * Update a single action item within a post-mortem
   * Validates status transitions using ACTION_STATUS_TRANSITIONS
   */
  async updateActionItem(
    postMortemId: number,
    actionItemId: string,
    updates: Partial<ActionItem>
  ): Promise<PostMortem> {
    try {
      const current = await this.getPostMortemById(postMortemId);
      if (!current) {
        throw new Error('Post mortem not found');
      }

      const actionIndex = current.ActionItems.findIndex((ai) => ai.id === actionItemId);
      if (actionIndex === -1) {
        throw new Error(`Action item '${actionItemId}' not found`);
      }

      const existingItem = current.ActionItems[actionIndex];

      // Validate status transition if status is being changed
      if (updates.status && updates.status !== existingItem.status) {
        const allowedTransitions = ACTION_STATUS_TRANSITIONS[existingItem.status];
        if (!allowedTransitions.includes(updates.status)) {
          throw new Error(
            `Invalid status transition: '${existingItem.status}' -> '${updates.status}'. Allowed: ${allowedTransitions.join(', ')}`
          );
        }
      }

      // Merge updates into the action item
      const updatedActionItems = [...current.ActionItems];
      updatedActionItems[actionIndex] = {
        ...existingItem,
        ...updates,
        // Preserve id and aiGenerated
        id: existingItem.id,
        aiGenerated: existingItem.aiGenerated,
      };

      // Set completedDate automatically if transitioning to Completed
      if (updates.status === 'Completed' && !updatedActionItems[actionIndex].completedDate) {
        updatedActionItems[actionIndex].completedDate = new Date().toISOString();
      }

      const graphService = getGraphService();
      await graphService.updateListItem(LIST_NAME, postMortemId, {
        ActionItems_JSON: JSON.stringify(updatedActionItems),
      });

      // Get updated item
      const updated = await this.getPostMortemById(postMortemId);
      if (!updated) {
        throw new Error('Failed to retrieve updated post mortem');
      }

      // Audit log
      await auditService.logUpdate(
        'PostMortem',
        postMortemId,
        current.Title,
        { actionItemId, status: existingItem.status },
        { actionItemId, status: updatedActionItems[actionIndex].status }
      );

      return updated;
    } catch (error) {
      console.error('[PostMortemService] Failed to update action item:', error);
      throw error;
    }
  }

  // ─── AI Orchestration ──────────────────────────────────────────

  /**
   * Save AI-generated analysis results into a post-mortem
   * Appends suggested items to existing arrays and saves AI analysis sections
   */
  async saveAIAnalysis(
    id: number,
    analysis: {
      timelineAnalysis?: TimelineAnalysis;
      accountabilityAssessment?: AccountabilityAssessment;
      rootCauseAnalysis?: RootCauseAnalysis;
      suggestedIssues?: PostMortemIssue[];
      suggestedLessons?: LessonLearned[];
      suggestedActions?: ActionItem[];
    }
  ): Promise<PostMortem> {
    try {
      const current = await this.getPostMortemById(id);
      if (!current) {
        throw new Error('Post mortem not found');
      }

      const updateData: Record<string, unknown> = {
        AIGeneratedAt: new Date().toISOString(),
      };

      // Save AI analysis sections
      if (analysis.timelineAnalysis !== undefined) {
        updateData.TimelineAnalysis_JSON = JSON.stringify(analysis.timelineAnalysis);
      }
      if (analysis.accountabilityAssessment !== undefined) {
        updateData.AccountabilityAssessment_JSON = JSON.stringify(analysis.accountabilityAssessment);
      }
      if (analysis.rootCauseAnalysis !== undefined) {
        updateData.RootCauseAnalysis_JSON = JSON.stringify(analysis.rootCauseAnalysis);
      }

      // Append suggested items to existing arrays
      if (analysis.suggestedIssues && analysis.suggestedIssues.length > 0) {
        const mergedIssues = [...current.Issues, ...analysis.suggestedIssues];
        updateData.Issues_JSON = JSON.stringify(mergedIssues);
      }
      if (analysis.suggestedLessons && analysis.suggestedLessons.length > 0) {
        const mergedLessons = [...current.Lessons, ...analysis.suggestedLessons];
        updateData.Lessons_JSON = JSON.stringify(mergedLessons);
      }
      if (analysis.suggestedActions && analysis.suggestedActions.length > 0) {
        const mergedActions = [...current.ActionItems, ...analysis.suggestedActions];
        updateData.ActionItems_JSON = JSON.stringify(mergedActions);
      }

      const graphService = getGraphService();
      await graphService.updateListItem(LIST_NAME, id, updateData);

      // Get updated item
      const updated = await this.getPostMortemById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated post mortem');
      }

      // Audit log
      await auditService.logUpdate(
        'PostMortem',
        id,
        current.Title,
        { aiGeneratedAt: current.AIGeneratedAt },
        {
          aiGeneratedAt: updated.AIGeneratedAt,
          sectionsGenerated: [
            analysis.timelineAnalysis ? 'timeline' : null,
            analysis.accountabilityAssessment ? 'accountability' : null,
            analysis.rootCauseAnalysis ? 'rootCause' : null,
            analysis.suggestedIssues?.length ? `${analysis.suggestedIssues.length} issues` : null,
            analysis.suggestedLessons?.length ? `${analysis.suggestedLessons.length} lessons` : null,
            analysis.suggestedActions?.length ? `${analysis.suggestedActions.length} actions` : null,
          ].filter(Boolean),
        }
      );

      return updated;
    } catch (error) {
      console.error('[PostMortemService] Failed to save AI analysis:', error);
      throw error;
    }
  }

  // ─── Analytics Methods (Pure Computation) ──────────────────────

  /**
   * Aggregate insights summary across all post-mortems
   * Pure computation — no SharePoint calls
   */
  getInsightsSummary(postMortems: PostMortem[]): InsightsSummary {
    const allIssues = postMortems.flatMap((pm) => pm.Issues);
    const allActionItems = postMortems.flatMap((pm) => pm.ActionItems);
    const allLessons = postMortems.flatMap((pm) => pm.Lessons);

    // Issues by owner
    const issuesByOwner: { owner: IssueOwner; count: number }[] = ISSUE_OWNERS.map((owner) => ({
      owner,
      count: allIssues.filter((i) => i.owner === owner).length,
    })).filter((entry) => entry.count > 0);

    // Issues by category
    const issuesByCategory: { category: IssueCategory; count: number }[] = ISSUE_CATEGORIES.map((category) => ({
      category,
      count: allIssues.filter((i) => i.category === category).length,
    })).filter((entry) => entry.count > 0);

    // Issues by severity
    const severities: IssueSeverity[] = ['Minor', 'Moderate', 'Major', 'Critical'];
    const issuesBySeverity: { severity: IssueSeverity; count: number }[] = severities.map((severity) => ({
      severity,
      count: allIssues.filter((i) => i.severity === severity).length,
    })).filter((entry) => entry.count > 0);

    // Average SLA breaches per deal
    const totalSLABreaches = postMortems.reduce(
      (sum, pm) => sum + (pm.TimelineAnalysis?.slaBreachCount || 0),
      0
    );
    const avgSLABreachesPerDeal = postMortems.length > 0
      ? totalSLABreaches / postMortems.length
      : 0;

    return {
      totalPostMortems: postMortems.length,
      wonPostMortems: postMortems.filter((pm) => pm.FinalStage === 'Won').length,
      lostPostMortems: postMortems.filter((pm) => pm.FinalStage === 'Lost').length,
      totalIssues: allIssues.length,
      issuesByOwner,
      issuesByCategory,
      issuesBySeverity,
      recurringPatterns: this.getRecurringPatterns(postMortems),
      amPerformance: this.getAMPerformancePatterns(postMortems),
      actionItemsOpen: allActionItems.filter((ai) => ai.status === 'Open' || ai.status === 'In Progress' || ai.status === 'Blocked').length,
      actionItemsCompleted: allActionItems.filter((ai) => ai.status === 'Completed').length,
      lessonsLearned: allLessons.length,
      avgSLABreachesPerDeal: Math.round(avgSLABreachesPerDeal * 100) / 100,
    };
  }

  /**
   * Identify recurring issue patterns across post-mortems
   * Groups issues by category, counts frequency across deals, identifies primary owner
   * Pure computation — no SharePoint calls
   */
  getRecurringPatterns(postMortems: PostMortem[]): RecurringPattern[] {
    const categoryMap: Record<string, {
      issues: PostMortemIssue[];
      dealIds: Set<number>;
    }> = {};

    for (const pm of postMortems) {
      for (const issue of pm.Issues) {
        if (!categoryMap[issue.category]) {
          categoryMap[issue.category] = { issues: [], dealIds: new Set() };
        }
        categoryMap[issue.category].issues.push(issue);
        categoryMap[issue.category].dealIds.add(pm.Id);
      }
    }

    const patterns: RecurringPattern[] = Object.entries(categoryMap)
      .filter(([, data]) => data.issues.length > 0)
      .map(([category, data]) => {
        // Count owners to find primary
        const ownerCounts: Record<string, number> = {};
        for (const issue of data.issues) {
          ownerCounts[issue.owner] = (ownerCounts[issue.owner] || 0) + 1;
        }
        const primaryOwner = Object.entries(ownerCounts)
          .sort(([, a], [, b]) => b - a)[0][0] as IssueOwner;

        // Find most common description for top description
        const descCounts: Record<string, number> = {};
        for (const issue of data.issues) {
          const desc = issue.description.substring(0, 100);
          descCounts[desc] = (descCounts[desc] || 0) + 1;
        }
        const topDescription = Object.entries(descCounts)
          .sort(([, a], [, b]) => b - a)[0][0];

        return {
          issueCategory: category as IssueCategory,
          frequency: data.issues.length,
          affectedDeals: data.dealIds.size,
          primaryOwner,
          trend: 'Stable' as const,
          topDescription,
        };
      })
      .sort((a, b) => b.frequency - a.frequency);

    return patterns;
  }

  /**
   * Analyze AM performance patterns based on issues attributed to Account Managers
   * Groups by AM email, calculates issue rate per deal
   * Pure computation — no SharePoint calls
   */
  getAMPerformancePatterns(postMortems: PostMortem[]): AMPerformancePattern[] {
    const amMap: Record<string, {
      amName: string;
      totalDeals: number;
      issues: PostMortemIssue[];
      accountabilityScores: number[];
    }> = {};

    for (const pm of postMortems) {
      const email = pm.AccountManagerEmail;
      if (!amMap[email]) {
        amMap[email] = {
          amName: pm.AccountManagerName,
          totalDeals: 0,
          issues: [],
          accountabilityScores: [],
        };
      }
      amMap[email].totalDeals += 1;

      // Collect issues attributed to Account Manager
      const amIssues = pm.Issues.filter((i) => i.owner === 'Account Manager');
      amMap[email].issues.push(...amIssues);

      // Collect AM accountability scores
      if (pm.AccountabilityAssessment?.amAccountability?.score !== undefined) {
        amMap[email].accountabilityScores.push(pm.AccountabilityAssessment.amAccountability.score);
      }
    }

    const patterns: AMPerformancePattern[] = Object.entries(amMap).map(([amEmail, data]) => {
      // Count issues by category
      const categoryCounts: Record<string, number> = {};
      for (const issue of data.issues) {
        categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
      }

      const topIssueCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({ category: category as IssueCategory, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      // Calculate average accountability score
      const avgAccountabilityScore = data.accountabilityScores.length > 0
        ? data.accountabilityScores.reduce((sum, s) => sum + s, 0) / data.accountabilityScores.length
        : undefined;

      return {
        amEmail,
        amName: data.amName,
        totalDeals: data.totalDeals,
        issuesAttributed: data.issues.length,
        issueRate: data.totalDeals > 0
          ? Math.round((data.issues.length / data.totalDeals) * 100) / 100
          : 0,
        topIssueCategories,
        avgAccountabilityScore: avgAccountabilityScore !== undefined
          ? Math.round(avgAccountabilityScore * 10) / 10
          : undefined,
      };
    });

    return patterns.sort((a, b) => b.issueRate - a.issueRate);
  }

  // ─── Private Mapper ────────────────────────────────────────────

  /**
   * Map raw SharePoint item to PostMortem interface
   */
  private mapToPostMortem(item: Record<string, unknown>): PostMortem {
    const fields = (item.fields as Record<string, unknown>) || item;

    return {
      Id: Number(item.id || item.Id || fields.id || fields.Id || 0),
      Title: String(fields.Title || ''),
      ServiceRequestId: Number(fields.ServiceRequestId || 0),
      ClientName: String(fields.ClientName || ''),
      ServiceName: String(fields.ServiceName || ''),
      FinalStage: (fields.FinalStage as 'Won' | 'Lost') || 'Lost',
      WinLossReason: fields.WinLossReason as string | undefined,
      DealValue: fields.DealValue ? Number(fields.DealValue) : undefined,
      AccountManagerName: String(fields.AccountManagerName || ''),
      AccountManagerEmail: String(fields.AccountManagerEmail || ''),
      SpecialistName: fields.SpecialistName as string | undefined,
      SpecialistEmail: fields.SpecialistEmail as string | undefined,
      Status: (fields.Status as PostMortemStatus) || 'Draft',
      ReviewedDate: fields.ReviewedDate as string | undefined,
      ReviewedBy: fields.ReviewedBy as string | undefined,
      ClosedDate: fields.ClosedDate as string | undefined,
      Issues: deserializeIssues(fields.Issues_JSON as string),
      Lessons: deserializeLessons(fields.Lessons_JSON as string),
      ActionItems: deserializeActionItems(fields.ActionItems_JSON as string),
      TimelineAnalysis: deserializeTimelineAnalysis(fields.TimelineAnalysis_JSON as string),
      AccountabilityAssessment: deserializeAccountability(fields.AccountabilityAssessment_JSON as string),
      RootCauseAnalysis: deserializeRootCause(fields.RootCauseAnalysis_JSON as string),
      SpecialistNotes: fields.SpecialistNotes as string | undefined,
      ManagerNotes: fields.ManagerNotes as string | undefined,
      AIGeneratedAt: fields.AIGeneratedAt as string | undefined,
      Created: String(fields.Created || new Date().toISOString()),
      Modified: fields.Modified as string | undefined,
    };
  }
}

// Export singleton instance
export const postMortemService = new PostMortemService();
