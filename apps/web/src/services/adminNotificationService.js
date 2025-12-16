/**
 * Admin Notification Service
 * GraphQL service for admin notifications with role-based filtering
 *
 * Handles both backward notifications (platform -> admin) and
 * forward notifications (admin -> users)
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminNotificationService');

// =====================================================
// CONSTANTS
// =====================================================

export const ADMIN_NOTIFICATION_CATEGORIES = {
  USER_EVENT: 'admin_user_event',
  CONTENT_MODERATION: 'admin_content_mod',
  FINANCIAL_ALERT: 'admin_financial',
  SYSTEM_ALERT: 'admin_system',
  ADMIN_ACTION: 'admin_action',
  ADMIN_ANNOUNCEMENT: 'admin_announcement',
};

export const ADMIN_NOTIFICATION_TYPES = {
  // User Events
  NEW_USER_REGISTRATION: 'new_user_registration',
  NEW_MAID_PROFILE: 'new_maid_profile',
  NEW_AGENCY_REGISTRATION: 'new_agency_registration',
  USER_VERIFICATION_REQUEST: 'user_verification_request',
  USER_SUSPENDED: 'user_suspended',
  USER_REACTIVATED: 'user_reactivated',

  // Content Moderation
  PROFILE_REVIEW_PENDING: 'profile_review_pending',
  CONTENT_FLAGGED: 'content_flagged',
  MEDIA_APPROVAL_NEEDED: 'media_approval_needed',
  JOB_LISTING_REVIEW: 'job_listing_review',
  REVIEW_REPORTED: 'review_reported',

  // Financial
  PAYMENT_FAILED: 'payment_failed',
  REFUND_REQUEST: 'refund_request',
  SUBSCRIPTION_CHANGE: 'subscription_change',
  PAYOUT_ISSUE: 'payout_issue',
  TRANSACTION_ALERT: 'transaction_alert',
  HIGH_VALUE_TRANSACTION: 'high_value_transaction',

  // System
  SYSTEM_ERROR: 'system_error',
  HIGH_TRAFFIC_ALERT: 'high_traffic_alert',
  SECURITY_EVENT: 'security_event',
  MAINTENANCE_REMINDER: 'maintenance_reminder',
  DATABASE_ALERT: 'database_alert',
  API_ERROR: 'api_error',
};

// Role to category permission mapping
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    ADMIN_NOTIFICATION_CATEGORIES.USER_EVENT,
    ADMIN_NOTIFICATION_CATEGORIES.CONTENT_MODERATION,
    ADMIN_NOTIFICATION_CATEGORIES.FINANCIAL_ALERT,
    ADMIN_NOTIFICATION_CATEGORIES.SYSTEM_ALERT,
  ],
  MODERATOR: [
    ADMIN_NOTIFICATION_CATEGORIES.USER_EVENT,
    ADMIN_NOTIFICATION_CATEGORIES.CONTENT_MODERATION,
  ],
  SUPPORT_AGENT: [
    ADMIN_NOTIFICATION_CATEGORIES.USER_EVENT,
  ],
  FINANCIAL_ADMIN: [
    ADMIN_NOTIFICATION_CATEGORIES.FINANCIAL_ALERT,
  ],
  CONTENT_MODERATOR: [
    ADMIN_NOTIFICATION_CATEGORIES.CONTENT_MODERATION,
  ],
};

// =====================================================
// GRAPHQL DOCUMENTS
// =====================================================

const GetAdminNotificationsDocument = gql`
  query GetAdminNotifications(
    $where: notifications_bool_exp!
    $limit: Int = 50
    $offset: Int = 0
  ) {
    notifications(
      where: $where
      order_by: [{ created_at: desc }]
      limit: $limit
      offset: $offset
    ) {
      id
      user_id
      title
      message
      type
      link
      action_url
      read
      read_at
      priority
      related_id
      related_type
      created_at
      expires_at
    }
    notifications_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GetAdminUnreadCountDocument = gql`
  query GetAdminUnreadCount($where: notifications_bool_exp!) {
    notifications_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GetAdminNotificationByIdDocument = gql`
  query GetAdminNotificationById($id: uuid!) {
    notifications_by_pk(id: $id) {
      id
      user_id
      title
      message
      type
      link
      action_url
      read
      read_at
      priority
      related_id
      related_type
      created_at
      expires_at
    }
  }
`;

const MarkAdminNotificationReadDocument = gql`
  mutation MarkAdminNotificationRead($id: uuid!) {
    update_notifications_by_pk(
      pk_columns: { id: $id }
      _set: { read: true, read_at: "now()" }
    ) {
      id
      read
      read_at
    }
  }
`;

const MarkMultipleAdminNotificationsReadDocument = gql`
  mutation MarkMultipleAdminNotificationsRead($ids: [uuid!]!) {
    update_notifications(
      where: { id: { _in: $ids } }
      _set: { read: true, read_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

const MarkAllAdminNotificationsReadDocument = gql`
  mutation MarkAllAdminNotificationsRead($where: notifications_bool_exp!) {
    update_notifications(
      where: $where
      _set: { read: true, read_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

const DeleteAdminNotificationDocument = gql`
  mutation DeleteAdminNotification($id: uuid!) {
    delete_notifications_by_pk(id: $id) {
      id
    }
  }
`;

const DeleteMultipleAdminNotificationsDocument = gql`
  mutation DeleteMultipleAdminNotifications($ids: [uuid!]!) {
    delete_notifications(where: { id: { _in: $ids } }) {
      affected_rows
    }
  }
`;

const CreateAdminNotificationDocument = gql`
  mutation CreateAdminNotification($data: notifications_insert_input!) {
    insert_notifications_one(object: $data) {
      id
      title
      type
      created_at
    }
  }
`;

const BroadcastNotificationsDocument = gql`
  mutation BroadcastNotifications($notifications: [notifications_insert_input!]!) {
    insert_notifications(objects: $notifications) {
      affected_rows
      returning {
        id
        user_id
        title
      }
    }
  }
`;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Build the where clause for admin notifications based on role
 */
