import React, { useState } from 'react';
import {
  makeStyles,
  Button,
  Text,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  tokens,
} from '@fluentui/react-components';
import {
  Alert24Regular,
  Alert24Filled,
  CheckmarkCircle24Regular,
  Warning24Regular,
  Info24Regular,
  ErrorCircle24Regular,
  Dismiss16Regular,
  CheckmarkStarburst24Regular,
  Delete24Regular,
} from '@fluentui/react-icons';
import { DW_COLORS } from '../../utils/buttonStyles';
import { useNotifications } from '../../contexts/NotificationContext';
import { AppNotification, NotificationType } from '../../types/Notification';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const useStyles = makeStyles({
  trigger: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'white',
    '& svg': {
      color: 'white',
    },
    ':hover': {
      color: 'white',
    },
    ':hover svg': {
      color: 'white',
    },
  },
  badge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    minWidth: '18px',
    height: '18px',
    fontSize: '10px',
    fontWeight: '600',
  },
  popover: {
    width: '380px',
    maxHeight: '480px',
    padding: '0',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
  },
  headerActions: {
    display: 'flex',
    gap: '4px',
  },
  content: {
    maxHeight: '380px',
    overflowY: 'auto',
  },
  notificationList: {
    display: 'flex',
    flexDirection: 'column',
  },
  notificationItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    cursor: 'pointer',
    borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    transition: 'background-color 0.15s ease',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(30, 107, 123, 0.05)',
  },
  iconContainer: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconSuccess: {
    backgroundColor: 'rgba(16, 124, 16, 0.1)',
    color: '#107c10',
  },
  iconWarning: {
    backgroundColor: 'rgba(247, 99, 12, 0.1)',
    color: '#f7630c',
  },
  iconError: {
    backgroundColor: 'rgba(209, 52, 56, 0.1)',
    color: '#d13438',
  },
  iconInfo: {
    backgroundColor: 'rgba(0, 120, 212, 0.1)',
    color: '#0078d4',
  },
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: tokens.colorNeutralForeground1,
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  unreadDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: DW_COLORS.teal,
    flexShrink: 0,
  },
  notificationMessage: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.4',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  notificationTime: {
    fontSize: '11px',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  dismissBtn: {
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  notificationItemHover: {
    ':hover .dismiss-btn': {
      opacity: 1,
    },
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    width: '48px',
    height: '48px',
    color: tokens.colorNeutralForeground4,
    marginBottom: '12px',
  },
  emptyText: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
  },
  footer: {
    padding: '8px 16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    textAlign: 'center',
  },
});

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckmarkCircle24Regular />;
    case 'warning':
      return <Warning24Regular />;
    case 'error':
      return <ErrorCircle24Regular />;
    case 'info':
    default:
      return <Info24Regular />;
  }
};

const getIconClass = (type: NotificationType, styles: ReturnType<typeof useStyles>) => {
  switch (type) {
    case 'success':
      return styles.iconSuccess;
    case 'warning':
      return styles.iconWarning;
    case 'error':
      return styles.iconError;
    case 'info':
    default:
      return styles.iconInfo;
  }
};

export const NotificationCenter: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      setIsOpen(false);
      navigate(notification.actionUrl);
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeNotification(id);
  };

  return (
    <Popover
      open={isOpen}
      onOpenChange={(_, data) => setIsOpen(data.open)}
      positioning="below-end"
    >
      <PopoverTrigger disableButtonEnhancement>
        <span className={styles.trigger}>
          {unreadCount > 0 ? <Alert24Filled /> : <Alert24Regular />}
          {unreadCount > 0 && (
            <Badge
              appearance="filled"
              color="danger"
              size="small"
              className={styles.badge}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </span>
      </PopoverTrigger>
      <PopoverSurface className={styles.popover}>
        {/* Header */}
        <div className={styles.header}>
          <Text className={styles.headerTitle}>
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </Text>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <Button
                appearance="subtle"
                size="small"
                icon={<CheckmarkStarburst24Regular />}
                onClick={markAllAsRead}
                title="Mark all as read"
              />
            )}
            {notifications.length > 0 && (
              <Button
                appearance="subtle"
                size="small"
                icon={<Delete24Regular />}
                onClick={clearAll}
                title="Clear all"
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <Alert24Regular className={styles.emptyIcon} />
              <Text className={styles.emptyText}>No notifications yet</Text>
            </div>
          ) : (
            <div className={styles.notificationList}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.read ? styles.notificationItemUnread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`${styles.iconContainer} ${getIconClass(notification.type, styles)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationTitle}>
                      {!notification.read && <span className={styles.unreadDot} />}
                      {notification.title}
                    </div>
                    <div className={styles.notificationMessage}>{notification.message}</div>
                    <div className={styles.notificationTime}>
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<Dismiss16Regular />}
                    onClick={(e) => handleDismiss(e, notification.id)}
                    title="Dismiss"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverSurface>
    </Popover>
  );
};
