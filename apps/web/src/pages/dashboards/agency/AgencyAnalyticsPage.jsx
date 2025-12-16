import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Target, Users, Briefcase, Clock, DollarSign, Star, ArrowUpRight, ArrowDownRight, RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { agencyAnalyticsService } from '@/services/agencyAnalyticsService.graphql';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

const log = createLogger('AgencyAnalyticsPage');

const AgencyAnalyticsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User ID not found. Please log in again.');
      }

      log.info('Fetching analytics data from Hasura', { userId: user.id, timeRange });
      const { data, error: fetchError } = await agencyAnalyticsService.getAnalyticsData(user.id, timeRange);

      if (fetchError) {
        throw fetchError;
      }

      setAnalyticsData(data);
      setLastUpdated(new Date());
      log.info('Analytics data loaded successfully from Hasura');
    } catch (error) {
      log.error('Error fetching analytics:', error);
      setError(error.message);
      toast({
        variant: 'destructive',
        title: 'Failed to load analytics',
        description: error.message || 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleExportReport = () => {
    if (!analyticsData) {
      toast({
        variant: 'destructive',
        title: 'No data to export',
        description: 'Please wait for the analytics data to load.'
      });
      return;
    }

    try {
      log.info('Exporting analytics report');

      // Prepare CSV data
      const csvRows = [];

      // Header
      csvRows.push('Agency Analytics Report');
      csvRows.push(`Generated: ${new Date().toLocaleString()}`);
      csvRows.push(`Time Range: ${timeRange}`);
      csvRows.push('');

      // KPIs Section
      csvRows.push('KEY PERFORMANCE INDICATORS');
      csvRows.push('Metric,Value,Change');
      csvRows.push(`Total Revenue,${analyticsData.kpis.totalRevenue},${analyticsData.kpis.revenueChange}`);
      csvRows.push(`Total Placements,${analyticsData.kpis.totalPlacements},${analyticsData.kpis.placementsChange}`);
      csvRows.push(`Avg. Satisfaction,${analyticsData.kpis.avgSatisfaction},${analyticsData.kpis.satisfactionChange}`);
      csvRows.push(`Avg. Time to Hire,${analyticsData.kpis.avgTimeToHire},${analyticsData.kpis.timeToHireChange}`);
      csvRows.push('');

      // Monthly Revenue
      csvRows.push('MONTHLY REVENUE TREND');
      csvRows.push('Month,Revenue');
      analyticsData.revenueData?.forEach(item => {
        csvRows.push(`${item.month},${item.revenue}`);
      });
      csvRows.push('');

      // Top Destinations
      csvRows.push('TOP DESTINATIONS');
      csvRows.push('Country,Placements,Percentage');
      analyticsData.topDestinations?.forEach(dest => {
        csvRows.push(`${dest.country},${dest.placements},${dest.percentage}%`);
      });
      csvRows.push('');

      // Placement Metrics
      csvRows.push('PLACEMENT METRICS');
      csvRows.push('Category,Success Rate');
      analyticsData.placementMetrics?.forEach(metric => {
        csvRows.push(`${metric.category},${metric.rate}%`);
      });

      // Create CSV blob
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `analytics-report-${timeRange}-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Report Exported',
        description: 'Your analytics report has been downloaded successfully.'
      });

      log.info('Analytics report exported successfully');
    } catch (error) {
      log.error('Error exporting report:', error);
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export the report. Please try again.'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: analyticsData?.kpis?.totalRevenue || '$0',
      change: analyticsData?.kpis?.revenueChange || '+0%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Successful Placements',
      value: analyticsData?.kpis?.totalPlacements || '0',
      change: analyticsData?.kpis?.placementsChange || '+0%',
      trend: 'up',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      title: 'Client Satisfaction',
      value: analyticsData?.kpis?.avgSatisfaction || '0.0',
      change: analyticsData?.kpis?.satisfactionChange || '+0%',
      trend: 'up',
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      title: 'Avg. Time to Hire',
      value: analyticsData?.kpis?.avgTimeToHire || '0 days',
      change: analyticsData?.kpis?.timeToHireChange || '0%',
      trend: 'down',
      icon: Clock,
      color: 'text-purple-600'
    }
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Error State
  if (error && !loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500">Track performance metrics and business insights</p>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-900">Failed to Load Analytics</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button onClick={fetchAnalytics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty State (no data available)
  const hasNoData = !loading && analyticsData && (
    !analyticsData.revenueData?.length &&
    !analyticsData.placementDistribution?.length &&
    !analyticsData.monthlyData?.length
  );

  if (hasNoData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500">Track performance metrics and business insights</p>
          </div>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-gray-100 rounded-full">
                <BarChart3 className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">No Analytics Data Available</h3>
                <p className="text-sm text-gray-500 mt-2">
                  There is no analytics data for the selected time range.
                  <br />
                  Try selecting a different time period or start adding placements and revenue data.
                </p>
              </div>
              <Button variant="outline" onClick={() => setTimeRange('365d')}>
                View Last Year
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex items-center space-x-2">
            <p className="text-gray-500">Track performance metrics and business insights</p>
            {lastUpdated && (
              <span className="text-xs text-gray-400">
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportReport} disabled={loading || !analyticsData}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-50 ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {kpi.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ml-1 ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last period</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="placements">Placements</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData?.revenueData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Placement Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.placementDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(analyticsData?.placementDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
                Monthly Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData?.monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="placements" fill="#3b82f6" name="Placements" />
                  <Bar dataKey="applications" fill="#10b981" name="Applications" />
                  <Bar dataKey="interviews" fill="#f59e0b" name="Interviews" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Placement Success Rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData?.placementMetrics?.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{metric.category}</span>
                      <span className="text-sm text-gray-500">{metric.rate}%</span>
                    </div>
                    <Progress value={metric.rate} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Destinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.topDestinations?.map((destination, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{destination.country}</p>
                          <p className="text-sm text-gray-500">{destination.placements} placements</p>
                        </div>
                      </div>
                      <Badge variant="outline">{destination.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.revenueBreakdown || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(analyticsData?.revenueBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {analyticsData?.revenueBreakdown?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Revenue vs Target</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.revenueVsTarget || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} name="Actual Revenue" />
                    <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Target Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.teamPerformance?.map((member, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        <Badge variant={member.performance >= 90 ? 'default' : member.performance >= 70 ? 'secondary' : 'destructive'}>
                          {member.performance}%
                        </Badge>
                      </div>
                      <Progress value={member.performance} className="h-2" />
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-500">Placements</p>
                          <p className="font-medium">{member.placements}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Revenue</p>
                          <p className="font-medium">${member.revenue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Rating</p>
                          <p className="font-medium">{member.rating}/5</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Satisfaction Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData?.satisfactionScores || []} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} />
                    <YAxis type="category" dataKey="category" width={80} />
                    <Tooltip formatter={(value) => [`${value}/5`, 'Rating']} />
                    <Bar dataKey="score" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Trends Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData?.trendsData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} name="Applications" />
                  <Line type="monotone" dataKey="placements" stroke="#10b981" strokeWidth={2} name="Placements" />
                  <Line type="monotone" dataKey="avgTimeToHire" stroke="#f59e0b" strokeWidth={2} name="Avg Time to Hire (days)" />
                  <Line type="monotone" dataKey="satisfaction" stroke="#ef4444" strokeWidth={2} name="Satisfaction Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Quarterly Growth</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-green-600">+24%</div>
                <p className="text-sm text-gray-500 mt-1">Revenue growth this quarter</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Placements</span>
                    <span className="text-green-600">+18%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Clients</span>
                    <span className="text-green-600">+32%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Satisfaction</span>
                    <span className="text-blue-600">4.6/5</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Market Share</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-blue-600">15.8%</div>
                <p className="text-sm text-gray-500 mt-1">Of domestic helper market</p>
                <Progress value={15.8} className="mt-4" />
                <p className="text-xs text-gray-500 mt-2">Rank #3 in Ethiopia</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Efficiency Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-purple-600">87%</div>
                <p className="text-sm text-gray-500 mt-1">Overall operational efficiency</p>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Time to Match</span>
                    <span className="text-green-600">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Document Processing</span>
                    <span className="text-green-600">89%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Client Onboarding</span>
                    <span className="text-yellow-600">79%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgencyAnalyticsPage;
