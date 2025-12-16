/**
 * Admin Content Reviews Page - Production Version
 * Uses real GraphQL data via useAdminReviews hook
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  MoreHorizontal,
  Eye,
  Star,
  Download,
  RefreshCw,
  Loader2,
  Database,
  MessageSquare,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useAdminReviews } from '@/hooks/admin/useAdminReviews';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminContentReviewsPage = () => {
  const { logAdminActivity } = useAdminAuth();
  const {
    reviews,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    currentPage,
    totalCount,
    totalPages,
    averageRating,
    setCurrentPage,
    refreshReviews,
    deleteReview,
    isOperating,
    exportReviews
  } = useAdminReviews();

  React.useEffect(() => {
    logAdminActivity('content_reviews_page_view', 'admin_content', 'reviews');
  }, [logAdminActivity]);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reviews...</p>
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
          <strong>Live Data:</strong> Reviews are loaded from the database.
          {reviews.length === 0 && ' No reviews found in the system.'}
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Reviews</h1>
          <p className="text-muted-foreground">
            Manage and moderate user reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshReviews} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportReviews}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total?.count || totalCount}</div>
            <p className="text-xs text-muted-foreground">All reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(averageRating || stats?.average || 0).toFixed(1)}</div>
            <div className="flex items-center gap-1 mt-1">
              {renderStars(Math.round(averageRating || stats?.average || 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
            <Star className="h-4 w-4 text-green-500 fill-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fiveStars?.count || 0}</div>
            <p className="text-xs text-muted-foreground">Excellent ratings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Ratings</CardTitle>
            <Star className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lowRatings?.count || 0}</div>
            <p className="text-xs text-muted-foreground">1-2 star reviews</p>
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
                  placeholder="Search reviews..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <Select
              value={filters.rating}
              onValueChange={(value) => updateFilters({ rating: value })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({totalCount})</CardTitle>
          <CardDescription>
            View and moderate user reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
              <h3 className="mt-4 text-lg font-semibold">Error Loading Reviews</h3>
              <p className="text-sm text-muted-foreground mt-2">{error.message || 'Failed to load reviews'}</p>
              <Button variant="outline" onClick={refreshReviews} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Reviews Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {filters.searchTerm || filters.rating !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No user reviews have been submitted yet'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-sm font-medium">({review.rating})</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm max-w-[300px] truncate">
                          {review.comment || 'No comment'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {review.reviewer?.name?.charAt(0) || 'R'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            {review.reviewer?.name || `User ${review.sponsor_id?.substring(0, 8) || 'Unknown'}`}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {review.maid?.name?.charAt(0) || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            {review.maid?.name || `Maid ${review.maid_id?.substring(0, 8) || 'Unknown'}`}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
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
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => deleteReview(review.id)}
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

export default AdminContentReviewsPage;
