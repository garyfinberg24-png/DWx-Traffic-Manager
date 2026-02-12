/**
 * DWx Traffic Manager - Process Map Gallery
 * Thumbnail grid of all 6 workflow diagrams for the Guide Selector.
 * v2.18.0
 */

import React, { useState } from 'react';
import {
  makeStyles,
  shorthands,
  Text,
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import type { StepperStyle } from '../../types/ProcessStepper';
import { PROCESS_MAP_ITEMS, getStepperData } from '../../data/ProcessSteppers';
import { STEPPER_STYLES } from '../../types/ProcessStepper';
import { ProcessStepper } from './ProcessStepper';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  section: {
    marginTop: '24px',
    ...shorthands.padding('20px', '24px'),
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius('12px'),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
  },
  sectionSubtitle: {
    fontSize: '13px',
    color: '#6b7280',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('12px'),
  },
  card: {
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('10px'),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    ':hover': {
      ...shorthands.border('1px', 'solid', '#d1d5db'),
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      transform: 'translateY(-2px)',
    },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryBadge: {
    fontSize: '10px',
    fontWeight: '600',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('10px'),
    color: 'white',
    whiteSpace: 'nowrap',
  },
  cardDescription: {
    fontSize: '12px',
    color: '#6b7280',
    lineHeight: '1.4',
    marginBottom: '12px',
  },
  miniPreview: {
    ...shorthands.padding('8px'),
    ...shorthands.borderRadius('6px'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#f3f4f6'),
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    overflowX: 'auto',
  },
  miniNode: {
    width: '24px',
    height: '24px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
  },
  miniArrow: {
    color: '#d1d5db',
    fontSize: '10px',
    flexShrink: 0,
  },
  expandIcon: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    opacity: 0,
    color: '#9ca3af',
    transitionProperty: 'opacity',
    transitionDuration: '200ms',
  },
  cardWrapper: {
    position: 'relative' as const,
    ':hover .expand-icon': {
      opacity: 1,
    },
  },
  // Modal styles
  dialogSurface: {
    maxWidth: '900px',
    width: '90vw',
  },
  stylePicker: {
    display: 'flex',
    ...shorthands.gap('6px'),
    marginBottom: '16px',
  },
  styleBtn: {
    fontSize: '12px',
  },
  styleBtnActive: {
    fontSize: '12px',
    fontWeight: '600',
  },
});

// ============================================================================
// Component
// ============================================================================

export const ProcessMapGallery: React.FC = () => {
  const styles = useStyles();
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StepperStyle>('linear');

  const handleCardClick = (dataKey: string, recommendedStyle: StepperStyle) => {
    setSelectedMap(dataKey);
    setSelectedStyle(recommendedStyle);
  };

  const handleClose = () => {
    setSelectedMap(null);
  };

  const selectedData = selectedMap ? getStepperData(selectedMap) : null;

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <Text className={styles.sectionTitle}>Process Maps</Text>
            <br />
            <Text className={styles.sectionSubtitle}>
              Visual workflow diagrams — click to explore in full size
            </Text>
          </div>
        </div>

        <div className={styles.grid}>
          {PROCESS_MAP_ITEMS.map((item) => {
            const data = getStepperData(item.dataKey);
            if (!data) return null;

            return (
              <div
                key={item.id}
                className={styles.card}
                onClick={() => handleCardClick(item.dataKey, item.recommendedStyle)}
              >
                <div className={styles.cardHeader}>
                  <Text className={styles.cardTitle}>{item.title}</Text>
                  <span
                    className={styles.categoryBadge}
                    style={{ backgroundColor: item.categoryColor }}
                  >
                    {item.category}
                  </span>
                </div>
                <Text className={styles.cardDescription}>{item.description}</Text>

                {/* Mini preview — simplified node circles */}
                <div className={styles.miniPreview}>
                  {data.nodes
                    .filter((n) => n.type !== 'terminal-failure' && n.type !== 'lateral')
                    .slice(0, 6)
                    .map((node, i, arr) => (
                      <React.Fragment key={node.id}>
                        <div
                          className={styles.miniNode}
                          style={{ backgroundColor: node.color }}
                          title={node.label}
                        />
                        {i < arr.length - 1 && (
                          <span className={styles.miniArrow}>&#9654;</span>
                        )}
                      </React.Fragment>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-size stepper modal */}
      <Dialog open={!!selectedMap} onOpenChange={(_, d) => { if (!d.open) handleClose(); }}>
        <DialogSurface className={styles.dialogSurface} style={{ padding: 0 }}>
          <DialogBody style={{ padding: '20px 24px' }}>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  onClick={handleClose}
                />
              }
            >
              {selectedData?.title ?? 'Process Map'}
            </DialogTitle>
            <DialogContent>
              {/* Style picker pills */}
              <div className={styles.stylePicker}>
                {STEPPER_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    appearance={selectedStyle === s.id ? 'primary' : 'subtle'}
                    className={selectedStyle === s.id ? styles.styleBtnActive : styles.styleBtn}
                    size="small"
                    onClick={() => setSelectedStyle(s.id)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>

              {/* Render the stepper */}
              {selectedData && (
                <ProcessStepper
                  data={selectedData}
                  style={selectedStyle}
                  showLegend
                  interactive
                />
              )}
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};
