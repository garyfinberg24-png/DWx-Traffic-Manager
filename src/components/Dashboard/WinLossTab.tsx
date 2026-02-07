import React, { useMemo } from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import {
  Trophy24Regular,
  Money24Regular,
  Clock24Regular,
  Target24Regular,
} from '@fluentui/react-icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ServiceRequest } from '../../types/ServiceRequest';
import { DW_COLORS } from '../../utils/buttonStyles';
import { winLossAnalysisService } from '../../services/WinLossAnalysisService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = (value: any, name?: any, props?: any) => any;

const useStyles = makeStyles({
  // Hero cards row
  heroRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  heroCard: {
    borderRadius: '12px',
    padding: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
  },
  heroWinRate: {
    backgroundColor: DW_COLORS.success,
    color: 'white',
  },
  heroRevenue: {
    backgroundColor: DW_COLORS.teal,
    color: 'white',
  },
  heroIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  heroLabel: {
    fontSize: '13px',
    fontWeight: '500',
    opacity: 0.9,
  },
  heroValue: {
    fontSize: '32px',
    fontWeight: '700',
    lineHeight: '1',
  },
  heroSub: {
    fontSize: '12px',
    opacity: 0.8,
    marginTop: '4px',
  },

  // KPI row
  kpiRow: {
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
  kpiCard: {
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
  iconTeal: {
    background: 'linear-gradient(135deg, #1e6b7b 0%, #154f5c 100%)',
  },
  iconGreen: {
    background: 'linear-gradient(135deg, #107c10 0%, #0b5c0b 100%)',
  },
  iconOrange: {
    background: 'linear-gradient(135deg, #f7630c 0%, #ca5010 100%)',
  },
  iconPurple: {
    background: 'linear-gradient(135deg, #8764b8 0%, #5c4d7d 100%)',
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
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#242424',
    lineHeight: '1',
  },
  metricSub: {
    fontSize: '12px',
    color: '#616161',
    marginTop: '2px',
  },

  // Charts row
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
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

  // Table section
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
    borderTop: '1px solid #d0d0d0',
  },
  tableHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '40px 1fr 80px 80px 100px 120px 1fr',
    gap: '8px',
    padding: '12px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px',
    color: '#616161',
  },

  // Reason bars
  reasonSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  reasonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  reasonGroupLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  reasonRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  reasonText: {
    fontSize: '12px',
    color: '#424242',
    width: '140px',
    flexShrink: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  reasonBarTrack: {
    flexGrow: 1,
    height: '18px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  reasonBarFill: {
    height: '100%',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '6px',
    fontSize: '10px',
    fontWeight: '600',
    color: 'white',
    transition: 'width 0.3s ease',
    minWidth: '28px',
  },
  reasonCount: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#616161',
    width: '24px',
    textAlign: 'right' as const,
    flexShrink: 0,
  },
});

interface WinLossTabProps {
  requests: ServiceRequest[];
}

