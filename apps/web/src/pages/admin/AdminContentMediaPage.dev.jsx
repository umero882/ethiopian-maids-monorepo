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
  Flag,
  CheckCircle2,
  XCircle,
  Clock,
  Image,
  Video,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  File,
  ImageIcon,
} from 'lucide-react';
import { useAdminMedia } from '@/hooks/admin/useAdminMedia';
import { toast } from '@/components/ui/use-toast';

const AdminContentMediaPage = () => {
  const {
    media,
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
    goToPage,
    approveMedia,
    rejectMedia,
    deleteMedia,
    flagMedia,
    refresh,
  } = useAdminMedia();

  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState(null);

  // Moderation status badge
  const getModerationStatusBadge = (status) => {
    const statusConfig = {
      approved: { label: 'Approved', icon: CheckCircle2, color: 'bg-green-100 text-green-800' },
      pending_review: { label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      flagged: { label: 'Flagged', icon: Flag, color: 'bg-orange-100 text-orange-800' },
      rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status] || statusConfig.pending_review;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Media type badge
  const getMediaTypeBadge = (type) => {
    const typeConfig = {
      image: { label: 'Image', icon: ImageIcon, color: 'bg-blue-100 text-blue-800' },
      video: { label: 'Video', icon: Video, color: 'bg-purple-100 text-purple-800' },
      document: { label: 'Document', icon: FileText, color: 'bg-green-100 text-green-800' },
    };

    const config = typeConfig[type] || { label: type || 'File', icon: File, color: 'bg-gray-100 text-gray-800' };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
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

  // Handle moderation actions
  const handleApprove = async (item) => {
    await approveMedia(item.id, item.source);
  };

  const handleReject = async (item) => {
    await rejectMedia(item.id, item.source);
  };

  const handleFlag = async (item) => {
    await flagMedia(item.id, item.source);
  };

  const handleDeleteConfirm = async () => {
    if (mediaToDelete) {
      await deleteMedia(mediaToDelete.id, mediaToDelete.source);
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
    }
  };

  // Media Preview Dialog
  const MediaDetailDialog = ({ item, open, onOpenChange }) => {
    if (!item) return null;

    const isImage = item.media_type === 'image';
    const isVideo = item.media_type === 'video';

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {getMediaTypeBadge(item.media_type)}
              <span className="truncate">{item.filename}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {item.url ? (
                  isImage ? (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="max-w-full max-h-64 object-contain rounded border"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : isVideo ? (
                    <video
                      src={item.url}
                      controls
                      className="max-w-full max-h-64 rounded border"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded border">
                      <FileText className="h-16 w-16 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Document Preview</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded border">
                    <File className="h-16 w-16 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">No preview available</p>
                  </div>
                )}
                <div
                  className="hidden flex-col items-center justify-center p-8 bg-gray-50 rounded border"
                >
                  <File className="h-16 w-16 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Preview not available</p>
                </div>
                {item.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open(item.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getModerationStatusBadge(item.moderation_status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Type:</span>
                  <span className="text-sm">{item.document_type || item.media_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Size:</span>
                  <span className="text-sm">{item.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">MIME Type:</span>
                  <span className="text-sm text-muted-foreground">{item.mime_type || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Uploaded:</span>
                  <span className="text-sm">{formatDate(item.upload_date)}</span>
                </div>
                {item.expiry_date && (
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Expires:</span>
                    <span className="text-sm">{formatDate(item.expiry_date)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Source:</span>
                  <span className="text-sm capitalize">{item.source?.replace('_', ' ')}</span>
                </div>
                {item.description && (
                  <div>
                    <span className="text-sm font-medium">Description:</span>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Uploaded By */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Uploaded By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {item.uploaded_by?.avatar ? (
                    <img
                      src={item.uploaded_by.avatar}
                      alt={item.uploaded_by.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium text-lg">
                        {(item.uploaded_by?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.uploaded_by?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground capitalize">{item.uploaded_by?.type}</p>
                    <p className="text-xs text-muted-foreground">ID: {item.uploaded_by?.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="gap-2 mt-4">
            {item.source === 'maid_documents' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleApprove(item);
                    onOpenChange(false);
                  }}
                  disabled={item.moderation_status === 'approved' || isOperating}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleReject(item);
                    onOpenChange(false);
                  }}
                  disabled={item.moderation_status === 'rejected' || isOperating}
                >
                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                setMediaToDelete(item);
                setDeleteDialogOpen(true);
                onOpenChange(false);
              }}
              disabled={isOperating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // Loading state
  if (loading && media.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading media...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Content</h1>
          <p className="text-muted-foreground">
            Review and moderate uploaded media files
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
            <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">All media files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.pending || 0}
            </div>
            <p className="text-xs text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.approved || 0}
            </div>
            <p className="text-xs text-muted-foreground">Verified content</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.rejected || 0}
            </div>
            <p className="text-xs text-muted-foreground">Not approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalDocuments || 0}
            </div>
            <p className="text-xs text-muted-foreground">Total documents</p>
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
                  placeholder="Search by filename..."
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
                <SelectItem value="pending_review">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.mediaType} onValueChange={(value) => updateFilter('mediaType', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.mediaSource} onValueChange={(value) => updateFilter('mediaSource', value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="documents">Documents</SelectItem>
                <SelectItem value="images">Images</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Media Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Media Files ({totalCount})
            {loading && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
          </CardTitle>
          <CardDescription>
            Review uploaded documents and images for content compliance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {media.length === 0 ? (
            <div className="text-center py-12">
              <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
              <p className="text-gray-600">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'No media files have been uploaded yet.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {media.map((item) => (
                    <TableRow key={`${item.source}-${item.id}`}>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <div className="font-medium truncate">{item.filename}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {item.document_type?.replace(/_/g, ' ') || item.source?.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getMediaTypeBadge(item.media_type)}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium truncate max-w-[150px]">{item.uploaded_by?.name}</div>
                          <div className="text-muted-foreground capitalize">{item.uploaded_by?.type}</div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getModerationStatusBadge(item.moderation_status)}
                      </TableCell>

                      <TableCell>
                        <span className="text-sm">{item.size}</span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(item.upload_date)}
                        </span>
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
                                setSelectedMedia(item);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {item.url && (
                              <DropdownMenuItem onClick={() => window.open(item.url, '_blank')}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open File
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {item.source === 'maid_documents' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleApprove(item)}
                                  disabled={item.moderation_status === 'approved'}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFlag(item)}>
                                  <Flag className="mr-2 h-4 w-4 text-orange-500" />
                                  Flag
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleReject(item)}
                                  disabled={item.moderation_status === 'rejected'}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                  Reject
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setMediaToDelete(item);
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

      {/* Media Detail Dialog */}
      <MediaDetailDialog
        item={selectedMedia}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the media file
              from the system.
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

export default AdminContentMediaPage;
