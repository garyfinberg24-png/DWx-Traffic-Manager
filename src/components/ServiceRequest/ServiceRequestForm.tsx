/**
 * DWx Traffic Manager - Service Request Form
 * Multi-step wizard for creating new service requests
 *
 * Steps:
 * 1. Select Service - Choose from service catalog
 * 2. Client Information - New or existing client details
 * 3. Requirements & Budget - Deal value, timeline, documents
 * 4. Proposed Time Slots - 3 discovery meeting options
 * 5. Preview & Submit - Review and confirm
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Button,
  Input,
  Dropdown,
  Option,
  Textarea,
  Field,
  makeStyles,
  Text,
  Spinner,
  ProgressBar,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  ArrowLeftRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  DocumentRegular,
  PersonRegular,
  CalendarRegular,
  MoneyRegular,
  SendRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  DWService,
  CreateServiceRequestInput,
  InterestLevel,
  ClientIndustry,
  CompanySize,
} from '../../types/ServiceRequest';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { ServiceCard } from '../ServiceCatalog/ServiceCard';
import { addHours, format, setHours, setMinutes } from 'date-fns';

const useStyles = makeStyles({
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px',
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
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2d8a9c 100%)',
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
    backgroundColor: '#1e6b7b',
    color: 'white',
  },
  progressStepCompleted: {
    backgroundColor: '#107c10',
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
  servicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
  },
  selectedServiceBadge: {
    border: '2px solid #1e6b7b',
    position: 'relative',
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
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '60px',
    flexDirection: 'column',
    gap: '12px',
  },
  primaryButton: {
    backgroundColor: '#1e6b7b',
    ':hover': {
      backgroundColor: '#165a68',
    },
  },
});

interface ServiceRequestFormData {
  // Service
  serviceId?: number;
  serviceName: string;

  // Client
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  industry?: ClientIndustry;
  companySize?: CompanySize;

  // Deal
  interestLevel: InterestLevel;
  dealValue?: number;
  dealProbability?: number;
  expectedCloseDate?: Date;
  budget?: string;
  timeline?: string;
  requirements?: string;
  serviceHistory?: string;
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
  { id: 1, label: 'Service', icon: DocumentRegular },
  { id: 2, label: 'Client', icon: PersonRegular },
  { id: 3, label: 'Requirements', icon: MoneyRegular },
  { id: 4, label: 'Schedule', icon: CalendarRegular },
  { id: 5, label: 'Review', icon: CheckmarkRegular },
];

const INTEREST_LEVELS: InterestLevel[] = ['Hot', 'Warm', 'Cold'];

const INDUSTRIES: ClientIndustry[] = [
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Government',
  'Education',
  'Legal',
  'Non-Profit',
  'Other',
];

const COMPANY_SIZES: CompanySize[] = ['SMB', 'Medium', 'Large', 'Enterprise'];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

interface ServiceRequestFormProps {
  preSelectedService?: DWService;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  preSelectedService,
  onSuccess,
  onCancel,
}) => {
  const styles = useStyles();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(preSelectedService ? 2 : 1);
  const [services, setServices] = useState<DWService[]>([]);
  const [selectedService, setSelectedService] = useState<DWService | null>(preSelectedService || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceRequestFormData>({
    defaultValues: {
      serviceName: preSelectedService?.Title || '',
      serviceId: preSelectedService?.Id,
      interestLevel: 'Warm',
      dealProbability: 50,
    },
  });

  // Load services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await serviceCatalogService.getServices(true);
        setServices(data);
      } catch (err) {
        console.error('Error loading services:', err);
        setError('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const handleServiceSelect = (service: DWService) => {
    setSelectedService(service);
    setValue('serviceId', service.Id);
    setValue('serviceName', service.Title);
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

  const onSubmit = async (data: ServiceRequestFormData) => {
    if (!user || !selectedService) return;

    try {
      setSubmitting(true);
      setError(null);

      const input: CreateServiceRequestInput = {
        ServiceId: data.serviceId,
        ServiceName: data.serviceName,
        ClientName: data.clientName,
        ContactName: data.contactName,
        ContactEmail: data.contactEmail,
        ContactPhone: data.contactPhone,
        Industry: data.industry,
        CompanySize: data.companySize,
        InterestLevel: data.interestLevel,
        DealValue: data.dealValue,
        DealProbability: data.dealProbability,
        ExpectedCloseDate: data.expectedCloseDate?.toISOString(),
        Budget: data.budget,
        Timeline: data.timeline,
        Requirements: data.requirements,
        ServiceHistory: data.serviceHistory,
        Comments: data.comments,
        ProposedSlot1: combineDateTime(data.proposedDate1, data.proposedTime1) || new Date().toISOString(),
        ProposedSlot2: combineDateTime(data.proposedDate2, data.proposedTime2),
        ProposedSlot3: combineDateTime(data.proposedDate3, data.proposedTime3),
      };

      const result = await serviceRequestService.createRequest(
        input,
        user.email,
        user.displayName,
        false // isExternal - will be determined by service
      );

      if (result.success) {
        showToast('Service request created successfully!', 'success');
        onSuccess?.();
      } else {
        throw new Error(result.error || 'Failed to create service request');
      }
    } catch (err) {
      console.error('Error creating service request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create service request');
      showToast('Failed to create service request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const watchedValues = watch();

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return selectedService !== null;
      case 2:
        return !!(watchedValues.clientName && watchedValues.contactName && watchedValues.contactEmail);
      case 3:
        return true; // Optional fields
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

  const formatCurrency = (value?: number): string => {
    if (!value) return 'Not specified';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderServiceStep();
      case 2:
        return renderClientStep();
      case 3:
        return renderRequirementsStep();
      case 4:
        return renderScheduleStep();
      case 5:
        return renderPreviewStep();
      default:
        return null;
    }
  };

  const renderServiceStep = () => (
    <div>
      <Text className={styles.sectionTitle}>Select a Service</Text>
      <Text className={styles.sectionHint}>
        Choose the service you'd like to request a pre-sales consultation for.
      </Text>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner size="medium" />
          <Text>Loading services...</Text>
        </div>
      ) : (
        <div className={styles.servicesGrid}>
          {services.map((service) => (
            <div
              key={service.Id}
              onClick={() => handleServiceSelect(service)}
              style={{
                border: selectedService?.Id === service.Id ? '2px solid #1e6b7b' : '2px solid transparent',
                borderRadius: '14px',
              }}
            >
              <ServiceCard service={service} onClick={handleServiceSelect} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderClientStep = () => (
    <div className={styles.form}>
      <Text className={styles.sectionTitle}>Client Information</Text>
      <Text className={styles.sectionHint}>
        Enter the client details for this service request.
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

      <div className={styles.row}>
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
      </div>
    </div>
  );

  const renderRequirementsStep = () => (
    <div className={styles.form}>
      <Text className={styles.sectionTitle}>Requirements & Deal Information</Text>
      <Text className={styles.sectionHint}>
        Provide details about the client's requirements and the potential deal.
      </Text>

      <div className={styles.row}>
        <Controller
          name="interestLevel"
          control={control}
          render={({ field }) => (
            <Field label="Interest Level" required>
              <Dropdown
                selectedOptions={field.value ? [field.value] : ['Warm']}
                onOptionSelect={(_, data) => field.onChange(data.optionValue)}
              >
                {INTEREST_LEVELS.map((level) => (
                  <Option key={level} value={level}>
                    {level}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          )}
        />

        <Controller
          name="dealValue"
          control={control}
          render={({ field }) => (
            <Field label="Estimated Deal Value (ZAR)">
              <Input
                {...field}
                type="number"
                placeholder="Enter estimated value"
                value={field.value?.toString() || ''}
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </Field>
          )}
        />
      </div>

      <div className={styles.row}>
        <Controller
          name="dealProbability"
          control={control}
          render={({ field }) => (
            <Field label="Win Probability (%)">
              <Input
                {...field}
                type="number"
                min={0}
                max={100}
                placeholder="0-100"
                value={field.value?.toString() || '50'}
                onChange={(e) => field.onChange(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </Field>
          )}
        />

        <Controller
          name="expectedCloseDate"
          control={control}
          render={({ field }) => (
            <Field label="Expected Close Date">
              <DatePicker
                value={field.value}
                onSelectDate={(date) => field.onChange(date)}
                placeholder="Select date"
                minDate={new Date()}
              />
            </Field>
          )}
        />
      </div>

      <div className={styles.row}>
        <Controller
          name="budget"
          control={control}
          render={({ field }) => (
            <Field label="Client's Budget">
              <Input {...field} placeholder="e.g., R100,000 - R150,000" />
            </Field>
          )}
        />

        <Controller
          name="timeline"
          control={control}
          render={({ field }) => (
            <Field label="Client's Timeline">
              <Input {...field} placeholder="e.g., Q2 2026" />
            </Field>
          )}
        />
      </div>

      <Controller
        name="requirements"
        control={control}
        render={({ field }) => (
          <Field label="Requirements Summary">
            <Textarea
              {...field}
              placeholder="Describe the client's key requirements, pain points, and objectives..."
              resize="vertical"
              style={{ minHeight: '100px' }}
            />
          </Field>
        )}
      />

      <Controller
        name="serviceHistory"
        control={control}
        render={({ field }) => (
          <Field label="Previous Engagement History">
            <Textarea
              {...field}
              placeholder="Any previous engagements or interactions with this client..."
              resize="vertical"
            />
          </Field>
        )}
      />
    </div>
  );

  const renderScheduleStep = () => (
    <div className={styles.form}>
      <Text className={styles.sectionTitle}>Proposed Discovery Meeting Times</Text>
      <Text className={styles.sectionHint}>
        Propose up to 3 time slots for the discovery meeting. At least one slot is required.
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

      <Controller
        name="comments"
        control={control}
        render={({ field }) => (
          <Field label="Additional Comments">
            <Textarea
              {...field}
              placeholder="Any additional notes or special requirements for the meeting..."
              resize="vertical"
            />
          </Field>
        )}
      />
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
        <Text className={styles.sectionTitle}>Review Your Service Request</Text>
        <Text className={styles.sectionHint}>
          Please review the details before submitting.
        </Text>

        <div className={styles.previewItem}>
          <Text className={styles.previewLabel}>Service</Text>
          <Text className={styles.previewValue}>{selectedService?.Title}</Text>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Client</Text>
            <Text className={styles.previewValue}>{watchedValues.clientName}</Text>
          </div>

          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Contact</Text>
            <Text className={styles.previewValue}>
              {watchedValues.contactName} ({watchedValues.contactEmail})
            </Text>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Interest Level</Text>
            <Text className={styles.previewValue}>{watchedValues.interestLevel || 'Warm'}</Text>
          </div>

          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Deal Value</Text>
            <Text className={styles.previewValue}>{formatCurrency(watchedValues.dealValue)}</Text>
          </div>

          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Probability</Text>
            <Text className={styles.previewValue}>{watchedValues.dealProbability || 50}%</Text>
          </div>
        </div>

        {watchedValues.requirements && (
          <div className={styles.previewItem}>
            <Text className={styles.previewLabel}>Requirements</Text>
            <Text className={styles.previewValue}>{watchedValues.requirements}</Text>
          </div>
        )}

        <div className={styles.previewItem}>
          <Text className={styles.previewLabel}>Proposed Meeting Times</Text>
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIcon}>
            <DocumentRegular style={{ width: '24px', height: '24px' }} />
          </div>
          <div className={styles.cardHeaderContent}>
            <Text className={styles.cardTitle}>New Service Request</Text>
            <Text className={styles.cardSubtitle}>
              Request a pre-sales consultation for DW services
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

        {/* Body */}
        <div className={styles.cardBody}>{renderStepContent()}</div>

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div>
            {onCancel && currentStep === 1 && (
              <Button appearance="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {currentStep > 1 && (
              <Button
                appearance="secondary"
                icon={<ArrowLeftRegular />}
                onClick={handleBack}
              >
                Back
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep < 5 ? (
              <Button
                className={styles.primaryButton}
                appearance="primary"
                icon={<ArrowRightRegular />}
                iconPosition="after"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                className={styles.primaryButton}
                appearance="primary"
                icon={<SendRegular />}
                iconPosition="after"
                onClick={handleSubmit(onSubmit)}
                disabled={submitting || !canProceed()}
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
