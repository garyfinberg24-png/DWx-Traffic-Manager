import React, { useState, useEffect, useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Dropdown,
  Option,
  Spinner,
  Card,
  CardHeader,
  Avatar,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Field,
  Textarea,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Search24Regular,
  Edit24Regular,
  Delete24Regular,
  MoreHorizontal24Regular,
  Person24Regular,
  Mail24Regular,
  Building24Regular,
  Phone24Regular,
  Globe24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  PersonAdd24Regular,
  ArrowSync24Regular,
  PeopleTeam24Regular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';
import { accountManagerService } from '../../services/AccountManagerService';
import {
  AccountManager,
  AccountManagerInput,
  AccountManagerStatus,
  AccountManagerRegion,
  AccountManagerSource,
  ACCOUNT_MANAGER_STATUSES,
  ACCOUNT_MANAGER_REGIONS,
  ACCOUNT_MANAGER_SOURCES,
  EntraUser,
} from '../../types/ReferenceData';
import { EntraUserPicker } from './EntraUserPicker';

const useStyles = makeStyles({
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  filtersRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  searchInput: {
    minWidth: '280px',
  },
  filterDropdown: {
    minWidth: '150px',
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    flex: 1,
    minWidth: '150px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    textAlign: 'center',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: tokens.colorBrandForeground1,
  },
  statLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
  },
  tableContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    overflow: 'hidden',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  table: {
    width: '100%',
  },
  statusBadge: {
    marginLeft: '8px',
  },
  sourceBadge: {
    marginLeft: '8px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: tokens.colorNeutralForeground3,
  },
  dialogSurface: {
    maxWidth: '600px',
    width: '100%',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  entraUserCard: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
  },
  entraUserHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  userInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
});

type ViewTab = 'all' | 'internal' | 'external';

interface AccountManagerManagementProps {
  onNavigateToGuestInvitations?: () => void;
}

