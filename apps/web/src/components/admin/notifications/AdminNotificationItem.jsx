/**
 * AdminNotificationItem Component
 * Single notification display with actions for admin notification system
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  UserPlus,
  FileText,
  DollarSign,
  Settings,
  Shield,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Get icon component and colors based on notification type and priority
 */
function getNotificationDisplay(type, priority) {
  // Priority-based overrides
  if (priority === 'urgent') {
    return {
      Icon: AlertCircle,
      iconClass: 'text-red-600',
      bgClass: 'bg-red-50',
      borderClass: 'border-l-red-500',
    };
  }
  if (priority === 'high') {
    return {
      Icon: AlertTriangle,
      iconClass: 'text-orange-600',
      bgClass: 'bg-orange-50',
      borderClass: 'border-l-orange-500',
    };
  }

  // Type-based styling
  if (type?.includes('user') || type?.includes('registration') || type?.includes('verification')) {
    return {
      Icon: UserPlus,
      iconClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      borderClass: 'border-l-blue-500',
    };
  }
  if (type?.includes('content') || type?.includes('profile') || type?.includes('media') || type?.includes('review')) {
    return {
      Icon: FileText,
      iconClass: 'text-purple-600',
      bgClass: 'bg-purple-50',
      borderClass: 'border-l-purple-500',
    };
  }
  if (type?.includes('payment') || type?.includes('financial') || type?.includes('refund') || type?.includes('subscription')) {
    return {
      Icon: DollarSign,
      iconClass: 'text-green-600',
      bgClass: 'bg-green-50',
      borderClass: 'border-l-green-500',
    };
  }
  if (type?.includes('system') || type?.includes('error') || type?.includes('security') || type?.includes('maintenance')) {
    return {
      Icon: Settings,
      iconClass: 'text-gray-600',
      bgClass: 'bg-gray-50',
      borderClass: 'border-l-gray-500',
    };
  }
  if (type?.includes('admin')) {
    return {
      Icon: Shield,
      iconClass: 'text-indigo-600',
      bgClass: 'bg-indigo-50',
      borderClass: 'border-l-indigo-500',
    };
  }

  // Default
  return {
    Icon: Bell,
    iconClass: 'text-gray-500',
    bgClass: 'bg-gray-50',
    borderClass: 'border-l-gray-400',
  };
}

/**
 * Get category badge info
 */
function getCategoryBadge(type) {
  if (type?.includes('user') || type?.includes('registration')) {
    return { label: 'User', variant: 'default', className: 'bg-blue-100 text-blue-700' };
  }
  if (type?.includes('content') || type?.includes('profile') || type?.includes('media')) {
    return { label: 'Content', variant: 'default', className: 'bg-purple-100 text-purple-700' };
  }
  if (type?.includes('payment') || type?.includes('financial')) {
    return { label: 'Financial', variant: 'default', className: 'bg-green-100 text-green-700' };
  }
  if (type?.includes('system') || type?.includes('error') || type?.includes('security')) {
    return { label: 'System', variant: 'default', className: 'bg-gray-100 text-gray-700' };
  }
  return null;
}

/**
 * AdminNotificationItem - Compact version for dropdown
 */
export const AdminNotificationItemCompact = memo(function AdminNotificationItemCompact({
  notification,
  onMarkAsRead,
  onDismiss,
  onClick,
}) {
  const { Icon, iconClass, bgClass, borderClass } = getNotificationDisplay(
    notification.type,
    notification.priority
  );
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });

  const handleClick = (e) => {
    if (e.target.closest('button')) return;
    if (onClick) onClick(notification);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        'p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer border-l-4',
        borderClass,
        !notification.read && 'bg-blue-50/50'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('flex-shrink-0 p-1.5 rounded-full', bgClass)}>
          <Icon className={cn('h-4 w-4', iconClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm text-gray-900 line-clamp-1',
            !notification.read && 'font-semibold'
          )}>
            {notification.title}
          </p>
          <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">{timeAgo}</span>
            {notification.priority === 'urgent' && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                Urgent
              </Badge>
            )}
            {notification.priority === 'high' && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-orange-500">
                High
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex gap-1">
          {!notification.read && onMarkAsRead && (
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
          {onDismiss && (
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
          )}
        </div>
      </div>
    </motion.div>
  );
});

/**
 * AdminNotificationItem - Full version for notifications page
 */
export const AdminNotificationItemFull = memo(function AdminNotificationItemFull({
  notification,
  onMarkAsRead,
  onDismiss,
  onView,
  selected,
  onSelect,
  showCheckbox = false,
}) {
  const { Icon, iconClass, bgClass, borderClass } = getNotificationDisplay(
    notification.type,
    notification.priority
  );
  const categoryBadge = getCategoryBadge(notification.type);
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
  const fullDate = new Date(notification.created_at).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'p-4 rounded-lg border transition-all hover:shadow-sm border-l-4',
        borderClass,
        !notification.read && 'bg-blue-50/30',
        selected && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-4">
        {showCheckbox && (
          <div className="flex-shrink-0 pt-1">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect?.(notification.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </div>
        )}

        <div className={cn('flex-shrink-0 p-2 rounded-full', bgClass)}>
          <Icon className={cn('h-5 w-5', iconClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn(
              'text-sm text-gray-900',
              !notification.read && 'font-semibold'
            )}>
              {notification.title}
            </h4>

            {notification.priority === 'urgent' && (
              <Badge variant="destructive" className="text-xs">Urgent</Badge>
            )}
            {notification.priority === 'high' && (
              <Badge className="text-xs bg-orange-500">High Priority</Badge>
            )}
            {categoryBadge && (
              <Badge variant="outline" className={cn('text-xs', categoryBadge.className)}>
                {categoryBadge.label}
              </Badge>
            )}
            {!notification.read && (
              <span className="h-2 w-2 rounded-full bg-blue-500" title="Unread" />
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
            <span title={fullDate}>{timeAgo}</span>
            {notification.type && (
              <span className="text-gray-300">|</span>
            )}
            {notification.type && (
              <span className="capitalize">
                {notification.type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex items-center gap-2">
          {notification.link && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(notification)}
              className="h-8"
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Button>
          )}

          {!notification.read && onMarkAsRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="h-8 hover:bg-blue-50"
              title="Mark as read"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}

          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(notification.id)}
              className="h-8 hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Default export is the compact version
export default AdminNotificationItemCompact;
