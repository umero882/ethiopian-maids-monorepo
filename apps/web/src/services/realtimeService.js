/**
 * Real-time Service - MIGRATED TO GRAPHQL
 *
 * This file now re-exports the GraphQL-based realtime service
 * for backwards compatibility.
 *
 * @deprecated Use realtimeService.graphql.js directly
 */

export {
  graphqlRealtimeService as realtimeService,
  GraphQLRealtimeService as RealtimeService,
  graphqlRealtimeService as default,
} from './realtimeService.graphql.js';
