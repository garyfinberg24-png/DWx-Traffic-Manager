/**
 * DWx Traffic Manager - Delivery Resource Form Dialog
 * Mirrors SpecialistForm pattern with Entra ID picker, react-hook-form + yup validation,
 * and service category specializations multi-select.
 * v2.16.0
 */
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Label,
  Dropdown,
  Option,
  Switch,
  makeStyles,
  tokens,
  Field,
  Badge,
} from '@fluentui/react-components';
import { Dismiss24Regular, Dismiss12Regular, PersonSearch24Regular } from '@fluentui/react-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { type DeliveryResource, type DeliveryRole, DELIVERY_ROLES } from '../../types/DeliveryHandover';
import type { ServiceCategory } from '../../types/ServiceRequest';
import type { CreateDeliveryResourceInput, UpdateDeliveryResourceInput } from '../../services/DeliveryResourceService';
import { EntraUserPicker } from './EntraUserPicker';
import { EntraUser } from '../../types/ReferenceData';

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

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  switchField: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} 0`,
  },
  surface: {
    maxWidth: '600px',
    width: '100%',
  },
  specializationsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalXS,
  },
  specializationBadge: {
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
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
  },
});

interface DeliveryResourceFormData {
  Title: string;
  Email: string;
  Phone?: string;
  Role: string;
  Specializations: string[];
  MaxConcurrentProjects: number;
  HourlyRate?: number;
  AvailableFrom?: string;
  IsActive: boolean;
}

const schema = yup.object().shape({
  Title: yup.string().required('Full name is required').min(3, 'Name must be at least 3 characters'),
  Email: yup.string().required('Email is required').email('Invalid email format'),
  Phone: yup.string().optional(),
  Role: yup.string().required('Role is required'),
  Specializations: yup.array().of(yup.string()).optional(),
  MaxConcurrentProjects: yup.number().required('Max concurrent projects is required').min(1, 'Must be at least 1'),
  HourlyRate: yup.number().optional().nullable().transform((value) => (isNaN(value) ? undefined : value)),
  AvailableFrom: yup.string().optional().nullable().transform((value) => (value === '' ? undefined : value)),
  IsActive: yup.boolean().required(),
});

interface DeliveryResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeliveryResourceInput | UpdateDeliveryResourceInput) => Promise<void>;
  editingResource?: DeliveryResource | null;
  isLoading?: boolean;
}

export const DeliveryResourceForm: React.FC<DeliveryResourceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingResource,
  isLoading = false,
}) => {
  const styles = useStyles();
  const isEditMode = !!editingResource;
  const [showEntraPicker, setShowEntraPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DeliveryResourceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      Title: '',
      Email: '',
      Phone: '',
      Role: '',
      Specializations: [],
      MaxConcurrentProjects: 3,
      HourlyRate: undefined,
      AvailableFrom: '',
      IsActive: true,
    },
  });

  const selectedSpecializations = watch('Specializations') || [];

  useEffect(() => {
    if (editingResource) {
      reset({
        Title: editingResource.Title,
        Email: editingResource.Email,
        Phone: editingResource.Phone || '',
        Role: editingResource.Role,
        Specializations: editingResource.Specializations || [],
        MaxConcurrentProjects: editingResource.MaxConcurrentProjects,
        HourlyRate: editingResource.HourlyRate || undefined,
        AvailableFrom: editingResource.AvailableFrom ? editingResource.AvailableFrom.split('T')[0] : '',
        IsActive: editingResource.IsActive,
      });
    } else {
      reset({
        Title: '',
        Email: '',
        Phone: '',
        Role: '',
        Specializations: [],
        MaxConcurrentProjects: 3,
        HourlyRate: undefined,
        AvailableFrom: '',
        IsActive: true,
      });
    }
  }, [editingResource, reset]);

  const handleFormSubmit = async (data: DeliveryResourceFormData) => {
    if (isEditMode) {
      const updateInput: UpdateDeliveryResourceInput = {
        name: data.Title,
        email: data.Email,
        phone: data.Phone || undefined,
        role: data.Role as DeliveryRole,
        specializations: (data.Specializations || []) as ServiceCategory[],
        maxConcurrentProjects: data.MaxConcurrentProjects,
        hourlyRate: data.HourlyRate || undefined,
        availableFrom: data.AvailableFrom || undefined,
        isActive: data.IsActive,
      };
      await onSubmit(updateInput);
    } else {
      const createInput: CreateDeliveryResourceInput = {
        name: data.Title,
        email: data.Email,
        phone: data.Phone || undefined,
        role: data.Role as DeliveryRole,
        specializations: (data.Specializations || []) as ServiceCategory[],
        maxConcurrentProjects: data.MaxConcurrentProjects,
        hourlyRate: data.HourlyRate || undefined,
        availableFrom: data.AvailableFrom || undefined,
      };
      await onSubmit(createInput);
    }
    onClose();
  };

  const handleSpecializationSelect = (specialization: string) => {
    if (specialization === '__ALL__') {
      setValue('Specializations', [...SERVICE_CATEGORIES], { shouldValidate: true });
      return;
    }
    const current = selectedSpecializations || [];
    if (!current.includes(specialization)) {
      setValue('Specializations', [...current, specialization], { shouldValidate: true });
    }
  };

  const handleSpecializationRemove = (specialization: string) => {
    const current = selectedSpecializations || [];
    setValue('Specializations', current.filter(s => s !== specialization), { shouldValidate: true });
  };

  const availableSpecializations = SERVICE_CATEGORIES.filter(
    cat => !selectedSpecializations.includes(cat)
  );

  const handleEntraUserSelect = (user: EntraUser | null) => {
    if (user) {
      const email = user.mail || user.userPrincipalName || '';
      setValue('Title', user.displayName || '');
      setValue('Email', email);
      setValue('Phone', user.mobilePhone || (user.businessPhones?.[0]) || '');
    }
    setShowEntraPicker(false);
  };

  return (
    <>
    <Dialog open={isOpen && !showEntraPicker} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={onClose} />
            }
          >
            {isEditMode ? 'Edit Delivery Resource' : 'Add Delivery Resource'}
          </DialogTitle>

          <DialogContent>
            <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
              {!isEditMode && (
                <Button
                  appearance="secondary"
                  icon={<PersonSearch24Regular />}
                  onClick={() => setShowEntraPicker(true)}
                  style={{ width: '100%' }}
                >
                  Browse Entra ID Directory
                </Button>
              )}

              <Field
                label="Full Name"
                required
                validationMessage={errors.Title?.message}
                validationState={errors.Title ? 'error' : 'none'}
              >
                <Controller
                  name="Title"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter full name" />
                  )}
                />
              </Field>

              <Field
                label="Email"
                required
                validationMessage={errors.Email?.message}
                validationState={errors.Email ? 'error' : 'none'}
              >
                <Controller
                  name="Email"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} type="email" placeholder="Enter email address" />
                  )}
                />
              </Field>

              <Field label="Phone" validationMessage={errors.Phone?.message}>
                <Controller
                  name="Phone"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="+27 XX XXX XXXX" />
                  )}
                />
              </Field>

              <Field
                label="Role"
                required
                validationMessage={errors.Role?.message}
                validationState={errors.Role ? 'error' : 'none'}
              >
                <Controller
                  name="Role"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      value={field.value}
                      selectedOptions={field.value ? [field.value] : []}
                      onOptionSelect={(_, data) => field.onChange(data.optionValue)}
                      placeholder="Select delivery role"
                    >
                      {DELIVERY_ROLES.map((role) => (
                        <Option key={role} value={role}>
                          {role}
                        </Option>
                      ))}
                    </Dropdown>
                  )}
                />
              </Field>

              <Field
                label="Specializations"
                validationMessage={errors.Specializations?.message}
                validationState={errors.Specializations ? 'error' : 'none'}
                hint="Select service categories this resource can deliver"
              >
                <Dropdown
                  placeholder={selectedSpecializations.length > 0 ? 'Add another specialization...' : 'Select specializations'}
                  onOptionSelect={(_, data) => handleSpecializationSelect(data.optionValue as string)}
                  selectedOptions={[]}
                  disabled={availableSpecializations.length === 0}
                >
                  {availableSpecializations.length > 1 && (
                    <Option key="__ALL__" value="__ALL__" text={`All (${SERVICE_CATEGORIES.length} categories)`}>
                      All ({SERVICE_CATEGORIES.length} categories)
                    </Option>
                  )}
                  {availableSpecializations.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Dropdown>
                {selectedSpecializations.length > 0 && (
                  <div className={styles.specializationsContainer}>
                    {selectedSpecializations.map((spec) => (
                      <Badge
                        key={spec}
                        appearance="tint"
                        color="brand"
                        className={styles.specializationBadge}
                      >
                        {spec}
                        <span
                          className={styles.removeBtn}
                          onClick={() => handleSpecializationRemove(spec)}
                          title="Remove specialization"
                        >
                          <Dismiss12Regular />
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>

              <div className={styles.row}>
                <Field
                  label="Max Concurrent Projects"
                  required
                  validationMessage={errors.MaxConcurrentProjects?.message}
                  validationState={errors.MaxConcurrentProjects ? 'error' : 'none'}
                >
                  <Controller
                    name="MaxConcurrentProjects"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        value={field.value?.toString() || '3'}
                        onChange={(_, data) => field.onChange(Number(data.value) || 1)}
                        placeholder="e.g., 3"
                        min={1}
                      />
                    )}
                  />
                </Field>

                <Field
                  label="Hourly Rate (ZAR)"
                  validationMessage={errors.HourlyRate?.message}
                  validationState={errors.HourlyRate ? 'error' : 'none'}
                >
                  <Controller
                    name="HourlyRate"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ''}
                        onChange={(_, data) => {
                          const v = parseInt(data.value);
                          field.onChange(isNaN(v) ? undefined : v);
                        }}
                        placeholder="e.g., 850"
                        min={0}
                      />
                    )}
                  />
                </Field>
              </div>

              <Field
                label="Available From"
                validationMessage={errors.AvailableFrom?.message}
              >
                <Controller
                  name="AvailableFrom"
                  control={control}
                  render={({ field }) => (
                    <Input type="date" {...field} value={field.value || ''} />
                  )}
                />
              </Field>

              {isEditMode && (
                <div className={styles.switchField}>
                  <Label>Active (available for project assignment)</Label>
                  <Controller
                    name="IsActive"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onChange={(_, data) => field.onChange(data.checked)} />
                    )}
                  />
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

    <EntraUserPicker
      open={showEntraPicker}
      onClose={() => setShowEntraPicker(false)}
      onSelect={handleEntraUserSelect}
      title="Select Delivery Resource from Directory"
      allowManualEntry={false}
      allowGuestUsers={false}
    />
    </>
  );
};
