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
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Button,
  Input,
  Dropdown,
  Combobox,
  Option,
  Textarea,
  Field,
  makeStyles,
  shorthands,
  Text,
  Spinner,
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
  DocumentRegular,
  PersonRegular,
  CalendarRegular,
  MoneyRegular,
  SendRegular,
  ClipboardTaskListLtr24Regular,
  ChevronDownRegular,
  ChevronRightRegular,
  NotepadRegular,
  BuildingRegular,
  PersonCallRegular,
  ScalesRegular,
  ChatBubblesQuestionRegular,
  ClockRegular,
  NoteRegular,
  EyeRegular,
  BriefcaseRegular,
  CalendarLtrRegular,
  SaveRegular,
} from '@fluentui/react-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  DWService,
  CreateServiceRequestInput,
  InterestLevel,
  ClientIndustry,
  CompanySize,
  ServiceCategory,
} from '../../types/ServiceRequest';
import { serviceCatalogService } from '../../services/ServiceCatalogService';
import { serviceRequestService } from '../../services/ServiceRequestService';
import { referenceDataService } from '../../services/ReferenceDataService';
import { Client } from '../../types/ReferenceData';
import { ServiceCard } from '../ServiceCatalog/ServiceCard';
import { ServiceRequirementsStep } from './ServiceRequirementsStep';
import { DW_COLORS } from '../../utils/buttonStyles';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';
import { getServiceRequirements, validateRequirements } from '../../types/ServiceRequirements';
import { addHours, format, setHours, setMinutes } from 'date-fns';

const useStyles = makeStyles({
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 64px 24px',
  },
  heroWrapper: {
    position: 'relative',
    marginBottom: '20px',
  },
  heroBanner: {
    ...shorthands.borderRadius('0', '0', '16px', '16px'),
    ...shorthands.padding('0'),
    position: 'relative',
    ...shorthands.overflow('hidden'),
    background: 'linear-gradient(135deg, #1e6b7b 0%, #2a8d6e 100%)',
  },
  heroExpanded: {
    maxHeight: '200px',
    transitionProperty: 'max-height',
    transitionDuration: '350ms',
    transitionTimingFunction: 'ease',
  },
  heroCollapsed: {
    maxHeight: '56px',
    transitionProperty: 'max-height',
    transitionDuration: '350ms',
    transitionTimingFunction: 'ease',
  },
  heroDecoration: {
    position: 'absolute',
    top: '-80px',
    right: '-40px',
    width: '300px',
    height: '300px',
    ...shorthands.borderRadius('50%'),
    background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  heroContentSR: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.gap('32px'),
    ...shorthands.padding('24px', '32px'),
  },
  heroLeftSR: {
    flex: '1',
    minWidth: '0',
  },
  heroTitleSR: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'white',
    marginBottom: '4px',
  },
  heroTitleAccentSR: {
    color: '#86efac',
  },
  heroSubtitleSR: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
  },
  heroSteps: {
    display: 'flex',
    ...shorthands.gap('8px'),
    alignItems: 'center',
    flexShrink: 0,
  },
  heroStepDot: {
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    transitionProperty: 'all',
    transitionDuration: '200ms',
  },
  heroStepActive: {
    backgroundColor: 'white',
    color: '#1e6b7b',
  },
  heroStepCompleted: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    color: 'white',
  },
  heroStepPending: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.4)',
    ...shorthands.border('1px', 'solid', 'rgba(255,255,255,0.15)'),
  },
  heroStepLine: {
    width: '20px',
    height: '2px',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroStepLineCompleted: {
    width: '20px',
    height: '2px',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  collapsedStrip: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('16px'),
    ...shorthands.padding('0', '32px'),
    height: '56px',
    position: 'relative',
    zIndex: 2,
  },
  collapsedTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'white',
  },
  collapsedBadge: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.15)',
    ...shorthands.padding('3px', '10px'),
    ...shorthands.borderRadius('10px'),
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
    backgroundColor: DW_COLORS.teal,
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
    padding: '16px 24px 24px',
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
    marginBottom: '8px',
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
    backgroundColor: DW_COLORS.teal,
    ':hover': {
      backgroundColor: '#165a68',
    },
  },
  // Step card styles (blue header card design)
  stepCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  stepHeader: {
    background: 'linear-gradient(135deg, #1a5a8a 0%, #2873a8 100%)',
    color: 'white',
    padding: '20px 24px',
  },
  stepHeaderTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  stepHeaderSubtitle: {
    fontSize: '13px',
    opacity: '0.9',
  },
  stepBody: {
    padding: '24px',
  },
  stepSection: {
    marginBottom: '24px',
  },
  stepSectionLast: {
    marginBottom: '0',
  },
  stepSectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1a5a8a',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e0e0e0',
  },
  stepDivider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '20px 0',
  },
});

