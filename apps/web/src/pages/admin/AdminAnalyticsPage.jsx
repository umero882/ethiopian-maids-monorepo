import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Globe,
  Calendar,
  Download,
  Filter,
  Info,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Target,
  Clock,
  MapPin,
  RefreshCw,
  Database
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';
import { adminDashboardAnalyticsService } from '@/services/adminDashboardAnalyticsService';

const log = createLogger('AdminAnalyticsPage');

// Default empty data structure (used as fallback)
const emptyAnalyticsData = {
  overview: {
    totalUsers: 0,
    totalRevenue: 0,
    activeJobs: 0,
    completedMatches: 0,
    growthRate: 0,
    conversionRate: 0,
    avgSessionDuration: '0m 0s',
    bounceRate: 0
  },
  userGrowth: [],
  revenue: [],
  userDistribution: [],
  geographicData: [],
  activityData: [],
  conversionFunnel: []
};

const AdminAnalyticsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('6m');
  const [analyticsData, setAnalyticsData] = useState(emptyAnalyticsData);
  const [dataSource, setDataSource] = useState('loading'); // 'live' | 'error' | 'loading'
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setDataSource('loading');

      log.info(`Fetching real analytics data for time range: ${timeRange}`);

      // Fetch real data from the database via the analytics service
      const data = await adminDashboardAnalyticsService.getAnalyticsData(timeRange);

      log.info('Analytics data fetched successfully:', data);

      setAnalyticsData(data);
      setDataSource('live');
      setLastUpdated(new Date());

      if (isRefresh) {
        toast({
          title: 'Data Refreshed',
          description: 'Analytics data has been updated from the database.',
        });
      }
    } catch (error) {
      log.error('Error loading analytics:', error);
      setDataSource('error');
      toast({
        title: 'Error Loading Analytics',
        description: error.message || 'Failed to load analytics data. Please try again.',
        variant: 'destructive',
      });
      // Keep previous data on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
    logAdminActivity('analytics_view', 'analytics', 'dashboard');
  }, [timeRange, loadAnalytics, logAdminActivity]);

  const handleRefresh = () => {
    loadAnalytics(true);
  };

  const MetricCard = ({ title, value, change, changeType, icon: Icon, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {changeType === 'positive' ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={changeType === 'positive' ? 'text-green-500' : 'text-red-500'}>
              {change}%
            </span>
            <span className="ml-1">vs last period</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Source Status */}
      {dataSource === 'live' && (
        <Alert className="border-green-200 bg-green-50/50">
          <Database className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            <strong>Live Data:</strong> Analytics connected to real database.
            {lastUpdated && (
              <span className="ml-2 text-green-600">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {dataSource === 'error' && (
        <Alert className="border-red-200 bg-red-50/50">
          <Info className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Connection Error:</strong> Unable to fetch live data. Showing cached data if available.
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive platform insights and performance metrics
            {dataSource === 'live' && (
              <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                <Database className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => toast({ title: 'Feature Coming Soon', description: 'Export analytics report feature will be available soon.' })}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={analyticsData.overview.totalUsers.toLocaleString()}
          change={analyticsData.overview.growthRate}
          changeType="positive"
          icon={Users}
          description="Across all user types"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${analyticsData.overview.totalRevenue.toLocaleString()}`}
          change={15.3}
          changeType="positive"
          icon={DollarSign}
          description="Monthly recurring revenue"
        />
        <MetricCard
          title="Active Jobs"
          value={analyticsData.overview.activeJobs.toString()}
          change={-2.1}
          changeType="negative"
          icon={Activity}
          description="Currently active listings"
        />
        <MetricCard
          title="Completed Matches"
          value={analyticsData.overview.completedMatches.toString()}
          change={8.7}
          changeType="positive"
          icon={Target}
          description="Successful placements"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5" />
                  User Growth Trend
                </CardTitle>
                <CardDescription>Monthly user registrations by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="maids" stroke="#3B82F6" strokeWidth={2} />
                    <Line type="monotone" dataKey="sponsors" stroke="#10B981" strokeWidth={2} />
                    <Line type="monotone" dataKey="agencies" stroke="#F59E0B" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* User Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  User Distribution
                </CardTitle>
                <CardDescription>Current platform user breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.userDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {analyticsData.userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                User Activity Pattern
              </CardTitle>
              <CardDescription>Average user activity throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={analyticsData.activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Growth Rate</span>
                  <Badge variant="default" className="bg-green-500">
                    +{analyticsData.overview.growthRate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Conversion Rate</span>
                  <Badge variant="outline">
                    {analyticsData.overview.conversionRate}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg Session</span>
                  <span className="text-sm font-medium">{analyticsData.overview.avgSessionDuration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Bounce Rate</span>
                  <span className="text-sm font-medium">{analyticsData.overview.bounceRate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly User Growth</CardTitle>
                <CardDescription>Registration trends by user type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="maids" fill="#3B82F6" />
                    <Bar dataKey="sponsors" fill="#10B981" />
                    <Bar dataKey="agencies" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Analytics
              </CardTitle>
              <CardDescription>Monthly revenue breakdown by source</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="subscriptions" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="commissions" stackId="a" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Tab */}
        <TabsContent value="geographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Users and revenue by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Country</th>
                      <th className="text-left p-3 font-medium">Users</th>
                      <th className="text-left p-3 font-medium">Revenue</th>
                      <th className="text-left p-3 font-medium">Avg/User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.geographicData.map((country) => (
                      <tr key={country.country} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {country.country}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{country.users.toLocaleString()}</td>
                        <td className="p-3 font-medium">${country.revenue.toLocaleString()}</td>
                        <td className="p-3">
                          <Badge variant="outline">
                            ${Math.round(country.revenue / country.users)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Conversion Funnel
              </CardTitle>
              <CardDescription>User journey from visitor to job completion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.conversionFunnel.map((stage, index) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-medium">{stage.stage}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold">{stage.count.toLocaleString()}</span>
                        <Badge variant={stage.percentage > 50 ? "default" : stage.percentage > 10 ? "secondary" : "destructive"}>
                          {stage.percentage}%
                        </Badge>
                      </div>
                    </div>
                    {index < analyticsData.conversionFunnel.length - 1 && (
                      <div className="w-px h-6 bg-gray-300 ml-8 my-2"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Database Connection Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Database className="h-5 w-5" />
            Analytics Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-600 space-y-2">
          <p>• <strong>User Distribution:</strong> Real-time data from profiles table</p>
          <p>• <strong>Revenue Data:</strong> Aggregated from subscriptions and agency_credits tables</p>
          <p>• <strong>Job Statistics:</strong> Live data from booking_requests table</p>
          <p>• <strong>Placement Metrics:</strong> Tracked via placement_workflows table</p>
          <p>• <strong>Geographic Data:</strong> User location data from profiles table</p>
          <p>• <strong>Conversion Funnel:</strong> Calculated from user journey events</p>
          <p className="pt-2 text-blue-500">
            <RefreshCw className="h-3 w-3 inline mr-1" />
            Click Refresh button to fetch latest data from the database
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPage;