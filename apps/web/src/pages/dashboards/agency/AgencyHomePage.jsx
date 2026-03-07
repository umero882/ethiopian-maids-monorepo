import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAgencyDashboard } from '@/hooks/useAgencyDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Briefcase,
  UserPlus,
  Calendar,
  TrendingUp,
  CreditCard,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Bell,
  RefreshCw,
  Shield,
  User,
  Building,
  ArrowRight,
} from 'lucide-react';
import { PipelineFunnelChart } from '@/components/charts/PipelineFunnelChart';
import { TimeToHireTrendChart } from '@/components/charts/TimeToHireTrendChart';
import { TasksSLAPanel } from '@/components/dashboard/TasksSLAPanel';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { usePageTitle } from '@/hooks/usePageTitle';

const AgencyHomePage = () => {
  usePageTitle('Agency Dashboard');
  const {
    kpis,
    agencyProfile,
    alerts,
    pipelineFunnel,
    timeToHireTrend,
    tasksSLA,
    loading,
    error,
    refreshData,
    refreshKPIs,
    refreshAlerts,
    logAuditEvent,
  } = useAgencyDashboard();

  const { user } = useAuth();
  const { refreshSubscription, subscriptionPlan, dbSubscription } = useSubscription();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    logAuditEvent('dashboard_view', 'dashboard', 'agency_home', { timestamp: Date.now() });
  }, []);

  // Calculate profile completion from actual DB data
  const completionFields = [
    { key: 'full_name', check: (v) => !!v?.trim() },
    { key: 'license_number', check: (v) => !!v?.trim() },
    { key: 'logo_url', check: (v) => !!v },
    { key: 'authorized_person_id_document', check: (v) => !!v },
    { key: 'country', check: (v) => !!v?.trim() },
    { key: 'city', check: (v) => !!v?.trim() },
    { key: 'phone', check: (v) => !!v?.trim(), fallback: 'business_phone' },
    { key: 'email', check: (v) => !!v?.trim(), fallback: 'business_email' },
    { key: 'authorized_person_name', check: (v) => !!v?.trim() },
    { key: 'authorized_person_position', check: (v) => !!v?.trim() },
    { key: 'authorized_person_phone', check: (v) => !!v?.trim() },
    { key: 'authorized_person_email', check: (v) => !!v?.trim() },
    { key: 'specialization', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'agency_description', check: (v) => !!v?.trim() && v.trim().length >= 100 },
  ];
  const filledCount = agencyProfile ? completionFields.filter((f) => f.check(agencyProfile[f.key]) || (f.fallback && f.check(agencyProfile[f.fallback]))).length : 0;
  const completionPct = agencyProfile ? Math.round((filledCount / completionFields.length) * 100) : 0;

  // Get logo from DB profile (not from AuthContext)
  const agencyLogo = agencyProfile?.logo_url;
  const agencyName = agencyProfile?.full_name || user?.agencyName;

  // Check for subscription success parameter
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      // Show congratulations toast
      toast({
        title: 'Subscription Upgraded Successfully!',
        description: 'Welcome to your new plan! Your subscription is now active and all features are unlocked.',
        variant: 'default',
        duration: 6000,
      });

      // Refresh subscription data immediately
      refreshSubscription().catch((error) => {
        console.error('[AgencyHomePage] Error in initial refreshSubscription():', error);
      });

      // Refresh dashboard data immediately
      refreshKPIs();

      // Poll for subscription updates (webhook may take a few seconds)
      const pollAttempts = [2000, 4000, 6000]; // Poll at 2s, 4s, and 6s

      pollAttempts.forEach((delay, index) => {
        setTimeout(() => {
          refreshSubscription().catch((error) => {
            console.error(`[AgencyHomePage] Error in refreshSubscription() - Attempt ${index + 2}:`, error);
          });
          refreshKPIs();
        }, delay);
      });

      // Clean up URL by removing success parameter
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });

      // Log the successful upgrade
      logAuditEvent('subscription_upgrade_viewed', 'subscription', 'upgrade_success', {
        timestamp: Date.now(),
      });
    }
  }, [searchParams, setSearchParams, toast, refreshSubscription, refreshKPIs, logAuditEvent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await logAuditEvent('dashboard_refresh', 'dashboard', 'agency_home');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'critical':
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'warning':
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* KPI Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading dashboard data: {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-4"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          {/* Agency Logo */}
          {!logoError && agencyLogo ? (
            <div className="flex-shrink-0">
              <img
                src={agencyLogo}
                alt="Agency Logo"
                className="w-16 h-16 object-cover rounded-full border-4 border-white shadow-lg"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Building className="w-8 h-8 text-white" />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {agencyName ? `${agencyName} Dashboard` : 'Agency Dashboard'}
            </h1>
            <p className="text-gray-600 mt-1">
              Manage maids, jobs, applicants, matches, sponsors, billing, compliance, and disputes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Profile Completion Status — only show when profile is NOT 100% complete */}
      {agencyProfile && completionPct < 100 && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-gray-900">
                    Complete Your Agency Profile
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {filledCount} of {completionFields.length} required fields completed
                  </CardDescription>
                </div>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 flex items-center">
                <Link to="/dashboard/agency/profile" aria-label="Go to profile to complete it">
                  <span>Complete Profile</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">Profile Completion</span>
                  <span className="text-blue-600 font-semibold">{completionPct}%</span>
                </div>
                <Progress
                  value={completionPct}
                  className="h-3 [&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-indigo-600"
                />
              </div>

              {/* Missing Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center space-x-2 text-sm">
                  {completionPct >= 100 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={completionPct >= 100 ? 'text-green-700' : 'text-gray-600'}>
                    All required fields
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  {agencyProfile.phone || agencyProfile.business_phone ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={agencyProfile.phone || agencyProfile.business_phone ? 'text-green-700' : 'text-gray-600'}>
                    Phone verification
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  {agencyProfile.email || agencyProfile.business_email ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={agencyProfile.email || agencyProfile.business_email ? 'text-green-700' : 'text-gray-600'}>
                    Email verification
                  </span>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="bg-white rounded-lg p-4 mt-4 border border-blue-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Unlock by completing your profile:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <span>Publish job listings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3 text-blue-500" />
                    <span>Add maid profiles</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-3 w-3 text-blue-500" />
                    <span>Access full dashboard</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span>Analytics & reports</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <AlertsPanel alerts={alerts} onRefresh={refreshAlerts} />
      )}

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Maids */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Maids
            </CardTitle>
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.activeMaids || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Available for placement</p>
          </CardContent>
        </Card>

        {/* Jobs Live */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Jobs Live
            </CardTitle>
            <div className="p-2 bg-green-50 rounded-full">
              <Briefcase className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.jobsLive || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active job listings</p>
          </CardContent>
        </Card>

        {/* New Applicants Today */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Applicants Today
            </CardTitle>
            <div className="p-2 bg-purple-50 rounded-full">
              <UserPlus className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.newApplicantsToday || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Applications received</p>
          </CardContent>
        </Card>

        {/* Interviews Scheduled */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Interviews Scheduled
            </CardTitle>
            <div className="p-2 bg-orange-50 rounded-full">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.interviewsScheduled || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">This week</p>
          </CardContent>
        </Card>

        {/* Hires This Month */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hires This Month
            </CardTitle>
            <div className="p-2 bg-indigo-50 rounded-full">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.hiresThisMonth || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Successful placements</p>
          </CardContent>
        </Card>

        {/* Subscription Status - Using SubscriptionContext for accurate data */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Subscription Status
            </CardTitle>
            <div className={`p-2 rounded-full ${
              subscriptionPlan === 'premium' ? 'bg-purple-50' :
              subscriptionPlan === 'pro' ? 'bg-orange-50' : 'bg-gray-50'
            }`}>
              <CreditCard className={`h-4 w-4 ${
                subscriptionPlan === 'premium' ? 'text-purple-600' :
                subscriptionPlan === 'pro' ? 'text-orange-600' : 'text-gray-600'
              }`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge
                className={getStatusColor(dbSubscription?.status || (subscriptionPlan !== 'free' ? 'active' : 'inactive'))}
              >
                {subscriptionPlan !== 'free'
                  ? (dbSubscription?.status || 'Active').charAt(0).toUpperCase() + (dbSubscription?.status || 'active').slice(1)
                  : 'Free Tier'}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {dbSubscription?.plan_name ||
                (subscriptionPlan === 'premium' ? 'Premium' :
                 subscriptionPlan === 'pro' ? 'Professional' : 'Free')} plan
            </p>
          </CardContent>
        </Card>

        {/* Overdue Documents */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overdue Documents
            </CardTitle>
            <div className="p-2 bg-red-50 rounded-full">
              <FileText className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.overdueDocuments || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Require attention</p>
          </CardContent>
        </Card>

        {/* Open Disputes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Disputes
            </CardTitle>
            <div className="p-2 bg-red-50 rounded-full">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {kpis.openDisputes || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Need resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Funnel</CardTitle>
            <CardDescription>
              Profile → Applied → Interviewed → Offered → Hired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineFunnelChart data={pipelineFunnel} />
          </CardContent>
        </Card>

        {/* Time to Hire Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Time-to-Hire Trend</CardTitle>
            <CardDescription>
              Average hiring time over different periods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeToHireTrendChart data={timeToHireTrend} />
          </CardContent>
        </Card>
      </div>

      {/* Tasks & SLA Panel and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task & SLA Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Tasks & SLA</span>
            </CardTitle>
            <CardDescription>
              Today's tasks and overdue items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TasksSLAPanel tasks={tasksSLA} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common agency management tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-12 flex flex-col items-center justify-center space-y-1" asChild>
                <Link to="/dashboard/agency/maids/add">
                  <UserPlus className="h-5 w-5" />
                  <span className="text-xs">Add Maid</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1" asChild>
                <Link to="/dashboard/agency/jobs/create">
                  <Briefcase className="h-5 w-5" />
                  <span className="text-xs">Create Job</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1" asChild>
                <Link to="/dashboard/agency/messaging">
                  <Bell className="h-5 w-5" />
                  <span className="text-xs">Send Messages</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-12 flex flex-col items-center justify-center space-y-1" asChild>
                <Link to="/dashboard/agency/analytics">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">View Analytics</span>
                </Link>
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm text-gray-900 mb-2">Recent Activity</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">3 new applications received</span>
                  <span className="text-xs text-gray-400 ml-auto">2h ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Interview scheduled for tomorrow</span>
                  <span className="text-xs text-gray-400 ml-auto">4h ago</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Document verification pending</span>
                  <span className="text-xs text-gray-400 ml-auto">1d ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgencyHomePage;
