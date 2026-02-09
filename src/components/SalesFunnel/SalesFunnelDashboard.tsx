/**
 * DWx Traffic Manager - Sales Funnel Dashboard
 * Main dashboard with pipeline metrics, funnel visualization, and action queue
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Text,
  Spinner,
  Tab,
  TabList,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  makeStyles,
  shorthands,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  ChartMultipleRegular,
  PeopleQueueRegular,
  TargetRegular,
  BoxRegular,
  ArrowDownloadRegular,
  Warning24Regular,
  ColumnTripleRegular,
  AddRegular,
} from '@fluentui/react-icons';
import {
  downloadServiceRequestsExcel,
  downloadServiceRequestsCSV,
  downloadProductRequestsExcel,
  downloadProductRequestsCSV,
} from '../../utils/excelExport';
import { KPICardSkeleton } from '../Common/CardSkeleton';
import { useAuth } from '../../contexts/AuthContext';
import {
  ServiceRequest,
  PipelineMetrics,
  WinRateData,
  ConversionRates,
  StageBreakdown,
  FunnelStage,
} from '../../types/ServiceRequest';
import { ProductRequest } from '../../types/ProductRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { productRequestService } from '../../services/ProductRequestService';
import { pipelineService } from '../../services/PipelineService';
import { followUpService } from '../../services/FollowUpService';
import { PipelineKPIs } from './PipelineKPIs';
import { FunnelChart } from './FunnelChart';
import { ConversionRatesCard } from './ConversionRatesCard';
import { RequestsQueue } from './RequestsQueue';
import { ProductRequestsQueue } from './ProductRequestsQueue';
import KanbanBoard from './KanbanBoard';
import QuickCreateDialog from './QuickCreateDialog';
import { RequestDetails } from '../MyRequests/RequestDetails';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '0 64px 24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  heroWrapper: {
    position: 'relative',
    marginBottom: '20px',
  },
  heroBanner: {
    ...shorthands.borderRadius('0', '0', '16px', '16px'),
    ...shorthands.padding('0'),
    position: 'relative',
    ...shorthands.overflow('hidden'),
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1e6b7b 100%)',
  },
  heroExpanded: {
    maxHeight: '200px',
    transitionProperty: 'max-height',
    transitionDuration: '350ms',
    transitionTimingFunction: 'ease',
  },
  heroCollapsed: {
    maxHeight: '56px',
    transitionProperty: 'max-height',
    transitionDuration: '350ms',
    transitionTimingFunction: 'ease',
  },
  heroDecoration: {
    position: 'absolute',
    top: '-80px',
    right: '-40px',
    width: '300px',
    height: '300px',
    ...shorthands.borderRadius('50%'),
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('32px'),
    ...shorthands.padding('24px', '32px'),
  },
  heroTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    whiteSpace: 'nowrap',
    marginBottom: '4px',
  },
  heroTitleAccent: {
    color: '#5eead4',
  },
  heroIcon: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '22px',
  },
  heroSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
  },
  heroRightSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    flexShrink: 0,
  },
  urgencyPill: {
    fontSize: '11px',
    fontWeight: '600',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('10px'),
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },
  collapsedStrip: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('0', '32px'),
    height: '56px',
    position: 'relative',
    zIndex: 2,
  },
  collapsedTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
  },
  collapsedBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('10px'),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#242424',
  },
  subtitle: {
    fontSize: '14px',
    color: '#616161',
  },
  tabList: {
    marginBottom: '8px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
  },
  gridFullWidth: {
    gridColumn: '1 / -1',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #e8e8e8',
    overflow: 'hidden',
  },
  cardHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e8e8e8',
    backgroundColor: '#fafafa',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  cardContent: {
    padding: '0',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    flexDirection: 'column',
    gap: '12px',
  },
});

type DashboardTab = 'overview' | 'pipeline' | 'queue' | 'productQueue' | 'board';

interface SalesFunnelDashboardProps {
  onStageClick?: (stage: FunnelStage) => void;
  /** Called when deals are created or updated (e.g. Quick Create) so parent can refresh its own state */
  onDataChanged?: () => void;
  /** When provided, use these instead of loading independently (eliminates dual data source) */
  externalServiceRequests?: ServiceRequest[];
  /** When provided, use these instead of loading independently */
  externalProductRequests?: ProductRequest[];
}