export const WinLossTab: React.FC<WinLossTabProps> = ({ requests }) => {
  const styles = useStyles();

  const overview = useMemo(() => winLossAnalysisService.calculateOverallMetrics(requests), [requests]);
  const byService = useMemo(() => winLossAnalysisService.analyzeByService(requests), [requests]);
  const byAM = useMemo(() => winLossAnalysisService.analyzeByAM(requests), [requests]);
  const reasons = useMemo(() => winLossAnalysisService.analyzeReasons(requests), [requests]);
  const trends = useMemo(() => winLossAnalysisService.analyzeTrends(requests), [requests]);
  const byDealSize = useMemo(() => winLossAnalysisService.analyzeByDealSize(requests), [requests]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getWinRateColor = (rate: number): string => {
    if (rate >= 50) return '#107c10';
    if (rate >= 30) return '#f7630c';
    return '#d13438';
  };

  // Empty state
  if (overview.totalClosed === 0) {
    return (
      <div className={styles.emptyState}>
        <Trophy24Regular style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#a0a0a0' }} />
        <Text style={{ fontSize: '16px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
          No closed deals to analyze yet
        </Text>
        <Text style={{ fontSize: '14px', color: '#616161' }}>
          Win/Loss analysis will appear once deals are marked as Won or Lost.
        </Text>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Cards Row */}
      <div className={styles.heroRow}>
        <div className={`${styles.heroCard} ${styles.heroWinRate}`}>
          <div className={styles.heroIcon}>
            <Trophy24Regular style={{ width: '28px', height: '28px' }} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Win Rate</span>
            <span className={styles.heroValue}>{overview.winRate.toFixed(1)}%</span>
            <span className={styles.heroSub}>
              {overview.totalWon} won of {overview.totalClosed} closed deals
            </span>
          </div>
        </div>
        <div className={`${styles.heroCard} ${styles.heroRevenue}`}>
          <div className={styles.heroIcon}>
            <Money24Regular style={{ width: '28px', height: '28px' }} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Total Won Revenue</span>
            <span className={styles.heroValue}>{formatCurrency(overview.totalWonRevenue)}</span>
            <span className={styles.heroSub}>
              Across {overview.totalWon} won deals
            </span>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconContainer} ${styles.iconTeal}`}>
            <Money24Regular />
          </div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>Avg Won Deal</Text>
            <Text className={styles.metricValue}>{formatCurrency(overview.avgWonDealSize)}</Text>
            <Text className={styles.metricSub}>Average deal size</Text>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconContainer} ${styles.iconOrange}`}>
            <Money24Regular />
          </div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>Avg Lost Deal</Text>
            <Text className={styles.metricValue}>{formatCurrency(overview.avgLostDealSize)}</Text>
            <Text className={styles.metricSub}>Average lost deal</Text>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconContainer} ${styles.iconGreen}`}>
            <Clock24Regular />
          </div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>Avg Sales Cycle (Won)</Text>
            <Text className={styles.metricValue}>{overview.avgSalesCycleWon.toFixed(0)} days</Text>
            <Text className={styles.metricSub}>Created to won</Text>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconContainer} ${styles.iconPurple}`}>
            <Target24Regular />
          </div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>Total Closed</Text>
            <Text className={styles.metricValue}>{overview.totalClosed}</Text>
            <Text className={styles.metricSub}>{overview.totalWon} won &middot; {overview.totalLost} lost</Text>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Reasons + Monthly Trend */}
      <div className={styles.chartsRow}>
        {/* Win/Loss Reasons */}
        <div className={styles.chartCard}>
          <Text className={styles.chartTitle}>Top Win & Loss Reasons</Text>
          {reasons.topWinReasons.length === 0 && reasons.topLossReasons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
              <Text style={{ fontStyle: 'italic' }}>No reasons recorded yet</Text>
            </div>
          ) : (
            <div className={styles.reasonSection}>
              {reasons.topWinReasons.length > 0 && (
                <div className={styles.reasonGroup}>
                  <Text className={styles.reasonGroupLabel}>Win Reasons</Text>
                  {reasons.topWinReasons.map((entry, idx) => (
                    <div key={`win-${idx}`} className={styles.reasonRow}>
                      <span className={styles.reasonText} title={entry.reason}>{entry.reason}</span>
                      <div className={styles.reasonBarTrack}>
                        <div
                          className={styles.reasonBarFill}
                          style={{
                            width: `${Math.max(entry.percentage, 8)}%`,
                            backgroundColor: DW_COLORS.success,
                          }}
                        >
                          {entry.percentage.toFixed(0)}%
                        </div>
                      </div>
                      <span className={styles.reasonCount}>{entry.count}</span>
                    </div>
                  ))}
                </div>
              )}
              {reasons.topLossReasons.length > 0 && (
                <div className={styles.reasonGroup}>
                  <Text className={styles.reasonGroupLabel}>Loss Reasons</Text>
                  {reasons.topLossReasons.map((entry, idx) => (
                    <div key={`loss-${idx}`} className={styles.reasonRow}>
                      <span className={styles.reasonText} title={entry.reason}>{entry.reason}</span>
                      <div className={styles.reasonBarTrack}>
                        <div
                          className={styles.reasonBarFill}
                          style={{
                            width: `${Math.max(entry.percentage, 8)}%`,
                            backgroundColor: DW_COLORS.danger,
                          }}
                        >
                          {entry.percentage.toFixed(0)}%
                        </div>
                      </div>
                      <span className={styles.reasonCount}>{entry.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className={styles.chartCard}>
          <Text className={styles.chartTitle}>Monthly Win/Loss Trend</Text>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodLabel" />
                <YAxis />
                <Tooltip
                  formatter={((value: number, name: string) => [
                    `${value} deal${value !== 1 ? 's' : ''}`,
                    name,
                  ]) as TooltipFormatter}
                />
                <Legend />
                <Bar dataKey="wonCount" name="Won" fill="#107c10" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lostCount" name="Lost" fill="#d13438" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
              <Text style={{ fontStyle: 'italic' }}>No trend data available</Text>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Win Rate by Service + Win Rate by Deal Size */}
      <div className={styles.chartsRow}>
        {/* Win Rate by Service */}
        <div className={styles.chartCard}>
          <Text className={styles.chartTitle}>Win Rate by Service Category</Text>
          {byService.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byService} margin={{ left: 10, right: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="serviceName"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  height={60}
                  tick={{ fontSize: 11 }}
                />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={((value: number) => `${value.toFixed(1)}%`) as TooltipFormatter}
                />
                <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]}>
                  {byService.map((entry, index) => (
                    <Cell key={index} fill={getWinRateColor(entry.winRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
              <Text style={{ fontStyle: 'italic' }}>No service data available</Text>
            </div>
          )}
        </div>

        {/* Win Rate by Deal Size */}
        <div className={styles.chartCard}>
          <Text className={styles.chartTitle}>Win Rate by Deal Size</Text>
          {byDealSize.filter(b => b.wonCount + b.lostCount > 0).length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byDealSize} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={((value: number) => `${value.toFixed(1)}%`) as TooltipFormatter}
                />
                <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]}>
                  {byDealSize.map((entry, index) => (
                    <Cell key={index} fill={getWinRateColor(entry.winRate)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#616161' }}>
              <Text style={{ fontStyle: 'italic' }}>No deal size data available</Text>
            </div>
          )}
        </div>
      </div>

      {/* AM Performance Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <Text className={styles.chartTitle} style={{ marginBottom: 0 }}>Account Manager Performance</Text>
        </div>
        {byAM.length > 0 ? (
          <>
            {/* Header Row */}
            <div className={styles.tableRow} style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e1e1e1' }}>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>#</Text>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Manager</Text>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Won</Text>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lost</Text>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Rate</Text>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Revenue</Text>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.5px' }}></Text>
            </div>
            {/* Data Rows */}
            {byAM.map((am, index) => (
              <div key={am.amEmail} className={styles.tableRow}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: DW_COLORS.teal,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {index + 1}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#242424' }}>{am.amName}</div>
                  <div style={{ fontSize: '11px', color: '#616161' }}>{am.amEmail}</div>
                </div>
                <Text style={{ fontSize: '13px', fontWeight: 600, color: '#107c10' }}>{am.wonCount}</Text>
                <Text style={{ fontSize: '13px', fontWeight: 600, color: '#d13438' }}>{am.lostCount}</Text>
                <Text style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: getWinRateColor(am.winRate),
                }}>
                  {am.winRate.toFixed(1)}%
                </Text>
                <Text style={{ fontSize: '13px', fontWeight: 600, color: '#242424' }}>
                  {formatCurrency(am.totalWonRevenue)}
                </Text>
                <div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${am.winRate}%`,
                      height: '100%',
                      backgroundColor: getWinRateColor(am.winRate),
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className={styles.emptyState}>
            <Text>No account manager data available.</Text>
          </div>
        )}
      </div>
    </div>
  );
};
