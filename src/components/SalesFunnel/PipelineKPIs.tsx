/**
 * DWx Traffic Manager - Pipeline KPI Cards
 * Key metrics display for the sales pipeline
 */

import React from 'react';
import { Text, makeStyles, Tooltip } from '@fluentui/react-components';
import {
  MoneyRegular,
  ArrowTrendingRegular,
  TargetRegular,
  PeopleRegular,
  CheckmarkCircleRegular,
  ArrowUpRegular,
  ArrowDownRegular,
} from '@fluentui/react-icons';
import { PipelineMetrics, WinRateData } from '../../types/ServiceRequest';

const useStyles = makeStyles({
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  card: {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
    borderLeft: '4px solid transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'box-shadow 0.2s ease',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#616161',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#242424',
    lineHeight: '1',
  },
  cardSubtext: {
    fontSize: '12px',
    color: '#616161',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  positive: {
    color: '#107c10',
  },
  negative: {
    color: '#d13438',
  },
  neutral: {
    color: '#616161',
  },
  trendIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '4px',
  },
  trendUp: {
    backgroundColor: 'rgba(16, 124, 16, 0.1)',
    color: '#107c10',
  },
  trendDown: {
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    color: '#d13438',
  },
  trendNeutral: {
    backgroundColor: 'rgba(97, 97, 97, 0.1)',
    color: '#616161',
  },
});

interface PeriodChanges {
  pipelineValue: number;
  weightedPipeline: number;
  openRequests: number;
  avgDealSize: number;
}

interface PipelineKPIsProps {
  metrics: PipelineMetrics;
  winRates: WinRateData;
  periodChanges?: PeriodChanges;
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `R${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R${(value / 1000).toFixed(0)}K`;
  }
  return `R${value.toFixed(0)}`;
};

const formatLargeCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Trend indicator component
const TrendIndicator: React.FC<{ change: number; styles: ReturnType<typeof useStyles> }> = ({
  change,
  styles,
}) => {
  if (change === 0) return null;

  const isPositive = change > 0;
  const Icon = isPositive ? ArrowUpRegular : ArrowDownRegular;
  const trendClass = isPositive ? styles.trendUp : styles.trendDown;

  return (
    <span className={`${styles.trendIndicator} ${trendClass}`} aria-label={`${isPositive ? 'Up' : 'Down'} ${Math.abs(change)}% vs last period`}>
      <Icon style={{ width: '10px', height: '10px' }} aria-hidden="true" />
      {Math.abs(change)}%
    </span>
  );
};

export const PipelineKPIs: React.FC<PipelineKPIsProps> = ({ metrics, winRates, periodChanges }) => {
  const styles = useStyles();

  const kpiCards = [
    {
      label: 'Total Pipeline',
      value: formatCurrency(metrics.totalPipelineValue),
      subtext: `${metrics.openRequests} open opportunities`,
      icon: MoneyRegular,
      iconBg: '#e8f4f6',
      iconColor: '#1e6b7b',
      tooltip: formatLargeCurrency(metrics.totalPipelineValue),
      trend: periodChanges?.pipelineValue,
    },
    {
      label: 'Weighted Pipeline',
      value: formatCurrency(metrics.weightedPipelineValue),
      subtext: `Based on win probability`,
      icon: ArrowTrendingRegular,
      iconBg: '#e8f6e8',
      iconColor: '#107c10',
      tooltip: formatLargeCurrency(metrics.weightedPipelineValue),
      trend: periodChanges?.weightedPipeline,
    },
    {
      label: 'Win Rate',
      value: `${winRates.overall.toFixed(0)}%`,
      subtext: winRates.overall === 0 ? 'No closed deals yet' : winRates.overall >= 30 ? 'Above target' : 'Below target',
      subtextType: winRates.overall === 0 ? undefined : winRates.overall >= 30 ? 'positive' : 'negative',
      icon: TargetRegular,
      iconBg: winRates.overall === 0 ? '#f3f3f3' : winRates.overall >= 30 ? '#dff6dd' : '#fde7e9',
      iconColor: winRates.overall === 0 ? '#616161' : winRates.overall >= 30 ? '#107c10' : '#d13438',
    },
    {
      label: 'Avg Deal Size',
      value: formatCurrency(metrics.averageDealSize),
      subtext: `Across ${metrics.totalRequests} deals`,
      icon: MoneyRegular,
      iconBg: '#f5eefa',
      iconColor: '#8b5cf6',
      tooltip: formatLargeCurrency(metrics.averageDealSize),
      trend: periodChanges?.avgDealSize,
    },
    {
      label: 'Open Requests',
      value: metrics.openRequests.toString(),
      subtext: `Of ${metrics.totalRequests} total`,
      icon: PeopleRegular,
      iconBg: '#fff4e5',
      iconColor: '#f59e0b',
      trend: periodChanges?.openRequests,
    },
    {
      label: 'Forecasted Revenue',
      value: formatCurrency(metrics.forecastedRevenue),
      subtext: 'Expected this quarter',
      icon: CheckmarkCircleRegular,
      iconBg: '#e8f4f6',
      iconColor: '#1e6b7b',
      tooltip: formatLargeCurrency(metrics.forecastedRevenue),
    },
  ];

  return (
    <div className={styles.container}>
      {kpiCards.map((card, index) => (
        <Tooltip key={index} content={card.tooltip || card.label} relationship="label">
          <div className={styles.card} style={{ borderLeftColor: card.iconColor }}>
            <div className={styles.cardHeader}>
              <Text className={styles.cardLabel}>{card.label}</Text>
              <div
                className={styles.cardIcon}
                style={{ backgroundColor: card.iconBg, color: card.iconColor }}
              >
                <card.icon style={{ width: '20px', height: '20px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text className={styles.cardValue}>{card.value}</Text>
              {card.trend !== undefined && <TrendIndicator change={card.trend} styles={styles} />}
            </div>
            <Text
              className={`${styles.cardSubtext} ${
                card.subtextType === 'positive'
                  ? styles.positive
                  : card.subtextType === 'negative'
                  ? styles.negative
                  : styles.neutral
              }`}
            >
              {card.subtext}
            </Text>
          </div>
        </Tooltip>
      ))}
    </div>
  );
};
