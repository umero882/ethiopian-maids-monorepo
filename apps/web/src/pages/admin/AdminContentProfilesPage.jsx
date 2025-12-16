import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import logger from '@/utils/logger';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  UserCircle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Flag,
  Shield,
  Edit,
  Trash2,
  MoreHorizontal,
  Image,
  FileText,
  Clock,
  TrendingUp,
  Users,
  Loader2,
} from 'lucide-react';

const AdminContentProfilesPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [completionFilter, setCompletionFilter] = useState('all');
  const [flaggedFilter, setFlaggedFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  // Active tab
  const [activeTab, setActiveTab] = useState('all');

  // Modal states
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalProfiles: 0,
    maids: 0,
    agencies: 0,
    sponsors: 0,
    admins: 0,
    pendingApproval: 0,
    verifiedProfiles: 0,
    rejectedProfiles: 0,
    flaggedProfiles: 0,
    incompleteProfiles: 0,
    averageCompletion: 0,
  });

  // GraphQL query for profiles
  const GET_PROFILES = gql`
    query GetProfiles($limit: Int!, $offset: Int!, $where: profiles_bool_exp) {
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
        user_type
        profile_completion
        verification_status
        subscription_status
        created_at
        updated_at
        last_seen
        country
        location
        rating
        total_reviews
        trust_score
        maid_profile {
          id
          verification_status
          profile_completion_percentage
          primary_profession
          nationality
          experience_years
          availability_status
        }
        agency_profile {
          id
          verification_status
          full_name
          license_number
          license_verified
          total_maids
        }
        sponsor_profile {
          id
          full_name
          profile_completed
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

  // GraphQL query for profile stats
  const GET_PROFILE_STATS = gql`
    query GetProfileStats {
      # Total profiles count
      total: profiles_aggregate {
        aggregate {
          count
        }
      }
      # Maids count
      maids: profiles_aggregate(where: { user_type: { _eq: "maid" } }) {
        aggregate {
          count
        }
      }
      # Agencies count
      agencies: profiles_aggregate(where: { user_type: { _eq: "agency" } }) {
        aggregate {
          count
        }
      }
      # Sponsors count
      sponsors: profiles_aggregate(where: { user_type: { _eq: "sponsor" } }) {
        aggregate {
          count
        }
      }
      # Admins count
      admins: profiles_aggregate(where: { user_type: { _eq: "admin" } }) {
        aggregate {
          count
        }
      }
      # Pending verification
      pending: profiles_aggregate(where: { verification_status: { _eq: "pending" } }) {
        aggregate {
          count
        }
      }
      # Verified profiles
      verified: profiles_aggregate(where: { verification_status: { _eq: "verified" } }) {
        aggregate {
          count
        }
      }
      # Rejected profiles
      rejected: profiles_aggregate(where: { verification_status: { _eq: "rejected" } }) {
        aggregate {
          count
        }
      }
      # Incomplete profiles (less than 100% completion)
      incomplete: profiles_aggregate(where: { profile_completion: { _lt: 100 } }) {
        aggregate {
          count
        }
      }
    }
  `;

  // Fetch stats from database
  const fetchStats = useCallback(async () => {
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_PROFILE_STATS,
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch stats');

      setStats(prev => ({
        ...prev,
        totalProfiles: data?.total?.aggregate?.count || 0,
        maids: data?.maids?.aggregate?.count || 0,
        agencies: data?.agencies?.aggregate?.count || 0,
        sponsors: data?.sponsors?.aggregate?.count || 0,
        admins: data?.admins?.aggregate?.count || 0,
        pendingApproval: data?.pending?.aggregate?.count || 0,
        verifiedProfiles: data?.verified?.aggregate?.count || 0,
        rejectedProfiles: data?.rejected?.aggregate?.count || 0,
        incompleteProfiles: data?.incomplete?.aggregate?.count || 0,
      }));
    } catch (err) {
      logger.error('Failed to fetch stats:', err);
    }
  }, []);

  // Fetch profiles with filters
  const fetchProfiles = useCallback(async (tabOverride = null) => {
    try {
      setLoading(true);
      setError(null);

      const currentTab = tabOverride || activeTab;

      // Build where clause
      const where = {};

      // Tab-specific filters
      if (currentTab === 'pending') {
        where.verification_status = { _eq: 'pending' };
      } else if (currentTab === 'flagged') {
        // For flagged, we'll filter client-side since flagging is local
        // In production, you'd have a flagged column in the database
      }

      // Additional filters for 'all' tab
      if (currentTab === 'all') {
        if (userTypeFilter !== 'all') {
          where.user_type = { _eq: userTypeFilter };
        }

        if (statusFilter !== 'all') {
          where.verification_status = { _eq: statusFilter };
        }

        if (completionFilter === 'complete') {
          where.profile_completion = { _eq: 100 };
        } else if (completionFilter === 'incomplete') {
          where.profile_completion = { _lt: 100 };
        }
      }

      if (searchTerm) {
        where._or = [
          { full_name: { _ilike: `%${searchTerm}%` } },
          { email: { _ilike: `%${searchTerm}%` } },
          { phone: { _ilike: `%${searchTerm}%` } }
        ];
      }

      const { data, errors } = await apolloClient.query({
        query: GET_PROFILES,
        variables: {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          where: Object.keys(where).length > 0 ? where : undefined
        },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch profiles');

      let profilesData = (data?.profiles || []).map(p => ({
        ...p,
        is_flagged: false,
        flag_reason: null,
      }));

      // Client-side filtering for flagged tab
      if (currentTab === 'flagged') {
        profilesData = profilesData.filter(p => p.is_flagged);
      }

      setProfiles(profilesData);
      setTotalCount(data?.profiles_aggregate?.aggregate?.count || 0);
    } catch (err) {
      logger.error('Failed to fetch profiles:', err);
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load profiles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, userTypeFilter, statusFilter, completionFilter, flaggedFilter, activeTab, toast]);

  // Get role-specific profile
  const getRoleProfile = (profile) => {
    if (profile.user_type === 'maid') return profile.maid_profile;
    if (profile.user_type === 'agency') return profile.agency_profile;
    if (profile.user_type === 'sponsor') return profile.sponsor_profile;
    return null;
  };

  // Calculate profile completion percentage
  const getProfileCompletion = (profile) => {
    // Use profile's own completion first
    if (profile.profile_completion !== null && profile.profile_completion !== undefined) {
      return profile.profile_completion;
    }
    // Then check role-specific profiles
    if (profile.maid_profile?.profile_completion_percentage) {
      return profile.maid_profile.profile_completion_percentage;
    }
    if (profile.sponsor_profile?.profile_completed) {
      return 100; // sponsor uses boolean
    }
    return 0;
  };

  // Initial fetch - load stats once on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch profiles when filters or tab change
  useEffect(() => {
    if (activeTab !== 'stats') {
      fetchProfiles();
    }
  }, [currentPage, searchTerm, userTypeFilter, statusFilter, completionFilter, flaggedFilter, activeTab]);

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1);
    // Reset filters when switching tabs
    if (value !== 'all') {
      setSearchTerm('');
    }
  };

  // View profile details - navigate to detail page
  const handleViewDetails = (profile) => {
    navigate(`/admin/content/profiles/${profile.id}`);
  };

  // View profile details in modal (legacy)
  const handleViewDetailsModal = (profile) => {
    setSelectedProfile(profile);
    setShowDetailModal(true);
  };

  // Flag profile
  const handleFlagProfile = (profile) => {
    setSelectedProfile(profile);
    setFlagReason('');
    setShowFlagModal(true);
  };

  // Submit flag
  const handleSubmitFlag = async () => {
    if (!selectedProfile || !flagReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for flagging.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Note: Flagging functionality may need to be implemented in Hasura schema
      // For now, just update local state
      setProfiles(prev => prev.map(p =>
        p.id === selectedProfile.id
          ? { ...p, is_flagged: true, flag_reason: flagReason }
          : p
      ));

      toast({
        title: 'Profile Flagged',
        description: 'The profile has been flagged for review.',
      });

      setShowFlagModal(false);
    } catch (err) {
      logger.error('Failed to flag profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to flag profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Unflag profile
  const handleUnflagProfile = async (profile) => {
    try {
      setLoading(true);

      // Note: Unflagging functionality may need to be implemented in Hasura schema
      // For now, just update local state
      setProfiles(prev => prev.map(p =>
        p.id === profile.id
          ? { ...p, is_flagged: false, flag_reason: null }
          : p
      ));

      toast({
        title: 'Profile Unflagged',
        description: 'The flag has been removed from this profile.',
      });
    } catch (err) {
      logger.error('Failed to unflag profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to unflag profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve profile
  const handleApproveProfile = (profile) => {
    setSelectedProfile(profile);
    setApprovalNote('');
    setShowApprovalModal(true);
  };

  // Mutation for updating verification status
  const UPDATE_VERIFICATION_STATUS = gql`
    mutation UpdateVerificationStatus($id: String!, $status: String!) {
      update_profiles_by_pk(
        pk_columns: { id: $id }
        _set: { verification_status: $status }
      ) {
        id
        verification_status
      }
    }
  `;

  // Submit approval
  const handleSubmitApproval = async () => {
    if (!selectedProfile) return;

    try {
      setLoading(true);

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_VERIFICATION_STATUS,
        variables: {
          id: selectedProfile.id,
          status: 'verified'
        }
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to approve profile');

      // Update local state
      setProfiles(prev => prev.map(p =>
        p.id === selectedProfile.id
          ? { ...p, verification_status: 'verified' }
          : p
      ));

      // Refresh stats
      fetchStats();

      toast({
        title: 'Profile Approved',
        description: 'The profile has been verified and approved.',
      });

      setShowApprovalModal(false);
    } catch (err) {
      logger.error('Failed to approve profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to approve profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Reject profile
  const handleRejectProfile = async (profile, reason) => {
    try {
      setLoading(true);

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_VERIFICATION_STATUS,
        variables: {
          id: profile.id,
          status: 'rejected'
        }
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to reject profile');

      // Update local state
      setProfiles(prev => prev.map(p =>
        p.id === profile.id
          ? { ...p, verification_status: 'rejected' }
          : p
      ));

      // Refresh stats
      fetchStats();

      toast({
        title: 'Profile Rejected',
        description: 'The profile verification has been rejected.',
      });
    } catch (err) {
      logger.error('Failed to reject profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to reject profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVerificationBadge = (profile) => {
    // Use profile's own verification status first, then role-specific
    let status = profile.verification_status;
    if (!status) {
      const roleProfile = getRoleProfile(profile);
      status = roleProfile?.verification_status || 'pending';
    }

    const config = {
      verified: { variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      pending: { variant: 'secondary', icon: Clock, color: 'text-yellow-500' },
      rejected: { variant: 'destructive', icon: XCircle, color: 'text-red-500' },
      unverified: { variant: 'secondary', icon: Clock, color: 'text-yellow-500' },
    };

    const { variant, icon: Icon, color } = config[status] || config.pending;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getUserTypeBadge = (userType) => {
    const config = {
      maid: { color: 'bg-blue-100 text-blue-800', label: 'Maid' },
      agency: { color: 'bg-purple-100 text-purple-800', label: 'Agency' },
      sponsor: { color: 'bg-green-100 text-green-800', label: 'Sponsor' },
      admin: { color: 'bg-red-100 text-red-800', label: 'Admin' },
      super_admin: { color: 'bg-red-100 text-red-800', label: 'Super Admin' },
    };

    const { color, label } = config[userType] || { color: 'bg-gray-100 text-gray-800', label: userType || 'Unknown' };

    return (
      <Badge variant="outline" className={color}>
        {label}
      </Badge>
    );
  };

  const getCompletionBadge = (completion) => {
    let variant = 'secondary';
    let color = 'text-yellow-500';

    if (completion === 100) {
      variant = 'default';
      color = 'text-green-500';
    } else if (completion < 50) {
      variant = 'destructive';
      color = 'text-red-500';
    }

    return (
      <Badge variant={variant} className="gap-1">
        <TrendingUp className={`h-3 w-3 ${color}`} />
        {completion}%
      </Badge>
    );
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Loading state
  if (loading && profiles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error && profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold">Failed to Load Profiles</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={fetchProfiles}>
          <Shield className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Content Management</h1>
        <p className="text-muted-foreground">
          Review, approve, and moderate user profile content
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Profiles ({stats.totalProfiles})</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval ({stats.pendingApproval})</TabsTrigger>
          <TabsTrigger value="flagged">Flagged ({stats.flaggedProfiles})</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* All Profiles Tab */}
        <TabsContent value="all" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profiles</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProfiles}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.maids} Maids | {stats.agencies} Agencies | {stats.sponsors} Sponsors | {stats.admins} Admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Verified</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.verifiedProfiles}</div>
                <p className="text-xs text-muted-foreground">Approved profiles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
                <p className="text-xs text-muted-foreground">Awaiting verification</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.rejectedProfiles}</div>
                <p className="text-xs text-muted-foreground">Rejected profiles</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Incomplete</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.incompleteProfiles}</div>
                <p className="text-xs text-muted-foreground">Need completion</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Search and filter profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search profiles..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8"
                  />
                </div>

                {/* User Type Filter */}
                <Select
                  value={userTypeFilter}
                  onValueChange={(value) => {
                    setUserTypeFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="User Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="maid">Maid</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {/* Completion Filter */}
                <Select
                  value={completionFilter}
                  onValueChange={(value) => {
                    setCompletionFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Completion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Profiles</SelectItem>
                    <SelectItem value="complete">Complete (100%)</SelectItem>
                    <SelectItem value="incomplete">Incomplete (&lt;100%)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Flagged Filter */}
                <Select
                  value={flaggedFilter}
                  onValueChange={(value) => {
                    setFlaggedFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Flagged" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Profiles</SelectItem>
                    <SelectItem value="flagged">Flagged Only</SelectItem>
                    <SelectItem value="not_flagged">Not Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Profiles Table */}
          <Card>
            <CardHeader>
              <CardTitle>Profiles ({totalCount})</CardTitle>
              <CardDescription>
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} profiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <div className="text-center py-12">
                  <Filter className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">No profiles found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or search term
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left text-sm font-medium">User</th>
                          <th className="p-3 text-left text-sm font-medium">Type</th>
                          <th className="p-3 text-left text-sm font-medium">Completion</th>
                          <th className="p-3 text-left text-sm font-medium">Status</th>
                          <th className="p-3 text-left text-sm font-medium">Created</th>
                          <th className="p-3 text-left text-sm font-medium">Flags</th>
                          <th className="p-3 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.map((profile) => (
                          <tr
                            key={profile.id}
                            className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleViewDetails(profile)}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {profile.avatar_url ? (
                                  <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium">
                                    {profile.full_name || 'N/A'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {profile.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              {getUserTypeBadge(profile.user_type)}
                            </td>
                            <td className="p-3">
                              {getCompletionBadge(getProfileCompletion(profile))}
                            </td>
                            <td className="p-3">
                              {getVerificationBadge(profile)}
                            </td>
                            <td className="p-3 text-sm">
                              {formatDate(profile.created_at)}
                            </td>
                            <td className="p-3">
                              {profile.is_flagged && (
                                <Badge variant="destructive" className="gap-1">
                                  <Flag className="h-3 w-3" />
                                  Flagged
                                </Badge>
                              )}
                            </td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(profile)}
                                  title="View Full Profile"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {!profile.is_flagged ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFlagProfile(profile)}
                                    title="Flag Profile"
                                  >
                                    <Flag className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnflagProfile(profile)}
                                    title="Remove Flag"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                )}
                                {getRoleProfile(profile)?.verification_status === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApproveProfile(profile)}
                                    className="text-green-600 hover:text-green-700"
                                    title="Quick Approve"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
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
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Approval ({totalCount})
              </CardTitle>
              <CardDescription>Profiles awaiting verification - review and approve or reject</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : profiles.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-semibold">All Caught Up!</h3>
                  <p className="text-sm text-muted-foreground">
                    No profiles pending approval
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left text-sm font-medium">User</th>
                          <th className="p-3 text-left text-sm font-medium">Type</th>
                          <th className="p-3 text-left text-sm font-medium">Completion</th>
                          <th className="p-3 text-left text-sm font-medium">Created</th>
                          <th className="p-3 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.map((profile) => (
                          <tr
                            key={profile.id}
                            className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleViewDetails(profile)}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {profile.avatar_url ? (
                                  <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium">{profile.full_name || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">{getUserTypeBadge(profile.user_type)}</td>
                            <td className="p-3">{getCompletionBadge(getProfileCompletion(profile))}</td>
                            <td className="p-3 text-sm">{formatDate(profile.created_at)}</td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(profile)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApproveProfile(profile)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Approve"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectProfile(profile)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Flagged Tab */}
        <TabsContent value="flagged" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-500" />
                Flagged Profiles ({stats.flaggedProfiles})
              </CardTitle>
              <CardDescription>Profiles flagged for content review</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : profiles.filter(p => p.is_flagged).length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-semibold">No Flagged Profiles</h3>
                  <p className="text-sm text-muted-foreground">
                    All profiles are in good standing
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left text-sm font-medium">User</th>
                          <th className="p-3 text-left text-sm font-medium">Type</th>
                          <th className="p-3 text-left text-sm font-medium">Flag Reason</th>
                          <th className="p-3 text-left text-sm font-medium">Status</th>
                          <th className="p-3 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profiles.filter(p => p.is_flagged).map((profile) => (
                          <tr
                            key={profile.id}
                            className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleViewDetails(profile)}
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {profile.avatar_url ? (
                                  <img
                                    src={profile.avatar_url}
                                    alt={profile.full_name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                    <UserCircle className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium">{profile.full_name || 'N/A'}</p>
                                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">{getUserTypeBadge(profile.user_type)}</td>
                            <td className="p-3">
                              <p className="text-sm text-red-600 max-w-xs truncate">{profile.flag_reason || 'No reason provided'}</p>
                            </td>
                            <td className="p-3">{getVerificationBadge(profile)}</td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(profile)}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnflagProfile(profile)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Remove Flag"
                                >
                                  <Shield className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRejectProfile(profile)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Reject Profile"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Profiles</p>
                    <p className="text-3xl font-bold text-blue-700">{stats.totalProfiles}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Verified</p>
                    <p className="text-3xl font-bold text-green-700">{stats.verifiedProfiles}</p>
                    <p className="text-xs text-green-600">{stats.totalProfiles > 0 ? ((stats.verifiedProfiles / stats.totalProfiles) * 100).toFixed(1) : 0}% of total</p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-green-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600">Pending</p>
                    <p className="text-3xl font-bold text-yellow-700">{stats.pendingApproval}</p>
                    <p className="text-xs text-yellow-600">{stats.totalProfiles > 0 ? ((stats.pendingApproval / stats.totalProfiles) * 100).toFixed(1) : 0}% of total</p>
                  </div>
                  <Clock className="h-10 w-10 text-yellow-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600">Rejected</p>
                    <p className="text-3xl font-bold text-red-700">{stats.rejectedProfiles}</p>
                    <p className="text-xs text-red-600">{stats.totalProfiles > 0 ? ((stats.rejectedProfiles / stats.totalProfiles) * 100).toFixed(1) : 0}% of total</p>
                  </div>
                  <XCircle className="h-10 w-10 text-red-500 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Profile Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Types Distribution</CardTitle>
                <CardDescription>Breakdown by user type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span className="text-sm">Maids</span>
                      </div>
                      <span className="text-lg font-semibold">{stats.maids}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${stats.totalProfiles > 0 ? (stats.maids / stats.totalProfiles) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-sm">Agencies</span>
                      </div>
                      <span className="text-lg font-semibold">{stats.agencies}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${stats.totalProfiles > 0 ? (stats.agencies / stats.totalProfiles) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-sm">Sponsors</span>
                      </div>
                      <span className="text-lg font-semibold">{stats.sponsors}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.totalProfiles > 0 ? (stats.sponsors / stats.totalProfiles) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="text-sm">Admins</span>
                      </div>
                      <span className="text-lg font-semibold">{stats.admins}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${stats.totalProfiles > 0 ? (stats.admins / stats.totalProfiles) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-lg font-bold">{stats.totalProfiles}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
                <CardDescription>Overview of verification states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-green-600">{stats.verifiedProfiles}</span>
                      <span className="text-xs text-muted-foreground">({stats.totalProfiles > 0 ? ((stats.verifiedProfiles / stats.totalProfiles) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-yellow-600">{stats.pendingApproval}</span>
                      <span className="text-xs text-muted-foreground">({stats.totalProfiles > 0 ? ((stats.pendingApproval / stats.totalProfiles) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Rejected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-red-600">{stats.rejectedProfiles}</span>
                      <span className="text-xs text-muted-foreground">({stats.totalProfiles > 0 ? ((stats.rejectedProfiles / stats.totalProfiles) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Incomplete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-orange-600">{stats.incompleteProfiles}</span>
                      <span className="text-xs text-muted-foreground">({stats.totalProfiles > 0 ? ((stats.incompleteProfiles / stats.totalProfiles) * 100).toFixed(0) : 0}%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Profile Details</DialogTitle>
              <DialogDescription>
                Complete profile information for {selectedProfile.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedProfile.avatar_url ? (
                  <img
                    src={selectedProfile.avatar_url}
                    alt={selectedProfile.full_name}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                    <UserCircle className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedProfile.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProfile.email}</p>
                  <div className="flex gap-2 mt-2">
                    {getUserTypeBadge(selectedProfile.user_type)}
                    {getVerificationBadge(selectedProfile)}
                    {getCompletionBadge(getProfileCompletion(selectedProfile))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="text-sm">{selectedProfile.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{formatDate(selectedProfile.created_at)}</p>
                </div>
              </div>

              {selectedProfile.is_flagged && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-sm font-medium text-red-900 flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Flagged for Review
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {selectedProfile.flag_reason}
                  </p>
                </div>
              )}

              {/* Role-specific details would go here */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Additional profile details would be displayed here based on user type
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
              {getRoleProfile(selectedProfile)?.verification_status === 'pending' && (
                <Button onClick={() => {
                  setShowDetailModal(false);
                  handleApproveProfile(selectedProfile);
                }}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Flag Modal */}
      {selectedProfile && (
        <Dialog open={showFlagModal} onOpenChange={setShowFlagModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Flag Profile</DialogTitle>
              <DialogDescription>
                Flag this profile for review
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm">
                  <strong>User:</strong> {selectedProfile.full_name}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {selectedProfile.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Flag Reason</label>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Enter reason for flagging (required)"
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFlagModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleSubmitFlag}>
                <Flag className="mr-2 h-4 w-4" />
                Flag Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval Modal */}
      {selectedProfile && (
        <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Profile</DialogTitle>
              <DialogDescription>
                Verify and approve this profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md">
                <p className="text-sm">
                  <strong>User:</strong> {selectedProfile.full_name}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {selectedProfile.email}
                </p>
                <p className="text-sm">
                  <strong>Type:</strong> {selectedProfile.user_type}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Approval Note (Optional)</label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="Add a note about this approval"
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitApproval}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Profile
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminContentProfilesPage;
