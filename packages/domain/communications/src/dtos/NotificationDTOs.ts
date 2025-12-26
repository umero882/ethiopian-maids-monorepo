/**
 * Notification DTOs (Data Transfer Objects)
 *
 * These objects define the shape of data going in and out of notification use cases.
 */

import type { NotificationType } from '../entities/Notification.js';

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
