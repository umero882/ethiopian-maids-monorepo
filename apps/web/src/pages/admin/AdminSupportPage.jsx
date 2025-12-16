import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Send,
  Loader2,
  User,
  Calendar,
  Tag,
} from 'lucide-react';

// GraphQL Queries - Using proper variables to prevent injection
const GET_SUPPORT_TICKETS = gql`
  query GetSupportTickets(
    $limit: Int!
    $offset: Int!
    $status: String
    $priority: String
    $category: String
    $searchTerm: String
  ) {
    support_tickets(
      where: {
        _and: [
          { status: { _eq: $status } }
          { priority: { _eq: $priority } }
          { category: { _eq: $category } }
          { _or: [
            { subject: { _ilike: $searchTerm } }
            { description: { _ilike: $searchTerm } }
            { ticket_number: { _ilike: $searchTerm } }
          ]}
        ]
      }
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      ticket_number
      subject
      description
      status
      priority
      category
      created_at
      updated_at
      user_id
      user {
        id
        full_name
        email
        user_type
      }
    }
    support_tickets_aggregate(
      where: {
        _and: [
          { status: { _eq: $status } }
          { priority: { _eq: $priority } }
          { category: { _eq: $category } }
          { _or: [
            { subject: { _ilike: $searchTerm } }
            { description: { _ilike: $searchTerm } }
            { ticket_number: { _ilike: $searchTerm } }
          ]}
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

const GET_SUPPORT_TICKETS_NO_FILTER = gql`
  query GetSupportTicketsNoFilter($limit: Int!, $offset: Int!) {
    support_tickets(
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
    ) {
      id
      ticket_number
      subject
      description
      status
      priority
      category
      created_at
      updated_at
      user_id
      user {
        id
        full_name
        email
        user_type
      }
    }
    support_tickets_aggregate {
      aggregate {
        count
      }
    }
  }
`;

const UPDATE_TICKET_STATUS = gql`
  mutation UpdateTicketStatus($id: uuid!, $status: String!, $updated_at: timestamptz!) {
    update_support_tickets_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status, updated_at: $updated_at }
    ) {
      id
      status
    }
  }
`;

const INSERT_TICKET_REPLY = gql`
  mutation InsertTicketReply($ticket_id: uuid!, $message: String!, $is_admin_reply: Boolean!, $created_at: timestamptz!) {
    insert_support_ticket_messages_one(object: {
      ticket_id: $ticket_id
      message: $message
      is_admin_reply: $is_admin_reply
      created_at: $created_at
    }) {
      id
    }
  }
`;

const LOG_ADMIN_ACTIVITY = gql`
  mutation LogAdminActivity($action: String!, $target_type: String!, $target_id: String!, $details: jsonb!) {
    insert_admin_activity_logs_one(object: {
      action: $action
      target_type: $target_type
      target_id: $target_id
      details: $details
    }) {
      id
    }
  }
