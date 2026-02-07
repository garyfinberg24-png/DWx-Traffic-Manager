/**
 * DWx Traffic Manager - My Requests Component
 * List view of user's service requests with stage filtering and search
 */

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Spinner,
  SearchBox,
  Dropdown,
  Option,
  Button,
  Badge,
  makeStyles,
  shorthands,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from '@fluentui/react-components';
import {
  SearchRegular,
  AddRegular,
  FilterRegular,
  GridRegular,
  TextBulletListLtr24Regular,
  Apps24Regular,
  ArrowDownloadRegular,
  SaveRegular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';
import { slaService } from '../../services/SLAService';
import { downloadServiceRequestsExcel, downloadProductRequestsExcel } from '../../utils/excelExport';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  ServiceRequest,
  FunnelStage,
  InterestLevel,
  STAGE_METADATA,
} from '../../types/ServiceRequest';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { productRequestService } from '../../services/ProductRequestService';
import { ProductRequest } from '../../types/ProductRequest';
import { RequestCard } from './RequestCard';
import { RequestDetails } from './RequestDetails';
import { ProductRequestDetails } from './ProductRequestDetails';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { RequestCardSkeleton } from '../Common/CardSkeleton';
import { Pagination, usePagination } from '../Common/Pagination';
import { AdvancedFilterPanel, useAdvancedFilters, FilterConfig } from '../Common/AdvancedFilterPanel';
import { DraftsTabContent } from './DraftsTabContent';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    ...shorthands.padding('0', '64px', '24px'),
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
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 100%)',
  },
  heroExpanded: {
    maxHeight: '300px',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap('32px'),
    ...shorthands.padding('32px', '32px'),
  },
  heroLeft: {
    flex: '1',
    minWidth: '0',
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '8px',
  },
  heroTitleAccent: {
    color: '#7dd3fc',
  },
  heroSubtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: '16px',
  },
  heroStats: {
    display: 'flex',
    ...shorthands.gap('24px'),
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('10px', '16px'),
    ...shorthands.borderRadius('10px'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: '80px',
  },
  heroStatValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
  },
  heroStatLabel: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px',
  },
  heroRight: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
    flexShrink: 0,
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
  newRequestBtn: {
    backgroundColor: DW_COLORS.teal,
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  stageFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  stageChip: {
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid #d0d0d0',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  stageChipActive: {
    backgroundColor: DW_COLORS.teal,
    color: 'white',
    ...shorthands.borderColor('#1e6b7b'),
  },
  stageCount: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  toolbar: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    minWidth: '280px',
    flex: '1 1 280px',
    maxWidth: '400px',
  },
  dropdownFilter: {
    minWidth: '150px',
  },
  resultsInfo: {
    marginLeft: 'auto',
    fontSize: '13px',
    color: '#616161',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '16px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    borderRadius: '12px',
    border: '1px dashed #d0d0d0',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    color: '#8a8886',
    marginBottom: '12px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#616161',
    maxWidth: '400px',
    marginBottom: '16px',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  statCard: {
    padding: '16px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    border: '1px solid #e1e1e1',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '140px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#616161',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#242424',
  },
  statSubtext: {
    fontSize: '11px',
    color: '#107c10',
  },
  tabList: {
    marginBottom: '8px',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '16px',
  },
  productCard: {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    border: '1px solid #e1e1e1',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      ...shorthands.borderColor('#1e6b7b'),
    },
  },
  productCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  productCardMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  productCardDetail: {
    fontSize: '13px',
    color: '#616161',
  },
  viewToggleGroup: {
    display: 'flex',
    gap: '2px',
    backgroundColor: '#f0f0f0',
    borderRadius: '6px',
    padding: '2px',
  },
  viewToggleBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: '#616161',
    transition: 'all 0.15s ease',
  },
  viewToggleBtnActive: {
    backgroundColor: 'white',
    color: DW_COLORS.teal,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  listTable: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
    border: '1px solid #e1e1e1',
  },
  listTh: {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#616161',
    backgroundColor: '#fafafa',
    borderBottom: '1px solid #e1e1e1',
    whiteSpace: 'nowrap',
  },
  listTd: {
    padding: '10px 14px',
    fontSize: '13px',
    color: '#242424',
    borderBottom: '1px solid #f0f0f0',
  },
  listRow: {
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  stageBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
  },
  interestBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500',
  },
});

