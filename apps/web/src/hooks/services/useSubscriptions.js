/**
 * Real-time Subscription Hooks
 * React hooks for GraphQL subscriptions using generated Apollo hooks
 *
 * These hooks wrap the auto-generated subscription hooks from @ethio/api-client
 * and provide additional features like callback handling and dashboard aggregation.
 */

import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/utils/logger';

// Import generated subscription hooks from api-client
import {
  useOnNotificationsUpdatedSubscription,
  useOnUnreadNotificationCountSubscription,
  useOnNewMessagesSubscription,
  useOnConversationMessagesSubscription,
  useOnNewApplicationsSubscription,
  useOnApplicationStatusChangeSubscription,
  useOnBookingUpdatesSubscription,
  useOnBookingRequestsSubscription,
} from '@ethio/api-client';

const log = createLogger('Subscriptions');

// =====================================================
// Notification Subscriptions
// =====================================================

/**
 * Hook for real-time notification updates
 * Uses generated useOnNotificationsUpdatedSubscription
 */
export function useNotificationSubscription(options = {}) {
  const { user } = useAuth();
  const { limit = 20, onNewNotification } = options;
  const [lastNotification, setLastNotification] = useState(null);

  const { data, loading, error } = useOnNotificationsUpdatedSubscription({
    variables: { userId: user?.id, limit },
    skip: !user?.id,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.notifications?.[0] && onNewNotification) {
        const notification = subscriptionData.data.notifications[0];
        if (notification.id !== lastNotification?.id) {
          setLastNotification(notification);
          onNewNotification(notification);
        }
      }
    },
  });

  return {
    notifications: data?.notifications || [],
    loading,
    error,
    lastNotification,
  };
}

/**
 * Hook for real-time unread notification count
 * Uses generated useOnUnreadNotificationCountSubscription
 */
export function useUnreadNotificationCount() {
  const { user } = useAuth();

  const { data, loading, error } = useOnUnreadNotificationCountSubscription({
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  return {
    count: data?.notifications_aggregate?.aggregate?.count || 0,
    loading,
    error,
  };
}

// =====================================================
// Message/Chat Subscriptions
// =====================================================

/**
 * Hook for real-time message updates
 * Uses generated useOnNewMessagesSubscription
 */
export function useMessageSubscription(options = {}) {
  const { user } = useAuth();
  const { onNewMessage } = options;
  const [lastMessage, setLastMessage] = useState(null);

  const { data, loading, error } = useOnNewMessagesSubscription({
    variables: { userId: user?.id },
    skip: !user?.id,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.messages?.[0] && onNewMessage) {
        const message = subscriptionData.data.messages[0];
        if (message.id !== lastMessage?.id) {
          setLastMessage(message);
          onNewMessage(message);
        }
      }
    },
  });

  return {
    messages: data?.messages || [],
    loading,
    error,
    lastMessage,
  };
}

/**
 * Hook for real-time conversation messages
 * Uses generated useOnConversationMessagesSubscription
 */
export function useConversationSubscription(otherUserId, options = {}) {
  const { user } = useAuth();
  const { onNewMessage } = options;

  const { data, loading, error } = useOnConversationMessagesSubscription({
    variables: { userId: user?.id, otherUserId },
    skip: !user?.id || !otherUserId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.messages && onNewMessage) {
        const messages = subscriptionData.data.messages;
        if (messages.length > 0) {
          onNewMessage(messages[messages.length - 1]);
        }
      }
    },
  });

  return {
    messages: data?.messages || [],
    loading,
    error,
  };
}

// =====================================================
// Dashboard Subscriptions
// =====================================================

/**
 * Hook for sponsor dashboard - new applications
 * Uses generated useOnNewApplicationsSubscription
 */
