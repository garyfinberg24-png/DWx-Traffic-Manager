/**
 * DWx Traffic Manager - Delivery Resource Management
 * Admin CRUD list for managing delivery resources (developers, PMs, BAs, etc.)
 * Mirrors SpecialistManagement pattern with Entra ID picker integration.
 * v2.16.0
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button, Text, Badge, makeStyles, tokens, Spinner, SearchBox, Dropdown, Option,
  Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, TableCellLayout, Avatar,
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  Card,
} from '@fluentui/react-components';
import {
  Add24Regular, Edit24Regular, Delete24Regular, MoreHorizontal24Regular,
  Person24Regular, PersonProhibited24Regular, PersonAvailable24Regular,
  Mail24Regular, Phone24Regular,
} from '@fluentui/react-icons';
import {
  deliveryResourceService,
} from '../../services/DeliveryResourceService';
import type { CreateDeliveryResourceInput, UpdateDeliveryResourceInput } from '../../services/DeliveryResourceService';
import { type DeliveryResource, type DeliveryRole, DELIVERY_ROLES, DELIVERY_ROLE_COLORS } from '../../types/DeliveryHandover';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { Pagination, usePagination } from '../Common/Pagination';
import { DeliveryResourceForm } from './DeliveryResourceForm';

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
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
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
  roleFilter: {
    minWidth: '180px',
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  specializationChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
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
  // Column widths — percentages for responsive layout
  colName: { width: '16%' },
  colEmail: { width: '20%' },
  colRole: { width: '12%' },
  colSpecializations: { width: '20%' },
  colWorkload: { width: '10%' },
  colRate: { width: '8%' },
  colStatus: { width: '8%' },
  colActions: { width: '6%' },
});

const getRoleBadgeStyle = (role: DeliveryRole): React.CSSProperties => {
  const c = DELIVERY_ROLE_COLORS[role];
  return c
    ? { backgroundColor: c.bg, color: c.text, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }
    : {};
};

const UtilizationBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const color = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#10b981';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ width: '60px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{current}/{max}</span>
    </div>
  );
};

export const DeliveryResourceManagement: React.FC = () => {
  const styles = useStyles();
  const { showToast } = useToast();

  const [resources, setResources] = useState<DeliveryResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<DeliveryResource | null>(null);
  const [deactivatingResource, setDeactivatingResource] = useState<DeliveryResource | null>(null);
  const [deletingResource, setDeletingResource] = useState<DeliveryResource | null>(null);

  const loadResources = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await deliveryResourceService.getAllResources();
      setResources(data);
    } catch (error) {
      showToast('Failed to load delivery resources', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const filteredResources = useMemo(() => {
    let result = resources;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.Title.toLowerCase().includes(query) ||
          r.Email.toLowerCase().includes(query) ||
          r.Role.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== 'all') {
      result = result.filter((r) => r.Role === roleFilter);
    }

    return result;
  }, [resources, searchQuery, roleFilter]);

  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedResources,
    totalItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredResources, 20);

  const handleCreate = async (data: CreateDeliveryResourceInput) => {
    try {
      setIsSaving(true);
      await deliveryResourceService.createResource(data);
      showToast('Delivery resource created successfully', 'success');
      await loadResources();
    } catch (error) {
      showToast('Failed to create delivery resource', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: UpdateDeliveryResourceInput) => {
    if (!editingResource) return;
    try {
      setIsSaving(true);
      await deliveryResourceService.updateResource(editingResource.Id, data);
      showToast('Delivery resource updated successfully', 'success');
      await loadResources();
    } catch (error) {
      showToast('Failed to update delivery resource', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingResource) return;
    try {
      setIsSaving(true);
      if (deactivatingResource.CurrentProjectCount > 0) {
        showToast(
          `Warning: ${deactivatingResource.Title} has ${deactivatingResource.CurrentProjectCount} active project(s). Proceeding with deactivation.`,
          'warning'
        );
      }
      await deliveryResourceService.updateResource(deactivatingResource.Id, { isActive: false });
      showToast('Delivery resource deactivated successfully', 'success');
      await loadResources();
    } catch (error) {
      showToast('Failed to deactivate resource', 'error');
    } finally {
      setIsSaving(false);
      setDeactivatingResource(null);
    }
  };

  const handleActivate = async (resource: DeliveryResource) => {
    try {
      setIsSaving(true);
      await deliveryResourceService.updateResource(resource.Id, { isActive: true });
      showToast(`${resource.Title} activated successfully`, 'success');
      await loadResources();
    } catch (error) {
      showToast('Failed to activate resource', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResource) return;
    try {
      setIsSaving(true);
      await deliveryResourceService.deleteResource(deletingResource.Id);
      showToast('Delivery resource deleted', 'success');
      await loadResources();
    } catch (error) {
      showToast('Failed to delete resource', 'error');
    } finally {
      setIsSaving(false);
      setDeletingResource(null);
    }
  };

  const openCreateForm = () => {
    setEditingResource(null);
    setIsFormOpen(true);
  };

  const openEditForm = (resource: DeliveryResource) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingResource(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" label="Loading delivery resources..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.filters}>
          <div className={styles.headerTitle}>
            <Text size={500} weight="semibold">
              Delivery Resource Management
            </Text>
            <Badge appearance="filled" color="informative">
              {resources.filter((r) => r.IsActive).length}
            </Badge>
          </div>
          <SearchBox
            className={styles.searchBox}
            placeholder="Search by name, email or role..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
          />
          <Dropdown
            className={styles.roleFilter}
            placeholder="Filter by role"
            value={roleFilter === 'all' ? 'All Roles' : roleFilter}
            selectedOptions={[roleFilter]}
            onOptionSelect={(_, data) => setRoleFilter(data.optionValue || 'all')}
          >
            <Option value="all">All Roles</Option>
            {DELIVERY_ROLES.map((role) => (
              <Option key={role} value={role}>
                {role}
              </Option>
            ))}
          </Dropdown>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button appearance="primary" icon={<Add24Regular />} onClick={openCreateForm}>
            Add Resource
          </Button>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <Card className={styles.emptyState}>
          <Person24Regular style={{ fontSize: 48, color: tokens.colorNeutralForeground3 }} />
          <Text size={400} weight="semibold">
            No delivery resources found
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {searchQuery || roleFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first delivery resource to get started'}
          </Text>
          {!searchQuery && roleFilter === 'all' && (
            <Button appearance="primary" icon={<Add24Regular />} onClick={openCreateForm}>
              Add your first resource
            </Button>
          )}
        </Card>
      ) : (
        <>
          <Table className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={styles.colName}>Name</TableHeaderCell>
                <TableHeaderCell className={styles.colEmail}>Email</TableHeaderCell>
                <TableHeaderCell className={styles.colRole}>Role</TableHeaderCell>
                <TableHeaderCell className={styles.colSpecializations}>Specializations</TableHeaderCell>
                <TableHeaderCell className={styles.colWorkload}>Workload</TableHeaderCell>
                <TableHeaderCell className={styles.colRate}>Rate</TableHeaderCell>
                <TableHeaderCell className={styles.colStatus}>Status</TableHeaderCell>
                <TableHeaderCell className={styles.colActions}>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResources.map((resource) => (
                <TableRow key={resource.Id}>
                  <TableCell className={styles.colName}>
                    <TableCellLayout
                      media={
                        <Avatar
                          name={resource.Title}
                          color="colorful"
                          size={32}
                        />
                      }
                    >
                      <Text weight="semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {resource.Title}
                      </Text>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell className={styles.colEmail} style={{ overflow: 'hidden' }}>
                    <div className={styles.contactItem} style={{ overflow: 'hidden' }}>
                      <Mail24Regular style={{ fontSize: 14, flexShrink: 0 }} />
                      <Text size={200} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {resource.Email}
                      </Text>
                    </div>
                    {resource.Phone && (
                      <div className={styles.contactItem}>
                        <Phone24Regular style={{ fontSize: 14, flexShrink: 0 }} />
                        <Text size={200}>{resource.Phone}</Text>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={styles.colRole}>
                    <span style={getRoleBadgeStyle(resource.Role)}>{resource.Role}</span>
                  </TableCell>
                  <TableCell className={styles.colSpecializations}>
                    <div className={styles.specializationChips}>
                      {resource.Specializations.length > 0
                        ? resource.Specializations.map((spec) => (
                            <Badge key={spec} appearance="outline" size="small">
                              {spec}
                            </Badge>
                          ))
                        : <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>-</Text>
                      }
                    </div>
                  </TableCell>
                  <TableCell className={styles.colWorkload}>
                    <UtilizationBar
                      current={resource.CurrentProjectCount}
                      max={resource.MaxConcurrentProjects}
                    />
                  </TableCell>
                  <TableCell className={styles.colRate}>
                    <Text size={200}>
                      {resource.HourlyRate ? `R${resource.HourlyRate}/hr` : '-'}
                    </Text>
                  </TableCell>
                  <TableCell className={styles.colStatus}>
                    <Badge
                      appearance="filled"
                      color={resource.IsActive ? 'success' : 'danger'}
                    >
                      {resource.IsActive ? 'Active' : 'Inactive'}
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
                            onClick={() => openEditForm(resource)}
                          >
                            Edit
                          </MenuItem>
                          {resource.IsActive ? (
                            <MenuItem
                              icon={<PersonProhibited24Regular />}
                              onClick={() => setDeactivatingResource(resource)}
                            >
                              Deactivate
                            </MenuItem>
                          ) : (
                            <MenuItem
                              icon={<PersonAvailable24Regular />}
                              onClick={() => handleActivate(resource)}
                            >
                              Activate
                            </MenuItem>
                          )}
                          <MenuItem
                            icon={<Delete24Regular />}
                            onClick={() => setDeletingResource(resource)}
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
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <DeliveryResourceForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={(editingResource ? handleUpdate : handleCreate) as (data: CreateDeliveryResourceInput | UpdateDeliveryResourceInput) => Promise<void>}
        editingResource={editingResource}
        isLoading={isSaving}
      />

      <ConfirmDialog
        open={!!deactivatingResource}
        title="Deactivate Delivery Resource"
        message={`Are you sure you want to deactivate "${deactivatingResource?.Title}"? They will no longer be available for new project assignments.`}
        confirmLabel="Deactivate"
        confirmAppearance="primary"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivatingResource(null)}
        isLoading={isSaving}
      />

      <ConfirmDialog
        open={!!deletingResource}
        title="Delete Delivery Resource"
        message={`Are you sure you want to permanently delete "${deletingResource?.Title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmAppearance="primary"
        intent="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingResource(null)}
        isLoading={isSaving}
      />
    </div>
  );
};
