/**
 * DWx Traffic Manager - Talking Points Editor
 * Edit and manage AI-generated talking points with category grouping.
 * Styled to match DetailModalShell section patterns.
 */

import React, { useState } from 'react';
import {
  Text,
  Button,
  Input,
  Textarea,
  makeStyles,
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  AddRegular,
  DeleteRegular,
  EditRegular,
  ArrowSyncRegular,
  SparkleRegular,
  CheckmarkRegular,
  DismissRegular,
  ChatRegular,
} from '@fluentui/react-icons';
import {
  TalkingPoint,
  TalkingPointCategory,
  TALKING_POINT_CATEGORIES,
  AIGenerationContext,
} from '../../types/SessionPreparation';
import { aiPreparationService } from '../../services/AIPreparationService';
import { DetailSection } from '../MyRequests/DetailModalShell';

const useStyles = makeStyles({
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    gap: '16px',
    textAlign: 'center',
    color: '#888',
  },
  category: {
    marginBottom: '20px',
    borderRadius: '8px',
    border: '1px solid #eee',
    overflow: 'hidden',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    backgroundColor: '#f9f9f9',
    borderBottom: '1px solid #eee',
  },
  colorBar: {
    width: '4px',
    height: '24px',
    borderRadius: '2px',
  },
  categoryName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#424242',
    flex: 1,
  },
  categoryDesc: {
    fontSize: '12px',
    color: '#888',
  },
  point: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
  pointNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    flexShrink: 0,
    marginTop: '1px',
  },
  pointContent: {
    flex: 1,
    fontSize: '13px',
    color: '#424242',
    lineHeight: '1.5',
  },
  pointActions: {
    display: 'flex',
    gap: '2px',
    flexShrink: 0,
    opacity: 0.4,
    transition: 'opacity 0.15s',
  },
  actionBtn: {
    minWidth: '28px',
    height: '28px',
    padding: 0,
  },
  editForm: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '4px 0',
  },
  editActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  addForm: {
    display: 'flex',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#f9f9f9',
    borderTop: '1px solid #eee',
  },
  emptyCategory: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#aaa',
    fontStyle: 'italic',
  },
});

const CATEGORY_ORDER: TalkingPointCategory[] = ['opening', 'discovery', 'value_prop', 'objection', 'closing'];

const CATEGORY_COLORS: Record<TalkingPointCategory, string> = {
  opening: '#107c10',
  discovery: '#0078d4',
  value_prop: '#8b5cf6',
  objection: '#d13438',
  closing: '#f59e0b',
};

interface TalkingPointsEditorProps {
  talkingPoints: TalkingPoint[];
  context: AIGenerationContext;
  onUpdate: (points: TalkingPoint[]) => void;
  onRegenerate: () => void;
}

