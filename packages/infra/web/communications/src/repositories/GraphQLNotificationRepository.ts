/**
 * GraphQL Implementation of NotificationRepository
 */

import { gql } from '@apollo/client';
import {
  Notification,
  NotificationRepository,
  NotificationSearchCriteria,
  NotificationType,
} from '@ethio/domain-communications';

export class GraphQLNotificationRepository implements NotificationRepository {
  // Using 'any' type for Apollo Client 4 compatibility - proper typing requires generated types
  constructor(private readonly client: any) {}

  async findById(id: string): Promise<Notification | null> {
    const { data } = await this.client.query({
      query: gql`
        query GetNotification($id: uuid!) {
          notifications_by_pk(id: $id) {
            id
            user_id
            type
            title
            message
            related_entity_type
            related_entity_id
            action_url
            metadata
            is_read
            read_at
            priority
            expires_at
            created_at
            updated_at
          }
        }
      `,
      variables: { id },
    });

    return data?.notifications_by_pk ? this.mapToEntity(data.notifications_by_pk) : null;
  }

  async findByUserId(
    userId: string,
    isRead?: boolean,
    limit?: number,
    offset?: number
  ): Promise<Notification[]> {
    const where: any = { user_id: { _eq: userId } };
    if (isRead !== undefined) {
      where.is_read = { _eq: isRead };
    }

    const { data } = await this.client.query({
      query: gql`
        query GetUserNotifications($where: notifications_bool_exp!, $limit: Int!, $offset: Int!) {
          notifications(where: $where, limit: $limit, offset: $offset, order_by: { created_at: desc }) {
            id
            user_id
            type
            title
            message
            related_entity_type
            related_entity_id
            action_url
            metadata
            is_read
            read_at
            priority
            expires_at
            created_at
            updated_at
          }
        }
      `,
      variables: {
        where,
        limit: limit || 50,
        offset: offset || 0,
      },
    });

    return (data?.notifications || []).map((notif: any) => this.mapToEntity(notif));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { data } = await this.client.query({
      query: gql`
        query GetUnreadNotificationCount($user_id: uuid!) {
          notifications_aggregate(
            where: {
              user_id: { _eq: $user_id }
              is_read: { _eq: false }
            }
          ) {
            aggregate {
              count
            }
          }
        }
      `,
      variables: { user_id: userId },
    });

    return data?.notifications_aggregate?.aggregate?.count || 0;
  }

  async getUnreadNotifications(userId: string, limit?: number): Promise<Notification[]> {
    return this.findByUserId(userId, false, limit);
  }

  async findByType(
    userId: string,
    type: NotificationType,
    limit?: number
  ): Promise<Notification[]> {
    const { data } = await this.client.query({
      query: gql`
        query GetNotificationsByType($user_id: uuid!, $type: String!, $limit: Int!) {
          notifications(
            where: {
              user_id: { _eq: $user_id }
              type: { _eq: $type }
            }
            order_by: { created_at: desc }
            limit: $limit
          ) {
            id
            user_id
            type
            title
            message
            related_entity_type
            related_entity_id
            action_url
            metadata
            is_read
            read_at
            priority
            expires_at
            created_at
            updated_at
          }
        }
      `,
      variables: { user_id: userId, type, limit: limit || 50 },
    });

    return (data?.notifications || []).map((notif: any) => this.mapToEntity(notif));
  }

  async search(criteria: NotificationSearchCriteria): Promise<Notification[]> {
    const where: any = {};

    if (criteria.userId) {
      where.user_id = { _eq: criteria.userId };
    }
    if (criteria.type) {
      where.type = { _eq: criteria.type };
    }
    if (criteria.isRead !== undefined) {
      where.is_read = { _eq: criteria.isRead };
    }
    if (criteria.priority) {
      where.priority = { _eq: criteria.priority };
    }

    const { data } = await this.client.query({
      query: gql`
        query SearchNotifications($where: notifications_bool_exp!, $limit: Int!, $offset: Int!) {
          notifications(where: $where, limit: $limit, offset: $offset, order_by: { created_at: desc }) {
            id
            user_id
            type
            title
            message
            related_entity_type
            related_entity_id
            action_url
            metadata
            is_read
            read_at
            priority
            expires_at
            created_at
            updated_at
          }
        }
      `,
      variables: {
        where,
        limit: criteria.limit || 50,
        offset: criteria.offset || 0,
      },
    });

    return (data?.notifications || []).map((notif: any) => this.mapToEntity(notif));
  }

  async save(notification: Notification): Promise<void> {
    const input = {
      id: notification.id,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      related_entity_type: notification.relatedEntityType,
      related_entity_id: notification.relatedEntityId,
      action_url: notification.actionUrl,
      metadata: notification.metadata,
      is_read: notification.isRead,
      read_at: notification.readAt,
      priority: notification.priority,
      expires_at: notification.expiresAt,
      updated_at: new Date(),
    };

    await this.client.mutate({
      mutation: gql`
        mutation UpsertNotification($input: notifications_insert_input!) {
          insert_notifications_one(
            object: $input
            on_conflict: { constraint: notifications_pkey, update_columns: [
              user_id, type, title, message, related_entity_type, related_entity_id,
              action_url, metadata, is_read, read_at, priority, expires_at, updated_at
            ]}
          ) {
            id
          }
        }
      `,
      variables: { input },
    });
  }

  async delete(id: string): Promise<void> {
    await this.client.mutate({
      mutation: gql`
        mutation DeleteNotification($id: uuid!) {
          delete_notifications_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: { id },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.client.mutate({
      mutation: gql`
        mutation MarkAllNotificationsAsRead($user_id: uuid!) {
          update_notifications(
            where: {
              user_id: { _eq: $user_id }
              is_read: { _eq: false }
            }
            _set: {
              is_read: true
              read_at: "now()"
            }
          ) {
            affected_rows
          }
        }
      `,
      variables: { user_id: userId },
    });
  }

  async deleteAllRead(userId: string): Promise<void> {
    await this.client.mutate({
      mutation: gql`
        mutation DeleteAllReadNotifications($user_id: uuid!) {
          delete_notifications(
            where: {
              user_id: { _eq: $user_id }
              is_read: { _eq: true }
            }
          ) {
            affected_rows
          }
        }
      `,
      variables: { user_id: userId },
    });
  }

  async deleteExpired(): Promise<number> {
    const { data } = await this.client.mutate({
      mutation: gql`
        mutation DeleteExpiredNotifications {
          delete_notifications(
            where: {
              expires_at: { _lt: "now()" }
            }
          ) {
            affected_rows
          }
        }
      `,
    });

    return data?.delete_notifications?.affected_rows || 0;
  }

  private mapToEntity(data: any): Notification {
    return new Notification({
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      relatedEntityType: data.related_entity_type,
      relatedEntityId: data.related_entity_id,
      actionUrl: data.action_url,
      metadata: data.metadata || {},
      isRead: data.is_read,
      readAt: data.read_at,
      priority: data.priority,
      expiresAt: data.expires_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }
}
