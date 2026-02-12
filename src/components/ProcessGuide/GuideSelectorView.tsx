/**
 * DWx Traffic Manager - Guide Selector View
 * Landing/selector screen showing available process guides grouped by category.
 * v2.18.0
 */

import React, { useMemo } from 'react';
import { Button, Text, makeStyles, shorthands } from '@fluentui/react-components';
import {
  Dismiss24Regular,
  CheckmarkCircle24Filled,
  Sparkle24Regular,
  Timer24Regular,
  ArrowRight16Regular,
  BookOpen24Regular,
} from '@fluentui/react-icons';
import type { ProcessGuide, GuideProgress } from '../../types/ProcessGuide';
import { GUIDE_CATEGORIES, DIFFICULTY_COLORS } from '../../types/ProcessGuide';
import { getGuidesByRole, getRecommendedGuides } from '../../data/ProcessGuides';
import { ProcessMapGallery } from '../ProcessStepper';

// ============================================================================
// Props
// ============================================================================

interface GuideSelectorViewProps {
  userRole: 'account_manager' | 'manager';
  progress: Record<string, GuideProgress>;
  onSelectGuide: (guide: ProcessGuide) => void;
  onClose: () => void;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    maxHeight: 'calc(90vh - 2px)',
    overflowY: 'auto',
    backgroundColor: '#f9fafb',
  },
  header: {
    position: 'relative',
    ...shorthands.padding('32px'),
    ...shorthands.borderRadius('0', '0', '16px', '16px'),
    backgroundImage: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 50%, #1e6b7b 100%)',
  },
  closeButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    color: '#ffffff',
    minWidth: '32px',
    ':hover': {
      color: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
  },
  title: {
    fontSize: '28px',
    fontWeight: 700 as unknown as 'bold',
    color: '#ffffff',
    display: 'block',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.75)',
    display: 'block',
    marginBottom: '12px',
    maxWidth: '600px',
    lineHeight: '20px',
  },
  roleBadge: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 600 as unknown as 'bold',
    color: '#ffffff',
    ...shorthands.padding('3px', '12px'),
    ...shorthands.borderRadius('12px'),
    marginBottom: '12px',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  body: {
    ...shorthands.padding('24px', '32px', '32px'),
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 600 as unknown as 'bold',
    color: '#1f2937',
    marginBottom: '12px',
  },
  recommendedRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '14px',
  },
  categoryLabel: {
    fontSize: '16px',
    fontWeight: 600 as unknown as 'bold',
    color: '#1f2937',
  },
  categoryDescription: {
    fontSize: '12px',
    color: '#6b7280',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', '#e8e8e8'),
    ...shorthands.padding('20px'),
    cursor: 'pointer',
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    ':hover': {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)',
    },
  },
  cardTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600 as unknown as 'bold',
    color: '#1f2937',
    flexGrow: 1,
    lineHeight: '20px',
  },
  completedCheck: {
    color: '#10B981',
    flexShrink: 0,
  },
  cardDescription: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '18px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    ...shorthands.overflow('hidden'),
  },
  cardBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: 'auto',
    paddingTop: '4px',
  },
  difficultyBadge: {
    fontSize: '11px',
    fontWeight: 600 as unknown as 'bold',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('8px'),
    textTransform: 'capitalize',
  },
  timeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#6b7280',
  },
  cardAction: {
    marginLeft: 'auto',
  },
});

// ============================================================================
// Component
// ============================================================================

