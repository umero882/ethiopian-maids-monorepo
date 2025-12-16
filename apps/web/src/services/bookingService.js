/**
 * Booking Service
 *
 * This module exports the GraphQL implementation of booking services.
 * Supabase fallback has been removed as part of the GraphQL migration.
 */

import { graphqlBookingService } from './bookingService.graphql';
import { createLogger } from '@/utils/logger';

const log = createLogger('BookingService');

/**
 * Main Booking Service - GraphQL implementation
 */
export const bookingService = {
  /**
   * Create a booking request
   */
  async createBookingRequest(bookingData) {
    log.info('Creating booking request via GraphQL');

    // Get sponsor ID from Firebase Auth
    const { auth } = await import('@/lib/firebaseClient');
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return { data: null, error: new Error('Not authenticated') };
    }

    return graphqlBookingService.createBookingRequest(currentUser.uid, bookingData);
  },

  /**
   * Get a booking by ID
   */
  async getBookingById(bookingId) {
    log.info('Getting booking by ID via GraphQL', { bookingId });
    return graphqlBookingService.getBookingById(bookingId);
  },

  /**
   * Get all bookings for a sponsor
   */
  async getSponsorBookings(sponsorId, options = {}) {
    log.info('Getting bookings for sponsor via GraphQL', { sponsorId });
    return graphqlBookingService.getSponsorBookings(sponsorId, options);
  },

  /**
   * Update a booking request
   */
  async updateBookingRequest(bookingId, updates) {
    log.info('Updating booking via GraphQL', { bookingId });
    return graphqlBookingService.updateBookingRequest(bookingId, updates);
  },

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status) {
    log.info('Updating booking status via GraphQL', { bookingId, status });
    return graphqlBookingService.updateBookingStatus(bookingId, status);
  },

  /**
   * Accept a booking request
   */
  async acceptBookingRequest(bookingId) {
    log.info('Accepting booking via GraphQL', { bookingId });
    return graphqlBookingService.acceptBookingRequest(bookingId);
  },

  /**
   * Reject a booking request
   */
  async rejectBookingRequest(bookingId, rejectionReason = null) {
    log.info('Rejecting booking via GraphQL', { bookingId });
    return graphqlBookingService.rejectBookingRequest(bookingId, rejectionReason);
  },

  /**
   * Cancel a booking request
   */
  async cancelBookingRequest(bookingId) {
    log.info('Cancelling booking via GraphQL', { bookingId });
    return graphqlBookingService.cancelBookingRequest(bookingId);
  },

  /**
   * Delete a booking request
   */
  async deleteBookingRequest(bookingId) {
    log.info('Deleting booking via GraphQL', { bookingId });
    return graphqlBookingService.deleteBookingRequest(bookingId);
  },

  /**
   * Legacy method - createBooking (alias for createBookingRequest)
   */
  async createBooking(bookingData) {
    return this.createBookingRequest(bookingData);
  },
};

export default bookingService;
