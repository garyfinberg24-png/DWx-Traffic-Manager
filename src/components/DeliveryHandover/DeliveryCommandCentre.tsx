/**
 * DWx Traffic Manager - Delivery Command Centre
 * Consolidated project view showing all active delivery handovers with
 * summary stats, filterable project cards, and overview dashboard.
 * v2.16.0
 */

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { makeStyles, Text, Spinner, Button, ProgressBar, shorthands, SearchBox } from '@fluentui/react-components';
import { ArrowClockwise24Regular, RocketRegular, BoxRegular, CalendarRegular, PersonRegular, MoneyRegular, People24Regular, ArrowLeft24Regular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { deliveryHandoverService } from '../../services/DeliveryHandoverService';
import { deliveryResourceService } from '../../services/DeliveryResourceService';
import type { CapacitySummary } from '../../services/DeliveryResourceService';
import { HANDOVER_STATUS_COLORS, HANDOVER_STATUSES, getHandoverChecklistSummary, getHandoverDaysSinceWon, DELIVERY_ROLE_COLORS } from '../../types/DeliveryHandover';
import type { DeliveryHandover, HandoverStatus, TeamAssignment } from '../../types/DeliveryHandover';
import type { ServiceRequest } from '../../types/ServiceRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { RequestDetails } from '../MyRequests/RequestDetails';
import { ResourceCapacityDashboard } from './ResourceCapacityDashboard';
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
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 50%, #1e6b7b 100%)',
  },
  heroExpanded: { maxHeight: '400px', transitionProperty: 'max-height', transitionDuration: '350ms', transitionTimingFunction: 'ease' },
  heroCollapsed: { maxHeight: '56px', transitionProperty: 'max-height', transitionDuration: '350ms', transitionTimingFunction: 'ease' },
  heroDecoration: {
    position: 'absolute', top: '-80px', right: '-40px', width: '300px', height: '300px',
    ...shorthands.borderRadius('50%'), background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none',
  },
  // Row 1: Page header (matches Products/Services)
  heroHeaderRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    ...shorthands.padding('20px', '32px', '0'), position: 'relative', zIndex: 2,
  },
  heroHeaderTitle: { fontSize: '28px', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' },
  heroHeaderSubtitle: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' },
  backButtonHero: {
    ...shorthands.padding('6px', '14px'), ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.25)'),
    backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)',
    fontSize: '13px', fontWeight: '500', cursor: 'pointer',
    transitionProperty: 'all', transitionDuration: '0.2s',
    display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0,
  },
  // Row 2: Glassmorphic tab pills (matches Products/Services)
  tabsRow: {
    display: 'flex', gap: '6px', ...shorthands.padding('20px', '32px', '0'),
    position: 'relative', zIndex: 2,
  },
  tabBtn: {
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    ...shorthands.padding('8px', '20px'), ...shorthands.borderRadius('20px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.25)'),
    backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    transitionProperty: 'all', transitionDuration: '0.2s', backdropFilter: 'blur(8px)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.22)', color: 'white',
    ...shorthands.borderColor('rgba(255,255,255,0.45)'), boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  tabCount: {
    fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.2)',
    ...shorthands.padding('1px', '8px'), ...shorthands.borderRadius('10px'), minWidth: '22px',
  },
  tabCountActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  // Row 3: Content row with icon + title + description (matches Products/Services)
  heroContentRow: {
    display: 'flex', alignItems: 'center', gap: '32px',
    ...shorthands.padding('18px', '32px', '22px'), position: 'relative', zIndex: 2,
  },
  heroTop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' },
  heroIcon: {
    width: '36px', height: '36px', ...shorthands.borderRadius('10px'),
    backgroundColor: 'rgba(255,255,255,0.1)', ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.15)'),
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  heroTitle: { fontSize: '20px', fontWeight: '700', color: 'white', letterSpacing: '-0.3px' },
  heroDesc: { fontSize: '13px', lineHeight: '1.6', color: 'rgba(255,255,255,0.7)', maxWidth: '700px' },
  // Collapsed strip
  collapsedStrip: {
    display: 'flex', alignItems: 'center', ...shorthands.gap('16px'),
    ...shorthands.padding('0', '32px'), height: '56px', position: 'relative', zIndex: 2,
  },
  collapsedTabPill: {
    display: 'inline-flex', alignItems: 'center', ...shorthands.gap('6px'),
    fontSize: '12px', fontWeight: '600', color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)', ...shorthands.padding('4px', '14px'),
    ...shorthands.borderRadius('14px'), ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.3)'),
    cursor: 'pointer',
  },
  collapsedTabPillInactive: {
    display: 'inline-flex', alignItems: 'center', ...shorthands.gap('6px'),
    fontSize: '12px', fontWeight: '500', color: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent', ...shorthands.padding('4px', '14px'),
    ...shorthands.borderRadius('14px'), ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.15)'),
    cursor: 'pointer',
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

