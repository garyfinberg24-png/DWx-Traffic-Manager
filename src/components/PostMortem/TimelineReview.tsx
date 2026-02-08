import React from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Text,
} from '@fluentui/react-components';
import type {
  TimelineAnalysis,
  RootCauseAnalysis,
} from '../../types/PostMortem';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('24px'),
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorNeutralBackground3,
    flexWrap: 'wrap',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
  },
  summaryLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
  },
  efficiencyBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '14px',
    fontWeight: '700',
  },
  stageRow: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    ...shorthands.padding('8px', '0'),
  },
  stageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
  },
  stageName: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
  },
  stageDays: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
  },
  bottleneckFlag: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('1px', '6px'),
    ...shorthands.borderRadius('3px'),
    fontSize: '10px',
    fontWeight: '700',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  barContainer: {
    width: '100%',
    height: '12px',
    backgroundColor: '#e5e7eb',
    ...shorthands.borderRadius('6px'),
    ...shorthands.overflow('hidden'),
    position: 'relative',
  },
  barFill: {
    height: '100%',
    ...shorthands.borderRadius('6px'),
    transition: 'width 0.3s ease',
    minWidth: '4px',
  },
  bulletList: {
    ...shorthands.margin('0'),
    ...shorthands.padding('0', '0', '0', '20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
  },
  bulletItem: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
  },
  criticalPathRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    flexWrap: 'wrap',
  },
  pathStage: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('4px', '10px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  pathArrow: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
  rootCauseCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  primaryCause: {
    fontSize: '15px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
    lineHeight: '22px',
  },
  subSectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('4px', '0', '0', '0'),
  },
  preventabilityBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '12px',
    fontWeight: '600',
  },
  emptyMessage: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    ...shorthands.padding('12px', '0'),
  },
  summaryText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '20px',
    fontStyle: 'italic',
  },
});

interface TimelineReviewProps {
  timelineAnalysis?: TimelineAnalysis;
  rootCauseAnalysis?: RootCauseAnalysis;
}

const getBarColor = (daysInStage: number, targetDays: number): string => {
  if (targetDays <= 0) return '#10b981';
  const ratio = daysInStage / targetDays;
  if (ratio <= 0.75) return '#10b981'; // green
  if (ratio <= 1.0) return '#f59e0b'; // yellow
  return '#ef4444'; // red
};

const getBarWidth = (daysInStage: number, targetDays: number): number => {
  if (targetDays <= 0) return 100;
  const pct = (daysInStage / targetDays) * 100;
  return Math.min(pct, 100);
};

const getEfficiencyColor = (
  efficiency: TimelineAnalysis['efficiency'],
): { bg: string; text: string } => {
  switch (efficiency) {
    case 'Excellent':
      return { bg: '#d1fae5', text: '#065f46' };
    case 'Good':
      return { bg: '#dbeafe', text: '#1e40af' };
    case 'Acceptable':
      return { bg: '#fef3c7', text: '#92400e' };
    case 'Poor':
      return { bg: '#fee2e2', text: '#991b1b' };
  }
};

const getPreventabilityColor = (
  value: RootCauseAnalysis['preventability'],
): { bg: string; text: string } => {
  switch (value) {
    case 'Highly Preventable':
      return { bg: '#d1fae5', text: '#065f46' };
    case 'Somewhat Preventable':
      return { bg: '#fef3c7', text: '#92400e' };
    case 'Unavoidable':
      return { bg: '#fee2e2', text: '#991b1b' };
  }
};