const STAGE_OPTIONS: (FunnelStage | 'All')[] = [
  'All',
  'Lead',
  'Qualified',
  'Discovery',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
];

const INTEREST_OPTIONS: (InterestLevel | 'All')[] = ['All', 'Hot', 'Warm', 'Cold'];

const SORT_OPTIONS = [
  { value: 'created-desc', label: 'Newest First' },
  { value: 'created-asc', label: 'Oldest First' },
  { value: 'value-desc', label: 'Highest Value' },
  { value: 'value-asc', label: 'Lowest Value' },
  { value: 'probability-desc', label: 'Highest Probability' },
];

// Advanced filter configuration
const ADVANCED_FILTER_CONFIG: FilterConfig[] = [
  {
    key: 'serviceName',
    label: 'Service',
    type: 'text',
    placeholder: 'Filter by service name...',
  },
  {
    key: 'minValue',
    label: 'Min Deal Value',
    type: 'number',
    placeholder: '0',
  },
  {
    key: 'maxValue',
    label: 'Max Deal Value',
    type: 'number',
    placeholder: '0',
  },
  {
    key: 'dateRange',
    label: 'Created Date',
    type: 'daterange',
  },
  {
    key: 'hasSpecialist',
    label: 'Has Assigned Specialist',
    type: 'checkbox',
  },
];

type AdvancedFilterValues = Record<string, string | number | boolean | string[] | [string | null, string | null] | null>;

interface MyRequestsProps {
  onNewRequest?: () => void;
}

