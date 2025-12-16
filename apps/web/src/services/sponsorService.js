/**
 * Sponsor Service
 *
 * This module exports the GraphQL implementation of sponsor services.
 * Fully migrated to GraphQL/Hasura - no Supabase dependencies.
 * Booking operations use the dedicated bookingService.
 */

import { graphqlSponsorService } from './sponsorService.graphql';
import { bookingService } from './bookingService';
import { createLogger } from '@/utils/logger';

const log = createLogger('SponsorService');

/**
 * Sponsor Service - GraphQL implementation
 */
export const sponsorService = {

  // ============================================================================
  // SPONSOR PROFILE OPERATIONS (GraphQL)
  // ============================================================================

  /**
   * Get sponsor profile by user ID
   */
  async getSponsorProfile(userId) {
    log.debug('Fetching sponsor profile via GraphQL', { userId });
    return graphqlSponsorService.getSponsorProfile(userId);
  },

  /**
   * Create sponsor profile
   */
  async createSponsorProfile(userId, profileData) {
    log.debug('Creating sponsor profile via GraphQL', { userId });
    return graphqlSponsorService.createSponsorProfile(userId, profileData);
  },

  /**
   * Update sponsor profile
   */
  async updateSponsorProfile(userId, profileData) {
    log.debug('Updating sponsor profile via GraphQL', { userId });
    return graphqlSponsorService.updateSponsorProfile(userId, profileData);
  },

  // ============================================================================
  // FAVORITES OPERATIONS (GraphQL)
  // ============================================================================

  /**
   * Add maid to favorites
   */
  async addToFavorites(maidId, notes = '') {
    log.debug('Adding to favorites via GraphQL', { maidId });
    return graphqlSponsorService.addToFavorites(maidId, notes);
  },

  /**
   * Remove maid from favorites
   */
  async removeFromFavorites(maidId) {
    log.debug('Removing from favorites via GraphQL', { maidId });
    return graphqlSponsorService.removeFromFavorites(maidId);
  },

  /**
   * Check if maid is favorited
   */
  async checkIfFavorited(maidId) {
    log.debug('Checking favorite status via GraphQL', { maidId });
    return graphqlSponsorService.checkIfFavorited(maidId);
  },

  /**
   * Get all favorites
   */
  async getFavorites() {
    log.debug('Getting favorites via GraphQL');
    return graphqlSponsorService.getFavorites();
  },

  // ============================================================================
  // MAID SEARCH OPERATIONS (GraphQL)
  // ============================================================================

  /**
   * Search for maids with filters
   */
  async searchMaids(filters = {}) {
    log.debug('Searching maids via GraphQL', { filters });
    return graphqlSponsorService.searchMaids(filters);
  },

  /**
   * Get maid profile with stats
   */
  async getMaidProfile(maidId) {
    log.debug('Getting maid profile via GraphQL', { maidId });
    return graphqlSponsorService.getMaidProfile(maidId);
  },

  /**
   * Get recommended maids
   */
  async getRecommendedMaids(limit = 10) {
    log.debug('Getting recommended maids via GraphQL', { limit });
    return graphqlSponsorService.getRecommendedMaids(limit);
  },

  // ============================================================================
  // DASHBOARD STATS (GraphQL)
  // ============================================================================

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    log.debug('Getting dashboard stats via GraphQL');
    return graphqlSponsorService.getDashboardStats();
  },

  // ============================================================================
  // PROFILE METADATA OPERATIONS (GraphQL)
  // ============================================================================

  /**
   * Upload avatar (hybrid: storage in Supabase, URL update via GraphQL)
   */
  async uploadAvatar(userId, file) {
    log.debug('[Hybrid] Uploading avatar', { userId });
    return graphqlSponsorService.uploadAvatar(userId, file);
  },

  /**
   * Get sponsor completion data from profiles table
   */
  async getSponsorCompletionData(userId) {
    log.debug('Getting sponsor completion data via GraphQL', { userId });
    return graphqlSponsorService.getSponsorCompletionData(userId);
  },

  /**
   * Update sponsor completion data
   */
  async updateSponsorCompletionData(userId, completionData) {
    log.debug('Updating sponsor completion data via GraphQL', { userId });
    return graphqlSponsorService.updateSponsorCompletionData(userId, completionData);
  },

  // ============================================================================
  // BOOKING OPERATIONS (Delegated to bookingService - GraphQL)
  // ============================================================================

  async createBookingRequest(bookingData) {
    log.debug('Creating booking request via GraphQL');
    return bookingService.createBookingRequest(bookingData);
  },

  async createBooking(bookingData) {
    log.debug('Creating booking via GraphQL');
    return bookingService.createBooking(bookingData);
  },

  async getBookingDetails(bookingId) {
    log.debug('Getting booking details via GraphQL', { bookingId });
    return bookingService.getBookingById(bookingId);
  },

  async cancelBooking(bookingId, reason = '') {
    log.debug('Cancelling booking via GraphQL', { bookingId });
    return bookingService.cancelBookingRequest(bookingId);
  },

  async updateBookingPayment(bookingId, paymentData) {
    log.debug('Updating booking payment via GraphQL', { bookingId });
    return bookingService.updateBookingRequest(bookingId, paymentData);
  },

  async getBookings(status = null) {
    log.debug('Getting bookings via GraphQL', { status });
    // Get user ID from Firebase Auth
    const { auth } = await import('@/lib/firebaseClient');
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return { data: null, error: new Error('Not authenticated') };
    }
    return bookingService.getSponsorBookings(currentUser.uid, { status });
  },

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS (GraphQL subscriptions)
  // ============================================================================

  subscribeSponsorProfile(callback, userId) {
    log.debug('Subscribing to sponsor profile via GraphQL', { userId });
    return graphqlSponsorService.subscribeSponsorProfile?.(callback, userId) || (() => {});
  },

  subscribeUserProfile(callback, userId) {
    log.debug('Subscribing to user profile via GraphQL', { userId });
    return graphqlSponsorService.subscribeUserProfile?.(callback, userId) || (() => {});
  },

  unsubscribeAll() {
    log.debug('Unsubscribing from all');
    return graphqlSponsorService.unsubscribeAll?.() || (() => {});
  },
};

export default sponsorService;
