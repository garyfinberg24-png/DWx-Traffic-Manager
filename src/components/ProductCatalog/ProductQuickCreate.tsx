/**
 * ProductQuickCreate — Compact quick-create dialog for product requests.
 * Pre-selects the product from catalog; user provides client + request type.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogSurface,
  Button,
  Input,
  Text,
  Textarea,
  Combobox,
  Option,
  RadioGroup,
  Radio,
  Label,
  Spinner,
  makeStyles,
} from '@fluentui/react-components';
import { AddRegular, DismissRegular } from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { productRequestService } from '../../services/ProductRequestService';
import { referenceDataService } from '../../services/ReferenceDataService';
import { DW_COLORS } from '../../utils/buttonStyles';
import type { Product, ProductType } from '../../types/Product';
import type { ProductRequest, CreateProductRequestInput, ProductRequestType } from '../../types/ProductRequest';
import type { Client } from '../../types/ReferenceData';

// Map lowercase product types to SP Choice column values
const PRODUCT_TYPE_MAP: Record<ProductType, 'App' | 'Web Part' | 'Adaptive Card' | 'Agent'> = {
  app: 'App',
  webpart: 'Web Part',
  'adaptive-card': 'Adaptive Card',
  agent: 'Agent',
};

const useStyles = makeStyles({
  surface: {
    maxWidth: '440px',
    width: '100%',
    overflow: 'hidden',
    borderRadius: '10px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
  },
  header: {
    padding: '14px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: `linear-gradient(135deg, ${DW_COLORS.primary} 0%, ${DW_COLORS.teal} 100%)`,
    color: 'white',
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    borderRadius: '4px',
    ':hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
  },
  body: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  productBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: '#f0f4ff',
    border: '1px solid #e0e7ff',
  },
  productBadgeName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  productBadgeSub: {
    fontSize: '12px',
    color: '#64748b',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  required: {
    color: '#dc2626',
    marginLeft: '2px',
  },
  footer: {
    padding: '12px 20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    borderTop: '1px solid #e5e7eb',
  },
});

interface ProductQuickCreateProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onCreated?: (request: ProductRequest) => void;
  accentColor?: string;
}

const ProductQuickCreate: React.FC<ProductQuickCreateProps> = ({
  open,
  onClose,
  product,
  onCreated,
  accentColor,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // Form state
  const [clientName, setClientName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [requestType, setRequestType] = useState<ProductRequestType>('Demo');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Clients for combobox
  const [clients, setClients] = useState<Client[]>([]);
  const [clientQuery, setClientQuery] = useState('');

  useEffect(() => {
    if (open) {
      referenceDataService.getClients().then(setClients).catch(() => {});
    }
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setClientName('');
      setContactName('');
      setContactEmail('');
      setRequestType('Demo');
      setDealValue('');
      setNotes('');
      setClientQuery('');
    }
  }, [open]);

  const filteredClients = useMemo(() => {
    if (!clientQuery.trim()) return clients.slice(0, 10);
    const q = clientQuery.toLowerCase();
    return clients.filter(c =>
      c.Title.toLowerCase().includes(q) ||
      (c.PrimaryContactName || '').toLowerCase().includes(q)
    ).slice(0, 10);
  }, [clients, clientQuery]);

  const handleClientSelect = (_: unknown, data: { optionValue?: string }) => {
    const name = data.optionValue || '';
    setClientName(name);
    setClientQuery(name);
    const match = clients.find(c => c.Title === name);
    if (match) {
      setContactName(match.PrimaryContactName || '');
      setContactEmail(match.PrimaryContactEmail || '');
    }
  };

  const handleSubmit = async () => {
    if (!product || !user || !clientName.trim()) return;
    setSubmitting(true);
    try {
      const input: CreateProductRequestInput = {
        ProductId: product.id,
        ProductName: product.name,
        ProductType: PRODUCT_TYPE_MAP[product.type] || 'App',
        ProductCategory: product.category,
        RequestType: requestType,
        ClientName: clientName.trim(),
        ContactName: contactName.trim() || clientName.trim(),
        ContactEmail: contactEmail.trim() || '',
        EstimatedValue: dealValue ? parseFloat(dealValue) : undefined,
        Comments: notes.trim() || undefined,
        ProposedSlot1: '',
      };

      const result = await productRequestService.createRequest(
        input,
        user.email,
        user.displayName
      );

      if (result.success && result.request) {
        showSuccess('Request Created', `${clientName} - ${product.name} request submitted.`);
        onCreated?.(result.request);
        onClose();
      } else {
        showError('Create Failed', result.error || 'Failed to create product request.');
      }
    } catch (err) {
      console.error('[ProductQuickCreate] Failed:', err);
      showError('Error', 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = clientName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) onClose(); }}>
      <DialogSurface className={styles.surface} aria-label="Quick create product request">
        {/* Header */}
        <div
          className={styles.header}
          style={accentColor ? { background: `linear-gradient(135deg, ${accentColor} 0%, ${DW_COLORS.primary} 100%)` } : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AddRegular style={{ fontSize: '16px' }} />
            <span className={styles.headerTitle}>Quick Request</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <DismissRegular />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Product badge */}
          {product && (
            <div className={styles.productBadge}>
              <div>
                <div className={styles.productBadgeName}>{product.name}</div>
                <div className={styles.productBadgeSub}>{product.category} &bull; {product.brand}</div>
              </div>
            </div>
          )}

          {/* Client */}
          <div className={styles.fieldGroup}>
            <Label className={styles.label}>
              Client <span className={styles.required}>*</span>
            </Label>
            <Combobox
              freeform
              placeholder="Type or select a client..."
              value={clientQuery}
              selectedOptions={clientName ? [clientName] : []}
              onInput={(e) => {
                setClientQuery((e.target as HTMLInputElement).value);
                setClientName((e.target as HTMLInputElement).value);
              }}
              onOptionSelect={handleClientSelect}
              size="small"
            >
              {filteredClients.map((c) => (
                <Option key={c.Id} value={c.Title} text={c.Title}>
                  {c.Title}
                </Option>
              ))}
            </Combobox>
          </div>

          {/* Request Type */}
          <div className={styles.fieldGroup}>
            <Label className={styles.label}>Request Type</Label>
            <RadioGroup
              value={requestType}
              onChange={(_, data) => setRequestType(data.value as ProductRequestType)}
              layout="horizontal"
            >
              <Radio value="Demo" label="Demo" />
              <Radio value="Trial Deployment" label="Trial Deployment" />
            </RadioGroup>
          </div>

          {/* Deal Value */}
          <div className={styles.fieldGroup}>
            <Label className={styles.label}>Estimated Value (ZAR)</Label>
            <Input
              type="number"
              size="small"
              placeholder="e.g. 50000"
              value={dealValue}
              onChange={(_, data) => setDealValue(data.value)}
              contentBefore={<Text size={200} style={{ color: '#9ca3af' }}>R</Text>}
            />
          </div>

          {/* Notes */}
          <div className={styles.fieldGroup}>
            <Label className={styles.label}>Notes</Label>
            <Textarea
              size="small"
              placeholder="Any additional context..."
              value={notes}
              onChange={(_, data) => setNotes(data.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <Button size="small" appearance="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            size="small"
            appearance="primary"
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            icon={submitting ? <Spinner size="tiny" /> : <AddRegular />}
            style={{ backgroundColor: accentColor || DW_COLORS.teal }}
          >
            {submitting ? 'Creating...' : 'Create Request'}
          </Button>
        </div>
      </DialogSurface>
    </Dialog>
  );
};

export default ProductQuickCreate;
