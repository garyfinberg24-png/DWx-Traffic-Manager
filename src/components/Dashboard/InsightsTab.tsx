import React, { useState, useEffect, useMemo } from 'react';
import { Text, Spinner, makeStyles } from '@fluentui/react-components';
import {
  Lightbulb24Regular,
  Warning24Regular,
  Checkmark24Regular,
  BookOpen24Regular,
  People24Regular,
} from '@fluentui/react-icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { postMortemService } from '../../services/PostMortemService';
import { ServiceRequest } from '../../types/ServiceRequest';
import {
  PostMortem,
  OWNER_COLORS,
  ISSUE_CATEGORY_DESCRIPTIONS,
} from '../../types/PostMortem';
import { DW_COLORS } from '../../utils/buttonStyles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = (value: any, name?: any, props?: any) => any;

const useStyles = makeStyles({
  // Hero cards row — 4 columns
  heroRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 1000px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  heroCard: {
    borderRadius: '12px',
    padding: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
  },
  heroIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  heroLabel: {
    fontSize: '13px',
    fontWeight: '500',
    opacity: 0.9,
  },
  heroValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1',
  },
  heroSub: {
    fontSize: '12px',
    opacity: 0.8,
    marginTop: '4px',
  },

  // Charts row
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
    borderTop: '1px solid #d0d0d0',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '16px',
  },

  // Table section
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    borderTop: '1px solid #d0d0d0',
    marginBottom: '24px',
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
  },
  patternTableRow: {
    display: 'grid',
    gridTemplateColumns: '140px 80px 100px 130px 1fr',
    gap: '8px',
    padding: '12px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  amTableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 80px 100px 100px 1fr 80px',
    gap: '8px',
    padding: '12px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  headerCell: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '600',
    whiteSpace: 'nowrap' as const,
  },
  categoryBadge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '500',
    marginRight: '4px',
    marginBottom: '2px',
    backgroundColor: '#f0f0f0',
    color: '#424242',
  },

  // Empty / loading
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px',
    color: '#616161',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px',
  },

  // Improvement section
  improvementCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    borderTop: '1px solid #d0d0d0',
    marginBottom: '24px',
  },
  improvementItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'flex-start',
  },
  improvementRank: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: DW_COLORS.teal,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  improvementContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flexGrow: 1,
  },
});

interface InsightsTabProps {
  serviceRequests: ServiceRequest[];
}

