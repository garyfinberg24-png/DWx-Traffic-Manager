import React, { useState } from 'react';
import {
  makeStyles,
  Dialog,
  DialogSurface,
  Button,
  Input,
  Label,
  Select,
} from '@fluentui/react-components';
import { Dismiss16Regular } from '@fluentui/react-icons';
import { LeaderboardEntry, MonthlyTarget, DEFAULT_TARGETS } from '../../types/Gamification';
import { gamificationService } from '../../services/GamificationService';
import { format } from 'date-fns';

interface SetTargetsDialogProps {
  open: boolean;
  onClose: () => void;
  leaderboard: LeaderboardEntry[];
  managerEmail: string;
}

const useStyles = makeStyles({
  surface: {
    maxWidth: '500px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    padding: '0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e1e1e1',
    backgroundColor: '#fafafa',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#242424',
  },
  closeBtn: {
    minWidth: 'auto',
    padding: '4px',
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fieldLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#242424',
  },
  fieldHint: {
    fontSize: '11px',
    color: '#888',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '16px 24px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#fafafa',
  },
  success: {
    color: '#107c10',
    fontWeight: '600',
    fontSize: '13px',
    textAlign: 'center' as const,
    padding: '8px',
    backgroundColor: '#f0fff0',
    borderRadius: '6px',
  },
});

export const SetTargetsDialog: React.FC<SetTargetsDialogProps> = ({
  open,
  onClose,
  leaderboard,
  managerEmail,
}) => {
  const styles = useStyles();
  const month = format(new Date(), 'yyyy-MM');
  const [selectedAM, setSelectedAM] = useState('');
  const [targetBookings, setTargetBookings] = useState(DEFAULT_TARGETS.targetBookings.toString());
  const [targetConfirmed, setTargetConfirmed] = useState(DEFAULT_TARGETS.targetConfirmed.toString());
  const [targetLicenses, setTargetLicenses] = useState(DEFAULT_TARGETS.targetLicenses.toString());
  const [saved, setSaved] = useState(false);

  // Load existing target when AM is selected
  const handleAMChange = (email: string) => {
    setSelectedAM(email);
    setSaved(false);
    const existing = gamificationService.getMonthlyTarget(email, month);
    if (existing) {
      setTargetBookings(existing.targetBookings.toString());
      setTargetConfirmed(existing.targetConfirmed.toString());
      setTargetLicenses(existing.targetLicenses.toString());
    } else {
      setTargetBookings(DEFAULT_TARGETS.targetBookings.toString());
      setTargetConfirmed(DEFAULT_TARGETS.targetConfirmed.toString());
      setTargetLicenses(DEFAULT_TARGETS.targetLicenses.toString());
    }
  };

  const handleSave = () => {
    if (!selectedAM) return;
    const target: MonthlyTarget = {
      accountManagerEmail: selectedAM,
      month,
      targetBookings: parseInt(targetBookings) || DEFAULT_TARGETS.targetBookings,
      targetConfirmed: parseInt(targetConfirmed) || DEFAULT_TARGETS.targetConfirmed,
      targetLicenses: parseInt(targetLicenses) || DEFAULT_TARGETS.targetLicenses,
      setBy: managerEmail,
      setAt: new Date().toISOString(),
    };
    gamificationService.setMonthlyTarget(target);
    setSaved(true);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            Set Monthly Targets - {format(new Date(), 'MMMM yyyy')}
          </span>
          <Button
            className={styles.closeBtn}
            appearance="subtle"
            icon={<Dismiss16Regular />}
            onClick={onClose}
          />
        </div>
        <div className={styles.body}>
          <div className={styles.field}>
            <Label className={styles.fieldLabel}>Account Manager</Label>
            <Select
              value={selectedAM}
              onChange={(_, data) => handleAMChange(data.value)}
            >
              <option value="">Select an AM...</option>
              {leaderboard.map((entry) => (
                <option key={entry.accountManagerEmail} value={entry.accountManagerEmail}>
                  {entry.accountManagerName}
                </option>
              ))}
            </Select>
          </div>

          {selectedAM && (
            <>
              <div className={styles.field}>
                <Label className={styles.fieldLabel}>Target Bookings</Label>
                <Input
                  type="number"
                  min="1"
                  value={targetBookings}
                  onChange={(_, data) => { setTargetBookings(data.value); setSaved(false); }}
                />
                <span className={styles.fieldHint}>Total bookings to create this month</span>
              </div>

              <div className={styles.field}>
                <Label className={styles.fieldLabel}>Target Confirmed</Label>
                <Input
                  type="number"
                  min="1"
                  value={targetConfirmed}
                  onChange={(_, data) => { setTargetConfirmed(data.value); setSaved(false); }}
                />
                <span className={styles.fieldHint}>Bookings that should reach Confirmed status</span>
              </div>

              <div className={styles.field}>
                <Label className={styles.fieldLabel}>Target Licenses</Label>
                <Input
                  type="number"
                  min="1"
                  value={targetLicenses}
                  onChange={(_, data) => { setTargetLicenses(data.value); setSaved(false); }}
                />
                <span className={styles.fieldHint}>Total licenses across all bookings</span>
              </div>

              {saved && (
                <div className={styles.success}>
                  Targets saved for {leaderboard.find(e => e.accountManagerEmail === selectedAM)?.accountManagerName}
                </div>
              )}
            </>
          )}
        </div>

        <div className={styles.footer}>
          <Button appearance="secondary" onClick={onClose}>
            Close
          </Button>
          <Button appearance="primary" onClick={handleSave} disabled={!selectedAM}>
            Save Targets
          </Button>
        </div>
      </DialogSurface>
    </Dialog>
  );
};
