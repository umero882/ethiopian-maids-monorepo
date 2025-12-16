/**
 * Service Integration Layer
 * Bridges the new ServiceFactory hooks with existing service layer
 *
 * This file provides hooks that integrate with the existing maidService,
 * sponsorService, etc., while preparing for the Clean Architecture migration.
 *
 * Migration Strategy:
 * 1. Phase 1 (Current): Use existing services with feature flag routing
 * 2. Phase 2: Gradually migrate to ServiceFactory as features mature
 * 3. Phase 3: Full ServiceFactory adoption with Clean Architecture
 */

import { useState, useCallback, useEffect } from 'react';
import { maidService } from '@/services/maidService';
import { sponsorService } from '@/services/sponsorService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for maid operations using existing service layer
 * This provides a consistent hook API while using the feature-flag-aware services
 */
export function useMaids(filters = {}, options = {}) {
  const { user } = useAuth();
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  });

  const fetchMaids = useCallback(async (newFilters = {}, newOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...filters, ...newFilters };
      const mergedOptions = {
        ...options,
        ...newOptions,
        userId: user?.id
      };

      const result = await maidService.getMaids(mergedFilters, mergedOptions);

      if (result.error) {
        setError(result.error);
      } else {
        setMaids(result.data || []);
        setPagination(result.pagination || {
          page: 1,
          pageSize: 20,
          total: 0,
          hasMore: false,
        });
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: [], error: err, pagination: {} };
    } finally {
      setLoading(false);
    }
  }, [filters, options, user?.id]);

  useEffect(() => {
    fetchMaids();
  }, [fetchMaids]);

  return {
    maids,
    loading,
    error,
    pagination,
    refetch: fetchMaids,
  };
}

/**
 * Hook for single maid profile
 */
