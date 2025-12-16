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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Star,
  MessageSquare,
  RefreshCw,
  Download,
  Calendar,
  User,
  AlertCircle,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminReviews } from '@/hooks/admin/useAdminReviews';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

const AdminContentReviewsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const {
    reviews,
    stats,
    loading,
    statsLoading,
    error,
    isOperating,
    totalCount,
    averageRating,
    ratingDistribution,
    currentPage,
    totalPages,
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    goToPage,
    deleteReview,
    refresh,
  } = useAdminReviews();

  const [selectedReview, setSelectedReview] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setViewDialogOpen(true);
    logAdminActivity('view_review_detail', 'review', review.id);
  };

  const handleDeleteClick = (review) => {
    setReviewToDelete(review);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (reviewToDelete) {
      await deleteReview(reviewToDelete.id);
      await logAdminActivity('delete_review', 'review', reviewToDelete.id);
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'text-yellow-500 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingBadgeColor = (rating) => {
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating === 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  // Loading skeleton
  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
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
  if (error && reviews.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Reviews</h3>
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
          <h1 className="text-3xl font-bold tracking-tight">Reviews & Ratings</h1>
          <p className="text-muted-foreground">
            Manage and moderate user reviews and ratings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (stats?.total || totalCount)}
            </div>
            <p className="text-xs text-muted-foreground">All time reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (stats?.averageRating || averageRating || 0).toFixed(1)
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {getRatingStars(Math.round(stats?.averageRating || averageRating || 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
            <Star className="h-4 w-4 text-green-500 fill-current" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (stats?.rating5 || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? `${((stats.rating5 / stats.total) * 100).toFixed(1)}%` : '0%'} of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Ratings (1-2)</CardTitle>
            <Star className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (stats?.rating1 || 0) + (stats?.rating2 || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">May need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {!statsLoading && ratingDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="w-12 text-sm">{rating} star</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-16 text-sm text-right">{count} ({percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder="Search by review content..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilter('searchTerm', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select
              value={filters.rating}
              onValueChange={(value) => updateFilter('rating', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rating Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="high">High (4-5 stars)</SelectItem>
                <SelectItem value="medium">Medium (3 stars)</SelectItem>
                <SelectItem value="low">Low (1-2 stars)</SelectItem>
                <SelectItem value="5">5 Stars Only</SelectItem>
                <SelectItem value="4">4 Stars Only</SelectItem>
                <SelectItem value="3">3 Stars Only</SelectItem>
                <SelectItem value="2">2 Stars Only</SelectItem>
                <SelectItem value="1">1 Star Only</SelectItem>
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

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({totalCount})</CardTitle>
          <CardDescription>
            View and manage all user reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reviews Found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'No reviews match your current filters. Try adjusting your search criteria.'
                  : 'There are no reviews in the system yet.'}
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
                    <TableHead>Review</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Reviewed User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="max-w-[300px]">
                          <p className="text-sm line-clamp-3">
                            {review.comment || <span className="text-muted-foreground italic">No comment</span>}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getRatingStars(review.rating)}
                          <Badge className={`ml-2 ${getRatingBadgeColor(review.rating)}`}>
                            {review.rating}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {review.reviewer?.full_name || 'Unknown'}
                          </div>
                          <div className="text-muted-foreground text-xs">Sponsor</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {review.reviewed_user?.full_name || 'Unknown'}
                          </div>
                          <div className="text-muted-foreground text-xs">Maid</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(review.created_at)}
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
                            <DropdownMenuItem onClick={() => handleViewReview(review)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(review)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Review
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
                    Page {currentPage} of {totalPages} ({totalCount} total reviews)
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

      {/* View Review Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Full details of the selected review
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reviewer (Sponsor)</label>
                  <p className="font-medium">{selectedReview.reviewer?.full_name || 'Unknown'}</p>
                  {selectedReview.reviewer?.email && (
                    <p className="text-sm text-muted-foreground">{selectedReview.reviewer.email}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reviewed User (Maid)</label>
                  <p className="font-medium">{selectedReview.reviewed_user?.full_name || 'Unknown'}</p>
                  {selectedReview.reviewed_user?.email && (
                    <p className="text-sm text-muted-foreground">{selectedReview.reviewed_user.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Rating</label>
                <div className="flex items-center gap-2 mt-1">
                  {getRatingStars(selectedReview.rating)}
                  <span className="font-medium">{selectedReview.rating}/5</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Review Date</label>
                <p>{formatDate(selectedReview.created_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Comment</label>
                <div className="mt-1 p-4 bg-muted rounded-md">
                  <p>{selectedReview.comment || <span className="text-muted-foreground italic">No comment provided</span>}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                Review ID: {selectedReview.id}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setViewDialogOpen(false);
                handleDeleteClick(selectedReview);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
              {reviewToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">Review by: {reviewToDelete.reviewer?.full_name || 'Unknown'}</p>
                  <p className="text-sm">Rating: {reviewToDelete.rating}/5</p>
                  <p className="text-sm line-clamp-2 mt-1">{reviewToDelete.comment || 'No comment'}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isOperating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isOperating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isOperating ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminContentReviewsPage;
