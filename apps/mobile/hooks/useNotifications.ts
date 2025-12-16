/**
 * useNotifications Hook
 *
 * Real-time notifications using GraphQL subscriptions.
 * Provides notification list, unread count, and mark as read functionality.
 */

import { useEffect, useCallback } from 'react';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import { useAuth } from './useAuth';

// GraphQL Queries
const GET_NOTIFICATIONS = gql`
  query GetNotifications($userId: String!, $limit: Int = 20, $offset: Int = 0) {
    notifications(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      type
      title
      message
      link
      action_url
      related_id
      related_type
      read
      read_at
      priority
      created_at
      expires_at
    }
    notifications_aggregate(where: { user_id: { _eq: $userId } }) {
      aggregate {
        count
      }
    }
  }
`;

const GET_UNREAD_COUNT = gql`
  query GetUnreadNotificationCount($userId: String!) {
    notifications_aggregate(
      where: {
        user_id: { _eq: $userId }
        read: { _eq: false }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// GraphQL Mutations
const MARK_AS_READ = gql`
  mutation MarkNotificationAsRead($id: uuid!) {
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

const MARK_ALL_AS_READ = gql`
  mutation MarkAllNotificationsAsRead($userId: String!) {
    update_notifications(
      where: { user_id: { _eq: $userId }, read: { _eq: false } }
      _set: { read: true, read_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: uuid!) {
    delete_notifications_by_pk(id: $id) {
      id
    }
  }
`;

// GraphQL Subscription
const ON_NEW_NOTIFICATION = gql`
  subscription OnNewNotification($userId: String!) {
    notifications(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      type
      title
      message
      link
      action_url
      related_id
      related_type
      read
      priority
      created_at
      expires_at
    }
  }
`;

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  action_url?: string;
  related_id?: string;
  related_type?: string;
  read: boolean;
  read_at?: string;
  priority?: string;
  created_at: string;
  expires_at?: string;
}

interface UseNotificationsOptions {
  limit?: number;
  enableSubscription?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { limit = 20, enableSubscription = true } = options;
  const { user, isAuthenticated } = useAuth();
  // Use profile_id first (from database) as notifications are stored with profile ID
  // Fall back to Firebase UID if profile_id is not available
  const userId = (user as any)?.profile_id || user?.uid;

  // Query notifications
  const {
    data: notificationsData,
    loading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications,
    fetchMore,
  } = useQuery(GET_NOTIFICATIONS, {
    variables: { userId, limit, offset: 0 },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Query unread count
  const {
    data: unreadCountData,
    refetch: refetchUnreadCount,
  } = useQuery(GET_UNREAD_COUNT, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Subscribe to new notifications
  const { data: subscriptionData } = useSubscription(ON_NEW_NOTIFICATION, {
    variables: { userId },
    skip: !userId || !enableSubscription,
    onData: ({ data }) => {
      // Refetch when new notification arrives
      if (data?.data?.notifications?.length > 0) {
        refetchNotifications();
        refetchUnreadCount();
      }
    },
  });

  // Mutations
  const [markAsReadMutation] = useMutation(MARK_AS_READ);
  const [markAllAsReadMutation] = useMutation(MARK_ALL_AS_READ);
  const [deleteNotificationMutation] = useMutation(DELETE_NOTIFICATION);

  const notifications: Notification[] = notificationsData?.notifications || [];
  const totalCount = notificationsData?.notifications_aggregate?.aggregate?.count || 0;
  const unreadCount = unreadCountData?.notifications_aggregate?.aggregate?.count || 0;

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadMutation({
        variables: { id: notificationId },
        optimisticResponse: {
          update_notifications_by_pk: {
            __typename: 'notifications',
            id: notificationId,
            read: true,
            read_at: new Date().toISOString(),
          },
        },
      });
      refetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [markAsReadMutation, refetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await markAllAsReadMutation({
        variables: { userId },
      });
      refetchNotifications();
      refetchUnreadCount();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [userId, markAllAsReadMutation, refetchNotifications, refetchUnreadCount]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationMutation({
        variables: { id: notificationId },
        optimisticResponse: {
          delete_notifications_by_pk: {
            __typename: 'notifications',
            id: notificationId,
          },
        },
        update: (cache) => {
          cache.evict({ id: `notifications:${notificationId}` });
          cache.gc();
        },
      });
      refetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [deleteNotificationMutation, refetchUnreadCount]);

  const loadMore = useCallback(async () => {
    if (notifications.length >= totalCount) return;

    await fetchMore({
      variables: {
        offset: notifications.length,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          ...fetchMoreResult,
          notifications: [
            ...prev.notifications,
            ...fetchMoreResult.notifications,
          ],
        };
      },
    });
  }, [notifications.length, totalCount, fetchMore]);

  const refresh = useCallback(async () => {
    await Promise.all([
      refetchNotifications(),
      refetchUnreadCount(),
    ]);
  }, [refetchNotifications, refetchUnreadCount]);

  return {
    notifications,
    totalCount,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore,
    refresh,
    hasMore: notifications.length < totalCount,
  };
}

// Subscription for real-time unread count updates
const ON_UNREAD_COUNT_UPDATED = gql`
  subscription OnUnreadNotificationCount($userId: String!) {
    notifications_aggregate(
      where: {
        user_id: { _eq: $userId }
        read: { _eq: false }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Simplified hook just for unread count (for badges) - uses real-time subscription
export function useUnreadNotificationCount() {
  const { user } = useAuth();
  // Use profile_id first (from database) as notifications are stored with profile ID
  // Fall back to Firebase UID if profile_id is not available
  const userId = (user as any)?.profile_id || user?.uid;

  // Use subscription for real-time updates
  const { data: subscriptionData, loading: subscriptionLoading } = useSubscription(ON_UNREAD_COUNT_UPDATED, {
    variables: { userId },
    skip: !userId,
  });

  // Fallback query for initial load
  const { data: queryData, loading: queryLoading } = useQuery(GET_UNREAD_COUNT, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Prefer subscription data, fall back to query data
  const count = subscriptionData?.notifications_aggregate?.aggregate?.count
    ?? queryData?.notifications_aggregate?.aggregate?.count
    ?? 0;

  return {
    count,
    loading: subscriptionLoading && queryLoading,
  };
}
