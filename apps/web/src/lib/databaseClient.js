/**
 * Database Client - GraphQL/Hasura Interface
 *
 * This module provides the unified database interface using:
 * - Apollo Client for GraphQL queries/mutations to Hasura
 * - Firebase Auth for authentication
 *
 * All data operations should use the Apollo Client directly or through
 * the service layer (e.g., profileService.graphql.js, maidService.graphql.js)
 */

import { apolloClient } from '@ethio/api-client';
import { auth, getIdToken, refreshIdToken, clearStoredToken, getStoredToken } from './firebaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('DatabaseClient');

// Export Apollo client as primary database interface
const database = apolloClient;

log.info('Database client initialized with Hasura GraphQL');
log.debug('Using Apollo Client for all database operations');

// Re-export Firebase auth utilities for convenience
export { auth, getIdToken, refreshIdToken, clearStoredToken, getStoredToken };

// Export Apollo client
export { apolloClient };

export default database;
