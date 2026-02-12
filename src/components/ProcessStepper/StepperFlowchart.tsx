/**
 * DWx Traffic Manager - Stepper Flowchart
 * SVG-based flowchart with branching paths for process visualization.
 * Supports normal, decision, terminal, and lateral node types with
 * solid/dashed connectors and optional hover interactivity.
 * v2.18.0
 */

import React, { useMemo, useState } from 'react';
import { makeStyles, shorthands } from '@fluentui/react-components';
import type { ProcessStepperData, StepperNode, StepperConnector } from '../../types/ProcessStepper';

// ============================================================================
// Layout Constants
// ============================================================================

const FULL = {
  nodeW: 120,
  nodeH: 50,
  spacingX: 160,
  mainY: 60,
  branchY: 180,
  fontSize: 12,
  descFontSize: 10,
  labelFontSize: 9,
  padX: 40,
  padY: 30,
  cornerRadius: 8,
  arrowSize: 6,
};

const COMPACT = {
  nodeW: 100,
  nodeH: 40,
  spacingX: 120,
  mainY: 50,
  branchY: 140,
  fontSize: 10,
  descFontSize: 8,
  labelFontSize: 8,
  padX: 24,
  padY: 20,
  cornerRadius: 6,
  arrowSize: 5,
};

// ============================================================================
// Positioning Helpers
// ============================================================================

interface PositionedNode extends StepperNode {
  x: number;
  y: number;
}

function layoutNodes(
  nodes: StepperNode[],
  cfg: typeof FULL
): { positioned: PositionedNode[]; width: number; height: number } {
  const mainPath = nodes.filter(
    (n) => n.type !== 'lateral' && n.type !== 'terminal-failure'
  );
  const failureNodes = nodes.filter((n) => n.type === 'terminal-failure');
  const lateralNodes = nodes.filter((n) => n.type === 'lateral');

  const positioned: PositionedNode[] = [];

  // Main row: horizontal, evenly spaced
  mainPath.forEach((node, i) => {
    positioned.push({
      ...node,
      x: cfg.padX + i * cfg.spacingX,
      y: cfg.mainY,
    });
  });

  // Failure nodes: below main row, spread starting from left
  failureNodes.forEach((node, i) => {
    positioned.push({
      ...node,
      x: cfg.padX + i * cfg.spacingX,
      y: cfg.branchY,
    });
  });

  // Lateral nodes: below main row, offset to the right of failure nodes
  lateralNodes.forEach((node, i) => {
    positioned.push({
      ...node,
      x: cfg.padX + (failureNodes.length + i) * cfg.spacingX,
      y: cfg.branchY,
    });
  });

  // Calculate bounding box
  let maxX = 0;
  let maxY = 0;
  positioned.forEach((n) => {
    if (n.x + cfg.nodeW > maxX) maxX = n.x + cfg.nodeW;
    if (n.y + cfg.nodeH > maxY) maxY = n.y + cfg.nodeH;
  });

  return {
    positioned,
    width: maxX + cfg.padX,
    height: maxY + cfg.padY,
  };
}

// ============================================================================
// SVG Node Rendering
// ============================================================================