export const TimelineReview: React.FC<TimelineReviewProps> = ({
  timelineAnalysis,
  rootCauseAnalysis,
}) => {
  const styles = useStyles();

  if (!timelineAnalysis && !rootCauseAnalysis) {
    return (
      <div className={styles.container}>
        <Text className={styles.emptyMessage}>
          No timeline analysis available. Generate AI analysis to populate
          this section.
        </Text>
      </div>
    );
  }

  const effColors = timelineAnalysis
    ? getEfficiencyColor(timelineAnalysis.efficiency)
    : null;

  return (
    <div className={styles.container}>
      {/* Summary Card */}
      {timelineAnalysis && (
        <>
          <div className={styles.section}>
            <Text className={styles.sectionTitle}>
              Timeline Overview
            </Text>
            <div className={styles.summaryCard}>
              <div className={styles.summaryItem}>
                <Text className={styles.summaryLabel}>
                  Efficiency
                </Text>
                <span
                  className={styles.efficiencyBadge}
                  style={{
                    backgroundColor: effColors!.bg,
                    color: effColors!.text,
                  }}
                >
                  {timelineAnalysis.efficiency}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <Text className={styles.summaryLabel}>
                  Total Duration
                </Text>
                <Text className={styles.summaryValue}>
                  {timelineAnalysis.totalDuration} days
                </Text>
              </div>
              <div className={styles.summaryItem}>
                <Text className={styles.summaryLabel}>
                  SLA Breaches
                </Text>
                <Text
                  className={styles.summaryValue}
                  style={{
                    color:
                      timelineAnalysis.slaBreachCount > 0
                        ? '#dc2626'
                        : '#065f46',
                  }}
                >
                  {timelineAnalysis.slaBreachCount}
                </Text>
              </div>
            </div>
            {timelineAnalysis.summary && (
              <Text className={styles.summaryText}>
                {timelineAnalysis.summary}
              </Text>
            )}
          </div>

          {/* Stage Timeline */}
          <div className={styles.section}>
            <Text className={styles.sectionTitle}>
              Stage Breakdown
            </Text>
            {timelineAnalysis.stageBreakdown.map((stage, index) => (
              <div key={index} className={styles.stageRow}>
                <div className={styles.stageHeader}>
                  <span className={styles.stageName}>
                    {stage.stage}
                    {stage.bottleneck && (
                      <span className={styles.bottleneckFlag}>
                        Bottleneck
                      </span>
                    )}
                  </span>
                  <Text className={styles.stageDays}>
                    {stage.daysInStage}d / {stage.targetDays}d target
                    {stage.variance > 0 && (
                      <span style={{ color: '#dc2626', marginLeft: '6px' }}>
                        (+{stage.variance}d)
                      </span>
                    )}
                  </Text>
                </div>
                <div className={styles.barContainer}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${getBarWidth(stage.daysInStage, stage.targetDays)}%`,
                      backgroundColor: getBarColor(
                        stage.daysInStage,
                        stage.targetDays,
                      ),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Delay Factors */}
          {timelineAnalysis.delayFactors.length > 0 && (
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>
                Delay Factors
              </Text>
              <ul className={styles.bulletList}>
                {timelineAnalysis.delayFactors.map((factor, i) => (
                  <li key={i} className={styles.bulletItem}>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Critical Path */}
          {timelineAnalysis.criticalPath.length > 0 && (
            <div className={styles.section}>
              <Text className={styles.sectionTitle}>
                Critical Path
              </Text>
              <div className={styles.criticalPathRow}>
                {timelineAnalysis.criticalPath.map(
                  (stage, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <span className={styles.pathArrow}>
                          {'->'}
                        </span>
                      )}
                      <span className={styles.pathStage}>
                        {stage}
                      </span>
                    </React.Fragment>
                  ),
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Root Cause Analysis */}
      {rootCauseAnalysis && (
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>
            Root Cause Analysis
          </Text>
          <div className={styles.rootCauseCard}>
            <div>
              <Text className={styles.subSectionTitle}>
                Primary Cause
              </Text>
              <Text className={styles.primaryCause}>
                {rootCauseAnalysis.primaryCause}
              </Text>
            </div>

            {rootCauseAnalysis.contributingFactors.length > 0 && (
              <div>
                <Text className={styles.subSectionTitle}>
                  Contributing Factors
                </Text>
                <ul className={styles.bulletList}>
                  {rootCauseAnalysis.contributingFactors.map(
                    (factor, i) => (
                      <li key={i} className={styles.bulletItem}>
                        {factor}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}

            <div>
              <Text className={styles.subSectionTitle}>
                Preventability
              </Text>
              <span
                className={styles.preventabilityBadge}
                style={{
                  backgroundColor: getPreventabilityColor(
                    rootCauseAnalysis.preventability,
                  ).bg,
                  color: getPreventabilityColor(
                    rootCauseAnalysis.preventability,
                  ).text,
                }}
              >
                {rootCauseAnalysis.preventability}
              </span>
            </div>

            {rootCauseAnalysis.recommendations.length > 0 && (
              <div>
                <Text className={styles.subSectionTitle}>
                  Recommendations
                </Text>
                <ul className={styles.bulletList}>
                  {rootCauseAnalysis.recommendations.map(
                    (rec, i) => (
                      <li key={i} className={styles.bulletItem}>
                        {rec}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineReview;
