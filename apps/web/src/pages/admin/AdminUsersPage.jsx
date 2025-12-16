import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  MoreHorizontal,
  Search,
  UserPlus,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  User,
  Users,
  Building2,
  Home,
  Shield,
  Eye,
  Ban,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Loader2,
  TrendingUp,
  TrendingDown,
  UserCheck,
  UserX,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { toast } from '@/components/ui/use-toast';

// GraphQL Queries and Subscriptions
const GET_ALL_PROFILES = gql`
  query GetAllProfiles($limit: Int!, $offset: Int!, $where: profiles_bool_exp, $order_by: [profiles_order_by!]) {
    profiles(limit: $limit, offset: $offset, where: $where, order_by: $order_by) {
      id
      full_name
      email
      phone
      user_type
      country
      is_active
      registration_complete
      avatar_url
      created_at
      updated_at
      maid_profile {
        id
        full_name
        nationality
        experience_years
        verification_status
      }
      agency_profile {
        id
        license_number
        country
        city
        verification_status
      }
      sponsor_profile {
        id
        full_name
        country
        city
      }
    }
    profiles_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GET_USER_STATS = gql`
  query GetUserStats {
    total: profiles_aggregate {
      aggregate { count }
    }
    maids: profiles_aggregate(where: { user_type: { _eq: "maid" } }) {
      aggregate { count }
    }
    agencies: profiles_aggregate(where: { user_type: { _eq: "agency" } }) {
      aggregate { count }
    }
    sponsors: profiles_aggregate(where: { user_type: { _eq: "sponsor" } }) {
      aggregate { count }
    }
    active: profiles_aggregate(where: { is_active: { _eq: true } }) {
      aggregate { count }
    }
    inactive: profiles_aggregate(where: { is_active: { _eq: false } }) {
      aggregate { count }
    }
    pending_verification: maid_profiles_aggregate(where: { verification_status: { _eq: "pending" } }) {
      aggregate { count }
    }
    recent: profiles_aggregate(where: { created_at: { _gte: "2025-01-01" } }) {
      aggregate { count }
    }
  }
`;

// Polling interval for real-time updates (in milliseconds)
const POLLING_INTERVAL = 5000; // 5 seconds

const UPDATE_PROFILE_STATUS = gql`
  mutation UpdateProfileStatus($id: String!, $is_active: Boolean!) {
    update_profiles_by_pk(
      pk_columns: { id: $id }
      _set: { is_active: $is_active }
    ) {
      id
      is_active
    }
  }
