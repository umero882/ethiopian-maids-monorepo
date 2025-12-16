/**
 * useSponsorProfile Hook
 * React hooks for Sponsor Profile operations using ServiceFactory
 */

import { useState, useCallback, useEffect } from 'react';
import { useEnsureServiceFactory, ServiceFactory } from './useServiceFactory';

/**
 * Hook for fetching a single sponsor profile
 */
export function useSponsorProfile(profileId) {
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
      const service = ServiceFactory.getSponsorProfileService();
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
 * Hook for searching sponsor profiles
 */
export function useSponsorProfileSearch() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const search = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getSponsorProfileService();
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
 * Hook for creating a sponsor profile
 */
export function useCreateSponsorProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [createdProfile, setCreatedProfile] = useState(null);

  useEnsureServiceFactory();

  const createProfile = useCallback(async (data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getSponsorProfileService();
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
 * Hook for updating a sponsor profile
 */
export function useUpdateSponsorProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedProfile, setUpdatedProfile] = useState(null);

  useEnsureServiceFactory();

  const updateProfile = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getSponsorProfileService();
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
 * Hook for deleting a sponsor profile
 */
export function useDeleteSponsorProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const deleteProfile = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getSponsorProfileService();
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
 * Hook for managing favorite maids
 */
export function useFavoriteMaids(sponsorId) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEnsureServiceFactory();

  const fetchFavorites = useCallback(async (id) => {
    const targetId = id || sponsorId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getSponsorProfileService();
      const result = await service.getFavoriteMaids(targetId);
      setFavorites(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sponsorId]);

  const addFavorite = useCallback(async (maidId) => {
    if (!sponsorId) throw new Error('Sponsor ID is required');

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getSponsorProfileService();
      await service.addFavoriteMaid(sponsorId, maidId);
      // Refetch favorites after adding
      await fetchFavorites(sponsorId);
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sponsorId, fetchFavorites]);

  const removeFavorite = useCallback(async (maidId) => {
    if (!sponsorId) throw new Error('Sponsor ID is required');

    setLoading(true);
    setError(null);

    try {
      const service = ServiceFactory.getSponsorProfileService();
      await service.removeFavoriteMaid(sponsorId, maidId);
      // Update local state
      setFavorites((prev) => prev.filter((id) => id !== maidId));
      return true;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sponsorId]);

  const isFavorite = useCallback((maidId) => {
    return favorites.includes(maidId);
  }, [favorites]);

  const toggleFavorite = useCallback(async (maidId) => {
    if (isFavorite(maidId)) {
      return removeFavorite(maidId);
    } else {
      return addFavorite(maidId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  useEffect(() => {
    if (sponsorId) {
      fetchFavorites(sponsorId);
    }
  }, [sponsorId, fetchFavorites]);

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
  };
}

/**
 * Combined hook for all sponsor profile operations
 */
export function useSponsorProfileService() {
  useEnsureServiceFactory();

  const getService = useCallback(() => {
    return ServiceFactory.getSponsorProfileService();
  }, []);

  return {
    getService,
    // Individual operation hooks
    useProfile: useSponsorProfile,
    useSearch: useSponsorProfileSearch,
    useCreate: useCreateSponsorProfile,
    useUpdate: useUpdateSponsorProfile,
    useDelete: useDeleteSponsorProfile,
    useFavorites: useFavoriteMaids,
  };
}
