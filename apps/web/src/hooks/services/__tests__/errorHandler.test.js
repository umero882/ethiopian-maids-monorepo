/**
 * Error Handler Tests
 * Unit tests for error handling utilities
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock toast before imports
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

import {
  useErrorHandler,
  useRetry,
  categorizeError,
  formatError,
  ErrorCategory,
} from '../useErrorHandler';

describe('Error Handler Utilities', () => {
  describe('categorizeError', () => {
    it('should categorize network errors', () => {
      const error = { message: 'Network request failed' };
      expect(categorizeError(error)).toBe(ErrorCategory.NETWORK);
    });

    it('should categorize connection errors as network', () => {
      const error = { message: 'Connection refused' };
      expect(categorizeError(error)).toBe(ErrorCategory.NETWORK);
    });

    it('should categorize timeout errors as network', () => {
      const error = { message: 'Request timeout' };
      expect(categorizeError(error)).toBe(ErrorCategory.NETWORK);
    });

    it('should categorize networkError property as network', () => {
      const error = { networkError: true, message: 'Some error' };
      expect(categorizeError(error)).toBe(ErrorCategory.NETWORK);
    });

    it('should categorize authorization errors by code', () => {
      const error = { code: 'UNAUTHENTICATED' };
      expect(categorizeError(error)).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should categorize forbidden errors by code', () => {
      const error = { code: 'FORBIDDEN' };
      expect(categorizeError(error)).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should categorize unauthorized errors by message', () => {
      const error = { message: 'Unauthorized access' };
      expect(categorizeError(error)).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should categorize permission errors', () => {
      const error = { message: 'Permission denied' };
      expect(categorizeError(error)).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should categorize not found errors', () => {
      const error = { code: 'NOT_FOUND' };
      expect(categorizeError(error)).toBe(ErrorCategory.NOT_FOUND);
    });

    it('should categorize not found errors by message', () => {
      const error = { message: 'Resource not found' };
      expect(categorizeError(error)).toBe(ErrorCategory.NOT_FOUND);
    });

    it('should categorize validation errors by code', () => {
      const error = { code: 'BAD_USER_INPUT' };
      expect(categorizeError(error)).toBe(ErrorCategory.VALIDATION);
    });

    it('should categorize validation errors by message', () => {
      const error = { message: 'Invalid input data' };
      expect(categorizeError(error)).toBe(ErrorCategory.VALIDATION);
    });

    it('should categorize conflict errors', () => {
      const error = { message: 'Record already exists' };
      expect(categorizeError(error)).toBe(ErrorCategory.CONFLICT);
    });

    it('should categorize duplicate errors as conflict', () => {
      const error = { message: 'Duplicate entry' };
      expect(categorizeError(error)).toBe(ErrorCategory.CONFLICT);
    });

    it('should categorize server errors', () => {
      const error = { code: 'INTERNAL_SERVER_ERROR' };
      expect(categorizeError(error)).toBe(ErrorCategory.SERVER);
    });

    it('should return unknown for unrecognized errors', () => {
      const error = { message: 'Some random error message' };
      expect(categorizeError(error)).toBe(ErrorCategory.UNKNOWN);
    });

    it('should return unknown for null/undefined errors', () => {
      expect(categorizeError(null)).toBe(ErrorCategory.UNKNOWN);
      expect(categorizeError(undefined)).toBe(ErrorCategory.UNKNOWN);
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
      expect(formatted.category).toBe(ErrorCategory.NETWORK);
    });

    it('should mark server errors as retryable', () => {
      const error = { code: 'INTERNAL_SERVER_ERROR' };
      const formatted = formatError(error);

      expect(formatted.retryable).toBe(true);
      expect(formatted.category).toBe(ErrorCategory.SERVER);
    });

    it('should mark validation errors as non-retryable', () => {
      const error = { code: 'BAD_USER_INPUT' };
      const formatted = formatError(error);

      expect(formatted.retryable).toBe(false);
      expect(formatted.category).toBe(ErrorCategory.VALIDATION);
    });

    it('should mark authorization errors as non-retryable', () => {
      const error = { code: 'UNAUTHENTICATED' };
      const formatted = formatError(error);

      expect(formatted.retryable).toBe(false);
      expect(formatted.category).toBe(ErrorCategory.AUTHORIZATION);
    });

    it('should include timestamp in ISO format', () => {
      const error = { message: 'Test error' };
      const formatted = formatError(error);

      expect(formatted.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should preserve error code if present', () => {
      const error = { message: 'Error', code: 'CUSTOM_CODE' };
      const formatted = formatError(error);

      expect(formatted.code).toBe('CUSTOM_CODE');
    });

    it('should handle extensions.code format', () => {
      const error = { message: 'Error', extensions: { code: 'EXT_CODE' } };
      const formatted = formatError(error);

      expect(formatted.code).toBe('EXT_CODE');
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

    it('should return formatted error from handleError', () => {
      const { result } = renderHook(() => useErrorHandler({ showToast: false }));

      let formatted;
      act(() => {
        formatted = result.current.handleError(new Error('Test'));
      });

      expect(formatted).not.toBe(null);
      expect(formatted.originalMessage).toBe('Test');
    });

    it('should handle null error gracefully', () => {
      const { result } = renderHook(() => useErrorHandler({ showToast: false }));

      act(() => {
        result.current.handleError(null);
      });

      expect(result.current.error).toBe(null);
      expect(result.current.formattedError).toBe(null);
    });

    it('should indicate if error is retryable', () => {
      const { result } = renderHook(() => useErrorHandler({ showToast: false }));

      // Network error - retryable
      act(() => {
        result.current.handleError({ message: 'Network failed' });
      });
      expect(result.current.isRetryable).toBe(true);

      // Clear and try validation error - not retryable
      act(() => {
        result.current.clearError();
      });
      act(() => {
        result.current.handleError({ code: 'BAD_USER_INPUT' });
      });
      expect(result.current.isRetryable).toBe(false);
    });
  });

  describe('useRetry', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should initialize with zero retry count', () => {
      const { result } = renderHook(() => useRetry());

      expect(result.current.retryCount).toBe(0);
      expect(result.current.isRetrying).toBe(false);
    });

    it('should successfully execute operation on first try', async () => {
      const { result } = renderHook(() => useRetry());

      const operation = vi.fn().mockResolvedValue('success');

      let returnValue;
      await act(async () => {
        returnValue = await result.current.executeWithRetry(operation);
      });

      expect(returnValue).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 3, baseDelay: 10 }));

      let attempts = 0;
      const operation = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      let returnValue;
      await act(async () => {
        returnValue = await result.current.executeWithRetry(operation);
      });

      expect(returnValue).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 2, baseDelay: 10 }));

      const operation = vi.fn().mockRejectedValue(new Error('Always fails'));

      let thrownError;
      try {
        await act(async () => {
          await result.current.executeWithRetry(operation);
        });
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeDefined();
      expect(thrownError.message).toBe('Always fails');
      // Initial try + 2 retries = 3 calls
      expect(operation).toHaveBeenCalledTimes(3);
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

      // Wait for initial render to complete
      await act(async () => {});

      expect(result.current).not.toBe(null);
      expect(typeof result.current.abort).toBe('function');
    });

    it('should provide reset function', async () => {
      const { result } = renderHook(() => useRetry());

      // Wait for initial render to complete
      await act(async () => {});

      expect(result.current).not.toBe(null);
      expect(typeof result.current.reset).toBe('function');
    });

    it('should expose maxRetries', async () => {
      const { result } = renderHook(() => useRetry({ maxRetries: 5 }));

      // Wait for initial render to complete
      await act(async () => {});

      expect(result.current).not.toBe(null);
      expect(result.current.maxRetries).toBe(5);
    });
  });
});
