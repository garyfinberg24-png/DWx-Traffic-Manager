import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Input,
  Field,
  Dropdown,
  Option,
  Checkbox,
  Spinner,
  makeStyles,
  tokens,
  Text,
  Textarea,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Dismiss24Regular,
  Dismiss16Regular,
  Checkmark24Regular,
  Building24Regular,
} from '@fluentui/react-icons';
import { ClientInput, CLIENT_INDUSTRIES, ClientIndustry, ClientContractStatus } from '../../types/ReferenceData';

// Business unit options for quoting
const BUSINESS_UNIT_OPTIONS = [
  'Enterprise',
  'SMB',
  'Government',
  'Education',
  'Healthcare',
  'Financial Services',
  'Retail',
  'Other',
];
import { referenceDataService } from '../../services/ReferenceDataService';

const useStyles = makeStyles({
  surface: {
    maxWidth: '550px',
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
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2a8a9d 100%)',
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
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 500px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
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
    backgroundColor: '#1e6b7b',
    ':hover': {
      backgroundColor: '#154f5c',
    },
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: '12px',
    marginTop: '4px',
  },
});

interface AddClientDialogProps {
  open: boolean;
  onClose: () => void;
  onClientAdded: (clientName: string, isPremium: boolean) => void;
  accountManagerEmail?: string;
  accountManagerName?: string;
}

export const AddClientDialog: React.FC<AddClientDialogProps> = ({
  open,
  onClose,
  onClientAdded,
  accountManagerEmail,
  accountManagerName,
}) => {
  const styles = useStyles();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState<ClientIndustry | ''>('');
  const [isPremium, setIsPremium] = useState(false);
  const [contractStatus, setContractStatus] = useState<ClientContractStatus>('Active');
  const [businessUnit, setBusinessUnit] = useState('');
  const [notes, setNotes] = useState('');

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [contactNameError, setContactNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  const resetForm = () => {
    setCompanyName('');
    setContactName('');
    setContactEmail('');
    setPhone('');
    setIndustry('');
    setIsPremium(false);
    setContractStatus('Active');
    setBusinessUnit('');
    setNotes('');
    setError(null);
    setNameError('');
    setContactNameError('');
    setEmailError('');
  };

  const validateForm = (): boolean => {
    let isValid = true;

    if (!companyName.trim()) {
      setNameError('Company name is required');
      isValid = false;
    } else if (companyName.length < 2) {
      setNameError('Company name must be at least 2 characters');
      isValid = false;
    } else {
      setNameError('');
    }

    if (!contactName.trim()) {
      setContactNameError('Primary contact name is required');
      isValid = false;
    } else {
      setContactNameError('');
    }

    if (!contactEmail.trim()) {
      setEmailError('Primary contact email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError('');
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const clientData: ClientInput = {
        Title: companyName.trim(),
        PrimaryContactName: contactName.trim(),
        PrimaryContactEmail: contactEmail.trim(),
        Phone: phone.trim() || undefined,
        Industry: industry || undefined,
        IsPremium: isPremium,
        AccountManagerEmail: accountManagerEmail,
        ContractStatus: contractStatus,
        BusinessUnit: businessUnit || undefined,
        Notes: notes.trim() || undefined,
      };

      await referenceDataService.createClient(clientData, accountManagerName);
      onClientAdded(companyName.trim(), isPremium);
      resetForm();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create client';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <Add24Regular />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>Add New Client</div>
              <div className={styles.headerSubtitle}>
                Create a new client for booking
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              disabled={isSubmitting}
              aria-label="Close dialog"
            >
              <Dismiss16Regular />
            </button>
          </div>

          <DialogContent className={styles.body}>
            {error && (
              <div style={{
                backgroundColor: '#fde7e9',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                borderLeft: '4px solid #d13438'
              }}>
                <Text style={{ color: '#d13438' }}>{error}</Text>
              </div>
            )}

            <div className={styles.formGrid}>
              {/* Company Name */}
              <Field
                label="Company Name"
                required
                className={styles.fullWidth}
                validationMessage={nameError}
                validationState={nameError ? 'error' : 'none'}
              >
                <Input
                  value={companyName}
                  onChange={(_, d) => setCompanyName(d.value)}
                  placeholder="e.g., Contoso Ltd"
                  disabled={isSubmitting}
                  contentBefore={<Building24Regular />}
                />
              </Field>

              {/* Primary Contact Name */}
              <Field
                label="Primary Contact Name"
                required
                validationMessage={contactNameError}
                validationState={contactNameError ? 'error' : 'none'}
              >
                <Input
                  value={contactName}
                  onChange={(_, d) => setContactName(d.value)}
                  placeholder="e.g., John Smith"
                  disabled={isSubmitting}
                />
              </Field>

              {/* Primary Contact Email */}
              <Field
                label="Primary Contact Email"
                required
                validationMessage={emailError}
                validationState={emailError ? 'error' : 'none'}
              >
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(_, d) => setContactEmail(d.value)}
                  placeholder="e.g., john@contoso.com"
                  disabled={isSubmitting}
                />
              </Field>

              {/* Phone */}
              <Field label="Phone">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(_, d) => setPhone(d.value)}
                  placeholder="e.g., +27 11 123 4567"
                  disabled={isSubmitting}
                />
              </Field>

              {/* Industry */}
              <Field label="Industry">
                <Dropdown
                  placeholder="Select industry"
                  value={industry || ''}
                  selectedOptions={industry ? [industry] : []}
                  onOptionSelect={(_, d) => setIndustry((d.optionValue as ClientIndustry) || '')}
                  disabled={isSubmitting}
                >
                  {CLIENT_INDUSTRIES.map((ind) => (
                    <Option key={ind} value={ind}>
                      {ind}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              {/* Business Unit */}
              <Field label="Business Unit" hint="For quoting">
                <Dropdown
                  placeholder="Select business unit"
                  value={businessUnit || ''}
                  selectedOptions={businessUnit ? [businessUnit] : []}
                  onOptionSelect={(_, d) => setBusinessUnit(d.optionValue || '')}
                  disabled={isSubmitting}
                >
                  <Option value="">None</Option>
                  {BUSINESS_UNIT_OPTIONS.map((unit) => (
                    <Option key={unit} value={unit}>
                      {unit}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              {/* Premium Client */}
              <div className={styles.checkboxRow}>
                <Checkbox
                  checked={isPremium}
                  onChange={(_, d) => setIsPremium(!!d.checked)}
                  label="Premium Client"
                  disabled={isSubmitting}
                />
              </div>

              {/* Notes */}
              <Field label="Notes" className={styles.fullWidth}>
                <Textarea
                  value={notes}
                  onChange={(_, d) => setNotes(d.value)}
                  placeholder="Additional notes about this client..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </Field>
            </div>
          </DialogContent>

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              appearance="secondary"
              icon={<Dismiss24Regular />}
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              className={styles.submitBtn}
              icon={isSubmitting ? <Spinner size="tiny" /> : <Checkmark24Regular />}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