export const AccountManagerManagement: React.FC<AccountManagerManagementProps> = ({
  onNavigateToGuestInvitations,
}) => {
  const styles = useStyles();

  // State
  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountManagerStatus | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<AccountManagerRegion | 'all'>('all');
  const [activeTab, setActiveTab] = useState<ViewTab>('all');

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEntraPicker, setShowEntraPicker] = useState(false);
  const [selectedManager, setSelectedManager] = useState<AccountManager | null>(null);

  // Form state
  const [formData, setFormData] = useState<AccountManagerInput>({
    Title: '',
    Email: '',
    Status: 'Active',
    Source: 'Internal',
  });
  const [selectedEntraUser, setSelectedEntraUser] = useState<EntraUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load account managers
  const loadAccountManagers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const managers = await accountManagerService.getAccountManagers();
      setAccountManagers(managers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account managers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccountManagers();
  }, [loadAccountManagers]);

  // Filter managers
  const filteredManagers = accountManagers.filter((am) => {
    // Tab filter
    if (activeTab === 'internal' && am.Source !== 'Internal') return false;
    if (activeTab === 'external' && am.Source === 'Internal') return false;

    // Search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      if (
        !am.Title.toLowerCase().includes(search) &&
        !am.Email.toLowerCase().includes(search) &&
        !(am.Company?.toLowerCase().includes(search))
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && am.Status !== statusFilter) return false;

    // Region filter
    if (regionFilter !== 'all' && am.Region !== regionFilter) return false;

    return true;
  });

  // Stats
  const stats = {
    total: accountManagers.length,
    active: accountManagers.filter((am) => am.Status === 'Active').length,
    internal: accountManagers.filter((am) => am.Source === 'Internal').length,
    external: accountManagers.filter((am) => am.Source !== 'Internal').length,
  };

  // Handle Entra user selection
  const handleEntraUserSelect = (
    user: EntraUser | null,
    isExternal?: boolean,
    manualEntry?: Partial<EntraUser>
  ) => {
    if (manualEntry) {
      // Manual entry for external user
      setFormData((prev) => ({
        ...prev,
        Title: manualEntry.displayName || '',
        Email: manualEntry.mail || manualEntry.userPrincipalName || '',
        JobTitle: manualEntry.jobTitle || '',
        Source: 'External',
      }));
      setSelectedEntraUser(null);
    } else if (user) {
      setSelectedEntraUser(user);
      setFormData((prev) => ({
        ...prev,
        Title: user.displayName,
        Email: user.mail || user.userPrincipalName,
        Phone: user.businessPhones?.[0] || '',
        MobilePhone: user.mobilePhone || '',
        Department: user.department || '',
        JobTitle: user.jobTitle || '',
        EntraUserId: user.id,
        Source: isExternal ? 'Guest' : 'Internal',
      }));
    }
  };

  // Open add dialog
  const handleOpenAddDialog = () => {
    setFormData({
      Title: '',
      Email: '',
      Status: 'Active',
      Source: 'Internal',
    });
    setSelectedEntraUser(null);
    setFormError(null);
    setShowAddDialog(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (manager: AccountManager) => {
    setSelectedManager(manager);
    setFormData({
      Title: manager.Title,
      Email: manager.Email,
      Phone: manager.Phone,
      MobilePhone: manager.MobilePhone,
      Department: manager.Department,
      JobTitle: manager.JobTitle,
      Region: manager.Region,
      Status: manager.Status,
      Source: manager.Source,
      EntraUserId: manager.EntraUserId,
      ExternalTenant: manager.ExternalTenant,
      Company: manager.Company,
      ManagerEmail: manager.ManagerEmail,
      HireDate: manager.HireDate,
      Notes: manager.Notes,
    });
    setSelectedEntraUser(null);
    setFormError(null);
    setShowEditDialog(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (manager: AccountManager) => {
    setSelectedManager(manager);
    setShowDeleteDialog(true);
  };

  // Create account manager
  const handleCreate = async () => {
    if (!formData.Title.trim() || !formData.Email.trim()) {
      setFormError('Name and email are required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await accountManagerService.createAccountManager(formData);
      await loadAccountManagers();
      setShowAddDialog(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create account manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update account manager
  const handleUpdate = async () => {
    if (!selectedManager) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      await accountManagerService.updateAccountManager(selectedManager.Id, formData);
      await loadAccountManagers();
      setShowEditDialog(false);
      setSelectedManager(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update account manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete account manager
  const handleDelete = async () => {
    if (!selectedManager) return;

    setIsSubmitting(true);

    try {
      await accountManagerService.deleteAccountManager(selectedManager.Id);
      await loadAccountManagers();
      setShowDeleteDialog(false);
      setSelectedManager(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account manager');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as ViewTab);
  };

  const getStatusColor = (status: AccountManagerStatus): 'success' | 'warning' | 'danger' => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'On Leave':
        return 'warning';
      case 'Inactive':
        return 'danger';
      default:
        return 'warning';
    }
  };

  const getSourceColor = (source: AccountManagerSource): 'brand' | 'informative' | 'warning' => {
    switch (source) {
      case 'Internal':
        return 'brand';
      case 'External':
        return 'informative';
      case 'Guest':
        return 'warning';
      default:
        return 'informative';
    }
  };

  // Render form fields
  const renderFormFields = () => (
    <>
      {/* Entra User Picker Button */}
      {!selectedEntraUser && (
        <div className={styles.fullWidth}>
          <Button
            appearance="secondary"
            icon={<PersonAdd24Regular />}
            onClick={() => setShowEntraPicker(true)}
            style={{ width: '100%' }}
          >
            Browse Entra ID / Tenant Directory
          </Button>
        </div>
      )}

      {/* Selected Entra User Card */}
      {selectedEntraUser && (
        <div className={`${styles.entraUserCard} ${styles.fullWidth}`}>
          <div className={styles.entraUserHeader}>
            <Text weight="semibold">Selected from Directory</Text>
            <Button
              appearance="subtle"
              size="small"
              icon={<Dismiss24Regular />}
              onClick={() => {
                setSelectedEntraUser(null);
                setFormData((prev) => ({
                  ...prev,
                  EntraUserId: undefined,
                }));
              }}
            />
          </div>
          <Card>
            <CardHeader
              image={<Avatar name={selectedEntraUser.displayName} size={40} />}
              header={<Text weight="semibold">{selectedEntraUser.displayName}</Text>}
              description={selectedEntraUser.mail || selectedEntraUser.userPrincipalName}
            />
          </Card>
        </div>
      )}

      <Divider className={styles.fullWidth}>Account Manager Details</Divider>

      {/* Name */}
      <Field label="Full Name" required>
        <Input
          value={formData.Title}
          onChange={(_, d) => setFormData((prev) => ({ ...prev, Title: d.value }))}
          placeholder="e.g., John Smith"
          contentBefore={<Person24Regular />}
          disabled={isSubmitting}
        />
      </Field>

      {/* Email */}
      <Field label="Email" required>
        <Input
          type="email"
          value={formData.Email}
          onChange={(_, d) => setFormData((prev) => ({ ...prev, Email: d.value }))}
          placeholder="e.g., john@company.com"
          contentBefore={<Mail24Regular />}
          disabled={isSubmitting}
        />
      </Field>

      {/* Phone */}
      <Field label="Phone">
        <Input
          type="tel"
          value={formData.Phone || ''}
          onChange={(_, d) => setFormData((prev) => ({ ...prev, Phone: d.value }))}
          placeholder="e.g., +27 11 123 4567"
          contentBefore={<Phone24Regular />}
          disabled={isSubmitting}
        />
      </Field>

      {/* Mobile Phone */}
      <Field label="Mobile Phone">
        <Input
          type="tel"
          value={formData.MobilePhone || ''}
          onChange={(_, d) => setFormData((prev) => ({ ...prev, MobilePhone: d.value }))}
          placeholder="e.g., +27 82 123 4567"
          contentBefore={<Phone24Regular />}
          disabled={isSubmitting}
        />
      </Field>

      {/* Source */}
      <Field label="Source">
        <Dropdown
          value={formData.Source}
          selectedOptions={[formData.Source]}
          onOptionSelect={(_, d) =>
            setFormData((prev) => ({ ...prev, Source: d.optionValue as AccountManagerSource }))
          }
          disabled={isSubmitting}
        >
          {ACCOUNT_MANAGER_SOURCES.map((src) => (
            <Option key={src} value={src}>
              {src}
            </Option>
          ))}
        </Dropdown>
      </Field>

      {/* Status */}
      <Field label="Status">
        <Dropdown
          value={formData.Status}
          selectedOptions={[formData.Status]}
          onOptionSelect={(_, d) =>
            setFormData((prev) => ({ ...prev, Status: d.optionValue as AccountManagerStatus }))
          }
          disabled={isSubmitting}
        >
          {ACCOUNT_MANAGER_STATUSES.map((status) => (
            <Option key={status} value={status}>
              {status}
            </Option>
          ))}
        </Dropdown>
      </Field>

      {/* Company (for external) */}
      {formData.Source !== 'Internal' && (
        <Field label="Company">
          <Input
            value={formData.Company || ''}
            onChange={(_, d) => setFormData((prev) => ({ ...prev, Company: d.value }))}
            placeholder="e.g., Partner Company Ltd"
            contentBefore={<Building24Regular />}
            disabled={isSubmitting}
          />
        </Field>
      )}

      {/* External Tenant (for external) */}
      {formData.Source !== 'Internal' && (
        <Field label="External Tenant/Domain">
          <Input
            value={formData.ExternalTenant || ''}
            onChange={(_, d) => setFormData((prev) => ({ ...prev, ExternalTenant: d.value }))}
            placeholder="e.g., partner.com"
            contentBefore={<Globe24Regular />}
            disabled={isSubmitting}
          />
        </Field>
      )}

      {/* Department */}
      <Field label="Department">
        <Input
          value={formData.Department || ''}
          onChange={(_, d) => setFormData((prev) => ({ ...prev, Department: d.value }))}
          placeholder="e.g., Sales"
          contentBefore={<Building24Regular />}
          disabled={isSubmitting}
        />
      </Field>

      {/* Job Title */}
      <Field label="Job Title">
        <Input
          value={formData.JobTitle || ''}
          onChange={(_, d) => setFormData((prev) => ({ ...prev, JobTitle: d.value }))}
          placeholder="e.g., Senior Account Manager"
          disabled={isSubmitting}
        />
      </Field>

      {/* Region */}
      <Field label="Region">
        <Dropdown
          placeholder="Select region"
          value={formData.Region || ''}
          selectedOptions={formData.Region ? [formData.Region] : []}
          onOptionSelect={(_, d) =>
            setFormData((prev) => ({
              ...prev,
              Region: (d.optionValue as AccountManagerRegion) || undefined,
            }))
          }
          disabled={isSubmitting}
        >
          {ACCOUNT_MANAGER_REGIONS.map((region) => (
            <Option key={region} value={region}>
              {region}
            </Option>
          ))}
        </Dropdown>
      </Field>

      {/* Manager Email */}
      <Field label="Reports To (Email)">
        <Input
          type="email"
          value={formData.ManagerEmail || ''}
          onChange={(_, d) => setFormData((prev) => ({ ...prev, ManagerEmail: d.value }))}
          placeholder="e.g., manager@company.com"
          contentBefore={<Mail24Regular />}
          disabled={isSubmitting}
        />
      </Field>

      {/* Notes */}
      <Field label="Notes" className={styles.fullWidth}>
        <Textarea
          value={formData.Notes || ''}
          onChange={(_, d) => setFormData((prev) => ({ ...prev, Notes: d.value }))}
          placeholder="Additional notes..."
          rows={3}
          disabled={isSubmitting}
        />
      </Field>
    </>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <PeopleTeam24Regular style={{ width: '32px', height: '32px' }} />
          <div>
            <Text size={500} weight="semibold">
              Account Manager Management
            </Text>
            <Text size={200} style={{ display: 'block', color: tokens.colorNeutralForeground3 }}>
              Manage internal and external account managers
            </Text>
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button
            appearance="secondary"
            icon={<ArrowSync24Regular />}
            onClick={loadAccountManagers}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={handleOpenAddDialog}
          >
            Add Account Manager
          </Button>
          {onNavigateToGuestInvitations && (
            <Button
              appearance="secondary"
              icon={<PersonAdd24Regular />}
              onClick={onNavigateToGuestInvitations}
            >
              Invite Guest
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total}</div>
          <div className={styles.statLabel}>Total</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.active}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.internal}</div>
          <div className={styles.statLabel}>Internal</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.external}</div>
          <div className={styles.statLabel}>External/Guest</div>
        </div>
      </div>

      {/* Tabs */}
      <TabList selectedValue={activeTab} onTabSelect={handleTabSelect} style={{ marginBottom: '16px' }}>
        <Tab value="all" icon={<PeopleTeam24Regular />}>
          All ({accountManagers.length})
        </Tab>
        <Tab value="internal" icon={<Building24Regular />}>
          Internal ({stats.internal})
        </Tab>
        <Tab value="external" icon={<Globe24Regular />}>
          External/Guest ({stats.external})
        </Tab>
      </TabList>

      {/* Filters */}
      <div className={styles.filtersRow}>
        <Input
          className={styles.searchInput}
          value={searchText}
          onChange={(_, d) => setSearchText(d.value)}
          placeholder="Search by name, email, or company..."
          contentBefore={<Search24Regular />}
        />
        <Dropdown
          className={styles.filterDropdown}
          placeholder="Status"
          value={statusFilter === 'all' ? 'All Statuses' : statusFilter}
          selectedOptions={[statusFilter]}
          onOptionSelect={(_, d) => setStatusFilter(d.optionValue as AccountManagerStatus | 'all')}
        >
          <Option value="all">All Statuses</Option>
          {ACCOUNT_MANAGER_STATUSES.map((status) => (
            <Option key={status} value={status}>
              {status}
            </Option>
          ))}
        </Dropdown>
        <Dropdown
          className={styles.filterDropdown}
          placeholder="Region"
          value={regionFilter === 'all' ? 'All Regions' : regionFilter}
          selectedOptions={[regionFilter]}
          onOptionSelect={(_, d) => setRegionFilter(d.optionValue as AccountManagerRegion | 'all')}
        >
          <Option value="all">All Regions</Option>
          {ACCOUNT_MANAGER_REGIONS.map((region) => (
            <Option key={region} value={region}>
              {region}
            </Option>
          ))}
        </Dropdown>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: '#fde7e9',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            borderLeft: '4px solid #d13438',
          }}
        >
          <Text style={{ color: '#d13438' }}>{error}</Text>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Spinner label="Loading account managers..." />
          </div>
        ) : filteredManagers.length === 0 ? (
          <div className={styles.emptyState}>
            <Person24Regular style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
            <Text size={400}>No account managers found</Text>
            <Text size={200} style={{ display: 'block', marginTop: '8px' }}>
              {searchText || statusFilter !== 'all' || regionFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Click "Add Account Manager" to create one'}
            </Text>
          </div>
        ) : (
          <Table className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Source</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Region</TableHeaderCell>
                <TableHeaderCell>Company/Dept</TableHeaderCell>
                <TableHeaderCell style={{ width: '60px' }}>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredManagers.map((am) => (
                <TableRow key={am.Id}>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar name={am.Title} size={28} />
                      <div>
                        <Text weight="semibold">{am.Title}</Text>
                        {am.JobTitle && (
                          <Text
                            size={100}
                            style={{ display: 'block', color: tokens.colorNeutralForeground3 }}
                          >
                            {am.JobTitle}
                          </Text>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{am.Email}</Text>
                  </TableCell>
                  <TableCell>
                    <Badge
                      appearance="filled"
                      color={getSourceColor(am.Source)}
                      size="small"
                    >
                      {am.Source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      appearance="filled"
                      color={getStatusColor(am.Status)}
                      size="small"
                    >
                      {am.Status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{am.Region || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size={200}>{am.Company || am.Department || '-'}</Text>
                  </TableCell>
                  <TableCell>
                    <Menu>
                      <MenuTrigger disableButtonEnhancement>
                        <Button appearance="subtle" icon={<MoreHorizontal24Regular />} />
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuItem icon={<Edit24Regular />} onClick={() => handleOpenEditDialog(am)}>
                            Edit
                          </MenuItem>
                          <MenuItem
                            icon={<Delete24Regular />}
                            onClick={() => handleOpenDeleteDialog(am)}
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
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(_, d) => !d.open && setShowAddDialog(false)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>Add Account Manager</DialogTitle>
            <DialogContent>
              {formError && (
                <div
                  style={{
                    backgroundColor: '#fde7e9',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    borderLeft: '4px solid #d13438',
                  }}
                >
                  <Text style={{ color: '#d13438' }}>{formError}</Text>
                </div>
              )}
              <div className={styles.formGrid}>{renderFormFields()}</div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                icon={<Dismiss24Regular />}
                onClick={() => setShowAddDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                icon={isSubmitting ? <Spinner size="tiny" /> : <Checkmark24Regular />}
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(_, d) => !d.open && setShowEditDialog(false)}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle>Edit Account Manager</DialogTitle>
            <DialogContent>
              {formError && (
                <div
                  style={{
                    backgroundColor: '#fde7e9',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    borderLeft: '4px solid #d13438',
                  }}
                >
                  <Text style={{ color: '#d13438' }}>{formError}</Text>
                </div>
              )}
              <div className={styles.formGrid}>{renderFormFields()}</div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                icon={<Dismiss24Regular />}
                onClick={() => setShowEditDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                icon={isSubmitting ? <Spinner size="tiny" /> : <Checkmark24Regular />}
                onClick={handleUpdate}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(_, d) => !d.open && setShowDeleteDialog(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Account Manager</DialogTitle>
            <DialogContent>
              <Text>
                Are you sure you want to delete <strong>{selectedManager?.Title}</strong>? This
                action cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                style={{ backgroundColor: DW_COLORS.danger }}
                icon={isSubmitting ? <Spinner size="tiny" /> : <Delete24Regular />}
                onClick={handleDelete}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Entra User Picker */}
      <EntraUserPicker
        open={showEntraPicker}
        onClose={() => setShowEntraPicker(false)}
        onSelect={handleEntraUserSelect}
        title="Select User from Entra ID"
        allowManualEntry={true}
        allowGuestUsers={true}
      />
    </div>
  );
};

export default AccountManagerManagement;
