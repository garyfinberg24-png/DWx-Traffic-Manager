/**
 * DWx Traffic Manager - Resource Picker
 * Select and manage suggested resources for session preparation
 */

import React from 'react';
import {
  Text,
  Button,
  Card,
  Checkbox,
  makeStyles,
  tokens,
  Badge,
} from '@fluentui/react-components';
import {
  DocumentRegular,
  BookRegular,
  TableRegular,
  VideoRegular,
  DocumentBulletListRegular,
  TextBulletListLtrRegular,
  ArrowSyncRegular,
  SparkleRegular,
  OpenRegular,
  StarRegular,
} from '@fluentui/react-icons';
import { SuggestedResource, ResourceType, RESOURCE_TYPE_LABELS } from '../../types/SessionPreparation';

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
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  resourceCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  selectedCard: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: 'rgba(30, 107, 123, 0.05)',
  },
  resourceHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
  },
  resourceIcon: {
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resourceInfo: {
    flex: 1,
    minWidth: 0,
  },
  resourceName: {
    fontWeight: '600',
    fontSize: '14px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  resourceType: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXXS,
  },
  resourceReason: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.4',
  },
  resourceFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacingVerticalXS,
  },
  relevanceScore: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  selectedCount: {
    padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    fontSize: '13px',
  },
});

const RESOURCE_ICONS: Record<ResourceType, React.ReactElement> = {
  slide_deck: <BookRegular />,
  case_study: <DocumentRegular />,
  datasheet: <TableRegular />,
  demo_script: <TextBulletListLtrRegular />,
  proposal_template: <DocumentBulletListRegular />,
  video: <VideoRegular />,
};

const RESOURCE_COLORS: Record<ResourceType, { bg: string; text: string }> = {
  slide_deck: { bg: '#e8f4f6', text: '#1e6b7b' },
  case_study: { bg: '#e8f6e8', text: '#107c10' },
  datasheet: { bg: '#f5eefa', text: '#8b5cf6' },
  demo_script: { bg: '#fff4e5', text: '#f59e0b' },
  proposal_template: { bg: '#fde7e9', text: '#d13438' },
  video: { bg: '#e6f2ff', text: '#0078d4' },
};

interface ResourcePickerProps {
  resources: SuggestedResource[];
  onUpdate: (resources: SuggestedResource[]) => void;
  onRegenerate: () => void;
}

export const ResourcePicker: React.FC<ResourcePickerProps> = ({
  resources,
  onUpdate,
  onRegenerate,
}) => {
  const styles = useStyles();

  const handleToggleSelect = (resourceId: string) => {
    const updated = resources.map((r) =>
      r.id === resourceId ? { ...r, selected: !r.selected } : r
    );
    onUpdate(updated);
  };

  const selectedCount = resources.filter((r) => r.selected).length;

  if (resources.length === 0) {
    return (
      <div className={styles.emptyState}>
        <SparkleRegular style={{ fontSize: '48px' }} />
        <Text size={400} weight="semibold">
          No Resources Suggested
        </Text>
        <Text>
          Click "Generate AI Content" to get resource suggestions based on the meeting context.
        </Text>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text weight="semibold">Suggested Resources</Text>
          <Badge appearance="filled" color="informative">
            {resources.length} suggestions
          </Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
          <div className={styles.selectedCount}>
            <Text weight="medium">{selectedCount}</Text> selected
          </div>
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

      {/* Resources Grid */}
      <div className={styles.resourceGrid}>
        {resources
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .map((resource) => {
            const colors = RESOURCE_COLORS[resource.type];
            const typeLabel = RESOURCE_TYPE_LABELS[resource.type];

            return (
              <Card
                key={resource.id}
                className={`${styles.resourceCard} ${resource.selected ? styles.selectedCard : ''}`}
                onClick={() => handleToggleSelect(resource.id)}
              >
                <div className={styles.resourceHeader}>
                  <Checkbox
                    checked={resource.selected}
                    onChange={() => handleToggleSelect(resource.id)}
                    aria-label={`Select ${resource.name}`}
                  />
                  <div
                    className={styles.resourceIcon}
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {RESOURCE_ICONS[resource.type]}
                  </div>
                  <div className={styles.resourceInfo}>
                    <Text className={styles.resourceName}>{resource.name}</Text>
                    <div className={styles.resourceType}>
                      <Badge appearance="outline" size="small">
                        {typeLabel.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Text className={styles.resourceReason}>{resource.reason}</Text>

                <div className={styles.resourceFooter}>
                  <div className={styles.relevanceScore}>
                    <StarRegular style={{ width: '14px', height: '14px' }} />
                    {resource.relevanceScore}% match
                  </div>
                  {resource.url && (
                    <Button
                      appearance="subtle"
                      icon={<OpenRegular />}
                      size="small"
                      as="a"
                      href={resource.url}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
};
