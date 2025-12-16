import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Filter,
  Search,
  FileText,
  User,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  MessageCircle,
  Gavel,
  Star,
  Archive,
  RefreshCw,
  Headphones,
  BookOpen,
  TrendingUp,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Copy,
  Info
} from 'lucide-react';
import { supportService } from '@/services/supportService.graphql';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Custom tab button style with #7aa7d1 color
const tabButtonStyle = {
  active: 'bg-[#7aa7d1] text-white shadow-md',
  inactive: 'bg-white text-gray-600 hover:bg-[#7aa7d1]/10 hover:text-[#7aa7d1]'
};

const AgencySupportPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [supportData, setSupportData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('tickets');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: ''
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    category: '',
    priority: '',
    subject: '',
    message: ''
  });
  // Disputes state (must be at top with other hooks)
  const [disputes, setDisputes] = useState([]);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSupportData = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supportService.getSupportData(user.id, filters);

      if (fetchError) {
        throw fetchError;
      }

      setSupportData(data);
    } catch (error) {
      console.error('Error fetching support data:', error);
      setError(error.message || 'Failed to load support data');

      toast.error('Failed to Load Support Data', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupportData();
  }, [user?.id, filters.status, filters.priority, filters.category]);

  // Load disputes when disputes tab is active
  useEffect(() => {
    const fetchDisputes = async () => {
      if (selectedTab === 'disputes' && user?.id) {
        try {
          setLoadingDisputes(true);
          const { data: disputesData, error: disputeError } = await supportService.getDisputes(user.id, filters);

          if (disputeError) {
            console.error('Error fetching disputes:', disputeError);
            setDisputes([]);
            return;
          }

          setDisputes(disputesData || []);
        } catch (error) {
          console.error('Error fetching disputes:', error);
          setDisputes([]);
        } finally {
          setLoadingDisputes(false);
        }
      }
    };

    fetchDisputes();
  }, [selectedTab, user?.id, filters.status, filters.priority, filters.search]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSupportData();
    if (selectedTab === 'disputes') {
      const { data: disputesData } = await supportService.getDisputes(user.id, filters);
      setDisputes(disputesData || []);
    }
    setIsRefreshing(false);
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

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support & Disputes</h1>
            <p className="text-gray-500">Manage customer support tickets and dispute resolution</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Support Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStatusUpdate = async (ticketId, newStatus) => {
    if (!user?.id) {
      toast.error('Authentication Error', {
        description: 'Please log in to update tickets'
      });
      return;
    }

    try {
      const { error: updateError } = await supportService.updateTicketStatus(ticketId, newStatus);

      if (updateError) {
        throw updateError;
      }

      // Refresh data
      await fetchSupportData();

      toast.success('Status Updated', {
        description: `Ticket status changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Update Failed', {
        description: error.message || 'Failed to update ticket status'
      });
    }
  };

  const handleDisputeAction = async (disputeId, action) => {
    if (!user?.id) {
      toast.error('Authentication Error', {
        description: 'Please log in to manage disputes'
      });
      return;
    }

    try {
      // Map action to status
      const statusMap = {
        investigate: 'under_investigation',
        mediate: 'mediation_scheduled',
        resolve: 'resolved',
        close: 'closed',
      };

      const newStatus = statusMap[action] || action;

      const { error: updateError } = await supportService.updateDisputeStatus(disputeId, newStatus);

      if (updateError) {
        throw updateError;
      }

      // Refresh disputes
      const { data: disputesData } = await supportService.getDisputes(user.id, filters);
      setDisputes(disputesData || []);

      toast.success('Dispute Updated', {
        description: `Dispute status changed to ${newStatus.replace('_', ' ')}`
      });
    } catch (error) {
      console.error('Error updating dispute:', error);
      toast.error('Update Failed', {
        description: error.message || 'Failed to update dispute'
      });
    }
  };

  const handleCreateTicket = async () => {
    if (!user?.id) {
      toast.error('Authentication Error', {
        description: 'Please log in to create a ticket'
      });
      return;
    }

    // Validation
    if (!newTicket.subject || !newTicket.message) {
      toast.error('Validation Error', {
        description: 'Please fill in all required fields (Title and Description)'
      });
      return;
    }

    if (!newTicket.category) {
      toast.error('Validation Error', {
        description: 'Please select a category'
      });
      return;
    }

    if (!newTicket.priority) {
      toast.error('Validation Error', {
        description: 'Please select a priority level'
      });
      return;
    }

    try {
      setIsCreatingTicket(true);

      const ticketData = {
        subject: newTicket.subject,
        message: newTicket.message,
        category: newTicket.category,
        priority: newTicket.priority
      };

      const { error: createError } = await supportService.createTicket(
        user.id,
        user.full_name || user.email || 'Agency User',
        user.email || '',
        ticketData
      );

      if (createError) {
        throw createError;
      }

      // Refresh data
      await fetchSupportData();

      // Reset form and close dialog
      setNewTicket({
        category: '',
        priority: '',
        subject: '',
        message: ''
      });
      setIsCreateDialogOpen(false);

      toast.success('Ticket Created', {
        description: 'Your support ticket has been created successfully'
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Creation Failed', {
        description: error.message || 'Failed to create support ticket'
      });
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Helper function to format response time
  const formatResponseTime = (hours) => {
    if (!hours || hours === 0) return '0h';
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.round(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };

  const kpiCards = [
    {
      title: 'Open Tickets',
      value: supportData?.stats?.openTickets || 0,
      change: supportData?.stats?.inProgressTickets
        ? `${supportData.stats.inProgressTickets} in progress`
        : supportData?.stats?.totalTickets > 0
          ? 'All tickets closed'
          : 'No tickets yet',
      icon: MessageSquare,
      color: 'text-[#7aa7d1]',
      bgColor: 'bg-[#7aa7d1]/10',
      borderColor: 'border-l-[#7aa7d1]'
    },
    {
      title: 'Active Disputes',
      value: supportData?.disputeStats?.openDisputes || 0,
      change: supportData?.disputeStats?.totalDisputes > 0
        ? `${supportData.disputeStats.resolvedDisputes || 0} resolved`
        : supportData?.disputeStats?.openDisputes > 0
          ? 'Needs attention'
          : 'No disputes',
      icon: AlertTriangle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-l-orange-500'
    },
    {
      title: 'Avg Response Time',
      value: formatResponseTime(supportData?.stats?.averageResponseTime),
      change: supportData?.stats?.highPriorityTickets > 0
        ? `${supportData.stats.highPriorityTickets} high priority`
        : supportData?.stats?.criticalTickets > 0
          ? `${supportData.stats.criticalTickets} critical`
          : supportData?.stats?.totalTickets > 0
            ? 'All normal priority'
            : 'No tickets yet',
      icon: Clock,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-l-emerald-500'
    },
    {
      title: 'Resolution Rate',
      value: supportData?.stats?.resolutionRate ? `${supportData.stats.resolutionRate}%` : '0%',
      change: supportData?.stats?.satisfactionScore > 0
        ? `${supportData.stats.satisfactionScore}/5 satisfaction`
        : supportData?.stats?.resolvedTickets > 0
          ? `${supportData.stats.resolvedTickets} resolved`
          : 'No ratings yet',
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-l-purple-500'
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { variant: 'destructive', label: 'Open' },
      in_progress: { variant: 'secondary', label: 'In Progress' },
      pending_client: { variant: 'outline', label: 'Pending Client' },
      resolved: { variant: 'default', label: 'Resolved' },
      closed: { variant: 'secondary', label: 'Closed' }
    };
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { variant: 'outline', label: 'Low' },
      medium: { variant: 'secondary', label: 'Medium' },
      high: { variant: 'destructive', label: 'High' },
      critical: { variant: 'destructive', label: 'Critical' }
    };
    const config = priorityConfig[priority] || { variant: 'outline', label: priority };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredTickets = supportData?.tickets?.filter(ticket => {
    if (filters.status !== 'all' && ticket.status !== filters.status) return false;
    if (filters.priority !== 'all' && ticket.priority !== filters.priority) return false;
    if (filters.category !== 'all' && ticket.category !== filters.category) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const subjectMatch = ticket.subject?.toLowerCase().includes(searchLower);
      const messageMatch = ticket.message?.toLowerCase().includes(searchLower);
      if (!subjectMatch && !messageMatch) return false;
    }
    return true;
  }) || [];

  const filteredDisputes = disputes.filter(dispute => {
    if (filters.status !== 'all' && dispute.status !== filters.status) return false;
    if (filters.priority !== 'all' && dispute.priority !== filters.priority) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = dispute.title?.toLowerCase().includes(searchLower);
      const descMatch = dispute.description?.toLowerCase().includes(searchLower);
      if (!titleMatch && !descMatch) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#7aa7d1] via-[#8ab4d8] to-[#9ac1df] p-6 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Headphones className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Support & Disputes</h1>
              <p className="text-white/80 mt-1">Manage customer support tickets and dispute resolution</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-white text-[#7aa7d1] hover:bg-white/90 shadow-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#7aa7d1]/10 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-[#7aa7d1]" />
                    </div>
                    <div>
                      <DialogTitle>Create New Support Ticket</DialogTitle>
                      <DialogDescription>Fill in the details below to submit a support request</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Category *</Label>
                      <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technical">Technical Issue</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="placement">Placement</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="general">General Inquiry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority *</Label>
                      <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Subject *</Label>
                    <Input
                      placeholder="Brief description of the issue"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Textarea
                      placeholder="Detailed description of the issue"
                      rows={4}
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false);
                        setNewTicket({
                          category: '',
                          priority: '',
                          subject: '',
                          message: ''
                        });
                      }}
                      disabled={isCreatingTicket}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateTicket}
                      disabled={isCreatingTicket}
                      className="bg-[#7aa7d1] hover:bg-[#6a97c1] text-white"
                    >
                      {isCreatingTicket ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className={`group hover:shadow-lg transition-all duration-300 border-l-4 ${kpi.borderColor} overflow-hidden`}>
            <CardContent className="p-5 relative">
              <div className={`absolute top-0 right-0 w-20 h-20 ${kpi.bgColor} rounded-bl-full opacity-50 group-hover:scale-110 transition-transform`} />
              <div className="flex items-start justify-between relative">
                <div>
                  <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {kpi.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bgColor} ${kpi.color} group-hover:scale-110 transition-transform`}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        {/* Custom styled tabs with #7aa7d1 color */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="inline-flex items-center gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setSelectedTab('tickets')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                selectedTab === 'tickets'
                  ? 'bg-[#7aa7d1] text-white shadow-md'
                  : 'text-gray-600 hover:bg-[#7aa7d1]/10 hover:text-[#7aa7d1]'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Support Tickets
              {(supportData?.stats?.openTickets || 0) > 0 && (
                <Badge className={`ml-1 ${selectedTab === 'tickets' ? 'bg-white/20 text-white' : 'bg-[#7aa7d1]/10 text-[#7aa7d1]'}`}>
                  {supportData?.stats?.openTickets || 0}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setSelectedTab('disputes')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                selectedTab === 'disputes'
                  ? 'bg-[#7aa7d1] text-white shadow-md'
                  : 'text-gray-600 hover:bg-[#7aa7d1]/10 hover:text-[#7aa7d1]'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Disputes
              {(supportData?.disputeStats?.openDisputes || 0) > 0 && (
                <Badge className={`ml-1 ${selectedTab === 'disputes' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'}`}>
                  {supportData?.disputeStats?.openDisputes || 0}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setSelectedTab('knowledge')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                selectedTab === 'knowledge'
                  ? 'bg-[#7aa7d1] text-white shadow-md'
                  : 'text-gray-600 hover:bg-[#7aa7d1]/10 hover:text-[#7aa7d1]'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Knowledge Base
            </button>
          </div>
        </div>

        {/* Filters - Show only for tickets and disputes tabs */}
        {selectedTab !== 'knowledge' && (
          <Card className="border-0 shadow-sm bg-gray-50/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-[320px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={`Search ${selectedTab === 'tickets' ? 'tickets' : 'disputes'}...`}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10 bg-white border-gray-200 focus:border-[#7aa7d1] focus:ring-[#7aa7d1]/20"
                  />
                </div>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="w-36 bg-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_client">Pending Client</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger className="w-36 bg-white">
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
                {selectedTab === 'tickets' && (
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger className="w-40 bg-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="placement">Placement</SelectItem>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button variant="outline" size="sm" className="border-[#7aa7d1]/30 text-[#7aa7d1] hover:bg-[#7aa7d1]/10">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value="tickets" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedTicket?.id === ticket.id
                      ? 'ring-2 ring-[#7aa7d1] bg-[#7aa7d1]/5'
                      : 'hover:border-[#7aa7d1]/30'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <span className="text-sm font-semibold text-[#7aa7d1]">#{ticket.ticket_number}</span>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                          <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                        </div>
                        <h4 className="text-base font-medium text-gray-900 mb-2">{ticket.title}</h4>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center flex-wrap gap-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {ticket.requester_name}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            Updated: {ticket.last_updated_at}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#7aa7d1] hover:bg-[#7aa7d1]/10"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredTickets.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                    <p className="text-gray-500 mb-4">No tickets match your current filters</p>
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-[#7aa7d1] hover:bg-[#6a97c1] text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Ticket
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Ticket Detail Panel */}
            <div className="lg:col-span-1">
              {selectedTicket ? (
                <Card className="sticky top-6 border-t-4 border-t-[#7aa7d1]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-[#7aa7d1]">
                        Ticket #{selectedTicket.ticket_number}
                      </CardTitle>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{selectedTicket.title}</h4>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selectedTicket.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Priority</span>
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Category</span>
                        <Badge variant="outline">{selectedTicket.category}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Requester</span>
                        <span className="font-medium">{selectedTicket.requester_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Created</span>
                        <span>{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Assigned to</span>
                        <span className={selectedTicket.assigned_to?.name ? 'font-medium' : 'text-gray-400 italic'}>
                          {selectedTicket.assigned_to?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Contact Information</Label>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm p-2 bg-gray-50 rounded">
                          <Mail className="h-4 w-4 mr-2 text-[#7aa7d1]" />
                          {selectedTicket.requester_email}
                        </div>
                        {selectedTicket.requester_phone && (
                          <div className="flex items-center text-sm p-2 bg-gray-50 rounded">
                            <Phone className="h-4 w-4 mr-2 text-[#7aa7d1]" />
                            {selectedTicket.requester_phone}
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Update Status</Label>
                      <Select value={selectedTicket.status} onValueChange={(value) => handleStatusUpdate(selectedTicket.id, value)}>
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="pending_client">Pending Client</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button className="w-full bg-[#7aa7d1] hover:bg-[#6a97c1] text-white">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Reply to Ticket
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Recent Activity</Label>
                      <div className="space-y-2">
                        {selectedTicket.activity?.map((activity, index) => (
                          <div key={index} className="p-2.5 bg-gray-50 rounded-lg border-l-2 border-[#7aa7d1]">
                            <div className="font-medium text-sm">{activity.action}</div>
                            <div className="text-xs text-gray-500 mt-1">{activity.timestamp} by {activity.user}</div>
                          </div>
                        )) || (
                          <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <Info className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">No recent activity</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-[#7aa7d1]/10 rounded-full w-fit mx-auto mb-4">
                      <Eye className="h-8 w-8 text-[#7aa7d1]" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">No ticket selected</h3>
                    <p className="text-sm text-gray-500">Select a ticket to view its details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Disputes List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredDisputes.map((dispute) => (
                <Card
                  key={dispute.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedDispute?.id === dispute.id
                      ? 'ring-2 ring-[#7aa7d1] bg-[#7aa7d1]/5'
                      : 'hover:border-[#7aa7d1]/30'
                  }`}
                  onClick={() => setSelectedDispute(dispute)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center flex-wrap gap-2 mb-3">
                          <span className="text-sm font-semibold text-[#7aa7d1]">#{dispute.dispute_number}</span>
                          {getStatusBadge(dispute.status)}
                          <Badge variant="outline" className="text-xs">{dispute.type}</Badge>
                        </div>
                        <h4 className="text-base font-medium text-gray-900 mb-2">{dispute.title}</h4>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{dispute.description}</p>
                        <div className="flex items-center flex-wrap gap-4 text-xs text-gray-500">
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            {dispute.complainant_name}
                          </div>
                          <div className="flex items-center">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-orange-400" />
                            Amount: ${dispute.disputed_amount}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                            Filed: {new Date(dispute.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[#7aa7d1] hover:bg-[#7aa7d1]/10"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {loadingDisputes && (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7aa7d1] mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading disputes...</p>
                  </CardContent>
                </Card>
              )}
              {!loadingDisputes && filteredDisputes.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Disputes Found</h3>
                    <p className="text-gray-500">
                      {disputes.length === 0
                        ? 'You have no disputes. This is excellent!'
                        : 'No disputes match your current filters.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Dispute Detail Panel */}
            <div className="lg:col-span-1">
              {selectedDispute ? (
                <Card className="sticky top-6 border-t-4 border-t-[#7aa7d1]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-[#7aa7d1]">
                        Dispute #{selectedDispute.dispute_number}
                      </CardTitle>
                      {getStatusBadge(selectedDispute.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900">{selectedDispute.title}</h4>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selectedDispute.description}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Type</span>
                        <Badge variant="outline">{selectedDispute.type}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-semibold text-orange-600">${selectedDispute.disputed_amount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Complainant</span>
                        <span className="font-medium">{selectedDispute.complainant_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Filed</span>
                        <span>{new Date(selectedDispute.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Severity</span>
                        {getPriorityBadge(selectedDispute.severity)}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Parties Involved</Label>
                      <div className="space-y-2">
                        {selectedDispute.parties?.map((party, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border-l-2 border-[#7aa7d1]">
                            <span className="text-sm font-medium">{party.name}</span>
                            <Badge variant="outline" size="sm">{party.role}</Badge>
                          </div>
                        )) || (
                          <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <Info className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">No parties listed</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Actions</Label>
                      <div className="space-y-2">
                        <Button
                          className="w-full bg-[#7aa7d1] hover:bg-[#6a97c1] text-white"
                          size="sm"
                          onClick={() => handleDisputeAction(selectedDispute.id, 'investigate')}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Start Investigation
                        </Button>
                        <Button
                          className="w-full border-[#7aa7d1] text-[#7aa7d1] hover:bg-[#7aa7d1]/10"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisputeAction(selectedDispute.id, 'mediate')}
                        >
                          <Gavel className="h-4 w-4 mr-2" />
                          Schedule Mediation
                        </Button>
                        <Button
                          className="w-full border-gray-200 hover:bg-gray-50"
                          variant="outline"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs uppercase tracking-wide text-gray-500">Evidence & Documents</Label>
                      <div className="space-y-2">
                        {selectedDispute.evidence?.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-[#7aa7d1]" />
                              <span className="text-sm">{doc.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#7aa7d1] hover:bg-[#7aa7d1]/10">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        )) || (
                          <div className="p-3 bg-gray-50 rounded-lg text-center">
                            <Info className="h-4 w-4 mx-auto text-gray-400 mb-1" />
                            <p className="text-xs text-gray-500">No evidence uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <div className="p-4 bg-[#7aa7d1]/10 rounded-full w-fit mx-auto mb-4">
                      <Gavel className="h-8 w-8 text-[#7aa7d1]" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">No dispute selected</h3>
                    <p className="text-sm text-gray-500">Select a dispute to view its details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-[#7aa7d1]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="p-2 bg-[#7aa7d1]/10 rounded-lg mr-3">
                    <FileText className="h-5 w-5 text-[#7aa7d1]" />
                  </div>
                  Common Issues & Solutions
                </CardTitle>
                <CardDescription>Quick answers to frequently asked questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportData?.knowledgeBase?.commonIssues?.map((issue, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:border-[#7aa7d1]/50 hover:bg-[#7aa7d1]/5 transition-all cursor-pointer group/item">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1.5 group-hover/item:text-[#7aa7d1]">{issue.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{issue.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover/item:text-[#7aa7d1] group-hover/item:translate-x-1 transition-all" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {issue.views} views
                        </span>
                        <div className="flex items-center text-amber-500">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {issue.rating}/5
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-emerald-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <MessageCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  Quick Response Templates
                </CardTitle>
                <CardDescription>Pre-written responses for common scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportData?.knowledgeBase?.templates?.map((template, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:border-emerald-300 hover:bg-emerald-50/50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{template.title}</h4>
                        <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700">{template.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                      <div className="flex justify-end mt-3 pt-3 border-t gap-2">
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#7aa7d1] hover:bg-[#7aa7d1]/10">
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  Resolution Statistics
                </CardTitle>
                <CardDescription>Performance metrics for your support team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-[#7aa7d1]/10 to-[#7aa7d1]/5 rounded-xl border border-[#7aa7d1]/20 text-center">
                      <div className="text-3xl font-bold text-[#7aa7d1]">89%</div>
                      <div className="text-xs text-gray-600 mt-1">First Contact Resolution</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200 text-center">
                      <div className="text-3xl font-bold text-emerald-600">4.6</div>
                      <div className="text-xs text-gray-600 mt-1">Customer Satisfaction</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl border border-amber-200 text-center">
                      <div className="text-3xl font-bold text-amber-600">2.3h</div>
                      <div className="text-xs text-gray-600 mt-1">Avg Response Time</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200 text-center">
                      <div className="text-3xl font-bold text-purple-600">98%</div>
                      <div className="text-xs text-gray-600 mt-1">Resolution Rate</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 border-t-4 border-t-orange-500">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <div className="p-2 bg-orange-100 rounded-lg mr-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  Escalation Guidelines
                </CardTitle>
                <CardDescription>When and how to escalate support issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-white rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-red-800">Critical Issues</h4>
                        <p className="text-xs text-red-600 mt-0.5">Escalate immediately to management team</p>
                      </div>
                      <Badge className="bg-red-100 text-red-700 border-red-200">Urgent</Badge>
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-white rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-orange-800">High Priority</h4>
                        <p className="text-xs text-orange-600 mt-0.5">Escalate within 2 hours if unresolved</p>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">2h</Badge>
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-[#7aa7d1] bg-gradient-to-r from-[#7aa7d1]/10 to-white rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-[#5a87b1]">Medium Priority</h4>
                        <p className="text-xs text-[#7aa7d1] mt-0.5">Escalate within 24 hours if unresolved</p>
                      </div>
                      <Badge className="bg-[#7aa7d1]/10 text-[#7aa7d1] border-[#7aa7d1]/30">24h</Badge>
                    </div>
                  </div>
                  <div className="p-3 border-l-4 border-gray-400 bg-gradient-to-r from-gray-50 to-white rounded-r-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm text-gray-700">Low Priority</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Escalate within 72 hours if unresolved</p>
                      </div>
                      <Badge className="bg-gray-100 text-gray-600 border-gray-200">72h</Badge>
                    </div>
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

export default AgencySupportPage;
