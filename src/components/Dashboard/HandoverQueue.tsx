/**
 * DWx Traffic Manager - Handover Queue
 * Dashboard tab showing active delivery handovers with status filtering,
 * sorting, summary stats, and card grid. v2.16.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { makeStyles, Spinner, ProgressBar, Tooltip } from '@fluentui/react-components';
import {
  ArrowClockwise24Regular, CheckmarkCircle24Regular, Clock24Regular,
  Money24Regular, Warning24Regular, ArrowSort20Regular, Search20Regular, People24Regular,
} from '@fluentui/react-icons';
import { deliveryHandoverService } from '../../services/DeliveryHandoverService';
import {
  HANDOVER_STATUS_COLORS, HANDOVER_STATUSES,
  getHandoverChecklistSummary, getHandoverDaysSinceWon,
} from '../../types/DeliveryHandover';
import type { DeliveryHandover, HandoverStatus } from '../../types/DeliveryHandover';
import type { ServiceRequest } from '../../types/ServiceRequest';
import { DW_COLORS } from '../../utils/buttonStyles';
import { formatCurrency } from '../../utils/formatters';
import { EmptyState } from '../Common/EmptyState';

// ── Types & Constants ────────────────────────────────────────────────────────

interface HandoverQueueProps {
  serviceRequests: ServiceRequest[];
  onHandoverClick?: (handover: DeliveryHandover) => void;
}
type StatusFilter = 'All' | HandoverStatus;
type SortOption = 'newest' | 'oldest' | 'highest-value' | 'days-since-won';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'highest-value', label: 'Highest Value' },
  { value: 'days-since-won', label: 'Days Since Won' },
];

const AVATAR_COLORS = ['#1a5a8a', '#1e6b7b', '#107c10', '#6d28d9', '#be185d', '#c2410c'];

// ── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getContractValue = (h: DeliveryHandover): number => (h as any).DealValue ?? h.ContractValue ?? 0;

const getInitials = (name: string): string => {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return p.length === 1 ? (p[0][0]?.toUpperCase() || '?') : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

const metaPill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
  fontWeight: 500, backgroundColor: '#f3f4f6', color: '#4b5563', whiteSpace: 'nowrap',
};

const avatarCss = (i: number): React.CSSProperties => ({
  width: 28, height: 28, borderRadius: '50%', fontSize: '10px', fontWeight: 700,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: '2px solid white', marginLeft: i > 0 ? -6 : 0,
  position: 'relative', zIndex: 10 - i, flexShrink: 0,
  backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length], color: 'white',
});

// ── Module-level Sub-components ──────────────────────────────────────────────

const StatCard: React.FC<{ label: string; value: string | number; accent?: string; icon?: React.ReactNode }> = ({ label, value, accent, icon }) => (
  <div style={{ flex: 1, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
    {icon && <div style={{ color: accent || DW_COLORS.primary, marginBottom: 2 }}>{icon}</div>}
    <div style={{ fontSize: 24, fontWeight: 700, color: accent || DW_COLORS.primary }}>{value}</div>
    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
  </div>
);

// ── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', '@media (max-width: 768px)': { gridTemplateColumns: '1fr 1fr' } },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' },
  pillsRow: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  sortRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  searchInput: { padding: '6px 10px 6px 32px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none', width: '200px', backgroundColor: '#ffffff' },
  cardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', '@media (max-width: 900px)': { gridTemplateColumns: '1fr' } },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden', cursor: 'pointer', transitionProperty: 'box-shadow, transform', transitionDuration: '200ms', ':hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' } },
  cardBody: { padding: '16px 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  metaRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderTop: '1px solid #f3f4f6', backgroundColor: '#fafbfc', fontSize: '12px', color: '#6b7280' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '64px 0' },
});

// ── Main Component ───────────────────────────────────────────────────────────

export const HandoverQueue: React.FC<HandoverQueueProps> = ({ serviceRequests: _serviceRequests, onHandoverClick }) => {
  const styles = useStyles();
  const [handovers, setHandovers] = useState<DeliveryHandover[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchText, setSearchText] = useState('');
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => { loadHandovers(); }, []);

  const loadHandovers = async () => {
    setLoading(true);
    try { setHandovers(await deliveryHandoverService.getAllHandovers()); }
    catch (err) { console.error('[HandoverQueue] Failed to load handovers:', err); setHandovers([]); }
    finally { setLoading(false); }
  };

  // ── Filtering & Sorting ──────────────────────────────────────────────────

  const baseHandovers = useMemo(
    () => showClosed ? handovers : handovers.filter(h => h.HandoverStatus !== 'Closed'),
    [handovers, showClosed],
  );

  const searchFiltered = useMemo(() => {
    if (!searchText.trim()) return baseHandovers;
    const q = searchText.toLowerCase();
    return baseHandovers.filter(h =>
      h.ClientName?.toLowerCase().includes(q) || h.ServiceName?.toLowerCase().includes(q) ||
      h.AccountManagerName?.toLowerCase().includes(q) || h.DeliveryManagerName?.toLowerCase().includes(q));
  }, [baseHandovers, searchText]);

  const statusFiltered = useMemo(
    () => selectedStatus === 'All' ? searchFiltered : searchFiltered.filter(h => h.HandoverStatus === selectedStatus),
    [searchFiltered, selectedStatus],
  );

  const sortedHandovers = useMemo(() => {
    const list = [...statusFiltered];
    switch (sortBy) {
      case 'newest':  return list.sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());
      case 'oldest':  return list.sort((a, b) => new Date(a.Created).getTime() - new Date(b.Created).getTime());
      case 'highest-value': return list.sort((a, b) => getContractValue(b) - getContractValue(a));
      case 'days-since-won': return list.sort((a, b) => {
        const dA = a.WonDate ? getHandoverDaysSinceWon(a.WonDate) : 0;
        const dB = b.WonDate ? getHandoverDaysSinceWon(b.WonDate) : 0;
        return dB - dA;
      });
      default: return list;
    }
  }, [statusFiltered, sortBy]);

  // ── Summary Stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const active = baseHandovers.filter(h => h.HandoverStatus !== 'Closed' && h.HandoverStatus !== 'Delivered');
    const totalValue = baseHandovers.reduce((s, h) => s + getContractValue(h), 0);
    const atRiskCount = baseHandovers.filter(h => {
      if (h.HandoverStatus === 'Closed' || h.HandoverStatus === 'Delivered') return false;
      return h.WonDate ? getHandoverDaysSinceWon(h.WonDate) > 14 : false;
    }).length;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completed = handovers.filter(h => (h.HandoverStatus === 'Delivered' || h.HandoverStatus === 'Closed') && h.WonDate && (h as any).DeliveredDate);
    let avgDays = 0;
    if (completed.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const total = completed.reduce((s, h) => s + Math.max(0, (new Date((h as any).DeliveredDate).getTime() - new Date(h.WonDate).getTime()) / 86400000), 0);
      avgDays = Math.round(total / completed.length);
    }
    return { activeCount: active.length, avgDays, totalValue, atRiskCount };
  }, [baseHandovers, handovers]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { All: searchFiltered.length };
    for (const s of HANDOVER_STATUSES) { if (showClosed || s !== 'Closed') c[s] = searchFiltered.filter(h => h.HandoverStatus === s).length; }
    return c;
  }, [searchFiltered, showClosed]);

  const visibleStatuses: StatusFilter[] = useMemo(
    () => ['All' as StatusFilter, ...HANDOVER_STATUSES.filter(s => showClosed || s !== 'Closed')],
    [showClosed],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) return <div className={styles.loading}><Spinner size="medium" label="Loading handovers..." /></div>;

  return (
    <div className={styles.container}>
      {/* Summary Stats */}
      <div className={styles.statsRow}>
        <StatCard label="Active Handovers" value={stats.activeCount} accent={DW_COLORS.primary} icon={<People24Regular />} />
        <StatCard label="Avg Days to Complete" value={stats.avgDays > 0 ? `${stats.avgDays}d` : '-'} accent={DW_COLORS.teal} icon={<Clock24Regular />} />
        <StatCard label="Total Contract Value" value={formatCurrency(stats.totalValue)} accent={DW_COLORS.success} icon={<Money24Regular />} />
        <StatCard label="At Risk (>14 days)" value={stats.atRiskCount} accent={stats.atRiskCount > 0 ? DW_COLORS.danger : DW_COLORS.neutral} icon={<Warning24Regular />} />
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.pillsRow}>
          {visibleStatuses.map(status => {
            const count = statusCounts[status] ?? 0;
            const isActive = selectedStatus === status;
            const sc = status !== 'All' ? HANDOVER_STATUS_COLORS[status as HandoverStatus] : null;
            return (
              <div key={status} onClick={() => setSelectedStatus(status)} role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedStatus(status); }}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  backgroundColor: isActive ? (sc?.accent || DW_COLORS.primary) : '#f3f4f6',
                  color: isActive ? 'white' : '#4b5563', display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none',
                  transition: 'background-color 150ms ease' }}>
                {status !== 'All' && <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : (sc?.accent || '#9ca3af') }} />}
                {status}
                <span style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                  color: isActive ? 'white' : '#6b7280', fontSize: 10, fontWeight: 600, padding: '1px 6px',
                  borderRadius: 10, lineHeight: '1.4' }}>{count}</span>
              </div>
            );
          })}
          <div onClick={() => setShowClosed(!showClosed)} role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowClosed(!showClosed); }}
            style={{ padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer',
              backgroundColor: showClosed ? '#d1fae5' : '#f9fafb', color: showClosed ? '#065f46' : '#9ca3af',
              border: `1px solid ${showClosed ? '#a7f3d0' : '#e5e7eb'}`, userSelect: 'none' }}>
            {showClosed ? 'Hiding Closed: Off' : 'Show Closed'}
          </div>
        </div>

        <div className={styles.sortRow}>
          <div style={{ position: 'relative' }}>
            <Search20Regular style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input className={styles.searchInput} type="text" placeholder="Search client, service..." value={searchText} onChange={e => setSearchText(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowSort20Regular style={{ color: '#6b7280' }} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
              style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 12, backgroundColor: '#fff', color: '#374151', cursor: 'pointer', outline: 'none' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <Tooltip content="Refresh handovers" relationship="label">
            <div role="button" tabIndex={0} onClick={loadHandovers} onKeyDown={e => { if (e.key === 'Enter') loadHandovers(); }}
              style={{ padding: 6, borderRadius: 6, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
              <ArrowClockwise24Regular />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* Card Grid */}
      {sortedHandovers.length === 0 ? (
        <EmptyState icon={<CheckmarkCircle24Regular />}
          title={selectedStatus !== 'All' || searchText ? 'No matching handovers' : 'No active handovers'}
          description={selectedStatus !== 'All' || searchText ? 'Try adjusting your filters or search terms.' : 'Won deals will appear here once handover is initiated.'} />
      ) : (
        <div className={styles.cardGrid}>
          {sortedHandovers.map(h => <HandoverCard key={h.Id} handover={h} onClick={() => onHandoverClick?.(h)} />)}
        </div>
      )}
    </div>
  );
};

// ── Handover Card (module-level) ─────────────────────────────────────────────

const HandoverCard: React.FC<{ handover: DeliveryHandover; onClick?: () => void }> = ({ handover, onClick }) => {
  const styles = useStyles();
  const sc = HANDOVER_STATUS_COLORS[handover.HandoverStatus];
  const value = getContractValue(handover);
  const days = handover.WonDate ? getHandoverDaysSinceWon(handover.WonDate) : 0;
  const cl = getHandoverChecklistSummary(handover.HandoverChecklist || []);
  const team = handover.DeliveryTeam || [];

  // Collect unique team names
  const names: string[] = [];
  if (handover.DeliveryManagerName) names.push(handover.DeliveryManagerName);
  if (handover.ProjectManagerName && !names.includes(handover.ProjectManagerName)) names.push(handover.ProjectManagerName);
  for (const m of team) { if (m.resourceName && !names.includes(m.resourceName)) names.push(m.resourceName); }
  const visible = names.slice(0, 4);
  const overflow = Math.max(0, names.length - 4);

  const isAtRisk = days > 14 && handover.HandoverStatus !== 'Delivered' && handover.HandoverStatus !== 'Closed';
  const wonStr = handover.WonDate ? new Date(handover.WonDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  return (
    <div className={styles.card} style={{ borderLeft: `4px solid ${sc?.accent || '#9ca3af'}` }} onClick={onClick}>
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{handover.ClientName}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{handover.ServiceName}</div>
          </div>
          <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, backgroundColor: sc?.bg || '#e5e7eb', color: sc?.text || '#4b5563', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {handover.HandoverStatus}
          </span>
        </div>

        <div className={styles.metaRow}>
          {value > 0 && <span style={metaPill}><Money24Regular style={{ width: 14, height: 14 }} />{formatCurrency(value)}</span>}
          <span style={{ ...metaPill, ...(isAtRisk ? { backgroundColor: '#fee2e2', color: '#991b1b' } : {}) }}>
            <Clock24Regular style={{ width: 14, height: 14 }} />{days}d since won
          </span>
          {handover.ServiceCategory && <span style={metaPill}>{String(handover.ServiceCategory)}</span>}
        </div>

        {names.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {visible.map((n, i) => <Tooltip key={i} content={n} relationship="label"><div style={avatarCss(i)}>{getInitials(n)}</div></Tooltip>)}
            {overflow > 0 && <div style={{ ...avatarCss(visible.length), backgroundColor: '#e5e7eb', color: '#6b7280' }}>+{overflow}</div>}
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>Delivery Team</span>
          </div>
        )}

        {cl.total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <ProgressBar value={cl.percentage / 100} thickness="medium"
                style={{ '--fui-ProgressBar__bar--background': cl.percentage === 100 ? DW_COLORS.success : DW_COLORS.primary } as React.CSSProperties} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', flexShrink: 0 }}>{cl.percentage}%</span>
            <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>({cl.completed}/{cl.total})</span>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>AM: {handover.AccountManagerName || '-'}</span>
        <span style={{ flexShrink: 0 }}>Won: {wonStr}</span>
      </div>
    </div>
  );
};

export default HandoverQueue;
