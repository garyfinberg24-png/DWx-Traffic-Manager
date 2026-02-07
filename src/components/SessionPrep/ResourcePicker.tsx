/**
 * DWx Traffic Manager - Resource Picker
 * Select and manage suggested resources for session preparation.
 * Styled to match DetailModalShell section patterns.
 */

import React from 'react';
import {
  Text,
  Button,
  makeStyles,
} from '@fluentui/react-components';
import {
  ArrowSyncRegular,
  SparkleRegular,
  OpenRegular,
  StarRegular,
  FolderRegular,
} from '@fluentui/react-icons';
import { SuggestedResource, ResourceType, RESOURCE_TYPE_LABELS } from '../../types/SessionPreparation';
import { DetailSection } from '../MyRequests/DetailModalShell';
import { DW_COLORS } from '../../utils/buttonStyles';

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
  resourceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  resourceCard: {
    padding: '14px',
    border: '1px solid #eee',
    borderRadius: '8px',
    display: 'flex',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  resourceCardSelected: {
    padding: '14px',
    border: '1px solid #1a5a8a',
    borderRadius: '8px',
    display: 'flex',
    gap: '12px',
    cursor: 'pointer',
    backgroundColor: '#e8f4fc',
    transition: 'all 0.15s',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: '2px solid #ccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
    transition: 'all 0.15s',
  },
  checkboxSelected: {
    width: '18px',
    height: '18px',
    borderRadius: '4px',
    border: `2px solid ${DW_COLORS.primary}`,
    backgroundColor: DW_COLORS.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: '1px',
  },
  resourceInfo: {
    flex: 1,
    minWidth: 0,
  },
  resourceName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  typeBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '3px',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  resourceReason: {
    fontSize: '12px',
    color: '#616161',
    lineHeight: '1.4',
    marginBottom: '6px',
  },
  relevance: {
    fontSize: '11px',
    color: '#888',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
});

const RESOURCE_COLORS: Record<ResourceType, { bg: string; text: string }> = {
  slide_deck: { bg: '#e8f4f6', text: '#1e6b7b' },
  case_study: { bg: '#e8f6e8', text: '#107c10' },
  datasheet: { bg: '#f5eefa', text: '#8b5cf6' },
  demo_script: { bg: '#fff4e5', text: '#d97706' },
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
        <Text size={400} weight="semibold">No Resources Suggested</Text>
        <Text>Click "Generate AI Content" to get resource suggestions based on the meeting context.</Text>
      </div>
    );
  }

  return (
    <DetailSection
      icon={<FolderRegular />}
      title="Suggested Resources"
      editButton={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10,
            fontSize: 11, fontWeight: 600, background: 'rgba(26,90,138,0.1)', color: '#1a5a8a',
          }}>
            {selectedCount} of {resources.length} selected
          </span>
          <Button appearance="subtle" icon={<ArrowSyncRegular />} onClick={onRegenerate} size="small">
            Regenerate
          </Button>
        </div>
      }
      last
    >
      <div className={styles.resourceGrid}>
        {resources
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .map((resource) => {
            const colors = RESOURCE_COLORS[resource.type];
            const typeLabel = RESOURCE_TYPE_LABELS[resource.type];
            const isSelected = resource.selected;

            return (
              <div
                key={resource.id}
                className={isSelected ? styles.resourceCardSelected : styles.resourceCard}
                onClick={() => handleToggleSelect(resource.id)}
              >
                <div className={isSelected ? styles.checkboxSelected : styles.checkbox}>
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className={styles.resourceInfo}>
                  <div className={styles.resourceName}>
                    {resource.name}
                    <span className={styles.typeBadge} style={{ background: colors.bg, color: colors.text }}>
                      {typeLabel.label}
                    </span>
                  </div>
                  <div className={styles.resourceReason}>{resource.reason}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className={styles.relevance}>
                      <StarRegular style={{ width: 12, height: 12, color: '#f59e0b' }} />
                      {resource.relevanceScore}% relevance
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
                        style={{ minWidth: 'auto', padding: '2px 6px', fontSize: '11px' }}
                      >
                        Open
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </DetailSection>
  );
};
