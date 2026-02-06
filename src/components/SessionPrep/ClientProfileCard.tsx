/**
 * DWx Traffic Manager - Client Profile Card
 * Displays AI-generated client profile using DetailModalShell section patterns.
 */

import React from 'react';
import {
  Text,
  Button,
  Badge,
  makeStyles,
} from '@fluentui/react-components';
import {
  BuildingRegular,
  HistoryRegular,
  NewsRegular,
  TargetRegular,
  PeopleTeamRegular,
  ArrowSyncRegular,
  SparkleRegular,
} from '@fluentui/react-icons';
import { ClientProfile, EngagementSummary } from '../../types/SessionPreparation';
import { DetailSection, DetailGrid, DetailField } from '../MyRequests/DetailModalShell';
import { format } from 'date-fns';

const useStyles = makeStyles({
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px',
    textAlign: 'center',
    color: '#888',
  },
  profileCards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  profileCard: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  profileCardFull: {
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #eee',
    gridColumn: '1 / -1',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#424242',
  },
  cardHeaderIcon: {
    width: '16px',
    height: '16px',
    color: '#1a5a8a',
  },
  cardText: {
    fontSize: '13px',
    color: '#616161',
    lineHeight: '1.6',
  },
  bulletList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  bulletItem: {
    fontSize: '13px',
    color: '#616161',
    padding: '4px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
  },
  bullet: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#1a5a8a',
    flexShrink: 0,
    marginTop: '6px',
  },
  engagementRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #eee',
  },
  engagementInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  engagementMeta: {
    fontSize: '12px',
    color: '#888',
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
        <Text size={400} weight="semibold">No Client Profile Generated</Text>
        <Text>Click "Generate AI Content" to create a client profile based on available data.</Text>
      </div>
    );
  }

  return (
    <DetailSection
      icon={<BuildingRegular />}
      title="Client Overview"
      editButton={
        <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={onRegenerate} size="small">
          Regenerate
        </Button>
      }
    >
      <DetailGrid columns={2}>
        <DetailField label="Industry">
          <span style={{ background: '#e8f4f6', color: '#1e6b7b', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
            {profile.industry}
          </span>
        </DetailField>
        <DetailField label="Company Size">{profile.companySize}</DetailField>
      </DetailGrid>

      <div style={{ marginTop: '16px' }}>
        <div className={styles.profileCards}>
          {/* Company Overview - full width */}
          <div className={styles.profileCardFull}>
            <div className={styles.cardHeader}>
              <BuildingRegular className={styles.cardHeaderIcon} />
              Company Overview
            </div>
            <span className={styles.cardText}>{profile.companyOverview}</span>
          </div>

          {/* Key Stakeholders */}
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <PeopleTeamRegular className={styles.cardHeaderIcon} />
              Key Stakeholders
            </div>
            {profile.keyStakeholders.length > 0 ? (
              <ul className={styles.bulletList}>
                {profile.keyStakeholders.map((s, i) => (
                  <li key={i} className={styles.bulletItem}>
                    <span className={styles.bullet} />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.cardText}>No stakeholders identified</span>
            )}
          </div>

          {/* Pain Points */}
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <TargetRegular className={styles.cardHeaderIcon} />
              Potential Pain Points
            </div>
            {profile.potentialPainPoints.length > 0 ? (
              <ul className={styles.bulletList}>
                {profile.potentialPainPoints.map((p, i) => (
                  <li key={i} className={styles.bulletItem}>
                    <span className={styles.bullet} />
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.cardText}>No pain points identified</span>
            )}
          </div>

          {/* Recent News */}
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <NewsRegular className={styles.cardHeaderIcon} />
              Recent News
            </div>
            {profile.recentNews.length > 0 ? (
              <ul className={styles.bulletList}>
                {profile.recentNews.map((n, i) => (
                  <li key={i} className={styles.bulletItem}>
                    <span className={styles.bullet} />
                    {n}
                  </li>
                ))}
              </ul>
            ) : (
              <span className={styles.cardText}>No recent news found</span>
            )}
          </div>

          {/* Competitive Landscape */}
          <div className={styles.profileCard}>
            <div className={styles.cardHeader}>
              <PeopleTeamRegular className={styles.cardHeaderIcon} />
              Competitive Landscape
            </div>
            <span className={styles.cardText}>{profile.competitorContext || 'No competitor information available'}</span>
          </div>

          {/* Previous Engagements */}
          {profile.previousEngagements.length > 0 && (
            <div className={styles.profileCard}>
              <div className={styles.cardHeader}>
                <HistoryRegular className={styles.cardHeaderIcon} />
                Previous Engagements
              </div>
              {profile.previousEngagements.map((eng: EngagementSummary) => (
                <div key={eng.id} className={styles.engagementRow}>
                  <div className={styles.engagementInfo}>
                    <Text weight="medium" size={200}>{eng.serviceName}</Text>
                    <span className={styles.engagementMeta}>
                      {format(new Date(eng.date), 'MMM d, yyyy')} &middot; R{eng.value.toLocaleString()}
                    </span>
                  </div>
                  <Badge appearance="filled" color={OUTCOME_COLORS[eng.outcome]}>{eng.outcome}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DetailSection>
  );
};