export const TalkingPointsEditor: React.FC<TalkingPointsEditorProps> = ({
  talkingPoints,
  context,
  onUpdate,
  onRegenerate,
}) => {
  const styles = useStyles();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [addingCategory, setAddingCategory] = useState<TalkingPointCategory | null>(null);
  const [newContent, setNewContent] = useState('');
  const [generating, setGenerating] = useState(false);

  const pointsByCategory = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = talkingPoints
      .filter((p) => p.category === category)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {} as Record<TalkingPointCategory, TalkingPoint[]>);

  const handleStartEdit = (point: TalkingPoint) => {
    setEditingId(point.id);
    setEditContent(point.content);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const updated = talkingPoints.map((p) =>
      p.id === editingId ? { ...p, content: editContent, isCustom: true } : p
    );
    onUpdate(updated);
    setEditingId(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = (pointId: string) => {
    onUpdate(talkingPoints.filter((p) => p.id !== pointId));
  };

  const handleAddPoint = () => {
    if (!addingCategory || !newContent.trim()) return;
    const categoryPoints = pointsByCategory[addingCategory];
    const maxOrder = categoryPoints.length > 0 ? Math.max(...categoryPoints.map((p) => p.order)) : 0;

    const newPoint: TalkingPoint = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: addingCategory,
      content: newContent.trim(),
      isCustom: true,
      order: maxOrder + 1,
    };

    onUpdate([...talkingPoints, newPoint]);
    setAddingCategory(null);
    setNewContent('');
  };

  const handleGenerateCustomPoint = async (category: TalkingPointCategory, instruction: string) => {
    try {
      setGenerating(true);
      const point = await aiPreparationService.generateCustomTalkingPoint(category, context, instruction);
      if (point) {
        const categoryPoints = pointsByCategory[category];
        const maxOrder = categoryPoints.length > 0 ? Math.max(...categoryPoints.map((p) => p.order)) : 0;
        point.order = maxOrder + 1;
        onUpdate([...talkingPoints, point]);
      }
    } catch (error) {
      console.error('Failed to generate custom talking point:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (talkingPoints.length === 0) {
    return (
      <div className={styles.emptyState}>
        <SparkleRegular style={{ fontSize: '48px' }} />
        <Text size={400} weight="semibold">No Talking Points Generated</Text>
        <Text>Click "Generate AI Content" to create talking points based on the client and service.</Text>
      </div>
    );
  }

  return (
    <DetailSection
      icon={<ChatRegular />}
      title="Talking Points"
      editButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10,
            fontSize: 11, fontWeight: 600, background: 'rgba(26,90,138,0.1)', color: '#1a5a8a',
          }}>
            {talkingPoints.length} points
          </span>
          <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={onRegenerate} size="small">
            Regenerate
          </Button>
        </div>
      }
      last
    >
      {CATEGORY_ORDER.map((category) => {
        const points = pointsByCategory[category];
        const categoryInfo = TALKING_POINT_CATEGORIES[category];
        const color = CATEGORY_COLORS[category];

        return (
          <div key={category} className={styles.category}>
            <div className={styles.categoryHeader}>
              <div className={styles.colorBar} style={{ backgroundColor: color }} />
              <span className={styles.categoryName}>{categoryInfo.label}</span>
              <span className={styles.categoryDesc}>{categoryInfo.description}</span>
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Button appearance="subtle" icon={<AddRegular />} size="small">Add</Button>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem onClick={() => setAddingCategory(category)}>Add Custom Point</MenuItem>
                    <MenuItem
                      onClick={() => handleGenerateCustomPoint(category, 'Generate a relevant talking point')}
                      disabled={generating}
                    >
                      <SparkleRegular style={{ marginRight: '8px' }} />
                      Generate with AI
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>

            <div>
              {points.map((point, index) => (
                <div
                  key={point.id}
                  className={styles.point}
                  style={index === points.length - 1 && addingCategory !== category ? { borderBottom: 'none' } : undefined}
                  onMouseEnter={(e) => {
                    const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement;
                    if (actions) actions.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const actions = e.currentTarget.querySelector('[data-actions]') as HTMLElement;
                    if (actions) actions.style.opacity = '0.4';
                  }}
                >
                  {editingId === point.id ? (
                    <div className={styles.editForm}>
                      <Textarea
                        value={editContent}
                        onChange={(_, data) => setEditContent(data.value)}
                        rows={3}
                      />
                      <div className={styles.editActions}>
                        <Button appearance="subtle" icon={<DismissRegular />} onClick={handleCancelEdit} size="small">Cancel</Button>
                        <Button appearance="primary" icon={<CheckmarkRegular />} onClick={handleSaveEdit} size="small">Save</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={styles.pointNum} style={{ backgroundColor: color }}>{index + 1}</div>
                      <div className={styles.pointContent}>
                        {point.content}
                        {point.isCustom && (
                          <Badge appearance="outline" size="small" style={{ marginLeft: '8px' }}>Custom</Badge>
                        )}
                      </div>
                      <div className={styles.pointActions} data-actions>
                        <Button className={styles.actionBtn} appearance="subtle" icon={<EditRegular />} onClick={() => handleStartEdit(point)} size="small" aria-label="Edit" />
                        <Button className={styles.actionBtn} appearance="subtle" icon={<DeleteRegular />} onClick={() => handleDelete(point.id)} size="small" aria-label="Delete" />
                      </div>
                    </>
                  )}
                </div>
              ))}

              {points.length === 0 && addingCategory !== category && (
                <div className={styles.emptyCategory}>
                  No {categoryInfo.label.toLowerCase()} talking points yet
                </div>
              )}
            </div>

            {addingCategory === category && (
              <div className={styles.addForm}>
                <Input
                  placeholder="Enter your talking point..."
                  value={newContent}
                  onChange={(_, data) => setNewContent(data.value)}
                  style={{ flex: 1 }}
                />
                <Button appearance="subtle" icon={<DismissRegular />} onClick={() => { setAddingCategory(null); setNewContent(''); }} size="small" />
                <Button appearance="primary" icon={<CheckmarkRegular />} onClick={handleAddPoint} size="small" disabled={!newContent.trim()} />
              </div>
            )}
          </div>
        );
      })}
    </DetailSection>
  );
};
