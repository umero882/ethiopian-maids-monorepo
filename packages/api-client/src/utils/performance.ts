/**
 * GraphQL Performance Monitoring
 *
 * Tracks query execution times, cache hit rates, and network performance
 * for Apollo Client operations.
 *
 * Apollo Client uses zen-observable which is incompatible with RxJS.
 * This implementation uses the native Observable pattern from Apollo.
 */

// React Native global __DEV__ flag - may be undefined in web environments
declare const __DEV__: boolean | undefined;

import { ApolloLink, FetchResult, NextLink, Operation, Observable } from '@apollo/client';

// Check if we're in development mode
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// Performance metrics storage
interface QueryMetric {
  operationName: string;
  operationType: 'query' | 'mutation' | 'subscription';
  startTime: number;
  endTime?: number;
  duration?: number;
  cacheHit: boolean;
  error?: boolean;
  errorMessage?: string;
}

interface PerformanceStats {
  totalQueries: number;
  totalMutations: number;
  totalSubscriptions: number;
  avgQueryTime: number;
  avgMutationTime: number;
  cacheHitRate: number;
  slowQueries: QueryMetric[];
  errorRate: number;
}

// Store recent metrics (keep last 100)
const MAX_METRICS = 100;
const metrics: QueryMetric[] = [];

// Slow query threshold in milliseconds
const SLOW_QUERY_THRESHOLD = 1000;

/**
 * Add a metric to the store
 */
const addMetric = (metric: QueryMetric) => {
  metrics.push(metric);
  if (metrics.length > MAX_METRICS) {
    metrics.shift();
  }
};

/**
 * Performance monitoring Apollo Link
 * Intercepts all GraphQL operations and tracks their performance
 *
 * Uses zen-observable pattern (Apollo's native Observable)
 */
export const performanceLink = new ApolloLink((operation: Operation, forward: NextLink) => {
  const startTime = performance.now();
  const operationName = operation.operationName || 'unknown';
  const operationType = getOperationType(operation);

  // Check if this is from cache
  const context = operation.getContext();
  const fetchPolicy = context.fetchPolicy || 'cache-first';
  const cacheHit = fetchPolicy === 'cache-only' || context.fromCache === true;

  // Use zen-observable pattern - wrap the forward observable
  return new Observable((observer) => {
    const subscription = forward(operation).subscribe({
      next: (result: FetchResult) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        const metric: QueryMetric = {
          operationName,
          operationType,
          startTime,
          endTime,
          duration,
          cacheHit,
          error: !!result.errors,
          errorMessage: result.errors?.[0]?.message,
        };

        addMetric(metric);

        // Log slow queries in development
        if (isDev && duration > SLOW_QUERY_THRESHOLD) {
          console.warn(
            `[Performance] Slow ${operationType}: ${operationName} took ${duration.toFixed(2)}ms`
          );
        }

        // Log all queries in development with timing
        if (isDev) {
          const cacheStatus = cacheHit ? '(cached)' : '(network)';
          console.log(
            `[GraphQL] ${operationType} ${operationName} ${cacheStatus}: ${duration.toFixed(2)}ms`
          );
        }

        observer.next(result);
      },
      error: (error: Error) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        addMetric({
          operationName,
          operationType,
          startTime,
          endTime,
          duration,
          cacheHit: false,
          error: true,
          errorMessage: error.message,
        });

        observer.error(error);
      },
      complete: () => {
        observer.complete();
      },
    });

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  });
});

/**
 * Get operation type from an Apollo operation
 */
function getOperationType(operation: Operation): 'query' | 'mutation' | 'subscription' {
  const definition = operation.query.definitions[0];
  if (definition.kind === 'OperationDefinition') {
    return definition.operation as 'query' | 'mutation' | 'subscription';
  }
  return 'query';
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): PerformanceStats {
  const queries = metrics.filter((m) => m.operationType === 'query');
  const mutations = metrics.filter((m) => m.operationType === 'mutation');
  const subscriptions = metrics.filter((m) => m.operationType === 'subscription');

  const completedMetrics = metrics.filter((m) => m.duration !== undefined);
  const cachedMetrics = completedMetrics.filter((m) => m.cacheHit);
  const errorMetrics = metrics.filter((m) => m.error);

  const avgQueryTime =
    queries.length > 0
      ? queries.reduce((sum, m) => sum + (m.duration || 0), 0) / queries.length
      : 0;

  const avgMutationTime =
    mutations.length > 0
      ? mutations.reduce((sum, m) => sum + (m.duration || 0), 0) / mutations.length
      : 0;

  const slowQueries = completedMetrics.filter(
    (m) => (m.duration || 0) > SLOW_QUERY_THRESHOLD
  );

  return {
    totalQueries: queries.length,
    totalMutations: mutations.length,
    totalSubscriptions: subscriptions.length,
    avgQueryTime,
    avgMutationTime,
    cacheHitRate:
      completedMetrics.length > 0 ? cachedMetrics.length / completedMetrics.length : 0,
    slowQueries,
    errorRate: metrics.length > 0 ? errorMetrics.length / metrics.length : 0,
  };
}

/**
 * Get recent metrics
 */
export function getRecentMetrics(limit = 20): QueryMetric[] {
  return metrics.slice(-limit);
}

/**
 * Clear all metrics
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Log performance report to console
 */
export function logPerformanceReport(): void {
  const stats = getPerformanceStats();

  console.group('GraphQL Performance Report');
  console.log(`Total Queries: ${stats.totalQueries}`);
  console.log(`Total Mutations: ${stats.totalMutations}`);
  console.log(`Total Subscriptions: ${stats.totalSubscriptions}`);
  console.log(`Avg Query Time: ${stats.avgQueryTime.toFixed(2)}ms`);
  console.log(`Avg Mutation Time: ${stats.avgMutationTime.toFixed(2)}ms`);
  console.log(`Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
  console.log(`Error Rate: ${(stats.errorRate * 100).toFixed(1)}%`);

  if (stats.slowQueries.length > 0) {
    console.group('Slow Queries (>' + SLOW_QUERY_THRESHOLD + 'ms)');
    stats.slowQueries.forEach((q) => {
      console.log(`${q.operationName}: ${q.duration?.toFixed(2)}ms`);
    });
    console.groupEnd();
  }

  console.groupEnd();
}

/**
 * Performance monitoring hook for React components
 * Tracks component-level GraphQL performance
 */
export function usePerformanceMonitor(operationName: string) {
  const startTime = performance.now();

  return {
    trackComplete: (cacheHit = false) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      addMetric({
        operationName,
        operationType: 'query',
        startTime,
        endTime,
        duration,
        cacheHit,
      });

      return duration;
    },
    trackError: (error: Error) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      addMetric({
        operationName,
        operationType: 'query',
        startTime,
        endTime,
        duration,
        cacheHit: false,
        error: true,
        errorMessage: error.message,
      });

      return duration;
    },
  };
}

// Export types
export type { QueryMetric, PerformanceStats };
