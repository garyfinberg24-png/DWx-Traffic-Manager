/**
 * DWx Traffic Manager - Conversion Rates Card
 * Displays stage-to-stage conversion metrics
 */

import React from 'react';
import { Text, makeStyles, Tooltip, ProgressBar } from '@fluentui/react-components';
import { ArrowRightRegular } from '@fluentui/react-icons';
import { ConversionRates } from '../../types/ServiceRequest';

const useStyles = makeStyles({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e8e8e8',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  content: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  conversionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  stages: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '180px',
  },
  stageName: {
    fontSize: '12px',
    color: '#424242',
    fontWeight: '500',
  },
  arrowIcon: {
    color: '#8a8886',
  },
  progressContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
  },
  percentage: {
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '50px',
    textAlign: 'right',
  },
  excellent: {
    color: '#107c10',
  },
  good: {
    color: '#0078d4',
  },
  average: {
    color: '#f7630c',
  },
  poor: {
    color: '#d13438',
  },
  overallSection: {
    marginTop: '8px',
    paddingTop: '16px',
    borderTop: '1px solid #e8e8e8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overallLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  overallValue: {
    fontSize: '24px',
    fontWeight: '700',
  },
});

interface ConversionRatesCardProps {
  rates: ConversionRates;
}

interface ConversionRowData {
  from: string;
  to: string;
  rate: number;
}

const getPercentageClass = (rate: number, styles: ReturnType<typeof useStyles>): string => {
  if (rate >= 70) return styles.excellent;
  if (rate >= 50) return styles.good;
  if (rate >= 30) return styles.average;
  return styles.poor;
};

const getProgressColor = (rate: number): string => {
  if (rate >= 70) return '#107c10';
  if (rate >= 50) return '#0078d4';
  if (rate >= 30) return '#f7630c';
  return '#d13438';
};

export const ConversionRatesCard: React.FC<ConversionRatesCardProps> = ({ rates }) => {
  const styles = useStyles();

  const conversions: ConversionRowData[] = [
    { from: 'Lead', to: 'Qualified', rate: rates.leadToQualified },
    { from: 'Qualified', to: 'Discovery', rate: rates.qualifiedToDiscovery },
    { from: 'Discovery', to: 'Proposal', rate: rates.discoveryToProposal },
    { from: 'Proposal', to: 'Negotiation', rate: rates.proposalToNegotiation },
    { from: 'Negotiation', to: 'Won', rate: rates.negotiationToWon },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Conversion Rates</Text>
      </div>
      <div className={styles.content}>
        {conversions.map((conversion, index) => (
          <div key={index} className={styles.conversionRow}>
            <div className={styles.stages}>
              <Text className={styles.stageName}>{conversion.from}</Text>
              <ArrowRightRegular className={styles.arrowIcon} style={{ width: '14px', height: '14px' }} />
              <Text className={styles.stageName}>{conversion.to}</Text>
            </div>
            <div className={styles.progressContainer}>
              <Tooltip content={`${conversion.rate.toFixed(1)}% of ${conversion.from} convert to ${conversion.to}`} relationship="label">
                <ProgressBar
                  className={styles.progressBar}
                  value={conversion.rate / 100}
                  color={undefined}
                  style={{ '--fui-ProgressBar--indicator-color': getProgressColor(conversion.rate) } as React.CSSProperties}
                />
              </Tooltip>
              <Text className={`${styles.percentage} ${getPercentageClass(conversion.rate, styles)}`}>
                {conversion.rate.toFixed(0)}%
              </Text>
            </div>
          </div>
        ))}

        <div className={styles.overallSection}>
          <Text className={styles.overallLabel}>Overall Conversion (Lead → Won)</Text>
          <Text className={`${styles.overallValue} ${getPercentageClass(rates.overallConversion, styles)}`}>
            {rates.overallConversion.toFixed(1)}%
          </Text>
        </div>
      </div>
    </div>
  );
};