export function useJobApplicationSubscription(sponsorId, options = {}) {
  const { onNewApplication } = options;
  const [lastApplication, setLastApplication] = useState(null);

  const { data, loading, error } = useOnNewApplicationsSubscription({
    variables: { sponsorId },
    skip: !sponsorId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.applications?.[0] && onNewApplication) {
        const application = subscriptionData.data.applications[0];
        if (application.id !== lastApplication?.id) {
          setLastApplication(application);
          onNewApplication(application);
        }
      }
    },
  });

  return {
    applications: data?.applications || [],
    loading,
    error,
    lastApplication,
  };
}

/**
 * Hook for maid dashboard - application status changes
 * Uses generated useOnApplicationStatusChangeSubscription
 */
export function useApplicationStatusSubscription(maidId, options = {}) {
  const { onStatusChange } = options;

  const { data, loading, error } = useOnApplicationStatusChangeSubscription({
    variables: { maidId },
    skip: !maidId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.applications && onStatusChange) {
        onStatusChange(subscriptionData.data.applications);
      }
    },
  });

  return {
    applications: data?.applications || [],
    loading,
    error,
  };
}

/**
 * Hook for sponsor dashboard - booking updates
 * Uses generated useOnBookingUpdatesSubscription
 */
export function useBookingSubscription(sponsorId, options = {}) {
  const { onBookingUpdate } = options;

  const { data, loading, error } = useOnBookingUpdatesSubscription({
    variables: { sponsorId },
    skip: !sponsorId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.bookings && onBookingUpdate) {
        onBookingUpdate(subscriptionData.data.bookings);
      }
    },
  });

  return {
    bookings: data?.bookings || [],
    loading,
    error,
  };
}

/**
 * Hook for maid dashboard - booking requests
 * Uses generated useOnBookingRequestsSubscription
 */
export function useBookingRequestSubscription(maidId, options = {}) {
  const { onNewRequest } = options;

  const { data, loading, error } = useOnBookingRequestsSubscription({
    variables: { maidId },
    skip: !maidId,
    onData: ({ data: subscriptionData }) => {
      if (subscriptionData?.data?.bookings && onNewRequest) {
        onNewRequest(subscriptionData.data.bookings);
      }
    },
  });

  return {
    bookings: data?.bookings || [],
    loading,
    error,
  };
}

// =====================================================
// Combined Dashboard Hook
// =====================================================

/**
 * Combined hook for dashboard real-time updates
 * Automatically subscribes based on user type
 */
export function useDashboardSubscriptions(options = {}) {
  const { user } = useAuth();
  const { onUpdate } = options;
  const [updates, setUpdates] = useState([]);

  const addUpdate = useCallback((type, data) => {
    const update = { type, data, timestamp: new Date().toISOString() };
    setUpdates(prev => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
    if (onUpdate) {
      onUpdate(update);
    }
    log.debug(`[Dashboard Update] ${type}`, data);
  }, [onUpdate]);

  // Notification subscription (all users)
  const { count: unreadCount } = useUnreadNotificationCount();

  // Sponsor-specific subscriptions
  const sponsorId = user?.userType === 'sponsor' ? user.id : null;
  useJobApplicationSubscription(sponsorId, {
    onNewApplication: (app) => addUpdate('new_application', app),
  });
  useBookingSubscription(sponsorId, {
    onBookingUpdate: (bookings) => addUpdate('booking_update', bookings[0]),
  });

  // Maid-specific subscriptions
  const maidId = user?.userType === 'maid' ? user.id : null;
  useApplicationStatusSubscription(maidId, {
    onStatusChange: (apps) => addUpdate('application_status', apps[0]),
  });
  useBookingRequestSubscription(maidId, {
    onNewRequest: (bookings) => addUpdate('booking_request', bookings[0]),
  });

  return {
    unreadCount,
    updates,
    clearUpdates: () => setUpdates([]),
  };
}

export default {
  useNotificationSubscription,
  useUnreadNotificationCount,
  useMessageSubscription,
  useConversationSubscription,
  useJobApplicationSubscription,
  useApplicationStatusSubscription,
  useBookingSubscription,
  useBookingRequestSubscription,
  useDashboardSubscriptions,
};
