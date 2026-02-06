import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Label,
  Dropdown,
  Option,
  Switch,
  Textarea,
  makeStyles,
  tokens,
  Field,
  Badge,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  Dismiss12Regular,
  Add24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  DWService,
  DWServiceInput,
  ServiceCategory,
  ServiceComplexity,
  ServiceDuration,
  PricingModel,
  SpecialistRole,
} from '../../types/ServiceRequest';

const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Power Platform',
  'SPFx Development',
  'SharePoint Migration',
  'M365 Assessment',
  'Copilot Agents',
  'MS Viva',
  'Training',
  'Proposal',
  'Tender',
  'Ad-Hoc Support',
  'SLA',
  'Strategic Advisory',
];

const SERVICE_DURATIONS: ServiceDuration[] = [
  '30min', '1hr', '2hr', 'Half-day', 'Full-day', 'Multi-day',
];

const SERVICE_COMPLEXITIES: ServiceComplexity[] = [
  'Low', 'Medium', 'High', 'Enterprise',
];

const PRICING_MODELS: PricingModel[] = [
  'Fixed', 'Hourly', 'Project-based', 'TBD',
];

const SPECIALIST_ROLES: SpecialistRole[] = [
  'Solution Architect', 'Technical Specialist', 'Consultant',
];

const useStyles = makeStyles({
  surface: {
    maxWidth: '700px',
    width: '95vw',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
  tabContent: {
    paddingTop: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    maxHeight: '55vh',
    overflowY: 'auto',
  },
  phaseRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr auto',
    gap: tokens.spacingHorizontalS,
    alignItems: 'start',
  },
  rolesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  removeBtn: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      opacity: 0.7,
    },
  },
  switchField: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} 0`,
  },
  hint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

interface ServiceFormData {
  Title: string;
  ShortDescription: string;
  Description: string;
  Category: string;
  TypicalDuration: string;
  ComplexityLevel: string;
  PricingModel: string;
  BasePrice: number | undefined;
  IconName: string;
  SortOrder: number;
  IsActive: boolean;
  Prerequisites: string;
  WhatsIncludedText: string;
  KeyBenefitsText: string;
  IdealForText: string;
  RequiredRoles: string[];
  RelatedCategories: string[];
  EngagementPhases: { name: string; description: string }[];
}

const schema = yup.object().shape({
  Title: yup.string().required('Service title is required').min(3, 'Title must be at least 3 characters'),
  ShortDescription: yup.string().required('Short description is required').max(150, 'Max 150 characters'),
  Description: yup.string().required('Full description is required'),
  Category: yup.string().required('Category is required'),
  TypicalDuration: yup.string().required('Duration is required'),
  ComplexityLevel: yup.string().required('Complexity is required'),
  PricingModel: yup.string().required('Pricing model is required'),
  BasePrice: yup.number().optional().nullable().min(0, 'Price must be positive').transform((value) => (isNaN(value) ? undefined : value)),
  IconName: yup.string().optional(),
  SortOrder: yup.number().required('Sort order is required').min(0).integer(),
  IsActive: yup.boolean().required(),
  Prerequisites: yup.string().optional(),
  WhatsIncludedText: yup.string().optional(),
  KeyBenefitsText: yup.string().optional(),
  IdealForText: yup.string().optional(),
  RequiredRoles: yup.array().of(yup.string()).optional(),
  RelatedCategories: yup.array().of(yup.string()).optional(),
  EngagementPhases: yup.array().of(
    yup.object({ name: yup.string().required(), description: yup.string().required() })
  ).optional(),
});

interface ServiceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: DWServiceInput) => Promise<void>;
  service?: DWService | null;
  isLoading?: boolean;
}

type FormTab = 'basic' | 'content' | 'phases' | 'relations';

export const ServiceForm: React.FC<ServiceFormProps> = ({
  open,
  onClose,
  onSubmit,
  service,
  isLoading = false,
}) => {
  const styles = useStyles();
  const isEditMode = !!service;
  const [activeTab, setActiveTab] = useState<FormTab>('basic');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ServiceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      Title: '',
      ShortDescription: '',
      Description: '',
      Category: 'Power Platform',
      TypicalDuration: '1hr',
      ComplexityLevel: 'Medium',
      PricingModel: 'TBD',
      BasePrice: undefined,
      IconName: '',
      SortOrder: 0,
      IsActive: true,
      Prerequisites: '',
      WhatsIncludedText: '',
      KeyBenefitsText: '',
      IdealForText: '',
      RequiredRoles: [],
      RelatedCategories: [],
      EngagementPhases: [{ name: '', description: '' }],
    },
  });

  const { fields: phaseFields, append: appendPhase, remove: removePhase } = useFieldArray({
    control,
    name: 'EngagementPhases',
  });

  const selectedRoles = watch('RequiredRoles') || [];
  const selectedCategories = watch('RelatedCategories') || [];

  useEffect(() => {
    if (service) {
      reset({
        Title: service.Title,
        ShortDescription: service.ShortDescription,
        Description: service.Description,
        Category: service.Category,
        TypicalDuration: service.TypicalDuration,
        ComplexityLevel: service.ComplexityLevel,
        PricingModel: service.PricingModel,
        BasePrice: service.BasePrice,
        IconName: service.IconName || '',
        SortOrder: service.SortOrder,
        IsActive: service.IsActive,
        Prerequisites: service.Prerequisites || '',
        WhatsIncludedText: service.WhatsIncluded?.join('\n') || '',
        KeyBenefitsText: service.KeyBenefits?.join('\n') || '',
        IdealForText: service.IdealFor?.join('\n') || '',
        RequiredRoles: service.RequiredRoles?.map(r => r as string) || [],
        RelatedCategories: service.RelatedCategories?.map(c => c as string) || [],
        EngagementPhases: service.EngagementPhases?.length
          ? service.EngagementPhases
          : [{ name: '', description: '' }],
      });
    } else {
      reset({
        Title: '',
        ShortDescription: '',
        Description: '',
        Category: 'Power Platform',
        TypicalDuration: '1hr',
        ComplexityLevel: 'Medium',
        PricingModel: 'TBD',
        BasePrice: undefined,
        IconName: '',
        SortOrder: 0,
        IsActive: true,
        Prerequisites: '',
        WhatsIncludedText: '',
        KeyBenefitsText: '',
        IdealForText: '',
        RequiredRoles: [],
        RelatedCategories: [],
        EngagementPhases: [{ name: '', description: '' }],
      });
      setActiveTab('basic');
    }
  }, [service, reset]);

  const handleFormSubmit = async (data: ServiceFormData) => {
    const splitLines = (text: string): string[] =>
      text.split('\n').map(s => s.trim()).filter(Boolean);

    const input: DWServiceInput = {
      Title: data.Title,
      ShortDescription: data.ShortDescription,
      Description: data.Description,
      Category: data.Category as ServiceCategory,
      TypicalDuration: data.TypicalDuration as ServiceDuration,
      ComplexityLevel: data.ComplexityLevel as ServiceComplexity,
      PricingModel: data.PricingModel as PricingModel,
      BasePrice: data.BasePrice || undefined,
      IconName: data.IconName || undefined,
      SortOrder: data.SortOrder,
      IsActive: data.IsActive,
      Prerequisites: data.Prerequisites || undefined,
      RequiredRoles: data.RequiredRoles as SpecialistRole[],
      WhatsIncluded: splitLines(data.WhatsIncludedText || ''),
      KeyBenefits: splitLines(data.KeyBenefitsText || ''),
      IdealFor: splitLines(data.IdealForText || ''),
      RelatedCategories: data.RelatedCategories as ServiceCategory[],
      EngagementPhases: (data.EngagementPhases || []).filter(p => p.name.trim()),
    };
    await onSubmit(input);
    onClose();
  };

  const handleRoleSelect = (role: string) => {
    if (!selectedRoles.includes(role)) {
      setValue('RequiredRoles', [...selectedRoles, role], { shouldValidate: true });
    }
  };

  const handleRoleRemove = (role: string) => {
    setValue('RequiredRoles', selectedRoles.filter(r => r !== role), { shouldValidate: true });
  };

  const handleCategorySelect = (cat: string) => {
    if (!selectedCategories.includes(cat)) {
      setValue('RelatedCategories', [...selectedCategories, cat], { shouldValidate: true });
    }
  };

  const handleCategoryRemove = (cat: string) => {
    setValue('RelatedCategories', selectedCategories.filter(c => c !== cat), { shouldValidate: true });
  };

  const availableRoles = SPECIALIST_ROLES.filter(r => !selectedRoles.includes(r));
  const availableCategories = SERVICE_CATEGORIES.filter(c => !selectedCategories.includes(c));

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as FormTab);
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={onClose} />
            }
          >
            {isEditMode ? 'Edit Service' : 'Add Service'}
          </DialogTitle>

          <DialogContent>
            <TabList selectedValue={activeTab} onTabSelect={handleTabSelect} size="small">
              <Tab value="basic">Basic Info</Tab>
              <Tab value="content">Content</Tab>
              <Tab value="phases">Engagement</Tab>
              <Tab value="relations">Relations</Tab>
            </TabList>

            <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
              {/* Tab 1: Basic Info */}
              {activeTab === 'basic' && (
                <div className={styles.tabContent}>
                  <Field
                    label="Service Title"
                    required
                    validationMessage={errors.Title?.message}
                    validationState={errors.Title ? 'error' : 'none'}
                  >
                    <Controller
                      name="Title"
                      control={control}
                      render={({ field }) => <Input {...field} placeholder="e.g., Power Platform Development" />}
                    />
                  </Field>

                  <Field
                    label="Short Description"
                    required
                    validationMessage={errors.ShortDescription?.message}
                    validationState={errors.ShortDescription ? 'error' : 'none'}
                    hint="One-line summary for cards (max 150 chars)"
                  >
                    <Controller
                      name="ShortDescription"
                      control={control}
                      render={({ field }) => <Input {...field} placeholder="Brief service description" />}
                    />
                  </Field>

                  <Field
                    label="Full Description"
                    required
                    validationMessage={errors.Description?.message}
                    validationState={errors.Description ? 'error' : 'none'}
                  >
                    <Controller
                      name="Description"
                      control={control}
                      render={({ field }) => (
                        <Textarea {...field} placeholder="Detailed service description..." rows={4} resize="vertical" />
                      )}
                    />
                  </Field>

                  <div className={styles.row}>
                    <Field label="Category" required validationMessage={errors.Category?.message} validationState={errors.Category ? 'error' : 'none'}>
                      <Controller
                        name="Category"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            value={field.value}
                            selectedOptions={[field.value]}
                            onOptionSelect={(_, data) => field.onChange(data.optionValue)}
                          >
                            {SERVICE_CATEGORIES.map(c => <Option key={c} value={c}>{c}</Option>)}
                          </Dropdown>
                        )}
                      />
                    </Field>

                    <Field label="Duration" required>
                      <Controller
                        name="TypicalDuration"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            value={field.value}
                            selectedOptions={[field.value]}
                            onOptionSelect={(_, data) => field.onChange(data.optionValue)}
                          >
                            {SERVICE_DURATIONS.map(d => <Option key={d} value={d}>{d}</Option>)}
                          </Dropdown>
                        )}
                      />
                    </Field>
                  </div>

                  <div className={styles.row}>
                    <Field label="Complexity" required>
                      <Controller
                        name="ComplexityLevel"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            value={field.value}
                            selectedOptions={[field.value]}
                            onOptionSelect={(_, data) => field.onChange(data.optionValue)}
                          >
                            {SERVICE_COMPLEXITIES.map(c => <Option key={c} value={c}>{c}</Option>)}
                          </Dropdown>
                        )}
                      />
                    </Field>

                    <Field label="Pricing Model" required>
                      <Controller
                        name="PricingModel"
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            value={field.value}
                            selectedOptions={[field.value]}
                            onOptionSelect={(_, data) => field.onChange(data.optionValue)}
                          >
                            {PRICING_MODELS.map(p => <Option key={p} value={p}>{p}</Option>)}
                          </Dropdown>
                        )}
                      />
                    </Field>
                  </div>

                  <div className={styles.row}>
                    <Field label="Base Price (ZAR)" validationMessage={errors.BasePrice?.message}>
                      <Controller
                        name="BasePrice"
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            value={field.value?.toString() || ''}
                            onChange={(_, data) => field.onChange(data.value ? Number(data.value) : undefined)}
                            placeholder="e.g., 25000"
                          />
                        )}
                      />
                    </Field>

                    <Field label="Sort Order" required>
                      <Controller
                        name="SortOrder"
                        control={control}
                        render={({ field }) => (
                          <Input
                            type="number"
                            value={field.value?.toString() || '0'}
                            onChange={(_, data) => field.onChange(Number(data.value) || 0)}
                          />
                        )}
                      />
                    </Field>
                  </div>

                  <Field label="Icon Name" hint="Fluent UI icon name: LightningBolt, Code, CloudArrowUp, ShieldCheckmark, Bot, PeopleTeam, Notebook">
                    <Controller
                      name="IconName"
                      control={control}
                      render={({ field }) => <Input {...field} placeholder="e.g., LightningBolt" />}
                    />
                  </Field>

                  <Field label="Prerequisites">
                    <Controller
                      name="Prerequisites"
                      control={control}
                      render={({ field }) => (
                        <Textarea {...field} placeholder="e.g., M365 license with Power Platform access" rows={2} resize="vertical" />
                      )}
                    />
                  </Field>

                  <div className={styles.switchField}>
                    <Label>Active</Label>
                    <Controller
                      name="IsActive"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onChange={(_, data) => field.onChange(data.checked)} />
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Content */}
              {activeTab === 'content' && (
                <div className={styles.tabContent}>
                  <Field label="What's Included" hint="One deliverable per line">
                    <Controller
                      name="WhatsIncludedText"
                      control={control}
                      render={({ field }) => (
                        <Textarea {...field} placeholder={"Requirements analysis and solution design\nCustom development\nUser acceptance testing\nKnowledge transfer"} rows={6} resize="vertical" />
                      )}
                    />
                  </Field>

                  <Field label="Key Benefits" hint="One benefit per line">
                    <Controller
                      name="KeyBenefitsText"
                      control={control}
                      render={({ field }) => (
                        <Textarea {...field} placeholder={"Rapid prototyping\nSeamless M365 integration\nReduced development costs"} rows={6} resize="vertical" />
                      )}
                    />
                  </Field>

                  <Field label="Ideal For" hint="One target use case per line">
                    <Controller
                      name="IdealForText"
                      control={control}
                      render={({ field }) => (
                        <Textarea {...field} placeholder={"Business process automation\nSelf-service reporting\nApproval workflows"} rows={6} resize="vertical" />
                      )}
                    />
                  </Field>
                </div>
              )}

              {/* Tab 3: Engagement Phases */}
              {activeTab === 'phases' && (
                <div className={styles.tabContent}>
                  <Label style={{ marginBottom: tokens.spacingVerticalXS }}>
                    Define the engagement timeline phases
                  </Label>
                  {phaseFields.map((field, index) => (
                    <div key={field.id} className={styles.phaseRow}>
                      <Controller
                        name={`EngagementPhases.${index}.name`}
                        control={control}
                        render={({ field: f }) => (
                          <Input {...f} placeholder="Phase name" size="small" />
                        )}
                      />
                      <Controller
                        name={`EngagementPhases.${index}.description`}
                        control={control}
                        render={({ field: f }) => (
                          <Input {...f} placeholder="Phase description" size="small" />
                        )}
                      />
                      <Button
                        appearance="subtle"
                        icon={<Delete24Regular />}
                        size="small"
                        onClick={() => removePhase(index)}
                        disabled={phaseFields.length <= 1}
                      />
                    </div>
                  ))}
                  <Button
                    appearance="outline"
                    icon={<Add24Regular />}
                    size="small"
                    onClick={() => appendPhase({ name: '', description: '' })}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Add Phase
                  </Button>
                </div>
              )}

              {/* Tab 4: Relations */}
              {activeTab === 'relations' && (
                <div className={styles.tabContent}>
                  <Field label="Required Specialist Roles" hint="Select roles needed for this service">
                    <Dropdown
                      placeholder={selectedRoles.length > 0 ? 'Add another role...' : 'Select roles'}
                      onOptionSelect={(_, data) => handleRoleSelect(data.optionValue as string)}
                      selectedOptions={[]}
                      disabled={availableRoles.length === 0}
                    >
                      {availableRoles.map(role => (
                        <Option key={role} value={role}>{role}</Option>
                      ))}
                    </Dropdown>
                    {selectedRoles.length > 0 && (
                      <div className={styles.rolesContainer}>
                        {selectedRoles.map(role => (
                          <Badge key={role} appearance="tint" color="brand" className={styles.roleBadge}>
                            {role}
                            <span className={styles.removeBtn} onClick={() => handleRoleRemove(role)} title="Remove">
                              <Dismiss12Regular />
                            </span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Field>

                  <Field label="Related Service Categories" hint="Cross-sell/upsell categories">
                    <Dropdown
                      placeholder={selectedCategories.length > 0 ? 'Add another category...' : 'Select categories'}
                      onOptionSelect={(_, data) => handleCategorySelect(data.optionValue as string)}
                      selectedOptions={[]}
                      disabled={availableCategories.length === 0}
                    >
                      {availableCategories.map(cat => (
                        <Option key={cat} value={cat}>{cat}</Option>
                      ))}
                    </Dropdown>
                    {selectedCategories.length > 0 && (
                      <div className={styles.rolesContainer}>
                        {selectedCategories.map(cat => (
                          <Badge key={cat} appearance="tint" color="informative" className={styles.roleBadge}>
                            {cat}
                            <span className={styles.removeBtn} onClick={() => handleCategoryRemove(cat)} title="Remove">
                              <Dismiss12Regular />
                            </span>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </Field>
                </div>
              )}
            </form>
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
