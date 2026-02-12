/**
 * DWx Traffic Manager - Guide Footer
 * Navigation footer for the Process Guide wizard with Previous/Next,
 * Mark Complete, action buttons, and "Back to Guides" link.
 * v2.18.0
 */

import React from 'react';
import { Button, Text, makeStyles } from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowRight16Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  CheckmarkCircle24Regular,
} from '@fluentui/react-icons';

// ============================================================================
// Props
// ============================================================================

interface GuideFooterProps {
  currentStep: number;
  totalSteps: number;
  isLastStep: boolean;
  isCompleted: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
  onBack: () => void;
  onActionButton?: (route: string) => void;
  actionButton?: { label: string; route: string };
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fafbfc',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
  },
  centerSection: {
    display: 'flex',
    alignItems: 'center',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  stepCounter: {
    fontSize: '12px',
    color: '#9ca3af',
  },
});

// ============================================================================
// Component
// ============================================================================

export const GuideFooter: React.FC<GuideFooterProps> = ({
  currentStep,
  totalSteps,
  isLastStep,
  isCompleted,
  onPrevious,
  onNext,
  onMarkComplete,
  onBack,
  onActionButton,
  actionButton,
}) => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      {/* Left: Back to Guides */}
      <div className={classes.leftSection}>
        <Button
          appearance="subtle"
          icon={<ArrowLeft24Regular />}
          onClick={onBack}
          size="small"
        >
          Back to Guides
        </Button>
      </div>

      {/* Center: Step counter */}
      <div className={classes.centerSection}>
        <Text className={classes.stepCounter}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </div>

      {/* Right: Action + Nav buttons */}
      <div className={classes.rightSection}>
        {/* Optional action button */}
        {actionButton && onActionButton && (
          <Button
            appearance="outline"
            size="small"
            onClick={() => onActionButton(actionButton.route)}
          >
            {actionButton.label}
            <ArrowRight16Regular style={{ marginLeft: 4 }} />
          </Button>
        )}

        {/* Previous button */}
        <Button
          appearance="outline"
          icon={<ChevronLeft24Regular />}
          disabled={currentStep === 0}
          onClick={onPrevious}
          size="small"
        >
          Previous
        </Button>

        {/* Next / Mark Complete / Completed */}
        {isLastStep ? (
          isCompleted ? (
            <Button
              appearance="primary"
              icon={<CheckmarkCircle24Regular />}
              disabled
              size="small"
              style={{ backgroundColor: '#10B981', borderColor: '#10B981' }}
            >
              Completed
            </Button>
          ) : (
            <Button
              appearance="primary"
              icon={<CheckmarkCircle24Regular />}
              onClick={onMarkComplete}
              size="small"
            >
              Mark Complete
            </Button>
          )
        ) : (
          <Button
            appearance="primary"
            icon={<ChevronRight24Regular />}
            iconPosition="after"
            onClick={onNext}
            size="small"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};
