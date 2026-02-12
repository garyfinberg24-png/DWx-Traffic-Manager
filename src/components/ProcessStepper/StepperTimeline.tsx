/**
 * DWx Traffic Manager - Stepper Timeline Component
 * Vertical timeline with a gradient left-edge line and accent-bordered cards.
 * Visual only - no backend wiring.
 * v2.18.0
 */

import React, { useMemo } from 'react';
import {
  makeStyles,
  mergeClasses,
  Text,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  Clock12Regular,
} from '@fluentui/react-icons';
import type { ProcessStepperData, StepperNode } from '../../types/ProcessStepper';

// ============================================================================
// Props
// ============================================================================

export interface StepperTimelineProps {
  data: ProcessStepperData;
  interactive?: boolean;
  compact?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  root: {
    position: 'relative',
    ...shorthands.padding('16px', '0px', '16px', '0px'),
  },

  // The vertical gradient line
  line: {
    position: 'absolute',
    left: '18px',
    top: '16px',
    bottom: '16px',
    width: '4px',
    ...shorthands.borderRadius('2px'),
  },

  nodeRow: {
    display: 'flex',
    alignItems: 'flex-start',
    position: 'relative',
    marginBottom: '12px',
    ':last-child': {
      marginBottom: '0px',
    },
  },
  nodeRowCompact: {
    marginBottom: '6px',
  },

  // Connector dot on the line
  dot: {
    position: 'relative',
    zIndex: 1,
    width: '12px',
    height: '12px',
    ...shorthands.borderRadius('50%'),
    flexShrink: 0,
    marginTop: '14px',
    marginLeft: '14px',
    border: '2px solid white',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
  },
  dotCompact: {
    width: '10px',
    height: '10px',
    marginTop: '8px',
    marginLeft: '15px',
  },

  // Card to the right of the dot
  card: {
    marginLeft: '16px',
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('12px', '16px', '12px', '16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    borderLeft: '4px solid transparent',
    flex: 1,
    minWidth: 0,
    transitionProperty: 'box-shadow, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
  },
  cardCompact: {
    ...shorthands.padding('6px', '12px', '6px', '12px'),
    ...shorthands.borderRadius('6px'),
  },
  cardInteractive: {
    cursor: 'default',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-1px)',
    },
  },

  // Terminal success card
  cardSuccess: {
    backgroundColor: '#f0fdf4',
    borderLeft: '4px solid #16a34a',
  },
  // Terminal failure card
  cardFailure: {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #dc2626',
  },
  // Lateral card
  cardLateral: {
    backgroundColor: '#fffbeb',
    borderLeft: '4px dashed #d97706',
  },

  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },

  label: {
    fontWeight: 700,
    fontSize: '14px',
    lineHeight: '20px',
    color: tokens.colorNeutralForeground1,
  },
  labelCompact: {
    fontSize: '11px',
    lineHeight: '16px',
  },

  description: {
    marginTop: '4px',
    fontSize: '12px',
    lineHeight: '16px',
    color: tokens.colorNeutralForeground3,
  },

  durationBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    ...shorthands.padding('2px', '8px', '2px', '8px'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: tokens.colorNeutralBackground3,
    fontSize: '11px',
    lineHeight: '16px',
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  durationIcon: {
    fontSize: '12px',
  },
});

// ============================================================================
// Helpers
// ============================================================================

function buildGradientStops(nodes: StepperNode[]): string {
  if (nodes.length === 0) return 'linear-gradient(to bottom, #94a3b8, #94a3b8)';
  if (nodes.length === 1) return `linear-gradient(to bottom, ${nodes[0].color}, ${nodes[0].color})`;

  const stops = nodes.map((node, i) => {
    const pct = (i / (nodes.length - 1)) * 100;
    return `${node.color} ${pct.toFixed(1)}%`;
  });
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

function getCardClass(
  node: StepperNode,
  styles: ReturnType<typeof useStyles>,
  interactive: boolean,
  compact: boolean,
): string {
  const classes = [styles.card];

  if (compact) classes.push(styles.cardCompact);
  if (interactive) classes.push(styles.cardInteractive);

  switch (node.type) {
    case 'terminal-success':
      classes.push(styles.cardSuccess);
      break;
    case 'terminal-failure':
      classes.push(styles.cardFailure);
      break;
    case 'lateral':
      classes.push(styles.cardLateral);
      break;
  }

  return mergeClasses(...classes);
}

// ============================================================================
// Component
// ============================================================================

export const StepperTimeline: React.FC<StepperTimelineProps> = ({
  data,
  interactive = false,
  compact = false,
}) => {
  const styles = useStyles();

  const gradientBackground = useMemo(
    () => buildGradientStops(data.nodes),
    [data.nodes],
  );

  return (
    <div className={styles.root}>
      {/* Vertical gradient line */}
      <div
        className={styles.line}
        style={{ background: gradientBackground }}
      />

      {/* Nodes */}
      {data.nodes.map((node) => {
        const accentColor =
          node.type === 'terminal-success'
            ? '#16a34a'
            : node.type === 'terminal-failure'
              ? '#dc2626'
              : node.type === 'lateral'
                ? '#d97706'
                : node.color;

        return (
          <div
            key={node.id}
            className={mergeClasses(
              styles.nodeRow,
              compact && styles.nodeRowCompact,
            )}
          >
            {/* Dot on the line */}
            <div
              className={mergeClasses(
                styles.dot,
                compact && styles.dotCompact,
              )}
              style={{ backgroundColor: accentColor }}
            />

            {/* Card */}
            <div
              className={getCardClass(node, styles, interactive, compact)}
              style={
                node.type !== 'terminal-success' &&
                node.type !== 'terminal-failure' &&
                node.type !== 'lateral'
                  ? { borderLeftColor: node.color }
                  : undefined
              }
            >
              <div className={styles.cardHeader}>
                <Text
                  className={mergeClasses(
                    styles.label,
                    compact && styles.labelCompact,
                  )}
                >
                  {node.label}
                </Text>

                {node.metadata?.duration && (
                  <span className={styles.durationBadge}>
                    <Clock12Regular className={styles.durationIcon} />
                    {node.metadata.duration}
                  </span>
                )}
              </div>

              {!compact && node.description && (
                <Text className={styles.description}>
                  {node.description}
                </Text>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepperTimeline;
