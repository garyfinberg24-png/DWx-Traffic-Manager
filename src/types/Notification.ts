export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationCategory =
  | 'booking'
  | 'approval'
  | 'checklist'
  | 'system'
  | 'deal'
  | 'pipeline'
  | 'proposal'
  | 'product'
  | 'admin';

export interface AppNotification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  bookingId?: number;
}