`;

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { logAdminActivity, canAccess, adminUser } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailDialog, setUserDetailDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', user: null });
  const [actionReason, setActionReason] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const pageSize = 20;

  // Build where clause for filtering
  const buildWhereClause = useCallback(() => {
    const conditions = {};

    if (selectedUserType !== 'all') {
      conditions.user_type = { _eq: selectedUserType };
    }

    if (selectedStatus === 'active') {
      conditions.is_active = { _eq: true };
    } else if (selectedStatus === 'inactive') {
      conditions.is_active = { _eq: false };
    }

    if (searchQuery) {
      conditions._or = [
        { full_name: { _ilike: `%${searchQuery}%` } },
        { email: { _ilike: `%${searchQuery}%` } },
        { phone: { _ilike: `%${searchQuery}%` } }
      ];
    }

    return Object.keys(conditions).length > 0 ? conditions : null;
  }, [selectedUserType, selectedStatus, searchQuery]);

  // Fetch users data
  const loadUsers = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const { data } = await apolloClient.query({
        query: GET_ALL_PROFILES,
        variables: {
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          where: buildWhereClause(),
          order_by: [{ created_at: 'desc' }]
        },
        fetchPolicy: 'network-only'
      });

      const profilesData = data?.profiles || [];
      const enrichedUsers = profilesData.map(user => ({
        ...user,
        profile_data: user.maid_profile || user.agency_profile || user.sponsor_profile || null
      }));

      setUsers(enrichedUsers);
      setTotalCount(data?.profiles_aggregate?.aggregate?.count || 0);

      // Load stats
      const { data: statsResult } = await apolloClient.query({
        query: GET_USER_STATS,
        fetchPolicy: 'network-only'
      });

      if (statsResult) {
        setStats({
          total: statsResult.total?.aggregate?.count || 0,
          maids: statsResult.maids?.aggregate?.count || 0,
          agencies: statsResult.agencies?.aggregate?.count || 0,
          sponsors: statsResult.sponsors?.aggregate?.count || 0,
          active: statsResult.active?.aggregate?.count || 0,
          inactive: statsResult.inactive?.aggregate?.count || 0,
          pending_verification: statsResult.pending_verification?.aggregate?.count || 0,
          recent: statsResult.recent?.aggregate?.count || 0
        });
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading users:', error);
      if (showLoading) {
        toast({
          title: 'Error',
          description: 'Failed to load users. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [currentPage, buildWhereClause]);

  // Initial load and log activity
  useEffect(() => {
    loadUsers();
    logAdminActivity?.('users_view', 'users', 'list');
  }, [loadUsers]);

  // Polling for real-time updates
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(() => {
      loadUsers(false); // Silent refresh without loading indicator
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [isPolling, loadUsers]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedUserType, selectedStatus, searchQuery]);

  const handleUserAction = async (action, userId) => {
    if (!canAccess('users', 'write')) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let isActive = true;
      let logAction = '';

      switch (action) {
        case 'activate':
          isActive = true;
          logAction = 'user_activated';
          break;
        case 'deactivate':
        case 'suspend':
          isActive = false;
          logAction = action === 'suspend' ? 'user_suspended' : 'user_deactivated';
          break;
        default:
          return;
      }

      await apolloClient.mutate({
        mutation: UPDATE_PROFILE_STATUS,
        variables: {
          id: userId,
          is_active: isActive
        }
      });

      await logAdminActivity?.(logAction, 'user', userId, { reason: actionReason });

      toast({
        title: 'Success',
        description: `User has been ${action}d successfully.`,
      });

      setActionDialog({ open: false, type: '', user: null });
      setActionReason('');
    } catch (error) {
      logger.error(`Error ${action} user:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} user. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  const getUserTypeIcon = (type) => {
    switch (type) {
      case 'maid':
        return <User className='h-4 w-4' />;
      case 'agency':
        return <Building2 className='h-4 w-4' />;
      case 'sponsor':
        return <Home className='h-4 w-4' />;
      case 'admin':
        return <Shield className='h-4 w-4' />;
      default:
        return <User className='h-4 w-4' />;
    }
  };

  const getUserTypeColor = (type) => {
    switch (type) {
      case 'maid':
        return 'bg-purple-100 text-purple-800';
      case 'agency':
        return 'bg-blue-100 text-blue-800';
      case 'sponsor':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // User Detail Dialog Component
  const UserDetailDialog = ({ user, open, onClose }) => {
    if (!user) return null;

    const displayName = user.full_name || user.profile_data?.full_name || 'Unknown User';

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getUserTypeIcon(user.user_type)}
              User Details
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Profile */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{displayName}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getUserTypeColor(user.user_type)}>
                          {user.user_type}
                        </Badge>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.email || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.phone || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user.country || user.profile_data?.country || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Joined {formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Type-specific information */}
              {user.user_type === 'maid' && user.maid_profile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Maid Profile Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nationality</Label>
                      <p className="text-sm text-muted-foreground">{user.maid_profile.nationality || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Experience</Label>
                      <p className="text-sm text-muted-foreground">
                        {user.maid_profile.experience_years ? `${user.maid_profile.experience_years} years` : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Verification Status</Label>
                      <Badge variant={user.maid_profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                        {user.maid_profile.verification_status || 'pending'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user.user_type === 'agency' && user.agency_profile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Agency Profile Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">License Number</Label>
                      <p className="text-sm text-muted-foreground">{user.agency_profile.license_number || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="text-sm text-muted-foreground">
                        {[user.agency_profile.city, user.agency_profile.country].filter(Boolean).join(', ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Verification Status</Label>
                      <Badge variant={user.agency_profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                        {user.agency_profile.verification_status || 'pending'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user.user_type === 'sponsor' && user.sponsor_profile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sponsor Profile Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <p className="text-sm text-muted-foreground">{user.sponsor_profile.full_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="text-sm text-muted-foreground">
                        {[user.sponsor_profile.city, user.sponsor_profile.country].filter(Boolean).join(', ') || 'Not specified'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canAccess('users', 'write') && (
                    <>
                      {user.is_active ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            onClose();
                            setActionDialog({ open: true, type: 'suspend', user });
                          }}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Suspend User
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => handleUserAction('activate', user.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Activate User
                        </Button>
                      )}
                    </>
                  )}

                  <Button variant="outline" size="sm" className="w-full">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>

                  <Button variant="outline" size="sm" className="w-full">
                    <Activity className="h-4 w-4 mr-2" />
                    View Activity
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs">{user.id.substring(0, 12)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registration</span>
                    <Badge variant={user.registration_complete ? 'default' : 'secondary'}>
                      {user.registration_complete ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span>{formatRelativeTime(user.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Action Dialog Component
  const ActionDialog = ({ open, type, user, onClose }) => (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'suspend' ? 'Suspend User' : 'User Action'}
          </DialogTitle>
          <DialogDescription>
            {type === 'suspend'
              ? `Are you sure you want to suspend ${user?.full_name || 'this user'}? This action will deactivate their account.`
              : 'Please confirm this action.'
            }
          </DialogDescription>
        </DialogHeader>

        {type === 'suspend' && (
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for suspension</Label>
            <Textarea
              id="reason"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter the reason for suspension..."
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={type === 'suspend' ? 'destructive' : 'default'}
            onClick={() => user && handleUserAction(type, user.id)}
            disabled={type === 'suspend' && !actionReason.trim()}
          >
            {type === 'suspend' ? 'Suspend User' : 'Confirm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage and monitor all platform users in real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPolling(!isPolling)}
            className={isPolling ? 'border-green-500' : ''}
          >
            <Activity className={`h-4 w-4 mr-2 ${isPolling ? 'text-green-500' : ''}`} />
            {isPolling ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadUsers(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {canAccess('users', 'write') && (
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.maids}</p>
                  <p className="text-xs text-muted-foreground">Maids</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.agencies}</p>
                  <p className="text-xs text-muted-foreground">Agencies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Home className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.sponsors}</p>
                  <p className="text-xs text-muted-foreground">Sponsors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-xs text-muted-foreground">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending_verification}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Platform Users</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span>Showing {users.length} of {totalCount} users</span>
                <span className="text-xs">• Updated {formatRelativeTime(lastRefresh)}</span>
                {isPolling && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={selectedUserType} onValueChange={setSelectedUserType}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="maid">Maids</SelectItem>
                <SelectItem value="agency">Agencies</SelectItem>
                <SelectItem value="sponsor">Sponsors</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading users...</span>
            </div>
          )}

          {/* User Table */}
          {!loading && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Contact</th>
                      <th className="text-left p-3 font-medium">Location</th>
                      <th className="text-left p-3 font-medium">Registered</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const displayName = user.full_name || user.profile_data?.full_name || 'Unknown';
                      return (
                        <tr
                          key={user.id}
                          className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={(e) => {
                            // Don't navigate if clicking on dropdown
                            if (e.target.closest('[role="menu"]') || e.target.closest('button')) return;
                            navigate(`/admin/users/${user.id}`);
                          }}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(displayName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{displayName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={getUserTypeColor(user.user_type)}>
                              <span className="flex items-center gap-1">
                                {getUserTypeIcon(user.user_type)}
                                <span className="capitalize">{user.user_type}</span>
                              </span>
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{user.phone || '—'}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{user.country || user.profile_data?.country || '—'}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-sm">{formatDate(user.created_at)}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant={user.is_active ? 'default' : 'destructive'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedUser(user);
                                  setUserDetailDialog(true);
                                }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Quick View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/admin/users/${user.id}`)}>
                                  <User className="h-4 w-4 mr-2" />
                                  Full Details
                                </DropdownMenuItem>
                                {adminUser?.role === 'SUPER_ADMIN' && (
                                  <DropdownMenuItem
                                    onClick={() => navigate(`/admin/users/${user.id}`)}
                                    className="text-blue-600"
                                  >
                                    <Shield className="h-4 w-4 mr-2" />
                                    Manage User (Full CRUD)
                                  </DropdownMenuItem>
                                )}
                                {canAccess('users', 'write') && (
                                  <>
                                    <DropdownMenuSeparator />
                                    {user.is_active ? (
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => setActionDialog({ open: true, type: 'suspend', user })}
                                      >
                                        <Ban className="h-4 w-4 mr-2" />
                                        Suspend User
                                      </DropdownMenuItem>
                                    ) : (
                                      <DropdownMenuItem
                                        className="text-green-600"
                                        onClick={() => handleUserAction('activate', user.id)}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Activate User
                                      </DropdownMenuItem>
                                    )}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users found matching your criteria.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
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
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDetailDialog
        user={selectedUser}
        open={userDetailDialog}
        onClose={() => {
          setUserDetailDialog(false);
          setSelectedUser(null);
        }}
      />

      <ActionDialog
        open={actionDialog.open}
        type={actionDialog.type}
        user={actionDialog.user}
        onClose={() => {
          setActionDialog({ open: false, type: '', user: null });
          setActionReason('');
        }}
      />
    </div>
  );
};

export default AdminUsersPage;
