import React, { useState } from 'react';
import {
  Card,
  Text,
  makeStyles,
  tokens,
  shorthands,
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
  Database24Regular,
  Apps24Regular,
  PersonBoard24Regular,
  Home24Regular,
  BookOpen24Regular,
  ChevronDownRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import { TeamMemberList } from './TeamMemberList';
import { ClientList } from './ClientList';
import { AccountManagerManagement } from './AccountManagerManagement';
import { ManagerSettings } from './ManagerSettings';
import { GuestInvitations } from './GuestInvitations';
import { ChecklistManagement } from './ChecklistManagement';
import { DocumentManagement } from './DocumentManagement';
import { DWxSharePointProvisioning } from './DWxSharePointProvisioning';
import { ServiceManagement } from './ServiceManagement';
import { SpecialistManagement } from './SpecialistManagement';
import { LandingPageManagement } from './LandingPageManagement';
import { KnowledgeBaseManagement } from './KnowledgeBaseManagement';

// ============================================================================
// Types
// ============================================================================

type TabValue = 'team' | 'clients' | 'account-managers' | 'services' | 'specialists' | 'managers' | 'guests' | 'checklist' | 'documents' | 'landing-page' | 'knowledge-base' | 'provisioning';

interface NavItem {
  value: TabValue;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// ============================================================================
// Navigation Structure
// ============================================================================

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'people-roles',
    label: 'People & Roles',
    items: [
      { value: 'team', label: 'Team Members', icon: People24Regular },
      { value: 'account-managers', label: 'Account Managers', icon: PersonAccounts24Regular },
      { value: 'specialists', label: 'Specialists', icon: PersonBoard24Regular },
      { value: 'managers', label: 'Manager Access', icon: Shield24Regular },
      { value: 'guests', label: 'Guest Invitations', icon: PersonAdd24Regular },
    ],
  },
  {
    id: 'catalog-content',
    label: 'Catalog & Content',
    items: [
      { value: 'services', label: 'Services', icon: Apps24Regular },
      { value: 'landing-page', label: 'Landing Page', icon: Home24Regular },
      { value: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen24Regular },
    ],
  },
  {
    id: 'data-operations',
    label: 'Data & Operations',
    items: [
      { value: 'clients', label: 'Clients', icon: Building24Regular },
      { value: 'checklist', label: 'Checklist', icon: CheckboxChecked24Regular },
      { value: 'documents', label: 'Documents', icon: FolderOpen24Regular },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { value: 'provisioning', label: 'SP Provisioning', icon: Database24Regular },
    ],
  },
];

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
    ...shorthands.padding('24px', '64px'),
    maxWidth: '1400px',
    ...shorthands.margin('0', 'auto'),
    width: '100%',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
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
    ...shorthands.margin('0'),
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },

  // Layout: sidebar + content
  layoutWrapper: {
    display: 'flex',
    minHeight: '560px',
  },

  // Sidebar
  sidebar: {
    width: '230px',
    flexShrink: 0,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    overflowY: 'auto',
    overflowX: 'hidden',
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.padding('8px', '0'),
  },
  navGroup: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  groupHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('10px', '16px'),
    cursor: 'pointer',
    backgroundColor: 'transparent',
    ...shorthands.border('none'),
    width: '100%',
    textAlign: 'left' as const,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  groupLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  chevronIcon: {
    color: tokens.colorNeutralForeground3,
    width: '14px',
    height: '14px',
  },
  navItems: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.padding('2px', '0', '8px'),
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    ...shorthands.padding('9px', '16px', '9px', '20px'),
    cursor: 'pointer',
    ...shorthands.border('none'),
    backgroundColor: 'transparent',
    width: '100%',
    textAlign: 'left' as const,
    borderLeft: '3px solid transparent',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  navItemActive: {
    backgroundColor: '#e3f0fa',
    borderLeft: '3px solid #1a5a8a',
    ':hover': {
      backgroundColor: '#daeaf6',
    },
  },
  navIcon: {
    width: '18px',
    height: '18px',
    color: tokens.colorNeutralForeground2,
    flexShrink: 0,
  },
  navIconActive: {
    color: '#1a5a8a',
  },
  navLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightRegular,
    color: tokens.colorNeutralForeground1,
  },
  navLabelActive: {
    fontWeight: tokens.fontWeightSemibold,
    color: '#1a5a8a',
  },

  // Content area
  contentArea: {
    flex: 1,
    overflowY: 'auto',
    minHeight: '400px',
    ...shorthands.padding('24px'),
  },
});

// ============================================================================
// Component
// ============================================================================

export const AdminPage: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<TabValue>('team');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(NAV_GROUPS.map(g => g.id))
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
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
            Manage team members, services, and system configuration
          </Text>
        </div>
      </div>

      <Card>
        <div className={styles.layoutWrapper}>
          {/* Left Sidebar */}
          <nav className={styles.sidebar}>
            {NAV_GROUPS.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              return (
                <div key={group.id} className={styles.navGroup}>
                  <button
                    className={styles.groupHeader}
                    onClick={() => toggleGroup(group.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${group.label} section`}
                  >
                    <Text className={styles.groupLabel}>{group.label}</Text>
                    {isExpanded ? (
                      <ChevronDownRegular className={styles.chevronIcon} />
                    ) : (
                      <ChevronRightRegular className={styles.chevronIcon} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className={styles.navItems}>
                      {group.items.map((item) => {
                        const isActive = selectedTab === item.value;
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.value}
                            className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                            onClick={() => setSelectedTab(item.value)}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <IconComponent
                              className={`${styles.navIcon} ${isActive ? styles.navIconActive : ''}`}
                            />
                            <Text
                              className={`${styles.navLabel} ${isActive ? styles.navLabelActive : ''}`}
                            >
                              {item.label}
                            </Text>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Content Area */}
          <div className={styles.contentArea}>
            {selectedTab === 'team' && <TeamMemberList />}
            {selectedTab === 'account-managers' && (
              <AccountManagerManagement onNavigateToGuestInvitations={handleNavigateToGuestInvitations} />
            )}
            {selectedTab === 'clients' && <ClientList />}
            {selectedTab === 'services' && <ServiceManagement />}
            {selectedTab === 'specialists' && <SpecialistManagement />}
            {selectedTab === 'managers' && <ManagerSettings />}
            {selectedTab === 'guests' && <GuestInvitations />}
            {selectedTab === 'checklist' && <ChecklistManagement />}
            {selectedTab === 'documents' && <DocumentManagement />}
            {selectedTab === 'landing-page' && <LandingPageManagement />}
            {selectedTab === 'knowledge-base' && <KnowledgeBaseManagement />}
            {selectedTab === 'provisioning' && <DWxSharePointProvisioning />}
          </div>
        </div>
      </Card>
    </div>
  );
};
