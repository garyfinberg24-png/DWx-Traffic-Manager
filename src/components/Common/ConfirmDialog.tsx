import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Warning24Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  surface: {
    maxWidth: '400px',
    width: '100%',
  },
  content: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'flex-start',
  },
  icon: {
    color: tokens.colorPaletteRedForeground1,
    flexShrink: 0,
  },
  message: {
    color: tokens.colorNeutralForeground2,
  },
});

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmAppearance?: 'primary' | 'secondary';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmAppearance = 'primary',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const styles = useStyles();

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <div className={styles.content}>
              <Warning24Regular className={styles.icon} />
              <Text className={styles.message}>{message}</Text>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onCancel} disabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button appearance={confirmAppearance} onClick={onConfirm} disabled={isLoading}>
              {isLoading ? 'Processing...' : confirmLabel}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
