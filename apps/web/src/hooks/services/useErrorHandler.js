/**
 * Error Handler Hook
 * Centralized error handling for service hooks
 *
 * Provides:
 * - Consistent error formatting
 * - Error categorization (network, validation, authorization, etc.)
 * - Toast notifications
 * - Error logging
 * - Retry logic
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('ServiceErrorHandler');

/**
 * Error categories for better handling
 */
export const ErrorCategory = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  SERVER: 'server',
  UNKNOWN: 'unknown',
};

/**
 * Categorize an error based on its properties
 */
export function categorizeError(error) {
  if (!error) return ErrorCategory.UNKNOWN;

  const message = error.message?.toLowerCase() || '';
  const code = error.code || error.extensions?.code || '';

  // Network errors
  if (
    error.networkError ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  ) {
    return ErrorCategory.NETWORK;
  }

  // Authorization errors
  if (
    code === 'UNAUTHENTICATED' ||
    code === 'FORBIDDEN' ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('permission') ||
    message.includes('access denied')
  ) {
    return ErrorCategory.AUTHORIZATION;
  }

  // Not found errors
  if (
    code === 'NOT_FOUND' ||
    message.includes('not found') ||
    message.includes('does not exist')
  ) {
    return ErrorCategory.NOT_FOUND;
  }

  // Validation errors
  if (
    code === 'BAD_USER_INPUT' ||
    code === 'VALIDATION_ERROR' ||
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required')
  ) {
    return ErrorCategory.VALIDATION;
  }

  // Conflict errors
  if (
    code === 'CONFLICT' ||
    message.includes('already exists') ||
    message.includes('duplicate') ||
    message.includes('conflict')
  ) {
    return ErrorCategory.CONFLICT;
  }

  // Server errors
  if (
    code === 'INTERNAL_SERVER_ERROR' ||
    message.includes('server error') ||
    message.includes('internal error')
  ) {
    return ErrorCategory.SERVER;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get user-friendly error message based on category
 */
export function getUserFriendlyMessage(error, category) {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Unable to connect. Please check your internet connection and try again.';
    case ErrorCategory.AUTHORIZATION:
      return 'You do not have permission to perform this action. Please log in again.';
    case ErrorCategory.NOT_FOUND:
      return 'The requested item was not found.';
    case ErrorCategory.VALIDATION:
      return error.message || 'Please check your input and try again.';
    case ErrorCategory.CONFLICT:
      return 'This item already exists or conflicts with existing data.';
    case ErrorCategory.SERVER:
      return 'Something went wrong on our end. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Format error for consistent structure
 */
export function formatError(error) {
  const category = categorizeError(error);
  const userMessage = getUserFriendlyMessage(error, category);

  return {
    message: userMessage,
    originalMessage: error.message,
    category,
    code: error.code || error.extensions?.code,
    details: error.graphQLErrors || error.details,
    timestamp: new Date().toISOString(),
    retryable: category === ErrorCategory.NETWORK || category === ErrorCategory.SERVER,
  };
}

/**
 * Hook for centralized error handling in service hooks
 */
export function useErrorHandler(options = {}) {
  const {
    showToast = true,
    logErrors = true,
    context = 'Service',
    onError = null,
  } = options;

  const [error, setError] = useState(null);
  const [formattedError, setFormattedError] = useState(null);

  const handleError = useCallback((err, customMessage = null) => {
    if (!err) {
      setError(null);
      setFormattedError(null);
      return null;
    }

    const formatted = formatError(err);

    // Log the error
    if (logErrors) {
      log.error(`[${context}] ${formatted.category}: ${formatted.originalMessage}`, {
        category: formatted.category,
        code: formatted.code,
        details: formatted.details,
      });
    }

    // Show toast notification
    if (showToast) {
      const toastMessage = customMessage || formatted.message;
      toast({
        title: getToastTitle(formatted.category),
        description: toastMessage,
        variant: formatted.category === ErrorCategory.VALIDATION ? 'default' : 'destructive',
      });
    }

    // Call custom error handler
    if (onError) {
      onError(formatted);
    }

    setError(err);
    setFormattedError(formatted);

    return formatted;
  }, [context, logErrors, showToast, onError]);

  const clearError = useCallback(() => {
    setError(null);
    setFormattedError(null);
  }, []);

  return {
    error,
    formattedError,
    handleError,
    clearError,
    isRetryable: formattedError?.retryable || false,
  };
}

/**
 * Get toast title based on error category
 */
function getToastTitle(category) {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Connection Error';
    case ErrorCategory.AUTHORIZATION:
      return 'Access Denied';
    case ErrorCategory.NOT_FOUND:
      return 'Not Found';
    case ErrorCategory.VALIDATION:
      return 'Validation Error';
    case ErrorCategory.CONFLICT:
      return 'Conflict';
    case ErrorCategory.SERVER:
      return 'Server Error';
    default:
      return 'Error';
  }
}

/**
 * Hook for retry logic
 */
export function useRetry(options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const abortRef = useRef(false);

  const calculateDelay = useCallback((attempt) => {
    const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
    // Add jitter (random variation) to prevent thundering herd
    return delay + Math.random() * 1000;
  }, [baseDelay, backoffFactor, maxDelay]);

  const executeWithRetry = useCallback(async (operation, shouldRetry = () => true) => {
    abortRef.current = false;
    setRetryCount(0);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (abortRef.current) {
        throw new Error('Operation aborted');
      }

      try {
        setRetryCount(attempt);
        return await operation();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const shouldRetryError = shouldRetry(error);

        if (isLastAttempt || !shouldRetryError) {
          throw error;
        }

        // Wait before retrying
        setIsRetrying(true);
        const delay = calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        setIsRetrying(false);

        log.debug(`[Retry] Attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      }
    }
  }, [maxRetries, calculateDelay]);

  const abort = useCallback(() => {
    abortRef.current = true;
    setIsRetrying(false);
  }, []);

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
    abortRef.current = false;
  }, []);

  return {
    retryCount,
    isRetrying,
    maxRetries,
    executeWithRetry,
    abort,
    reset,
  };
}

/**
 * Combined hook for error handling with retry
 */
export function useServiceError(options = {}) {
  const errorHandler = useErrorHandler(options);
  const retry = useRetry(options);

  const executeWithErrorHandling = useCallback(async (
    operation,
    customMessage = null,
    shouldRetry = (error) => {
      const formatted = formatError(error);
      return formatted.retryable;
    }
  ) => {
    errorHandler.clearError();

    try {
      return await retry.executeWithRetry(operation, shouldRetry);
    } catch (error) {
      errorHandler.handleError(error, customMessage);
      throw error;
    }
  }, [errorHandler, retry]);

  return {
    ...errorHandler,
    ...retry,
    executeWithErrorHandling,
  };
}

export default useServiceError;
