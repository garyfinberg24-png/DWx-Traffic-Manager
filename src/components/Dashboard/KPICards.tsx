import React from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import {
  CalendarCheckmark24Regular,
  Clock24Regular,
  CheckmarkCircle24Regular,
  Star24Regular,
} from '@fluentui/react-icons';
import { DashboardKPIs } from '../../types/Dashboard';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 1000px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    borderLeft: '4px solid #1e6b7b',
    borderTop: '1px solid #d0d0d0',
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  iconBlue: {
    background: 'linear-gradient(135deg, #0078d4 0%, #005a9e 100%)',
  },
  iconGreen: {
    background: 'linear-gradient(135deg, #107c10 0%, #0b5c0b 100%)',
  },
  iconOrange: {
    background: 'linear-gradient(135deg, #f7630c 0%, #ca5010 100%)',
  },
  iconRed: {
    background: 'linear-gradient(135deg, #d13438 0%, #a4262c 100%)',
  },
  iconPurple: {
    background: 'linear-gradient(135deg, #8764b8 0%, #5c4d7d 100%)',
  },
  iconTeal: {
    background: 'linear-gradient(135deg, #1e6b7b 0%, #154f5c 100%)',
  },
  metricContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#242424',
    lineHeight: '1',
    marginBottom: '4px',
  },
  metricChange: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  changePositive: {
    color: '#107c10',
  },
  changeNegative: {
    color: '#d13438',
  },
});

interface KPICardsProps {
  kpis: DashboardKPIs;
  recentBookings: number;
  bookingsThisMonth: number;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis }) => {
  const styles = useStyles();

  const kpiData = [
    {
      label: 'Total Bookings',
      value: kpis.totalBookings,
      icon: <CalendarCheckmark24Regular />,
      colorClass: styles.iconBlue,
      change: '+12% vs last period',
      isPositive: true,
    },
    {
      label: 'Confirmed',
      value: kpis.confirmedBookings,
      icon: <CheckmarkCircle24Regular />,
      colorClass: styles.iconGreen,
      change: `${kpis.conversionRate}% conversion rate`,
      isPositive: true,
    },
    {
      label: 'Pending Approval',
      value: kpis.pendingBookings,
      icon: <Clock24Regular />,
      colorClass: styles.iconOrange,
      change: kpis.pendingBookings > 5 ? `${kpis.pendingBookings - 5} requiring attention` : 'On track',
      isPositive: kpis.pendingBookings <= 5,
    },
    {
      label: 'Premium Clients',
      value: kpis.premiumClients,
      icon: <Star24Regular />,
      colorClass: styles.iconTeal,
      change: `${Math.round((kpis.premiumClients / Math.max(kpis.totalBookings, 1)) * 100)}% of total`,
      isPositive: true,
    },
  ];

  return (
    <div className={styles.container}>
      {kpiData.map((kpi, index) => (
        <div key={index} className={styles.card}>
          <div className={`${styles.iconContainer} ${kpi.colorClass}`}>{kpi.icon}</div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>{kpi.label}</Text>
            <Text className={styles.metricValue}>{kpi.value}</Text>
            <span className={`${styles.metricChange} ${kpi.isPositive ? styles.changePositive : styles.changeNegative}`}>
              {kpi.isPositive ? '▲' : '▼'} {kpi.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
