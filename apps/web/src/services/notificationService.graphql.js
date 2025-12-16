/**
 * Notification Service - GraphQL Implementation
 * Uses inline gql documents to bypass codegen requirement
 *
 * This service handles all notification operations via GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('NotificationService.GraphQL');

// =====================================================
// INLINE GRAPHQL DOCUMENTS - QUERIES
// =====================================================

const GetNotificationDocument = gql`
  query GetNotification($id: uuid!) {
    notifications_by_pk(id: $id) {
      id
      user_id
      title
      message
      type
      link
      read
      read_at
      created_at
    }
  }
`;

const ListUserNotificationsDocument = gql`
  query ListUserNotifications(
    $userId: String!
    $limit: Int = 50
    $offset: Int = 0
    $isRead: Boolean
  ) {
    notifications(
      where: {
        user_id: {_eq: $userId}
        read: {_eq: $isRead}
      }
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      user_id
      title
      message
      type
      link
      read
      read_at
      created_at
    }
    notifications_aggregate(
      where: {
        user_id: {_eq: $userId}
        read: {_eq: $isRead}
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const ListAllUserNotificationsDocument = gql`
  query ListAllUserNotifications(
    $userId: String!
    $limit: Int = 50
    $offset: Int = 0
  ) {
    notifications(
      where: {user_id: {_eq: $userId}}
      limit: $limit
      offset: $offset
      order_by: [{created_at: desc}]
    ) {
      id
      user_id
      title
      message
      type
      link
      read
      read_at
      created_at
    }
    notifications_aggregate(where: {user_id: {_eq: $userId}}) {
      aggregate {
        count
      }
    }
  }
`;

const GetUnreadCountDocument = gql`
  query GetUnreadCount($userId: String!) {
    notifications_aggregate(
      where: {
        user_id: {_eq: $userId}
        read: {_eq: false}
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GetNotificationsByTypeDocument = gql`
  query GetNotificationsByType(
    $userId: String!
    $type: String!
    $limit: Int = 20
  ) {
    notifications(
      where: {
        user_id: {_eq: $userId}
        type: {_eq: $type}
      }
      limit: $limit
      order_by: [{created_at: desc}]
    ) {
      id
      title
      message
      type
      link
      read
      created_at
    }
  }
`;

const GetRecentNotificationsDocument = gql`
  query GetRecentNotifications(
    $userId: String!
    $limit: Int = 10
  ) {
    notifications(
      where: {user_id: {_eq: $userId}}
      limit: $limit
      order_by: [{created_at: desc}]
    ) {
      id
      title
      message
      type
      read
      created_at
    }
  }
`;

// Query to find existing unread message notification for a specific conversation
// Uses related_id to store conversation_id for precise matching
const GetExistingMessageNotificationDocument = gql`
  query GetExistingMessageNotification(
    $userId: String!
    $conversationId: uuid!
  ) {
    notifications(
      where: {
        user_id: {_eq: $userId}
        type: {_eq: "message_received"}
        read: {_eq: false}
        related_id: {_eq: $conversationId}
        related_type: {_eq: "conversation"}
      }
      limit: 1
      order_by: [{created_at: desc}]
    ) {
      id
      title
      message
      created_at
    }
  }
`;

// =====================================================
// INLINE GRAPHQL DOCUMENTS - MUTATIONS
// =====================================================

const CreateNotificationDocument = gql`
  mutation CreateNotification($data: notifications_insert_input!) {
    insert_notifications_one(object: $data) {
      id
      user_id
      title
      message
      type
      link
      read
      created_at
      related_id
      related_type
    }
  }
`;

const CreateMultipleNotificationsDocument = gql`
  mutation CreateMultipleNotifications($data: [notifications_insert_input!]!) {
    insert_notifications(objects: $data) {
      affected_rows
      returning {
        id
        user_id
        title
        type
      }
    }
  }
`;

const UpdateNotificationDocument = gql`
  mutation UpdateNotification($id: uuid!, $data: notifications_set_input!) {
    update_notifications_by_pk(
      pk_columns: {id: $id}
      _set: $data
    ) {
      id
      title
      message
      type
      read
      updated_at
    }
  }
`;

const MarkAsReadDocument = gql`
  mutation MarkAsRead($id: uuid!) {
    update_notifications_by_pk(
      pk_columns: {id: $id}
      _set: {read: true, read_at: "now()"}
    ) {
      id
      read
      read_at
    }
  }
`;

const MarkMultipleAsReadDocument = gql`
  mutation MarkMultipleAsRead($ids: [uuid!]!) {
    update_notifications(
      where: {id: {_in: $ids}}
      _set: {read: true, read_at: "now()"}
    ) {
      affected_rows
      returning {
        id
        read
      }
    }
  }
`;

const MarkAllAsReadDocument = gql`
  mutation MarkAllAsRead($userId: String!) {
    update_notifications(
      where: {
        user_id: {_eq: $userId}
        read: {_eq: false}
      }
      _set: {read: true, read_at: "now()"}
    ) {
      affected_rows
    }
  }
`;

const MarkAsUnreadDocument = gql`
  mutation MarkAsUnread($id: uuid!) {
    update_notifications_by_pk(
      pk_columns: {id: $id}
      _set: {read: false, read_at: null}
    ) {
      id
      read
      read_at
    }
  }
`;

const DeleteNotificationDocument = gql`
  mutation DeleteNotification($id: uuid!) {
    delete_notifications_by_pk(id: $id) {
      id
    }
  }
`;

const DeleteMultipleNotificationsDocument = gql`
  mutation DeleteMultipleNotifications($ids: [uuid!]!) {
    delete_notifications(where: {id: {_in: $ids}}) {
      affected_rows
    }
  }
`;

const DeleteAllReadNotificationsDocument = gql`
  mutation DeleteAllReadNotifications($userId: String!) {
    delete_notifications(
      where: {
        user_id: {_eq: $userId}
        read: {_eq: true}
      }
    ) {
      affected_rows
    }
  }
`;

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export const graphqlNotificationService = {
  // =====================================================
  // QUERY METHODS
  // =====================================================

  /**
   * Get a single notification by ID
   */
  async getNotification(notificationId) {
    try {
      log.info('🔍 [GraphQL] Fetching notification:', notificationId);

      const { data, errors } = await apolloClient.query({
        query: GetNotificationDocument,
        variables: { id: notificationId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notification = data?.notifications_by_pk;

      if (!notification) {
        return {
          data: null,
          error: { code: 'NOTIFICATION_NOT_FOUND', message: 'Notification not found' },
        };
      }

      log.info('✅ [GraphQL] Notification fetched successfully');
      return { data: notification, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching notification:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user notifications with optional read filter
   */
  async getUserNotifications(userId, options = {}) {
    try {
      log.info('📋 [GraphQL] Fetching notifications for user:', userId);

      const variables = {
        userId,
        limit: options.limit || 50,
        offset: options.offset || 0,
      };

      // Add isRead filter if specified
      if (typeof options.isRead === 'boolean') {
        variables.isRead = options.isRead;
      }

      const { data, errors } = await apolloClient.query({
        query: typeof options.isRead === 'boolean'
          ? ListUserNotificationsDocument
          : ListAllUserNotificationsDocument,
        variables,
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notifications = data?.notifications || [];
      const totalCount = data?.notifications_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Fetched ${notifications.length} notifications (total: ${totalCount})`);
      return { data: notifications, count: totalCount, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching user notifications:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    try {
      log.info('🔢 [GraphQL] Getting unread count for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetUnreadCountDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const count = data?.notifications_aggregate?.aggregate?.count || 0;

      log.info(`✅ [GraphQL] Unread count: ${count}`);
      return { data: count, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error getting unread count:', error);
      return { data: 0, error };
    }
  },

  /**
   * Get notifications by type
   */
  async getNotificationsByType(userId, type, options = {}) {
    try {
      log.info(`📂 [GraphQL] Fetching ${type} notifications for user:`, userId);

      const { data, errors } = await apolloClient.query({
        query: GetNotificationsByTypeDocument,
        variables: {
          userId,
          type,
          limit: options.limit || 20,
        },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notifications = data?.notifications || [];

      log.info(`✅ [GraphQL] Fetched ${notifications.length} ${type} notifications`);
      return { data: notifications, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching notifications by type:', error);
      return { data: [], error };
    }
  },

  /**
   * Get recent notifications
   */
  async getRecentNotifications(userId, limit = 10) {
    try {
      log.info('🕐 [GraphQL] Fetching recent notifications for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetRecentNotificationsDocument,
        variables: { userId, limit },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notifications = data?.notifications || [];

      log.info(`✅ [GraphQL] Fetched ${notifications.length} recent notifications`);
      return { data: notifications, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error fetching recent notifications:', error);
      return { data: [], error };
    }
  },

  // =====================================================
  // MUTATION METHODS
  // =====================================================

  /**
   * Create a single notification
   */
  async createNotification(userId, notificationData) {
    try {
      log.info('➕ [GraphQL] Creating notification for user:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateNotificationDocument,
        variables: {
          data: {
            user_id: userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type || 'info',
            link: notificationData.link || null,
            // read has default value in database, don't set it on insert
            // metadata field doesn't exist in Hasura schema
          },
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notification = data?.insert_notifications_one;
      log.info('✅ [GraphQL] Notification created successfully:', notification?.id);
      return { data: notification, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error creating notification:', error);
      return { data: null, error };
    }
  },

  /**
   * Create or update a message notification (groups multiple messages from same conversation)
   * If there's an existing unread message notification for the same conversation, update it
   * Otherwise, create a new notification
   *
   * @param {string} recipientId - The user ID to receive the notification
   * @param {string} senderName - Display name of the sender
   * @param {string} messagePreview - Preview text of the latest message
   * @param {string} conversationId - The conversation ID (used for grouping)
   * @param {string} conversationLink - Link to navigate to the conversation
   */
  async createOrUpdateMessageNotification(recipientId, senderName, messagePreview, conversationId, conversationLink) {
    try {
      log.info('📬 [GraphQL] Creating/updating message notification for:', recipientId, 'conversation:', conversationId);
      console.log('[NotificationService] createOrUpdateMessageNotification called:', {
        recipientId,
        senderName,
        conversationId,
        conversationLink
      });

      let existingNotification = null;

      // Try to find existing unread notification for this conversation
      try {
        console.log('[NotificationService] Querying for existing notification with:', {
          userId: recipientId,
          conversationId: conversationId,
        });
        const { data: existingData, errors } = await apolloClient.query({
          query: GetExistingMessageNotificationDocument,
          variables: {
            userId: recipientId,
            conversationId: conversationId,
          },
          fetchPolicy: 'network-only',
        });
        if (errors) {
          console.error('[NotificationService] Query errors:', errors);
        }
        console.log('[NotificationService] Query result:', existingData);
        existingNotification = existingData?.notifications?.[0];
        log.debug('📋 [GraphQL] Existing notification found:', existingNotification?.id || 'none');
        console.log('[NotificationService] Existing notification:', existingNotification || 'none');
      } catch (queryError) {
        // If query fails, just create a new notification
        log.warn('⚠️ [GraphQL] Could not check for existing notification:', queryError.message);
        console.error('[NotificationService] Query failed:', queryError);
      }

      if (existingNotification) {
        // Update existing notification with new message count and preview
        try {
          const countMatch = existingNotification.title.match(/\((\d+)\s+(?:new\s+)?messages?\)/i);
          const currentCount = countMatch ? parseInt(countMatch[1], 10) : 1;
          const newCount = currentCount + 1;

          const newTitle = `${senderName} (${newCount} messages)`;

          const { data: updateData } = await apolloClient.mutate({
            mutation: UpdateNotificationDocument,
            variables: {
              id: existingNotification.id,
              data: {
                title: newTitle,
                message: messagePreview,
                // Bump to top of list
                created_at: new Date().toISOString(),
              },
            },
          });

          log.info('✅ [GraphQL] Message notification updated (count:', newCount, ')');
          return { data: updateData?.update_notifications_by_pk, error: null, updated: true, count: newCount };
        } catch (updateError) {
          log.warn('⚠️ [GraphQL] Update failed, creating new notification:', updateError.message);
          // Fall through to create new notification
        }
      }

      // Create new notification with related_id for future grouping
      const notificationData = {
        user_id: recipientId,
        title: `${senderName}`,
        message: messagePreview,
        type: 'message_received',
        link: conversationLink,
        related_id: conversationId,
        related_type: 'conversation',
      };
      console.log('[NotificationService] Creating NEW notification with data:', notificationData);

      const { data: createData, errors: createErrors } = await apolloClient.mutate({
        mutation: CreateNotificationDocument,
        variables: {
          data: notificationData,
        },
      });

      if (createErrors) {
        console.error('[NotificationService] Create errors:', createErrors);
      }
      console.log('[NotificationService] Created notification:', createData?.insert_notifications_one);
      log.info('✅ [GraphQL] New message notification created');
      return { data: createData?.insert_notifications_one, error: null, updated: false, count: 1 };
    } catch (error) {
      log.error('❌ [GraphQL] Error creating/updating message notification:', error);
      return { data: null, error };
    }
  },

  /**
   * Create multiple notifications (bulk)
   */
  async createMultipleNotifications(notificationsData) {
    try {
      log.info('➕ [GraphQL] Creating multiple notifications:', notificationsData.length);

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateMultipleNotificationsDocument,
        variables: { data: notificationsData },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const result = data?.insert_notifications;
      log.info(`✅ [GraphQL] Created ${result?.affected_rows || 0} notifications`);
      return { data: result, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error creating multiple notifications:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a notification
   */
  async updateNotification(notificationId, updates) {
    try {
      log.info('✏️ [GraphQL] Updating notification:', notificationId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateNotificationDocument,
        variables: {
          id: notificationId,
          data: updates,
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notification = data?.update_notifications_by_pk;
      log.info('✅ [GraphQL] Notification updated successfully');
      return { data: notification, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error updating notification:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      log.info('✓ [GraphQL] Marking notification as read:', notificationId);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkAsReadDocument,
        variables: { id: notificationId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notification = data?.update_notifications_by_pk;
      log.info('✅ [GraphQL] Notification marked as read');
      return { data: notification, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error marking notification as read:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds) {
    try {
      log.info('✓ [GraphQL] Marking multiple notifications as read:', notificationIds.length);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkMultipleAsReadDocument,
        variables: { ids: notificationIds },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const affectedRows = data?.update_notifications?.affected_rows || 0;
      log.info(`✅ [GraphQL] Marked ${affectedRows} notifications as read`);
      return { data: affectedRows, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error marking multiple notifications as read:', error);
      return { data: 0, error };
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      log.info('✓ [GraphQL] Marking all notifications as read for user:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkAllAsReadDocument,
        variables: { userId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const affectedRows = data?.update_notifications?.affected_rows || 0;
      log.info(`✅ [GraphQL] Marked ${affectedRows} notifications as read`);
      return { data: affectedRows, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error marking all notifications as read:', error);
      return { data: 0, error };
    }
  },

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId) {
    try {
      log.info('✗ [GraphQL] Marking notification as unread:', notificationId);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkAsUnreadDocument,
        variables: { id: notificationId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notification = data?.update_notifications_by_pk;
      log.info('✅ [GraphQL] Notification marked as unread');
      return { data: notification, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error marking notification as unread:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      log.info('🗑️ [GraphQL] Deleting notification:', notificationId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteNotificationDocument,
        variables: { id: notificationId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const notification = data?.delete_notifications_by_pk;
      log.info('✅ [GraphQL] Notification deleted successfully');
      return { data: notification, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error deleting notification:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete multiple notifications
   */
  async deleteMultipleNotifications(notificationIds) {
    try {
      log.info('🗑️ [GraphQL] Deleting multiple notifications:', notificationIds.length);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteMultipleNotificationsDocument,
        variables: { ids: notificationIds },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const affectedRows = data?.delete_notifications?.affected_rows || 0;
      log.info(`✅ [GraphQL] Deleted ${affectedRows} notifications`);
      return { data: affectedRows, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error deleting multiple notifications:', error);
      return { data: 0, error };
    }
  },

  /**
   * Delete all read notifications for a user
   */
  async deleteAllReadNotifications(userId) {
    try {
      log.info('🗑️ [GraphQL] Deleting all read notifications for user:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteAllReadNotificationsDocument,
        variables: { userId },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const affectedRows = data?.delete_notifications?.affected_rows || 0;
      log.info(`✅ [GraphQL] Deleted ${affectedRows} read notifications`);
      return { data: affectedRows, error: null };
    } catch (error) {
      log.error('❌ [GraphQL] Error deleting read notifications:', error);
      return { data: 0, error };
    }
  },
};

export default graphqlNotificationService;