function buildAdminNotificationWhere(adminId, role, filters = {}) {
  const allowedCategories = ROLE_PERMISSIONS[role?.toUpperCase()] || [];
  const isSuperAdmin = allowedCategories.includes('*');

  // Base conditions for admin notifications
  const conditions = [];

  // Admin notifications are those with category starting with 'admin_'
  // OR targeted to specific admin
  // OR targeted to admin's role
  const orConditions = [];

  // Notifications targeted to this specific admin
  orConditions.push({ user_id: { _eq: adminId } });

  // Category-based notifications
  if (isSuperAdmin) {
    // Super admin sees all admin notifications
    orConditions.push({ type: { _like: 'admin_%' } });
    orConditions.push({ type: { _in: Object.values(ADMIN_NOTIFICATION_TYPES) } });
  } else {
    // Role-based filtering - only see allowed categories
    allowedCategories.forEach(category => {
      orConditions.push({ type: { _like: `${category}%` } });
    });
  }

  conditions.push({ _or: orConditions });

  // Apply filters
  if (filters.category) {
    conditions.push({ type: { _like: `${filters.category}%` } });
  }

  if (filters.priority) {
    conditions.push({ priority: { _eq: filters.priority } });
  }

  if (typeof filters.read === 'boolean') {
    conditions.push({ read: { _eq: filters.read } });
  }

  if (filters.type) {
    conditions.push({ type: { _eq: filters.type } });
  }

  if (filters.search) {
    conditions.push({
      _or: [
        { title: { _ilike: `%${filters.search}%` } },
        { message: { _ilike: `%${filters.search}%` } },
      ],
    });
  }

  if (filters.startDate) {
    conditions.push({ created_at: { _gte: filters.startDate } });
  }

  if (filters.endDate) {
    conditions.push({ created_at: { _lte: filters.endDate } });
  }

  // Exclude expired notifications
  conditions.push({
    _or: [
      { expires_at: { _is_null: true } },
      { expires_at: { _gt: new Date().toISOString() } },
    ],
  });

  return { _and: conditions };
}

