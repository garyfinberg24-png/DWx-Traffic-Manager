/**
 * DWx Traffic Manager - Delivery Command Centre
 * Consolidated project view showing all active delivery handovers with
 * summary stats, filterable project cards, and overview dashboard.
 * v2.16.0
 */

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { makeStyles, Text, Spinner, Button, ProgressBar, shorthands, SearchBox } from '@fluentui/react-components';
import { ArrowClockwise24Regular, RocketRegular, BoxRegular, CalendarRegular, PersonRegular, MoneyRegular } from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { deliveryHandoverService } from '../../services/DeliveryHandoverService';
import { deliveryResourceService } from '../../services/DeliveryResourceService';
import type { CapacitySummary } from '../../services/DeliveryResourceService';
import { HANDOVER_STATUS_COLORS, HANDOVER_STATUSES, getHandoverChecklistSummary, getHandoverDaysSinceWon, DELIVERY_ROLE_COLORS } from '../../types/DeliveryHandover';
import type { DeliveryHandover, HandoverStatus, TeamAssignment } from '../../types/DeliveryHandover';
import { DW_COLORS } from '../../utils/buttonStyles';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';

// ─── Constants ───────────────────────────────────────────────────────────────

type SortOption = 'newest' | 'oldest' | 'highest-value' | 'lowest-value' | 'client-az';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest-value', label: 'Highest value' },
  { value: 'lowest-value', label: 'Lowest value' },
  { value: 'client-az', label: 'Client A-Z' },
];

/** Get contract value from handover, handling service mapping differences */
const getContractValue = (h: DeliveryHandover): number => {
  // Type defines ContractValue, but service mapToHandover may set DealValue instead
  const raw = h as unknown as Record<string, unknown>;
  return (raw.ContractValue as number) ?? (raw.DealValue as number) ?? 0;
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: 'flex', flexDirection: 'column', ...shorthands.gap('24px'),
    ...shorthands.padding('0', '64px', '24px'), maxWidth: '1400px', ...shorthands.margin('0', 'auto'),
  },
  heroWrapper: { position: 'relative', marginBottom: '20px' },
  heroBanner: {
    ...shorthands.borderRadius('0', '0', '16px', '16px'), ...shorthands.padding('0'),
    position: 'relative', ...shorthands.overflow('hidden'),
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1e6b7b 100%)',
  },
  heroExpanded: { maxHeight: '200px', transitionProperty: 'max-height', transitionDuration: '350ms', transitionTimingFunction: 'ease' },
  heroCollapsed: { maxHeight: '56px', transitionProperty: 'max-height', transitionDuration: '350ms', transitionTimingFunction: 'ease' },
  heroDecoration: {
    position: 'absolute', top: '-80px', right: '-40px', width: '300px', height: '300px',
    ...shorthands.borderRadius('50%'), background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', ...shorthands.gap('32px'), ...shorthands.padding('24px', '32px'),
  },
  collapsedStrip: {
    display: 'flex', alignItems: 'center', ...shorthands.gap('16px'),
    ...shorthands.padding('0', '32px'), height: '56px', position: 'relative', zIndex: 2,
  },
  badge: {
    fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.15)', ...shorthands.padding('5px', '12px'),
    ...shorthands.borderRadius('10px'), display: 'flex', alignItems: 'center', ...shorthands.gap('6px'), whiteSpace: 'nowrap',
  },
  badgeSmall: {
    fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.15)', ...shorthands.padding('3px', '10px'), ...shorthands.borderRadius('10px'),
  },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', ...shorthands.gap('12px') },
  filterBar: { display: 'flex', alignItems: 'center', ...shorthands.gap('12px'), flexWrap: 'wrap' },
  filterPills: { display: 'flex', ...shorthands.gap('6px'), flexWrap: 'wrap', flex: 1 },
  filterPill: {
    fontSize: '12px', fontWeight: '500', ...shorthands.padding('5px', '14px'), ...shorthands.borderRadius('16px'),
    ...shorthands.border('1px', 'solid', '#d1d5db'), backgroundColor: '#ffffff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', ...shorthands.gap('6px'), ':hover': { backgroundColor: '#f3f4f6' },
  },
  filterPillActive: {
    fontSize: '12px', fontWeight: '600', ...shorthands.padding('5px', '14px'), ...shorthands.borderRadius('16px'),
    ...shorthands.border('1px', 'solid', DW_COLORS.primary), backgroundColor: '#e0f2fe',
    color: DW_COLORS.primary, cursor: 'pointer', display: 'flex', alignItems: 'center', ...shorthands.gap('6px'),
  },
  projectGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', ...shorthands.gap('20px') },
  projectCard: {
    backgroundColor: '#ffffff', ...shorthands.borderRadius('12px'), ...shorthands.border('1px', 'solid', '#e8e8e8'),
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', ...shorthands.overflow('hidden'), display: 'flex', flexDirection: 'column',
  },
  centered: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    ...shorthands.padding('60px'), flexDirection: 'column', ...shorthands.gap('12px'),
  },
});

