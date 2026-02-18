import { useState, useCallback } from 'react';

// Simple toast state management with deduplication
let toastId = 0;
const toastState = {
  toasts: [],
  listeners: new Set(),
  recentMessages: new Map(), // Track recent messages to prevent duplicates
};

// Configuration
const TOAST_DURATION = 5000; // 5 seconds
const DEDUP_WINDOW = 2000; // 2 seconds window for deduplication

/**
 * Generate a unique key for a toast message to detect duplicates
 */
const getToastKey = (toast) => {
  return `${toast.title || ''}-${toast.description || ''}-${toast.variant || 'default'}`;
};

/**
 * Check if a toast is a duplicate (same message within dedup window)
 */
const isDuplicate = (toast) => {
  const key = getToastKey(toast);
  const lastTime = toastState.recentMessages.get(key);

  if (lastTime && Date.now() - lastTime < DEDUP_WINDOW) {
    return true;
  }

  return false;
};

/**
 * Mark a toast as recently shown
 */
const markAsShown = (toast) => {
  const key = getToastKey(toast);
  toastState.recentMessages.set(key, Date.now());

  // Clean up old entries after dedup window
  setTimeout(() => {
    toastState.recentMessages.delete(key);
  }, DEDUP_WINDOW);
};

const addToast = (toast) => {
  // Prevent duplicate toasts
  if (isDuplicate(toast)) {
    console.debug('[Toast] Duplicate message suppressed:', toast.title);
    return null;
  }

  // Mark as shown to prevent duplicates
  markAsShown(toast);

  const id = ++toastId;
  const newToast = { id, ...toast };

  // Limit max toasts to 3 to prevent toast spam
  if (toastState.toasts.length >= 3) {
    toastState.toasts.shift(); // Remove oldest toast
  }

  toastState.toasts.push(newToast);

  // Notify all listeners
  toastState.listeners.forEach((listener) => listener());

  // Auto remove after duration
  setTimeout(() => {
    removeToast(id);
  }, TOAST_DURATION);

  return id;
};

const removeToast = (id) => {
  const index = toastState.toasts.findIndex((toast) => toast.id === id);
  if (index > -1) {
    toastState.toasts.splice(index, 1);
    toastState.listeners.forEach((listener) => listener());
  }
};

/**
 * Clear all toasts
 */
const clearAllToasts = () => {
  toastState.toasts = [];
  toastState.listeners.forEach((listener) => listener());
};

// Toast function for direct usage
export const toast = ({ title, description, variant = 'default', action }) => {
  return addToast({
    title,
    description,
    variant,
    action,
  });
};

// Convenience methods for common toast types
toast.error = (title, description) => {
  return toast({ title, description, variant: 'destructive' });
};

toast.success = (title, description) => {
  return toast({ title, description, variant: 'success' });
};

toast.warning = (title, description) => {
  return toast({ title, description, variant: 'warning' });
};

toast.info = (title, description) => {
  return toast({ title, description, variant: 'default' });
};

toast.dismiss = removeToast;
toast.dismissAll = clearAllToasts;

// Hook for components that need to listen to toast state
export const useToast = () => {
  const [, forceUpdate] = useState({});

  const refresh = useCallback(() => {
    forceUpdate({});
  }, []);

  // Subscribe to toast state changes
  useState(() => {
    toastState.listeners.add(refresh);
    return () => {
      toastState.listeners.delete(refresh);
    };
  });

  return {
    toast,
    toasts: toastState.toasts,
    dismiss: removeToast,
  };
};
