// Export Apollo Client and utilities
export {
  apolloClient,
  resetApolloCache,
  refetchActiveQueries,
  updateCacheAfterMutation,
  evictFromCache,
  readFromCache,
  setAuthToken,
} from './client';

// Export all generated hooks (includes types, documents, and subscription hooks)
// Note: hooks.ts contains ALL hooks including subscription hooks, so we don't need
// to separately export from subscription-hooks.ts or subscriptions.ts
export * from './generated/hooks';

// Export Relay connection hooks and types
// Note: graphql-relay.js exports types, hooks-relay.js exports hooks
// We only export hooks-relay since it re-exports the necessary types
export * from './generated/hooks-relay';

// Export Relay pagination utilities
export * from './utils/relay';

// Export performance monitoring utilities
export {
  getPerformanceStats,
  getRecentMetrics,
  clearMetrics,
  logPerformanceReport,
  usePerformanceMonitor,
  type QueryMetric,
  type PerformanceStats,
} from './utils/performance';
