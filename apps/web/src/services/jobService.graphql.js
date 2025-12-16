import { apolloClient } from '@ethio/api-client';
import { createLogger } from '@/utils/logger';
import {
  GetJobCompleteDocument,
  GetJobsWithFiltersDocument,
  GetSponsorJobsDocument,
  GetJobApplicationsDocument,
  GetMaidApplicationsDocument,
  GetApplicationByIdDocument,
  GetSponsorJobStatsDocument,
  GetAvailableJobsDocument,
  CreateJobDocument,
  UpdateJobDocument,
  DeleteJobDocument,
  ChangeJobStatusDocument,
  ToggleJobFeaturedDocument,
  IncrementJobViewsDocument,
  SubmitApplicationDocument,
  UpdateApplicationStatusDocument,
  AddApplicationNotesDocument,
  WithdrawApplicationDocument,
  IncrementApplicationsCountDocument,
} from '@ethio/api-client';

const log = createLogger('JobService:GraphQL');

/**
 * Build GraphQL where clause from filter object
 * Converts UI filters to GraphQL bool_exp format
 */
function buildJobFilters(filters) {
  if (!filters) return {};

  const where = { _and: [] };

  // Country filter
  if (filters.country && filters.country !== 'all') {
    where._and.push({ country: { _eq: filters.country } });
  }

  // Job type filter
  if (filters.jobType && filters.jobType !== 'all') {
    where._and.push({ job_type: { _eq: filters.jobType } });
  }

  // Accommodation/live-in filter
  if (filters.accommodation && filters.accommodation !== 'all') {
    const liveInRequired = filters.accommodation === 'live-in';
    where._and.push({ live_in_required: { _eq: liveInRequired } });
  }

  // Service type (required_skills array)
  if (Array.isArray(filters.serviceType) && filters.serviceType.length > 0) {
    where._and.push({ required_skills: { _contains: filters.serviceType } });
  }

  // Requirements filter (also in required_skills)
  if (Array.isArray(filters.requirements) && filters.requirements.length > 0) {
    where._and.push({ required_skills: { _contains: filters.requirements } });
  }

  // Languages required filter
  if (Array.isArray(filters.languagesRequired) && filters.languagesRequired.length > 0) {
    where._and.push({ languages_required: { _contains: filters.languagesRequired } });
  }

  // Urgent only filter
  if (filters.urgentOnly) {
    where._and.push({ urgency_level: { _eq: 'urgent' } });
  }

  // Status filter (default to active if not specified)
  if (filters.status) {
    where._and.push({ status: { _eq: filters.status } });
  } else {
    // Default to active jobs only
    where._and.push({ status: { _eq: 'active' } });
  }

  return where._and.length > 0 ? where : {};
}

/**
 * Build order_by clause from sortBy parameter
 */
function buildJobOrderBy(sortBy) {
  switch (sortBy) {
    case 'salaryHighToLow':
      return [{ salary_min: 'desc' }];
    case 'salaryLowToHigh':
      return [{ salary_min: 'asc' }];
    case 'newest':
      return [{ created_at: 'desc' }];
    default:
      return [{ created_at: 'desc' }];
  }
}

/**
 * GraphQL implementation of job service
 */
