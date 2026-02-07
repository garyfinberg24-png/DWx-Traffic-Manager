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
import { DW_COLORS } from '../../utils/buttonStyles';
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

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px 64px',
    maxWidth: '1400px',
    margin: '0 auto',
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
}

export const SalesFunnelDashboard: React.FC<SalesFunnelDashboardProps> = ({
  onStageClick,
}) => {
  const styles = useStyles();
  const { user, isManager } = useAuth();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  // Load all requests on mount
  useEffect(() => {
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
        setRequests(serviceData);
        setProductRequests(productData);
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
  }, [user, isManager]);

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

  const handleRequestUpdated = (updatedRequest: ServiceRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
    );
  };

  const handleProductRequestUpdated = (updatedRequest: ProductRequest) => {
    setProductRequests((prev) =>
      prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
    );
  };

  const handleDealCreated = (newRequest: ServiceRequest) => {
    setRequests((prev) => [newRequest, ...prev]);
  };

  // Count actionable product requests for badge
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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text className={styles.title}>Sales Pipeline</Text>
          <Text className={styles.subtitle}>
            {isManager ? 'Organization-wide' : 'Your'} pre-sales pipeline and performance metrics
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {isManager && (
          <Button
            appearance="primary"
            icon={<AddRegular />}
            size="small"
            style={{ backgroundColor: DW_COLORS.primary }}
            onClick={() => setShowQuickCreate(true)}
          >
            Quick Create
          </Button>
        )}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <Button
              appearance="outline"
              icon={<ArrowDownloadRegular />}
              size="small"
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
        </div>
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
            Action Queue
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
          <RequestsQueue requests={requests} onRequestUpdated={handleRequestUpdated} />
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
