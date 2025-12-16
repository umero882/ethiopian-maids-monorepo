/**
 * Sponsor Jobs Page - Migrated to use Service Hooks
 *
 * This is the migrated version using the new service hooks pattern.
 * Changes from original:
 * - Replaced direct service calls with useSponsorJobsIntegration, useSponsorJobStats, useJobMutations
 * - Centralized error handling
 * - Cleaner state management
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '@/components/global/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import {
  Plus,
  Briefcase,
  MoreVertical,
  Eye,
  Pause,
  Play,
  CheckCircle,
  Loader2,
  MapPin,
  DollarSign,
  Users,
  TrendingUp,
  X,
  Star,
  Trash2,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDistanceToNow } from 'date-fns';

// NEW: Import from service hooks instead of direct service calls
import {
  useSponsorJobsIntegration,
  useSponsorJobStats,
  useJobMutations,
} from '@/hooks/services/useServiceIntegration';

const SponsorJobsPageMigrated = () => {
  // NEW: Use hooks for data fetching
  const {
    jobs,
    loading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useSponsorJobsIntegration();

  const {
    stats,
    loading: statsLoading,
    refetch: refetchStats,
  } = useSponsorJobStats();

  const {
    deleteJob,
    changeJobStatus,
    loading: mutationLoading,
    error: mutationError,
  } = useJobMutations();

  // Local state for UI
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [actionJobId, setActionJobId] = useState(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Show error toast when errors occur
  useEffect(() => {
    if (jobsError) {
      toast({
        title: 'Error',
        description: 'Failed to load job postings. Please try again.',
        variant: 'destructive',
      });
    }
  }, [jobsError]);

  useEffect(() => {
    if (mutationError) {
      toast({
        title: 'Error',
        description: mutationError.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    }
  }, [mutationError]);

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    setActionJobId(jobId);
    const result = await deleteJob(jobId);

    if (!result.error) {
      toast({
        title: 'Success',
        description: 'Job posting deleted successfully.',
      });
      refetchJobs();
      refetchStats();
    }
    setActionJobId(null);
  };

  const handleChangeStatus = async (jobId, newStatus) => {
    setActionJobId(jobId);
    const result = await changeJobStatus(jobId, newStatus);

    if (!result.error) {
      toast({
        title: 'Success',
        description: `Job status changed to ${newStatus}.`,
      });
      refetchJobs();
      refetchStats();
    }
    setActionJobId(null);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedJobs(jobs.map((job) => job.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleSelectJob = (jobId, checked) => {
    if (checked) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter((id) => id !== jobId));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedJobs.length === 0) {
      toast({
        title: 'No jobs selected',
        description: 'Please select at least one job to perform bulk actions.',
        variant: 'destructive',
      });
      return;
    }

    const confirmMessage =
      action === 'delete'
        ? `Are you sure you want to delete ${selectedJobs.length} job(s)? This action cannot be undone.`
        : `Are you sure you want to change the status of ${selectedJobs.length} job(s) to ${action}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setBulkActionLoading(true);

    const promises = selectedJobs.map(async (jobId) => {
      if (action === 'delete') {
        return await deleteJob(jobId);
      } else {
        return await changeJobStatus(jobId, action);
      }
    });

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);

    if (errors.length > 0) {
      toast({
        title: 'Partial Success',
        description: `${selectedJobs.length - errors.length} of ${selectedJobs.length} jobs updated successfully.`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Success',
        description: `${selectedJobs.length} job(s) updated successfully.`,
      });
    }

    setSelectedJobs([]);
    refetchJobs();
    refetchStats();
    setBulkActionLoading(false);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'default', className: 'bg-green-500', label: 'Active' },
      paused: { variant: 'secondary', className: 'bg-yellow-500', label: 'Paused' },
      filled: { variant: 'secondary', className: 'bg-blue-500', label: 'Filled' },
      expired: { variant: 'secondary', className: 'bg-gray-500', label: 'Expired' },
      cancelled: { variant: 'destructive', className: 'bg-red-500', label: 'Cancelled' },
      draft: { variant: 'outline', className: 'border-gray-400', label: 'Draft' },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const loading = jobsLoading || statsLoading;
  const isActionLoading = (jobId) => actionJobId === jobId || mutationLoading;

  if (loading && jobs.length === 0) {
    return (
      <div className='space-y-6'>
        <SEO title='My Job Postings | Sponsor Dashboard | Ethiopian Maids' />
        <div className='flex items-center justify-center py-20'>
          <div className='text-center space-y-4'>
            <Loader2 className='h-12 w-12 animate-spin text-purple-600 mx-auto' />
            <p className='text-gray-600'>Loading your job postings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <SEO
        title='My Job Postings | Sponsor Dashboard | Ethiopian Maids'
        description='Manage your job postings and view applications'
      />

      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>My Job Postings</h1>
          <p className='text-gray-600 mt-2'>Manage your job listings and view applications</p>
        </div>
        <Button asChild>
          <Link to='/dashboard/sponsor/jobs/new'>
            <Plus className='mr-2 h-4 w-4' />
            Post New Job
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Jobs</p>
                  <p className='text-2xl font-bold text-gray-900'>{stats.totalJobs}</p>
                </div>
                <Briefcase className='h-8 w-8 text-blue-500 opacity-50' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Active Jobs</p>
                  <p className='text-2xl font-bold text-green-600'>{stats.activeJobs}</p>
                </div>
                <TrendingUp className='h-8 w-8 text-green-500 opacity-50' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Applications</p>
                  <p className='text-2xl font-bold text-purple-600'>{stats.totalApplications}</p>
                </div>
                <Users className='h-8 w-8 text-purple-500 opacity-50' />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Total Views</p>
                  <p className='text-2xl font-bold text-orange-600'>{stats.totalViews}</p>
                </div>
                <Eye className='h-8 w-8 text-orange-500 opacity-50' />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedJobs.length > 0 && (
        <Card className='border-purple-200 bg-purple-50'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span className='font-semibold text-purple-900'>{selectedJobs.length} job(s) selected</span>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedJobs([])}
                  className='text-purple-700'
                >
                  <X className='h-4 w-4 mr-1' />
                  Clear
                </Button>
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleBulkAction('active')}
                  disabled={bulkActionLoading}
                >
                  <Play className='h-4 w-4 mr-1' />
                  Activate
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleBulkAction('paused')}
                  disabled={bulkActionLoading}
                >
                  <Pause className='h-4 w-4 mr-1' />
                  Pause
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => handleBulkAction('filled')}
                  disabled={bulkActionLoading}
                >
                  <CheckCircle className='h-4 w-4 mr-1' />
                  Mark Filled
                </Button>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={() => handleBulkAction('delete')}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? (
                    <Loader2 className='h-4 w-4 mr-1 animate-spin' />
                  ) : (
                    <Trash2 className='h-4 w-4 mr-1' />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Job Listings</CardTitle>
          <CardDescription>View and manage all your job postings</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className='text-center py-12'>
              <Briefcase className='h-16 w-16 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-semibold text-gray-700 mb-2'>No job postings yet</h3>
              <p className='text-gray-500 mb-6'>
                Create your first job posting to start receiving applications from qualified candidates
              </p>
              <Button asChild>
                <Link to='/dashboard/sponsor/jobs/new'>
                  <Plus className='mr-2 h-4 w-4' />
                  Post Your First Job
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>
                    <Checkbox
                      checked={selectedJobs.length === jobs.length && jobs.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applications</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className={selectedJobs.includes(job.id) ? 'bg-purple-50' : ''}>
                    <TableCell>
                      <Checkbox
                        checked={selectedJobs.includes(job.id)}
                        onCheckedChange={(checked) => handleSelectJob(job.id, checked)}
                      />
                    </TableCell>
                    <TableCell className='font-medium'>
                      <div>
                        <div className='flex items-center gap-2'>
                          <p className='font-semibold text-gray-900'>{job.title}</p>
                          {job.featured && (
                            <Badge variant='default' className='bg-yellow-500 hover:bg-yellow-600 text-xs'>
                              <Star className='h-3 w-3 fill-current' />
                            </Badge>
                          )}
                        </div>
                        <p className='text-sm text-gray-500'>{job.job_type}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center text-sm text-gray-600'>
                        <MapPin className='h-4 w-4 mr-1' />
                        {job.city}, {job.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center text-sm text-gray-600'>
                        <DollarSign className='h-4 w-4 mr-1' />
                        {job.salary_min}
                        {job.salary_max && ` - ${job.salary_max}`} {job.currency}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{job.applications_count || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-gray-600'>{job.views_count || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className='text-sm text-gray-500'>
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm' disabled={isActionLoading(job.id)}>
                            {isActionLoading(job.id) ? (
                              <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                              <MoreVertical className='h-4 w-4' />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/sponsor/jobs/${job.id}`}>
                              <Eye className='mr-2 h-4 w-4' />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {job.status === 'active' && (
                            <DropdownMenuItem onClick={() => handleChangeStatus(job.id, 'paused')}>
                              <Pause className='mr-2 h-4 w-4' />
                              Pause Job
                            </DropdownMenuItem>
                          )}
                          {job.status === 'paused' && (
                            <DropdownMenuItem onClick={() => handleChangeStatus(job.id, 'active')}>
                              <Play className='mr-2 h-4 w-4' />
                              Activate Job
                            </DropdownMenuItem>
                          )}
                          {(job.status === 'active' || job.status === 'paused') && (
                            <DropdownMenuItem onClick={() => handleChangeStatus(job.id, 'filled')}>
                              <CheckCircle className='mr-2 h-4 w-4' />
                              Mark as Filled
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className='text-red-600'
                            onClick={() => handleDeleteJob(job.id)}
                          >
                            <Trash2 className='mr-2 h-4 w-4' />
                            Delete Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SponsorJobsPageMigrated;