export const graphqlJobService = {
  /**
   * Get jobs with filters, search, and sorting
   */
  async getJobs({ filters, searchTerm, sortBy, getSalaryString } = {}) {
    try {
      let where = buildJobFilters(filters);
      const orderBy = buildJobOrderBy(sortBy);

      // Add text search if provided
      if (searchTerm && searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        where._and = where._and || [];
        where._and.push({
          _or: [
            { title: { _ilike: term } },
            { description: { _ilike: term } },
            { city: { _ilike: term } },
          ],
        });
      }

      const { data } = await apolloClient.query({
        query: GetJobsWithFiltersDocument,
        variables: {
          where,
          orderBy,
          limit: 100, // Default limit
          offset: 0,
        },
      });

      const jobs = data?.jobs || [];

      // Apply client-side transformations for backward compatibility
      const transformed = jobs.map((job) => {
        let salaryRangeString = null;
        if (job.salary_min && job.salary_max) {
          salaryRangeString = `${job.salary_min}-${job.salary_max}`;
        } else if (job.salary_min) {
          salaryRangeString = `${job.salary_min}`;
        }

        return {
          ...job,
          employer: job.sponsor?.name || 'Sponsor',
          sponsor_name: job.sponsor?.name || 'Sponsor',
          salaryDisplay:
            typeof getSalaryString === 'function' && salaryRangeString
              ? getSalaryString(job.country, salaryRangeString, job.country, job.currency)
              : null,
        };
      });

      log.debug('[GraphQL] Loaded jobs:', transformed.length);
      return transformed;
    } catch (error) {
      log.error('[GraphQL] Error fetching jobs:', error);
      throw error;
    }
  },

  /**
   * Get a single job by ID
   */
  async getJobById(jobId) {
    try {
      const { data } = await apolloClient.query({
        query: GetJobCompleteDocument,
        variables: { id: jobId },
      });

      const job = data?.jobs_by_pk;
      if (!job) {
        return { data: null, error: new Error('Job not found') };
      }

      log.debug('[GraphQL] Loaded job by ID:', jobId);
      return { data: job, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching job:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new job posting
   */
  async createJob(jobData) {
    try {
      // Calculate expiration date if needed
      let expiresAt = null;
      if (jobData.auto_expire_days) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + jobData.auto_expire_days);
        expiresAt = expireDate.toISOString();
      }

      const jobPayload = {
        title: jobData.title,
        description: jobData.description,
        job_type: jobData.job_type || 'full-time',
        country: jobData.country,
        city: jobData.city,
        address: jobData.address,
        required_skills: jobData.required_skills || [],
        preferred_nationality: jobData.preferred_nationality || [],
        languages_required: jobData.required_languages || [],
        minimum_experience_years: jobData.minimum_experience_years || 0,
        age_preference_min: jobData.age_preference_min,
        age_preference_max: jobData.age_preference_max,
        education_requirement: jobData.education_requirement,
        working_hours_per_day: jobData.working_hours_per_day || 8,
        working_days_per_week: jobData.working_days_per_week || 6,
        days_off_per_week: jobData.days_off_per_week || 1,
        overtime_available: jobData.overtime_available || false,
        live_in_required: jobData.live_in_required !== undefined ? jobData.live_in_required : true,
        salary_min: jobData.salary_min,
        salary_max: jobData.salary_max,
        currency: jobData.currency || 'USD',
        salary_period: jobData.salary_period || 'monthly',
        benefits: jobData.benefits || [],
        contract_duration_months: jobData.contract_duration_months,
        start_date: jobData.start_date,
        end_date: jobData.end_date,
        probation_period_months: jobData.probation_period_months || 3,
        status: jobData.status || 'active',
        urgency_level: jobData.urgency_level || 'normal',
        max_applications: jobData.max_applications || 50,
        auto_expire_days: jobData.auto_expire_days || 30,
        requires_approval: jobData.requires_approval !== undefined ? jobData.requires_approval : true,
        expires_at: expiresAt,
      };

      const { data } = await apolloClient.mutate({
        mutation: CreateJobDocument,
        variables: { data: jobPayload },
      });

      log.info('[GraphQL] Job created successfully:', data.insert_jobs_one.id);
      return { data: data.insert_jobs_one, error: null };
    } catch (error) {
      log.error('[GraphQL] Error creating job:', error);
      return { data: null, error };
    }
  },

  /**
   * Update an existing job
   */
  async updateJob(jobId, jobData) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: UpdateJobDocument,
        variables: {
          id: jobId,
          data: jobData,
        },
      });

      log.info('[GraphQL] Job updated successfully:', jobId);
      return { data: data.update_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating job:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a job posting
   */
  async deleteJob(jobId) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: DeleteJobDocument,
        variables: { id: jobId },
      });

      log.info('[GraphQL] Job deleted successfully:', jobId);
      return { data: { success: true }, error: null };
    } catch (error) {
      log.error('[GraphQL] Error deleting job:', error);
      return { data: null, error };
    }
  },

  /**
   * Change job status
   */
  async changeJobStatus(jobId, status) {
    try {
      const validStatuses = ['draft', 'active', 'paused', 'filled', 'expired', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return {
          data: null,
          error: new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`),
        };
      }

      const { data } = await apolloClient.mutate({
        mutation: ChangeJobStatusDocument,
        variables: { id: jobId, status },
      });

      log.info('[GraphQL] Job status changed:', jobId, status);
      return { data: data.update_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error changing job status:', error);
      return { data: null, error };
    }
  },

  /**
   * Toggle job featured status
   */
  async toggleJobFeatured(jobId, featured, daysToFeature = 7) {
    try {
      let featuredUntil = null;
      if (featured) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysToFeature);
        featuredUntil = futureDate.toISOString();
      }

      const { data } = await apolloClient.mutate({
        mutation: ToggleJobFeaturedDocument,
        variables: { id: jobId, featured, featuredUntil },
      });

      log.info('[GraphQL] Job featured status toggled:', jobId, featured);
      return { data: data.update_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error toggling featured status:', error);
      return { data: null, error };
    }
  },

  /**
   * Get sponsor's jobs
   */
  async getSponsorJobs(options = {}) {
    try {
      const { status = null, limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = options;

      // Get current user - Note: This would need to come from auth context
      // For now, we'll require sponsorId to be passed in options
      if (!options.sponsorId) {
        return { data: null, error: new Error('Sponsor ID is required') };
      }

      const orderByClause = [{ [orderBy]: orderDirection === 'asc' ? 'asc' : 'desc' }];

      const { data } = await apolloClient.query({
        query: GetSponsorJobsDocument,
        variables: {
          sponsorId: options.sponsorId,
          status,
          limit,
          offset,
          orderBy: orderByClause,
        },
      });

      log.debug('[GraphQL] Loaded sponsor jobs:', data?.jobs?.length || 0);
      return { data: data?.jobs || [], error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching sponsor jobs:', error);
      return { data: null, error };
    }
  },

  /**
   * Get job applications
   */
  async getJobApplications(jobId) {
    try {
      const { data } = await apolloClient.query({
        query: GetJobApplicationsDocument,
        variables: { jobId },
      });

      log.debug('[GraphQL] Loaded job applications:', data?.applications?.length || 0);
      return { data: data?.applications || [], error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching job applications:', error);
      return { data: null, error };
    }
  },

  /**
   * Get maid's applications
   */
  async getMaidApplications(options = {}) {
    try {
      const { status = null, limit = 50, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = options;

      if (!options.maidId) {
        return { data: null, error: new Error('Maid ID is required') };
      }

      const { data } = await apolloClient.query({
        query: GetMaidApplicationsDocument,
        variables: {
          maidId: options.maidId,
          status,
          limit,
          offset,
        },
      });

      log.debug('[GraphQL] Loaded maid applications:', data?.applications?.length || 0);
      return { data: data?.applications || [], error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching maid applications:', error);
      return { data: null, error };
    }
  },

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId) {
    try {
      const { data } = await apolloClient.query({
        query: GetApplicationByIdDocument,
        variables: { id: applicationId },
      });

      log.debug('[GraphQL] Loaded application by ID:', applicationId);
      return { data: data?.applications_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching application:', error);
      return { data: null, error };
    }
  },

  /**
   * Submit job application
   */
  async submitApplication(jobId, applicationData) {
    try {
      const applicationPayload = {
        job_id: jobId,
        cover_letter: applicationData.coverLetter,
        status: 'pending',
        application_status: 'new',
      };

      const { data } = await apolloClient.mutate({
        mutation: SubmitApplicationDocument,
        variables: { data: applicationPayload },
      });

      log.info('[GraphQL] Application submitted successfully:', data.insert_applications_one.id);
      return { data: data.insert_applications_one, error: null };
    } catch (error) {
      log.error('[GraphQL] Error submitting application:', error);
      return { data: null, error };
    }
  },

  /**
   * Update application status
   */
  async updateApplicationStatus(applicationId, status, updates = {}) {
    try {
      const validStatuses = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'accepted', 'rejected', 'withdrawn'];
      if (!validStatuses.includes(status)) {
        return {
          data: null,
          error: new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`),
        };
      }

      const { data } = await apolloClient.mutate({
        mutation: UpdateApplicationStatusDocument,
        variables: {
          id: applicationId,
          status,
          notes: updates.notes || updates.interview_notes || null,
        },
      });

      log.info('[GraphQL] Application status updated:', applicationId, status);
      return { data: data.update_applications_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating application status:', error);
      return { data: null, error };
    }
  },

  /**
   * Add notes to application
   */
  async addApplicationNotes(applicationId, notes) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: AddApplicationNotesDocument,
        variables: { id: applicationId, notes },
      });

      log.info('[GraphQL] Application notes added:', applicationId);
      return { data: data.update_applications_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error adding application notes:', error);
      return { data: null, error };
    }
  },

  /**
   * Withdraw application
   */
  async withdrawApplication(applicationId) {
    try {
      const { data } = await apolloClient.mutate({
        mutation: WithdrawApplicationDocument,
        variables: { id: applicationId },
      });

      log.info('[GraphQL] Application withdrawn successfully:', applicationId);
      return { data: data.update_applications_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error withdrawing application:', error);
      return { data: null, error };
    }
  },

  /**
   * Get sponsor job statistics
   */
  async getSponsorJobStats(sponsorId) {
    try {
      if (!sponsorId) {
        return { data: null, error: new Error('Sponsor ID is required') };
      }

      const { data } = await apolloClient.query({
        query: GetSponsorJobStatsDocument,
        variables: { sponsorId },
      });

      const stats = {
        totalJobs: data.all_jobs.aggregate.count || 0,
        activeJobs: data.active_jobs.aggregate.count || 0,
        draftJobs: data.draft_jobs.aggregate.count || 0,
        filledJobs: data.filled_jobs.aggregate.count || 0,
        totalApplications: data.all_jobs.aggregate.sum?.applications_count || 0,
        totalViews: data.all_jobs.aggregate.sum?.views_count || 0,
      };

      log.debug('[GraphQL] Loaded sponsor job stats:', stats);
      return { data: stats, error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching sponsor job stats:', error);
      return { data: null, error };
    }
  },
};
