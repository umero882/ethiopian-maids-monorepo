/**
 * NotificationCenter Component
 * Real-time notification center using GraphQL subscriptions
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, X, AlertCircle, Info, CheckCircle, MessageSquare, Briefcase, Calendar, Settings, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useNotificationSubscription,
  useUnreadNotificationCount,
} from '@/hooks/services';
import { useAuth } from '@/contexts/AuthContext';
import { graphqlNotificationService } from '@/services/notificationService.graphql';
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
import { formatDistanceToNow } from 'date-fns';

/**
 * Transform notification link to correct dashboard path based on user type
 * Maps generic paths like /messages?conversation=XXX to user-specific dashboard paths
 * Also handles legacy paths like /profile and /maids that need dashboard prefix
 */
const transformNotificationLink = (link, userType) => {
  if (!link) return null;

  const dashboardPrefix = userType === 'sponsor'
    ? '/dashboard/sponsor'
    : userType === 'agency'
      ? '/dashboard/agency'
      : '/dashboard/maid';

  // If link already starts with /dashboard, return as is (already properly formatted)
  if (link.startsWith('/dashboard')) {
    return link;
  }

  // Handle message links - map to user's dashboard
  if (link.startsWith('/messages')) {
    return link.replace('/messages', `${dashboardPrefix}/messages`);
  }

  // Handle profile links - maps /profile to user's dashboard profile
  if (link === '/profile' || link.startsWith('/profile/') || link.startsWith('/profile?')) {
    return `${dashboardPrefix}/profile`;
  }

  // Handle maids links (for agency) - maps /maids/xxx to /dashboard/agency/maids/xxx
  if (link.startsWith('/maids/') || link.startsWith('/maids?')) {
    return `${dashboardPrefix}${link}`;
  }

  // Handle other dashboard links (bookings, applications, etc.)
  if (link.startsWith('/booking') || link.startsWith('/application')) {
    return `${dashboardPrefix}${link}`;
  }

  // Handle notifications link
  if (link.startsWith('/notifications')) {
    return `${dashboardPrefix}/notifications`;
  }

  return link;
};

/**
 * Get icon component based on notification type
 */
function getNotificationIconComponent(type, priority) {
  if (priority === 'urgent' || priority === 'high') {
    return AlertCircle;
  }

  switch (type) {
    case 'application':
    case 'job_application':
    case 'application_received':
    case 'application_accepted':
    case 'application_rejected':
    case 'application_reviewed':
    case 'application_shortlisted':
      return Briefcase;
    case 'message':
    case 'message_received':
    case 'chat':
      return MessageSquare;
    case 'booking':
    case 'booking_created':
    case 'booking_accepted':
    case 'booking_rejected':
      return Calendar;
    case 'profile_approved':
    case 'profile_rejected':
      return CheckCircle;
    case 'job_posted':
    case 'job_closed':
      return Briefcase;
    case 'payment_received':
      return CheckCircle;
    case 'system_announcement':
      return Settings;
    default:
      return Bell;
  }
}

/**
 * Get icon based on notification type
 */
function getNotificationIcon(type, priority) {
  if (priority === 'urgent' || priority === 'high') {
    return <AlertCircle className="h-4 w-4 text-red-500" />;
  }

  switch (type) {
    case 'application':
    case 'job_application':
    case 'application_received':
    case 'application_accepted':
    case 'application_rejected':
    case 'application_reviewed':
    case 'application_shortlisted':
      return <Briefcase className="h-4 w-4 text-green-500" />;
    case 'message':
    case 'message_received':
    case 'chat':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'booking':
    case 'booking_created':
    case 'booking_accepted':
    case 'booking_rejected':
      return <Calendar className="h-4 w-4 text-purple-500" />;
    case 'profile_approved':
    case 'profile_rejected':
      return <CheckCircle className="h-4 w-4 text-orange-500" />;
    case 'job_posted':
    case 'job_closed':
      return <Briefcase className="h-4 w-4 text-indigo-500" />;
    case 'payment_received':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'system_announcement':
      return <Settings className="h-4 w-4 text-gray-600" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

/**
 * Get icon color based on notification type
 */
function getNotificationIconColor(type, priority) {
  if (priority === 'urgent' || priority === 'high') {
    return { text: 'text-red-500', bg: 'bg-red-50' };
  }

  switch (type) {
    case 'application':
    case 'job_application':
    case 'application_received':
    case 'application_accepted':
    case 'application_rejected':
      return { text: 'text-green-500', bg: 'bg-green-50' };
    case 'message':
    case 'message_received':
    case 'chat':
      return { text: 'text-blue-500', bg: 'bg-blue-50' };
    case 'booking':
    case 'booking_created':
    case 'booking_accepted':
    case 'booking_rejected':
      return { text: 'text-purple-500', bg: 'bg-purple-50' };
    case 'profile_approved':
      return { text: 'text-green-500', bg: 'bg-green-50' };
    case 'profile_rejected':
      return { text: 'text-red-500', bg: 'bg-red-50' };
    case 'job_posted':
    case 'job_closed':
      return { text: 'text-indigo-500', bg: 'bg-indigo-50' };
    case 'payment_received':
      return { text: 'text-emerald-500', bg: 'bg-emerald-50' };
    case 'system_announcement':
      return { text: 'text-gray-600', bg: 'bg-gray-100' };
    default:
      return { text: 'text-gray-500', bg: 'bg-gray-50' };
  }
}

/**
 * Single notification item
 */
function NotificationItem({ notification, onMarkAsRead, onDismiss, onClick }) {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const handleClick = (e) => {
    // Don't trigger click if clicking on action buttons
    if (e.target.closest('button')) return;
    if (onClick) onClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type, notification.priority)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-gray-400">{timeAgo}</p>
            {notification.priority === 'urgent' && (
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full">Urgent</span>
            )}
            {notification.priority === 'high' && (
              <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">High</span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-1">
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-100"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              title="Mark as read"
            >
              <Check className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notification.id);
            }}
            title="Dismiss"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="ml-7 mt-1">
        <span className="text-xs text-blue-600 font-medium">
          Click to view full details →
        </span>
      </div>
    </motion.div>
  );
}

