import React from 'react';
import { makeStyles, Text } from '@fluentui/react-components';
import { BADGE_DEFINITIONS } from '../../services/GamificationService';
import { BadgeTier } from '../../types/Gamification';
import { BadgeIcon } from './BadgeIcon';

interface BadgeGridProps {
  earnedBadgeIds: string[];
}

const tierColors: Record<BadgeTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
};

const tierLabels: Record<BadgeTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
};

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '12px',
  },
  badgeCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px 12px',
    borderRadius: '8px',
    border: '1px solid #e1e1e1',
    backgroundColor: '#ffffff',
    transition: 'box-shadow 0.2s, transform 0.2s',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      transform: 'translateY(-1px)',
    },
  },
  badgeCardEarned: {
    border: '1px solid #1e6b7b',
    backgroundColor: '#f0f9fb',
  },
  badgeName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
    textAlign: 'center' as const,
  },
  badgeNameLocked: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#999',
    textAlign: 'center' as const,
  },
  badgeDescription: {
    fontSize: '11px',
    color: '#666',
    textAlign: 'center' as const,
    lineHeight: '1.3',
  },
  tierTag: {
    fontSize: '10px',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '2px 8px',
    borderRadius: '10px',
    color: '#fff',
  },
  summary: {
    fontSize: '13px',
    color: '#666',
  },
});

export const BadgeGrid: React.FC<BadgeGridProps> = ({ earnedBadgeIds }) => {
  const styles = useStyles();
  const earnedSet = new Set(earnedBadgeIds);
  const earnedCount = earnedBadgeIds.length;

  return (
    <div className={styles.container}>
      <Text className={styles.summary}>
        {earnedCount} of {BADGE_DEFINITIONS.length} badges earned
      </Text>
      <div className={styles.grid}>
        {BADGE_DEFINITIONS.map((badge) => {
          const earned = earnedSet.has(badge.id);
          return (
            <div
              key={badge.id}
              className={`${styles.badgeCard} ${earned ? styles.badgeCardEarned : ''}`}
            >
              <BadgeIcon badgeId={badge.id} earned={earned} size="large" showTooltip={false} />
              <span className={earned ? styles.badgeName : styles.badgeNameLocked}>
                {badge.name}
              </span>
              <span className={styles.badgeDescription}>
                {earned ? badge.description : badge.unlockCriteria}
              </span>
              <span
                className={styles.tierTag}
                style={{
                  backgroundColor: earned ? tierColors[badge.tier] : '#ccc',
                }}
              >
                {tierLabels[badge.tier]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
