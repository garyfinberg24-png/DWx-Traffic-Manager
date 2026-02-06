/**
 * DWx Traffic Manager - Service Catalog Component
 * Tabbed grid view of all available DW services with Popular default filter
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Spinner,
  SearchBox,
  Button,
  makeStyles,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  SearchRegular,
  FilterRegular,
  GridRegular,
  ArrowLeft24Regular,
  StarRegular,
} from '@fluentui/react-icons';
import { DWService, ServiceCategory } from '../../types/ServiceRequest';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { ServiceCard } from './ServiceCard';
import { ServiceDetails } from './ServiceDetails';
import { ServiceDetailModal } from './ServiceDetailModal';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '24px 64px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
  backButton: {
    minWidth: 'auto',
  },
  tabBar: {
    borderBottom: '1px solid #e0e0e0',
    overflowX: 'auto',
  },
  toolbar: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    minWidth: '280px',
    flex: '1 1 280px',
    maxWidth: '400px',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
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
  },
});

// Popular services — shown in the default "Popular" tab
const POPULAR_TITLES = new Set([
  'Power Platform Development',
  'SPFx Development',
  'Enterprise Copilot Agents',
  'Zero to AI Copilot Chat Hero',
  'Proposal Development',
  'Ad-Hoc Technical Support',
]);

type CatalogTab = 'Popular' | 'All' | ServiceCategory;

const CATALOG_TABS: CatalogTab[] = [
  'Popular',
  'All',
  'Power Platform',
  'SPFx Development',
  'SharePoint Migration',
  'M365 Assessment',
  'Copilot Agents',
  'MS Viva',
  'Training',
  'Proposal',
  'Tender',
  'Ad-Hoc Support',
  'SLA',
  'Strategic Advisory',
];

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
  const [selectedTab, setSelectedTab] = useState<CatalogTab>('Popular');
  const [selectedService, setSelectedService] = useState<DWService | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [fullDetailsService, setFullDetailsService] = useState<DWService | null>(null);
  const [isFullDetailsOpen, setIsFullDetailsOpen] = useState(false);

  // Load services on mount
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

  // Filter services based on search and selected tab
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Tab filter
      if (selectedTab === 'Popular') {
        if (!service.IsPopular && !POPULAR_TITLES.has(service.Title)) {
          return false;
        }
      } else if (selectedTab !== 'All') {
        if (service.Category !== selectedTab) {
          return false;
        }
      }

      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        return (
          service.Title.toLowerCase().includes(searchLower) ||
          service.Description.toLowerCase().includes(searchLower) ||
          service.ShortDescription.toLowerCase().includes(searchLower) ||
          service.Category.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [services, selectedTab, searchText]);

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

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as CatalogTab);
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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Text className={styles.title}>Service Catalog</Text>
          <Text className={styles.subtitle}>
            Explore Digital Workplace's range of Microsoft 365 services and request pre-sales consultations
          </Text>
        </div>
        <Button
          appearance="secondary"
          icon={<ArrowLeft24Regular />}
          onClick={() => navigate('/')}
          className={styles.backButton}
        >
          Back to Home
        </Button>
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

      {/* Category Tabs */}
      <div className={styles.tabBar}>
        <TabList
          selectedValue={selectedTab}
          onTabSelect={handleTabSelect}
          size="small"
        >
          {CATALOG_TABS.map((tab) => (
            <Tab
              key={tab}
              value={tab}
              icon={tab === 'Popular' ? <StarRegular /> : undefined}
            >
              {tab}
            </Tab>
          ))}
        </TabList>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <SearchBox
          className={styles.searchBox}
          placeholder="Search services..."
          value={searchText}
          onChange={(_, data) => setSearchText(data.value)}
          contentBefore={<SearchRegular />}
        />
        <span className={styles.resultsInfo}>
          <GridRegular style={{ width: '16px', height: '16px' }} />
          {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'} found
        </span>
      </div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className={styles.grid}>
          {filteredServices.map((service) => (
            <ServiceCard key={service.Id} service={service} onClick={handleServiceClick} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <FilterRegular className={styles.emptyIcon} />
          <Text className={styles.emptyTitle}>No services found</Text>
          <Text className={styles.emptyText}>
            {searchText || selectedTab !== 'All'
              ? 'Try adjusting your search or filter criteria'
              : 'No services are currently available'}
          </Text>
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
