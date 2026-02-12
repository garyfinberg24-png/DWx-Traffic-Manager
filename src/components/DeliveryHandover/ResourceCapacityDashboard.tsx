/**
 * DWx Traffic Manager - Resource Capacity Dashboard
 * Cross-project resource utilization, capacity forecast, and overallocation warnings.
 * Embedded as a tab within other pages (no hero banner).
 * v2.17.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Text, Spinner, makeStyles, ProgressBar } from '@fluentui/react-components';
import {
  People24Regular,
  Gauge24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
} from '@fluentui/react-icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { resourceCapacityService } from '../../services/ResourceCapacityService';
import type {
  CapacityDashboardSummary,
  ResourceUtilization,
  WeeklyCapacity,
  OverallocationWarning,
  UtilizationStatus,
} from '../../types/ResourceCapacity';
import { UTILIZATION_STATUS_COLORS } from '../../types/ResourceCapacity';
import { DELIVERY_ROLE_COLORS } from '../../types/DeliveryHandover';
import type { DeliveryRole } from '../../types/DeliveryHandover';
import { DW_COLORS } from '../../utils/buttonStyles';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = (value: any, name?: any, props?: any) => any;

// ── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  // Loading / empty
  centered: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '80px 0',
  },

  // KPI cards row — 4 columns
  kpiRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    '@media (max-width: 1000px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '16px 20px',
    border: '1px solid #e8e8e8',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  kpiIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  kpiContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: '1',
    color: '#242424',
  },
  kpiSubtitle: {
    fontSize: '11px',
    color: '#616161',
    marginTop: '2px',
  },

  // Section card wrapper
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    borderTop: '1px solid #d0d0d0',
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  sectionBody: {
    padding: '20px',
  },

  // Charts row
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    padding: '24px',
    borderTop: '1px solid #d0d0d0',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '16px',
  },

  // Empty state
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#616161',
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const getUtilizationColor = (percent: number): string => {
  if (percent > 90) return '#dc2626';
  if (percent >= 70) return '#f59e0b';
  return '#10B981';
};

const getProgressBarColor = (status: UtilizationStatus): 'success' | 'warning' | 'error' => {
  if (status === 'Available') return 'success';
  if (status === 'Near Capacity') return 'warning';
  return 'error';
};

const truncateProjects = (handovers: { clientName: string }[], max: number): string => {
  if (handovers.length === 0) return '-';
  const shown = handovers.slice(0, max).map((h) => h.clientName);
  const remaining = handovers.length - max;
  if (remaining > 0) {
    return `${shown.join(', ')} and ${remaining} more`;
  }
  return shown.join(', ');
};

// ── Component ───────────────────────────────────────────────────────────────

export const ResourceCapacityDashboard: React.FC = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CapacityDashboardSummary | null>(null);
  const [utilization, setUtilization] = useState<ResourceUtilization[]>([]);
  const [forecast, setForecast] = useState<WeeklyCapacity[]>([]);
  const [warnings, setWarnings] = useState<OverallocationWarning[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, util, fore, warn] = await Promise.all([
        resourceCapacityService.getCapacitySummary(),
        resourceCapacityService.getAllResourceUtilization(),
        resourceCapacityService.getCapacityForecast(8),
        resourceCapacityService.getOverallocationWarnings(),
      ]);
      setSummary(sum);
      setUtilization(util);
      setForecast(fore);
      setWarnings(warn);
    } catch (error) {
      console.error('[ResourceCapacityDashboard] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Compute role breakdown from utilization data
  const roleBreakdown = useMemo(() => {
    if (utilization.length === 0) return [];

    const roleMap = new Map<DeliveryRole, { total: number; count: number }>();
    for (const res of utilization) {
      const entry = roleMap.get(res.role) || { total: 0, count: 0 };
      entry.total += res.totalAllocatedPercent;
      entry.count += 1;
      roleMap.set(res.role, entry);
    }

    return Array.from(roleMap.entries()).map(([role, { total, count }]) => ({
      role,
      avgUtilization: Math.round(total / count),
      color: DELIVERY_ROLE_COLORS[role]?.text || DW_COLORS.primary,
    }));
  }, [utilization]);

  // ── Loading state ──

  if (loading) {
    return (
      <div className={classes.centered}>
        <Spinner size="medium" label="Loading resource capacity data..." />
      </div>
    );
  }

  // ── Empty state ──

  if (!summary || utilization.length === 0) {
    return (
      <div className={classes.emptyState}>
        <People24Regular style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '12px' }} />
        <Text as="p" style={{ fontSize: '16px', fontWeight: '600', color: '#4b5563', marginBottom: '4px' }}>
          No Resource Data Available
        </Text>
        <Text as="p" style={{ fontSize: '13px', color: '#616161' }}>
          Resource capacity data will appear once delivery resources and handovers are configured.
        </Text>
      </div>
    );
  }

  const tooltipPercentFormatter: TooltipFormatter = (value) => `${value}%`;

  return (
    <div className={classes.container}>
      {/* ── 1. KPI Cards Row ── */}
      <div className={classes.kpiRow}>
        {/* Total Resources */}
        <div className={classes.kpiCard}>
          <div
            className={classes.kpiIcon}
            style={{ background: `linear-gradient(135deg, ${DW_COLORS.primary} 0%, #0d3a5c 100%)` }}
          >
            <People24Regular />
          </div>
          <div className={classes.kpiContent}>
            <Text className={classes.kpiLabel}>Total Resources</Text>
            <Text className={classes.kpiValue}>{summary.totalResources}</Text>
            <Text className={classes.kpiSubtitle}>{summary.activeResources} active</Text>
          </div>
        </div>

        {/* Avg Utilisation */}
        <div className={classes.kpiCard}>
          <div
            className={classes.kpiIcon}
            style={{ background: `linear-gradient(135deg, ${getUtilizationColor(summary.avgUtilization)} 0%, ${getUtilizationColor(summary.avgUtilization)}cc 100%)` }}
          >
            <Gauge24Regular />
          </div>
          <div className={classes.kpiContent}>
            <Text className={classes.kpiLabel}>Avg Utilisation</Text>
            <Text
              className={classes.kpiValue}
              style={{ color: getUtilizationColor(summary.avgUtilization) }}
            >
              {Math.round(summary.avgUtilization)}%
            </Text>
            <Text className={classes.kpiSubtitle}>across active resources</Text>
          </div>
        </div>

        {/* Overallocated */}
        <div className={classes.kpiCard} style={{ borderLeft: '4px solid #dc2626' }}>
          <div
            className={classes.kpiIcon}
            style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
          >
            <Warning24Regular />
          </div>
          <div className={classes.kpiContent}>
            <Text className={classes.kpiLabel}>Overallocated</Text>
            <Text className={classes.kpiValue} style={{ color: '#dc2626' }}>
              {summary.overallocatedCount}
            </Text>
            <Text className={classes.kpiSubtitle}>resources &gt;100%</Text>
          </div>
        </div>

        {/* Available */}
        <div className={classes.kpiCard} style={{ borderLeft: '4px solid #10B981' }}>
          <div
            className={classes.kpiIcon}
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
          >
            <CheckmarkCircle24Regular />
          </div>
          <div className={classes.kpiContent}>
            <Text className={classes.kpiLabel}>Available</Text>
            <Text className={classes.kpiValue} style={{ color: '#059669' }}>
              {summary.availableCount}
            </Text>
            <Text className={classes.kpiSubtitle}>resources with capacity</Text>
          </div>
        </div>
      </div>

      {/* ── 2. Resource Utilization Table ── */}
      <div className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Text className={classes.sectionTitle}>Resource Utilization</Text>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {utilization.length === 0 ? (
            <div className={classes.emptyState}>
              <Text style={{ fontSize: '13px', color: '#616161' }}>No resources to display.</Text>
            </div>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', width: '18%' }}>
                    Name
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', width: '14%' }}>
                    Role
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', color: '#4b5563', width: '10%' }}>
                    Projects
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', width: '20%' }}>
                    Utilization
                  </th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '600', color: '#4b5563', width: '12%' }}>
                    Status
                  </th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#4b5563', width: '26%' }}>
                    Active Projects
                  </th>
                </tr>
              </thead>
              <tbody>
                {utilization.map((res) => {
                  const statusColors = UTILIZATION_STATUS_COLORS[res.utilizationStatus];
                  const roleColor = DELIVERY_ROLE_COLORS[res.role];
                  return (
                    <tr
                      key={res.resourceId}
                      style={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                      {/* Name */}
                      <td style={{ padding: '10px 16px', fontWeight: '600', color: '#242424', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {res.name}
                      </td>
                      {/* Role */}
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: roleColor?.bg || '#e5e7eb',
                            color: roleColor?.text || '#4b5563',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {res.role}
                        </span>
                      </td>
                      {/* Projects */}
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '500', color: '#242424' }}>
                        {res.currentProjects}/{res.maxProjects}
                      </td>
                      {/* Utilization */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <ProgressBar
                              value={Math.min(res.totalAllocatedPercent / 100, 1)}
                              color={getProgressBarColor(res.utilizationStatus)}
                              thickness="medium"
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: getUtilizationColor(res.totalAllocatedPercent),
                              whiteSpace: 'nowrap',
                              minWidth: '36px',
                              textAlign: 'right',
                            }}
                          >
                            {Math.round(res.totalAllocatedPercent)}%
                          </span>
                        </div>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 10px',
                            borderRadius: '10px',
                            backgroundColor: statusColors.bg,
                            color: statusColors.text,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {res.utilizationStatus}
                        </span>
                      </td>
                      {/* Active Projects */}
                      <td
                        style={{
                          padding: '10px 16px',
                          fontSize: '12px',
                          color: '#616161',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {truncateProjects(res.activeHandovers, 2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── 3. Capacity Forecast + 5. Role Breakdown (side by side) ── */}
      <div className={classes.chartsRow}>
        {/* Capacity Forecast Chart */}
        <div className={classes.chartCard}>
          <Text className={classes.chartTitle}>Capacity Forecast (Next 8 Weeks)</Text>
          {forecast.length === 0 ? (
            <div className={classes.emptyState}>
              <Text style={{ fontSize: '13px', color: '#616161' }}>
                No forecast data available.
              </Text>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecast} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 12, fill: '#616161' }}
                  axisLine={{ stroke: '#d0d0d0' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#616161' }}
                  axisLine={{ stroke: '#d0d0d0' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={tooltipPercentFormatter} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="totalAllocatedPercent"
                  name="Allocated %"
                  stroke={DW_COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: DW_COLORS.primary, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="availableCapacityPercent"
                  name="Available %"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Role Breakdown Chart */}
        <div className={classes.chartCard}>
          <Text className={classes.chartTitle}>Utilization by Role</Text>
          {roleBreakdown.length === 0 ? (
            <div className={classes.emptyState}>
              <Text style={{ fontSize: '13px', color: '#616161' }}>
                No role data available.
              </Text>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roleBreakdown} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                <XAxis
                  dataKey="role"
                  tick={{ fontSize: 11, fill: '#616161' }}
                  axisLine={{ stroke: '#d0d0d0' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#616161' }}
                  axisLine={{ stroke: '#d0d0d0' }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip formatter={tooltipPercentFormatter} />
                <Bar dataKey="avgUtilization" name="Avg Utilization %" radius={[4, 4, 0, 0]}>
                  {roleBreakdown.map((entry, index) => (
                    <Cell key={`role-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── 4. Overallocation Warnings ── */}
      <div className={classes.sectionCard}>
        <div className={classes.sectionHeader}>
          <Text className={classes.sectionTitle}>Overallocation Warnings</Text>
        </div>
        <div className={classes.sectionBody}>
          {warnings.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                backgroundColor: '#d1fae5',
                borderRadius: '8px',
                border: '1px solid #a7f3d0',
              }}
            >
              <CheckmarkCircle24Regular style={{ color: '#059669', flexShrink: 0 }} />
              <Text style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>
                No overallocated resources. All team members are within capacity.
              </Text>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {warnings.map((warn, idx) => {
                const isCritical = warn.severity === 'Critical';
                const borderColor = isCritical ? '#dc2626' : '#f59e0b';
                const roleColor = DELIVERY_ROLE_COLORS[warn.role];
                return (
                  <div
                    key={`warn-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      padding: '14px 18px',
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${borderColor}`,
                      border: '1px solid #e8e8e8',
                      borderLeftWidth: '4px',
                      borderLeftColor: borderColor,
                    }}
                  >
                    <Warning24Regular style={{ color: borderColor, flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <Text style={{ fontSize: '14px', fontWeight: '600', color: '#242424' }}>
                          {warn.resourceName}
                        </Text>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '1px 8px',
                            borderRadius: '10px',
                            backgroundColor: roleColor?.bg || '#e5e7eb',
                            color: roleColor?.text || '#4b5563',
                          }}
                        >
                          {warn.role}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '1px 8px',
                            borderRadius: '10px',
                            backgroundColor: isCritical ? '#fee2e2' : '#fef3c7',
                            color: isCritical ? '#dc2626' : '#92400e',
                            marginLeft: 'auto',
                          }}
                        >
                          {warn.severity}
                        </span>
                      </div>
                      <Text style={{ fontSize: '13px', color: '#dc2626', fontWeight: '500' }}>
                        {Math.round(warn.totalAllocation)}% allocated across {warn.projects.length} project{warn.projects.length !== 1 ? 's' : ''}
                      </Text>
                      <Text
                        style={{
                          fontSize: '12px',
                          color: '#616161',
                          marginTop: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {warn.projects.join(', ')}
                      </Text>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
