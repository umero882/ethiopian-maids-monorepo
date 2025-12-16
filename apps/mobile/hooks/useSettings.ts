/**
 * useSettings Hook
 *
 * Hook for managing user settings - combines local storage settings
 * with profile data from GraphQL.
 */

import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from './useAuth';

// Storage keys
const SETTINGS_KEY = 'user_settings';

// Get profile by email
const GET_PROFILE = gql`
  query GetProfile($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
      full_name
      phone
      avatar_url
      user_type
      created_at
    }
  }
`;

// Update profile
const UPDATE_PROFILE = gql`
  mutation UpdateProfile(
    $userId: String!
    $full_name: String
    $phone: String
    $avatarUrl: String
  ) {
    update_profiles_by_pk(
      pk_columns: { id: $userId }
      _set: {
        full_name: $full_name
        phone: $phone
        avatar_url: $avatarUrl
      }
    ) {
      id
      full_name
      phone
      avatar_url
    }
  }
`;

// Types
export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  bookingAlerts: boolean;
  messageAlerts: boolean;
  promotionalEmails: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showPhoneNumber: boolean;
  showEmail: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
}

export interface AppSettings {
  language: string;
  theme: 'light' | 'dark' | 'system';
  biometricLock: boolean;
  autoPlayVideos: boolean;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  app: AppSettings;
}

export interface ProfileData {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  user_type?: string;
}

// Default settings
const defaultSettings: UserSettings = {
  notifications: {
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: true,
    bookingAlerts: true,
    messageAlerts: true,
    promotionalEmails: false,
  },
  privacy: {
    profileVisibility: 'public',
    showPhoneNumber: false,
    showEmail: false,
    showOnlineStatus: true,
    allowDirectMessages: true,
  },
  app: {
    language: 'en',
    theme: 'system',
    biometricLock: false,
    autoPlayVideos: true,
  },
};

/**
 * Hook for managing local app settings (stored in SecureStore)
 */
export function useLocalSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings from storage
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const storedSettings = await SecureStore.getItemAsync(SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        // Merge with defaults to handle new settings
        setSettings({
          notifications: { ...defaultSettings.notifications, ...parsed.notifications },
          privacy: { ...defaultSettings.privacy, ...parsed.privacy },
          app: { ...defaultSettings.app, ...parsed.app },
        });
      }
    } catch (err) {
      console.error('[Settings] Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings to storage
  const saveSettings = useCallback(async (newSettings: UserSettings) => {
    try {
      await SecureStore.setItemAsync(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      return true;
    } catch (err) {
      console.error('[Settings] Error saving settings:', err);
      setError('Failed to save settings');
      return false;
    }
  }, []);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (
    updates: Partial<NotificationSettings>
  ) => {
    const newSettings = {
      ...settings,
      notifications: { ...settings.notifications, ...updates },
    };
    return saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Update privacy settings
  const updatePrivacySettings = useCallback(async (
    updates: Partial<PrivacySettings>
  ) => {
    const newSettings = {
      ...settings,
      privacy: { ...settings.privacy, ...updates },
    };
    return saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Update app settings
  const updateAppSettings = useCallback(async (
    updates: Partial<AppSettings>
  ) => {
    const newSettings = {
      ...settings,
      app: { ...settings.app, ...updates },
    };
    return saveSettings(newSettings);
  }, [settings, saveSettings]);

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    return saveSettings(defaultSettings);
  }, [saveSettings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateNotificationSettings,
    updatePrivacySettings,
    updateAppSettings,
    resetSettings,
    reload: loadSettings,
  };
}

/**
 * Hook for managing profile settings (stored in database)
 */
export function useProfileSettings() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile
  const {
    data,
    loading: profileLoading,
    error,
    refetch,
  } = useQuery(GET_PROFILE, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    fetchPolicy: 'cache-and-network',
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  const profile: ProfileData | null = data?.profiles?.[0] || null;

  // Update mutation
  const [updateProfileMutation, { loading: updating }] = useMutation(UPDATE_PROFILE);

  // Update profile
  const updateProfile = useCallback(async (updates: {
    full_name?: string;
    phone?: string;
    avatarUrl?: string;
  }) => {
    if (!profileId) {
      throw new Error('Profile not found');
    }

    try {
      const result = await updateProfileMutation({
        variables: {
          userId: profileId,
          full_name: updates.full_name,
          phone: updates.phone,
          avatarUrl: updates.avatarUrl,
        },
      });

      await refetch();
      return result.data?.update_profiles_by_pk;
    } catch (err) {
      console.error('[Settings] Error updating profile:', err);
      throw err;
    }
  }, [profileId, updateProfileMutation, refetch]);

  return {
    profile,
    loading: profileLoading,
    updating,
    error,
    updateProfile,
    refetch,
    profileId,
  };
}

/**
 * Combined settings hook
 */
export function useSettings() {
  const localSettings = useLocalSettings();
  const profileSettings = useProfileSettings();

  return {
    // Local settings
    settings: localSettings.settings,
    settingsLoading: localSettings.loading,
    updateNotificationSettings: localSettings.updateNotificationSettings,
    updatePrivacySettings: localSettings.updatePrivacySettings,
    updateAppSettings: localSettings.updateAppSettings,
    resetSettings: localSettings.resetSettings,

    // Profile settings
    profile: profileSettings.profile,
    profileLoading: profileSettings.loading,
    profileUpdating: profileSettings.updating,
    updateProfile: profileSettings.updateProfile,

    // Combined
    loading: localSettings.loading || profileSettings.loading,
    refetch: profileSettings.refetch,
  };
}

/**
 * Available languages
 */
export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'or', name: 'Oromo', nativeName: 'Afaan Oromoo' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ' },
];

/**
 * Theme options
 */
export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System Default' },
];
