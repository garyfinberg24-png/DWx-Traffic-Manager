/**
 * DWx Traffic Manager - SLA Dashboard Tab
 * Shows SLA tracking metrics: compliance summary, bottleneck analysis, and active deal SLA status
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Text,
  makeStyles,
  Spinner,
  Badge,
  Tooltip,
} from '@fluentui/react-components';
import {
  ServiceRequest,
  DWService,
  SLAStatus,
  STAGE_METADATA,
  FunnelStage,
} from '../../types/ServiceRequest';
import { slaService } from '../../services/SLAService';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { DW_COLORS } from '../../utils/buttonStyles';

// ---------------------------------------------------------------------------
// SLA color mapping
// ---------------------------------------------------------------------------
const SLA_COLORS: Record<SLAStatus, string> = {
  'on-track': '#10B981',
  'at-risk': '#F59E0B',
  'breached': '#EF4444',
};

const SLA_LABELS: Record<SLAStatus, string> = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  'breached': 'Breached',
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const useStyles = makeStyles({
  container: {
    padding: '0',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px 0',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    padding: '16px 20px',
    flex: '1 1 180px',
    minWidth: '160px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#616161',
    display: 'block',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 600 as unknown as 'bold',
    lineHeight: '1.2',
  },
  section: {
    marginTop: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 600 as unknown as 'bold',
    marginBottom: '12px',
    display: 'block',
    color: DW_COLORS.primary,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    border: '1px solid #e1e1e1',
  },
  th: {
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: 600 as unknown as 'bold',
    color: '#616161',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e1e1e1',
    textAlign: 'left' as const,
  },
  td: {
    padding: '10px 14px',
    fontSize: '13px',
    color: '#242424',
    borderBottom: '1px solid #f0f0f0',
  },
  slaDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  stageBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600 as unknown as 'bold',
    color: '#ffffff',
  },
  stageCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stageDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  slaStatusCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '32px 16px',
    color: '#616161',
    fontSize: '13px',
  },
});

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SLADashboardTabProps {
  requests: ServiceRequest[];
}

// ---------------------------------------------------------------------------
// Helper: status sort priority (breached first, at-risk second, on-track last)
// ---------------------------------------------------------------------------
const STATUS_PRIORITY: Record<SLAStatus, number> = {
  'breached': 0,
  'at-risk': 1,
  'on-track': 2,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const SLADashboardTab: React.FC<SLADashboardTabProps> = ({ requests }) => {
  const styles = useStyles();
  const [services, setServices] = useState<DWService[]>([]);
  const [loading, setLoading] = useState(true);

  // Load services on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const result = await serviceCatalogService.getServices();
        if (!cancelled) setServices(result);
      } catch (err) {
        console.error('Failed to load services for SLA dashboard:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Build a service ID -> DWService lookup
  const serviceMap = useMemo(() => new Map(services.map(s => [s.Id, s])), [services]);

  // SLA summary counts
  const summary = useMemo(
    () => slaService.getSLASummary(requests, services),
    [requests, services]
  );

  // Bottleneck analysis per stage
  const bottlenecks = useMemo(
    () => slaService.getBottlenecks(requests, services),
    [requests, services]
  );

  // Active deals with SLA status
  const activeDeals = useMemo(() => {
    return requests
      .filter(r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost')
      .map(r => {
        const service = r.ServiceId ? serviceMap.get(r.ServiceId) : undefined;
        return {
          request: r,
          slaStatus: slaService.getSLAStatus(r, service),
          daysInStage: slaService.getTimeInCurrentStage(r),
        };
      })
      .sort((a, b) => STATUS_PRIORITY[a.slaStatus] - STATUS_PRIORITY[b.slaStatus]);
  }, [requests, serviceMap]);

  // ---------- Loading state ----------
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" label="Loading SLA data..." />
      </div>
    );
  }

  // ---------- Compliance rate color ----------
  const complianceColor =
    summary.complianceRate >= 80
      ? SLA_COLORS['on-track']
      : summary.complianceRate >= 60
        ? SLA_COLORS['at-risk']
        : SLA_COLORS['breached'];

  // ---------- Breach rate text color ----------
  const breachRateColor = (rate: number): string => {
    if (rate > 50) return SLA_COLORS['breached'];
    if (rate >= 20) return SLA_COLORS['at-risk'];
    return SLA_COLORS['on-track'];
  };

  return (
    <div className={styles.container}>
      {/* ------------------------------------------------------------------ */}
      {/* Top row: 4 stat cards                                              */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.statsRow}>
        {/* Compliance Rate */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Compliance Rate</span>
          <Text className={styles.statValue} style={{ color: complianceColor }}>
            {summary.complianceRate}%
          </Text>
        </div>

        {/* On Track */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>On Track</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text className={styles.statValue}>{summary.onTrack}</Text>
            <Badge
              size="small"
              appearance="filled"
              color="success"
            >
              On Track
            </Badge>
          </div>
        </div>

        {/* At Risk */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>At Risk</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text className={styles.statValue} style={{ color: SLA_COLORS['at-risk'] }}>
              {summary.atRisk}
            </Text>
            <Badge
              size="small"
              appearance="filled"
              color="warning"
            >
              At Risk
            </Badge>
          </div>
        </div>

        {/* Breached */}
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Breached</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text className={styles.statValue} style={{ color: SLA_COLORS['breached'] }}>
              {summary.breached}
            </Text>
            <Badge
              size="small"
              appearance="filled"
              color="danger"
            >
              Breached
            </Badge>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Bottleneck Analysis                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Bottleneck Analysis</Text>
        {bottlenecks.length === 0 ? (
          <div className={styles.emptyState}>
            No stage transition data available yet.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Stage</th>
                <th className={styles.th}>Avg Days in Stage</th>
                <th className={styles.th}>Target Days</th>
                <th className={styles.th}>Breach Rate</th>
              </tr>
            </thead>
            <tbody>
              {bottlenecks.map((b) => {
                const meta = STAGE_METADATA[b.stage as FunnelStage];
                return (
                  <tr key={b.stage}>
                    <td className={styles.td}>
                      <div className={styles.stageCell}>
                        <span
                          className={styles.stageDot}
                          style={{ backgroundColor: meta?.color || '#6B7280' }}
                        />
                        {b.stage}
                      </div>
                    </td>
                    <td className={styles.td}>{b.avgDays}</td>
                    <td className={styles.td}>{b.targetDays || '-'}</td>
                    <td className={styles.td}>
                      <Tooltip
                        content={
                          b.breachRate > 50
                            ? 'High breach rate - needs attention'
                            : b.breachRate >= 20
                              ? 'Moderate breach rate'
                              : 'Healthy'
                        }
                        relationship="description"
                      >
                        <span style={{ color: breachRateColor(b.breachRate), fontWeight: 600 }}>
                          {b.breachRate}%
                        </span>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Active Deals SLA Status                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Active Deals SLA Status</Text>
        {activeDeals.length === 0 ? (
          <div className={styles.emptyState}>
            No active deals to display.
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Client</th>
                <th className={styles.th}>Service</th>
                <th className={styles.th}>Current Stage</th>
                <th className={styles.th}>Days in Stage</th>
                <th className={styles.th}>SLA Status</th>
              </tr>
            </thead>
            <tbody>
              {activeDeals.map(({ request, slaStatus, daysInStage }) => {
                const stageMeta = STAGE_METADATA[request.FunnelStage];
                return (
                  <tr key={request.Id}>
                    <td className={styles.td}>{request.ClientName}</td>
                    <td className={styles.td}>{request.ServiceName}</td>
                    <td className={styles.td}>
                      <span
                        className={styles.stageBadge}
                        style={{ backgroundColor: stageMeta?.color || '#6B7280' }}
                      >
                        {request.FunnelStage}
                      </span>
                    </td>
                    <td className={styles.td}>{daysInStage}</td>
                    <td className={styles.td}>
                      <div className={styles.slaStatusCell}>
                        <span
                          className={styles.slaDot}
                          style={{ backgroundColor: SLA_COLORS[slaStatus] }}
                        />
                        <span style={{ color: SLA_COLORS[slaStatus], fontWeight: 500 }}>
                          {SLA_LABELS[slaStatus]}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
