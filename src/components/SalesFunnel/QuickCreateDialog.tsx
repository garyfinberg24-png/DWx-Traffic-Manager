/**
 * QuickCreateDialog - Quick-create deal dialog for managers
 * Supports both Service Requests (→ Service Queue) and Product Requests (→ Product Queue).
 * v2.14.0 — Added request type toggle + product cascading dropdowns + client context field
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
import { productRequestService } from '../../services/ProductRequestService';
import { referenceDataService } from '../../services/ReferenceDataService';
import { DW_COLORS } from '../../utils/buttonStyles';
import { DWX_APPS, HYPERPARTS, HYPERCARDS, HYPERAGENTS } from '../../types/Product';
import type { Product } from '../../types/Product';
import type {
  ServiceRequest,
  CreateServiceRequestInput,
  InterestLevel,
  DWService,
} from '../../types/ServiceRequest';
import type { ProductRequest, CreateProductRequestInput, ProductRequestType } from '../../types/ProductRequest';
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
    maxHeight: '65vh',
    overflowY: 'auto',
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
  slotsGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  slotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  slotLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    width: '42px',
    flexShrink: 0,
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
  requestTypeToggle: {
    display: 'flex',
    gap: '0px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #d1d5db',
  },
  requestTypeButton: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  requestTypeButtonActive: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    backgroundColor: DW_COLORS.primary,
    color: 'white',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    marginTop: '4px',
    marginBottom: '4px',
  },
});

// ============================================================================
// Constants
// ============================================================================

type RequestMode = 'service' | 'product';

interface ProductCategoryOption {
  value: string;
  label: string;
  productType: 'App' | 'Web Part' | 'Adaptive Card' | 'Agent';
  products: Product[];
}

const PRODUCT_CATEGORIES: ProductCategoryOption[] = [
  { value: 'app', label: 'Apps', productType: 'App', products: DWX_APPS },
  { value: 'webpart', label: 'HyperParts', productType: 'Web Part', products: HYPERPARTS },
  { value: 'adaptive-card', label: 'Cards', productType: 'Adaptive Card', products: HYPERCARDS },
  { value: 'agent', label: 'Agents', productType: 'Agent', products: HYPERAGENTS },
];

// ============================================================================
// Types
// ============================================================================

interface QuickCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onDealCreated: (r: ServiceRequest) => void;
  onProductCreated?: (r: ProductRequest) => void;
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
  onProductCreated,
  preSelectedService,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  // Data loading state
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<DWService[]>([]);
  const [loading, setLoading] = useState(true);

  // Request mode toggle
  const [requestMode, setRequestMode] = useState<RequestMode>('service');

  // Shared form state
  const [clientName, setClientName] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');
  const [clientContext, setClientContext] = useState('');
  const [proposedSlot1, setProposedSlot1] = useState('');
  const [proposedSlot2, setProposedSlot2] = useState('');
  const [proposedSlot3, setProposedSlot3] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Service-specific state
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [interestLevel, setInterestLevel] = useState<InterestLevel>('Warm');

  // Product-specific state
  const [productCategory, setProductCategory] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productRequestType, setProductRequestType] = useState<ProductRequestType>('Demo');

  // Validation state
  const [touched, setTouched] = useState<{ client: boolean; service: boolean; category: boolean; product: boolean }>({
    client: false,
    service: false,
    category: false,
    product: false,
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
      setRequestMode(preSelectedService ? 'service' : 'service');
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
      setClientContext('');
      setProposedSlot1('');
      setProposedSlot2('');
      setProposedSlot3('');
      setProductCategory('');
      setSelectedProductId('');
      setProductRequestType('Demo');
      setSubmitting(false);
      setTouched({ client: false, service: !!preSelectedService, category: false, product: false });
    }
  }, [open, preSelectedService]);

  // Reset type-specific fields when switching mode
  const handleModeChange = (mode: RequestMode) => {
    setRequestMode(mode);
    // Reset service-specific
    if (mode === 'product') {
      setSelectedServiceId('');
      setInterestLevel('Warm');
    }
    // Reset product-specific
    if (mode === 'service') {
      setProductCategory('');
      setSelectedProductId('');
      setProductRequestType('Demo');
    }
    setTouched((t) => ({ ...t, service: false, category: false, product: false }));
  };

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

  // Get filtered products based on selected category
  const selectedCategoryObj = useMemo(
    () => PRODUCT_CATEGORIES.find((c) => c.value === productCategory) ?? null,
    [productCategory]
  );

  const filteredProducts = useMemo(
    () => selectedCategoryObj?.products ?? [],
    [selectedCategoryObj]
  );

  const selectedProduct = useMemo(
    () => filteredProducts.find((p) => p.id === selectedProductId) ?? null,
    [filteredProducts, selectedProductId]
  );

  // Validation
  const clientError = touched.client && !clientName.trim() ? 'Client name is required' : '';

  const serviceError =
    requestMode === 'service' && touched.service && !selectedServiceId
      ? 'Service is required'
      : '';

  const categoryError =
    requestMode === 'product' && touched.category && !productCategory
      ? 'Category is required'
      : '';

  const productError =
    requestMode === 'product' && touched.product && !selectedProductId
      ? 'Product is required'
      : '';

  const isValid =
    clientName.trim() !== '' &&
    (requestMode === 'service'
      ? selectedServiceId !== ''
      : productCategory !== '' && selectedProductId !== '');

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

  // Handle client name typed (freeform)
  const handleClientInput = (e: React.FormEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value;
    setClientName(value);
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

  // Handle product category selection
  const handleCategorySelect = (
    _ev: unknown,
    data: { optionValue?: string; optionText?: string }
  ) => {
    setProductCategory(data.optionValue || '');
    setSelectedProductId(''); // Reset product when category changes
  };

  // Handle product selection
  const handleProductSelect = (
    _ev: unknown,
    data: { optionValue?: string; optionText?: string }
  ) => {
    setSelectedProductId(data.optionValue || '');
  };

  // Handle submit
  const handleSubmit = async () => {
    setTouched({
      client: true,
      service: requestMode === 'service',
      category: requestMode === 'product',
      product: requestMode === 'product',
    });

    if (!isValid || !user) return;

    setSubmitting(true);
    try {
      if (requestMode === 'service') {
        // --- Service Request ---
        if (!selectedService) return;

        const parsedDealValue = dealValue ? parseFloat(dealValue) : undefined;
        const probability = INTEREST_PROBABILITY[interestLevel];

        const combinedComments = [clientContext.trim(), notes.trim()]
          .filter(Boolean)
          .join('\n\n---\n\n');

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
          Comments: combinedComments || undefined,
          ProposedSlot1: proposedSlot1 || '',
          ProposedSlot2: proposedSlot2 || undefined,
          ProposedSlot3: proposedSlot3 || undefined,
        };

        const result = await serviceRequestService.createRequest(
          input,
          user.email,
          user.displayName,
          false
        );

        if (result.success && result.request) {
          showSuccess('Deal Created', `${clientName} - ${selectedService.Title} added to Service Queue.`);
          onDealCreated(result.request);
          onClose();
        } else {
          showError('Create Failed', result.error || 'Failed to create deal.');
        }
      } else {
        // --- Product Request ---
        if (!selectedProduct || !selectedCategoryObj) return;

        const parsedValue = dealValue ? parseFloat(dealValue) : undefined;

        const combinedComments = [clientContext.trim(), notes.trim()]
          .filter(Boolean)
          .join('\n\n---\n\n');

        const input: CreateProductRequestInput = {
          ProductId: selectedProduct.id,
          ProductName: selectedProduct.name,
          ProductType: selectedCategoryObj.productType,
          ProductCategory: selectedProduct.category,
          RequestType: productRequestType,
          ClientName: clientName.trim(),
          ContactName: contactName.trim() || clientName.trim(),
          ContactEmail: contactEmail.trim() || '',
          ContactPhone: contactPhone.trim() || undefined,
          Industry: industry || undefined,
          EstimatedValue: parsedValue,
          Comments: combinedComments || undefined,
          ProposedSlot1: proposedSlot1 || '',
          ProposedSlot2: proposedSlot2 || undefined,
          ProposedSlot3: proposedSlot3 || undefined,
        };

        const result = await productRequestService.createRequest(
          input,
          user.email,
          user.displayName
        );

        if (result.success && result.request) {
          showSuccess('Product Request Created', `${clientName} - ${selectedProduct.name} added to Product Queue.`);
          onProductCreated?.(result.request);
          onClose();
        } else {
          showError('Create Failed', result.error || 'Failed to create product request.');
        }
      }
    } catch (err) {
      console.error('Quick create error:', err);
      showError('Error', 'An unexpected error occurred.');
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
            <Text className={styles.headerTitle}>Quick Create</Text>
            <Text className={styles.headerSubtitle}>
              {preSelectedService
                ? preSelectedService.Title
                : requestMode === 'service'
                  ? 'New Service Request'
                  : 'New Product Request'}
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
            {/* Request Type Toggle — hidden when pre-selected service */}
            {!preSelectedService && (
              <div className={styles.requestTypeToggle}>
                <button
                  className={requestMode === 'service' ? styles.requestTypeButtonActive : styles.requestTypeButton}
                  onClick={() => handleModeChange('service')}
                  type="button"
                >
                  Service Request
                </button>
                <button
                  className={requestMode === 'product' ? styles.requestTypeButtonActive : styles.requestTypeButton}
                  onClick={() => handleModeChange('product')}
                  type="button"
                >
                  Product Request
                </button>
              </div>
            )}

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

            {/* ======================== SERVICE MODE ======================== */}
            {requestMode === 'service' && (
              <>
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
              </>
            )}

            {/* ======================== PRODUCT MODE ======================== */}
            {requestMode === 'product' && (
              <>
                {/* Product Category */}
                <div className={styles.field}>
                  <Label className={styles.label}>
                    Product Category<span className={styles.required}>*</span>
                  </Label>
                  <Dropdown
                    placeholder="Select category..."
                    selectedOptions={productCategory ? [productCategory] : []}
                    value={selectedCategoryObj?.label || ''}
                    onOptionSelect={handleCategorySelect}
                    onBlur={() => setTouched((t) => ({ ...t, category: true }))}
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <Option key={cat.value} value={cat.value} text={cat.label}>
                        {cat.label} ({cat.products.length})
                      </Option>
                    ))}
                  </Dropdown>
                  {categoryError && <span className={styles.errorText}>{categoryError}</span>}
                </div>

                {/* Product */}
                <div className={styles.field}>
                  <Label className={styles.label}>
                    Product<span className={styles.required}>*</span>
                  </Label>
                  <Dropdown
                    placeholder={productCategory ? 'Select a product...' : 'Select a category first...'}
                    disabled={!productCategory}
                    selectedOptions={selectedProductId ? [selectedProductId] : []}
                    value={selectedProduct?.name || ''}
                    onOptionSelect={handleProductSelect}
                    onBlur={() => setTouched((t) => ({ ...t, product: true }))}
                  >
                    {filteredProducts.map((p) => (
                      <Option key={p.id} value={p.id} text={p.name}>
                        {p.name}
                      </Option>
                    ))}
                  </Dropdown>
                  {productError && <span className={styles.errorText}>{productError}</span>}
                </div>

                {/* Request Type */}
                <div className={styles.field}>
                  <Label className={styles.label}>Request Type</Label>
                  <RadioGroup
                    layout="horizontal"
                    value={productRequestType}
                    onChange={(_ev, data) => setProductRequestType(data.value as ProductRequestType)}
                  >
                    <Radio value="Demo" label="Demo" />
                    <Radio value="Trial Deployment" label="Trial" />
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ======================== SHARED FIELDS ======================== */}

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

            {/* Proposed Time Slots */}
            <div className={styles.field}>
              <Label className={styles.label}>Proposed Time Slots</Label>
              <div className={styles.slotsGrid}>
                <div className={styles.slotRow}>
                  <span className={styles.slotLabel}>Slot 1</span>
                  <Input
                    type="datetime-local"
                    value={proposedSlot1}
                    onChange={(_ev, data) => setProposedSlot1(data.value)}
                    style={{ flex: 1 }}
                  />
                </div>
                <div className={styles.slotRow}>
                  <span className={styles.slotLabel}>Slot 2</span>
                  <Input
                    type="datetime-local"
                    value={proposedSlot2}
                    onChange={(_ev, data) => setProposedSlot2(data.value)}
                    style={{ flex: 1 }}
                  />
                </div>
                <div className={styles.slotRow}>
                  <span className={styles.slotLabel}>Slot 3</span>
                  <Input
                    type="datetime-local"
                    value={proposedSlot3}
                    onChange={(_ev, data) => setProposedSlot3(data.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Client Context */}
            <div className={styles.field}>
              <Label className={styles.label}>Client Context</Label>
              <Textarea
                rows={3}
                placeholder="Paste any client context from the mail trail..."
                value={clientContext}
                onChange={(_ev, data) => setClientContext(data.value)}
              />
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
            {submitting
              ? 'Creating...'
              : requestMode === 'service'
                ? 'Add to Service Queue'
                : 'Add to Product Queue'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default QuickCreateDialog;
