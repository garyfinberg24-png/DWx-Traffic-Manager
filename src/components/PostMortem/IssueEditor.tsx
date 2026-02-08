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
  RadioGroup,
  Radio,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  Sparkle20Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import type {
  PostMortemIssue,
  IssueCategory,
  IssueSeverity,
  IssueOwner,
} from '../../types/PostMortem';
import {
  ISSUE_CATEGORIES,
  ISSUE_SEVERITIES,
  ISSUE_OWNERS,
  SEVERITY_COLORS,
  OWNER_COLORS,
  generateItemId,
} from '../../types/PostMortem';
import type { FunnelStage } from '../../types/ServiceRequest';

const FUNNEL_STAGES: FunnelStage[] = [
  'Lead',
  'Qualified',
  'Discovery',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
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
  issueCard: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('6px'),
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
    marginBottom: '8px',
  },
  issueTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
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
  description: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground1,
    lineHeight: '20px',
  },
  impactText: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '18px',
    fontStyle: 'italic',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
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
  stageBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: '11px',
    fontWeight: '600',
    lineHeight: '16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
});

interface IssueEditorProps {
  issues: PostMortemIssue[];
  onChange: (issues: PostMortemIssue[]) => void;
  readOnly?: boolean;
}

interface IssueFormData {
  category: IssueCategory;
  severity: IssueSeverity;
  owner: IssueOwner;
  stage: FunnelStage | '';
  description: string;
  impact: string;
}

const DEFAULT_FORM: IssueFormData = {
  category: 'Communication',
  severity: 'Moderate',
  owner: 'Account Manager',
  stage: '',
  description: '',
  impact: '',
};

