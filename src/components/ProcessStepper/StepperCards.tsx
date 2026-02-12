/**
 * DWx Traffic Manager - Stepper Cards
 * Card-based process flow with arrow connectors between steps.
 * Supports branching (terminal-failure nodes on a second row),
 * lateral nodes, and optional hover interactivity.
 * v2.18.0
 */

import React, { useMemo } from 'react';
import { makeStyles, shorthands, Text, Tooltip } from '@fluentui/react-components';
import type { ProcessStepperData, StepperNode, StepperConnector } from '../../types/ProcessStepper';

// ============================================================================
// Layout Helpers
// ============================================================================

interface LayoutResult {
  mainRow: StepperNode[];
  branchRow: StepperNode[];
  /** Map from main-row node id to branch-row node ids connected via dashed/conditional connectors */
  branchLinks: Map<string, string[]>;
}

function computeLayout(data: ProcessStepperData): LayoutResult {
  const mainRow = data.nodes.filter(
    (n) => n.type !== 'terminal-failure' && n.type !== 'lateral'
  );
  const branchRow = data.nodes.filter(
    (n) => n.type === 'terminal-failure' || n.type === 'lateral'
  );

  // Build branch links: which main-row node connects to which branch-row node(s)
  const branchIds = new Set(branchRow.map((n) => n.id));
  const branchLinks = new Map<string, string[]>();

  data.connectors.forEach((conn) => {
    if (branchIds.has(conn.to) && !branchIds.has(conn.from)) {
      const existing = branchLinks.get(conn.from) || [];
      existing.push(conn.to);
      branchLinks.set(conn.from, existing);
    }
  });

  return { mainRow, branchRow, branchLinks };
}

function getConnectorBetween(
  fromId: string,
  toId: string,
  connectors: StepperConnector[]
): StepperConnector | undefined {
  return connectors.find((c) => c.from === fromId && c.to === toId);
}

// ============================================================================
// Styles
// ============================================================================

const CARD_WIDTH = 160;
const CARD_WIDTH_COMPACT = 120;

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    ...shorthands.gap('20px'),
    overflowX: 'auto',
    ...shorthands.padding('4px'),
  },
  mainRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('0'),
  },
  branchSection: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  branchLabel: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    ...shorthands.padding('0', '0', '0', '4px'),
  },
  branchRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('0'),
  },

  // Card styles
  card: {
    position: 'relative',
    width: `${CARD_WIDTH}px`,
    minHeight: '80px',
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('12px', '12px', '10px', '12px'),
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('4px'),
    transitionDuration: '150ms',
    transitionProperty: 'box-shadow, transform',
    transitionTimingFunction: 'ease',
    flexShrink: 0,
  },
  cardCompact: {
    width: `${CARD_WIDTH_COMPACT}px`,
    minHeight: '56px',
    ...shorthands.padding('8px'),
  },
  cardInteractive: {
    cursor: 'pointer',
    ':hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transform: 'translateY(-1px)',
    },
  },
  cardLateral: {
    ...shorthands.border('1px', 'dashed', '#d97706'),
  },
  cardSuccessTint: {
    backgroundColor: '#f0fdf4',
  },
  cardFailureTint: {
    backgroundColor: '#fef2f2',
  },

  // Card inner elements
  topBorder: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    height: '4px',
    ...shorthands.borderRadius('8px', '8px', '0', '0'),
  },
  stepBadge: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    width: '18px',
    height: '18px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 700,
    color: '#ffffff',
  },
  stepBadgeCompact: {
    width: '14px',
    height: '14px',
    fontSize: '8px',
    top: '6px',
    left: '6px',
  },
  cardLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: '1.3',
    marginTop: '8px',
  },
  cardLabelCompact: {
    fontSize: '11px',
    marginTop: '4px',
  },
  cardDescription: {
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: '1.3',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflowY: 'hidden',
    maxWidth: '100%',
  },

  // Arrow connector between cards
  arrowConnector: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('0', '2px'),
    flexShrink: 0,
    minWidth: '28px',
  },
  arrowConnectorCompact: {
    minWidth: '20px',
  },
  arrowChar: {
    fontSize: '18px',
    color: '#9ca3af',
    lineHeight: '1',
    fontWeight: 700,
  },
  arrowCharCompact: {
    fontSize: '14px',
  },
  arrowCharDashed: {
    color: '#d1d5db',
  },
  arrowLabel: {
    fontSize: '9px',
    color: '#6b7280',
    whiteSpace: 'nowrap',
    maxWidth: '60px',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    textAlign: 'center',
    lineHeight: '1',
  },

  // Downward arrow for branch connections
  downArrowContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding('4px', '0'),
  },
  downArrow: {
    fontSize: '16px',
    color: '#9ca3af',
    lineHeight: '1',
  },
  downArrowLabel: {
    fontSize: '9px',
    color: '#6b7280',
    textAlign: 'center',
  },
});

// ============================================================================
// Sub-components
// ============================================================================

function getTopBorderColor(node: StepperNode): string {
  switch (node.type) {
    case 'terminal-success':
      return '#107c10';
    case 'terminal-failure':
      return '#d13438';
    case 'lateral':
      return '#d97706';
    default:
      return node.color;
  }
}

interface StepCardProps {
  node: StepperNode;
  stepNumber: number;
  compact: boolean;
  interactive: boolean;
  classes: ReturnType<typeof useStyles>;
}

