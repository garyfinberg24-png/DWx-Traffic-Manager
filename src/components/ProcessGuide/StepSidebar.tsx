/**
 * DWx Traffic Manager - Process Guide Step Sidebar
 * Vertical step navigation sidebar for the process guide wizard.
 * v2.18.0
 */

import React from 'react';
import { Text, makeStyles, shorthands } from '@fluentui/react-components';
import { Checkmark16Regular } from '@fluentui/react-icons';
import type { ProcessGuide, GuideProgress } from '../../types/ProcessGuide';
import { DIFFICULTY_COLORS } from '../../types/ProcessGuide';

interface StepSidebarProps {
  guide: ProcessGuide;
  currentStep: number;
  guideProgress?: GuideProgress;
  onStepClick: (index: number) => void;
}

const useStyles = makeStyles({
  container: {
    width: '280px',
    backgroundColor: '#f8f9fa',
    borderRight: '1px solid #e5e7eb',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    ...shorthands.padding('20px'),
  },
  title: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#1f2937',
    display: 'block',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginTop: '8px',
  },
  difficultyBadge: {
    fontSize: '11px',
    fontWeight: 600,
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('10px'),
  },
  timeEstimate: {
    fontSize: '12px',
    color: '#6b7280',
  },
  stepList: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.padding('10px', '20px'),
    cursor: 'pointer',
    position: 'relative',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  stepItemCurrent: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.padding('10px', '20px'),
    cursor: 'pointer',
    position: 'relative',
    backgroundColor: '#e6f2fb',
  },
  circleContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: '12px',
    flexShrink: 0,
  },
  circle: {
    width: '28px',
    height: '28px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  connector: {
    position: 'absolute',
    top: '38px',
    left: '33px',
    width: '2px',
    height: 'calc(100% - 28px)',
    backgroundColor: '#e5e7eb',
  },
  stepTitle: {
    fontSize: '13px',
    color: '#6b7280',
  },
  stepTitleCurrent: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1f2937',
  },
});

export const StepSidebar: React.FC<StepSidebarProps> = ({
  guide,
  currentStep,
  onStepClick,
}) => {
  const classes = useStyles();
  const diffColor = DIFFICULTY_COLORS[guide.difficulty];

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Text className={classes.title}>{guide.title}</Text>
        <div className={classes.metaRow}>
          <span
            className={classes.difficultyBadge}
            style={{ backgroundColor: diffColor.bg, color: diffColor.text }}
          >
            {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
          </span>
          <span className={classes.timeEstimate}>~{guide.estimatedMinutes} min</span>
        </div>
      </div>

      <div className={classes.stepList}>
        {guide.steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isLast = index === guide.steps.length - 1;

          let circleBg: string;
          let circleColor: string;

          if (isCompleted) {
            circleBg = '#10B981';
            circleColor = '#ffffff';
          } else if (isCurrent) {
            circleBg = '#0d3a5c';
            circleColor = '#ffffff';
          } else {
            circleBg = '#d1d5db';
            circleColor = '#6b7280';
          }

          return (
            <div
              key={step.id}
              className={isCurrent ? classes.stepItemCurrent : classes.stepItem}
              onClick={() => onStepClick(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onStepClick(index);
                }
              }}
            >
              {!isLast && <div className={classes.connector} />}
              <div className={classes.circleContainer}>
                <div
                  className={classes.circle}
                  style={{ backgroundColor: circleBg, color: circleColor }}
                >
                  {isCompleted ? <Checkmark16Regular /> : index + 1}
                </div>
              </div>
              <Text className={isCurrent ? classes.stepTitleCurrent : classes.stepTitle}>
                {step.title}
              </Text>
            </div>
          );
        })}
      </div>
    </div>
  );
};