// ─── Sub-Components (Module Level) ───────────────────────────────────────────

const StatusSummaryCard: React.FC<{ status: HandoverStatus; count: number }> = ({ status, count }) => {
  const colors = HANDOVER_STATUS_COLORS[status];
  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '10px', padding: '14px 16px',
      border: '1px solid #e8e8e8', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: '10px',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: colors.accent, flexShrink: 0 }} />
      <Text style={{ fontSize: '12px', color: '#616161' }}>{status}</Text>
      <Text style={{ fontSize: '20px', fontWeight: 700, color: '#242424', marginLeft: 'auto' }}>{count}</Text>
    </div>
  );
};

const ProjectCard: React.FC<{ handover: DeliveryHandover }> = ({ handover }) => {
  const styles = useStyles();
  const statusColors = HANDOVER_STATUS_COLORS[handover.HandoverStatus];
  const contractValue = getContractValue(handover);

  const checklistSummary = useMemo(
    () => getHandoverChecklistSummary(handover.HandoverChecklist || []),
    [handover.HandoverChecklist]
  );

  const daysSinceWon = useMemo(
    () => (handover.WonDate ? getHandoverDaysSinceWon(handover.WonDate) : 0),
    [handover.WonDate]
  );

  // Date accessors (handle type vs service mapping differences)
  const h = handover as unknown as Record<string, unknown>;
  const wonDate = (handover.WonDate || h.WonDate) as string | undefined;
  const kickoffDate = (handover.PlannedKickoffDate || h.KickoffDate || h.ActualKickoffDate) as string | undefined;
  const goLiveDate = (handover.PlannedGoLive || h.GoLiveDate) as string | undefined;

  const projectName = `${handover.ClientName || 'Unknown Client'} - ${handover.ServiceName || 'Unknown Service'}`;
  const team: TeamAssignment[] = handover.DeliveryTeam || [];
  const visibleTeam = team.slice(0, 4);
  const extraCount = Math.max(0, team.length - 4);
  const amName = handover.AccountManagerName || '';
  const dmName = handover.DeliveryManagerName || '';

  return (
    <div className={styles.projectCard}>
      {/* Top accent border */}
      <div style={{ height: 4, backgroundColor: statusColors.accent }} />

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{
              fontSize: '15px', fontWeight: 600, color: '#1f2937', lineHeight: '1.3',
              overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>{projectName}</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <MoneyRegular style={{ fontSize: 14, color: DW_COLORS.primary }} />
              <Text style={{ fontSize: '16px', fontWeight: 700, color: DW_COLORS.primary }}>{formatCurrency(contractValue)}</Text>
              {handover.ServiceCategory && (
                <span style={{ fontSize: '11px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: '6px' }}>
                  {handover.ServiceCategory}
                </span>
              )}
            </div>
          </div>
          <span style={{
            fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '10px',
            whiteSpace: 'nowrap', flexShrink: 0, backgroundColor: statusColors.bg, color: statusColors.text,
          }}>{handover.HandoverStatus}</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: '12px', color: '#6b7280' }}>
              Handover checklist: {checklistSummary.completed}/{checklistSummary.total}
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{checklistSummary.percentage}%</Text>
              {daysSinceWon > 0 && (
                <span style={{ fontSize: '11px', color: '#92400e', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '6px', fontWeight: 500 }}>
                  {daysSinceWon}d since won
                </span>
              )}
            </div>
          </div>
          <ProgressBar
            value={checklistSummary.total > 0 ? checklistSummary.completed / checklistSummary.total : 0}
            thickness="medium" color="brand"
          />
        </div>

        {/* Team chips */}
        {visibleTeam.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {visibleTeam.map((member) => {
              const rc = DELIVERY_ROLE_COLORS[member.role] || { bg: '#f3f4f6', text: '#374151' };
              return (
                <span key={member.id || `${member.resourceEmail}-${member.role}`}
                  title={`${member.resourceName} (${member.role})`}
                  style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '180px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    backgroundColor: rc.bg, color: rc.text,
                  }}>
                  <PersonRegular style={{ fontSize: 12 }} />
                  {member.resourceName?.split(' ')[0] || 'TBD'} - {member.role}
                </span>
              );
            })}
            {extraCount > 0 && (
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Key dates */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Won Date', value: wonDate },
            { label: 'Kickoff', value: kickoffDate },
            { label: 'Go-Live', value: goLiveDate },
          ].map((d) => (
            <div key={d.label} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Text style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>{d.label}</Text>
              <Text style={{ fontSize: '12px', color: '#374151', fontWeight: 500 }}>{formatDate(d.value)}</Text>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 20px', borderTop: '1px solid #f3f4f6', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa',
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {amName && (
            <span style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              <PersonRegular style={{ fontSize: 12 }} /> AM: {amName}
            </span>
          )}
          {dmName && (
            <span style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
              <RocketRegular style={{ fontSize: 12 }} /> DM: {dmName}
            </span>
          )}
        </div>
        <Text style={{ fontSize: '12px', fontWeight: 600, color: DW_COLORS.primary, cursor: 'pointer' }}>
          View Details &rarr;
        </Text>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const DeliveryCommandCentre: React.FC = () => {
  const styles = useStyles();
  const { isCollapsed, toggle } = useHeroCollapse('delivery');
  useAuth(); // Ensure authenticated context is available

  const [handovers, setHandovers] = useState<DeliveryHandover[]>([]);
  const [capacity, setCapacity] = useState<CapacitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<HandoverStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allHandovers, cap] = await Promise.all([
        deliveryHandoverService.getAllHandovers(),
        deliveryResourceService.getCapacitySummary(),
      ]);
      setHandovers(allHandovers);
      setCapacity(cap);
    } catch (error) {
      console.error('[DeliveryCommandCentre] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Computed ────────────────────────────────────────────────────

  const statusCounts = useMemo(() => {
    const c: Record<HandoverStatus, number> = { 'Pending': 0, 'In Progress': 0, 'Kickoff Scheduled': 0, 'Delivered': 0, 'Closed': 0, 'On Hold': 0 };
    for (const h of handovers) { if (c[h.HandoverStatus] !== undefined) c[h.HandoverStatus]++; }
    return c;
  }, [handovers]);

  const heroStats = useMemo(() => {
    const activeProjects = handovers.filter((h) => h.HandoverStatus !== 'Closed').length;
    const totalValue = handovers.reduce((s, h) => s + getContractValue(h), 0);
    const completed = handovers.filter((h) => h.HandoverStatus === 'Delivered' || h.HandoverStatus === 'Closed');
    let avgHandoverDays = 0;
    if (completed.length > 0) {
      const totalDays = completed.reduce((s, h) => s + (h.WonDate ? getHandoverDaysSinceWon(h.WonDate) : 0), 0);
      avgHandoverDays = Math.round(totalDays / completed.length);
    }
    return { activeProjects, totalValue, avgHandoverDays, utilizationPercent: capacity?.utilizationPercent ?? 0 };
  }, [handovers, capacity]);

  const filteredHandovers = useMemo(() => {
    let result = [...handovers];
    if (statusFilter !== 'All') result = result.filter((h) => h.HandoverStatus === statusFilter);
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      result = result.filter((h) =>
        (h.ClientName || '').toLowerCase().includes(q) ||
        (h.ServiceName || '').toLowerCase().includes(q) ||
        (h.AccountManagerName || '').toLowerCase().includes(q) ||
        (h.DeliveryManagerName || '').toLowerCase().includes(q) ||
        (h.Title || '').toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'newest': result.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime()); break;
      case 'oldest': result.sort((a, b) => new Date(a.Created).getTime() - new Date(b.Created).getTime()); break;
      case 'highest-value': result.sort((a, b) => getContractValue(b) - getContractValue(a)); break;
      case 'lowest-value': result.sort((a, b) => getContractValue(a) - getContractValue(b)); break;
      case 'client-az': result.sort((a, b) => (a.ClientName || '').localeCompare(b.ClientName || '')); break;
    }
    return result;
  }, [handovers, statusFilter, deferredSearch, sortBy]);

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <>
      {/* Hero Banner */}
      <div className={styles.heroWrapper}>
        <div className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}>
          <div className={styles.heroDecoration} />
          {/* Expanded */}
          <div className={styles.heroContent} style={{ opacity: isCollapsed ? 0 : 1, transition: 'opacity 250ms ease' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Text style={{ fontSize: '22px', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                <RocketRegular style={{ fontSize: 22, color: 'rgba(255,255,255,0.7)' }} />
                Delivery Command Centre
              </Text>
              <Text style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                Active project delivery tracking and resource management
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span className={styles.badge}><BoxRegular style={{ fontSize: 14 }} />{heroStats.activeProjects} Active</span>
              <span className={styles.badge}><MoneyRegular style={{ fontSize: 14 }} />{formatCurrency(heroStats.totalValue)}</span>
              <span className={styles.badge}><CalendarRegular style={{ fontSize: 14 }} />{heroStats.avgHandoverDays > 0 ? `${heroStats.avgHandoverDays}d avg` : 'No data'}</span>
              <span className={styles.badge}><PersonRegular style={{ fontSize: 14 }} />{heroStats.utilizationPercent}% utilised</span>
            </div>
          </div>
          {/* Collapsed */}
          {isCollapsed && (
            <div className={styles.collapsedStrip}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Delivery Command Centre</span>
              <span className={styles.badgeSmall}>{heroStats.activeProjects} Active</span>
              <span className={styles.badgeSmall}>{formatCurrency(heroStats.totalValue)}</span>
              <span className={styles.badgeSmall}>{heroStats.utilizationPercent}% utilised</span>
            </div>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

      <div className={styles.container}>
        {loading ? (
          <div className={styles.centered}>
            <Spinner size="medium" />
            <Text style={{ color: '#616161', fontSize: '14px' }}>Loading delivery projects...</Text>
          </div>
        ) : handovers.length === 0 ? (
          <div className={styles.centered}>
            <RocketRegular style={{ fontSize: 48, color: '#d1d5db' }} />
            <Text style={{ fontSize: '18px', fontWeight: 600, color: '#374151' }}>No active deliveries</Text>
            <Text style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', maxWidth: '360px' }}>
              Handovers are automatically created when deals reach Won stage.
            </Text>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className={styles.summaryRow}>
              {HANDOVER_STATUSES.map((s) => <StatusSummaryCard key={s} status={s} count={statusCounts[s]} />)}
            </div>

            {/* Filter bar */}
            <div className={styles.filterBar}>
              <SearchBox
                style={{ minWidth: '240px', maxWidth: '320px' }}
                placeholder="Search projects, clients, managers..."
                value={searchQuery}
                onChange={(_, data) => setSearchQuery(data.value)}
              />
              <div className={styles.filterPills}>
                <div role="button" tabIndex={0}
                  className={statusFilter === 'All' ? styles.filterPillActive : styles.filterPill}
                  onClick={() => setStatusFilter('All')}
                  onKeyDown={(e) => e.key === 'Enter' && setStatusFilter('All')}>
                  All ({handovers.length})
                </div>
                {HANDOVER_STATUSES.map((s) => (
                  <div key={s} role="button" tabIndex={0}
                    className={statusFilter === s ? styles.filterPillActive : styles.filterPill}
                    onClick={() => setStatusFilter(s)}
                    onKeyDown={(e) => e.key === 'Enter' && setStatusFilter(s)}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: HANDOVER_STATUS_COLORS[s].accent, display: 'inline-block' }} />
                    {s} ({statusCounts[s]})
                  </div>
                ))}
              </div>
              <select
                style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', color: '#374151' }}
                value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} aria-label="Sort projects">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Button appearance="subtle" icon={<ArrowClockwise24Regular />} onClick={loadData} title="Refresh" aria-label="Refresh delivery data" />
            </div>

            {/* Project cards */}
            {filteredHandovers.length === 0 ? (
              <div className={styles.centered}>
                <Text style={{ fontSize: '18px', fontWeight: 600, color: '#374151' }}>No matching projects</Text>
                <Text style={{ fontSize: '13px', color: '#9ca3af' }}>Try adjusting your search or filter criteria.</Text>
              </div>
            ) : (
              <div className={styles.projectGrid}>
                {filteredHandovers.map((ho) => <ProjectCard key={ho.Id} handover={ho} />)}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default DeliveryCommandCentre;
