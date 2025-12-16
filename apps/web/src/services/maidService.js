/**
 * Maid Service
 *
 * This module exports the GraphQL implementation of maid services.
 * Fully migrated to GraphQL/Hasura - no Supabase dependencies.
 */

import { graphqlMaidService } from './maidService.graphql';
import { createLogger } from '@/utils/logger';

const log = createLogger('MaidService');

/**
 * Main Maid Service - GraphQL implementation
 */
export const maidService = {
  /**
   * Get all maids with optional filtering and pagination
   */
  async getMaids(filters = {}, options = {}) {
    log.debug('Fetching maids via GraphQL', { filters });
    return graphqlMaidService.getMaids(filters, options);
  },

  /**
   * Get a single maid by ID
   */
  async getMaidById(id) {
    log.debug('Fetching maid by ID via GraphQL', { id });
    return graphqlMaidService.getMaidById(id);
  },

  /**
   * Add maid to favorites
   */
  async addToFavorites(userId, maidId) {
    log.debug('Adding to favorites via GraphQL', { userId, maidId });
    return graphqlMaidService.addToFavorites(userId, maidId);
  },

  /**
   * Remove maid from favorites
   */
  async removeFromFavorites(userId, maidId) {
    log.debug('Removing from favorites via GraphQL', { userId, maidId });
    return graphqlMaidService.removeFromFavorites(userId, maidId);
  },

  /**
   * Check if a maid is in user's favorites (legacy method)
   */
  async isFavorite(userId, maidId) {
    log.debug('Checking favorite status via GraphQL', { userId, maidId });
    return graphqlMaidService.isFavorite(userId, maidId);
  },

  /**
   * Batch check favorites for multiple maids
   */
  async getFavoritesForUser(userId, maidIds = []) {
    log.debug('Getting favorites for user via GraphQL', { userId, maidCount: maidIds.length });
    return graphqlMaidService.getFavoritesForUser(userId, maidIds);
  },

  /**
   * Get all user favorites with full maid details
   */
  async getUserFavorites(userId, options = {}) {
    log.debug('Getting user favorites via GraphQL', { userId });
    return graphqlMaidService.getUserFavorites(userId, options);
  },

  /**
   * Update maid profile
   */
  async updateMaidProfile(userId, profileData) {
    log.debug('Updating maid profile via GraphQL', { userId });
    return graphqlMaidService.updateMaidProfile(userId, profileData);
  },

  /**
   * Upload profile picture
   * Note: Uses Firebase Storage via GraphQL service
   */
  async uploadProfilePicture(userId, file) {
    log.debug('Uploading profile picture via GraphQL');
    return graphqlMaidService.uploadProfilePicture?.(userId, file) || { data: null, error: new Error('Not implemented') };
  },

  /**
   * Get signed URLs for all maid profile photos
   */
  async getMaidPhotoUrls(userId, expiresInSeconds = 3600) {
    log.debug('Getting maid photo URLs via GraphQL');
    return graphqlMaidService.getMaidPhotoUrls?.(userId, expiresInSeconds) || { data: [], error: null };
  },

  /**
   * Real-time subscription methods
   * Note: Uses GraphQL subscriptions
   */
  subscribeMaidProfiles(callback, filters = {}) {
    log.debug('Subscribing to maid profiles via GraphQL');
    return graphqlMaidService.subscribeMaidProfiles?.(callback, filters) || (() => {});
  },

  subscribeUserProfile(callback, userId) {
    log.debug('Subscribing to user profile via GraphQL');
    return graphqlMaidService.subscribeUserProfile?.(callback, userId) || (() => {});
  },

  unsubscribeAll() {
    log.debug('Unsubscribing from all');
    return graphqlMaidService.unsubscribeAll?.() || (() => {});
  },
};

export default maidService;
