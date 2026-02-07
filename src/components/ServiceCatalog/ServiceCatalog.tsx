/**
 * DWx Traffic Manager - Service Catalog Component
 * Contained hero matching Products page layout — rounded bottom corners,
 * glassmorphic search, content row with stats, filter pills below hero
 */

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Spinner,
  Button,
  makeStyles,
  shorthands,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  SearchRegular,
  GridRegular,
  ArrowLeft24Regular,
  StarRegular,
} from '@fluentui/react-icons';
import { DWService, ServiceCategory } from '../../types/ServiceRequest';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { ServiceCard } from './ServiceCard';
import { ServiceDetails } from './ServiceDetails';
import { ServiceDetailModal } from './ServiceDetailModal';
import { DW_COLORS } from '../../utils/buttonStyles';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';

// ============================================================================
// Category colors (shared with ServiceCard)
// ============================================================================

const categoryColors: Record<string, string> = {
  'Power Platform': '#742774',
  'SPFx Development': '#0078d4',
  'SharePoint Migration': '#00a4ef',
  'M365 Assessment': '#107c10',
  'Copilot Agents': '#6264a7',
  'MS Viva': '#e5559a',
  'Training': '#f59e0b',
  'Proposal': '#0078d4',
  'Tender': '#8b5cf6',
  'Ad-Hoc Support': '#f59e0b',
  'SLA': '#107c10',
  'Strategic Advisory': '#e5559a',
};

// ============================================================================
// Styles — matching ProductCatalog layout exactly
// ============================================================================

const useStyles = makeStyles({
  // Contained page (matches ProductCatalog.container)
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    ...shorthands.padding('0', '64px', '24px'),
  },

  // Hero wrapper — relative for toggle positioning
  heroWrapper: {
    position: 'relative',
    marginBottom: '20px',
  },
  // Hero Banner — contained, rounded bottom corners (matches ProductCatalog.heroBanner)
  heroBanner: {
    ...shorthands.borderRadius('0', '0', '16px', '16px'),
    ...shorthands.padding('0'),
    position: 'relative',
    ...shorthands.overflow('hidden'),
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 50%, #1e6b7b 100%)',
  },
  heroExpanded: {
    maxHeight: '400px',
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

  // Row 1: Page header (matches ProductCatalog.heroHeaderRow)
  heroHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...shorthands.padding('20px', '32px', '0'),
    position: 'relative',
    zIndex: 2,
  },
  heroHeaderTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    letterSpacing: '-0.3px',
  },
  heroHeaderSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
    marginTop: '2px',
  },
  backButtonHero: {
    ...shorthands.padding('6px', '14px'),
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.25)'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },

  // Row 2: Glassmorphic search bar (in position of Products' tab pills)
  heroSearchRow: {
    ...shorthands.padding('14px', '32px', '0'),
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  heroSearchBar: {
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    maxWidth: '560px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.25)'),
    ...shorthands.borderRadius('20px'),
    backdropFilter: 'blur(8px)',
    ...shorthands.overflow('hidden'),
  },
  heroSearchIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: '16px',
    color: 'rgba(255,255,255,0.5)',
  },
  heroSearchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    ...shorthands.padding('10px', '16px'),
    fontSize: '13px',
    color: '#ffffff',
    ...shorthands.outline('none'),
  },
  heroSearchCount: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    whiteSpace: 'nowrap',
  },

  // Row 3: Hero content (icon + title + desc | stats) — matches ProductCatalog.heroContentRow
  heroContentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    ...shorthands.padding('18px', '32px', '22px'),
    position: 'relative',
    zIndex: 2,
  },
  heroLeft: {
    flex: '1',
    minWidth: '0',
  },
  heroTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  heroIcon: {
    width: '36px',
    height: '36px',
    ...shorthands.borderRadius('10px'),
    backgroundColor: 'rgba(255,255,255,0.1)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.15)'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'white',
    letterSpacing: '-0.3px',
  },
  heroDesc: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'rgba(255,255,255,0.7)',
    maxWidth: '700px',
  },
  heroStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flexShrink: 0,
    paddingLeft: '32px',
    ...shorthands.borderLeft('1px', 'solid', 'rgba(255,255,255,0.12)'),
  },
  heroStat: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  heroStatValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'white',
    whiteSpace: 'nowrap',
  },
  heroStatLabel: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
  },

  // Filter bar — below hero, inside container (matches ProductCatalog.filterBar)
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  filterPillsScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    flex: '1',
    scrollbarWidth: 'none',
  },
  filterPill: {
    ...shorthands.padding('5px', '14px'),
    ...shorthands.borderRadius('16px'),
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.15s',
    ...shorthands.border('1px', 'solid', '#e0e0e0'),
    backgroundColor: 'white',
    color: '#555555',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  },
  filterPillActive: {
    color: 'white',
  },
  pillDot: {
    width: '8px',
    height: '8px',
    ...shorthands.borderRadius('50%'),
    display: 'inline-block',
  },
  pillCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '16px',
    height: '16px',
    ...shorthands.borderRadius('8px'),
    fontSize: '10px',
    marginLeft: '4px',
    ...shorthands.padding('0', '4px'),
  },
  pillCountActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    color: 'white',
  },
  pillCountInactive: {
    backgroundColor: '#f0f0f0',
    color: '#888888',
  },

  // Content area
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  resultsInfo: {
    fontSize: '13px',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },

  // Services Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: '24px',
  },

  // States
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...shorthands.padding('80px'),
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('80px', '20px'),
    textAlign: 'center',
    backgroundColor: '#fafbfc',
    ...shorthands.borderRadius('16px'),
    ...shorthands.border('2px', 'dashed', '#e5e7eb'),
  },
  emptyIcon: {
    width: '56px',
    height: '56px',
    color: '#9ca3af',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    maxWidth: '400px',
  },
});

