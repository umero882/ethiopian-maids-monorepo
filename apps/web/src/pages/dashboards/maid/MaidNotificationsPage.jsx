import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bell,
  Calendar,
  CreditCard,
  Check,
  MessageSquare,
  AlertCircle,
  Clock,
  Trash,
  Settings,
  CheckCircle,
  BellOff,
  Briefcase,
  User,
  Star,
  Heart,
  Award,
  Wifi,
  WifiOff,
  RefreshCw,
  X,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apolloClient, useOnNotificationsUpdatedSubscription } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { LoadingSpinner } from '@/components/LoadingStates';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';

// GraphQL Mutations
const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: uuid!, $userId: String!) {
    update_notifications(
      where: { id: { _eq: $id }, user_id: { _eq: $userId } }
      _set: { read: true }
    ) {
      affected_rows
    }
  }
`;

const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead($userId: String!) {
    update_notifications(
      where: { user_id: { _eq: $userId }, read: { _eq: false } }
      _set: { read: true }
    ) {
      affected_rows
    }
  }
`;

const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: uuid!, $userId: String!) {
    delete_notifications(
      where: { id: { _eq: $id }, user_id: { _eq: $userId } }
    ) {
      affected_rows
    }
  }
`;

/**
 * Transform notification link to correct dashboard path
 */
const transformNotificationLink = (link) => {
  if (!link) return null;

  // If already a full dashboard path, return as-is
  if (link.startsWith('/dashboard/maid')) {
    return link;
  }

  // Transform relative paths to maid dashboard paths
  if (link === '/profile' || link.startsWith('/profile/') || link.startsWith('/profile?')) {
    return '/dashboard/maid/profile';
  }

  if (link.startsWith('/messages')) {
    return link.replace('/messages', '/dashboard/maid/messages');
  }

  if (link.startsWith('/booking') || link.startsWith('/application')) {
    return `/dashboard/maid${link}`;
  }

  if (link.startsWith('/notifications')) {
    return '/dashboard/maid/notifications';
  }

  return link;
};

const MaidNotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    bookingRequests: true,
    bookingUpdates: true,
    profileUpdates: true,
    subscriptionReminders: true,
    systemAnnouncements: false,
  });

  // Use real-time subscription for notifications
  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError
  } = useOnNotificationsUpdatedSubscription({
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  // Icon mapping for notification types
  const getNotificationIcon = (type) => {
    const iconMap = {
      booking: Calendar,
      booking_created: Calendar,
      booking_accepted: Calendar,
      booking_rejected: Calendar,
      application: Briefcase,
      application_received: Briefcase,
      application_accepted: Briefcase,
      application_rejected: Briefcase,
      message: MessageSquare,
      message_received: MessageSquare,
      profile: User,
      profile_approved: CheckCircle,
      profile_rejected: AlertCircle,
      match: Heart,
      job: Briefcase,
      job_posted: Briefcase,
      review: Star,
      placement: Award,
      payment: CreditCard,
      subscription: CreditCard,
      system: Bell,
      system_announcement: Bell,
      default: Bell,
    };
    if (iconMap[type]) return iconMap[type];
    const prefix = type?.split('_')[0];
    return iconMap[prefix] || iconMap.default;
  };

  // Color mapping for notification types
  const getNotificationColors = (type) => {
    const colorMap = {
      booking: { text: 'text-blue-500', bg: 'bg-blue-50' },
      application: { text: 'text-indigo-500', bg: 'bg-indigo-50' },
      message: { text: 'text-green-500', bg: 'bg-green-50' },
      profile: { text: 'text-purple-500', bg: 'bg-purple-50' },
      profile_approved: { text: 'text-green-500', bg: 'bg-green-50' },
      profile_rejected: { text: 'text-red-500', bg: 'bg-red-50' },
      match: { text: 'text-red-500', bg: 'bg-red-50' },
      job: { text: 'text-orange-500', bg: 'bg-orange-50' },
      review: { text: 'text-yellow-500', bg: 'bg-yellow-50' },
      payment: { text: 'text-teal-500', bg: 'bg-teal-50' },
      subscription: { text: 'text-teal-500', bg: 'bg-teal-50' },
      system: { text: 'text-gray-500', bg: 'bg-gray-50' },
      default: { text: 'text-gray-500', bg: 'bg-gray-50' },
    };
    if (colorMap[type]) return colorMap[type];
    const prefix = type?.split('_')[0];
    return colorMap[prefix] || colorMap.default;
  };

  // Format notifications from subscription data
  const notifications = useMemo(() => {
    const rawNotifications = subscriptionData?.notifications || [];
    return rawNotifications.map((notification) => ({
      id: notification.id,
      type: notification.type || 'default',
      title: notification.title,
      message: notification.message,
      time: notification.created_at,
      read: notification.read || false,
      link: notification.link || notification.action_url,
      priority: notification.priority || 'medium',
    }));
  }, [subscriptionData?.notifications]);

  // Format the notification time
  const formatNotificationTime = (timeString) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'all') {
      return notifications;
    } else if (activeTab === 'unread') {
      return notifications.filter((notification) => !notification.read);
    } else {
      return notifications.filter(
        (notification) =>
          notification.type?.toLowerCase().startsWith(activeTab.toLowerCase()) ||
          notification.type?.toLowerCase().includes(activeTab.toLowerCase())
      );
    }
  };

  const markAsRead = async (id) => {
    try {
      const { errors } = await apolloClient.mutate({
        mutation: MARK_NOTIFICATION_READ,
        variables: { id, userId: user.id },
      });

      if (errors) throw new Error(errors[0]?.message);

      // Close dialog if the notification was being viewed
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification(null);
      }

      toast({
        title: 'Notification marked as read',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read.',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { errors } = await apolloClient.mutate({
        mutation: MARK_ALL_NOTIFICATIONS_READ,
        variables: { userId: user.id },
      });

      if (errors) throw new Error(errors[0]?.message);

      toast({
        title: 'All notifications marked as read',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (id) => {
    try {
      setIsDeleting(true);

      const { errors } = await apolloClient.mutate({
        mutation: DELETE_NOTIFICATION,
        variables: { id, userId: user.id },
      });

      if (errors) throw new Error(errors[0]?.message);

      // Close dialog if deleting the selected notification
      if (selectedNotification && selectedNotification.id === id) {
        setSelectedNotification(null);
      }

      toast({
        title: 'Notification deleted',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);

    // If not already read, mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const navigateToNotificationDestination = (notification) => {
    if (notification?.link) {
      // Mark as read if not already
      if (!notification.read) {
        markAsRead(notification.id);
      }

      // Close the dialog if it's open
      if (selectedNotification) {
        setSelectedNotification(null);
      }

      // Transform and navigate to the link
      const targetLink = transformNotificationLink(notification.link);
      navigate(targetLink || notification.link);
    }
  };

  const handleSettingChange = (setting, value) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));

    toast({
      title: 'Notification settings updated',
      duration: 2000,
    });
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  // Connection status
  const isConnected = !subscriptionError && !subscriptionLoading;
  const isLoading = subscriptionLoading;

  if (!user) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <LoadingSpinner size='lg' text='Loading notifications...' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800 flex items-center gap-3'>
            Notifications
            {unreadCount > 0 && (
              <Badge className='bg-red-500 text-white'>
                {unreadCount}
              </Badge>
            )}
          </h1>
          <div className='flex items-center gap-2 text-gray-500 mt-1'>
            <span>Stay updated on booking requests, profile updates, and system announcements</span>
            {/* Real-time connection status indicator */}
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              isConnected
                ? 'bg-green-100 text-green-700'
                : subscriptionError
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isConnected ? (
                <>
                  <Wifi className='w-3 h-3' />
                  Live
                </>
              ) : subscriptionError ? (
                <>
                  <WifiOff className='w-3 h-3' />
                  Offline
                </>
              ) : (
                <>
                  <RefreshCw className='w-3 h-3 animate-spin' />
                  Connecting
                </>
              )}
            </span>
          </div>
        </div>

        <div className='flex gap-2'>
          {unreadCount > 0 && (
            <Button variant='outline' onClick={markAllAsRead} className='gap-1'>
              <Check className='h-4 w-4' />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid grid-cols-5 mb-6'>
          <TabsTrigger value='all' className='relative'>
            All
            {unreadCount > 0 && (
              <Badge className='ml-2 bg-red-500 text-white absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full'>
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='unread'>Unread</TabsTrigger>
          <TabsTrigger value='booking'>Bookings</TabsTrigger>
          <TabsTrigger value='profile'>Profile</TabsTrigger>
          <TabsTrigger value='system'>System</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardContent className='p-0'>
              {filteredNotifications.length > 0 ? (
                <ul className='divide-y divide-gray-200'>
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colors = getNotificationColors(notification.type);

                    return (
                      <li
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors relative group ${!notification.read ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className='flex items-start gap-3'>
                          <div className={`mt-1 p-2 rounded-full ${colors.bg}`}>
                            <Icon className={`h-5 w-5 ${colors.text}`} />
                          </div>
                          {notification.link && (
                            <div className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity'>
                              <span className='text-xs'>Click to view details</span>
                            </div>
                          )}
                          <div className='flex-1 min-w-0'>
                            <div className='flex justify-between'>
                              <p
                                className={`text-sm font-medium ${!notification.read ? 'text-blue-600' : 'text-gray-900'}`}
                              >
                                {notification.title}
                              </p>
                              <span className='text-xs text-gray-500 whitespace-nowrap ml-2'>
                                {formatNotificationTime(notification.time)}
                              </span>
                            </div>
                            <p className='text-sm text-gray-500 mt-1 line-clamp-2 whitespace-pre-line'>
                              {notification.message}
                            </p>
                          </div>
                          {!notification.read && (
                            <div>
                              <Badge className='bg-blue-500'>New</Badge>
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className='flex flex-col items-center justify-center py-12'>
                  <BellOff className='h-12 w-12 text-gray-300 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900'>
                    No notifications
                  </h3>
                  <p className='text-gray-500 mt-1'>
                    {activeTab === 'all'
                      ? "You don't have any notifications yet."
                      : `You don't have any ${activeTab === 'unread' ? 'unread' : activeTab} notifications.`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Settings */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Settings className='h-5 w-5' />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferences />
        </CardContent>
      </Card>

      {/* Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        {selectedNotification && (
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {(() => {
                  const Icon = getNotificationIcon(selectedNotification.type);
                  const colors = getNotificationColors(selectedNotification.type);
                  return (
                    <div className={`p-2 rounded-full ${colors.bg}`}>
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                    </div>
                  );
                })()}
                <span>{selectedNotification.title}</span>
              </DialogTitle>
              <div className='flex items-center gap-2 text-gray-500 text-sm mt-1'>
                <Clock className='h-4 w-4' />
                <span>
                  {new Date(selectedNotification.time).toLocaleString()}
                </span>
                {selectedNotification.priority === 'urgent' && (
                  <Badge variant='destructive'>Urgent</Badge>
                )}
                {selectedNotification.priority === 'high' && (
                  <Badge className='bg-orange-500'>High Priority</Badge>
                )}
              </div>
            </DialogHeader>

            <div className='py-4'>
              <p className='text-gray-700 whitespace-pre-line'>{selectedNotification.message}</p>
            </div>

            <DialogFooter className='pt-4 border-t'>
              <Button
                onClick={() => setSelectedNotification(null)}
                className='w-full bg-purple-600 hover:bg-purple-700'
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default MaidNotificationsPage;
