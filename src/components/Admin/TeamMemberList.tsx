import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Text,
  Button,
  Badge,
  makeStyles,
  tokens,
  Spinner,
  SearchBox,
  Dropdown,
  Option,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Avatar,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from '@fluentui/react-components';
import {
  Add24Regular,
  Edit24Regular,
  Delete24Regular,
  MoreHorizontal24Regular,
  Person24Regular,
  Mail24Regular,
  Phone24Regular,
  Briefcase24Regular,
} from '@fluentui/react-icons';
import { TeamMember, TeamMemberInput, TeamMemberRole, TEAM_MEMBER_ROLES } from '../../types/ReferenceData';
import { referenceDataService } from '../../services/ReferenceDataService';
import { TeamMemberForm } from './TeamMemberForm';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../Common/ConfirmDialog';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
  },
  filters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchBox: {
    minWidth: '250px',
  },
  roleFilter: {
    minWidth: '180px',
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
  },
  nameCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
    gap: tokens.spacingVerticalM,
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalXXL,
  },
  roleBadge: {
    textTransform: 'capitalize',
  },
  // Column width styles
  colName: {
    width: '180px',
  },
  colEmail: {
    width: '240px',
  },
  colPhone: {
    width: '140px',
  },
  colRole: {
    width: '180px',
  },
  colDepartment: {
    width: '140px',
  },
  colStatus: {
    width: '90px',
  },
  colActions: {
    width: '70px',
  },
});

const getRoleBadgeColor = (role: TeamMemberRole): 'brand' | 'success' | 'informative' | 'warning' | 'danger' => {
  switch (role) {
    case 'Developer':
      return 'success';
    case 'Demo Specialist':
      return 'informative';
    case 'Implementer':
      return 'danger';
    case 'Support':
      return 'warning';
    case 'Project Manager':
      return 'brand';
    default:
      return 'informative';
  }
};

