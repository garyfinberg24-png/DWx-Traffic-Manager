import React from 'react';
import { makeStyles, Popover, PopoverTrigger, PopoverSurface, Button } from '@fluentui/react-components';
import { Info24Regular } from '@fluentui/react-icons';
import { POINTS } from '../../types/Gamification';

const useStyles = makeStyles({
  surface: {
    padding: '16px',
    maxWidth: '320px',
  },
  title: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#242424',
    marginBottom: '12px',
    display: 'block',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
  },
  row: {
    borderBottom: '1px solid #f0f0f0',
  },
  eventCell: {
    padding: '6px 8px 6px 0',
    color: '#444',
  },
  pointsCell: {
    padding: '6px 0',
    fontWeight: '700',
    color: '#1e6b7b',
    textAlign: 'right' as const,
  },
});

export const PointsTooltip: React.FC = () => {
  const styles = useStyles();

  const rows = [
    { event: 'Demo Booking Created', points: `+${POINTS.DEMO_BOOKING}` },
    { event: 'Deployment Booking Created', points: `+${POINTS.DEPLOYMENT_BOOKING}` },
    { event: 'Booking Confirmed', points: `+${POINTS.CONFIRMED_BONUS}` },
    { event: 'Premium Client Bonus', points: `+${POINTS.PREMIUM_CLIENT_BONUS}` },
    { event: `Quick Confirmation (<${POINTS.QUICK_CONFIRMATION_DAYS} days)`, points: `+${POINTS.QUICK_CONFIRMATION_BONUS}` },
    { event: `Large Deal (${POINTS.LARGE_DEAL_THRESHOLD}+ licenses)`, points: `+${POINTS.LARGE_DEAL_BONUS}` },
    { event: 'New Client Acquisition', points: `+${POINTS.NEW_CLIENT_BONUS}` },
    { event: 'Streak Week Bonus', points: `+${POINTS.STREAK_WEEK_BONUS}/week` },
  ];

  return (
    <Popover withArrow>
      <PopoverTrigger disableButtonEnhancement>
        <Button appearance="subtle" size="small" icon={<Info24Regular />}>
          How Points Work
        </Button>
      </PopoverTrigger>
      <PopoverSurface className={styles.surface}>
        <span className={styles.title}>Points Scoring System</span>
        <table className={styles.table}>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={styles.row}>
                <td className={styles.eventCell}>{row.event}</td>
                <td className={styles.pointsCell}>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PopoverSurface>
    </Popover>
  );
};
