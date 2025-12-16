/**
 * Real-time Dashboard Updates Hook - GraphQL Implementation
 * Uses Apollo Client subscriptions via Hasura WebSocket
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

// =====================================================
// GRAPHQL SUBSCRIPTION DOCUMENTS
// =====================================================

const SUBSCRIBE_MAID_BOOKINGS = gql`
  subscription SubscribeMaidBookings($maidId: String!) {
    booking_requests(
      where: { maid_id: { _eq: $maidId } }
      order_by: { updated_at: desc }
      limit: 1
    ) {
      id
      status
      updated_at
    }
  }
`;

const SUBSCRIBE_USER_NOTIFICATIONS = gql`
  subscription SubscribeUserNotifications($userId: String!) {
    notifications(
      where: { user_id: { _eq: $userId } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      read
      created_at
    }
  }
`;

const SUBSCRIBE_MAID_PROFILE = gql`
  subscription SubscribeMaidProfile($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      updated_at
    }
  }
`;

const SUBSCRIBE_AGENCY_MAIDS = gql`
  subscription SubscribeAgencyMaids($agencyId: String!) {
    maid_profiles(
      where: { agency_id: { _eq: $agencyId } }
      order_by: { updated_at: desc }
      limit: 1
    ) {
      id
      updated_at
    }
  }
`;

// Note: agency_jobs uses uuid for agency_id which is incompatible with Firebase String UIDs
// Subscribe to agency_profiles changes instead for real-time updates
const SUBSCRIBE_AGENCY_PROFILE = gql`
  subscription SubscribeAgencyProfile($agencyId: String!) {
    agency_profiles_by_pk(id: $agencyId) {
      id
      active_listings
      active_maids
      updated_at
    }
  }
`;

const SUBSCRIBE_SPONSOR_BOOKINGS = gql`
  subscription SubscribeSponsorBookings($sponsorId: String!) {
    booking_requests(
      where: { sponsor_id: { _eq: $sponsorId } }
      order_by: { updated_at: desc }
      limit: 1
    ) {
      id
      status
      updated_at
    }
  }
`;

const SUBSCRIBE_SPONSOR_FAVORITES = gql`
  subscription SubscribeSponsorFavorites($sponsorId: String!) {
    favorites(
      where: { sponsor_id: { _eq: $sponsorId } }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      created_at
    }
  }
`;

// =====================================================
// HOOKS
// =====================================================

/**
 * Real-time subscription hook for Maid Dashboard
 * @param {string} userId - The maid user ID
 * @param {function} onStatsUpdate - Callback when stats change
 */
export const useMaidDashboardRealtime = (userId, onStatsUpdate) => {
  const subscriptionsRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);

  const setupSubscriptions = useCallback(() => {
    if (!userId) return;

    // Clean up existing subscriptions
    subscriptionsRef.current.forEach(sub => sub.unsubscribe());
    subscriptionsRef.current = [];

    try {
      // Subscribe to booking_requests changes
      const bookingsObservable = apolloClient.subscribe({
        query: SUBSCRIBE_MAID_BOOKINGS,
        variables: { maidId: userId },
      });
      const bookingsSub = bookingsObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Bookings subscription error:', err),
      });

      // Subscribe to notifications changes
      const notificationsObservable = apolloClient.subscribe({
        query: SUBSCRIBE_USER_NOTIFICATIONS,
        variables: { userId },
      });
      const notificationsSub = notificationsObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Notifications subscription error:', err),
      });

      // Subscribe to maid_profiles changes
      const profileObservable = apolloClient.subscribe({
        query: SUBSCRIBE_MAID_PROFILE,
        variables: { userId },
      });
      const profileSub = profileObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Profile subscription error:', err),
      });

      subscriptionsRef.current = [bookingsSub, notificationsSub, profileSub];
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to setup maid dashboard subscriptions:', error);
      setIsConnected(false);
    }
  }, [userId, onStatsUpdate]);

  useEffect(() => {
    setupSubscriptions();

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
      setIsConnected(false);
    };
  }, [setupSubscriptions]);

  return { isConnected };
};

/**
 * Real-time subscription hook for Agency Dashboard
 * @param {string} userId - The agency user ID
 * @param {function} onStatsUpdate - Callback when stats change
 */
export const useAgencyDashboardRealtime = (userId, onStatsUpdate) => {
  const subscriptionsRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);

  const setupSubscriptions = useCallback(() => {
    if (!userId) return;

    subscriptionsRef.current.forEach(sub => sub.unsubscribe());
    subscriptionsRef.current = [];

    try {
      // Subscribe to maid_profiles changes
      const maidsObservable = apolloClient.subscribe({
        query: SUBSCRIBE_AGENCY_MAIDS,
        variables: { agencyId: userId },
      });
      const maidsSub = maidsObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Maids subscription error:', err),
      });

      // Subscribe to agency profile changes (for jobs/listings count updates)
      const profileObservable = apolloClient.subscribe({
        query: SUBSCRIBE_AGENCY_PROFILE,
        variables: { agencyId: userId },
      });
      const profileSub = profileObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Agency profile subscription error:', err),
      });

      // Subscribe to notifications
      const notificationsObservable = apolloClient.subscribe({
        query: SUBSCRIBE_USER_NOTIFICATIONS,
        variables: { userId },
      });
      const notificationsSub = notificationsObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Notifications subscription error:', err),
      });

      subscriptionsRef.current = [maidsSub, profileSub, notificationsSub];
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to setup agency dashboard subscriptions:', error);
      setIsConnected(false);
    }
  }, [userId, onStatsUpdate]);

  useEffect(() => {
    setupSubscriptions();

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
      setIsConnected(false);
    };
  }, [setupSubscriptions]);

  return { isConnected };
};

/**
 * Real-time subscription hook for Sponsor Dashboard
 * @param {string} userId - The sponsor user ID
 * @param {function} onStatsUpdate - Callback when stats change
 */
export const useSponsorDashboardRealtime = (userId, onStatsUpdate) => {
  const subscriptionsRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);

  const setupSubscriptions = useCallback(() => {
    if (!userId) return;

    subscriptionsRef.current.forEach(sub => sub.unsubscribe());
    subscriptionsRef.current = [];

    try {
      // Subscribe to booking_requests changes
      const bookingsObservable = apolloClient.subscribe({
        query: SUBSCRIBE_SPONSOR_BOOKINGS,
        variables: { sponsorId: userId },
      });
      const bookingsSub = bookingsObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Bookings subscription error:', err),
      });

      // Subscribe to favorites changes
      const favoritesObservable = apolloClient.subscribe({
        query: SUBSCRIBE_SPONSOR_FAVORITES,
        variables: { sponsorId: userId },
      });
      const favoritesSub = favoritesObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Favorites subscription error:', err),
      });

      // Subscribe to notifications
      const notificationsObservable = apolloClient.subscribe({
        query: SUBSCRIBE_USER_NOTIFICATIONS,
        variables: { userId },
      });
      const notificationsSub = notificationsObservable.subscribe({
        next: () => onStatsUpdate?.(),
        error: (err) => console.error('Notifications subscription error:', err),
      });

      subscriptionsRef.current = [bookingsSub, favoritesSub, notificationsSub];
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to setup sponsor dashboard subscriptions:', error);
      setIsConnected(false);
    }
  }, [userId, onStatsUpdate]);

  useEffect(() => {
    setupSubscriptions();

    return () => {
      subscriptionsRef.current.forEach(sub => sub.unsubscribe());
      subscriptionsRef.current = [];
      setIsConnected(false);
    };
  }, [setupSubscriptions]);

  return { isConnected };
};
