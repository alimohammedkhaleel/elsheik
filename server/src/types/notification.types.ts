export type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';

export interface SystemNotification {
  id: number;
  user_id?: number | null;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}
