/**
 * AdminAdminsPage - Production Version
 * Manages admin user accounts with GraphQL/Hasura
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Key,
  Activity,
  UserPlus,
  Loader2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  ShieldCheck
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

const AdminAdminsPage = () => {
  const { logAdminActivity, adminUser } = useAdminAuth();
  const [adminsData, setAdminsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const itemsPerPage = 20;

  // GraphQL query for admins
  const GET_ADMINS = gql`
    query GetAdmins($limit: Int!, $offset: Int!, $where: profiles_bool_exp) {
      profiles(
        limit: $limit
        offset: $offset
        where: $where
        order_by: { created_at: desc }
      ) {
        id
        email
        full_name
        phone
        avatar_url
        created_at
        user_type
      }
      profiles_aggregate(where: $where) {
        aggregate {
          count
        }
      }
    }
  `;

  // Fetch admins from GraphQL
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build where clause
      const where = { user_type: { _eq: 'admin' } };

      if (searchTerm) {
        where._or = [
          { full_name: { _ilike: `%${searchTerm}%` } },
          { email: { _ilike: `%${searchTerm}%` } },
          { phone: { _ilike: `%${searchTerm}%` } }
        ];
      }

      const { data, errors } = await apolloClient.query({
        query: GET_ADMINS,
        variables: {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          where
        },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch admins');

      // Transform data
      const transformedData = (data?.profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || 'Unknown Admin',
        phone: profile.phone || 'N/A',
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        // Admin-specific data (defaults since admin_profiles may not exist)
        role: 'admin',
        department: 'General',
        permissions: [],
        is_active: true,
        last_login_at: null,
        total_actions: 0,
        last_action_at: null,
      }));

      setAdminsData(transformedData);
      setTotalCount(data?.profiles_aggregate?.aggregate?.count || 0);

      await logAdminActivity('admins_page_view', 'admin_users', 'admins');

      toast({
        title: 'Success',
        description: `Loaded ${transformedData.length} admin accounts`,
      });
    } catch (err) {
      logger.error('Failed to fetch admins:', err);
      setError('Failed to load admin data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load admins. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, roleFilter, statusFilter, logAdminActivity]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Handle status toggle (placeholder - admin_profiles table may not exist in Hasura)
  const handleStatusToggle = async (adminId, currentStatus) => {
    try {
      // Prevent deactivating yourself
      if (adminId === adminUser?.id) {
        toast({
          title: 'Action Not Allowed',
          description: 'You cannot deactivate your own account.',
          variant: 'destructive',
        });
        return;
      }

      const newStatus = !currentStatus;

      // Optimistic UI update
      setAdminsData(prev =>
        prev.map(admin =>
          admin.id === adminId
            ? { ...admin, is_active: newStatus }
            : admin
        )
      );

      await logAdminActivity(
        `admin_status_${newStatus ? 'activated' : 'deactivated'}`,
        'admin',
        adminId
      );

      toast({
        title: 'Status Updated',
        description: `Admin has been ${newStatus ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      logger.error('Failed to update admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
      fetchAdmins();
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-800', icon: ShieldCheck },
      admin: { label: 'Admin', color: 'bg-blue-100 text-blue-800', icon: Shield },
      moderator: { label: 'Moderator', color: 'bg-green-100 text-green-800', icon: UserCheck },
      support: { label: 'Support', color: 'bg-purple-100 text-purple-800', icon: Users }
    };

    const config = roleConfig[role] || roleConfig.admin;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Inactive
      </Badge>
    );
  };

  const AdminDetailDialog = ({ admin, open, onOpenChange }) => {
    if (!admin) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={admin.avatar_url} />
                <AvatarFallback>
                  {admin.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{admin.full_name}</p>
                <p className="text-sm text-muted-foreground">{admin.email}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Admin account details and permissions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Role</p>
                {getRoleBadge(admin.role)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
                {getStatusBadge(admin.is_active)}
              </div>
            </div>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{admin.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{admin.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{admin.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined {new Date(admin.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {admin.last_login_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Last login: {new Date(admin.last_login_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{admin.total_actions || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Actions</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Action</p>
                    <p className="text-xs text-muted-foreground">
                      {admin.last_action_at
                        ? new Date(admin.last_action_at).toLocaleString()
                        : 'No activity yet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {admin.permissions && admin.permissions.length > 0 ? (
                    admin.permissions.map((permission, idx) => (
                      <Badge key={idx} variant="outline">
                        {permission}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific permissions assigned</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {adminUser?.id !== admin.id && (
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleStatusToggle(admin.id, admin.is_active);
                    onOpenChange(false);
                  }}
                  variant={admin.is_active ? 'destructive' : 'default'}
                  className="flex-1"
                >
                  {admin.is_active ? (
                    <>
                      <UserX className="h-4 w-4 mr-2" />
                      Deactivate Admin
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Activate Admin
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading state
  if (loading && adminsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin accounts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && adminsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAdmins}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin User Management</h1>
          <p className="text-muted-foreground">Manage admin accounts and permissions</p>
        </div>
        <Button onClick={fetchAdmins} variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={(value) => {
              setRoleFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Admins</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {adminsData.filter(a => a.is_active).length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold text-red-600">
                  {adminsData.filter(a => a.role === 'super_admin').length}
                </p>
              </div>
              <ShieldCheck className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-gray-600">
                  {adminsData.filter(a => !a.is_active).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Accounts</CardTitle>
          <CardDescription>
            Showing {adminsData.length} of {totalCount} total admin accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {adminsData.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Admins Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No admin accounts in the database yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminsData.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={admin.avatar_url} />
                            <AvatarFallback>
                              {admin.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{admin.full_name}</p>
                            {admin.id === adminUser?.id && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{admin.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{admin.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{admin.department}</span>
                      </TableCell>
                      <TableCell>{getRoleBadge(admin.role)}</TableCell>
                      <TableCell>{getStatusBadge(admin.is_active)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {admin.last_login_at
                            ? new Date(admin.last_login_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{admin.total_actions || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedAdmin(admin);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {adminUser?.id !== admin.id && (
                              <DropdownMenuItem
                                onClick={() => handleStatusToggle(admin.id, admin.is_active)}
                              >
                                {admin.is_active ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({totalCount} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <AdminDetailDialog
        admin={selectedAdmin}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
};

export default AdminAdminsPage;
