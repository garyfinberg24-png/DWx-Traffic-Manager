import React, { useEffect, useState } from 'react';
import { makeStyles, Text, Spinner, shorthands } from '@fluentui/react-components';
import {
  Star24Filled,
  Star24Regular,
} from '@fluentui/react-icons';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { deliveryAnalyticsService } from '../../services/DeliveryAnalyticsService';
import type { DeliveryAnalyticsData } from '../../types/DeliveryAnalytics';
import { DW_COLORS } from '../../utils/buttonStyles';
import { formatCurrency } from '../../utils/formatters';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: '12px',
  },
  kpiCard: {
    backgroundColor: '#fff',
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('16px'),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sectionCard: {
    backgroundColor: '#fff',
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('20px'),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
  },
  sectionTitle: {
    fontWeight: '600' as unknown as '',
    fontSize: '15px',
    color: '#111827',
    marginBottom: '16px',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  feedbackCard: {
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    backgroundColor: '#fafafa',
    marginBottom: '8px',
  },
  table: {
    width: '100%',
  },
  th: {
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', '#e5e7eb'),
    fontWeight: '600' as unknown as '',
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'uppercase' as unknown as '',
  },
  td: {
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderBottom('1px', 'solid', '#f3f4f6'),
    fontSize: '13px',
    color: '#374151',
  },
});

// Star rating display helper
const StarRating: React.FC<{ score: number }> = ({ score }) => {
  const rounded = Math.round(score);
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= rounded ? (
          <Star24Filled
            key={i}
            style={{ color: '#f59e0b', width: 16, height: 16 }}
          />
        ) : (
          <Star24Regular
            key={i}
            style={{ color: '#d1d5db', width: 16, height: 16 }}
          />
        )
      )}
    </div>
  );
};

const CSAT_PIE_COLORS = ['#ef4444', '#f59e0b', '#fbbf24', '#34d399', '#10b981'];

