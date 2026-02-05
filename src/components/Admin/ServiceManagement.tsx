import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Text,
  Button,
  Badge,
  makeStyles,
  tokens,
  Spinner,
  SearchBox,
  Dropdown,
  Option,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  MoreHorizontal24Regular,
  ArrowUpload24Regular,
  EyeOff24Regular,
  Eye24Regular,
  Apps24Regular,
} from '@fluentui/react-icons';
import {
  DWService,
  DWServiceInput,
  ServiceCategory,
  ServiceComplexity,
} from '../../types/ServiceRequest';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { auditService } from '../../services/AuditService';
import { ServiceForm } from './ServiceForm';
import { ImportServicesDialog } from './ImportServicesDialog';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../Common/ConfirmDialog';

const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Power Platform', 'SPFx Development', 'SharePoint Migration',
  'M365 Assessment', 'Copilot Agents', 'MS Viva', 'Training',
];

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  filters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    minWidth: '250px',
  },
  categoryFilter: {
    minWidth: '180px',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
  },
  colTitle: { width: '200px' },
  colCategory: { width: '140px' },
  colDuration: { width: '100px' },
  colComplexity: { width: '110px' },
  colPricing: { width: '120px' },
  colPrice: { width: '110px' },
  colActive: { width: '80px' },
  colActions: { width: '70px' },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalM,
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
  },
});

const getComplexityColor = (level: ServiceComplexity): 'success' | 'warning' | 'danger' | 'informative' => {
  switch (level) {
    case 'Low': return 'success';
    case 'Medium': return 'warning';
    case 'High': return 'danger';
    case 'Enterprise': return 'informative';
    default: return 'informative';
  }
};