export const InsightsTab: React.FC<InsightsTabProps> = (_props) => {
  const styles = useStyles();

  const [postMortems, setPostMortems] = useState<PostMortem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const pms = await postMortemService.getAllPostMortems();
        setPostMortems(pms);
      } catch (err) {
        console.error('Failed to load post-mortems:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const insights = useMemo(() => {
    if (postMortems.length === 0) return null;
    return postMortemService.getInsightsSummary(postMortems);
  }, [postMortems]);

  // Derive top owner for hero subtitle
  const topOwner = useMemo(() => {
    if (!insights || insights.issuesByOwner.length === 0) return null;
    const sorted = [...insights.issuesByOwner].sort((a, b) => b.count - a.count);
    return sorted[0];
  }, [insights]);

  // Pie chart colors from OWNER_COLORS
  const ownerPieColors = useMemo(() => {
    if (!insights) return [];
    return insights.issuesByOwner.map((entry) => OWNER_COLORS[entry.owner]?.text || '#616161');
  }, [insights]);

  // System improvement opportunities — top 5 recurring patterns with recommendations
  const improvementOpportunities = useMemo(() => {
    if (!insights || insights.recurringPatterns.length === 0) return [];

    return insights.recurringPatterns.slice(0, 5).map((pattern) => {
      // Generate a recommendation based on the category
      const recommendations: Record<string, string> = {
        Communication: 'Establish structured communication cadences with SLA-bound response windows and automated escalation triggers.',
        Process: 'Review and document the end-to-end workflow with mandatory checkpoints at each stage transition.',
        Technical: 'Implement pre-engagement technical readiness checklists and environment validation scripts.',
        Commercial: 'Standardize pricing frameworks and introduce early commercial alignment workshops in the Discovery phase.',
        'Client-Side': 'Set clear expectations in engagement kickoff, including RACI matrix and decision-maker availability commitments.',
        Resource: 'Adopt capacity planning dashboards with forecasted demand visibility and cross-training programs.',
        Documentation: 'Create standardized document templates for each funnel stage and enforce completeness gates.',
      };

      return {
        category: pattern.issueCategory,
        frequency: pattern.frequency,
        affectedDeals: pattern.affectedDeals,
        recommendation: recommendations[pattern.issueCategory] || 'Review and address root causes for this category across affected deals.',
        description: pattern.topDescription,
      };
    });
  }, [insights]);

  // Issue rate color helper
  const getIssueRateColor = (rate: number): string => {
    if (rate < 0.5) return '#107c10';
    if (rate <= 1) return '#f7630c';
    return '#d13438';
  };

  // Score color helper
  const getScoreColor = (score: number): string => {
    if (score > 75) return '#107c10';
    if (score > 50) return '#f7630c';
    return '#d13438';
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" label="Loading post-mortem insights..." />
      </div>
    );
  }

  // Empty state
  if (!insights || insights.totalPostMortems === 0) {
    return (
      <div className={styles.emptyState}>
        <Lightbulb24Regular style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#a0a0a0' }} />
        <Text style={{ fontSize: '16px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
          No Post-Mortem Data Yet
        </Text>
        <Text style={{ fontSize: '14px', color: '#616161' }}>
          Post-mortems are automatically created when deals are marked as Won or Lost. Insights will appear here once data is available.
        </Text>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Cards Row — 4 columns */}
      <div className={styles.heroRow}>
        {/* Total Post-Mortems */}
        <div className={styles.heroCard} style={{ backgroundColor: DW_COLORS.primary, color: 'white' }}>
          <div className={styles.heroIcon}>
            <Lightbulb24Regular style={{ width: '28px', height: '28px' }} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Total Post-Mortems</span>
            <span className={styles.heroValue}>{insights.totalPostMortems}</span>
            <span className={styles.heroSub}>
              Won: {insights.wonPostMortems}, Lost: {insights.lostPostMortems}
            </span>
          </div>
        </div>

        {/* Total Issues */}
        <div className={styles.heroCard} style={{ backgroundColor: '#c2410c', color: 'white' }}>
          <div className={styles.heroIcon}>
            <Warning24Regular style={{ width: '28px', height: '28px' }} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Total Issues</span>
            <span className={styles.heroValue}>{insights.totalIssues}</span>
            <span className={styles.heroSub}>
              {topOwner ? `Top: ${topOwner.owner} (${topOwner.count})` : 'No issues'}
            </span>
          </div>
        </div>

        {/* Open Actions */}
        <div className={styles.heroCard} style={{ backgroundColor: DW_COLORS.teal, color: 'white' }}>
          <div className={styles.heroIcon}>
            <Checkmark24Regular style={{ width: '28px', height: '28px' }} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Open Actions</span>
            <span className={styles.heroValue}>{insights.actionItemsOpen}</span>
            <span className={styles.heroSub}>
              {insights.actionItemsCompleted} completed
            </span>
          </div>
        </div>

        {/* Lessons Catalog */}
        <div className={styles.heroCard} style={{ backgroundColor: '#6d28d9', color: 'white' }}>
          <div className={styles.heroIcon}>
            <BookOpen24Regular style={{ width: '28px', height: '28px' }} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Lessons Catalog</span>
            <span className={styles.heroValue}>{insights.lessonsLearned}</span>
            <span className={styles.heroSub}>
              Across all post-mortems
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row: Issues by Category (horizontal bar) + Issues by Owner (pie) */}
      <div className={styles.chartsRow}>
        {/* Issues by Category — Horizontal BarChart */}
        <div className={styles.chartCard}>
          <Text className={styles.chartTitle}>Issues by Category</Text>
          {insights.issuesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={insights.issuesByCategory.map((entry) => ({
                  name: entry.category,
                  count: entry.count,
                }))}
                layout="vertical"
                margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={((value: number) => [`${value} issue${value !== 1 ? 's' : ''}`, 'Count']) as TooltipFormatter}
                />
                <Bar dataKey="count" name="Issues" fill={DW_COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
              <Text style={{ fontStyle: 'italic' }}>No issue data available</Text>
            </div>
          )}
        </div>

        {/* Issues by Owner — PieChart */}
        <div className={styles.chartCard}>
          <Text className={styles.chartTitle}>Issues by Owner</Text>
          {insights.issuesByOwner.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={insights.issuesByOwner.map((entry) => ({
                    name: entry.owner,
                    value: entry.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine
                  dataKey="value"
                >
                  {insights.issuesByOwner.map((_entry, index) => (
                    <Cell key={index} fill={ownerPieColors[index]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={((value: number) => [`${value} issue${value !== 1 ? 's' : ''}`, 'Count']) as TooltipFormatter}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
              <Text style={{ fontStyle: 'italic' }}>No owner data available</Text>
            </div>
          )}
        </div>
      </div>

      {/* Recurring Patterns Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <Text className={styles.chartTitle} style={{ marginBottom: 0 }}>Recurring Patterns</Text>
        </div>
        {insights.recurringPatterns.length > 0 ? (
          <>
            {/* Header Row */}
            <div className={styles.patternTableRow} style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e1e1e1' }}>
              <Text className={styles.headerCell}>Category</Text>
              <Text className={styles.headerCell}>Frequency</Text>
              <Text className={styles.headerCell}>Affected Deals</Text>
              <Text className={styles.headerCell}>Primary Owner</Text>
              <Text className={styles.headerCell}>Top Description</Text>
            </div>
            {/* Data Rows */}
            {insights.recurringPatterns.map((pattern, index) => {
              const ownerColor = OWNER_COLORS[pattern.primaryOwner];
              const categoryDesc = ISSUE_CATEGORY_DESCRIPTIONS[pattern.issueCategory];
              return (
                <div key={index} className={styles.patternTableRow}>
                  <div title={categoryDesc}>
                    <Text style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                      {pattern.issueCategory}
                    </Text>
                  </div>
                  <Text style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                    {pattern.frequency}
                  </Text>
                  <Text style={{ fontSize: '13px', color: '#424242' }}>
                    {pattern.affectedDeals} deal{pattern.affectedDeals !== 1 ? 's' : ''}
                  </Text>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor: ownerColor?.bg || '#e5e7eb',
                      color: ownerColor?.text || '#4b5563',
                    }}
                  >
                    {pattern.primaryOwner}
                  </span>
                  <Text
                    style={{
                      fontSize: '12px',
                      color: '#616161',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={pattern.topDescription}
                  >
                    {pattern.topDescription}
                  </Text>
                </div>
              );
            })}
          </>
        ) : (
          <div className={styles.emptyState}>
            <Text>No recurring patterns identified yet.</Text>
          </div>
        )}
      </div>

      {/* AM Performance Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <People24Regular style={{ width: '20px', height: '20px', color: '#616161' }} />
            <Text className={styles.chartTitle} style={{ marginBottom: 0 }}>AM Performance</Text>
          </div>
        </div>
        {insights.amPerformance.length > 0 ? (
          <>
            {/* Header Row */}
            <div className={styles.amTableRow} style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e1e1e1' }}>
              <Text className={styles.headerCell}>AM Name</Text>
              <Text className={styles.headerCell}>Total Deals</Text>
              <Text className={styles.headerCell}>Issues Attr.</Text>
              <Text className={styles.headerCell}>Issue Rate</Text>
              <Text className={styles.headerCell}>Top Categories</Text>
              <Text className={styles.headerCell}>Avg Score</Text>
            </div>
            {/* Data Rows */}
            {insights.amPerformance.map((am) => (
              <div key={am.amEmail} className={styles.amTableRow}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#242424' }}>{am.amName}</div>
                  <div style={{ fontSize: '11px', color: '#616161' }}>{am.amEmail}</div>
                </div>
                <Text style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                  {am.totalDeals}
                </Text>
                <Text style={{ fontSize: '13px', fontWeight: 600, color: '#424242' }}>
                  {am.issuesAttributed}
                </Text>
                <Text style={{ fontSize: '13px', fontWeight: 600, color: getIssueRateColor(am.issueRate) }}>
                  {am.issueRate.toFixed(2)}
                </Text>
                <div>
                  {am.topIssueCategories.map((cat, idx) => (
                    <span key={idx} className={styles.categoryBadge}>
                      {cat.category} ({cat.count})
                    </span>
                  ))}
                  {am.topIssueCategories.length === 0 && (
                    <Text style={{ fontSize: '12px', color: '#a0a0a0', fontStyle: 'italic' }}>None</Text>
                  )}
                </div>
                <Text style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: am.avgAccountabilityScore !== undefined
                    ? getScoreColor(am.avgAccountabilityScore)
                    : '#a0a0a0',
                }}>
                  {am.avgAccountabilityScore !== undefined
                    ? `${am.avgAccountabilityScore.toFixed(1)}`
                    : '--'}
                </Text>
              </div>
            ))}
          </>
        ) : (
          <div className={styles.emptyState}>
            <Text>No AM performance data available.</Text>
          </div>
        )}
      </div>

      {/* System Improvement Opportunities */}
      <div className={styles.improvementCard}>
        <div className={styles.tableHeader}>
          <Text className={styles.chartTitle} style={{ marginBottom: 0 }}>System Improvement Opportunities</Text>
        </div>
        {improvementOpportunities.length > 0 ? (
          <>
            {improvementOpportunities.map((opp, index) => (
              <div key={index} className={styles.improvementItem}>
                <div className={styles.improvementRank}>{index + 1}</div>
                <div className={styles.improvementContent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: '14px', fontWeight: 600, color: '#242424' }}>
                      {opp.category}
                    </Text>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}
                    >
                      {opp.frequency} occurrence{opp.frequency !== 1 ? 's' : ''}
                    </span>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}
                    >
                      {opp.affectedDeals} deal{opp.affectedDeals !== 1 ? 's' : ''} affected
                    </span>
                  </div>
                  <Text style={{ fontSize: '12px', color: '#616161', marginTop: '2px' }}>
                    Most common: {opp.description}
                  </Text>
                  <Text style={{ fontSize: '13px', color: '#424242', marginTop: '4px' }}>
                    {opp.recommendation}
                  </Text>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className={styles.emptyState}>
            <Text>Not enough data to identify improvement opportunities.</Text>
          </div>
        )}
      </div>
    </div>
  );
};
