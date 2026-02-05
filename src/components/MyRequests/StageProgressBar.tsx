/**
 * DWx Traffic Manager - Stage Progress Bar
 * Visual funnel progress indicator showing current stage in the sales workflow
 */

import React from 'react';
import { makeStyles, Text, Tooltip } from '@fluentui/react-components';
import { CheckmarkRegular, DismissRegular } from '@fluentui/react-icons';
import { FunnelStage, STAGE_METADATA } from '../../types/ServiceRequest';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  stage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  stageIndicator: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    zIndex: 1,
  },
  stageCompleted: {
    backgroundColor: '#107c10',
    color: 'white',
  },
  stageCurrent: {
    backgroundColor: '#1e6b7b',
    color: 'white',
    boxShadow: '0 0 0 3px rgba(30, 107, 123, 0.2)',
  },
  stagePending: {
    backgroundColor: '#e1e1e1',
    color: '#616161',
  },
  stageWon: {
    backgroundColor: '#107c10',
    color: 'white',
  },
  stageLost: {
    backgroundColor: '#d13438',
    color: 'white',
  },
  connector: {
    flex: 1,
    height: '3px',
    backgroundColor: '#e1e1e1',
    transition: 'background-color 0.2s ease',
  },
  connectorCompleted: {
    backgroundColor: '#107c10',
  },
  stageLabel: {
    fontSize: '10px',
    color: '#616161',
    marginTop: '4px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  stageLabelActive: {
    color: '#1e6b7b',
    fontWeight: '600',
  },
  compactContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  compactStage: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px',
    fontWeight: '600',
  },
  compactConnector: {
    width: '16px',
    height: '2px',
    backgroundColor: '#e1e1e1',
  },
});

const STAGES: FunnelStage[] = ['Lead', 'Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Won'];

interface StageProgressBarProps {
  currentStage: FunnelStage;
  compact?: boolean;
  showLabels?: boolean;
}

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentStage,
  compact = false,
  showLabels = true,
}) => {
  const styles = useStyles();

  const getStageIndex = (stage: FunnelStage): number => {
    if (stage === 'Lost') return -1;
    return STAGES.indexOf(stage);
  };

  const currentIndex = getStageIndex(currentStage);
  const isLost = currentStage === 'Lost';
  const isWon = currentStage === 'Won';

  const getStageStatus = (stage: FunnelStage, index: number): 'completed' | 'current' | 'pending' | 'won' | 'lost' => {
    if (isLost && stage !== 'Lost') return 'pending';
    if (isWon && stage === 'Won') return 'won';
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  const getStageStyle = (status: 'completed' | 'current' | 'pending' | 'won' | 'lost'): string => {
    switch (status) {
      case 'completed':
        return styles.stageCompleted;
      case 'current':
        return styles.stageCurrent;
      case 'won':
        return styles.stageWon;
      case 'lost':
        return styles.stageLost;
      default:
        return styles.stagePending;
    }
  };

  if (compact) {
    return (
      <div
        className={styles.compactContainer}
        role="progressbar"
        aria-label={`Sales funnel progress: ${currentStage}`}
        aria-valuemin={0}
        aria-valuemax={STAGES.length}
        aria-valuenow={isLost ? 0 : currentIndex + 1}
        aria-valuetext={`${currentStage} stage`}
      >
        {STAGES.slice(0, -1).map((stage, index) => {
          const status = getStageStatus(stage, index);
          return (
            <React.Fragment key={stage}>
              <Tooltip content={`${stage}: ${STAGE_METADATA[stage].description}`} relationship="label">
                <div
                  className={`${styles.compactStage} ${getStageStyle(status)}`}
                >
                  {status === 'completed' ? (
                    <CheckmarkRegular style={{ width: '10px', height: '10px' }} />
                  ) : (
                    index + 1
                  )}
                </div>
              </Tooltip>
              {index < STAGES.length - 2 && (
                <div
                  className={styles.compactConnector}
                  style={{
                    backgroundColor: index < currentIndex ? '#107c10' : '#e1e1e1',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
        {/* Terminal state indicator */}
        <Tooltip
          content={isLost ? 'Lost: Opportunity closed' : isWon ? 'Won: Contract signed' : 'Final outcome pending'}
          relationship="label"
        >
          <div
            className={`${styles.compactStage} ${
              isWon ? styles.stageWon : isLost ? styles.stageLost : styles.stagePending
            }`}
          >
            {isWon ? (
              <CheckmarkRegular style={{ width: '10px', height: '10px' }} />
            ) : isLost ? (
              <DismissRegular style={{ width: '10px', height: '10px' }} />
            ) : (
              '✓'
            )}
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.progressBar}
        role="progressbar"
        aria-label={`Sales funnel progress: ${currentStage}`}
        aria-valuemin={0}
        aria-valuemax={STAGES.length}
        aria-valuenow={isLost ? 0 : currentIndex + 1}
        aria-valuetext={`${currentStage} stage`}
      >
        {STAGES.map((stage, index) => {
          const status = getStageStatus(stage, index);
          const isTerminal = stage === 'Won';

          return (
            <React.Fragment key={stage}>
              <div className={styles.stage}>
                <Tooltip content={STAGE_METADATA[stage].description} relationship="label">
                  <div className={`${styles.stageIndicator} ${getStageStyle(status)}`}>
                    {status === 'completed' || status === 'won' ? (
                      <CheckmarkRegular style={{ width: '14px', height: '14px' }} />
                    ) : (
                      index + 1
                    )}
                  </div>
                </Tooltip>
                {showLabels && (
                  <Text
                    className={`${styles.stageLabel} ${
                      status === 'current' ? styles.stageLabelActive : ''
                    }`}
                  >
                    {stage}
                  </Text>
                )}
              </div>
              {!isTerminal && (
                <div
                  className={`${styles.connector} ${
                    index < currentIndex ? styles.connectorCompleted : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Lost indicator if applicable */}
      {isLost && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
          }}
        >
          <div
            className={`${styles.stageIndicator} ${styles.stageLost}`}
            style={{ width: '24px', height: '24px' }}
          >
            <DismissRegular style={{ width: '12px', height: '12px' }} />
          </div>
          <Text style={{ fontSize: '12px', color: '#d13438', fontWeight: '500' }}>
            Opportunity Lost
          </Text>
        </div>
      )}
    </div>
  );
};
