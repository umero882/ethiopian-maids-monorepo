/**
 * Admin Placement Reports Page
 *
 * Comprehensive reporting dashboard for placement workflows including:
 * - Placement success rates
 * - Revenue from platform fees
 * - Trial outcomes
 * - Interview completion rates
 * - Agency balance status
 */

import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
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
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Activity,
  Calendar,
  Download,
  Info,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Briefcase,
  Wallet,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthWrapper';
import { toast } from '@/components/ui/use-toast';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

// ============================================================================
// GRAPHQL QUERIES
// ============================================================================

const GET_PLACEMENT_STATS = gql`
  query GetPlacementStats($startDate: timestamptz!, $endDate: timestamptz!) {
    total: placement_workflows_aggregate(
      where: { created_at: { _gte: $startDate, _lte: $endDate } }
    ) {
      aggregate {
        count
      }
    }
    successful: placement_workflows_aggregate(
      where: {
        status: { _eq: "placement_confirmed" }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    failed: placement_workflows_aggregate(
      where: {
        status: { _eq: "placement_failed" }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    in_progress: placement_workflows_aggregate(
      where: {
        status: { _nin: ["placement_confirmed", "placement_failed"] }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    revenue: placement_workflows_aggregate(
      where: { fee_status: { _eq: "earned" } }
    ) {
      aggregate {
        sum {
          platform_fee_amount
        }
      }
    }
    trials_started: placement_workflows_aggregate(
      where: {
        trial_start_date: { _is_null: false }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    interviews_scheduled: placement_workflows_aggregate(
      where: {
        interview_scheduled_date: { _is_null: false }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    interviews_completed: placement_workflows_aggregate(
      where: {
        interview_completed_date: { _is_null: false }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_AGENCY_STATS = gql`
  query GetAgencyStats($threshold: numeric!) {
    total_agencies: agency_credits_aggregate {
      aggregate {
        count
      }
    }
    low_balance: agency_credits_aggregate(
      where: { available_credits: { _lt: $threshold } }
    ) {
      aggregate {
        count
      }
    }
    healthy_balance: agency_credits_aggregate(
      where: { available_credits: { _gte: $threshold } }
    ) {
      aggregate {
        count
      }
    }
    total_credits: agency_credits_aggregate {
      aggregate {
        sum {
          total_credits
        }
        sum {
          available_credits
        }
        sum {
          reserved_credits
        }
      }
    }
    low_balance_agencies: agency_credits(
      where: { available_credits: { _lt: $threshold } }
      order_by: { available_credits: asc }
      limit: 10
    ) {
      agency_id
      available_credits
      total_credits
      agency_profile {
        full_name
        business_name
      }
    }
  }
`;

const GET_RECENT_PLACEMENTS = gql`
  query GetRecentPlacements($limit: Int!) {
    placement_workflows(
      order_by: { updated_at: desc }
      limit: $limit
    ) {
      id
      status
      created_at
      updated_at
      platform_fee_amount
      platform_fee_currency
      sponsor_confirmed
      agency_confirmed
      maid_profile {
        full_name
      }
      sponsor_profile {
        full_name
      }
      agency_profile {
        full_name
        business_name
      }
    }
  }
`;

const GET_MONTHLY_STATS = gql`
  query GetMonthlyStats {
    placement_workflows(order_by: { created_at: asc }) {
      id
      status
      created_at
      platform_fee_amount
      fee_status
    }
  }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getDateRange = (range) => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '1m':
      start.setMonth(start.getMonth() - 1);
      break;
    case '3m':
      start.setMonth(start.getMonth() - 3);
      break;
    case '6m':
      start.setMonth(start.getMonth() - 6);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setMonth(start.getMonth() - 1);
  }

  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const formatCurrency = (amount, currency = 'AED') => {
  if (!amount) return `0 ${currency}`;
  return `${amount.toLocaleString()} ${currency}`;
};

