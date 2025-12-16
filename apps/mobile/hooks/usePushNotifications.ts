/**
 * Push Notifications Hook
 *
 * React hook for managing push notifications including:
 * - Permission handling
 * - Token registration
 * - Notification listeners
 * - Deep linking from notifications
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useApolloClient } from '@apollo/client';

import {
  initializePushNotifications,
  deactivateDeviceToken,
  updateBadgeCount,
  getNotificationChannel,
  PushNotificationState,
  NotificationData,
} from '../services/pushNotifications';

export interface UsePushNotificationsReturn {
  /** Current push notification state */
  state: PushNotificationState;
  /** Whether push notifications are enabled */
  isEnabled: boolean;
  /** Register for push notifications */
  register: () => Promise<void>;
  /** Unregister from push notifications */
  unregister: () => Promise<void>;
  /** Update the app badge count */
  setBadgeCount: (count: number) => Promise<void>;
  /** Last notification received */
  lastNotification: Notifications.Notification | null;
  /** Last notification response (user interaction) */
  lastResponse: Notifications.NotificationResponse | null;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications(userId: string | null): UsePushNotificationsReturn {
  const apolloClient = useApolloClient();
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    isRegistered: false,
    hasPermission: false,
    error: null,
  });
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const [lastResponse, setLastResponse] = useState<Notifications.NotificationResponse | null>(null);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Handle incoming notification while app is foregrounded
   */
  const handleNotificationReceived = useCallback((notification: Notifications.Notification) => {
    console.log('[PushNotifications] Notification received:', notification);
    setLastNotification(notification);

    // You can add custom logic here, like showing an in-app toast
    const data = notification.request.content.data as NotificationData;
    console.log('[PushNotifications] Notification data:', data);
  }, []);

  /**
   * Handle notification response (user tapped on notification)
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    console.log('[PushNotifications] Notification response:', response);
    setLastResponse(response);

    const data = response.notification.request.content.data as NotificationData;

    // Handle navigation based on notification type
    if (data.actionUrl) {
      // Navigate to the specified URL
      router.push(data.actionUrl as any);
      return;
    }

    // Default navigation based on notification type
    switch (data.type) {
      case 'message_received':
        if (data.relatedId) {
          router.push(`/messages/${data.relatedId}` as any);
        } else {
          router.push('/(tabs)/messages' as any);
        }
        break;

      case 'application_received':
      case 'application_reviewed':
      case 'application_shortlisted':
      case 'application_accepted':
      case 'application_rejected':
        if (data.relatedId) {
          router.push(`/agency/applicants` as any);
        }
        break;

      case 'job_posted':
        if (data.relatedId) {
          router.push(`/job/${data.relatedId}` as any);
        }
        break;

      case 'profile_approved':
      case 'profile_rejected':
        router.push('/(tabs)/profile' as any);
        break;

      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'booking_reminder':
        router.push('/sponsor/bookings' as any);
        break;

      default:
        // Navigate to notifications screen
        router.push('/(tabs)/notifications' as any);
        break;
    }
  }, []);

  /**
   * Register for push notifications
   */
  const register = useCallback(async () => {
    if (!userId) {
      console.log('[PushNotifications] No user ID, skipping registration');
      return;
    }

    console.log('[PushNotifications] Registering for push notifications...');
    const newState = await initializePushNotifications(apolloClient, userId);
    setState(newState);
  }, [apolloClient, userId]);

  /**
   * Unregister from push notifications
   */
  const unregister = useCallback(async () => {
    if (!userId) return;

    console.log('[PushNotifications] Unregistering from push notifications...');
    await deactivateDeviceToken(apolloClient, userId);
    setState({
      token: null,
      isRegistered: false,
      hasPermission: false,
      error: null,
    });
  }, [apolloClient, userId]);

  /**
   * Set badge count
   */
  const setBadgeCount = useCallback(async (count: number) => {
    if (!userId) return;

    await updateBadgeCount(apolloClient, userId, count);
  }, [apolloClient, userId]);

  /**
   * Handle app state changes
   */
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App has come to foreground
      console.log('[PushNotifications] App came to foreground');
      // Clear badge when app opens
      Notifications.setBadgeCountAsync(0);
    }
    appStateRef.current = nextAppState;
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    );

    // Listener for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Listen to app state changes
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log('[PushNotifications] App opened from notification:', response);
        handleNotificationResponse(response);
      }
    }).catch(() => {
      // Ignore errors in Expo Go
    });

    return () => {
      // Use .remove() method on subscription objects (works in both Expo Go and dev builds)
      if (notificationListener.current?.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current?.remove) {
        responseListener.current.remove();
      }
      appStateSubscription.remove();
    };
  }, [handleNotificationReceived, handleNotificationResponse, handleAppStateChange]);

  // Register when user ID changes
  useEffect(() => {
    if (userId) {
      register();
    }
  }, [userId, register]);

  return {
    state,
    isEnabled: state.isRegistered && state.hasPermission,
    register,
    unregister,
    setBadgeCount,
    lastNotification,
    lastResponse,
  };
}

export default usePushNotifications;
