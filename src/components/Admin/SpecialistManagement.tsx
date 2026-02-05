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
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  PersonProhibited24Regular,
  MoreHorizontal24Regular,
  Person24Regular,
  Mail24Regular,
  Phone24Regular,
} from '@fluentui/react-icons';
import { Specialist, SpecialistInput, SpecialistRole } from '../../types/ServiceRequest';
import { specialistService } from '../../services/SpecialistService';
import { auditService } from '../../services/AuditService';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { SpecialistForm } from './SpecialistForm';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../Common/ConfirmDialog';

const SPECIALIST_ROLES: SpecialistRole[] = ['Solution Architect', 'Technical Specialist', 'Consultant'];

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
  roleBadge: {
    textTransform: 'capitalize',
  },
  // Column width styles
  colName: {
    width: '170px',
  },
  colEmail: {
    width: '220px',
  },
  colRole: {
    width: '150px',
  },
  colSpecializations: {
    width: '240px',
  },
  colWorkload: {
    width: '110px',
  },
  colStatus: {
    width: '90px',
  },
  colActions: {
    width: '70px',
  },
});

const getRoleBadgeColor = (role: SpecialistRole): 'brand' | 'success' | 'informative' | 'warning' | 'danger' => {
  switch (role) {
    case 'Solution Architect':
      return 'brand';
    case 'Technical Specialist':
      return 'success';
    case 'Consultant':
      return 'informative';
    default:
      return 'informative';
  }
};

