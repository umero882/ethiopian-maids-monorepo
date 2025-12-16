/**
 * Push Notification Service
 *
 * Handles push notification registration, permissions, and token management
 * using Expo Notifications with Firebase Cloud Messaging (FCM).
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { ApolloClient, gql } from '@apollo/client';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// GraphQL mutation to save device token
const REGISTER_DEVICE_TOKEN = gql`
  mutation RegisterDeviceToken($input: device_tokens_insert_input!) {
    insert_device_tokens_one(
      object: $input
      on_conflict: {
        constraint: device_tokens_user_id_device_id_key
        update_columns: [token, platform, last_used_at, app_version, is_active]
      }
    ) {
      id
      user_id
      token
      platform
      created_at
    }
  }
`;

// GraphQL mutation to deactivate device token
const DEACTIVATE_DEVICE_TOKEN = gql`
  mutation DeactivateDeviceToken($userId: String!, $deviceId: String!) {
    update_device_tokens(
      where: { user_id: { _eq: $userId }, device_id: { _eq: $deviceId } }
      _set: { is_active: false }
    ) {
      affected_rows
    }
  }
`;

// GraphQL mutation to update badge count
const UPDATE_BADGE_COUNT = gql`
  mutation UpdateBadgeCount($userId: String!, $deviceId: String!, $badgeCount: Int!) {
    update_device_tokens(
      where: { user_id: { _eq: $userId }, device_id: { _eq: $deviceId } }
      _set: { badge_count: $badgeCount }
    ) {
      affected_rows
    }
  }
`;

export interface PushNotificationState {
  token: string | null;
  isRegistered: boolean;
  hasPermission: boolean;
  error: string | null;
}

export interface NotificationData {
  type?: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  [key: string]: any;
}

/**
 * Check if running in Expo Go (which has limited push notification support)
 */
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Get a unique device identifier
 */
function getDeviceId(): string {
  // Use Constants.installationId or generate a unique ID
  return Constants.installationId || `${Device.modelName}-${Date.now()}`;
}

/**
 * Get the project ID for Expo push notifications
 */
function getProjectId(): string | undefined {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  // Check if it's a placeholder value
  if (projectId === 'your-eas-project-id' || !projectId) {
    console.warn('[PushNotifications] EAS Project ID not configured. Push notifications will not work.');
    return undefined;
  }

  return projectId;
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[PushNotifications] Must use physical device for push notifications');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Permission not granted');
    return false;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await setupAndroidNotificationChannels();
  }

  return true;
}

/**
 * Set up Android notification channels
 */
async function setupAndroidNotificationChannels(): Promise<void> {
  // Default channel for general notifications
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#10B981',
    sound: 'default',
  });

  // Messages channel
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    description: 'Chat and direct message notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3B82F6',
    sound: 'default',
  });

  // Applications channel
  await Notifications.setNotificationChannelAsync('applications', {
    name: 'Applications',
    description: 'Job application updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F59E0B',
    sound: 'default',
  });

  // Bookings channel
  await Notifications.setNotificationChannelAsync('bookings', {
    name: 'Bookings',
    description: 'Booking confirmations and updates',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#8B5CF6',
    sound: 'default',
  });

  // System channel for important alerts
  await Notifications.setNotificationChannelAsync('system', {
    name: 'System Alerts',
    description: 'Important system notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#EF4444',
    sound: 'default',
  });
}

/**
 * Get the Expo push token
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.log('[PushNotifications] Not a physical device, skipping token generation');
      return null;
    }

    const projectId = getProjectId();
    if (!projectId) {
      console.error('[PushNotifications] Project ID not found');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('[PushNotifications] Got push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('[PushNotifications] Error getting push token:', error);
    return null;
  }
}

/**
 * Register device token with the server
 */