export const GuideSelectorView: React.FC<GuideSelectorViewProps> = ({
  userRole,
  progress,
  onSelectGuide,
  onClose,
}) => {
  const styles = useStyles();

  const guides = useMemo(() => getGuidesByRole(userRole), [userRole]);
  const recommended = useMemo(() => getRecommendedGuides(userRole), [userRole]);

  const completedCount = useMemo(
    () => Object.values(progress).filter((p) => p.completed).length,
    [progress]
  );

  const guidesByCategory = useMemo(() => {
    const map = new Map<string, ProcessGuide[]>();
    for (const guide of guides) {
      const list = map.get(guide.category) || [];
      list.push(guide);
      map.set(guide.category, list);
    }
    return map;
  }, [guides]);

  const getButtonLabel = (guide: ProcessGuide): string => {
    const p = progress[guide.id];
    if (p?.completed) return 'Review';
    if (p && p.currentStep > 0) return 'Continue';
    return 'Start Guide';
  };

  const getButtonAppearance = (guide: ProcessGuide): 'primary' | 'outline' => {
    return progress[guide.id]?.completed ? 'outline' : 'primary';
  };

  const roleBadgeBg = userRole === 'manager' ? '#1e6b7b' : '#7c3aed';
  const roleBadgeLabel = userRole === 'manager' ? 'Manager' : 'Account Manager';

  const renderGuideCard = (guide: ProcessGuide) => {
    const category = GUIDE_CATEGORIES.find((c) => c.id === guide.category);
    const catColor = category?.color || '#0078D4';
    const diff = DIFFICULTY_COLORS[guide.difficulty];
    const isCompleted = progress[guide.id]?.completed;

    return (
      <div
        key={guide.id}
        className={styles.card}
        onClick={() => onSelectGuide(guide)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectGuide(guide);
          }
        }}
      >
        <div className={styles.cardTopRow}>
          <div
            className={styles.iconCircle}
            style={{ backgroundColor: `${catColor}15` }}
          >
            <BookOpen24Regular style={{ color: catColor, fontSize: 20 }} />
          </div>
          <Text className={styles.cardTitle}>{guide.title}</Text>
          {isCompleted && (
            <CheckmarkCircle24Filled className={styles.completedCheck} />
          )}
        </div>

        <Text className={styles.cardDescription}>{guide.shortDescription}</Text>

        <div className={styles.cardBottom}>
          <span
            className={styles.difficultyBadge}
            style={{ backgroundColor: diff.bg, color: diff.text }}
          >
            {guide.difficulty}
          </span>
          <span className={styles.timeBadge}>
            <Timer24Regular style={{ fontSize: 14 }} />
            ~{guide.estimatedMinutes} min
          </span>
          <Button
            className={styles.cardAction}
            appearance={getButtonAppearance(guide)}
            size="small"
            icon={<ArrowRight16Regular />}
            iconPosition="after"
            onClick={(e) => {
              e.stopPropagation();
              onSelectGuide(guide);
            }}
          >
            {getButtonLabel(guide)}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button
          className={styles.closeButton}
          appearance="subtle"
          icon={<Dismiss24Regular />}
          onClick={onClose}
          aria-label="Close"
        />
        <Text className={styles.title}>Process Guides</Text>
        <Text className={styles.subtitle}>
          Step-by-step walkthroughs to help you master every feature of DWx Traffic Manager
        </Text>
        <span className={styles.roleBadge} style={{ backgroundColor: roleBadgeBg }}>
          {roleBadgeLabel}
        </span>
        <div className={styles.statRow}>
          <span>{guides.length} guides available</span>
          <span>{completedCount} completed</span>
        </div>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Recommended Section */}
        {recommended.length > 0 && (
          <div>
            <div className={styles.sectionHeading}>
              <Sparkle24Regular style={{ color: '#F59E0B' }} />
              <span>Recommended for you</span>
            </div>
            <div className={styles.recommendedRow}>
              {recommended.map(renderGuideCard)}
            </div>
          </div>
        )}

        {/* Category Sections */}
        {GUIDE_CATEGORIES.map((category) => {
          const categoryGuides = guidesByCategory.get(category.id);
          if (!categoryGuides || categoryGuides.length === 0) return null;

          return (
            <div key={category.id}>
              <div className={styles.categoryHeader}>
                <div
                  style={{
                    width: 4,
                    height: 28,
                    borderRadius: 2,
                    backgroundColor: category.color,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <Text className={styles.categoryLabel}>{category.label}</Text>
                  <Text className={styles.categoryDescription}>
                    {category.description}
                  </Text>
                </div>
              </div>
              <div className={styles.cardGrid}>
                {categoryGuides.map(renderGuideCard)}
              </div>
            </div>
          );
        })}

        {/* Process Maps Gallery */}
        <ProcessMapGallery />
      </div>
    </div>
  );
};
