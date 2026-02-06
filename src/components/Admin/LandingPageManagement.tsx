import React, { useState, useEffect } from 'react';
import {
  Button, Text, Input, Textarea, makeStyles, tokens, shorthands,
  TabList, Tab, SelectTabEvent, SelectTabData,
  Spinner, MessageBar, MessageBarBody, MessageBarTitle,
  Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent,
  Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell,
  Badge,
} from '@fluentui/react-components';
import { Add24Regular, Delete24Regular, Save24Regular, ArrowUp24Regular, ArrowDown24Regular, Edit24Regular } from '@fluentui/react-icons';
import { landingPageContentService } from '../../services/LandingPageContentService';
import { LandingPageTeamMember, DEFAULT_LANDING_PAGE_CONTENT } from '../../types/LandingPageContent';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  tabList: {
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    marginBottom: tokens.spacingVerticalM,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  listRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  listInput: {
    flexGrow: 1,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap(tokens.spacingVerticalM, tokens.spacingHorizontalM),
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXS),
  },
  formFieldFull: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXS),
    gridColumn: '1 / -1',
  },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  statsValueInput: {
    width: '100px',
  },
  statsLabelInput: {
    flexGrow: 1,
  },
  saveRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    ...shorthands.gap(tokens.spacingHorizontalS),
    marginTop: tokens.spacingVerticalM,
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXL),
  },
  messageBar: {
    marginBottom: tokens.spacingVerticalM,
  },
  table: {
    width: '100%',
  },
  dialogSurface: {
    maxWidth: '700px',
    width: '100%',
  },
  dialogForm: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalM),
    maxHeight: '60vh',
    ...shorthands.overflow('auto'),
    ...shorthands.padding(tokens.spacingVerticalXS),
  },
  chipRow: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    marginTop: tokens.spacingVerticalXS,
  },
  hobbyRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
  hobbyEmojiInput: {
    width: '60px',
  },
  hobbyLabelInput: {
    flexGrow: 1,
  },
  textContentSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
    ...shorthands.padding(tokens.spacingVerticalS, '0'),
  },
  textContentGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
    ...shorthands.padding(tokens.spacingVerticalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  footerLinksGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  resourceRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  resourceLabelInput: {
    flexGrow: 1,
  },
  resourceRouteInput: {
    width: '200px',
  },
});

// ============================================================================
// Types
// ============================================================================

type SectionTab = 'slogans' | 'whatWeDo' | 'stats' | 'testimonial' | 'teamMembers' | 'textContent' | 'footerLinks';

interface FeedbackState {
  type: 'success' | 'error';
  message: string;
}

// ============================================================================
// Helpers — defined at module level to avoid re-creation on each render
// ============================================================================

