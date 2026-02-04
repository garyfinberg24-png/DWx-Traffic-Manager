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
} from '@fluentui/react-components';
import {
  Database24Regular,
  Checkmark24Regular,
  Dismiss24Regular,
  ArrowSync24Regular,
  Add24Regular,
  PaintBrush24Regular,
  ViewDesktop24Regular,
  Settings24Regular,
  Info24Regular,
  ArrowReset24Regular,
  Grid24Regular,
} from '@fluentui/react-icons';
import { sharePointProvisioningService } from '../../services/SharePointProvisioningService';

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
    color: tokens.colorBrandForeground1,
    fontSize: '24px',
  },
  description: {
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalS,
  },
  listGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalM,
  },
  listCard: {
    padding: tokens.spacingHorizontalM,
  },
  listCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalS,
  },
  listName: {
    fontWeight: '600',
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
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalS,
  },
  sectionIcon: {
    color: tokens.colorBrandForeground1,
  },
  lpDemoSection: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: '8px',
  },
  lpDemoActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalM,
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
  list: string;
  success: boolean;
  message: string;
}

const LIST_DESCRIPTIONS: Record<string, string> = {
  AccountManagers: 'Stores account manager profiles and details',
  Bookings: 'Demo and deployment booking requests',
  Clients: 'Client organizations and contacts',
  TeamMembers: 'Demo team members and their availability',
  AuditLog: 'Tracks all changes and actions in the system',
};

