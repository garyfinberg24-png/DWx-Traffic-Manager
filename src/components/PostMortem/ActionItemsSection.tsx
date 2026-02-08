import React, { useState, useCallback, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Text,
  Input,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Dropdown,
  Option,
  Textarea,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Sparkle20Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import type {
  ActionItem,
  ActionItemStatus,
  ActionItemPriority,
  ActionItemCategory,
} from '../../types/PostMortem';
import {
  ACTION_ITEM_STATUSES,
  ACTION_ITEM_PRIORITIES,
  ACTION_ITEM_CATEGORIES,
  ACTION_STATUS_TRANSITIONS,
  ACTION_STATUS_COLORS,
  PRIORITY_COLORS,
  generateItemId,
} from '../../types/PostMortem';

const CATEGORY_COLORS: Record<ActionItemCategory, { bg: string; text: string }> = {
  Process: { bg: '#dbeafe', text: '#1e40af' },
  System: { bg: '#e5e7eb', text: '#4b5563' },
  Training: { bg: '#fef3c7', text: '#92400e' },
  Documentation: { bg: '#ede9fe', text: '#6d28d9' },
  Template: { bg: '#fce7f3', text: '#be185d' },
};

const STATUS_DISPLAY_ORDER: ActionItemStatus[] = [
  'Open',
  'In Progress',
  'Blocked',
  'Completed',
  'Cancelled',
];

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  groupHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
    ...shorthands.padding('8px', '0', '4px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    marginBottom: '8px',
  },
  itemCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    marginBottom: '8px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('2px'),
    flexGrow: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
  },
  itemDescription: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '18px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    flexWrap: 'wrap',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '16px',
    whiteSpace: 'nowrap',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    flexWrap: 'wrap',
  },
  sparkleIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#8b5cf6',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    flexShrink: 0,
  },
  transitionRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    ...shorthands.padding('4px', '0', '0', '0'),
  },
  emptyMessage: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic',
    ...shorthands.padding('12px', '0'),
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
  },
  formRow: {
    display: 'flex',
    ...shorthands.gap('12px'),
  },
  formRowItem: {
    flexGrow: 1,
    flexBasis: '0',
  },
  deleteDialogText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
  dueDateOverdue: {
    color: '#dc2626',
    fontWeight: '600',
  },
});

interface ActionItemsSectionProps {
  actionItems: ActionItem[];
  onChange: (items: ActionItem[]) => void;
  readOnly?: boolean;
}

interface ActionFormData {
  title: string;
  description: string;
  priority: ActionItemPriority;
  status: ActionItemStatus;
  category: ActionItemCategory;
  assignedTo: string;
  dueDate: string;
}

const DEFAULT_FORM: ActionFormData = {
  title: '',
  description: '',
  priority: 'Medium',
  status: 'Open',
  category: 'Process',
  assignedTo: '',
  dueDate: '',
};

