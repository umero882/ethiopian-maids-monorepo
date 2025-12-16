import React, { useState, useEffect, useCallback } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  FileText,
  Search,
  Filter,
  AlertCircle,
  Eye,
  Download,
  Activity,
  UserCog,
  Database,
  Shield,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

const AdminSystemLogsPage = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState('24h');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;

  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [stats, setStats] = useState({
    totalLogs: 0,
    todayLogs: 0,
    criticalActions: 0,
    uniqueAdmins: 0,
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate time range
      const now = new Date();
      let startDate = new Date();
      if (timeRangeFilter === '1h') {
        startDate.setHours(now.getHours() - 1);
      } else if (timeRangeFilter === '24h') {
        startDate.setHours(now.getHours() - 24);
      } else if (timeRangeFilter === '7d') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRangeFilter === '30d') {
        startDate.setDate(now.getDate() - 30);
      }

      // Build where conditions for GraphQL
      const whereConditions = [`created_at: { _gte: "${startDate.toISOString()}" }`];
      if (actionFilter !== 'all') {
        whereConditions.push(`action: { _eq: "${actionFilter}" }`);
      }
      if (targetTypeFilter !== 'all') {
        whereConditions.push(`target_type: { _eq: "${targetTypeFilter}" }`);
      }
      if (searchTerm) {
        whereConditions.push(`_or: [
          { action: { _ilike: "%${searchTerm}%" } },
          { target_type: { _ilike: "%${searchTerm}%" } }
        ]`);
      }

      const offset = (currentPage - 1) * itemsPerPage;

      const { data: queryData, errors: fetchError } = await apolloClient.query({
        query: gql`
          query GetAdminLogs($limit: Int!, $offset: Int!) {
            admin_activity_logs(
              where: { ${whereConditions.join(', ')} }
              order_by: { created_at: desc }
              limit: $limit
              offset: $offset
            ) {
              id
              action
              target_type
              target_id
              details
              created_at
              admin_id
              admin {
                id
                full_name
                email
              }
            }
            admin_activity_logs_aggregate(where: { ${whereConditions.join(', ')} }) {
              aggregate {
                count
              }
            }
          }
        `,
        variables: { limit: itemsPerPage, offset },
        fetchPolicy: 'network-only'
      });

      if (fetchError) throw new Error(fetchError[0]?.message || 'Failed to fetch logs');

      const data = queryData?.admin_activity_logs || [];
      const count = queryData?.admin_activity_logs_aggregate?.aggregate?.count || 0;

      setLogs(data || []);
      setTotalCount(count || 0);

      calculateStats(data || []);
    } catch (err) {
      logger.error('Failed to fetch system logs:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load system logs.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, actionFilter, targetTypeFilter, timeRangeFilter, toast]);

  const calculateStats = (data) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = data.filter(log => new Date(log.created_at) >= today);

    const criticalActions = data.filter(log =>
      ['user_deleted', 'admin_deactivated', 'payout_rejected', 'profile_rejected'].includes(log.action)
    );

    const uniqueAdmins = new Set(data.map(log => log.admin_id)).size;

    setStats({
      totalLogs: data.length,
      todayLogs: todayLogs.length,
      criticalActions: criticalActions.length,
      uniqueAdmins,
    });
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const handleExportLogs = () => {
    toast({
      title: 'Export Started',
      description: 'Preparing logs for export...',
    });
    // Export functionality would be implemented here
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadge = (action) => {
    const criticalActions = ['user_deleted', 'admin_deactivated', 'payout_rejected', 'profile_rejected'];
    const warningActions = ['profile_flagged', 'media_flagged', 'review_flagged'];

    let variant = 'outline';
    let icon = Info;
    let color = 'text-blue-500';

    if (criticalActions.includes(action)) {
      variant = 'destructive';
      icon = XCircle;
      color = 'text-red-500';
    } else if (warningActions.includes(action)) {
      variant = 'secondary';
      icon = AlertCircle;
      color = 'text-yellow-500';
    } else if (action.includes('approved') || action.includes('verified')) {
      variant = 'default';
      icon = CheckCircle;
      color = 'text-green-500';
    }

    const Icon = icon;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getTargetTypeBadge = (targetType) => {
    const config = {
      profile: { icon: UserCog, color: 'bg-blue-100 text-blue-800' },
      transaction: { icon: Activity, color: 'bg-green-100 text-green-800' },
      subscription: { icon: Database, color: 'bg-purple-100 text-purple-800' },
      payout: { icon: Activity, color: 'bg-orange-100 text-orange-800' },
      media: { icon: FileText, color: 'bg-pink-100 text-pink-800' },
      review: { icon: Shield, color: 'bg-indigo-100 text-indigo-800' },
    };

    const { icon: Icon, color } = config[targetType] || { icon: FileText, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge variant="outline" className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {targetType.charAt(0).toUpperCase() + targetType.slice(1)}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Failed to Load Logs</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={fetchLogs}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Activity Logs</h1>
        <p className="text-muted-foreground">Monitor and review all admin actions and system events</p>
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLogs}</div>
                <p className="text-xs text-muted-foreground">
                  In selected time range
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayLogs}</div>
                <p className="text-xs text-muted-foreground">
                  Actions today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Actions</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.criticalActions}</div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
                <UserCog className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueAdmins}</div>
                <p className="text-xs text-muted-foreground">
                  Unique administrators
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8"
                  />
                </div>

                <Select value={actionFilter} onValueChange={(value) => {
                  setActionFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="profile_approved">Profile Approved</SelectItem>
                    <SelectItem value="profile_rejected">Profile Rejected</SelectItem>
                    <SelectItem value="payout_approved">Payout Approved</SelectItem>
                    <SelectItem value="payout_rejected">Payout Rejected</SelectItem>
                    <SelectItem value="user_deleted">User Deleted</SelectItem>
                    <SelectItem value="admin_deactivated">Admin Deactivated</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={targetTypeFilter} onValueChange={(value) => {
                  setTargetTypeFilter(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Target Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="profile">Profile</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="payout">Payout</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={handleExportLogs}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs ({totalCount})</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left text-sm font-medium">Timestamp</th>
                          <th className="p-3 text-left text-sm font-medium">Admin</th>
                          <th className="p-3 text-left text-sm font-medium">Action</th>
                          <th className="p-3 text-left text-sm font-medium">Target Type</th>
                          <th className="p-3 text-left text-sm font-medium">Target ID</th>
                          <th className="p-3 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                {formatDate(log.created_at)}
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              {log.admin?.full_name || 'System'}
                            </td>
                            <td className="p-3">
                              {getActionBadge(log.action)}
                            </td>
                            <td className="p-3">
                              {getTargetTypeBadge(log.target_type)}
                            </td>
                            <td className="p-3 text-sm font-mono">
                              {log.target_id?.substring(0, 8)}...
                            </td>
                            <td className="p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(log)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Log Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Most Active Time
                    </p>
                    <p className="text-2xl font-bold">2:00 PM - 4:00 PM</p>
                    <p className="text-xs text-muted-foreground">Peak activity hours</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Most Common Action
                    </p>
                    <p className="text-2xl font-bold">Profile Approved</p>
                    <p className="text-xs text-muted-foreground">Most frequent action</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Additional analytics and visualizations would be displayed here:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Action type distribution chart</li>
                    <li>Admin activity timeline</li>
                    <li>Target type breakdown</li>
                    <li>Hourly activity heatmap</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      {selectedLog && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log Entry Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admin</p>
                  <p className="text-sm">{selectedLog.admin?.full_name || 'System'}</p>
                  {selectedLog.admin?.email && (
                    <p className="text-xs text-muted-foreground">{selectedLog.admin.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Type</p>
                  <div className="mt-1">{getTargetTypeBadge(selectedLog.target_type)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target ID</p>
                  <p className="text-sm font-mono">{selectedLog.target_id}</p>
                </div>
              </div>

              {selectedLog.details && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Additional Details
                  </p>
                  <div className="bg-muted p-4 rounded-md">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminSystemLogsPage;
