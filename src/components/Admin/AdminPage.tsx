import React, { useState } from 'react';
import {
  Card,
  Text,
  makeStyles,
  tokens,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
} from '@fluentui/react-components';
import {
  People24Regular,
  Building24Regular,
  Settings24Regular,
  PersonAccounts24Regular,
  Shield24Regular,
  PersonAdd24Regular,
  CheckboxChecked24Regular,
  FolderOpen24Regular,
} from '@fluentui/react-icons';
import { TeamMemberList } from './TeamMemberList';
import { ClientList } from './ClientList';
import { AccountManagerManagement } from './AccountManagerManagement';
import { ManagerSettings } from './ManagerSettings';
import { GuestInvitations } from './GuestInvitations';
import { ChecklistManagement } from './ChecklistManagement';
import { DocumentManagement } from './DocumentManagement';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: '24px 64px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  headerIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '28px',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    margin: 0,
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  tabList: {
    marginBottom: tokens.spacingVerticalM,
  },
  tabContent: {
    minHeight: '400px',
  },
});

type TabValue = 'team' | 'clients' | 'account-managers' | 'managers' | 'guests' | 'checklist' | 'documents';

export const AdminPage: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<TabValue>('team');

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as TabValue);
  };

  const handleNavigateToGuestInvitations = () => {
    setSelectedTab('guests');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Settings24Regular className={styles.headerIcon} />
        <div className={styles.headerText}>
          <Text as="h1" size={600} weight="semibold" className={styles.title}>
            Administration
          </Text>
          <Text size={300} className={styles.subtitle}>
            Manage team members, account managers, and clients
          </Text>
        </div>
      </div>

      <Card>
        <TabList
          className={styles.tabList}
          selectedValue={selectedTab}
          onTabSelect={handleTabSelect}
        >
          <Tab value="team" icon={<People24Regular />}>
            Team Members
          </Tab>
          <Tab value="account-managers" icon={<PersonAccounts24Regular />}>
            Account Managers
          </Tab>
          <Tab value="clients" icon={<Building24Regular />}>
            Clients
          </Tab>
          <Tab value="managers" icon={<Shield24Regular />}>
            Manager Access
          </Tab>
          <Tab value="guests" icon={<PersonAdd24Regular />}>
            Guest Invitations
          </Tab>
          <Tab value="checklist" icon={<CheckboxChecked24Regular />}>
            Checklist
          </Tab>
          <Tab value="documents" icon={<FolderOpen24Regular />}>
            Documents
          </Tab>
        </TabList>

        <div className={styles.tabContent}>
          {selectedTab === 'team' && <TeamMemberList />}
          {selectedTab === 'account-managers' && (
            <AccountManagerManagement onNavigateToGuestInvitations={handleNavigateToGuestInvitations} />
          )}
          {selectedTab === 'clients' && <ClientList />}
          {selectedTab === 'managers' && <ManagerSettings />}
          {selectedTab === 'guests' && <GuestInvitations />}
          {selectedTab === 'checklist' && <ChecklistManagement />}
          {selectedTab === 'documents' && <DocumentManagement />}
        </div>
      </Card>
    </div>
  );
};
