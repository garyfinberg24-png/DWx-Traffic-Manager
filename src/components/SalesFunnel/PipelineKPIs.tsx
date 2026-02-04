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
  ClockRegular,
  CheckmarkCircleRegular,
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e8e8e8',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    transition: 'box-shadow 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
});

interface PipelineKPIsProps {
  metrics: PipelineMetrics;
  winRates: WinRateData;
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

export const PipelineKPIs: React.FC<PipelineKPIsProps> = ({ metrics, winRates }) => {
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
    },
    {
      label: 'Weighted Pipeline',
      value: formatCurrency(metrics.weightedPipelineValue),
      subtext: `Based on win probability`,
      icon: ArrowTrendingRegular,
      iconBg: '#e8f6e8',
      iconColor: '#107c10',
      tooltip: formatLargeCurrency(metrics.weightedPipelineValue),
    },
    {
      label: 'Win Rate',
      value: `${winRates.overall.toFixed(0)}%`,
      subtext: winRates.overall >= 30 ? 'Above target' : 'Below target',
      subtextType: winRates.overall >= 30 ? 'positive' : 'negative',
      icon: TargetRegular,
      iconBg: winRates.overall >= 30 ? '#dff6dd' : '#fde7e9',
      iconColor: winRates.overall >= 30 ? '#107c10' : '#d13438',
    },
    {
      label: 'Avg Deal Size',
      value: formatCurrency(metrics.averageDealSize),
      subtext: `Across ${metrics.totalRequests} deals`,
      icon: MoneyRegular,
      iconBg: '#f5eefa',
      iconColor: '#8b5cf6',
      tooltip: formatLargeCurrency(metrics.averageDealSize),
    },
    {
      label: 'Open Requests',
      value: metrics.openRequests.toString(),
      subtext: `Of ${metrics.totalRequests} total`,
      icon: PeopleRegular,
      iconBg: '#fff4e5',
      iconColor: '#f59e0b',
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
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <Text className={styles.cardLabel}>{card.label}</Text>
              <div
                className={styles.cardIcon}
                style={{ backgroundColor: card.iconBg, color: card.iconColor }}
              >
                <card.icon style={{ width: '20px', height: '20px' }} />
              </div>
            </div>
            <Text className={styles.cardValue}>{card.value}</Text>
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
