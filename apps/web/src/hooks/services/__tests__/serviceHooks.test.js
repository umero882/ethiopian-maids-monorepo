/**
 * Service Hooks Tests
 * End-to-end tests for service hooks integration
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies BEFORE imports
vi.mock('@ethio/app', () => ({
  ServiceFactory: {
    isInitialized: vi.fn(() => false),
    initialize: vi.fn(),
    reset: vi.fn(),
    getMaidProfileService: vi.fn(),
    getSponsorProfileService: vi.fn(),
    getAgencyProfileService: vi.fn(),
    getJobPostingService: vi.fn(),
    getJobApplicationService: vi.fn(),
    getMessageService: vi.fn(),
    getNotificationService: vi.fn(),
    getAllServices: vi.fn(),
  },
}));

vi.mock('@ethio/api-client', () => ({
  apolloClient: {},
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id' },
  })),
}));

vi.mock('@/services/maidService', () => ({
  maidService: {
    getMaids: vi.fn(),
    getMaidById: vi.fn(),
  },
}));

vi.mock('@/services/sponsorService', () => ({
  sponsorService: {
    getFavorites: vi.fn(),
    addToFavorites: vi.fn(),
    removeFromFavorites: vi.fn(),
  },
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Import hooks after mocking
import {
  useErrorHandler,
  useRetry,
  categorizeError,
  formatError,
  ErrorCategory,
} from '../useErrorHandler';

describe('Error Handler', () => {
  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const error = { message: 'Network request failed' };
      expect(categorizeError(error)).toBe(ErrorCategory.NETWORK);
    });

    it('should categorize authorization errors', () => {
      const error = { code: 'UNAUTHENTICATED' };
      expect(categorizeError(error)).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should categorize not found errors', () => {
      const error = { message: 'Resource not found' };
      expect(categorizeError(error)).toBe(ErrorCategory.NOT_FOUND);
    });

    it('should categorize validation errors', () => {
      const error = { code: 'BAD_USER_INPUT' };
      expect(categorizeError(error)).toBe(ErrorCategory.VALIDATION);
    });

    it('should categorize conflict errors', () => {
      const error = { message: 'Record already exists' };
      expect(categorizeError(error)).toBe(ErrorCategory.CONFLICT);
    });

    it('should categorize server errors', () => {
      const error = { code: 'INTERNAL_SERVER_ERROR' };
      expect(categorizeError(error)).toBe(ErrorCategory.SERVER);
    });

    it('should return unknown for unrecognized errors', () => {
      const error = { message: 'Some random error' };
      expect(categorizeError(error)).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe('formatError', () => {
    it('should format error with user-friendly message', () => {
      const error = { message: 'Network error' };
      const formatted = formatError(error);

      expect(formatted).toHaveProperty('message');
      expect(formatted).toHaveProperty('originalMessage', 'Network error');
      expect(formatted).toHaveProperty('category');
      expect(formatted).toHaveProperty('timestamp');
      expect(formatted).toHaveProperty('retryable');
    });

    it('should mark network errors as retryable', () => {
      const error = { message: 'Network connection failed' };
      const formatted = formatError(error);

      expect(formatted.retryable).toBe(true);
    });

    it('should mark validation errors as non-retryable', () => {
      const error = { code: 'BAD_USER_INPUT' };
      const formatted = formatError(error);

      expect(formatted.retryable).toBe(false);
    });
  });

  describe('useErrorHandler', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should initialize with no error', () => {
      const { result } = renderHook(() => useErrorHandler({ showToast: false }));

      expect(result.current.error).toBe(null);
      expect(result.current.formattedError).toBe(null);
    });

    it('should handle errors and format them', () => {
      const { result } = renderHook(() => useErrorHandler({ showToast: false }));

      const testError = new Error('Test error');

      act(() => {
        result.current.handleError(testError);
      });

      expect(result.current.error).toBe(testError);
      expect(result.current.formattedError).not.toBe(null);
      expect(result.current.formattedError.originalMessage).toBe('Test error');
    });

    it('should clear errors', () => {
      const { result } = renderHook(() => useErrorHandler({ showToast: false }));

      act(() => {
        result.current.handleError(new Error('Test'));
      });

      expect(result.current.error).not.toBe(null);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.formattedError).toBe(null);
    });
  });

  describe('useRetry', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should initialize with zero retry count', async () => {
      const { result } = renderHook(() => useRetry());

      // Wait for initial render
      await act(async () => {});

      expect(result.current).not.toBe(null);
      expect(result.current.retryCount).toBe(0);
      expect(result.current.isRetrying).toBe(false);
    });

    it('should track retry count', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 2, baseDelay: 10 }));

      let attempts = 0;
      const failingOperation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      };

      await act(async () => {
        await result.current.executeWithRetry(failingOperation);
      });

      expect(attempts).toBe(3); // Initial + 2 retries
    });

    it('should throw after max retries', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 2, baseDelay: 10 }));

      const alwaysFailingOperation = vi.fn().mockRejectedValue(new Error('Always fails'));

      let thrownError;
      try {
        await act(async () => {
          await result.current.executeWithRetry(alwaysFailingOperation);
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe('Always fails');
      // Initial try + 2 retries = 3 calls
      expect(alwaysFailingOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry when shouldRetry returns false', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 3, baseDelay: 10 }));

      const operation = vi.fn().mockRejectedValue(new Error('Non-retryable'));

      let thrownError;
      try {
        await act(async () => {
          await result.current.executeWithRetry(operation, () => false);
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe('Non-retryable');
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });

    it('should provide abort function', async () => {
      const { result } = renderHook(() => useRetry());

      // Wait for initial render
      await act(async () => {});

      expect(result.current).not.toBe(null);
      expect(typeof result.current.abort).toBe('function');
    });

    it('should provide reset function', async () => {
      const { result } = renderHook(() => useRetry());

      // Wait for initial render
      await act(async () => {});

      expect(result.current).not.toBe(null);
      expect(typeof result.current.reset).toBe('function');
    });

    it('should expose maxRetries', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 5 }));

      // Wait for initial render
      await act(async () => {});

      expect(result.current).not.toBe(null);
      expect(result.current.maxRetries).toBe(5);
    });
  });
});