// ============================================================================
// Constants
// ============================================================================

const POPULAR_TITLES = new Set([
  'Power Platform Development',
  'SPFx Development',
  'Enterprise Copilot Agents',
  'Zero to AI Copilot Chat Hero',
  'Proposal Development',
  'Ad-Hoc Technical Support',
]);

type CatalogTab = 'Popular' | 'All' | ServiceCategory;

const CATALOG_TABS: { id: CatalogTab; label: string; color: string }[] = [
  { id: 'Popular', label: 'Popular', color: DW_COLORS.teal },
  { id: 'All', label: 'All Services', color: '#374151' },
  { id: 'Power Platform', label: 'Power Platform', color: categoryColors['Power Platform'] },
  { id: 'SPFx Development', label: 'SPFx', color: categoryColors['SPFx Development'] },
  { id: 'SharePoint Migration', label: 'Migrations', color: categoryColors['SharePoint Migration'] },
  { id: 'M365 Assessment', label: 'M365', color: categoryColors['M365 Assessment'] },
  { id: 'Copilot Agents', label: 'Copilot', color: categoryColors['Copilot Agents'] },
  { id: 'MS Viva', label: 'Viva', color: categoryColors['MS Viva'] },
  { id: 'Training', label: 'Training', color: categoryColors['Training'] },
  { id: 'Proposal', label: 'Proposals', color: categoryColors['Proposal'] },
  { id: 'Tender', label: 'Tenders', color: categoryColors['Tender'] },
  { id: 'Ad-Hoc Support', label: 'Ad-Hoc', color: categoryColors['Ad-Hoc Support'] },
  { id: 'SLA', label: 'SLA', color: categoryColors['SLA'] },
  { id: 'Strategic Advisory', label: 'Advisory', color: categoryColors['Strategic Advisory'] },
];

// ============================================================================
// Component
// ============================================================================

interface ServiceCatalogProps {
  onRequestService?: (service: DWService) => void;
}

