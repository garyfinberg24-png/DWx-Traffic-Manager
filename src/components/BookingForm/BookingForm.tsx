import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Button,
  Input,
  Dropdown,
  Option,
  Textarea,
  Checkbox,
  Field,
  makeStyles,
  tokens,
  Card,
  Text,
  Spinner,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Tooltip,
} from '@fluentui/react-components';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import {
  CalendarAdd24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  Star24Filled,
  Clock24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import { useBookings } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { BookingFormData, BOOKING_PRIORITY_OPTIONS, BookingPriority } from '../../types/Booking';
import { Client } from '../../types/ReferenceData';
import { referenceDataService } from '../../services/ReferenceDataService';
import { accountManagerService } from '../../services/AccountManagerService';
import { BookingPreview } from './BookingPreview';
import { AddClientDialog } from './AddClientDialog';
import { addHours, addDays, format, setHours, setMinutes } from 'date-fns';

// Validation schema - dynamic based on manager role
const createBookingSchema = (isManager: boolean) => yup.object().shape({
  clientName: yup
    .string()
    .required('Client name is required')
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name must be less than 100 characters'),
  bookingType: yup
    .string()
    .oneOf(['Demo', 'Deployment'], 'Please select a booking type')
    .required('Please select a booking type'),
  licenseCount: yup
    .number()
    .required('License count is required')
    .min(1, 'License count must be at least 1')
    .max(999999, 'License count must be less than 1,000,000')
    .typeError('Please enter a valid number'),
  proposedSlot1: yup
    .date()
    .required('First time slot is required')
    .min(
      isManager ? new Date('2025-01-01') : addHours(new Date(), 2),
      isManager ? 'Date must be after January 2025' : 'Time slot must be at least 2 hours in the future'
    )
    .typeError('Please enter a valid date'),
  proposedSlot2: yup
    .date()
    .required('Second time slot is required')
    .min(
      isManager ? new Date('2025-01-01') : addHours(new Date(), 2),
      isManager ? 'Date must be after January 2025' : 'Time slot must be at least 2 hours in the future'
    )
    .typeError('Please enter a valid date'),
  proposedSlot3: yup
    .date()
    .required('Third time slot is required')
    .min(
      isManager ? new Date('2025-01-01') : addHours(new Date(), 2),
      isManager ? 'Date must be after January 2025' : 'Time slot must be at least 2 hours in the future'
    )
    .typeError('Please enter a valid date'),
  comments: yup.string().max(500, 'Comments must be less than 500 characters'),
  isPremiumClient: yup.boolean(),
  dealSize: yup
    .number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .optional()
    .min(0, 'Deal size must be positive')
    .max(999999999, 'Deal size too large'),
  dealValue: yup.string().optional(),
  priority: yup.string().oneOf(['Low', 'Normal', 'High', 'Urgent']).optional(),
});

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
  },
  cardHeaderIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2d8a9c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: 'white',
  },
  cardHeaderContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '4px',
    color: '#242424',
  },
  cardDescription: {
    fontSize: '14px',
    color: '#616161',
  },
  cardBody: {
    padding: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  slotsSection: {
    marginTop: '16px',
    paddingTop: '24px',
    borderTop: '1px solid #e1e1e1',
  },
  slotsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#242424',
  },
  slotsHint: {
    fontSize: '13px',
    color: '#616161',
    marginBottom: '16px',
    display: 'block',
  },
  slotRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '12px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  slotContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  dateTimeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  datePickerWrapper: {
    flex: 1,
  },
  timeButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    padding: '0',
    border: '1px solid #d1d1d1',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    color: '#616161',
    flexShrink: 0,
  },
  clientRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    alignItems: 'end',
    '@media (max-width: 600px)': {
      gridTemplateColumns: '1fr',
    },
  },
  checkboxField: {
    padding: '8px 16px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    height: '32px',
    marginTop: '22px',
    transition: 'all 0.2s ease',
  },
  checkboxContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  checkboxHint: {
    fontSize: '12px',
    color: '#616161',
    marginTop: '4px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #e1e1e1',
  },
  primaryButton: {
    backgroundColor: '#0078d4',
    ':hover': {
      backgroundColor: '#106ebe',
    },
  },
  messageBar: {
    marginBottom: '24px',
    borderRadius: '4px',
  },
  successBar: {
    backgroundColor: '#dff6dd',
    borderLeft: '4px solid #107c10',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '24px',
  },
  errorBar: {
    backgroundColor: '#fde7e9',
    borderLeft: '4px solid #d13438',
    padding: '16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '24px',
  },
  messageTitle: {
    fontWeight: '600',
    fontSize: '14px',
    marginBottom: '4px',
  },
  messageText: {
    fontSize: '13px',
    color: '#616161',
  },
  clientOption: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  premiumStar: {
    color: '#e5a84b',
    fontSize: '14px',
  },
  autoSelectedText: {
    color: '#e5a84b',
    marginLeft: '12px',
  },
});

