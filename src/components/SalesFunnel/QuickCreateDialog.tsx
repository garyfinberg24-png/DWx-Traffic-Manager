/**
 * QuickCreateDialog - Quick-create deal dialog for managers
 * Allows creating a new deal in 3 clicks without the full 5-step wizard.
 * v2.12.1 — Added preSelectedService prop + DWx branded header
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogActions,
  Button,
  Input,
  Text,
  Textarea,
  Combobox,
  Option,
  Dropdown,
  RadioGroup,
  Radio,
  Label,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { AddRegular, DismissRegular, FlashRegular } from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { referenceDataService } from '../../services/ReferenceDataService';
import { DW_COLORS } from '../../utils/buttonStyles';
import type {
  ServiceRequest,
  CreateServiceRequestInput,
  InterestLevel,
  DWService,
} from '../../types/ServiceRequest';
import type { Client } from '../../types/ReferenceData';

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  surface: {
    maxWidth: '480px',
    width: '100%',
    overflow: 'hidden',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
  },
  header: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: DW_COLORS.primary,
    color: 'white',
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
    display: 'block',
  },
  headerSubtitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    display: 'block',
    lineHeight: '1.3',
  },
  closeButton: {
    minWidth: '32px',
    height: '32px',
    padding: '0',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px 20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase200,
  },
  required: {
    color: tokens.colorPaletteRedForeground1,
    marginLeft: '2px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '12px 20px',
    borderTop: '1px solid #e5e7eb',
    backgroundColor: '#fafafa',
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    marginTop: '2px',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 0',
  },
  servicePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#e8f4fc',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#1a5a8a',
    border: '1px solid #cce4f0',
  },
});

// ============================================================================
// Types
// ============================================================================

interface QuickCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onDealCreated: (r: ServiceRequest) => void;
  /** When provided, pre-selects this service and disables the service dropdown */
  preSelectedService?: DWService | null;
}

// Default deal probability based on interest level
const INTEREST_PROBABILITY: Record<InterestLevel, number> = {
  Hot: 50,
  Warm: 30,
  Cold: 10,
};

// ============================================================================
// Component
// ============================================================================