export const SalesFunnelDashboard: React.FC<SalesFunnelDashboardProps> = ({
  onStageClick,
  onDataChanged,
  externalServiceRequests,
  externalProductRequests,
}) => {
  const styles = useStyles();
  const { isCollapsed, toggle } = useHeroCollapse('pipeline');
  const { user, isManager } = useAuth();

  // When external data is provided (e.g. from ManagerDashboard), use it directly
  // Otherwise, load independently (standalone /pipeline route)
  const hasExternalData = externalServiceRequests !== undefined;

  const [internalRequests, setInternalRequests] = useState<ServiceRequest[]>([]);
  const [internalProductRequests, setInternalProductRequests] = useState<ProductRequest[]>([]);
  // Optimistic additions: requests created via Quick Create before parent re-fetches
  const [optimisticRequests, setOptimisticRequests] = useState<ServiceRequest[]>([]);
  const [optimisticProducts, setOptimisticProducts] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(!hasExternalData);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  // Use external data when available, otherwise use internal state
  // Merge in optimistic additions (deduped by Id) for immediate visibility
  const requests = useMemo(() => {
    const base = hasExternalData ? externalServiceRequests : internalRequests;
    if (optimisticRequests.length === 0) return base;
    const existingIds = new Set(base.map(r => r.Id));
    const newOnes = optimisticRequests.filter(r => !existingIds.has(r.Id));
    return newOnes.length > 0 ? [...newOnes, ...base] : base;
  }, [hasExternalData, externalServiceRequests, internalRequests, optimisticRequests]);

  const productRequests = useMemo(() => {
    const base = hasExternalData ? (externalProductRequests ?? []) : internalProductRequests;
    if (optimisticProducts.length === 0) return base;
    const existingIds = new Set(base.map(r => r.Id));
    const newOnes = optimisticProducts.filter(r => !existingIds.has(r.Id));
    return newOnes.length > 0 ? [...newOnes, ...base] : base;
  }, [hasExternalData, externalProductRequests, internalProductRequests, optimisticProducts]);

  // Clear optimistic additions once external data includes them
  useEffect(() => {
    if (hasExternalData && externalServiceRequests.length > 0 && optimisticRequests.length > 0) {
      const externalIds = new Set(externalServiceRequests.map(r => r.Id));
      const remaining = optimisticRequests.filter(r => !externalIds.has(r.Id));
      if (remaining.length !== optimisticRequests.length) {
        setOptimisticRequests(remaining);
      }
    }
  }, [externalServiceRequests, hasExternalData, optimisticRequests]);

  useEffect(() => {
    if (hasExternalData && (externalProductRequests ?? []).length > 0 && optimisticProducts.length > 0) {
      const externalIds = new Set((externalProductRequests ?? []).map(r => r.Id));
      const remaining = optimisticProducts.filter(r => !externalIds.has(r.Id));
      if (remaining.length !== optimisticProducts.length) {
        setOptimisticProducts(remaining);
      }
    }
  }, [externalProductRequests, hasExternalData, optimisticProducts]);

  // Only load independently when NOT receiving external data (standalone mode)
  useEffect(() => {
    if (hasExternalData) return; // Skip — parent provides data

    const loadRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        // Managers see all requests, AMs see their own
        const filters = isManager ? {} : { accountManagerEmail: user?.email };
        const [serviceData, productData] = await Promise.all([
          serviceRequestService.getRequests(filters),
          productRequestService.getRequests(
            isManager ? undefined : { accountManagerEmail: user?.email }
          ),
        ]);
        setInternalRequests(serviceData);
        setInternalProductRequests(productData);
      } catch (err) {
        console.error('Error loading requests:', err);
        setError('Failed to load pipeline data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadRequests();
    }
  }, [user, isManager, hasExternalData]);

  // Calculate metrics
  const metrics: PipelineMetrics = useMemo(() => {
    return pipelineService.calculatePipelineMetrics(requests);
  }, [requests]);

  const stageBreakdown: StageBreakdown[] = useMemo(() => {
    return pipelineService.calculateStageBreakdown(requests);
  }, [requests]);

  const winRates: WinRateData = useMemo(() => {
    return pipelineService.calculateWinRates(requests);
  }, [requests]);

  const conversionRates: ConversionRates = useMemo(() => {
    return pipelineService.calculateConversionRates(requests);
  }, [requests]);

  // Period-over-period comparison (last 30 days vs previous 30 days)
  const periodComparison = useMemo(() => {
    return pipelineService.calculatePeriodComparison(requests, 30);
  }, [requests]);

  // Attention summary for stale / overdue deals
  const attentionSummary = useMemo(() => {
    return followUpService.getAttentionSummary(requests);
  }, [requests]);

  const heroStats = useMemo(() => {
    const activeRequests = requests.filter(r => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost');
    const totalPipeline = activeRequests.reduce((sum, r) => sum + (r.DealValue || 0), 0);
    const weightedPipeline = activeRequests.reduce((sum, r) => sum + (r.WeightedPipeline || 0), 0);
    return { activeCount: activeRequests.length, totalPipeline, weightedPipeline };
  }, [requests]);

  const handleRequestUpdated = (updatedRequest: ServiceRequest) => {
    if (hasExternalData) {
      // Update optimistic list if the request was optimistically added
      setOptimisticRequests((prev) =>
        prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
      );
    } else {
      setInternalRequests((prev) =>
        prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
      );
    }
    // Always notify parent so it refreshes its data (covers both modes)
    onDataChanged?.();
  };

  const handleProductRequestUpdated = (updatedRequest: ProductRequest) => {
    if (hasExternalData) {
      setOptimisticProducts((prev) =>
        prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
      );
    } else {
      setInternalProductRequests((prev) =>
        prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
      );
    }
    onDataChanged?.();
  };

  const handleDealCreated = (newRequest: ServiceRequest) => {
    if (hasExternalData) {
      // Add optimistically for immediate visibility; parent will re-fetch and include it
      setOptimisticRequests((prev) => [newRequest, ...prev]);
    } else {
      setInternalRequests((prev) => [newRequest, ...prev]);
    }
    // Notify parent (ManagerDashboard) so it can refresh its data + sidebar counts
    onDataChanged?.();
  };

  const handleProductCreated = (newRequest: ProductRequest) => {
    if (hasExternalData) {
      setOptimisticProducts((prev) => [newRequest, ...prev]);
    } else {
      setInternalProductRequests((prev) => [newRequest, ...prev]);
    }
    onDataChanged?.();
  };

  // Count actionable requests for tab badges
  const actionableServiceCount = requests.filter(
    (r) => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
  ).length;

  const actionableProductCount = productRequests.filter(
    (r) => r.Status !== 'Completed' && r.Status !== 'Cancelled'
  ).length;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerLeft}>
          <Text className={styles.title}>Sales Pipeline</Text>
          <Text className={styles.subtitle}>Loading pipeline data...</Text>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <KPICardSkeleton count={4} />
        </div>
        <div className={styles.grid}>
          <div className={styles.card} style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size="medium" />
          </div>
          <div className={styles.card} style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner size="medium" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <div className={styles.heroWrapper}>
        <div className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}>
          <div className={styles.heroDecoration} />
          {isCollapsed ? (
            <div className={styles.collapsedStrip}>
              <span className={styles.collapsedTitle}>Sales Pipeline</span>
              <span className={styles.collapsedBadge}>{heroStats.activeCount} Active</span>
              <span className={styles.collapsedBadge}>R{heroStats.totalPipeline.toLocaleString()}</span>
            </div>
          ) : (
            <div className={styles.heroContent}>
              <div>
                <div className={styles.heroTitle}>
                  <TargetRegular className={styles.heroIcon} />
                  <span>Sales <span className={styles.heroTitleAccent}>Pipeline</span></span>
                </div>
                <div className={styles.heroSubtitle}>Manage deals and track funnel progression</div>
              </div>
              <div className={styles.heroRightSection}>
                <span className={styles.collapsedBadge}>R{heroStats.totalPipeline.toLocaleString()}</span>
                <span className={styles.collapsedBadge}>R{heroStats.weightedPipeline.toLocaleString()} Weighted</span>
                <span className={styles.collapsedBadge}>{heroStats.activeCount} Active</span>
                {attentionSummary && attentionSummary.overdueCount > 0 && (
                  <span className={styles.urgencyPill} style={{ backgroundColor: 'rgba(209,52,56,0.2)', color: '#ff8a8a' }}>
                    <Warning24Regular style={{ fontSize: '14px' }} />
                    {attentionSummary.overdueCount} Overdue
                  </span>
                )}
                {attentionSummary && attentionSummary.criticalCount > 0 && (
                  <span className={styles.urgencyPill} style={{ backgroundColor: 'rgba(255,170,0,0.2)', color: '#ffcc4d' }}>
                    {attentionSummary.criticalCount} At Risk
                  </span>
                )}
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button
                      appearance="primary"
                      icon={<ArrowDownloadRegular />}
                      size="small"
                      style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                    >
                      Export
                    </Button>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem onClick={() => downloadServiceRequestsExcel(requests)}>
                        Service Requests (.xls)
                      </MenuItem>
                      <MenuItem onClick={() => downloadServiceRequestsCSV(requests)}>
                        Service Requests (.csv)
                      </MenuItem>
                      {productRequests.length > 0 && (
                        <MenuItem onClick={() => downloadProductRequestsExcel(productRequests)}>
                          Product Requests (.xls)
                        </MenuItem>
                      )}
                      {productRequests.length > 0 && (
                        <MenuItem onClick={() => downloadProductRequestsCSV(productRequests)}>
                          Product Requests (.csv)
                        </MenuItem>
                      )}
                    </MenuList>
                  </MenuPopover>
                </Menu>
                {isManager && (
                  <Button
                    appearance="primary"
                    icon={<AddRegular />}
                    onClick={() => setShowQuickCreate(true)}
                    size="small"
                    style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                  >
                    Quick Create
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

      {/* Error Message */}
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Tabs */}
      <TabList
        className={styles.tabList}
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab(data.value as DashboardTab)}
      >
        <Tab value="overview" icon={<ChartMultipleRegular />}>
          Overview
        </Tab>
        <Tab value="pipeline" icon={<TargetRegular />}>
          Pipeline Analysis
        </Tab>
        {isManager && (
          <Tab value="queue" icon={<PeopleQueueRegular />}>
            Service Queue{actionableServiceCount > 0 ? ` (${actionableServiceCount})` : ''}
          </Tab>
        )}
        {isManager && (
          <Tab value="productQueue" icon={<BoxRegular />}>
            Product Queue{actionableProductCount > 0 ? ` (${actionableProductCount})` : ''}
          </Tab>
        )}
        {isManager && (
          <Tab value="board" icon={<ColumnTripleRegular />}>
            Board
          </Tab>
        )}
      </TabList>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <PipelineKPIs metrics={metrics} winRates={winRates} periodChanges={periodComparison.changes} />

            {/* Attention Required Card */}
            {(attentionSummary.warningCount > 0 || attentionSummary.criticalCount > 0 || attentionSummary.overdueCount > 0) && (
              <div style={{
                backgroundColor: '#fff4ce',
                border: '1px solid #f7630c',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '8px',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#f7630c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Warning24Regular style={{ color: 'white', width: '24px', height: '24px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ fontSize: '14px', fontWeight: '600', color: '#242424', display: 'block' }}>
                    Attention Required
                  </Text>
                  <Text style={{ fontSize: '13px', color: '#616161' }}>
                    {attentionSummary.overdueCount > 0 && `${attentionSummary.overdueCount} overdue`}
                    {attentionSummary.overdueCount > 0 && attentionSummary.criticalCount > 0 && ' \u00b7 '}
                    {attentionSummary.criticalCount > 0 && `${attentionSummary.criticalCount} critical`}
                    {(attentionSummary.overdueCount > 0 || attentionSummary.criticalCount > 0) && attentionSummary.warningCount > 0 && ' \u00b7 '}
                    {attentionSummary.warningCount > 0 && `${attentionSummary.warningCount} warning`}
                  </Text>
                </div>
                <Text style={{ fontSize: '16px', fontWeight: '600', color: '#d13438' }}>
                  {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(attentionSummary.totalAtRiskValue)} at risk
                </Text>
              </div>
            )}

            {/* Funnel + Conversion Rates */}
            <div className={styles.grid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <Text className={styles.cardTitle}>Sales Funnel</Text>
                </div>
                <div className={styles.cardContent}>
                  <FunnelChart
                    breakdown={stageBreakdown}
                    onStageClick={onStageClick}
                  />
                </div>
              </div>

              <ConversionRatesCard rates={conversionRates} />
            </div>

            {/* Win Rates by Service */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <Text className={styles.cardTitle}>Win Rate by Service</Text>
              </div>
              <div className={styles.cardContent} style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {winRates.byService.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px',
                        minWidth: '150px',
                      }}
                    >
                      <Text style={{ fontSize: '13px', color: '#616161', display: 'block' }}>
                        {item.service}
                      </Text>
                      <Text
                        style={{
                          fontSize: '20px',
                          fontWeight: '600',
                          color: item.winRate >= 30 ? '#107c10' : '#d13438',
                          display: 'block',
                        }}
                      >
                        {item.winRate.toFixed(0)}%
                      </Text>
                      <Text style={{ fontSize: '11px', color: '#8a8886' }}>
                        {item.won} won / {item.count} total
                      </Text>
                    </div>
                  ))}
                  {winRates.byService.length === 0 && (
                    <Text style={{ color: '#616161', fontStyle: 'italic' }}>
                      No completed deals yet
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'pipeline' && (
          <>
            {/* Detailed Funnel */}
            <div className={`${styles.card} ${styles.gridFullWidth}`}>
              <div className={styles.cardHeader}>
                <Text className={styles.cardTitle}>Pipeline Funnel</Text>
              </div>
              <div className={styles.cardContent}>
                <FunnelChart
                  breakdown={stageBreakdown}
                  onStageClick={onStageClick}
                />
              </div>
            </div>

            {/* Conversion Analysis */}
            <div className={styles.grid}>
              <ConversionRatesCard rates={conversionRates} />

              {/* Win Rates by AM */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <Text className={styles.cardTitle}>Win Rate by Account Manager</Text>
                </div>
                <div className={styles.cardContent} style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {winRates.byAM.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          backgroundColor: '#f9f9f9',
                          borderRadius: '6px',
                        }}
                      >
                        <Text style={{ fontSize: '13px', fontWeight: '500' }}>{item.am}</Text>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Text style={{ fontSize: '12px', color: '#616161' }}>
                            {item.won}/{item.count}
                          </Text>
                          <Text
                            style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: item.winRate >= 30 ? '#107c10' : '#d13438',
                            }}
                          >
                            {item.winRate.toFixed(0)}%
                          </Text>
                        </div>
                      </div>
                    ))}
                    {winRates.byAM.length === 0 && (
                      <Text style={{ color: '#616161', fontStyle: 'italic' }}>
                        No completed deals yet
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'queue' && isManager && (
          <RequestsQueue requests={requests} onRequestUpdated={handleRequestUpdated} onRequestClick={setSelectedRequest} />
        )}

        {activeTab === 'productQueue' && isManager && (
          <ProductRequestsQueue
            requests={productRequests}
            onRequestUpdated={handleProductRequestUpdated}
          />
        )}

        {activeTab === 'board' && isManager && (
          <KanbanBoard requests={requests} onRequestUpdated={handleRequestUpdated} onCardClick={setSelectedRequest} />
        )}
      </div>

      {/* Quick Create Dialog */}
      <QuickCreateDialog
        open={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
        onDealCreated={handleDealCreated}
        onProductCreated={handleProductCreated}
      />

      {/* Request Details Modal (from Board card click) */}
      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          isOpen={true}
          onClose={() => setSelectedRequest(null)}
          onRequestUpdated={handleRequestUpdated}
        />
      )}
    </div>
  );
};
