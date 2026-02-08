/**
 * DWx Traffic Manager - SharePoint Provisioning Component
 * Admin UI for provisioning DWx SharePoint lists and seeding sample data.
 * Tabbed layout: Overview | Lists | Seed Data | Tools
 */

import React, { useState, useEffect } from 'react';
import {
  Text,
  Button,
  makeStyles,
  tokens,
  shorthands,
  Spinner,
  Badge,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Card,
  TabList,
  Tab,
} from '@fluentui/react-components';
import {
  Database24Regular,
  ArrowSync24Regular,
  Add24Regular,
  DocumentBulletList24Regular,
  FolderOpen24Regular,
  People24Regular,
  Building24Regular,
  Briefcase24Regular,
  ClipboardTask24Regular,
  Info24Regular,
  Rocket24Regular,
  Apps24Regular,
  ShieldKeyhole24Regular,
  Sparkle24Regular,
  Home24Regular,
  BookOpen24Regular,
  DocumentText24Regular,
  Eye24Regular,
  Checkmark20Regular,
  Dismiss20Regular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';
import { dwxSharePointProvisioningService } from '../../services/DWxSharePointProvisioningService';

// ============================================================================
// Types
// ============================================================================

type ProvisionTab = 'overview' | 'lists' | 'seed-data' | 'tools';

interface ListStatus {
  list: string;
  exists: boolean;
}

interface ProvisionResult {
  list?: string;
  service?: string;
  success: boolean;
  message: string;
}

// ============================================================================
// Constants
// ============================================================================

const LIST_INFO: Record<string, { description: string; icon: React.ReactElement }> = {
  DWxServices: {
    description: 'Service catalog with DW offerings',
    icon: <Briefcase24Regular />,
  },
  DWxServiceRequests: {
    description: 'Sales funnel tracking',
    icon: <DocumentBulletList24Regular />,
  },
  DWxProductRequests: {
    description: 'Product demo/deployment requests',
    icon: <Apps24Regular />,
  },
  DWxClients: {
    description: 'Client master data',
    icon: <Building24Regular />,
  },
  DWxSpecialists: {
    description: 'Pre-sales specialists',
    icon: <People24Regular />,
  },
  DWxManagers: {
    description: 'Manager access control',
    icon: <ShieldKeyhole24Regular />,
  },
  DWxTeamMembers: {
    description: 'Internal team members',
    icon: <People24Regular />,
  },
  DWxAccountManagers: {
    description: 'Account managers',
    icon: <Briefcase24Regular />,
  },
  DWxAuditLog: {
    description: 'Audit trail',
    icon: <ClipboardTask24Regular />,
  },
  DWxSessionPrep: {
    description: 'AI session preparation',
    icon: <Sparkle24Regular />,
  },
  DWxLandingPageContent: {
    description: 'Landing page content',
    icon: <Home24Regular />,
  },
  DWxKnowledgeBase: {
    description: 'FAQ, Glossary, Articles',
    icon: <BookOpen24Regular />,
  },
  DWxProposals: {
    description: 'Proposal management',
    icon: <DocumentText24Regular />,
  },
  DWxSupportingDocuments: {
    description: 'Document library',
    icon: <FolderOpen24Regular />,
  },
};

interface SeedConfig {
  key: string;
  listName: string;
  label: string;
  description: string;
  icon: React.ReactElement;
  count: number;
  seedCount: string;
  seedFn: () => Promise<{ results: Array<{ service?: string; name?: string; success: boolean; message: string }> }>;
  dependsOn?: string;
}

// ============================================================================
// Styles
// ============================================================================

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalL),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  headerIcon: {
    color: '#1e6b7b',
    fontSize: '24px',
  },
  description: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },

  // Tab content
  tabContent: {
    marginTop: tokens.spacingVerticalM,
  },

  // Overview stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius('8px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
  },
  statCardHighlight: {
    ...shorthands.border('2px', 'solid', '#1e6b7b'),
    backgroundColor: '#f0f7f8',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700' as const,
    color: '#1e6b7b',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
    textAlign: 'center' as const,
  },

  // Status summary row
  summaryRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('6px'),
  },

  // List grid
  listGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  listRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
    ...shorthands.padding('10px', '12px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  listIcon: {
    color: '#1e6b7b',
    flexShrink: 0,
  },
  listInfo: {
    flex: 1,
    minWidth: 0,
  },
  listName: {
    fontWeight: '600' as const,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  listDesc: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },

  // Seed section
  seedCard: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalM),
    ...shorthands.padding('12px', '16px'),
    ...shorthands.borderRadius('6px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    backgroundColor: tokens.colorNeutralBackground1,
  },
  seedIcon: {
    color: '#1e6b7b',
    flexShrink: 0,
  },
  seedInfo: {
    flex: 1,
    minWidth: 0,
  },
  seedLabel: {
    fontWeight: '600' as const,
    fontSize: tokens.fontSizeBase300,
  },
  seedDesc: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
  },
  seedBadge: {
    flexShrink: 0,
  },

  // Seed All hero
  seedAllHero: {
    ...shorthands.padding('16px', '20px'),
    backgroundColor: '#f0f7f8',
    ...shorthands.borderRadius('8px'),
    borderLeft: '4px solid #1e6b7b',
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
  },

  // Results
  resultsContainer: {
    marginTop: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('8px'),
    maxHeight: '300px',
    overflowY: 'auto' as const,
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
    ...shorthands.padding('3px', '0'),
    fontSize: '13px',
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
  },

  // Tools section
  toolCard: {
    ...shorthands.padding('16px', '20px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius('8px'),
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalS),
  },
  toolHeader: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  toolIcon: {
    color: '#1e6b7b',
  },
  toolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },

  // Help list
  helpList: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    paddingLeft: '20px',
    ...shorthands.margin('8px', '0'),
    lineHeight: '1.8',
  },

  // Actions row
  actionsRow: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalS),
    flexWrap: 'wrap' as const,
    alignItems: 'center',
  },

  seedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },

  infoText: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
});

