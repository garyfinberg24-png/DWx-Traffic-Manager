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
import {
  TeamMember,
  TeamMemberInput,
  TeamMemberRole,
  TEAM_MEMBER_ROLES,
} from '../../types/ReferenceData';
import { EntraUserPicker } from './EntraUserPicker';
import { EntraUser } from '../../types/ReferenceData';

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
    maxWidth: '480px',
    width: '100%',
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
  removeRoleBtn: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    ':hover': {
      opacity: 0.7,
    },
  },
});

// Form data type - Roles is required for multi-select
interface TeamMemberFormData {
  Title: string;
  Email: string;
  Phone?: string;
  Roles: TeamMemberRole[];
  Department?: string;
  IsActive: boolean;
}

const schema = yup.object().shape({
  Title: yup.string().required('Full name is required').min(2, 'Name must be at least 2 characters'),
  Email: yup.string().required('Email is required').email('Invalid email format'),
  Phone: yup.string().optional(),
  Roles: yup.array().of(yup.string().oneOf(TEAM_MEMBER_ROLES)).min(1, 'At least one role is required'),
  Department: yup.string().optional(),
  IsActive: yup.boolean().required(),
});

interface TeamMemberFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TeamMemberInput) => Promise<void>;
  teamMember?: TeamMember | null;
  isLoading?: boolean;
}

export const TeamMemberForm: React.FC<TeamMemberFormProps> = ({
  open,
  onClose,
  onSubmit,
  teamMember,
  isLoading = false,
}) => {
  const styles = useStyles();
  const isEditMode = !!teamMember;
  const [showEntraPicker, setShowEntraPicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TeamMemberFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      Title: '',
      Email: '',
      Phone: '',
      Roles: [],
      Department: '',
      IsActive: true,
    },
  });

  const selectedRoles = watch('Roles') || [];

  useEffect(() => {
    if (teamMember) {
      // Convert existing role(s) to array
      const roles = teamMember.Roles || (teamMember.Role ? [teamMember.Role] : []);
      reset({
        Title: teamMember.Title,
        Email: teamMember.Email,
        Phone: teamMember.Phone || '',
        Roles: roles.filter(r => TEAM_MEMBER_ROLES.includes(r as TeamMemberRole)) as TeamMemberRole[],
        Department: teamMember.Department || '',
        IsActive: teamMember.IsActive,
      });
    } else {
      reset({
        Title: '',
        Email: '',
        Phone: '',
        Roles: [],
        Department: '',
        IsActive: true,
      });
    }
  }, [teamMember, reset]);

  const handleFormSubmit = async (data: TeamMemberFormData) => {
    // Convert form data to TeamMemberInput
    const input: TeamMemberInput = {
      Title: data.Title,
      Email: data.Email,
      Phone: data.Phone,
      Role: data.Roles[0] || 'Developer', // Primary role (first selected)
      Roles: data.Roles,
      Department: data.Department,
      IsActive: data.IsActive,
    };
    await onSubmit(input);
    onClose();
  };

  const handleRoleSelect = (role: TeamMemberRole) => {
    const currentRoles = selectedRoles || [];
    if (!currentRoles.includes(role)) {
      setValue('Roles', [...currentRoles, role]);
    }
  };

  const handleRoleRemove = (role: TeamMemberRole) => {
    const currentRoles = selectedRoles || [];
    setValue('Roles', currentRoles.filter(r => r !== role));
  };

  const availableRoles = TEAM_MEMBER_ROLES.filter(role => !selectedRoles.includes(role));

  const handleEntraUserSelect = (user: EntraUser | null) => {
    if (user) {
      setValue('Title', user.displayName || '');
      setValue('Email', user.mail || user.userPrincipalName || '');
      setValue('Phone', user.mobilePhone || (user.businessPhones?.[0]) || '');
      setValue('Department', user.department || '');
    }
    setShowEntraPicker(false);
  };

  return (
    <>
      <Dialog open={open && !showEntraPicker} onOpenChange={(_, data) => !data.open && onClose()}>
        <DialogSurface className={styles.surface}>
          <DialogBody>
            <DialogTitle
              action={
                <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={onClose} />
              }
            >
              {isEditMode ? 'Edit Team Member' : 'Add Team Member'}
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
                    <Input {...field} placeholder="Enter phone number" />
                  )}
                />
              </Field>

              <Field
                label="Roles"
                required
                validationMessage={errors.Roles?.message}
                validationState={errors.Roles ? 'error' : 'none'}
                hint="Select one or more roles for this team member"
              >
                <Dropdown
                  placeholder={selectedRoles.length > 0 ? 'Add another role...' : 'Select roles'}
                  onOptionSelect={(_, data) => handleRoleSelect(data.optionValue as TeamMemberRole)}
                  selectedOptions={[]}
                  disabled={availableRoles.length === 0}
                >
                  {availableRoles.map((role) => (
                    <Option key={role} value={role}>
                      {role}
                    </Option>
                  ))}
                </Dropdown>
                {selectedRoles.length > 0 && (
                  <div className={styles.rolesContainer}>
                    {selectedRoles.map((role) => (
                      <Badge
                        key={role}
                        appearance="tint"
                        color="brand"
                        className={styles.roleBadge}
                      >
                        {role}
                        <span
                          className={styles.removeRoleBtn}
                          onClick={() => handleRoleRemove(role)}
                          title="Remove role"
                        >
                          <Dismiss12Regular />
                        </span>
                      </Badge>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="Department" validationMessage={errors.Department?.message}>
                <Controller
                  name="Department"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="Enter department" />
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

      <EntraUserPicker
        open={showEntraPicker}
        onClose={() => setShowEntraPicker(false)}
        onSelect={handleEntraUserSelect}
        title="Select Team Member from Directory"
        allowManualEntry={false}
        allowGuestUsers={false}
      />
    </>
  );
};
