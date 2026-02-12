/**
 * DWx Traffic Manager - Linear Stepper
 * Horizontal circle-and-arrow process stepper with branch row for terminal-failure nodes.
 * v2.18.0
 */

import React, { useMemo } from 'react';
import { makeStyles, shorthands, Text, Tooltip } from '@fluentui/react-components';
import type { ProcessStepperData, StepperNode, StepperConnector } from '../../types/ProcessStepper';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('0px'),
    width: '100%',
    overflowX: 'auto',
  },

  // Main horizontal row
  mainRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    ...shorthands.gap('0px'),
    ...shorthands.padding('8px', '16px'),
    width: '100%',
  },

  // Node + connector group
  nodeGroup: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },

  // Individual node (circle + label)
  nodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    width: '80px',
    flexShrink: 0,
  },
  nodeContainerCompact: {
    width: '64px',
    ...shorthands.gap('4px'),
  },

  // Circle
  circle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    ...shorthands.borderRadius('50%'),
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '15px',
    flexShrink: 0,
    transitionProperty: 'transform, box-shadow',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    cursor: 'default',
    position: 'relative',
    zIndex: 1,
  },
  circleCompact: {
    width: '40px',
    height: '40px',
    fontSize: '13px',
  },
  circleInteractive: {
    cursor: 'pointer',
    ':hover': {
      transform: 'scale(1.12)',
    },
  },

  // Node type modifiers
  circleSuccess: {
    backgroundImage: 'linear-gradient(135deg, #107c10, #0e6b0e)',
    boxShadow: '0 0 12px rgba(16, 124, 16, 0.35)',
  },
  circleFailure: {
    backgroundImage: 'linear-gradient(135deg, #d13438, #b02a2e)',
    boxShadow: '0 0 12px rgba(209, 52, 56, 0.35)',
  },
  circleLateral: {
    backgroundColor: 'transparent !important' as 'transparent',
    ...shorthands.border('3px', 'dashed', '#d97706'),
    color: '#d97706',
    fontWeight: '700',
  },
  circleDecision: {
    ...shorthands.borderRadius('8px'),
    transform: 'rotate(45deg)',
  },
  circleDecisionInner: {
    transform: 'rotate(-45deg)',
  },

  // Labels
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: '1.3',
    maxWidth: '80px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflowY: 'hidden',
    textOverflow: 'ellipsis',
  },
  labelCompact: {
    fontSize: '11px',
    maxWidth: '64px',
  },

  // Connector arrow between main row nodes
  connector: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.padding('0', '2px'),
    marginTop: '-20px',
    flexShrink: 0,
  },
  connectorLine: {
    width: '32px',
    height: '2px',
    backgroundColor: '#9ca3af',
  },
  connectorLineDashed: {
    width: '32px',
    height: '0px',
    ...shorthands.borderTop('2px', 'dashed', '#9ca3af'),
  },
  connectorLineCompact: {
    width: '20px',
  },
  connectorArrow: {
    width: '0px',
    height: '0px',
    borderTop: '5px solid transparent',
    borderBottom: '5px solid transparent',
    borderLeft: '7px solid #9ca3af',
    flexShrink: 0,
  },
  connectorLabel: {
    fontSize: '10px',
    color: '#9ca3af',
    position: 'absolute',
    top: '-14px',
    left: '50%',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
  },
  connectorContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  // Branch row (terminal-failure nodes below main row)
  branchSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('4px', '16px', '0', '16px'),
    width: '100%',
  },
  branchConnectorVertical: {
    width: '0px',
    height: '24px',
    ...shorthands.borderLeft('2px', 'dashed', '#d13438'),
    opacity: 0.6,
  },
  branchRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    ...shorthands.gap('24px'),
    ...shorthands.padding('4px', '0'),
  },
  branchLabel: {
    fontSize: '10px',
    color: '#9ca3af',
    fontStyle: 'italic',
    marginBottom: '4px',
  },
});

// ============================================================================
// Component
// ============================================================================

interface StepperLinearProps {
  data: ProcessStepperData;
  interactive?: boolean;
  compact?: boolean;
}

