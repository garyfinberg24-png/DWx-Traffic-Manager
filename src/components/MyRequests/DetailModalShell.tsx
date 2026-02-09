/**
 * DWx Traffic Manager - Detail Modal Shell
 * Shared modal wrapper for service and product request detail modals.
 * Provides: header, progress stepper, tab bar, scrollable content, footer.
 */

import React, { ReactNode } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  makeStyles,
  Text,
  Button,
  Tooltip,
} from '@fluentui/react-components';
import { Dismiss24Regular, EditRegular, SaveRegular } from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '960px',
    width: '92vw',
    maxHeight: '92vh',
    padding: '0',
    borderRadius: '12px',
    border: 'none',
    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  dialogBody: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxHeight: '92vh',
  },

  // Header
  header: {
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: DW_COLORS.primary,
    color: 'white',
    flexShrink: 0,
  },
  headerIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  headerSubtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: '6px',
    display: 'block',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(4px)',
    letterSpacing: '0.3px',
  },
  closeBtn: {
    minWidth: '36px',
    height: '36px',
    padding: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
    },
  },

  // Progress stepper
  progressSection: {
    padding: '14px 24px 28px 24px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e1e1e1',
    flexShrink: 0,
  },
  progressTrack: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
  },
  progressStep: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    flex: 1,
  },
  progressStepLast: {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    flex: 0,
  },
  progressDot: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    flexShrink: 0,
    position: 'relative',
  },
  progressDotCompleted: {
    backgroundColor: DW_COLORS.success,
    color: 'white',
  },
  progressDotCurrent: {
    backgroundColor: DW_COLORS.primary,
    color: 'white',
    boxShadow: '0 0 0 3px rgba(26,90,138,0.25)',
  },
  progressDotFuture: {
    backgroundColor: '#e0e0e0',
    color: '#888',
  },
  progressLine: {
    flex: 1,
    height: '3px',
    margin: '0 4px',
  },
  progressLineCompleted: {
    backgroundColor: DW_COLORS.success,
  },
  progressLineFuture: {
    backgroundColor: '#e0e0e0',
  },
  progressLabel: {
    fontSize: '10px',
    color: '#616161',
    textAlign: 'center',
    position: 'absolute',
    top: '32px',
    whiteSpace: 'nowrap',
    left: '50%',
    transform: 'translateX(-50%)',
  },
  progressLabelFirst: {
    left: '0',
    transform: 'none',
    textAlign: 'left',
  },
  progressLabelLast: {
    left: 'auto',
    right: '0',
    transform: 'none',
    textAlign: 'right',
  },
  progressLabelCurrent: {
    color: '#1a5a8a',
    fontWeight: '600',
  },

  // Tab bar
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #e1e1e1',
    padding: '0 24px',
    flexShrink: 0,
    backgroundColor: '#fff',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '12px 18px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#616161',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
    ':hover': {
      color: '#1a5a8a',
      backgroundColor: 'rgba(26,90,138,0.04)',
    },
  },
  tabBtnActive: {
    color: '#1a5a8a',
    fontWeight: '600',
    borderBottomColor: '#1a5a8a',
  },

  // Tab content
  tabContent: {
    overflowY: 'auto',
    padding: '28px 32px',
    height: '460px',
  },

  // Footer
  footer: {
    padding: '14px 24px',
    backgroundColor: '#fafafa',
    borderTop: '1px solid #e1e1e1',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  footerMeta: {
    fontSize: '12px',
    color: '#888',
  },
});

// ============================================================================
// Shared sub-components
// ============================================================================

const useSectionStyles = makeStyles({
  section: {
    marginBottom: '24px',
  },
  sectionLast: {
    marginBottom: '0',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #eee',
  },
  sectionIcon: {
    fontSize: '16px',
    color: '#1a5a8a',
    display: 'inline-flex',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1a5a8a',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    flex: 1,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px 24px',
  },
  detailGridThreeCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px 24px',
  },
  detailField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  fieldLabel: {
    fontSize: '11px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  fieldValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e8e8e8',
    margin: '20px 0',
  },
  textBlock: {
    fontSize: '14px',
    color: '#424242',
    lineHeight: '1.6',
    padding: '14px 16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap',
  },
  editButton: {
    minWidth: '32px',
    height: '28px',
    padding: '0 8px',
  },
  editingIndicator: {
    fontSize: '11px',
    color: '#b45309',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  editActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  saveButton: {
    backgroundColor: DW_COLORS.success,
    ':hover': {
      backgroundColor: '#0b5a0b',
    },
  },
});

// ============================================================================
// Section Components
// ============================================================================

interface DetailSectionProps {
  icon?: ReactNode;
  title: string;
  last?: boolean;
  editButton?: ReactNode;
  children: ReactNode;
}

export const DetailSection: React.FC<DetailSectionProps> = ({
  icon,
  title,
  last,
  editButton,
  children,
}) => {
  const s = useSectionStyles();
  return (
    <div className={last ? s.sectionLast : s.section}>
      <div className={s.sectionHeader}>
        {icon && <span className={s.sectionIcon}>{icon}</span>}
        <span className={s.sectionTitle}>{title}</span>
        {editButton}
      </div>
      {children}
    </div>
  );
};

interface DetailGridProps {
  columns?: 2 | 3;
  children: ReactNode;
}

