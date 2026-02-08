import React, { useState, useCallback, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Button,
  Text,
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
import type { LessonLearned, LessonType } from '../../types/PostMortem';
import { LESSON_TYPES, generateItemId } from '../../types/PostMortem';

const LESSON_TYPE_COLORS: Record<LessonType, { bg: string; text: string }> = {
  'Process Improvement': { bg: '#dbeafe', text: '#1e40af' },
  'Best Practice': { bg: '#d1fae5', text: '#065f46' },
  'Pitfall to Avoid': { bg: '#fee2e2', text: '#991b1b' },
  'Client Management': { bg: '#fef3c7', text: '#92400e' },
  'Technical Learning': { bg: '#ede9fe', text: '#6d28d9' },
};

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
  lessonCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    marginBottom: '8px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
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
  lessonText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
  },
  contextText: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '18px',
    fontStyle: 'italic',
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
  deleteDialogText: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
  },
});

interface LessonEditorProps {
  lessons: LessonLearned[];
  onChange: (lessons: LessonLearned[]) => void;
  readOnly?: boolean;
}

interface LessonFormData {
  type: LessonType;
  lesson: string;
  context: string;
}

const DEFAULT_FORM: LessonFormData = {
  type: 'Process Improvement',
  lesson: '',
  context: '',
};

export const LessonEditor: React.FC<LessonEditorProps> = ({
  lessons,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<LessonFormData>({ ...DEFAULT_FORM });

  const grouped = useMemo(() => {
    const groups: Record<string, LessonLearned[]> = {};
    for (const lt of LESSON_TYPES) {
      const items = lessons.filter((l) => l.type === lt);
      if (items.length > 0) {
        groups[lt] = items;
      }
    }
    return groups;
  }, [lessons]);

  const openAddDialog = useCallback(() => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((lesson: LessonLearned) => {
    setEditingId(lesson.id);
    setForm({
      type: lesson.type,
      lesson: lesson.lesson,
      context: lesson.context,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.lesson.trim()) return;

    if (editingId) {
      const updated = lessons.map((l) =>
        l.id === editingId
          ? {
              ...l,
              type: form.type,
              lesson: form.lesson.trim(),
              context: form.context.trim(),
            }
          : l,
      );
      onChange(updated);
    } else {
      const newLesson: LessonLearned = {
        id: generateItemId(),
        type: form.type,
        lesson: form.lesson.trim(),
        context: form.context.trim(),
        applicability: [],
        aiGenerated: false,
      };
      onChange([...lessons, newLesson]);
    }
    setDialogOpen(false);
    setEditingId(null);
  }, [editingId, form, lessons, onChange]);

  const confirmDelete = useCallback((id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (deleteId) {
      onChange(lessons.filter((l) => l.id !== deleteId));
    }
    setDeleteDialogOpen(false);
    setDeleteId(null);
  }, [deleteId, lessons, onChange]);

  const updateField = useCallback(
    <K extends keyof LessonFormData>(field: K, value: LessonFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.headerTitle}>
          Lessons Learned ({lessons.length})
        </Text>
        {!readOnly && (
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            size="small"
            onClick={openAddDialog}
          >
            Add Lesson
          </Button>
        )}
      </div>

      {Object.keys(grouped).length === 0 && (
        <Text className={styles.emptyMessage}>
          No lessons captured yet.
        </Text>
      )}

      {Object.entries(grouped).map(([type, items]) => (
        <div key={type}>
          <Text className={styles.groupHeader}>{type}</Text>
          {items.map((lesson) => (
            <div key={lesson.id} className={styles.lessonCard}>
              <div className={styles.topRow}>
                <div className={styles.badgeRow}>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor:
                        LESSON_TYPE_COLORS[lesson.type].bg,
                      color: LESSON_TYPE_COLORS[lesson.type].text,
                    }}
                  >
                    {lesson.type}
                  </span>
                  {lesson.aiGenerated && (
                    <span
                      className={styles.sparkleIcon}
                      title="AI-generated"
                    >
                      <Sparkle20Regular />
                    </span>
                  )}
                </div>
                {!readOnly && (
                  <div className={styles.actions}>
                    <Button
                      appearance="subtle"
                      icon={<Edit24Regular />}
                      size="small"
                      onClick={() => openEditDialog(lesson)}
                      title="Edit lesson"
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      size="small"
                      onClick={() => confirmDelete(lesson.id)}
                      title="Delete lesson"
                    />
                  </div>
                )}
              </div>
              <Text className={styles.lessonText}>{lesson.lesson}</Text>
              {lesson.context && (
                <Text className={styles.contextText}>
                  Context: {lesson.context}
                </Text>
              )}
            </div>
          ))}
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
              {editingId ? 'Edit Lesson' : 'Add Lesson'}
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
                  <Text className={styles.formLabel}>Type</Text>
                  <Dropdown
                    value={form.type}
                    selectedOptions={[form.type]}
                    onOptionSelect={(_, d) =>
                      updateField('type', d.optionValue as LessonType)
                    }
                  >
                    {LESSON_TYPES.map((lt) => (
                      <Option key={lt} value={lt}>
                        {lt}
                      </Option>
                    ))}
                  </Dropdown>
                </div>

                <div className={styles.formField}>
                  <Text className={styles.formLabel}>Lesson</Text>
                  <Textarea
                    value={form.lesson}
                    onChange={(_, d) => updateField('lesson', d.value)}
                    placeholder="Describe the lesson learned..."
                    rows={3}
                    resize="vertical"
                  />
                </div>

                <div className={styles.formField}>
                  <Text className={styles.formLabel}>Context</Text>
                  <Textarea
                    value={form.context}
                    onChange={(_, d) => updateField('context', d.value)}
                    placeholder="Describe the situation or context..."
                    rows={2}
                    resize="vertical"
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
                disabled={!form.lesson.trim()}
              >
                {editingId ? 'Save Changes' : 'Add Lesson'}
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
            <DialogTitle>Delete Lesson</DialogTitle>
            <DialogContent>
              <Text className={styles.deleteDialogText}>
                Are you sure you want to delete this lesson? This action
                cannot be undone.
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

export default LessonEditor;
