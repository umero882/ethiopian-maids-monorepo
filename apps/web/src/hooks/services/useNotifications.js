/**
 * useNotifications Hook
 * React hooks for Notification operations using ServiceFactory
 */

import { useState, useCallback, useEffect } from 'react';
import { useEnsureServiceFactory, ServiceFactory } from './useServiceFactory';

/**
 * Hook for fetching a single notification
 */
export function useNotification(notificationId) {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchNotification = useCallback(async (id) => {
    const targetId = id || notificationId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      const result = await service.getNotification(targetId);
      setNotification(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [notificationId]);

  useEffect(() => {
    if (notificationId) {
      fetchNotification(notificationId);
    }
  }, [notificationId, fetchNotification]);

  return {
    notification,
    loading,
    error,
    refetch: fetchNotification,
  };
}

/**
 * Hook for creating a notification
 */
export function useCreateNotification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdNotification, setCreatedNotification] = useState(null);

  useEnsureServiceFactory();

  const create = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      const result = await service.createNotification(data);
      setCreatedNotification(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    create,
    loading,
    error,
    createdNotification,
  };
}

/**
 * Hook for fetching user notifications
 */
export function useUserNotifications(userId, options = {}) {
  const { isRead, limit, offset, autoFetch = true } = options;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchNotifications = useCallback(async (id, opts = {}) => {
    const targetId = id || userId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      const result = await service.getUserNotifications(
        targetId,
        opts.isRead ?? isRead,
        opts.limit ?? limit,
        opts.offset ?? offset
      );
      setNotifications(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, isRead, limit, offset]);

  useEffect(() => {
    if (autoFetch && userId) {
      fetchNotifications(userId);
    }
  }, [userId, autoFetch, fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
  };
}

/**
 * Hook for fetching unread notifications
 */
export function useUnreadNotifications(userId, options = {}) {
  const { limit, autoFetch = true } = options;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchUnread = useCallback(async (id, opts = {}) => {
    const targetId = id || userId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      const result = await service.getUnreadNotifications(targetId, opts.limit ?? limit);
      setNotifications(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    if (autoFetch && userId) {
      fetchUnread(userId);
    }
  }, [userId, autoFetch, fetchUnread]);

  const unreadCount = notifications.length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchUnread,
  };
}

/**
 * Hook for marking notifications as read
 */
export function useMarkNotificationRead() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const markAsRead = useCallback(async (notificationId) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      const result = await service.markNotificationAsRead(notificationId);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllAsRead = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      await service.markAllNotificationsAsRead(userId);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markAsRead,
    markAllAsRead,
    loading,
    error,
  };
}

/**
 * Hook for deleting notifications
 */
export function useDeleteNotification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const deleteNotification = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      await service.deleteNotification(id);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAllRead = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      await service.deleteAllReadNotifications(userId);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteNotification,
    deleteAllRead,
    loading,
    error,
  };
}

/**
 * Hook for searching notifications
 */
export function useSearchNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const search = useCallback(async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getNotificationService();
      const result = await service.searchNotifications(filters);
      setNotifications(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setNotifications([]);
    setError(null);
  }, []);

  return {
    notifications,
    loading,
    error,
    search,
    reset,
  };
}

/**
 * Combined notification center hook
 * Provides all common notification operations for a user
 */
export function useNotificationCenter(userId, options = {}) {
  const { limit = 20, pollInterval } = options;

  const userNotificationsHook = useUserNotifications(userId, { limit });
  const unreadHook = useUnreadNotifications(userId, { limit });
  const markReadHook = useMarkNotificationRead();
  const deleteHook = useDeleteNotification();

  // Optional polling for real-time updates
  useEffect(() => {
    if (!pollInterval || !userId) return;

    const intervalId = setInterval(() => {
      unreadHook.refetch(userId);
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [userId, pollInterval, unreadHook.refetch]);

  const markAsRead = useCallback(async (notificationId) => {
    await markReadHook.markAsRead(notificationId);
    // Refetch notifications after marking as read
    await Promise.all([
      userNotificationsHook.refetch(userId),
      unreadHook.refetch(userId),
    ]);
  }, [userId, markReadHook.markAsRead, userNotificationsHook.refetch, unreadHook.refetch]);

  const markAllAsRead = useCallback(async () => {
    await markReadHook.markAllAsRead(userId);
    // Refetch notifications
    await Promise.all([
      userNotificationsHook.refetch(userId),
      unreadHook.refetch(userId),
    ]);
  }, [userId, markReadHook.markAllAsRead, userNotificationsHook.refetch, unreadHook.refetch]);

  const deleteNotification = useCallback(async (notificationId) => {
    await deleteHook.deleteNotification(notificationId);
    // Refetch notifications after deletion
    await userNotificationsHook.refetch(userId);
  }, [userId, deleteHook.deleteNotification, userNotificationsHook.refetch]);

  const clearAllRead = useCallback(async () => {
    await deleteHook.deleteAllRead(userId);
    await userNotificationsHook.refetch(userId);
  }, [userId, deleteHook.deleteAllRead, userNotificationsHook.refetch]);

  return {
    notifications: userNotificationsHook.notifications,
    unreadNotifications: unreadHook.notifications,
    unreadCount: unreadHook.unreadCount,
    loading: userNotificationsHook.loading || unreadHook.loading,
    error: userNotificationsHook.error || unreadHook.error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllRead,
    refetch: useCallback(async () => {
      await Promise.all([
        userNotificationsHook.refetch(userId),
        unreadHook.refetch(userId),
      ]);
    }, [userId, userNotificationsHook.refetch, unreadHook.refetch]),
  };
}

/**
 * Combined hook for all notification operations
 */
export function useNotificationService() {
  useEnsureServiceFactory();

  const getService = useCallback(() => {
    return ServiceFactory.getNotificationService();
  }, []);

  return {
    getService,
    // Individual operation hooks
    useNotification,
    useCreate: useCreateNotification,
    useUserNotifications,
    useUnread: useUnreadNotifications,
    useMarkRead: useMarkNotificationRead,
    useDelete: useDeleteNotification,
    useSearch: useSearchNotifications,
    useNotificationCenter,
  };
}