export const DeliveryAnalyticsTab: React.FC = () => {
  const styles = useStyles();
  const [data, setData] = useState<DeliveryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await deliveryAnalyticsService.getFullAnalytics();
        if (!cancelled) setData(result);
      } catch (error) {
        console.error('Failed to load delivery analytics:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '60px 0',
        }}
      >
        <Spinner size="medium" label="Loading delivery analytics..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}
      >
        <Text size={400}>Unable to load delivery analytics</Text>
      </div>
    );
  }

  const {
    kpis,
    cycleTrends,
    categoryMetrics,
    csatDistribution,
    recentFeedback,
  } = data;

  // On-time rate bar colors based on threshold
  const onTimeBarData = cycleTrends.map((t) => ({
    ...t,
    fill:
      t.onTimeRate >= 80
        ? '#10b981'
        : t.onTimeRate >= 60
          ? '#f59e0b'
          : '#ef4444',
  }));

  return (
    <div className={styles.container}>
      {/* Hero KPI Cards */}
      <div className={styles.kpiGrid}>
        {[
          {
            label: 'Total Handovers',
            value: String(kpis.totalHandovers),
            accent: '#3b82f6',
          },
          {
            label: 'Completed',
            value: String(kpis.completedHandovers),
            accent: '#10b981',
          },
          {
            label: 'Avg Cycle Time',
            value: `${kpis.avgCycleTimeDays} days`,
            accent: '#8b5cf6',
          },
          {
            label: 'On-Time Rate',
            value: `${kpis.onTimeDeliveryRate}%`,
            accent:
              kpis.onTimeDeliveryRate >= 80
                ? '#10b981'
                : kpis.onTimeDeliveryRate >= 60
                  ? '#f59e0b'
                  : '#ef4444',
          },
          {
            label: 'Avg CSAT',
            value:
              kpis.avgCSAT > 0 ? `${kpis.avgCSAT.toFixed(1)} / 5` : 'N/A',
            accent: '#f59e0b',
          },
          {
            label: 'Total Value',
            value: formatCurrency(kpis.totalContractValue),
            accent: DW_COLORS.primary,
          },
        ].map((card) => (
          <div key={card.label} className={styles.kpiCard}>
            <div
              style={{
                height: '3px',
                backgroundColor: card.accent,
                borderRadius: '2px',
                marginBottom: '8px',
              }}
            />
            <Text
              size={200}
              style={{
                color: '#6b7280',
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              {card.label}
            </Text>
            <Text
              size={500}
              style={{ fontWeight: 700, color: '#111827', fontSize: '20px' }}
            >
              {card.value}
            </Text>
          </div>
        ))}
      </div>

      {/* Charts Row: Cycle Time Trends + On-Time Delivery Rate */}
      <div className={styles.chartRow}>
        {/* Cycle Time Trends - ComposedChart */}
        <div className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>
            Delivery Cycle Time Trends
          </Text>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={cycleTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                label={{
                  value: 'Days',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fontSize: 11 },
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                label={{
                  value: 'Count',
                  angle: 90,
                  position: 'insideRight',
                  style: { fontSize: 11 },
                }}
              />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="right"
                dataKey="completedCount"
                name="Completed"
                fill="#10b981"
                opacity={0.6}
                barSize={20}
              />
              <Line
                yAxisId="left"
                dataKey="avgCycleTimeDays"
                name="Avg Cycle (days)"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* On-Time Delivery Rate - BarChart */}
        <div className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>On-Time Delivery Rate</Text>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={onTimeBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                formatter={(value: number | string | undefined) => [`${value ?? 0}%`, 'On-Time Rate']}
              />
              <Bar dataKey="onTimeRate" name="On-Time Rate" barSize={24}>
                {onTimeBarData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service Category Metrics Table */}
      <div className={styles.sectionCard}>
        <Text className={styles.sectionTitle}>
          Performance by Service Category
        </Text>
        {categoryMetrics.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}
          >
            No service category data available yet
          </div>
        ) : (
          <table className={styles.table} style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th className={styles.th} style={{ textAlign: 'left' }}>Category</th>
                <th className={styles.th}>Completed</th>
                <th className={styles.th}>Avg Cycle (days)</th>
                <th className={styles.th}>CSAT</th>
                <th className={styles.th}>On-Time Rate</th>
                <th className={styles.th}>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {categoryMetrics.map((cat) => (
                <tr key={cat.category}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>
                    {cat.category}
                  </td>
                  <td className={styles.td}>{cat.completedCount}</td>
                  <td className={styles.td}>
                    {cat.avgCycleTimeDays || '\u2014'}
                  </td>
                  <td className={styles.td}>
                    {cat.avgCSAT > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Star24Filled
                          style={{ color: '#f59e0b', width: 14, height: 14 }}
                        />
                        <span>{cat.avgCSAT.toFixed(1)}</span>
                      </div>
                    ) : (
                      '\u2014'
                    )}
                  </td>
                  <td className={styles.td}>
                    <span
                      style={{
                        color:
                          cat.onTimeRate >= 80
                            ? '#059669'
                            : cat.onTimeRate >= 60
                              ? '#d97706'
                              : '#dc2626',
                        fontWeight: 600,
                      }}
                    >
                      {cat.onTimeRate > 0 ? `${cat.onTimeRate}%` : '\u2014'}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {formatCurrency(cat.totalValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Row: CSAT Distribution + Recent Feedback */}
      <div className={styles.chartRow}>
        {/* CSAT Distribution - PieChart */}
        <div className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>CSAT Distribution</Text>
          {csatDistribution.every((d) => d.count === 0) ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: '#9ca3af',
              }}
            >
              No CSAT ratings recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={csatDistribution.filter((d) => d.count > 0) as any[]}
                  dataKey="count"
                  nameKey="rating"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ rating, count, percentage }: any) =>
                    `${rating}\u2605 (${count}, ${percentage}%)`
                  }
                  labelLine
                >
                  {csatDistribution
                    .filter((d) => d.count > 0)
                    .map((entry) => (
                      <Cell
                        key={entry.rating}
                        fill={CSAT_PIE_COLORS[entry.rating - 1]}
                      />
                    ))}
                </Pie>
                <Tooltip
                  formatter={(value: number | string | undefined, name: string | undefined) => [
                    value ?? 0,
                    `${name ?? ''} Star`,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent CSAT Feedback */}
        <div className={styles.sectionCard}>
          <Text className={styles.sectionTitle}>Recent Client Feedback</Text>
          {recentFeedback.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: '#9ca3af',
              }}
            >
              No CSAT feedback recorded yet
            </div>
          ) : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {recentFeedback.map((fb) => (
                <div key={fb.handoverId} className={styles.feedbackCard}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <Text
                      size={300}
                      style={{ fontWeight: 600, color: '#111827' }}
                    >
                      {fb.clientName}
                    </Text>
                    <StarRating score={fb.overallScore} />
                  </div>
                  <Text
                    size={200}
                    style={{ color: '#6b7280', fontSize: '11px' }}
                  >
                    {fb.serviceName}
                    {fb.submittedDate
                      ? ` \u2014 ${new Date(fb.submittedDate).toLocaleDateString()}`
                      : ''}
                  </Text>
                  {fb.feedback && (
                    <Text
                      size={200}
                      style={{
                        color: '#374151',
                        marginTop: '6px',
                        display: 'block',
                        fontStyle: 'italic',
                      }}
                    >
                      &ldquo;{fb.feedback}&rdquo;
                    </Text>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
