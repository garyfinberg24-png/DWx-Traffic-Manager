import React, { useMemo, useState } from 'react';
import { makeStyles, Text, Button, Tab, TabList } from '@fluentui/react-components';
import { Target24Regular } from '@fluentui/react-icons';
import { Booking } from '../../types/Booking';
import { gamificationService } from '../../services/GamificationService';
import { LeaderboardTable } from '../Gamification/LeaderboardTable';
import { TeamStatsCard } from '../Gamification/TeamStatsCard';
import { BadgeGrid } from '../Gamification/BadgeGrid';
import { SetTargetsDialog } from '../Gamification/SetTargetsDialog';
import { PointsTooltip } from '../Gamification/PointsTooltip';

interface GamificationTabProps {
  bookings: Booking[];
  currentUserEmail?: string;
  isManager?: boolean;
}

type SubTab = 'leaderboard' | 'badges';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
  },
  subtitle: {
    fontSize: '13px',
    color: '#666',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#242424',
  },
  tabContent: {
    marginTop: '12px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#666',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
    display: 'block',
    marginBottom: '8px',
  },
});

export const GamificationTab: React.FC<GamificationTabProps> = ({
  bookings,
  currentUserEmail,
  isManager,
}) => {
  const styles = useStyles();
  const [subTab, setSubTab] = useState<SubTab>('leaderboard');
  const [targetsOpen, setTargetsOpen] = useState(false);

  const leaderboard = useMemo(
    () => gamificationService.calculateLeaderboard(bookings),
    [bookings]
  );

  const teamStats = useMemo(
    () => gamificationService.calculateTeamStats(bookings),
    [bookings]
  );

  // Aggregate all earned badges across all AMs for the badge view
  const allEarnedBadgeIds = useMemo(() => {
    const all = new Set<string>();
    for (const entry of leaderboard) {
      const stats = gamificationService.calculateAMStats(entry.accountManagerEmail, bookings);
      stats.earnedBadgeIds.forEach((id) => all.add(id));
    }
    return Array.from(all);
  }, [leaderboard, bookings]);

  if (bookings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyTitle}>No Booking Data</span>
        <Text className={styles.subtitle}>
          Gamification stats will appear once bookings are created.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div>
            <Text className={styles.title}>AM Gamification</Text>
            <br />
            <Text className={styles.subtitle}>
              {leaderboard.length} account managers · {bookings.length} total bookings
            </Text>
          </div>
        </div>
        <div className={styles.actions}>
          <PointsTooltip />
          {isManager && (
            <Button
              appearance="primary"
              icon={<Target24Regular />}
              size="small"
              onClick={() => setTargetsOpen(true)}
            >
              Set Targets
            </Button>
          )}
        </div>
      </div>

      {/* Team Stats */}
      <TeamStatsCard stats={teamStats} />

      {/* Sub-tabs */}
      <TabList
        selectedValue={subTab}
        onTabSelect={(_, data) => setSubTab(data.value as SubTab)}
        size="small"
      >
        <Tab value="leaderboard">Leaderboard</Tab>
        <Tab value="badges">Badge Overview</Tab>
      </TabList>

      <div className={styles.tabContent}>
        {subTab === 'leaderboard' && (
          <LeaderboardTable leaderboard={leaderboard} currentUserEmail={currentUserEmail} />
        )}
        {subTab === 'badges' && (
          <div className={styles.section}>
            <Text className={styles.sectionTitle}>Team Badge Progress</Text>
            <BadgeGrid earnedBadgeIds={allEarnedBadgeIds} />
          </div>
        )}
      </div>

      {/* Set Targets Dialog */}
      {isManager && (
        <SetTargetsDialog
          open={targetsOpen}
          onClose={() => setTargetsOpen(false)}
          leaderboard={leaderboard}
          managerEmail={currentUserEmail || ''}
        />
      )}
    </div>
  );
};
