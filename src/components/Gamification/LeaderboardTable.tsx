import React, { useMemo, useState } from 'react';
import {
  makeStyles,
  Text,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Input,
} from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import { LeaderboardEntry } from '../../types/Gamification';
import { BADGE_DEFINITIONS } from '../../services/GamificationService';

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  currentUserEmail?: string;
}

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  searchBox: {
    maxWidth: '300px',
  },
  table: {
    width: '100%',
  },
  highlightRow: {
    backgroundColor: '#f0f9fb !important',
    fontWeight: '600',
  },
  rankCell: {
    fontWeight: '700',
    fontSize: '16px',
    minWidth: '50px',
  },
  medal: {
    fontSize: '20px',
  },
  nameCell: {
    fontWeight: '600',
    color: '#242424',
  },
  currentUser: {
    color: '#1e6b7b',
  },
  pointsCell: {
    fontWeight: '700',
    fontSize: '15px',
    color: '#1e6b7b',
  },
  badgeCount: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#666',
  },
  conversionGood: {
    color: '#107c10',
    fontWeight: '600',
  },
  conversionOk: {
    color: '#ca5010',
    fontWeight: '600',
  },
  conversionLow: {
    color: '#d83b01',
    fontWeight: '600',
  },
  streakBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#d83b01',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666',
  },
});

const MEDALS = ['', '\u{1F947}', '\u{1F948}', '\u{1F949}']; // gold, silver, bronze

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  leaderboard,
  currentUserEmail,
}) => {
  const styles = useStyles();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return leaderboard;
    const q = search.toLowerCase();
    return leaderboard.filter(
      (e) =>
        e.accountManagerName.toLowerCase().includes(q) ||
        e.accountManagerEmail.toLowerCase().includes(q)
    );
  }, [leaderboard, search]);

  if (leaderboard.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Text>No booking data available for leaderboard.</Text>
      </div>
    );
  }

  const getConversionClass = (rate: number) => {
    if (rate >= 70) return styles.conversionGood;
    if (rate >= 40) return styles.conversionOk;
    return styles.conversionLow;
  };

  return (
    <div className={styles.container}>
      <Input
        className={styles.searchBox}
        contentBefore={<Search24Regular />}
        placeholder="Search by name..."
        value={search}
        onChange={(_, data) => setSearch(data.value)}
      />
      <Table className={styles.table} size="medium">
        <TableHeader>
          <TableRow>
            <TableHeaderCell style={{ width: '60px' }}>Rank</TableHeaderCell>
            <TableHeaderCell>Account Manager</TableHeaderCell>
            <TableHeaderCell style={{ width: '90px' }}>Points</TableHeaderCell>
            <TableHeaderCell style={{ width: '90px' }}>Badges</TableHeaderCell>
            <TableHeaderCell style={{ width: '100px' }}>Bookings</TableHeaderCell>
            <TableHeaderCell style={{ width: '100px' }}>Conversion</TableHeaderCell>
            <TableHeaderCell style={{ width: '80px' }}>Streak</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((entry) => {
            const isCurrentUser =
              currentUserEmail &&
              entry.accountManagerEmail.toLowerCase() === currentUserEmail.toLowerCase();
            return (
              <TableRow
                key={entry.accountManagerEmail}
                className={isCurrentUser ? styles.highlightRow : undefined}
              >
                <TableCell>
                  <span className={styles.rankCell}>
                    {entry.rank <= 3 ? (
                      <span className={styles.medal}>{MEDALS[entry.rank]}</span>
                    ) : (
                      `#${entry.rank}`
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <TableCellLayout>
                    <span className={`${styles.nameCell} ${isCurrentUser ? styles.currentUser : ''}`}>
                      {entry.accountManagerName}
                      {isCurrentUser ? ' (You)' : ''}
                    </span>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <span className={styles.pointsCell}>{entry.totalPoints}</span>
                </TableCell>
                <TableCell>
                  <span className={styles.badgeCount}>
                    {entry.earnedBadgeCount}/{BADGE_DEFINITIONS.length}
                  </span>
                </TableCell>
                <TableCell>
                  {entry.confirmedBookings}/{entry.totalBookings}
                </TableCell>
                <TableCell>
                  <span className={getConversionClass(entry.conversionRate)}>
                    {entry.conversionRate}%
                  </span>
                </TableCell>
                <TableCell>
                  {entry.currentStreak > 0 ? (
                    <span className={styles.streakBadge}>
                      {'\u{1F525}'} {entry.currentStreak}w
                    </span>
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
