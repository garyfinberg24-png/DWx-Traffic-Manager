import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  Text,
  Button,
  Input,
  Textarea,
  Card,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Field,
  Divider,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Delete24Regular,
  Save24Regular,
  ArrowUp24Regular,
  ArrowDown24Regular,
  Checkmark24Regular,
  Dismiss16Regular,
  Dismiss24Regular,
  CheckboxChecked24Regular,
  Edit24Regular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';
import { DEFAULT_CHECKLIST_ITEMS } from '../../types/Checklist';

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
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  headerSubtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  itemCard: {
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: DW_COLORS.teal,
    color: 'white',
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '12px',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    marginLeft: tokens.spacingHorizontalM,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  itemLabel: {
    fontSize: '14px',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  itemDescription: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.4',
  },
  itemActions: {
    display: 'flex',
    gap: '2px',
    flexShrink: 0,
    marginLeft: tokens.spacingHorizontalM,
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
  // Dialog styles - matching standardized modal pattern
  dialogSurface: {
    maxWidth: '480px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25.6px 57.6px 0 rgba(0,0,0,.22), 0 4.8px 14.4px 0 rgba(0,0,0,.18)',
  },
  dialogBody: {
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
    overflow: 'hidden',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2a8a9d 100%)',
    color: 'white',
    position: 'relative',
    flexShrink: 0,
  },
  dialogHeaderIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogHeaderContent: {
    flex: 1,
  },
  dialogHeaderTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  dialogHeaderSubtitle: {
    fontSize: '12px',
    opacity: 0.9,
  },
  dialogCloseBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    minWidth: '28px',
    width: '28px',
    height: '28px',
    padding: '0',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogContent: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  dialogFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#f9f9f9',
    flexShrink: 0,
  },
  primaryBtn: {
    backgroundColor: DW_COLORS.teal,
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  infoBox: {
    padding: '12px 16px',
    backgroundColor: '#e6f2fb',
    borderRadius: tokens.borderRadiusMedium,
    border: '1px solid #b3d7f2',
    fontSize: '13px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '1.5',
  },
  saveFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: tokens.spacingVerticalM,
  },
});

interface ChecklistItemData {
  id: string;
  label: string;
  description: string;
}

// Storage key for persisted checklist items
const STORAGE_KEY = 'lp_checklist_items';

// Get initial items from localStorage or default
const getInitialItems = (): ChecklistItemData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load checklist items from storage:', e);
  }
  return DEFAULT_CHECKLIST_ITEMS.map((item) => ({
    id: item.id,
    label: item.label,
    description: item.description,
  }));
};

