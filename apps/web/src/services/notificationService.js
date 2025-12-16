/**
 * Notification Service
 *
 * This module exports the GraphQL implementation of notification services.
 * Supabase has been fully removed - all operations now use GraphQL/Hasura.
 *
 * Real-time subscriptions use GraphQL subscriptions via Hasura.
 */

import { graphqlNotificationService } from './notificationService.graphql';
import { createLogger } from '@/utils/logger';

const log = createLogger('NotificationService');

/**
 * Notification Service - GraphQL implementation
 */
export const notificationService = {
  // ============================================================================
  // QUERY METHODS (GraphQL)
  // ============================================================================

  async getNotification(notificationId) {
    log.debug('Getting notification via GraphQL', { notificationId });
    return graphqlNotificationService.getNotification(notificationId);
  },

  async getUserNotifications(userId, options = {}) {
    log.debug('Getting user notifications via GraphQL', { userId });
    return graphqlNotificationService.getUserNotifications(userId, options);
  },

  async getUnreadCount(userId) {
    log.debug('Getting unread count via GraphQL', { userId });
    return graphqlNotificationService.getUnreadCount(userId);
  },

  async getNotificationsByType(userId, type, options = {}) {
    log.debug('Getting notifications by type via GraphQL', { userId, type });
    return graphqlNotificationService.getNotificationsByType(userId, type, options);
  },

  async getRecentNotifications(userId, limit = 10) {
    log.debug('Getting recent notifications via GraphQL', { userId, limit });
    return graphqlNotificationService.getRecentNotifications(userId, limit);
  },

  // ============================================================================
  // MUTATION METHODS (GraphQL)
  // ============================================================================

  async createNotification(userId, notificationData) {
    log.debug('Creating notification via GraphQL', { userId });
    return graphqlNotificationService.createNotification(userId, notificationData);
  },

  async createMultipleNotifications(notificationsData) {
    log.debug('Creating multiple notifications via GraphQL', { count: notificationsData.length });
    return graphqlNotificationService.createMultipleNotifications(notificationsData);
  },

  async updateNotification(notificationId, updates) {
    log.debug('Updating notification via GraphQL', { notificationId });
    return graphqlNotificationService.updateNotification(notificationId, updates);
  },

  async markAsRead(notificationId) {
    log.debug('Marking notification as read via GraphQL', { notificationId });
    return graphqlNotificationService.markAsRead(notificationId);
  },

  async markMultipleAsRead(notificationIds) {
    log.debug('Marking multiple notifications as read via GraphQL', { count: notificationIds.length });
    return graphqlNotificationService.markMultipleAsRead(notificationIds);
  },

  async markAllAsRead(userId) {
    log.debug('Marking all notifications as read via GraphQL', { userId });
    return graphqlNotificationService.markAllAsRead(userId);
  },

  async markAsUnread(notificationId) {
    log.debug('Marking notification as unread via GraphQL', { notificationId });
    return graphqlNotificationService.markAsUnread(notificationId);
  },

  async deleteNotification(notificationId) {
    log.debug('Deleting notification via GraphQL', { notificationId });
    return graphqlNotificationService.deleteNotification(notificationId);
  },

  async deleteMultipleNotifications(notificationIds) {
    log.debug('Deleting multiple notifications via GraphQL', { count: notificationIds.length });
    return graphqlNotificationService.deleteMultipleNotifications(notificationIds);
  },

  async deleteAllReadNotifications(userId) {
    log.debug('Deleting all read notifications via GraphQL', { userId });
    return graphqlNotificationService.deleteAllReadNotifications(userId);
  },

  // ============================================================================
  // BOOKING NOTIFICATION HELPERS (GraphQL)
  // ============================================================================

  async notifyBookingCreated(booking, maidProfile, sponsorProfile) {
    log.debug('Notifying booking created via GraphQL');
    // Create notification for maid/agency about new booking
    const notificationData = {
      type: 'booking_created',
      title: 'New Booking Request',
      message: `You have received a new booking request from ${sponsorProfile?.full_name || 'a sponsor'}`,
      data: { booking_id: booking.id },
    };
    return this.createNotification(maidProfile?.user_id, notificationData);
  },

  async notifyBookingAccepted(booking, maidProfile) {
    log.debug('Notifying booking accepted via GraphQL');
    const notificationData = {
      type: 'booking_accepted',
      title: 'Booking Accepted',
      message: `Your booking request has been accepted by ${maidProfile?.full_name || 'the agency'}`,
      data: { booking_id: booking.id },
    };
    return this.createNotification(booking.sponsor_id, notificationData);
  },

  async notifyBookingRejected(booking, maidProfile, reason) {
    log.debug('Notifying booking rejected via GraphQL');
    const notificationData = {
      type: 'booking_rejected',
      title: 'Booking Declined',
      message: reason || `Your booking request was declined by ${maidProfile?.full_name || 'the agency'}`,
      data: { booking_id: booking.id },
    };
    return this.createNotification(booking.sponsor_id, notificationData);
  },

  async notifyPaymentReceived(booking, amount, currency) {
    log.debug('Notifying payment received via GraphQL');
    const notificationData = {
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of ${amount} ${currency} has been received for booking`,
      data: { booking_id: booking.id, amount, currency },
    };
    return this.createNotification(booking.agency_id || booking.maid_user_id, notificationData);
  },

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS (GraphQL/Hasura)
  // ============================================================================

  async initialize(user) {
    log.debug('Initializing notifications for user', { userId: user?.uid });
    // Real-time subscriptions handled via Apollo Client subscriptions
    // Initialize any required state here
    return { success: true };
  },

  cleanup() {
    log.debug('Cleaning up notification subscriptions');
    // Cleanup handled by Apollo Client
    return { success: true };
  },

  getStatus() {
    return { connected: true, source: 'graphql' };
  },

  async requestNotificationPermission() {
    log.debug('Requesting browser notification permission');
    if (!('Notification' in window)) {
      return { granted: false, reason: 'not_supported' };
    }

    if (Notification.permission === 'granted') {
      return { granted: true };
    }

    if (Notification.permission === 'denied') {
      return { granted: false, reason: 'denied' };
    }

    const permission = await Notification.requestPermission();
    return { granted: permission === 'granted' };
  },
};

export default notificationService;
