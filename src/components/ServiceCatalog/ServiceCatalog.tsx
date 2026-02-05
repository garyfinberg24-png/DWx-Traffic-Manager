/**
 * DWx Traffic Manager - Service Catalog Component
 * Grid view of all available DW services with filtering by category
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Text,
  Spinner,
  SearchBox,
  Button,
  makeStyles,
  shorthands,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  SearchRegular,
  FilterRegular,
  GridRegular,
  ArrowLeft24Regular,
} from '@fluentui/react-icons';
import { DWService, ServiceCategory } from '../../types/ServiceRequest';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { ServiceCard } from './ServiceCard';
import { ServiceDetails } from './ServiceDetails';

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
  categoryFilter: {
    minWidth: '200px',
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
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
  categoryChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  categoryChip: {
    ...shorthands.padding('6px', '12px'),
    ...shorthands.borderRadius('16px'),
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '0.2s',
    transitionTimingFunction: 'ease',
    ...shorthands.border('1px', 'solid', '#d0d0d0'),
    backgroundColor: 'white',
    color: '#424242',
  },
  categoryChipActive: {
    backgroundColor: '#1e6b7b',
    color: 'white',
    ...shorthands.border('1px', 'solid', '#1e6b7b'),
  },
});

const ALL_CATEGORIES: ('All' | ServiceCategory)[] = [
  'All',
  'Power Platform',
  'SPFx Development',
  'SharePoint Migration',
  'M365 Assessment',
  'Copilot Agents',
  'MS Viva',
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
  const [selectedCategory, setSelectedCategory] = useState<'All' | ServiceCategory>('All');
  const [selectedService, setSelectedService] = useState<DWService | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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

  // Filter services based on search and category
  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Category filter
      if (selectedCategory !== 'All' && service.Category !== selectedCategory) {
        return false;
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
  }, [services, selectedCategory, searchText]);

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
    if (onRequestService) {
      onRequestService(service);
    } else {
      // Navigate to the service request form with the selected service
      navigate('/request', { state: { preSelectedService: service } });
    }
  };

  const handleCategoryClick = (category: 'All' | ServiceCategory) => {
    setSelectedCategory(category);
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

      {/* Category Chips */}
      <div className={styles.categoryChips}>
        {ALL_CATEGORIES.map((category) => (
          <span
            key={category}
            className={`${styles.categoryChip} ${selectedCategory === category ? styles.categoryChipActive : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </span>
        ))}
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
            {searchText || selectedCategory !== 'All'
              ? 'Try adjusting your search or filter criteria'
              : 'No services are currently available'}
          </Text>
        </div>
      )}

      {/* Service Details Modal */}
      {selectedService && (
        <ServiceDetails
          service={selectedService}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
          onRequestService={handleRequestService}
        />
      )}
    </div>
  );
};
