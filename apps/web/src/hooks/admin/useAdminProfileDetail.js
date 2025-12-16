/**
 * useAdminProfileDetail Hook
 * Manages admin profile detail page state and CRUD operations
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminProfileService } from '@/services/adminProfileService';
import { createLogger } from '@/utils/logger';
import { toast } from '@/components/ui/use-toast';

const log = createLogger('useAdminProfileDetail');

/**
 * Main hook for admin profile detail management
 * Provides full CRUD operations for any user profile
 */
export function useAdminProfileDetail(profileId) {
  const navigate = useNavigate();

  // Core state
  const [profile, setProfile] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editing state for each section
  const [editingSection, setEditingSection] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});

  // Determine profile type from data
  const profileType = useMemo(() => {
    if (!profile) return null;
    const userType = profile.user_type?.toLowerCase();
    if (userType === 'maid' || profile.maid_profile) return 'maid';
    if (userType === 'agency' || profile.agency_profile) return 'agency';
    if (userType === 'sponsor' || profile.sponsor_profile) return 'sponsor';
    if (userType === 'admin' || userType === 'super_admin') return 'admin';
    return 'unknown';
  }, [profile]);

  // Get role-specific profile data
  const roleProfile = useMemo(() => {
    if (!profile) return null;
    switch (profileType) {
      case 'maid':
        return profile.maid_profile;
      case 'agency':
        return profile.agency_profile;
      case 'sponsor':
        return profile.sponsor_profile;
      default:
        return null;
    }
  }, [profile, profileType]);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!profileId) {
      setError(new Error('Profile ID is required'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await adminProfileService.getProfileById(profileId);

      if (result.error) {
        throw result.error;
      }

      if (!result.data) {
        throw new Error('Profile not found');
      }

      setProfile(result.data);
      log.info(`Fetched profile: ${result.data.full_name || result.data.email}`);
    } catch (err) {
      log.error('Error fetching profile:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  // Fetch activity logs
  const fetchActivityLogs = useCallback(async () => {
    if (!profileId) return;

    try {
      const result = await adminProfileService.getActivityLogs(profileId);
      if (!result.error) {
        setActivityLogs(result.data);
      }
    } catch (err) {
      log.error('Error fetching activity logs:', err);
    }
  }, [profileId]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Start editing a section
  const startEditing = useCallback((sectionId, initialData = {}) => {
    setEditingSection(sectionId);
    setPendingChanges(initialData);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingSection(null);
    setPendingChanges({});
  }, []);

  // Update pending changes
  const updateField = useCallback((field, value) => {
    setPendingChanges(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Check if there are pending changes
  const hasChanges = useMemo(() => {
    return Object.keys(pendingChanges).length > 0;
  }, [pendingChanges]);

  // Save base profile changes
  const saveProfileChanges = useCallback(async (data = pendingChanges) => {
    if (!profileId) return { error: new Error('Profile ID required') };

    setIsSaving(true);
    try {
      const result = await adminProfileService.updateProfile(profileId, data);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        ...result.data,
      }));

      setEditingSection(null);
      setPendingChanges({});

      toast({
        title: 'Profile updated',
        description: 'Changes have been saved successfully.',
      });

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error saving profile:', err);
      toast({
        title: 'Save failed',
        description: err.message || 'Failed to save changes.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, [profileId, pendingChanges]);

  // Save maid profile changes
  const saveMaidProfileChanges = useCallback(async (data = pendingChanges) => {
    if (!profile?.maid_profile?.id) {
      return { error: new Error('Maid profile ID not found') };
    }

    setIsSaving(true);
    try {
      const result = await adminProfileService.updateMaidProfile(profile.maid_profile.id, data);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        maid_profile: {
          ...prev.maid_profile,
          ...result.data,
        },
      }));

      setEditingSection(null);
      setPendingChanges({});

      toast({
        title: 'Maid profile updated',
        description: 'Changes have been saved successfully.',
      });

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error saving maid profile:', err);
      toast({
        title: 'Save failed',
        description: err.message || 'Failed to save changes.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, [profile?.maid_profile?.id, pendingChanges]);

  // Save agency profile changes
  const saveAgencyProfileChanges = useCallback(async (data = pendingChanges) => {
    if (!profile?.agency_profile?.id) {
      return { error: new Error('Agency profile ID not found') };
    }

    setIsSaving(true);
    try {
      const result = await adminProfileService.updateAgencyProfile(profile.agency_profile.id, data);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        agency_profile: {
          ...prev.agency_profile,
          ...result.data,
        },
      }));

      setEditingSection(null);
      setPendingChanges({});

      toast({
        title: 'Agency profile updated',
        description: 'Changes have been saved successfully.',
      });

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error saving agency profile:', err);
      toast({
        title: 'Save failed',
        description: err.message || 'Failed to save changes.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, [profile?.agency_profile?.id, pendingChanges]);

  // Save sponsor profile changes
  const saveSponsorProfileChanges = useCallback(async (data = pendingChanges) => {
    if (!profile?.sponsor_profile?.id) {
      return { error: new Error('Sponsor profile ID not found') };
    }

    setIsSaving(true);
    try {
      const result = await adminProfileService.updateSponsorProfile(profile.sponsor_profile.id, data);

      if (result.error) {
        throw result.error;
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        sponsor_profile: {
          ...prev.sponsor_profile,
          ...result.data,
        },
      }));

      setEditingSection(null);
      setPendingChanges({});

      toast({
        title: 'Sponsor profile updated',
        description: 'Changes have been saved successfully.',
      });

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error saving sponsor profile:', err);
      toast({
        title: 'Save failed',
        description: err.message || 'Failed to save changes.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, [profile?.sponsor_profile?.id, pendingChanges]);

  // Toggle profile active status
  const toggleActiveStatus = useCallback(async () => {
    if (!profileId) return { error: new Error('Profile ID required') };

    const newStatus = !profile?.is_active;

    setIsSaving(true);
    try {
      const result = await adminProfileService.toggleProfileActive(profileId, newStatus);

      if (result.error) {
        throw result.error;
      }

      setProfile(prev => ({
        ...prev,
        is_active: newStatus,
      }));

      toast({
        title: newStatus ? 'Account activated' : 'Account deactivated',
        description: newStatus
          ? 'User can now access their account.'
          : 'User can no longer access their account.',
      });

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error toggling active status:', err);
      toast({
        title: 'Action failed',
        description: err.message || 'Failed to update account status.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, [profileId, profile?.is_active]);

  // Delete profile
  const deleteProfile = useCallback(async () => {
    if (!profileId) return { error: new Error('Profile ID required') };

    setIsSaving(true);
    try {
      const result = await adminProfileService.deleteProfile(profileId);

      if (result.error) {
        throw result.error;
      }

      toast({
        title: 'Profile deleted',
        description: 'The profile has been permanently deleted.',
      });

      // Navigate back to profiles list
      navigate('/admin/content/profiles');

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error deleting profile:', err);
      toast({
        title: 'Delete failed',
        description: err.message || 'Failed to delete profile.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, [profileId, navigate]);

  // Change verification status
  const changeVerificationStatus = useCallback(async (status) => {
    if (!profileId) return { error: new Error('Profile ID required') };

    setIsSaving(true);
    try {
      const result = await adminProfileService.changeVerificationStatus(profileId, status);

      if (result.error) {
        throw result.error;
      }

      setProfile(prev => ({
        ...prev,
        verification_status: status,
      }));

      toast({
        title: 'Verification status updated',
        description: `Status changed to ${status}.`,
      });

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error changing verification status:', err);
      toast({
        title: 'Update failed',
        description: err.message || 'Failed to change verification status.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, [profileId]);

  // Update subscription status
  const updateSubscription = useCallback(async (status) => {
    if (!profileId) return { error: new Error('Profile ID required') };

    setIsSaving(true);
    try {
      const result = await adminProfileService.updateSubscription(profileId, status);

      if (result.error) {
        throw result.error;
      }

      setProfile(prev => ({
        ...prev,
        subscription_status: status,
      }));

      toast({
        title: 'Subscription updated',
        description: `Subscription status changed to ${status}.`,
      });

      return { data: result.data, error: null };
    } catch (err) {
      log.error('Error updating subscription:', err);
      toast({
        title: 'Update failed',
        description: err.message || 'Failed to update subscription.',
        variant: 'destructive',
      });
      return { data: null, error: err };
    } finally {
      setIsSaving(false);
    }
  }, [profileId]);

  // Export profile data
  const exportProfile = useCallback(() => {
    if (!profile) return;
    adminProfileService.exportProfileAsJson(profile);
    toast({
      title: 'Export complete',
      description: 'Profile data has been downloaded.',
    });
  }, [profile]);

  // Refresh all data
  const refresh = useCallback(() => {
    fetchProfile();
    fetchActivityLogs();
  }, [fetchProfile, fetchActivityLogs]);

  return {
    // Core data
    profile,
    profileType,
    roleProfile,
    activityLogs,

    // State
    loading,
    error,
    isSaving,

    // Editing state
    editingSection,
    pendingChanges,
    hasChanges,

    // Editing actions
    startEditing,
    cancelEditing,
    updateField,

    // Save operations
    saveProfileChanges,
    saveMaidProfileChanges,
    saveAgencyProfileChanges,
    saveSponsorProfileChanges,

    // Profile actions
    toggleActiveStatus,
    deleteProfile,
    changeVerificationStatus,
    updateSubscription,
    exportProfile,

    // Refresh
    refresh,
    fetchActivityLogs,
  };
}

/**
 * Hook for using URL params to get profile ID
 */
export function useAdminProfileDetailWithParams() {
  const { profileId } = useParams();
  return useAdminProfileDetail(profileId);
}

export default useAdminProfileDetail;