/**
 * Get icon and color for notification type
 */
export function getNotificationMeta(type, priority) {
  const meta = {
    icon: 'Bell',
    color: 'gray',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-500',
  };

  // Priority overrides
  if (priority === 'urgent') {
    return { icon: 'AlertCircle', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-600' };
  }
  if (priority === 'high') {
    return { icon: 'AlertTriangle', color: 'orange', bgColor: 'bg-orange-50', textColor: 'text-orange-600' };
  }

  // Type-based
  if (type?.includes('user') || type?.includes('registration')) {
    return { icon: 'UserPlus', color: 'blue', bgColor: 'bg-blue-50', textColor: 'text-blue-600' };
  }
  if (type?.includes('content') || type?.includes('profile') || type?.includes('media')) {
    return { icon: 'FileText', color: 'purple', bgColor: 'bg-purple-50', textColor: 'text-purple-600' };
  }
  if (type?.includes('financial') || type?.includes('payment') || type?.includes('refund')) {
    return { icon: 'DollarSign', color: 'green', bgColor: 'bg-green-50', textColor: 'text-green-600' };
  }
  if (type?.includes('system') || type?.includes('error') || type?.includes('security')) {
    return { icon: 'Settings', color: 'red', bgColor: 'bg-red-50', textColor: 'text-red-600' };
  }

  return meta;
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category) {
  const labels = {
    [ADMIN_NOTIFICATION_CATEGORIES.USER_EVENT]: 'User Events',
    [ADMIN_NOTIFICATION_CATEGORIES.CONTENT_MODERATION]: 'Content Moderation',
    [ADMIN_NOTIFICATION_CATEGORIES.FINANCIAL_ALERT]: 'Financial',
    [ADMIN_NOTIFICATION_CATEGORIES.SYSTEM_ALERT]: 'System',
    [ADMIN_NOTIFICATION_CATEGORIES.ADMIN_ACTION]: 'Admin Actions',
    [ADMIN_NOTIFICATION_CATEGORIES.ADMIN_ANNOUNCEMENT]: 'Announcements',
  };
  return labels[category] || category;
}

// =====================================================
// SERVICE IMPLEMENTATION
// =====================================================

export const adminNotificationService = {
  /**
   * Get admin notifications with role-based filtering
   */
  async getNotifications(adminId, role, options = {}) {
    try {
      log.info('Fetching admin notifications', { adminId, role, options });

      const where = buildAdminNotificationWhere(adminId, role, options.filters);

      const { data, errors } = await apolloClient.query({
        query: GetAdminNotificationsDocument,
        variables: {
          where,
          limit: options.limit || 50,
          offset: options.offset || 0,
        },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const notifications = data?.notifications || [];
      const totalCount = data?.notifications_aggregate?.aggregate?.count || 0;

      log.info(`Fetched ${notifications.length} admin notifications (total: ${totalCount})`);
      return { data: notifications, count: totalCount, error: null };
    } catch (error) {
      log.error('Error fetching admin notifications:', error);
      return { data: [], count: 0, error };
    }
  },

  /**
   * Get unread count for admin badge
   */
  async getUnreadCount(adminId, role) {
    try {
      log.info('Getting admin unread count', { adminId, role });

      const where = buildAdminNotificationWhere(adminId, role, { read: false });

      const { data, errors } = await apolloClient.query({
        query: GetAdminUnreadCountDocument,
        variables: { where },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      const count = data?.notifications_aggregate?.aggregate?.count || 0;
      log.info(`Admin unread count: ${count}`);
      return { data: count, error: null };
    } catch (error) {
      log.error('Error getting admin unread count:', error);
      return { data: 0, error };
    }
  },

  /**
   * Get single notification by ID
   */
  async getNotificationById(notificationId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetAdminNotificationByIdDocument,
        variables: { id: notificationId },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.notifications_by_pk, error: null };
    } catch (error) {
      log.error('Error fetching notification:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId) {
    try {
      log.info('Marking notification as read:', notificationId);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkAdminNotificationReadDocument,
        variables: { id: notificationId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_notifications_by_pk, error: null };
    } catch (error) {
      log.error('Error marking notification as read:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark multiple notifications as read
   */
  async markMultipleAsRead(notificationIds) {
    try {
      log.info('Marking multiple notifications as read:', notificationIds.length);

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkMultipleAdminNotificationsReadDocument,
        variables: { ids: notificationIds },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_notifications?.affected_rows || 0, error: null };
    } catch (error) {
      log.error('Error marking notifications as read:', error);
      return { data: 0, error };
    }
  },

  /**
   * Mark all admin notifications as read
   */
  async markAllAsRead(adminId, role) {
    try {
      log.info('Marking all admin notifications as read', { adminId, role });

      const where = buildAdminNotificationWhere(adminId, role, { read: false });

      const { data, errors } = await apolloClient.mutate({
        mutation: MarkAllAdminNotificationsReadDocument,
        variables: { where },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.update_notifications?.affected_rows || 0, error: null };
    } catch (error) {
      log.error('Error marking all notifications as read:', error);
      return { data: 0, error };
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId) {
    try {
      log.info('Deleting notification:', notificationId);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteAdminNotificationDocument,
        variables: { id: notificationId },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.delete_notifications_by_pk, error: null };
    } catch (error) {
      log.error('Error deleting notification:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete multiple notifications
   */
  async deleteMultiple(notificationIds) {
    try {
      log.info('Deleting multiple notifications:', notificationIds.length);

      const { data, errors } = await apolloClient.mutate({
        mutation: DeleteMultipleAdminNotificationsDocument,
        variables: { ids: notificationIds },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.delete_notifications?.affected_rows || 0, error: null };
    } catch (error) {
      log.error('Error deleting notifications:', error);
      return { data: 0, error };
    }
  },

  /**
   * Create an admin notification (for system triggers)
   */
  async createAdminNotification(notificationData) {
    try {
      log.info('Creating admin notification:', notificationData.type);

      const { data, errors } = await apolloClient.mutate({
        mutation: CreateAdminNotificationDocument,
        variables: {
          data: {
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            priority: notificationData.priority || 'medium',
            link: notificationData.link || null,
            action_url: notificationData.actionUrl || null,
            related_id: notificationData.relatedId || null,
            related_type: notificationData.relatedType || null,
            user_id: notificationData.targetAdminId || null,
            expires_at: notificationData.expiresAt || null,
          },
        },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info('Admin notification created:', data?.insert_notifications_one?.id);
      return { data: data?.insert_notifications_one, error: null };
    } catch (error) {
      log.error('Error creating admin notification:', error);
      return { data: null, error };
    }
  },

  /**
   * Broadcast notification to multiple users (forward notification)
   */
  async broadcastToUsers(userIds, notificationData) {
    try {
      log.info('Broadcasting notification to users:', userIds.length);

      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'admin_announcement',
        priority: notificationData.priority || 'medium',
        link: notificationData.link || null,
        action_url: notificationData.actionUrl || null,
      }));

      const { data, errors } = await apolloClient.mutate({
        mutation: BroadcastNotificationsDocument,
        variables: { notifications },
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      log.info(`Broadcast ${data?.insert_notifications?.affected_rows || 0} notifications`);
      return { data: data?.insert_notifications, error: null };
    } catch (error) {
      log.error('Error broadcasting notifications:', error);
      return { data: null, error };
    }
  },

  /**
   * Get users by role for broadcast targeting
   */
  async getUsersByRole(role) {
    try {
      const GetUsersByRoleDocument = gql`
        query GetUsersByRole($role: String!) {
          profiles(where: { user_type: { _eq: $role }, is_active: { _eq: true } }) {
            id
            email
            full_name
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: GetUsersByRoleDocument,
        variables: { role },
        fetchPolicy: 'network-only',
      });

      if (errors?.length > 0) {
        throw new Error(errors[0].message);
      }

      return { data: data?.profiles || [], error: null };
    } catch (error) {
      log.error('Error fetching users by role:', error);
      return { data: [], error };
    }
  },
};

export default adminNotificationService;
