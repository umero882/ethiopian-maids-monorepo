/**
 * Admin Content Listings Page - Production Version
 * Uses real GraphQL data via useAdminListings hook
 *
 * This page is production-ready as it uses the useAdminListings hook
 * which connects to adminListingsService with real GraphQL queries.
 */
import React from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  Download,
  RefreshCw,
  Loader2,
  Database,
  MapPin,
  DollarSign,
  Users,
  AlertCircle
} from 'lucide-react';
import { useAdminListings } from '@/hooks/admin/useAdminListings';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminContentListingsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const {
    listings,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    currentPage,
    totalCount,
    totalPages,
    setCurrentPage,
    refreshListings,
    updateStatus,
    featureListing,
    isOperating,
    exportListings
  } = useAdminListings();

  // Convenience wrappers for status updates
  const approveListing = (id) => updateStatus(id, 'active');
  const rejectListing = (id) => updateStatus(id, 'cancelled');

  React.useEffect(() => {
    logAdminActivity('content_listings_page_view', 'admin_content', 'listings');
  }, [logAdminActivity]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      draft: { label: 'Draft', icon: Clock, color: 'bg-gray-100 text-gray-800' },
      expired: { label: 'Expired', icon: XCircle, color: 'bg-red-100 text-red-800' },
      filled: { label: 'Filled', icon: CheckCircle2, color: 'bg-blue-100 text-blue-800' },
      closed: { label: 'Closed', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
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

  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading job listings...</p>
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
          <strong>Live Data:</strong> Job listings are loaded from the database.
          {listings.length === 0 && ' No listings found in the system.'}
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
          <p className="text-muted-foreground">
            Review and manage job postings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshListings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportListings}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total?.count || totalCount}</div>
            <p className="text-xs text-muted-foreground">All job listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.applications || 0}</div>
            <p className="text-xs text-muted-foreground">Across all listings</p>
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
                  placeholder="Search by title, location, or employer..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.jobType}
              onValueChange={(value) => updateFilters({ jobType: value })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listings ({totalCount})</CardTitle>
          <CardDescription>
            Review and moderate job listings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-lg font-semibold">Error Loading Listings</h3>
              <p className="text-sm text-muted-foreground mt-2">{error.message || 'Failed to load listings'}</p>
              <Button variant="outline" onClick={refreshListings} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Listings Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {filters.searchTerm || filters.status !== 'all' || filters.jobType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No job listings have been posted yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{listing.title}</div>
                          <div className="text-muted-foreground text-xs">
                            {listing.job_type?.replace('_', ' ')}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {listing.sponsor_profile?.full_name || 'Unknown'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {listing.city || listing.country || 'N/A'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {listing.salary_min && listing.salary_max
                            ? `${listing.salary_min}-${listing.salary_max}`
                            : listing.salary_min || listing.salary_max || 'N/A'}
                        </div>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(listing.status)}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isOperating}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {listing.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => approveListing(listing.id)}>
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => rejectListing(listing.id)}>
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {!listing.featured && listing.status === 'active' && (
                              <DropdownMenuItem onClick={() => featureListing(listing.id)}>
                                <Briefcase className="mr-2 h-4 w-4 text-yellow-500" />
                                Feature Listing
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({totalCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => setCurrentPage(currentPage + 1)}
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
    </div>
  );
};

export default AdminContentListingsPage;
