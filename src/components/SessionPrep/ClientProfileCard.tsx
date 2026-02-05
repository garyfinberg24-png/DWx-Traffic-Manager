/**
 * DWx Traffic Manager - Client Profile Card
 * Displays AI-generated client profile
 */

import React from 'react';
import {
  Text,
  Button,
  Card,
  makeStyles,
  tokens,
  Badge,
} from '@fluentui/react-components';
import {
  BuildingRegular,
  PeopleRegular,
  HistoryRegular,
  NewsRegular,
  TargetRegular,
  PeopleTeamRegular,
  ArrowSyncRegular,
  SparkleRegular,
} from '@fluentui/react-icons';
import { ClientProfile, EngagementSummary } from '../../types/SessionPreparation';
import { format } from 'date-fns';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  generatedAt: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  section: {
    padding: tokens.spacingVerticalM,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    fontWeight: '600',
    fontSize: '14px',
  },
  sectionIcon: {
    color: tokens.colorBrandForeground1,
  },
  content: {
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
  },
  list: {
    margin: 0,
    paddingLeft: tokens.spacingHorizontalL,
  },
  listItem: {
    marginBottom: tokens.spacingVerticalXS,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  engagementItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  engagementInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  engagementValue: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  metaRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    marginBottom: tokens.spacingVerticalS,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: '13px',
  },
});

const OUTCOME_COLORS: Record<string, 'success' | 'danger' | 'warning'> = {
  Won: 'success',
  Lost: 'danger',
  Pending: 'warning',
};

interface ClientProfileCardProps {
  profile: ClientProfile | null;
  onRegenerate: () => void;
}

export const ClientProfileCard: React.FC<ClientProfileCardProps> = ({
  profile,
  onRegenerate,
}) => {
  const styles = useStyles();

  if (!profile) {
    return (
      <div className={styles.emptyState}>
        <SparkleRegular style={{ fontSize: '48px' }} />
        <Text size={400} weight="semibold">
          No Client Profile Generated
        </Text>
        <Text>
          Click "Generate AI Content" to create a client profile based on available data.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <BuildingRegular />
          <Text weight="semibold">Client Profile</Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
          {profile.generatedAt && (
            <Text className={styles.generatedAt}>
              Generated {format(new Date(profile.generatedAt), 'MMM d, yyyy h:mm a')}
            </Text>
          )}
          <Button
            appearance="subtle"
            icon={<ArrowSyncRegular />}
            onClick={onRegenerate}
            size="small"
          >
            Regenerate
          </Button>
        </div>
      </div>

      {/* Meta Info */}
      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <BuildingRegular style={{ width: '16px', height: '16px' }} />
          <Text weight="semibold">{profile.industry}</Text>
        </div>
        <div className={styles.metaItem}>
          <PeopleRegular style={{ width: '16px', height: '16px' }} />
          <Text>{profile.companySize}</Text>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Company Overview */}
        <Card className={styles.section}>
          <div className={styles.sectionTitle}>
            <BuildingRegular className={styles.sectionIcon} />
            Company Overview
          </div>
          <Text className={styles.content}>{profile.companyOverview}</Text>
        </Card>

        {/* Key Stakeholders */}
        <Card className={styles.section}>
          <div className={styles.sectionTitle}>
            <PeopleTeamRegular className={styles.sectionIcon} />
            Key Stakeholders
          </div>
          {profile.keyStakeholders.length > 0 ? (
            <ul className={styles.list}>
              {profile.keyStakeholders.map((stakeholder, index) => (
                <li key={index} className={styles.listItem}>
                  <Text className={styles.content}>{stakeholder}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.content}>No stakeholders identified</Text>
          )}
        </Card>

        {/* Pain Points */}
        <Card className={styles.section}>
          <div className={styles.sectionTitle}>
            <TargetRegular className={styles.sectionIcon} />
            Potential Pain Points
          </div>
          {profile.potentialPainPoints.length > 0 ? (
            <ul className={styles.list}>
              {profile.potentialPainPoints.map((painPoint, index) => (
                <li key={index} className={styles.listItem}>
                  <Text className={styles.content}>{painPoint}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.content}>No pain points identified</Text>
          )}
        </Card>

        {/* Recent News */}
        <Card className={styles.section}>
          <div className={styles.sectionTitle}>
            <NewsRegular className={styles.sectionIcon} />
            Recent News & Developments
          </div>
          {profile.recentNews.length > 0 ? (
            <ul className={styles.list}>
              {profile.recentNews.map((news, index) => (
                <li key={index} className={styles.listItem}>
                  <Text className={styles.content}>{news}</Text>
                </li>
              ))}
            </ul>
          ) : (
            <Text className={styles.content}>No recent news found</Text>
          )}
        </Card>

        {/* Competitor Context */}
        <Card className={styles.section}>
          <div className={styles.sectionTitle}>
            <PeopleTeamRegular className={styles.sectionIcon} />
            Competitive Landscape
          </div>
          <Text className={styles.content}>{profile.competitorContext || 'No competitor information available'}</Text>
        </Card>

        {/* Previous Engagements */}
        <Card className={styles.section}>
          <div className={styles.sectionTitle}>
            <HistoryRegular className={styles.sectionIcon} />
            Previous Engagements
          </div>
          {profile.previousEngagements.length > 0 ? (
            profile.previousEngagements.map((engagement: EngagementSummary) => (
              <div key={engagement.id} className={styles.engagementItem}>
                <div className={styles.engagementInfo}>
                  <Text weight="medium">{engagement.serviceName}</Text>
                  <Text className={styles.engagementValue}>
                    {format(new Date(engagement.date), 'MMM d, yyyy')} • R{engagement.value.toLocaleString()}
                  </Text>
                </div>
                <Badge appearance="filled" color={OUTCOME_COLORS[engagement.outcome]}>
                  {engagement.outcome}
                </Badge>
              </div>
            ))
          ) : (
            <Text className={styles.content}>No previous engagements on record</Text>
          )}
        </Card>
      </div>
    </div>
  );
};