const StepCard: React.FC<StepCardProps> = ({ node, stepNumber, compact, interactive, classes }) => {
  const borderColor = getTopBorderColor(node);

  const tintClass =
    node.type === 'terminal-success'
      ? classes.cardSuccessTint
      : node.type === 'terminal-failure'
        ? classes.cardFailureTint
        : undefined;

  const lateralClass = node.type === 'lateral' ? classes.cardLateral : undefined;

  const cardContent = (
    <div
      className={[
        classes.card,
        compact ? classes.cardCompact : '',
        interactive ? classes.cardInteractive : '',
        tintClass,
        lateralClass,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Colored top border */}
      <div className={classes.topBorder} style={{ backgroundColor: borderColor }} />

      {/* Step number badge */}
      <div
        className={[classes.stepBadge, compact ? classes.stepBadgeCompact : '']
          .filter(Boolean)
          .join(' ')}
        style={{ backgroundColor: borderColor }}
      >
        {stepNumber}
      </div>

      {/* Label */}
      <Text
        className={[classes.cardLabel, compact ? classes.cardLabelCompact : '']
          .filter(Boolean)
          .join(' ')}
      >
        {node.label}
      </Text>

      {/* Description (hidden in compact) */}
      {!compact && node.description && (
        <Text className={classes.cardDescription}>{node.description}</Text>
      )}
    </div>
  );

  if (interactive && node.description) {
    return (
      <Tooltip content={node.description} relationship="description" positioning="above">
        {cardContent}
      </Tooltip>
    );
  }

  return cardContent;
};

interface ArrowProps {
  connector?: StepperConnector;
  compact: boolean;
  direction?: 'right' | 'down';
  classes: ReturnType<typeof useStyles>;
}

const Arrow: React.FC<ArrowProps> = ({ connector, compact, direction = 'right', classes }) => {
  const isDashed = connector?.style === 'dashed';

  if (direction === 'down') {
    return (
      <div className={classes.downArrowContainer}>
        {connector?.label && (
          <Text className={classes.downArrowLabel}>{connector.label}</Text>
        )}
        <span className={classes.downArrow}>{'\u25BC'}</span>
      </div>
    );
  }

  return (
    <div
      className={[classes.arrowConnector, compact ? classes.arrowConnectorCompact : '']
        .filter(Boolean)
        .join(' ')}
    >
      {connector?.label && <Text className={classes.arrowLabel}>{connector.label}</Text>}
      <span
        className={[
          classes.arrowChar,
          compact ? classes.arrowCharCompact : '',
          isDashed ? classes.arrowCharDashed : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {'\u25B6'}
      </span>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

interface StepperCardsProps {
  data: ProcessStepperData;
  interactive?: boolean;
  compact?: boolean;
}

export const StepperCards: React.FC<StepperCardsProps> = ({
  data,
  interactive = false,
  compact = false,
}) => {
  const classes = useStyles();

  const { mainRow, branchRow, branchLinks } = useMemo(() => computeLayout(data), [data]);

  // Build global step numbering: main row first, then branch row
  const stepNumbers = useMemo(() => {
    const map = new Map<string, number>();
    let counter = 1;
    mainRow.forEach((n) => map.set(n.id, counter++));
    branchRow.forEach((n) => map.set(n.id, counter++));
    return map;
  }, [mainRow, branchRow]);

  return (
    <div className={classes.wrapper}>
      {/* Main row of cards */}
      <div className={classes.mainRow}>
        {mainRow.map((node, i) => {
          const connector =
            i < mainRow.length - 1
              ? getConnectorBetween(node.id, mainRow[i + 1].id, data.connectors)
              : undefined;

          return (
            <React.Fragment key={node.id}>
              <StepCard
                node={node}
                stepNumber={stepNumbers.get(node.id) ?? i + 1}
                compact={compact}
                interactive={interactive}
                classes={classes}
              />
              {i < mainRow.length - 1 && (
                <Arrow
                  connector={connector}
                  compact={compact}
                  classes={classes}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Branch row (failure + lateral nodes) */}
      {branchRow.length > 0 && (
        <div className={classes.branchSection}>
          {/* Downward arrows from main-row nodes to branch nodes */}
          {Array.from(branchLinks.entries()).map(([mainId, branchIds]) =>
            branchIds.map((branchId) => {
              const conn = getConnectorBetween(mainId, branchId, data.connectors);
              const mainNode = mainRow.find((n) => n.id === mainId);
              const branchNode = branchRow.find((n) => n.id === branchId);
              if (!mainNode || !branchNode) return null;

              return (
                <div key={`link-${mainId}-${branchId}`} className={classes.downArrowContainer}>
                  <Text className={classes.downArrowLabel}>
                    {conn?.label || `${mainNode.label} \u2192 ${branchNode.label}`}
                  </Text>
                  <span className={classes.downArrow}>{'\u25BC'}</span>
                </div>
              );
            })
          )}

          {/* Branch row cards */}
          <div className={classes.branchRow}>
            {branchRow.map((node, i) => {
              const connector =
                i < branchRow.length - 1
                  ? getConnectorBetween(node.id, branchRow[i + 1].id, data.connectors)
                  : undefined;

              return (
                <React.Fragment key={node.id}>
                  <StepCard
                    node={node}
                    stepNumber={stepNumbers.get(node.id) ?? mainRow.length + i + 1}
                    compact={compact}
                    interactive={interactive}
                    classes={classes}
                  />
                  {i < branchRow.length - 1 && (
                    <Arrow
                      connector={connector}
                      compact={compact}
                      classes={classes}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
