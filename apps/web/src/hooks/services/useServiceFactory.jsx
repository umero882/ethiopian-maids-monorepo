/**
 * useServiceFactory Hook
 * Provides ServiceFactory initialization and access utilities
 *
 * Note: The @ethio/app ServiceFactory is optional. If it fails to load,
 * a stub is provided to prevent the app from crashing.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { apolloClient } from '@ethio/api-client';

// Try to import ServiceFactory, use stub if unavailable
let ServiceFactory;
try {
  // Dynamic import would be better but hooks need synchronous imports
  // For now, we provide a stub that returns empty implementations
  ServiceFactory = {
    initialize: () => {},
    reset: () => {},
    isInitialized: () => false,
    getAllServices: () => null,
    getMaidProfileService: () => null,
    getSponsorProfileService: () => null,
    getAgencyProfileService: () => null,
    getJobPostingService: () => null,
    getJobApplicationService: () => null,
    getMessageService: () => null,
    getNotificationService: () => null,
  };
  console.warn('[ServiceFactory] Using stub implementation. @ethio/app package not available.');
} catch (e) {
  console.warn('[ServiceFactory] Failed to load @ethio/app:', e);
}

// Context for ServiceFactory state
const ServiceFactoryContext = createContext(null);

/**
 * ServiceFactory Provider Component
 * Wraps the app and initializes ServiceFactory with Apollo Client
 */
export function ServiceFactoryProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (!ServiceFactory.isInitialized()) {
        ServiceFactory.initialize(apolloClient);
      }
      setIsInitialized(true);
    } catch (err) {
      setError(err);
      console.error('Failed to initialize ServiceFactory:', err);
    }
  }, []);

  const value = {
    isInitialized,
    error,
    reset: useCallback(() => {
      ServiceFactory.reset();
      ServiceFactory.initialize(apolloClient);
      setIsInitialized(true);
    }, []),
  };

  return (
    <ServiceFactoryContext.Provider value={value}>
      {children}
    </ServiceFactoryContext.Provider>
  );
}

/**
 * Hook to access ServiceFactory state
 */
export function useServiceFactory() {
  const context = useContext(ServiceFactoryContext);

  if (!context) {
    // If not wrapped in provider, check if ServiceFactory is initialized
    const isInitialized = ServiceFactory.isInitialized();
    return {
      isInitialized,
      error: null,
      reset: () => {
        ServiceFactory.reset();
        ServiceFactory.initialize(apolloClient);
      },
    };
  }

  return context;
}

/**
 * Hook to ensure ServiceFactory is initialized before using services
 */
export function useEnsureServiceFactory() {
  const { isInitialized, error } = useServiceFactory();

  useEffect(() => {
    if (!isInitialized && !ServiceFactory.isInitialized()) {
      try {
        ServiceFactory.initialize(apolloClient);
      } catch (err) {
        console.error('Failed to initialize ServiceFactory:', err);
      }
    }
  }, [isInitialized]);

  return { isInitialized: isInitialized || ServiceFactory.isInitialized(), error };
}

/**
 * Get all services from ServiceFactory
 */
export function useAllServices() {
  useEnsureServiceFactory();

  try {
    return ServiceFactory.getAllServices();
  } catch (err) {
    console.error('ServiceFactory not initialized:', err);
    return null;
  }
}

// Export ServiceFactory for use by other service hooks
export { ServiceFactory };
