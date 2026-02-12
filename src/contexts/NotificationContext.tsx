import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { AppNotification, NotificationCategory } from '../types/Notification';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const STORAGE_KEY = 'dwx_notifications';
const MAX_NOTIFICATIONS = 50;

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================================================
// Seed Notifications (for test/demo mode)
// ============================================================================

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'seed-1',
    type: 'success',
    category: 'deal',
    title: 'Deal Won',
    message: 'SmallBiz Solutions - Training closed at R60,000. Post-mortem created.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    read: false,
    actionUrl: '/requests',
  },
  {
    id: 'seed-2',
    type: 'info',
    category: 'pipeline',
    title: 'Specialist Assigned',
    message: 'John Smith assigned to Acme Corporation - Power Platform Development.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    read: false,
    actionUrl: '/requests',
  },
  {
    id: 'seed-3',
    type: 'info',
    category: 'pipeline',
    title: 'Stage Changed',
    message: 'TechVision Inc - SPFx Development moved from Lead to Qualified.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    read: false,
    actionUrl: '/requests',
  },
  {
    id: 'seed-4',
    type: 'success',
    category: 'pipeline',
    title: 'Discovery Meeting Confirmed',
    message: 'GlobalTech Solutions - M365 Assessment on Feb 15, 2026. Calendar event created.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    read: false,
    actionUrl: '/requests',
  },
  {
    id: 'seed-5',
    type: 'info',
    category: 'proposal',
    title: 'Proposal Created',
    message: 'MegaCorp Ltd - Copilot Agents proposal (Draft v1) auto-generated.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    read: true,
    actionUrl: '/requests',
  },
  {
    id: 'seed-6',
    type: 'warning',
    category: 'pipeline',
    title: 'Deal Needs Attention',
    message: 'Innovate Partners - Strategic Advisory has been idle for 10 days.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    read: true,
    actionUrl: '/requests',
  },
  {
    id: 'seed-7',
    type: 'success',
    category: 'deal',
    title: 'New Service Request',
    message: 'CloudFirst - SharePoint Migration submitted by Test Account Manager.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    read: true,
    actionUrl: '/requests',
  },
  {
    id: 'seed-8',
    type: 'error',
    category: 'pipeline',
    title: 'Deal Lost',
    message: 'DataDriven Analytics - SLA Management lost due to budget constraints.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    read: true,
    actionUrl: '/requests',
  },
  {
    id: 'seed-9',
    type: 'info',
    category: 'product',
    title: 'Product Demo Requested',
    message: 'FutureBank - HyperNav demo requested for Feb 18, 2026.',
    timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
    read: true,
    actionUrl: '/requests',
  },
  {
    id: 'seed-10',
    type: 'success',
    category: 'proposal',
    title: 'Proposal Approved',
    message: 'CloudFirst - SharePoint Migration proposal approved for client delivery.',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    read: true,
    actionUrl: '/requests',
  },
];

// ============================================================================
// Provider
// ============================================================================

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load notifications from localStorage on mount, seed if empty
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const restored = parsed.map((n: AppNotification) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setNotifications(restored);
      } else {
        // Seed with mock notifications on first load
        setNotifications(SEED_NOTIFICATIONS);
      }
    } catch (error) {
      console.warn('Failed to load notifications from storage:', error);
      setNotifications(SEED_NOTIFICATIONS);
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (notifications.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      } catch (error) {
        console.warn('Failed to save notifications to storage:', error);
      }
    }
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const addNotification = useCallback(
    (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: AppNotification = {
        ...notification,
        id: generateId(),
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => {
        // Add new notification at the beginning, limit total count
        const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
        return updated;
      });
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent fail
    }
  }, []);

  const value: NotificationContextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
    }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, removeNotification, clearAll]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Helper hook to easily create notifications
export const useNotify = () => {
  const { addNotification } = useNotifications();

  return {
    info: (title: string, message: string, category: NotificationCategory = 'system', options?: Partial<AppNotification>) =>
      addNotification({ type: 'info', category, title, message, ...options }),
    success: (title: string, message: string, category: NotificationCategory = 'system', options?: Partial<AppNotification>) =>
      addNotification({ type: 'success', category, title, message, ...options }),
    warning: (title: string, message: string, category: NotificationCategory = 'system', options?: Partial<AppNotification>) =>
      addNotification({ type: 'warning', category, title, message, ...options }),
    error: (title: string, message: string, category: NotificationCategory = 'system', options?: Partial<AppNotification>) =>
      addNotification({ type: 'error', category, title, message, ...options }),
  };
};
