import React, { useState, useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MoreHorizontal,
  Eye,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Banknote,
  RefreshCw,
  Download,
  Upload,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  AlertCircle,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminTransactions } from '@/hooks/admin/useAdminTransactions';
import { format } from 'date-fns';

const AdminFinancialTransactionsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const {
    transactions,
    stats,
    loading,
    statsLoading,
    error,
    totalCount,
    transactionSummary,
    currentPage,
    totalPages,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    goToPage,
    refresh,
  } = useAdminTransactions();

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
    logAdminActivity('view_transaction_detail', 'transaction', transaction.id);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      succeeded: { label: 'Completed', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Processing', icon: Clock, color: 'bg-blue-100 text-blue-800' },
      failed: { label: 'Failed', icon: XCircle, color: 'bg-red-100 text-red-800' },
      disputed: { label: 'Disputed', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
      refunded: { label: 'Refunded', icon: RefreshCw, color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status] || { label: status || 'Unknown', icon: Clock, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type) => {
    const typeConfig = {
      payment: { label: 'Payment', icon: DollarSign, color: 'bg-blue-100 text-blue-800' },
      subscription: { label: 'Subscription', icon: CreditCard, color: 'bg-purple-100 text-purple-800' },
      commission: { label: 'Commission', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
      refund: { label: 'Refund', icon: RefreshCw, color: 'bg-orange-100 text-orange-800' },
      withdrawal: { label: 'Withdrawal', icon: Banknote, color: 'bg-gray-100 text-gray-800' },
      dispute: { label: 'Dispute', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
      contact_fee: { label: 'Contact Fee', icon: DollarSign, color: 'bg-blue-100 text-blue-800' },
      placement_fee: { label: 'Placement Fee', icon: TrendingUp, color: 'bg-green-100 text-green-800' },
      credit_purchase: { label: 'Credit Purchase', icon: CreditCard, color: 'bg-purple-100 text-purple-800' },
    };

    const config = typeConfig[type] || { label: type || 'Payment', icon: DollarSign, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodIcon = (method) => {
    const methodIcons = {
      credit_card: CreditCard,
      card: CreditCard,
      bank_transfer: Building,
      platform_wallet: DollarSign,
      paypal: CreditCard,
      stripe: CreditCard,
    };

    const Icon = methodIcons[method] || CreditCard;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (amount == null) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const TransactionDetailDialog = ({ transaction, open, onOpenChange }) => {
    if (!transaction) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Receipt className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{transaction.transaction_id}</p>
                <p className="text-sm text-muted-foreground">{transaction.description || 'No description'}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Transaction Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  {getTransactionTypeBadge(transaction.type || transaction.payment_type)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(transaction.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount:</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Platform Fee:</span>
                  <span className="text-sm">
                    {formatCurrency(transaction.platform_fee || 0, transaction.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Amount:</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(transaction.net_amount || transaction.amount, transaction.currency)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Payment Method:</span>
                  <div className="flex items-center gap-1">
                    {getPaymentMethodIcon(transaction.payment_method)}
                    <span className="text-sm capitalize">{(transaction.payment_method || 'card').replace(/_/g, ' ')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Parties Involved */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parties Involved</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">From:</span>
                  </div>
                  <div className="pl-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {(transaction.from_user?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{transaction.from_user?.name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {transaction.from_user?.type || 'user'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">To:</span>
                  </div>
                  <div className="pl-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {(transaction.to_user?.name || 'P').split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{transaction.to_user?.name || 'Platform'}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {transaction.to_user?.type || 'platform'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Processing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">{formatDate(transaction.created_at)}</span>
                </div>
                {transaction.processed_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Processed:</span>
                    <span className="text-sm">{formatDate(transaction.processed_at)}</span>
                  </div>
                )}
                {transaction.completed_at && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Completed:</span>
                    <span className="text-sm">{formatDate(transaction.completed_at)}</span>
                  </div>
                )}
                {transaction.reference_number && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Reference:</span>
                    <span className="text-sm font-mono">{transaction.reference_number}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Gateway Response:</span>
                  <Badge variant={transaction.gateway_response === 'SUCCESS' ? 'default' : 'destructive'}>
                    {transaction.gateway_response || 'N/A'}
                  </Badge>
                </div>
                {transaction.stripe_payment_intent_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Stripe ID:</span>
                    <span className="text-sm font-mono text-xs">{transaction.stripe_payment_intent_id}</span>
                  </div>
                )}
                {transaction.error_code && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-600">Error Code:</span>
                    <span className="text-sm text-red-600">{transaction.error_code}</span>
                  </div>
                )}
                {transaction.failure_reason && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-red-600">Failure Reason:</span>
                    <span className="text-sm text-red-600">{transaction.failure_reason}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                  {transaction.notes || transaction.description || 'No additional notes available.'}
                </p>
                {transaction.receipt_url && (
                  <div className="mt-3">
                    <a
                      href={transaction.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading skeleton
  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Transactions</h3>
            <p className="text-muted-foreground mb-4">{error.message || 'An unexpected error occurred.'}</p>
            <Button onClick={refresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Transactions</h1>
          <p className="text-muted-foreground">
            Monitor and manage platform financial transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
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
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(transactionSummary.total)}
            </div>
            <p className="text-xs text-muted-foreground">All transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(transactionSummary.completed)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactionSummary.completedCount || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(transactionSummary.pending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {transactionSummary.pendingCount || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-24" /> : formatCurrency(transactionSummary.fees)}
            </div>
            <p className="text-xs text-muted-foreground">Total fees earned</p>
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
                  placeholder="Search by transaction ID, description, or reference..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Transaction Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="succeeded">Succeeded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
                <SelectItem value="contact_fee">Contact Fee</SelectItem>
                <SelectItem value="placement_fee">Placement Fee</SelectItem>
                <SelectItem value="credit_purchase">Credit Purchase</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({totalCount})</CardTitle>
          <CardDescription>
            Complete financial transaction history with detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'No transactions match your current filters. Try adjusting your search criteria.'
                  : 'There are no transactions in the system yet.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.transaction_id}</div>
                          <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {transaction.description || 'No description'}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getTransactionTypeBadge(transaction.type || transaction.payment_type)}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {(transaction.from_user?.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-[120px]">
                              {transaction.from_user?.name || 'Unknown'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground capitalize ml-7">
                            {transaction.from_user?.type || 'user'}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </div>
                          {transaction.platform_fee > 0 && (
                            <div className="text-muted-foreground text-xs">
                              Fee: {formatCurrency(transaction.platform_fee, transaction.currency)}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(transaction.status)}
                          {transaction.dispute_status && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.dispute_status.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{transaction.created_at ? format(new Date(transaction.created_at), 'MMM d, yyyy') : 'N/A'}</div>
                          <div className="text-muted-foreground text-xs">
                            {transaction.created_at ? format(new Date(transaction.created_at), 'h:mm a') : ''}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Receipt className="mr-2 h-4 w-4" />
                              Generate Receipt
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export Details
                            </DropdownMenuItem>
                            {transaction.status === 'disputed' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                                  Review Dispute
                                </DropdownMenuItem>
                              </>
                            )}
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
                    Page {currentPage} of {totalPages} ({totalCount} total transactions)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => goToPage(currentPage + 1)}
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

      {/* Transaction Detail Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminFinancialTransactionsPage;
