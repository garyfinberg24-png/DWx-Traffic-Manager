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
  Dropdown,
  Option,
  Switch,
  Textarea,
  makeStyles,
  tokens,
  Field,
  Label,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Client,
  ClientInput,
  ClientContractStatus,
  ClientIndustry,
  CLIENT_CONTRACT_STATUSES,
  CLIENT_INDUSTRIES,
  AccountManager,
} from '../../types/ReferenceData';

const useStyles = makeStyles({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 500px)': {
      gridTemplateColumns: '1fr',
    },
  },
  switchField: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} 0`,
  },
  surface: {
    maxWidth: '560px',
    width: '100%',
  },
});

// Common business unit options for quoting
const BUSINESS_UNIT_OPTIONS = [
  'Enterprise',
  'SMB',
  'Government',
  'Education',
  'Healthcare',
  'Financial Services',
  'Retail',
  'Other',
];

const schema = yup.object().shape({
  Title: yup.string().required('Company name is required').min(2, 'Name must be at least 2 characters'),
  PrimaryContactName: yup.string().required('Contact name is required'),
  PrimaryContactEmail: yup.string().required('Contact email is required').email('Invalid email format'),
  Phone: yup.string().optional(),
  Industry: yup.string().optional().oneOf([...CLIENT_INDUSTRIES, ''], 'Invalid industry'),
  IsPremium: yup.boolean().required(),
  AccountManagerEmail: yup.string().optional().email('Invalid email format'),
  ContractStatus: yup.string().required('Contract status is required').oneOf(CLIENT_CONTRACT_STATUSES, 'Invalid status'),
  BusinessUnit: yup.string().optional(),
  Notes: yup.string().optional(),
});

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientInput, accountManagerName?: string) => Promise<void>;
  client?: Client | null;
  accountManagers: AccountManager[];
  isLoading?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  open,
  onClose,
  onSubmit,
  client,
  accountManagers,
  isLoading = false,
}) => {
  const styles = useStyles();
  const isEditMode = !!client;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      Title: '',
      PrimaryContactName: '',
      PrimaryContactEmail: '',
      Phone: '',
      Industry: undefined,
      IsPremium: false,
      AccountManagerEmail: '',
      ContractStatus: 'Prospect',
      BusinessUnit: '',
      Notes: '',
    },
  });

  useEffect(() => {
    if (client) {
      reset({
        Title: client.Title,
        PrimaryContactName: client.PrimaryContactName,
        PrimaryContactEmail: client.PrimaryContactEmail,
        Phone: client.Phone || '',
        Industry: client.Industry,
        IsPremium: client.IsPremium,
        AccountManagerEmail: client.AccountManagerEmail || '',
        ContractStatus: client.ContractStatus,
        BusinessUnit: client.BusinessUnit || '',
        Notes: client.Notes || '',
      });
    } else {
      reset({
        Title: '',
        PrimaryContactName: '',
        PrimaryContactEmail: '',
        Phone: '',
        Industry: undefined,
        IsPremium: false,
        AccountManagerEmail: '',
        ContractStatus: 'Prospect',
        BusinessUnit: '',
        Notes: '',
      });
    }
  }, [client, reset]);

  const handleFormSubmit = async (data: ClientInput) => {
    const selectedAM = accountManagers.find((am) => am.Email === data.AccountManagerEmail);
    await onSubmit(data, selectedAM?.Title);
    onClose();
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
            {isEditMode ? 'Edit Client' : 'Add Client'}
          </DialogTitle>

          <DialogContent>
            <form className={styles.form} onSubmit={handleSubmit(handleFormSubmit)}>
              <Field
                label="Company Name"
                required
                validationMessage={errors.Title?.message}
                validationState={errors.Title ? 'error' : 'none'}
              >
                <Controller
                  name="Title"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter company name" />
                  )}
                />
              </Field>

              <div className={styles.row}>
                <Field
                  label="Primary Contact Name"
                  required
                  validationMessage={errors.PrimaryContactName?.message}
                  validationState={errors.PrimaryContactName ? 'error' : 'none'}
                >
                  <Controller
                    name="PrimaryContactName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Enter contact name" />
                    )}
                  />
                </Field>

                <Field
                  label="Primary Contact Email"
                  required
                  validationMessage={errors.PrimaryContactEmail?.message}
                  validationState={errors.PrimaryContactEmail ? 'error' : 'none'}
                >
                  <Controller
                    name="PrimaryContactEmail"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} type="email" placeholder="Enter contact email" />
                    )}
                  />
                </Field>
              </div>

              <div className={styles.row}>
                <Field label="Phone" validationMessage={errors.Phone?.message}>
                  <Controller
                    name="Phone"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Enter phone number" />
                    )}
                  />
                </Field>

                <Field label="Industry" validationMessage={errors.Industry?.message}>
                  <Controller
                    name="Industry"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        placeholder="Select industry"
                        value={field.value || ''}
                        selectedOptions={field.value ? [field.value] : []}
                        onOptionSelect={(_, data) =>
                          field.onChange(data.optionValue as ClientIndustry | undefined)
                        }
                      >
                        {CLIENT_INDUSTRIES.map((industry) => (
                          <Option key={industry} value={industry}>
                            {industry}
                          </Option>
                        ))}
                      </Dropdown>
                    )}
                  />
                </Field>
              </div>

              <div className={styles.row}>
                <Field
                  label="Contract Status"
                  required
                  validationMessage={errors.ContractStatus?.message}
                  validationState={errors.ContractStatus ? 'error' : 'none'}
                >
                  <Controller
                    name="ContractStatus"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        placeholder="Select status"
                        value={field.value || ''}
                        selectedOptions={[field.value]}
                        onOptionSelect={(_, data) =>
                          field.onChange(data.optionValue as ClientContractStatus)
                        }
                      >
                        {CLIENT_CONTRACT_STATUSES.map((status) => (
                          <Option key={status} value={status}>
                            {status}
                          </Option>
                        ))}
                      </Dropdown>
                    )}
                  />
                </Field>

                <Field
                  label="Account Manager"
                  validationMessage={errors.AccountManagerEmail?.message}
                  hint={accountManagers.length === 0 ? 'No active Account Managers available' : undefined}
                >
                  <Controller
                    name="AccountManagerEmail"
                    control={control}
                    render={({ field }) => (
                      <Dropdown
                        placeholder="Select account manager (optional)"
                        value={field.value || 'None'}
                        selectedOptions={field.value ? [field.value] : ['']}
                        onOptionSelect={(_, data) => field.onChange(data.optionValue || '')}
                      >
                        <Option value="">None</Option>
                        {accountManagers.map((am) => (
                          <Option key={am.Email} value={am.Email}>
                            {am.Title}
                          </Option>
                        ))}
                      </Dropdown>
                    )}
                  />
                </Field>
              </div>

              <Field label="Business Unit" hint="Used for quoting purposes">
                <Controller
                  name="BusinessUnit"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      placeholder="Select business unit"
                      value={field.value || ''}
                      selectedOptions={field.value ? [field.value] : []}
                      onOptionSelect={(_, data) => field.onChange(data.optionValue || '')}
                    >
                      <Option value="">None</Option>
                      {BUSINESS_UNIT_OPTIONS.map((unit) => (
                        <Option key={unit} value={unit}>
                          {unit}
                        </Option>
                      ))}
                    </Dropdown>
                  )}
                />
              </Field>

              <div className={styles.switchField}>
                <Label>Premium Client</Label>
                <Controller
                  name="IsPremium"
                  control={control}
                  render={({ field }) => (
                    <Switch checked={field.value} onChange={(_, data) => field.onChange(data.checked)} />
                  )}
                />
              </div>

              <Field label="Notes" validationMessage={errors.Notes?.message}>
                <Controller
                  name="Notes"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Enter any additional notes..."
                      rows={3}
                      resize="vertical"
                    />
                  )}
                />
              </Field>
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
