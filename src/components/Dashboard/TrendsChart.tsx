import React from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { TrendDataPoint } from '../../types/Dashboard';
import { format, parseISO } from 'date-fns';

const useStyles = makeStyles({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
    height: '100%',
    minHeight: '400px',
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
    height: '320px',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '320px',
    color: '#616161',
  },
});

interface TrendsChartProps {
  data: TrendDataPoint[];
  chartType?: 'line' | 'bar';
}

const TREND_COLORS = {
  primary: '#1e6b7b',
  secondary: '#e5a84b',
  info: '#0078d4',
};

export const TrendsChart: React.FC<TrendsChartProps> = ({ data, chartType = 'line' }) => {
  const styles = useStyles();

  // Format the data for display
  const chartData = data.map((d) => ({
    ...d,
    displayDate: format(parseISO(`${d.date}-01`), 'MMM yyyy'),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'white',
            padding: '12px',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Text weight="semibold">{label}</Text>
          <br />
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ color: entry.color, marginTop: '4px' }}>
              <Text size={200}>
                {entry.name}: {entry.value}
              </Text>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartType === 'bar') {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e1e1" />
          <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e1e1e1' }} />
          <YAxis tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e1e1e1' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="demos" name="Demos" fill={TREND_COLORS.primary} radius={[4, 4, 0, 0]} />
          <Bar dataKey="deployments" name="Deployments" fill={TREND_COLORS.secondary} radius={[4, 4, 0, 0]} />
        </BarChart>
      );
    }

    return (
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e1e1" />
        <XAxis dataKey="displayDate" tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e1e1e1' }} />
        <YAxis tick={{ fontSize: 12, fill: '#616161' }} axisLine={{ stroke: '#e1e1e1' }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="bookings"
          name="Total Bookings"
          stroke={TREND_COLORS.primary}
          strokeWidth={2}
          dot={{ fill: TREND_COLORS.primary, strokeWidth: 2, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="demos"
          name="Demos"
          stroke={TREND_COLORS.info}
          strokeWidth={2}
          dot={{ fill: TREND_COLORS.info, strokeWidth: 2, r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="deployments"
          name="Deployments"
          stroke={TREND_COLORS.secondary}
          strokeWidth={2}
          dot={{ fill: TREND_COLORS.secondary, strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    );
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <Text className={styles.cardTitle}>Booking Trends Over Time</Text>
      </div>
      <div className={styles.chartContainer}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className={styles.emptyState}>
            <Text>No trend data available</Text>
          </div>
        )}
      </div>
    </div>
  );
};