const getStatusBadgeVariant = (status) => {
  switch (status) {
    case 'placement_confirmed':
      return 'default';
    case 'placement_failed':
      return 'destructive';
    case 'trial_started':
    case 'trial_completed':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status) => {
  const labels = {
    contact_initiated: 'Contact Initiated',
    interview_scheduled: 'Interview Scheduled',
    interview_completed: 'Interview Completed',
    trial_started: 'Trial Started',
    trial_completed: 'Trial Completed',
    placement_confirmed: 'Confirmed',
    placement_failed: 'Failed',
  };
  return labels[status] || status;
};

// ============================================================================
// COMPONENT
// ============================================================================

const AdminPlacementReportsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('1m');
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    inProgress: 0,
    revenue: 0,
    trialsStarted: 0,
    interviewsScheduled: 0,
    interviewsCompleted: 0,
  });
  const [agencyStats, setAgencyStats] = useState({
    totalAgencies: 0,
    lowBalance: 0,
    healthyBalance: 0,
    totalCredits: 0,
    availableCredits: 0,
    reservedCredits: 0,
    lowBalanceAgencies: [],
  });
  const [recentPlacements, setRecentPlacements] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    loadAllData();
    logAdminActivity('view_placement_reports', 'reports', 'placement');
  }, [timeRange]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPlacementStats(),
        loadAgencyStats(),
        loadRecentPlacements(),
        loadMonthlyData(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load placement reports. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlacementStats = async () => {
    const { startDate, endDate } = getDateRange(timeRange);

    try {
      const { data } = await apolloClient.query({
        query: GET_PLACEMENT_STATS,
        variables: { startDate, endDate },
        fetchPolicy: 'network-only',
      });

      setStats({
        total: data?.total?.aggregate?.count || 0,
        successful: data?.successful?.aggregate?.count || 0,
        failed: data?.failed?.aggregate?.count || 0,
        inProgress: data?.in_progress?.aggregate?.count || 0,
        revenue: data?.revenue?.aggregate?.sum?.platform_fee_amount || 0,
        trialsStarted: data?.trials_started?.aggregate?.count || 0,
        interviewsScheduled: data?.interviews_scheduled?.aggregate?.count || 0,
        interviewsCompleted: data?.interviews_completed?.aggregate?.count || 0,
      });
    } catch (error) {
      console.error('Error loading placement stats:', error);
      // Production mode - no fallback to mock data
    }
  };

  const loadAgencyStats = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_AGENCY_STATS,
        variables: { threshold: 500 },
        fetchPolicy: 'network-only',
      });

      setAgencyStats({
        totalAgencies: data?.total_agencies?.aggregate?.count || 0,
        lowBalance: data?.low_balance?.aggregate?.count || 0,
        healthyBalance: data?.healthy_balance?.aggregate?.count || 0,
        totalCredits: data?.total_credits?.aggregate?.sum?.total_credits || 0,
        availableCredits: data?.total_credits?.aggregate?.sum?.available_credits || 0,
        reservedCredits: data?.total_credits?.aggregate?.sum?.reserved_credits || 0,
        lowBalanceAgencies: data?.low_balance_agencies || [],
      });
    } catch (error) {
      console.error('Error loading agency stats:', error);
      // Production mode - no fallback to mock data
    }
  };

  const loadRecentPlacements = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_RECENT_PLACEMENTS,
        variables: { limit: 10 },
        fetchPolicy: 'network-only',
      });

      setRecentPlacements(data?.placement_workflows || []);
    } catch (error) {
      console.error('Error loading recent placements:', error);
      // Production mode - no fallback to mock data
    }
  };

  const loadMonthlyData = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_MONTHLY_STATS,
        fetchPolicy: 'network-only',
      });

      // Process data into monthly buckets
      const workflows = data?.placement_workflows || [];
      const monthlyMap = {};

      workflows.forEach((w) => {
        const date = new Date(w.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {
            month: new Date(date.getFullYear(), date.getMonth(), 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            total: 0,
            successful: 0,
            failed: 0,
            revenue: 0,
          };
        }

        monthlyMap[monthKey].total++;
        if (w.status === 'placement_confirmed') {
          monthlyMap[monthKey].successful++;
        }
        if (w.status === 'placement_failed') {
          monthlyMap[monthKey].failed++;
        }
        if (w.fee_status === 'earned' && w.platform_fee_amount) {
          monthlyMap[monthKey].revenue += w.platform_fee_amount;
        }
      });

      const sortedData = Object.values(monthlyMap).slice(-6);
      setMonthlyData(sortedData);
    } catch (error) {
      console.error('Error loading monthly data:', error);
      // Production mode - no fallback to mock data
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
    toast({
      title: 'Data Refreshed',
      description: 'Placement reports have been updated.',
    });
  };

  const handleExport = () => {
    toast({
      title: 'Export Started',
      description: 'Your placement report is being generated...',
    });
    // In production, this would trigger a CSV/PDF export
  };

  // Calculate success rate
  const successRate = stats.total > 0 ? ((stats.successful / stats.total) * 100).toFixed(1) : 0;
  const interviewCompletionRate = stats.interviewsScheduled > 0
    ? ((stats.interviewsCompleted / stats.interviewsScheduled) * 100).toFixed(1)
    : 0;

  // Prepare pie chart data
  const statusDistribution = [
    { name: 'Confirmed', value: stats.successful, color: '#10B981' },
    { name: 'Failed', value: stats.failed, color: '#EF4444' },
    { name: 'In Progress', value: stats.inProgress, color: '#F59E0B' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading placement reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Placement Reports</h1>
          <p className="text-muted-foreground">
            Track placement success rates, revenue, and agency performance
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="1m">Last Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Placements</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.inProgress} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <div className="mt-2">
              <Progress value={parseFloat(successRate)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.revenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {stats.successful} confirmed placements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Completion</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{interviewCompletionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.interviewsCompleted} of {stats.interviewsScheduled} scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="agencies">Agency Balance</TabsTrigger>
          <TabsTrigger value="recent">Recent Placements</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Placement Status Distribution
                </CardTitle>
                <CardDescription>Current status breakdown of all placements</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Workflow Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Placement Funnel
                </CardTitle>
                <CardDescription>Progression through placement stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Interviews Scheduled</span>
                    </div>
                    <span className="font-medium">{stats.interviewsScheduled}</span>
                  </div>
                  <Progress value={100} className="h-2 bg-blue-100" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm">Interviews Completed</span>
                    </div>
                    <span className="font-medium">{stats.interviewsCompleted}</span>
                  </div>
                  <Progress
                    value={stats.interviewsScheduled > 0 ? (stats.interviewsCompleted / stats.interviewsScheduled) * 100 : 0}
                    className="h-2 bg-purple-100"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-sm">Trials Started</span>
                    </div>
                    <span className="font-medium">{stats.trialsStarted}</span>
                  </div>
                  <Progress
                    value={stats.interviewsCompleted > 0 ? (stats.trialsStarted / stats.interviewsCompleted) * 100 : 0}
                    className="h-2 bg-orange-100"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm">Confirmed Placements</span>
                    </div>
                    <span className="font-medium">{stats.successful}</span>
                  </div>
                  <Progress
                    value={stats.trialsStarted > 0 ? (stats.successful / stats.trialsStarted) * 100 : 0}
                    className="h-2 bg-green-100"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-700">{stats.successful}</p>
                    <p className="text-sm text-green-600">Confirmed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-700">{stats.inProgress}</p>
                    <p className="text-sm text-orange-600">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{formatCurrency(stats.revenue)}</p>
                    <p className="text-sm text-purple-600">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Placement Trends
              </CardTitle>
              <CardDescription>Placement outcomes and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="successful" name="Confirmed" fill="#10B981" />
                  <Bar yAxisId="left" dataKey="failed" name="Failed" fill="#EF4444" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (AED)" stroke="#8B5CF6" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Success Rate Trend
              </CardTitle>
              <CardDescription>Monthly placement success rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData.map(d => ({
                  ...d,
                  successRate: d.total > 0 ? ((d.successful / d.total) * 100).toFixed(1) : 0,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Line type="monotone" dataKey="successRate" name="Success Rate" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agency Balance Tab */}
        <TabsContent value="agencies" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agencies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agencyStats.totalAgencies}</div>
                <p className="text-xs text-muted-foreground mt-1">With credit accounts</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Healthy Balance</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">{agencyStats.healthyBalance}</div>
                <p className="text-xs text-green-600 mt-1">Balance &ge; 500</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-700">Low Balance</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-700">{agencyStats.lowBalance}</div>
                <p className="text-xs text-red-600 mt-1">Balance &lt; 500</p>
              </CardContent>
            </Card>
          </div>

          {/* Platform Credits Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Platform Credits Overview
              </CardTitle>
              <CardDescription>Total credits across all agencies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-700">{formatCurrency(agencyStats.totalCredits)}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Credits</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-700">{formatCurrency(agencyStats.availableCredits)}</p>
                  <p className="text-sm text-green-600 mt-1">Available</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-3xl font-bold text-orange-700">{formatCurrency(agencyStats.reservedCredits)}</p>
                  <p className="text-sm text-orange-600 mt-1">Reserved</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Balance Agencies */}
          {agencyStats.lowBalanceAgencies.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Agencies with Low Balance
                </CardTitle>
                <CardDescription>These agencies need to deposit to accept new inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agencyStats.lowBalanceAgencies.map((agency) => (
                    <div key={agency.agency_id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">{agency.agency_profile?.full_name || agency.agency_profile?.business_name || 'Unknown Agency'}</p>
                        <p className="text-sm text-gray-500">ID: {agency.agency_id}</p>
                      </div>
                      <Badge variant="destructive">
                        {formatCurrency(agency.available_credits)} available
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recent Placements Tab */}
        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Placements
              </CardTitle>
              <CardDescription>Latest placement workflow activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Maid</th>
                      <th className="text-left p-3 font-medium">Sponsor</th>
                      <th className="text-left p-3 font-medium">Agency</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Fee</th>
                      <th className="text-left p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPlacements.map((placement) => (
                      <tr key={placement.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">{placement.maid_profile?.full_name || 'N/A'}</td>
                        <td className="p-3">{placement.sponsor_profile?.full_name || 'N/A'}</td>
                        <td className="p-3">{placement.agency_profile?.full_name || placement.agency_profile?.business_name || 'Independent'}</td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(placement.status)}>
                            {getStatusLabel(placement.status)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {placement.platform_fee_amount
                            ? formatCurrency(placement.platform_fee_amount, placement.platform_fee_currency)
                            : '-'}
                        </td>
                        <td className="p-3 text-sm text-gray-500">
                          {new Date(placement.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {recentPlacements.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-500">
                          No placements found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPlacementReportsPage;
