/**
 * Real-time Dashboard Updates Hook - MIGRATED TO GRAPHQL
 *
 * This file re-exports the GraphQL-based hooks for backwards compatibility.
 *
 * @deprecated Use useDashboardRealtime.graphql.js directly
 */

export {
  useMaidDashboardRealtime,
  useAgencyDashboardRealtime,
  useSponsorDashboardRealtime,
} from './useDashboardRealtime.graphql.js';
