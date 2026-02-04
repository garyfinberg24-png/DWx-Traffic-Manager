import React, { useMemo, useState } from 'react';
import {
  makeStyles,
  Text,
  ProgressBar,
  Tooltip,
  Button,
} from '@fluentui/react-components';
import {
  Trophy24Regular,
  Fire24Regular,
  ChevronDown24Regular,
  ChevronUp24Regular,
  ArrowTrendingLines24Regular,
} from '@fluentui/react-icons';
import { Booking } from '../../types/Booking';
import { gamificationService, BADGE_DEFINITIONS } from '../../services/GamificationService';

interface PersonalStatsCardProps {
  userEmail: string;
  bookings: Booking[];
}

const useStyles = makeStyles({
  card: {
    marginBottom: '16px',
    border: '1px solid #e1e1e1',
    borderRadius: '12px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2a8a9c 100%)',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerIcon: {
    color: '#ffffff',
    width: '24px',
    height: '24px',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  rankBadge: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '20px',
    padding: '4px 14px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  pointsBadge: {
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '20px',
    padding: '4px 14px',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '13px',
  },
  expandBtn: {
    color: '#ffffff',
    minWidth: 'auto',
    padding: '4px',
  },
  body: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '100px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#242424',
  },
  conversionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  conversionLabel: {
    fontSize: '13px',
    color: '#666',
  },
  conversionValue: {
    fontSize: '14px',
    fontWeight: '600',
  },
  conversionAbove: {
    color: '#107c10',
  },
  conversionBelow: {
    color: '#d83b01',
  },
  conversionEqual: {
    color: '#666',
  },
  badgesSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  badgesLabel: {
    fontSize: '13px',
    color: '#666',
    fontWeight: '500',
    marginRight: '4px',
  },
  badgeItem: {
    fontSize: '20px',
    cursor: 'default',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'scale(1.2)',
    },
  },
  badgeLocked: {
    fontSize: '20px',
    opacity: 0.25,
    filter: 'grayscale(100%)',
    cursor: 'default',
  },
  targetSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  targetLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
  },
  targetRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  targetName: {
    fontSize: '12px',
    color: '#666',
    width: '80px',
    flexShrink: 0,
  },
  targetBar: {
    flex: 1,
  },
  targetPct: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#242424',
    width: '80px',
    textAlign: 'right' as const,
  },
  streakSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  streakIcon: {
    color: '#d83b01',
    width: '20px',
    height: '20px',
  },
  streakText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#d83b01',
  },
  newBadge: {
    animation: 'pulse 1.5s ease-in-out infinite',
    position: 'relative' as const,
  },
  newIndicator: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
    background: '#d83b01',
    color: '#fff',
    fontSize: '8px',
    fontWeight: '700',
    borderRadius: '50%',
    width: '14px',
    height: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f0f0f0',
  },
});

