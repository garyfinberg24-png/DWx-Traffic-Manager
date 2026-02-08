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
import QuickCreateDialog from '../SalesFunnel/QuickCreateDialog';
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
  collapsedTabPill: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shorthands.padding('4px', '14px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.3)'),
    cursor: 'pointer',
  },
  collapsedTabPillInactive: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    fontSize: '12px',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    backgroundColor: 'transparent',
    ...shorthands.padding('4px', '14px'),
    ...shorthands.borderRadius('14px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.15)'),
    cursor: 'pointer',
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

  // Glassmorphic tab row (matches ProductCatalog.tabsRow)
  tabsRow: {
    display: 'flex',
    gap: '6px',
    ...shorthands.padding('20px', '32px', '0'),
    position: 'relative',
    zIndex: 2,
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    ...shorthands.padding('8px', '20px'),
    ...shorthands.borderRadius('20px'),
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.25)'),
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    backdropFilter: 'blur(8px)',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    color: 'white',
    ...shorthands.borderColor('rgba(255,255,255,0.45)'),
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  tabCount: {
    fontSize: '11px',
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shorthands.padding('1px', '8px'),
    ...shorthands.borderRadius('10px'),
    minWidth: '22px',
    textAlign: 'center' as const,
  },
  tabCountActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
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

  // Row 2: Hero content — matches ProductCatalog.heroContentRow
  heroContentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '32px',
    ...shorthands.padding('18px', '32px', '22px'),
    position: 'relative',
    zIndex: 2,
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
  // Filter bar — below hero, inside container (matches ProductCatalog.filterBar)
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '24px',
    marginBottom: '24px',
  },
  filterPillsScroll: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    flex: '1',
    scrollbarWidth: 'none',
  },
  filterPill: {
    ...shorthands.padding('8px', '16px'),
    ...shorthands.borderRadius('20px'),
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    ...shorthands.border('1px', 'solid', '#d0d0d0'),
    backgroundColor: 'white',
    color: '#333333',
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

/** Returns true if a hex colour is "light" (needs dark text for contrast) */
const isLightColor = (hex: string): boolean => {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // W3C perceived-brightness formula
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
};

// Hero tab groupings (matches Products 4-pill pattern)
type HeroTab = 'all' | 'development' | 'advisory' | 'engagement' | 'support';

const HERO_TABS: { id: HeroTab; label: string; categories: ServiceCategory[] }[] = [
  { id: 'all', label: 'All Services', categories: [] },
  { id: 'development', label: 'Development', categories: ['Power Platform', 'SPFx Development', 'SharePoint Migration'] },
  { id: 'advisory', label: 'Advisory', categories: ['M365 Assessment', 'Strategic Advisory', 'Copilot Agents'] },
  { id: 'engagement', label: 'Engagement', categories: ['Proposal', 'Tender', 'Training', 'MS Viva'] },
  { id: 'support', label: 'Support', categories: ['Ad-Hoc Support', 'SLA'] },
];

type CatalogTab = 'Popular' | 'All' | ServiceCategory;

const CATALOG_TABS: { id: CatalogTab; label: string; color: string }[] = [
  { id: 'All', label: 'All Services', color: '#374151' },
  { id: 'Popular', label: 'Popular', color: DW_COLORS.teal },
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
  const [heroTab, setHeroTab] = useState<HeroTab>('all');
  const [selectedTab, setSelectedTab] = useState<CatalogTab>('All');
  const [selectedService, setSelectedService] = useState<DWService | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [fullDetailsService, setFullDetailsService] = useState<DWService | null>(null);
  const [isFullDetailsOpen, setIsFullDetailsOpen] = useState(false);
  const [quickCreateService, setQuickCreateService] = useState<DWService | null>(null);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

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

  // Services filtered by hero tab (broad grouping)
  const heroFilteredServices = useMemo(() => {
    if (heroTab === 'all') return services;
    const tab = HERO_TABS.find(t => t.id === heroTab);
    if (!tab) return services;
    return services.filter(s => tab.categories.includes(s.Category));
  }, [services, heroTab]);

  const filteredServices = useMemo(() => {
    return heroFilteredServices.filter((service) => {
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
  }, [heroFilteredServices, selectedTab, debouncedSearch]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    heroFilteredServices.forEach(s => {
      counts.set(s.Category, (counts.get(s.Category) || 0) + 1);
    });
    return counts;
  }, [heroFilteredServices]);

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

  const handleQuickCreate = (service: DWService) => {
    setIsDetailsOpen(false);
    setIsFullDetailsOpen(false);
    setQuickCreateService(service);
    setIsQuickCreateOpen(true);
  };

  const getTabCount = (tab: CatalogTab): number => {
    if (tab === 'Popular') return heroFilteredServices.filter(s => s.IsPopular || POPULAR_TITLES.has(s.Title)).length;
    if (tab === 'All') return heroFilteredServices.length;
    return categoryCounts.get(tab) || 0;
  };

  const getHeroTabCount = (tab: HeroTab): number => {
    if (tab === 'all') return services.length;
    const config = HERO_TABS.find(t => t.id === tab);
    if (!config) return 0;
    return services.filter(s => config.categories.includes(s.Category)).length;
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
              {HERO_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={heroTab === tab.id ? styles.collapsedTabPill : styles.collapsedTabPillInactive}
                  onClick={() => setHeroTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              <span className={styles.collapsedBadge}>{getHeroTabCount(heroTab)} services</span>
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

              {/* Row 2: Glassmorphic tab pills */}
              <div className={styles.tabsRow}>
                {HERO_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`${styles.tabBtn} ${heroTab === tab.id ? styles.tabBtnActive : ''}`}
                    onClick={() => setHeroTab(tab.id)}
                  >
                    <span>{tab.label}</span>
                    <span className={`${styles.tabCount} ${heroTab === tab.id ? styles.tabCountActive : ''}`}>
                      {getHeroTabCount(tab.id)}
                    </span>
                  </button>
                ))}
              </div>

              {/* Row 3: Content — title + description */}
              <div className={styles.heroContentRow}>
                <div style={{ flex: 1 }}>
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
                    ? {
                        backgroundColor: tab.color,
                        borderColor: tab.color,
                        color: isLightColor(tab.color) ? '#1f2937' : 'white',
                      }
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
                    style={{
                      backgroundColor: isActive
                        ? (isLightColor(tab.color) ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)')
                        : tab.color,
                    }}
                  />
                )}
                {tab.label}
                <span
                  className={`${styles.pillCount} ${isActive ? styles.pillCountActive : styles.pillCountInactive}`}
                  style={
                    isActive && isLightColor(tab.color)
                      ? { backgroundColor: 'rgba(0,0,0,0.12)', color: '#1f2937' }
                      : undefined
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <input
          type="text"
          placeholder="Search services..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            padding: '7px 12px 7px 34px',
            borderRadius: '8px',
            border: '1px solid #d0d0d0',
            fontSize: '13px',
            color: '#333',
            width: '240px',
            flexShrink: 0,
            outline: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='11' cy='11' r='7' stroke='%239ca3af' stroke-width='2'/%3E%3Cline x1='16.5' y1='16.5' x2='21' y2='21' stroke='%239ca3af' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '10px center',
          }}
        />
      </div>

      {/* Content */}
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
          onQuickRequest={handleQuickCreate}
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
          onQuickRequest={handleQuickCreate}
        />
      )}

      {/* Quick Create Dialog */}
      <QuickCreateDialog
        open={isQuickCreateOpen}
        onClose={() => { setIsQuickCreateOpen(false); setQuickCreateService(null); }}
        onDealCreated={() => { setIsQuickCreateOpen(false); setQuickCreateService(null); }}
        preSelectedService={quickCreateService}
      />
    </div>
  );
};
