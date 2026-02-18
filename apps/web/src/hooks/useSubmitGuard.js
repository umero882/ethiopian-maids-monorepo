import { useState, useCallback, useRef } from 'react';

/**
 * useSubmitGuard - Hook to prevent duplicate form submissions
 * 
 * Usage:
 *   const { isSubmitting, guardedSubmit } = useSubmitGuard();
 *   const handleSubmit = guardedSubmit(async (data) => { ... });
 */
export function useSubmitGuard({ onSuccess, onError, cooldownMs = 2000 } = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const lastSubmitRef = useRef(0);

  const guardedSubmit = useCallback((submitFn) => {
    return async (...args) => {
      // Prevent rapid re-submissions
      const now = Date.now();
      if (isSubmitting || (now - lastSubmitRef.current < cooldownMs)) {
        return;
      }

      setIsSubmitting(true);
      setIsSuccess(false);
      lastSubmitRef.current = now;

      try {
        const result = await submitFn(...args);
        setIsSuccess(true);
        onSuccess?.(result);
        
        // Reset success state after 2 seconds
        setTimeout(() => setIsSuccess(false), 2000);
        return result;
      } catch (error) {
        onError?.(error);
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [isSubmitting, cooldownMs, onSuccess, onError]);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setIsSuccess(false);
    lastSubmitRef.current = 0;
  }, []);

  return { isSubmitting, isSuccess, guardedSubmit, reset };
}
