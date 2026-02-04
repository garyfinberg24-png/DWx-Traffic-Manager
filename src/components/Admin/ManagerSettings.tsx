import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  Button,
  makeStyles,
  tokens,
  Spinner,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Avatar,
  Badge,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Delete24Regular,
  Person24Regular,
  Mail24Regular,
  Shield24Regular,
  Info16Regular,
  Dismiss16Regular,
} from '@fluentui/react-icons';
import { Manager, ManagerInput, managerService } from '../../services/ManagerService';
import { useAuth } from '../../contexts/AuthContext';
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
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  table: {
    width: '100%',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
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
  infoBar: {
    marginBottom: tokens.spacingVerticalM,
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  dialogFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    marginTop: tokens.spacingVerticalM,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
  },
  fallbackBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
});

export const ManagerSettings: React.FC = () => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Manager | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ManagerInput>({ email: '', displayName: '' });
  const [spManagerCount, setSpManagerCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadManagers = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await managerService.getManagers();
      setManagers(data);
      // Count managers from SharePoint (positive IDs) vs fallback (negative IDs)
      const fromSharePoint = data.filter(m => m.id > 0).length;
      setSpManagerCount(fromSharePoint);
      console.log(`[ManagerSettings] Loaded ${data.length} managers: ${fromSharePoint} from SharePoint, ${data.length - fromSharePoint} from fallback`);

    } catch (error) {
      console.error('Error loading managers:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setLoadError(`Failed to load managers: ${message}`);
      showToast('Failed to load managers', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadManagers();
  }, [loadManagers]);

  const handleAddManager = async () => {
    if (!formData.email.trim()) {
      showToast('Email is required', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    // Check if already exists
    const existingEmails = managers.map(m => m.email.toLowerCase());
    if (existingEmails.includes(formData.email.toLowerCase())) {
      showToast('This email is already a manager', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const displayName = formData.displayName.trim() || formData.email.split('@')[0];
      await managerService.addManager(
        { email: formData.email.trim(), displayName },
        user?.email || 'Unknown'
      );
      showToast(`${displayName} added as manager`, 'success');
      setIsAddDialogOpen(false);
      setFormData({ email: '', displayName: '' });
      await loadManagers();
    } catch (error) {
      console.error('Error adding manager:', error);
      const message = error instanceof Error ? error.message : 'Failed to add manager';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteManager = async () => {
    if (!deleteTarget) return;

    try {
      setIsSubmitting(true);
      await managerService.removeManager(deleteTarget.id);
      showToast(`${deleteTarget.displayName} removed from managers`, 'success');
      setDeleteTarget(null);
      await loadManagers();
    } catch (error) {
      console.error('Error removing manager:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove manager';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner label="Loading managers..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {loadError && (
        <MessageBar className={styles.infoBar} intent="warning">
          <MessageBarBody>
            <strong>Warning:</strong> {loadError}
          </MessageBarBody>
        </MessageBar>
      )}

      <MessageBar className={styles.infoBar} intent="info" icon={<Info16Regular />}>
        <MessageBarBody>
          Managers have access to the Dashboard, Approval Queue, and Admin areas.
          Users listed here can approve/reject bookings and view all booking data.
        </MessageBarBody>
      </MessageBar>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <Text size={500} weight="semibold">
            <Shield24Regular style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Manager Access
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {managers.length} manager{managers.length !== 1 ? 's' : ''} configured
            {spManagerCount > 0 && ` (${spManagerCount} from SharePoint)`}
            {spManagerCount === 0 && managers.length > 0 && ' (all from fallback list)'}
          </Text>
        </div>
        <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
          <Dialog open={isAddDialogOpen} onOpenChange={(_, data) => setIsAddDialogOpen(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" icon={<Add24Regular />}>
                Add Manager
              </Button>
            </DialogTrigger>
            <DialogSurface style={{ maxWidth: '500px' }}>
              <div className={styles.dialogHeader}>
                <DialogTitle>Add Manager</DialogTitle>
                <Button
                  appearance="subtle"
                  icon={<Dismiss16Regular />}
                  onClick={() => setIsAddDialogOpen(false)}
                />
              </div>
              <DialogBody>
                <DialogContent>
                  <div className={styles.form}>
                    <Field label="Email Address" required>
                      <Input
                        type="email"
                        placeholder="user@company.com"
                        value={formData.email}
                        onChange={(_, data) => setFormData({ ...formData, email: data.value })}
                        contentBefore={<Mail24Regular />}
                      />
                    </Field>
                    <Field label="Display Name" hint="Optional - will use email username if not provided">
                      <Input
                        placeholder="John Smith"
                        value={formData.displayName}
                        onChange={(_, data) => setFormData({ ...formData, displayName: data.value })}
                        contentBefore={<Person24Regular />}
                      />
                    </Field>
                  </div>
                </DialogContent>
              </DialogBody>
              <div className={styles.dialogFooter}>
                <Button appearance="secondary" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleAddManager}
                  disabled={isSubmitting || !formData.email.trim()}
                >
                  {isSubmitting ? <Spinner size="tiny" /> : 'Add Manager'}
                </Button>
              </div>
            </DialogSurface>
          </Dialog>
        </div>
      </div>

      {managers.length === 0 ? (
        <div className={styles.emptyState}>
          <Shield24Regular style={{ fontSize: '48px', color: tokens.colorNeutralForeground4 }} />
          <Text size={400}>No managers configured</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Add managers to grant them access to admin features
          </Text>
        </div>
      ) : (
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Email</TableHeaderCell>
              <TableHeaderCell>Added By</TableHeaderCell>
              <TableHeaderCell>Date Added</TableHeaderCell>
              <TableHeaderCell style={{ width: '80px' }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {managers.map((manager) => (
              <TableRow key={manager.id}>
                <TableCell>
                  <TableCellLayout
                    media={
                      <Avatar
                        name={manager.displayName}
                        color="colorful"
                        size={28}
                      />
                    }
                  >
                    <div className={styles.nameCell}>
                      {manager.displayName}
                      {manager.id < 0 && (
                        <Badge
                          className={styles.fallbackBadge}
                          appearance="outline"
                          color="informative"
                          size="small"
                        >
                          Built-in
                        </Badge>
                      )}
                    </div>
                  </TableCellLayout>
                </TableCell>
                <TableCell>{manager.email}</TableCell>
                <TableCell>{manager.addedBy}</TableCell>
                <TableCell>{formatDate(manager.addedDate)}</TableCell>
                <TableCell>
                  {manager.id > 0 ? (
                    <Button
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      onClick={() => setDeleteTarget(manager)}
                      title="Remove manager"
                      style={{ color: tokens.colorPaletteRedForeground1 }}
                    />
                  ) : (
                    <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>-</Text>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove Manager"
        message={`Are you sure you want to remove ${deleteTarget?.displayName} from the managers list? They will no longer have access to admin features.`}
        confirmLabel="Remove"
        confirmAppearance="primary"
        onConfirm={handleDeleteManager}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isSubmitting}
      />
    </div>
  );
};
