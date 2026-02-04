import React from 'react';
import { makeStyles } from '@fluentui/react-components';
import {
  People24Regular,
  Trophy24Regular,
  Ribbon24Regular,
  Fire24Regular,
  ArrowTrendingLines24Regular,
} from '@fluentui/react-icons';
import { TeamStats } from '../../types/Gamification';

interface TeamStatsCardProps {
  stats: TeamStats;
}

const useStyles = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e1e1e1',
    backgroundColor: '#ffffff',
  },
  iconWrapper: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    width: '22px',
    height: '22px',
    color: '#ffffff',
  },
  textGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  label: {
    fontSize: '11px',
    color: '#666',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    fontWeight: '500',
  },
  value: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#242424',
  },
  subtext: {
    fontSize: '11px',
    color: '#999',
  },
});

export const TeamStatsCard: React.FC<TeamStatsCardProps> = ({ stats }) => {
  const styles = useStyles();

  const cards = [
    {
      icon: <People24Regular className={styles.icon} />,
      bg: '#1e6b7b',
      label: 'Active AMs',
      value: stats.amCount.toString(),
      subtext: `${stats.totalPoints.toLocaleString()} total pts`,
    },
    {
      icon: <Trophy24Regular className={styles.icon} />,
      bg: '#ca5010',
      label: 'Avg Points',
      value: stats.averagePoints.toLocaleString(),
      subtext: `Top: ${stats.mostActiveAM}`,
    },
    {
      icon: <ArrowTrendingLines24Regular className={styles.icon} />,
      bg: '#107c10',
      label: 'Avg Conversion',
      value: `${stats.averageConversion}%`,
      subtext: 'Team average',
    },
    {
      icon: <Ribbon24Regular className={styles.icon} />,
      bg: '#5c2d91',
      label: 'Badges Awarded',
      value: stats.totalBadgesAwarded.toString(),
      subtext: 'Across all AMs',
    },
    {
      icon: <Fire24Regular className={styles.icon} />,
      bg: '#d83b01',
      label: 'Top Streak',
      value: `${stats.topStreakWeeks}w`,
      subtext: stats.topStreakAM,
    },
  ];

  return (
    <div className={styles.container}>
      {cards.map((card, i) => (
        <div key={i} className={styles.card}>
          <div className={styles.iconWrapper} style={{ backgroundColor: card.bg }}>
            {card.icon}
          </div>
          <div className={styles.textGroup}>
            <span className={styles.label}>{card.label}</span>
            <span className={styles.value}>{card.value}</span>
            <span className={styles.subtext}>{card.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
