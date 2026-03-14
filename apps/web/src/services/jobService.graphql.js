import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';
import { auth } from '@/lib/firebaseClient';
import {
  GetJobCompleteDocument,
  GetJobsWithFiltersDocument,
  GetJobApplicationsDocument,
  GetMaidApplicationsDocument,
  GetApplicationByIdDocument,
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
    const liveInRequired = filters.accommodation.toLowerCase() === 'live-in';
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

      // Use inline query to ensure all needed fields are included
      const GET_JOBS_INLINE = gql`
        query GetJobsInline(
          $limit: Int = 100
          $offset: Int = 0
          $where: jobs_bool_exp
          $orderBy: [jobs_order_by!] = [{ created_at: desc }]
        ) {
          jobs(
            where: $where
            limit: $limit
            offset: $offset
            order_by: $orderBy
          ) {
            id
            title
            description
            job_type
            country
            city
            address
            required_skills
            preferred_nationality
            languages_required
            salary_min
            salary_max
            currency
            salary_period
            status
            urgency_level
            applications_count
            views_count
            featured
            expires_at
            created_at
            live_in_required
            benefits
            sponsor_profile {
              id
              full_name
              avatar_url
            }
          }
          jobs_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `;

      const { data } = await apolloClient.query({
        query: GET_JOBS_INLINE,
        variables: {
          where,
          orderBy,
          limit: 100,
          offset: 0,
        },
        fetchPolicy: 'network-only',
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

        // Map sponsor_profile (Hasura relationship) to sponsor (what JobCard expects)
        const sponsorProfile = job.sponsor_profile || null;

        return {
          ...job,
          employer: sponsorProfile?.full_name || 'Sponsor',
          sponsor_name: sponsorProfile?.full_name || 'Sponsor',
          sponsor: sponsorProfile,
          location: [job.city, job.country].filter(Boolean).join(', '),
          urgent: job.urgency_level === 'urgent',
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
        fetchPolicy: 'network-only',
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
   * Uses Cloud Function (admin secret) as primary to bypass Hasura permission issues.
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

      // PRIMARY: Use Cloud Function with admin secret
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const callable = httpsCallable(functions, 'jobManage');
        const result = await callable({ action: 'create', jobData: jobPayload });
        const cfData = result.data;
        if (cfData.success && cfData.job) {
          log.info('[CloudFunction] Job created successfully:', cfData.job.id);
          return { data: cfData.job, error: null };
        }
      } catch (cfError) {
        log.warn('[CloudFunction] Failed, falling back to direct GraphQL:', cfError.message);
      }

      // FALLBACK: Direct GraphQL mutation (may fail without permissions)
      const { data } = await apolloClient.mutate({
        mutation: CreateJobDocument,
        variables: { data: { ...jobPayload, sponsor_id: auth?.currentUser?.uid } },
      });

      if (!data?.insert_jobs_one) {
        return { data: null, error: { message: 'Job creation failed. You may not have permission.' } };
      }

      log.info('[GraphQL] Job created successfully:', data.insert_jobs_one.id);
      return { data: data.insert_jobs_one, error: null };
    } catch (error) {
      log.error('[GraphQL] Error creating job:', error);
      return { data: null, error };
    }
  },

  /**
   * Update an existing job
   * Uses Cloud Function as primary, falls back to direct GraphQL.
   */
  async updateJob(jobId, jobData) {
    try {
      // PRIMARY: Cloud Function
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const callable = httpsCallable(functions, 'jobManage');
        const result = await callable({ action: 'update', jobId, jobData });
        if (result.data.success) {
          log.info('[CloudFunction] Job updated:', jobId);
          return { data: result.data.job, error: null };
        }
      } catch (cfError) {
        log.warn('[CloudFunction] Update failed, trying direct GraphQL:', cfError.message);
      }

      // FALLBACK: Direct GraphQL
      const { data } = await apolloClient.mutate({
        mutation: UpdateJobDocument,
        variables: { id: jobId, data: jobData },
      });

      if (!data?.update_jobs_by_pk) {
        return { data: null, error: { message: 'Job update failed. Permission denied.' } };
      }

      log.info('[GraphQL] Job updated successfully:', jobId);
      return { data: data.update_jobs_by_pk, error: null };
    } catch (error) {
      log.error('[GraphQL] Error updating job:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a job posting
   * Uses Cloud Function as primary, falls back to direct GraphQL.
   */
  async deleteJob(jobId) {
    try {
      // PRIMARY: Cloud Function
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const callable = httpsCallable(functions, 'jobManage');
        const result = await callable({ action: 'delete', jobId });
        if (result.data.success) {
          log.info('[CloudFunction] Job deleted:', jobId);
          return { data: { success: true }, error: null };
        }
      } catch (cfError) {
        log.warn('[CloudFunction] Delete failed, trying direct GraphQL:', cfError.message);
      }

      // FALLBACK: Direct GraphQL
      await apolloClient.mutate({
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
   * Uses Cloud Function as primary, falls back to direct GraphQL.
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

      // PRIMARY: Cloud Function
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const callable = httpsCallable(functions, 'jobManage');
        const result = await callable({ action: 'changeStatus', jobId, status });
        if (result.data.success) {
          log.info('[CloudFunction] Job status changed:', jobId, status);
          return { data: result.data.job, error: null };
        }
      } catch (cfError) {
        log.warn('[CloudFunction] Status change failed, trying direct GraphQL:', cfError.message);
      }

      // FALLBACK: Direct GraphQL
      const { data } = await apolloClient.mutate({
        mutation: ChangeJobStatusDocument,
        variables: { id: jobId, status },
      });

      if (!data?.update_jobs_by_pk) {
        return { data: null, error: { message: 'Status change failed. Permission denied.' } };
      }

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

      // Get sponsorId from options or from Firebase auth
      const sponsorId = options.sponsorId || auth?.currentUser?.uid;
      if (!sponsorId) {
        return { data: null, error: new Error('Not authenticated') };
      }

      // Build where clause - only include status filter if not null
      const where = { sponsor_id: { _eq: sponsorId } };
      if (status) {
        where.status = { _eq: status };
      }

      const orderByClause = [{ [orderBy]: orderDirection === 'asc' ? 'asc' : 'desc' }];

      // Inline query to avoid the generated one that breaks with null status
      // Uses applications_aggregate for real count (applications_count stored counter may be stale)
      const GET_SPONSOR_JOBS = gql`
        query GetSponsorJobsInline(
          $where: jobs_bool_exp!
          $limit: Int = 50
          $offset: Int = 0
          $orderBy: [jobs_order_by!] = [{ created_at: desc }]
        ) {
          jobs(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
            id
            title
            description
            job_type
            country
            city
            status
            salary_min
            salary_max
            currency
            applications_count
            views_count
            featured
            created_at
            updated_at
            applications_aggregate {
              aggregate {
                count
              }
            }
          }
          jobs_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `;

      const { data } = await apolloClient.query({
        query: GET_SPONSOR_JOBS,
        variables: { where, limit, offset, orderBy: orderByClause },
        fetchPolicy: 'network-only',
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
      // Use inline query to ensure full_name is included (generated document may be stale)
      const GET_JOB_APPS = gql`
        query GetJobApplicationsInline($jobId: uuid!) {
          applications(
            where: { job_id: { _eq: $jobId } }
            order_by: { created_at: desc }
          ) {
            id
            status
            application_status
            cover_letter
            notes
            match_score
            offer_amount
            offer_currency
            message
            created_at
            updated_at
            maid_profile {
              id
              full_name
              first_name
              last_name
              profile_photo_url
              verification_status
            }
            job {
              id
              title
              sponsor_id
            }
          }
        }
      `;

      const { data } = await apolloClient.query({
        query: GET_JOB_APPS,
        variables: { jobId },
        fetchPolicy: 'network-only',
      });

      log.debug('[GraphQL] Loaded job applications:', data?.applications?.length || 0);
      return { data: data?.applications || [], error: null };
    } catch (error) {
      log.error('[GraphQL] Error fetching job applications:', error);
      return { data: null, error };
    }
  },

  /**
   * Get job views (who viewed this job)
   */
  async getJobViews(jobId) {
    try {
      const GET_JOB_VIEWS = gql`
        query GetJobViews($jobId: uuid!) {
          job_views(
            where: { job_id: { _eq: $jobId } }
            order_by: { viewed_at: desc }
            limit: 100
          ) {
            id
            viewer_id
            viewer_role
            viewer_name
            viewer_avatar_url
            viewed_at
          }
          job_views_aggregate(where: { job_id: { _eq: $jobId } }) {
            aggregate {
              count
            }
          }
        }
      `;

      const { data } = await apolloClient.query({
        query: GET_JOB_VIEWS,
        variables: { jobId },
        fetchPolicy: 'network-only',
      });

      log.debug('[GraphQL] Loaded job views:', data?.job_views?.length || 0);
      return {
        data: data?.job_views || [],
        total: data?.job_views_aggregate?.aggregate?.count || 0,
        error: null,
      };
    } catch (error) {
      log.error('[GraphQL] Error fetching job views:', error);
      return { data: [], total: 0, error };
    }
  },

  /**
   * Get maid's applications
   */
  async getMaidApplications(options = {}) {
    try {
      const { status = null, limit = 50, offset = 0 } = options;

      // Resolve maidId from options or from current Firebase auth user
      const maidId = options.maidId || auth?.currentUser?.uid;
      if (!maidId) {
        return { data: null, error: new Error('Not authenticated. Please log in.') };
      }

      // Build where clause manually to handle optional status filter
      const where = { maid_id: { _eq: maidId } };
      if (status) {
        where.status = { _eq: status };
      }

      const GET_MAID_APPS = gql`
        query GetMaidApplicationsDynamic(
          $where: applications_bool_exp!
          $limit: Int = 50
          $offset: Int = 0
        ) {
          applications(
            where: $where
            limit: $limit
            offset: $offset
            order_by: { created_at: desc }
          ) {
            id
            status
            application_status
            cover_letter
            notes
            match_score
            offer_amount
            offer_currency
            created_at
            updated_at
            job {
              id
              title
              description
              country
              city
              job_type
              salary_min
              salary_max
              currency
              status
              sponsor_profile {
                id
                full_name
                avatar_url
              }
            }
          }
          applications_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `;

      const { data } = await apolloClient.query({
        query: GET_MAID_APPS,
        variables: { where, limit, offset },
        fetchPolicy: 'network-only',
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
      // Use inline query to ensure full_name is included (generated document may be stale)
      const GET_APP_BY_ID = gql`
        query GetApplicationByIdInline($id: uuid!) {
          applications_by_pk(id: $id) {
            id
            job_id
            maid_id
            status
            application_status
            cover_letter
            message
            notes
            match_score
            offer_amount
            offer_currency
            created_at
            updated_at
            maid_profile {
              id
              full_name
              first_name
              last_name
              profile_photo_url
              verification_status
            }
            job {
              id
              title
              description
              country
              city
              salary_min
              salary_max
              currency
              status
              sponsor_id
              sponsor_profile {
                id
                full_name
                avatar_url
              }
            }
          }
        }
      `;

      const { data } = await apolloClient.query({
        query: GET_APP_BY_ID,
        variables: { id: applicationId },
        fetchPolicy: 'network-only',
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
      const currentUser = auth?.currentUser;
      if (!currentUser?.uid) {
        return { data: null, error: new Error('Not authenticated. Please log in to apply.') };
      }

      const applicationPayload = {
        job_id: jobId,
        maid_id: currentUser.uid,
        cover_letter: applicationData.coverLetter,
        status: 'pending',
        application_status: 'new',
      };

      // Include optional fields if provided
      if (applicationData.proposedSalary) {
        applicationPayload.offer_amount = parseInt(applicationData.proposedSalary, 10);
      }
      if (applicationData.availableFrom) {
        applicationPayload.message = `Available from: ${applicationData.availableFrom}`;
      }

      // PRIMARY: Use Cloud Function with admin secret to bypass Hasura permission issues
      try {
        const { getFunctions, httpsCallable } = await import('firebase/functions');
        const functions = getFunctions();
        const callable = httpsCallable(functions, 'jobApplicationManage');
        const result = await callable({ action: 'submit', applicationData: applicationPayload });
        const cfData = result.data;
        if (cfData.success && cfData.application) {
          log.info('[CloudFunction] Application submitted successfully:', cfData.application.id);

          // Increment the job's applications_count via Cloud Function
          try {
            await callable({ action: 'incrementCount', jobId });
          } catch (countError) {
            log.warn('[CloudFunction] Failed to increment applications count:', countError.message);
          }

          return { data: cfData.application, error: null };
        }
      } catch (cfError) {
        log.warn('[CloudFunction] jobApplicationManage failed, falling back to direct GraphQL:', cfError.message);
      }

      // FALLBACK: Direct GraphQL mutation
      const { data, errors } = await apolloClient.mutate({
        mutation: SubmitApplicationDocument,
        variables: { data: applicationPayload },
      });

      if (errors && errors.length > 0) {
        const errMsg = errors.map(e => e.message).join('; ');
        log.error('[GraphQL] Application submission errors:', errMsg);
        return { data: null, error: new Error(errMsg) };
      }

      if (!data?.insert_applications_one) {
        return { data: null, error: new Error('Application submission failed. You may not have permission. Please contact support.') };
      }

      // Increment the job's applications_count
      try {
        await apolloClient.mutate({
          mutation: IncrementApplicationsCountDocument,
          variables: { jobId },
        });
      } catch (countError) {
        log.warn('[GraphQL] Failed to increment applications count:', countError.message);
      }

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
      const resolvedSponsorId = sponsorId || auth?.currentUser?.uid;
      if (!resolvedSponsorId) {
        return { data: null, error: new Error('Not authenticated') };
      }
      sponsorId = resolvedSponsorId;

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
