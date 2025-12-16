/**
 * RealtimeActivityFeed Component
 * Shows real-time activity updates on the dashboard
 */

import { useState, useCallback } from 'react';
import {
  Activity,
  Briefcase,
  Calendar,
  MessageSquare,
  Star,
  Bell,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardSubscriptions } from '@/hooks/services';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

/**
 * Get icon and color based on update type
 */
function getUpdateConfig(type) {
  switch (type) {
    case 'new_application':
      return {
        icon: <Briefcase className="h-4 w-4" />,
        color: 'bg-green-100 text-green-600',
        label: 'New Application',
      };
    case 'application_status':
      return {
        icon: <Briefcase className="h-4 w-4" />,
        color: 'bg-blue-100 text-blue-600',
        label: 'Application Update',
      };
    case 'booking_update':
      return {
        icon: <Calendar className="h-4 w-4" />,
        color: 'bg-purple-100 text-purple-600',
        label: 'Booking Update',
      };
    case 'booking_request':
      return {
        icon: <Calendar className="h-4 w-4" />,
        color: 'bg-orange-100 text-orange-600',
        label: 'New Booking',
      };
    case 'new_message':
      return {
        icon: <MessageSquare className="h-4 w-4" />,
        color: 'bg-cyan-100 text-cyan-600',
        label: 'New Message',
      };
    case 'new_review':
      return {
        icon: <Star className="h-4 w-4" />,
        color: 'bg-yellow-100 text-yellow-600',
        label: 'New Review',
      };
    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        color: 'bg-gray-100 text-gray-600',
        label: 'Update',
      };
  }
}

/**
 * Format update data into readable message
 */
function formatUpdateMessage(update) {
  const { type, data } = update;

  switch (type) {
    case 'new_application':
      return `${data.maid?.full_name || 'A maid'} applied to "${data.job?.title || 'your job'}"`;
    case 'application_status':
      return `Your application for "${data.job?.title || 'a job'}" was ${data.status}`;
    case 'booking_update':
      return `Booking with ${data.maid?.full_name || 'maid'} is now ${data.status}`;
    case 'booking_request':
      return `New booking request from ${data.sponsor?.company_name || data.sponsor?.full_name || 'a sponsor'}`;
    case 'new_message':
      return `New message from ${data.sender?.full_name || 'someone'}`;
    case 'new_review':
      return `${data.reviewer?.full_name || 'Someone'} left you a ${data.rating}-star review`;
    default:
      return 'New activity on your account';
  }
}

/**
 * Single activity item
 */
function ActivityItem({ update }) {
  const config = getUpdateConfig(update.type);
  const timeAgo = formatDistanceToNow(new Date(update.timestamp), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
    >
      <div className={`p-2 rounded-full ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs">
            {config.label}
          </Badge>
          <span className="text-xs text-gray-400">{timeAgo}</span>
        </div>
        <p className="text-sm text-gray-700">{formatUpdateMessage(update)}</p>
      </div>
    </motion.div>
  );
}

/**
 * Connection status indicator
 */
function ConnectionStatus({ connected }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          connected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-xs text-gray-500">
        {connected ? 'Live' : 'Reconnecting...'}
      </span>
    </div>
  );
}

/**
 * RealtimeActivityFeed - Main component
 */
export function RealtimeActivityFeed() {
  const [isConnected, setIsConnected] = useState(true);

  const { unreadCount, updates, clearUpdates } = useDashboardSubscriptions({
    onUpdate: useCallback((update) => {
      // Could play a sound or show system notification here
      console.log('New update:', update);
    }, []),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <ConnectionStatus connected={isConnected} />
            {updates.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearUpdates}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {updates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-8">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs">Updates will appear here in real-time</p>
            </div>
          ) : (
            <AnimatePresence>
              {updates.map((update, index) => (
                <ActivityItem key={`${update.timestamp}-${index}`} update={update} />
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * CompactActivityBadge - Small indicator for nav bars
 */
export function CompactActivityBadge() {
  const { unreadCount } = useDashboardSubscriptions();

  if (unreadCount === 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
    >
      {unreadCount > 9 ? '9+' : unreadCount}
    </motion.span>
  );
}

export default RealtimeActivityFeed;
