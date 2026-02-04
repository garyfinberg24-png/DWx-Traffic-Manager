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

const STORAGE_KEY = 'lp_notifications';
const MAX_NOTIFICATIONS = 50;

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Load notifications from localStorage on mount
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
      }
    } catch (error) {
      console.warn('Failed to load notifications from storage:', error);
    }
  }, []);

  // Save notifications to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.warn('Failed to save notifications to storage:', error);
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