export function useMaid(maidId) {
  const [maid, setMaid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMaid = useCallback(async (id) => {
    const targetId = id || maidId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await maidService.getMaidById(targetId);

      if (result.error) {
        setError(result.error);
      } else {
        setMaid(result.data);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [maidId]);

  useEffect(() => {
    if (maidId) {
      fetchMaid(maidId);
    }
  }, [maidId, fetchMaid]);

  return {
    maid,
    loading,
    error,
    refetch: fetchMaid,
  };
}

/**
 * Hook for sponsor favorites operations
 */
export function useSponsorFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sponsorService.getFavorites();

      if (result.error) {
        setError(result.error);
      } else {
        setFavorites(result.data || []);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const addToFavorites = useCallback(async (maidId, notes = '') => {
    setLoading(true);
    setError(null);

    try {
      const result = await sponsorService.addToFavorites(maidId, notes);

      if (result.error) {
        setError(result.error);
      } else {
        // Refetch favorites after adding
        await fetchFavorites();
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchFavorites]);

  const removeFromFavorites = useCallback(async (maidId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sponsorService.removeFromFavorites(maidId);

      if (result.error) {
        setError(result.error);
      } else {
        // Update local state immediately
        setFavorites(prev => prev.filter(fav => fav.maid?.id !== maidId));
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const checkIfFavorited = useCallback(async (maidId) => {
    try {
      const result = await sponsorService.checkIfFavorited(maidId);
      return result.data;
    } catch (err) {
      return false;
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    }
  }, [user?.id, fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    checkIfFavorited,
    refetch: fetchFavorites,
  };
}

/**
 * Hook for sponsor profile operations
 */
export function useSponsorProfileData(userId) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const targetUserId = userId || user?.id;

  const fetchProfile = useCallback(async (id) => {
    const fetchId = id || targetUserId;
    if (!fetchId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sponsorService.getSponsorProfile(fetchId);

      if (result.error) {
        setError(result.error);
      } else {
        setProfile(result.data);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const updateProfile = useCallback(async (profileData) => {
    if (!targetUserId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await sponsorService.updateSponsorProfile(targetUserId, profileData);

      if (result.error) {
        setError(result.error);
      } else {
        setProfile(result.data);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (targetUserId) {
      fetchProfile(targetUserId);
    }
  }, [targetUserId, fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile,
  };
}

/**
 * Hook for dashboard statistics
 */
export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await sponsorService.getDashboardStats();

      if (result.error) {
        setError(result.error);
      } else {
        setStats(result.data);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for recommended maids
 */
export function useRecommendedMaids(limit = 10) {
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommended = useCallback(async (newLimit) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sponsorService.getRecommendedMaids(newLimit || limit);

      if (result.error) {
        setError(result.error);
      } else {
        setMaids(result.data || []);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchRecommended();
  }, [fetchRecommended]);

  return {
    maids,
    loading,
    error,
    refetch: fetchRecommended,
  };
}

/**
 * Hook for maid search with filters
 */
export function useMaidSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await sponsorService.searchMaids(filters);

      if (result.error) {
        setError(result.error);
      } else {
        setResults(result.data || []);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    reset,
  };
}

// ============================================================================
// JOB SERVICE HOOKS
// ============================================================================

import * as jobService from '@/services/jobService';

/**
 * Hook for sponsor's job listings
 */
export function useSponsorJobsIntegration(options = {}) {
  const { autoFetch = true } = options;
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.getSponsorJobs({ userId: user?.id, ...opts });

      if (result.error) {
        setError(result.error);
      } else {
        setJobs(result.data || []);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (autoFetch && user?.id) {
      fetchJobs();
    }
  }, [autoFetch, user?.id, fetchJobs]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
  };
}

/**
 * Hook for sponsor job statistics
 */
export function useSponsorJobStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.getSponsorJobStats(user?.id);

      if (result.error) {
        setError(result.error);
      } else {
        setStats(result.data);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchStats();
    }
  }, [user?.id, fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for single job details
 */
export function useJob(jobId) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJob = useCallback(async (id) => {
    const targetId = id || jobId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await jobService.getJobById(targetId);

      if (result.error) {
        setError(result.error);
      } else {
        setJob(result.data);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
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
 * Hook for job mutations (create, update, delete, status change)
 */
export function useJobMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createJob = useCallback(async (jobData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.createJob(jobData);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateJob = useCallback(async (jobId, jobData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.updateJob(jobId, jobData);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteJob = useCallback(async (jobId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.deleteJob(jobId);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const changeJobStatus = useCallback(async (jobId, status) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.changeJobStatus(jobId, status);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleFeatured = useCallback(async (jobId, featured, days = 7) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.toggleJobFeatured(jobId, featured, days);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    changeJobStatus,
    toggleFeatured,
  };
}

/**
 * Hook for job applications
 */
export function useJobApplicationsIntegration(jobId, options = {}) {
  const { autoFetch = true } = options;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async (id) => {
    const targetId = id || jobId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await jobService.getJobApplications(targetId);

      if (result.error) {
        setError(result.error);
      } else {
        setApplications(result.data || []);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (autoFetch && jobId) {
      fetchApplications(jobId);
    }
  }, [autoFetch, jobId, fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}

/**
 * Hook for maid's job applications
 */
export function useMaidJobApplications(options = {}) {
  const { autoFetch = true } = options;
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.getMaidApplications({ userId: user?.id, ...opts });

      if (result.error) {
        setError(result.error);
      } else {
        setApplications(result.data || []);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (autoFetch && user?.id) {
      fetchApplications();
    }
  }, [autoFetch, user?.id, fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}

/**
 * Hook for application mutations
 */
export function useApplicationMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitApplication = useCallback(async (jobId, applicationData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.submitApplication(jobId, applicationData);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApplicationStatus = useCallback(async (applicationId, status, updates = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.updateApplicationStatus(applicationId, status, updates);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const addNotes = useCallback(async (applicationId, notes) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.addApplicationNotes(applicationId, notes);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  const withdrawApplication = useCallback(async (applicationId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await jobService.withdrawApplication(applicationId);

      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    submitApplication,
    updateApplicationStatus,
    addNotes,
    withdrawApplication,
  };
}

/**
 * Hook for single application details
 */
export function useApplicationDetails(applicationId) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApplication = useCallback(async (id) => {
    const targetId = id || applicationId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await jobService.getApplicationById(targetId);

      if (result.error) {
        setError(result.error);
      } else {
        setApplication(result.data);
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) {
      fetchApplication(applicationId);
    }
  }, [applicationId, fetchApplication]);

  return {
    application,
    loading,
    error,
    refetch: fetchApplication,
  };
}

/**
 * Hook for public job search
 */
export function useJobSearch(initialFilters = {}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: false,
  });

  const search = useCallback(async (filters = {}, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const mergedFilters = { ...initialFilters, ...filters };
      const result = await jobService.getJobs({ ...mergedFilters, ...options });

      if (result.error) {
        setError(result.error);
      } else {
        setJobs(result.data || []);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      }

      return result;
    } catch (err) {
      setError(err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  const reset = useCallback(() => {
    setJobs([]);
    setError(null);
    setPagination({ page: 1, pageSize: 20, total: 0, hasMore: false });
  }, []);

  return {
    jobs,
    loading,
    error,
    pagination,
    search,
    reset,
  };
}
