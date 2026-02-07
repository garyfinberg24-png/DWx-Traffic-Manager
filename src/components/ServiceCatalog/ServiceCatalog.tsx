/**
 * DWx Traffic Manager - Service Catalog Component
 * V1 Hero Banner + Pill Filters design
 * Gradient hero with embedded search, colorful category pills, accent-bordered cards
 */

import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Spinner,
  Button,
  makeStyles,
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
// Styles
// ============================================================================

const useStyles = makeStyles({
  // Full-width page container (no max-width — hero spans full width)
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
  },

  // Hero Banner
  hero: {
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 50%, #1e6b7b 100%)',
    padding: '56px 64px 44px',
    position: 'relative',
    overflow: 'hidden',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '1400px',
    margin: '0 auto',
  },
  heroBackButton: {
    color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: '20px',
    ':hover': {
      color: '#fff',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: '10px',
    letterSpacing: '-0.5px',
  },
  heroSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '28px',
    maxWidth: '600px',
    lineHeight: '1.6',
  },
  heroSearchBar: {
    display: 'flex',
    maxWidth: '560px',
    backgroundColor: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.3s',
  },
  heroSearchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    padding: '14px 20px',
    fontSize: '15px',
    color: '#ffffff',
    outline: 'none',
  },
  heroSearchIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 20px',
    color: 'rgba(255,255,255,0.5)',
  },
  heroStats: {
    display: 'flex',
    gap: '32px',
    marginTop: '24px',
  },
  heroStat: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  heroStatValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#ffffff',
  },
  heroStatLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  // Pill Filters
  pillBar: {
    padding: '20px 64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    maxWidth: '100%',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    borderRadius: '24px',
    fontSize: '13px',
    fontWeight: '600',
    border: '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    },
  },
  pillActive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 18px',
    borderRadius: '24px',
    fontSize: '13px',
    fontWeight: '600',
    border: '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  pillDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
  },

  // Content area
  content: {
    padding: '32px 64px 48px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },
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
    padding: '80px',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    backgroundColor: '#fafbfc',
    borderRadius: '16px',
    border: '2px dashed #e5e7eb',
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

  // Count services per category for hero stats
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

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <Spinner size="large" />
          <Text>Loading service catalog...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero Banner */}
      <div className={styles.hero}>
        {/* Decorative circles (CSS pseudo-elements handled via inline) */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30,107,123,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30%',
            left: '10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,90,138,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div className={styles.heroContent}>
          <Button
            className={styles.heroBackButton}
            appearance="subtle"
            icon={<ArrowLeft24Regular />}
            onClick={() => navigate('/')}
            size="small"
          >
            Back to Home
          </Button>

          <Text className={styles.heroTitle} block>Service Catalog</Text>
          <Text className={styles.heroSubtitle} block>
            Explore Digital Workplace's full range of Microsoft 365 services.
            From Power Platform to Copilot Agents — find the right solution and request a pre-sales consultation.
          </Text>

          {/* Search Bar */}
          <div className={styles.heroSearchBar}>
            <div className={styles.heroSearchIcon}>
              <SearchRegular style={{ width: '20px', height: '20px' }} />
            </div>
            <input
              className={styles.heroSearchInput}
              placeholder="Search services by name, category, or keyword..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          {/* Stats */}
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
              <Text className={styles.heroStatValue}>{filteredServices.length}</Text>
              <Text className={styles.heroStatLabel}>Showing</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ padding: '16px 64px' }}>
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>Error</MessageBarTitle>
              {error}
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Pill Filters */}
      <div className={styles.pillBar}>
        {CATALOG_TABS.map((tab) => {
          const isActive = selectedTab === tab.id;
          const count = tab.id === 'Popular'
            ? services.filter(s => s.IsPopular || POPULAR_TITLES.has(s.Title)).length
            : tab.id === 'All'
            ? services.length
            : categoryCounts.get(tab.id) || 0;

          return (
            <span
              key={tab.id}
              className={isActive ? styles.pillActive : styles.pill}
              style={isActive ? { backgroundColor: tab.color } : undefined}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.id !== 'Popular' && tab.id !== 'All' && (
                <span
                  className={styles.pillDot}
                  style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.5)' : tab.color }}
                />
              )}
              {tab.id === 'Popular' && <StarRegular style={{ width: '14px', height: '14px' }} />}
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  opacity: isActive ? 0.8 : 0.6,
                  marginLeft: '2px',
                }}>
                  ({count})
                </span>
              )}
            </span>
          );
        })}
      </div>

      {/* Content */}
      <div className={styles.content}>
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
      </div>

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