const formatPrice = (price?: number): string => {
  if (!price) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const ServiceManagement: React.FC = () => {
  const styles = useStyles();
  const { showToast } = useToast();

  const [services, setServices] = useState<DWService[]>([]);
  const [filteredServices, setFilteredServices] = useState<DWService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<DWService | null>(null);
  const [deletingService, setDeletingService] = useState<DWService | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await serviceCatalogService.getServices(false); // Include inactive
      setServices(items);
    } catch (error) {
      showToast('Failed to load services', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    let result = services;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.Title.toLowerCase().includes(query) ||
          s.Description.toLowerCase().includes(query) ||
          s.Category.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((s) => s.Category === categoryFilter);
    }

    setFilteredServices(result);
  }, [services, searchQuery, categoryFilter]);

  const handleCreate = async (data: DWServiceInput) => {
    try {
      setIsSaving(true);
      const created = await serviceCatalogService.createService(data);
      await auditService.logCreate('Service', created.Id, created.Title, data as unknown as Record<string, unknown>);
      showToast('Service created successfully', 'success');
      await loadServices();
    } catch (error) {
      showToast('Failed to create service', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: DWServiceInput) => {
    if (!editingService) return;
    try {
      setIsSaving(true);
      await serviceCatalogService.updateService(editingService.Id, data);
      await auditService.logUpdate(
        'Service',
        editingService.Id,
        data.Title,
        editingService as unknown as Record<string, unknown>,
        data as unknown as Record<string, unknown>
      );
      showToast('Service updated successfully', 'success');
      await loadServices();
    } catch (error) {
      showToast('Failed to update service', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (service: DWService) => {
    try {
      setIsSaving(true);
      await serviceCatalogService.updateService(service.Id, { IsActive: !service.IsActive });
      await auditService.logUpdate(
        'Service',
        service.Id,
        service.Title,
        { IsActive: service.IsActive },
        { IsActive: !service.IsActive }
      );
      showToast(
        `Service ${service.IsActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
      await loadServices();
    } catch (error) {
      showToast('Failed to update service status', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingService) return;
    try {
      setIsSaving(true);
      await serviceCatalogService.deleteService(deletingService.Id);
      await auditService.logDelete(
        'Service',
        deletingService.Id,
        deletingService.Title,
        deletingService as unknown as Record<string, unknown>
      );
      showToast('Service deleted successfully', 'success');
      await loadServices();
    } catch (error) {
      showToast('Failed to delete service', 'error');
    } finally {
      setIsSaving(false);
      setDeletingService(null);
    }
  };

  const openCreateForm = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const openEditForm = (service: DWService) => {
    setEditingService(service);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" label="Loading services..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.filters}>
          <SearchBox
            className={styles.searchBox}
            placeholder="Search by name, description, or category..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
          />
          <Dropdown
            className={styles.categoryFilter}
            placeholder="Filter by category"
            value={categoryFilter === 'all' ? 'All Categories' : categoryFilter}
            selectedOptions={[categoryFilter]}
            onOptionSelect={(_, data) => setCategoryFilter(data.optionValue || 'all')}
          >
            <Option value="all">All Categories</Option>
            {SERVICE_CATEGORIES.map((cat) => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Dropdown>
        </div>
        <div className={styles.actions}>
          <Button
            appearance="outline"
            icon={<ArrowUpload24Regular />}
            onClick={() => setIsImportOpen(true)}
          >
            Import
          </Button>
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={openCreateForm}
          >
            Add Service
          </Button>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <Card className={styles.emptyState}>
          <Apps24Regular style={{ fontSize: 48, color: tokens.colorNeutralForeground3 }} />
          <Text size={400} weight="semibold">
            No services found
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Click "Add Service" to create your first service, or "Import" to bulk-add from a spreadsheet'}
          </Text>
        </Card>
      ) : (
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={styles.colTitle}>Service</TableHeaderCell>
              <TableHeaderCell className={styles.colCategory}>Category</TableHeaderCell>
              <TableHeaderCell className={styles.colDuration}>Duration</TableHeaderCell>
              <TableHeaderCell className={styles.colComplexity}>Complexity</TableHeaderCell>
              <TableHeaderCell className={styles.colPricing}>Pricing</TableHeaderCell>
              <TableHeaderCell className={styles.colPrice}>Price</TableHeaderCell>
              <TableHeaderCell className={styles.colActive}>Status</TableHeaderCell>
              <TableHeaderCell className={styles.colActions}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow key={service.Id}>
                <TableCell className={styles.colTitle}>
                  <TableCellLayout>
                    <Text weight="semibold">{service.Title}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell className={styles.colCategory}>
                  <Badge appearance="tint" color="brand">
                    {service.Category}
                  </Badge>
                </TableCell>
                <TableCell className={styles.colDuration}>
                  <Text size={200}>{service.TypicalDuration}</Text>
                </TableCell>
                <TableCell className={styles.colComplexity}>
                  <Badge appearance="tint" color={getComplexityColor(service.ComplexityLevel)}>
                    {service.ComplexityLevel}
                  </Badge>
                </TableCell>
                <TableCell className={styles.colPricing}>
                  <Text size={200}>{service.PricingModel}</Text>
                </TableCell>
                <TableCell className={styles.colPrice}>
                  <Text size={200}>{formatPrice(service.BasePrice)}</Text>
                </TableCell>
                <TableCell className={styles.colActive}>
                  <Badge
                    appearance="filled"
                    color={service.IsActive ? 'success' : 'danger'}
                  >
                    {service.IsActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className={styles.colActions}>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button
                        appearance="subtle"
                        icon={<MoreHorizontal24Regular />}
                        size="small"
                      />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem
                          icon={<Edit24Regular />}
                          onClick={() => openEditForm(service)}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          icon={service.IsActive ? <EyeOff24Regular /> : <Eye24Regular />}
                          onClick={() => handleToggleActive(service)}
                        >
                          {service.IsActive ? 'Deactivate' : 'Activate'}
                        </MenuItem>
                        <MenuItem
                          icon={<Delete24Regular />}
                          onClick={() => setDeletingService(service)}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ServiceForm
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={editingService ? handleUpdate : handleCreate}
        service={editingService}
        isLoading={isSaving}
      />

      <ImportServicesDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={loadServices}
      />

      <ConfirmDialog
        open={!!deletingService}
        title="Delete Service"
        message={`Are you sure you want to delete "${deletingService?.Title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmAppearance="primary"
        onConfirm={handleDelete}
        onCancel={() => setDeletingService(null)}
        isLoading={isSaving}
      />
    </div>
  );
};