export const ChecklistManagement: React.FC = () => {
  const styles = useStyles();
  const [items, setItems] = useState<ChecklistItemData[]>(getInitialItems);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Add/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItemData | null>(null);
  const [formData, setFormData] = useState({ label: '', description: '' });

  // Track changes
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current = JSON.stringify(items);
    const original = stored || JSON.stringify(DEFAULT_CHECKLIST_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
    })));
    setHasChanges(current !== original);
  }, [items]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setSaveMessage({ type: 'success', text: 'Checklist items saved successfully!' });
      setHasChanges(false);

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save checklist items:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save checklist items. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    const defaultItems = DEFAULT_CHECKLIST_ITEMS.map((item) => ({
      id: item.id,
      label: item.label,
      description: item.description,
    }));
    setItems(defaultItems);
    setSaveMessage({ type: 'success', text: 'Reset to default items. Click Save to persist changes.' });
  };

  const handleOpenAddDialog = () => {
    setEditingItem(null);
    setFormData({ label: '', description: '' });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (item: ChecklistItemData) => {
    setEditingItem(item);
    setFormData({ label: item.label, description: item.description });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({ label: '', description: '' });
  };

  const handleSaveItem = () => {
    if (!formData.label.trim()) return;

    if (editingItem) {
      // Edit existing item
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, label: formData.label.trim(), description: formData.description.trim() }
            : item
        )
      );
    } else {
      // Add new item
      const newItem: ChecklistItemData = {
        id: `item_${Date.now()}`,
        label: formData.label.trim(),
        description: formData.description.trim(),
      };
      setItems((prev) => [...prev, newItem]);
    }

    handleCloseDialog();
  };

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      return newItems;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      return newItems;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <CheckboxChecked24Regular />
            Deployment Checklist Items
          </div>
          <Text className={styles.headerSubtitle}>
            Configure the checklist items that appear for deployment bookings
          </Text>
        </div>
        <div className={styles.headerActions}>
          <Button appearance="secondary" onClick={handleResetToDefault}>
            Reset to Default
          </Button>
          <Button appearance="primary" icon={<Add24Regular />} onClick={handleOpenAddDialog}>
            Add Item
          </Button>
        </div>
      </div>

      {saveMessage && (
        <MessageBar intent={saveMessage.type === 'success' ? 'success' : 'error'}>
          <MessageBarBody>
            <MessageBarTitle>{saveMessage.type === 'success' ? 'Saved' : 'Error'}</MessageBarTitle>
            {saveMessage.text}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.infoBox}>
        <strong>Note:</strong> Changes to the checklist items will apply to new deployment bookings.
        Existing bookings will retain their original checklist items until reset by the user.
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={400}>No checklist items configured</Text>
          <Text size={200}>Click "Add Item" to create your first checklist item</Text>
        </div>
      ) : (
        <div className={styles.itemsList}>
          {items.map((item, index) => (
            <Card key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span className={styles.itemNumber}>{index + 1}</span>
                  <div className={styles.itemContent}>
                    <Text className={styles.itemLabel}>{item.label}</Text>
                    <Text className={styles.itemDescription}>{item.description}</Text>
                  </div>
                </div>
                <div className={styles.itemActions}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowUp24Regular />}
                    size="small"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    title="Move up"
                  />
                  <Button
                    appearance="subtle"
                    icon={<ArrowDown24Regular />}
                    size="small"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    title="Move down"
                  />
                  <Button
                    appearance="subtle"
                    icon={<Edit24Regular />}
                    size="small"
                    onClick={() => handleOpenEditDialog(item)}
                    title="Edit"
                  />
                  <Button
                    appearance="subtle"
                    icon={<Delete24Regular />}
                    size="small"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Delete"
                    style={{ color: tokens.colorPaletteRedForeground1 }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Divider />

      <div className={styles.saveFooter}>
        <Button
          appearance="primary"
          icon={isSaving ? <Spinner size="tiny" /> : <Save24Regular />}
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(_, d) => !d.open && handleCloseDialog()}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody className={styles.dialogBody}>
            {/* Header */}
            <div className={styles.dialogHeader}>
              <div className={styles.dialogHeaderIcon}>
                {editingItem ? <Edit24Regular /> : <Add24Regular />}
              </div>
              <div className={styles.dialogHeaderContent}>
                <div className={styles.dialogHeaderTitle}>
                  {editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}
                </div>
                <div className={styles.dialogHeaderSubtitle}>
                  {editingItem ? 'Update the item details below' : 'Create a new checklist item'}
                </div>
              </div>
              <button
                className={styles.dialogCloseBtn}
                onClick={handleCloseDialog}
                aria-label="Close dialog"
              >
                <Dismiss16Regular />
              </button>
            </div>

            <DialogContent className={styles.dialogContent}>
              <Field label="Item Label" required>
                <Input
                  value={formData.label}
                  onChange={(_, data) => setFormData((prev) => ({ ...prev, label: data.value }))}
                  placeholder="e.g., Bill of Materials Available"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(_, data) => setFormData((prev) => ({ ...prev, description: data.value }))}
                  placeholder="Describe what needs to be done for this checklist item"
                  rows={3}
                />
              </Field>
            </DialogContent>

            {/* Footer */}
            <div className={styles.dialogFooter}>
              <Button
                appearance="secondary"
                icon={<Dismiss24Regular />}
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                className={styles.primaryBtn}
                icon={<Checkmark24Regular />}
                onClick={handleSaveItem}
                disabled={!formData.label.trim()}
              >
                {editingItem ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ChecklistManagement;
