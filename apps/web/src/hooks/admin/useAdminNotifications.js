/**
 * useAdminNotifications Hook
 * Core React hook for admin notifications with role-based filtering
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { adminNotificationService, ROLE_PERMISSIONS, ADMIN_NOTIFICATION_CATEGORIES } from '@/services/adminNotificationService';
import { createLogger } from '@/utils/logger';

const log = createLogger('useAdminNotifications');

/**
 * Main hook for admin notifications
 * Provides notifications list, unread count, and actions
 */
export function useAdminNotifications(options = {}) {
  const { adminUser } = useAdminAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    limit = 50,
    offset = 0,
    filters = {},
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  const adminId = adminUser?.id;
  const role = adminUser?.role;

  // Get allowed categories for current role
  const allowedCategories = useMemo(() => {
    const permissions = ROLE_PERMISSIONS[role?.toUpperCase()] || [];
    if (permissions.includes('*')) {
      return Object.values(ADMIN_NOTIFICATION_CATEGORIES);
    }
    return permissions;
  }, [role]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!adminId || !role) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await adminNotificationService.getNotifications(adminId, role, {
        limit,
        offset,
        filters,
      });

      if (result.error) {
        throw result.error;
      }

      setNotifications(result.data);
      setTotalCount(result.count);
      log.info(`Fetched ${result.data.length} notifications`);
    } catch (err) {
      log.error('Error fetching notifications:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [adminId, role, limit, offset, filters]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!adminId || !role) return;

    try {
      const result = await adminNotificationService.getUnreadCount(adminId, role);
      if (!result.error) {
        setUnreadCount(result.data);
      }
    } catch (err) {
      log.error('Error fetching unread count:', err);
    }
  }, [adminId, role]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !adminId) return;

    const intervalId = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchNotifications, fetchUnreadCount, adminId]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (isUpdating) return { error: 'Update in progress' };
    setIsUpdating(true);

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const result = await adminNotificationService.markAsRead(notificationId);

      if (result.error) {
        // Rollback
        setNotifications(previousNotifications);
        setUnreadCount(previousCount);
        throw result.error;
      }

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error marking as read:', err);
      return { data: null, error: err };
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, notifications, unreadCount]);

  // Mark multiple notifications as read
  const markMultipleAsRead = useCallback(async (notificationIds) => {
    if (isUpdating) return { error: 'Update in progress' };
    setIsUpdating(true);

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;
    const unreadIdsToMark = notifications.filter(n => notificationIds.includes(n.id) && !n.read).length;

    setNotifications(prev =>
      prev.map(n => notificationIds.includes(n.id) ? { ...n, read: true, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - unreadIdsToMark));

    try {
      const result = await adminNotificationService.markMultipleAsRead(notificationIds);

      if (result.error) {
        setNotifications(previousNotifications);
        setUnreadCount(previousCount);
        throw result.error;
      }

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error marking multiple as read:', err);
      return { data: null, error: err };
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, notifications, unreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (isUpdating || !adminId || !role) return { error: 'Update in progress' };
    setIsUpdating(true);

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;

    setNotifications(prev => prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() })));
    setUnreadCount(0);

    try {
      const result = await adminNotificationService.markAllAsRead(adminId, role);

      if (result.error) {
        setNotifications(previousNotifications);
        setUnreadCount(previousCount);
        throw result.error;
      }

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error marking all as read:', err);
      return { data: null, error: err };
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, adminId, role, notifications, unreadCount]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (isUpdating) return { error: 'Update in progress' };
    setIsUpdating(true);

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    const wasUnread = notificationToDelete && !notificationToDelete.read;

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    if (wasUnread) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setTotalCount(prev => Math.max(0, prev - 1));

    try {
      const result = await adminNotificationService.deleteNotification(notificationId);

      if (result.error) {
        setNotifications(previousNotifications);
        setUnreadCount(previousCount);
        setTotalCount(prev => prev + 1);
        throw result.error;
      }

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error deleting notification:', err);
      return { data: null, error: err };
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, notifications, unreadCount]);

  // Delete multiple notifications
  const deleteMultiple = useCallback(async (notificationIds) => {
    if (isUpdating) return { error: 'Update in progress' };
    setIsUpdating(true);

    // Optimistic update
    const previousNotifications = [...notifications];
    const previousCount = unreadCount;
    const previousTotal = totalCount;
    const unreadToDelete = notifications.filter(n => notificationIds.includes(n.id) && !n.read).length;

    setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
    setUnreadCount(prev => Math.max(0, prev - unreadToDelete));
    setTotalCount(prev => Math.max(0, prev - notificationIds.length));

    try {
      const result = await adminNotificationService.deleteMultiple(notificationIds);

      if (result.error) {
        setNotifications(previousNotifications);
        setUnreadCount(previousCount);
        setTotalCount(previousTotal);
        throw result.error;
      }

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error deleting notifications:', err);
      return { data: null, error: err };
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, notifications, unreadCount, totalCount]);

  // Refresh notifications manually
  const refresh = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Check if notification already exists
      if (prev.some(n => n.id === notification.id)) {
        return prev;
      }
      return [notification, ...prev].slice(0, limit);
    });
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
    setTotalCount(prev => prev + 1);
  }, [limit]);

  return {
    // Data
    notifications,
    unreadCount,
    totalCount,
    allowedCategories,

    // State
    loading,
    error,
    isUpdating,

    // Actions
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    refresh,
    addNotification,

    // Pagination helpers
    hasMore: notifications.length < totalCount,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(totalCount / limit),
  };
}

/**
 * Simplified hook for just unread count (header badge)
 */
export function useAdminUnreadCount() {
  const { adminUser } = useAdminAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const adminId = adminUser?.id;
  const role = adminUser?.role;

  const fetchCount = useCallback(async () => {
    if (!adminId || !role) {
      setLoading(false);
      return;
    }

    try {
      const result = await adminNotificationService.getUnreadCount(adminId, role);
      if (!result.error) {
        setCount(result.data);
      }
    } catch (err) {
      log.error('Error fetching unread count:', err);
    } finally {
      setLoading(false);
    }
  }, [adminId, role]);

  useEffect(() => {
    fetchCount();
    // Refresh every 30 seconds
    const intervalId = setInterval(fetchCount, 30000);
    return () => clearInterval(intervalId);
  }, [fetchCount]);

  return { count, loading, refresh: fetchCount };
}

export default useAdminNotifications;
