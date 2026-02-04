import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Button,
  Input,
  Textarea,
  Spinner,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Tooltip,
  ProgressBar,
  TabList,
  Tab,
  SelectTabEvent,
  SelectTabData,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import {
  PersonAdd24Regular,
  Mail24Regular,
  Delete24Regular,
  ArrowSync24Regular,
  Checkmark24Regular,
  Clock24Regular,
  Dismiss16Regular,
  Copy24Regular,
  Send24Regular,
  DocumentBulletList24Regular,
  ArrowUpload24Regular,
  ErrorCircle24Regular,
  Search24Regular,
  ArrowSortDown24Regular,
  ArrowSortUp24Regular,
  Filter24Regular,
  Group24Regular,
} from '@fluentui/react-icons';
import { guestInvitationService, BulkInvitationEntry, BulkInvitationResult } from '../../services/GuestInvitationService';

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
    marginBottom: tokens.spacingVerticalM,
  },
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  description: {
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalL,
  },
  toolbar: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
  },
  searchBox: {
    minWidth: '250px',
    flex: '1 1 250px',
    maxWidth: '400px',
  },
  filterDropdown: {
    minWidth: '150px',
  },
  sortDropdown: {
    minWidth: '180px',
  },
  groupDropdown: {
    minWidth: '150px',
  },
  resultCount: {
    marginLeft: 'auto',
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  tableContainer: {
    overflowX: 'auto',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  dialogHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  dialogFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    marginTop: tokens.spacingVerticalL,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalM,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 20px',
    color: tokens.colorNeutralForeground3,
    minHeight: '300px',
  },
  inviteLink: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalM,
  },
  linkText: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: tokens.fontSizeBase200,
    fontFamily: 'monospace',
  },
  successMessage: {
    marginTop: tokens.spacingVerticalM,
  },
  tabContent: {
    marginTop: tokens.spacingVerticalM,
  },
  uploadArea: {
    border: `2px dashed ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  uploadAreaActive: {},
  uploadIcon: {
    fontSize: '48px',
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  previewTable: {
    marginTop: tokens.spacingVerticalL,
    maxHeight: '300px',
    overflowY: 'auto',
  },
  progressSection: {
    marginTop: tokens.spacingVerticalL,
  },
  progressInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS,
  },
  resultsList: {
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: tokens.spacingVerticalM,
  },
  resultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalXS,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  resultSuccess: {
    color: tokens.colorStatusSuccessForeground1,
  },
  resultError: {
    color: tokens.colorStatusDangerForeground1,
  },
  csvFormat: {
    backgroundColor: tokens.colorNeutralBackground3,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: 'monospace',
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalM,
  },
  hiddenInput: {
    display: 'none',
  },
  groupHeader: {
    backgroundColor: tokens.colorNeutralBackground3,
    fontWeight: tokens.fontWeightSemibold,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
  },
  sortableHeader: {
    cursor: 'pointer',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    '&:hover': {
      color: tokens.colorBrandForeground1,
    },
  },
  noResults: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
});

interface GuestUser {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  createdDateTime: string;
  externalUserState: string;
}

type InviteTab = 'single' | 'bulk';
type SortField = 'displayName' | 'mail' | 'externalUserState' | 'createdDateTime';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'accepted' | 'pending';
type GroupBy = 'none' | 'status' | 'invitedMonth';

export const GuestInvitations: React.FC = () => {
  const styles = useStyles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [guests, setGuests] = useState<GuestUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{
    email: string;
    redeemUrl: string;
  } | null>(null);

  // Default invitation message
  const defaultMessage = `Welcome to the License Pulse Demo Scheduler!

Digital Workplace has built this app to make it easy for Account Managers to book License Pulse demos and deployment trials directly within Microsoft Teams.

Key features available to you:
- Book demos and deployments in just a few clicks
- Propose up to 3 time slots for flexible scheduling
- Track your bookings and their status in real time
- Receive email notifications when bookings are confirmed
- View your client history and clone previous bookings as templates
- Access an interactive calendar and timeline view of all scheduled sessions

Once you accept this invitation, you'll be able to log in and start booking demos for your clients right away.

We look forward to working with you!`;

  // Form state
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [customMessage, setCustomMessage] = useState(defaultMessage);

  // Tab state
  const [selectedTab, setSelectedTab] = useState<InviteTab>('single');

  // Bulk upload state
  const [bulkEntries, setBulkEntries] = useState<BulkInvitationEntry[]>([]);
  const [bulkResults, setBulkResults] = useState<BulkInvitationResult[]>([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Search, Sort, Filter, Group state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('displayName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');

  useEffect(() => {
    loadGuestUsers();
  }, []);

  const loadGuestUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const users = await guestInvitationService.getGuestUsers();
      setGuests(users);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load guest users';
      setError(message);
      console.error('Failed to load guest users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort guests
  const filteredAndSortedGuests = useMemo(() => {
    let result = [...guests];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (guest) =>
          guest.displayName?.toLowerCase().includes(query) ||
          guest.mail?.toLowerCase().includes(query) ||
          guest.userPrincipalName?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((guest) => {
        const state = guest.externalUserState?.toLowerCase();
        if (statusFilter === 'accepted') {
          return state === 'accepted';
        } else if (statusFilter === 'pending') {
          return state === 'pendingacceptance';
        }
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'displayName':
          comparison = (a.displayName || '').localeCompare(b.displayName || '');
          break;
        case 'mail':
          comparison = (a.mail || a.userPrincipalName || '').localeCompare(
            b.mail || b.userPrincipalName || ''
          );
          break;
        case 'externalUserState':
          comparison = (a.externalUserState || '').localeCompare(b.externalUserState || '');
          break;
        case 'createdDateTime':
          comparison = new Date(a.createdDateTime || 0).getTime() - new Date(b.createdDateTime || 0).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [guests, searchQuery, statusFilter, sortField, sortDirection]);

  // Group guests
  const groupedGuests = useMemo(() => {
    if (groupBy === 'none') {
      return { '': filteredAndSortedGuests };
    }

    const groups: Record<string, GuestUser[]> = {};

    filteredAndSortedGuests.forEach((guest) => {
      let groupKey: string;

      if (groupBy === 'status') {
        const state = guest.externalUserState?.toLowerCase();
        if (state === 'accepted') {
          groupKey = 'Accepted';
        } else if (state === 'pendingacceptance') {
          groupKey = 'Pending Acceptance';
        } else {
          groupKey = 'Unknown';
        }
      } else if (groupBy === 'invitedMonth') {
        if (guest.createdDateTime) {
          const date = new Date(guest.createdDateTime);
          groupKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        } else {
          groupKey = 'Unknown';
        }
      } else {
        groupKey = '';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(guest);
    });

    // Sort group keys
    const sortedGroups: Record<string, GuestUser[]> = {};
    Object.keys(groups)
      .sort((a, b) => {
        if (groupBy === 'invitedMonth') {
          // Sort months in reverse chronological order
          return b.localeCompare(a);
        }
        return a.localeCompare(b);
      })
      .forEach((key) => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }, [filteredAndSortedGuests, groupBy]);

  const handleSendInvitation = async () => {
    if (!email || !displayName) return;

    try {
      setSending(true);
      setError(null);
      const result = await guestInvitationService.sendInvitation(
        email,
        displayName,
        customMessage || undefined
      );

      setInviteSuccess({
        email: result.invitedUserEmailAddress,
        redeemUrl: result.inviteRedeemUrl,
      });

      // Refresh the guest list
      await loadGuestUsers();

      // Clear form
      setEmail('');
      setDisplayName('');
      setCustomMessage(defaultMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const handleResendInvitation = async (guest: GuestUser) => {
    try {
      setError(null);
      await guestInvitationService.resendInvitation(
        guest.mail || guest.userPrincipalName,
        guest.displayName
      );
      // Show success message
      setInviteSuccess({
        email: guest.mail || guest.userPrincipalName,
        redeemUrl: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend invitation';
      setError(message);
    }
  };

  const handleDeleteGuest = async (guest: GuestUser) => {
    if (!confirm(`Are you sure you want to remove ${guest.displayName} from the organization?`)) {
      return;
    }

    try {
      setError(null);
      await guestInvitationService.deleteGuestUser(guest.id);
      await loadGuestUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove guest user';
      setError(message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusBadge = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'accepted':
        return (
          <Badge appearance="filled" color="success" icon={<Checkmark24Regular />}>
            Accepted
          </Badge>
        );
      case 'pendingacceptance':
        return (
          <Badge appearance="filled" color="warning" icon={<Clock24Regular />}>
            Pending
          </Badge>
        );
      default:
        return (
          <Badge appearance="filled" color="informative">
            {state || 'Unknown'}
          </Badge>
        );
    }
  };


  const closeInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteSuccess(null);
    setEmail('');
    setDisplayName('');
    setCustomMessage(defaultMessage);
    setBulkEntries([]);
    setBulkResults([]);
    setBulkProgress({ current: 0, total: 0 });
    setSelectedTab('single');
  };

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as InviteTab);
    setBulkEntries([]);
    setBulkResults([]);
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const entries = guestInvitationService.parseSpreadsheet(content);
      setBulkEntries(entries);
      setBulkResults([]);
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleBulkInvite = async () => {
    if (bulkEntries.length === 0) return;

    setBulkProcessing(true);
    setBulkResults([]);
    setBulkProgress({ current: 0, total: bulkEntries.length });

    await guestInvitationService.sendBulkInvitations(
      bulkEntries,
      customMessage || undefined,
      (current, total, result) => {
        setBulkProgress({ current, total });
        setBulkResults(prev => [...prev, result]);
      }
    );

    setBulkProcessing(false);
    await loadGuestUsers();
  };

  const downloadTemplate = () => {
    const template = 'Email,Display Name\njohn.smith@company.com,John Smith\njane.doe@company.com,Jane Doe';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guest_invitation_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowSortUp24Regular style={{ width: '16px', height: '16px' }} />
    ) : (
      <ArrowSortDown24Regular style={{ width: '16px', height: '16px' }} />
    );
  };

  const successCount = bulkResults.filter(r => r.success).length;
  const errorCount = bulkResults.filter(r => !r.success).length;

  const renderTableRows = (guestsToRender: GuestUser[]) => {
    return guestsToRender.map((guest) => (
      <TableRow key={guest.id}>
        <TableCell>{guest.displayName}</TableCell>
        <TableCell>{guest.mail || guest.userPrincipalName}</TableCell>
        <TableCell>{getStatusBadge(guest.externalUserState)}</TableCell>
        <TableCell>
          {guest.createdDateTime
            ? new Date(guest.createdDateTime).toLocaleDateString()
            : '-'}
        </TableCell>
        <TableCell>
          <div className={styles.actions}>
            {guest.externalUserState?.toLowerCase() === 'pendingacceptance' && (
              <Tooltip content="Resend invitation" relationship="label">
                <Button
                  appearance="subtle"
                  icon={<Mail24Regular />}
                  onClick={() => handleResendInvitation(guest)}
                />
              </Tooltip>
            )}
            <Tooltip content="Remove guest" relationship="label">
              <Button
                appearance="subtle"
                icon={<Delete24Regular />}
                onClick={() => handleDeleteGuest(guest)}
              />
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Text className={styles.title}>Guest User Invitations</Text>
          <Text className={styles.description} block>
            Invite external users from other organizations to collaborate. They will receive an email
            invitation to join your tenant as a guest.
          </Text>
        </div>
        <div className={styles.actions}>
          <Button
            appearance="subtle"
            icon={<ArrowSync24Regular />}
            onClick={loadGuestUsers}
            disabled={loading}
          >
            Refresh
          </Button>
          <Dialog open={inviteDialogOpen} onOpenChange={(_, data) => setInviteDialogOpen(data.open)}>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="primary" icon={<PersonAdd24Regular />}>
                Invite Guest
              </Button>
            </DialogTrigger>
            <DialogSurface style={{ maxWidth: '600px' }}>
              <DialogBody>
                <div className={styles.dialogHeader}>
                  <DialogTitle>Invite Guest</DialogTitle>
                  <Button
                    appearance="subtle"
                    icon={<Dismiss16Regular />}
                    onClick={closeInviteDialog}
                  />
                </div>
                <DialogContent>
                  {inviteSuccess && selectedTab === 'single' ? (
                    <div className={styles.successMessage}>
                      <MessageBar intent="success">
                        <MessageBarBody>
                          <MessageBarTitle>Invitation Sent!</MessageBarTitle>
                          An invitation has been sent to {inviteSuccess.email}
                        </MessageBarBody>
                      </MessageBar>
                      {inviteSuccess.redeemUrl && (
                        <div className={styles.inviteLink}>
                          <Text className={styles.linkText}>{inviteSuccess.redeemUrl}</Text>
                          <Tooltip content="Copy link" relationship="label">
                            <Button
                              appearance="subtle"
                              icon={<Copy24Regular />}
                              onClick={() => copyToClipboard(inviteSuccess.redeemUrl)}
                            />
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
                        <Tab value="single" icon={<PersonAdd24Regular />}>
                          Single Invite
                        </Tab>
                        <Tab value="bulk" icon={<DocumentBulletList24Regular />}>
                          Bulk Import
                        </Tab>
                      </TabList>

                      <div className={styles.tabContent}>
                        {selectedTab === 'single' ? (
                          <div className={styles.form}>
                            <Field label="Email Address" required>
                              <Input
                                type="email"
                                value={email}
                                onChange={(_, data) => setEmail(data.value)}
                                placeholder="user@externalcompany.com"
                                contentBefore={<Mail24Regular />}
                              />
                            </Field>
                            <Field label="Display Name" required>
                              <Input
                                value={displayName}
                                onChange={(_, data) => setDisplayName(data.value)}
                                placeholder="John Smith"
                              />
                            </Field>
                            <Field label="Personal Message (optional)">
                              <Textarea
                                value={customMessage}
                                onChange={(_, data) => setCustomMessage(data.value)}
                                placeholder={"Welcome to the License Pulse Demo Scheduler!\n\nDigital Workplace has built this app to make it easy for Account Managers to book License Pulse demos and deployment trials directly within Microsoft Teams.\n\nKey features available to you:\n- Book demos and deployments in just a few clicks\n- Propose up to 3 time slots for flexible scheduling\n- Track your bookings and their status in real time\n- Receive email notifications when bookings are confirmed\n- View your client history and clone previous bookings as templates\n- Access an interactive calendar and timeline view of all scheduled sessions\n\nOnce you accept this invitation, you'll be able to log in and start booking demos for your clients right away.\n\nWe look forward to working with you!"}
                                rows={6}
                              />
                            </Field>
                          </div>
                        ) : (
                          <div className={styles.form}>
                            <div
                              className={`${styles.uploadArea} ${dragActive ? styles.uploadAreaActive : ''}`}
                              onDragEnter={handleDrag}
                              onDragLeave={handleDrag}
                              onDragOver={handleDrag}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <ArrowUpload24Regular className={styles.uploadIcon} />
                              <Text block size={400} weight="semibold">
                                Drop a CSV file here or click to browse
                              </Text>
                              <Text block size={300} style={{ color: tokens.colorNeutralForeground3 }}>
                                Supported formats: CSV, TSV (Excel copy-paste)
                              </Text>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt,.tsv"
                                onChange={handleFileInputChange}
                                className={styles.hiddenInput}
                              />
                            </div>

                            <Button
                              appearance="subtle"
                              size="small"
                              onClick={downloadTemplate}
                            >
                              Download CSV Template
                            </Button>

                            <div className={styles.csvFormat}>
                              <Text block size={200} weight="semibold">Expected format:</Text>
                              <Text block size={200}>Email,Display Name</Text>
                              <Text block size={200}>john@company.com,John Smith</Text>
                              <Text block size={200}>jane@company.com,Jane Doe</Text>
                            </div>

                            {bulkEntries.length > 0 && !bulkProcessing && bulkResults.length === 0 && (
                              <div className={styles.previewTable}>
                                <Text block weight="semibold" style={{ marginBottom: tokens.spacingVerticalS }}>
                                  Preview ({bulkEntries.length} users to invite)
                                </Text>
                                <Table size="small">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHeaderCell>Email</TableHeaderCell>
                                      <TableHeaderCell>Display Name</TableHeaderCell>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {bulkEntries.slice(0, 10).map((entry, index) => (
                                      <TableRow key={index}>
                                        <TableCell>{entry.email}</TableCell>
                                        <TableCell>{entry.displayName}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {bulkEntries.length > 10 && (
                                  <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                    ...and {bulkEntries.length - 10} more
                                  </Text>
                                )}
                              </div>
                            )}

                            {bulkProcessing && (
                              <div className={styles.progressSection}>
                                <div className={styles.progressInfo}>
                                  <Text>Sending invitations...</Text>
                                  <Text>{bulkProgress.current} / {bulkProgress.total}</Text>
                                </div>
                                <ProgressBar
                                  value={bulkProgress.current / bulkProgress.total}
                                  max={1}
                                />
                              </div>
                            )}

                            {bulkResults.length > 0 && !bulkProcessing && (
                              <div className={styles.progressSection}>
                                <MessageBar intent={errorCount === 0 ? 'success' : 'warning'}>
                                  <MessageBarBody>
                                    <MessageBarTitle>
                                      {errorCount === 0 ? 'All Invitations Sent!' : 'Invitations Complete'}
                                    </MessageBarTitle>
                                    {successCount} succeeded, {errorCount} failed
                                  </MessageBarBody>
                                </MessageBar>

                                <div className={styles.resultsList}>
                                  {bulkResults.map((result, index) => (
                                    <div key={index} className={styles.resultItem}>
                                      {result.success ? (
                                        <Checkmark24Regular className={styles.resultSuccess} />
                                      ) : (
                                        <ErrorCircle24Regular className={styles.resultError} />
                                      )}
                                      <Text size={200}>
                                        {result.displayName} ({result.email})
                                      </Text>
                                      {result.error && (
                                        <Text size={200} className={styles.resultError}>
                                          - {result.error}
                                        </Text>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Field label="Personal Message for All (optional)">
                              <Textarea
                                value={customMessage}
                                onChange={(_, data) => setCustomMessage(data.value)}
                                placeholder={"Welcome to the License Pulse Demo Scheduler!\n\nDigital Workplace has built this app to make it easy for Account Managers to book License Pulse demos and deployment trials directly within Microsoft Teams."}
                                rows={4}
                              />
                            </Field>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </DialogContent>
              </DialogBody>
              <div className={styles.dialogFooter}>
                <Button appearance="secondary" onClick={closeInviteDialog}>
                  {(inviteSuccess || bulkResults.length > 0) ? 'Close' : 'Cancel'}
                </Button>
                {selectedTab === 'single' && !inviteSuccess && (
                  <Button
                    appearance="primary"
                    icon={<Send24Regular />}
                    onClick={handleSendInvitation}
                    disabled={!email || !displayName || sending}
                  >
                    {sending ? <Spinner size="tiny" /> : 'Send Invitation'}
                  </Button>
                )}
                {selectedTab === 'bulk' && bulkEntries.length > 0 && !bulkProcessing && bulkResults.length === 0 && (
                  <Button
                    appearance="primary"
                    icon={<Send24Regular />}
                    onClick={handleBulkInvite}
                  >
                    Send {bulkEntries.length} Invitations
                  </Button>
                )}
              </div>
            </DialogSurface>
          </Dialog>
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

      {/* Search, Sort, Filter, Group Toolbar */}
      {!loading && guests.length > 0 && (
        <div className={styles.toolbar}>
          <Input
            className={styles.searchBox}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
            contentBefore={<Search24Regular />}
            contentAfter={
              searchQuery ? (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<Dismiss16Regular />}
                  onClick={() => setSearchQuery('')}
                />
              ) : undefined
            }
          />

          <Dropdown
            className={styles.filterDropdown}
            placeholder="Filter by status"
            value={statusFilter === 'all' ? 'All Statuses' : statusFilter === 'accepted' ? 'Accepted' : 'Pending'}
            selectedOptions={[statusFilter]}
            onOptionSelect={(_, data) => setStatusFilter(data.optionValue as StatusFilter)}
          >
            <Option value="all" text="All Statuses">
              <Filter24Regular style={{ marginRight: '8px' }} />
              All Statuses
            </Option>
            <Option value="accepted" text="Accepted">
              <Checkmark24Regular style={{ marginRight: '8px' }} />
              Accepted
            </Option>
            <Option value="pending" text="Pending">
              <Clock24Regular style={{ marginRight: '8px' }} />
              Pending
            </Option>
          </Dropdown>

          <Dropdown
            className={styles.sortDropdown}
            placeholder="Sort by"
            value={
              sortField === 'displayName' ? `Name (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})` :
              sortField === 'mail' ? `Email (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})` :
              sortField === 'externalUserState' ? `Status (${sortDirection === 'asc' ? 'A-Z' : 'Z-A'})` :
              `Date (${sortDirection === 'asc' ? 'Oldest' : 'Newest'})`
            }
            selectedOptions={[`${sortField}-${sortDirection}`]}
            onOptionSelect={(_, data) => {
              const [field, direction] = (data.optionValue as string).split('-');
              setSortField(field as SortField);
              setSortDirection(direction as SortDirection);
            }}
          >
            <Option value="displayName-asc" text="Name (A-Z)">Name (A-Z)</Option>
            <Option value="displayName-desc" text="Name (Z-A)">Name (Z-A)</Option>
            <Option value="mail-asc" text="Email (A-Z)">Email (A-Z)</Option>
            <Option value="mail-desc" text="Email (Z-A)">Email (Z-A)</Option>
            <Option value="createdDateTime-desc" text="Date (Newest)">Date (Newest)</Option>
            <Option value="createdDateTime-asc" text="Date (Oldest)">Date (Oldest)</Option>
            <Option value="externalUserState-asc" text="Status (A-Z)">Status (A-Z)</Option>
            <Option value="externalUserState-desc" text="Status (Z-A)">Status (Z-A)</Option>
          </Dropdown>

          <Dropdown
            className={styles.groupDropdown}
            placeholder="Group by"
            value={groupBy === 'none' ? 'No Grouping' : groupBy === 'status' ? 'Status' : 'Month Invited'}
            selectedOptions={[groupBy]}
            onOptionSelect={(_, data) => setGroupBy(data.optionValue as GroupBy)}
          >
            <Option value="none" text="No Grouping">
              <Group24Regular style={{ marginRight: '8px' }} />
              No Grouping
            </Option>
            <Option value="status" text="Status">By Status</Option>
            <Option value="invitedMonth" text="Month Invited">By Month Invited</Option>
          </Dropdown>

          <Text className={styles.resultCount}>
            {filteredAndSortedGuests.length} of {guests.length} guests
          </Text>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spinner label="Loading guest users..." />
        </div>
      ) : guests.length === 0 ? (
        <div className={styles.emptyState}>
          <PersonAdd24Regular style={{ fontSize: '48px', marginBottom: '16px' }} />
          <Text block size={400} weight="semibold">
            No guest users found
          </Text>
          <Text block size={300}>
            Click "Invite Guest" to invite external users to your organization.
          </Text>
        </div>
      ) : filteredAndSortedGuests.length === 0 ? (
        <div className={styles.noResults}>
          <Search24Regular style={{ fontSize: '32px', marginBottom: '8px' }} />
          <Text block size={400} weight="semibold">
            No results found
          </Text>
          <Text block size={300}>
            Try adjusting your search or filters.
          </Text>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>
                  <div
                    className={styles.sortableHeader}
                    onClick={() => handleSort('displayName')}
                  >
                    Name {getSortIcon('displayName')}
                  </div>
                </TableHeaderCell>
                <TableHeaderCell>
                  <div
                    className={styles.sortableHeader}
                    onClick={() => handleSort('mail')}
                  >
                    Email {getSortIcon('mail')}
                  </div>
                </TableHeaderCell>
                <TableHeaderCell>
                  <div
                    className={styles.sortableHeader}
                    onClick={() => handleSort('externalUserState')}
                  >
                    Invite Status {getSortIcon('externalUserState')}
                  </div>
                </TableHeaderCell>
                <TableHeaderCell>
                  <div
                    className={styles.sortableHeader}
                    onClick={() => handleSort('createdDateTime')}
                  >
                    Invited {getSortIcon('createdDateTime')}
                  </div>
                </TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupBy === 'none'
                ? renderTableRows(filteredAndSortedGuests)
                : Object.entries(groupedGuests).map(([groupName, groupGuests]) => (
                    <React.Fragment key={groupName}>
                      <TableRow>
                        <TableCell colSpan={5} className={styles.groupHeader}>
                          {groupName} ({groupGuests.length})
                        </TableCell>
                      </TableRow>
                      {renderTableRows(groupGuests)}
                    </React.Fragment>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
