import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Text,
  Button,
} from '@fluentui/react-components';
import {
  ChevronDown20Regular,
  ChevronUp20Regular,
} from '@fluentui/react-icons';
import type { AccountabilityAssessment } from '../../types/PostMortem';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('20px'),
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('16px'),
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: tokens.colorNeutralForeground1,
  },
  scoreDisplay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '52px',
    height: '52px',
    ...shorthands.borderRadius('50%'),
    fontSize: '20px',
    fontWeight: '800',
    flexShrink: 0,
  },
  detailSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    userSelect: 'none',
  },
  detailLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
  },
  detailList: {
    ...shorthands.margin('0'),
    ...shorthands.padding('4px', '0', '0', '20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('3px'),
  },
  detailItem: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '18px',
  },
  overallAssessment: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorNeutralBackground3,
  },
  overallLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  overallText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '22px',
  },
  emptyMessage: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    ...shorthands.padding('12px', '0'),
  },
  systemGapsList: {
    ...shorthands.margin('0'),
    ...shorthands.padding('0', '0', '0', '20px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
});

interface AccountabilityCardProps {
  assessment?: AccountabilityAssessment;
}

const getScoreColor = (score: number): { bg: string; text: string; border: string } => {
  if (score > 75) return { bg: '#d1fae5', text: '#065f46', border: '#10b981' };
  if (score > 50) return { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' };
  return { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' };
};

interface CollapsibleListProps {
  label: string;
  items: string[];
  styles: ReturnType<typeof useStyles>;
  defaultExpanded?: boolean;
}

const CollapsibleList: React.FC<CollapsibleListProps> = ({
  label,
  items,
  styles,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div className={styles.detailSection}>
      <div
        className={styles.detailHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <Text className={styles.detailLabel}>
          {label} ({items.length})
        </Text>
        <Button
          appearance="subtle"
          size="small"
          icon={
            expanded ? (
              <ChevronUp20Regular />
            ) : (
              <ChevronDown20Regular />
            )
          }
          aria-label={expanded ? 'Collapse' : 'Expand'}
        />
      </div>
      {expanded && (
        <ul className={styles.detailList}>
          {items.map((item, i) => (
            <li key={i} className={styles.detailItem}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const AccountabilityCard: React.FC<AccountabilityCardProps> = ({
  assessment,
}) => {
  const styles = useStyles();

  if (!assessment) {
    return (
      <div className={styles.container}>
        <Text className={styles.emptyMessage}>
          No accountability assessment available. Generate AI analysis to
          populate this section.
        </Text>
      </div>
    );
  }

  const amColors = getScoreColor(assessment.amAccountability.score);
  const specColors = getScoreColor(
    assessment.specialistAccountability.score,
  );
  const clientColors = getScoreColor(assessment.clientFactors.score);

  return (
    <div className={styles.container}>
      <Text className={styles.sectionTitle}>
        Accountability Assessment
      </Text>

      <div className={styles.grid}>
        {/* Account Manager Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Text className={styles.cardTitle}>Account Manager</Text>
            <div
              className={styles.scoreDisplay}
              style={{
                backgroundColor: amColors.bg,
                color: amColors.text,
                border: `2px solid ${amColors.border}`,
              }}
            >
              {assessment.amAccountability.score}
            </div>
          </div>
          <CollapsibleList
            label="Strengths"
            items={assessment.amAccountability.strengths}
            styles={styles}
            defaultExpanded
          />
          <CollapsibleList
            label="Improvement Areas"
            items={assessment.amAccountability.improvementAreas}
            styles={styles}
          />
          <CollapsibleList
            label="Specific Issues"
            items={assessment.amAccountability.specificIssues}
            styles={styles}
          />
        </div>

        {/* Specialist Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Text className={styles.cardTitle}>Specialist</Text>
            <div
              className={styles.scoreDisplay}
              style={{
                backgroundColor: specColors.bg,
                color: specColors.text,
                border: `2px solid ${specColors.border}`,
              }}
            >
              {assessment.specialistAccountability.score}
            </div>
          </div>
          <CollapsibleList
            label="Strengths"
            items={assessment.specialistAccountability.strengths}
            styles={styles}
            defaultExpanded
          />
          <CollapsibleList
            label="Improvement Areas"
            items={
              assessment.specialistAccountability.improvementAreas
            }
            styles={styles}
          />
          <CollapsibleList
            label="Specific Issues"
            items={
              assessment.specialistAccountability.specificIssues
            }
            styles={styles}
          />
        </div>

        {/* Client Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Text className={styles.cardTitle}>Client</Text>
            <div
              className={styles.scoreDisplay}
              style={{
                backgroundColor: clientColors.bg,
                color: clientColors.text,
                border: `2px solid ${clientColors.border}`,
              }}
            >
              {assessment.clientFactors.score}
            </div>
          </div>
          <CollapsibleList
            label="Positive Factors"
            items={assessment.clientFactors.positiveFactors}
            styles={styles}
            defaultExpanded
          />
          <CollapsibleList
            label="Challenges"
            items={assessment.clientFactors.challenges}
            styles={styles}
          />
        </div>

        {/* System Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Text className={styles.cardTitle}>System</Text>
          </div>
          {assessment.systemGaps.length > 0 ? (
            <ul className={styles.systemGapsList}>
              {assessment.systemGaps.map((gap, i) => (
                <li key={i} className={styles.detailItem}>
                  {gap}
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.emptyMessage}>
              No system gaps identified.
            </Text>
          )}
        </div>
      </div>

      {/* Overall Assessment */}
      {assessment.overallAssessment && (
        <div className={styles.overallAssessment}>
          <Text className={styles.overallLabel}>
            Overall Assessment
          </Text>
          <Text className={styles.overallText}>
            {assessment.overallAssessment}
          </Text>
        </div>
      )}
    </div>
  );
};

export default AccountabilityCard;