/**
 * NotificationCenter - Main component
 */
export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Real-time subscription for notifications
  const { notifications: subscriptionNotifications, loading } = useNotificationSubscription({
    limit: 20,
    onNewNotification: useCallback((notification) => {
      // Show toast for new notifications
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'urgent' ? 'destructive' : 'default',
      });
      // Update local state to include new notification
      setLocalNotifications(prev => {
        const exists = prev.some(n => n.id === notification.id);
        if (exists) return prev;
        return [notification, ...prev].slice(0, 20);
      });
    }, []),
  });

  // Sync subscription data with local state
  const notifications = localNotifications.length > 0 ? localNotifications : subscriptionNotifications;

  // Real-time unread count
  const { count: unreadCount } = useUnreadNotificationCount();

  const handleMarkAsRead = useCallback(async (notificationId) => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      // Optimistic update
      setLocalNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
      );

      const result = await graphqlNotificationService.markAsRead(notificationId);

      if (result.error) {
        // Rollback on error
        setLocalNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: false, read_at: null } : n)
        );
        toast({
          title: 'Error',
          description: 'Failed to mark notification as read',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating]);

  const handleDismiss = useCallback(async (notificationId) => {
    if (isUpdating) return;
    setIsUpdating(true);

    // Store notification for rollback
    const notificationToDelete = notifications.find(n => n.id === notificationId);

    try {
      // Optimistic update
      setLocalNotifications(prev => prev.filter(n => n.id !== notificationId));

      const result = await graphqlNotificationService.deleteNotification(notificationId);

      if (result.error) {
        // Rollback on error
        if (notificationToDelete) {
          setLocalNotifications(prev => [...prev, notificationToDelete].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
          ));
        }
        toast({
          title: 'Error',
          description: 'Failed to dismiss notification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      if (notificationToDelete) {
        setLocalNotifications(prev => [...prev, notificationToDelete].sort((a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
        ));
      }
      toast({
        title: 'Error',
        description: 'Failed to dismiss notification',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, notifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!user?.id || isUpdating) return;
    setIsUpdating(true);

    // Store current state for rollback
    const previousNotifications = [...notifications];

    try {
      // Optimistic update
      setLocalNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      );

      const result = await graphqlNotificationService.markAllAsRead(user.id);

      if (result.error) {
        // Rollback on error
        setLocalNotifications(previousNotifications);
        toast({
          title: 'Error',
          description: 'Failed to mark all notifications as read',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: `Marked ${result.data || 'all'} notifications as read`,
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setLocalNotifications(previousNotifications);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [user?.id, isUpdating, notifications]);

  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    // Navigate based on user type
    const userType = user?.userType || 'sponsor';
    navigate(`/dashboard/${userType}/notifications`);
  }, [navigate, user?.userType]);

  // Open notification detail dialog instead of navigating
  const handleNotificationClick = useCallback((notification) => {
    // Mark as read when clicking
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    // Close dropdown and open detail dialog
    setIsOpen(false);
    setSelectedNotification(notification);
  }, [handleMarkAsRead]);

  // Navigate to the notification's action URL
  const handleNavigateToAction = useCallback(() => {
    if (selectedNotification?.action_url || selectedNotification?.link) {
      const rawLink = selectedNotification.action_url || selectedNotification.link;
      const targetLink = transformNotificationLink(rawLink, user?.userType);
      setSelectedNotification(null);
      navigate(targetLink || rawLink);
    }
  }, [selectedNotification, user?.userType, navigate]);

  // Close the detail dialog
  const handleCloseDetail = useCallback(() => {
    setSelectedNotification(null);
  }, []);

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Close notifications"
          aria-label="View notifications" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={handleMarkAllAsRead}
                disabled={isUpdating}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="h-8 w-8 bg-gray-200 rounded-full mb-2"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium">No notifications yet</p>
                <p className="text-sm mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
              </AnimatePresence>
            )}
          </ScrollArea>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="justify-center text-blue-600 cursor-pointer"
            onClick={handleViewAll}
          >
            View all notifications
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && handleCloseDetail()}>
        {selectedNotification && (
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {(() => {
                  const IconComponent = getNotificationIconComponent(selectedNotification.type, selectedNotification.priority);
                  const colors = getNotificationIconColor(selectedNotification.type, selectedNotification.priority);
                  return (
                    <div className={`p-2 rounded-full ${colors.bg}`}>
                      <IconComponent className={`h-5 w-5 ${colors.text}`} />
                    </div>
                  );
                })()}
                <span className="flex-1">{selectedNotification.title}</span>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>{new Date(selectedNotification.created_at).toLocaleString()}</span>
                {selectedNotification.priority === 'urgent' && (
                  <Badge variant="destructive">Urgent</Badge>
                )}
                {selectedNotification.priority === 'high' && (
                  <Badge className="bg-orange-500">High Priority</Badge>
                )}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-1 max-h-[50vh] pr-4">
              <div className="py-4">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 border-t">
              <Button
                onClick={handleCloseDetail}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
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
 * NotificationBadge - Simple badge showing unread count
 * Use this in headers/navigation
 */
export function NotificationBadge() {
  const { count } = useUnreadNotificationCount();

  if (count === 0) return null;

  return (
    <Badge variant="destructive" className="ml-2">
      {count > 99 ? '99+' : count}
    </Badge>
  );
}

export default NotificationCenter;
