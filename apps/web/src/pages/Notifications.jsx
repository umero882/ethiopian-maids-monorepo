import { usePageTitle } from '@/hooks/usePageTitle';
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apolloClient, useOnNotificationsUpdatedSubscription } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { toast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/LoadingStates';
import { createLogger } from '@/utils/logger';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import EmptyState from '@/components/ui/EmptyState';
import {
  Bell,
  MessageCircle,
  Briefcase,
  Users,
  Star,
  Check,
  X,
  Clock,
  Eye,
  Heart,
  Award,
  CreditCard,
  Calendar,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Trash2,
} from 'lucide-react';

const log = createLogger('Notifications');

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

  // Handle job links
  if (link.startsWith('/jobs') || link.startsWith('/job/')) {
    return link; // Jobs page is at root level
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

// GraphQL Mutations (Subscriptions are handled via @ethio/api-client hooks)
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

const Notifications = () => {
  usePageTitle('Notifications');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'notifications');
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Real-time subscription for notifications using Hasura GraphQL
  const {
    data: subscriptionData,
    loading: subscriptionLoading,
    error: subscriptionError
  } = useOnNotificationsUpdatedSubscription({
    variables: {
      userId: user?.id,
      limit: 50
    },
    skip: !user?.id,
    onData: ({ data: newData }) => {
      log.debug('Real-time subscription data received:', {
        hasData: !!newData?.data,
        notificationsCount: newData?.data?.notifications?.length || 0,
        notifications: newData?.data?.notifications
      });
    },
  });

  // Debug logging for subscription state
  useEffect(() => {
    log.debug('Subscription state:', {
      userId: user?.id,
      loading: subscriptionLoading,
      hasError: !!subscriptionError,
      error: subscriptionError?.message,
      dataReceived: !!subscriptionData,
      notificationsCount: subscriptionData?.notifications?.length || 0
    });
    if (subscriptionData?.notifications) {
      log.debug('Notifications data:', subscriptionData.notifications);
    }
  }, [user?.id, subscriptionLoading, subscriptionError, subscriptionData]);

  // Update URL when tab changes
  const handleTabChange = (value) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Icon mapping for notification types
  // Supports both exact matches and prefix matches (e.g., 'message_received' matches 'message')
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
      application_reviewed: Briefcase,
      application_shortlisted: Briefcase,
      message: MessageCircle,
      message_received: MessageCircle,
      profile: Eye,
      profile_approved: Eye,
      profile_rejected: Eye,
      match: Heart,
      job: Briefcase,
      job_posted: Briefcase,
      job_closed: Briefcase,
      review: Star,
      placement: Award,
      registration: Users,
      contract: Briefcase,
      payment: CreditCard,
      payment_received: CreditCard,
      system: Bell,
      system_announcement: Bell,
      default: Bell,
    };
    // Try exact match first, then try prefix match
    if (iconMap[type]) return iconMap[type];
    // Try prefix match for types like 'booking_created' -> 'booking'
    const prefix = type?.split('_')[0];
    return iconMap[prefix] || iconMap.default;
  };

  // Color mapping for notification types
  // Supports both exact matches and prefix matches
  const getNotificationColors = (type) => {
    const colorMap = {
      booking: { text: 'text-blue-600', bg: 'bg-blue-50' },
      application: { text: 'text-indigo-600', bg: 'bg-indigo-50' },
      message: { text: 'text-green-600', bg: 'bg-green-50' },
      profile: { text: 'text-purple-600', bg: 'bg-purple-50' },
      match: { text: 'text-red-600', bg: 'bg-red-50' },
      job: { text: 'text-orange-600', bg: 'bg-orange-50' },
      review: { text: 'text-yellow-600', bg: 'bg-yellow-50' },
      placement: { text: 'text-emerald-600', bg: 'bg-emerald-50' },
      registration: { text: 'text-cyan-600', bg: 'bg-cyan-50' },
      contract: { text: 'text-violet-600', bg: 'bg-violet-50' },
      payment: { text: 'text-teal-600', bg: 'bg-teal-50' },
      system: { text: 'text-gray-600', bg: 'bg-gray-50' },
      default: { text: 'text-gray-600', bg: 'bg-gray-50' },
    };
    // Try exact match first
    if (colorMap[type]) return colorMap[type];
    // Try prefix match for types like 'message_received' -> 'message'
    const prefix = type?.split('_')[0];
    return colorMap[prefix] || colorMap.default;
  };

  // Get relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return notificationTime.toLocaleDateString();
  };

  // Format notifications from subscription data
  const notifications = useMemo(() => {
    const rawNotifications = subscriptionData?.notifications || [];
    return rawNotifications.map((notification) => ({
      id: notification.id,
      type: notification.type || 'default',
      title: notification.title,
      message: notification.message,
      time: getRelativeTime(notification.created_at),
      timestamp: notification.created_at,
      read: notification.read || false,
      icon: getNotificationIcon(notification.type),
      ...getNotificationColors(notification.type),
      link: notification.link || notification.action_url,
      priority: notification.priority || 'medium',
    }));
  }, [subscriptionData?.notifications]);

  // Log subscription status
  useEffect(() => {
    if (subscriptionError) {
      log.error('Subscription error:', subscriptionError);
      toast({
        title: 'Connection Issue',
        description: 'Real-time updates may be delayed. Please refresh if needed.',
        variant: 'destructive',
      });
    }
  }, [subscriptionError]);

  // Connection status indicator
  const isConnected = !subscriptionError && !subscriptionLoading;
  const isLoading = subscriptionLoading;


  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    // Match notification types that start with or include the filter value
    // e.g., 'message' filter matches 'message_received', 'message_sent', etc.
    return notification.type?.toLowerCase().startsWith(filter.toLowerCase()) ||
           notification.type?.toLowerCase().includes(filter.toLowerCase());
  });

  // Mark a single notification as read
  // Real-time subscription will automatically update the UI after mutation
  const markAsRead = async (id) => {
    try {
      log.debug('Marking notification as read:', id);

      const { errors } = await apolloClient.mutate({
        mutation: MARK_NOTIFICATION_READ,
        variables: { id, userId: user.id },
      });

      if (errors) throw new Error(errors[0]?.message);
      // No need to manually update - subscription will push the change
    } catch (error) {
      log.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read.',
        variant: 'destructive',
      });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      log.debug('Marking all notifications as read for user:', user.id);

      const { errors } = await apolloClient.mutate({
        mutation: MARK_ALL_NOTIFICATIONS_READ,
        variables: { userId: user.id },
      });

      if (errors) throw new Error(errors[0]?.message);

      toast({
        title: 'Success',
        description: 'All notifications marked as read.',
      });
      // No need to manually update - subscription will push the changes
    } catch (error) {
      log.error('Error marking all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read.',
        variant: 'destructive',
      });
    }
  };

  // Delete a notification
  const deleteNotification = async (id) => {
    try {
      setIsDeleting(true);
      log.debug('Deleting notification:', id);

      const { errors } = await apolloClient.mutate({
        mutation: DELETE_NOTIFICATION,
        variables: { id, userId: user.id },
      });

      if (errors) throw new Error(errors[0]?.message);

      toast({
        title: 'Deleted',
        description: 'Notification deleted successfully.',
      });
      // No need to manually update - subscription will push the change
    } catch (error) {
      log.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <LoadingSpinner size='lg' text='Loading notifications...' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3'>
                  <Bell className='w-8 h-8 text-purple-600' />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className='bg-red-500 text-white'>
                      {unreadCount}
                    </Badge>
                  )}
                </h1>
                <div className='flex items-center gap-2 text-gray-600'>
                  <span>Stay updated with your latest activities</span>
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
              {activeTab === 'notifications' && unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant='outline'>
                  <Check className='w-4 h-4 mr-2' />
                  Mark All Read
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Tabs for Notifications and Settings */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Card className='border-0 shadow-lg'>
                <CardContent className='p-4'>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setFilter('all')}
                    >
                      All ({notifications.length})
                    </Button>
                    <Button
                      variant={filter === 'unread' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setFilter('unread')}
                    >
                      Unread ({unreadCount})
                    </Button>
                    <Button
                      variant={filter === 'message' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setFilter('message')}
                    >
                      Messages
                    </Button>
                    <Button
                      variant={filter === 'application' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setFilter('application')}
                    >
                      Applications
                    </Button>
                    <Button
                      variant={filter === 'job' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setFilter('job')}
                    >
                      Jobs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Notifications List */}
            <div className='space-y-4'>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Card className='border-0 shadow-lg'>
                    <CardContent className='p-8'>
                      <EmptyState
                        icon={Bell}
                        title={filter === 'unread' ? "You're all caught up!" : 'No Notifications'}
                        description={filter === 'unread'
                          ? 'No unread notifications.'
                          : 'No notifications found for the selected filter.'}
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                filteredNotifications.map((notification, index) => {
                  const Icon = notification.icon;
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <Card
                        className={`border-0 shadow-lg card-hover cursor-pointer ${!notification.read ? 'ring-2 ring-purple-200' : ''}`}
                        onClick={() => {
                          // Open modal to show full details
                          setSelectedNotification(notification);
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                        }}
                      >
                        <CardContent className='p-6'>
                          <div className='flex items-start space-x-4'>
                            <div
                              className={`flex-shrink-0 p-3 rounded-full ${notification.bg}`}
                            >
                              <Icon className={`w-6 h-6 ${notification.text}`} />
                            </div>

                            <div className='flex-1 min-w-0'>
                              <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                  <h3
                                    className={`text-lg font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-700'} mb-1`}
                                  >
                                    {notification.title}
                                  </h3>
                                  {/* Preview of message - click to see full details in modal */}
                                  <p className='text-gray-600 mb-2 line-clamp-2'>
                                    {notification.message}
                                  </p>
                                  <div className='flex items-center flex-wrap gap-2 text-sm text-gray-500'>
                                    <span className='flex items-center'>
                                      <Clock className='w-4 h-4 mr-1' />
                                      {notification.time}
                                    </span>
                                    {!notification.read && (
                                      <Badge
                                        variant='secondary'
                                        className='bg-purple-100 text-purple-700'
                                      >
                                        New
                                      </Badge>
                                    )}
                                    {notification.priority === 'urgent' && (
                                      <Badge variant='destructive'>
                                        Urgent
                                      </Badge>
                                    )}
                                    {notification.priority === 'high' && (
                                      <Badge className='bg-orange-500 text-white'>
                                        High Priority
                                      </Badge>
                                    )}
                                  </div>
                                  <p className='text-xs text-blue-600 mt-2'>
                                    Click to view full details
                                  </p>
                                </div>

                                <div className='flex items-center space-x-2 ml-4'>
                                  {!notification.read && (
                                    <Button
                                      size="icon" aria-label="Notification action"
                                      aria-label="Mark as read"
                                      variant='ghost'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification.id);
                                      }}
                                      className='text-purple-600 hover:text-purple-700'
                                    >
                                      <Check className='w-4 h-4' />
                                    </Button>
                                  )}
                                  <Button
                                  aria-label='Delete notification'
                                    size='icon'
                                    variant='ghost'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notification.id);
                                    }}
                                    className='text-red-600 hover:text-red-700'
                                  >
                                    <X className='w-4 h-4' />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Show count info */}
            {filteredNotifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className='mt-8 text-center'
              >
                <p className='text-sm text-gray-500'>
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </p>
              </motion.div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <NotificationPreferences />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Notification Detail Popup Modal */}
        <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
          {selectedNotification && (
            <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {(() => {
                    const Icon = selectedNotification.icon;
                    return (
                      <div className={`p-2 rounded-full ${selectedNotification.bg}`}>
                        <Icon className={`h-6 w-6 ${selectedNotification.text}`} />
                      </div>
                    );
                  })()}
                  <span className="flex-1 text-left">{selectedNotification.title}</span>
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 text-gray-500 pt-2">
                  <Clock className="h-4 w-4" />
                  <span>{selectedNotification.time}</span>
                  {selectedNotification.priority === 'urgent' && (
                    <Badge variant="destructive">Urgent</Badge>
                  )}
                  {selectedNotification.priority === 'high' && (
                    <Badge className="bg-orange-500 text-white">High Priority</Badge>
                  )}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 max-h-[50vh] pr-4">
                <div className="py-4">
                  {/* Show rejection/approval specific header */}
                  {(selectedNotification.type === 'profile_rejected' || selectedNotification.type === 'profile_approved') && (
                    <div className={`p-3 rounded-lg mb-4 ${
                      selectedNotification.type === 'profile_rejected'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-green-50 border border-green-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`h-5 w-5 ${
                          selectedNotification.type === 'profile_rejected' ? 'text-red-500' : 'text-green-500'
                        }`} />
                        <span className={`font-medium ${
                          selectedNotification.type === 'profile_rejected' ? 'text-red-700' : 'text-green-700'
                        }`}>
                          {selectedNotification.type === 'profile_rejected'
                            ? 'Profile Rejection Details'
                            : 'Profile Approved'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Full notification message */}
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed text-base">
                    {selectedNotification.message}
                  </p>
                </div>
              </ScrollArea>

              <DialogFooter className="pt-4 border-t">
                <Button
                  onClick={() => setSelectedNotification(null)}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </div>
    </div>
  );
};

export default Notifications;