export const TeamMemberList: React.FC = () => {
  const styles = useStyles();
  const { showToast } = useToast();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const loadTeamMembers = useCallback(async () => {
    try {
      setIsLoading(true);
      const members = await referenceDataService.getTeamMembers();
      setTeamMembers(members);
    } catch (error) {
      showToast('Failed to load team members', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadTeamMembers();
  }, [loadTeamMembers]);

  useEffect(() => {
    let result = teamMembers;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.Title.toLowerCase().includes(query) ||
          m.Email.toLowerCase().includes(query) ||
          (m.Department?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.Role === roleFilter);
    }

    setFilteredMembers(result);
  }, [teamMembers, searchQuery, roleFilter]);

  const handleCreate = async (data: TeamMemberInput) => {
    try {
      setIsSaving(true);
      await referenceDataService.createTeamMember(data);
      showToast('Team member created successfully', 'success');
      await loadTeamMembers();
    } catch (error) {
      showToast('Failed to create team member', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (data: TeamMemberInput) => {
    if (!editingMember) return;
    try {
      setIsSaving(true);
      await referenceDataService.updateTeamMember(editingMember.Id, data);
      showToast('Team member updated successfully', 'success');
      await loadTeamMembers();
    } catch (error) {
      showToast('Failed to update team member', 'error');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    try {
      setIsSaving(true);
      await referenceDataService.deleteTeamMember(deletingMember.Id);
      showToast('Team member deleted successfully', 'success');
      await loadTeamMembers();
    } catch (error) {
      showToast('Failed to delete team member', 'error');
    } finally {
      setIsSaving(false);
      setDeletingMember(null);
    }
  };

  const openCreateForm = () => {
    setEditingMember(null);
    setIsFormOpen(true);
  };

  const openEditForm = (member: TeamMember) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingMember(null);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size="large" label="Loading team members..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.filters}>
          <SearchBox
            className={styles.searchBox}
            placeholder="Search by name, email, or department..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
          />
          <Dropdown
            className={styles.roleFilter}
            placeholder="Filter by role"
            value={roleFilter === 'all' ? 'All Roles' : roleFilter}
            selectedOptions={[roleFilter]}
            onOptionSelect={(_, data) => setRoleFilter(data.optionValue || 'all')}
          >
            <Option value="all">All Roles</Option>
            {TEAM_MEMBER_ROLES.map((role) => (
              <Option key={role} value={role}>
                {role}
              </Option>
            ))}
          </Dropdown>
        </div>
        <Button appearance="primary" icon={<Add24Regular />} onClick={openCreateForm}>
          Add Team Member
        </Button>
      </div>

      {filteredMembers.length === 0 ? (
        <Card className={styles.emptyState}>
          <Person24Regular style={{ fontSize: 48, color: tokens.colorNeutralForeground3 }} />
          <Text size={400} weight="semibold">
            No team members found
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            {searchQuery || roleFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Click "Add Team Member" to create your first team member'}
          </Text>
        </Card>
      ) : (
        <Table className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={styles.colName}>Name</TableHeaderCell>
              <TableHeaderCell className={styles.colEmail}>Email</TableHeaderCell>
              <TableHeaderCell className={styles.colPhone}>Mobile</TableHeaderCell>
              <TableHeaderCell className={styles.colRole}>Role</TableHeaderCell>
              <TableHeaderCell className={styles.colDepartment}>Department</TableHeaderCell>
              <TableHeaderCell className={styles.colStatus}>Status</TableHeaderCell>
              <TableHeaderCell className={styles.colActions}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.Id}>
                <TableCell className={styles.colName}>
                  <TableCellLayout
                    media={
                      <Avatar
                        name={member.Title}
                        color="colorful"
                        size={32}
                      />
                    }
                  >
                    <Text weight="semibold">{member.Title}</Text>
                  </TableCellLayout>
                </TableCell>
                <TableCell className={styles.colEmail}>
                  <div className={styles.contactItem}>
                    <Mail24Regular style={{ fontSize: 14 }} />
                    <Text size={200}>{member.Email}</Text>
                  </div>
                </TableCell>
                <TableCell className={styles.colPhone}>
                  {member.Phone ? (
                    <div className={styles.contactItem}>
                      <Phone24Regular style={{ fontSize: 14 }} />
                      <Text size={200}>{member.Phone}</Text>
                    </div>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                  )}
                </TableCell>
                <TableCell className={styles.colRole}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {(member.Roles || [member.Role]).map((role) => (
                      <Badge
                        key={role}
                        appearance="tint"
                        color={getRoleBadgeColor(role)}
                        className={styles.roleBadge}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className={styles.colDepartment}>
                  {member.Department ? (
                    <div className={styles.contactItem}>
                      <Briefcase24Regular style={{ fontSize: 14 }} />
                      <Text>{member.Department}</Text>
                    </div>
                  ) : (
                    <Text style={{ color: tokens.colorNeutralForeground3 }}>—</Text>
                  )}
                </TableCell>
                <TableCell className={styles.colStatus}>
                  <Badge
                    appearance="filled"
                    color={member.IsActive ? 'success' : 'danger'}
                  >
                    {member.IsActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className={styles.colActions}>
                  <Menu>
                    <MenuTrigger disableButtonEnhancement>
                      <Button
                        appearance="subtle"
                        icon={<MoreHorizontal24Regular />}
                        size="small"
                      />
                    </MenuTrigger>
                    <MenuPopover>
                      <MenuList>
                        <MenuItem
                          icon={<Edit24Regular />}
                          onClick={() => openEditForm(member)}
                        >
                          Edit
                        </MenuItem>
                        <MenuItem
                          icon={<Delete24Regular />}
                          onClick={() => setDeletingMember(member)}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </MenuPopover>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TeamMemberForm
        open={isFormOpen}
        onClose={closeForm}
        onSubmit={editingMember ? handleUpdate : handleCreate}
        teamMember={editingMember}
        isLoading={isSaving}
      />

      <ConfirmDialog
        open={!!deletingMember}
        title="Delete Team Member"
        message={`Are you sure you want to delete "${deletingMember?.Title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmAppearance="primary"
        onConfirm={handleDelete}
        onCancel={() => setDeletingMember(null)}
        isLoading={isSaving}
      />
    </div>
  );
};