export const SharePointProvisioning: React.FC = () => {
  const styles = useStyles();
  const [listStatuses, setListStatuses] = useState<ListStatus[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionResults, setProvisionResults] = useState<ProvisionResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplyingFormatting, setIsApplyingFormatting] = useState(false);
  const [isCreatingViews, setIsCreatingViews] = useState(false);
  const [isRecreatingViews, setIsRecreatingViews] = useState(false);
  const [isApplyingGallery, setIsApplyingGallery] = useState(false);
  const [lpDemoResults, setLpDemoResults] = useState<Array<{ item: string; success: boolean; message: string }> | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [listFields, setListFields] = useState<Array<{ internalName: string; title: string; typeAsString: string }> | null>(null);

  const checkListStatus = async () => {
    setIsChecking(true);
    setError(null);
    try {
      const statuses = await sharePointProvisioningService.checkListsStatus();
      setListStatuses(statuses);
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
      const { results } = await sharePointProvisioningService.provisionAllLists();
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
      let result: { success: boolean; message: string };
      switch (listName) {
        case 'AccountManagers':
          result = await sharePointProvisioningService.provisionAccountManagersList();
          break;
        case 'Bookings':
          result = await sharePointProvisioningService.provisionBookingsList();
          break;
        case 'Clients':
          result = await sharePointProvisioningService.provisionClientsList();
          break;
        case 'TeamMembers':
          result = await sharePointProvisioningService.provisionTeamMembersList();
          break;
        case 'AuditLog':
          result = await sharePointProvisioningService.provisionAuditLogList();
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

  // LPDemoScheduler formatting and views
  const applyLPDemoFormatting = async () => {
    setIsApplyingFormatting(true);
    setError(null);
    setLpDemoResults(null);
    try {
      const { results } = await sharePointProvisioningService.applyLPDemoSchedulerFormatting();
      setLpDemoResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply formatting');
    } finally {
      setIsApplyingFormatting(false);
    }
  };

  const createLPDemoViews = async () => {
    setIsCreatingViews(true);
    setError(null);
    setLpDemoResults(null);
    try {
      const { results } = await sharePointProvisioningService.createLPDemoSchedulerViews();
      setLpDemoResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create views');
    } finally {
      setIsCreatingViews(false);
    }
  };

  const setupLPDemoScheduler = async () => {
    setIsApplyingFormatting(true);
    setIsCreatingViews(true);
    setError(null);
    setLpDemoResults(null);
    try {
      const { formatting, views } = await sharePointProvisioningService.setupLPDemoScheduler();
      // Combine both results
      setLpDemoResults([...formatting.results, ...views.results]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup LPDemoScheduler');
    } finally {
      setIsApplyingFormatting(false);
      setIsCreatingViews(false);
    }
  };

  const diagnoseListFields = async () => {
    setIsDiagnosing(true);
    setError(null);
    setListFields(null);
    try {
      const fields = await sharePointProvisioningService.getLPDemoSchedulerFields();
      setListFields(fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get list fields');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const recreateLPDemoViews = async () => {
    setIsRecreatingViews(true);
    setError(null);
    setLpDemoResults(null);
    try {
      const { results } = await sharePointProvisioningService.recreateLPDemoSchedulerViews();
      setLpDemoResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recreate views');
    } finally {
      setIsRecreatingViews(false);
    }
  };

  const applyGalleryFormatting = async () => {
    setIsApplyingGallery(true);
    setError(null);
    setLpDemoResults(null);
    try {
      const result = await sharePointProvisioningService.applyLPDemoSchedulerGalleryFormatting();
      setLpDemoResults([{ item: 'Gallery Card Formatting', ...result }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply gallery formatting');
    } finally {
      setIsApplyingGallery(false);
    }
  };

  useEffect(() => {
    checkListStatus();
  }, []);

  const getStatusForList = (listName: string): boolean | null => {
    const status = listStatuses.find((s) => s.list === listName);
    return status?.exists ?? null;
  };

  const allListsExist = listStatuses.length > 0 && listStatuses.every((s) => s.exists);
  const missingLists = listStatuses.filter((s) => !s.exists);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Database24Regular className={styles.headerIcon} />
        <div>
          <Text size={500} weight="semibold">
            SharePoint List Provisioning
          </Text>
          <Text className={styles.description} block>
            Create and manage the SharePoint lists required for the application
          </Text>
        </div>
      </div>

      {error && (
        <Card style={{ backgroundColor: tokens.colorPaletteRedBackground1 }}>
          <Text style={{ color: tokens.colorPaletteRedForeground1 }}>{error}</Text>
        </Card>
      )}

      <div className={styles.listGrid}>
        {['AccountManagers', 'Bookings', 'Clients', 'TeamMembers', 'AuditLog'].map((listName) => {
          const exists = getStatusForList(listName);
          return (
            <Card key={listName} className={styles.listCard}>
              <div className={styles.listCardHeader}>
                <Text className={styles.listName}>{listName}</Text>
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
                    Exists
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
                {LIST_DESCRIPTIONS[listName]}
              </Text>
              {exists === false && (
                <Button
                  size="small"
                  appearance="outline"
                  icon={<Add24Regular />}
                  onClick={() => provisionSingleList(listName)}
                  disabled={isProvisioning}
                >
                  Create List
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Divider />

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
          >
            {isProvisioning ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Provisioning...
              </>
            ) : (
              `Create All Missing Lists (${missingLists.length})`
            )}
          </Button>
        )}

        {allListsExist && (
          <Badge appearance="filled" color="success" size="large">
            All lists are provisioned
          </Badge>
        )}
      </div>

      {provisionResults && provisionResults.length > 0 && (
        <div className={styles.resultsContainer}>
          <Text weight="semibold" block style={{ marginBottom: '8px' }}>
            Provisioning Results
          </Text>
          {provisionResults.map((result) => (
            <div key={result.list} className={styles.resultItem}>
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

      {/* LPDemoScheduler Customization Section */}
      <div className={styles.lpDemoSection}>
        <div className={styles.sectionHeader}>
          <Settings24Regular className={styles.sectionIcon} />
          <Text size={400} weight="semibold">
            LPDemoScheduler List Customization
          </Text>
        </div>
        <Text className={styles.description}>
          Apply custom JSON formatting and create views for the main booking list
        </Text>
        <Text className={styles.infoText}>
          This will apply column formatting (status badges, icons) and create filtered views
          (Pending Bookings, Confirmed Bookings, Premium Clients, This Week, By Account Manager)
        </Text>

        <div className={styles.lpDemoActions}>
          <Button
            appearance="outline"
            icon={<PaintBrush24Regular />}
            onClick={applyLPDemoFormatting}
            disabled={isApplyingFormatting || isCreatingViews || isRecreatingViews || isApplyingGallery}
          >
            {isApplyingFormatting ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Applying...
              </>
            ) : (
              'Apply Column Formatting'
            )}
          </Button>

          <Button
            appearance="outline"
            icon={<ViewDesktop24Regular />}
            onClick={createLPDemoViews}
            disabled={isApplyingFormatting || isCreatingViews || isRecreatingViews || isApplyingGallery}
          >
            {isCreatingViews ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Creating...
              </>
            ) : (
              'Create Custom Views'
            )}
          </Button>

          <Button
            appearance="outline"
            icon={<ArrowReset24Regular />}
            onClick={recreateLPDemoViews}
            disabled={isApplyingFormatting || isCreatingViews || isRecreatingViews || isApplyingGallery}
          >
            {isRecreatingViews ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Recreating...
              </>
            ) : (
              'Recreate Views (Fix Broken)'
            )}
          </Button>

          <Button
            appearance="outline"
            icon={<Grid24Regular />}
            onClick={applyGalleryFormatting}
            disabled={isApplyingFormatting || isCreatingViews || isRecreatingViews || isApplyingGallery}
          >
            {isApplyingGallery ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Applying...
              </>
            ) : (
              'Apply Gallery Card Styling'
            )}
          </Button>

          <Button
            appearance="primary"
            icon={<Settings24Regular />}
            onClick={setupLPDemoScheduler}
            disabled={isApplyingFormatting || isCreatingViews || isRecreatingViews || isApplyingGallery}
          >
            {(isApplyingFormatting && isCreatingViews) ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Setting Up...
              </>
            ) : (
              'Full Setup (Formatting + Views)'
            )}
          </Button>

          <Button
            appearance="subtle"
            icon={<Info24Regular />}
            onClick={diagnoseListFields}
            disabled={isDiagnosing}
          >
            {isDiagnosing ? (
              <>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Loading...
              </>
            ) : (
              'Diagnose Column Names'
            )}
          </Button>
        </div>

        {listFields && listFields.length > 0 && (
          <div className={styles.resultsContainer} style={{ marginTop: tokens.spacingVerticalM }}>
            <Text weight="semibold" block style={{ marginBottom: '8px' }}>
              LPDemoScheduler Columns (Internal Name → Display Name)
            </Text>
            <Text className={styles.infoText} block style={{ marginBottom: '8px' }}>
              Use the Internal Name for formatting. The code currently expects: Status, IsPremiumClient, BookingType
            </Text>
            {listFields.map((field) => (
              <div key={field.internalName} className={styles.resultItem}>
                <Text style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  <strong>{field.internalName}</strong> → {field.title} ({field.typeAsString})
                </Text>
              </div>
            ))}
          </div>
        )}

        {lpDemoResults && lpDemoResults.length > 0 && (
          <div className={styles.resultsContainer} style={{ marginTop: tokens.spacingVerticalM }}>
            <Text weight="semibold" block style={{ marginBottom: '8px' }}>
              Results
            </Text>
            {lpDemoResults.map((result, index) => (
              <div key={index} className={styles.resultItem}>
                {result.success ? (
                  <Checkmark24Regular className={styles.successIcon} />
                ) : (
                  <Dismiss24Regular className={styles.errorIcon} />
                )}
                <Text>
                  <strong>{result.item}:</strong> {result.message}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharePointProvisioning;
