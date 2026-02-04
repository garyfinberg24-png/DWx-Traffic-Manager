import React from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { TypeDistribution } from '../../types/Dashboard';

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
  chartContainer: {
    height: '200px',
    marginBottom: '16px',
  },
  legendContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    paddingTop: '16px',
    borderTop: '1px solid #e1e1e1',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    color: '#616161',
  },
});

interface TypeChartProps {
  data: TypeDistribution[];
}

const TYPE_COLORS: Record<'Demo' | 'Deployment', string> = {
  Demo: '#1e6b7b',
  Deployment: '#e5a84b',
};

export const TypeChart: React.FC<TypeChartProps> = ({ data }) => {
  const styles = useStyles();

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: d.type,
      value: d.count,
      percentage: d.percentage,
      color: TYPE_COLORS[d.type],
    }));

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
        <Text className={styles.cardTitle}>Bookings by Type</Text>
      </div>
      {chartData.length > 0 ? (
        <>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" barCategoryGap="30%">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.legendContainer}>
            {chartData.map((entry, index) => (
              <div key={index} className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: entry.color }} />
                <span className={styles.legendLabel}>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className={styles.emptyState}>
          <Text>No data available</Text>
        </div>
      )}
    </div>
  );
};