`;

const AdminSupportPage = () => {
  const { toast } = useToast();
  const { canAccess, logAdminActivity } = useAdminAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: 0,
  });

  // Check if any filters are active
  const hasFilters = useMemo(() => {
    return statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchTerm.trim() !== '';
  }, [statusFilter, priorityFilter, categoryFilter, searchTerm]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const offset = (currentPage - 1) * itemsPerPage;

      let data, errors;

      if (hasFilters) {
        // Use filtered query with proper GraphQL variables (prevents injection)
        const result = await apolloClient.query({
          query: GET_SUPPORT_TICKETS,
          variables: {
            limit: itemsPerPage,
            offset,
            status: statusFilter !== 'all' ? statusFilter : null,
            priority: priorityFilter !== 'all' ? priorityFilter : null,
            category: categoryFilter !== 'all' ? categoryFilter : null,
            searchTerm: searchTerm.trim() ? `%${searchTerm.trim()}%` : null,
          },
          fetchPolicy: 'network-only'
        });
        data = result.data;
        errors = result.errors;
      } else {
        // Use simpler query when no filters are active
        const result = await apolloClient.query({
          query: GET_SUPPORT_TICKETS_NO_FILTER,
          variables: { limit: itemsPerPage, offset },
          fetchPolicy: 'network-only'
        });
        data = result.data;
        errors = result.errors;
      }

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch tickets');

      const ticketsData = data?.support_tickets || [];
      const count = data?.support_tickets_aggregate?.aggregate?.count || 0;

      setTickets(ticketsData);
      setTotalCount(count);

      calculateStats(ticketsData);
    } catch (err) {
      logger.error('Failed to fetch support tickets:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, priorityFilter, categoryFilter, hasFilters, toast]);

  const calculateStats = (data) => {
    setStats({
      totalTickets: data.length,
      openTickets: data.filter(t => t.status === 'open').length,
      resolvedTickets: data.filter(t => t.status === 'resolved').length,
      avgResponseTime: 2.5, // Placeholder - calculate from actual data
    });
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setReplyMessage('');
    setShowDetailModal(true);
  };

  const handleStatusChange = async (ticket, newStatus) => {
    // Permission check before mutation
    if (!canAccess('support', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to update ticket status.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Update ticket status via GraphQL using predefined mutation
      const { errors: updateError } = await apolloClient.mutate({
        mutation: UPDATE_TICKET_STATUS,
        variables: {
          id: ticket.id,
          status: newStatus,
          updated_at: new Date().toISOString()
        }
      });

      if (updateError) throw new Error(updateError[0]?.message || 'Update failed');

      // Log admin activity via GraphQL using predefined mutation
      await apolloClient.mutate({
        mutation: LOG_ADMIN_ACTIVITY,
        variables: {
          action: 'ticket_status_changed',
          target_type: 'support_ticket',
          target_id: ticket.id,
          details: {
            ticket_number: ticket.ticket_number,
            old_status: ticket.status,
            new_status: newStatus,
          }
        }
      });

      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${newStatus}.`,
      });

      fetchTickets();
    } catch (err) {
      logger.error('Failed to update ticket status:', err);
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    // Permission check before mutation
    if (!canAccess('support', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to reply to tickets.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedTicket || !replyMessage.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a reply message.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Insert reply message via GraphQL using predefined mutation
      const { errors: replyError } = await apolloClient.mutate({
        mutation: INSERT_TICKET_REPLY,
        variables: {
          ticket_id: selectedTicket.id,
          message: replyMessage.trim(),
          is_admin_reply: true,
          created_at: new Date().toISOString()
        }
      });

      if (replyError) throw new Error(replyError[0]?.message || 'Failed to send reply');

      // Log the reply activity
      await logAdminActivity('ticket_reply_sent', 'support_ticket', selectedTicket.id, {
        ticket_number: selectedTicket.ticket_number,
        message_preview: replyMessage.substring(0, 100),
      });

      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await handleStatusChange(selectedTicket, 'in_progress');
      }

      toast({
        title: 'Reply Sent',
        description: 'Your reply has been sent to the user.',
      });

      setReplyMessage('');
      setShowDetailModal(false);
      fetchTickets();
    } catch (err) {
      logger.error('Failed to send reply:', err);
      toast({
        title: 'Error',
        description: 'Failed to send reply.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      open: { variant: 'secondary', icon: AlertCircle, color: 'text-yellow-500' },
      in_progress: { variant: 'default', icon: Clock, color: 'text-blue-500' },
      resolved: { variant: 'outline', icon: CheckCircle, color: 'text-green-500' },
      closed: { variant: 'outline', icon: XCircle, color: 'text-gray-500' },
    };

    const { variant, icon: Icon, color } = config[status] || config.open;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const config = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant="outline" className={config[priority] || config.low}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && tickets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Failed to Load Support Tickets</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={fetchTickets}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Management</h1>
        <p className="text-muted-foreground">Manage and respond to user support tickets</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No tickets found</h3>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium">Ticket #</th>
                      <th className="p-3 text-left text-sm font-medium">Subject</th>
                      <th className="p-3 text-left text-sm font-medium">User</th>
                      <th className="p-3 text-left text-sm font-medium">Priority</th>
                      <th className="p-3 text-left text-sm font-medium">Status</th>
                      <th className="p-3 text-left text-sm font-medium">Created</th>
                      <th className="p-3 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm font-mono">
                          {ticket.ticket_number}
                        </td>
                        <td className="p-3">
                          <p className="text-sm font-medium">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {ticket.description}
                          </p>
                        </td>
                        <td className="p-3 text-sm">
                          {ticket.user?.full_name || 'N/A'}
                        </td>
                        <td className="p-3">
                          {getPriorityBadge(ticket.priority)}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="p-3 text-sm">
                          {formatDate(ticket.created_at)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(ticket)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedTicket && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ticket #{selectedTicket.ticket_number}</DialogTitle>
              <DialogDescription>{selectedTicket.subject}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm">{selectedTicket.user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTicket.user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(selectedTicket.created_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                <p className="text-sm">{selectedTicket.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Reply to User</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                />
              </div>

              <div className="flex gap-2">
                <Select
                  value={selectedTicket.status}
                  onValueChange={(value) => handleStatusChange(selectedTicket, value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              <Button onClick={handleSendReply} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reply
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminSupportPage;
