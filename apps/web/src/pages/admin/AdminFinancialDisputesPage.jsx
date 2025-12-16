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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Search,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Scale,
  DollarSign,
  Calendar,
  Download,
  CreditCard,
  Shield,
  AlertCircle,
  Mail,
  RefreshCw,
  Loader2,
  Database
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';
import { adminDisputesService } from '@/services/adminDisputesService';

const log = createLogger('AdminFinancialDisputesPage');

const AdminFinancialDisputesPage = () => {
  const { adminUser, logAdminActivity } = useAdminAuth();
  const [disputesData, setDisputesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    critical: 0,
    totalAmount: 0,
    pendingAmount: 0,
    resolvedAmount: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Dialog state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadDisputes = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      log.info('Loading disputes data');

      // Fetch disputes and summary in parallel
      const [disputesResult, summaryResult] = await Promise.all([
        adminDisputesService.getLocalDisputes({ limit: 100, offset: 0 }),
        adminDisputesService.getDisputeSummary(),
      ]);

      setDisputesData(disputesResult.disputes);
      setSummary(summaryResult);

      logAdminActivity('financial_disputes_page_view', 'admin_financial', 'disputes');

      if (isRefresh) {
        toast({
          title: 'Data Refreshed',
          description: 'Disputes data has been updated.',
        });
      }
    } catch (err) {
      log.error('Error loading disputes:', err);
      setError(err.message || 'Failed to load disputes data');
      toast({
        title: 'Error',
        description: 'Failed to load disputes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logAdminActivity]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  // Filter and search logic
  const filteredDisputes = useMemo(() => {
    return disputesData.filter(dispute => {
      const matchesSearch =
        dispute.dispute_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.disputer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.disputer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
      const matchesType = typeFilter === 'all' || dispute.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || dispute.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesType && matchesPriority;
    });
  }, [disputesData, searchTerm, statusFilter, typeFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDisputeAction = async (disputeId, action, notes = '') => {
    try {
      let newStatus = null;
      switch (action) {
        case 'review':
          newStatus = 'under_review';
          break;
        case 'escalate':
          newStatus = 'escalated';
          break;
        case 'resolve':
          newStatus = 'resolved';
          break;
        case 'reject':
          newStatus = 'rejected';
          break;
        default:
          return;
      }

      await adminDisputesService.updateDisputeStatus(disputeId, newStatus, notes);

      // Update local state
      setDisputesData(prev =>
        prev.map(dispute =>
          dispute.id === disputeId
            ? {
                ...dispute,
                status: newStatus,
                admin_notes: notes || dispute.admin_notes,
                timeline: [
                  ...dispute.timeline,
                  {
                    timestamp: new Date().toISOString(),
                    event: action,
                    actor: `Admin: ${adminUser?.full_name || 'Unknown'}`,
                    description: notes || `Dispute ${action}d by admin`
                  }
                ]
              }
            : dispute
        )
      );

      await logAdminActivity(`dispute_${action}`, 'dispute', disputeId);

      toast({
        title: 'Dispute Updated',
        description: `Dispute has been ${action}d successfully.`,
      });
    } catch (err) {
      log.error('Error updating dispute:', err);
      toast({
        title: 'Error',
        description: 'Failed to update dispute status.',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    try {
      adminDisputesService.exportToCSV(filteredDisputes);
      toast({
        title: 'Export Complete',
        description: 'Disputes data has been exported to CSV.',
      });
    } catch (err) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export disputes data.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      under_review: { label: 'Under Review', icon: Eye, color: 'bg-blue-100 text-blue-800' },
      escalated: { label: 'Escalated', icon: AlertTriangle, color: 'bg-red-100 text-red-800' },
      resolved: { label: 'Resolved', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'bg-gray-100 text-gray-800' }
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

  const getTypeBadge = (type) => {
    const typeConfig = {
      chargeback: { label: 'Chargeback', icon: CreditCard, color: 'bg-red-100 text-red-800' },
      refund_request: { label: 'Refund Request', icon: DollarSign, color: 'bg-blue-100 text-blue-800' },
      fraud_claim: { label: 'Fraud Claim', icon: Shield, color: 'bg-purple-100 text-purple-800' },
      billing_error: { label: 'Billing Error', icon: AlertCircle, color: 'bg-orange-100 text-orange-800' },
      quality_dispute: { label: 'Quality Dispute', icon: Scale, color: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[type] || { label: type?.replace('_', ' ') || 'Unknown', icon: AlertTriangle, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'High', color: 'bg-orange-100 text-orange-800' },
      critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Detail Dialog Component
  const DisputeDetailDialog = ({ dispute, open, onOpenChange }) => {
    if (!dispute) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Scale className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{dispute.dispute_id}</p>
                <p className="text-sm text-muted-foreground font-normal">{dispute.reason}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Dispute Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(dispute.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  {getTypeBadge(dispute.type)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Priority:</span>
                  {getPriorityBadge(dispute.priority)}
                </div>
                {dispute.amount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Amount:</span>
                    <span className="text-sm font-semibold">
                      {dispute.currency} ${dispute.amount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Created: {new Date(dispute.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Due: {new Date(dispute.due_date).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Disputer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Disputer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {dispute.disputer?.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{dispute.disputer?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{dispute.disputer?.type || 'User'}</p>
                  </div>
                </div>
                {dispute.disputer?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{dispute.disputer.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                {dispute.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>

          {/* Timeline */}
          {dispute.timeline && dispute.timeline.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dispute.timeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{event.description}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">by {event.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading disputes data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Status Alert */}
      <Alert className="border-green-200 bg-green-50/50">
        <Database className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          <strong>Live Data:</strong> Disputes are loaded from the database.
          {disputesData.length === 0 && ' No disputes found in the system.'}
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disputes Management</h1>
          <p className="text-muted-foreground">
            Handle payment disputes, chargebacks, and refund requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDisputes(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">All dispute cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.resolved}</div>
            <p className="text-xs text-muted-foreground">Successfully closed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.critical}</div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
                  placeholder="Search by ID, name, email, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="chargeback">Chargeback</SelectItem>
                <SelectItem value="refund_request">Refund Request</SelectItem>
                <SelectItem value="fraud_claim">Fraud Claim</SelectItem>
                <SelectItem value="billing_error">Billing Error</SelectItem>
                <SelectItem value="quality_dispute">Quality Dispute</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disputes ({filteredDisputes.length})</CardTitle>
          <CardDescription>
            Dispute management with evidence tracking and resolution workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Disputes Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {disputesData.length === 0
                  ? 'There are no disputes in the system yet.'
                  : 'No disputes match your current filters.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute Details</TableHead>
                    <TableHead>Disputer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{dispute.dispute_id}</div>
                          <div className="text-muted-foreground truncate max-w-[200px]">
                            {dispute.reason}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {dispute.disputer?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{dispute.disputer?.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">
                              {dispute.disputer?.type || 'User'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getTypeBadge(dispute.type)}
                      </TableCell>

                      <TableCell>
                        {getPriorityBadge(dispute.priority)}
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(dispute.status)}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(dispute.due_date).toLocaleDateString()}</div>
                          <div className="text-muted-foreground text-xs">
                            {Math.max(0, Math.ceil((new Date(dispute.due_date) - new Date()) / (1000 * 60 * 60 * 24)))} days left
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {dispute.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleDisputeAction(dispute.id, 'review')}
                              >
                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                Start Review
                              </DropdownMenuItem>
                            )}
                            {['pending', 'under_review'].includes(dispute.status) && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleDisputeAction(dispute.id, 'escalate')}
                                >
                                  <AlertTriangle className="mr-2 h-4 w-4 text-orange-500" />
                                  Escalate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDisputeAction(dispute.id, 'resolve')}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                  Resolve
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDisputeAction(dispute.id, 'reject')}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                  Reject
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
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredDisputes.length)} of {filteredDisputes.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
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

      {/* Dispute Detail Dialog */}
      <DisputeDetailDialog
        dispute={selectedDispute}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};

export default AdminFinancialDisputesPage;
