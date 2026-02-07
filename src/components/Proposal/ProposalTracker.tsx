/**
 * DWx Traffic Manager - Proposal Tracker Card
 * Compact status card shown in RequestDetails when a proposal exists.
 * Shows current status, version, approval info, and "Open Proposal" button.
 */

import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  shorthands,
  Text,
  Button,
  Badge,
  Spinner,
} from '@fluentui/react-components';
import {
  DocumentBulletList24Regular,
  Open24Regular,
  Checkmark16Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import { Proposal, ProposalStatus, PROPOSAL_STEPPER_STAGES } from '../../types/Proposal';
import { proposalService } from '../../services/ProposalService';
import { DW_COLORS } from '../../utils/buttonStyles';

// ============================================================================
// Types
// ============================================================================

interface ProposalTrackerProps {
  serviceRequestId: number;
  onOpenProposal: (proposal: Proposal) => void;
  onCreateProposal?: () => void;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  card: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  icon: {
    color: tokens.colorBrandForeground1,
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  stepsRow: {
    display: 'flex',
    ...shorthands.gap('4px'),
    alignItems: 'center',
  },
  stepDot: {
    width: '20px',
    height: '20px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '600',
  },
  stepDotCompleted: {
    backgroundColor: DW_COLORS.success,
    color: 'white',
  },
  stepDotCurrent: {
    backgroundColor: DW_COLORS.primary,
    color: 'white',
  },
  stepDotFuture: {
    backgroundColor: tokens.colorNeutralBackground4,
    color: tokens.colorNeutralForeground3,
  },
  stepLine: {
    flex: 1,
    height: '2px',
    backgroundColor: tokens.colorNeutralStroke2,
  },
  stepLineCompleted: {
    backgroundColor: DW_COLORS.success,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('12px'),
  },
  emptyState: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
    ...shorthands.padding('8px'),
  },
});

// ============================================================================
// Helpers
// ============================================================================

function getStatusBadgeColor(status: ProposalStatus): 'informative' | 'warning' | 'success' | 'danger' | 'brand' {
  switch (status) {
    case 'Draft': return 'informative';
    case 'Internal Review': return 'warning';
    case 'Revision Requested': return 'warning';
    case 'Approved': return 'success';
    case 'Sent to Client': return 'brand';
    case 'Accepted': return 'success';
    case 'Declined': return 'danger';
    default: return 'informative';
  }
}

// ============================================================================
// Component
// ============================================================================

export const ProposalTracker: React.FC<ProposalTrackerProps> = ({
  serviceRequestId,
  onOpenProposal,
  onCreateProposal,
}) => {
  const styles = useStyles();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    proposalService
      .getProposalByServiceRequest(serviceRequestId)
      .then(setProposal)
      .catch(() => {
        // No proposal found — that's OK
      })
      .finally(() => setLoading(false));
  }, [serviceRequestId]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingState}>
          <Spinner size="tiny" label="Loading proposal..." />
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <DocumentBulletList24Regular className={styles.icon} />
            <Text className={styles.title}>Proposal</Text>
          </div>
        </div>
        <Text className={styles.emptyState}>
          No proposal created yet.
        </Text>
        {onCreateProposal && (
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={onCreateProposal}
            style={{ backgroundColor: DW_COLORS.primary }}
            size="small"
          >
            Create Proposal
          </Button>
        )}
      </div>
    );
  }

  const currentIdx = PROPOSAL_STEPPER_STAGES.indexOf(proposal.Status);
  const effectiveIdx = proposal.Status === 'Revision Requested'
    ? 1
    : proposal.Status === 'Declined'
      ? PROPOSAL_STEPPER_STAGES.length - 1
      : currentIdx >= 0 ? currentIdx : 0;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <DocumentBulletList24Regular className={styles.icon} />
          <Text className={styles.title}>Proposal v{proposal.Version}</Text>
        </div>
        <Badge
          appearance="tint"
          color={getStatusBadgeColor(proposal.Status)}
          size="small"
        >
          {proposal.Status}
        </Badge>
      </div>

      {/* Mini progress dots */}
      <div className={styles.stepsRow}>
        {PROPOSAL_STEPPER_STAGES.map((stage, i) => {
          const isLast = i === PROPOSAL_STEPPER_STAGES.length - 1;
          let dotClass = styles.stepDotFuture;
          if (i < effectiveIdx) dotClass = styles.stepDotCompleted;
          else if (i === effectiveIdx) dotClass = styles.stepDotCurrent;

          return (
            <React.Fragment key={stage}>
              <div className={`${styles.stepDot} ${dotClass}`}>
                {i < effectiveIdx ? (
                  <Checkmark16Regular />
                ) : (
                  i + 1
                )}
              </div>
              {!isLast && (
                <div
                  className={`${styles.stepLine} ${
                    i < effectiveIdx ? styles.stepLineCompleted : ''
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Meta info */}
      <div className={styles.metaRow}>
        <span>
          {proposal.ApprovedByName
            ? `Approved by ${proposal.ApprovedByName}`
            : proposal.CreatedByName
              ? `Created by ${proposal.CreatedByName}`
              : ''}
        </span>
        <span>
          {proposal.ValidUntil
            ? `Valid until ${new Date(proposal.ValidUntil).toLocaleDateString()}`
            : ''}
        </span>
      </div>

      {/* Open button */}
      <Button
        appearance="primary"
        icon={<Open24Regular />}
        onClick={() => onOpenProposal(proposal)}
        style={{ backgroundColor: DW_COLORS.primary }}
        size="small"
      >
        Open Proposal
      </Button>
    </div>
  );
};