export const IssueEditor: React.FC<IssueEditorProps> = ({
  issues,
  onChange,
  readOnly = false,
}) => {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<IssueFormData>({ ...DEFAULT_FORM });

  const grouped = useMemo(() => {
    const groups: Record<string, PostMortemIssue[]> = {};
    for (const cat of ISSUE_CATEGORIES) {
      const items = issues.filter((i) => i.category === cat);
      if (items.length > 0) {
        groups[cat] = items;
      }
    }
    return groups;
  }, [issues]);

  const openAddDialog = useCallback(() => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM });
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((issue: PostMortemIssue) => {
    setEditingId(issue.id);
    setForm({
      category: issue.category,
      severity: issue.severity,
      owner: issue.owner,
      stage: issue.stage || '',
      description: issue.description,
      impact: issue.impact,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!form.description.trim()) return;

    if (editingId) {
      const updated = issues.map((i) =>
        i.id === editingId
          ? {
              ...i,
              category: form.category,
              severity: form.severity,
              owner: form.owner,
              stage: form.stage || undefined,
              description: form.description.trim(),
              impact: form.impact.trim(),
            }
          : i,
      );
      onChange(updated);
    } else {
      const newIssue: PostMortemIssue = {
        id: generateItemId(),
        category: form.category,
        severity: form.severity,
        owner: form.owner,
        stage: form.stage || undefined,
        description: form.description.trim(),
        impact: form.impact.trim(),
        dateIdentified: new Date().toISOString(),
        aiGenerated: false,
      };
      onChange([...issues, newIssue]);
    }
    setDialogOpen(false);
    setEditingId(null);
  }, [editingId, form, issues, onChange]);

  const confirmDelete = useCallback(
    (id: string) => {
      setDeleteId(id);
      setDeleteDialogOpen(true);
    },
    [],
  );

  const handleDelete = useCallback(() => {
    if (deleteId) {
      onChange(issues.filter((i) => i.id !== deleteId));
    }
    setDeleteDialogOpen(false);
    setDeleteId(null);
  }, [deleteId, issues, onChange]);

  const updateField = useCallback(
    <K extends keyof IssueFormData>(field: K, value: IssueFormData[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.headerTitle}>
          Issues ({issues.length})
        </Text>
        {!readOnly && (
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            size="small"
            onClick={openAddDialog}
          >
            Add Issue
          </Button>
        )}
      </div>

      {Object.keys(grouped).length === 0 && (
        <Text className={styles.emptyMessage}>
          No issues identified yet.
        </Text>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <Text className={styles.groupHeader}>{category}</Text>
          {items.map((issue) => (
            <div key={issue.id} className={styles.issueCard}>
              <div className={styles.issueTopRow}>
                <div className={styles.badgeRow}>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor: SEVERITY_COLORS[issue.severity].bg,
                      color: SEVERITY_COLORS[issue.severity].text,
                    }}
                  >
                    {issue.severity}
                  </span>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor: OWNER_COLORS[issue.owner].bg,
                      color: OWNER_COLORS[issue.owner].text,
                    }}
                  >
                    {issue.owner}
                  </span>
                  {issue.stage && (
                    <span className={styles.stageBadge}>{issue.stage}</span>
                  )}
                  {issue.aiGenerated && (
                    <span className={styles.sparkleIcon} title="AI-generated">
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
                      onClick={() => openEditDialog(issue)}
                      title="Edit issue"
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      size="small"
                      onClick={() => confirmDelete(issue.id)}
                      title="Delete issue"
                    />
                  </div>
                )}
              </div>
              <Text className={styles.description}>{issue.description}</Text>
              {issue.impact && (
                <Text className={styles.impactText}>
                  Impact: {issue.impact}
                </Text>
              )}
              {issue.dateIdentified && (
                <div className={styles.metaRow}>
                  <span>
                    Identified:{' '}
                    {new Date(issue.dateIdentified).toLocaleDateString()}
                  </span>
                </div>
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
              {editingId ? 'Edit Issue' : 'Add Issue'}
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
                          d.optionValue as IssueCategory,
                        )
                      }
                    >
                      {ISSUE_CATEGORIES.map((cat) => (
                        <Option key={cat} value={cat}>
                          {cat}
                        </Option>
                      ))}
                    </Dropdown>
                  </div>
                  <div
                    className={`${styles.formField} ${styles.formRowItem}`}
                  >
                    <Text className={styles.formLabel}>Owner</Text>
                    <Dropdown
                      value={form.owner}
                      selectedOptions={[form.owner]}
                      onOptionSelect={(_, d) =>
                        updateField('owner', d.optionValue as IssueOwner)
                      }
                    >
                      {ISSUE_OWNERS.map((o) => (
                        <Option key={o} value={o}>
                          {o}
                        </Option>
                      ))}
                    </Dropdown>
                  </div>
                </div>

                <div className={styles.formField}>
                  <Text className={styles.formLabel}>Severity</Text>
                  <RadioGroup
                    layout="horizontal"
                    value={form.severity}
                    onChange={(_, d) =>
                      updateField('severity', d.value as IssueSeverity)
                    }
                  >
                    {ISSUE_SEVERITIES.map((sev) => (
                      <Radio key={sev} value={sev} label={sev} />
                    ))}
                  </RadioGroup>
                </div>

                <div className={styles.formField}>
                  <Text className={styles.formLabel}>
                    Stage (optional)
                  </Text>
                  <Dropdown
                    value={form.stage || ''}
                    selectedOptions={form.stage ? [form.stage] : []}
                    onOptionSelect={(_, d) =>
                      updateField(
                        'stage',
                        (d.optionValue as FunnelStage) || '',
                      )
                    }
                    placeholder="Select stage..."
                  >
                    {FUNNEL_STAGES.map((s) => (
                      <Option key={s} value={s}>
                        {s}
                      </Option>
                    ))}
                  </Dropdown>
                </div>

                <div className={styles.formField}>
                  <Text className={styles.formLabel}>Description</Text>
                  <Textarea
                    value={form.description}
                    onChange={(_, d) => updateField('description', d.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                    resize="vertical"
                  />
                </div>

                <div className={styles.formField}>
                  <Text className={styles.formLabel}>Impact</Text>
                  <Textarea
                    value={form.impact}
                    onChange={(_, d) => updateField('impact', d.value)}
                    placeholder="Describe the impact of this issue..."
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
                disabled={!form.description.trim()}
              >
                {editingId ? 'Save Changes' : 'Add Issue'}
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
            <DialogTitle>Delete Issue</DialogTitle>
            <DialogContent>
              <Text className={styles.deleteDialogText}>
                Are you sure you want to delete this issue? This action
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

export default IssueEditor;
