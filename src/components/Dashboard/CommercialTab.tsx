import React, { useMemo } from 'react';
import { Text, makeStyles } from '@fluentui/react-components';
import {
  Money24Regular,
  Rocket24Regular,
  ArrowTrending24Regular,
  People24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
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
import { Booking } from '../../types/Booking';
import { DW_COLORS } from '../../utils/buttonStyles';
import { commercialService } from '../../services/CommercialService';
import { DEPLOYMENT_FEE, DEAL_RATE_PER_LICENSE, RevenueStage } from '../../types/Commercial';
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
  heroDeployment: {
    backgroundColor: DW_COLORS.teal,
    color: 'white',
  },
  heroConversion: {
    backgroundColor: DW_COLORS.success,
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
    padding: '24px',
    marginBottom: '24px',
    borderTop: '1px solid #d0d0d0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#616161',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    borderBottom: '2px solid #e1e1e1',
  },
  td: {
    padding: '12px',
    fontSize: '13px',
    color: '#242424',
    borderBottom: '1px solid #f0f0f0',
  },
  stageBadge: {
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    display: 'inline-block',
  },
  stageConverted: {
    backgroundColor: '#dff6dd',
    color: '#107c10',
  },
  stageDeployed: {
    backgroundColor: '#deecf9',
    color: '#0078d4',
  },
  stageConfirmed: {
    backgroundColor: '#e8d4f0',
    color: '#8764b8',
  },
  stagePending: {
    backgroundColor: '#fff4ce',
    color: '#ca5010',
  },
  premiumStar: {
    color: '#f7630c',
    marginLeft: '4px',
  },
  amRank: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: DW_COLORS.teal,
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e1e1e1',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '48px 24px',
    color: '#616161',
  },
});

interface CommercialTabProps {
  bookings: Booking[];
}

const formatZAR = (value: number): string => {
  return `R${value.toLocaleString('en-ZA')}`;
};

const FUNNEL_COLORS = ['#1e6b7b', '#0078d4', '#8764b8', '#107c10'];