export const MyRequests: React.FC<MyRequestsProps> = ({ onNewRequest }) => {
  const styles = useStyles();
  const { isCollapsed, toggle } = useHeroCollapse('my-requests');
  const navigate = useNavigate();
  const { user, isManager } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'service' | 'product' | 'drafts'>('service');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [draftCount, setDraftCount] = useState(0);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [productRequests, setProductRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDeferredValue(searchText);
  const [selectedStage, setSelectedStage] = useState<FunnelStage | 'All'>('All');
  const [selectedInterest, setSelectedInterest] = useState<InterestLevel | 'All'>('All');
  const [sortBy, setSortBy] = useState('created-desc');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedProductRequest, setSelectedProductRequest] = useState<ProductRequest | null>(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    request: ServiceRequest;
    stage: FunnelStage;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Advanced filters
  const {
    filters: advancedFilters,
    setFilter: setAdvancedFilter,
    clearFilters: clearAdvancedFilters,
  } = useAdvancedFilters<AdvancedFilterValues>({
    serviceName: null,
    minValue: null,
    maxValue: null,
    dateRange: [null, null],
    hasSpecialist: false,
  });

  // Load requests on mount
  useEffect(() => {
    const loadRequests = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);
        const data = await serviceRequestService.getRequests({
          accountManagerEmail: user.email,
        });
        setRequests(data);
      } catch (err) {
        console.error('Error loading requests:', err);
        setError('Failed to load service requests');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user]);

  // Load product requests
  useEffect(() => {
    const loadProductRequests = async () => {
      if (!user) return;
      try {
        setProductLoading(true);
        const data = await productRequestService.getRequestsByUser(user.email);
        setProductRequests(data);
      } catch (err) {
        console.error('Error loading product requests:', err);
      } finally {
        setProductLoading(false);
      }
    };

    loadProductRequests();
  }, [user]);

  // Calculate stage counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = { All: requests.length };
    STAGE_OPTIONS.forEach((stage) => {
      if (stage !== 'All') {
        counts[stage] = requests.filter((r) => r.FunnelStage === stage).length;
      }
    });
    return counts;
  }, [requests]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const openRequests = requests.filter(
      (r) => r.FunnelStage !== 'Won' && r.FunnelStage !== 'Lost'
    );
    const totalPipelineValue = openRequests.reduce((sum, r) => sum + (r.DealValue || 0), 0);
    const weightedValue = openRequests.reduce(
      (sum, r) => sum + (r.DealValue || 0) * ((r.DealProbability || 50) / 100),
      0
    );
    const hotLeads = openRequests.filter((r) => r.InterestLevel === 'Hot').length;

    return {
      open: openRequests.length,
      totalValue: totalPipelineValue,
      weightedValue,
      hotLeads,
    };
  }, [requests]);

  const heroStats = useMemo(() => {
    const activeStages = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation'];
    const activeRequests = requests.filter(r => activeStages.includes(r.FunnelStage));
    const pipelineValue = activeRequests.reduce((sum, r) => sum + (r.DealValue || 0), 0);
    const wonCount = requests.filter(r => r.FunnelStage === 'Won').length;
    const lostCount = requests.filter(r => r.FunnelStage === 'Lost').length;
    const winRate = wonCount + lostCount > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;
    return { activeCount: activeRequests.length, pipelineValue, winRate };
  }, [requests]);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    // Stage filter
    if (selectedStage !== 'All') {
      filtered = filtered.filter((r) => r.FunnelStage === selectedStage);
    }

    // Interest filter
    if (selectedInterest !== 'All') {
      filtered = filtered.filter((r) => r.InterestLevel === selectedInterest);
    }

    // Search filter (uses deferred value for debouncing)
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ClientName.toLowerCase().includes(searchLower) ||
          r.ServiceName.toLowerCase().includes(searchLower) ||
          r.ContactName.toLowerCase().includes(searchLower) ||
          r.ContactEmail.toLowerCase().includes(searchLower)
      );
    }

    // Advanced filters
    const serviceName = advancedFilters.serviceName as string | null;
    const minValue = advancedFilters.minValue as number | null;
    const maxValue = advancedFilters.maxValue as number | null;
    const dateRange = (advancedFilters.dateRange as [string | null, string | null]) || [null, null];
    const hasSpecialist = advancedFilters.hasSpecialist as boolean;

    if (serviceName) {
      const serviceSearch = serviceName.toLowerCase();
      filtered = filtered.filter((r) => r.ServiceName.toLowerCase().includes(serviceSearch));
    }

    if (minValue !== null && minValue > 0) {
      filtered = filtered.filter((r) => (r.DealValue || 0) >= minValue);
    }

    if (maxValue !== null && maxValue > 0) {
      filtered = filtered.filter((r) => (r.DealValue || 0) <= maxValue);
    }

    if (dateRange[0]) {
      const fromDate = new Date(dateRange[0]);
      filtered = filtered.filter((r) => new Date(r.Created) >= fromDate);
    }

    if (dateRange[1]) {
      const toDate = new Date(dateRange[1]);
      toDate.setHours(23, 59, 59, 999); // Include the entire day
      filtered = filtered.filter((r) => new Date(r.Created) <= toDate);
    }

    if (hasSpecialist) {
      filtered = filtered.filter((r) => r.AssignedSpecialistEmail);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created-asc':
          return new Date(a.Created).getTime() - new Date(b.Created).getTime();
        case 'value-desc':
          return (b.DealValue || 0) - (a.DealValue || 0);
        case 'value-asc':
          return (a.DealValue || 0) - (b.DealValue || 0);
        case 'probability-desc':
          return (b.DealProbability || 0) - (a.DealProbability || 0);
        case 'created-desc':
        default:
          return new Date(b.Created).getTime() - new Date(a.Created).getTime();
      }
    });

    return filtered;
  }, [requests, selectedStage, selectedInterest, debouncedSearch, sortBy, advancedFilters]);

  // Pagination for service requests
  const {
    currentPage: serviceCurrentPage,
    pageSize: servicePageSize,
    paginatedItems: paginatedServiceRequests,
    totalItems: serviceTotalItems,
    setCurrentPage: setServiceCurrentPage,
    setPageSize: setServicePageSize,
  } = usePagination(filteredRequests, 20);

  // Pagination for product requests
  const {
    currentPage: productCurrentPage,
    pageSize: productPageSize,
    paginatedItems: paginatedProductRequests,
    totalItems: productTotalItems,
    setCurrentPage: setProductCurrentPage,
    setPageSize: setProductPageSize,
  } = usePagination(productRequests, 20);

  const handleRequestClick = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedRequest(null);
  };

  const handleRequestUpdated = (updatedRequest: ServiceRequest) => {
    setRequests((prev) =>
      prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
    );
    setSelectedRequest(updatedRequest);
  };

  const handleQuickAction = (request: ServiceRequest, newStage: FunnelStage) => {
    if (!user) return;
    // Require confirmation for terminal stages
    if (newStage === 'Won' || newStage === 'Lost') {
      setConfirmAction({ request, stage: newStage });
      return;
    }
    executeStageTransition(request, newStage);
  };

  const executeStageTransition = async (request: ServiceRequest, newStage: FunnelStage) => {
    if (!user) return;
    try {
      const result = await serviceRequestService.updateStage(
        request.Id,
        newStage,
        user.email,
        user.displayName
      );
      if (result.success && result.request) {
        showToast(`Request moved to ${newStage}`, 'success');
        setRequests((prev) =>
          prev.map((r) => (r.Id === result.request!.Id ? result.request! : r))
        );
      } else {
        throw new Error(result.error || 'Failed to update stage');
      }
    } catch (err) {
      console.error('Error in quick action:', err);
      showToast('Failed to update stage', 'error');
    }
  };

  const handleConfirmStageAction = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    await executeStageTransition(confirmAction.request, confirmAction.stage);
    setConfirmLoading(false);
    setConfirmAction(null);
  };

  const handleProductRequestClick = (pr: ProductRequest) => {
    setSelectedProductRequest(pr);
    setIsProductDetailsOpen(true);
  };

  const handleCloseProductDetails = () => {
    setIsProductDetailsOpen(false);
    setSelectedProductRequest(null);
  };

  const handleProductRequestUpdated = (updatedRequest: ProductRequest) => {
    setProductRequests((prev) =>
      prev.map((r) => (r.Id === updatedRequest.Id ? updatedRequest : r))
    );
    setSelectedProductRequest(updatedRequest);
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.headerLeft}>
          <Text className={styles.title}>My Requests</Text>
        </div>
        <div className={styles.grid}>
          <RequestCardSkeleton count={4} />
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
              <span className={styles.collapsedTitle}>My Requests</span>
              <span className={styles.collapsedBadge}>{heroStats.activeCount} Active</span>
              <span className={styles.collapsedBadge}>R{heroStats.pipelineValue.toLocaleString()}</span>
              <span className={styles.collapsedBadge}>{heroStats.winRate}% Win Rate</span>
            </div>
          ) : (
            <div className={styles.heroContent}>
              <div className={styles.heroLeft}>
                <div className={styles.heroTitle}>
                  My <span className={styles.heroTitleAccent}>Requests</span>
                </div>
                <div className={styles.heroSubtitle}>
                  Track your service and product requests through the sales pipeline
                </div>
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>{heroStats.activeCount}</span>
                    <span className={styles.heroStatLabel}>Active Deals</span>
                  </div>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>R{heroStats.pipelineValue.toLocaleString()}</span>
                    <span className={styles.heroStatLabel}>Pipeline</span>
                  </div>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>{heroStats.winRate}%</span>
                    <span className={styles.heroStatLabel}>Win Rate</span>
                  </div>
                </div>
              </div>
              <div className={styles.heroRight}>
                <Button
                  appearance="primary"
                  icon={<AddRegular />}
                  onClick={() => navigate('/request')}
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}
                >
                  New Request
                </Button>
              </div>
            </div>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Text className={styles.title}>My Service Requests</Text>
          <Text className={styles.subtitle}>
            Manage and track your pre-sales service requests
          </Text>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button
            appearance="outline"
            icon={<ArrowDownloadRegular />}
            size="small"
            onClick={() =>
              activeTab === 'service'
                ? downloadServiceRequestsExcel(filteredRequests)
                : downloadProductRequestsExcel(productRequests)
            }
            disabled={activeTab === 'service' ? filteredRequests.length === 0 : productRequests.length === 0}
          >
            Export
          </Button>
          {onNewRequest && (
            <Button
              className={styles.newRequestBtn}
              appearance="primary"
              icon={<AddRegular />}
              onClick={onNewRequest}
            >
              New Request
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <TabList
        className={styles.tabList}
        selectedValue={activeTab}
        onTabSelect={(_: SelectTabEvent, data: SelectTabData) =>
          setActiveTab(data.value as 'service' | 'product' | 'drafts')
        }
      >
        <Tab value="service">
          Service Requests ({requests.length})
        </Tab>
        <Tab value="product" icon={<Apps24Regular />}>
          Product Requests ({productRequests.length})
        </Tab>
        <Tab value="drafts" icon={<SaveRegular />}>
          My Drafts{draftCount > 0 ? ` (${draftCount})` : ''}
        </Tab>
      </TabList>

      {/* Error Message */}
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Drafts Tab */}
      {activeTab === 'drafts' && (
        <DraftsTabContent onDraftCountChange={setDraftCount} />
      )}

      {/* Product Requests Tab */}
      {activeTab === 'product' && (
        <>
          {productLoading ? (
            <div className={styles.loadingContainer}>
              <Spinner size="large" />
              <Text>Loading product requests...</Text>
            </div>
          ) : productRequests.length > 0 ? (
            <>
              <div className={styles.productGrid}>
                {paginatedProductRequests.map((pr) => (
                  <div key={pr.Id} className={styles.productCard} onClick={() => handleProductRequestClick(pr)}>
                    <div className={styles.productCardHeader}>
                      <Text className={styles.productCardTitle}>{pr.ProductName}</Text>
                      <Badge
                        appearance="filled"
                        color={
                          pr.Status === 'Confirmed' ? 'success' :
                          pr.Status === 'Completed' ? 'success' :
                          pr.Status === 'Cancelled' ? 'danger' :
                          pr.Status === 'Awaiting Approval' ? 'warning' :
                          'informative'
                        }
                      >
                        {pr.Status}
                      </Badge>
                    </div>
                    <div className={styles.productCardMeta}>
                      <Badge appearance="outline" size="small">{pr.RequestType}</Badge>
                      <Badge appearance="outline" size="small">{pr.ProductType}</Badge>
                      {pr.IsPremiumClient && (
                        <Badge appearance="outline" size="small" color="warning">Premium</Badge>
                      )}
                    </div>
                    <Text className={styles.productCardDetail}>
                      Client: {pr.ClientName} &middot; Contact: {pr.ContactName}
                    </Text>
                    {pr.AssignedSpecialistName && (
                      <Text className={styles.productCardDetail}>
                        Specialist: {pr.AssignedSpecialistName}
                      </Text>
                    )}
                    {pr.ConfirmedDateTime ? (
                      <Text className={styles.productCardDetail} style={{ color: '#107c10' }}>
                        Confirmed: {new Date(pr.ConfirmedDateTime).toLocaleDateString('en-ZA', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    ) : pr.ProposedSlot1 ? (
                      <Text className={styles.productCardDetail}>
                        Proposed: {new Date(pr.ProposedSlot1).toLocaleDateString('en-ZA', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    ) : null}
                    <Text className={styles.productCardDetail} style={{ fontSize: '11px', color: '#8a8886' }}>
                      Created: {new Date(pr.Created).toLocaleDateString('en-ZA')}
                    </Text>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={productCurrentPage}
                totalItems={productTotalItems}
                pageSize={productPageSize}
                onPageChange={setProductCurrentPage}
                onPageSizeChange={setProductPageSize}
              />
            </>
          ) : (
            <div className={styles.emptyState}>
              <Apps24Regular className={styles.emptyIcon} />
              <Text className={styles.emptyTitle}>No product requests yet</Text>
              <Text className={styles.emptyText}>
                Browse the product catalog to request demos or trial deployments
              </Text>
            </div>
          )}
        </>
      )}

      {/* Service Requests Tab */}
      {activeTab === 'service' && <>
      {/* Summary Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Text className={styles.statLabel}>Open Requests</Text>
          <Text className={styles.statValue}>{stats.open}</Text>
        </div>
        <div className={styles.statCard}>
          <Text className={styles.statLabel}>Pipeline Value</Text>
          <Text className={styles.statValue}>{formatCurrency(stats.totalValue)}</Text>
          <Text className={styles.statSubtext}>
            Weighted: {formatCurrency(stats.weightedValue)}
          </Text>
        </div>
        <div className={styles.statCard}>
          <Text className={styles.statLabel}>Hot Leads</Text>
          <Text className={styles.statValue} style={{ color: '#d13438' }}>
            {stats.hotLeads}
          </Text>
        </div>
      </div>

      {/* Stage Filters */}
      <div className={styles.filterSection}>
        <div className={styles.stageFilters} role="group" aria-label="Filter by stage">
          {STAGE_OPTIONS.map((stage) => (
            <span
              key={stage}
              className={`${styles.stageChip} ${selectedStage === stage ? styles.stageChipActive : ''}`}
              onClick={() => setSelectedStage(stage)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedStage(stage);
                }
              }}
              style={
                stage !== 'All' && selectedStage !== stage
                  ? { borderColor: STAGE_METADATA[stage as FunnelStage]?.color }
                  : {}
              }
              role="button"
              tabIndex={0}
              aria-pressed={selectedStage === stage}
              aria-label={`${stage}: ${stageCounts[stage] || 0} requests`}
            >
              {stage}
              <span className={styles.stageCount} aria-hidden="true">{stageCounts[stage] || 0}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search by client, service, or contact..."
          value={searchText}
          onChange={(_, data) => setSearchText(data.value)}
          contentBefore={<SearchRegular />}
        />

        <Dropdown
          className={styles.dropdownFilter}
          placeholder="Interest Level"
          selectedOptions={selectedInterest !== 'All' ? [selectedInterest] : []}
          onOptionSelect={(_, data) =>
            setSelectedInterest((data.optionValue as InterestLevel | 'All') || 'All')
          }
        >
          {INTEREST_OPTIONS.map((interest) => (
            <Option key={interest} value={interest} text={interest === 'All' ? 'All Interest Levels' : interest}>
              {interest === 'All' ? 'All Interest Levels' : interest}
            </Option>
          ))}
        </Dropdown>

        <Dropdown
          className={styles.dropdownFilter}
          placeholder="Sort by"
          selectedOptions={[sortBy]}
          onOptionSelect={(_, data) => setSortBy(data.optionValue as string)}
        >
          {SORT_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value} text={option.label}>
              {option.label}
            </Option>
          ))}
        </Dropdown>

        <span className={styles.resultsInfo}>
          <div className={styles.viewToggleGroup}>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
            >
              <GridRegular style={{ width: '16px', height: '16px' }} />
            </button>
            <button
              className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <TextBulletListLtr24Regular style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
          {filteredRequests.length} {filteredRequests.length === 1 ? 'request' : 'requests'}
        </span>
      </div>

      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        filters={ADVANCED_FILTER_CONFIG}
        values={advancedFilters}
        onChange={(key, value) => setAdvancedFilter(key as keyof AdvancedFilterValues, value)}
        onClear={clearAdvancedFilters}
      />

      {/* Request Grid / List */}
      {filteredRequests.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className={styles.grid}>
              {paginatedServiceRequests.map((request) => (
                <RequestCard key={request.Id} request={request} onClick={handleRequestClick} onQuickAction={handleQuickAction} />
              ))}
            </div>
          ) : (
            <table className={styles.listTable}>
              <thead>
                <tr>
                  <th className={styles.listTh}>Client</th>
                  <th className={styles.listTh}>Service</th>
                  <th className={styles.listTh}>Stage</th>
                  <th className={styles.listTh}>Interest</th>
                  <th className={styles.listTh}>Account Manager</th>
                  <th className={styles.listTh}>Specialist</th>
                  <th className={styles.listTh} style={{ textAlign: 'right' }}>Deal Value</th>
                  <th className={styles.listTh} style={{ textAlign: 'right' }}>Probability</th>
                  <th className={styles.listTh}>Expected Close</th>
                  <th className={styles.listTh}>Created</th>
                </tr>
              </thead>
              <tbody>
                {paginatedServiceRequests.map((request) => (
                  <tr
                    key={request.Id}
                    className={styles.listRow}
                    onClick={() => handleRequestClick(request)}
                  >
                    <td className={styles.listTd} style={{ fontWeight: '600' }}>{request.ClientName}</td>
                    <td className={styles.listTd}>{request.ServiceName}</td>
                    <td className={styles.listTd}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          className={styles.stageBadge}
                          style={{ backgroundColor: STAGE_METADATA[request.FunnelStage]?.color || '#616161' }}
                        >
                          {request.FunnelStage}
                        </span>
                        {request.FunnelStage !== 'Won' && request.FunnelStage !== 'Lost' && (() => {
                          const slaStatus = slaService.getSLAStatus(request);
                          const slaColor = slaStatus === 'breached' ? '#EF4444' : slaStatus === 'at-risk' ? '#F59E0B' : '#10B981';
                          return (
                            <span
                              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: slaColor, display: 'inline-block' }}
                              title={`SLA: ${slaStatus === 'on-track' ? 'On Track' : slaStatus === 'at-risk' ? 'At Risk' : 'Breached'} (${slaService.getTimeInCurrentStage(request)}d)`}
                            />
                          );
                        })()}
                      </span>
                    </td>
                    <td className={styles.listTd}>
                      <span
                        className={styles.interestBadge}
                        style={{
                          backgroundColor: request.InterestLevel === 'Hot' ? '#fde7e9' : request.InterestLevel === 'Warm' ? '#fff4ce' : '#e8f5e9',
                          color: request.InterestLevel === 'Hot' ? '#d13438' : request.InterestLevel === 'Warm' ? '#8a6914' : '#107c10',
                        }}
                      >
                        {request.InterestLevel}
                      </span>
                    </td>
                    <td className={styles.listTd}>
                      <div style={{ lineHeight: '1.3' }}>
                        <div style={{ fontWeight: 500 }}>{request.AccountManagerName}</div>
                        <div style={{ fontSize: '11px', color: '#616161' }}>{request.AccountManagerEmail}</div>
                      </div>
                    </td>
                    <td className={styles.listTd} style={{ color: request.AssignedSpecialistName ? '#242424' : '#a0a0a0' }}>
                      {request.AssignedSpecialistName ? (
                        <div style={{ lineHeight: '1.3' }}>
                          <div style={{ fontWeight: 500 }}>{request.AssignedSpecialistName}</div>
                          <div style={{ fontSize: '11px', color: '#616161' }}>{request.AssignedSpecialistEmail || ''}</div>
                        </div>
                      ) : 'Unassigned'}
                    </td>
                    <td className={styles.listTd} style={{ textAlign: 'right', fontWeight: '500' }}>
                      {request.DealValue ? formatCurrency(request.DealValue) : '—'}
                    </td>
                    <td className={styles.listTd} style={{ textAlign: 'right' }}>
                      {request.DealProbability != null ? `${request.DealProbability}%` : '—'}
                    </td>
                    <td className={styles.listTd}>
                      {request.ExpectedCloseDate
                        ? new Date(request.ExpectedCloseDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'Not set'}
                    </td>
                    <td className={styles.listTd} style={{ color: '#616161', fontSize: '12px' }}>
                      {new Date(request.Created).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <Pagination
            currentPage={serviceCurrentPage}
            totalItems={serviceTotalItems}
            pageSize={servicePageSize}
            onPageChange={setServiceCurrentPage}
            onPageSizeChange={setServicePageSize}
          />
        </>
      ) : (
        <div className={styles.emptyState}>
          <FilterRegular className={styles.emptyIcon} />
          <Text className={styles.emptyTitle}>
            {requests.length === 0 ? 'No service requests yet' : 'No matching requests'}
          </Text>
          <Text className={styles.emptyText}>
            {requests.length === 0
              ? 'Create your first service request to start tracking opportunities'
              : 'Try adjusting your filters or search criteria'}
          </Text>
          {requests.length === 0 && onNewRequest && (
            <Button
              className={styles.newRequestBtn}
              appearance="primary"
              icon={<AddRegular />}
              onClick={onNewRequest}
            >
              Create First Request
            </Button>
          )}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetails
          request={selectedRequest}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          onRequestUpdated={handleRequestUpdated}
        />
      )}
      </>}

      {/* Product Request Details Modal */}
      {selectedProductRequest && (
        <ProductRequestDetails
          request={selectedProductRequest}
          isOpen={isProductDetailsOpen}
          onClose={handleCloseProductDetails}
          onRequestUpdated={handleProductRequestUpdated}
          isManager={isManager}
        />
      )}

      {/* Stage Transition Confirmation */}
      <ConfirmDialog
        open={!!confirmAction}
        title={confirmAction?.stage === 'Won' ? 'Mark as Won' : 'Mark as Lost'}
        message={
          confirmAction?.stage === 'Won'
            ? `Are you sure you want to mark "${confirmAction.request.ClientName} — ${confirmAction.request.ServiceName}" as Won? This will update the client lifetime value and close the deal.`
            : `Are you sure you want to mark "${confirmAction?.request.ClientName} — ${confirmAction?.request.ServiceName}" as Lost? This will cancel any associated calendar events and close the deal.`
        }
        confirmLabel={confirmAction?.stage === 'Won' ? 'Mark as Won' : 'Mark as Lost'}
        onConfirm={handleConfirmStageAction}
        onCancel={() => setConfirmAction(null)}
        isLoading={confirmLoading}
      />
    </div>
  );
};