export const SpecialistManagement: React.FC = () => {
  const styles = useStyles();
  const { showToast } = useToast();

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<Specialist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] = useState<Specialist | null>(null);
  const [deactivatingSpecialist, setDeactivatingSpecialist] = useState<Specialist | null>(null);

  const loadSpecialists = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await specialistService.getSpecialists(false); // Load all, including inactive
      setSpecialists(data);
    } catch (error) {
      showToast('Failed to load specialists', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSpecialists();
  }, [loadSpecialists]);

  useEffect(() => {
    let result = specialists;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.Title.toLowerCase().includes(query) ||
          s.Email.toLowerCase().includes(query)
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter((s) => s.Role === roleFilter);
    }

    setFilteredSpecialists(result);
  }, [specialists, searchQuery, roleFilter]);

  const handleCreate = async (data: SpecialistInput) => {
    try {
      setIsSaving(true);
      const created = await specialistService.createSpecialist(data);
      await auditService.logCreate('Specialist', created.Id, created.Title, {
        Email: data.Email,
        Role: data.Role,
        Specializations: data.Specializations,
        MaxConcurrentDeals: data.MaxConcurrentDeals,
      });
      showToast('Specialist created successfully', 'success');
      await loadSpecialists();
    } catch (error) {
      showToast('Failed to create specialist', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: SpecialistInput) => {
    if (!editingSpecialist) return;
    try {
      setIsSaving(true);
      await specialistService.updateSpecialist(editingSpecialist.Id, data);
      await auditService.logUpdate(
        'Specialist',
        editingSpecialist.Id,
        editingSpecialist.Title,
        {
          Email: editingSpecialist.Email,
          Role: editingSpecialist.Role,
          Specializations: editingSpecialist.Specializations,
          MaxConcurrentDeals: editingSpecialist.MaxConcurrentDeals,
          IsActive: editingSpecialist.IsActive,
        },
        {
          Email: data.Email,
          Role: data.Role,
          Specializations: data.Specializations,
          MaxConcurrentDeals: data.MaxConcurrentDeals,
          IsActive: data.IsActive,
        }
      );
      showToast('Specialist updated successfully', 'success');
      await loadSpecialists();
    } catch (error) {
      showToast('Failed to update specialist', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingSpecialist) return;
    try {
      setIsSaving(true);

      // Check for active deals
      const allRequests = await serviceRequestService.getRequests();
      const activeDeals = allRequests.filter(
        (r) =>
          r.AssignedSpecialistEmail === deactivatingSpecialist.Email &&
          r.FunnelStage !== 'Won' &&
          r.FunnelStage !== 'Lost'
      );

      if (activeDeals.length > 0) {
        showToast(
          `Warning: ${deactivatingSpecialist.Title} has ${activeDeals.length} active deal(s). Proceeding with deactivation.`,
          'warning'
        );
      }

      await specialistService.deactivateSpecialist(deactivatingSpecialist.Id);
      await auditService.logUpdate(
        'Specialist',
        deactivatingSpecialist.Id,
        deactivatingSpecialist.Title,
        { IsActive: true },
        { IsActive: false }
      );
      showToast('Specialist deactivated successfully', 'success');
      await loadSpecialists();
    } catch (error) {
      showToast('Failed to deactivate specialist', 'error');
    } finally {
      setIsSaving(false);
      setDeactivatingSpecialist(null);
    }
  };

  const openCreateForm = () => {
    setEditingSpecialist(null);
    setIsFormOpen(true);
  };

  const openEditForm = (specialist: Specialist) => {
    setEditingSpecialist(specialist);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSpecialist(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" label="Loading specialists..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.filters}>
          <div className={styles.headerTitle}>
            <Text size={500} weight="semibold">
              Specialist Management
            </Text>
            <Badge appearance="filled" color="informative">
              {specialists.length}
            </Badge>
          </div>
          <SearchBox
            className={styles.searchBox}
            placeholder="Search by name or email..."
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
            {SPECIALIST_ROLES.map((role) => (
              <Option key={role} value={role}>
                {role}
              </Option>
            ))}
          </Dropdown>
        </div>
        <Button appearance="primary" icon={<Add24Regular />} onClick={openCreateForm}>
          Add Specialist
        </Button>
      </div>

      {filteredSpecialists.length === 0 ? (
        <Card className={styles.emptyState}>
          <Person24Regular style={{ fontSize: 48, color: tokens.colorNeutralForeground3 }} />
          <Text size={400} weight="semibold">
            No specialists found
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {searchQuery || roleFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first specialist to get started'}
          </Text>
          {!searchQuery && roleFilter === 'all' && (
            <Button appearance="primary" icon={<Add24Regular />} onClick={openCreateForm}>
              Add your first specialist
            </Button>
          )}
        </Card>
      ) : (
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={styles.colName}>Name</TableHeaderCell>
              <TableHeaderCell className={styles.colEmail}>Email</TableHeaderCell>
              <TableHeaderCell className={styles.colRole}>Role</TableHeaderCell>
              <TableHeaderCell className={styles.colSpecializations}>Specializations</TableHeaderCell>
              <TableHeaderCell className={styles.colWorkload}>Workload</TableHeaderCell>
              <TableHeaderCell className={styles.colStatus}>Status</TableHeaderCell>
              <TableHeaderCell className={styles.colActions}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSpecialists.map((specialist) => (
              <TableRow key={specialist.Id}>
                <TableCell className={styles.colName}>
                  <TableCellLayout
                    media={
                      <Avatar
                        name={specialist.Title}
                        color="colorful"
                        size={32}
                      />
                    }
                  >
                    <Text weight="semibold">{specialist.Title}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell className={styles.colEmail}>
                  <div className={styles.contactItem}>
                    <Mail24Regular style={{ fontSize: 14 }} />
                    <Text size={200}>{specialist.Email}</Text>
                  </div>
                  {specialist.Phone && (
                    <div className={styles.contactItem}>
                      <Phone24Regular style={{ fontSize: 14 }} />
                      <Text size={200}>{specialist.Phone}</Text>
                    </div>
                  )}
                </TableCell>
                <TableCell className={styles.colRole}>
                  <Badge
                    appearance="tint"
                    color={getRoleBadgeColor(specialist.Role)}
                    className={styles.roleBadge}
                  >
                    {specialist.Role}
                  </Badge>
                </TableCell>
                <TableCell className={styles.colSpecializations}>
                  <div className={styles.specializationChips}>
                    {specialist.Specializations.map((spec) => (
                      <Badge
                        key={spec}
                        appearance="outline"
                        size="small"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className={styles.colWorkload}>
                  <Text>
                    {specialist.CurrentDealCount} / {specialist.MaxConcurrentDeals}
                  </Text>
                </TableCell>
                <TableCell className={styles.colStatus}>
                  <Badge
                    appearance="filled"
                    color={specialist.IsActive ? 'success' : 'danger'}
                  >
                    {specialist.IsActive ? 'Active' : 'Inactive'}
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
                          onClick={() => openEditForm(specialist)}
                        >
                          Edit
                        </MenuItem>
                        {specialist.IsActive && (
                          <MenuItem
                            icon={<PersonProhibited24Regular />}
                            onClick={() => setDeactivatingSpecialist(specialist)}
                          >
                            Deactivate
                          </MenuItem>
                        )}
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SpecialistForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingSpecialist ? handleUpdate : handleCreate}
        editingSpecialist={editingSpecialist}
        isLoading={isSaving}
      />

      <ConfirmDialog
        open={!!deactivatingSpecialist}
        title="Deactivate Specialist"
        message={`Are you sure you want to deactivate "${deactivatingSpecialist?.Title}"? They will no longer be available for new assignments.`}
        confirmLabel="Deactivate"
        confirmAppearance="primary"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivatingSpecialist(null)}
        isLoading={isSaving}
      />
    </div>
  );
};
