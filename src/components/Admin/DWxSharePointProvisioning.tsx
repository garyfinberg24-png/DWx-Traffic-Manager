/**
 * DWx Traffic Manager - SharePoint Provisioning Component
 * Admin UI for provisioning DWx SharePoint lists and seeding sample data
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Text,
  Button,
  makeStyles,
  tokens,
  Spinner,
  Badge,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from '@fluentui/react-components';
import {
  Database24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
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
} from '@fluentui/react-icons';
import { dwxSharePointProvisioningService } from '../../services/DWxSharePointProvisioningService';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  headerIcon: {
    color: '#1e6b7b', // DW teal
    fontSize: '24px',
  },
  description: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalS,
  },
  listGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  listCard: {
    padding: tokens.spacingHorizontalM,
    borderLeft: '4px solid #1e6b7b',
  },
  listCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
  },
  listName: {
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  listIcon: {
    color: '#1e6b7b',
  },
  listDescription: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalS,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
    flexWrap: 'wrap',
  },
  resultsContainer: {
    marginTop: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: '8px',
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXS,
  },
  successIcon: {
    color: tokens.colorPaletteGreenForeground1,
  },
  errorIcon: {
    color: tokens.colorPaletteRedForeground1,
  },
  seedSection: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    backgroundColor: '#f0f7f8', // Light teal background
    borderRadius: '8px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  sectionIcon: {
    color: '#1e6b7b',
  },
  statsContainer: {
    display: 'flex',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalM,
    flexWrap: 'wrap',
  },
  statCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: '8px',
    minWidth: '100px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e6b7b',
  },
  statLabel: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  infoText: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    marginTop: tokens.spacingVerticalXS,
  },
});

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

const LIST_INFO: Record<string, { description: string; icon: React.ReactElement }> = {
  DWxServices: {
    description: 'Service catalog with DW offerings (Power Platform, SPFx, Migrations, etc.)',
    icon: <Briefcase24Regular />,
  },
  DWxServiceRequests: {
    description: 'Sales funnel tracking - leads, discovery sessions, proposals, wins/losses',
    icon: <DocumentBulletList24Regular />,
  },
  DWxProductRequests: {
    description: 'Product demo and deployment requests for DWx Apps, Web Parts, and Agents',
    icon: <Apps24Regular />,
  },
  DWxClients: {
    description: 'Client master data with engagement history and contract status',
    icon: <Building24Regular />,
  },
  DWxSpecialists: {
    description: 'Pre-sales team members with roles, specializations, and availability',
    icon: <People24Regular />,
  },
  DWxManagers: {
    description: 'Manager access control for Dashboard, Approvals, and Admin',
    icon: <ShieldKeyhole24Regular />,
  },
  DWxTeamMembers: {
    description: 'Internal team members for specialist assignments',
    icon: <People24Regular />,
  },
  DWxAccountManagers: {
    description: 'Account managers who submit service requests',
    icon: <Briefcase24Regular />,
  },
  DWxAuditLog: {
    description: 'Audit trail for all actions and stage changes',
    icon: <ClipboardTask24Regular />,
  },
  DWxSessionPrep: {
    description: 'AI-powered session preparation for client discovery meetings',
    icon: <Sparkle24Regular />,
  },
  DWxLandingPageContent: {
    description: 'Admin-manageable content sections for the landing page',
    icon: <Home24Regular />,
  },
  DWxKnowledgeBase: {
    description: 'FAQ, Glossary, and Articles for Account Managers',
    icon: <BookOpen24Regular />,
  },
  DWxProposals: {
    description: 'Proposal management with AI content, internal approval, and client distribution',
    icon: <DocumentText24Regular />,
  },
  DWxSupportingDocuments: {
    description: 'Document library for RFPs, requirements, and proposals',
    icon: <FolderOpen24Regular />,
  },
};

export const DWxSharePointProvisioning: React.FC = () => {
  const styles = useStyles();
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
  const [servicesCount, setServicesCount] = useState<number>(0);
  const [teamMembersCount, setTeamMembersCount] = useState<number>(0);
  const [clientsCount, setClientsCount] = useState<number>(0);
  const [accountManagersCount, setAccountManagersCount] = useState<number>(0);
  const [specialistsCount, setSpecialistsCount] = useState<number>(0);
  const [managersCount, setManagersCount] = useState<number>(0);
  const [serviceRequestsCount, setServiceRequestsCount] = useState<number>(0);
  const [productRequestsCount, setProductRequestsCount] = useState<number>(0);
  const [sessionPrepCount, setSessionPrepCount] = useState<number>(0);
  const [landingPageContentCount, setLandingPageContentCount] = useState<number>(0);
  const [knowledgeBaseCount, setKnowledgeBaseCount] = useState<number>(0);
  const [proposalsCount, setProposalsCount] = useState<number>(0);

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

      // Check existing lists and get counts
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
        case 'DWxServices':
          result = await dwxSharePointProvisioningService.provisionServicesList();
          break;
        case 'DWxServiceRequests':
          result = await dwxSharePointProvisioningService.provisionServiceRequestsList();
          break;
        case 'DWxProductRequests':
          result = await dwxSharePointProvisioningService.provisionProductRequestsList();
          break;
        case 'DWxClients':
          result = await dwxSharePointProvisioningService.provisionClientsList();
          break;
        case 'DWxSpecialists':
          result = await dwxSharePointProvisioningService.provisionSpecialistsList();
          break;
        case 'DWxManagers':
          result = await dwxSharePointProvisioningService.provisionManagersList();
          break;
        case 'DWxTeamMembers':
          result = await dwxSharePointProvisioningService.provisionTeamMembersList();
          break;
        case 'DWxAccountManagers':
          result = await dwxSharePointProvisioningService.provisionAccountManagersList();
          break;
        case 'DWxAuditLog':
          result = await dwxSharePointProvisioningService.provisionAuditLogList();
          break;
        case 'DWxSessionPrep':
          result = await dwxSharePointProvisioningService.provisionSessionPrepList();
          break;
        case 'DWxLandingPageContent':
          result = await dwxSharePointProvisioningService.provisionLandingPageContentList();
          break;
        case 'DWxKnowledgeBase':
          result = await dwxSharePointProvisioningService.provisionKnowledgeBaseList();
          break;
        case 'DWxSupportingDocuments':
          result = await dwxSharePointProvisioningService.provisionDocumentLibrary();
          break;
        default:
          throw new Error(`Unknown list: ${listName}`);
      }
      setProvisionResults([{ list: listName, ...result }]);
      await checkListStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to provision ${listName}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  // Individual seed handlers
  const seedServices = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedServicesData();
      setSeedResults(results.map(r => ({ service: r.service, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxServices');
      setServicesCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed services');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedTeamMembers = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedTeamMembersData();
      setSeedResults(results.map(r => ({ service: r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxTeamMembers');
      setTeamMembersCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed team members');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedClients = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedClientsData();
      setSeedResults(results.map(r => ({ service: r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxClients');
      setClientsCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed clients');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedAccountManagers = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedAccountManagersData();
      setSeedResults(results.map(r => ({ service: r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxAccountManagers');
      setAccountManagersCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed account managers');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedSpecialists = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedSpecialistsData();
      setSeedResults(results.map(r => ({ service: r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxSpecialists');
      setSpecialistsCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed specialists');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedManagers = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedManagersData();
      setSeedResults(results.map(r => ({ service: r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxManagers');
      setManagersCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed managers');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedServiceRequests = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedServiceRequestsData();
      setSeedResults(results.map(r => ({ service: r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxServiceRequests');
      setServiceRequestsCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed service requests');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedProductRequests = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedProductRequestsData();
      setSeedResults(results.map(r => ({ service: r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxProductRequests');
      setProductRequestsCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed product requests');
    } finally {
      setIsSeeding(false);
    }
  };

  const seedSessionPrep = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedSessionPrepData();
      setSeedResults(results.map(r => ({ service: r.name, success: r.success, message: r.message })));
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxSessionPrep');
      setSessionPrepCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed session prep');
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
      setSeedResults(results.map(r => ({
        service: r.list,
        success: r.success,
        message: r.message,
      })));
      await checkListStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed all data');
    } finally {
      setIsSeedingAll(false);
      setSeedAllProgress('');
    }
  };

  useEffect(() => {
    checkListStatus();
  }, []);

  const getStatusForList = (listName: string): boolean | null => {
    if (listName === 'DWxSupportingDocuments') {
      return docLibraryStatus?.exists ?? null;
    }
    const status = listStatuses.find((s) => s.list === listName);
    return status?.exists ?? null;
  };

  const allLists = [...listStatuses, docLibraryStatus].filter(Boolean) as ListStatus[];
  const expectedListCount = Object.keys(LIST_INFO).length;
  const allListsExist = allLists.length === expectedListCount && allLists.every((s) => s.exists);
  const missingLists = allLists.filter((s) => !s.exists);
  const servicesExists = getStatusForList('DWxServices');
  const teamMembersExists = getStatusForList('DWxTeamMembers');
  const clientsExists = getStatusForList('DWxClients');
  const accountManagersExists = getStatusForList('DWxAccountManagers');
  const specialistsExists = getStatusForList('DWxSpecialists');
  const managersExists = getStatusForList('DWxManagers');
  const serviceRequestsExists = getStatusForList('DWxServiceRequests');
  const productRequestsExists = getStatusForList('DWxProductRequests');
  const sessionPrepExists = getStatusForList('DWxSessionPrep');
  const anySeeding = isSeeding || isSeedingAll;

  const totalSeedItems = servicesCount + teamMembersCount + clientsCount + accountManagersCount +
    specialistsCount + managersCount + serviceRequestsCount + productRequestsCount + sessionPrepCount +
    landingPageContentCount + knowledgeBaseCount + proposalsCount;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Database24Regular className={styles.headerIcon} />
        <div>
          <Text size={500} weight="semibold">
            DWx SharePoint Provisioning
          </Text>
          <Text className={styles.description} block>
            Create and configure the SharePoint lists required for DWx Traffic Manager
          </Text>
        </div>
      </div>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <Text className={styles.statValue}>{allLists.filter(l => l.exists).length}/{expectedListCount}</Text>
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
          <Text className={styles.statValue}>{serviceRequestsCount}</Text>
          <Text className={styles.statLabel}>Requests</Text>
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
      </div>

      {/* List Grid */}
      <div className={styles.listGrid}>
        {Object.keys(LIST_INFO).map((listName) => {
          const exists = getStatusForList(listName);
          const info = LIST_INFO[listName];
          return (
            <Card key={listName} className={styles.listCard}>
              <div className={styles.listCardHeader}>
                <div className={styles.listName}>
                  <span className={styles.listIcon}>{info.icon}</span>
                  <Text>{listName}</Text>
                </div>
                {isChecking ? (
                  <Spinner size="tiny" />
                ) : exists === null ? (
                  <Badge appearance="outline" color="informative">
                    Unknown
                  </Badge>
                ) : exists ? (
                  <Badge
                    appearance="filled"
                    color="success"
                    icon={<Checkmark24Regular />}
                    className={styles.statusBadge}
                  >
                    Ready
                  </Badge>
                ) : (
                  <Badge
                    appearance="filled"
                    color="warning"
                    icon={<Dismiss24Regular />}
                    className={styles.statusBadge}
                  >
                    Missing
                  </Badge>
                )}
              </div>
              <Text className={styles.listDescription}>
                {info.description}
              </Text>
              <Button
                size="small"
                appearance={exists === false ? 'outline' : 'subtle'}
                icon={exists === false ? <Add24Regular /> : <ArrowSync24Regular />}
                onClick={() => provisionSingleList(listName)}
                disabled={isProvisioning}
              >
                {exists === false ? 'Create' : 'Re-provision'}
              </Button>
            </Card>
          );
        })}
      </div>

      <Divider />

      {/* Actions */}
      <div className={styles.actions}>
        <Button
          appearance="secondary"
          icon={<ArrowSync24Regular />}
          onClick={checkListStatus}
          disabled={isChecking || isProvisioning}
        >
          {isChecking ? 'Checking...' : 'Refresh Status'}
        </Button>

        {!allListsExist && missingLists.length > 0 && (
          <Button
            appearance="primary"
            icon={<Database24Regular />}
            onClick={provisionAllLists}
            disabled={isProvisioning || isChecking}
            style={{ backgroundColor: '#1e6b7b' }}
          >
            {isProvisioning ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Provisioning...
              </>
            ) : (
              `Create All Missing (${missingLists.length})`
            )}
          </Button>
        )}

        <Button
          appearance="subtle"
          icon={<Database24Regular />}
          onClick={provisionAllLists}
          disabled={isProvisioning || isChecking}
        >
          {isProvisioning ? 'Provisioning...' : 'Provision All Lists'}
        </Button>

        {allListsExist && (
          <Badge appearance="filled" color="success" size="large">
            All lists are provisioned
          </Badge>
        )}
      </div>

      {/* Provision Results */}
      {provisionResults && provisionResults.length > 0 && (
        <div className={styles.resultsContainer}>
          <Text weight="semibold" block style={{ marginBottom: '8px' }}>
            Provisioning Results
          </Text>
          {provisionResults.map((result, idx) => (
            <div key={idx} className={styles.resultItem}>
              {result.success ? (
                <Checkmark24Regular className={styles.successIcon} />
              ) : (
                <Dismiss24Regular className={styles.errorIcon} />
              )}
              <Text>
                <strong>{result.list}:</strong> {result.message}
              </Text>
            </div>
          ))}
        </div>
      )}

      <Divider />

      {/* ===== SEED ALL SAMPLE DATA ===== */}
      <div className={styles.seedSection} style={{ borderLeft: '4px solid #1e6b7b' }}>
        <div className={styles.sectionHeader}>
          <Rocket24Regular className={styles.sectionIcon} />
          <Text size={500} weight="semibold">
            Seed All Sample Data
          </Text>
        </div>
        <Text className={styles.description}>
          Populate all lists with realistic South African enterprise sample data in dependency order.
          Includes 12 SA companies, 14 service requests across all funnel stages, 8 product requests,
          5 specialists, and AI-powered session prep records.
        </Text>
        <Text className={styles.infoText} block>
          Order: Clients &rarr; Team Members &rarr; Account Managers &rarr; Specialists &rarr; Managers &rarr; Services &rarr; Service Requests &rarr; Product Requests &rarr; Session Prep
        </Text>

        {isSeedingAll && seedAllProgress && (
          <MessageBar intent="info" style={{ marginTop: '8px' }}>
            <MessageBarBody>{seedAllProgress}</MessageBarBody>
          </MessageBar>
        )}

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button
            appearance="primary"
            icon={<Rocket24Regular />}
            onClick={seedAllData}
            disabled={anySeeding || !allListsExist}
            style={{ backgroundColor: '#1e6b7b' }}
          >
            {isSeedingAll ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                {seedAllProgress || 'Seeding...'}
              </>
            ) : totalSeedItems > 0 ? (
              `Seed All Sample Data (${totalSeedItems} items exist)`
            ) : (
              'Seed All Sample Data'
            )}
          </Button>

          {!allListsExist && (
            <Text className={styles.infoText} block style={{ marginTop: '4px' }}>
              All lists must be provisioned before seeding sample data
            </Text>
          )}
        </div>
      </div>

      <Divider />

      {/* ===== INDIVIDUAL SEED SECTIONS ===== */}

      {/* Seed Services */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <Briefcase24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Service Catalog
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxServices with 7 core service offerings (Power Platform, SPFx, Migrations, M365, Copilot, Viva, Training)
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedServices} disabled={!servicesExists || anySeeding || servicesCount > 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : servicesCount > 0 ? (`Services Already Seeded (${servicesCount})`) : ('Seed 7 Default Services')}
          </Button>
          {!servicesExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxServices list first</Text>}
        </div>
      </div>

      {/* Seed Clients */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <Building24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed SA Clients
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxClients with 12 South African enterprise clients (Nedbank, Discovery, Sasol, MTN, Woolworths, Sanlam, Capitec, Shoprite, Old Mutual, Anglo American, Standard Bank, Pick n Pay)
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedClients} disabled={!clientsExists || anySeeding || clientsCount > 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : clientsCount > 0 ? (`Clients Already Seeded (${clientsCount})`) : ('Seed 12 SA Clients')}
          </Button>
          {!clientsExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxClients list first</Text>}
        </div>
      </div>

      {/* Seed Team Members */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <People24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Team Members
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxTeamMembers with 6 team members (Solution Architects, Consultants, Specialists)
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedTeamMembers} disabled={!teamMembersExists || anySeeding || teamMembersCount > 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : teamMembersCount > 0 ? (`Team Members Already Seeded (${teamMembersCount})`) : ('Seed 6 Team Members')}
          </Button>
          {!teamMembersExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxTeamMembers list first</Text>}
        </div>
      </div>

      {/* Seed Account Managers */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <Briefcase24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Account Managers
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxAccountManagers with 5 account managers across SA regions
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedAccountManagers} disabled={!accountManagersExists || anySeeding || accountManagersCount > 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : accountManagersCount > 0 ? (`Account Managers Already Seeded (${accountManagersCount})`) : ('Seed 5 Account Managers')}
          </Button>
          {!accountManagersExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxAccountManagers list first</Text>}
        </div>
      </div>

      {/* Seed Specialists */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <People24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Specialists
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxSpecialists with 5 pre-sales specialists with roles, specializations, and capacity
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedSpecialists} disabled={!specialistsExists || anySeeding || specialistsCount > 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : specialistsCount > 0 ? (`Specialists Already Seeded (${specialistsCount})`) : ('Seed 5 Specialists')}
          </Button>
          {!specialistsExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxSpecialists list first</Text>}
        </div>
      </div>

      {/* Seed Managers */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <ShieldKeyhole24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Managers
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxManagers with 2 manager access entries (Gary Finberg, James Peterson)
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedManagers} disabled={!managersExists || anySeeding || managersCount > 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : managersCount > 0 ? (`Managers Already Seeded (${managersCount})`) : ('Seed 2 Managers')}
          </Button>
          {!managersExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxManagers list first</Text>}
        </div>
      </div>

      {/* Seed Service Requests */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <DocumentBulletList24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Service Requests
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxServiceRequests with 14 requests across all 7 funnel stages (Lead, Qualified, Discovery, Proposal, Negotiation, Won, Lost)
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedServiceRequests} disabled={!serviceRequestsExists || anySeeding || serviceRequestsCount > 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : serviceRequestsCount > 0 ? (`Service Requests Already Seeded (${serviceRequestsCount})`) : ('Seed 14 Service Requests')}
          </Button>
          {!serviceRequestsExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxServiceRequests list first</Text>}
        </div>
      </div>

      {/* Seed Product Requests */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <Apps24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Product Requests
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxProductRequests with 8 requests across all 5 statuses (Pending Review, Awaiting Approval, Confirmed, Completed, Cancelled)
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedProductRequests} disabled={!productRequestsExists || anySeeding || productRequestsCount > 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : productRequestsCount > 0 ? (`Product Requests Already Seeded (${productRequestsCount})`) : ('Seed 8 Product Requests')}
          </Button>
          {!productRequestsExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxProductRequests list first</Text>}
        </div>
      </div>

      {/* Seed Session Prep */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <Sparkle24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Session Preparations
          </Text>
        </div>
        <Text className={styles.description}>
          Populate DWxSessionPrep with 3 AI-powered session prep records (Ready, In Progress, Not Started)
        </Text>
        <Text className={styles.infoText} block>
          Requires service requests to be seeded first (links to Discovery-stage requests)
        </Text>
        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button appearance="outline" icon={<Add24Regular />} onClick={seedSessionPrep} disabled={!sessionPrepExists || anySeeding || sessionPrepCount > 0 || serviceRequestsCount === 0}>
            {anySeeding && !isSeedingAll ? (<><Spinner size="tiny" style={{ marginRight: '8px' }} />Seeding...</>) : sessionPrepCount > 0 ? (`Session Preps Already Seeded (${sessionPrepCount})`) : ('Seed 3 Session Preps')}
          </Button>
          {!sessionPrepExists && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Create the DWxSessionPrep list first</Text>}
          {sessionPrepExists && serviceRequestsCount === 0 && <Text className={styles.infoText} block style={{ marginTop: '4px' }}>Seed service requests first (session preps link to Discovery requests)</Text>}
        </div>
      </div>

      {/* Seed Results (shared across all seed operations) */}
      {seedResults && seedResults.length > 0 && (
        <div className={styles.resultsContainer}>
          <Text weight="semibold" block style={{ marginBottom: '8px' }}>
            Seed Results
          </Text>
          {seedResults.map((result, idx) => (
            <div key={idx} className={styles.resultItem}>
              {result.success ? (
                <Checkmark24Regular className={styles.successIcon} />
              ) : (
                <Dismiss24Regular className={styles.errorIcon} />
              )}
              <Text>
                <strong>{result.service}:</strong> {result.message}
              </Text>
            </div>
          ))}
        </div>
      )}

      {/* Help Section */}
      <div style={{ marginTop: tokens.spacingVerticalM }}>
        <div className={styles.sectionHeader}>
          <Info24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            About DWx Lists
          </Text>
        </div>
        <Text className={styles.infoText} block>
          These SharePoint lists store all data for the DWx Traffic Manager application:
        </Text>
        <ul style={{ fontSize: '12px', color: tokens.colorNeutralForeground3, paddingLeft: '20px', margin: '8px 0' }}>
          <li><strong>DWxServices</strong> - The service catalog (what DW offers)</li>
          <li><strong>DWxServiceRequests</strong> - The sales funnel (leads, opportunities, deals)</li>
          <li><strong>DWxProductRequests</strong> - Product demo and deployment requests for DWx Apps</li>
          <li><strong>DWxClients</strong> - Client organizations and contacts</li>
          <li><strong>DWxSpecialists</strong> - Pre-sales team members who handle discovery sessions</li>
          <li><strong>DWxManagers</strong> - Users with admin and dashboard access</li>
          <li><strong>DWxSessionPrep</strong> - AI-powered session preparation for meetings</li>
          <li><strong>DWxLandingPageContent</strong> - Admin-manageable landing page content sections</li>
          <li><strong>DWxKnowledgeBase</strong> - FAQ, Glossary, and Articles for Account Managers</li>
          <li><strong>DWxAuditLog</strong> - Audit trail for compliance and tracking</li>
          <li><strong>DWxSupportingDocuments</strong> - Document library for RFPs and proposals</li>
        </ul>
      </div>
    </div>
  );
};

export default DWxSharePointProvisioning;
