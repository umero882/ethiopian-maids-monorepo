/**
 * useAdminNotificationSubscription Hook
 * Real-time WebSocket subscription for admin notifications
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSubscription } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ROLE_PERMISSIONS, ADMIN_NOTIFICATION_CATEGORIES } from '@/services/adminNotificationService';
import { createLogger } from '@/utils/logger';

const log = createLogger('AdminNotificationSubscription');

// =====================================================
// SUBSCRIPTION DOCUMENTS
// =====================================================

const AdminNotificationsSubscription = gql`
  subscription OnAdminNotifications($limit: Int = 20) {
    notifications(
      where: {
        _or: [
          { type: { _like: "admin_%" } },
          { type: { _like: "new_%" } },
          { type: { _like: "profile_%" } },
          { type: { _like: "payment_%" } },
          { type: { _like: "system_%" } },
          { type: { _like: "content_%" } }
        ]
      }
      order_by: [{ created_at: desc }]
      limit: $limit
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
  }
`;

const AdminUnreadCountSubscription = gql`
  subscription OnAdminUnreadCount {
    notifications_aggregate(
      where: {
        _or: [
          { type: { _like: "admin_%" } },
          { type: { _like: "new_%" } },
          { type: { _like: "profile_%" } },
          { type: { _like: "payment_%" } },
          { type: { _like: "system_%" } },
          { type: { _like: "content_%" } }
        ]
        read: { _eq: false }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Filter notifications based on admin role
 */
function filterNotificationsByRole(notifications, role) {
  const permissions = ROLE_PERMISSIONS[role?.toUpperCase()] || [];

  // Super admin sees everything
  if (permissions.includes('*')) {
    return notifications;
  }

  return notifications.filter(notification => {
    const type = notification.type || '';

    // Check if notification type matches any allowed category
    return permissions.some(category => {
      if (category === ADMIN_NOTIFICATION_CATEGORIES.USER_EVENT) {
        return type.includes('user') || type.includes('registration') || type.includes('verification');
      }
      if (category === ADMIN_NOTIFICATION_CATEGORIES.CONTENT_MODERATION) {
        return type.includes('content') || type.includes('profile') || type.includes('media') || type.includes('review');
      }
      if (category === ADMIN_NOTIFICATION_CATEGORIES.FINANCIAL_ALERT) {
        return type.includes('payment') || type.includes('financial') || type.includes('refund') || type.includes('subscription');
      }
      if (category === ADMIN_NOTIFICATION_CATEGORIES.SYSTEM_ALERT) {
        return type.includes('system') || type.includes('error') || type.includes('security') || type.includes('maintenance');
      }
      return false;
    });
  });
}

// =====================================================
// HOOKS
// =====================================================

/**
 * Real-time subscription hook for admin notifications
 */
export function useAdminNotificationSubscription(options = {}) {
  const { adminUser } = useAdminAuth();
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const processedIds = useRef(new Set());

  const {
    limit = 20,
    onNewNotification,
    enabled = true,
  } = options;

  const role = adminUser?.role;
  const shouldSubscribe = enabled && !!adminUser?.id;

  const { data, loading, error } = useSubscription(AdminNotificationsSubscription, {
    variables: { limit },
    skip: !shouldSubscribe,
    onData: ({ data: subscriptionData }) => {
      if (!subscriptionData?.data?.notifications?.length) return;

      const allNotifications = subscriptionData.data.notifications;
      const filteredNotifications = filterNotificationsByRole(allNotifications, role);

      if (filteredNotifications.length > 0) {
        const latestNotification = filteredNotifications[0];

        // Check if this is a new notification we haven't processed
        if (
          latestNotification.id !== lastNotificationId &&
          !processedIds.current.has(latestNotification.id) &&
          onNewNotification
        ) {
          processedIds.current.add(latestNotification.id);
          setLastNotificationId(latestNotification.id);
          onNewNotification(latestNotification);

          // Limit processed IDs cache size
          if (processedIds.current.size > 100) {
            const idsArray = Array.from(processedIds.current);
            processedIds.current = new Set(idsArray.slice(-50));
          }
        }
      }
    },
  });

  // Filter notifications by role
  const notifications = filterNotificationsByRole(
    data?.notifications || [],
    role
  );

  return {
    notifications,
    loading,
    error,
    lastNotificationId,
    isConnected: !error && !loading,
  };
}

/**
 * Real-time subscription for admin unread count
 */
export function useAdminUnreadCountSubscription(options = {}) {
  const { adminUser } = useAdminAuth();
  const { enabled = true } = options;

  const shouldSubscribe = enabled && !!adminUser?.id;

  const { data, loading, error } = useSubscription(AdminUnreadCountSubscription, {
    skip: !shouldSubscribe,
  });

  // For role-based filtering, we'd need to count client-side
  // For now, return the total admin notifications count
  const count = data?.notifications_aggregate?.aggregate?.count || 0;

  return {
    count,
    loading,
    error,
    isConnected: !error && !loading,
  };
}

/**
 * Combined hook for admin notification center
 * Provides both notifications list and unread count with real-time updates
 */
export function useAdminNotificationCenter(options = {}) {
  const { adminUser } = useAdminAuth();
  const [localNotifications, setLocalNotifications] = useState([]);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  const {
    limit = 10,
    onNewNotification,
  } = options;

  // Handle new notification
  const handleNewNotification = useCallback((notification) => {
    // Add to local state
    setLocalNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev].slice(0, limit);
    });

    // Update unread count if notification is unread
    if (!notification.read) {
      setLocalUnreadCount(prev => prev + 1);
    }

    // Call external handler
    if (onNewNotification) {
      onNewNotification(notification);
    }
  }, [limit, onNewNotification]);

  // Subscribe to notifications
  const {
    notifications: subscriptionNotifications,
    loading: notificationsLoading,
    error: notificationsError,
    isConnected,
  } = useAdminNotificationSubscription({
    limit,
    onNewNotification: handleNewNotification,
    enabled: !!adminUser?.id,
  });

  // Subscribe to unread count
  const {
    count: subscriptionCount,
    loading: countLoading,
  } = useAdminUnreadCountSubscription({
    enabled: !!adminUser?.id,
  });

  // Merge subscription data with local state
  const notifications = localNotifications.length > 0
    ? localNotifications
    : subscriptionNotifications;

  const unreadCount = localUnreadCount > 0
    ? localUnreadCount
    : subscriptionCount;

  // Mark as read locally
  const markAsReadLocal = useCallback((notificationId) => {
    setLocalNotifications(prev =>
      prev.map(n => n.id === notificationId
        ? { ...n, read: true, read_at: new Date().toISOString() }
        : n
      )
    );
    setLocalUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read locally
  const markAllAsReadLocal = useCallback(() => {
    setLocalNotifications(prev =>
      prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
    );
    setLocalUnreadCount(0);
  }, []);

  // Remove notification locally
  const removeLocal = useCallback((notificationId) => {
    const notification = localNotifications.find(n => n.id === notificationId);
    setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (notification && !notification.read) {
      setLocalUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [localNotifications]);

  // Reset local state (force re-sync with subscription)
  const resetLocal = useCallback(() => {
    setLocalNotifications([]);
    setLocalUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    loading: notificationsLoading || countLoading,
    error: notificationsError,
    isConnected,

    // Local state management
    markAsReadLocal,
    markAllAsReadLocal,
    removeLocal,
    resetLocal,
  };
}

export default useAdminNotificationSubscription;
