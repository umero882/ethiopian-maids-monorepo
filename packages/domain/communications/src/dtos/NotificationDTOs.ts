/**
 * Notification DTOs (Data Transfer Objects)
 *
 * These objects define the shape of data going in and out of notification use cases.
 */

export type NotificationType =
  | 'application_received'
  | 'application_reviewed'
  | 'application_shortlisted'
  | 'application_accepted'
  | 'application_rejected'
  | 'message_received'
  | 'profile_approved'
  | 'profile_rejected'
  | 'job_posted'
  | 'job_closed'
  | 'system_announcement'
  | 'other';

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date | string;
}

export interface GetUserNotificationsDTO {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface MarkNotificationAsReadDTO {
  notificationId: string;
  userId: string;
}

export interface MarkAllNotificationsAsReadDTO {
  userId: string;
}

export interface DeleteNotificationDTO {
  notificationId: string;
  userId: string;
}

export interface GetUnreadCountDTO {
  userId: string;
}
