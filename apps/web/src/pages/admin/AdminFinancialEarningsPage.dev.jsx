import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  Wallet,
  Clock,
  DollarSign,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAdminEarnings } from '@/hooks/admin/useAdminEarnings';

const AdminFinancialEarningsPage = () => {
  const {
    summary,
    topAgencies,
    recentTransactions,
    monthlyTrend,
    loading,
    summaryLoading,
    agenciesLoading,
    transactionsLoading,
    trendLoading,
    error,
    transactionPage,
    totalTransactionPages,
    goToTransactionPage,
    refresh,
  } = useAdminEarnings();

  const [activeTab, setActiveTab] = useState('overview');

  // Format currency
  const formatCurrency = (amount, currency = 'AED') => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const config = {
      released: { label: 'Released', variant: 'default', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      escrow: { label: 'In Escrow', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      credited: { label: 'Credited', variant: 'outline', className: 'bg-blue-100 text-blue-800', icon: Wallet },
      refunded: { label: 'Refunded', variant: 'outline', className: 'bg-gray-100 text-gray-800', icon: ArrowDownRight }
    };

    const { label, className, icon: Icon } = config[status] || config.released;

    return (
      <Badge className={`flex items-center gap-1 ${className}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Loading skeleton
  if (loading && !summary) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Platform Earnings</h1>
          <p className="text-gray-500 mt-1">
            Revenue from agency placement fees (500 AED per successful placement)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message || 'Failed to load earnings data'}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Platform Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary?.total_revenue)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summary?.total_transactions || 0} successful placements
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">
                This Month
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summary?.monthly_revenue)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {(summary?.growth_rate || 0) >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-xs ${(summary?.growth_rate || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(summary?.growth_rate)} from last month
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Fees in Escrow */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">
                Fees in Escrow
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(summary?.escrow_balance)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {summary?.escrow_count || 0} pending visa approvals
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Average Fee */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-500">
                Average Fee
              </CardTitle>
              <Wallet className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <Skeleton className="h-8 w-40" />
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(summary?.average_fee || 500)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Per successful placement
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-agency">By Agency</TabsTrigger>
          <TabsTrigger value="transactions">Revenue Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>Last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {trendLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : monthlyTrend.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No monthly data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {monthlyTrend.map((month, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{month.month_name}</div>
                          <div className="text-sm text-gray-500">
                            {month.transaction_count} transactions • {month.agency_count} agencies
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            {formatCurrency(month.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Revenue</CardTitle>
                <CardDescription>Latest successful placements</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{transaction.maid_name}</div>
                          <div className="text-sm text-gray-500">
                            {transaction.agency_name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDate(transaction.released_at || transaction.created_at)}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(transaction.fee_status)}
                          <div className="text-sm font-medium mt-1">
                            {formatCurrency(transaction.fee_amount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* By Agency Tab */}
        <TabsContent value="by-agency">
          <Card>
            <CardHeader>
              <CardTitle>Top Revenue-Generating Agencies</CardTitle>
              <CardDescription>Agencies ranked by total revenue contribution</CardDescription>
            </CardHeader>
            <CardContent>
              {agenciesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : topAgencies.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No agency earnings data yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Agency Name</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Placements</TableHead>
                      <TableHead>In Escrow</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topAgencies.map((agency, index) => (
                      <TableRow key={agency.agency_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {index === 0 && <span className="text-yellow-500">🥇</span>}
                            {index === 1 && <span className="text-gray-400">🥈</span>}
                            {index === 2 && <span className="text-orange-600">🥉</span>}
                            <span className="font-medium">#{index + 1}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{agency.agency_name}</span>
                            {agency.is_verified && (
                              <Badge variant="outline" className="text-xs">Verified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatCurrency(agency.total_revenue)}
                        </TableCell>
                        <TableCell>{agency.success_count || 0}</TableCell>
                        <TableCell className="text-yellow-600">{agency.escrow_count || 0}</TableCell>
                        <TableCell>
                          <Badge className={agency.success_rate >= 90 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {(agency.success_rate || 0).toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(agency.average_fee || 500)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Revenue Transactions</CardTitle>
              <CardDescription>Complete history of placement fees</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentTransactions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No transactions yet</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Agency</TableHead>
                        <TableHead>Maid</TableHead>
                        <TableHead>Sponsor</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.released_at || transaction.created_at)}</TableCell>
                          <TableCell>
                            <div className="font-medium">{transaction.agency_name}</div>
                          </TableCell>
                          <TableCell>{transaction.maid_name}</TableCell>
                          <TableCell>{transaction.sponsor_name}</TableCell>
                          <TableCell className="font-bold">
                            {formatCurrency(transaction.fee_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(transaction.fee_status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {totalTransactionPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-500">
                        Page {transactionPage} of {totalTransactionPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={transactionPage === 1 || transactionsLoading}
                          onClick={() => goToTransactionPage(transactionPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={transactionPage === totalTransactionPages || transactionsLoading}
                          onClick={() => goToTransactionPage(transactionPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Insights and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Total Agencies</div>
                    <div className="text-2xl font-bold text-blue-900 mt-1">
                      {agenciesLoading ? <Skeleton className="h-8 w-16" /> : topAgencies.length}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Contributing to revenue</div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Average Success Rate</div>
                    <div className="text-2xl font-bold text-green-900 mt-1">
                      {agenciesLoading ? (
                        <Skeleton className="h-8 w-16" />
                      ) : (
                        `${topAgencies.length > 0
                          ? (topAgencies.reduce((sum, a) => sum + (a.success_rate || 0), 0) / topAgencies.length).toFixed(1)
                          : 0}%`
                      )}
                    </div>
                    <div className="text-xs text-green-600 mt-1">Visa approval rate</div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Avg Revenue/Agency</div>
                    <div className="text-2xl font-bold text-purple-900 mt-1">
                      {summaryLoading || agenciesLoading ? (
                        <Skeleton className="h-8 w-24" />
                      ) : (
                        formatCurrency(topAgencies.length > 0 ? (summary?.total_revenue || 0) / topAgencies.length : 0)
                      )}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">Per contributing agency</div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-600 font-medium">Pending Revenue (Escrow)</div>
                    <div className="text-2xl font-bold text-yellow-900 mt-1">
                      {summaryLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary?.escrow_balance)}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">
                      {summary?.escrow_count || 0} placements awaiting visa approval
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium">Credited Back</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {summaryLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(summary?.credited_amount || 0)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">From returned maids (agency credits)</div>
                  </div>
                </div>

                {/* Info Note */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Revenue is recognized when visas are approved and fees are released from escrow.
                    Fees from returned maids are credited back to agencies for future placements.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinancialEarningsPage;
