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
  Building24Regular,
  Mail24Regular,
  Phone24Regular,
  Star24Filled,
  Person24Regular,
} from '@fluentui/react-icons';
import {
  Client,
  ClientInput,
  ClientContractStatus,
  CLIENT_CONTRACT_STATUSES,
  AccountManager,
} from '../../types/ReferenceData';
import { referenceDataService } from '../../services/ReferenceDataService';
import { accountManagerService } from '../../services/AccountManagerService';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { ClientForm } from './ClientForm';
import { ImportClientsDialog } from './ImportClientsDialog';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../Common/ConfirmDialog';

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
  statusFilter: {
    minWidth: '150px',
  },
  table: {
    width: '100%',
  },
  companyCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  premiumStar: {
    color: tokens.colorPaletteYellowForeground1,
    fontSize: '16px',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap',
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
  industryBadge: {
    textTransform: 'capitalize',
  },
});

const getStatusBadgeColor = (status: ClientContractStatus): 'success' | 'warning' | 'danger' => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Prospect':
      return 'warning';
    case 'Churned':
      return 'danger';
    default:
      return 'warning';
  }
};

export const ClientList: React.FC = () => {
  const styles = useStyles();
  const { showToast } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [accountManagers, setAccountManagers] = useState<AccountManager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Fetch clients - this is required
      const clientsData = await referenceDataService.getClients();
      setClients(clientsData);

      // Fetch account managers separately - this is optional but we should inform user of issues
      try {
        const managersData = await accountManagerService.getAccountManagers(true); // activeOnly = true
        setAccountManagers(managersData);
        if (managersData.length === 0) {
          showToast('No active Account Managers found. You can still create clients without assigning an AM.', 'warning');
        }
      } catch (amError) {
        const errorMsg = amError instanceof Error ? amError.message : 'Unknown error';
        console.error('Could not load Account Managers:', amError);
        showToast(`Could not load Account Managers: ${errorMsg}`, 'warning');
        setAccountManagers([]); // Allow client creation without AM selection
      }
    } catch (error) {
      showToast('Failed to load clients', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let result = clients;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.Title.toLowerCase().includes(query) ||
          c.PrimaryContactName.toLowerCase().includes(query) ||
          c.PrimaryContactEmail.toLowerCase().includes(query) ||
          (c.AccountManagerName?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((c) => c.ContractStatus === statusFilter);
    }

    setFilteredClients(result);
  }, [clients, searchQuery, statusFilter]);

  const handleCreate = async (data: ClientInput, accountManagerName?: string) => {
    try {
      setIsSaving(true);
      await referenceDataService.createClient(data, accountManagerName);
      showToast('Client created successfully', 'success');
      await loadData();
    } catch (error) {
      showToast('Failed to create client', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: ClientInput, accountManagerName?: string) => {
    if (!editingClient) return;
    try {
      setIsSaving(true);
      await referenceDataService.updateClient(editingClient.Id, data, accountManagerName);
      showToast('Client updated successfully', 'success');
      await loadData();
    } catch (error) {
      showToast('Failed to update client', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    try {
      setIsSaving(true);

      // Check for active service requests referencing this client
      const allRequests = await serviceRequestService.getRequests();
      const activeRequests = allRequests.filter(
        r => r.ClientId === deletingClient.Id && !['Won', 'Lost'].includes(r.FunnelStage)
      );

      if (activeRequests.length > 0) {
        showToast(
          `Cannot delete: ${deletingClient.Title} has ${activeRequests.length} active service request(s). Move them to Won/Lost first.`,
          'error'
        );
        return;
      }

      await referenceDataService.deleteClient(deletingClient.Id);
      showToast('Client deleted successfully', 'success');
      await loadData();
    } catch (error) {
      showToast('Failed to delete client', 'error');
    } finally {
      setIsSaving(false);
      setDeletingClient(null);
    }
  };

  const openCreateForm = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const openEditForm = (client: Client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingClient(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" label="Loading clients..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.filters}>
          <SearchBox
            className={styles.searchBox}
            placeholder="Search by company, contact, or manager..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
          />
          <Dropdown
            className={styles.statusFilter}
            placeholder="Filter by status"
            value={statusFilter === 'all' ? 'All Statuses' : statusFilter}
            selectedOptions={[statusFilter]}
            onOptionSelect={(_, data) => setStatusFilter(data.optionValue || 'all')}
          >
            <Option value="all">All Statuses</Option>
            {CLIENT_CONTRACT_STATUSES.map((status) => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
          </Dropdown>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button appearance="outline" onClick={() => setImportOpen(true)}>
            Import from Spreadsheet
          </Button>
          <Button appearance="primary" icon={<Add24Regular />} onClick={openCreateForm}>
            Add Client
          </Button>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <Card className={styles.emptyState}>
          <Building24Regular style={{ fontSize: 48, color: tokens.colorNeutralForeground3 }} />
          <Text size={400} weight="semibold">
            No clients found
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Click "Add Client" to create your first client'}
          </Text>
        </Card>
      ) : (
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Company</TableHeaderCell>
              <TableHeaderCell>Primary Contact</TableHeaderCell>
              <TableHeaderCell>Industry</TableHeaderCell>
              <TableHeaderCell>Account Manager</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.Id}>
                <TableCell>
                  <TableCellLayout
                    media={<Building24Regular />}
                  >
                    <div className={styles.companyCell}>
                      <Text weight="semibold">{client.Title}</Text>
                      {client.IsPremium && <Star24Filled className={styles.premiumStar} />}
                    </div>
                  </TableCellLayout>
                </TableCell>
                <TableCell>
                  <div className={styles.contactInfo}>
                    <Text size={300}>{client.PrimaryContactName}</Text>
                    <div className={styles.contactItem}>
                      <Mail24Regular style={{ fontSize: 14 }} />
                      <Text size={200}>{client.PrimaryContactEmail}</Text>
                    </div>
                    {client.Phone && (
                      <div className={styles.contactItem}>
                        <Phone24Regular style={{ fontSize: 14 }} />
                        <Text size={200}>{client.Phone}</Text>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {client.Industry ? (
                    <Badge appearance="outline" className={styles.industryBadge}>
                      {client.Industry}
                    </Badge>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                  )}
                </TableCell>
                <TableCell>
                  {client.AccountManagerName ? (
                    <div className={styles.contactItem}>
                      <Person24Regular style={{ fontSize: 14 }} />
                      <Text>{client.AccountManagerName}</Text>
                    </div>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground3 }}>Unassigned</Text>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    appearance="tint"
                    color={getStatusBadgeColor(client.ContractStatus)}
                  >
                    {client.ContractStatus}
                  </Badge>
                </TableCell>
                <TableCell>
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
                          onClick={() => openEditForm(client)}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          icon={<Delete24Regular />}
                          onClick={() => setDeletingClient(client)}
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

      <ClientForm
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={editingClient ? handleUpdate : handleCreate}
        client={editingClient}
        accountManagers={accountManagers}
        isLoading={isSaving}
      />

      <ConfirmDialog
        open={!!deletingClient}
        title="Delete Client"
        message={`Are you sure you want to delete "${deletingClient?.Title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmAppearance="primary"
        onConfirm={handleDelete}
        onCancel={() => setDeletingClient(null)}
        isLoading={isSaving}
      />

      <ImportClientsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportComplete={loadData}
      />
    </div>
  );
};