export const ActionItemsSection: React.FC<ActionItemsSectionProps> = ({
  actionItems,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ActionFormData>({ ...DEFAULT_FORM });

  const grouped = useMemo(() => {
    const groups: Record<string, ActionItem[]> = {};
    for (const status of STATUS_DISPLAY_ORDER) {
      const items = actionItems.filter((a) => a.status === status);
      if (items.length > 0) {
        groups[status] = items;
      }
    }
    return groups;
  }, [actionItems]);

  const openAddDialog = useCallback(() => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((item: ActionItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      priority: item.priority,
      status: item.status,
      category: item.category,
      assignedTo: item.assignedToName || item.assignedTo || '',
      dueDate: item.dueDate
        ? new Date(item.dueDate).toISOString().split('T')[0]
        : '',
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.title.trim()) return;

    if (editingId) {
      const updated = actionItems.map((a) =>
        a.id === editingId
          ? {
              ...a,
              title: form.title.trim(),
              description: form.description.trim(),
              priority: form.priority,
              status: form.status,
              category: form.category,
              assignedTo: form.assignedTo.trim() || undefined,
              assignedToName: form.assignedTo.trim() || undefined,
              dueDate: form.dueDate || undefined,
              completedDate:
                form.status === 'Completed' && a.status !== 'Completed'
                  ? new Date().toISOString()
                  : a.completedDate,
            }
          : a,
      );
      onChange(updated);
    } else {
      const newItem: ActionItem = {
        id: generateItemId(),
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        status: form.status,
        category: form.category,
        assignedTo: form.assignedTo.trim() || undefined,
        assignedToName: form.assignedTo.trim() || undefined,
        dueDate: form.dueDate || undefined,
        aiGenerated: false,
      };
      onChange([...actionItems, newItem]);
    }
    setDialogOpen(false);
    setEditingId(null);
  }, [editingId, form, actionItems, onChange]);

  const confirmDelete = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (deleteId) {
      onChange(actionItems.filter((a) => a.id !== deleteId));
    }
    setDeleteDialogOpen(false);
    setDeleteId(null);
  }, [deleteId, actionItems, onChange]);

  const handleStatusTransition = useCallback(
    (itemId: string, newStatus: ActionItemStatus) => {
      const updated = actionItems.map((a) =>
        a.id === itemId
          ? {
              ...a,
              status: newStatus,
              completedDate:
                newStatus === 'Completed'
                  ? new Date().toISOString()
                  : a.completedDate,
            }
          : a,
      );
      onChange(updated);
    },
    [actionItems, onChange],
  );

  const updateField = useCallback(
    <K extends keyof ActionFormData>(field: K, value: ActionFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const isDueDateOverdue = (dueDate: string | undefined, status: ActionItemStatus): boolean => {
    if (!dueDate || status === 'Completed' || status === 'Cancelled') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.headerTitle}>
          Action Items ({actionItems.length})
        </Text>
        {!readOnly && (
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            size="small"
            onClick={openAddDialog}
          >
            Add Action Item
          </Button>
        )}
      </div>

      {Object.keys(grouped).length === 0 && (
        <Text className={styles.emptyMessage}>
          No action items created yet.
        </Text>
      )}

      {Object.entries(grouped).map(([status, items]) => (
        <div key={status}>
          <Text className={styles.groupHeader}>
            {status} ({items.length})
          </Text>
          {items.map((item) => {
            const validTransitions =
              ACTION_STATUS_TRANSITIONS[item.status] || [];
            return (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.topRow}>
                  <div className={styles.titleSection}>
                    <Text className={styles.itemTitle}>{item.title}</Text>
                    {item.description && (
                      <Text className={styles.itemDescription}>
                        {item.description}
                      </Text>
                    )}
                  </div>
                  {!readOnly && (
                    <div className={styles.actions}>
                      <Button
                        appearance="subtle"
                        icon={<Edit24Regular />}
                        size="small"
                        onClick={() => openEditDialog(item)}
                        title="Edit action item"
                      />
                      <Button
                        appearance="subtle"
                        icon={<Delete24Regular />}
                        size="small"
                        onClick={() => confirmDelete(item.id)}
                        title="Delete action item"
                      />
                    </div>
                  )}
                </div>

                <div className={styles.badgeRow}>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor:
                        PRIORITY_COLORS[item.priority].bg,
                      color: PRIORITY_COLORS[item.priority].text,
                    }}
                  >
                    {item.priority}
                  </span>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor:
                        ACTION_STATUS_COLORS[item.status].bg,
                      color: ACTION_STATUS_COLORS[item.status].text,
                    }}
                  >
                    {item.status}
                  </span>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor: CATEGORY_COLORS[item.category].bg,
                      color: CATEGORY_COLORS[item.category].text,
                    }}
                  >
                    {item.category}
                  </span>
                  {item.aiGenerated && (
                    <span
                      className={styles.sparkleIcon}
                      title="AI-generated"
                    >
                      <Sparkle20Regular />
                    </span>
                  )}
                </div>

                <div className={styles.metaRow}>
                  <span>
                    Assigned to:{' '}
                    {item.assignedToName || item.assignedTo || 'Unassigned'}
                  </span>
                  {item.dueDate && (
                    <span
                      className={
                        isDueDateOverdue(item.dueDate, item.status)
                          ? styles.dueDateOverdue
                          : undefined
                      }
                    >
                      Due:{' '}
                      {new Date(item.dueDate).toLocaleDateString()}
                      {isDueDateOverdue(item.dueDate, item.status) &&
                        ' (Overdue)'}
                    </span>
                  )}
                  {item.completedDate && (
                    <span>
                      Completed:{' '}
                      {new Date(
                        item.completedDate,
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {!readOnly && validTransitions.length > 0 && (
                  <div className={styles.transitionRow}>
                    {validTransitions.map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        appearance="outline"
                        size="small"
                        onClick={() =>
                          handleStatusTransition(item.id, nextStatus)
                        }
                      >
                        {nextStatus}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(_, d) => setDialogOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle
              action={
                <DialogTrigger action="close">
                  <Button
                    appearance="subtle"
                    icon={<Dismiss24Regular />}
                    aria-label="Close"
                  />
                </DialogTrigger>
              }
            >
              {editingId ? 'Edit Action Item' : 'Add Action Item'}
            </DialogTitle>
            <DialogContent>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  paddingTop: '8px',
                }}
              >
                <div className={styles.formField}>
                  <Text className={styles.formLabel}>Title</Text>
                  <Input
                    value={form.title}
                    onChange={(_, d) => updateField('title', d.value)}
                    placeholder="Action item title..."
                  />
                </div>

                <div className={styles.formField}>
                  <Text className={styles.formLabel}>Description</Text>
                  <Textarea
                    value={form.description}
                    onChange={(_, d) =>
                      updateField('description', d.value)
                    }
                    placeholder="Describe the action item..."
                    rows={2}
                    resize="vertical"
                  />
                </div>

                <div className={styles.formRow}>
                  <div
                    className={`${styles.formField} ${styles.formRowItem}`}
                  >
                    <Text className={styles.formLabel}>Priority</Text>
                    <Dropdown
                      value={form.priority}
                      selectedOptions={[form.priority]}
                      onOptionSelect={(_, d) =>
                        updateField(
                          'priority',
                          d.optionValue as ActionItemPriority,
                        )
                      }
                    >
                      {ACTION_ITEM_PRIORITIES.map((p) => (
                        <Option key={p} value={p}>
                          {p}
                        </Option>
                      ))}
                    </Dropdown>
                  </div>
                  <div
                    className={`${styles.formField} ${styles.formRowItem}`}
                  >
                    <Text className={styles.formLabel}>Status</Text>
                    <Dropdown
                      value={form.status}
                      selectedOptions={[form.status]}
                      onOptionSelect={(_, d) =>
                        updateField(
                          'status',
                          d.optionValue as ActionItemStatus,
                        )
                      }
                    >
                      {ACTION_ITEM_STATUSES.map((s) => (
                        <Option key={s} value={s}>
                          {s}
                        </Option>
                      ))}
                    </Dropdown>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div
                    className={`${styles.formField} ${styles.formRowItem}`}
                  >
                    <Text className={styles.formLabel}>Category</Text>
                    <Dropdown
                      value={form.category}
                      selectedOptions={[form.category]}
                      onOptionSelect={(_, d) =>
                        updateField(
                          'category',
                          d.optionValue as ActionItemCategory,
                        )
                      }
                    >
                      {ACTION_ITEM_CATEGORIES.map((c) => (
                        <Option key={c} value={c}>
                          {c}
                        </Option>
                      ))}
                    </Dropdown>
                  </div>
                  <div
                    className={`${styles.formField} ${styles.formRowItem}`}
                  >
                    <Text className={styles.formLabel}>
                      Assigned To
                    </Text>
                    <Input
                      value={form.assignedTo}
                      onChange={(_, d) =>
                        updateField('assignedTo', d.value)
                      }
                      placeholder="Person name..."
                    />
                  </div>
                </div>

                <div className={styles.formField}>
                  <Text className={styles.formLabel}>Due Date</Text>
                  <Input
                    type="date"
                    value={form.dueDate}
                    onChange={(_, d) => updateField('dueDate', d.value)}
                  />
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={handleSave}
                disabled={!form.title.trim()}
              >
                {editingId ? 'Save Changes' : 'Add Action Item'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(_, d) => setDeleteDialogOpen(d.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Action Item</DialogTitle>
            <DialogContent>
              <Text className={styles.deleteDialogText}>
                Are you sure you want to delete this action item? This
                action cannot be undone.
              </Text>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleDelete}>
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default ActionItemsSection;
