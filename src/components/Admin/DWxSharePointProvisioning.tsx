/**
 * DWx Traffic Manager - SharePoint Provisioning Component
 * Admin UI for provisioning DWx SharePoint lists
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
  DWxClients: {
    description: 'Client master data with engagement history and contract status',
    icon: <Building24Regular />,
  },
  DWxSpecialists: {
    description: 'Pre-sales team members with roles, specializations, and availability',
    icon: <People24Regular />,
  },
  DWxAuditLog: {
    description: 'Audit trail for all actions and stage changes',
    icon: <ClipboardTask24Regular />,
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
  const [provisionResults, setProvisionResults] = useState<ProvisionResult[] | null>(null);
  const [seedResults, setSeedResults] = useState<ProvisionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [servicesCount, setServicesCount] = useState<number>(0);

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

      // Check if DWxServices exists and get count
      const servicesStatus = statuses.find(s => s.list === 'DWxServices');
      if (servicesStatus?.exists) {
        const count = await dwxSharePointProvisioningService.getListItemCount('DWxServices');
        setServicesCount(count);
      } else {
        setServicesCount(0);
      }
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
      // Refresh status after provisioning
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
        case 'DWxClients':
          result = await dwxSharePointProvisioningService.provisionClientsList();
          break;
        case 'DWxSpecialists':
          result = await dwxSharePointProvisioningService.provisionSpecialistsList();
          break;
        case 'DWxAuditLog':
          result = await dwxSharePointProvisioningService.provisionAuditLogList();
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

  const seedServices = async () => {
    setIsSeeding(true);
    setError(null);
    setSeedResults(null);
    try {
      const { results } = await dwxSharePointProvisioningService.seedServicesData();
      setSeedResults(results.map(r => ({ service: r.service, success: r.success, message: r.message })));
      // Refresh count
      const count = await dwxSharePointProvisioningService.getListItemCount('DWxServices');
      setServicesCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed services');
    } finally {
      setIsSeeding(false);
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
  const allListsExist = allLists.length === 6 && allLists.every((s) => s.exists);
  const missingLists = allLists.filter((s) => !s.exists);
  const servicesExists = getStatusForList('DWxServices');

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
          <Text className={styles.statValue}>{allLists.filter(l => l.exists).length}/6</Text>
          <Text className={styles.statLabel}>Lists Ready</Text>
        </div>
        <div className={styles.statCard}>
          <Text className={styles.statValue}>{servicesCount}</Text>
          <Text className={styles.statLabel}>Services</Text>
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
              {exists === false && (
                <Button
                  size="small"
                  appearance="outline"
                  icon={<Add24Regular />}
                  onClick={() => provisionSingleList(listName)}
                  disabled={isProvisioning}
                >
                  Create
                </Button>
              )}
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

      {/* Seed Data Section */}
      <div className={styles.seedSection}>
        <div className={styles.sectionHeader}>
          <Rocket24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            Seed Service Catalog
          </Text>
        </div>
        <Text className={styles.description}>
          Populate the DWxServices list with Digital Workplace's 6 core service offerings
        </Text>
        <Text className={styles.infoText}>
          Services: Power Platform, SPFx Development, SharePoint Migrations, M365 Assessment, Copilot Agents, MS Viva
        </Text>

        <div style={{ marginTop: tokens.spacingVerticalM }}>
          <Button
            appearance="outline"
            icon={<Add24Regular />}
            onClick={seedServices}
            disabled={!servicesExists || isSeeding || servicesCount > 0}
          >
            {isSeeding ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Seeding...
              </>
            ) : servicesCount > 0 ? (
              `Services Already Seeded (${servicesCount})`
            ) : (
              'Seed 6 Default Services'
            )}
          </Button>

          {!servicesExists && (
            <Text className={styles.infoText} block style={{ marginTop: '4px' }}>
              Create the DWxServices list first before seeding data
            </Text>
          )}
        </div>

        {/* Seed Results */}
        {seedResults && seedResults.length > 0 && (
          <div className={styles.resultsContainer} style={{ marginTop: tokens.spacingVerticalM }}>
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
      </div>

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
          <li><strong>DWxClients</strong> - Client organizations and contacts</li>
          <li><strong>DWxSpecialists</strong> - Pre-sales team members who handle discovery sessions</li>
          <li><strong>DWxAuditLog</strong> - Audit trail for compliance and tracking</li>
          <li><strong>DWxSupportingDocuments</strong> - Document library for RFPs and proposals</li>
        </ul>
      </div>
    </div>
  );
};

export default DWxSharePointProvisioning;
