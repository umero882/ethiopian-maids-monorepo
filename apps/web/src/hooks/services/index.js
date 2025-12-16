/**
 * Service Hooks Index
 * Exports all React hooks that wrap ServiceFactory and existing services
 */

// Clean Architecture ServiceFactory hooks (for future full migration)
export * from './useMaidProfile';
export * from './useSponsorProfile';
export * from './useAgencyProfile';
export * from './useJobPosting';
export * from './useJobApplication';
export * from './useMessages';
export * from './useNotifications';
export * from './useServiceFactory';

// Integration hooks (work with existing service layer + feature flags)
export * from './useServiceIntegration';

// Error handling utilities
export * from './useErrorHandler';

// Real-time subscription hooks
export * from './useSubscriptions';
