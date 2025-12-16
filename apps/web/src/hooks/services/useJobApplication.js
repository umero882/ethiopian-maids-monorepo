/**
 * useJobApplication Hook
 * React hooks for Job Application operations using ServiceFactory
 */

import { useState, useCallback, useEffect } from 'react';
import { useEnsureServiceFactory, ServiceFactory } from './useServiceFactory';

/**
 * Hook for fetching a single job application
 */
export function useJobApplication(applicationId) {
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchApplication = useCallback(async (id) => {
    const targetId = id || applicationId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.getApplication(targetId);
      setApplication(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
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
 * Hook for submitting a job application
 */
export function useSubmitJobApplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submittedApplication, setSubmittedApplication] = useState(null);

  useEnsureServiceFactory();

  const submit = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.submitApplication(data);
      setSubmittedApplication(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    submit,
    loading,
    error,
    submittedApplication,
  };
}

/**
 * Hook for withdrawing a job application
 */
export function useWithdrawJobApplication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const withdraw = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.withdrawApplication(data);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    withdraw,
    loading,
    error,
  };
}

/**
 * Hook for application review operations (review, shortlist, reject, accept)
 */
export function useApplicationReview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const review = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.reviewApplication(data);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const shortlist = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.shortlistApplication(data);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reject = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.rejectApplication(data);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const accept = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.acceptApplication(data);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    review,
    shortlist,
    reject,
    accept,
    loading,
    error,
  };
}

/**
 * Hook for fetching applications for a specific job
 */
export function useJobApplications(jobId, options = {}) {
  const { status, limit, autoFetch = true } = options;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchApplications = useCallback(async (id, opts = {}) => {
    const targetId = id || jobId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.getJobApplications(
        targetId,
        opts.status ?? status,
        opts.limit ?? limit
      );
      setApplications(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobId, status, limit]);

  useEffect(() => {
    if (autoFetch && jobId) {
      fetchApplications(jobId);
    }
  }, [jobId, autoFetch, fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}

/**
 * Hook for fetching a maid's applications
 */
export function useMaidApplications(maidId, options = {}) {
  const { status, limit, autoFetch = true } = options;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchApplications = useCallback(async (id, opts = {}) => {
    const targetId = id || maidId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.getMaidApplications(
        targetId,
        opts.status ?? status,
        opts.limit ?? limit
      );
      setApplications(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [maidId, status, limit]);

  useEffect(() => {
    if (autoFetch && maidId) {
      fetchApplications(maidId);
    }
  }, [maidId, autoFetch, fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}

/**
 * Hook for fetching a sponsor's applications
 */
export function useSponsorApplications(sponsorId, options = {}) {
  const { status, limit, autoFetch = true } = options;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchApplications = useCallback(async (id, opts = {}) => {
    const targetId = id || sponsorId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.getSponsorApplications(
        targetId,
        opts.status ?? status,
        opts.limit ?? limit
      );
      setApplications(result);
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
      fetchApplications(sponsorId);
    }
  }, [sponsorId, autoFetch, fetchApplications]);

  return {
    applications,
    loading,
    error,
    refetch: fetchApplications,
  };
}

/**
 * Hook for fetching shortlisted applications
 */
export function useShortlistedApplications(jobId, options = {}) {
  const { autoFetch = true } = options;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchShortlisted = useCallback(async (id) => {
    const targetId = id || jobId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.getShortlistedApplications(targetId);
      setApplications(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (autoFetch && jobId) {
      fetchShortlisted(jobId);
    }
  }, [jobId, autoFetch, fetchShortlisted]);

  return {
    applications,
    loading,
    error,
    refetch: fetchShortlisted,
  };
}

/**
 * Hook for fetching accepted applications
 */
export function useAcceptedApplications(jobId, options = {}) {
  const { autoFetch = true } = options;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchAccepted = useCallback(async (id) => {
    const targetId = id || jobId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.getAcceptedApplications(targetId);
      setApplications(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (autoFetch && jobId) {
      fetchAccepted(jobId);
    }
  }, [jobId, autoFetch, fetchAccepted]);

  return {
    applications,
    loading,
    error,
    refetch: fetchAccepted,
  };
}

/**
 * Hook for checking if a maid has applied to a job
 */
export function useHasApplied(jobId, maidId) {
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const checkHasApplied = useCallback(async (jId, mId) => {
    const targetJobId = jId || jobId;
    const targetMaidId = mId || maidId;
    if (!targetJobId || !targetMaidId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getJobApplicationService();
      const result = await service.checkHasApplied(targetJobId, targetMaidId);
      setHasApplied(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [jobId, maidId]);

  useEffect(() => {
    if (jobId && maidId) {
      checkHasApplied(jobId, maidId);
    }
  }, [jobId, maidId, checkHasApplied]);

  return {
    hasApplied,
    loading,
    error,
    check: checkHasApplied,
  };
}

/**
 * Combined hook for all job application operations
 */
export function useJobApplicationService() {
  useEnsureServiceFactory();

  const getService = useCallback(() => {
    return ServiceFactory.getJobApplicationService();
  }, []);

  return {
    getService,
    // Individual operation hooks
    useApplication: useJobApplication,
    useSubmit: useSubmitJobApplication,
    useWithdraw: useWithdrawJobApplication,
    useReview: useApplicationReview,
    useJobApplications,
    useMaidApplications,
    useSponsorApplications,
    useShortlisted: useShortlistedApplications,
    useAccepted: useAcceptedApplications,
    useHasApplied,
  };
}
