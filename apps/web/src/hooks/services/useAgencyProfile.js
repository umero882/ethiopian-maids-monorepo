/**
 * useAgencyProfile Hook
 * React hooks for Agency Profile operations using ServiceFactory
 */

import { useState, useCallback, useEffect } from 'react';
import { useEnsureServiceFactory, ServiceFactory } from './useServiceFactory';

/**
 * Hook for fetching a single agency profile
 */
export function useAgencyProfile(profileId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchProfile = useCallback(async (id) => {
    const targetId = id || profileId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getAgencyProfileService();
      const result = await service.getProfile(targetId);
      setProfile(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (profileId) {
      fetchProfile(profileId);
    }
  }, [profileId, fetchProfile]);

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
  };
}

/**
 * Hook for searching agency profiles
 */
export function useAgencyProfileSearch() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const search = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getAgencyProfileService();
      const results = await service.searchProfiles(filters);
      setProfiles(results);
      return results;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProfiles([]);
    setError(null);
  }, []);

  return {
    profiles,
    loading,
    error,
    search,
    reset,
  };
}

/**
 * Hook for creating an agency profile
 */
export function useCreateAgencyProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdProfile, setCreatedProfile] = useState(null);

  useEnsureServiceFactory();

  const createProfile = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getAgencyProfileService();
      const result = await service.createProfile(data);
      setCreatedProfile(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createProfile,
    loading,
    error,
    createdProfile,
  };
}

/**
 * Hook for updating an agency profile
 */
export function useUpdateAgencyProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedProfile, setUpdatedProfile] = useState(null);

  useEnsureServiceFactory();

  const updateProfile = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getAgencyProfileService();
      const result = await service.updateProfile(id, data);
      setUpdatedProfile(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateProfile,
    loading,
    error,
    updatedProfile,
  };
}

/**
 * Hook for deleting an agency profile
 */
export function useDeleteAgencyProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const deleteProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getAgencyProfileService();
      await service.deleteProfile(id);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteProfile,
    loading,
    error,
  };
}

/**
 * Hook for fetching agency statistics
 */
export function useAgencyStatistics(agencyId, options = {}) {
  const { autoFetch = true } = options;
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchStatistics = useCallback(async (id) => {
    const targetId = id || agencyId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getAgencyProfileService();
      const result = await service.getStatistics(targetId);
      setStatistics(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    if (autoFetch && agencyId) {
      fetchStatistics(agencyId);
    }
  }, [agencyId, autoFetch, fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}

/**
 * Combined hook for agency profile with statistics
 */
export function useAgencyProfileWithStats(agencyId) {
  const profileHook = useAgencyProfile(agencyId);
  const statsHook = useAgencyStatistics(agencyId);

  return {
    profile: profileHook.profile,
    statistics: statsHook.statistics,
    loading: profileHook.loading || statsHook.loading,
    error: profileHook.error || statsHook.error,
    refetchProfile: profileHook.refetch,
    refetchStats: statsHook.refetch,
    refetchAll: useCallback(async () => {
      await Promise.all([
        profileHook.refetch(),
        statsHook.refetch(),
      ]);
    }, [profileHook.refetch, statsHook.refetch]),
  };
}

/**
 * Combined hook for all agency profile operations
 */
export function useAgencyProfileService() {
  useEnsureServiceFactory();

  const getService = useCallback(() => {
    return ServiceFactory.getAgencyProfileService();
  }, []);

  return {
    getService,
    // Individual operation hooks
    useProfile: useAgencyProfile,
    useSearch: useAgencyProfileSearch,
    useCreate: useCreateAgencyProfile,
    useUpdate: useUpdateAgencyProfile,
    useDelete: useDeleteAgencyProfile,
    useStatistics: useAgencyStatistics,
    useProfileWithStats: useAgencyProfileWithStats,
  };
}
