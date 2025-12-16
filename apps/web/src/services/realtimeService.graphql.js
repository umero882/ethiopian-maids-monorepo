/**
 * Real-time Service - GraphQL Subscriptions Implementation
 * Uses Apollo Client WebSocket subscriptions via Hasura
 *
 * MIGRATED FROM SUPABASE REALTIME TO HASURA GRAPHQL SUBSCRIPTIONS
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('RealtimeService.GraphQL');

// =====================================================
// GRAPHQL SUBSCRIPTION DOCUMENTS
// =====================================================

const SUBSCRIBE_MAID_PROFILES = gql`
  subscription SubscribeMaidProfiles($agencyId: String) {
    maid_profiles(
      where: { agency_id: { _eq: $agencyId } }
      order_by: { updated_at: desc }
    ) {
      id
      user_id
      full_name
      profile_photo_url
      availability_status
      skills
      languages
      is_available
      updated_at
    }
  }
`;

const SUBSCRIBE_USER_PROFILE = gql`
  subscription SubscribeUserProfile($userId: String!) {
    profiles_by_pk(id: $userId) {
      id
      name
      email
      phone
      user_type
      avatar_url
      updated_at
    }
  }
`;

const SUBSCRIBE_AGENCY_PROFILE = gql`
  subscription SubscribeAgencyProfile($userId: String!) {
    agency_profiles_by_pk(id: $userId) {
      id
      full_name
      verification_status
      total_maids
      active_listings
      updated_at
    }
  }
`;

const SUBSCRIBE_SPONSOR_PROFILE = gql`
  subscription SubscribeSponsorProfile($userId: String!) {
    sponsor_profiles_by_pk(id: $userId) {
      id
      full_name
      city
      country
      updated_at
    }
  }
`;

const SUBSCRIBE_NOTIFICATIONS = gql`
  subscription SubscribeNotifications($userId: String!) {
    notifications(
      where: { user_id: { _eq: $userId }, read: { _eq: false } }
      order_by: { created_at: desc }
      limit: 10
    ) {
      id
      title
      message
      type
      read
      created_at
    }
  }
`;

const SUBSCRIBE_MESSAGES = gql`
  subscription SubscribeMessages($conversationId: uuid!) {
    messages(
      where: { conversation_id: { _eq: $conversationId } }
      order_by: { created_at: desc }
      limit: 50
    ) {
      id
      sender_id
      content
      created_at
      read_at
    }
  }
`;

// =====================================================
// REALTIME SERVICE CLASS
// =====================================================

class GraphQLRealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.isConnected = false;

    this.setupConnectionMonitoring();
  }

  /**
   * Setup connection monitoring using Firebase Auth
   */
  setupConnectionMonitoring() {
    if (auth) {
      auth.onAuthStateChanged((user) => {
        if (user) {
          this.isConnected = true;
          log.info('Real-time service connected (Firebase Auth)');
        } else {
          this.isConnected = false;
          this.cleanup();
          log.info('Real-time service disconnected');
        }
      });
    }

    // Handle network connectivity
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.isConnected) {
          log.info('Network restored, subscriptions will auto-reconnect');
        }
      });

      window.addEventListener('offline', () => {
        log.warn('Real-time service offline');
      });
    }
  }

  /**
   * Subscribe to maid profile changes
   */
  subscribeMaidProfiles(callback, filters = {}) {
    const subscriptionKey = 'maid_profiles';

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const observable = apolloClient.subscribe({
      query: SUBSCRIBE_MAID_PROFILES,
      variables: { agencyId: filters.agencyId || null },
    });

    const subscription = observable.subscribe({
      next: ({ data }) => {
        log.debug('Maid profiles update:', data);
        callback({
          eventType: 'UPDATE',
          data: data?.maid_profiles || [],
        });
      },
      error: (error) => {
        log.error('Maid profiles subscription error:', error);
      },
    });

    this.subscriptions.set(subscriptionKey, subscription);
    log.info('Subscribed to maid profile changes');

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to user profile changes
   */
  subscribeUserProfiles(callback, userId) {
    const subscriptionKey = `user_profile_${userId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const observable = apolloClient.subscribe({
      query: SUBSCRIBE_USER_PROFILE,
      variables: { userId },
    });

    const subscription = observable.subscribe({
      next: ({ data }) => {
        log.debug('User profile update:', data);
        callback({
          eventType: 'UPDATE',
          new: data?.profiles_by_pk,
        });
      },
      error: (error) => {
        log.error('User profile subscription error:', error);
      },
    });

    this.subscriptions.set(subscriptionKey, subscription);
    log.info('Subscribed to user profile changes');

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to agency profile changes
   */
  subscribeAgencyProfiles(callback, userId) {
    const subscriptionKey = `agency_profile_${userId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const observable = apolloClient.subscribe({
      query: SUBSCRIBE_AGENCY_PROFILE,
      variables: { userId },
    });

    const subscription = observable.subscribe({
      next: ({ data }) => {
        log.debug('Agency profile update:', data);
        callback({
          eventType: 'UPDATE',
          new: data?.agency_profiles?.[0] || null,
        });
      },
      error: (error) => {
        log.error('Agency profile subscription error:', error);
      },
    });

    this.subscriptions.set(subscriptionKey, subscription);
    log.info('Subscribed to agency profile changes');

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to sponsor profile changes
   */
  subscribeSponsorProfiles(callback, userId) {
    const subscriptionKey = `sponsor_profile_${userId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const observable = apolloClient.subscribe({
      query: SUBSCRIBE_SPONSOR_PROFILE,
      variables: { userId },
    });

    const subscription = observable.subscribe({
      next: ({ data }) => {
        log.debug('Sponsor profile update:', data);
        callback({
          eventType: 'UPDATE',
          new: data?.sponsor_profiles?.[0] || null,
        });
      },
      error: (error) => {
        log.error('Sponsor profile subscription error:', error);
      },
    });

    this.subscriptions.set(subscriptionKey, subscription);
    log.info('Subscribed to sponsor profile changes');

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to notifications
   */
  subscribeNotifications(callback, userId) {
    const subscriptionKey = `notifications_${userId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const observable = apolloClient.subscribe({
      query: SUBSCRIBE_NOTIFICATIONS,
      variables: { userId },
    });

    const subscription = observable.subscribe({
      next: ({ data }) => {
        log.debug('Notifications update:', data);
        callback({
          eventType: 'UPDATE',
          notifications: data?.notifications || [],
        });
      },
      error: (error) => {
        log.error('Notifications subscription error:', error);
      },
    });

    this.subscriptions.set(subscriptionKey, subscription);
    log.info('Subscribed to notifications');

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to messages in a conversation
   */
  subscribeMessages(callback, conversationId) {
    const subscriptionKey = `messages_${conversationId}`;

    if (this.subscriptions.has(subscriptionKey)) {
      this.unsubscribe(subscriptionKey);
    }

    const observable = apolloClient.subscribe({
      query: SUBSCRIBE_MESSAGES,
      variables: { conversationId },
    });

    const subscription = observable.subscribe({
      next: ({ data }) => {
        log.debug('Messages update:', data);
        callback({
          eventType: 'UPDATE',
          messages: data?.messages || [],
        });
      },
      error: (error) => {
        log.error('Messages subscription error:', error);
      },
    });

    this.subscriptions.set(subscriptionKey, subscription);
    log.info('Subscribed to messages');

    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      log.debug(`Unsubscribed from ${subscriptionKey}`);
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
      log.debug(`Cleaned up subscription: ${key}`);
    });

    this.subscriptions.clear();
    log.info('All subscriptions cleaned up');
  }

  /**
   * Get subscription status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      activeSubscriptions: Array.from(this.subscriptions.keys()),
    };
  }
}

// Create singleton instance
export const graphqlRealtimeService = new GraphQLRealtimeService();

// Also export as realtimeService for backwards compatibility
export const realtimeService = graphqlRealtimeService;

export { GraphQLRealtimeService };
export default graphqlRealtimeService;
