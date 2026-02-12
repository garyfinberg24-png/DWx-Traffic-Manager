/**
 * DWx Traffic Manager - Visual Process Stepper Types
 * Purely visual workflow diagrams with multiple display styles.
 * v2.18.0
 */

// ============================================================================
// Stepper Display Styles
// ============================================================================

export type StepperStyle = 'linear' | 'timeline' | 'flowchart' | 'funnel' | 'cards';

export const STEPPER_STYLES: { id: StepperStyle; label: string; description: string }[] = [
  { id: 'linear', label: 'Linear', description: 'Horizontal circle nodes with arrow connectors' },
  { id: 'timeline', label: 'Timeline', description: 'Vertical timeline with accent cards' },
  { id: 'flowchart', label: 'Flowchart', description: 'SVG flowchart with branching paths' },
  { id: 'funnel', label: 'Funnel', description: 'Pipeline funnel with decreasing bars' },
  { id: 'cards', label: 'Cards', description: 'Card-based flow with arrow connectors' },
];

// ============================================================================
// Stepper Node & Connector Types
// ============================================================================

export type StepperNodeType =
  | 'normal'
  | 'decision'
  | 'terminal-success'
  | 'terminal-failure'
  | 'lateral';

export interface StepperNode {
  id: string;
  label: string;
  description?: string;
  color: string;
  iconName?: string;
  type: StepperNodeType;
  metadata?: {
    percentage?: number;    // for funnel style (width %)
    duration?: string;      // for timeline style (e.g. "1-2 days")
  };
}

export interface StepperConnector {
  from: string;
  to: string;
  label?: string;
  style: 'solid' | 'dashed';
  isConditional?: boolean;
}

// ============================================================================
// Data Model
// ============================================================================

export interface ProcessStepperData {
  id: string;
  title: string;
  description: string;
  nodes: StepperNode[];
  connectors: StepperConnector[];
  recommendedStyles: StepperStyle[];
}

// ============================================================================
// Component Props
// ============================================================================

export interface ProcessStepperProps {
  data: ProcessStepperData;
  style?: StepperStyle;
  showLegend?: boolean;
  interactive?: boolean;    // hover tooltips
  compact?: boolean;        // smaller for embedding in guide steps
  className?: string;
}

// ============================================================================
// Process Map Gallery
// ============================================================================

export interface ProcessMapInfo {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  dataKey: string;
  recommendedStyle: StepperStyle;
}
