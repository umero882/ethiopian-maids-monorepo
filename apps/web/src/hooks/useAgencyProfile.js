/**
 * useAgencyProfile Hook
 *
 * Custom hook for managing agency profile using GraphQL/Apollo Client.
 * Provides profile retrieval and update operations.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('useAgencyProfile');

// GraphQL queries and mutations
const GET_AGENCY_PROFILE = gql`
  query GetAgencyProfile($agencyId: String!) {
    agency_profiles_by_pk(id: $agencyId) {
      id
      agency_name
      license_number
      license_expiry
      contact_email
      contact_phone
      address
      city
      country
      description
      logo_url
      website
      is_verified
      active_maids
      active_listings
      total_placements
      rating
      created_at
      updated_at
    }
  }
`;

const UPDATE_AGENCY_PROFILE = gql`
  mutation UpdateAgencyProfile($agencyId: String!, $updates: agency_profiles_set_input!) {
    update_agency_profiles_by_pk(pk_columns: { id: $agencyId }, _set: $updates) {
      id
      agency_name
      license_number
      license_expiry
      contact_email
      contact_phone
      address
      city
      country
      description
      logo_url
      website
      updated_at
    }
  }
`;

export const useAgencyProfile = () => {
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  const agencyId = user?.id;

  /**
   * Load agency profile
   */
  const loadProfile = useCallback(async (options = {}) => {
    if (!agencyId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, errors } = await apolloClient.query({
        query: GET_AGENCY_PROFILE,
        variables: { agencyId },
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to load profile');
      }

      const profileData = data?.agency_profiles_by_pk;
      setProfile(profileData);
      log.info('Loaded agency profile:', { agencyId });

      return profileData;

    } catch (err) {
      log.error('Error loading agency profile:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  /**
   * Update agency profile
   */
  const updateProfile = useCallback(async (updates) => {
    if (!agencyId) {
      throw new Error('Agency ID is required');
    }

    try {
      setSaving(true);
      setError(null);

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_AGENCY_PROFILE,
        variables: {
          agencyId,
          updates: {
            ...updates,
            updated_at: new Date().toISOString()
          }
        }
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to update profile');
      }

      const result = data?.update_agency_profiles_by_pk;
      setProfile(result);
      log.info('Updated agency profile successfully');

      // Refresh user profile in auth context if needed
      if (refreshUserProfile) {
        await refreshUserProfile();
      }

      return result;

    } catch (err) {
      log.error('Error updating agency profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [agencyId, refreshUserProfile]);

  /**
   * Update specific fields (convenience method)
   */
  const updateFields = useCallback(async (fields) => {
    return await updateProfile(fields);
  }, [updateProfile]);

  /**
   * Refresh profile
   */
  const refresh = useCallback(() => {
    return loadProfile();
  }, [loadProfile]);

  // Load profile on mount
  useEffect(() => {
    if (agencyId) {
      loadProfile();
    }
  }, [agencyId]); // Only reload when agencyId changes

  // Computed values
  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    // Check required fields are filled
    return !!(profile.agency_name && profile.license_number && profile.contact_email);
  }, [profile]);

  const isLicenseExpiring = useMemo(() => {
    if (!profile?.license_expiry) return false;

    const expiryDate = new Date(profile.license_expiry);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    return daysUntilExpiry > 0 && daysUntilExpiry <= 30; // Expiring within 30 days
  }, [profile?.license_expiry]);

  const isLicenseExpired = useMemo(() => {
    if (!profile?.license_expiry) return false;

    const expiryDate = new Date(profile.license_expiry);
    const today = new Date();

    return expiryDate < today;
  }, [profile?.license_expiry]);

  return {
    // State
    profile,
    loading,
    saving,
    error,

    // Computed
    isProfileComplete,
    isLicenseExpiring,
    isLicenseExpired,

    // Actions
    loadProfile,
    updateProfile,
    updateFields,
    refresh,

    // Utilities
    clearError: () => setError(null)
  };
};
