/**
 * DWx Traffic Manager - Stepper Legend
 * Horizontal legend bar showing node type and connector type indicators.
 * v2.18.0
 */

import React from 'react';
import { makeStyles, shorthands, Text } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('10px', '0', '0', '0'),
    ...shorthands.borderTop('1px', 'solid', '#e5e7eb'),
    marginTop: '12px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
  },
  label: {
    fontSize: '11px',
    color: '#6b7280',
    lineHeight: '1',
  },
  // Node indicators
  normalDot: {
    width: '10px',
    height: '10px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#1a5a8a',
  },
  successDot: {
    width: '10px',
    height: '10px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#107c10',
  },
  failureDot: {
    width: '10px',
    height: '10px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: '#d13438',
  },
  lateralDot: {
    width: '10px',
    height: '10px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: 'transparent',
    ...shorthands.border('2px', 'dashed', '#d97706'),
    boxSizing: 'border-box',
  },
  // Connector indicators
  solidLine: {
    width: '20px',
    height: '2px',
    backgroundColor: '#9ca3af',
  },
  dashedLine: {
    width: '20px',
    height: '0px',
    ...shorthands.borderTop('2px', 'dashed', '#9ca3af'),
  },
});

interface StepperLegendProps {
  compact?: boolean;
}

export const StepperLegend: React.FC<StepperLegendProps> = ({ compact }) => {
  const classes = useStyles();

  if (compact) return null;

  return (
    <div className={classes.container}>
      <div className={classes.item}>
        <div className={classes.normalDot} />
        <Text className={classes.label}>Stage</Text>
      </div>
      <div className={classes.item}>
        <div className={classes.successDot} />
        <Text className={classes.label}>Success</Text>
      </div>
      <div className={classes.item}>
        <div className={classes.failureDot} />
        <Text className={classes.label}>Failure</Text>
      </div>
      <div className={classes.item}>
        <div className={classes.lateralDot} />
        <Text className={classes.label}>Lateral</Text>
      </div>
      <div className={classes.item}>
        <div className={classes.solidLine} />
        <Text className={classes.label}>Forward</Text>
      </div>
      <div className={classes.item}>
        <div className={classes.dashedLine} />
        <Text className={classes.label}>Conditional</Text>
      </div>
    </div>
  );
};