export const StepperLinear: React.FC<StepperLinearProps> = ({
  data,
  interactive = true,
  compact = false,
}) => {
  const classes = useStyles();

  // Separate main-row nodes from branch-row (terminal-failure) nodes
  const { mainNodes, branchNodes } = useMemo(() => {
    const main: StepperNode[] = [];
    const branch: StepperNode[] = [];
    for (const node of data.nodes) {
      if (node.type === 'terminal-failure') {
        branch.push(node);
      } else {
        main.push(node);
      }
    }
    return { mainNodes: main, branchNodes: branch };
  }, [data.nodes]);

  // Build a lookup for connectors between main-row nodes
  const mainConnectorMap = useMemo(() => {
    const map = new Map<string, StepperConnector>();
    for (const conn of data.connectors) {
      // Only include connectors between consecutive main nodes
      const fromIdx = mainNodes.findIndex((n) => n.id === conn.from);
      const toIdx = mainNodes.findIndex((n) => n.id === conn.to);
      if (fromIdx >= 0 && toIdx === fromIdx + 1) {
        map.set(`${conn.from}->${conn.to}`, conn);
      }
    }
    return map;
  }, [data.connectors, mainNodes]);

  // Check if any main-row node connects to any branch node
  const hasBranchConnections = useMemo(() => {
    const branchIds = new Set(branchNodes.map((n) => n.id));
    return data.connectors.some((c) => branchIds.has(c.to));
  }, [data.connectors, branchNodes]);

  const renderCircle = (node: StepperNode, index: number) => {
    const circleClasses = [
      classes.circle,
      compact ? classes.circleCompact : '',
      interactive ? classes.circleInteractive : '',
      node.type === 'terminal-success' ? classes.circleSuccess : '',
      node.type === 'terminal-failure' ? classes.circleFailure : '',
      node.type === 'lateral' ? classes.circleLateral : '',
      node.type === 'decision' ? classes.circleDecision : '',
    ]
      .filter(Boolean)
      .join(' ');

    const bgStyle =
      node.type !== 'terminal-success' &&
      node.type !== 'terminal-failure' &&
      node.type !== 'lateral'
        ? { backgroundColor: node.color }
        : undefined;

    const innerContent = (
      <span className={node.type === 'decision' ? classes.circleDecisionInner : undefined}>
        {index + 1}
      </span>
    );

    const circle = (
      <div className={circleClasses} style={bgStyle}>
        {innerContent}
      </div>
    );

    if (interactive && node.description) {
      return (
        <Tooltip content={node.description} relationship="description" withArrow>
          {circle}
        </Tooltip>
      );
    }
    return circle;
  };

  return (
    <div className={classes.wrapper}>
      {/* Main horizontal row */}
      <div className={classes.mainRow}>
        {mainNodes.map((node, idx) => {
          const isLast = idx === mainNodes.length - 1;
          const nextNode = !isLast ? mainNodes[idx + 1] : null;
          const connKey = nextNode ? `${node.id}->${nextNode.id}` : null;
          const conn = connKey ? mainConnectorMap.get(connKey) : null;

          return (
            <div className={classes.nodeGroup} key={node.id}>
              {/* Node circle + label */}
              <div
                className={`${classes.nodeContainer} ${compact ? classes.nodeContainerCompact : ''}`}
              >
                {renderCircle(node, idx)}
                <Text className={`${classes.label} ${compact ? classes.labelCompact : ''}`}>
                  {node.label}
                </Text>
              </div>

              {/* Connector arrow to next node */}
              {!isLast && (
                <div className={classes.connector}>
                  <div className={classes.connectorContainer}>
                    {conn?.label && <span className={classes.connectorLabel}>{conn.label}</span>}
                    <div
                      className={[
                        conn?.style === 'dashed' || conn?.isConditional
                          ? classes.connectorLineDashed
                          : classes.connectorLine,
                        compact ? classes.connectorLineCompact : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    />
                    <div className={classes.connectorArrow} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Branch row for terminal-failure nodes */}
      {branchNodes.length > 0 && hasBranchConnections && (
        <div className={classes.branchSection}>
          <div className={classes.branchConnectorVertical} />
          <Text className={classes.branchLabel}>conditional exits</Text>
          <div className={classes.branchRow}>
            {branchNodes.map((node, idx) => (
              <div
                key={node.id}
                className={`${classes.nodeContainer} ${compact ? classes.nodeContainerCompact : ''}`}
              >
                {renderCircle(node, mainNodes.length + idx)}
                <Text className={`${classes.label} ${compact ? classes.labelCompact : ''}`}>
                  {node.label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
