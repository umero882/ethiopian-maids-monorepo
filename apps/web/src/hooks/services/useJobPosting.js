/**
 * useJobPosting Hook
 * React hooks for Job Posting operations using ServiceFactory
 */

import { useState, useCallback, useEffect } from 'react';
import { useEnsureServiceFactory, ServiceFactory } from './useServiceFactory';

/**
 * Hook for fetching a single job posting
 */
export function useJobPosting(jobId) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchJob = useCallback(async (id) => {
    const targetId = id || jobId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      const result = await service.getJobPosting(targetId);
      setJob(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJob(jobId);
    }
  }, [jobId, fetchJob]);

  return {
    job,
    loading,
    error,
    refetch: fetchJob,
  };
}

/**
 * Hook for searching job postings
 */
export function useJobPostingSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const search = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      const results = await service.searchJobPostings(filters);
      setJobs(results);
      return results;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setJobs([]);
    setError(null);
  }, []);

  return {
    jobs,
    loading,
    error,
    search,
    reset,
  };
}

/**
 * Hook for creating a job posting
 */
export function useCreateJobPosting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdJob, setCreatedJob] = useState(null);

  useEnsureServiceFactory();

  const createJob = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      const result = await service.createJobPosting(data);
      setCreatedJob(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createJob,
    loading,
    error,
    createdJob,
  };
}

/**
 * Hook for updating a job posting
 */
export function useUpdateJobPosting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedJob, setUpdatedJob] = useState(null);

  useEnsureServiceFactory();

  const updateJob = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      const result = await service.updateJobPosting(id, data);
      setUpdatedJob(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateJob,
    loading,
    error,
    updatedJob,
  };
}

/**
 * Hook for deleting a job posting
 */
export function useDeleteJobPosting() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const deleteJob = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      await service.deleteJobPosting(id);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteJob,
    loading,
    error,
  };
}

/**
 * Hook for publishing/unpublishing a job posting
 */
export function useJobPostingPublish() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const publishJob = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      const result = await service.publishJobPosting(id);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const closeJob = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      const result = await service.closeJobPosting(id);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    publishJob,
    closeJob,
    loading,
    error,
  };
}

/**
 * Hook for fetching sponsor's job postings
 */
export function useSponsorJobs(sponsorId, options = {}) {
  const { status, limit, autoFetch = true } = options;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchJobs = useCallback(async (id, opts = {}) => {
    const targetId = id || sponsorId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      const result = await service.getSponsorJobs(
        targetId,
        opts.status ?? status,
        opts.limit ?? limit
      );
      setJobs(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sponsorId, status, limit]);

  useEffect(() => {
    if (autoFetch && sponsorId) {
      fetchJobs(sponsorId);
    }
  }, [sponsorId, autoFetch, fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
  };
}

/**
 * Hook for finding matching jobs for a maid
 */
export function useMatchingJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const findMatching = useCallback(async (filters) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobPostingService();
      const results = await service.findMatchingJobs(filters);
      setJobs(results);
      return results;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setJobs([]);
    setError(null);
  }, []);

  return {
    jobs,
    loading,
    error,
    findMatching,
    reset,
  };
}

/**
 * Combined hook for all job posting operations
 */
export function useJobPostingService() {
  useEnsureServiceFactory();

  const getService = useCallback(() => {
    return ServiceFactory.getJobPostingService();
  }, []);

  return {
    getService,
    // Individual operation hooks
    useJob: useJobPosting,
    useSearch: useJobPostingSearch,
    useCreate: useCreateJobPosting,
    useUpdate: useUpdateJobPosting,
    useDelete: useDeleteJobPosting,
    usePublish: useJobPostingPublish,
    useSponsorJobs,
    useMatchingJobs,
  };
}
