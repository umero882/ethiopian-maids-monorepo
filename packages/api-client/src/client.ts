import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, FieldPolicy } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { createClient } from 'graphql-ws';
import { relayStylePagination } from '@apollo/client/utilities';
import { performanceLink } from './utils/performance';

// Declare window for environments where it might not exist
declare const window: (Window & typeof globalThis & { localStorage?: { getItem(key: string): string | null; setItem(key: string, value: string): void } }) | undefined;

// React Native global __DEV__ flag
declare const __DEV__: boolean | undefined;

// Vite's import.meta.env type declaration
declare const import_meta_env: Record<string, string | undefined> | undefined;

/**
 * Environment configuration - works in both web (Vite) and React Native (Expo)
 *
 * For Vite: Uses process.env.VITE_* (configured via vite.config.js define)
 * For Expo: Uses process.env.EXPO_PUBLIC_* (standard Expo convention)
 *
 * Priority order:
 * 1. Vite environment variables (process.env.VITE_*)
 * 2. Expo environment variables (process.env.EXPO_PUBLIC_*)
 * 3. Fallback value
 */
const getEnvVar = (viteKey: string, expoKey: string, fallback: string): string => {
  // Try process.env which works in both Vite (with define config) and Expo
  if (typeof process !== 'undefined' && process.env) {
    // Try Vite key first (web)
    if (process.env[viteKey]) {
      return process.env[viteKey] as string;
    }
    // Try Expo key (mobile)
    if (process.env[expoKey]) {
      return process.env[expoKey] as string;
    }
  }

  // Fallback value
  return fallback;
};

// =====================================================
// API Configuration
// =====================================================
// NOTE: Default endpoints point to VPS Hasura (api.ethiopianmaids.com)
// The OLD Hasura Cloud endpoint (ethio-maids-01.hasura.app) is deprecated
// =====================================================

const HASURA_GRAPHQL_ENDPOINT = getEnvVar(
  'VITE_HASURA_GRAPHQL_ENDPOINT',
  'EXPO_PUBLIC_HASURA_GRAPHQL_ENDPOINT',
  'https://api.ethiopianmaids.com/v1/graphql'  // VPS Hasura endpoint
);

const HASURA_WS_ENDPOINT = getEnvVar(
  'VITE_HASURA_WS_ENDPOINT',
  'EXPO_PUBLIC_HASURA_WS_ENDPOINT',
  'wss://api.ethiopianmaids.com/v1/graphql'    // VPS Hasura WebSocket endpoint
);

// SECURITY: Admin secret must NEVER be used in client apps.
// All client authentication uses JWT tokens from Firebase Auth.
// Admin secret is only for server-side tools (Firebase Functions, migration scripts).

// Log the endpoint being used for debugging (only in development)
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('[Apollo Client] Hasura GraphQL Endpoint:', HASURA_GRAPHQL_ENDPOINT);
  console.log('[Apollo Client] Hasura WebSocket Endpoint:', HASURA_WS_ENDPOINT);
}

/**
 * Token storage for auth - can be set externally by the app
 */
let authToken: string = '';

/**
 * Set the auth token (call this from your auth provider)
 */
export function setAuthToken(token: string): void {
  authToken = token;
}

// Firebase token storage key (must match firebaseClient.js)
const FIREBASE_TOKEN_KEY = 'firebase_auth_token';

/**
 * Get authentication token
 * Works in both web (localStorage) and React Native (externally set)
 */
function getAuthToken(): string {
  // If token was set externally (React Native), use it
  if (authToken) {
    return authToken;
  }

  // Try localStorage for web environment
  try {
    // Check if we're in a browser environment with localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      // Get Firebase token (Firebase Auth system)
      const firebaseToken = window.localStorage.getItem(FIREBASE_TOKEN_KEY);
      if (firebaseToken) {
        return firebaseToken;
      }
    }
    return '';
  } catch (error) {
    // localStorage not available (React Native) - this is expected
    return '';
  }
}

/**
 * Auth link - adds Authorization header to all requests
 *
 * Authentication priority:
 * 1. Admin secret (only if explicitly set - for server-side tools only)
 * 2. JWT Bearer token from Firebase Auth (default for client apps)
 */
const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();

  // Build auth headers - JWT only (no admin secret in client apps)
  const authHeaders: Record<string, string> = {};

  if (token) {
    authHeaders['authorization'] = `Bearer ${token}`;
  }

  return {
    headers: {
      ...headers,
      ...authHeaders,
    },
  };
});

