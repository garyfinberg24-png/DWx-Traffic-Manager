import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Spinner,
  makeStyles,
  tokens,
  Text,
  Avatar,
  Card,
  CardHeader,
  Badge,
  Divider,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from '@fluentui/react-components';
import {
  Search24Regular,
  Person24Regular,
  Mail24Regular,
  Building24Regular,
  Briefcase24Regular,
  PersonAdd24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  PeopleTeam24Regular,
  Globe24Regular,
} from '@fluentui/react-icons';
import { getGraphService } from '../../services';
import { EntraUser } from '../../types/ReferenceData';
import { useDebouncedCallback } from 'use-debounce';

const useStyles = makeStyles({
  surface: {
    maxWidth: '700px',
    width: '100%',
    maxHeight: '80vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  searchContainer: {
    marginBottom: '16px',
  },
  tabList: {
    marginBottom: '16px',
  },
  userList: {
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  userCard: {
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      transform: 'translateY(-1px)',
    },
  },
  userCardSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `1px solid ${tokens.colorBrandStroke1}`,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: tokens.colorNeutralForeground3,
  },
  badge: {
    marginLeft: '8px',
  },
  selectedUser: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
  },
  selectedUserHeader: {
    fontWeight: '600',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  manualEntry: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  manualEntryRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
});

type TabValue = 'search' | 'guests' | 'manual';

interface EntraUserPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (user: EntraUser | null, isExternal?: boolean, manualEntry?: Partial<EntraUser>) => void;
  title?: string;
  allowManualEntry?: boolean;
  allowGuestUsers?: boolean;
}

