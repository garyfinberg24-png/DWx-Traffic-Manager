/**
 * DWx Traffic Manager - Process Stepper Orchestrator
 * Main component that selects and renders the appropriate stepper visualization style.
 * v2.18.0
 */

import React from 'react';
import { makeStyles, shorthands, Text } from '@fluentui/react-components';
import type { ProcessStepperProps, StepperStyle } from '../../types/ProcessStepper';
import { StepperLinear } from './StepperLinear';
import { StepperTimeline } from './StepperTimeline';
import { StepperFlowchart } from './StepperFlowchart';
import { StepperFunnel } from './StepperFunnel';
import { StepperCards } from './StepperCards';
import { StepperLegend } from './StepperLegend';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    ...shorthands.padding('20px'),
    ...shorthands.borderRadius('12px'),
    backgroundColor: '#ffffff',
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  },
  containerCompact: {
    ...shorthands.padding('12px'),
    ...shorthands.borderRadius('8px'),
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '4px',
  },
  description: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.4',
  },
});

// ============================================================================
// Component
// ============================================================================

export const ProcessStepper: React.FC<ProcessStepperProps> = ({
  data,
  style,
  showLegend = true,
  interactive = true,
  compact = false,
  className,
}) => {
  const classes = useStyles();

  const activeStyle: StepperStyle = style ?? data.recommendedStyles[0] ?? 'linear';

  const renderStepper = () => {
    switch (activeStyle) {
      case 'linear':
        return <StepperLinear data={data} interactive={interactive} compact={compact} />;
      case 'timeline':
        return <StepperTimeline data={data} interactive={interactive} compact={compact} />;
      case 'flowchart':
        return <StepperFlowchart data={data} interactive={interactive} compact={compact} />;
      case 'funnel':
        return <StepperFunnel data={data} interactive={interactive} compact={compact} />;
      case 'cards':
        return <StepperCards data={data} interactive={interactive} compact={compact} />;
      default:
        return <StepperLinear data={data} interactive={interactive} compact={compact} />;
    }
  };

  return (
    <div
      className={`${classes.container} ${compact ? classes.containerCompact : ''} ${className ?? ''}`}
    >
      {!compact && (
        <>
          <Text className={classes.title}>{data.title}</Text>
          <Text className={classes.description}>{data.description}</Text>
        </>
      )}
      {renderStepper()}
      {showLegend && <StepperLegend compact={compact} />}
    </div>
  );
};
