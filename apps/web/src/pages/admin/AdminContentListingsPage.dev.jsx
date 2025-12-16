import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  MoreHorizontal,
  Eye,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  MapPin,
  DollarSign,
  Calendar,
  Trash2,
  Download,
  RefreshCw,
  Pause,
  Play,
  Zap,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAdminListings } from '@/hooks/admin/useAdminListings';
import { toast } from '@/components/ui/use-toast';

const AdminContentListingsPage = () => {
  const {
    listings,
    stats,
    loading,
    statsLoading,
    isOperating,
    currentPage,
    totalPages,
    totalCount,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    sortBy,
    updateSort,
    goToPage,
    updateStatus,
    toggleFeatured,
    toggleUrgent,
    deleteListing,
    refresh,
  } = useAdminListings();

  const [selectedListing, setSelectedListing] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);

  // Status badge renderer
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Active', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      draft: { label: 'Draft', icon: Clock, color: 'bg-gray-100 text-gray-800' },
      paused: { label: 'Paused', icon: Pause, color: 'bg-yellow-100 text-yellow-800' },
      filled: { label: 'Filled', icon: Users, color: 'bg-blue-100 text-blue-800' },
      expired: { label: 'Expired', icon: AlertTriangle, color: 'bg-orange-100 text-orange-800' },
      cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Job type badge renderer
  const getJobTypeBadge = (type) => {
    const typeConfig = {
      'full-time': { label: 'Full-time', color: 'bg-blue-100 text-blue-800' },
      'part-time': { label: 'Part-time', color: 'bg-purple-100 text-purple-800' },
      'live-in': { label: 'Live-in', color: 'bg-green-100 text-green-800' },
      'live-out': { label: 'Live-out', color: 'bg-orange-100 text-orange-800' },
      temporary: { label: 'Temporary', color: 'bg-pink-100 text-pink-800' },
      contract: { label: 'Contract', color: 'bg-cyan-100 text-cyan-800' },
    };

    const config = typeConfig[type] || { label: type || 'N/A', color: 'bg-gray-100 text-gray-800' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // Format salary
  const formatSalary = (min, max, currency = 'USD') => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    if (min) return `${currency} ${min.toLocaleString()}+`;
    return `Up to ${currency} ${max.toLocaleString()}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle status change
  const handleStatusChange = async (listingId, newStatus) => {
    await updateStatus(listingId, newStatus);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (listingToDelete) {
      await deleteListing(listingToDelete);
      setDeleteDialogOpen(false);
      setListingToDelete(null);
    }
  };

  // Listing Detail Dialog
  const ListingDetailDialog = ({ listing, open, onOpenChange }) => {
    if (!listing) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Briefcase className="h-6 w-6" />
              <div>
                <p className="text-xl font-semibold">{listing.title}</p>
                <p className="text-sm text-muted-foreground">
                  Posted by {listing.sponsor_profile?.full_name || 'Unknown'} - {listing.location || listing.city}, {listing.country}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Listing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Listing Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(listing.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Job Type:</span>
                  {getJobTypeBadge(listing.job_type)}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatSalary(listing.salary_min, listing.salary_max, listing.currency)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{listing.city}, {listing.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Posted: {formatDate(listing.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Expires: {formatDate(listing.expires_at)}</span>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Description:</span>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                    {listing.description || 'No description provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Requirements & Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements & Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Applications:</span>
                  <Badge variant="secondary">{listing.applications_count || 0}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Views:</span>
                  <Badge variant="secondary">{listing.views_count || 0}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Experience Required:</span>
                  <span className="text-sm">{listing.minimum_experience_years || 0}+ years</span>
                </div>
                {listing.required_skills?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Required Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {listing.required_skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {listing.languages_required?.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Languages:</span>
                    <div className="flex flex-wrap gap-1">
                      {listing.languages_required.map((lang, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {listing.featured && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
                {listing.urgent && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">
                      <Zap className="h-3 w-3 mr-1" />
                      Urgent
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sponsor Information */}
            {listing.sponsor_profile && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Posted By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-sm font-medium">Name:</span>
                      <p className="text-sm text-muted-foreground">{listing.sponsor_profile.full_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Location:</span>
                      <p className="text-sm text-muted-foreground">{listing.sponsor_profile.city}, {listing.sponsor_profile.country}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Total Hires:</span>
                      <p className="text-sm text-muted-foreground">{listing.sponsor_profile.total_hires || 0}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Verified:</span>
                      <p className="text-sm text-muted-foreground">
                        {listing.sponsor_profile.identity_verified ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Select
              value={listing.status}
              onValueChange={(value) => {
                handleStatusChange(listing.id, value);
                onOpenChange(false);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activate</SelectItem>
                <SelectItem value="paused">Pause</SelectItem>
                <SelectItem value="filled">Mark Filled</SelectItem>
                <SelectItem value="expired">Mark Expired</SelectItem>
                <SelectItem value="cancelled">Cancel</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={listing.featured ? 'outline' : 'default'}
              onClick={() => {
                toggleFeatured(listing.id, !listing.featured);
                onOpenChange(false);
              }}
            >
              <Star className="h-4 w-4 mr-2" />
              {listing.featured ? 'Remove Featured' : 'Make Featured'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading state
  if (loading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Listings</h1>
          <p className="text-muted-foreground">
            Manage job postings across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">All job listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.active || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Pause className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.paused || 0}
            </div>
            <p className="text-xs text-muted-foreground">Temporarily paused</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.featured || 0}
            </div>
            <p className="text-xs text-muted-foreground">Highlighted listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalApplications || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total applications</p>
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
                  placeholder="Search by title, description, or location..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="filled">Filled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.jobType} onValueChange={(value) => updateFilter('jobType', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Job Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="live-in">Live-in</SelectItem>
                <SelectItem value="live-out">Live-out</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Job Listings ({totalCount})
            {loading && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
          </CardTitle>
          <CardDescription>
            Manage and moderate job listings across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-600">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'No job listings have been posted yet.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Listing</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Posted By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <div className="font-medium truncate">{listing.title}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <MapPin className="h-3 w-3" />
                            {listing.city || listing.location}, {listing.country}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-3 w-3" />
                            {formatSalary(listing.salary_min, listing.salary_max, listing.currency)}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {getJobTypeBadge(listing.job_type)}
                          {listing.featured && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs flex items-center gap-1 w-fit">
                              <Star className="h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                          {listing.urgent && (
                            <Badge className="bg-red-100 text-red-800 text-xs flex items-center gap-1 w-fit">
                              <Zap className="h-3 w-3" />
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{listing.sponsor_profile?.full_name || 'Unknown'}</div>
                          <div className="text-muted-foreground">
                            {listing.sponsor_profile?.city}, {listing.sponsor_profile?.country}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(listing.status)}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div>{listing.applications_count || 0} applications</div>
                          <div className="text-muted-foreground">{listing.views_count || 0} views</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(listing.created_at)}
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedListing(listing);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {listing.status !== 'active' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(listing.id, 'active')}>
                                <Play className="mr-2 h-4 w-4 text-green-500" />
                                Activate
                              </DropdownMenuItem>
                            )}
                            {listing.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(listing.id, 'paused')}>
                                <Pause className="mr-2 h-4 w-4 text-yellow-500" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => toggleFeatured(listing.id, !listing.featured)}>
                              <Star className={`mr-2 h-4 w-4 ${listing.featured ? 'text-yellow-500' : ''}`} />
                              {listing.featured ? 'Remove Featured' : 'Make Featured'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleUrgent(listing.id, !listing.urgent)}>
                              <Zap className={`mr-2 h-4 w-4 ${listing.urgent ? 'text-red-500' : ''}`} />
                              {listing.urgent ? 'Remove Urgent' : 'Mark Urgent'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setListingToDelete(listing.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
                    Page {currentPage} of {totalPages} ({totalCount} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Listing Detail Dialog */}
      <ListingDetailDialog
        listing={selectedListing}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job listing
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminContentListingsPage;