export const BookingForm: React.FC = () => {
  const styles = useStyles();
  const { user } = useAuth();
  const isManager = user?.isManager ?? false;
  const { createBooking, isLoading } = useBookings();
  const { showSuccess, showError } = useToast();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<BookingFormData | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);

  // Reference data state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);

  // Book on behalf of AM state (manager only)
  interface BehalfOption {
    id: string;
    name: string;
    email: string;
    region?: string;
    source: 'Internal' | 'External';
  }
  const [bookOnBehalf, setBookOnBehalf] = useState(false);
  const [behalfOptions, setBehalfOptions] = useState<BehalfOption[]>([]);
  const [selectedAM, setSelectedAM] = useState<BehalfOption | null>(null);
  const [amSearchQuery, setAmSearchQuery] = useState('');
  const [isLoadingAMs, setIsLoadingAMs] = useState(false);

  const defaultDate = addDays(new Date(), 1);
  defaultDate.setHours(10, 0, 0, 0);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormData>({
    resolver: yupResolver(createBookingSchema(isManager)) as any,
    defaultValues: {
      clientName: '',
      bookingType: 'Demo',
      licenseCount: 0,
      proposedSlot1: defaultDate,
      proposedSlot2: addDays(defaultDate, 1),
      proposedSlot3: addDays(defaultDate, 2),
      comments: '',
      isPremiumClient: false,
      dealSize: undefined,
      dealValue: 'USD',
      priority: 'Normal',
    },
  });

  const selectedClientName = watch('clientName');

  // Determine if the selected client is premium (for visual indicator)
  const isSelectedClientPremium = selectedClientName
    ? clients.find((c) => c.Title === selectedClientName)?.IsPremium ?? false
    : false;

  // Load clients from reference data
  const loadClients = useCallback(async () => {
    // Wait for user to be authenticated before loading clients
    if (!user) {
      return;
    }

    try {
      setIsLoadingClients(true);
      // Get all clients (Active, Prospect, Churned)
      const allClients = await referenceDataService.getClients();
      setClients(allClients);
    } catch (error) {
      console.error('Failed to load clients:', error);
      // Don't block form - allow manual entry if clients fail to load
    } finally {
      setIsLoadingClients(false);
    }
  }, [user]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Handle new client added from dialog
  const handleClientAdded = useCallback(async (clientName: string, isPremium: boolean) => {
    // Refresh the client list and wait for it to complete
    await loadClients();
    // Set the new client as selected (after list is refreshed)
    setValue('clientName', clientName);
    setValue('isPremiumClient', isPremium);
  }, [loadClients, setValue]);

  // Load account managers (internal and external) for "book on behalf" feature
  useEffect(() => {
    if (isManager && bookOnBehalf && behalfOptions.length === 0) {
      const loadBehalfOptions = async () => {
        setIsLoadingAMs(true);
        const options: BehalfOption[] = [];
        const seenEmails = new Set<string>();

        const addOption = (opt: BehalfOption) => {
          const key = opt.email.toLowerCase();
          if (!seenEmails.has(key)) {
            seenEmails.add(key);
            options.push(opt);
          }
        };

        try {
          // Load all account managers (internal and external) from SharePoint list
          const ams = await accountManagerService.getAccountManagers(true);
          for (const am of ams) {
            addOption({
              id: `am-${am.Id}`,
              name: am.Title,
              email: am.Email,
              region: am.Region,
              source: am.Source === 'External' || am.Source === 'Guest' ? 'External' : 'Internal',
            });
          }
        } catch (e) {
          console.error('Failed to load account managers:', e);
        }

        options.sort((a, b) => a.name.localeCompare(b.name));
        setBehalfOptions(options);
        setIsLoadingAMs(false);
      };
      loadBehalfOptions();
    }
  }, [isManager, bookOnBehalf, behalfOptions.length]);

  const filteredAMs = amSearchQuery
    ? behalfOptions.filter(
        (o) =>
          o.name.toLowerCase().includes(amSearchQuery.toLowerCase()) ||
          o.email.toLowerCase().includes(amSearchQuery.toLowerCase())
      )
    : behalfOptions;

  // Auto-set premium status when client is selected
  useEffect(() => {
    if (selectedClientName) {
      const selectedClient = clients.find((c) => c.Title === selectedClientName);
      if (selectedClient) {
        setValue('isPremiumClient', selectedClient.IsPremium);
      }
    }
  }, [selectedClientName, clients, setValue]);

  // Show preview dialog before submitting
  const onPreview = (data: BookingFormData) => {
    setPreviewData(data);
    setShowPreview(true);
  };

  // Actually submit the booking after confirmation
  const onConfirmSubmit = async () => {
    if (!previewData) return;

    try {
      setSubmitError(null);
      setSubmitSuccess(false);
      const onBehalfOf = bookOnBehalf && selectedAM
        ? { name: selectedAM.name, email: selectedAM.email }
        : undefined;
      await createBooking(previewData, onBehalfOf);
      setShowPreview(false);
      setPreviewData(null);
      setSubmitSuccess(true);
      showSuccess('Booking Submitted', 'Your booking request has been submitted successfully.');
      reset();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit booking';
      setSubmitError(message);
      showError('Submission Failed', message);
      setShowPreview(false);
    }
  };

  const onClosePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  // Helper to combine date and time
  const combineDateAndTime = (date: Date | null | undefined, timeString: string): Date => {
    const baseDate = date || new Date();
    if (!timeString) return baseDate;

    const [hours, minutes] = timeString.split(':').map(Number);
    return setMinutes(setHours(baseDate, hours || 10), minutes || 0);
  };

  // Helper to extract time string from date
  const getTimeString = (date: Date | null | undefined): string => {
    if (!date) return '10:00';
    return format(date, 'HH:mm');
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIcon}>
            <CalendarAdd24Regular />
          </div>
          <div className={styles.cardHeaderContent}>
            <Text className={styles.cardTitle}>New Booking Request</Text>
            <Text className={styles.cardDescription}>
              Submit a request for a License Pulse demo or deployment session
            </Text>
          </div>
        </div>

        <div className={styles.cardBody}>
          {isManager && (
            <div style={{
              backgroundColor: '#fff4ce',
              border: '1px solid #f7630c',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#6e4800',
            }}>
              <span style={{ fontSize: '16px' }}>📋</span>
              <span><strong>Manager Mode:</strong> You can select past dates to backfill historical bookings and book on behalf of another Account Manager.</span>
            </div>
          )}

          {submitSuccess && (
            <div className={styles.successBar}>
              <Checkmark24Regular style={{ color: '#107c10', flexShrink: 0 }} />
              <div>
                <div className={styles.messageTitle}>Success!</div>
                <div className={styles.messageText}>
                  Your booking request has been submitted. You will receive a confirmation once it's processed.
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className={styles.errorBar}>
              <Dismiss24Regular style={{ color: '#d13438', flexShrink: 0 }} />
              <div>
                <div className={styles.messageTitle}>Error</div>
                <div className={styles.messageText}>{submitError}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onPreview)} className={styles.form}>
          {/* Account Manager Info */}
          <div className={styles.row}>
            <Field label="Account Manager">
              <Input value={bookOnBehalf && selectedAM ? selectedAM.name : (user?.displayName || '')} disabled />
            </Field>
            <Field label="Email">
              <Input value={bookOnBehalf && selectedAM ? selectedAM.email : (user?.email || '')} disabled />
            </Field>
          </div>

          {/* Book on behalf of AM (manager only) */}
          {isManager && (
            <div style={{ marginBottom: '16px' }}>
              <Checkbox
                checked={bookOnBehalf}
                onChange={(_e, data) => {
                  setBookOnBehalf(!!data.checked);
                  if (!data.checked) {
                    setSelectedAM(null);
                    setAmSearchQuery('');
                  }
                }}
                label="Book on behalf of another Account Manager"
              />
              {bookOnBehalf && (
                <div style={{ marginTop: '8px', maxWidth: '400px' }}>
                  <Field label="Search Account Managers">
                    <Input
                      value={amSearchQuery}
                      onChange={(_e, data) => setAmSearchQuery(data.value)}
                      placeholder={isLoadingAMs ? 'Loading...' : 'Type to search by name or email...'}
                      disabled={isLoadingAMs}
                    />
                  </Field>
                  {amSearchQuery && filteredAMs.length > 0 && !selectedAM && (
                    <div style={{
                      border: '1px solid #d0d0d0',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '4px',
                      backgroundColor: '#fff',
                    }}>
                      {filteredAMs.map((option) => (
                        <div
                          key={option.id}
                          onClick={() => {
                            setSelectedAM(option);
                            setAmSearchQuery(option.name);
                          }}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '13px',
                          }}
                          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>{option.name}</span>
                            <span style={{
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              backgroundColor: option.source === 'External' ? '#e8d4f0' : '#d4e8f0',
                              color: option.source === 'External' ? '#7b3f9e' : '#1e6b7b',
                            }}>
                              {option.source}
                            </span>
                          </div>
                          <div style={{ color: '#616161', fontSize: '12px' }}>
                            {option.email}{option.region ? ` · ${option.region}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedAM && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#dff6dd',
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px',
                    }}>
                      <span>
                        Booking as: <strong>{selectedAM.name}</strong> ({selectedAM.email})
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '8px',
                          backgroundColor: selectedAM.source === 'External' ? '#e8d4f0' : '#d4e8f0',
                          color: selectedAM.source === 'External' ? '#7b3f9e' : '#1e6b7b',
                        }}>
                          {selectedAM.source}
                        </span>
                      </span>
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={() => {
                          setSelectedAM(null);
                          setAmSearchQuery('');
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Client Name and Premium Client */}
          <div className={styles.clientRow}>
            <Controller
              name="clientName"
              control={control}
              render={({ field }) => (
                <Field
                  label="Client Name"
                  required
                  validationMessage={errors.clientName?.message}
                  validationState={errors.clientName ? 'error' : 'none'}
                >
                  {isLoadingClients ? (
                    <Input
                      {...field}
                      placeholder="Loading clients..."
                      disabled
                    />
                  ) : (
                    <Dropdown
                      placeholder="Select a client or add new"
                      value={field.value || ''}
                      selectedOptions={field.value ? [field.value] : []}
                      onOptionSelect={(_, data) => {
                        if (data.optionValue === '__add_new_client__') {
                          setShowAddClient(true);
                        } else {
                          field.onChange(data.optionValue || '');
                        }
                      }}
                      disabled={isSubmitting || isLoading}
                    >
                      {clients.map((client) => (
                        <Option key={client.Id} value={client.Title} text={client.Title}>
                          <div className={styles.clientOption}>
                            {client.Title}
                            {client.IsPremium && <Star24Filled className={styles.premiumStar} />}
                          </div>
                        </Option>
                      ))}
                      <Option key="__add_new__" value="__add_new_client__" text="Add New Client">
                        <div className={styles.clientOption} style={{ color: '#1e6b7b', fontWeight: 500 }}>
                          <Add24Regular style={{ marginRight: '4px' }} />
                          Add New Client...
                        </div>
                      </Option>
                    </Dropdown>
                  )}
                </Field>
              )}
            />

            {/* Premium Client - disabled unless client is selected and is premium */}
            <div
              className={styles.checkboxField}
              style={
                isSelectedClientPremium
                  ? {
                      background: 'linear-gradient(135deg, rgba(229, 168, 75, 0.15) 0%, rgba(229, 168, 75, 0.08) 100%)',
                      border: '1px solid rgba(229, 168, 75, 0.4)',
                    }
                  : {
                      background: '#f5f5f5',
                      border: '1px solid #e0e0e0',
                      opacity: selectedClientName ? 1 : 0.6,
                    }
              }
            >
              <Controller
                name="isPremiumClient"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onChange={(_, data) => field.onChange(data.checked)}
                    disabled={isSubmitting || isLoading || !selectedClientName || !isSelectedClientPremium}
                  />
                )}
              />
              <Star24Filled
                style={{
                  fontSize: '14px',
                  color: isSelectedClientPremium ? '#e5a84b' : '#a0a0a0',
                  transition: 'color 0.2s ease',
                }}
              />
              <Text style={{ fontWeight: 500, fontSize: '14px', color: isSelectedClientPremium ? '#242424' : '#a0a0a0' }}>Premium Client</Text>
              <Text style={{ fontSize: '12px', color: isSelectedClientPremium ? '#616161' : '#b0b0b0' }}>
                {!selectedClientName
                  ? '- Select a client first'
                  : isSelectedClientPremium
                    ? '(Auto-detected)'
                    : '- Not a premium client'}
              </Text>
            </div>
          </div>

          {/* Booking Type and License Count */}
          <div className={styles.row}>
            <Controller
              name="bookingType"
              control={control}
              render={({ field }) => (
                <Field
                  label="Booking Type"
                  required
                  validationMessage={errors.bookingType?.message}
                  validationState={errors.bookingType ? 'error' : 'none'}
                >
                  <Dropdown
                    placeholder="Select booking type"
                    value={field.value || ''}
                    selectedOptions={field.value ? [field.value] : []}
                    onOptionSelect={(_, data) => {
                      field.onChange(data.optionValue);
                    }}
                    disabled={isSubmitting || isLoading}
                  >
                    <Option value="Demo" text="License Pulse Demo">License Pulse Demo</Option>
                    <Option value="Deployment" text="License Pulse Deployment">License Pulse Deployment</Option>
                  </Dropdown>
                </Field>
              )}
            />

            <Controller
              name="licenseCount"
              control={control}
              render={({ field }) => (
                <Field
                  label="License Count"
                  required
                  validationMessage={errors.licenseCount?.message}
                  validationState={errors.licenseCount ? 'error' : 'none'}
                >
                  <Input
                    type="number"
                    min={1}
                    max={999999}
                    {...field}
                    value={field.value?.toString() || ''}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    placeholder="Number of M365 licenses"
                    disabled={isSubmitting || isLoading}
                  />
                </Field>
              )}
            />
          </div>

          {/* Deal Size, Deal Value (calculated), and Priority */}
          <div className={styles.row}>
            {/* First column: Deal Size and Deal Value side by side */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <Controller
                name="dealSize"
                control={control}
                render={({ field }) => (
                  <Field
                    label="Deal Size"
                    validationMessage={errors.dealSize?.message}
                    validationState={errors.dealSize ? 'error' : 'none'}
                    hint="Number of licenses or units"
                    style={{ flex: 1 }}
                  >
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      value={field.value?.toString() || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="e.g., 100"
                      disabled={isSubmitting || isLoading}
                    />
                  </Field>
                )}
              />
              <Field
                label="Deal Value (ZAR)"
                hint="Calculated: Deal Size × R90"
                style={{ flex: 1 }}
              >
                <Input
                  value={watch('dealSize') ? `R ${(watch('dealSize')! * 90).toLocaleString()}` : ''}
                  placeholder="Auto-calculated"
                  disabled
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </Field>
            </div>
            {/* Second column: Priority */}
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Field
                  label="Priority"
                  hint="How urgent is this booking?"
                >
                  <Dropdown
                    value={field.value || 'Normal'}
                    selectedOptions={field.value ? [field.value] : ['Normal']}
                    onOptionSelect={(_, data) => field.onChange(data.optionValue as BookingPriority || 'Normal')}
                    disabled={isSubmitting || isLoading}
                  >
                    {BOOKING_PRIORITY_OPTIONS.map((priority) => (
                      <Option key={priority} value={priority}>
                        {priority}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              )}
            />
          </div>

          {/* Time Slots */}
          <div className={styles.slotsSection}>
            <Text className={styles.slotsTitle}>
              Proposed Time Slots
            </Text>
            <Text className={styles.slotsHint}>
              Please provide three preferred time slots. Click the clock icon to set the time.
            </Text>
            <div className={styles.slotRow}>
              <Controller
                name="proposedSlot1"
                control={control}
                render={({ field }) => (
                  <div className={styles.slotContainer}>
                    <Field
                      label="Option 1"
                      required
                      validationMessage={errors.proposedSlot1?.message}
                      validationState={errors.proposedSlot1 ? 'error' : 'none'}
                    >
                      <div className={styles.dateTimeRow}>
                        <div className={styles.datePickerWrapper}>
                          <DatePicker
                            value={field.value || null}
                            onSelectDate={(date) => {
                              const timeStr = getTimeString(field.value);
                              field.onChange(combineDateAndTime(date, timeStr));
                            }}
                            minDate={isManager ? new Date('2025-01-01') : new Date()}
                            placeholder="Select date"
                            disabled={isSubmitting || isLoading}
                          />
                        </div>
                        <Popover withArrow>
                          <PopoverTrigger disableButtonEnhancement>
                            <Tooltip
                              content={`Click to set time (currently ${getTimeString(field.value) || '09:00'})`}
                              relationship="label"
                            >
                              <button
                                type="button"
                                className={styles.timeButton}
                                disabled={isSubmitting || isLoading}
                              >
                                <Clock24Regular style={{ width: '18px', height: '18px' }} />
                              </button>
                            </Tooltip>
                          </PopoverTrigger>
                          <PopoverSurface>
                            <input
                              type="time"
                              value={getTimeString(field.value)}
                              onChange={(e) => {
                                field.onChange(combineDateAndTime(field.value, e.target.value));
                              }}
                              disabled={isSubmitting || isLoading}
                              style={{
                                padding: '8px',
                                border: '1px solid #d1d1d1',
                                borderRadius: '4px',
                                fontSize: '14px',
                              }}
                            />
                          </PopoverSurface>
                        </Popover>
                      </div>
                    </Field>
                  </div>
                )}
              />

              <Controller
                name="proposedSlot2"
                control={control}
                render={({ field }) => (
                  <div className={styles.slotContainer}>
                    <Field
                      label="Option 2"
                      required
                      validationMessage={errors.proposedSlot2?.message}
                      validationState={errors.proposedSlot2 ? 'error' : 'none'}
                    >
                      <div className={styles.dateTimeRow}>
                        <div className={styles.datePickerWrapper}>
                          <DatePicker
                            value={field.value || null}
                            onSelectDate={(date) => {
                              const timeStr = getTimeString(field.value);
                              field.onChange(combineDateAndTime(date, timeStr));
                            }}
                            minDate={isManager ? new Date('2025-01-01') : new Date()}
                            placeholder="Select date"
                            disabled={isSubmitting || isLoading}
                          />
                        </div>
                        <Popover withArrow>
                          <PopoverTrigger disableButtonEnhancement>
                            <Tooltip
                              content={`Click to set time (currently ${getTimeString(field.value) || '09:00'})`}
                              relationship="label"
                            >
                              <button
                                type="button"
                                className={styles.timeButton}
                                disabled={isSubmitting || isLoading}
                              >
                                <Clock24Regular style={{ width: '18px', height: '18px' }} />
                              </button>
                            </Tooltip>
                          </PopoverTrigger>
                          <PopoverSurface>
                            <input
                              type="time"
                              value={getTimeString(field.value)}
                              onChange={(e) => {
                                field.onChange(combineDateAndTime(field.value, e.target.value));
                              }}
                              disabled={isSubmitting || isLoading}
                              style={{
                                padding: '8px',
                                border: '1px solid #d1d1d1',
                                borderRadius: '4px',
                                fontSize: '14px',
                              }}
                            />
                          </PopoverSurface>
                        </Popover>
                      </div>
                    </Field>
                  </div>
                )}
              />

              <Controller
                name="proposedSlot3"
                control={control}
                render={({ field }) => (
                  <div className={styles.slotContainer}>
                    <Field
                      label="Option 3"
                      required
                      validationMessage={errors.proposedSlot3?.message}
                      validationState={errors.proposedSlot3 ? 'error' : 'none'}
                    >
                      <div className={styles.dateTimeRow}>
                        <div className={styles.datePickerWrapper}>
                          <DatePicker
                            value={field.value || null}
                            onSelectDate={(date) => {
                              const timeStr = getTimeString(field.value);
                              field.onChange(combineDateAndTime(date, timeStr));
                            }}
                            minDate={isManager ? new Date('2025-01-01') : new Date()}
                            placeholder="Select date"
                            disabled={isSubmitting || isLoading}
                          />
                        </div>
                        <Popover withArrow>
                          <PopoverTrigger disableButtonEnhancement>
                            <Tooltip
                              content={`Click to set time (currently ${getTimeString(field.value) || '09:00'})`}
                              relationship="label"
                            >
                              <button
                                type="button"
                                className={styles.timeButton}
                                disabled={isSubmitting || isLoading}
                              >
                                <Clock24Regular style={{ width: '18px', height: '18px' }} />
                              </button>
                            </Tooltip>
                          </PopoverTrigger>
                          <PopoverSurface>
                            <input
                              type="time"
                              value={getTimeString(field.value)}
                              onChange={(e) => {
                                field.onChange(combineDateAndTime(field.value, e.target.value));
                              }}
                              disabled={isSubmitting || isLoading}
                              style={{
                                padding: '8px',
                                border: '1px solid #d1d1d1',
                                borderRadius: '4px',
                                fontSize: '14px',
                              }}
                            />
                          </PopoverSurface>
                        </Popover>
                      </div>
                    </Field>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Comments */}
          <Controller
            name="comments"
            control={control}
            render={({ field }) => (
              <Field
                label="Comments"
                validationMessage={errors.comments?.message}
                validationState={errors.comments ? 'error' : 'none'}
                hint="Optional - any additional information about the booking"
              >
                <Textarea
                  {...field}
                  placeholder="Enter any additional notes or requirements..."
                  rows={4}
                  disabled={isSubmitting || isLoading}
                />
              </Field>
            )}
          />

          {/* Actions */}
          <div className={styles.actions}>
            <Button
              appearance="secondary"
              icon={<Dismiss24Regular />}
              onClick={() => reset()}
              disabled={isSubmitting || isLoading}
            >
              Clear Form
            </Button>
            <Button
              type="submit"
              appearance="primary"
              className={styles.primaryButton}
              icon={isSubmitting || isLoading ? <Spinner size="tiny" /> : <Checkmark24Regular />}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? 'Submitting...' : 'Submit Booking Request'}
            </Button>
          </div>
          </form>
        </div>
      </Card>

      {/* Booking Preview Dialog */}
      <BookingPreview
        open={showPreview}
        onClose={onClosePreview}
        onConfirm={onConfirmSubmit}
        data={previewData}
        accountManager={{
          name: user?.displayName || '',
          email: user?.email || '',
        }}
        isSubmitting={isSubmitting || isLoading}
      />

      {/* Add Client Dialog */}
      <AddClientDialog
        open={showAddClient}
        onClose={() => setShowAddClient(false)}
        onClientAdded={handleClientAdded}
        accountManagerEmail={user?.email}
        accountManagerName={user?.displayName}
      />
    </div>
  );
};