interface ServiceRequestFormData {
  // Service
  serviceId?: number;
  serviceName: string;
  serviceCategory?: ServiceCategory;

  // Request Context
  requestTitle: string;
  requestDetails?: string;

  // Client
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  industry?: ClientIndustry;
  companySize?: CompanySize;

  // Service-Specific Requirements (dynamic based on service category)
  serviceRequirements: Record<string, unknown>;

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
  { id: 3, label: 'Discovery', icon: ClipboardTaskListLtr24Regular },
  { id: 4, label: 'Deal Info', icon: MoneyRegular },
  { id: 5, label: 'Schedule', icon: CalendarRegular },
  { id: 6, label: 'Review', icon: CheckmarkRegular },
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

// AccordionSection MUST be defined outside the form component to prevent
// React from re-creating it on every render (which causes input focus loss).
const AccordionSection: React.FC<{
  sectionKey: string;
  icon: React.ReactNode;
  title: string;
  description?: string;
  isLast?: boolean;
  isOpen: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}> = ({ sectionKey, icon, title, description, isLast, isOpen, onToggle, children }) => {
  const styles = useAccordionStyles();
  return (
    <div className={`${styles.accordion}${isLast ? ` ${styles.accordionLast}` : ''}`}>
      <div
        className={isOpen ? styles.accordionHeaderOpen : styles.accordionHeader}
        onClick={() => onToggle(sectionKey)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle(sectionKey)}
      >
        <div className={isOpen ? styles.accordionIcon : styles.accordionIconClosed}>
          {icon}
        </div>
        <div className={styles.accordionInfo}>
          <div className={styles.accordionTitle}>{title}</div>
          {description && <div className={styles.accordionDescription}>{description}</div>}
        </div>
        <div className={styles.accordionChevron}>
          {isOpen ? <ChevronDownRegular /> : <ChevronRightRegular />}
        </div>
      </div>
      {isOpen && <div className={styles.accordionBody}>{children}</div>}
    </div>
  );
};

// Separate makeStyles call for AccordionSection (must be at module level)
const useAccordionStyles = makeStyles({
  accordion: {
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'hidden',
    marginBottom: '12px',
    transition: 'box-shadow 0.2s ease',
    ':hover': {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    },
  },
  accordionLast: {
    marginBottom: '0',
  },
  accordionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    backgroundColor: '#fafafa',
    border: 'none',
    borderLeft: '4px solid transparent',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0f0f0',
      borderLeftColor: '#c0c0c0',
    },
  },
  accordionHeaderOpen: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    background: 'linear-gradient(135deg, #d0d5dc 0%, #dbe0e5 100%)',
    color: '#1e293b',
    borderLeft: '4px solid #1a5a8a',
  },
  accordionIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  accordionIconClosed: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#e8f4f8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#1a5a8a',
  },
  accordionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  accordionTitle: {
    fontSize: '15px',
    fontWeight: '600',
  },
  accordionDescription: {
    fontSize: '12px',
    opacity: 0.8,
  },
  accordionChevron: {
    flexShrink: 0,
    transition: 'transform 0.2s ease',
  },
  accordionBody: {
    padding: '20px 24px',
    borderTop: '1px solid #e0e0e0',
  },
});

