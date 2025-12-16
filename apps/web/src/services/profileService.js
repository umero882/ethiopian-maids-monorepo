/**
 * Profile Service
 *
 * This module exports the GraphQL implementation of profile services.
 * Supabase fallback has been removed as part of the GraphQL migration.
 */

import { createLogger } from '@/utils/logger';
import * as graphqlProfileService from './profileService.graphql';

const log = createLogger('ProfileService');

// Re-export all GraphQL implementations
export const profileService = {
  /**
   * Get comprehensive profile data for any user type
   */
  async getProfileData(userId, userType) {
    log.debug('Fetching profile data via GraphQL', { userId, userType });
    return graphqlProfileService.getProfileData(userId, userType);
  },

  /**
   * Update profile data
   */
  async updateProfile(userId, userType, profileData) {
    log.debug('Updating profile via GraphQL', { userId, userType });
    return graphqlProfileService.updateProfile(userId, userType, profileData);
  },

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(userId, file) {
    log.debug('Uploading profile picture', { userId });
    return graphqlProfileService.uploadProfilePicture(userId, file);
  },

  /**
   * Get profile completion percentage
   */
  getProfileCompletion(profileData, userType) {
    return graphqlProfileService.getProfileCompletion(profileData, userType);
  },
};

export default profileService;
