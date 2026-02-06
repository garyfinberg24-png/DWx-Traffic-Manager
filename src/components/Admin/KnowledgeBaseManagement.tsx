import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Text,
  Input,
  Textarea,
  makeStyles,
  tokens,
  shorthands,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Spinner,
  Badge,
  Switch,
  Card,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Dropdown,
  Option,
  Field,
  Label,
  Menu,
  MenuItem,
  MenuTrigger,
  MenuPopover,
  MenuList,
  SearchBox,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  MoreHorizontal24Regular,
  Book24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { knowledgeBaseService } from '../../services/KnowledgeBaseService';
import {
  KBEntry,
  KBEntryInput,
  KBType,
  KBCategory,
  KB_TYPES,
  KB_CATEGORIES,
} from '../../types/KnowledgeBase';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../Common/ConfirmDialog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_ALL = 'all';
const CATEGORY_ALL = 'all';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

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
  filterDropdown: {
    minWidth: '160px',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
  },
  colTitle: { width: '220px' },
  colType: { width: '100px' },
  colCategory: { width: '120px' },
  colTags: { width: '200px' },
  colActive: { width: '90px' },
  colActions: { width: '70px' },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  inactiveRow: {
    opacity: 0.6,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL),
    gap: tokens.spacingVerticalM,
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },

  // Form dialog styles
  surface: {
    maxWidth: '640px',
    width: '95vw',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  switchField: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding(tokens.spacingVerticalS, '0'),
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

// ---------------------------------------------------------------------------
// Badge color helpers (defined at module level — never inside render)
// ---------------------------------------------------------------------------

const getTypeBadgeColor = (
  type: KBType
): 'brand' | 'success' | 'informative' => {
  switch (type) {
    case 'FAQ':
      return 'brand';
    case 'Glossary':
      return 'success';
    case 'Article':
      return 'informative';
    default:
      return 'informative';
  }
};

const getCategoryBadgeColor = (
  category: KBCategory
): 'brand' | 'success' | 'informative' | 'warning' | 'danger' | 'subtle' => {
  switch (category) {
    case 'General':
      return 'subtle';
    case 'Services':
      return 'brand';
    case 'Products':
      return 'success';
    case 'Process':
      return 'informative';
    case 'Technical':
      return 'warning';
    case 'Commercial':
      return 'danger';
    default:
      return 'subtle';
  }
};

// ---------------------------------------------------------------------------
// Yup validation schema
// ---------------------------------------------------------------------------

const formSchema = yup.object().shape({
  Title: yup
    .string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters'),
  Content: yup.string().required('Content is required'),
  Type: yup
    .string()
    .oneOf(KB_TYPES as string[], 'Invalid type')
    .required('Type is required'),
  Category: yup
    .string()
    .oneOf(KB_CATEGORIES as string[], 'Invalid category')
    .required('Category is required'),
  TagsText: yup.string().optional(),
  SortOrder: yup
    .number()
    .required('Sort order is required')
    .min(0, 'Must be >= 0')
    .integer('Must be a whole number'),
  IsActive: yup.boolean().required(),
});

interface KBFormData {
  Title: string;
  Content: string;
  Type: string;
  Category: string;
  TagsText: string;
  SortOrder: number;
  IsActive: boolean;
}

// ---------------------------------------------------------------------------
// Form dialog component (module-level, NOT inside render)
// ---------------------------------------------------------------------------

interface KBEntryFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: KBEntryInput) => Promise<void>;
  entry: KBEntry | null;
  isLoading: boolean;
}

