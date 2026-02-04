import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Text,
  Field,
  Input,
  Textarea,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  DocumentBulletList24Regular,
  Dismiss24Regular,
  Dismiss16Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';
import { Booking } from '../../types/Booking';
import { TemplateFormData } from '../../types/Template';

const useStyles = makeStyles({
  surface: {
    maxWidth: '480px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 25.6px 57.6px 0 rgba(0,0,0,.22), 0 4.8px 14.4px 0 rgba(0,0,0,.18)',
  },
  dialogBody: {
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
    color: 'white',
    position: 'relative',
    flexShrink: 0,
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  headerSubtitle: {
    fontSize: '13px',
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    minWidth: '28px',
    width: '28px',
    height: '28px',
    padding: '0',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
  },
  body: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  previewBox: {
    padding: '12px 16px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
    fontSize: '13px',
  },
  previewLabel: {
    fontWeight: '600',
    color: tokens.colorNeutralForeground2,
    marginBottom: '8px',
    display: 'block',
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    '&:last-child': {
      marginBottom: 0,
    },
  },
  previewKey: {
    color: tokens.colorNeutralForeground3,
  },
  previewValue: {
    fontWeight: '500',
  },
  actions: {
    padding: '16px 24px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0,
  },
  submitBtn: {
    backgroundColor: '#0078d4',
    ':hover': {
      backgroundColor: '#106ebe',
    },
  },
});

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: TemplateFormData) => void;
  booking: Booking | null;
}

export const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({
  open,
  onClose,
  onSave,
  booking,
}) => {
  const styles = useStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open && booking) {
      setTemplateName(`${booking.ClientName} - ${booking.BookingType}`);
      setDescription('');
    }
  }, [open, booking]);

  if (!booking) return null;

  const handleSubmit = () => {
    setIsSubmitting(true);
    try {
      onSave({
        name: templateName,
        description,
        clientName: booking.ClientName,
        bookingType: booking.BookingType,
        licenseCount: booking.LicenseCount,
        isPremiumClient: booking.IsPremiumClient,
        defaultComments: booking.Comments,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <DocumentBulletList24Regular />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Save as Template</div>
              <div className={styles.headerSubtitle}>
                Reuse this booking configuration
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close dialog"
            >
              <Dismiss16Regular />
            </button>
          </div>

          <DialogContent className={styles.body}>
            {/* Template Name */}
            <Field label="Template Name" required>
              <Input
                value={templateName}
                onChange={(_, d) => setTemplateName(d.value)}
                placeholder="Enter a name for this template"
                disabled={isSubmitting}
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <Textarea
                value={description}
                onChange={(_, d) => setDescription(d.value)}
                placeholder="Optional description..."
                rows={2}
                disabled={isSubmitting}
              />
            </Field>

            {/* Preview */}
            <div className={styles.previewBox}>
              <Text className={styles.previewLabel}>Template will include:</Text>
              <div className={styles.previewItem}>
                <span className={styles.previewKey}>Client:</span>
                <span className={styles.previewValue}>{booking.ClientName}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.previewKey}>Type:</span>
                <span className={styles.previewValue}>{booking.BookingType}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.previewKey}>Licenses:</span>
                <span className={styles.previewValue}>{booking.LicenseCount}</span>
              </div>
              <div className={styles.previewItem}>
                <span className={styles.previewKey}>Premium:</span>
                <span className={styles.previewValue}>{booking.IsPremiumClient ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </DialogContent>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              appearance="secondary"
              icon={<Dismiss24Regular />}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              className={styles.submitBtn}
              icon={isSubmitting ? <Spinner size="tiny" /> : <Checkmark24Regular />}
              onClick={handleSubmit}
              disabled={isSubmitting || !templateName.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