interface ServiceRequestFormProps {
  preSelectedService?: DWService;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  preSelectedService: propPreSelectedService,
  onSuccess,
  onCancel,
}) => {
  const styles = useStyles();
  const { isCollapsed, toggle } = useHeroCollapse('new-request');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  // Get pre-selected service from props OR from navigation state
  const preSelectedService = propPreSelectedService || (location.state?.preSelectedService as DWService | undefined);

  const [currentStep, setCurrentStep] = useState(preSelectedService ? 2 : 1);
  const [services, setServices] = useState<DWService[]>([]);
  const [selectedService, setSelectedService] = useState<DWService | null>(preSelectedService || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  // Client auto-populate
  const [clients, setClients] = useState<Client[]>([]);
  const [clientAutoFilled, setClientAutoFilled] = useState(false);

  // Service requirements state (separate from react-hook-form for flexibility)
  const [serviceRequirements, setServiceRequirements] = useState<Record<string, unknown>>({});

  // Accordion open state per section (key = "step-sectionIndex")
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'client-0': true,  // Request Context open by default
    'deal-0': true,    // Deal Qualification open by default
    'schedule-0': true, // Meeting Options open by default
    'review-0': true,  // All review sections open by default
    'review-1': true,
    'review-2': true,
  });

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
      serviceCategory: preSelectedService?.Category,
      requestTitle: '',
      requestDetails: '',
      serviceRequirements: {},
      interestLevel: 'Warm',
      dealProbability: 50,
    },
  });

  // Load services and clients on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, clientsData] = await Promise.all([
          serviceCatalogService.getServices(true),
          referenceDataService.getClients().catch(() => [] as Client[]),
        ]);
        setServices(servicesData);
        setClients(clientsData);
      } catch (err) {
        console.error('Error loading services:', err);
        setError('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- Draft Save/Restore ---
  const DRAFT_KEY = 'dwx_service_request_draft';
  const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
  const DATE_FIELDS = ['proposedDate1', 'proposedDate2', 'proposedDate3', 'expectedCloseDate'] as const;

  // Check for existing draft on mount (or auto-restore from My Drafts navigation)
  useEffect(() => {
    if (!preSelectedService) {
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
      // Convert Date objects to ISO strings for serialization
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
        selectedService,
        serviceRequirements,
        openSections,
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

      // Restore wizard state
      setCurrentStep(draft.currentStep || 1);
      if (draft.selectedService) setSelectedService(draft.selectedService);
      if (draft.serviceRequirements) setServiceRequirements(draft.serviceRequirements);
      if (draft.openSections) setOpenSections(draft.openSections);

      // Restore form values with Date re-hydration
      if (draft.formData) {
        const formData = { ...draft.formData };
        DATE_FIELDS.forEach(field => {
          if (typeof formData[field] === 'string' && formData[field]) {
            formData[field] = new Date(formData[field]);
          }
        });
        Object.entries(formData).forEach(([key, value]) => {
          setValue(key as keyof ServiceRequestFormData, value as never);
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

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleServiceSelect = (service: DWService) => {
    setSelectedService(service);
    setValue('serviceId', service.Id);
    setValue('serviceName', service.Title);
    setValue('serviceCategory', service.Category);
    // Reset service requirements when service changes
    setServiceRequirements({});
  };

  const handleClientSelect = (clientName: string) => {
    const client = clients.find(c => c.Title === clientName);
    if (client) {
      setValue('clientName', client.Title);
      if (client.PrimaryContactName) setValue('contactName', client.PrimaryContactName);
      if (client.PrimaryContactEmail) setValue('contactEmail', client.PrimaryContactEmail);
      if (client.Phone) setValue('contactPhone', client.Phone);
      if (client.Industry) setValue('industry', client.Industry);
      setClientAutoFilled(true);
    }
  };

  const handleServiceRequirementChange = (questionId: string, value: unknown) => {
    setServiceRequirements(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 6) {
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

  const formatServiceRequirements = (
    category: ServiceCategory | undefined,
    requirements: Record<string, unknown>,
    additionalNotes?: string
  ): string => {
    if (!category) return additionalNotes || '';

    const config = getServiceRequirements(category);
    const lines: string[] = [];

    // Add header
    lines.push(`=== ${config.title} ===\n`);

    // Format each section
    config.sections.forEach(section => {
      const sectionAnswers = section.questions
        .filter(q => requirements[q.id] !== undefined && requirements[q.id] !== '')
        .map(q => {
          const answer = requirements[q.id];
          let formattedAnswer: string;

          if (Array.isArray(answer)) {
            // For multiselect, find the labels
            const labels = answer.map(v => {
              const option = q.options?.find(o => o.value === v);
              return option?.label || v;
            });
            formattedAnswer = labels.join(', ');
          } else if (q.options) {
            // For single select, find the label
            const option = q.options.find(o => o.value === answer);
            formattedAnswer = option?.label || String(answer);
          } else {
            formattedAnswer = String(answer);
          }

          return `• ${q.question}\n  ${formattedAnswer}`;
        });

      if (sectionAnswers.length > 0) {
        lines.push(`\n${section.title}:`);
        lines.push(sectionAnswers.join('\n'));
      }
    });

    // Add additional notes if provided
    if (additionalNotes) {
      lines.push(`\n\nAdditional Notes:\n${additionalNotes}`);
    }

    return lines.join('\n');
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
        // Combine general requirements with service-specific requirements
        Requirements: formatServiceRequirements(selectedService.Category, serviceRequirements, data.requirements),
        ServiceHistory: data.serviceHistory,
        Comments: data.comments,
        ProposedSlot1: combineDateTime(data.proposedDate1, data.proposedTime1) || new Date().toISOString(),
        ProposedSlot2: combineDateTime(data.proposedDate2, data.proposedTime2),
        ProposedSlot3: combineDateTime(data.proposedDate3, data.proposedTime3),
      };

      // Validate proposed slots are not in the past
      const now = new Date();
      const proposedSlots = [input.ProposedSlot1, input.ProposedSlot2, input.ProposedSlot3].filter(Boolean);
      const hasPastSlot = proposedSlots.some(slot => new Date(slot!) < now);
      if (hasPastSlot) {
        showToast('Proposed time slots cannot be in the past', 'error');
        return;
      }

      const result = await serviceRequestService.createRequest(
        input,
        user.email,
        user.displayName,
        false // isExternal - will be determined by service
      );

      if (result.success) {
        localStorage.removeItem(DRAFT_KEY);
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
        return !!(watchedValues.requestTitle && watchedValues.clientName && watchedValues.contactName && watchedValues.contactEmail);
      case 3:
        // Validate service-specific requirements
        if (selectedService?.Category) {
          const validation = validateRequirements(selectedService.Category, serviceRequirements);
          return validation.valid;
        }
        return true;
      case 4:
        return true; // Deal info is optional
      case 5:
        return !!(watchedValues.proposedDate1 && watchedValues.proposedTime1);
      case 6:
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
        return renderServiceRequirementsStep();
      case 4:
        return renderDealInfoStep();
      case 5:
        return renderScheduleStep();
      case 6:
        return renderPreviewStep();
      default:
        return null;
    }
  };

  const renderServiceStep = () => (
    <div>
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
    <div className={styles.stepCard}>
      <div className={styles.stepHeader}>
        <div className={styles.stepHeaderTitle}>Client Information</div>
        <div className={styles.stepHeaderSubtitle}>Enter the client details for this service request</div>
      </div>
      <div className={styles.stepBody}>
        <AccordionSection
          sectionKey="client-0"
          icon={<NotepadRegular style={{ width: 18, height: 18 }} />}
          title="Request Context"
          description="Title and details for this service request"
          isOpen={openSections['client-0'] ?? false}
          onToggle={toggleSection}
        >
          <div className={styles.form}>
            <Controller
              name="requestTitle"
              control={control}
              rules={{ required: 'Request title is required' }}
              render={({ field }) => (
                <Field
                  label="Request Title"
                  required
                  validationMessage={errors.requestTitle?.message}
                >
                  <Input {...field} placeholder="Brief title for this request (e.g., 'Power Platform Assessment for Contoso')" />
                </Field>
              )}
            />

            <Controller
              name="requestDetails"
              control={control}
              render={({ field }) => (
                <Field label="Request Details">
                  <Textarea
                    {...field}
                    placeholder="Describe the context and specific needs for this service request..."
                    resize="vertical"
                    style={{ minHeight: '100px' }}
                  />
                </Field>
              )}
            />
          </div>
        </AccordionSection>

        <AccordionSection
          sectionKey="client-1"
          icon={<BuildingRegular style={{ width: 18, height: 18 }} />}
          title="Company Details"
          description="Client organization and industry information"
          isOpen={openSections['client-1'] ?? false}
          onToggle={toggleSection}
        >
          <div className={styles.form}>
            {clientAutoFilled && (
              <MessageBar intent="success" style={{ marginBottom: '4px' }}>
                <MessageBarBody>
                  Client details auto-filled from your client list. You can edit any field below.
                </MessageBarBody>
              </MessageBar>
            )}
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
                    hint={clients.length > 0 ? 'Type to search existing clients or enter a new name' : undefined}
                  >
                    <Combobox
                      freeform
                      placeholder="Search or enter company name"
                      value={field.value || ''}
                      selectedOptions={field.value ? [field.value] : []}
                      onInput={(e) => {
                        field.onChange((e.target as HTMLInputElement).value);
                        setClientAutoFilled(false);
                      }}
                      onOptionSelect={(_, data) => {
                        if (data.optionText) {
                          field.onChange(data.optionText);
                          handleClientSelect(data.optionText);
                        }
                      }}
                    >
                      {clients
                        .filter(c => !field.value || c.Title.toLowerCase().includes((field.value || '').toLowerCase()))
                        .map((client) => (
                          <Option key={client.Id} value={client.Title} text={client.Title}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <span>{client.Title}</span>
                              {client.Industry && (
                                <Badge appearance="outline" size="small" color="informative">{client.Industry}</Badge>
                              )}
                            </div>
                          </Option>
                        ))}
                    </Combobox>
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
                      value={field.value || ''}
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

            <Controller
              name="companySize"
              control={control}
              render={({ field }) => (
                <Field label="Company Size">
                  <Dropdown
                    placeholder="Select company size"
                    value={field.value ? (field.value === 'SMB' ? 'SMB (<50 employees)' : field.value === 'Medium' ? 'Medium (50-250)' : field.value === 'Large' ? 'Large (250-1000)' : 'Enterprise (1000+)') : ''}
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
        </AccordionSection>

        <AccordionSection
          sectionKey="client-2"
          icon={<PersonCallRegular style={{ width: 18, height: 18 }} />}
          title="Primary Contact"
          description="Main point of contact at the client organization"
          isLast
          isOpen={openSections['client-2'] ?? false}
          onToggle={toggleSection}
        >
          <div className={styles.form}>
            <div className={styles.row}>
              <Controller
                name="contactName"
                control={control}
                rules={{ required: 'Contact name is required' }}
                render={({ field }) => (
                  <Field
                    label="Contact Name"
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
          </div>
        </AccordionSection>
      </div>
    </div>
  );

  const renderServiceRequirementsStep = () => {
    if (!selectedService?.Category) {
      return (
        <div className={styles.form}>
          <Text>Please select a service first.</Text>
        </div>
      );
    }

    const requirementsConfig = getServiceRequirements(selectedService.Category);

    return (
      <ServiceRequirementsStep
        config={requirementsConfig}
        values={serviceRequirements}
        onChange={handleServiceRequirementChange}
      />
    );
  };

  const renderDealInfoStep = () => (
    <div className={styles.stepCard}>
      <div className={styles.stepHeader}>
        <div className={styles.stepHeaderTitle}>Deal Information</div>
        <div className={styles.stepHeaderSubtitle}>Provide details about the potential deal and engagement history</div>
      </div>
      <div className={styles.stepBody}>
        <AccordionSection
          sectionKey="deal-0"
          icon={<ScalesRegular style={{ width: 18, height: 18 }} />}
          title="Deal Qualification"
          description="Interest level, deal value, probability, and timeline"
          isOpen={openSections['deal-0'] ?? false}
          onToggle={toggleSection}
        >
          <div className={styles.form}>
            <div className={styles.row}>
              <Controller
                name="interestLevel"
                control={control}
                render={({ field }) => (
                  <Field label="Interest Level" required>
                    <Dropdown
                      value={field.value || 'Warm'}
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
          </div>
        </AccordionSection>

        <AccordionSection
          sectionKey="deal-1"
          icon={<ChatBubblesQuestionRegular style={{ width: 18, height: 18 }} />}
          title="Additional Context"
          description="Requirements summary and previous engagement history"
          isLast
          isOpen={openSections['deal-1'] ?? false}
          onToggle={toggleSection}
        >
          <div className={styles.form}>
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
        </AccordionSection>
      </div>
    </div>
  );

  const renderScheduleStep = () => (
    <div className={styles.stepCard}>
      <div className={styles.stepHeader}>
        <div className={styles.stepHeaderTitle}>Proposed Discovery Meeting Times</div>
        <div className={styles.stepHeaderSubtitle}>Propose up to 3 time slots for the discovery meeting</div>
      </div>
      <div className={styles.stepBody}>
        <AccordionSection
          sectionKey="schedule-0"
          icon={<ClockRegular style={{ width: 18, height: 18 }} />}
          title="Meeting Options"
          description="Propose up to 3 available time slots"
          isOpen={openSections['schedule-0'] ?? false}
          onToggle={toggleSection}
        >
          <div className={styles.form}>
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
                        value={field.value || ''}
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
                        value={field.value || ''}
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
                        value={field.value || ''}
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
        </AccordionSection>

        <AccordionSection
          sectionKey="schedule-1"
          icon={<NoteRegular style={{ width: 18, height: 18 }} />}
          title="Additional Notes"
          description="Special requirements or comments for the meeting"
          isLast
          isOpen={openSections['schedule-1'] ?? false}
          onToggle={toggleSection}
        >
          <Controller
            name="comments"
            control={control}
            render={({ field }) => (
              <Field label="Comments">
                <Textarea
                  {...field}
                  placeholder="Any additional notes or special requirements for the meeting..."
                  resize="vertical"
                />
              </Field>
            )}
          />
        </AccordionSection>
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
      <div className={styles.stepCard}>
        <div className={styles.stepHeader}>
          <div className={styles.stepHeaderTitle}>Review Your Service Request</div>
          <div className={styles.stepHeaderSubtitle}>Please review all details before submitting</div>
        </div>
        <div className={styles.stepBody}>
          <AccordionSection
            sectionKey="review-0"
            icon={<EyeRegular style={{ width: 18, height: 18 }} />}
            title="Request Overview"
            description="Service, client, and contact details"
            isOpen={openSections['review-0'] ?? false}
            onToggle={toggleSection}
          >
            <div className={styles.previewSection}>
              <div className={styles.previewItem}>
                <Text className={styles.previewLabel}>Request Title</Text>
                <Text className={styles.previewValue}>{watchedValues.requestTitle}</Text>
              </div>

              {watchedValues.requestDetails && (
                <div className={styles.previewItem}>
                  <Text className={styles.previewLabel}>Request Details</Text>
                  <Text className={styles.previewValue}>{watchedValues.requestDetails}</Text>
                </div>
              )}

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
            </div>
          </AccordionSection>

          <AccordionSection
            sectionKey="review-1"
            icon={<BriefcaseRegular style={{ width: 18, height: 18 }} />}
            title="Deal Information"
            description="Interest level, value, and requirements"
            isOpen={openSections['review-1'] ?? false}
            onToggle={toggleSection}
          >
            <div className={styles.previewSection}>
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
            </div>
          </AccordionSection>

          <AccordionSection
            sectionKey="review-2"
            icon={<CalendarLtrRegular style={{ width: 18, height: 18 }} />}
            title="Schedule & Ownership"
            description="Proposed meeting times and account manager"
            isLast
            isOpen={openSections['review-2'] ?? false}
            onToggle={toggleSection}
          >
            <div className={styles.previewSection}>
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
          </AccordionSection>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <div className={styles.heroWrapper}>
        <div className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}>
          <div className={styles.heroDecoration} />
          {isCollapsed ? (
            <div className={styles.collapsedStrip}>
              <span className={styles.collapsedTitle}>New Service Request</span>
              <span className={styles.collapsedBadge}>Step {currentStep} of {STEPS.length}</span>
            </div>
          ) : (
            <div className={styles.heroContentSR}>
              <div className={styles.heroLeftSR}>
                <div className={styles.heroTitleSR}>
                  New Service <span className={styles.heroTitleAccentSR}>Request</span>
                </div>
                <div className={styles.heroSubtitleSR}>
                  Submit a request for DWx pre-sales services
                </div>
              </div>
              <div className={styles.heroSteps}>
                {STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    {index > 0 && (
                      <div className={step.id <= currentStep ? styles.heroStepLineCompleted : styles.heroStepLine} />
                    )}
                    <div
                      className={`${styles.heroStepDot} ${
                        step.id === currentStep
                          ? styles.heroStepActive
                          : step.id < currentStep
                          ? styles.heroStepCompleted
                          : styles.heroStepPending
                      }`}
                      title={step.label}
                    >
                      {step.id < currentStep ? '\u2713' : step.id}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
      </div>

      <div className={styles.card}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.cardHeaderIcon}>
            <DocumentRegular style={{ width: '24px', height: '24px' }} />
          </div>
          <div className={styles.cardHeaderContent}>
            <Text className={styles.cardTitle}>
              New Service Request{selectedService ? ` - ${selectedService.Title}` : ''}
            </Text>
            <Text className={styles.cardSubtitle} block>
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
          <ProgressBar value={(currentStep - 1) / 5} />
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

        {/* Service Step Instruction (shown below stepper, above cards) */}
        {currentStep === 1 && (
          <div style={{ padding: '12px 24px 0' }}>
            <Text className={styles.sectionTitle}>Select a Service</Text>
            <Text className={styles.sectionHint}>
              Choose the service you'd like to request a pre-sales consultation for.
            </Text>
          </div>
        )}

        {/* Body */}
        <div className={styles.cardBody}>{renderStepContent()}</div>

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentStep === 1 && (
              <Button appearance="secondary" onClick={onCancel || (() => navigate(-1))}>
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
            {currentStep > 1 && (
              <Button
                appearance="outline"
                icon={<SaveRegular />}
                onClick={saveDraft}
              >
                Save Draft
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep < 6 ? (
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
