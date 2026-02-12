/**
 * DWx Traffic Manager - Process Guide Step Content
 * Main content area displaying the current step details with rich text rendering.
 * v2.18.0
 */

import React from 'react';
import { Text, makeStyles, shorthands } from '@fluentui/react-components';
import { Lightbulb24Regular, Warning24Regular, CheckmarkCircle24Regular } from '@fluentui/react-icons';
import type { ProcessStep } from '../../types/ProcessGuide';
import { DW_COLORS } from '../../utils/buttonStyles';

interface StepContentProps {
  step: ProcessStep;
  stepIndex: number;
  totalSteps: number;
  categoryColor: string;
}

const useStyles = makeStyles({
  container: {
    flex: '1',
    overflowY: 'auto',
    ...shorthands.padding('32px'),
  },
  stepBadge: {
    display: 'inline-block',
    fontSize: '12px',
    fontWeight: 600,
    ...shorthands.padding('4px', '12px'),
    ...shorthands.borderRadius('12px'),
  },
  stepTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
    marginTop: '12px',
    display: 'block',
  },
  descriptionBlock: {
    marginTop: '20px',
    fontSize: '14px',
    lineHeight: '1.7',
    color: '#374151',
  },
  paragraph: {
    marginTop: '0',
    marginBottom: '12px',
    fontSize: '14px',
    lineHeight: '1.7',
    color: '#374151',
  },
  list: {
    marginTop: '0',
    marginBottom: '12px',
    paddingLeft: '20px',
    fontSize: '14px',
    lineHeight: '1.7',
    color: '#374151',
  },
  tipsBox: {
    backgroundColor: '#e6f2fb',
    ...shorthands.borderRadius('10px'),
    ...shorthands.padding('16px'),
    marginTop: '20px',
  },
  tipsHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginBottom: '10px',
  },
  tipsTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: DW_COLORS.primary,
  },
  tipsList: {
    marginTop: '0',
    marginBottom: '0',
    paddingLeft: '20px',
    fontSize: '13px',
    lineHeight: '1.7',
    color: '#374151',
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    ...shorthands.borderRadius('10px'),
    ...shorthands.padding('16px'),
    marginTop: '16px',
  },
  warningHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginBottom: '10px',
  },
  warningTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#92400e',
  },
  warningText: {
    fontSize: '13px',
    color: '#92400e',
    lineHeight: '1.6',
  },
  successBox: {
    backgroundColor: '#f0fdf4',
    ...shorthands.borderRadius('10px'),
    ...shorthands.padding('16px'),
    marginTop: '16px',
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginBottom: '10px',
  },
  successTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#065f46',
  },
  successText: {
    fontSize: '13px',
    color: '#065f46',
    lineHeight: '1.6',
  },
});

/**
 * Parse inline bold markers (**text**) into React nodes with <strong> tags.
 */
function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

/**
 * Render a description string with simple markdown-like formatting:
 * - Paragraphs separated by double newlines
 * - Lines starting with "- " become unordered list items
 * - Lines starting with "N. " become ordered list items
 * - **text** becomes bold
 */
function renderDescription(text: string): React.ReactNode {
  const blocks = text.split('\n\n');

  return blocks.map((block, blockIndex) => {
    const lines = block.split('\n').filter((line) => line.length > 0);

    if (lines.length === 0) return null;

    // Check if all lines are unordered list items
    const allBullets = lines.every((line) => line.startsWith('- '));
    if (allBullets) {
      return (
        <ul key={blockIndex} style={{ marginTop: 0, marginBottom: 12, paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: '#374151' }}>
          {lines.map((line, li) => (
            <li key={li}>{parseBold(line.slice(2))}</li>
          ))}
        </ul>
      );
    }

    // Check if all lines are ordered list items
    const allOrdered = lines.every((line) => /^\d+\.\s/.test(line));
    if (allOrdered) {
      return (
        <ol key={blockIndex} style={{ marginTop: 0, marginBottom: 12, paddingLeft: 20, fontSize: 14, lineHeight: 1.7, color: '#374151' }}>
          {lines.map((line, li) => (
            <li key={li}>{parseBold(line.replace(/^\d+\.\s/, ''))}</li>
          ))}
        </ol>
      );
    }

    // Regular paragraph
    return (
      <p key={blockIndex} style={{ marginTop: 0, marginBottom: 12, fontSize: 14, lineHeight: 1.7, color: '#374151' }}>
        {parseBold(block)}
      </p>
    );
  });
}

export const StepContent: React.FC<StepContentProps> = ({
  step,
  stepIndex,
  totalSteps,
  categoryColor,
}) => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      {/* Step badge */}
      <span
        className={classes.stepBadge}
        style={{
          backgroundColor: `${categoryColor}1A`,
          color: categoryColor,
        }}
      >
        Step {stepIndex + 1} of {totalSteps}
      </span>

      {/* Step title */}
      <Text className={classes.stepTitle}>{step.title}</Text>

      {/* Description */}
      <div className={classes.descriptionBlock}>
        {renderDescription(step.description)}
      </div>

      {/* Tips box */}
      {step.tips.length > 0 && (
        <div className={classes.tipsBox}>
          <div className={classes.tipsHeader}>
            <Lightbulb24Regular style={{ color: DW_COLORS.primary }} />
            <span className={classes.tipsTitle}>Tips</span>
          </div>
          <ul className={classes.tipsList}>
            {step.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning box */}
      {step.warningText && (
        <div className={classes.warningBox}>
          <div className={classes.warningHeader}>
            <Warning24Regular style={{ color: '#92400e' }} />
            <span className={classes.warningTitle}>Important</span>
          </div>
          <span className={classes.warningText}>{step.warningText}</span>
        </div>
      )}

      {/* Success criteria box */}
      {step.successCriteria && (
        <div className={classes.successBox}>
          <div className={classes.successHeader}>
            <CheckmarkCircle24Regular style={{ color: '#065f46' }} />
            <span className={classes.successTitle}>Success Criteria</span>
          </div>
          <span className={classes.successText}>{step.successCriteria}</span>
        </div>
      )}
    </div>
  );
};
