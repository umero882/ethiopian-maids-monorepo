/**
 * AdminNotificationCenter Component
 * Header dropdown notification center for admin panel
 * Features real-time updates, role-based filtering, and quick actions
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, RefreshCw, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { useAdminNotifications, useAdminUnreadCount } from '@/hooks/admin';
import { useAdminNotificationCenter } from '@/hooks/admin/useAdminNotificationSubscription';
import { adminNotificationService } from '@/services/adminNotificationService';
import { AdminNotificationItemCompact } from './AdminNotificationItem';
import { formatDistanceToNow } from 'date-fns';

/**
 * AdminNotificationCenter - Main header notification dropdown
 */
export function AdminNotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Use polling-based hook for reliability
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  } = useAdminNotifications({
    limit: 10,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });

  // Also try real-time subscription for instant updates
  const {
    notifications: realtimeNotifications,
    isConnected,
  } = useAdminNotificationCenter({
    limit: 10,
    onNewNotification: useCallback((notification) => {
      // Show toast for new notifications
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'urgent' ? 'destructive' : 'default',
        duration: notification.priority === 'urgent' ? 10000 : 5000,
      });
    }, []),
  });

  // Merge notifications - prefer polling data but use realtime for instant updates
  const displayNotifications = notifications.length > 0 ? notifications : realtimeNotifications;

  // Handle mark as read
  const handleMarkAsRead = useCallback(async (notificationId) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const result = await markAsRead(notificationId);
      if (result.error) {
        toast({
          title: 'Error',
          description: 'Failed to mark notification as read',
          variant: 'destructive',
        });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, markAsRead]);

  // Handle dismiss/delete
  const handleDismiss = useCallback(async (notificationId) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const result = await deleteNotification(notificationId);
      if (result.error) {
        toast({
          title: 'Error',
          description: 'Failed to dismiss notification',
          variant: 'destructive',
        });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, deleteNotification]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const result = await markAllAsRead();
      if (result.error) {
        toast({
          title: 'Error',
          description: 'Failed to mark all as read',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `Marked ${result.data || 'all'} notifications as read`,
        });
      }
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, markAllAsRead]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    // Show detail dialog
    setIsOpen(false);
    setSelectedNotification(notification);
  }, [handleMarkAsRead]);

  // Handle view all
  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    navigate('/admin/notifications');
  }, [navigate]);

  // Handle navigate to action
  const handleNavigateToAction = useCallback(() => {
    if (selectedNotification?.link || selectedNotification?.action_url) {
      const link = selectedNotification.action_url || selectedNotification.link;
      setSelectedNotification(null);
      if (link.startsWith('/')) {
        navigate(link);
      } else {
        window.open(link, '_blank');
      }
    }
  }, [selectedNotification, navigate]);

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-96">
          <DropdownMenuLabel className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Notifications</span>
              {isConnected && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  refresh();
                }}
                disabled={loading}
                title="Refresh"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={(e) => {
                    e.preventDefault();
                    handleMarkAllAsRead();
                  }}
                  disabled={isUpdating}
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  Mark all
                </Button>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <ScrollArea className="h-[400px]">
            {loading && displayNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="animate-pulse flex flex-col items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {displayNotifications.map((notification) => (
                  <AdminNotificationItemCompact
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                    onClick={handleNotificationClick}
                  />
                ))}
              </AnimatePresence>
            )}
          </ScrollArea>

          <DropdownMenuSeparator />

          <div className="p-2">
            <Button
              variant="ghost"
              className="w-full justify-center text-primary hover:text-primary hover:bg-primary/5"
              onClick={handleViewAll}
            >
              View all notifications
              <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        {selectedNotification && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <span>{selectedNotification.title}</span>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-gray-500">
                <span>
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </span>
                {selectedNotification.priority === 'urgent' && (
                  <Badge variant="destructive">Urgent</Badge>
                )}
                {selectedNotification.priority === 'high' && (
                  <Badge className="bg-orange-500">High Priority</Badge>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedNotification.message}
              </p>

              {selectedNotification.type && (
                <div className="mt-4 pt-4 border-t">
                  <span className="text-xs text-gray-400">
                    Type: {selectedNotification.type.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              {(selectedNotification.link || selectedNotification.action_url) && (
                <Button variant="outline" onClick={handleNavigateToAction}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
              <Button onClick={() => setSelectedNotification(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

/**
 * AdminNotificationBadge - Simple unread count badge
 */
export function AdminNotificationBadge() {
  const { count } = useAdminUnreadCount();

  if (count === 0) return null;

  return (
    <Badge variant="destructive" className="ml-2">
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

export default AdminNotificationCenter;
