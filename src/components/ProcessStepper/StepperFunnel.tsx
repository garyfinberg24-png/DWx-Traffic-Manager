/**
 * DWx Traffic Manager - Stepper Funnel Component
 * Pipeline funnel with decreasing-width bars and side branches.
 * Visual only - no backend wiring.
 * v2.18.0
 */

import React from 'react';
import {
  makeStyles,
  mergeClasses,
  Text,
  Tooltip,
  shorthands,
} from '@fluentui/react-components';
import {
  Checkmark12Regular,
  Dismiss12Regular,
} from '@fluentui/react-icons';
import type { ProcessStepperData, StepperNode } from '../../types/ProcessStepper';

// ============================================================================
// Props
// ============================================================================

export interface StepperFunnelProps {
  data: ProcessStepperData;
  interactive?: boolean;
  compact?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const BAR_HEIGHT = 40;
const BAR_HEIGHT_COMPACT = 28;
const BAR_GAP = 2;

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('8px', '0px', '8px', '0px'),
    width: '100%',
  },

  barRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    marginBottom: `${BAR_GAP}px`,
    ':last-child': {
      marginBottom: '0px',
    },
  },

  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('0px', '16px', '0px', '16px'),
    ...shorthands.borderRadius('6px'),
    height: `${BAR_HEIGHT}px`,
    minWidth: '80px',
    transitionProperty: 'opacity, transform',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    position: 'relative',
  },
  barCompact: {
    height: `${BAR_HEIGHT_COMPACT}px`,
    ...shorthands.padding('0px', '10px', '0px', '10px'),
    ...shorthands.borderRadius('4px'),
    minWidth: '60px',
  },
  barInteractive: {
    cursor: 'default',
    ':hover': {
      opacity: 0.92,
      transform: 'scale(1.01)',
    },
  },

  barLabel: {
    fontWeight: 600,
    fontSize: '13px',
    lineHeight: '20px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  barLabelCompact: {
    fontSize: '11px',
    lineHeight: '16px',
  },

  barPercentage: {
    fontSize: '12px',
    lineHeight: '16px',
    opacity: 0.85,
    fontWeight: 600,
    marginLeft: '8px',
    flexShrink: 0,
  },
  barPercentageCompact: {
    fontSize: '10px',
  },

  barIcon: {
    marginRight: '6px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  },

  // Lateral node: offset to the right with dashed outline
  lateralBar: {
    border: '2px dashed #d97706',
    backgroundColor: 'transparent !important' as never,
    marginLeft: '24px',
  },

  // Terminal-failure: small side branch to the right
  failureBranch: {
    position: 'absolute',
    right: '-8px',
    top: '50%',
    transform: 'translateX(100%) translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },
  failureConnector: {
    width: '16px',
    height: '2px',
    backgroundColor: '#dc2626',
  },
  failureChip: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    ...shorthands.padding('4px', '10px', '4px', '10px'),
    ...shorthands.borderRadius('4px'),
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    fontSize: '11px',
    fontWeight: 600,
    color: '#dc2626',
    whiteSpace: 'nowrap',
  },
  failureChipCompact: {
    ...shorthands.padding('2px', '6px', '2px', '6px'),
    fontSize: '10px',
  },
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determine if the bar text should be white or dark based on the background color.
 * Uses luminance formula.
 */
function getTextColor(bgColor: string): string {
  const hex = bgColor.replace('#', '');
  if (hex.length < 6) return '#ffffff';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}

// ============================================================================
// Component
// ============================================================================

export const StepperFunnel: React.FC<StepperFunnelProps> = ({
  data,
  interactive = false,
  compact = false,
}) => {
  const styles = useStyles();

  // Separate main-flow nodes from failure/lateral side branches
  const mainNodes = data.nodes.filter((n) => n.type !== 'terminal-failure');
  const failureNode = data.nodes.find((n) => n.type === 'terminal-failure');

  const renderBar = (node: StepperNode, index: number) => {
    const widthPct = node.metadata?.percentage ?? 100;
    const isSuccess = node.type === 'terminal-success';
    const isLateral = node.type === 'lateral';
    const bgColor = isLateral ? '#fffbeb' : node.color;
    const textColor = isLateral ? '#92400e' : getTextColor(bgColor);

    // Find the first non-terminal main node to attach the failure branch
    const attachFailureBranch =
      failureNode && index === 0;

    const barContent = (
      <div
        className={mergeClasses(
          styles.bar,
          compact && styles.barCompact,
          interactive && styles.barInteractive,
          isLateral && styles.lateralBar,
        )}
        style={{
          width: `${widthPct}%`,
          backgroundColor: bgColor,
          color: textColor,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          {isSuccess && (
            <span className={styles.barIcon}>
              <Checkmark12Regular />
            </span>
          )}
          <Text
            className={mergeClasses(
              styles.barLabel,
              compact && styles.barLabelCompact,
            )}
            style={{ color: textColor }}
          >
            {node.label}
          </Text>
        </span>

        {node.metadata?.percentage != null && (
          <span
            className={mergeClasses(
              styles.barPercentage,
              compact && styles.barPercentageCompact,
            )}
            style={{ color: textColor }}
          >
            {node.metadata.percentage}%
          </span>
        )}
      </div>
    );

    return (
      <div key={node.id} className={styles.barRow}>
        {interactive && node.description ? (
          <Tooltip
            content={node.description}
            relationship="description"
            positioning="after"
          >
            {barContent}
          </Tooltip>
        ) : (
          barContent
        )}

        {/* Failure side branch attached to the first bar */}
        {attachFailureBranch && (
          <div className={styles.failureBranch}>
            <div className={styles.failureConnector} />
            <span
              className={mergeClasses(
                styles.failureChip,
                compact && styles.failureChipCompact,
              )}
            >
              <Dismiss12Regular />
              {failureNode.label}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.root}>
      {mainNodes.map((node, index) => renderBar(node, index))}
    </div>
  );
};

export default StepperFunnel;
