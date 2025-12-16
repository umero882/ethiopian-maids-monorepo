/**
 * Notification Entity
 *
 * Represents a notification sent to a user.
 * Notifications can be read, dismissed, or deleted.
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

export interface NotificationProps {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: Date | null;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  metadata: Record<string, any>;
  isRead: boolean;
  readAt: Date | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: NotificationProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.type = props.type;
    this.title = props.title;
    this.message = props.message;
    this.relatedEntityType = props.relatedEntityType;
    this.relatedEntityId = props.relatedEntityId;
    this.actionUrl = props.actionUrl;
    this.metadata = props.metadata || {};
    this.isRead = props.isRead;
    this.readAt = props.readAt || null;
    this.priority = props.priority || 'normal';
    this.expiresAt = props.expiresAt || null;
    this.createdAt = props.createdAt || new Date();
    this.updatedAt = props.updatedAt || new Date();

    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Notification ID is required');
    }
    if (!this.userId || this.userId.trim() === '') {
      throw new Error('User ID is required');
    }
    if (!this.title || this.title.trim() === '') {
      throw new Error('Notification title is required');
    }
    if (!this.message || this.message.trim() === '') {
      throw new Error('Notification message is required');
    }
  }

  /**
   * Mark notification as read
   */
  markAsRead(): void {
    if (this.isRead) {
      throw new Error('Notification is already marked as read');
    }

    this.isRead = true;
    this.readAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Check if notification has expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Check if notification is urgent
   */
  isUrgent(): boolean {
    return this.priority === 'urgent';
  }

  /**
   * Check if notification is high priority
   */
  isHighPriority(): boolean {
    return this.priority === 'high' || this.priority === 'urgent';
  }

  /**
   * Create a new notification
   */
  static create(
    props: Omit<NotificationProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Notification {
    return new Notification({
      ...props,
      id: crypto.randomUUID(),
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
