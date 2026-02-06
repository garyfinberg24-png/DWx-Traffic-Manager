import React, { useEffect } from 'react';
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
import { Dismiss24Regular, Dismiss12Regular } from '@fluentui/react-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Specialist,
  SpecialistInput,
  SpecialistRole,
  ServiceCategory,
} from '../../types/ServiceRequest';

const SPECIALIST_ROLES: SpecialistRole[] = [
  'Solution Architect',
  'Technical Specialist',
  'Consultant',
];

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
});

interface SpecialistFormData {
  Title: string;
  Email: string;
  Phone?: string;
  Role: string;
  Specializations: string[];
  MaxConcurrentDeals: number;
  IsActive: boolean;
  CalendarEmail?: string;
}

const schema = yup.object().shape({
  Title: yup.string().required('Full name is required').min(3, 'Name must be at least 3 characters'),
  Email: yup.string().required('Email is required').email('Invalid email format'),
  Phone: yup.string().optional(),
  Role: yup.string().required('Role is required'),
  Specializations: yup.array().of(yup.string()).min(1, 'At least one specialization required'),
  MaxConcurrentDeals: yup.number().required('Max concurrent deals is required').min(1, 'Must be at least 1'),
  IsActive: yup.boolean().required(),
  CalendarEmail: yup.string().email('Invalid email format').optional().nullable().transform((value) => (value === '' ? undefined : value)),
});

interface SpecialistFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SpecialistInput) => Promise<void>;
  editingSpecialist?: Specialist | null;
  isLoading?: boolean;
}

export const SpecialistForm: React.FC<SpecialistFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingSpecialist,
  isLoading = false,
}) => {
  const styles = useStyles();
  const isEditMode = !!editingSpecialist;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SpecialistFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(schema) as any,
    defaultValues: {
      Title: '',
      Email: '',
      Phone: '',
      Role: '',
      Specializations: [],
      MaxConcurrentDeals: 3,
      IsActive: true,
      CalendarEmail: '',
    },
  });

  const selectedSpecializations = watch('Specializations') || [];

  useEffect(() => {
    if (editingSpecialist) {
      reset({
        Title: editingSpecialist.Title,
        Email: editingSpecialist.Email,
        Phone: editingSpecialist.Phone || '',
        Role: editingSpecialist.Role,
        Specializations: editingSpecialist.Specializations || [],
        MaxConcurrentDeals: editingSpecialist.MaxConcurrentDeals,
        IsActive: editingSpecialist.IsActive,
        CalendarEmail: editingSpecialist.CalendarEmail !== editingSpecialist.Email
          ? editingSpecialist.CalendarEmail
          : '',
      });
    } else {
      reset({
        Title: '',
        Email: '',
        Phone: '',
        Role: '',
        Specializations: [],
        MaxConcurrentDeals: 3,
        IsActive: true,
        CalendarEmail: '',
      });
    }
  }, [editingSpecialist, reset]);

  const handleFormSubmit = async (data: SpecialistFormData) => {
    const input: SpecialistInput = {
      Title: data.Title,
      Email: data.Email,
      Role: data.Role as SpecialistRole,
      Specializations: data.Specializations as ServiceCategory[],
      MaxConcurrentDeals: data.MaxConcurrentDeals,
      IsActive: data.IsActive,
      CalendarEmail: data.CalendarEmail?.trim() || data.Email,
      Phone: data.Phone || undefined,
    };
    await onSubmit(input);
    onClose();
  };

  const handleSpecializationSelect = (specialization: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={onClose} />
            }
          >
            {isEditMode ? 'Edit Specialist' : 'Add Specialist'}
          </DialogTitle>

          <DialogContent>
            <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
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
                    <Input {...field} placeholder="Enter phone number" />
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
                      placeholder="Select role"
                    >
                      {SPECIALIST_ROLES.map((role) => (
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
                required
                validationMessage={errors.Specializations?.message}
                validationState={errors.Specializations ? 'error' : 'none'}
                hint="Select one or more service categories"
              >
                <Dropdown
                  placeholder={selectedSpecializations.length > 0 ? 'Add another specialization...' : 'Select specializations'}
                  onOptionSelect={(_, data) => handleSpecializationSelect(data.optionValue as string)}
                  selectedOptions={[]}
                  disabled={availableSpecializations.length === 0}
                >
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

              <Field
                label="Max Concurrent Deals"
                required
                validationMessage={errors.MaxConcurrentDeals?.message}
                validationState={errors.MaxConcurrentDeals ? 'error' : 'none'}
              >
                <Controller
                  name="MaxConcurrentDeals"
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
                label="Calendar Email"
                validationMessage={errors.CalendarEmail?.message}
                validationState={errors.CalendarEmail ? 'error' : 'none'}
                hint="Defaults to email if empty"
              >
                <Controller
                  name="CalendarEmail"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} type="email" placeholder="Defaults to email if empty" />
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