export const EntraUserPicker: React.FC<EntraUserPickerProps> = ({
  open,
  onClose,
  onSelect,
  title = 'Select User from Directory',
  allowManualEntry = true,
  allowGuestUsers = true,
}) => {
  const styles = useStyles();
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState<EntraUser[]>([]);
  const [guestUsers, setGuestUsers] = useState<EntraUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<EntraUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGuests, setIsLoadingGuests] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('search');

  // Manual entry fields
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualJobTitle, setManualJobTitle] = useState('');

  // Debounced search
  const debouncedSearch = useDebouncedCallback(async (text: string) => {
    if (text.length < 2) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const graphService = getGraphService();
      const results = await graphService.searchEntraUsers(text, 20);
      setUsers(results);
    } catch (err) {
      console.error('Entra ID search failed:', err);
      setError('Unable to search directory. This may require admin consent for User.Read.All permission.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  // Load guest users when tab changes
  useEffect(() => {
    if (activeTab === 'guests' && guestUsers.length === 0 && allowGuestUsers) {
      loadGuestUsers();
    }
  }, [activeTab, allowGuestUsers, guestUsers.length]);

  const loadGuestUsers = async () => {
    setIsLoadingGuests(true);
    try {
      const graphService = getGraphService();
      const guests = await graphService.getGuestUsers();
      setGuestUsers(guests);
    } catch (err) {
      console.error('Failed to load guest users:', err);
      setError('Unable to load guest users. This may require admin consent for User.Read.All permission.');
    } finally {
      setIsLoadingGuests(false);
    }
  };

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchText(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const handleUserSelect = (user: EntraUser) => {
    setSelectedUser(user);
  };

  const handleConfirm = () => {
    if (activeTab === 'manual') {
      // Manual entry
      const manualUser: Partial<EntraUser> = {
        displayName: manualName.trim(),
        mail: manualEmail.trim(),
        userPrincipalName: manualEmail.trim(),
        jobTitle: manualJobTitle.trim() || undefined,
      };
      onSelect(null, true, manualUser);
    } else if (selectedUser) {
      const isGuest = activeTab === 'guests' || selectedUser.userPrincipalName.includes('#EXT#');
      onSelect(selectedUser, isGuest);
    }
    handleClose();
  };

  const handleClose = () => {
    setSearchText('');
    setUsers([]);
    setSelectedUser(null);
    setError(null);
    setActiveTab('search');
    setManualName('');
    setManualEmail('');
    setManualCompany('');
    setManualJobTitle('');
    onClose();
  };

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setActiveTab(data.value as TabValue);
    setSelectedUser(null);
  };

  const isManualEntryValid = manualName.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualEmail);

  const renderUserCard = (user: EntraUser, isGuest = false) => {
    const isSelected = selectedUser?.id === user.id;
    const isGuestUser = isGuest || user.userPrincipalName.includes('#EXT#');

    return (
      <Card
        key={user.id}
        className={`${styles.userCard} ${isSelected ? styles.userCardSelected : ''}`}
        onClick={() => handleUserSelect(user)}
      >
        <CardHeader
          image={
            <Avatar
              name={user.displayName}
              size={40}
              color={isSelected ? 'brand' : 'colorful'}
            />
          }
          header={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Text weight="semibold">{user.displayName}</Text>
              {isGuestUser && (
                <Badge className={styles.badge} appearance="outline" color="warning" size="small">
                  Guest
                </Badge>
              )}
              {isSelected && (
                <Checkmark24Regular
                  style={{ marginLeft: 'auto', color: tokens.colorBrandForeground1 }}
                />
              )}
            </div>
          }
          description={
            <div className={styles.userInfo}>
              {user.mail && (
                <div className={styles.userDetail}>
                  <Mail24Regular style={{ width: '14px', height: '14px' }} />
                  {user.mail}
                </div>
              )}
              {user.jobTitle && (
                <div className={styles.userDetail}>
                  <Briefcase24Regular style={{ width: '14px', height: '14px' }} />
                  {user.jobTitle}
                </div>
              )}
              {user.department && (
                <div className={styles.userDetail}>
                  <Building24Regular style={{ width: '14px', height: '14px' }} />
                  {user.department}
                </div>
              )}
            </div>
          }
        />
      </Card>
    );
  };

  const renderSearchTab = () => (
    <>
      <div className={styles.searchContainer}>
        <Input
          value={searchText}
          onChange={(_, d) => handleSearchChange(d.value)}
          placeholder="Search by name or email..."
          contentBefore={<Search24Regular />}
          contentAfter={isLoading ? <Spinner size="tiny" /> : undefined}
          style={{ width: '100%' }}
        />
      </div>

      {error && (
        <div style={{ color: tokens.colorPaletteRedForeground1, marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div className={styles.userList}>
        {users.length === 0 && !isLoading && searchText.length >= 2 && (
          <div className={styles.emptyState}>
            <Person24Regular style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
            <Text>No users found matching "{searchText}"</Text>
          </div>
        )}

        {users.length === 0 && searchText.length < 2 && (
          <div className={styles.emptyState}>
            <Search24Regular style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
            <Text>Type at least 2 characters to search</Text>
          </div>
        )}

        {users.map((user) => renderUserCard(user))}
      </div>
    </>
  );

  const renderGuestsTab = () => (
    <div className={styles.userList}>
      {error && (
        <div style={{ color: tokens.colorPaletteRedForeground1, marginBottom: '16px', padding: '12px', backgroundColor: '#fdf3f3', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      {isLoadingGuests ? (
        <div className={styles.loadingContainer}>
          <Spinner label="Loading guest users..." />
        </div>
      ) : guestUsers.length === 0 && !error ? (
        <div className={styles.emptyState}>
          <Globe24Regular style={{ width: '48px', height: '48px', marginBottom: '12px' }} />
          <Text>No guest users found in directory</Text>
        </div>
      ) : (
        guestUsers.map((user) => renderUserCard(user, true))
      )}
    </div>
  );

  const renderManualEntryTab = () => (
    <div className={styles.manualEntry}>
      <Text style={{ marginBottom: '8px', color: tokens.colorNeutralForeground3 }}>
        Enter details for an external user not in your directory
      </Text>

      <div className={styles.manualEntryRow}>
        <Input
          value={manualName}
          onChange={(_, d) => setManualName(d.value)}
          placeholder="Full Name *"
          contentBefore={<Person24Regular />}
        />
        <Input
          value={manualEmail}
          onChange={(_, d) => setManualEmail(d.value)}
          placeholder="Email Address *"
          type="email"
          contentBefore={<Mail24Regular />}
        />
      </div>

      <div className={styles.manualEntryRow}>
        <Input
          value={manualCompany}
          onChange={(_, d) => setManualCompany(d.value)}
          placeholder="Company (optional)"
          contentBefore={<Building24Regular />}
        />
        <Input
          value={manualJobTitle}
          onChange={(_, d) => setManualJobTitle(d.value)}
          placeholder="Job Title (optional)"
          contentBefore={<Briefcase24Regular />}
        />
      </div>

      {manualName && manualEmail && (
        <div className={styles.selectedUser}>
          <div className={styles.selectedUserHeader}>
            <PersonAdd24Regular />
            External User Preview
          </div>
          <Card>
            <CardHeader
              image={<Avatar name={manualName} size={40} color="colorful" />}
              header={<Text weight="semibold">{manualName || 'Name'}</Text>}
              description={
                <div className={styles.userInfo}>
                  <div className={styles.userDetail}>
                    <Mail24Regular style={{ width: '14px', height: '14px' }} />
                    {manualEmail || 'email@example.com'}
                  </div>
                  {manualCompany && (
                    <div className={styles.userDetail}>
                      <Building24Regular style={{ width: '14px', height: '14px' }} />
                      {manualCompany}
                    </div>
                  )}
                  {manualJobTitle && (
                    <div className={styles.userDetail}>
                      <Briefcase24Regular style={{ width: '14px', height: '14px' }} />
                      {manualJobTitle}
                    </div>
                  )}
                </div>
              }
            />
          </Card>
        </div>
      )}
    </div>
  );

  const canConfirm =
    (activeTab === 'manual' && isManualEntryValid) ||
    ((activeTab === 'search' || activeTab === 'guests') && selectedUser !== null);

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && handleClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody>
          <DialogTitle>
            <div className={styles.header}>
              <PeopleTeam24Regular />
              {title}
            </div>
          </DialogTitle>

          <DialogContent>
            <TabList
              className={styles.tabList}
              selectedValue={activeTab}
              onTabSelect={handleTabSelect}
            >
              <Tab value="search" icon={<Search24Regular />}>
                Search Directory
              </Tab>
              {allowGuestUsers && (
                <Tab value="guests" icon={<Globe24Regular />}>
                  Guest Users
                </Tab>
              )}
              {allowManualEntry && (
                <Tab value="manual" icon={<PersonAdd24Regular />}>
                  Manual Entry
                </Tab>
              )}
            </TabList>

            {activeTab === 'search' && renderSearchTab()}
            {activeTab === 'guests' && renderGuestsTab()}
            {activeTab === 'manual' && renderManualEntryTab()}

            {selectedUser && (activeTab === 'search' || activeTab === 'guests') && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <div className={styles.selectedUser}>
                  <div className={styles.selectedUserHeader}>
                    <Checkmark24Regular style={{ color: tokens.colorBrandForeground1 }} />
                    Selected User
                  </div>
                  {renderUserCard(selectedUser, activeTab === 'guests')}
                </div>
              </>
            )}
          </DialogContent>

          <DialogActions className={styles.actions}>
            <Button
              appearance="secondary"
              icon={<Dismiss24Regular />}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              icon={<Checkmark24Regular />}
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              Select User
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default EntraUserPicker;