export const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ onRequestService }) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { isCollapsed, toggle } = useHeroCollapse('services');

  const [services, setServices] = useState<DWService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDeferredValue(searchText);
  const [selectedTab, setSelectedTab] = useState<CatalogTab>('Popular');
  const [selectedService, setSelectedService] = useState<DWService | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [fullDetailsService, setFullDetailsService] = useState<DWService | null>(null);
  const [isFullDetailsOpen, setIsFullDetailsOpen] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await serviceCatalogService.getServices(true);
        setServices(data);
      } catch (err) {
        console.error('Error loading services:', err);
        setError('Failed to load services. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (selectedTab === 'Popular') {
        if (!service.IsPopular && !POPULAR_TITLES.has(service.Title)) return false;
      } else if (selectedTab !== 'All') {
        if (service.Category !== selectedTab) return false;
      }
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        return (
          service.Title.toLowerCase().includes(searchLower) ||
          service.Description.toLowerCase().includes(searchLower) ||
          service.ShortDescription.toLowerCase().includes(searchLower) ||
          service.Category.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [services, selectedTab, debouncedSearch]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    services.forEach(s => {
      counts.set(s.Category, (counts.get(s.Category) || 0) + 1);
    });
    return counts;
  }, [services]);

  const uniqueCategories = categoryCounts.size;

  const handleServiceClick = (service: DWService) => {
    setSelectedService(service);
    setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedService(null);
  };

  const handleRequestService = (service: DWService) => {
    setIsDetailsOpen(false);
    setIsFullDetailsOpen(false);
    if (onRequestService) {
      onRequestService(service);
    } else {
      navigate('/request', { state: { preSelectedService: service } });
    }
  };

  const handleViewFullDetails = (service: DWService) => {
    setFullDetailsService(service);
    setIsFullDetailsOpen(true);
  };

  const handleCloseFullDetails = () => {
    setIsFullDetailsOpen(false);
    setFullDetailsService(null);
  };

  const getTabCount = (tab: CatalogTab): number => {
    if (tab === 'Popular') return services.filter(s => s.IsPopular || POPULAR_TITLES.has(s.Title)).length;
    if (tab === 'All') return services.length;
    return categoryCounts.get(tab) || 0;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner size="large" />
          <Text>Loading service catalog...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Hero Banner — contained, rounded bottom corners */}
      <div className={styles.heroWrapper}>
        <div className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}>
          <div className={styles.heroDecoration} />

          {isCollapsed ? (
            <div className={styles.collapsedStrip}>
              <span className={styles.collapsedTitle}>Service Catalog</span>
              <span className={styles.collapsedBadge}>{services.length} Services</span>
              <span className={styles.collapsedBadge}>{uniqueCategories} Categories</span>
            </div>
          ) : (
            <>
              {/* Row 1: Page header */}
              <div className={styles.heroHeaderRow}>
                <div>
                  <div className={styles.heroHeaderTitle}>Service Catalog</div>
                  <div className={styles.heroHeaderSubtitle}>
                    Explore Digital Workplace's full range of Microsoft 365 services
                  </div>
                </div>
                <button
                  className={styles.backButtonHero}
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft24Regular style={{ fontSize: '16px' }} />
                  Back to Home
                </button>
              </div>

              {/* Row 2: Glassmorphic search bar */}
              <div className={styles.heroSearchRow}>
                <div className={styles.heroSearchBar}>
                  <div className={styles.heroSearchIcon}>
                    <SearchRegular style={{ width: '16px', height: '16px' }} />
                  </div>
                  <input
                    className={styles.heroSearchInput}
                    placeholder="Search services by name, category, or keyword..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
                <span className={styles.heroSearchCount}>
                  {services.length} services available
                </span>
              </div>

              {/* Row 3: Content — title + description | stats */}
              <div className={styles.heroContentRow}>
                <div className={styles.heroLeft}>
                  <div className={styles.heroTop}>
                    <div className={styles.heroIcon}>
                      <GridRegular style={{ color: '#7dd3fc', fontSize: '18px' }} />
                    </div>
                    <Text className={styles.heroTitle}>
                      DWx Service{' '}
                      <span style={{ color: '#7dd3fc' }}>Catalog</span>
                    </Text>
                  </div>
                  <div className={styles.heroDesc}>
                    From Power Platform to Copilot Agents, SharePoint migrations to strategic advisory — find the right Microsoft 365 solution and request a pre-sales consultation.
                  </div>
                </div>
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <Text className={styles.heroStatValue}>{services.length}</Text>
                    <Text className={styles.heroStatLabel}>Services</Text>
                  </div>
                  <div className={styles.heroStat}>
                    <Text className={styles.heroStatValue}>{uniqueCategories}</Text>
                    <Text className={styles.heroStatLabel}>Categories</Text>
                  </div>
                  <div className={styles.heroStat}>
                    <Text className={styles.heroStatValue}>4</Text>
                    <Text className={styles.heroStatLabel}>Complexity Tiers</Text>
                  </div>
                  <div className={styles.heroStat}>
                    <Text className={styles.heroStatValue}>ZAR</Text>
                    <Text className={styles.heroStatLabel}>Currency</Text>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ marginBottom: '16px' }}>
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Error</MessageBarTitle>
              {error}
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Filter pills — below hero, inside container */}
      <div className={styles.filterBar}>
        <div
          className={styles.filterPillsScroll}
          style={{
            maskImage: 'linear-gradient(to right, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, black 92%, transparent 100%)',
          }}
        >
          {CATALOG_TABS.map((tab) => {
            const isActive = selectedTab === tab.id;
            const count = getTabCount(tab.id);

            return (
              <button
                key={tab.id}
                className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
                style={
                  isActive
                    ? { backgroundColor: tab.color, borderColor: tab.color }
                    : undefined
                }
                onClick={() => setSelectedTab(tab.id)}
              >
                {tab.id === 'Popular' && (
                  <StarRegular style={{ width: '12px', height: '12px' }} />
                )}
                {tab.id !== 'Popular' && tab.id !== 'All' && (
                  <span
                    className={styles.pillDot}
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.5)' : tab.color }}
                  />
                )}
                {tab.label}
                <span
                  className={`${styles.pillCount} ${isActive ? styles.pillCountActive : styles.pillCountInactive}`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className={styles.toolbar}>
        <span className={styles.resultsInfo}>
          <GridRegular style={{ width: '16px', height: '16px' }} />
          {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
          {searchText && ` matching "${searchText}"`}
        </span>
      </div>

      {filteredServices.length > 0 ? (
        <div className={styles.grid}>
          {filteredServices.map((service) => (
            <ServiceCard key={service.Id} service={service} onClick={handleServiceClick} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <SearchRegular className={styles.emptyIcon} />
          <Text className={styles.emptyTitle}>No services found</Text>
          <Text className={styles.emptyText}>
            {searchText || selectedTab !== 'All'
              ? 'Try adjusting your search or filter criteria'
              : 'No services are currently available'}
          </Text>
          {(searchText || selectedTab !== 'All') && (
            <Button
              appearance="primary"
              style={{ marginTop: '16px', backgroundColor: DW_COLORS.teal }}
              onClick={() => { setSearchText(''); setSelectedTab('All'); }}
            >
              Show All Services
            </Button>
          )}
        </div>
      )}

      {/* Quick View Modal */}
      {selectedService && (
        <ServiceDetails
          service={selectedService}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          onRequestService={handleRequestService}
          onViewFullDetails={handleViewFullDetails}
        />
      )}

      {/* Full Details Modal */}
      {fullDetailsService && (
        <ServiceDetailModal
          service={fullDetailsService}
          isOpen={isFullDetailsOpen}
          onClose={handleCloseFullDetails}
          onRequestService={handleRequestService}
          allServices={services}
          onViewService={handleViewFullDetails}
        />
      )}
    </div>
  );
};
