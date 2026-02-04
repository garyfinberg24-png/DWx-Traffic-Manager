import React from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { StatusBreakdown, STATUS_COLORS } from '../../types/Dashboard';

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
    height: '100%',
    minHeight: '350px',
    borderLeft: '4px solid #1e6b7b',
    borderTop: '1px solid #d0d0d0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  chartWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
  },
  chartContainer: {
    width: '180px',
    height: '180px',
    position: 'relative',
    flexShrink: 0,
  },
  chartCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
  },
  totalValue: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#242424',
    display: 'block',
    lineHeight: '1',
  },
  totalLabel: {
    fontSize: '12px',
    color: '#616161',
  },
  legendContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  legendColor: {
    width: '12px',
    height: '12px',
    borderRadius: '2px',
    flexShrink: 0,
  },
  legendLabel: {
    fontSize: '13px',
    color: '#242424',
    flex: 1,
  },
  legendValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#616161',
  },
});

interface StatusChartProps {
  data: StatusBreakdown[];
}

export const StatusChart: React.FC<StatusChartProps> = ({ data }) => {
  const styles = useStyles();

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: d.status,
      value: d.count,
      percentage: d.percentage,
      color: STATUS_COLORS[d.status],
    }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            backgroundColor: 'white',
            padding: '8px 12px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Text weight="semibold">{data.name}</Text>
          <br />
          <Text>Count: {data.value}</Text>
          <br />
          <Text>Percentage: {data.percentage}%</Text>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Text className={styles.cardTitle}>Booking Status Distribution</Text>
      </div>
      {chartData.length > 0 ? (
        <div className={styles.chartWrapper}>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.chartCenter}>
              <span className={styles.totalValue}>{total}</span>
              <span className={styles.totalLabel}>Total</span>
            </div>
          </div>
          <div className={styles.legendContainer}>
            {chartData.map((entry, index) => (
              <div key={index} className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: entry.color }} />
                <span className={styles.legendLabel}>{entry.name}</span>
                <span className={styles.legendValue}>{entry.value} ({entry.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <Text>No data available</Text>
        </div>
      )}
    </div>
  );
};
