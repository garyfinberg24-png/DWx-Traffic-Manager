/**
 * DWx Traffic Manager - Product Request Form
 * Form for requesting demos or trial deployments of DWx Apps
 * Follows the same pattern as DWx Booking Form for demos/deployments
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Button,
  Input,
  Dropdown,
  Option,
  Textarea,
  Checkbox,
  Field,
  makeStyles,
  Text,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Badge,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ArrowLeftRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  Apps24Regular,
  PersonRegular,
  CalendarRegular,
  SendRegular,
  Star24Filled,
  ClipboardTaskListLtr24Regular,
  SaveRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Product, DWX_APPS, WEBPARTS, ADAPTIVE_CARDS, DWX_AGENTS } from '../../types/Product';
import { ProductRequirementsStep } from '../ServiceRequest/ProductRequirementsStep';
import { getProductRequirements, validateProductRequirements } from '../../types/ProductRequirements';
import { ClientIndustry, CompanySize } from '../../types/ServiceRequest';
import { productRequestService } from '../../services/ProductRequestService';
import { ProductRequestType } from '../../types/ProductRequest';
import { addHours, format, setHours, setMinutes } from 'date-fns';
import { DW_COLORS } from '../../utils/buttonStyles';

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px 64px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1.6px 3.6px 0 rgba(0,0,0,.13), 0 0.3px 0.9px 0 rgba(0,0,0,.11)',
    overflow: 'hidden',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '24px',
    borderBottom: '1px solid #e1e1e1',
    backgroundColor: '#fafafa',
  },
  cardHeaderIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #1a5a8a 0%, #0d3a5c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: '#616161',
  },
  progressContainer: {
    padding: '16px 24px',
    backgroundColor: '#f5f5f5',
    borderBottom: '1px solid #e1e1e1',
  },
  progressSteps: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
  },
  progressStepNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
  },
  progressStepActive: {
    backgroundColor: DW_COLORS.primary,
    color: 'white',
  },
  progressStepCompleted: {
    backgroundColor: DW_COLORS.success,
    color: 'white',
  },
  progressStepPending: {
    backgroundColor: '#e1e1e1',
    color: '#616161',
  },
  progressStepLabel: {
    fontSize: '11px',
    color: '#616161',
    textAlign: 'center',
  },
  cardBody: {
    padding: '24px',
    minHeight: '400px',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#fafafa',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
    marginBottom: '4px',
  },
  sectionHint: {
    fontSize: '13px',
    color: '#616161',
    marginBottom: '16px',
  },
  productCard: {
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid #e0e0e0',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  productCardSelected: {
    border: '2px solid #1a5a8a',
    backgroundColor: '#e8f4fc',
  },
  productIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: 'white',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#242424',
  },
  productSubtitle: {
    fontSize: '13px',
    color: '#616161',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  productOption: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  slotContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  slotLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#424242',
  },
  dateTimeRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-start',
  },
  timeDropdown: {
    minWidth: '100px',
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  previewItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
  },
  previewLabel: {
    fontSize: '12px',
    color: '#616161',
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  previewValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#242424',
  },
  premiumCheckbox: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#fff9e6',
    borderRadius: '8px',
    border: '1px solid #ffc107',
  },
});

type RequestType = 'Demo' | 'Trial';

interface ProductRequestFormData {
  // Product
  productId: string;
  productName: string;
  productType: string;
  requestType: RequestType;

  // Client
  clientName: string;
  industry?: ClientIndustry;
  companySize?: CompanySize;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  isPremiumClient: boolean;

  // Request details
  licenseCount?: number;
  comments?: string;

  // Scheduling
  proposedDate1?: Date;
  proposedTime1?: string;
  proposedDate2?: Date;
  proposedTime2?: string;
  proposedDate3?: Date;
  proposedTime3?: string;
}

const STEPS = [
  { id: 1, label: 'Product', icon: Apps24Regular },
  { id: 2, label: 'Client', icon: PersonRegular },
  { id: 3, label: 'Requirements', icon: ClipboardTaskListLtr24Regular },
  { id: 4, label: 'Schedule', icon: CalendarRegular },
  { id: 5, label: 'Review', icon: CheckmarkRegular },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

const INDUSTRIES: ClientIndustry[] = [
  'Technology',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Government',
  'Education',
  'Legal',
  'Non-Profit',
  'Other',
];

const COMPANY_SIZES: CompanySize[] = ['SMB', 'Medium', 'Large', 'Enterprise'];

// All products combined
const ALL_PRODUCTS: Product[] = [...DWX_APPS, ...WEBPARTS, ...ADAPTIVE_CARDS, ...DWX_AGENTS];

export const ProductRequestForm: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Get pre-selected product from navigation state
  const preSelectedProduct = location.state?.productRequest as Product | undefined;

  const [currentStep, setCurrentStep] = useState(preSelectedProduct ? 2 : 1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(preSelectedProduct || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Product requirements state (separate from react-hook-form for flexibility)
  const [productRequirements, setProductRequirements] = useState<Record<string, unknown>>({});

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductRequestFormData>({
    defaultValues: {
      productId: preSelectedProduct?.id || '',
      productName: preSelectedProduct?.name || '',
      productType: preSelectedProduct?.type || '',
      requestType: 'Demo',
      isPremiumClient: false,
      licenseCount: 10,
    },
  });

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setValue('productId', product.id);
    setValue('productName', product.name);
    setValue('productType', product.type);
    // Reset product requirements when product changes
    setProductRequirements({});
  };

  // --- Draft Save/Restore ---
  const DRAFT_KEY = 'dwx_product_request_draft';
  const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  const DATE_FIELDS = ['proposedDate1', 'proposedDate2', 'proposedDate3'] as const;

  // Check for existing draft on mount (or auto-restore from My Drafts navigation)
  useEffect(() => {
    if (!preSelectedProduct) {
      try {
        const stored = localStorage.getItem(DRAFT_KEY);
        if (stored) {
          const draft = JSON.parse(stored);
          const age = Date.now() - new Date(draft.timestamp).getTime();
          if (age < DRAFT_MAX_AGE && draft.version === 1) {
            // Auto-restore if navigated from My Drafts tab
            if (location.state?.restoreDraft) {
              // Clear navigation state to prevent re-restore on refresh
              navigate(location.pathname, { replace: true, state: {} });
              // Defer restore to next tick so state is set
              setTimeout(() => restoreDraft(), 0);
            } else {
              setShowDraftBanner(true);
            }
          } else {
            localStorage.removeItem(DRAFT_KEY);
          }
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = () => {
    try {
      const formData = watch();
      const serializedFormData: Record<string, unknown> = { ...formData };
      DATE_FIELDS.forEach(field => {
        const val = serializedFormData[field];
        if (val instanceof Date) {
          serializedFormData[field] = val.toISOString();
        }
      });

      const draft = {
        version: 1,
        timestamp: new Date().toISOString(),
        currentStep,
        selectedProduct,
        productRequirements,
        formData: serializedFormData,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      showToast('Draft saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save draft:', err);
      showToast('Failed to save draft', 'error');
    }
  };

  const restoreDraft = () => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (!stored) return;
      const draft = JSON.parse(stored);

      setCurrentStep(draft.currentStep || 1);
      if (draft.selectedProduct) setSelectedProduct(draft.selectedProduct);
      if (draft.productRequirements) setProductRequirements(draft.productRequirements);

      if (draft.formData) {
        const formData = { ...draft.formData };
        DATE_FIELDS.forEach(field => {
          if (typeof formData[field] === 'string' && formData[field]) {
            formData[field] = new Date(formData[field]);
          }
        });
        Object.entries(formData).forEach(([key, value]) => {
          setValue(key as keyof ProductRequestFormData, value as never);
        });
      }

      setShowDraftBanner(false);
      showToast('Draft restored successfully', 'success');
    } catch (err) {
      console.error('Failed to restore draft:', err);
      showToast('Failed to restore draft', 'error');
    }
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftBanner(false);
  };

  const handleProductRequirementChange = (questionId: string, value: unknown) => {
    setProductRequirements(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const combineDateTime = (date?: Date, time?: string): string | undefined => {
    if (!date || !time) return undefined;
    const [hours, minutes] = time.split(':').map(Number);
    const combined = setMinutes(setHours(date, hours), minutes);
    return combined.toISOString();
  };

  const onSubmit = async (data: ProductRequestFormData) => {
    if (!user || !selectedProduct) return;

    try {
      setSubmitting(true);
      setError(null);

      // Map form RequestType to SharePoint ProductRequestType
      const requestType: ProductRequestType = data.requestType === 'Trial' ? 'Trial Deployment' : 'Demo';

      const result = await productRequestService.createRequest(
        {
          ProductId: selectedProduct.id || selectedProduct.name,
          ProductName: selectedProduct.name,
          ProductType: selectedProduct.type as 'App' | 'Web Part' | 'Adaptive Card' | 'Agent',
          ProductCategory: selectedProduct.category || '',
          RequestType: requestType,
          ClientName: data.clientName,
          ContactName: data.contactName,
          ContactEmail: data.contactEmail,
          ContactPhone: data.contactPhone,
          Industry: data.industry,
          CompanySize: data.companySize,
          IsPremiumClient: data.isPremiumClient,
          LicenseCount: data.licenseCount,
          ProposedSlot1: combineDateTime(data.proposedDate1, data.proposedTime1) || new Date().toISOString(),
          ProposedSlot2: combineDateTime(data.proposedDate2, data.proposedTime2),
          ProposedSlot3: combineDateTime(data.proposedDate3, data.proposedTime3),
          ProductRequirements: Object.keys(productRequirements).length > 0
            ? JSON.stringify(productRequirements)
            : undefined,
          Comments: data.comments,
        },
        user.email,
        user.displayName
      );

      if (result.success) {
        localStorage.removeItem(DRAFT_KEY);
        showToast(`${data.requestType} request for ${selectedProduct.name} submitted successfully!`, 'success');
        navigate('/requests');
      } else {
        throw new Error(result.error || 'Failed to create product request');
      }
    } catch (err) {
      console.error('Error creating product request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create request');
      showToast('Failed to create request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const watchedValues = watch();

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return selectedProduct !== null && !!watchedValues.requestType;
      case 2:
        return !!(watchedValues.clientName && watchedValues.contactName && watchedValues.contactEmail);
      case 3:
        // Validate product-specific requirements
        if (selectedProduct?.type) {
          const validation = validateProductRequirements(selectedProduct.type, productRequirements);
          return validation.valid;
        }
        return true;
      case 4:
        return !!(watchedValues.proposedDate1 && watchedValues.proposedTime1);
      case 5:
        return true;
      default:
        return false;
    }
  };

  const getStepStatus = (stepId: number): 'active' | 'completed' | 'pending' => {
    if (stepId === currentStep) return 'active';
    if (stepId < currentStep) return 'completed';
    return 'pending';
  };

  const getGradientStyle = (gradient: string): string => {
    const gradients: Record<string, string> = {
      'corporate-blue': 'linear-gradient(135deg, #1a5a8a 0%, #0d3a5c 100%)',
      'slate': 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      'charcoal': 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
      'ocean-depth': 'linear-gradient(135deg, #0369a1 0%, #075985 100%)',
      'royal-purple': 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      'forest-teal': 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
      'coral': 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      'rose': 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
      'indigo': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      'emerald': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'amber': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'sky': 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      'violet': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'cyan': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      'pink': 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      'blue-gray': 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
      'teal': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
      'lime': 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    };
    return gradients[gradient] || gradients['corporate-blue'];
  };

  const renderProductStep = () => (
    <div className={styles.form}>
      <Text className={styles.sectionTitle}>Select Product & Request Type</Text>
      <Text className={styles.sectionHint}>
        Choose the DWx product you'd like to request a demo or trial deployment for.
      </Text>

      {/* Selected Product Display */}
      {selectedProduct && (
        <div className={`${styles.productCard} ${styles.productCardSelected}`}>
          <div
            className={styles.productIcon}
            style={{ background: getGradientStyle(selectedProduct.gradient) }}
          >
            {selectedProduct.icon}
          </div>
          <div className={styles.productInfo}>
            <Text className={styles.productName}>{selectedProduct.name}</Text>
            <Text className={styles.productSubtitle}>{selectedProduct.subtitle}</Text>
            <Badge appearance="outline" size="small" style={{ marginTop: '4px' }}>
              {selectedProduct.type === 'app' ? 'DWx App' :
               selectedProduct.type === 'webpart' ? 'Web Part' : 'Adaptive Card'}
            </Badge>
          </div>
          <Button
            appearance="subtle"
            size="small"
            onClick={() => {
              setSelectedProduct(null);
              setValue('productId', '');
              setValue('productName', '');
            }}
          >
            Change
          </Button>
        </div>
      )}

      {/* Request Type Selection */}
      <Controller
        name="requestType"
        control={control}
        render={({ field }) => (
          <Field label="Request Type" required>
            <Dropdown
              selectedOptions={field.value ? [field.value] : []}
              onOptionSelect={(_, data) => field.onChange(data.optionValue)}
            >
              <Option value="Demo">Demo - Product demonstration</Option>
              <Option value="Trial">Trial Deployment - Hands-on evaluation</Option>
            </Dropdown>
          </Field>
        )}
      />

      {/* Product Selection Grid (if no product selected) */}
      {!selectedProduct && (
        <>
          <Text weight="semibold" style={{ marginTop: '16px' }}>
            Select a Product
          </Text>
          <div className={styles.productsGrid}>
            {ALL_PRODUCTS.slice(0, 12).map((product) => (
              <div
                key={product.id}
                className={styles.productOption}
                onClick={() => handleProductSelect(product)}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: getGradientStyle(product.gradient),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                  }}
                >
                  {product.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Text weight="semibold" size={300}>{product.name}</Text>
                  <Text size={200} style={{ color: '#616161', display: 'block' }}>
                    {product.subtitle}
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <Button
            appearance="subtle"
            onClick={() => navigate('/products')}
            style={{ marginTop: '8px' }}
          >
            Browse Full Product Catalog →
          </Button>
        </>
      )}
    </div>
  );

  const renderClientStep = () => (
    <div className={styles.form}>
      <Text className={styles.sectionTitle}>Client Information</Text>
      <Text className={styles.sectionHint}>
        Enter the client details for this {watchedValues.requestType?.toLowerCase()} request.
      </Text>

      <div className={styles.row}>
        <Controller
          name="clientName"
          control={control}
          rules={{ required: 'Client name is required' }}
          render={({ field }) => (
            <Field
              label="Client Company Name"
              required
              validationMessage={errors.clientName?.message}
            >
              <Input {...field} placeholder="Enter company name" />
            </Field>
          )}
        />

        <Controller
          name="industry"
          control={control}
          render={({ field }) => (
            <Field label="Industry">
              <Dropdown
                placeholder="Select industry"
                selectedOptions={field.value ? [field.value] : []}
                onOptionSelect={(_, data) => field.onChange(data.optionValue)}
              >
                {INDUSTRIES.map((industry) => (
                  <Option key={industry} value={industry}>
                    {industry}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          )}
        />
      </div>

      <div className={styles.row}>
        <Controller
          name="companySize"
          control={control}
          render={({ field }) => (
            <Field label="Company Size">
              <Dropdown
                placeholder="Select company size"
                selectedOptions={field.value ? [field.value] : []}
                onOptionSelect={(_, data) => field.onChange(data.optionValue)}
              >
                {COMPANY_SIZES.map((size) => (
                  <Option key={size} value={size}>
                    {size === 'SMB'
                      ? 'SMB (<50 employees)'
                      : size === 'Medium'
                      ? 'Medium (50-250)'
                      : size === 'Large'
                      ? 'Large (250-1000)'
                      : 'Enterprise (1000+)'}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          )}
        />

        <Controller
          name="licenseCount"
          control={control}
          render={({ field }) => (
            <Field label="Number of Users/Licenses">
              <Input
                {...field}
                type="number"
                min={1}
                placeholder="Enter user count"
                value={field.value?.toString() || ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </Field>
          )}
        />
      </div>

      <div className={styles.row}>
        <Controller
          name="contactName"
          control={control}
          rules={{ required: 'Contact name is required' }}
          render={({ field }) => (
            <Field
              label="Primary Contact Name"
              required
              validationMessage={errors.contactName?.message}
            >
              <Input {...field} placeholder="Enter contact name" />
            </Field>
          )}
        />

        <Controller
          name="contactEmail"
          control={control}
          rules={{
            required: 'Contact email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' },
          }}
          render={({ field }) => (
            <Field
              label="Contact Email"
              required
              validationMessage={errors.contactEmail?.message}
            >
              <Input {...field} type="email" placeholder="Enter email address" />
            </Field>
          )}
        />
      </div>

      <Controller
        name="contactPhone"
        control={control}
        render={({ field }) => (
          <Field label="Contact Phone">
            <Input {...field} placeholder="Enter phone number" />
          </Field>
        )}
      />

      <Controller
        name="isPremiumClient"
        control={control}
        render={({ field }) => (
          <div className={styles.premiumCheckbox}>
            <Checkbox
              checked={field.value}
              onChange={(_, data) => field.onChange(data.checked)}
              label={
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Star24Filled style={{ color: '#ffc107' }} />
                  Premium Client - Prioritize this request
                </span>
              }
            />
          </div>
        )}
      />

      <Controller
        name="comments"
        control={control}
        render={({ field }) => (
          <Field label="Additional Comments">
            <Textarea
              {...field}
              placeholder="Any specific requirements, questions, or context for this demo..."
              resize="vertical"
              style={{ minHeight: '80px' }}
            />
          </Field>
        )}
      />
    </div>
  );

  const renderScheduleStep = () => (
    <div className={styles.form}>
      <Text className={styles.sectionTitle}>Proposed {watchedValues.requestType} Times</Text>
      <Text className={styles.sectionHint}>
        Propose up to 3 time slots for the {watchedValues.requestType?.toLowerCase()}. At least one slot is required.
      </Text>

      {/* Slot 1 - Required */}
      <div className={styles.slotContainer}>
        <Text className={styles.slotLabel}>Option 1 (Required)</Text>
        <div className={styles.dateTimeRow}>
          <Controller
            name="proposedDate1"
            control={control}
            rules={{ required: 'First time slot is required' }}
            render={({ field }) => (
              <Field validationMessage={errors.proposedDate1?.message} style={{ flex: 1 }}>
                <DatePicker
                  value={field.value}
                  onSelectDate={(date) => field.onChange(date)}
                  placeholder="Select date"
                  minDate={addHours(new Date(), 24)}
                />
              </Field>
            )}
          />
          <Controller
            name="proposedTime1"
            control={control}
            rules={{ required: 'Time is required' }}
            render={({ field }) => (
              <Field validationMessage={errors.proposedTime1?.message}>
                <Dropdown
                  className={styles.timeDropdown}
                  placeholder="Time"
                  selectedOptions={field.value ? [field.value] : []}
                  onOptionSelect={(_, data) => field.onChange(data.optionValue)}
                >
                  {TIME_SLOTS.map((time) => (
                    <Option key={time} value={time}>
                      {time}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            )}
          />
        </div>
      </div>

      {/* Slot 2 - Optional */}
      <div className={styles.slotContainer}>
        <Text className={styles.slotLabel}>Option 2 (Optional)</Text>
        <div className={styles.dateTimeRow}>
          <Controller
            name="proposedDate2"
            control={control}
            render={({ field }) => (
              <Field style={{ flex: 1 }}>
                <DatePicker
                  value={field.value}
                  onSelectDate={(date) => field.onChange(date)}
                  placeholder="Select date"
                  minDate={addHours(new Date(), 24)}
                />
              </Field>
            )}
          />
          <Controller
            name="proposedTime2"
            control={control}
            render={({ field }) => (
              <Field>
                <Dropdown
                  className={styles.timeDropdown}
                  placeholder="Time"
                  selectedOptions={field.value ? [field.value] : []}
                  onOptionSelect={(_, data) => field.onChange(data.optionValue)}
                >
                  {TIME_SLOTS.map((time) => (
                    <Option key={time} value={time}>
                      {time}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            )}
          />
        </div>
      </div>

      {/* Slot 3 - Optional */}
      <div className={styles.slotContainer}>
        <Text className={styles.slotLabel}>Option 3 (Optional)</Text>
        <div className={styles.dateTimeRow}>
          <Controller
            name="proposedDate3"
            control={control}
            render={({ field }) => (
              <Field style={{ flex: 1 }}>
                <DatePicker
                  value={field.value}
                  onSelectDate={(date) => field.onChange(date)}
                  placeholder="Select date"
                  minDate={addHours(new Date(), 24)}
                />
              </Field>
            )}
          />
          <Controller
            name="proposedTime3"
            control={control}
            render={({ field }) => (
              <Field>
                <Dropdown
                  className={styles.timeDropdown}
                  placeholder="Time"
                  selectedOptions={field.value ? [field.value] : []}
                  onOptionSelect={(_, data) => field.onChange(data.optionValue)}
                >
                  {TIME_SLOTS.map((time) => (
                    <Option key={time} value={time}>
                      {time}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const formatDateTime = (date?: Date, time?: string): string => {
      if (!date) return 'Not specified';
      const dateStr = format(date, 'EEEE, MMMM d, yyyy');
      return time ? `${dateStr} at ${time}` : dateStr;
    };

    return (
      <div className={styles.previewSection}>
        <Text className={styles.sectionTitle}>Review Your Request</Text>
        <Text className={styles.sectionHint}>
          Please review the details before submitting.
        </Text>

        <div className={styles.previewItem}>
          <Text className={styles.previewLabel}>Product</Text>
          <Text className={styles.previewValue}>
            {selectedProduct?.name} ({watchedValues.requestType})
          </Text>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Client</Text>
            <Text className={styles.previewValue}>
              {watchedValues.clientName}
              {watchedValues.isPremiumClient && (
                <Star24Filled style={{ color: '#ffc107', marginLeft: '8px' }} />
              )}
            </Text>
          </div>

          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Contact</Text>
            <Text className={styles.previewValue}>
              {watchedValues.contactName} ({watchedValues.contactEmail})
            </Text>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {watchedValues.industry && (
            <div className={styles.previewItem}>
              <Text className={styles.previewLabel}>Industry</Text>
              <Text className={styles.previewValue}>{watchedValues.industry}</Text>
            </div>
          )}

          {watchedValues.companySize && (
            <div className={styles.previewItem}>
              <Text className={styles.previewLabel}>Company Size</Text>
              <Text className={styles.previewValue}>
                {watchedValues.companySize === 'SMB'
                  ? 'SMB (<50 employees)'
                  : watchedValues.companySize === 'Medium'
                  ? 'Medium (50-250)'
                  : watchedValues.companySize === 'Large'
                  ? 'Large (250-1000)'
                  : 'Enterprise (1000+)'}
              </Text>
            </div>
          )}
        </div>

        {watchedValues.licenseCount && (
          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Users/Licenses</Text>
            <Text className={styles.previewValue}>{watchedValues.licenseCount}</Text>
          </div>
        )}

        {watchedValues.comments && (
          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Comments</Text>
            <Text className={styles.previewValue}>{watchedValues.comments}</Text>
          </div>
        )}

        <div className={styles.previewItem}>
          <Text className={styles.previewLabel}>Proposed Times</Text>
          <Text className={styles.previewValue}>
            1. {formatDateTime(watchedValues.proposedDate1, watchedValues.proposedTime1)}
            {watchedValues.proposedDate2 && (
              <>
                <br />
                2. {formatDateTime(watchedValues.proposedDate2, watchedValues.proposedTime2)}
              </>
            )}
            {watchedValues.proposedDate3 && (
              <>
                <br />
                3. {formatDateTime(watchedValues.proposedDate3, watchedValues.proposedTime3)}
              </>
            )}
          </Text>
        </div>

        <div className={styles.previewItem}>
          <Text className={styles.previewLabel}>Account Manager</Text>
          <Text className={styles.previewValue}>{user?.displayName} ({user?.email})</Text>
        </div>
      </div>
    );
  };

  const renderProductRequirementsStep = () => {
    if (!selectedProduct?.type) {
      return (
        <div className={styles.form}>
          <Text>Please select a product first.</Text>
        </div>
      );
    }

    const requirementsConfig = getProductRequirements(selectedProduct.type);

    return (
      <ProductRequirementsStep
        config={requirementsConfig}
        values={productRequirements}
        onChange={handleProductRequirementChange}
        productName={selectedProduct.name}
      />
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderProductStep();
      case 2:
        return renderClientStep();
      case 3:
        return renderProductRequirementsStep();
      case 4:
        return renderScheduleStep();
      case 5:
        return renderPreviewStep();
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIcon}>
            <Apps24Regular style={{ width: '24px', height: '24px' }} />
          </div>
          <div className={styles.cardHeaderContent}>
            <Text className={styles.cardTitle}>
              Request {watchedValues.requestType || 'Demo/Trial'}
            </Text>
            <Text className={styles.cardSubtitle}>
              Request a demo or trial deployment for DWx products
            </Text>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className={styles.progressContainer}>
          <div className={styles.progressSteps}>
            {STEPS.map((step) => {
              const status = getStepStatus(step.id);
              return (
                <div key={step.id} className={styles.progressStep}>
                  <div
                    className={`${styles.progressStepNumber} ${
                      status === 'active'
                        ? styles.progressStepActive
                        : status === 'completed'
                        ? styles.progressStepCompleted
                        : styles.progressStepPending
                    }`}
                  >
                    {status === 'completed' ? (
                      <CheckmarkRegular style={{ width: '14px', height: '14px' }} />
                    ) : (
                      step.id
                    )}
                  </div>
                  <Text className={styles.progressStepLabel}>{step.label}</Text>
                </div>
              );
            })}
          </div>
          <ProgressBar value={(currentStep - 1) / 4} />
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ padding: '16px 24px 0' }}>
            <MessageBar intent="error">
              <MessageBarBody>
                <MessageBarTitle>Error</MessageBarTitle>
                {error}
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {/* Draft Restore Banner */}
        {showDraftBanner && (
          <div style={{ padding: '16px 24px 0' }}>
            <MessageBar intent="info">
              <MessageBarBody>
                <MessageBarTitle>Resume your work</MessageBarTitle>
                You have a saved draft. Continue where you left off?
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Button appearance="primary" size="small" onClick={restoreDraft}>
                    Restore Draft
                  </Button>
                  <Button appearance="outline" size="small" onClick={discardDraft}>
                    Start Fresh
                  </Button>
                </div>
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {/* Body */}
        <div className={styles.cardBody}>{renderStepContent()}</div>

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep === 1 ? (
              <Button appearance="secondary" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            ) : (
              <Button
                appearance="secondary"
                icon={<ArrowLeftRegular />}
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            <Button
              appearance="outline"
              icon={<SaveRegular />}
              onClick={saveDraft}
            >
              Save Draft
            </Button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep < 5 ? (
              <Button
                appearance="primary"
                icon={<ArrowRightRegular />}
                iconPosition="after"
                onClick={handleNext}
                disabled={!canProceed()}
                style={{ backgroundColor: DW_COLORS.primary }}
              >
                Next
              </Button>
            ) : (
              <Button
                appearance="primary"
                icon={<SendRegular />}
                iconPosition="after"
                onClick={handleSubmit(onSubmit)}
                disabled={submitting || !canProceed()}
                style={{ backgroundColor: DW_COLORS.primary }}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRequestForm;
