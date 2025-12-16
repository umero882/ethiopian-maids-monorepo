/**
 * AdminNotificationsPage
 * Full admin notifications page with filters, pagination, and bulk actions
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Send,
  Download,
  MoreHorizontal,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useAdminNotifications } from '@/hooks/admin';
import { AdminNotificationFilters } from '@/components/admin/notifications/AdminNotificationFilters';
import { AdminNotificationItemFull } from '@/components/admin/notifications/AdminNotificationItem';
import { AdminNotificationBroadcast } from '@/components/admin/notifications/AdminNotificationBroadcast';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 20;

/**
 * AdminNotificationsPage Component
 */
export function AdminNotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch notifications with pagination and filters
  const {
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    isUpdating,
    allowedCategories,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultiple,
    refresh,
    hasMore,
    totalPages,
  } = useAdminNotifications({
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    filters,
    autoRefresh: true,
    refreshInterval: 60000, // 1 minute
  });

  // Selection handlers
  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedIds(new Set(notifications.map(n => n.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [notifications]);

  const handleSelectOne = useCallback((id, checked) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  // Bulk actions
  const handleMarkSelectedAsRead = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const result = await markMultipleAsRead(Array.from(selectedIds));
    if (result.error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Marked ${result.data} notifications as read`,
      });
      setSelectedIds(new Set());
    }
  }, [selectedIds, markMultipleAsRead]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const result = await deleteMultiple(Array.from(selectedIds));
    if (result.error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notifications',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: `Deleted ${result.data} notifications`,
      });
      setSelectedIds(new Set());
    }
    setDeleteConfirm(null);
  }, [selectedIds, deleteMultiple]);

  const handleMarkAllAsRead = useCallback(async () => {
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
        description: `Marked ${result.data} notifications as read`,
      });
    }
  }, [markAllAsRead]);

  // Single notification actions
  const handleView = useCallback((notification) => {
    setSelectedNotification(notification);
    if (!notification.read) {
      markAsRead(notification.id);
    }
  }, [markAsRead]);

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

  const handleDeleteSingle = useCallback(async (id) => {
    const result = await deleteNotification(id);
    if (result.error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Deleted',
        description: 'Notification removed',
      });
    }
  }, [deleteNotification]);

  // Filter change handler
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page
    setSelectedIds(new Set()); // Clear selection
  }, []);

  // Pagination
  const handlePrevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
    setSelectedIds(new Set());
  }, []);

  const handleNextPage = useCallback(() => {
    if (hasMore) {
      setPage(p => p + 1);
      setSelectedIds(new Set());
    }
  }, [hasMore]);

  // Calculate actual total pages
  const calculatedTotalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Check if all visible are selected
  const allSelected = notifications.length > 0 && selectedIds.size === notifications.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < notifications.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage platform notifications and alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => setShowBroadcast(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Broadcast
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-sm text-gray-500">Total Notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            <p className="text-sm text-gray-500">Unread</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{totalCount - unreadCount}</div>
            <p className="text-sm text-gray-500">Read</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{allowedCategories.length}</div>
            <p className="text-sm text-gray-500">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <AdminNotificationFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            allowedCategories={allowedCategories}
          />
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedIds.size} notification{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkSelectedAsRead}
                  disabled={isUpdating}
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark as Read
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirm('selected')}
                  disabled={isUpdating}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
              <CardTitle className="text-lg">
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </CardTitle>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isUpdating}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading && notifications.length === 0 ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center text-gray-500">
              <p>Failed to load notifications</p>
              <Button variant="outline" size="sm" onClick={refresh} className="mt-4">
                Try again
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <h3 className="font-medium text-gray-900">No notifications</h3>
              <p className="text-sm mt-1">
                {Object.keys(filters).length > 0
                  ? 'No notifications match your filters'
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification) => (
                    <AdminNotificationItemFull
                      key={notification.id}
                      notification={notification}
                      selected={selectedIds.has(notification.id)}
                      onSelect={handleSelectOne}
                      showCheckbox
                      onMarkAsRead={markAsRead}
                      onDismiss={handleDeleteSingle}
                      onView={handleView}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </CardContent>

        {/* Pagination */}
        {totalCount > PAGE_SIZE && (
          <div className="border-t px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-gray-600 px-2">
                  Page {page} of {calculatedTotalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore && page >= calculatedTotalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

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
              <DialogDescription className="flex items-center gap-2">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notifications</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} notification{selectedIds.size !== 1 ? 's' : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Broadcast Dialog */}
      <AdminNotificationBroadcast
        open={showBroadcast}
        onOpenChange={setShowBroadcast}
      />
    </div>
  );
}

export default AdminNotificationsPage;
