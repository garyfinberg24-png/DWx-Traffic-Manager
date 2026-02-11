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
  Clock24Regular,
  Rocket24Regular,
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
import { SLAManagement } from './SLAManagement';
import { DeliveryResourceManagement } from './DeliveryResourceManagement';
import { useHeroCollapse } from '../../hooks/useHeroCollapse';
import { HeroCollapseToggle } from '../Common/HeroCollapseToggle';

// ============================================================================
// Types
// ============================================================================

type TabValue = 'team' | 'clients' | 'account-managers' | 'services' | 'specialists' | 'managers' | 'guests' | 'checklist' | 'documents' | 'landing-page' | 'knowledge-base' | 'sla-config' | 'delivery-resources' | 'provisioning';

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
      { value: 'delivery-resources', label: 'Delivery Resources', icon: Rocket24Regular },
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
      { value: 'sla-config', label: 'SLA Configuration', icon: Clock24Regular },
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
    ...shorthands.padding('0', '64px', '24px'),
    maxWidth: '1400px',
    ...shorthands.margin('0', 'auto'),
    width: '100%',
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
    background: 'linear-gradient(135deg, #0d3a5c 0%, #1a5a8a 100%)',
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
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('32px'),
    ...shorthands.padding('24px', '32px'),
  },
  heroTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    whiteSpace: 'nowrap',
    marginBottom: '4px',
  },
  heroTitleAccent: {
    color: '#7dd3fc',
  },
  heroSubtitle: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.6)',
  },
  heroIcon: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '22px',
  },
  heroRightSection: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    flexShrink: 0,
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

const getTabLabel = (tab: TabValue): string => {
  for (const group of NAV_GROUPS) {
    const item = group.items.find(i => i.value === tab);
    if (item) return item.label;
  }
  return '';
};

export const AdminPage: React.FC = () => {
  const styles = useStyles();
  const { isCollapsed, toggle } = useHeroCollapse('admin');
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
      {/* Hero Banner */}
      <div className={styles.heroWrapper}>
        <div className={`${styles.heroBanner} ${isCollapsed ? styles.heroCollapsed : styles.heroExpanded}`}>
          <div className={styles.heroDecoration} />
          {isCollapsed ? (
            <div className={styles.collapsedStrip}>
              <span className={styles.collapsedTitle}>Administration</span>
              <span className={styles.collapsedBadge}>{getTabLabel(selectedTab)}</span>
            </div>
          ) : (
            <div className={styles.heroContent}>
              <div>
                <div className={styles.heroTitle}>
                  <Settings24Regular className={styles.heroIcon} />
                  <span><span className={styles.heroTitleAccent}>Admin</span>istration</span>
                </div>
                <div className={styles.heroSubtitle}>Manage team, services, and system configuration</div>
              </div>
              <div className={styles.heroRightSection}>
                <span className={styles.collapsedBadge}>{getTabLabel(selectedTab)}</span>
              </div>
            </div>
          )}
        </div>
        <HeroCollapseToggle isCollapsed={isCollapsed} onToggle={toggle} />
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
            {selectedTab === 'sla-config' && <SLAManagement />}
            {selectedTab === 'delivery-resources' && <DeliveryResourceManagement />}
            {selectedTab === 'provisioning' && <DWxSharePointProvisioning />}
          </div>
        </div>
      </Card>
    </div>
  );
};