export const PersonalStatsCard: React.FC<PersonalStatsCardProps> = ({ userEmail, bookings }) => {
  const styles = useStyles();
  const [expanded, setExpanded] = useState(false);

  const stats = useMemo(
    () => gamificationService.calculateAMStats(userEmail, bookings),
    [userEmail, bookings]
  );

  const leaderboard = useMemo(
    () => gamificationService.calculateLeaderboard(bookings),
    [bookings]
  );

  // Find this AM's rank from leaderboard
  const rank = useMemo(() => {
    const entry = leaderboard.find(
      (e) => e.accountManagerEmail.toLowerCase() === userEmail.toLowerCase()
    );
    return entry?.rank || 0;
  }, [leaderboard, userEmail]);

  const teamAvgConversion = useMemo(() => {
    if (leaderboard.length === 0) return 0;
    return Math.round(
      leaderboard.reduce((sum, e) => sum + e.conversionRate, 0) / leaderboard.length
    );
  }, [leaderboard]);

  const conversionDiff = stats.conversionRate - teamAvgConversion;

  if (stats.totalBookings === 0) {
    return null; // Don't show card if AM has no bookings
  }

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <Trophy24Regular className={styles.headerIcon} />
          <Text className={styles.headerTitle}>Your Performance</Text>
          {stats.currentStreak > 0 && (
            <div className={styles.streakSection}>
              <Fire24Regular className={styles.streakIcon} style={{ color: '#ffd700' }} />
              <span style={{ color: '#ffd700', fontWeight: 600, fontSize: '13px' }}>
                {stats.currentStreak}w streak
              </span>
            </div>
          )}
        </div>
        <div className={styles.headerRight}>
          <div className={styles.pointsBadge}>{stats.totalPoints} pts</div>
          {rank > 0 && (
            <div className={styles.rankBadge}>
              {rank <= 3 ? ['', '\u{1F947}', '\u{1F948}', '\u{1F949}'][rank] : '#'}
              {rank <= 3 ? '' : rank}
              {rank <= 3 ? ` Rank ${rank}` : ` of ${leaderboard.length}`}
            </div>
          )}
          <Button
            className={styles.expandBtn}
            appearance="transparent"
            icon={expanded ? <ChevronUp24Regular /> : <ChevronDown24Regular />}
            onClick={() => setExpanded(!expanded)}
          />
        </div>
      </div>

      {/* Summary Row (always visible) */}
      <div className={styles.body}>
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Bookings</span>
            <span className={styles.statValue}>{stats.totalBookings}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Confirmed</span>
            <span className={styles.statValue}>{stats.confirmedBookings}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Conversion</span>
            <span className={styles.statValue} style={{ color: conversionDiff >= 0 ? '#107c10' : '#d83b01' }}>
              {stats.conversionRate}%
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Licenses</span>
            <span className={styles.statValue}>{stats.totalLicenses.toLocaleString()}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Badges</span>
            <span className={styles.statValue}>
              {stats.earnedBadgeIds.length}/{BADGE_DEFINITIONS.length}
            </span>
          </div>
        </div>

        {/* Conversion comparison */}
        <div className={styles.conversionRow}>
          <ArrowTrendingLines24Regular style={{ width: '16px', height: '16px', color: '#666' }} />
          <span className={styles.conversionLabel}>
            Your conversion: <strong>{stats.conversionRate}%</strong> vs Team avg:{' '}
            <strong>{teamAvgConversion}%</strong>
          </span>
          <span
            className={
              conversionDiff > 0
                ? styles.conversionAbove
                : conversionDiff < 0
                  ? styles.conversionBelow
                  : styles.conversionEqual
            }
            style={{ fontSize: '13px', fontWeight: 600 }}
          >
            {conversionDiff > 0 ? `+${conversionDiff}%` : conversionDiff < 0 ? `${conversionDiff}%` : 'On par'}
          </span>
        </div>

        {/* Badges row */}
        <div className={styles.badgesSection}>
          <span className={styles.badgesLabel}>Badges:</span>
          {BADGE_DEFINITIONS.map((badge) => {
            const earned = stats.earnedBadgeIds.includes(badge.id);
            const isNew = stats.newBadgeIds.includes(badge.id);
            return (
              <Tooltip
                key={badge.id}
                content={
                  earned
                    ? `${badge.name} - ${badge.description}`
                    : `${badge.name} (Locked) - ${badge.unlockCriteria}`
                }
                relationship="description"
              >
                <span className={earned ? styles.badgeItem : styles.badgeLocked}>
                  {badge.icon}
                  {isNew && <span className={styles.newIndicator}>!</span>}
                </span>
              </Tooltip>
            );
          })}
        </div>

        {/* Expanded: Monthly targets */}
        {expanded && stats.targetProgress && (
          <>
            <div className={styles.divider} />
            <div className={styles.targetSection}>
              <span className={styles.targetLabel}>Monthly Targets</span>
              <TargetRow
                label="Bookings"
                current={stats.targetProgress.bookings.current}
                target={stats.targetProgress.bookings.target}
                percentage={stats.targetProgress.bookings.percentage}
                styles={styles}
              />
              <TargetRow
                label="Confirmed"
                current={stats.targetProgress.confirmed.current}
                target={stats.targetProgress.confirmed.target}
                percentage={stats.targetProgress.confirmed.percentage}
                styles={styles}
              />
              <TargetRow
                label="Licenses"
                current={stats.targetProgress.licenses.current}
                target={stats.targetProgress.licenses.target}
                percentage={stats.targetProgress.licenses.percentage}
                styles={styles}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Sub-component for target progress row
const TargetRow: React.FC<{
  label: string;
  current: number;
  target: number;
  percentage: number;
  styles: ReturnType<typeof useStyles>;
}> = ({ label, current, target, percentage, styles }) => {
  const color =
    percentage >= 100 ? '#107c10' : percentage >= 60 ? '#ca5010' : '#d83b01';

  return (
    <div className={styles.targetRow}>
      <span className={styles.targetName}>{label}</span>
      <div className={styles.targetBar}>
        <ProgressBar
          value={Math.min(percentage, 100) / 100}
          color={percentage >= 100 ? 'success' : percentage >= 60 ? 'warning' : 'error'}
          thickness="large"
        />
      </div>
      <span className={styles.targetPct} style={{ color }}>
        {current}/{target} ({percentage}%)
      </span>
    </div>
  );
};
