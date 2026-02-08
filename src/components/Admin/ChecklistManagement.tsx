import React, { useState, useEffect, useCallback } from 'react';
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
  Dropdown,
  Option,
  Field,
  Divider,
  Switch,
  Badge,
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
  ArrowReset24Regular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { ServiceChecklistItem, DEFAULT_SERVICE_CHECKLISTS } from '../../types/Checklist';
import { ServiceCategory, DWService } from '../../types/ServiceRequest';
import { useToast } from '../../contexts/ToastContext';

const SERVICE_CATEGORIES: ServiceCategory[] = [
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
  selectorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  selectorDropdown: {
    minWidth: '260px',
  },
  serviceInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
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
  itemLeft: {
    display: 'flex',
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
  itemLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
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
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
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
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
  },
  requiredBadge: {
    fontSize: '11px',
  },
});

export const ChecklistManagement: React.FC = () => {
  const styles = useStyles();
  const { showSuccess, showError } = useToast();

  // Core state
  const [services, setServices] = useState<DWService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('Power Platform');
  const [items, setItems] = useState<ServiceChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ServiceChecklistItem | null>(null);
  const [formData, setFormData] = useState({ label: '', description: '', isRequired: true });

  // Track original items for change detection
  const [originalItemsJson, setOriginalItemsJson] = useState('');

  // ========================================================================
  // Data loading
  // ========================================================================

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const allServices = await serviceCatalogService.getServices(false);
      setServices(allServices);
    } catch (error) {
      console.error('Failed to load services:', error);
      showError('Failed to load services', 'Could not load the service catalog.');
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Get the current service for the selected category
  const getServiceForCategory = useCallback(
    (category: ServiceCategory): DWService | undefined => {
      return services.find((s) => s.Category === category);
    },
    [services]
  );

  // Load checklist items when category changes or services load
  useEffect(() => {
    if (services.length === 0 && !isLoading) return;

    const service = getServiceForCategory(selectedCategory);
    let checklistItems: ServiceChecklistItem[];

    if (service?.Checklist && service.Checklist.length > 0) {
      checklistItems = [...service.Checklist];
    } else {
      checklistItems = DEFAULT_SERVICE_CHECKLISTS[selectedCategory]
        ? [...DEFAULT_SERVICE_CHECKLISTS[selectedCategory]]
        : [];
    }

    setItems(checklistItems);
    setOriginalItemsJson(JSON.stringify(checklistItems));
    setHasChanges(false);
    setSaveMessage(null);
  }, [selectedCategory, services, isLoading, getServiceForCategory]);

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(items) !== originalItemsJson);
  }, [items, originalItemsJson]);

  // ========================================================================
  // Category selection
  // ========================================================================

  const handleCategoryChange = (_: unknown, data: { selectedOptions: string[]; optionValue?: string }) => {
    if (data.optionValue) {
      setSelectedCategory(data.optionValue as ServiceCategory);
    }
  };

  // ========================================================================
  // Save
  // ========================================================================

  const handleSave = async () => {
    const service = getServiceForCategory(selectedCategory);

    if (!service) {
      setSaveMessage({
        type: 'error',
        text: `No service found for category "${selectedCategory}". Create a service in this category first.`,
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await serviceCatalogService.updateService(service.Id, { Checklist: items });

      // Update local services state so the change is reflected
      setServices((prev) =>
        prev.map((s) => (s.Id === service.Id ? { ...s, Checklist: items } : s))
      );

      setOriginalItemsJson(JSON.stringify(items));
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'Checklist saved successfully.' });
      showSuccess('Checklist saved', `Checklist for "${selectedCategory}" has been updated.`);

      setTimeout(() => setSaveMessage(null), 4000);
    } catch (error) {
      console.error('Failed to save checklist:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save checklist. Please try again.' });
      showError('Save failed', 'Could not save the checklist to SharePoint.');
    } finally {
      setIsSaving(false);
    }
  };

  // ========================================================================
  // Reset to defaults
  // ========================================================================

  const handleResetToDefault = () => {
    const defaultItems = DEFAULT_SERVICE_CHECKLISTS[selectedCategory]
      ? [...DEFAULT_SERVICE_CHECKLISTS[selectedCategory]]
      : [];
    setItems(defaultItems);
    setSaveMessage({
      type: 'success',
      text: 'Reset to default items. Click "Save Changes" to persist.',
    });
  };

  // ========================================================================
  // Add / Edit dialog
  // ========================================================================

  const handleOpenAddDialog = () => {
    setEditingItem(null);
    setFormData({ label: '', description: '', isRequired: true });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (item: ServiceChecklistItem) => {
    setEditingItem(item);
    setFormData({
      label: item.label,
      description: item.description,
      isRequired: item.isRequired,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingItem(null);
    setFormData({ label: '', description: '', isRequired: true });
  };

  const handleSaveItem = () => {
    if (!formData.label.trim()) return;

    if (editingItem) {
      // Edit existing item
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                label: formData.label.trim(),
                description: formData.description.trim(),
                isRequired: formData.isRequired,
              }
            : item
        )
      );
    } else {
      // Add new item
      const maxSortOrder = items.reduce((max, i) => Math.max(max, i.sortOrder), 0);
      const newItem: ServiceChecklistItem = {
        id: `item_${Date.now()}`,
        label: formData.label.trim(),
        description: formData.description.trim(),
        isRequired: formData.isRequired,
        sortOrder: maxSortOrder + 1,
      };
      setItems((prev) => [...prev, newItem]);
    }

    handleCloseDialog();
  };

  // ========================================================================
  // Delete / Reorder
  // ========================================================================

  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      // Update sortOrder
      return newItems.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      return newItems.map((item, i) => ({ ...item, sortOrder: i + 1 }));
    });
  };

  // ========================================================================
  // Derived values
  // ========================================================================

  const currentService = getServiceForCategory(selectedCategory);
  const requiredCount = items.filter((i) => i.isRequired).length;

  // ========================================================================
  // Render
  // ========================================================================

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="medium" label="Loading services..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.headerTitle}>
            <CheckboxChecked24Regular />
            Service Checklists
          </div>
          <Text className={styles.headerSubtitle}>
            Configure checklist templates for each service. These checklists are automatically copied to new deals.
          </Text>
        </div>
        <div className={styles.headerActions}>
          <Button
            appearance="secondary"
            icon={<ArrowReset24Regular />}
            onClick={handleResetToDefault}
          >
            Reset to Default
          </Button>
          <Button appearance="primary" icon={<Add24Regular />} onClick={handleOpenAddDialog}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Category selector */}
      <div className={styles.selectorRow}>
        <Field label="Service Category">
          <Dropdown
            className={styles.selectorDropdown}
            value={selectedCategory}
            selectedOptions={[selectedCategory]}
            onOptionSelect={handleCategoryChange}
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Dropdown>
        </Field>
        <div className={styles.serviceInfo}>
          {currentService ? (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Service: <strong>{currentService.Title}</strong> (ID: {currentService.Id})
            </Text>
          ) : (
            <Text size={200} style={{ color: DW_COLORS.danger }}>
              No service found for this category. Using default checklist.
            </Text>
          )}
        </div>
      </div>

      {/* Save message */}
      {saveMessage && (
        <MessageBar intent={saveMessage.type === 'success' ? 'success' : 'error'}>
          <MessageBarBody>
            <MessageBarTitle>{saveMessage.type === 'success' ? 'Success' : 'Error'}</MessageBarTitle>
            {saveMessage.text}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Info box */}
      <div className={styles.infoBox}>
        <strong>Note:</strong> Each service category has its own checklist template. When a new deal is created
        for this service, these items are copied as the deal's checklist. Changes here do not affect
        existing deals. {items.length > 0 && (
          <>Currently {items.length} item{items.length !== 1 ? 's' : ''} ({requiredCount} required).</>
        )}
      </div>

      {/* Checklist items */}
      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <Text size={400}>No checklist items configured</Text>
          <Text size={200}>
            Click "Add Item" to create a new item, or "Reset to Default" to load the standard template.
          </Text>
        </div>
      ) : (
        <div className={styles.itemsList}>
          {items.map((item, index) => (
            <Card key={item.id} className={styles.itemCard}>
              <div className={styles.itemHeader}>
                <div className={styles.itemLeft}>
                  <span className={styles.itemNumber}>{index + 1}</span>
                  <div className={styles.itemContent}>
                    <div className={styles.itemLabelRow}>
                      <Text className={styles.itemLabel}>{item.label}</Text>
                      {item.isRequired && (
                        <Badge
                          appearance="filled"
                          color="danger"
                          size="small"
                          className={styles.requiredBadge}
                        >
                          Required
                        </Badge>
                      )}
                    </div>
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

      {/* Save footer */}
      <div className={styles.saveFooter}>
        <Button
          appearance="primary"
          className={styles.primaryBtn}
          icon={isSaving ? <Spinner size="tiny" /> : <Save24Regular />}
          onClick={handleSave}
          disabled={isSaving || !hasChanges || !currentService}
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
                  {editingItem
                    ? 'Update the item details below'
                    : `New item for ${selectedCategory}`}
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
                  onChange={(_, data) =>
                    setFormData((prev) => ({ ...prev, label: data.value }))
                  }
                  placeholder="e.g., Tenant Access Confirmed"
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={formData.description}
                  onChange={(_, data) =>
                    setFormData((prev) => ({ ...prev, description: data.value }))
                  }
                  placeholder="Describe what needs to be done for this checklist item"
                  rows={3}
                />
              </Field>

              <Field label="Required">
                <Switch
                  checked={formData.isRequired}
                  onChange={(_, data) =>
                    setFormData((prev) => ({ ...prev, isRequired: data.checked }))
                  }
                  label={
                    formData.isRequired
                      ? 'This item must be completed before the deal can progress'
                      : 'This item is optional'
                  }
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
