/**
 * Notification Settings Service
 * Handles user notification preferences using GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('NotificationSettings');

// GraphQL Queries and Mutations
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

// Default notification settings
const DEFAULT_SETTINGS = {
  email_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  in_app_enabled: true,
  email_frequency: 'instant', // 'instant', 'daily', 'weekly'
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
export const NOTIFICATION_TYPE_LABELS = {
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

export const notificationSettingsService = {
  /**
   * Get notification settings for a user
   */
  async getSettings(userId) {
    try {
      log.info('Fetching notification settings for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GET_NOTIFICATION_SETTINGS,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const settings = data?.notification_settings?.[0];

      if (!settings) {
        // Return default settings if none exist
        log.info('No settings found, returning defaults');
        return { data: { ...DEFAULT_SETTINGS, user_id: userId }, error: null };
      }

      log.info('Settings fetched successfully');
      return { data: settings, error: null };
    } catch (error) {
      log.error('Error fetching notification settings:', error);
      // Return defaults on error
      return { data: { ...DEFAULT_SETTINGS, user_id: userId }, error };
    }
  },

  /**
   * Save notification settings for a user
   */
  async saveSettings(userId, settings) {
    try {
      log.info('Saving notification settings for user:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UPSERT_NOTIFICATION_SETTINGS,
        variables: {
          userId,
          emailEnabled: settings.email_enabled ?? DEFAULT_SETTINGS.email_enabled,
          pushEnabled: settings.push_enabled ?? DEFAULT_SETTINGS.push_enabled,
          smsEnabled: settings.sms_enabled ?? DEFAULT_SETTINGS.sms_enabled,
          inAppEnabled: settings.in_app_enabled ?? DEFAULT_SETTINGS.in_app_enabled,
          emailFrequency: settings.email_frequency ?? DEFAULT_SETTINGS.email_frequency,
          quietHoursEnabled: settings.quiet_hours_enabled ?? DEFAULT_SETTINGS.quiet_hours_enabled,
          quietHoursStart: settings.quiet_hours_start ?? DEFAULT_SETTINGS.quiet_hours_start,
          quietHoursEnd: settings.quiet_hours_end ?? DEFAULT_SETTINGS.quiet_hours_end,
          notificationTypes: settings.notification_types ?? DEFAULT_SETTINGS.notification_types,
        },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const savedSettings = data?.insert_notification_settings_one;
      log.info('Settings saved successfully');
      return { data: savedSettings, error: null };
    } catch (error) {
      log.error('Error saving notification settings:', error);
      return { data: null, error };
    }
  },

  /**
   * Update specific notification settings
   */
  async updateSettings(userId, updates) {
    try {
      log.info('Updating notification settings for user:', userId);

      const { data, errors } = await apolloClient.mutate({
        mutation: UPDATE_NOTIFICATION_SETTINGS,
        variables: { userId, updates },
      });

      if (errors && errors.length > 0) {
        throw new Error(errors[0].message);
      }

      const updatedSettings = data?.update_notification_settings?.returning?.[0];
      log.info('Settings updated successfully');
      return { data: updatedSettings, error: null };
    } catch (error) {
      log.error('Error updating notification settings:', error);
      return { data: null, error };
    }
  },

  /**
   * Toggle a specific channel (email, push, sms, in_app)
   */
  async toggleChannel(userId, channel, enabled) {
    const channelKey = `${channel}_enabled`;
    return this.updateSettings(userId, { [channelKey]: enabled });
  },

  /**
   * Update notification type preferences
   */
  async updateNotificationTypePreference(userId, currentSettings, notificationType, channel, enabled) {
    const notificationTypes = { ...currentSettings.notification_types };

    if (!notificationTypes[notificationType]) {
      notificationTypes[notificationType] = { email: true, push: true, inApp: true };
    }

    notificationTypes[notificationType][channel] = enabled;

    return this.updateSettings(userId, { notification_types: notificationTypes });
  },

  /**
   * Set quiet hours
   */
  async setQuietHours(userId, enabled, startTime, endTime) {
    return this.updateSettings(userId, {
      quiet_hours_enabled: enabled,
      quiet_hours_start: startTime,
      quiet_hours_end: endTime,
    });
  },

  /**
   * Check if user should receive notification (based on quiet hours)
   */
  isInQuietHours(settings) {
    if (!settings.quiet_hours_enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { quiet_hours_start, quiet_hours_end } = settings;

    // Handle overnight quiet hours (e.g., 22:00 - 07:00)
    if (quiet_hours_start > quiet_hours_end) {
      return currentTime >= quiet_hours_start || currentTime <= quiet_hours_end;
    }

    return currentTime >= quiet_hours_start && currentTime <= quiet_hours_end;
  },

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return { ...DEFAULT_SETTINGS };
  },
};

export default notificationSettingsService;