// ============================================================================
// Component
// ============================================================================

export const DWxSharePointProvisioning: React.FC = () => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<ProvisionTab>('overview');

  // Status
  const [listStatuses, setListStatuses] = useState<ListStatus[]>([]);
  const [docLibraryStatus, setDocLibraryStatus] = useState<ListStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedingAll, setIsSeedingAll] = useState(false);
  const [seedAllProgress, setSeedAllProgress] = useState<string>('');
  const [provisionResults, setProvisionResults] = useState<ProvisionResult[] | null>(null);
  const [seedResults, setSeedResults] = useState<ProvisionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Counts
  const [servicesCount, setServicesCount] = useState(0);
  const [teamMembersCount, setTeamMembersCount] = useState(0);
  const [clientsCount, setClientsCount] = useState(0);
  const [accountManagersCount, setAccountManagersCount] = useState(0);
  const [specialistsCount, setSpecialistsCount] = useState(0);
  const [managersCount, setManagersCount] = useState(0);
  const [serviceRequestsCount, setServiceRequestsCount] = useState(0);
  const [productRequestsCount, setProductRequestsCount] = useState(0);
  const [sessionPrepCount, setSessionPrepCount] = useState(0);
  const [landingPageContentCount, setLandingPageContentCount] = useState(0);
  const [knowledgeBaseCount, setKnowledgeBaseCount] = useState(0);
  const [proposalsCount, setProposalsCount] = useState(0);

  // Tools
  const [isFixingViews, setIsFixingViews] = useState(false);
  const [viewFixProgress, setViewFixProgress] = useState('');
  const [viewFixResults, setViewFixResults] = useState<ProvisionResult[] | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────

  const checkListStatus = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const [statuses, docLibStatus] = await Promise.all([
        dwxSharePointProvisioningService.checkListsStatus(),
        dwxSharePointProvisioningService.checkDocumentLibraryStatus(),
      ]);
      setListStatuses(statuses);
      setDocLibraryStatus(docLibStatus);

      const countChecks: Array<{ listName: string; setter: (n: number) => void }> = [
        { listName: 'DWxServices', setter: setServicesCount },
        { listName: 'DWxTeamMembers', setter: setTeamMembersCount },
        { listName: 'DWxClients', setter: setClientsCount },
        { listName: 'DWxAccountManagers', setter: setAccountManagersCount },
        { listName: 'DWxSpecialists', setter: setSpecialistsCount },
        { listName: 'DWxManagers', setter: setManagersCount },
        { listName: 'DWxServiceRequests', setter: setServiceRequestsCount },
        { listName: 'DWxProductRequests', setter: setProductRequestsCount },
        { listName: 'DWxSessionPrep', setter: setSessionPrepCount },
        { listName: 'DWxLandingPageContent', setter: setLandingPageContentCount },
        { listName: 'DWxKnowledgeBase', setter: setKnowledgeBaseCount },
        { listName: 'DWxProposals', setter: setProposalsCount },
      ];

      await Promise.all(
        countChecks.map(async ({ listName, setter }) => {
          const status = [...statuses, docLibStatus].find(s => s?.list === listName);
          if (status?.exists) {
            const count = await dwxSharePointProvisioningService.getListItemCount(listName);
            setter(count);
          } else {
            setter(0);
          }
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check list status');
    } finally {
      setIsChecking(false);
    }
  };

  // ── Provision handlers ─────────────────────────────────────────────────

  const provisionAllLists = async () => {
    setIsProvisioning(true);
    setError(null);
    setProvisionResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.provisionAllLists();
      setProvisionResults(results);
      await checkListStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to provision lists');
    } finally {
      setIsProvisioning(false);
    }
  };

  const provisionSingleList = async (listName: string) => {
    setIsProvisioning(true);
    setError(null);
    try {
      let result: ProvisionResult;
      switch (listName) {
        case 'DWxServices': result = await dwxSharePointProvisioningService.provisionServicesList(); break;
        case 'DWxServiceRequests': result = await dwxSharePointProvisioningService.provisionServiceRequestsList(); break;
        case 'DWxProductRequests': result = await dwxSharePointProvisioningService.provisionProductRequestsList(); break;
        case 'DWxClients': result = await dwxSharePointProvisioningService.provisionClientsList(); break;
        case 'DWxSpecialists': result = await dwxSharePointProvisioningService.provisionSpecialistsList(); break;
        case 'DWxManagers': result = await dwxSharePointProvisioningService.provisionManagersList(); break;
        case 'DWxTeamMembers': result = await dwxSharePointProvisioningService.provisionTeamMembersList(); break;
        case 'DWxAccountManagers': result = await dwxSharePointProvisioningService.provisionAccountManagersList(); break;
        case 'DWxAuditLog': result = await dwxSharePointProvisioningService.provisionAuditLogList(); break;
        case 'DWxSessionPrep': result = await dwxSharePointProvisioningService.provisionSessionPrepList(); break;
        case 'DWxLandingPageContent': result = await dwxSharePointProvisioningService.provisionLandingPageContentList(); break;
        case 'DWxKnowledgeBase': result = await dwxSharePointProvisioningService.provisionKnowledgeBaseList(); break;
        case 'DWxProposals': result = await dwxSharePointProvisioningService.provisionProposalsList(); break;
        case 'DWxSupportingDocuments': result = await dwxSharePointProvisioningService.provisionDocumentLibrary(); break;
        default: throw new Error(`Unknown list: ${listName}`);
      }
      setProvisionResults([{ list: listName, ...result }]);
      await checkListStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to provision ${listName}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  // ── Seed handlers ──────────────────────────────────────────────────────

  const runSeed = async (
    seedFn: () => Promise<{ results: Array<{ service?: string; name?: string; success: boolean; message: string }> }>,
    listName: string,
    setter: (n: number) => void,
  ) => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await seedFn();
      setSeedResults(results.map(r => ({ service: r.service || r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount(listName);
      setter(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to seed ${listName}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const seedAllData = async () => {
    setIsSeedingAll(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedAllSampleData(
        (step, current, total) => {
          setSeedAllProgress(`${step} (${current}/${total})`);
        }
      );
      setSeedResults(results.map(r => ({ service: r.list, success: r.success, message: r.message })));
      await checkListStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed all data');
    } finally {
      setIsSeedingAll(false);
      setSeedAllProgress('');
    }
  };

  // ── Tools handlers ─────────────────────────────────────────────────────

  const fixDefaultViews = async () => {
    setIsFixingViews(true);
    setError(null);
    setViewFixResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.configureAllDefaultViews(
        (listName, current, total) => {
          setViewFixProgress(`${listName} (${current}/${total})`);
        }
      );
      setViewFixResults(results.map(r => ({ list: r.list, success: r.success, message: r.message })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fix default views');
    } finally {
      setIsFixingViews(false);
      setViewFixProgress('');
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    checkListStatus();
  }, []);

  // ── Computed ───────────────────────────────────────────────────────────

  const getStatusForList = (listName: string): boolean | null => {
    if (listName === 'DWxSupportingDocuments') return docLibraryStatus?.exists ?? null;
    const status = listStatuses.find(s => s.list === listName);
    return status?.exists ?? null;
  };

  const allLists = [...listStatuses, docLibraryStatus].filter(Boolean) as ListStatus[];
  const expectedListCount = Object.keys(LIST_INFO).length;
  const readyCount = allLists.filter(l => l.exists).length;
  const allListsExist = readyCount === expectedListCount;
  const missingLists = allLists.filter(s => !s.exists);
  const anySeeding = isSeeding || isSeedingAll;

  const totalSeedItems = servicesCount + teamMembersCount + clientsCount + accountManagersCount +
    specialistsCount + managersCount + serviceRequestsCount + productRequestsCount + sessionPrepCount +
    landingPageContentCount + knowledgeBaseCount + proposalsCount;

  // Seed configs for individual seed cards
  const seedConfigs: SeedConfig[] = [
    { key: 'clients', listName: 'DWxClients', label: 'SA Clients', description: '20 South African enterprise clients', icon: <Building24Regular />, count: clientsCount, seedCount: '20', seedFn: () => dwxSharePointProvisioningService.seedClientsData() },
    { key: 'team', listName: 'DWxTeamMembers', label: 'Team Members', description: '6 team members', icon: <People24Regular />, count: teamMembersCount, seedCount: '6', seedFn: () => dwxSharePointProvisioningService.seedTeamMembersData() },
    { key: 'ams', listName: 'DWxAccountManagers', label: 'Account Managers', description: '5 AMs across SA regions', icon: <Briefcase24Regular />, count: accountManagersCount, seedCount: '5', seedFn: () => dwxSharePointProvisioningService.seedAccountManagersData() },
    { key: 'specialists', listName: 'DWxSpecialists', label: 'Specialists', description: '5 pre-sales specialists', icon: <People24Regular />, count: specialistsCount, seedCount: '5', seedFn: () => dwxSharePointProvisioningService.seedSpecialistsData() },
    { key: 'managers', listName: 'DWxManagers', label: 'Managers', description: '2 manager access entries', icon: <ShieldKeyhole24Regular />, count: managersCount, seedCount: '2', seedFn: () => dwxSharePointProvisioningService.seedManagersData() },
    { key: 'services', listName: 'DWxServices', label: 'Services', description: '7 core service offerings', icon: <Briefcase24Regular />, count: servicesCount, seedCount: '7', seedFn: () => dwxSharePointProvisioningService.seedServicesData() },
    { key: 'requests', listName: 'DWxServiceRequests', label: 'Service Requests', description: '14 requests across all funnel stages', icon: <DocumentBulletList24Regular />, count: serviceRequestsCount, seedCount: '14', seedFn: () => dwxSharePointProvisioningService.seedServiceRequestsData() },
    { key: 'products', listName: 'DWxProductRequests', label: 'Product Requests', description: '13 requests across all statuses', icon: <Apps24Regular />, count: productRequestsCount, seedCount: '13', seedFn: () => dwxSharePointProvisioningService.seedProductRequestsData() },
    { key: 'sessionprep', listName: 'DWxSessionPrep', label: 'Session Preps', description: '3 AI-powered session prep records', icon: <Sparkle24Regular />, count: sessionPrepCount, seedCount: '3', seedFn: () => dwxSharePointProvisioningService.seedSessionPrepData(), dependsOn: 'DWxServiceRequests' },
    { key: 'kb', listName: 'DWxKnowledgeBase', label: 'Knowledge Base', description: '50 entries (FAQ, Glossary, Articles)', icon: <BookOpen24Regular />, count: knowledgeBaseCount, seedCount: '50', seedFn: () => dwxSharePointProvisioningService.seedKnowledgeBaseData() },
  ];

  const countMap: Record<string, number> = {
    DWxServices: servicesCount,
    DWxClients: clientsCount,
    DWxSpecialists: specialistsCount,
    DWxAccountManagers: accountManagersCount,
    DWxTeamMembers: teamMembersCount,
    DWxManagers: managersCount,
    DWxServiceRequests: serviceRequestsCount,
    DWxProductRequests: productRequestsCount,
    DWxSessionPrep: sessionPrepCount,
    DWxLandingPageContent: landingPageContentCount,
    DWxKnowledgeBase: knowledgeBaseCount,
    DWxProposals: proposalsCount,
  };

  const setterMap: Record<string, (n: number) => void> = {
    DWxServices: setServicesCount,
    DWxClients: setClientsCount,
    DWxSpecialists: setSpecialistsCount,
    DWxAccountManagers: setAccountManagersCount,
    DWxTeamMembers: setTeamMembersCount,
    DWxManagers: setManagersCount,
    DWxServiceRequests: setServiceRequestsCount,
    DWxProductRequests: setProductRequestsCount,
    DWxSessionPrep: setSessionPrepCount,
    DWxLandingPageContent: setLandingPageContentCount,
    DWxKnowledgeBase: setKnowledgeBaseCount,
    DWxProposals: setProposalsCount,
  };

  // ── Results renderer ───────────────────────────────────────────────────

  const renderResults = (results: ProvisionResult[] | null, title: string) => {
    if (!results || results.length === 0) return null;
    return (
      <div className={styles.resultsContainer}>
        <Text weight="semibold" size={300} block style={{ marginBottom: '6px' }}>{title}</Text>
        {results.map((result, idx) => (
          <div key={idx} className={styles.resultItem}>
            {result.success ? (
              <Checkmark20Regular className={styles.successIcon} />
            ) : (
              <Dismiss20Regular className={styles.errorIcon} />
            )}
            <Text size={200}>
              <strong>{result.list || result.service}:</strong> {result.message}
            </Text>
          </div>
        ))}
      </div>
    );
  };

  // ── Tab: Overview ──────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className={styles.tabContent}>
      {/* Status summary */}
      <div className={styles.summaryRow}>
        {isChecking ? (
          <Spinner size="tiny" label="Checking status..." />
        ) : allListsExist ? (
          <Badge appearance="filled" color="success" size="large">All {expectedListCount} lists provisioned</Badge>
        ) : (
          <>
            <Badge appearance="filled" color="warning" size="large">{missingLists.length} list{missingLists.length !== 1 ? 's' : ''} missing</Badge>
            <Button
              size="small"
              appearance="primary"
              icon={<Database24Regular />}
              onClick={provisionAllLists}
              disabled={isProvisioning}
              style={{ backgroundColor: DW_COLORS.teal }}
            >
              {isProvisioning ? <><Spinner size="tiny" /> Provisioning...</> : `Create Missing (${missingLists.length})`}
            </Button>
          </>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <Button size="small" appearance="subtle" icon={<ArrowSync24Regular />} onClick={checkListStatus} disabled={isChecking}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ marginTop: tokens.spacingVerticalM }}>
        <Text size={400} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
          Data Counts
        </Text>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
            <Text className={styles.statValue}>{readyCount}/{expectedListCount}</Text>
            <Text className={styles.statLabel}>Lists Ready</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{servicesCount}</Text>
            <Text className={styles.statLabel}>Services</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{clientsCount}</Text>
            <Text className={styles.statLabel}>Clients</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{specialistsCount}</Text>
            <Text className={styles.statLabel}>Specialists</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{accountManagersCount}</Text>
            <Text className={styles.statLabel}>Account Mgrs</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{teamMembersCount}</Text>
            <Text className={styles.statLabel}>Team Members</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{managersCount}</Text>
            <Text className={styles.statLabel}>Managers</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{serviceRequestsCount}</Text>
            <Text className={styles.statLabel}>Service Reqs</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{productRequestsCount}</Text>
            <Text className={styles.statLabel}>Product Reqs</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{sessionPrepCount}</Text>
            <Text className={styles.statLabel}>Session Preps</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{landingPageContentCount}</Text>
            <Text className={styles.statLabel}>LP Content</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{knowledgeBaseCount}</Text>
            <Text className={styles.statLabel}>KB Entries</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{proposalsCount}</Text>
            <Text className={styles.statLabel}>Proposals</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{totalSeedItems}</Text>
            <Text className={styles.statLabel}>Total Items</Text>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Tab: Lists ─────────────────────────────────────────────────────────

  const renderLists = () => (
    <div className={styles.tabContent}>
      {/* Quick actions */}
      <div className={styles.actionsRow} style={{ marginBottom: tokens.spacingVerticalM }}>
        <Button
          size="small"
          appearance="subtle"
          icon={<ArrowSync24Regular />}
          onClick={checkListStatus}
          disabled={isChecking}
        >
          Refresh
        </Button>
        {!allListsExist && missingLists.length > 0 && (
          <Button
            size="small"
            appearance="primary"
            icon={<Database24Regular />}
            onClick={provisionAllLists}
            disabled={isProvisioning}
            style={{ backgroundColor: DW_COLORS.teal }}
          >
            {isProvisioning ? 'Provisioning...' : `Create Missing (${missingLists.length})`}
          </Button>
        )}
        <Button
          size="small"
          appearance="subtle"
          icon={<Database24Regular />}
          onClick={provisionAllLists}
          disabled={isProvisioning}
        >
          Re-provision All
        </Button>
      </div>

      {/* List grid */}
      <div className={styles.listGrid}>
        {Object.keys(LIST_INFO).map(listName => {
          const exists = getStatusForList(listName);
          const info = LIST_INFO[listName];
          const count = countMap[listName];
          return (
            <div key={listName} className={styles.listRow}>
              <span className={styles.listIcon}>{info.icon}</span>
              <div className={styles.listInfo}>
                <Text className={styles.listName} block>{listName}</Text>
                <Text className={styles.listDesc} block>
                  {info.description}
                  {count !== undefined && count > 0 ? ` (${count} items)` : ''}
                </Text>
              </div>
              {isChecking ? (
                <Spinner size="tiny" />
              ) : exists === null ? (
                <Badge appearance="outline" color="informative" size="small">?</Badge>
              ) : exists ? (
                <Badge appearance="filled" color="success" size="small" icon={<Checkmark20Regular />}>Ready</Badge>
              ) : (
                <Badge appearance="filled" color="warning" size="small" icon={<Dismiss20Regular />}>Missing</Badge>
              )}
              <Button
                size="small"
                appearance={exists === false ? 'outline' : 'subtle'}
                icon={exists === false ? <Add24Regular /> : <ArrowSync24Regular />}
                onClick={() => provisionSingleList(listName)}
                disabled={isProvisioning}
              >
                {exists === false ? 'Create' : 'Re-provision'}
              </Button>
            </div>
          );
        })}
      </div>

      {renderResults(provisionResults, 'Provisioning Results')}
    </div>
  );

  // ── Tab: Seed Data ─────────────────────────────────────────────────────

  const renderSeedData = () => (
    <div className={styles.tabContent}>
      {/* Seed All hero */}
      <div className={styles.seedAllHero}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
          <Rocket24Regular style={{ color: '#1e6b7b' }} />
          <Text size={400} weight="semibold">Seed All Sample Data</Text>
        </div>
        <Text className={styles.description} style={{ marginTop: 0 }}>
          Populate all lists with realistic South African enterprise data in dependency order.
          Clients, Team Members, AMs, Specialists, Managers, Services, Requests, Products, Session Preps, and Knowledge Base.
        </Text>
        {isSeedingAll && seedAllProgress && (
          <MessageBar intent="info">
            <MessageBarBody>{seedAllProgress}</MessageBarBody>
          </MessageBar>
        )}
        <div className={styles.actionsRow}>
          <Button
            appearance="primary"
            icon={<Rocket24Regular />}
            onClick={seedAllData}
            disabled={anySeeding || !allListsExist}
            style={{ backgroundColor: DW_COLORS.teal }}
          >
            {isSeedingAll ? (
              <><Spinner size="tiny" style={{ marginRight: '6px' }} />{seedAllProgress || 'Seeding...'}</>
            ) : totalSeedItems > 0 ? (
              `Seed All (${totalSeedItems} items exist)`
            ) : (
              'Seed All Sample Data'
            )}
          </Button>
          {!allListsExist && (
            <Text className={styles.infoText}>All lists must be provisioned first</Text>
          )}
        </div>
      </div>

      <Divider style={{ margin: `${tokens.spacingVerticalM} 0` }} />

      {/* Individual seed cards */}
      <Text size={400} weight="semibold" block style={{ marginBottom: tokens.spacingVerticalS }}>
        Individual Seed Operations
      </Text>
      <div className={styles.seedGrid}>
        {seedConfigs.map(cfg => {
          const exists = getStatusForList(cfg.listName);
          const hasData = cfg.count > 0;
          const depMet = !cfg.dependsOn || (countMap[cfg.dependsOn] ?? 0) > 0;

          return (
            <div key={cfg.key} className={styles.seedCard}>
              <span className={styles.seedIcon}>{cfg.icon}</span>
              <div className={styles.seedInfo}>
                <Text className={styles.seedLabel} block>{cfg.label}</Text>
                <Text className={styles.seedDesc} block>{cfg.description}</Text>
                {!exists && <Text className={styles.infoText} block>List not provisioned</Text>}
                {exists && !depMet && cfg.dependsOn && <Text className={styles.infoText} block>Seed {cfg.dependsOn} first</Text>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {hasData && (
                  <Badge appearance="tint" color="success" className={styles.seedBadge}>{cfg.count} items</Badge>
                )}
                <Button
                  size="small"
                  appearance="outline"
                  icon={<Add24Regular />}
                  onClick={() => runSeed(cfg.seedFn, cfg.listName, setterMap[cfg.listName])}
                  disabled={!exists || anySeeding || !depMet}
                  title={hasData ? 'Add more seed data (existing data is kept)' : `Seed ${cfg.seedCount} items`}
                >
                  {hasData ? 'Reseed' : `Seed ${cfg.seedCount}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {renderResults(seedResults, 'Seed Results')}
    </div>
  );

  // ── Tab: Tools ─────────────────────────────────────────────────────────

  const renderTools = () => (
    <div className={styles.tabContent}>
      <div className={styles.toolsGrid}>
        {/* Fix Default Views */}
        <Card className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <Eye24Regular className={styles.toolIcon} />
            <Text size={400} weight="semibold">Fix Default Views</Text>
          </div>
          <Text className={styles.description} style={{ marginTop: 0 }}>
            Add all custom columns to each list's default SharePoint view. Run this after provisioning if columns aren't visible in "All Items" view.
          </Text>
          {isFixingViews && viewFixProgress && (
            <MessageBar intent="info">
              <MessageBarBody>Configuring: {viewFixProgress}</MessageBarBody>
            </MessageBar>
          )}
          <Button
            appearance="outline"
            icon={<Eye24Regular />}
            onClick={fixDefaultViews}
            disabled={isFixingViews || isProvisioning || isChecking}
          >
            {isFixingViews ? (
              <><Spinner size="tiny" style={{ marginRight: '6px' }} />{viewFixProgress || 'Fixing...'}</>
            ) : (
              'Fix Default Views'
            )}
          </Button>
          {renderResults(viewFixResults, 'View Configuration Results')}
        </Card>

        {/* Provision All */}
        <Card className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <Database24Regular className={styles.toolIcon} />
            <Text size={400} weight="semibold">Provision All Lists</Text>
          </div>
          <Text className={styles.description} style={{ marginTop: 0 }}>
            Create or re-provision all {expectedListCount} SharePoint lists and the document library. Safe to run multiple times.
          </Text>
          <Button
            appearance="outline"
            icon={<Database24Regular />}
            onClick={provisionAllLists}
            disabled={isProvisioning || isChecking}
          >
            {isProvisioning ? (
              <><Spinner size="tiny" style={{ marginRight: '6px' }} />Provisioning...</>
            ) : (
              'Provision All Lists'
            )}
          </Button>
        </Card>

        {/* Refresh Status */}
        <Card className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <ArrowSync24Regular className={styles.toolIcon} />
            <Text size={400} weight="semibold">Refresh Status</Text>
          </div>
          <Text className={styles.description} style={{ marginTop: 0 }}>
            Re-check which lists exist and how many items each contains. Updates all counts on the Overview tab.
          </Text>
          <Button
            appearance="outline"
            icon={<ArrowSync24Regular />}
            onClick={checkListStatus}
            disabled={isChecking}
          >
            {isChecking ? (
              <><Spinner size="tiny" style={{ marginRight: '6px' }} />Checking...</>
            ) : (
              'Refresh Status'
            )}
          </Button>
        </Card>

        {/* Help / About */}
        <Card className={styles.toolCard}>
          <div className={styles.toolHeader}>
            <Info24Regular className={styles.toolIcon} />
            <Text size={400} weight="semibold">About DWx Lists</Text>
          </div>
          <ul className={styles.helpList}>
            <li><strong>DWxServices</strong> - Service catalog (what DW offers)</li>
            <li><strong>DWxServiceRequests</strong> - Sales funnel (leads, deals)</li>
            <li><strong>DWxProductRequests</strong> - Product demo requests</li>
            <li><strong>DWxClients</strong> - Client organizations</li>
            <li><strong>DWxSpecialists</strong> - Pre-sales team</li>
            <li><strong>DWxManagers</strong> - Admin access control</li>
            <li><strong>DWxSessionPrep</strong> - AI session preparation</li>
            <li><strong>DWxLandingPageContent</strong> - Landing page CMS</li>
            <li><strong>DWxKnowledgeBase</strong> - FAQ, Glossary, Articles</li>
            <li><strong>DWxProposals</strong> - Proposal management</li>
            <li><strong>DWxAuditLog</strong> - Audit trail</li>
            <li><strong>DWxSupportingDocuments</strong> - Document library</li>
          </ul>
        </Card>
      </div>
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Database24Regular className={styles.headerIcon} />
        <div>
          <Text size={500} weight="semibold">DWx SharePoint Provisioning</Text>
          <Text className={styles.description} block>
            Create SharePoint lists, seed sample data, and configure views
          </Text>
        </div>
      </div>

      {/* Error */}
      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Tabs */}
      <TabList
        selectedValue={activeTab}
        onTabSelect={(_, data) => setActiveTab(data.value as ProvisionTab)}
      >
        <Tab value="overview">Overview</Tab>
        <Tab value="lists">Lists ({readyCount}/{expectedListCount})</Tab>
        <Tab value="seed-data">Seed Data</Tab>
        <Tab value="tools">Tools</Tab>
      </TabList>

      {/* Tab content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'lists' && renderLists()}
      {activeTab === 'seed-data' && renderSeedData()}
      {activeTab === 'tools' && renderTools()}
    </div>
  );
};

export default DWxSharePointProvisioning;
