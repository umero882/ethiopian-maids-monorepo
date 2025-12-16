import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  MoreHorizontal,
  Eye,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  DollarSign,
  Calendar,
  Pause,
  Play,
  Download,
  Upload,
  ArrowUpRight,
  CreditCard,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';
import { adminPayoutsService } from '@/services/adminPayoutsService';

const AdminFinancialPayoutsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const [payoutsData, setPayoutsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load payouts data
  const loadPayoutsData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await adminPayoutsService.getPayouts({
        page: currentPage,
        limit: itemsPerPage,
        status: statusFilter,
        method: methodFilter,
        searchTerm
      });

      if (error) {
        console.error('Error loading payouts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payouts data.',
          variant: 'destructive',
        });
        return;
      }

      setPayoutsData(data.payouts);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);

      logAdminActivity('financial_payouts_page_view', 'admin_financial', 'payouts');
    } catch (error) {
      console.error('Error loading payouts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payouts data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, methodFilter, searchTerm, logAdminActivity]);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const { data, error } = await adminPayoutsService.getStats();
      if (!error && data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadPayoutsData();
    loadStats();
  }, [loadPayoutsData, loadStats]);

  // Calculate summary from stats
  const payoutSummary = useMemo(() => {
    if (!stats) {
      return { totalAmount: 0, completedAmount: 0, pendingAmount: 0, totalFees: 0 };
    }

    return {
      totalAmount: stats.total.amount,
      completedAmount: stats.completed.amount,
      pendingAmount: stats.pending.amount,
      totalFees: stats.total.fees
    };
  }, [stats]);

  const handlePayoutAction = async (payoutId, action) => {
    setActionLoading(true);
    try {
      let result;

      if (action === 'retry') {
        result = await adminPayoutsService.retryPayout(payoutId);
      } else {
        result = await adminPayoutsService.updatePayoutStatus(payoutId, action);
      }

      if (result.error) {
        throw result.error;
      }

      await logAdminActivity(`payout_${action}`, 'payout', payoutId);

      toast({
        title: 'Payout Updated',
        description: `Payout has been ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'hold' ? 'placed on hold' : action === 'release' ? 'released' : 'retried'} successfully.`,
      });

      // Reload data
      await loadPayoutsData();
      await loadStats();
    } catch (error) {
      console.error('Error updating payout:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payout status.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPayoutsData();
    loadStats();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Processing', icon: ArrowUpRight, color: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Failed', icon: XCircle, color: 'bg-red-100 text-red-800' },
      on_hold: { label: 'On Hold', icon: Pause, color: 'bg-orange-100 text-orange-800' },
      cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPayoutMethodBadge = (method) => {
    const methodConfig = {
      bank_transfer: { label: 'Bank Transfer', icon: Building, color: 'bg-blue-100 text-blue-800' },
      wire_transfer: { label: 'Wire Transfer', icon: Building, color: 'bg-purple-100 text-purple-800' },
      digital_wallet: { label: 'Digital Wallet', icon: CreditCard, color: 'bg-green-100 text-green-800' },
      check: { label: 'Check', icon: Banknote, color: 'bg-gray-100 text-gray-800' },
      stripe: { label: 'Stripe', icon: CreditCard, color: 'bg-indigo-100 text-indigo-800' }
    };

    const config = methodConfig[method] || { label: method, icon: Banknote, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getUserTypeBadge = (type) => {
    const typeConfig = {
      maid: { label: 'Maid', color: 'bg-blue-100 text-blue-800' },
      agency: { label: 'Agency', color: 'bg-purple-100 text-purple-800' },
      sponsor: { label: 'Sponsor', color: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || { label: type || 'Unknown', color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return `${currency} $${(parseFloat(amount) || 0).toFixed(2)}`;
  };

  const PayoutDetailDialog = ({ payout, open, onOpenChange }) => {
    if (!payout) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Banknote className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{payout.payout_number || payout.payout_id}</p>
                <p className="text-sm text-muted-foreground">{payout.description}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Payout Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payout Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(payout.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Method:</span>
                  {getPayoutMethodBadge(payout.payout_method)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(payout.amount, payout.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Processing Fee:</span>
                  <span className="text-sm">
                    {formatCurrency(payout.processing_fee, payout.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Amount:</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(payout.net_amount, payout.currency)}
                  </span>
                </div>
                {payout.provider_reference && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Reference:</span>
                    <span className="text-sm font-mono">{payout.provider_reference}</span>
                  </div>
                )}
                {payout.retry_count > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Retry Count:</span>
                    <Badge variant="outline">{payout.retry_count}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recipient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recipient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {payout.recipient?.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{payout.recipient?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-foreground">{payout.recipient?.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Type:</span>
                  {getUserTypeBadge(payout.recipient?.type || payout.user_type)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">User ID:</span>
                  <span className="text-sm font-mono text-muted-foreground truncate max-w-[200px]">
                    {payout.user_id}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payout.bank_details ? (
                  <>
                    {payout.bank_details.account_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Account Name:</span>
                        <span className="text-sm">{payout.bank_details.account_name}</span>
                      </div>
                    )}
                    {(payout.bank_details.bank_name || payout.bank_details.wallet_provider) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Bank/Provider:</span>
                        <span className="text-sm">
                          {payout.bank_details.bank_name || payout.bank_details.wallet_provider}
                        </span>
                      </div>
                    )}
                    {(payout.bank_details.account_number || payout.bank_details.wallet_number) && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Account Number:</span>
                        <span className="text-sm font-mono">
                          {payout.bank_details.account_number || payout.bank_details.wallet_number}
                        </span>
                      </div>
                    )}
                    {payout.bank_details.routing_number && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Routing Number:</span>
                        <span className="text-sm font-mono">{payout.bank_details.routing_number}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No payment details available</p>
                )}
              </CardContent>
            </Card>

            {/* Processing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Requested:</span>
                  <span className="text-sm">
                    {payout.requested_at ? new Date(payout.requested_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
                {payout.processing_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Processing:</span>
                    <span className="text-sm">{new Date(payout.processing_at).toLocaleString()}</span>
                  </div>
                )}
                {payout.completed_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Completed:</span>
                    <span className="text-sm">{new Date(payout.completed_at).toLocaleString()}</span>
                  </div>
                )}
                {payout.failure_message && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Failure Reason:</span>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {payout.failure_message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {payout.notes && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {payout.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  if (loading && payoutsData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payouts Management</h1>
          <p className="text-muted-foreground">
            Process and manage user payouts and withdrawals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Bulk Process
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutSummary.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total?.count || 0} payout requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutSummary.completedAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completed?.count || 0} payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutSummary.pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pending?.count || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Fees</CardTitle>
            <Banknote className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${payoutSummary.totalFees.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total fees collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by payout ID, description, or user ID..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payout Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={(value) => {
              setMethodFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payout Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                <SelectItem value="digital_wallet">Digital Wallet</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts ({totalCount})</CardTitle>
          <CardDescription>
            Complete payout management with processing status and recipient information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payoutsData.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No payouts found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No payout requests have been made yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Payout ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutsData.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {payout.recipient?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{payout.recipient?.name || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground">
                              {getUserTypeBadge(payout.recipient?.type || payout.user_type)}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{payout.payout_number || payout.payout_id}</div>
                          <div className="text-muted-foreground truncate max-w-[150px]">
                            {payout.description}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold">
                            {formatCurrency(payout.amount, payout.currency)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Fee: ${(parseFloat(payout.processing_fee) || 0).toFixed(2)}
                          </div>
                          <div className="font-medium text-xs">
                            Net: ${(parseFloat(payout.net_amount) || 0).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getPayoutMethodBadge(payout.payout_method)}
                          <div className="text-xs text-muted-foreground">
                            {payout.bank_details?.bank_name || payout.bank_details?.wallet_provider || ''}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(payout.status)}
                          {payout.retry_count > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {payout.retry_count} retries
                            </Badge>
                          )}
                          {payout.failure_message && (
                            <div className="text-xs text-red-600 truncate max-w-[100px]">
                              {payout.failure_message}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>
                            {payout.requested_at
                              ? new Date(payout.requested_at).toLocaleDateString()
                              : 'N/A'}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {payout.requested_at
                              ? new Date(payout.requested_at).toLocaleTimeString()
                              : ''}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={actionLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPayout(payout);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {payout.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handlePayoutAction(payout.id, 'approve')}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePayoutAction(payout.id, 'hold')}
                                >
                                  <Pause className="mr-2 h-4 w-4 text-orange-500" />
                                  Hold
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handlePayoutAction(payout.id, 'reject')}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {payout.status === 'failed' && (
                              <DropdownMenuItem
                                onClick={() => handlePayoutAction(payout.id, 'retry')}
                              >
                                <ArrowUpRight className="mr-2 h-4 w-4 text-blue-500" />
                                Retry
                              </DropdownMenuItem>
                            )}
                            {payout.status === 'on_hold' && (
                              <DropdownMenuItem
                                onClick={() => handlePayoutAction(payout.id, 'release')}
                              >
                                <Play className="mr-2 h-4 w-4 text-green-500" />
                                Release Hold
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => setCurrentPage(prev => prev + 1)}
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

      {/* Payout Detail Dialog */}
      <PayoutDetailDialog
        payout={selectedPayout}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminFinancialPayoutsPage;
