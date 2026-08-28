import { apiClient } from './client';

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

export interface NotificationsResponse {
  notifications: SystemNotification[];
  unreadCount: number;
}

export class NotificationService {
  async getNotifications(): Promise<NotificationsResponse> {
    const response = await apiClient.get<NotificationsResponse>('/notifications');
    if (!response.success || !response.data) {
      return { notifications: [], unreadCount: 0 };
    }
    return response.data;
  }

  async markAsRead(id: number): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`, {});
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.put('/notifications/read-all', {});
  }
}

export const notificationService = new NotificationService();