const KBEntryFormDialog: React.FC<KBEntryFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  entry,
  isLoading,
}) => {
  const styles = useStyles();
  const isEditMode = !!entry;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KBFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(formSchema) as any,
    defaultValues: {
      Title: '',
      Content: '',
      Type: 'FAQ',
      Category: 'General',
      TagsText: '',
      SortOrder: 0,
      IsActive: true,
    },
  });

  useEffect(() => {
    if (entry) {
      reset({
        Title: entry.Title,
        Content: entry.Content,
        Type: entry.Type,
        Category: entry.Category,
        TagsText: entry.Tags?.join(', ') || '',
        SortOrder: entry.SortOrder,
        IsActive: entry.IsActive,
      });
    } else {
      reset({
        Title: '',
        Content: '',
        Type: 'FAQ',
        Category: 'General',
        TagsText: '',
        SortOrder: 0,
        IsActive: true,
      });
    }
  }, [entry, reset]);

  const handleFormSubmit = async (data: KBFormData) => {
    const tags = data.TagsText
      ? data.TagsText.split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const input: KBEntryInput = {
      Title: data.Title,
      Content: data.Content,
      Type: data.Type as KBType,
      Category: data.Category as KBCategory,
      Tags: tags,
      SortOrder: data.SortOrder,
      IsActive: data.IsActive,
    };

    await onSubmit(input);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            {isEditMode ? 'Edit Entry' : 'Add Entry'}
          </DialogTitle>

          <DialogContent>
            <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
              <Field
                label="Title"
                required
                validationMessage={errors.Title?.message}
                validationState={errors.Title ? 'error' : 'none'}
              >
                <Controller
                  name="Title"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="e.g., What is SPFx?" />
                  )}
                />
              </Field>

              <div className={styles.row}>
                <Field
                  label="Type"
                  required
                  validationMessage={errors.Type?.message}
                  validationState={errors.Type ? 'error' : 'none'}
                >
                  <Controller
                    name="Type"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        value={field.value}
                        selectedOptions={[field.value]}
                        onOptionSelect={(_, data) =>
                          field.onChange(data.optionValue)
                        }
                      >
                        {KB_TYPES.map((t) => (
                          <Option key={t} value={t}>
                            {t}
                          </Option>
                        ))}
                      </Dropdown>
                    )}
                  />
                </Field>

                <Field
                  label="Category"
                  required
                  validationMessage={errors.Category?.message}
                  validationState={errors.Category ? 'error' : 'none'}
                >
                  <Controller
                    name="Category"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        value={field.value}
                        selectedOptions={[field.value]}
                        onOptionSelect={(_, data) =>
                          field.onChange(data.optionValue)
                        }
                      >
                        {KB_CATEGORIES.map((c) => (
                          <Option key={c} value={c}>
                            {c}
                          </Option>
                        ))}
                      </Dropdown>
                    )}
                  />
                </Field>
              </div>

              <Field
                label="Content"
                required
                validationMessage={errors.Content?.message}
                validationState={errors.Content ? 'error' : 'none'}
              >
                <Controller
                  name="Content"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Enter the full content for this knowledge base entry..."
                      rows={6}
                      resize="vertical"
                    />
                  )}
                />
              </Field>

              <Field
                label="Tags"
                hint="Comma-separated list of tags"
              >
                <Controller
                  name="TagsText"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="e.g., sharepoint, migration, best-practices"
                    />
                  )}
                />
              </Field>

              <div className={styles.row}>
                <Field
                  label="Sort Order"
                  required
                  validationMessage={errors.SortOrder?.message}
                  validationState={errors.SortOrder ? 'error' : 'none'}
                >
                  <Controller
                    name="SortOrder"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        value={field.value?.toString() || '0'}
                        onChange={(_, data) =>
                          field.onChange(Number(data.value) || 0)
                        }
                      />
                    )}
                  />
                </Field>

                <div className={styles.switchField}>
                  <Label>Active</Label>
                  <Controller
                    name="IsActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={(_, data) => field.onChange(data.checked)}
                      />
                    )}
                  />
                </div>
              </div>
            </form>
          </DialogContent>

          <DialogActions>
            <Button
              appearance="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const KnowledgeBaseManagement: React.FC = () => {
  const styles = useStyles();
  const { showToast } = useToast();

  // Data state
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<KBEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>(TYPE_ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(CATEGORY_ALL);

  // Dialog state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<KBEntry | null>(null);

  // -----------------------------------------------------------------------
  // Data loading
  // -----------------------------------------------------------------------

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const items = await knowledgeBaseService.getAll(true); // include inactive
      setEntries(items);
    } catch (error) {
      showToast('Failed to load knowledge base entries', undefined, 'error');
      console.error('KnowledgeBaseManagement: load error', error);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // -----------------------------------------------------------------------
  // Client-side filtering
  // -----------------------------------------------------------------------

  useEffect(() => {
    let result = entries;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.Title.toLowerCase().includes(query) ||
          e.Content.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== TYPE_ALL) {
      result = result.filter((e) => e.Type === typeFilter);
    }

    if (categoryFilter !== CATEGORY_ALL) {
      result = result.filter((e) => e.Category === categoryFilter);
    }

    setFilteredEntries(result);
  }, [entries, searchQuery, typeFilter, categoryFilter]);

  // -----------------------------------------------------------------------
  // CRUD handlers
  // -----------------------------------------------------------------------

  const handleCreate = async (data: KBEntryInput) => {
    try {
      setIsSaving(true);
      await knowledgeBaseService.create(data);
      showToast('Knowledge base entry created successfully', undefined, 'success');
      await loadEntries();
    } catch (error) {
      showToast('Failed to create entry', undefined, 'error');
      console.error('KnowledgeBaseManagement: create error', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: KBEntryInput) => {
    if (!editingEntry) return;
    try {
      setIsSaving(true);
      await knowledgeBaseService.update(editingEntry.Id, data);
      showToast('Knowledge base entry updated successfully', undefined, 'success');
      await loadEntries();
    } catch (error) {
      showToast('Failed to update entry', undefined, 'error');
      console.error('KnowledgeBaseManagement: update error', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (entry: KBEntry) => {
    try {
      setIsSaving(true);
      await knowledgeBaseService.toggleActive(entry.Id, entry.Title, !entry.IsActive);
      showToast(
        `Entry ${entry.IsActive ? 'deactivated' : 'activated'} successfully`,
        undefined,
        'success'
      );
      await loadEntries();
    } catch (error) {
      showToast('Failed to update entry status', undefined, 'error');
      console.error('KnowledgeBaseManagement: toggle error', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    try {
      setIsSaving(true);
      await knowledgeBaseService.delete(deletingEntry.Id, deletingEntry.Title);
      showToast('Knowledge base entry deleted successfully', undefined, 'success');
      await loadEntries();
    } catch (error) {
      showToast('Failed to delete entry', undefined, 'error');
      console.error('KnowledgeBaseManagement: delete error', error);
    } finally {
      setIsSaving(false);
      setDeletingEntry(null);
    }
  };

  // -----------------------------------------------------------------------
  // Dialog helpers
  // -----------------------------------------------------------------------

  const openCreateForm = () => {
    setEditingEntry(null);
    setIsFormOpen(true);
  };

  const openEditForm = (entry: KBEntry) => {
    setEditingEntry(entry);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" label="Loading knowledge base..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header: filters + actions */}
      <div className={styles.header}>
        <div className={styles.filters}>
          <div className={styles.headerTitle}>
            <Text size={500} weight="semibold">
              Knowledge Base
            </Text>
            <Badge appearance="filled" color="informative">
              {entries.length}
            </Badge>
          </div>

          <SearchBox
            className={styles.searchBox}
            placeholder="Search by title or content..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
          />

          <Dropdown
            className={styles.filterDropdown}
            placeholder="Filter by type"
            value={typeFilter === TYPE_ALL ? 'All Types' : typeFilter}
            selectedOptions={[typeFilter]}
            onOptionSelect={(_, data) =>
              setTypeFilter(data.optionValue || TYPE_ALL)
            }
          >
            <Option value={TYPE_ALL}>All Types</Option>
            {KB_TYPES.map((t) => (
              <Option key={t} value={t}>
                {t}
              </Option>
            ))}
          </Dropdown>

          <Dropdown
            className={styles.filterDropdown}
            placeholder="Filter by category"
            value={
              categoryFilter === CATEGORY_ALL
                ? 'All Categories'
                : categoryFilter
            }
            selectedOptions={[categoryFilter]}
            onOptionSelect={(_, data) =>
              setCategoryFilter(data.optionValue || CATEGORY_ALL)
            }
          >
            <Option value={CATEGORY_ALL}>All Categories</Option>
            {KB_CATEGORIES.map((c) => (
              <Option key={c} value={c}>
                {c}
              </Option>
            ))}
          </Dropdown>
        </div>

        <div className={styles.actions}>
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={openCreateForm}
          >
            Add Entry
          </Button>
        </div>
      </div>

      {/* Table or empty state */}
      {filteredEntries.length === 0 ? (
        <Card className={styles.emptyState}>
          <Book24Regular
            style={{ fontSize: 48, color: tokens.colorNeutralForeground3 }}
          />
          <Text size={400} weight="semibold">
            No entries found
          </Text>
          <Text
            size={300}
            style={{ color: tokens.colorNeutralForeground3 }}
          >
            {searchQuery || typeFilter !== TYPE_ALL || categoryFilter !== CATEGORY_ALL
              ? 'Try adjusting your filters'
              : 'Click "Add Entry" to create your first knowledge base entry'}
          </Text>
          {!searchQuery &&
            typeFilter === TYPE_ALL &&
            categoryFilter === CATEGORY_ALL && (
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={openCreateForm}
              >
                Add your first entry
              </Button>
            )}
        </Card>
      ) : (
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={styles.colTitle}>
                Title
              </TableHeaderCell>
              <TableHeaderCell className={styles.colType}>
                Type
              </TableHeaderCell>
              <TableHeaderCell className={styles.colCategory}>
                Category
              </TableHeaderCell>
              <TableHeaderCell className={styles.colTags}>
                Tags
              </TableHeaderCell>
              <TableHeaderCell className={styles.colActive}>
                Status
              </TableHeaderCell>
              <TableHeaderCell className={styles.colActions}>
                Actions
              </TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.map((entry) => (
              <TableRow
                key={entry.Id}
                className={entry.IsActive ? undefined : styles.inactiveRow}
              >
                <TableCell className={styles.colTitle}>
                  <TableCellLayout>
                    <Text weight="semibold">{entry.Title}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell className={styles.colType}>
                  <Badge
                    appearance="tint"
                    color={getTypeBadgeColor(entry.Type)}
                  >
                    {entry.Type}
                  </Badge>
                </TableCell>
                <TableCell className={styles.colCategory}>
                  <Badge
                    appearance="tint"
                    color={getCategoryBadgeColor(entry.Category)}
                  >
                    {entry.Category}
                  </Badge>
                </TableCell>
                <TableCell className={styles.colTags}>
                  <div className={styles.tagsContainer}>
                    {entry.Tags && entry.Tags.length > 0 ? (
                      entry.Tags.map((tag) => (
                        <Badge
                          key={tag}
                          appearance="outline"
                          size="small"
                        >
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <Text
                        size={200}
                        style={{ color: tokens.colorNeutralForeground3 }}
                      >
                        --
                      </Text>
                    )}
                  </div>
                </TableCell>
                <TableCell className={styles.colActive}>
                  <Badge
                    appearance="filled"
                    color={entry.IsActive ? 'success' : 'danger'}
                  >
                    {entry.IsActive ? 'Active' : 'Inactive'}
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
                          onClick={() => openEditForm(entry)}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          onClick={() => handleToggleActive(entry)}
                        >
                          {entry.IsActive ? 'Deactivate' : 'Activate'}
                        </MenuItem>
                        <MenuItem
                          icon={<Delete24Regular />}
                          onClick={() => setDeletingEntry(entry)}
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

      {/* Create / Edit form dialog */}
      <KBEntryFormDialog
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={editingEntry ? handleUpdate : handleCreate}
        entry={editingEntry}
        isLoading={isSaving}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingEntry}
        title="Delete Entry"
        message={`Are you sure you want to delete "${deletingEntry?.Title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmAppearance="primary"
        intent="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingEntry(null)}
        isLoading={isSaving}
      />
    </div>
  );
};
