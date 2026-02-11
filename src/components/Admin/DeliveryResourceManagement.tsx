/**
 * DWx Traffic Manager - Delivery Resource Management
 * Admin CRUD list for managing delivery resources (developers, PMs, BAs, etc.)
 * v2.16.0
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Button, Text, Badge, makeStyles, tokens, Spinner, SearchBox, Dropdown, Option,
  Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, TableCellLayout, Avatar,
  Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions,
  Input, Label, Checkbox,
} from '@fluentui/react-components';
import {
  Add24Regular, Edit24Regular, Delete24Regular, MoreHorizontal24Regular,
  Person24Regular, PersonProhibited24Regular, PersonAvailable24Regular,
} from '@fluentui/react-icons';
import {
  deliveryResourceService,
  type CreateDeliveryResourceInput, type UpdateDeliveryResourceInput,
} from '../../services/DeliveryResourceService';
import { type DeliveryRole, DELIVERY_ROLES, DELIVERY_ROLE_COLORS } from '../../types/DeliveryHandover';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { Pagination, usePagination } from '../Common/Pagination';

// The service's mapToResource returns camelCase properties at runtime.
interface ResourceItem {
  id: number; name: string; email: string; phone?: string;
  role: DeliveryRole; specializations: string[];
  maxConcurrentProjects: number; currentProjectCount: number;
  hourlyRate?: number; availableFrom?: string;
  skills: Array<{ name: string; proficiency: string }>;
  isActive: boolean; created?: string; modified?: string;
}

const useStyles = makeStyles({
  container: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: tokens.spacingHorizontalM },
  headerTitle: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
  filters: { display: 'flex', gap: tokens.spacingHorizontalM, flexWrap: 'wrap', alignItems: 'center' },
  searchBox: { minWidth: '250px' },
  roleFilter: { minWidth: '180px' },
  table: { width: '100%', tableLayout: 'fixed' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: tokens.spacingVerticalXXL, gap: tokens.spacingVerticalM },
  loadingState: { display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL },
  colName: { width: '15%' }, colEmail: { width: '18%' }, colRole: { width: '13%' },
  colSpecs: { width: '18%' }, colWork: { width: '10%' }, colRate: { width: '10%' },
  colStatus: { width: '8%' }, colActions: { width: '8%' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' },
  row: { display: 'flex', gap: '16px' },
});

// ── Helpers ────────────────────────────────────────────────────────────────

const getRoleBadgeStyle = (role: DeliveryRole): React.CSSProperties => {
  const c = DELIVERY_ROLE_COLORS[role];
  return c ? { backgroundColor: c.bg, color: c.text, padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' } : {};
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

// ── Form Dialog (module-level) ────────────────────────────────────────────

interface FormProps {
  open: boolean; editing: ResourceItem | null; saving: boolean;
  onClose: () => void;
  onSave: (data: CreateDeliveryResourceInput | UpdateDeliveryResourceInput, isNew: boolean) => void;
}

const ResourceFormDialog: React.FC<FormProps> = ({ open, editing, saving, onClose, onSave }) => {
  const styles = useStyles();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<DeliveryRole>('Developer');
  const [maxProjects, setMaxProjects] = useState(3);
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined);
  const [availableFrom, setAvailableFrom] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name || ''); setEmail(editing.email || ''); setPhone(editing.phone || '');
      setRole(editing.role || 'Developer'); setMaxProjects(editing.maxConcurrentProjects ?? 3);
      setHourlyRate(editing.hourlyRate || undefined);
      setAvailableFrom(editing.availableFrom ? editing.availableFrom.split('T')[0] : '');
      setIsActive(editing.isActive !== false);
    } else {
      setName(''); setEmail(''); setPhone(''); setRole('Developer');
      setMaxProjects(3); setHourlyRate(undefined); setAvailableFrom(''); setIsActive(true);
    }
  }, [open, editing]);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return;
    const shared = { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, role, maxConcurrentProjects: maxProjects, hourlyRate: hourlyRate || undefined, availableFrom: availableFrom || undefined };
    if (editing) {
      onSave({ ...shared, isActive } as UpdateDeliveryResourceInput, false);
    } else {
      onSave(shared as CreateDeliveryResourceInput, true);
    }
  };

  const valid = name.trim().length > 0 && email.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(_, d) => { if (!d.open) onClose(); }}>
      <DialogSurface style={{ maxWidth: '520px', width: '100%' }}>
        <DialogBody>
          <DialogTitle>{editing ? 'Edit Delivery Resource' : 'Add Delivery Resource'}</DialogTitle>
          <DialogContent>
            <div className={styles.field}>
              <Label required>Name</Label>
              <Input value={name} onChange={(_, d) => setName(d.value)} placeholder="Full name" />
            </div>
            <div className={styles.field}>
              <Label required>Email</Label>
              <Input type="email" value={email} onChange={(_, d) => setEmail(d.value)} placeholder="email@company.com" />
            </div>
            <div className={styles.field}>
              <Label>Phone</Label>
              <Input value={phone} onChange={(_, d) => setPhone(d.value)} placeholder="+27 XX XXX XXXX" />
            </div>
            <div className={styles.field}>
              <Label required>Role</Label>
              <Dropdown value={role} selectedOptions={[role]} onOptionSelect={(_, d) => { if (d.optionValue) setRole(d.optionValue as DeliveryRole); }}>
                {DELIVERY_ROLES.map((r) => <Option key={r} value={r}>{r}</Option>)}
              </Dropdown>
            </div>
            <div className={styles.row}>
              <div className={styles.field} style={{ flex: 1 }}>
                <Label>Max Concurrent Projects</Label>
                <Input type="number" value={String(maxProjects)} onChange={(_, d) => setMaxProjects(Math.max(1, parseInt(d.value) || 1))} min="1" max="10" />
              </div>
              <div className={styles.field} style={{ flex: 1 }}>
                <Label>Hourly Rate (ZAR)</Label>
                <Input type="number" value={hourlyRate !== undefined ? String(hourlyRate) : ''} onChange={(_, d) => { const v = parseInt(d.value); setHourlyRate(isNaN(v) ? undefined : v); }} placeholder="e.g. 850" min="0" />
              </div>
            </div>
            <div className={styles.field}>
              <Label>Available From</Label>
              <Input type="date" value={availableFrom} onChange={(_, d) => setAvailableFrom(d.value)} />
            </div>
            {editing && (
              <div style={{ marginTop: '4px' }}>
                <Checkbox checked={isActive} onChange={(_, d) => setIsActive(d.checked === true)} label="Active (available for project assignment)" />
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button appearance="primary" onClick={handleSubmit} disabled={!valid || saving}>
              {saving ? <><Spinner size="tiny" />&nbsp;Saving...</> : editing ? 'Update' : 'Add Resource'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

// ── Main Component ────────────────────────────────────────────────────────

export const DeliveryResourceManagement: React.FC = () => {
  const styles = useStyles();
  const { showSuccess, showError, showWarning } = useToast();

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<DeliveryRole | 'all'>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [saving, setSaving] = useState(false);

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deliveryResourceService.getAllResources();
      setResources(data as unknown as ResourceItem[]);
    } catch (error) {
      showError('Failed to load delivery resources');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { loadResources(); }, [loadResources]);

  const filtered = useMemo(() => {
    let r = resources;
    if (!showInactive) r = r.filter((x) => x.isActive);
    if (search) { const q = search.toLowerCase(); r = r.filter((x) => x.name.toLowerCase().includes(q) || x.email.toLowerCase().includes(q) || x.role.toLowerCase().includes(q)); }
    if (roleFilter !== 'all') r = r.filter((x) => x.role === roleFilter);
    return r;
  }, [resources, search, roleFilter, showInactive]);

  const { currentPage, pageSize, paginatedItems, totalItems, setCurrentPage, setPageSize } = usePagination(filtered, 20);

  const handleSave = useCallback(async (data: CreateDeliveryResourceInput | UpdateDeliveryResourceInput, isNew: boolean) => {
    try {
      setSaving(true);
      if (isNew) { await deliveryResourceService.createResource(data as CreateDeliveryResourceInput); showSuccess('Delivery resource created successfully'); }
      else if (editingResource) { await deliveryResourceService.updateResource(editingResource.id, data as UpdateDeliveryResourceInput); showSuccess('Delivery resource updated successfully'); }
      setFormOpen(false); setEditingResource(null); await loadResources();
    } catch (error) { showError(isNew ? 'Failed to create resource' : 'Failed to update resource'); console.error(error); }
    finally { setSaving(false); }
  }, [editingResource, loadResources, showSuccess, showError]);

  const handleToggleActive = useCallback(async (res: ResourceItem) => {
    try {
      setSaving(true);
      const newActive = !res.isActive;
      if (!newActive && res.currentProjectCount > 0) showWarning(`${res.name} has ${res.currentProjectCount} active project(s). Proceeding with deactivation.`);
      await deliveryResourceService.updateResource(res.id, { isActive: newActive });
      showSuccess(`${res.name} ${newActive ? 'activated' : 'deactivated'} successfully`);
      await loadResources();
    } catch (error) { showError('Failed to update resource status'); console.error(error); }
    finally { setSaving(false); }
  }, [loadResources, showSuccess, showError, showWarning]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirmId === null) return;
    try {
      setSaving(true);
      await deliveryResourceService.deleteResource(deleteConfirmId);
      showSuccess('Delivery resource deleted');
      setDeleteConfirmId(null); setDeleteConfirmName(''); await loadResources();
    } catch (error) { showError('Failed to delete resource'); console.error(error); }
    finally { setSaving(false); }
  }, [deleteConfirmId, loadResources, showSuccess, showError]);

  const openCreate = () => { setEditingResource(null); setFormOpen(true); };
  const openEdit = (r: ResourceItem) => { setEditingResource(r); setFormOpen(true); };
  const closeForm = () => { setFormOpen(false); setEditingResource(null); };

  if (loading) return <div className={styles.loadingState}><Spinner size="large" label="Loading delivery resources..." /></div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.filters}>
          <div className={styles.headerTitle}>
            <Text size={500} weight="semibold">Delivery Resources</Text>
            <Badge appearance="filled" color="informative">{resources.filter((r) => r.isActive).length}</Badge>
          </div>
          <SearchBox className={styles.searchBox} placeholder="Search by name, email or role..." value={search} onChange={(_, d) => setSearch(d.value)} />
          <Dropdown className={styles.roleFilter} placeholder="Filter by role" value={roleFilter === 'all' ? 'All Roles' : roleFilter} selectedOptions={[roleFilter]} onOptionSelect={(_, d) => setRoleFilter((d.optionValue as DeliveryRole | 'all') || 'all')}>
            <Option value="all">All Roles</Option>
            {DELIVERY_ROLES.map((r) => <Option key={r} value={r}>{r}</Option>)}
          </Dropdown>
          <Checkbox checked={showInactive} onChange={(_, d) => setShowInactive(d.checked === true)} label="Show inactive" />
        </div>
        <Button appearance="primary" icon={<Add24Regular />} onClick={openCreate}>Add Resource</Button>
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Person24Regular style={{ fontSize: 48, color: tokens.colorNeutralForeground3 }} />
          <Text size={400} weight="semibold">No delivery resources found</Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {search || roleFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first delivery resource to get started'}
          </Text>
          {!search && roleFilter === 'all' && <Button appearance="primary" icon={<Add24Regular />} onClick={openCreate}>Add your first resource</Button>}
        </div>
      ) : (
        <>
          <Table className={styles.table}>
            <TableHeader>
              <TableRow>
                <TableHeaderCell className={styles.colName}>Name</TableHeaderCell>
                <TableHeaderCell className={styles.colEmail}>Email</TableHeaderCell>
                <TableHeaderCell className={styles.colRole}>Role</TableHeaderCell>
                <TableHeaderCell className={styles.colSpecs}>Specializations</TableHeaderCell>
                <TableHeaderCell className={styles.colWork}>Workload</TableHeaderCell>
                <TableHeaderCell className={styles.colRate}>Rate (ZAR)</TableHeaderCell>
                <TableHeaderCell className={styles.colStatus}>Status</TableHeaderCell>
                <TableHeaderCell className={styles.colActions}>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((res) => (
                <TableRow key={res.id}>
                  <TableCell className={styles.colName}>
                    <TableCellLayout media={<Avatar name={res.name} color="colorful" size={32} />}>
                      <Text weight="semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.name}</Text>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell className={styles.colEmail} style={{ overflow: 'hidden' }}>
                    <Text size={200} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', color: tokens.colorNeutralForeground3 }}>{res.email}</Text>
                    {res.phone && <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{res.phone}</Text>}
                  </TableCell>
                  <TableCell className={styles.colRole}>
                    <span style={getRoleBadgeStyle(res.role)}>{res.role}</span>
                  </TableCell>
                  <TableCell className={styles.colSpecs}>
                    <div className={styles.chips}>
                      {res.specializations.length > 0
                        ? res.specializations.map((s) => <Badge key={s} appearance="outline" size="small">{s}</Badge>)
                        : <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>-</Text>}
                    </div>
                  </TableCell>
                  <TableCell className={styles.colWork}>
                    <UtilizationBar current={res.currentProjectCount} max={res.maxConcurrentProjects} />
                  </TableCell>
                  <TableCell className={styles.colRate}>
                    <Text size={200}>{res.hourlyRate ? `${formatCurrency(res.hourlyRate)}/hr` : '-'}</Text>
                  </TableCell>
                  <TableCell className={styles.colStatus}>
                    <Badge appearance="filled" color={res.isActive ? 'success' : 'danger'}>{res.isActive ? 'Active' : 'Inactive'}</Badge>
                  </TableCell>
                  <TableCell className={styles.colActions}>
                    <Menu>
                      <MenuTrigger disableButtonEnhancement>
                        <Button appearance="subtle" icon={<MoreHorizontal24Regular />} size="small" />
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                          <MenuItem icon={<Edit24Regular />} onClick={() => openEdit(res)}>Edit</MenuItem>
                          <MenuItem icon={res.isActive ? <PersonProhibited24Regular /> : <PersonAvailable24Regular />} onClick={() => handleToggleActive(res)}>
                            {res.isActive ? 'Deactivate' : 'Activate'}
                          </MenuItem>
                          <MenuItem icon={<Delete24Regular />} onClick={() => { setDeleteConfirmId(res.id); setDeleteConfirmName(res.name); }}>Delete</MenuItem>
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination currentPage={currentPage} totalItems={totalItems} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
        </>
      )}

      <ResourceFormDialog open={formOpen} editing={editingResource} saving={saving} onClose={closeForm} onSave={handleSave} />
      <ConfirmDialog open={deleteConfirmId !== null} title="Delete Delivery Resource" message={`Are you sure you want to delete "${deleteConfirmName}"? This action cannot be undone.`} confirmLabel="Delete" confirmAppearance="primary" intent="danger" onConfirm={handleDelete} onCancel={() => { setDeleteConfirmId(null); setDeleteConfirmName(''); }} isLoading={saving} />
    </div>
  );
};
