/**
 * useNotificationSettings Hook
 *
 * Manages user notification preferences synced with web.
 * Provides settings for email, push, SMS, in-app notifications,
 * quiet hours, and per-type preferences.
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from './useAuth';

// GraphQL Queries
const GET_NOTIFICATION_SETTINGS = gql`
  query GetNotificationSettings($userId: String!) {
    notification_settings(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      user_id
      email_enabled
      push_enabled
      sms_enabled
      in_app_enabled
      email_frequency
      quiet_hours_enabled
      quiet_hours_start
      quiet_hours_end
      notification_types
      created_at
      updated_at
    }
  }
`;

// GraphQL Mutations
const UPSERT_NOTIFICATION_SETTINGS = gql`
  mutation UpsertNotificationSettings(
    $userId: String!
    $emailEnabled: Boolean
    $pushEnabled: Boolean
    $smsEnabled: Boolean
    $inAppEnabled: Boolean
    $emailFrequency: String
    $quietHoursEnabled: Boolean
    $quietHoursStart: String
    $quietHoursEnd: String
    $notificationTypes: jsonb
  ) {
    insert_notification_settings_one(
      object: {
        user_id: $userId
        email_enabled: $emailEnabled
        push_enabled: $pushEnabled
        sms_enabled: $smsEnabled
        in_app_enabled: $inAppEnabled
        email_frequency: $emailFrequency
        quiet_hours_enabled: $quietHoursEnabled
        quiet_hours_start: $quietHoursStart
        quiet_hours_end: $quietHoursEnd
        notification_types: $notificationTypes
      }
      on_conflict: {
        constraint: notification_settings_user_id_key
        update_columns: [
          email_enabled
          push_enabled
          sms_enabled
          in_app_enabled
          email_frequency
          quiet_hours_enabled
          quiet_hours_start
          quiet_hours_end
          notification_types
          updated_at
        ]
      }
    ) {
      id
      user_id
      email_enabled
      push_enabled
      sms_enabled
      in_app_enabled
      email_frequency
      quiet_hours_enabled
      quiet_hours_start
      quiet_hours_end
      notification_types
    }
  }
`;

const UPDATE_NOTIFICATION_SETTINGS = gql`
  mutation UpdateNotificationSettings($userId: String!, $updates: notification_settings_set_input!) {
    update_notification_settings(
      where: { user_id: { _eq: $userId } }
      _set: $updates
    ) {
      affected_rows
      returning {
        id
        email_enabled
        push_enabled
        sms_enabled
        in_app_enabled
        email_frequency
        quiet_hours_enabled
        quiet_hours_start
        quiet_hours_end
        notification_types
      }
    }
  }
`;

// Types
export interface NotificationTypePreference {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface NotificationTypes {
  [key: string]: NotificationTypePreference;
}

export interface NotificationSettings {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  email_frequency: 'instant' | 'daily' | 'weekly';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_types: NotificationTypes;
  created_at?: string;
  updated_at?: string;
}

// Default notification settings (matches web)
export const DEFAULT_SETTINGS: Omit<NotificationSettings, 'user_id'> = {
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
  email_frequency: 'instant',
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
  notification_types: {
    application_received: { email: true, push: true, inApp: true },
    application_accepted: { email: true, push: true, inApp: true },
    application_rejected: { email: true, push: false, inApp: true },
    message_received: { email: false, push: true, inApp: true },
    booking_created: { email: true, push: true, inApp: true },
    booking_accepted: { email: true, push: true, inApp: true },
    booking_rejected: { email: true, push: true, inApp: true },
    profile_approved: { email: true, push: true, inApp: true },
    profile_rejected: { email: true, push: true, inApp: true },
    job_posted: { email: true, push: false, inApp: true },
    payment_received: { email: true, push: true, inApp: true },
    system_announcement: { email: true, push: false, inApp: true },
  },
};

// Notification type labels for UI
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  application_received: 'Application Received',
  application_accepted: 'Application Accepted',
  application_rejected: 'Application Rejected',
  application_reviewed: 'Application Reviewed',
  application_shortlisted: 'Application Shortlisted',
  message_received: 'New Messages',
  booking_created: 'New Booking Requests',
  booking_accepted: 'Booking Accepted',
  booking_rejected: 'Booking Rejected',
  profile_approved: 'Profile Approved',
  profile_rejected: 'Profile Rejected',
  job_posted: 'New Job Postings',
  job_closed: 'Job Closed',
  payment_received: 'Payment Received',
  system_announcement: 'System Announcements',
};

// Notification type categories for grouping
export const NOTIFICATION_CATEGORIES = {
  applications: {
    label: 'Applications',
    types: ['application_received', 'application_accepted', 'application_rejected', 'application_reviewed', 'application_shortlisted'],
  },
  messages: {
    label: 'Messages & Communication',
    types: ['message_received'],
  },
  bookings: {
    label: 'Bookings',
    types: ['booking_created', 'booking_accepted', 'booking_rejected'],
  },
  profile: {
    label: 'Profile & Account',
    types: ['profile_approved', 'profile_rejected'],
  },
  jobs: {
    label: 'Jobs',
    types: ['job_posted', 'job_closed'],
  },
  payments: {
    label: 'Payments',
    types: ['payment_received'],
  },
  system: {
    label: 'System',
    types: ['system_announcement'],
  },
};

export type ChannelType = 'email' | 'push' | 'sms' | 'in_app';
export type EmailFrequency = 'instant' | 'daily' | 'weekly';

export interface UseNotificationSettingsReturn {
  settings: NotificationSettings | null;
  loading: boolean;
  error: Error | null;
  saving: boolean;
  // Channel toggles
  toggleChannel: (channel: ChannelType, enabled: boolean) => Promise<void>;
  // Email frequency
  setEmailFrequency: (frequency: EmailFrequency) => Promise<void>;
  // Quiet hours
  setQuietHours: (enabled: boolean, start?: string, end?: string) => Promise<void>;
  // Per-type preferences
  updateTypePreference: (
    notificationType: string,
    channel: 'email' | 'push' | 'inApp',
    enabled: boolean
  ) => Promise<void>;
  // Full save
  saveSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  // Reset to defaults
  resetToDefaults: () => Promise<void>;
  // Refresh
  refresh: () => Promise<void>;
  // Utility functions
  isInQuietHours: () => boolean;
  shouldNotify: (type: string, channel: 'email' | 'push' | 'inApp') => boolean;
}

export function useNotificationSettings(): UseNotificationSettingsReturn {
  const { user } = useAuth();
  const userId = user?.uid;

  const [saving, setSaving] = useState(false);

  // Query settings
  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(GET_NOTIFICATION_SETTINGS, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Mutations
  const [upsertSettings] = useMutation(UPSERT_NOTIFICATION_SETTINGS);
  const [updateSettings] = useMutation(UPDATE_NOTIFICATION_SETTINGS);

  // Get settings from query or use defaults
  const settings: NotificationSettings | null = data?.notification_settings?.[0]
    ? data.notification_settings[0]
    : userId
    ? { ...DEFAULT_SETTINGS, user_id: userId }
    : null;

  /**
   * Toggle a notification channel
   */
  const toggleChannel = useCallback(async (channel: ChannelType, enabled: boolean) => {
    if (!userId) return;

    setSaving(true);
    try {
      const channelKey = `${channel}_enabled`;
      await updateSettings({
        variables: {
          userId,
          updates: { [channelKey]: enabled },
        },
      });
      await refetch();
    } catch (err) {
      console.error('Error toggling channel:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, updateSettings, refetch]);

  /**
   * Set email frequency
   */
  const setEmailFrequency = useCallback(async (frequency: EmailFrequency) => {
    if (!userId) return;

    setSaving(true);
    try {
      await updateSettings({
        variables: {
          userId,
          updates: { email_frequency: frequency },
        },
      });
      await refetch();
    } catch (err) {
      console.error('Error setting email frequency:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, updateSettings, refetch]);

  /**
   * Set quiet hours
   */
  const setQuietHours = useCallback(async (
    enabled: boolean,
    start?: string,
    end?: string
  ) => {
    if (!userId) return;

    setSaving(true);
    try {
      const updates: Record<string, any> = { quiet_hours_enabled: enabled };
      if (start) updates.quiet_hours_start = start;
      if (end) updates.quiet_hours_end = end;

      await updateSettings({
        variables: { userId, updates },
      });
      await refetch();
    } catch (err) {
      console.error('Error setting quiet hours:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, updateSettings, refetch]);

  /**
   * Update per-type notification preference
   */
  const updateTypePreference = useCallback(async (
    notificationType: string,
    channel: 'email' | 'push' | 'inApp',
    enabled: boolean
  ) => {
    if (!userId || !settings) return;

    setSaving(true);
    try {
      const notificationTypes = { ...settings.notification_types };

      if (!notificationTypes[notificationType]) {
        notificationTypes[notificationType] = { email: true, push: true, inApp: true };
      }

      notificationTypes[notificationType][channel] = enabled;

      await updateSettings({
        variables: {
          userId,
          updates: { notification_types: notificationTypes },
        },
      });
      await refetch();
    } catch (err) {
      console.error('Error updating type preference:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, settings, updateSettings, refetch]);

  /**
   * Save full settings
   */
  const saveSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    if (!userId) return;

    setSaving(true);
    try {
      const mergedSettings = { ...DEFAULT_SETTINGS, ...settings, ...newSettings };

      await upsertSettings({
        variables: {
          userId,
          emailEnabled: mergedSettings.email_enabled,
          pushEnabled: mergedSettings.push_enabled,
          smsEnabled: mergedSettings.sms_enabled,
          inAppEnabled: mergedSettings.in_app_enabled,
          emailFrequency: mergedSettings.email_frequency,
          quietHoursEnabled: mergedSettings.quiet_hours_enabled,
          quietHoursStart: mergedSettings.quiet_hours_start,
          quietHoursEnd: mergedSettings.quiet_hours_end,
          notificationTypes: mergedSettings.notification_types,
        },
      });
      await refetch();
    } catch (err) {
      console.error('Error saving settings:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [userId, settings, upsertSettings, refetch]);

  /**
   * Reset to default settings
   */
  const resetToDefaults = useCallback(async () => {
    await saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  /**
   * Refresh settings
   */
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  /**
   * Check if currently in quiet hours
   */
  const isInQuietHours = useCallback(() => {
    if (!settings?.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { quiet_hours_start, quiet_hours_end } = settings;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (quiet_hours_start > quiet_hours_end) {
      return currentTime >= quiet_hours_start || currentTime <= quiet_hours_end;
    }

    return currentTime >= quiet_hours_start && currentTime <= quiet_hours_end;
  }, [settings]);

  /**
   * Check if should notify for a specific type and channel
   */
  const shouldNotify = useCallback((type: string, channel: 'email' | 'push' | 'inApp'): boolean => {
    if (!settings) return true;

    // Check if channel is globally enabled
    const channelEnabled = channel === 'email'
      ? settings.email_enabled
      : channel === 'push'
      ? settings.push_enabled
      : settings.in_app_enabled;

    if (!channelEnabled) return false;

    // Check quiet hours (only for push)
    if (channel === 'push' && isInQuietHours()) return false;

    // Check per-type preference
    const typePrefs = settings.notification_types?.[type];
    if (!typePrefs) return true; // Default to enabled if not configured

    return typePrefs[channel] ?? true;
  }, [settings, isInQuietHours]);

  return {
    settings,
    loading,
    error: error as Error | null,
    saving,
    toggleChannel,
    setEmailFrequency,
    setQuietHours,
    updateTypePreference,
    saveSettings,
    resetToDefaults,
    refresh,
    isInQuietHours,
    shouldNotify,
  };
}

export default useNotificationSettings;
