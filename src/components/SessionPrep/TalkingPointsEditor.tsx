/**
 * DWx Traffic Manager - Talking Points Editor
 * Edit and manage AI-generated talking points
 */

import React, { useState } from 'react';
import {
  Text,
  Button,
  Card,
  Input,
  Textarea,
  makeStyles,
  tokens,
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
} from '@fluentui/react-icons';
import {
  TalkingPoint,
  TalkingPointCategory,
  TALKING_POINT_CATEGORIES,
  AIGenerationContext,
} from '../../types/SessionPreparation';
import { aiPreparationService } from '../../services/AIPreparationService';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  headerActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalM,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  categorySection: {
    marginBottom: tokens.spacingVerticalL,
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  categoryTitle: {
    fontWeight: '600',
    fontSize: '14px',
  },
  categoryDescription: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  pointCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalXS,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
  },
  pointContent: {
    flex: 1,
    lineHeight: '1.5',
  },
  pointActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0,
  },
  pointNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  customBadge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
  },
  editActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    justifyContent: 'flex-end',
  },
  addForm: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
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

  // Group points by category
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
    const updated = talkingPoints.filter((p) => p.id !== pointId);
    onUpdate(updated);
  };

  const handleAddPoint = () => {
    if (!addingCategory || !newContent.trim()) return;

    const categoryPoints = pointsByCategory[addingCategory];
    const maxOrder = categoryPoints.length > 0
      ? Math.max(...categoryPoints.map((p) => p.order))
      : 0;

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
        const maxOrder = categoryPoints.length > 0
          ? Math.max(...categoryPoints.map((p) => p.order))
          : 0;
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
        <Text size={400} weight="semibold">
          No Talking Points Generated
        </Text>
        <Text>
          Click "Generate AI Content" to create talking points based on the client and service.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text weight="semibold">Talking Points</Text>
          <Badge appearance="filled" color="informative">
            {talkingPoints.length} points
          </Badge>
        </div>
        <div className={styles.headerActions}>
          <Button
            appearance="subtle"
            icon={<ArrowSyncRegular />}
            onClick={onRegenerate}
            size="small"
          >
            Regenerate
          </Button>
        </div>
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map((category) => {
        const points = pointsByCategory[category];
        const categoryInfo = TALKING_POINT_CATEGORIES[category];

        return (
          <div key={category} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <div
                style={{
                  width: '4px',
                  height: '24px',
                  backgroundColor: CATEGORY_COLORS[category],
                  borderRadius: '2px',
                }}
              />
              <div style={{ flex: 1 }}>
                <Text className={styles.categoryTitle}>{categoryInfo.label}</Text>
                <Text className={styles.categoryDescription}>{categoryInfo.description}</Text>
              </div>
              <Menu>
                <MenuTrigger disableButtonEnhancement>
                  <Button appearance="subtle" icon={<AddRegular />} size="small">
                    Add
                  </Button>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem onClick={() => setAddingCategory(category)}>
                      Add Custom Point
                    </MenuItem>
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

            {/* Points */}
            {points.map((point, index) => (
              <Card
                key={point.id}
                className={styles.pointCard}
                style={{ borderLeftColor: CATEGORY_COLORS[category] }}
              >
                {editingId === point.id ? (
                  <div className={styles.editForm} style={{ flex: 1 }}>
                    <Textarea
                      value={editContent}
                      onChange={(_, data) => setEditContent(data.value)}
                      rows={3}
                    />
                    <div className={styles.editActions}>
                      <Button
                        appearance="subtle"
                        icon={<DismissRegular />}
                        onClick={handleCancelEdit}
                        size="small"
                      >
                        Cancel
                      </Button>
                      <Button
                        appearance="primary"
                        icon={<CheckmarkRegular />}
                        onClick={handleSaveEdit}
                        size="small"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className={styles.pointNumber}>{index + 1}</span>
                    <Text className={styles.pointContent}>
                      {point.content}
                      {point.isCustom && (
                        <Badge
                          appearance="outline"
                          size="small"
                          className={styles.customBadge}
                        >
                          Custom
                        </Badge>
                      )}
                    </Text>
                    <div className={styles.pointActions}>
                      <Button
                        appearance="subtle"
                        icon={<EditRegular />}
                        onClick={() => handleStartEdit(point)}
                        size="small"
                        aria-label="Edit"
                      />
                      <Button
                        appearance="subtle"
                        icon={<DeleteRegular />}
                        onClick={() => handleDelete(point.id)}
                        size="small"
                        aria-label="Delete"
                      />
                    </div>
                  </>
                )}
              </Card>
            ))}

            {/* Add form */}
            {addingCategory === category && (
              <div className={styles.addForm}>
                <Input
                  placeholder="Enter your talking point..."
                  value={newContent}
                  onChange={(_, data) => setNewContent(data.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  appearance="subtle"
                  icon={<DismissRegular />}
                  onClick={() => {
                    setAddingCategory(null);
                    setNewContent('');
                  }}
                  size="small"
                />
                <Button
                  appearance="primary"
                  icon={<CheckmarkRegular />}
                  onClick={handleAddPoint}
                  size="small"
                  disabled={!newContent.trim()}
                />
              </div>
            )}

            {points.length === 0 && addingCategory !== category && (
              <Text
                style={{
                  color: tokens.colorNeutralForeground4,
                  fontStyle: 'italic',
                  padding: tokens.spacingVerticalS,
                }}
              >
                No {categoryInfo.label.toLowerCase()} talking points yet
              </Text>
            )}
          </div>
        );
      })}
    </div>
  );
};