const QuickCreateDialog: React.FC<QuickCreateDialogProps> = ({
  open,
  onClose,
  onDealCreated,
  preSelectedService,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // Data loading state
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<DWService[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [clientName, setClientName] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [dealValue, setDealValue] = useState('');
  const [interestLevel, setInterestLevel] = useState<InterestLevel>('Warm');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Validation state
  const [touched, setTouched] = useState<{ client: boolean; service: boolean }>({
    client: false,
    service: false,
  });

  // Load clients and services on mount
  useEffect(() => {
    if (!open) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const [clientsData, servicesData] = await Promise.all([
          referenceDataService.getClients(),
          serviceCatalogService.getServices(true),
        ]);
        setClients(clientsData);
        setServices(servicesData);
      } catch (err) {
        console.error('Failed to load data for quick create:', err);
        showError('Load Error', 'Failed to load clients or services.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [open, showError]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientName('');
      setSelectedClient(null);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setIndustry('');
      setSelectedServiceId(preSelectedService ? String(preSelectedService.Id) : '');
      setDealValue('');
      setInterestLevel('Warm');
      setNotes('');
      setSubmitting(false);
      setTouched({ client: false, service: !!preSelectedService });
    }
  }, [open, preSelectedService]);

  // Filter clients as user types
  const filteredClients = useMemo(() => {
    if (!clientName.trim()) return clients;
    const lower = clientName.toLowerCase();
    return clients.filter((c) => c.Title.toLowerCase().includes(lower));
  }, [clients, clientName]);

  // Find the selected service object — use preSelectedService as fallback
  const selectedService = useMemo(() => {
    if (preSelectedService && selectedServiceId === String(preSelectedService.Id)) {
      return preSelectedService;
    }
    return services.find((s) => String(s.Id) === selectedServiceId) ?? null;
  }, [services, selectedServiceId, preSelectedService]);

  // Validation
  const clientError = touched.client && !clientName.trim() ? 'Client name is required' : '';
  const serviceError = touched.service && !selectedServiceId ? 'Service is required' : '';
  const isValid = clientName.trim() !== '' && selectedServiceId !== '';

  // Handle client selection from combobox
  const handleClientSelect = (
    _ev: unknown,
    data: { optionValue?: string; optionText?: string }
  ) => {
    if (data.optionValue) {
      const client = clients.find((c) => String(c.Id) === data.optionValue);
      if (client) {
        setSelectedClient(client);
        setClientName(client.Title);
        setContactName(client.PrimaryContactName || '');
        setContactEmail(client.PrimaryContactEmail || '');
        setContactPhone(client.Phone || '');
        setIndustry(client.Industry || '');
      }
    }
  };

  // Handle client name typed (freeform) — uses native FormEvent (Combobox onInput is a standard HTML event)
  const handleClientInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setClientName(value);
    // Clear selected client if user edits the name away from a selected value
    if (selectedClient && value !== selectedClient.Title) {
      setSelectedClient(null);
    }
  };

  // Handle service selection
  const handleServiceSelect = (
    _ev: unknown,
    data: { optionValue?: string; optionText?: string }
  ) => {
    setSelectedServiceId(data.optionValue || '');
  };

  // Handle submit
  const handleSubmit = async () => {
    setTouched({ client: true, service: true });

    if (!isValid || !user || !selectedService) return;

    setSubmitting(true);
    try {
      const parsedDealValue = dealValue ? parseFloat(dealValue) : undefined;
      const probability = INTEREST_PROBABILITY[interestLevel];

      const input: CreateServiceRequestInput = {
        ServiceId: selectedService.Id,
        ServiceName: selectedService.Title,
        ClientName: clientName.trim(),
        ClientId: selectedClient?.Id,
        ContactName: contactName.trim(),
        ContactEmail: contactEmail.trim(),
        ContactPhone: contactPhone.trim() || undefined,
        Industry: (industry as CreateServiceRequestInput['Industry']) || undefined,
        InterestLevel: interestLevel,
        DealValue: parsedDealValue,
        DealProbability: probability,
        Comments: notes.trim() || undefined,
        ProposedSlot1: '', // Quick-create skips scheduling
      };

      const result = await serviceRequestService.createRequest(
        input,
        user.email,
        user.displayName,
        false
      );

      if (result.success && result.request) {
        showSuccess('Deal Created', `${clientName} - ${selectedService.Title} added to pipeline.`);
        onDealCreated(result.request);
        onClose();
      } else {
        showError('Create Failed', result.error || 'Failed to create deal.');
      }
    } catch (err) {
      console.error('Quick create deal error:', err);
      showError('Error', 'An unexpected error occurred while creating the deal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_ev, data) => { if (!data.open) onClose(); }}>
      <DialogSurface className={styles.surface} style={{ padding: 0 }}>
        {/* DWx branded header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <FlashRegular style={{ width: '20px', height: '20px', color: 'white' }} />
          </div>
          <div className={styles.headerContent}>
            <Text className={styles.headerTitle}>Quick Create Deal</Text>
            <Text className={styles.headerSubtitle}>
              {preSelectedService
                ? preSelectedService.Title
                : 'New Pipeline Deal'}
            </Text>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            title="Close"
          >
            <DismissRegular style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="medium" label="Loading..." />
          </div>
        ) : (
          <div className={styles.body}>
            {/* Client */}
            <div className={styles.field}>
              <Label className={styles.label}>
                Client<span className={styles.required}>*</span>
              </Label>
              <Combobox
                freeform
                placeholder="Search or type client name..."
                value={clientName}
                onInput={handleClientInput}
                onOptionSelect={handleClientSelect}
                onBlur={() => setTouched((t) => ({ ...t, client: true }))}
              >
                {filteredClients.map((c) => (
                  <Option key={c.Id} value={String(c.Id)} text={c.Title}>
                    {c.Title}
                  </Option>
                ))}
              </Combobox>
              {clientError && <span className={styles.errorText}>{clientError}</span>}
            </div>

            {/* Service */}
            <div className={styles.field}>
              <Label className={styles.label}>
                Service<span className={styles.required}>*</span>
              </Label>
              {preSelectedService ? (
                <div className={styles.servicePill}>
                  <FlashRegular style={{ width: '14px', height: '14px' }} />
                  {preSelectedService.Title}
                </div>
              ) : (
                <Dropdown
                  placeholder="Select a service..."
                  selectedOptions={selectedServiceId ? [selectedServiceId] : []}
                  value={selectedService?.Title || ''}
                  onOptionSelect={handleServiceSelect}
                  onBlur={() => setTouched((t) => ({ ...t, service: true }))}
                >
                  {services.map((s) => (
                    <Option key={s.Id} value={String(s.Id)} text={s.Title}>
                      {s.Title}
                    </Option>
                  ))}
                </Dropdown>
              )}
              {serviceError && <span className={styles.errorText}>{serviceError}</span>}
            </div>

            {/* Deal Value */}
            <div className={styles.field}>
              <Label className={styles.label}>Estimated Value (ZAR)</Label>
              <Input
                type="number"
                placeholder="e.g. 150000"
                value={dealValue}
                onChange={(_ev, data) => setDealValue(data.value)}
                min={0}
              />
            </div>

            {/* Interest Level */}
            <div className={styles.field}>
              <Label className={styles.label}>Interest Level</Label>
              <RadioGroup
                layout="horizontal"
                value={interestLevel}
                onChange={(_ev, data) => setInterestLevel(data.value as InterestLevel)}
              >
                <Radio value="Hot" label="Hot" />
                <Radio value="Warm" label="Warm" />
                <Radio value="Cold" label="Cold" />
              </RadioGroup>
            </div>

            {/* Notes */}
            <div className={styles.field}>
              <Label className={styles.label}>Notes</Label>
              <Textarea
                rows={2}
                placeholder="Optional notes..."
                value={notes}
                onChange={(_ev, data) => setNotes(data.value)}
              />
            </div>
          </div>
        )}

        <DialogActions className={styles.actions}>
          <Button appearance="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<AddRegular />}
            onClick={handleSubmit}
            disabled={loading || submitting || !isValid}
          >
            {submitting ? 'Creating...' : 'Create Deal'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default QuickCreateDialog;