export const DetailGrid: React.FC<DetailGridProps> = ({ columns = 2, children }) => {
  const s = useSectionStyles();
  return (
    <div className={columns === 3 ? s.detailGridThreeCol : s.detailGrid}>
      {children}
    </div>
  );
};

interface DetailFieldProps {
  label: string;
  children: ReactNode;
}

export const DetailField: React.FC<DetailFieldProps> = ({ label, children }) => {
  const s = useSectionStyles();
  return (
    <div className={s.detailField}>
      <span className={s.fieldLabel}>{label}</span>
      <span className={s.fieldValue}>{children}</span>
    </div>
  );
};

export const Divider: React.FC = () => {
  const s = useSectionStyles();
  return <div className={s.divider} />;
};

export const TextBlock: React.FC<{ children: ReactNode; style?: React.CSSProperties }> = ({ children, style }) => {
  const s = useSectionStyles();
  return <div className={s.textBlock} style={style}>{children}</div>;
};

// Edit controls re-exports for convenience
export const EditButton: React.FC<{
  onClick: () => void;
  title?: string;
}> = ({ onClick, title = 'Edit' }) => {
  const s = useSectionStyles();
  return (
    <Tooltip content={title} relationship="label">
      <Button
        className={s.editButton}
        appearance="subtle"
        icon={<EditRegular />}
        size="small"
        onClick={onClick}
        aria-label={title}
      />
    </Tooltip>
  );
};

export const EditingIndicator: React.FC = () => {
  const s = useSectionStyles();
  return (
    <span className={s.editingIndicator}>
      <EditRegular style={{ width: '12px', height: '12px' }} />
      Editing
    </span>
  );
};

export const EditActions: React.FC<{
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}> = ({ onSave, onCancel, saving }) => {
  const s = useSectionStyles();
  return (
    <div className={s.editActions}>
      <Button
        className={s.saveButton}
        appearance="primary"
        icon={<SaveRegular />}
        onClick={onSave}
        disabled={saving}
        size="small"
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
      <Button
        appearance="secondary"
        onClick={onCancel}
        disabled={saving}
        size="small"
      >
        Cancel
      </Button>
    </div>
  );
};

// ============================================================================
// Progress Stepper
// ============================================================================

export interface StepperStep {
  label: string;
  status: 'completed' | 'current' | 'future';
}

interface ProgressStepperProps {
  steps: StepperStep[];
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({ steps }) => {
  const styles = useStyles();

  return (
    <div className={styles.progressSection}>
      <div className={styles.progressTrack}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;

          const dotClass = [
            styles.progressDot,
            step.status === 'completed' ? styles.progressDotCompleted : '',
            step.status === 'current' ? styles.progressDotCurrent : '',
            step.status === 'future' ? styles.progressDotFuture : '',
          ]
            .filter(Boolean)
            .join(' ');

          const labelClass = [
            styles.progressLabel,
            i === 0 ? styles.progressLabelFirst : '',
            isLast ? styles.progressLabelLast : '',
            step.status === 'current' ? styles.progressLabelCurrent : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div
              key={step.label}
              className={isLast ? styles.progressStepLast : styles.progressStep}
            >
              <div className={dotClass}>
                {step.status === 'completed' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
                <span className={labelClass}>{step.label}</span>
              </div>
              {!isLast && (
                <div
                  className={`${styles.progressLine} ${
                    step.status === 'completed'
                      ? styles.progressLineCompleted
                      : styles.progressLineFuture
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// Tab definition
// ============================================================================

export interface ModalTab {
  value: string;
  label: string;
  icon: ReactNode;
}

// ============================================================================
// Main Shell Component
// ============================================================================

interface DetailModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  statusBadge: ReactNode;
  steps?: StepperStep[];
  tabs: ModalTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  maxWidth?: string;
}

export const DetailModalShell: React.FC<DetailModalShellProps> = ({
  isOpen,
  onClose,
  icon,
  title,
  subtitle,
  statusBadge,
  steps,
  tabs,
  activeTab,
  onTabChange,
  children,
  footerLeft,
  footerRight,
  maxWidth,
}) => {
  const styles = useStyles();

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface} style={maxWidth ? { maxWidth } : undefined}>
        <DialogBody className={styles.dialogBody} style={{ padding: 0 }}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>{icon}</div>
            <div className={styles.headerContent}>
              <Text className={styles.headerTitle}>{title}</Text>
              <Text className={styles.headerSubtitle}>{subtitle}</Text>
            </div>
            <div className={styles.headerRight}>
              <span className={styles.statusBadge}>{statusBadge}</span>
              <button className={styles.closeBtn} onClick={onClose} title="Close">
                <Dismiss24Regular />
              </button>
            </div>
          </div>

          {/* Progress Stepper */}
          {steps && steps.length > 0 && <ProgressStepper steps={steps} />}

          {/* Tab Bar */}
          <div className={styles.tabBar}>
            {tabs.map((tab) => (
              <button
                key={tab.value}
                className={`${styles.tabBtn} ${
                  activeTab === tab.value ? styles.tabBtnActive : ''
                }`}
                onClick={() => onTabChange(tab.value)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className={styles.tabContent}>{children}</div>

          {/* Footer */}
          <div className={styles.footer}>
            <span className={styles.footerMeta}>{footerLeft}</span>
            <div>{footerRight || (
              <Button appearance="primary" onClick={onClose} style={{ backgroundColor: DW_COLORS.primary }}>
                Done
              </Button>
            )}</div>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