function getNodeFill(node: StepperNode): string {
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

function getNodeStroke(node: StepperNode): { stroke: string; strokeDasharray?: string } {
  if (node.type === 'lateral') {
    return { stroke: '#b45309', strokeDasharray: '4 3' };
  }
  return { stroke: 'none' };
}

interface NodeSVGProps {
  node: PositionedNode;
  cfg: typeof FULL;
  interactive: boolean;
  hovered: string | null;
  onHover: (id: string | null) => void;
}

const NodeSVG: React.FC<NodeSVGProps> = ({ node, cfg, interactive, hovered, onHover }) => {
  const fill = getNodeFill(node);
  const strokeProps = getNodeStroke(node);
  const isHovered = interactive && hovered === node.id;

  // Gradient for terminal-success
  const gradientId = `grad-${node.id}`;
  const useGradient = node.type === 'terminal-success';

  return (
    <g
      onMouseEnter={interactive ? () => onHover(node.id) : undefined}
      onMouseLeave={interactive ? () => onHover(null) : undefined}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      {useGradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#15a915" />
            <stop offset="100%" stopColor="#107c10" />
          </linearGradient>
        </defs>
      )}
      <rect
        x={node.x}
        y={node.y}
        width={cfg.nodeW}
        height={cfg.nodeH}
        rx={cfg.cornerRadius}
        ry={cfg.cornerRadius}
        fill={useGradient ? `url(#${gradientId})` : fill}
        stroke={strokeProps.stroke}
        strokeDasharray={strokeProps.strokeDasharray}
        strokeWidth={strokeProps.stroke !== 'none' ? 1.5 : 0}
        opacity={isHovered ? 0.85 : 1}
        filter={isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : undefined}
      >
        {interactive && <title>{node.description || node.label}</title>}
      </rect>
      <text
        x={node.x + cfg.nodeW / 2}
        y={node.y + cfg.nodeH / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={cfg.fontSize}
        fontWeight={600}
        fontFamily="Segoe UI, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {truncateLabel(node.label, cfg.nodeW, cfg.fontSize)}
      </text>
    </g>
  );
};

function truncateLabel(label: string, maxWidth: number, fontSize: number): string {
  // Rough character-fit estimate
  const charWidth = fontSize * 0.58;
  const maxChars = Math.floor((maxWidth - 16) / charWidth);
  if (label.length <= maxChars) return label;
  return label.substring(0, maxChars - 1) + '\u2026';
}

// ============================================================================
// SVG Connector Rendering
// ============================================================================

interface ConnectorSVGProps {
  connector: StepperConnector;
  nodeMap: Map<string, PositionedNode>;
  cfg: typeof FULL;
  markerId: string;
  markerDashedId: string;
}

const ConnectorSVG: React.FC<ConnectorSVGProps> = ({
  connector,
  nodeMap,
  cfg,
  markerId,
  markerDashedId,
}) => {
  const fromNode = nodeMap.get(connector.from);
  const toNode = nodeMap.get(connector.to);
  if (!fromNode || !toNode) return null;

  const isDashed = connector.style === 'dashed';
  const strokeColor = isDashed ? '#9ca3af' : '#6b7280';

  // Calculate start and end points based on relative positions
  let x1: number, y1: number, x2: number, y2: number;

  const sameRow = Math.abs(fromNode.y - toNode.y) < 20;

  if (sameRow) {
    // Horizontal: right edge of from -> left edge of to
    const leftToRight = fromNode.x < toNode.x;
    x1 = leftToRight ? fromNode.x + cfg.nodeW : fromNode.x;
    y1 = fromNode.y + cfg.nodeH / 2;
    x2 = leftToRight ? toNode.x : toNode.x + cfg.nodeW;
    y2 = toNode.y + cfg.nodeH / 2;
  } else if (toNode.y > fromNode.y) {
    // Downward: bottom center of from -> top center of to
    x1 = fromNode.x + cfg.nodeW / 2;
    y1 = fromNode.y + cfg.nodeH;
    x2 = toNode.x + cfg.nodeW / 2;
    y2 = toNode.y;
  } else {
    // Upward: top center of from -> bottom center of to
    x1 = fromNode.x + cfg.nodeW / 2;
    y1 = fromNode.y;
    x2 = toNode.x + cfg.nodeW / 2;
    y2 = toNode.y + cfg.nodeH;
  }

  // Build path: straight if same row, angled curve if different row
  let pathD: string;
  if (sameRow) {
    // Slight curve for visual interest
    const midX = (x1 + x2) / 2;
    const curveOffset = 8;
    pathD = `M ${x1} ${y1} C ${midX} ${y1 - curveOffset}, ${midX} ${y2 - curveOffset}, ${x2} ${y2}`;
  } else {
    // Angled path with midpoint bend
    const midY = (y1 + y2) / 2;
    pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
  }

  // Label position: midpoint
  const labelX = (x1 + x2) / 2;
  const labelY = sameRow
    ? (y1 + y2) / 2 - 10
    : (y1 + y2) / 2 - 4;

  return (
    <g>
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeDasharray={isDashed ? '5 4' : undefined}
        markerEnd={`url(#${isDashed ? markerDashedId : markerId})`}
      />
      {connector.label && (
        <text
          x={labelX}
          y={labelY}
          textAnchor="middle"
          fill="#6b7280"
          fontSize={cfg.labelFontSize}
          fontFamily="Segoe UI, sans-serif"
          fontWeight={500}
        >
          {connector.label}
        </text>
      )}
    </g>
  );
};

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    width: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    ...shorthands.padding('0'),
    ...shorthands.borderRadius('4px'),
  },
  svg: {
    display: 'block',
    minWidth: '100%',
  },
});

// ============================================================================
// Main Component
// ============================================================================

interface StepperFlowchartProps {
  data: ProcessStepperData;
  interactive?: boolean;
  compact?: boolean;
}

export const StepperFlowchart: React.FC<StepperFlowchartProps> = ({
  data,
  interactive = false,
  compact = false,
}) => {
  const classes = useStyles();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const cfg = compact ? COMPACT : FULL;

  const { positioned, width, height } = useMemo(
    () => layoutNodes(data.nodes, cfg),
    [data.nodes, cfg]
  );

  const nodeMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    positioned.forEach((n) => map.set(n.id, n));
    return map;
  }, [positioned]);

  const markerId = `arrow-${data.id}`;
  const markerDashedId = `arrow-dashed-${data.id}`;

  return (
    <div className={classes.container}>
      <svg
        className={classes.svg}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Arrow marker definitions */}
        <defs>
          <marker
            id={markerId}
            viewBox={`0 0 ${cfg.arrowSize * 2} ${cfg.arrowSize * 2}`}
            refX={cfg.arrowSize * 2 - 1}
            refY={cfg.arrowSize}
            markerWidth={cfg.arrowSize}
            markerHeight={cfg.arrowSize}
            orient="auto-start-reverse"
          >
            <polygon
              points={`0 0, ${cfg.arrowSize * 2} ${cfg.arrowSize}, 0 ${cfg.arrowSize * 2}`}
              fill="#6b7280"
            />
          </marker>
          <marker
            id={markerDashedId}
            viewBox={`0 0 ${cfg.arrowSize * 2} ${cfg.arrowSize * 2}`}
            refX={cfg.arrowSize * 2 - 1}
            refY={cfg.arrowSize}
            markerWidth={cfg.arrowSize}
            markerHeight={cfg.arrowSize}
            orient="auto-start-reverse"
          >
            <polygon
              points={`0 0, ${cfg.arrowSize * 2} ${cfg.arrowSize}, 0 ${cfg.arrowSize * 2}`}
              fill="#9ca3af"
            />
          </marker>
        </defs>

        {/* Render connectors first (behind nodes) */}
        {data.connectors.map((conn, i) => (
          <ConnectorSVG
            key={`conn-${i}`}
            connector={conn}
            nodeMap={nodeMap}
            cfg={cfg}
            markerId={markerId}
            markerDashedId={markerDashedId}
          />
        ))}

        {/* Render nodes on top */}
        {positioned.map((node) => (
          <NodeSVG
            key={node.id}
            node={node}
            cfg={cfg}
            interactive={interactive}
            hovered={hoveredNode}
            onHover={setHoveredNode}
          />
        ))}
      </svg>
    </div>
  );
};
