/**
 * AdminSponsorsPage - Production Version
 * Manages sponsor profiles with GraphQL/Hasura data
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
import { Progress } from '@/components/ui/progress';
import {
  Search,
  Filter,
  MoreHorizontal,
  Home,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  Star,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from '@/components/ui/use-toast';

const AdminSponsorsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const [sponsorsData, setSponsorsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSponsor, setSelectedSponsor] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    premium: 0,
    monthly: 0
  });
  const itemsPerPage = 20;

  // GraphQL query for sponsors - using profiles table with sponsor_profile relation
  const GET_SPONSORS = gql`
    query GetSponsors($limit: Int!, $offset: Int!, $where: profiles_bool_exp) {
      profiles(
        where: $where
        order_by: { created_at: desc }
        limit: $limit
        offset: $offset
      ) {
        id
        email
        full_name
        phone
        country
        location
        avatar_url
        created_at
        last_seen
        user_type
        verification_status
        subscription_status
        profile_completion
        rating
        total_reviews
        total_spent
        sponsor_profile {
          id
          full_name
          phone_number
          city
          country
          household_size
          number_of_children
          accommodation_type
          preferred_languages
          required_skills
          salary_budget_min
          salary_budget_max
          identity_verified
          background_check_completed
          profile_completed
          total_hires
          average_rating
          active_job_postings
        }
      }
      profiles_aggregate(where: $where) {
        aggregate {
          count
        }
      }
    }
  `;

  // Stats query for summary cards
  const GET_SPONSOR_STATS = gql`
    query GetSponsorStats {
      total: profiles_aggregate(where: { user_type: { _eq: "sponsor" } }) {
        aggregate { count }
      }
      verified: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        verification_status: { _eq: "verified" }
      }) {
        aggregate { count }
      }
      pending: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        _or: [
          { verification_status: { _is_null: true } },
          { verification_status: { _eq: "pending" } },
          { verification_status: { _eq: "" } }
        ]
      }) {
        aggregate { count }
      }
      rejected: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        verification_status: { _eq: "rejected" }
      }) {
        aggregate { count }
      }
      premium: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        subscription_status: { _ilike: "premium" }
      }) {
        aggregate { count }
      }
      monthly: profiles_aggregate(where: {
        user_type: { _eq: "sponsor" },
        subscription_status: { _ilike: "monthly" }
      }) {
        aggregate { count }
      }
    }
  `;

  // Fetch sponsors via GraphQL
  const fetchSponsors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build where clause
      const conditions = { user_type: { _eq: 'sponsor' } };

      if (searchTerm) {
        conditions._or = [
          { full_name: { _ilike: `%${searchTerm}%` } },
          { email: { _ilike: `%${searchTerm}%` } },
          { phone: { _ilike: `%${searchTerm}%` } }
        ];
      }

      if (verificationFilter !== 'all') {
        if (verificationFilter === 'pending') {
          conditions._and = [
            { _or: [
              { verification_status: { _is_null: true } },
              { verification_status: { _eq: 'pending' } },
              { verification_status: { _eq: '' } }
            ]}
          ];
        } else {
          conditions.verification_status = { _eq: verificationFilter };
        }
      }

      if (subscriptionFilter !== 'all') {
        conditions.subscription_status = { _ilike: subscriptionFilter };
      }

      const { data, errors } = await apolloClient.query({
        query: GET_SPONSORS,
        variables: {
          limit: itemsPerPage,
          offset: (currentPage - 1) * itemsPerPage,
          where: conditions
        },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'Failed to fetch sponsors');

      const profilesData = data?.profiles || [];
      const count = data?.profiles_aggregate?.aggregate?.count || 0;

      // Transform data - merge profile and sponsor_profile data
      const transformedData = profilesData.map(profile => {
        const sponsorProfile = profile.sponsor_profile || {};

        // Determine verification status
        let verificationStatus = profile.verification_status || 'pending';
        if (!verificationStatus || verificationStatus === '') {
          verificationStatus = 'pending';
        }

        return {
          id: profile.id,
          profile_id: profile.id,
          email: profile.email || 'N/A',
          full_name: profile.full_name || sponsorProfile.full_name || 'Unknown',
          phone: profile.phone || sponsorProfile.phone_number || 'N/A',
          location: `${sponsorProfile.city || 'Unknown'}, ${sponsorProfile.country || profile.country || 'Unknown'}`,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          last_active: profile.last_seen,
          verification_status: verificationStatus,
          subscription_status: (profile.subscription_status || 'free').toLowerCase().trim(),
          profile_completion: profile.profile_completion || 0,
          rating: parseFloat(profile.rating) || parseFloat(sponsorProfile.average_rating) || 0,
          total_reviews: profile.total_reviews || 0,
          total_spent: profile.total_spent || 0,
          // Sponsor-specific data
          household_size: sponsorProfile.household_size,
          number_of_children: sponsorProfile.number_of_children,
          accommodation_type: sponsorProfile.accommodation_type,
          preferred_languages: sponsorProfile.preferred_languages || [],
          required_skills: sponsorProfile.required_skills || [],
          salary_budget_min: sponsorProfile.salary_budget_min,
          salary_budget_max: sponsorProfile.salary_budget_max,
          identity_verified: sponsorProfile.identity_verified,
          background_check_completed: sponsorProfile.background_check_completed,
          profile_completed: sponsorProfile.profile_completed,
          total_hires: sponsorProfile.total_hires || 0,
          active_job_postings: sponsorProfile.active_job_postings || 0,
        };
      });

      setSponsorsData(transformedData);
      setTotalCount(count || 0);

      await logAdminActivity('sponsors_page_view', 'admin_users', 'sponsors');
    } catch (err) {
      logger.error('Failed to fetch sponsors:', err);
      setError('Failed to load sponsor data. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load sponsors. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, verificationFilter, subscriptionFilter, logAdminActivity]);

  // Fetch stats for summary cards
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_SPONSOR_STATS,
        fetchPolicy: 'network-only'
      });

      if (data) {
        setStats({
          total: data.total?.aggregate?.count || 0,
          verified: data.verified?.aggregate?.count || 0,
          pending: data.pending?.aggregate?.count || 0,
          rejected: data.rejected?.aggregate?.count || 0,
          premium: data.premium?.aggregate?.count || 0,
          monthly: data.monthly?.aggregate?.count || 0
        });
      }
    } catch (err) {
      logger.error('Failed to fetch sponsor stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchSponsors();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, verificationFilter, subscriptionFilter]);

  // Handle verification action
  const handleVerificationAction = async (sponsorId, action) => {
    try {
      const newStatus = action === 'approve' ? 'verified' : 'rejected';

      const { errors: updateError } = await apolloClient.mutate({
        mutation: gql`
          mutation UpdateSponsorVerification($id: String!, $status: String!) {
            update_profiles_by_pk(
              pk_columns: { id: $id }
              _set: { verification_status: $status, updated_at: "now()" }
            ) {
              id
              verification_status
            }
          }
        `,
        variables: {
          id: sponsorId,
          status: newStatus
        }
      });

      if (updateError) throw new Error(updateError[0]?.message || 'Update failed');

      // Optimistic UI update
      setSponsorsData(prev =>
        prev.map(sponsor =>
          sponsor.id === sponsorId
            ? { ...sponsor, verification_status: newStatus }
            : sponsor
        )
      );

      // Update stats
      fetchStats();

      await logAdminActivity(`sponsor_verification_${action}`, 'sponsor', sponsorId);

      toast({
        title: 'Verification Updated',
        description: `Sponsor has been ${action === 'approve' ? 'verified' : 'rejected'} successfully.`,
      });
    } catch (error) {
      logger.error('Failed to update verification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update verification status.',
        variant: 'destructive',
      });
      fetchSponsors();
    }
  };

  const getVerificationBadge = (status) => {
    const statusConfig = {
      verified: { label: 'Verified', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' }
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

  const getSubscriptionBadge = (status) => {
    // Normalize the status to lowercase for matching
    const normalizedStatus = (status || '').toLowerCase().trim();

    // Match actual subscription tiers from stripeConfig:
    // Sponsor: free, pro (Weekly), monthly (Monthly), premium (Premium), twoMonths (2 Months Bundle)
    const statusConfig = {
      premium: { label: 'Premium', color: 'bg-purple-100 text-purple-800' },
      monthly: { label: 'Monthly', color: 'bg-blue-100 text-blue-800' },
      pro: { label: 'Weekly', color: 'bg-indigo-100 text-indigo-800' },
      weekly: { label: 'Weekly', color: 'bg-indigo-100 text-indigo-800' },
      twomonths: { label: '2 Months', color: 'bg-teal-100 text-teal-800' },
      free: { label: 'Free', color: 'bg-gray-100 text-gray-800' },
      basic: { label: 'Free', color: 'bg-gray-100 text-gray-800' }, // Map basic to free
    };

    const config = statusConfig[normalizedStatus] || statusConfig.free;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const SponsorDetailDialog = ({ sponsor, open, onOpenChange }) => {
    if (!sponsor) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={sponsor.avatar_url} />
                <AvatarFallback>{sponsor.full_name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{sponsor.full_name}</p>
                <p className="text-sm text-muted-foreground">{sponsor.email}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Complete sponsor profile and booking history
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Status Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Verification</p>
                {getVerificationBadge(sponsor.verification_status)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Subscription</p>
                {getSubscriptionBadge(sponsor.subscription_status)}
              </div>
            </div>

            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sponsor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sponsor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sponsor.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{sponsor.property_type || 'N/A'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Household Size</p>
                    <p className="text-sm">{sponsor.household_size || 'N/A'} members</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Budget Range</p>
                    <p className="text-sm">
                      ${sponsor.budget_min || 0} - ${sponsor.budget_max || 0}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Preferred Languages</p>
                  <div className="flex flex-wrap gap-1">
                    {(sponsor.preferred_languages || []).map((lang, idx) => (
                      <Badge key={idx} variant="outline">{lang}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Preferred Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {(sponsor.preferred_skills || []).map((skill, idx) => (
                      <Badge key={idx} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Profile Completion</p>
                  <Progress value={sponsor.profile_completion || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {sponsor.profile_completion || 0}% complete
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Booking Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold">{sponsor.active_bookings || 0}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{sponsor.completed_bookings || 0}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">${sponsor.total_spent || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                  </div>
                </div>
                {sponsor.rating && (
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-bold">{sponsor.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({sponsor.total_reviews || 0} reviews)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              {sponsor.verification_status === 'pending' && (
                <>
                  <Button
                    onClick={() => {
                      handleVerificationAction(sponsor.id, 'approve');
                      onOpenChange(false);
                    }}
                    className="flex-1"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Approve Sponsor
                  </Button>
                  <Button
                    onClick={() => {
                      handleVerificationAction(sponsor.id, 'reject');
                      onOpenChange(false);
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Reject Sponsor
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading state
  if (loading && sponsorsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sponsors data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && sponsorsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchSponsors}>
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
          <h1 className="text-3xl font-bold">Sponsor Management</h1>
          <p className="text-muted-foreground">Manage and monitor all sponsor profiles</p>
        </div>
        <Button onClick={fetchSponsors} variant="outline" disabled={loading}>
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

            {/* Verification Filter */}
            <Select value={verificationFilter} onValueChange={(value) => {
              setVerificationFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verifications</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Subscription Filter */}
            <Select value={subscriptionFilter} onValueChange={(value) => {
              setSubscriptionFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subscriptions</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="pro">Weekly</SelectItem>
                <SelectItem value="free">Free</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary - Using real database counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sponsors</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Premium</p>
                <p className="text-2xl font-bold text-purple-600">{stats.premium}</p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly</p>
                <p className="text-2xl font-bold text-blue-600">{stats.monthly}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sponsors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsors List</CardTitle>
          <CardDescription>
            Showing {sponsorsData.length} of {totalCount} total sponsors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sponsorsData.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No Sponsors Found"
              description={searchTerm || verificationFilter !== 'all' || subscriptionFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No sponsor profiles in the database yet'}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Household</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sponsorsData.map((sponsor) => (
                    <TableRow key={sponsor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={sponsor.avatar_url} />
                            <AvatarFallback>
                              {sponsor.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{sponsor.full_name}</p>
                            <p className="text-sm text-muted-foreground">{sponsor.property_type || 'N/A'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{sponsor.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{sponsor.household_size || 'N/A'} members</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{sponsor.active_bookings || 0}</span> active
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {sponsor.completed_bookings || 0} completed
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getVerificationBadge(sponsor.verification_status)}</TableCell>
                      <TableCell>{getSubscriptionBadge(sponsor.subscription_status)}</TableCell>
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
                                setSelectedSponsor(sponsor);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {sponsor.verification_status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleVerificationAction(sponsor.id, 'approve')}>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleVerificationAction(sponsor.id, 'reject')}>
                                  <UserX className="h-4 w-4 mr-2" />
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
      <SponsorDetailDialog
        sponsor={selectedSponsor}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
};

export default AdminSponsorsPage;
