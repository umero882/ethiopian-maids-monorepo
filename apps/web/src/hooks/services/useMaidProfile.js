/**
 * useMaidProfile Hook
 * React hooks for Maid Profile operations using ServiceFactory
 */

import { useState, useCallback, useEffect } from 'react';
import { useEnsureServiceFactory, ServiceFactory } from './useServiceFactory';

/**
 * Hook for fetching a single maid profile
 */
export function useMaidProfile(profileId) {
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
      const service = ServiceFactory.getMaidProfileService();
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
 * Hook for searching maid profiles
 */
export function useMaidProfileSearch() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const search = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
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
 * Hook for creating a maid profile
 */
export function useCreateMaidProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdProfile, setCreatedProfile] = useState(null);

  useEnsureServiceFactory();

  const createProfile = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
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
 * Hook for updating a maid profile
 */
export function useUpdateMaidProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedProfile, setUpdatedProfile] = useState(null);

  useEnsureServiceFactory();

  const updateProfile = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
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
 * Hook for deleting a maid profile
 */
export function useDeleteMaidProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const deleteProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
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
 * Hook for fetching agency maids
 */
export function useAgencyMaids(agencyId, options = {}) {
  const { limit, offset, autoFetch = true } = options;
  const [maids, setMaids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchMaids = useCallback(async (id, opts = {}) => {
    const targetId = id || agencyId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
      const result = await service.getAgencyMaids(
        targetId,
        opts.limit ?? limit,
        opts.offset ?? offset
      );
      setMaids(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agencyId, limit, offset]);

  useEffect(() => {
    if (autoFetch && agencyId) {
      fetchMaids(agencyId);
    }
  }, [agencyId, autoFetch, fetchMaids]);

  return {
    maids,
    loading,
    error,
    refetch: fetchMaids,
  };
}

/**
 * Hook for maid verification operations
 */
export function useMaidVerification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const verifyProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
      const result = await service.verifyProfile(id);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
      const result = await service.approveProfile(id);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingVerification = useCallback(async (limit) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
      const result = await service.getPendingVerificationMaids(limit);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    verifyProfile,
    approveProfile,
    getPendingVerification,
    loading,
    error,
  };
}

/**
 * Hook for passport uniqueness check
 */
export function usePassportCheck() {
  const [isUnique, setIsUnique] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const checkPassport = useCallback(async (passportNumber, excludeProfileId) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
      const result = await service.checkPassportUnique(passportNumber, excludeProfileId);
      setIsUnique(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    checkPassport,
    isUnique,
    loading,
    error,
  };
}

/**
 * Hook for profile completion update
 */
export function useProfileCompletion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const updateCompletion = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getMaidProfileService();
      const result = await service.updateProfileCompletion(id);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateCompletion,
    loading,
    error,
  };
}

/**
 * Combined hook for all maid profile operations
 */
export function useMaidProfileService() {
  useEnsureServiceFactory();

  const getService = useCallback(() => {
    return ServiceFactory.getMaidProfileService();
  }, []);

  return {
    getService,
    // Individual operation hooks
    useProfile: useMaidProfile,
    useSearch: useMaidProfileSearch,
    useCreate: useCreateMaidProfile,
    useUpdate: useUpdateMaidProfile,
    useDelete: useDeleteMaidProfile,
    useAgencyMaids,
    useVerification: useMaidVerification,
    usePassportCheck,
    useProfileCompletion,
  };
}
