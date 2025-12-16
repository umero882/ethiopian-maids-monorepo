/**
 * Feature Flags Configuration
 *
 * GraphQL migration is COMPLETE. All services now use GraphQL by default.
 * This file is kept for backwards compatibility but all flags return true.
 *
 * Backend services:
 * - Database: Hasura GraphQL
 * - Authentication: Firebase Auth
 * - File storage: Firebase Storage
 * - Real-time subscriptions: GraphQL Subscriptions via Hasura
 */

import { createLogger } from '@/utils/logger';

const log = createLogger('FeatureFlags');

/**
 * Feature flag states (kept for reference)
 */
export const FEATURE_FLAG_STATE = {
  DISABLED: 'disabled',     // 0% - Feature disabled
  CANARY: 'canary',        // 10% - Test with small subset
  BETA: 'beta',            // 50% - Half of users
  ENABLED: 'enabled',      // 100% - All users
};

/**
 * All GraphQL flags are now ENABLED
 * Migration is complete - all data operations use GraphQL
 */
const GRAPHQL_FLAGS = {
  profiles: FEATURE_FLAG_STATE.ENABLED,
  maids: FEATURE_FLAG_STATE.ENABLED,
  jobs: FEATURE_FLAG_STATE.ENABLED,
  sponsors: FEATURE_FLAG_STATE.ENABLED,
  agencies: FEATURE_FLAG_STATE.ENABLED,
  bookings: FEATURE_FLAG_STATE.ENABLED,
  chat: FEATURE_FLAG_STATE.ENABLED,
  notifications: FEATURE_FLAG_STATE.ENABLED,
  reviews: FEATURE_FLAG_STATE.ENABLED,
  analytics: FEATURE_FLAG_STATE.ENABLED,
};

/**
 * Main feature flags object
 */
export const featureFlags = {
  /**
   * Check if GraphQL should be used for a specific service
   * Always returns true - GraphQL migration is complete
   *
   * @param {string} service - Service name (profiles, maids, jobs, etc.)
   * @param {string} userId - Optional user ID (ignored, kept for API compatibility)
   * @returns {boolean} - Always returns true
   */
  useGraphQL(service, userId = null) {
    // All services now use GraphQL
    return true;
  },

  /**
   * Get all GraphQL flags status
   */
  getGraphQLFlags() {
    return { ...GRAPHQL_FLAGS };
  },

  /**
   * Check rollout percentage for debugging
   * All services are at 100%
   */
  getRolloutPercentage(service) {
    return '100%';
  },

  /**
   * Development helper: Override methods (no-op since migration is complete)
   */
  override: {
    enableAll() {
      log.info('All GraphQL features are already enabled');
    },

    disableAll() {
      log.warn('Cannot disable GraphQL - migration is complete');
    },

    enable(service) {
      log.info(`GraphQL already enabled for ${service}`);
    },

    disable(service) {
      log.warn(`Cannot disable GraphQL for ${service} - migration is complete`);
    },
  },
};

/**
 * Log feature flags on app start (dev only)
 */
if (import.meta.env.DEV) {
  log.info('GraphQL Migration Complete - All services using GraphQL');
  console.group('Feature Flags - GraphQL Migration');
  Object.entries(GRAPHQL_FLAGS).forEach(([service, state]) => {
    console.log(`  ${service}: ${state} (100%)`);
  });
  console.groupEnd();
}

export default featureFlags;
