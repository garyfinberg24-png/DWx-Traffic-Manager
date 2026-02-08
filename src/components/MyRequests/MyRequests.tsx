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
  DocumentMultiple24Regular,
  DocumentBulletListRegular,
  MoneyRegular,
  FlashRegular,
  ArrowTrendingRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  PersonRegular,
  BoxRegular,
  CalendarRegular,
  StarRegular,
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
import { ProductRequest, ProductRequestStatus } from '../../types/ProductRequest';
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
    color: '#7dd3fc',
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
    gap: '10px',
  },
  stageFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    backgroundColor: '#f8f9fa',
    ...shorthands.padding('6px'),
    borderRadius: '10px',
  },
  stageChip: {
    ...shorthands.padding('6px', '0'),
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    border: '1px solid #e5e7eb',
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: '#4b5563',
    minWidth: '120px',
    ':hover': {
      backgroundColor: 'rgba(0,0,0,0.03)',
    },
  },
  stageChipActive: {
    backgroundColor: 'white',
    color: '#111827',
    fontWeight: '600',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid #d1d5db',
  },
  stageDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  stageCount: {
    fontSize: '11px',
    ...shorthands.padding('1px', '6px'),
    borderRadius: '10px',
    backgroundColor: 'rgba(0,0,0,0.06)',
    fontWeight: '600',
    color: '#6b7280',
  },
  stageCountActive: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
  },
  toolbar: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    minWidth: '260px',
    flex: '1 1 260px',
    maxWidth: '380px',
  },
  dropdownFilter: {
    minWidth: '150px',
  },
  resultsInfo: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
    ...shorthands.padding('48px', '24px'),
    textAlign: 'center',
    backgroundColor: '#fafbfc',
    borderRadius: '12px',
    border: '1px dashed #d1d5db',
  },
  emptyIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    backgroundColor: '#f0f9ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyIcon: {
    width: '32px',
    height: '32px',
    color: '#0284c7',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '6px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6b7280',
    maxWidth: '360px',
    lineHeight: '1.5',
    marginBottom: '16px',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: '1 1 0',
    minWidth: '180px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #e8eaed',
    borderLeft: '4px solid transparent',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    ...shorthands.padding('14px', '16px'),
    transition: 'box-shadow 0.2s ease',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  },
  statIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    minWidth: 0,
  },
  statLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
    lineHeight: '1.1',
  },
  statSubtext: {
    fontSize: '11px',
    color: '#107c10',
    fontWeight: '500',
  },
  tabList: {
    marginBottom: '4px',
    borderBottom: '1px solid #e5e7eb',
    ...shorthands.padding('0', '4px'),
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '16px',
  },
  productCard: {
    ...shorthands.padding('16px', '20px'),
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
    borderLeft: '4px solid transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #d1d5db',
      borderLeft: '4px solid transparent',
    },
  },
  productCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  productCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  productCardTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111827',
  },
  productCardSubtitle: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '600',
  },
  productCardStatusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('3px', '10px'),
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    flexShrink: 0,
    letterSpacing: '0.1px',
  },
  productCardMeta: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    flex: 1,
  },
  productMetaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#6b7280',
    ...shorthands.padding('2px', '8px'),
    borderRadius: '6px',
    backgroundColor: '#f3f4f6',
  },
  productMetaPillPremium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontWeight: '600',
  },
  productCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: '#9ca3af',
    paddingTop: '4px',
    borderTop: '1px solid #f3f4f6',
  },
  viewToggleGroup: {
    display: 'flex',
    gap: '1px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    ...shorthands.padding('3px'),
  },
  viewToggleBtn: {
    ...shorthands.border('none'),
    backgroundColor: 'transparent',
    ...shorthands.padding('5px', '10px'),
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    color: '#9ca3af',
    transition: 'all 0.15s ease',
  },
  viewToggleBtnActive: {
    backgroundColor: 'white',
    color: DW_COLORS.teal,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  listTable: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    ...shorthands.overflow('hidden'),
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
  },
  listTh: {
    ...shorthands.padding('10px', '14px'),
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
  },
  listTd: {
    ...shorthands.padding('10px', '14px'),
    fontSize: '13px',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
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

const PRODUCT_STATUS_OPTIONS: (ProductRequestStatus | 'All')[] = [
  'All',
  'Pending Review',
  'Awaiting Approval',
  'Confirmed',
  'Completed',
  'Cancelled',
];

const PRODUCT_STATUS_METADATA: Record<ProductRequestStatus, { color: string }> = {
  'Pending Review': { color: '#6b7280' },
  'Awaiting Approval': { color: '#f59e0b' },
  'Confirmed': { color: '#10b981' },
  'Completed': { color: '#3b82f6' },
  'Cancelled': { color: '#ef4444' },
};

// Status colors for product cards (accent border + badge background/text)
const PRODUCT_STATUS_COLORS: Record<ProductRequestStatus, { bg: string; text: string; accent: string }> = {
  'Pending Review': { bg: '#f3f4f6', text: '#4B5563', accent: '#9ca3af' },
  'Awaiting Approval': { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
  'Confirmed': { bg: '#d1fae5', text: '#065f46', accent: '#10b981' },
  'Completed': { bg: '#dbeafe', text: '#1e40af', accent: '#3b82f6' },
  'Cancelled': { bg: '#fee2e2', text: '#991b1b', accent: '#ef4444' },
};

const PRODUCT_TYPE_OPTIONS = ['All', 'Demo', 'Trial Deployment'] as const;

const PRODUCT_SORT_OPTIONS = [
  { value: 'created-desc', label: 'Newest First' },
  { value: 'created-asc', label: 'Oldest First' },
  { value: 'value-desc', label: 'Highest Value' },
  { value: 'value-asc', label: 'Lowest Value' },
  { value: 'product-asc', label: 'Product Name A-Z' },
];

const PRODUCT_ADVANCED_FILTER_CONFIG: FilterConfig[] = [
  {
    key: 'productName',
    label: 'Product Name',
    type: 'text',
    placeholder: 'Filter by product name...',
  },
  {
    key: 'clientName',
    label: 'Client Name',
    type: 'text',
    placeholder: 'Filter by client name...',
  },
  {
    key: 'minValue',
    label: 'Min Est. Value',
    type: 'number',
    placeholder: '0',
  },
  {
    key: 'maxValue',
    label: 'Max Est. Value',
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

export const MyRequests: React.FC = () => {
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

  // Product request filter state
  const [selectedProductStatus, setSelectedProductStatus] = useState<ProductRequestStatus | 'All'>('All');
  const [productSearchText, setProductSearchText] = useState('');
  const debouncedProductSearch = useDeferredValue(productSearchText);
  const [selectedProductType, setSelectedProductType] = useState<string>('All');
  const [productSortBy, setProductSortBy] = useState('created-desc');
  const [productViewMode, setProductViewMode] = useState<'grid' | 'list'>('grid');

  // Product advanced filters
  const {
    filters: productAdvancedFilters,
    setFilter: setProductAdvancedFilter,
    clearFilters: clearProductAdvancedFilters,
  } = useAdvancedFilters<AdvancedFilterValues>({
    productName: null,
    clientName: null,
    minValue: null,
    maxValue: null,
    dateRange: [null, null],
    hasSpecialist: false,
  });

  // Product request status counts
  const productStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: productRequests.length };
    PRODUCT_STATUS_OPTIONS.forEach((status) => {
      if (status !== 'All') {
        counts[status] = productRequests.filter((r) => r.Status === status).length;
      }
    });
    return counts;
  }, [productRequests]);

  // Product request summary stats
  const productStats = useMemo(() => {
    const openRequests = productRequests.filter(
      (r) => r.Status !== 'Completed' && r.Status !== 'Cancelled'
    );
    const totalValue = openRequests.reduce((sum, r) => sum + (r.EstimatedValue || 0), 0);
    const pendingCount = productRequests.filter((r) => r.Status === 'Pending Review' || r.Status === 'Awaiting Approval').length;
    const confirmedCount = productRequests.filter((r) => r.Status === 'Confirmed').length;
    const completedCount = productRequests.filter((r) => r.Status === 'Completed').length;
    return {
      open: openRequests.length,
      totalValue,
      pending: pendingCount,
      confirmed: confirmedCount,
      completed: completedCount,
    };
  }, [productRequests]);

  // Filtered product requests (by status, search, type, advanced filters, sort)
  const filteredProductRequests = useMemo(() => {
    let filtered = [...productRequests];

    // Status filter
    if (selectedProductStatus !== 'All') {
      filtered = filtered.filter((r) => r.Status === selectedProductStatus);
    }

    // Request type filter
    if (selectedProductType !== 'All') {
      filtered = filtered.filter((r) => r.RequestType === selectedProductType);
    }

    // Search filter
    if (debouncedProductSearch) {
      const searchLower = debouncedProductSearch.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.ProductName.toLowerCase().includes(searchLower) ||
          r.ClientName.toLowerCase().includes(searchLower) ||
          r.ContactName.toLowerCase().includes(searchLower) ||
          r.ContactEmail.toLowerCase().includes(searchLower)
      );
    }

    // Advanced filters
    const productNameFilter = productAdvancedFilters.productName as string | null;
    const clientNameFilter = productAdvancedFilters.clientName as string | null;
    const minValue = productAdvancedFilters.minValue as number | null;
    const maxValue = productAdvancedFilters.maxValue as number | null;
    const dateRange = (productAdvancedFilters.dateRange as [string | null, string | null]) || [null, null];
    const hasSpecialist = productAdvancedFilters.hasSpecialist as boolean;

    if (productNameFilter) {
      const search = productNameFilter.toLowerCase();
      filtered = filtered.filter((r) => r.ProductName.toLowerCase().includes(search));
    }

    if (clientNameFilter) {
      const search = clientNameFilter.toLowerCase();
      filtered = filtered.filter((r) => r.ClientName.toLowerCase().includes(search));
    }

    if (minValue !== null && minValue > 0) {
      filtered = filtered.filter((r) => (r.EstimatedValue || 0) >= minValue);
    }

    if (maxValue !== null && maxValue > 0) {
      filtered = filtered.filter((r) => (r.EstimatedValue || 0) <= maxValue);
    }

    if (dateRange[0]) {
      const fromDate = new Date(dateRange[0]);
      filtered = filtered.filter((r) => new Date(r.Created) >= fromDate);
    }

    if (dateRange[1]) {
      const toDate = new Date(dateRange[1]);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => new Date(r.Created) <= toDate);
    }

    if (hasSpecialist) {
      filtered = filtered.filter((r) => r.AssignedSpecialistEmail);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (productSortBy) {
        case 'created-asc':
          return new Date(a.Created).getTime() - new Date(b.Created).getTime();
        case 'value-desc':
          return (b.EstimatedValue || 0) - (a.EstimatedValue || 0);
        case 'value-asc':
          return (a.EstimatedValue || 0) - (b.EstimatedValue || 0);
        case 'product-asc':
          return a.ProductName.localeCompare(b.ProductName);
        case 'created-desc':
        default:
          return new Date(b.Created).getTime() - new Date(a.Created).getTime();
      }
    });

    return filtered;
  }, [productRequests, selectedProductStatus, selectedProductType, debouncedProductSearch, productSortBy, productAdvancedFilters]);

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
  } = usePagination(filteredProductRequests, 20);

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
              <div>
                <div className={styles.heroTitle}>
                  <DocumentMultiple24Regular className={styles.heroIcon} />
                  <span>My <span className={styles.heroTitleAccent}>Requests</span></span>
                </div>
                <div className={styles.heroSubtitle}>Track your service and product requests</div>
              </div>
              <div className={styles.heroRightSection}>
                <span className={styles.collapsedBadge}>{heroStats.activeCount} Active</span>
                <span className={styles.collapsedBadge}>R{heroStats.pipelineValue.toLocaleString()}</span>
                <span className={styles.collapsedBadge}>{heroStats.winRate}% Win Rate</span>
                <Button
                  appearance="primary"
                  icon={<ArrowDownloadRegular />}
                  onClick={() =>
                    activeTab === 'service'
                      ? downloadServiceRequestsExcel(filteredRequests)
                      : downloadProductRequestsExcel(productRequests)
                  }
                  disabled={activeTab === 'service' ? filteredRequests.length === 0 : productRequests.length === 0}
                  size="small"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
                >
                  Export
                </Button>
                <Button
                  appearance="primary"
                  icon={<AddRegular />}
                  onClick={() => navigate('/request')}
                  size="small"
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
          {/* Product Summary Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard} style={{ borderLeftColor: '#2563eb' }}>
              <div className={styles.statIconBox} style={{ backgroundColor: '#eff6ff' }}>
                <Apps24Regular style={{ width: '20px', height: '20px', color: '#2563eb' }} />
              </div>
              <div className={styles.statContent}>
                <Text className={styles.statLabel}>Open Requests</Text>
                <Text className={styles.statValue}>{productStats.open}</Text>
                <Text className={styles.statSubtext} style={{ color: '#6b7280' }}>
                  of {productRequests.length} total
                </Text>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderLeftColor: '#16a34a' }}>
              <div className={styles.statIconBox} style={{ backgroundColor: '#f0fdf4' }}>
                <MoneyRegular style={{ width: '20px', height: '20px', color: '#16a34a' }} />
              </div>
              <div className={styles.statContent}>
                <Text className={styles.statLabel}>Est. Value</Text>
                <Text className={styles.statValue}>{formatCurrency(productStats.totalValue)}</Text>
                <Text className={styles.statSubtext}>
                  {productStats.open > 0 ? `Avg: ${formatCurrency(Math.round(productStats.totalValue / productStats.open))}` : 'No open deals'}
                </Text>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderLeftColor: '#f59e0b' }}>
              <div className={styles.statIconBox} style={{ backgroundColor: '#fffbeb' }}>
                <ClockRegular style={{ width: '20px', height: '20px', color: '#f59e0b' }} />
              </div>
              <div className={styles.statContent}>
                <Text className={styles.statLabel}>Pending</Text>
                <Text className={styles.statValue} style={{ color: '#f59e0b' }}>
                  {productStats.pending}
                </Text>
                <Text className={styles.statSubtext} style={{ color: '#f59e0b' }}>
                  Awaiting action
                </Text>
              </div>
            </div>
            <div className={styles.statCard} style={{ borderLeftColor: '#10b981' }}>
              <div className={styles.statIconBox} style={{ backgroundColor: '#ecfdf5' }}>
                <CheckmarkCircleRegular style={{ width: '20px', height: '20px', color: '#10b981' }} />
              </div>
              <div className={styles.statContent}>
                <Text className={styles.statLabel}>Confirmed</Text>
                <Text className={styles.statValue} style={{ color: '#10b981' }}>
                  {productStats.confirmed}
                </Text>
                <Text className={styles.statSubtext} style={{ color: '#6b7280' }}>
                  Completed: {productStats.completed}
                </Text>
              </div>
            </div>
          </div>

          {/* Product Status Filters */}
          <div className={styles.filterSection}>
            <div className={styles.stageFilters} role="group" aria-label="Filter by status">
              {PRODUCT_STATUS_OPTIONS.map((status) => {
                const isActive = selectedProductStatus === status;
                const statusColor = status !== 'All' ? PRODUCT_STATUS_METADATA[status as ProductRequestStatus]?.color : undefined;
                return (
                  <span
                    key={status}
                    className={`${styles.stageChip} ${isActive ? styles.stageChipActive : ''}`}
                    onClick={() => setSelectedProductStatus(status)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedProductStatus(status);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    aria-label={`${status}: ${productStatusCounts[status] || 0} requests`}
                  >
                    {statusColor && (
                      <span className={styles.stageDot} style={{ backgroundColor: statusColor }} />
                    )}
                    {status}
                    <span className={`${styles.stageCount} ${isActive ? styles.stageCountActive : ''}`} aria-hidden="true">
                      {productStatusCounts[status] || 0}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Product Toolbar */}
          <div className={styles.toolbar}>
            <SearchBox
              className={styles.searchBox}
              placeholder="Search by product, client, or contact..."
              value={productSearchText}
              onChange={(_, data) => setProductSearchText(data.value)}
              contentBefore={<SearchRegular />}
            />

            <Dropdown
              className={styles.dropdownFilter}
              placeholder="Request Type"
              selectedOptions={selectedProductType !== 'All' ? [selectedProductType] : []}
              onOptionSelect={(_, data) =>
                setSelectedProductType(data.optionValue as string || 'All')
              }
            >
              {PRODUCT_TYPE_OPTIONS.map((type) => (
                <Option key={type} value={type} text={type === 'All' ? 'All Request Types' : type}>
                  {type === 'All' ? 'All Request Types' : type}
                </Option>
              ))}
            </Dropdown>

            <Dropdown
              className={styles.dropdownFilter}
              placeholder="Sort by"
              selectedOptions={[productSortBy]}
              onOptionSelect={(_, data) => setProductSortBy(data.optionValue as string)}
            >
              {PRODUCT_SORT_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value} text={option.label}>
                  {option.label}
                </Option>
              ))}
            </Dropdown>

            <span className={styles.resultsInfo}>
              <div className={styles.viewToggleGroup}>
                <button
                  className={`${styles.viewToggleBtn} ${productViewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
                  onClick={() => setProductViewMode('grid')}
                  title="Grid view"
                  aria-label="Grid view"
                  aria-pressed={productViewMode === 'grid'}
                >
                  <GridRegular style={{ width: '16px', height: '16px' }} />
                </button>
                <button
                  className={`${styles.viewToggleBtn} ${productViewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
                  onClick={() => setProductViewMode('list')}
                  title="List view"
                  aria-label="List view"
                  aria-pressed={productViewMode === 'list'}
                >
                  <TextBulletListLtr24Regular style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
              {filteredProductRequests.length} {filteredProductRequests.length === 1 ? 'request' : 'requests'}
            </span>
          </div>

          {/* Product Advanced Filter Panel */}
          <AdvancedFilterPanel
            filters={PRODUCT_ADVANCED_FILTER_CONFIG}
            values={productAdvancedFilters}
            onChange={(key, value) => setProductAdvancedFilter(key as keyof AdvancedFilterValues, value)}
            onClear={clearProductAdvancedFilters}
          />

          {productLoading ? (
            <div className={styles.loadingContainer}>
              <Spinner size="large" />
              <Text>Loading product requests...</Text>
            </div>
          ) : filteredProductRequests.length > 0 ? (
            <>
              {productViewMode === 'grid' ? (
                <div className={styles.productGrid}>
                  {paginatedProductRequests.map((pr) => {
                    const sc = PRODUCT_STATUS_COLORS[pr.Status];
                    return (
                      <div
                        key={pr.Id}
                        className={styles.productCard}
                        style={{ borderLeftColor: sc.accent }}
                        onClick={() => handleProductRequestClick(pr)}
                      >
                        {/* Header: Client name + status badge */}
                        <div className={styles.productCardHeader}>
                          <div className={styles.productCardInfo}>
                            <Text className={styles.productCardTitle}>{pr.ClientName}</Text>
                            <Text className={styles.productCardSubtitle}>
                              {pr.ProductName} ({pr.ProductType})
                            </Text>
                          </div>
                          <span
                            className={styles.productCardStatusBadge}
                            style={{ backgroundColor: sc.bg, color: sc.text }}
                          >
                            {pr.Status}
                          </span>
                        </div>

                        {/* Meta pills row */}
                        <div className={styles.productCardMeta}>
                          <span className={styles.productMetaPill}>
                            <PersonRegular style={{ width: '12px', height: '12px' }} />
                            {pr.AccountManagerName || pr.ContactName}
                          </span>
                          <span className={styles.productMetaPill}>
                            <BoxRegular style={{ width: '12px', height: '12px' }} />
                            {pr.RequestType}
                          </span>
                          {pr.EstimatedValue ? (
                            <span className={styles.productMetaPill}>
                              {formatCurrency(pr.EstimatedValue)}
                            </span>
                          ) : null}
                          {pr.IsPremiumClient && (
                            <span className={`${styles.productMetaPill} ${styles.productMetaPillPremium}`}>
                              <StarRegular style={{ width: '12px', height: '12px' }} />
                              Premium
                            </span>
                          )}
                          {pr.AssignedSpecialistName && (
                            <span className={styles.productMetaPill}>
                              <PersonRegular style={{ width: '12px', height: '12px' }} />
                              {pr.AssignedSpecialistName}
                            </span>
                          )}
                        </div>

                        {/* Footer: schedule + created date */}
                        <div className={styles.productCardFooter}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CalendarRegular style={{ width: '12px', height: '12px' }} />
                            {pr.ConfirmedDateTime
                              ? new Date(pr.ConfirmedDateTime).toLocaleDateString('en-ZA', {
                                  weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                })
                              : pr.ProposedSlot1
                                ? `Proposed: ${new Date(pr.ProposedSlot1).toLocaleDateString('en-ZA', {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                  })}`
                                : 'Not scheduled'}
                          </span>
                          <span>
                            Created {new Date(pr.Created).toLocaleDateString('en-ZA', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table className={styles.listTable}>
                  <thead>
                    <tr>
                      <th className={styles.listTh}>Product</th>
                      <th className={styles.listTh}>Type</th>
                      <th className={styles.listTh}>Client</th>
                      <th className={styles.listTh}>Status</th>
                      <th className={styles.listTh}>Request Type</th>
                      <th className={styles.listTh}>Specialist</th>
                      <th className={styles.listTh} style={{ textAlign: 'right' }}>Est. Value</th>
                      <th className={styles.listTh}>Scheduled</th>
                      <th className={styles.listTh}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProductRequests.map((pr) => (
                      <tr
                        key={pr.Id}
                        className={styles.listRow}
                        onClick={() => handleProductRequestClick(pr)}
                      >
                        <td className={styles.listTd} style={{ fontWeight: '600' }}>{pr.ProductName}</td>
                        <td className={styles.listTd}>{pr.ProductType}</td>
                        <td className={styles.listTd}>
                          <div style={{ lineHeight: '1.3' }}>
                            <div style={{ fontWeight: 500 }}>{pr.ClientName}</div>
                            <div style={{ fontSize: '11px', color: '#616161' }}>{pr.ContactName}</div>
                          </div>
                        </td>
                        <td className={styles.listTd}>
                          <span
                            className={styles.stageBadge}
                            style={{ backgroundColor: PRODUCT_STATUS_METADATA[pr.Status]?.color || '#616161' }}
                          >
                            {pr.Status}
                          </span>
                        </td>
                        <td className={styles.listTd}>{pr.RequestType}</td>
                        <td className={styles.listTd} style={{ color: pr.AssignedSpecialistName ? '#242424' : '#a0a0a0' }}>
                          {pr.AssignedSpecialistName || 'Unassigned'}
                        </td>
                        <td className={styles.listTd} style={{ textAlign: 'right', fontWeight: '500' }}>
                          {pr.EstimatedValue ? formatCurrency(pr.EstimatedValue) : '\u2014'}
                        </td>
                        <td className={styles.listTd}>
                          {pr.ConfirmedDateTime
                            ? new Date(pr.ConfirmedDateTime).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
                            : pr.ProposedSlot1
                              ? new Date(pr.ProposedSlot1).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
                              : 'Not set'}
                        </td>
                        <td className={styles.listTd} style={{ color: '#616161', fontSize: '12px' }}>
                          {new Date(pr.Created).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
              <div className={styles.emptyIconWrapper}>
                {productRequests.length === 0 ? (
                  <Apps24Regular className={styles.emptyIcon} />
                ) : (
                  <FilterRegular className={styles.emptyIcon} />
                )}
              </div>
              <Text className={styles.emptyTitle}>
                {productRequests.length === 0 ? 'No product requests yet' : 'No matching requests'}
              </Text>
              <Text className={styles.emptyText}>
                {productRequests.length === 0
                  ? 'Browse the product catalog to request demos or trial deployments for your clients.'
                  : 'Try adjusting your filters or search criteria to find what you\'re looking for.'}
              </Text>
              {productRequests.length === 0 && (
                <Button
                  appearance="primary"
                  icon={<Apps24Regular />}
                  onClick={() => navigate('/products')}
                  size="medium"
                  style={{ backgroundColor: DW_COLORS.teal }}
                >
                  Browse Products
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* Service Requests Tab */}
      {activeTab === 'service' && <>
      {/* Summary Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard} style={{ borderLeftColor: '#2563eb' }}>
          <div className={styles.statIconBox} style={{ backgroundColor: '#eff6ff' }}>
            <DocumentBulletListRegular style={{ width: '20px', height: '20px', color: '#2563eb' }} />
          </div>
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>Open Requests</Text>
            <Text className={styles.statValue}>{stats.open}</Text>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#16a34a' }}>
          <div className={styles.statIconBox} style={{ backgroundColor: '#f0fdf4' }}>
            <MoneyRegular style={{ width: '20px', height: '20px', color: '#16a34a' }} />
          </div>
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>Pipeline Value</Text>
            <Text className={styles.statValue}>{formatCurrency(stats.totalValue)}</Text>
            <Text className={styles.statSubtext}>
              Weighted: {formatCurrency(stats.weightedValue)}
            </Text>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#dc2626' }}>
          <div className={styles.statIconBox} style={{ backgroundColor: '#fef2f2' }}>
            <FlashRegular style={{ width: '20px', height: '20px', color: '#dc2626' }} />
          </div>
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>Hot Leads</Text>
            <Text className={styles.statValue} style={{ color: '#dc2626' }}>
              {stats.hotLeads}
            </Text>
          </div>
        </div>
        <div className={styles.statCard} style={{ borderLeftColor: '#7c3aed' }}>
          <div className={styles.statIconBox} style={{ backgroundColor: '#faf5ff' }}>
            <ArrowTrendingRegular style={{ width: '20px', height: '20px', color: '#7c3aed' }} />
          </div>
          <div className={styles.statContent}>
            <Text className={styles.statLabel}>Win Rate</Text>
            <Text className={styles.statValue} style={{ color: '#7c3aed' }}>
              {heroStats.winRate}%
            </Text>
          </div>
        </div>
      </div>

      {/* Stage Filters */}
      <div className={styles.filterSection}>
        <div className={styles.stageFilters} role="group" aria-label="Filter by stage">
          {STAGE_OPTIONS.map((stage) => {
            const isActive = selectedStage === stage;
            const stageColor = stage !== 'All' ? STAGE_METADATA[stage as FunnelStage]?.color : undefined;
            return (
              <span
                key={stage}
                className={`${styles.stageChip} ${isActive ? styles.stageChipActive : ''}`}
                onClick={() => setSelectedStage(stage)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedStage(stage);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                aria-label={`${stage}: ${stageCounts[stage] || 0} requests`}
              >
                {stageColor && (
                  <span className={styles.stageDot} style={{ backgroundColor: stageColor }} />
                )}
                {stage}
                <span className={`${styles.stageCount} ${isActive ? styles.stageCountActive : ''}`} aria-hidden="true">
                  {stageCounts[stage] || 0}
                </span>
              </span>
            );
          })}
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
          <div className={styles.emptyIconWrapper}>
            {requests.length === 0 ? (
              <DocumentMultiple24Regular className={styles.emptyIcon} />
            ) : (
              <FilterRegular className={styles.emptyIcon} />
            )}
          </div>
          <Text className={styles.emptyTitle}>
            {requests.length === 0 ? 'No service requests yet' : 'No matching requests'}
          </Text>
          <Text className={styles.emptyText}>
            {requests.length === 0
              ? 'Create your first service request to start tracking opportunities in your pipeline.'
              : 'Try adjusting your filters or search criteria to find what you\'re looking for.'}
          </Text>
          {requests.length === 0 && (
            <Button
              className={styles.newRequestBtn}
              appearance="primary"
              icon={<AddRegular />}
              onClick={() => navigate('/request')}
              size="medium"
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