/**
 * Error link - handles GraphQL and network errors
 * Compatible with both web and React Native
 */
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      // Downgrade non-nullable null errors to warnings (common during data issues)
      if (message?.includes('null value found for non-nullable type')) {
        console.warn(
          `[GraphQL warning]: Non-null field returned null. Operation: ${operation.operationName}, Message: ${message}`
        );
      } else {
        console.error(
          `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
        );
      }
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

/**
 * HTTP link for queries and mutations
 * Uses regular endpoint by default (supports both Relay and standard queries)
 */
const httpLink = new HttpLink({
  uri: HASURA_GRAPHQL_ENDPOINT,
});

/**
 * WebSocket link for subscriptions (real-time)
 * Uses same authentication logic as HTTP link
 */
const wsLink = new GraphQLWsLink(
  createClient({
    url: HASURA_WS_ENDPOINT,
    connectionParams: () => {
      const token = getAuthToken();

      // Build auth headers - JWT only
      const authHeaders: Record<string, string> = {};

      if (token) {
        authHeaders['authorization'] = `Bearer ${token}`;
      }

      return { headers: authHeaders };
    },
    // Reconnect on connection drop
    shouldRetry: () => true,
    retryAttempts: 5,
  })
);

/**
 * Apollo Client 4 Link Chain Configuration
 *
 * Apollo Client 4 migrated from zen-observable to RxJS Observable.
 * Use ApolloLink.from() and ApolloLink.split() static methods for proper compatibility.
 *
 * Link chain order: performanceLink -> errorLink -> authLink -> httpLink
 * For subscriptions: wsLink (WebSocket)
 */

// HTTP link chain using ApolloLink.from() for Apollo 4 compatibility
const httpLinkChain = ApolloLink.from([
  performanceLink,
  errorLink,
  authLink,
  httpLink,
]);

/**
 * Split link - uses WebSocket for subscriptions, HTTP for queries/mutations
 * Using ApolloLink.split() static method for Apollo Client 4 compatibility
 */
const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLinkChain
);

/**
 * Offset-based pagination merge function
 * Used for legacy queries that use limit/offset
 */
const offsetPagination = (keyArgs: string[] = ['where', 'order_by']): FieldPolicy => ({
  keyArgs,
  merge(existing = [], incoming, { args }) {
    const offset = args?.offset ?? 0;
    const merged = existing ? [...existing] : [];

    // Insert incoming at correct offset position
    for (let i = 0; i < incoming.length; i++) {
      merged[offset + i] = incoming[i];
    }

    return merged;
  },
  read(existing, { args }) {
    if (!existing) return undefined;

    const offset = args?.offset ?? 0;
    const limit = args?.limit ?? existing.length;

    return existing.slice(offset, offset + limit);
  },
});

/**
 * Apollo Client Cache Configuration
 *
 * Comprehensive caching strategy for all entity types:
 * - Type-specific caching with proper key identification
 * - Pagination support (both offset and Relay cursor-based)
 * - Optimistic updates for better UX
 */
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // =====================================================
        // PROFILES
        // =====================================================
        profiles: offsetPagination(['where', 'order_by']),
        profiles_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'profiles', id: args?.id });
          },
        },
        profiles_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // MAID PROFILES
        // =====================================================
        maid_profiles: offsetPagination(['where', 'order_by']),
        maid_profiles_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'maid_profiles', id: args?.id });
          },
        },
        maid_profiles_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // SPONSOR PROFILES
        // =====================================================
        sponsor_profiles: offsetPagination(['where', 'order_by']),
        sponsor_profiles_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'sponsor_profiles', id: args?.id });
          },
        },
        sponsor_profiles_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // AGENCY PROFILES
        // =====================================================
        agency_profiles: offsetPagination(['where', 'order_by']),
        agency_profiles_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'agency_profiles', id: args?.id });
          },
        },
        agency_profiles_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // JOBS
        // =====================================================
        jobs: offsetPagination(['where', 'order_by']),
        jobs_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'jobs', id: args?.id });
          },
        },
        jobs_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // APPLICATIONS
        // =====================================================
        applications: offsetPagination(['where', 'order_by']),
        applications_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'applications', id: args?.id });
          },
        },
        applications_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // BOOKINGS
        // =====================================================
        bookings: offsetPagination(['where', 'order_by']),
        bookings_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'bookings', id: args?.id });
          },
        },
        bookings_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // MESSAGES
        // =====================================================
        messages: offsetPagination(['where', 'order_by']),
        messages_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'messages', id: args?.id });
          },
        },
        messages_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // CONVERSATIONS
        // =====================================================
        conversations: offsetPagination(['where', 'order_by']),
        conversations_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'conversations', id: args?.id });
          },
        },

        // =====================================================
        // NOTIFICATIONS
        // =====================================================
        notifications: offsetPagination(['where', 'order_by']),
        notifications_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'notifications', id: args?.id });
          },
        },
        notifications_connection: relayStylePagination(['where', 'order_by']),

        // =====================================================
        // REVIEWS
        // =====================================================
        reviews: offsetPagination(['where', 'order_by']),
        reviews_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'reviews', id: args?.id });
          },
        },

        // =====================================================
        // FAVORITES
        // =====================================================
        favorites: offsetPagination(['where', 'order_by']),
        favorites_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'favorites', id: args?.id });
          },
        },

        // =====================================================
        // SHORTLISTS
        // =====================================================
        shortlists: offsetPagination(['where', 'order_by']),
        shortlists_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'shortlists', id: args?.id });
          },
        },

        // =====================================================
        // INTEREST REQUESTS (Conversation Starter Feature)
        // =====================================================
        interest_requests: offsetPagination(['where', 'order_by']),
        interest_requests_by_pk: {
          read(_, { args, toReference }) {
            return toReference({ __typename: 'interest_requests', id: args?.id });
          },
        },
      },
    },

    // =====================================================
    // TYPE-SPECIFIC POLICIES
    // =====================================================

    profiles: {
      keyFields: ['id'],
    },
    maid_profiles: {
      keyFields: ['id'],
    },
    sponsor_profiles: {
      keyFields: ['id'],
    },
    agency_profiles: {
      keyFields: ['id'],
    },
    jobs: {
      keyFields: ['id'],
    },
    applications: {
      keyFields: ['id'],
    },
    bookings: {
      keyFields: ['id'],
    },
    messages: {
      keyFields: ['id'],
    },
    conversations: {
      keyFields: ['id'],
    },
    notifications: {
      keyFields: ['id'],
    },
    reviews: {
      keyFields: ['id'],
    },
    favorites: {
      keyFields: ['id'],
    },
    shortlists: {
      keyFields: ['id'],
    },
    interest_requests: {
      keyFields: ['id'],
    },
  },
});

/**
 * Apollo Client instance
 * This is the main GraphQL client for the application
 */
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache,
  defaultOptions: {
    watchQuery: {
      // cache-and-network: Return cached data immediately, then fetch from network
      // Best for dashboards and lists that need fast initial render
      fetchPolicy: 'cache-and-network',
      // Return partial data from cache while fetching missing fields
      returnPartialData: true,
      errorPolicy: 'all',
    },
    query: {
      // cache-first: Use cached data if available, only fetch if missing
      // Good for detail views and rarely-changing data
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      // Update cache automatically with mutation results
      errorPolicy: 'all',
    },
  },
  // Enable Apollo DevTools in development
  devtools: {
    enabled: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
  },
});

/**
 * Helper function to reset the Apollo cache
 * Useful after logout or when you need to clear all cached data
 */
export const resetApolloCache = async () => {
  await apolloClient.clearStore();
};

/**
 * Helper function to refetch all active queries
 * Useful after mutations to ensure UI is up-to-date
 */
export const refetchActiveQueries = async () => {
  await apolloClient.refetchQueries({ include: 'active' });
};

/**
 * Helper to update cache after mutations
 * Automatically updates the cache with the mutation result
 */
export const updateCacheAfterMutation = (
  typename: string,
  id: string,
  updates: Record<string, any>
) => {
  apolloClient.cache.modify({
    id: apolloClient.cache.identify({ __typename: typename, id }),
    fields: Object.fromEntries(
      Object.entries(updates).map(([field, value]) => [
        field,
        () => value,
      ])
    ),
  });
};

/**
 * Helper to evict an entity from cache
 * Useful when an entity is deleted
 */
export const evictFromCache = (typename: string, id: string) => {
  apolloClient.cache.evict({
    id: apolloClient.cache.identify({ __typename: typename, id }),
  });
  apolloClient.cache.gc(); // Garbage collect orphaned references
};

/**
 * Helper to read a single entity from cache
 */
export const readFromCache = <T = any>(typename: string, id: string): T | null => {
  try {
    return apolloClient.cache.readFragment({
      id: apolloClient.cache.identify({ __typename: typename, id }),
      fragment: {
        kind: 'Document',
        definitions: []
      } as any, // This is a placeholder - actual usage requires proper fragment
    });
  } catch {
    return null;
  }
};