export const CommercialTab: React.FC<CommercialTabProps> = ({ bookings }) => {
  const styles = useStyles();

  const useDemo = useMemo(() => !commercialService.hasSignificantData(bookings), [bookings]);
  const kpis = useMemo(() => useDemo ? commercialService.getDemoKPIs(bookings) : commercialService.calculateKPIs(bookings), [bookings, useDemo]);
  const pipeline = useMemo(() => useDemo ? commercialService.getDemoPipeline(bookings) : commercialService.calculatePipeline(bookings), [bookings, useDemo]);
  const trends = useMemo(() => useDemo ? commercialService.getDemoTrends() : commercialService.calculateMonthlyTrends(bookings), [bookings, useDemo]);
  const funnel = useMemo(() => useDemo ? commercialService.getDemoFunnel() : commercialService.calculateFunnel(bookings), [bookings, useDemo]);
  const amRevenue = useMemo(() => useDemo ? commercialService.getDemoAMRevenue() : commercialService.calculateAMRevenue(bookings), [bookings, useDemo]);

  const maxAMRevenue = amRevenue.length > 0 ? amRevenue[0].totalRevenue : 1;

  const getStageStyle = (stage: RevenueStage): string => {
    switch (stage) {
      case 'Converted': return styles.stageConverted;
      case 'Deployed': return styles.stageDeployed;
      case 'Confirmed': return styles.stageConfirmed;
      case 'Pending': return styles.stagePending;
      default: return styles.stagePending;
    }
  };

  if (bookings.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Money24Regular style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#a0a0a0' }} />
        <Text style={{ fontSize: '16px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
          No booking data available
        </Text>
        <Text style={{ fontSize: '14px', color: '#616161' }}>
          Commercial metrics will appear once bookings are created.
        </Text>
      </div>
    );
  }

  return (
    <div>
      {/* Revenue Hero Cards */}
      <div className={styles.heroRow}>
        <div className={`${styles.heroCard} ${styles.heroDeployment}`}>
          <div className={styles.heroIcon}>
            <Rocket24Regular style={{ width: '28px', height: '28px' }} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Deployment Revenue</span>
            <span className={styles.heroValue}>{formatZAR(kpis.totalDeploymentRevenue)}</span>
            <span className={styles.heroSub}>
              {kpis.deploymentCount} deployments × {formatZAR(DEPLOYMENT_FEE)} each
            </span>
          </div>
        </div>
        <div className={`${styles.heroCard} ${styles.heroConversion}`}>
          <div className={styles.heroIcon}>
            <ArrowTrending24Regular style={{ width: '28px', height: '28px' }} />
          </div>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Conversion Revenue</span>
            <span className={styles.heroValue}>{formatZAR(kpis.totalConversionRevenue)}</span>
            <span className={styles.heroSub}>
              {kpis.confirmedDeployments} confirmed · DealSize × R{DEAL_RATE_PER_LICENSE}/license
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconContainer} ${styles.iconTeal}`}>
            <Money24Regular />
          </div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>Total Pipeline</Text>
            <Text className={styles.metricValue}>{formatZAR(kpis.totalPipeline)}</Text>
            <Text className={styles.metricSub}>All deployments + deals</Text>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconContainer} ${styles.iconGreen}`}>
            <CheckmarkCircle24Regular />
          </div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>Realised Revenue</Text>
            <Text className={styles.metricValue}>{formatZAR(kpis.realisedRevenue)}</Text>
            <Text className={styles.metricSub}>Confirmed & converted</Text>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconContainer} ${styles.iconOrange}`}>
            <Clock24Regular />
          </div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>Pending Revenue</Text>
            <Text className={styles.metricValue}>{formatZAR(kpis.pendingRevenue)}</Text>
            <Text className={styles.metricSub}>Awaiting confirmation</Text>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.iconContainer} ${styles.iconPurple}`}>
            <People24Regular />
          </div>
          <div className={styles.metricContent}>
            <Text className={styles.metricLabel}>Avg Deal Value</Text>
            <Text className={styles.metricValue}>{formatZAR(kpis.avgDealValue)}</Text>
            <Text className={styles.metricSub}>{kpis.conversionRate}% demo-to-deploy rate</Text>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className={styles.chartsRow}>
        {/* Revenue Funnel */}
        <div className={styles.chartCard}>
          <Text className={styles.chartTitle}>Revenue Funnel</Text>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${v}`} />
              <YAxis type="category" dataKey="label" width={100} />
              <Tooltip
                formatter={((value: number, _name: string, props: { payload: { label: string; value: number } }) => [
                  `${value} bookings (${formatZAR(props.payload.value)})`,
                  props.payload.label,
                ]) as TooltipFormatter}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {funnel.map((_entry, index) => (
                  <Cell key={index} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Trend */}
        <div className={styles.chartCard}>
          <Text className={styles.chartTitle}>Monthly Revenue (Last 6 Months)</Text>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trends} margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={((value: number) => formatZAR(value)) as TooltipFormatter} />
              <Legend />
              <Bar dataKey="deploymentRevenue" name="Deployment Revenue" stackId="a" fill="#1e6b7b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="conversionRevenue" name="Conversion Revenue" stackId="a" fill="#107c10" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Pipeline Table */}
      <div className={styles.tableCard}>
        <Text className={styles.chartTitle}>Revenue Pipeline</Text>
        {pipeline.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Client</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Account Manager</th>
                  <th className={styles.th}>Licenses</th>
                  <th className={styles.th}>Deployment Fee</th>
                  <th className={styles.th}>Deal Value</th>
                  <th className={styles.th}>Total</th>
                  <th className={styles.th}>Stage</th>
                </tr>
              </thead>
              <tbody>
                {pipeline.map((entry) => (
                  <tr key={entry.bookingId}>
                    <td className={styles.td}>
                      {entry.clientName}
                      {entry.isPremium && <span className={styles.premiumStar}>★</span>}
                    </td>
                    <td className={styles.td}>{entry.bookingType}</td>
                    <td className={styles.td}>{entry.accountManagerName}</td>
                    <td className={styles.td}>{entry.licenseCount || '—'}</td>
                    <td className={styles.td}>
                      {entry.deploymentFee > 0 ? formatZAR(entry.deploymentFee) : '—'}
                    </td>
                    <td className={styles.td}>
                      {entry.dealValue > 0 ? formatZAR(entry.dealValue) : '—'}
                    </td>
                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {formatZAR(entry.deploymentFee + entry.dealValue)}
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.stageBadge} ${getStageStyle(entry.stage)}`}>
                        {entry.stage}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Text>No pipeline entries yet.</Text>
          </div>
        )}
      </div>

      {/* AM Revenue Performance Table */}
      <div className={styles.tableCard}>
        <Text className={styles.chartTitle}>AM Revenue Performance</Text>
        {amRevenue.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>#</th>
                  <th className={styles.th}>Account Manager</th>
                  <th className={styles.th}>Deployments</th>
                  <th className={styles.th}>Deployment Revenue</th>
                  <th className={styles.th}>Conversions</th>
                  <th className={styles.th}>Conversion Revenue</th>
                  <th className={styles.th}>Total Revenue</th>
                  <th className={styles.th} style={{ minWidth: '120px' }}>Share</th>
                </tr>
              </thead>
              <tbody>
                {amRevenue.map((am, index) => (
                  <tr key={am.email}>
                    <td className={styles.td}>
                      <span className={styles.amRank}>{index + 1}</span>
                    </td>
                    <td className={styles.td}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{am.name}</div>
                        <div style={{ fontSize: '11px', color: '#616161' }}>{am.email}</div>
                      </div>
                    </td>
                    <td className={styles.td}>{am.deployments}</td>
                    <td className={styles.td}>{formatZAR(am.deploymentRevenue)}</td>
                    <td className={styles.td}>{am.conversions}</td>
                    <td className={styles.td}>{formatZAR(am.conversionRevenue)}</td>
                    <td className={styles.td} style={{ fontWeight: 600 }}>
                      {formatZAR(am.totalRevenue)}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.progressBarContainer}>
                        <div
                          className={styles.progressBar}
                          style={{
                            width: `${(am.totalRevenue / maxAMRevenue) * 100}%`,
                            backgroundColor: index === 0 ? DW_COLORS.teal : index === 1 ? '#0078d4' : '#8764b8',
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Text>No AM revenue data available.</Text>
          </div>
        )}
      </div>
    </div>
  );
};
