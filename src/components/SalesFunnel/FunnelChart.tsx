/**
 * DWx Traffic Manager - Funnel Chart Component
 * Visual funnel showing requests at each stage with values
 */

import React from 'react';
import { Text, makeStyles, Tooltip } from '@fluentui/react-components';
import { DataFunnel24Regular } from '@fluentui/react-icons';
import { FunnelStage, StageBreakdown } from '../../types/ServiceRequest';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '16px',
  },
  stageRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  stageName: {
    width: '100px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#424242',
    textAlign: 'right',
  },
  barContainer: {
    flex: 1,
    position: 'relative',
    height: '40px',
  },
  bar: {
    height: '100%',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '12px',
    transition: 'width 0.3s ease',
    cursor: 'pointer',
    ':hover': {
      filter: 'brightness(0.95)',
    },
  },
  barText: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'white',
    whiteSpace: 'nowrap',
  },
  metrics: {
    width: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  metricCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#242424',
  },
  metricValue: {
    fontSize: '11px',
    color: '#616161',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #e1e1e1',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#616161',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '2px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
    color: '#9ca3af',
    gap: '8px',
  },
  emptyIcon: {
    width: '40px',
    height: '40px',
    color: '#d1d5db',
  },
});

// Stage colors for funnel
const stageColors: Record<FunnelStage, string> = {
  Lead: '#6B7280',
  Qualified: '#3B82F6',
  Discovery: '#8B5CF6',
  Proposal: '#F59E0B',
  Negotiation: '#EC4899',
  Won: '#10B981',
  Lost: '#EF4444',
};

// Active stages in funnel order (excluding Won/Lost for main funnel)
const FUNNEL_STAGES: FunnelStage[] = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation'];

interface FunnelChartProps {
  breakdown: StageBreakdown[];
  onStageClick?: (stage: FunnelStage) => void;
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

export const FunnelChart: React.FC<FunnelChartProps> = ({
  breakdown,
  onStageClick,
}) => {
  const styles = useStyles();

  // Get breakdown for a stage
  const getStageData = (stage: FunnelStage): StageBreakdown => {
    return breakdown.find((b) => b.stage === stage) || { stage, count: 0, value: 0, weightedValue: 0 };
  };

  // Calculate max count for scaling
  const maxCount = Math.max(...FUNNEL_STAGES.map((s) => getStageData(s).count), 1);

  // Get Won/Lost data
  const wonData = getStageData('Won');
  const lostData = getStageData('Lost');

  // Check if all stages have zero counts
  const totalCount = breakdown.reduce((sum, b) => sum + b.count, 0);

  if (totalCount === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <DataFunnel24Regular className={styles.emptyIcon} />
          <Text style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>No pipeline data</Text>
          <Text style={{ fontSize: '12px', color: '#9ca3af' }}>Create deals to see your funnel breakdown</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Main funnel stages */}
      {FUNNEL_STAGES.map((stage) => {
        const data = getStageData(stage);
        const widthPercent = Math.max((data.count / maxCount) * 100, 5);

        return (
          <div key={stage} className={styles.stageRow}>
            <Text className={styles.stageName}>{stage}</Text>
            <div className={styles.barContainer}>
              <Tooltip
                content={`${data.count} requests • ${formatCurrency(data.value)} total • ${formatCurrency(data.weightedValue)} weighted`}
                relationship="label"
              >
                <div
                  className={styles.bar}
                  style={{
                    width: `${widthPercent}%`,
                    backgroundColor: stageColors[stage],
                  }}
                  onClick={() => onStageClick?.(stage)}
                >
                  {widthPercent > 15 && (
                    <Text className={styles.barText}>
                      {data.count} • {formatCurrency(data.value)}
                    </Text>
                  )}
                </div>
              </Tooltip>
            </div>
            <div className={styles.metrics}>
              <Text className={styles.metricCount}>{data.count}</Text>
              <Text className={styles.metricValue}>{formatCurrency(data.value)}</Text>
            </div>
          </div>
        );
      })}

      {/* Won/Lost summary */}
      <div className={styles.legend}>
        <Tooltip content={`${wonData.count} won deals worth ${formatCurrency(wonData.value)}`} relationship="label">
          <div
            className={styles.legendItem}
            style={{ cursor: 'pointer' }}
            onClick={() => onStageClick?.('Won')}
          >
            <div className={styles.legendDot} style={{ backgroundColor: stageColors.Won }} />
            <span>
              Won: <strong>{wonData.count}</strong> ({formatCurrency(wonData.value)})
            </span>
          </div>
        </Tooltip>
        <Tooltip content={`${lostData.count} lost deals worth ${formatCurrency(lostData.value)}`} relationship="label">
          <div
            className={styles.legendItem}
            style={{ cursor: 'pointer' }}
            onClick={() => onStageClick?.('Lost')}
          >
            <div className={styles.legendDot} style={{ backgroundColor: stageColors.Lost }} />
            <span>
              Lost: <strong>{lostData.count}</strong> ({formatCurrency(lostData.value)})
            </span>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};
