import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  Building2,
  UserCheck,
  Home,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useGetAdminDashboardDataQuery } from '@ethio/api-client';
import { createLogger } from '@/utils/logger';
import { usePageTitle } from '@/hooks/usePageTitle';

const log = createLogger('AdminDashboard');

const POLL_INTERVAL = 300000; // 5 minutes

const AdminDashboard = () => {
  usePageTitle('Admin Dashboard');
  const { adminUser, logAdminActivity } = useAdminAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Calculate start of current month and week ago for stats
  const { startOfMonth, weekAgo } = useMemo(() => {
    const now = new Date();
    return {
      startOfMonth: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }, []);

  // Single combined query — replaces 11 separate polling queries
  // This prevents exhausting the browser connection pool
  const {
    data,
    loading: dashboardLoading,
    error: dashboardError,
    refetch
  } = useGetAdminDashboardDataQuery({
    variables: { activityLimit: 10, transactionsLimit: 10, startOfMonth, weekAgo },
    pollInterval: POLL_INTERVAL,
    onError: (error) => {
      log.error('Dashboard query error:', error);
    }
  });

  const isConnected = !dashboardError;

  // Update the lastUpdated timestamp when data changes
  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

  useEffect(() => {
    logAdminActivity('dashboard_view', 'dashboard', 'main');
  }, [logAdminActivity]);

  // Compute derived stats from combined query data (all aggregates, no row fetching)
  const userStats = useMemo(() => {
    return {
      total: data?.total_profiles?.aggregate?.count || 0,
      active: data?.total_profiles?.aggregate?.count || 0,
      byType: {
        maid: data?.maid_profiles_aggregate?.aggregate?.count || 0,
        agency: data?.agency_profiles_aggregate?.aggregate?.count || 0,
        sponsor: data?.sponsor_profiles_aggregate?.aggregate?.count || 0,
      },
      newThisWeek: data?.new_profiles_this_week?.aggregate?.count || 0,
    };
  }, [data]);

  const pendingActions = useMemo(() => {
    const pendingMaids = data?.pending_verifications?.aggregate?.count || 0;
    const pendingJobs = data?.pending_jobs?.aggregate?.count || 0;
    const openTickets = data?.open_tickets?.aggregate?.count || 0;
    const highPriorityTickets = data?.high_priority_tickets?.aggregate?.count || 0;

    return [
      {
        type: 'profile_review',
        count: pendingMaids,
        priority: pendingMaids > 10 ? 'high' : 'medium',
        description: 'Maid profiles pending verification'
      },
      {
        type: 'content_moderation',
        count: pendingJobs,
        priority: pendingJobs > 5 ? 'high' : 'medium',
        description: 'Job listings requiring review'
      },
      {
        type: 'user_support',
        count: openTickets,
        priority: highPriorityTickets > 0 ? 'high' : 'medium',
        description: 'Support tickets awaiting response'
      }
    ].filter(action => action.count > 0);
  }, [data]);

  const financialMetrics = useMemo(() => {
    const aggregate = data?.placement_fee_transactions_aggregate?.aggregate;
    const monthlyRevenue = aggregate?.sum?.fee_amount || 0;
    const transactionCount = aggregate?.count || 0;

    return {
      monthlyRevenue,
      revenueGrowth: 0,
      totalTransactions: transactionCount,
      averageTransactionValue: transactionCount > 0 ? monthlyRevenue / transactionCount : 0
    };
  }, [data]);

  const recentActivity = useMemo(() => {
    const activities = data?.admin_activity_logs || [];
    return activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      adminName: activity.admin_user?.full_name || 'Unknown Admin',
      timestamp: activity.created_at,
      resourceType: activity.resource_type,
      resourceId: activity.resource_id
    }));
  }, [data]);

  // Manual refresh - refetch all queries immediately
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    log.info('Manual refresh triggered');
    setRefreshing(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch (err) {
      log.error('Refresh failed:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const MetricCard = ({ title, value, change, changeType, icon: Icon, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && change !== 0 && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {changeType === 'positive' ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">vs last month</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (dashboardLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header with Status */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {adminUser?.full_name}
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening on your platform today.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Connection issues</span>
              </>
            )}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-muted-foreground">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>

          {/* Refresh Button */}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={userStats.total?.toLocaleString() || '0'}
          icon={Users}
          description={`${userStats.newThisWeek} new this week`}
        />

        <MetricCard
          title="Active Users"
          value={userStats.active?.toLocaleString() || '0'}
          icon={Activity}
          description="Currently active on platform"
        />

        <MetricCard
          title="Monthly Revenue"
          value={`$${financialMetrics.monthlyRevenue?.toLocaleString() || '0'}`}
          change={financialMetrics.revenueGrowth}
          changeType={financialMetrics.revenueGrowth > 0 ? 'positive' : 'negative'}
          icon={DollarSign}
          description={`${financialMetrics.totalTransactions} transactions`}
        />

        <MetricCard
          title="System Health"
          value={isConnected ? "Healthy" : "Degraded"}
          icon={isConnected ? CheckCircle2 : AlertTriangle}
          description={isConnected ? "Polling every 5m" : "Query errors detected"}
        />
      </div>

      {/* User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Breakdown by user type (refreshes every 5m)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50">
                <UserCheck className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {userStats.byType?.maid || 0}
                  </p>
                  <p className="text-sm text-blue-600">Maids</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50">
                <Building2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {userStats.byType?.agency || 0}
                  </p>
                  <p className="text-sm text-green-600">Agencies</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50">
                <Home className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {userStats.byType?.sponsor || 0}
                  </p>
                  <p className="text-sm text-purple-600">Sponsors</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingActions.length === 0 ? (
                <div className="flex items-center justify-center py-4 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  <span>All caught up!</span>
                </div>
              ) : (
                pendingActions.map((action, index) => (
                  <Alert key={index} className={action.priority === 'high' ? 'border-red-200' : 'border-yellow-200'}>
                    <AlertTriangle className={`h-4 w-4 ${action.priority === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                    <AlertDescription>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{action.count} {action.description}</p>
                          <Badge variant={action.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs mt-1">
                            {action.priority} priority
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
          <CardDescription>Latest administrative actions (refreshes every 5m)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity to display
              </p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {activity.adminName} performed {activity.action.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.resourceType} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