export async function registerDeviceToken(
  apolloClient: ApolloClient<any>,
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const deviceId = getDeviceId();
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    const result = await apolloClient.mutate({
      mutation: REGISTER_DEVICE_TOKEN,
      variables: {
        input: {
          user_id: userId,
          device_id: deviceId,
          token,
          platform: Platform.OS,
          device_name: Device.modelName || 'Unknown',
          app_version: appVersion,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
      },
    });

    console.log('[PushNotifications] Device token registered:', result.data);
    return true;
  } catch (error) {
    console.error('[PushNotifications] Error registering device token:', error);
    return false;
  }
}

/**
 * Deactivate device token (on logout)
 */
export async function deactivateDeviceToken(
  apolloClient: ApolloClient<any>,
  userId: string
): Promise<boolean> {
  try {
    const deviceId = getDeviceId();

    await apolloClient.mutate({
      mutation: DEACTIVATE_DEVICE_TOKEN,
      variables: {
        userId,
        deviceId,
      },
    });

    console.log('[PushNotifications] Device token deactivated');
    return true;
  } catch (error) {
    console.error('[PushNotifications] Error deactivating device token:', error);
    return false;
  }
}

/**
 * Update badge count on server
 */
export async function updateBadgeCount(
  apolloClient: ApolloClient<any>,
  userId: string,
  count: number
): Promise<void> {
  try {
    const deviceId = getDeviceId();

    await apolloClient.mutate({
      mutation: UPDATE_BADGE_COUNT,
      variables: {
        userId,
        deviceId,
        badgeCount: count,
      },
    });

    // Also set local badge
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('[PushNotifications] Error updating badge count:', error);
  }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
    },
    trigger: trigger || null, // null = immediate
  });

  return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get the number of delivered notifications
 */
export async function getDeliveredNotifications(): Promise<Notifications.Notification[]> {
  return await Notifications.getPresentedNotificationsAsync();
}

/**
 * Dismiss all delivered notifications
 */
export async function dismissAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification channel for a notification type
 */
export function getNotificationChannel(type?: string): string {
  switch (type) {
    case 'message_received':
      return 'messages';
    case 'application_received':
    case 'application_reviewed':
    case 'application_shortlisted':
    case 'application_accepted':
    case 'application_rejected':
      return 'applications';
    case 'booking_confirmed':
    case 'booking_cancelled':
    case 'booking_reminder':
      return 'bookings';
    case 'system_announcement':
    case 'profile_approved':
    case 'profile_rejected':
      return 'system';
    default:
      return 'default';
  }
}

/**
 * Initialize push notifications for the app
 */
export async function initializePushNotifications(
  apolloClient: ApolloClient<any>,
  userId: string
): Promise<PushNotificationState> {
  const state: PushNotificationState = {
    token: null,
    isRegistered: false,
    hasPermission: false,
    error: null,
  };

  try {
    // Check if running in Expo Go - push notifications have limited support
    if (isExpoGo()) {
      console.log('[PushNotifications] Running in Expo Go - push notifications are limited. Use a development build for full functionality.');
      state.error = 'Push notifications not available in Expo Go';
      return state;
    }

    // Check if project ID is configured
    if (!getProjectId()) {
      state.error = 'EAS Project ID not configured';
      return state;
    }

    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    state.hasPermission = hasPermission;

    if (!hasPermission) {
      state.error = 'Notification permission not granted';
      return state;
    }

    // Get push token
    const token = await getExpoPushToken();
    state.token = token;

    if (!token) {
      state.error = 'Failed to get push token';
      return state;
    }

    // Register with server
    const registered = await registerDeviceToken(apolloClient, userId, token);
    state.isRegistered = registered;

    if (!registered) {
      state.error = 'Failed to register device token';
    }

    console.log('[PushNotifications] Initialization complete:', state);
    return state;
  } catch (error) {
    console.error('[PushNotifications] Initialization error:', error);
    state.error = error instanceof Error ? error.message : 'Unknown error';
    return state;
  }
}