const ProjectCard: React.FC<{ handover: DeliveryHandover; onViewDetails?: (h: DeliveryHandover) => void }> = ({ handover, onViewDetails }) => {
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
    <div className={styles.projectCard} onClick={() => onViewDetails?.(handover)}>
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
        <Text
          style={{ fontSize: '12px', fontWeight: 600, color: DW_COLORS.primary, cursor: 'pointer' }}
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onViewDetails?.(handover); }}
        >
          View Details &rarr;
        </Text>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const DeliveryCommandCentre: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { isCollapsed, toggle } = useHeroCollapse('delivery');
  useAuth(); // Ensure authenticated context is available

  const [activeTab, setActiveTab] = useState<'projects' | 'capacity'>('projects');
  const [handovers, setHandovers] = useState<DeliveryHandover[]>([]);
  const [capacity, setCapacity] = useState<CapacitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery);
  const [statusFilter, setStatusFilter] = useState<HandoverStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const handleViewDetails = async (handover: DeliveryHandover) => {
    try {
      const request = await serviceRequestService.getRequestById(handover.ServiceRequestId);
      if (request) setSelectedRequest(request);
    } catch (err) {
      console.error('[DeliveryCommandCentre] Failed to load request:', err);
    }
  };

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
    <div className={styles.container}>
      {/* Hero Banner — 3-row structure matching Services/Products */}
      <div className={styles.heroWrapper}>
        <div className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}>
          <div className={styles.heroDecoration} />
          {isCollapsed ? (
            <div className={styles.collapsedStrip}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>Delivery Command Centre</span>
              {(['projects', 'capacity'] as const).map((tab) => (
                <button
                  key={tab}
                  className={activeTab === tab ? styles.collapsedTabPill : styles.collapsedTabPillInactive}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'projects' ? 'Projects' : 'Capacity'}
                </button>
              ))}
              <span className={styles.badgeSmall}>{heroStats.activeProjects} Active</span>
              <span className={styles.badgeSmall}>{formatCurrency(heroStats.totalValue)}</span>
            </div>
          ) : (
            <>
              {/* Row 1: Page header */}
              <div className={styles.heroHeaderRow}>
                <div>
                  <div className={styles.heroHeaderTitle}>Delivery Command Centre</div>
                  <div className={styles.heroHeaderSubtitle}>
                    Track project delivery, resource capacity, and handover progress
                  </div>
                </div>
                <button className={styles.backButtonHero} onClick={() => navigate('/dashboard')}>
                  <ArrowLeft24Regular style={{ fontSize: '16px' }} />
                  Back to Dashboard
                </button>
              </div>

              {/* Row 2: Glassmorphic tab pills */}
              <div className={styles.tabsRow}>
                {([
                  { key: 'projects' as const, label: 'Projects', count: handovers.length, icon: <BoxRegular /> },
                  { key: 'capacity' as const, label: 'Resource Capacity', count: capacity?.activeResources ?? 0, icon: <People24Regular /> },
                ]).map((tab) => (
                  <button
                    key={tab.key}
                    className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {tab.icon} {tab.label}
                    </span>
                    <span className={`${styles.tabCount} ${activeTab === tab.key ? styles.tabCountActive : ''}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Row 3: Content — icon + title + description + stats */}
              <div className={styles.heroContentRow}>
                <div style={{ flex: 1 }}>
                  <div className={styles.heroTop}>
                    <div className={styles.heroIcon}>
                      <RocketRegular style={{ color: '#7dd3fc', fontSize: '18px' }} />
                    </div>
                    <Text className={styles.heroTitle}>
                      DWx Delivery{' '}
                      <span style={{ color: '#7dd3fc' }}>Hub</span>
                    </Text>
                  </div>
                  <div className={styles.heroDesc}>
                    {activeTab === 'projects'
                      ? 'Monitor active deliveries from Won deal handover through kickoff, execution, and client sign-off. Track milestones, checklists, and team assignments.'
                      : 'View resource utilisation across all active projects, identify overallocations, and forecast capacity for upcoming weeks.'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                  {[
                    { label: 'Active', value: `${heroStats.activeProjects}`, icon: <BoxRegular style={{ fontSize: 14 }} /> },
                    { label: 'Pipeline', value: formatCurrency(heroStats.totalValue), icon: <MoneyRegular style={{ fontSize: 14 }} /> },
                    { label: 'Avg Cycle', value: heroStats.avgHandoverDays > 0 ? `${heroStats.avgHandoverDays}d` : '\u2014', icon: <CalendarRegular style={{ fontSize: 14 }} /> },
                    { label: 'Utilisation', value: `${heroStats.utilizationPercent}%`, icon: <PersonRegular style={{ fontSize: 14 }} /> },
                  ].map((stat) => (
                    <div key={stat.label} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                      padding: '8px 14px', borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                      minWidth: '80px',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                        {stat.icon} {stat.label}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

        {activeTab === 'capacity' ? (
          <ResourceCapacityDashboard />
        ) : loading ? (
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
                {filteredHandovers.map((ho) => <ProjectCard key={ho.Id} handover={ho} onViewDetails={() => handleViewDetails(ho)} />)}
              </div>
            )}
          </>
        )}

      {/* Service Request Details Modal */}
      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          onRequestUpdated={(updated) => {
            setSelectedRequest(updated);
          }}
        />
      )}
    </div>
  );
};

export default DeliveryCommandCentre;
