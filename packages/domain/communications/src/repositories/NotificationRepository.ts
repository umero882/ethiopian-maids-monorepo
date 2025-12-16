/**
 * Notification Repository Interface
 *
 * Defines the contract for persisting and retrieving notifications.
 * Infrastructure layer will implement this interface using GraphQL, REST, etc.
 */

import { Notification, NotificationType } from '../entities/Notification.js';

export interface NotificationSearchCriteria {
  userId?: string;
  type?: NotificationType;
  isRead?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  limit?: number;
  offset?: number;
}

export interface NotificationRepository {
  /**
   * Find a notification by its ID
   */
  findById(id: string): Promise<Notification | null>;

  /**
   * Get all notifications for a user
   */
  findByUserId(userId: string, isRead?: boolean, limit?: number, offset?: number): Promise<Notification[]>;

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Get unread notifications for a user
   */
  getUnreadNotifications(userId: string, limit?: number): Promise<Notification[]>;

  /**
   * Get notifications by type for a user
   */
  findByType(userId: string, type: NotificationType, limit?: number): Promise<Notification[]>;

  /**
   * Search notifications with filters
   */
  search(criteria: NotificationSearchCriteria): Promise<Notification[]>;

  /**
   * Save or update a notification
   */
  save(notification: Notification): Promise<void>;

  /**
   * Delete a notification
   */
  delete(id: string): Promise<void>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<void>;

  /**
   * Delete all read notifications for a user
   */
  deleteAllRead(userId: string): Promise<void>;

  /**
   * Delete expired notifications
   */
  deleteExpired(): Promise<number>;
}
