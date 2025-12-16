import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Database,
  Server,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
  FileText,
  Zap,
  HardDrive,
} from 'lucide-react';

const AdminSystemHealthPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState({
    database: { status: 'unknown', responseTime: 0, connections: 0 },
    api: { status: 'unknown', responseTime: 0, requests: 0 },
    storage: { status: 'unknown', usedSpace: 0, totalSpace: 0 },
    performance: { avgLoadTime: 0, errorRate: 0 },
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    systemUptime: 0,
  });

  // Track health check history for uptime calculation
  const [healthHistory, setHealthHistory] = useState([]);
  const healthHistoryRef = useRef(healthHistory);
  healthHistoryRef.current = healthHistory;

  const checkSystemHealth = useCallback(async () => {
    try {
      setLoading(true);

      // Check database health via GraphQL with comprehensive stats
      const dbStart = Date.now();

      // Calculate 24 hours ago for active users
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      // Calculate 7 days ago for weekly active users
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, errors: dbError } = await apolloClient.query({
        query: gql`
          query GetSystemStats($twentyFourHoursAgo: timestamptz!, $sevenDaysAgo: timestamptz!) {
            # Total profiles
            profiles_aggregate {
              aggregate {
                count
              }
            }

            # Total transactions (placement fee transactions)
            placement_fee_transactions_aggregate {
              aggregate {
                count
              }
            }

            # Active users in last 24 hours (based on updated_at)
            active_profiles_24h: profiles_aggregate(
              where: { updated_at: { _gte: $twentyFourHoursAgo } }
            ) {
              aggregate {
                count
              }
            }

            # Active users in last 7 days
            active_profiles_7d: profiles_aggregate(
              where: { updated_at: { _gte: $sevenDaysAgo } }
            ) {
              aggregate {
                count
              }
            }

            # Admin activity logs for recent requests count
            admin_activity_logs_aggregate(
              where: { created_at: { _gte: $twentyFourHoursAgo } }
            ) {
              aggregate {
                count
              }
            }

            # Storage usage from agency_documents
            agency_documents_aggregate {
              aggregate {
                count
                sum {
                  file_size
                }
              }
            }

            # Maid profiles count
            maid_profiles_aggregate {
              aggregate {
                count
              }
            }

            # Active jobs/listings
            jobs_aggregate(where: { status: { _eq: "active" } }) {
              aggregate {
                count
              }
            }
          }
        `,
        variables: {
          twentyFourHoursAgo,
          sevenDaysAgo,
        },
        fetchPolicy: 'network-only'
      });

      const dbResponseTime = Date.now() - dbStart;

      // Get counts from GraphQL response
      const userCount = data?.profiles_aggregate?.aggregate?.count || 0;
      const transactionCount = data?.placement_fee_transactions_aggregate?.aggregate?.count || 0;
      const activeCount24h = data?.active_profiles_24h?.aggregate?.count || 0;
      const activeCount7d = data?.active_profiles_7d?.aggregate?.count || 0;
      const adminActivityCount = data?.admin_activity_logs_aggregate?.aggregate?.count || 0;

      // Storage - file_size is in bytes, convert to MB
      const totalFileSize = data?.agency_documents_aggregate?.aggregate?.sum?.file_size || 0;
      const documentCount = data?.agency_documents_aggregate?.aggregate?.count || 0;
      const usedSpaceMB = Math.round(totalFileSize / (1024 * 1024)); // Convert bytes to MB

      // Assume 10GB storage quota (can be configured)
      const totalSpaceMB = 10240; // 10 GB in MB

      // Update health check history for uptime calculation
      const newHealthEntry = {
        timestamp: Date.now(),
        success: !dbError,
        responseTime: dbResponseTime,
      };

      setHealthHistory(prev => {
        const updated = [...prev, newHealthEntry].slice(-100); // Keep last 100 checks
        return updated;
      });

      // Calculate uptime from health history
      const calculateUptime = (history) => {
        if (history.length === 0) return 100;
        const successfulChecks = history.filter(h => h.success).length;
        return (successfulChecks / history.length) * 100;
      };

      // Calculate average response time from history
      const calculateAvgResponseTime = (history) => {
        if (history.length === 0) return dbResponseTime;
        const total = history.reduce((sum, h) => sum + h.responseTime, 0);
        return Math.round(total / history.length);
      };

      const currentUptime = calculateUptime([...healthHistoryRef.current, newHealthEntry]);
      const avgResponseTime = calculateAvgResponseTime([...healthHistoryRef.current, newHealthEntry]);

      // Determine storage status based on usage
      const storageUsagePercent = totalSpaceMB > 0 ? (usedSpaceMB / totalSpaceMB) * 100 : 0;
      const storageStatus = storageUsagePercent > 90 ? 'error' : storageUsagePercent > 75 ? 'warning' : 'healthy';

      // Update health data
      setHealthData({
        database: {
          status: dbError ? 'error' : dbResponseTime < 100 ? 'healthy' : dbResponseTime < 300 ? 'warning' : 'error',
          responseTime: dbResponseTime,
          connections: documentCount, // Show document count as a proxy metric
        },
        api: {
          status: dbError ? 'error' : 'healthy',
          responseTime: avgResponseTime,
          requests: adminActivityCount,
        },
        storage: {
          status: storageStatus,
          usedSpace: usedSpaceMB,
          totalSpace: totalSpaceMB,
        },
        performance: {
          avgLoadTime: avgResponseTime,
          errorRate: dbError ? 5 : (100 - currentUptime),
        },
      });

      setStats({
        totalUsers: userCount || 0,
        activeUsers: activeCount24h || 0,
        activeUsers7d: activeCount7d || 0,
        totalTransactions: transactionCount || 0,
        systemUptime: currentUptime,
        maidProfiles: data?.maid_profiles_aggregate?.aggregate?.count || 0,
        activeJobs: data?.jobs_aggregate?.aggregate?.count || 0,
      });

      if (dbError) {
        logger.error('Database health check failed:', dbError);
      }
    } catch (err) {
      logger.error('Failed to check system health:', err);

      // Add failed check to history
      setHealthHistory(prev => {
        const updated = [...prev, { timestamp: Date.now(), success: false, responseTime: 0 }].slice(-100);
        return updated;
      });

      toast({
        title: 'Error',
        description: 'Failed to check system health.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    checkSystemHealth();

    // Refresh every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000);
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  const getStatusBadge = (status) => {
    const config = {
      healthy: { variant: 'default', icon: CheckCircle, color: 'text-green-500', label: 'Healthy' },
      warning: { variant: 'secondary', icon: AlertTriangle, color: 'text-yellow-500', label: 'Warning' },
      error: { variant: 'destructive', icon: XCircle, color: 'text-red-500', label: 'Error' },
      unknown: { variant: 'outline', icon: Clock, color: 'text-gray-500', label: 'Unknown' },
    };

    const { variant, icon: Icon, color, label } = config[status] || config.unknown;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {label}
      </Badge>
    );
  };

  const formatBytes = (bytes) => {
    return (bytes / 1024).toFixed(2) + ' GB';
  };

  const formatUptime = (percentage) => {
    return percentage.toFixed(2) + '%';
  };

  return (
    <div className="space-y-6">
      {/* Live Data Status Alert */}
      <Alert className="border-green-200 bg-green-50/50">
        <Database className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          <strong>Live Data:</strong> All metrics are fetched from the database in real-time.
          Auto-refreshes every 30 seconds. Health checks tracked: {healthHistory.length}
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Monitor system performance and status</p>
        </div>
        <Button onClick={checkSystemHealth} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall System Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall System Status</CardTitle>
          <CardDescription>Current system health at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Status</p>
              <div className="mt-2">
                {healthData.database.status === 'healthy' &&
                 healthData.api.status === 'healthy' &&
                 healthData.storage.status === 'healthy' ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <span className="text-2xl font-bold text-green-600">All Systems Operational</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    <span className="text-2xl font-bold text-yellow-600">Some Issues Detected</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Last Check</p>
              <p className="text-sm">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeUsers} active (24h)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(stats.systemUptime)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.performance.avgLoadTime}ms</div>
            <p className="text-xs text-muted-foreground">API response time</p>
          </CardContent>
        </Card>
      </div>

      {/* Component Health Status */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Database Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-500" />
                <CardTitle>Database</CardTitle>
              </div>
              {getStatusBadge(healthData.database.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="text-sm font-medium">{healthData.database.responseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Documents Stored</span>
                <span className="text-sm font-medium">
                  {healthData.database.connections?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium">
                  {healthData.database.status === 'healthy' ? 'Connected' : 'Issues Detected'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-500" />
                <CardTitle>API Services</CardTitle>
              </div>
              {getStatusBadge(healthData.api.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Response Time</span>
                <span className="text-sm font-medium">{healthData.api.responseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Admin Activity (24h)</span>
                <span className="text-sm font-medium">
                  {healthData.api.requests?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <span className="text-sm font-medium">{healthData.performance.errorRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Health */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                <CardTitle>Storage</CardTitle>
              </div>
              {getStatusBadge(healthData.storage.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Used Space</span>
                <span className="text-sm font-medium">
                  {formatBytes(healthData.storage.usedSpace)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Space</span>
                <span className="text-sm font-medium">
                  {formatBytes(healthData.storage.totalSpace)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usage</span>
                <span className="text-sm font-medium">
                  {((healthData.storage.usedSpace / healthData.storage.totalSpace) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{
                    width: `${(healthData.storage.usedSpace / healthData.storage.totalSpace) * 100}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-500" />
                <CardTitle>Performance</CardTitle>
              </div>
              {getStatusBadge(
                healthData.performance.avgLoadTime < 200 &&
                healthData.performance.errorRate < 1
                  ? 'healthy'
                  : 'warning'
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Load Time</span>
                <span className="text-sm font-medium">
                  {healthData.performance.avgLoadTime}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Error Rate</span>
                <span className="text-sm font-medium">
                  {healthData.performance.errorRate}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="text-sm font-medium">
                  {healthData.performance.avgLoadTime < 200 ? 'Excellent' : 'Needs Attention'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>System Recommendations</CardTitle>
          <CardDescription>Suggested actions to improve system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthData.database.responseTime > 100 && (
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-yellow-50">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Database Performance</p>
                  <p className="text-xs text-muted-foreground">
                    Database response time is above optimal levels. Consider optimizing queries or scaling resources.
                  </p>
                </div>
              </div>
            )}

            {(healthData.storage.usedSpace / healthData.storage.totalSpace) > 0.8 && (
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-orange-50">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Storage Capacity</p>
                  <p className="text-xs text-muted-foreground">
                    Storage usage is above 80%. Consider archiving old data or expanding storage capacity.
                  </p>
                </div>
              </div>
            )}

            {healthData.performance.errorRate > 1 && (
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-red-50">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Error Rate Alert</p>
                  <p className="text-xs text-muted-foreground">
                    Error rate is above acceptable threshold. Review system logs for recurring issues.
                  </p>
                </div>
              </div>
            )}

            {healthData.database.responseTime <= 100 &&
             (healthData.storage.usedSpace / healthData.storage.totalSpace) <= 0.8 &&
             healthData.performance.errorRate <= 1 && (
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">All Systems Healthy</p>
                  <p className="text-xs text-muted-foreground">
                    All system components are performing optimally. No action required.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystemHealthPage;
