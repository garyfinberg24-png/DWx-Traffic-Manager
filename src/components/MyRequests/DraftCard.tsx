/**
 * DWx Traffic Manager - Draft Card
 * Displays a saved form draft with restore/delete actions.
 */

import React from 'react';
import {
  Text,
  Button,
  ProgressBar,
  makeStyles,
} from '@fluentui/react-components';
import {
  DocumentRegular,
  BoxRegular,
  DeleteRegular,
  ArrowRightRegular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  card: {
    padding: '20px 24px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    border: '1px solid #e1e1e1',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBoxService: {
    backgroundColor: '#e8f4fc',
    color: '#1a5a8a',
  },
  iconBoxProduct: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  draftType: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#242424',
  },
  draftSubtitle: {
    fontSize: '13px',
    color: '#616161',
    marginTop: '2px',
  },
  detailRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  detailRow: {
    fontSize: '13px',
    color: '#424242',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  detailIcon: {
    width: '14px',
    height: '14px',
    color: '#888',
    flexShrink: 0,
  },
  progressRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#616161',
    whiteSpace: 'nowrap',
  },
  progressBarWrap: {
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  age: {
    fontSize: '12px',
    color: '#888',
  },
  ageWarning: {
    fontSize: '12px',
    color: '#d13438',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  continueBtn: {
    backgroundColor: '#1a5a8a',
    ':hover': {
      backgroundColor: '#145a7a',
    },
  },
});

export interface DraftInfo {
  type: 'service' | 'product';
  clientName: string;
  serviceName: string;
  currentStep: number;
  totalSteps: number;
  dealValue?: number;
  savedAt: string; // ISO string
}

interface DraftCardProps {
  draft: DraftInfo;
  onContinue: () => void;
  onDelete: () => void;
}

function formatAge(savedAt: string): { text: string; isOld: boolean } {
  const now = Date.now();
  const saved = new Date(savedAt).getTime();
  const diffMs = now - saved;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  let text: string;
  if (diffMin < 1) text = 'Saved just now';
  else if (diffMin < 60) text = `Saved ${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  else if (diffHrs < 24) text = `Saved ${diffHrs} hour${diffHrs !== 1 ? 's' : ''} ago`;
  else text = `Saved ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

  return { text, isOld: diffDays >= 5 };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(value);
}

export const DraftCard: React.FC<DraftCardProps> = ({ draft, onContinue, onDelete }) => {
  const styles = useStyles();
  const { text: ageText, isOld } = formatAge(draft.savedAt);
  const isService = draft.type === 'service';
  const progress = draft.totalSteps > 0 ? draft.currentStep / draft.totalSteps : 0;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div
          className={`${styles.iconBox} ${
            isService ? styles.iconBoxService : styles.iconBoxProduct
          }`}
        >
          {isService ? (
            <DocumentRegular style={{ width: '22px', height: '22px' }} />
          ) : (
            <BoxRegular style={{ width: '22px', height: '22px' }} />
          )}
        </div>
        <div className={styles.headerContent}>
          <Text className={styles.draftType}>
            {isService ? 'Service Request Draft' : 'Product Request Draft'}
          </Text>
          <Text className={styles.draftSubtitle}>
            {draft.clientName || 'Client not yet entered'}
          </Text>
        </div>
      </div>

      {/* Details */}
      <div className={styles.detailRows}>
        <div className={styles.detailRow}>
          {isService ? (
            <DocumentRegular className={styles.detailIcon} />
          ) : (
            <BoxRegular className={styles.detailIcon} />
          )}
          {draft.serviceName || 'Not yet selected'}
        </div>
        {draft.dealValue != null && draft.dealValue > 0 && (
          <div className={styles.detailRow} style={{ fontWeight: 600, color: '#107c10' }}>
            {formatCurrency(draft.dealValue)}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className={styles.progressRow}>
        <Text className={styles.progressLabel}>
          Step {draft.currentStep} of {draft.totalSteps}
        </Text>
        <div className={styles.progressBarWrap}>
          <ProgressBar value={progress} thickness="large" color="brand" />
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <span className={isOld ? styles.ageWarning : styles.age}>
          {ageText}
          {isOld && ' — expires soon'}
        </span>
        <div className={styles.actions}>
          <Button
            appearance="outline"
            icon={<DeleteRegular />}
            size="small"
            onClick={onDelete}
          >
            Delete
          </Button>
          <Button
            appearance="primary"
            className={styles.continueBtn}
            icon={<ArrowRightRegular />}
            size="small"
            onClick={onContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
