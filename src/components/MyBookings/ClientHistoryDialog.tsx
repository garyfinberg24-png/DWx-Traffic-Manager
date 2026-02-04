import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogContent,
  Button,
  Text,
  Badge,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Dismiss16Regular,
  Building24Regular,
  CalendarLtr24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
  Warning24Regular,
  DismissCircle24Regular,
  Star24Filled,
} from '@fluentui/react-icons';
import { Booking, BookingStatus } from '../../types/Booking';
import { sharePointService } from '../../services/SharePointService';
import { format } from 'date-fns';

const useStyles = makeStyles({
  surface: {
    maxWidth: '720px',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    maxHeight: '90vh',
    boxShadow: '0 25.6px 57.6px 0 rgba(0,0,0,.22), 0 4.8px 14.4px 0 rgba(0,0,0,.18)',
  },
  dialogBody: {
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '85vh',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 24px',
    background: 'linear-gradient(135deg, #0078d4 0%, #106ebe 100%)',
    color: 'white',
    position: 'relative',
    flexShrink: 0,
  },
  headerIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerSubtitle: {
    fontSize: '13px',
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    minWidth: '28px',
    width: '28px',
    height: '28px',
    padding: '0',
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.25)',
    },
  },
  premiumStar: {
    color: '#ffd700',
    width: '16px',
    height: '16px',
  },
  body: {
    padding: '0',
    maxHeight: '60vh',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  statsBar: {
    display: 'flex',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  statLabel: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
  },
  historyItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px 24px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  historyIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconConfirmed: {
    backgroundColor: 'rgba(16, 124, 16, 0.1)',
    color: '#107c10',
  },
  iconPending: {
    backgroundColor: 'rgba(247, 99, 12, 0.1)',
    color: '#f7630c',
  },
  iconCancelled: {
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    color: '#d13438',
  },
  iconRescheduling: {
    backgroundColor: 'rgba(98, 100, 167, 0.1)',
    color: '#6264a7',
  },
  historyContent: {
    flex: 1,
    minWidth: 0,
  },
  historyTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  historyMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  statusBadge: {
    fontSize: '11px',
    fontWeight: '500',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    color: tokens.colorNeutralForeground4,
    marginBottom: '16px',
  },
  loadingState: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '48px 24px',
  },
  actions: {
    padding: '16px 24px',
    borderTop: '1px solid #e1e1e1',
    backgroundColor: '#f9f9f9',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    flexShrink: 0,
  },
});

interface ClientHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  clientName: string;
  isPremium?: boolean;
}

const getStatusIcon = (status: BookingStatus) => {
  switch (status) {
    case 'Confirmed':
      return <CheckmarkCircle24Regular />;
    case 'Cancelled':
      return <DismissCircle24Regular />;
    case 'Rescheduling Required':
      return <Clock24Regular />;
    default:
      return <Warning24Regular />;
  }
};

const getIconClass = (status: BookingStatus, styles: ReturnType<typeof useStyles>): string => {
  switch (status) {
    case 'Confirmed':
      return styles.iconConfirmed;
    case 'Cancelled':
      return styles.iconCancelled;
    case 'Rescheduling Required':
      return styles.iconRescheduling;
    default:
      return styles.iconPending;
  }
};

const getStatusColor = (status: BookingStatus): 'success' | 'danger' | 'warning' | 'important' | 'informative' => {
  switch (status) {
    case 'Confirmed':
      return 'success';
    case 'Cancelled':
      return 'danger';
    case 'Rescheduling Required':
      return 'important';
    case 'Awaiting Approval':
      return 'informative';
    default:
      return 'warning';
  }
};

export const ClientHistoryDialog: React.FC<ClientHistoryDialogProps> = ({
  open,
  onClose,
  clientName,
  isPremium = false,
}) => {
  const styles = useStyles();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && clientName) {
      loadClientHistory();
    }
  }, [open, clientName]);

  const loadClientHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all bookings and filter by client name
      const allBookings = await sharePointService.getBookings({});
      const clientBookings = allBookings
        .filter((b) => b.ClientName.toLowerCase() === clientName.toLowerCase())
        .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());
      setBookings(clientBookings);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load client history';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.Status === 'Confirmed').length;
  const totalLicenses = bookings.reduce((sum, b) => sum + b.LicenseCount, 0);
  const totalDealValue = bookings.reduce((sum, b) => sum + (b.DealSize || 0), 0);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface className={styles.surface}>
        <DialogBody className={styles.dialogBody}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerIcon}>
              <Building24Regular />
            </div>
            <div className={styles.headerContent}>
              <div className={styles.headerTitle}>
                {clientName}
                {isPremium && <Star24Filled className={styles.premiumStar} />}
              </div>
              <div className={styles.headerSubtitle}>
                Client Booking History
              </div>
            </div>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close dialog"
            >
              <Dismiss16Regular />
            </button>
          </div>

          <DialogContent className={styles.body}>
            {isLoading ? (
              <div className={styles.loadingState}>
                <Spinner size="medium" label="Loading client history..." />
              </div>
            ) : error ? (
              <div className={styles.emptyState}>
                <Text style={{ color: '#d13438' }}>{error}</Text>
              </div>
            ) : bookings.length === 0 ? (
              <div className={styles.emptyState}>
                <CalendarLtr24Regular className={styles.emptyIcon} />
                <Text weight="semibold" size={400}>No booking history</Text>
                <Text size={200} style={{ color: '#616161', marginTop: '8px' }}>
                  This client hasn't had any bookings yet
                </Text>
              </div>
            ) : (
              <>
                {/* Stats Bar */}
                <div className={styles.statsBar}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{totalBookings}</span>
                    <span className={styles.statLabel}>Total Bookings</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{confirmedBookings}</span>
                    <span className={styles.statLabel}>Confirmed</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{totalLicenses.toLocaleString()}</span>
                    <span className={styles.statLabel}>Total Licenses</span>
                  </div>
                  {totalDealValue > 0 && (
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>
                        ${(totalDealValue / 1000).toFixed(0)}K
                      </span>
                      <span className={styles.statLabel}>Deal Value</span>
                    </div>
                  )}
                </div>

                {/* History List */}
                <div className={styles.historyList}>
                  {bookings.map((booking) => (
                    <div key={booking.Id} className={styles.historyItem}>
                      <div className={`${styles.historyIcon} ${getIconClass(booking.Status, styles)}`}>
                        {getStatusIcon(booking.Status)}
                      </div>
                      <div className={styles.historyContent}>
                        <div className={styles.historyTitle}>
                          {booking.BookingType}
                          <Badge
                            appearance="outline"
                            color={getStatusColor(booking.Status)}
                            className={styles.statusBadge}
                          >
                            {booking.Status}
                          </Badge>
                        </div>
                        <div className={styles.historyMeta}>
                          <span className={styles.metaItem}>
                            <CalendarLtr24Regular style={{ width: '12px', height: '12px' }} />
                            {formatDate(booking.ConfirmedDateTime || booking.ProposedSlot1)}
                          </span>
                          <span className={styles.metaItem}>
                            {booking.LicenseCount.toLocaleString()} licenses
                          </span>
                          {booking.DealSize && (
                            <span className={styles.metaItem}>
                              ${booking.DealSize.toLocaleString()}
                            </span>
                          )}
                          <span className={styles.metaItem}>
                            by {booking.AccountManagerName}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </DialogContent>

          {/* Actions */}
          <div className={styles.actions}>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