function swapItems<T>(arr: T[], i: number, j: number): T[] {
  if (i < 0 || j < 0 || i >= arr.length || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function createEmptyTeamMember(): LandingPageTeamMember {
  return {
    name: '', role: '', spec: '', img: 1,
    specFull: '', engagements: '', years: '',
    quote: '', highlightWords: [],
    inspiration: '',
    hobbies: [],
    websites: [],
  };
}

// ============================================================================
// Component
// ============================================================================

export const LandingPageManagement: React.FC = () => {
  const styles = useStyles();

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>('slogans');

  // Content mirrors
  const [slogans, setSlogans] = useState<string[]>([]);
  const [whatWeDo, setWhatWeDo] = useState<string[]>([]);
  const [stats, setStats] = useState(DEFAULT_LANDING_PAGE_CONTENT.stats);
  const [testimonial, setTestimonial] = useState(DEFAULT_LANDING_PAGE_CONTENT.testimonial);
  const [teamMembers, setTeamMembers] = useState<LandingPageTeamMember[]>([]);
  const [mastheadText, setMastheadText] = useState(DEFAULT_LANDING_PAGE_CONTENT.mastheadText);
  const [teamPanelText, setTeamPanelText] = useState(DEFAULT_LANDING_PAGE_CONTENT.teamPanelText);
  const [footerText, setFooterText] = useState(DEFAULT_LANDING_PAGE_CONTENT.footerText);
  const [footerServices, setFooterServices] = useState<string[]>([]);
  const [footerProducts, setFooterProducts] = useState<string[]>([]);
  const [footerResources, setFooterResources] = useState(DEFAULT_LANDING_PAGE_CONTENT.footerResources);

  // Team member dialog
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<LandingPageTeamMember | null>(null);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number>(-1);
  const [memberDraft, setMemberDraft] = useState<LandingPageTeamMember>(createEmptyTeamMember());

  // ---------------------------------------------------------------------------
  // Load data on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await landingPageContentService.getAllContent();
        if (cancelled) return;
        setSlogans(data.slogans);
        setWhatWeDo(data.whatWeDo);
        setStats(data.stats);
        setTestimonial(data.testimonial);
        setTeamMembers(data.teamMembers);
        setMastheadText(data.mastheadText);
        setTeamPanelText(data.teamPanelText);
        setFooterText(data.footerText);
        setFooterServices(data.footerServices);
        setFooterProducts(data.footerProducts);
        setFooterResources(data.footerResources);
      } catch (err) {
        console.error('[LandingPageManagement] Failed to load content:', err);
        if (!cancelled) {
          setFeedback({ type: 'error', message: 'Failed to load landing page content. Showing defaults.' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------------------------------
  // Save helpers
  // ---------------------------------------------------------------------------
  const saveSection = async (key: string, data: unknown, label: string) => {
    setSaving(true);
    setFeedback(null);
    try {
      await landingPageContentService.updateSection(key as import('../../types/LandingPageContent').ContentSectionKey, data);
      setFeedback({ type: 'success', message: `${label} saved successfully.` });
    } catch (err) {
      console.error(`[LandingPageManagement] Failed to save ${key}:`, err);
      setFeedback({ type: 'error', message: `Failed to save ${label}. Please try again.` });
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Tab selection
  // ---------------------------------------------------------------------------
  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as SectionTab);
    setFeedback(null);
  };

  // ---------------------------------------------------------------------------
  // String list helpers (slogans, whatWeDo, footerServices, footerProducts)
  // ---------------------------------------------------------------------------
  const updateStringItem = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string,
  ) => {
    const next = [...list];
    next[index] = value;
    setter(next);
  };

  const addStringItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => [...prev, '']);
  };

  const removeStringItem = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
  ) => {
    setter(list.filter((_, i) => i !== index));
  };

  const moveStringItem = (
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    direction: 'up' | 'down',
  ) => {
    setter(swapItems(list, index, direction === 'up' ? index - 1 : index + 1));
  };

  // ---------------------------------------------------------------------------
  // Team member dialog handlers
  // ---------------------------------------------------------------------------
  const openAddMember = () => {
    setEditingMember(null);
    setEditingMemberIndex(-1);
    setMemberDraft(createEmptyTeamMember());
    setTeamDialogOpen(true);
  };

  const openEditMember = (member: LandingPageTeamMember, index: number) => {
    setEditingMember(member);
    setEditingMemberIndex(index);
    setMemberDraft({ ...member });
    setTeamDialogOpen(true);
  };

  const handleMemberSave = () => {
    if (editingMember && editingMemberIndex >= 0) {
      const next = [...teamMembers];
      next[editingMemberIndex] = { ...memberDraft };
      setTeamMembers(next);
    } else {
      setTeamMembers((prev) => [...prev, { ...memberDraft }]);
    }
    setTeamDialogOpen(false);
  };

  const handleMemberDelete = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDraft = (field: keyof LandingPageTeamMember, value: unknown) => {
    setMemberDraft((prev) => ({ ...prev, [field]: value }));
  };

  // ---------------------------------------------------------------------------
  // Render: String list editor (reused for slogans, whatWeDo, footer lists)
  // ---------------------------------------------------------------------------
  const renderStringList = (
    items: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    sectionKey: string,
    sectionLabel: string,
    placeholder: string,
  ) => (
    <div>
      <div className={styles.sectionHeader}>
        <Text weight="semibold" size={400}>{sectionLabel}</Text>
        <Button
          appearance="subtle"
          icon={<Add24Regular />}
          size="small"
          onClick={() => addStringItem(setter)}
        >
          Add
        </Button>
      </div>
      <div className={styles.listContainer}>
        {items.map((item, idx) => (
          <div key={idx} className={styles.listRow}>
            <Badge appearance="outline" size="small">{idx + 1}</Badge>
            <Input
              className={styles.listInput}
              value={item}
              placeholder={placeholder}
              onChange={(_, d) => updateStringItem(items, setter, idx, d.value)}
            />
            <Button
              appearance="subtle"
              icon={<ArrowUp24Regular />}
              size="small"
              disabled={idx === 0}
              onClick={() => moveStringItem(items, setter, idx, 'up')}
              title="Move up"
            />
            <Button
              appearance="subtle"
              icon={<ArrowDown24Regular />}
              size="small"
              disabled={idx === items.length - 1}
              onClick={() => moveStringItem(items, setter, idx, 'down')}
              title="Move down"
            />
            <Button
              appearance="subtle"
              icon={<Delete24Regular />}
              size="small"
              onClick={() => removeStringItem(items, setter, idx)}
              title="Remove"
            />
          </div>
        ))}
        {items.length === 0 && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
            No items. Click "Add" to create one.
          </Text>
        )}
      </div>
      <div className={styles.saveRow}>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          disabled={saving}
          onClick={() => saveSection(sectionKey, items, sectionLabel)}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Stats
  // ---------------------------------------------------------------------------
  const renderStats = () => (
    <div>
      <div className={styles.sectionHeader}>
        <Text weight="semibold" size={400}>Statistics</Text>
      </div>
      <div className={styles.listContainer}>
        {stats.map((stat, idx) => (
          <div key={idx} className={styles.statsRow}>
            <Badge appearance="outline" size="small">{idx + 1}</Badge>
            <Input
              className={styles.statsValueInput}
              value={stat.value}
              placeholder="Value"
              onChange={(_, d) => {
                const next = [...stats];
                next[idx] = { ...next[idx], value: d.value };
                setStats(next);
              }}
            />
            <Input
              className={styles.statsLabelInput}
              value={stat.label}
              placeholder="Label"
              onChange={(_, d) => {
                const next = [...stats];
                next[idx] = { ...next[idx], label: d.value };
                setStats(next);
              }}
            />
            <Button
              appearance="subtle"
              icon={<Delete24Regular />}
              size="small"
              onClick={() => setStats(stats.filter((_, i) => i !== idx))}
              title="Remove"
            />
          </div>
        ))}
        <Button
          appearance="subtle"
          icon={<Add24Regular />}
          size="small"
          onClick={() => setStats((prev) => [...prev, { value: '', label: '' }])}
        >
          Add Stat
        </Button>
      </div>
      <div className={styles.saveRow}>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          disabled={saving}
          onClick={() => saveSection('stats', stats, 'Statistics')}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Testimonial
  // ---------------------------------------------------------------------------
  const renderTestimonial = () => (
    <div>
      <div className={styles.sectionHeader}>
        <Text weight="semibold" size={400}>Testimonial</Text>
      </div>
      <div className={styles.formGrid}>
        <div className={styles.formFieldFull}>
          <Text size={200} weight="semibold">Quote</Text>
          <Textarea
            value={testimonial.quote}
            rows={3}
            onChange={(_, d) => setTestimonial((prev) => ({ ...prev, quote: d.value }))}
            placeholder="Testimonial quote text"
          />
        </div>
        <div className={styles.formField}>
          <Text size={200} weight="semibold">Name</Text>
          <Input
            value={testimonial.name}
            onChange={(_, d) => setTestimonial((prev) => ({ ...prev, name: d.value }))}
            placeholder="Person's name"
          />
        </div>
        <div className={styles.formField}>
          <Text size={200} weight="semibold">Role</Text>
          <Input
            value={testimonial.role}
            onChange={(_, d) => setTestimonial((prev) => ({ ...prev, role: d.value }))}
            placeholder="Job title"
          />
        </div>
        <div className={styles.formField}>
          <Text size={200} weight="semibold">Company</Text>
          <Input
            value={testimonial.company}
            onChange={(_, d) => setTestimonial((prev) => ({ ...prev, company: d.value }))}
            placeholder="Company name"
          />
        </div>
        <div className={styles.formField}>
          <Text size={200} weight="semibold">Avatar URL</Text>
          <Input
            value={testimonial.avatarUrl}
            onChange={(_, d) => setTestimonial((prev) => ({ ...prev, avatarUrl: d.value }))}
            placeholder="https://..."
          />
        </div>
        <div className={styles.formField}>
          <Text size={200} weight="semibold">Rating (1-5)</Text>
          <Input
            type="number"
            min={1}
            max={5}
            value={testimonial.rating.toString()}
            onChange={(_, d) => setTestimonial((prev) => ({ ...prev, rating: Math.min(5, Math.max(1, Number(d.value) || 1)) }))}
          />
        </div>
      </div>
      <div className={styles.saveRow}>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          disabled={saving}
          onClick={() => saveSection('testimonial', testimonial, 'Testimonial')}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Team Members
  // ---------------------------------------------------------------------------
  const renderTeamMembers = () => (
    <div>
      <div className={styles.sectionHeader}>
        <Text weight="semibold" size={400}>Team Members</Text>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          size="small"
          onClick={openAddMember}
        >
          Add Member
        </Button>
      </div>
      {teamMembers.length === 0 ? (
        <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
          No team members configured. Click "Add Member" to create one.
        </Text>
      ) : (
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Specialization</TableHeaderCell>
              <TableHeaderCell style={{ width: '100px' }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Text weight="semibold">{member.name || '(unnamed)'}</Text>
                </TableCell>
                <TableCell>{member.role}</TableCell>
                <TableCell>
                  <Badge appearance="tint" color="brand">{member.spec || '—'}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    appearance="subtle"
                    icon={<Edit24Regular />}
                    size="small"
                    onClick={() => openEditMember(member, idx)}
                    title="Edit"
                  />
                  <Button
                    appearance="subtle"
                    icon={<Delete24Regular />}
                    size="small"
                    onClick={() => handleMemberDelete(idx)}
                    title="Delete"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <div className={styles.saveRow}>
        <Button
          appearance="primary"
          icon={<Save24Regular />}
          disabled={saving}
          onClick={() => saveSection('teamMembers', teamMembers, 'Team Members')}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Team Member Dialog
  // ---------------------------------------------------------------------------
  const renderTeamMemberDialog = () => (
    <Dialog open={teamDialogOpen} onOpenChange={(_, data) => { if (!data.open) setTeamDialogOpen(false); }}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
          <DialogContent>
            <div className={styles.dialogForm}>
              {/* Basic fields */}
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <Text size={200} weight="semibold">Name *</Text>
                  <Input
                    value={memberDraft.name}
                    onChange={(_, d) => updateDraft('name', d.value)}
                    placeholder="Full name"
                  />
                </div>
                <div className={styles.formField}>
                  <Text size={200} weight="semibold">Role *</Text>
                  <Input
                    value={memberDraft.role}
                    onChange={(_, d) => updateDraft('role', d.value)}
                    placeholder="e.g. Solution Architect"
                  />
                </div>
                <div className={styles.formField}>
                  <Text size={200} weight="semibold">Spec (short)</Text>
                  <Input
                    value={memberDraft.spec}
                    onChange={(_, d) => updateDraft('spec', d.value)}
                    placeholder="e.g. Power Platform"
                  />
                </div>
                <div className={styles.formField}>
                  <Text size={200} weight="semibold">Spec (full)</Text>
                  <Input
                    value={memberDraft.specFull}
                    onChange={(_, d) => updateDraft('specFull', d.value)}
                    placeholder="Full specialization text"
                  />
                </div>
                <div className={styles.formField}>
                  <Text size={200} weight="semibold">Image Number</Text>
                  <Input
                    type="number"
                    value={memberDraft.img.toString()}
                    onChange={(_, d) => updateDraft('img', Number(d.value) || 1)}
                    placeholder="Avatar image number"
                  />
                </div>
                <div className={styles.formField}>
                  <Text size={200} weight="semibold">Engagements</Text>
                  <Input
                    value={memberDraft.engagements}
                    onChange={(_, d) => updateDraft('engagements', d.value)}
                    placeholder="e.g. 40+"
                  />
                </div>
                <div className={styles.formField}>
                  <Text size={200} weight="semibold">Years</Text>
                  <Input
                    value={memberDraft.years}
                    onChange={(_, d) => updateDraft('years', d.value)}
                    placeholder="e.g. 12+"
                  />
                </div>
              </div>

              {/* Quote */}
              <div className={styles.formFieldFull}>
                <Text size={200} weight="semibold">Quote</Text>
                <Textarea
                  value={memberDraft.quote}
                  rows={3}
                  onChange={(_, d) => updateDraft('quote', d.value)}
                  placeholder="Personal quote"
                />
              </div>

              {/* Highlight words (comma-separated) */}
              <div className={styles.formFieldFull}>
                <Text size={200} weight="semibold">Highlight Words (comma-separated)</Text>
                <Input
                  value={memberDraft.highlightWords.join(', ')}
                  onChange={(_, d) => updateDraft('highlightWords', d.value.split(',').map((w) => w.trim()).filter(Boolean))}
                  placeholder="works, precision"
                />
              </div>

              {/* Inspiration */}
              <div className={styles.formFieldFull}>
                <Text size={200} weight="semibold">Inspiration</Text>
                <Textarea
                  value={memberDraft.inspiration}
                  rows={2}
                  onChange={(_, d) => updateDraft('inspiration', d.value)}
                  placeholder="What inspires this team member"
                />
              </div>

              {/* Hobbies */}
              <div className={styles.formFieldFull}>
                <div className={styles.sectionHeader}>
                  <Text size={200} weight="semibold">Hobbies</Text>
                  <Button
                    appearance="subtle"
                    icon={<Add24Regular />}
                    size="small"
                    onClick={() => updateDraft('hobbies', [...memberDraft.hobbies, { emoji: '', label: '' }])}
                  >
                    Add
                  </Button>
                </div>
                <div className={styles.listContainer}>
                  {memberDraft.hobbies.map((hobby, hIdx) => (
                    <div key={hIdx} className={styles.hobbyRow}>
                      <Input
                        className={styles.hobbyEmojiInput}
                        value={hobby.emoji}
                        placeholder="Emoji"
                        onChange={(_, d) => {
                          const next = [...memberDraft.hobbies];
                          next[hIdx] = { ...next[hIdx], emoji: d.value };
                          updateDraft('hobbies', next);
                        }}
                      />
                      <Input
                        className={styles.hobbyLabelInput}
                        value={hobby.label}
                        placeholder="Hobby label"
                        onChange={(_, d) => {
                          const next = [...memberDraft.hobbies];
                          next[hIdx] = { ...next[hIdx], label: d.value };
                          updateDraft('hobbies', next);
                        }}
                      />
                      <Button
                        appearance="subtle"
                        icon={<Delete24Regular />}
                        size="small"
                        onClick={() => updateDraft('hobbies', memberDraft.hobbies.filter((_, i) => i !== hIdx))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Websites (one per line) */}
              <div className={styles.formFieldFull}>
                <Text size={200} weight="semibold">Websites (one per line)</Text>
                <Textarea
                  value={memberDraft.websites.join('\n')}
                  rows={3}
                  onChange={(_, d) => updateDraft('websites', d.value.split('\n').filter(Boolean))}
                  placeholder="Microsoft Learn&#10;PnP Community"
                />
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
            <Button
              appearance="primary"
              disabled={!memberDraft.name.trim() || !memberDraft.role.trim()}
              onClick={handleMemberSave}
            >
              {editingMember ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );

  // ---------------------------------------------------------------------------
  // Render: Text Content (masthead, team panel, footer text)
  // ---------------------------------------------------------------------------
  const renderTextContent = () => (
    <div className={styles.textContentSection}>
      {/* Masthead */}
      <div className={styles.textContentGroup}>
        <Text weight="semibold" size={400}>Masthead Text</Text>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <Text size={200} weight="semibold">Title</Text>
            <Input
              value={mastheadText.title}
              onChange={(_, d) => setMastheadText((prev) => ({ ...prev, title: d.value }))}
              placeholder="Your Digital"
            />
          </div>
          <div className={styles.formField}>
            <Text size={200} weight="semibold">Title Accent</Text>
            <Input
              value={mastheadText.titleAccent}
              onChange={(_, d) => setMastheadText((prev) => ({ ...prev, titleAccent: d.value }))}
              placeholder="Partner"
            />
          </div>
          <div className={styles.formFieldFull}>
            <Text size={200} weight="semibold">Lead</Text>
            <Textarea
              value={mastheadText.lead}
              rows={2}
              onChange={(_, d) => setMastheadText((prev) => ({ ...prev, lead: d.value }))}
              placeholder="Lead paragraph text"
            />
          </div>
        </div>
        <div className={styles.saveRow}>
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            disabled={saving}
            onClick={() => saveSection('mastheadText', mastheadText, 'Masthead Text')}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Team Panel */}
      <div className={styles.textContentGroup}>
        <Text weight="semibold" size={400}>Team Panel Text</Text>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <Text size={200} weight="semibold">Title</Text>
            <Input
              value={teamPanelText.title}
              onChange={(_, d) => setTeamPanelText((prev) => ({ ...prev, title: d.value }))}
              placeholder="Your"
            />
          </div>
          <div className={styles.formField}>
            <Text size={200} weight="semibold">Title Accent</Text>
            <Input
              value={teamPanelText.titleAccent}
              onChange={(_, d) => setTeamPanelText((prev) => ({ ...prev, titleAccent: d.value }))}
              placeholder="DWx"
            />
          </div>
          <div className={styles.formFieldFull}>
            <Text size={200} weight="semibold">Subtitle</Text>
            <Textarea
              value={teamPanelText.subtitle}
              rows={2}
              onChange={(_, d) => setTeamPanelText((prev) => ({ ...prev, subtitle: d.value }))}
              placeholder="Subtitle text"
            />
          </div>
        </div>
        <div className={styles.saveRow}>
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            disabled={saving}
            onClick={() => saveSection('teamPanelText', teamPanelText, 'Team Panel Text')}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Footer Text */}
      <div className={styles.textContentGroup}>
        <Text weight="semibold" size={400}>Footer Text</Text>
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <Text size={200} weight="semibold">Brand Title</Text>
            <Input
              value={footerText.brandTitle}
              onChange={(_, d) => setFooterText((prev) => ({ ...prev, brandTitle: d.value }))}
              placeholder="Digital"
            />
          </div>
          <div className={styles.formField}>
            <Text size={200} weight="semibold">Brand Title Accent</Text>
            <Input
              value={footerText.brandTitleAccent}
              onChange={(_, d) => setFooterText((prev) => ({ ...prev, brandTitleAccent: d.value }))}
              placeholder="Workplace"
            />
          </div>
          <div className={styles.formFieldFull}>
            <Text size={200} weight="semibold">Brand Description</Text>
            <Textarea
              value={footerText.brandDescription}
              rows={2}
              onChange={(_, d) => setFooterText((prev) => ({ ...prev, brandDescription: d.value }))}
              placeholder="Brand description text"
            />
          </div>
          <div className={styles.formFieldFull}>
            <Text size={200} weight="semibold">Copyright</Text>
            <Input
              value={footerText.copyright}
              onChange={(_, d) => setFooterText((prev) => ({ ...prev, copyright: d.value }))}
              placeholder="Copyright text"
            />
          </div>
        </div>
        <div className={styles.saveRow}>
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            disabled={saving}
            onClick={() => saveSection('footerText', footerText, 'Footer Text')}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render: Footer Links
  // ---------------------------------------------------------------------------
  const renderFooterLinks = () => (
    <div className={styles.footerLinksGroup}>
      {/* Footer Services */}
      {renderStringList(footerServices, setFooterServices, 'footerServices', 'Footer Services', 'Service name')}

      <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke1}`, margin: `${tokens.spacingVerticalM} 0` }} />

      {/* Footer Products */}
      {renderStringList(footerProducts, setFooterProducts, 'footerProducts', 'Footer Products', 'Product name')}

      <div style={{ borderTop: `1px solid ${tokens.colorNeutralStroke1}`, margin: `${tokens.spacingVerticalM} 0` }} />

      {/* Footer Resources (label + route) */}
      <div>
        <div className={styles.sectionHeader}>
          <Text weight="semibold" size={400}>Footer Resources</Text>
          <Button
            appearance="subtle"
            icon={<Add24Regular />}
            size="small"
            onClick={() => setFooterResources((prev) => [...prev, { label: '', route: '' }])}
          >
            Add
          </Button>
        </div>
        <div className={styles.listContainer}>
          {footerResources.map((resource, idx) => (
            <div key={idx} className={styles.resourceRow}>
              <Badge appearance="outline" size="small">{idx + 1}</Badge>
              <Input
                className={styles.resourceLabelInput}
                value={resource.label}
                placeholder="Label"
                onChange={(_, d) => {
                  const next = [...footerResources];
                  next[idx] = { ...next[idx], label: d.value };
                  setFooterResources(next);
                }}
              />
              <Input
                className={styles.resourceRouteInput}
                value={resource.route}
                placeholder="/route"
                onChange={(_, d) => {
                  const next = [...footerResources];
                  next[idx] = { ...next[idx], route: d.value };
                  setFooterResources(next);
                }}
              />
              <Button
                appearance="subtle"
                icon={<ArrowUp24Regular />}
                size="small"
                disabled={idx === 0}
                onClick={() => setFooterResources(swapItems(footerResources, idx, idx - 1))}
                title="Move up"
              />
              <Button
                appearance="subtle"
                icon={<ArrowDown24Regular />}
                size="small"
                disabled={idx === footerResources.length - 1}
                onClick={() => setFooterResources(swapItems(footerResources, idx, idx + 1))}
                title="Move down"
              />
              <Button
                appearance="subtle"
                icon={<Delete24Regular />}
                size="small"
                onClick={() => setFooterResources(footerResources.filter((_, i) => i !== idx))}
                title="Remove"
              />
            </div>
          ))}
          {footerResources.length === 0 && (
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: 'italic' }}>
              No resources. Click "Add" to create one.
            </Text>
          )}
        </div>
        <div className={styles.saveRow}>
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            disabled={saving}
            onClick={() => saveSection('footerResources', footerResources, 'Footer Resources')}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" label="Loading landing page content..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {feedback && (
        <MessageBar
          intent={feedback.type === 'success' ? 'success' : 'error'}
          className={styles.messageBar}
        >
          <MessageBarBody>
            <MessageBarTitle>{feedback.type === 'success' ? 'Success' : 'Error'}</MessageBarTitle>
            {feedback.message}
          </MessageBarBody>
        </MessageBar>
      )}

      <TabList
        className={styles.tabList}
        selectedValue={activeTab}
        onTabSelect={handleTabSelect}
      >
        <Tab value="slogans">Slogans</Tab>
        <Tab value="whatWeDo">What We Do</Tab>
        <Tab value="stats">Stats</Tab>
        <Tab value="testimonial">Testimonial</Tab>
        <Tab value="teamMembers">Team Members</Tab>
        <Tab value="textContent">Text Content</Tab>
        <Tab value="footerLinks">Footer Links</Tab>
      </TabList>

      {activeTab === 'slogans' && renderStringList(slogans, setSlogans, 'slogans', 'Slogans', 'Enter a slogan...')}
      {activeTab === 'whatWeDo' && renderStringList(whatWeDo, setWhatWeDo, 'whatWeDo', 'What We Do', 'Enter an item...')}
      {activeTab === 'stats' && renderStats()}
      {activeTab === 'testimonial' && renderTestimonial()}
      {activeTab === 'teamMembers' && renderTeamMembers()}
      {activeTab === 'textContent' && renderTextContent()}
      {activeTab === 'footerLinks' && renderFooterLinks()}

      {renderTeamMemberDialog()}
    </div>
  );
};
