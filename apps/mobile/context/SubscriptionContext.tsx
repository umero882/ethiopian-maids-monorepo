/**
 * Subscription Context
 *
 * Manages subscription state across the app including:
 * - Tracking return path for post-payment redirect
 * - Subscription upgrade/downgrade state
 * - Payment success handling
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  RETURN_PATH: '@subscription_return_path',
  PENDING_PLAN: '@subscription_pending_plan',
  CHECKOUT_TIMESTAMP: '@subscription_checkout_timestamp',
};

interface SubscriptionContextType {
  // Return path for post-payment redirect
  returnPath: string | null;
  setReturnPath: (path: string) => Promise<void>;
  clearReturnPath: () => Promise<void>;

  // Pending plan info (the plan user is upgrading to)
  pendingPlan: string | null;
  setPendingPlan: (plan: string) => Promise<void>;
  clearPendingPlan: () => Promise<void>;

  // Checkout state
  isCheckoutInProgress: boolean;
  startCheckout: (returnPath: string, planId: string) => Promise<void>;
  completeCheckout: () => Promise<{ returnPath: string | null; pendingPlan: string | null }>;

  // Payment success state
  showPaymentSuccess: boolean;
  setShowPaymentSuccess: (show: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [returnPath, setReturnPathState] = useState<string | null>(null);
  const [pendingPlan, setPendingPlanState] = useState<string | null>(null);
  const [isCheckoutInProgress, setIsCheckoutInProgress] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const [savedReturnPath, savedPendingPlan, savedTimestamp] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.RETURN_PATH),
          AsyncStorage.getItem(STORAGE_KEYS.PENDING_PLAN),
          AsyncStorage.getItem(STORAGE_KEYS.CHECKOUT_TIMESTAMP),
        ]);

        // Check if checkout is still valid (within 1 hour)
        if (savedTimestamp) {
          const timestamp = parseInt(savedTimestamp, 10);
          const oneHourAgo = Date.now() - 60 * 60 * 1000;

          if (timestamp > oneHourAgo) {
            setReturnPathState(savedReturnPath);
            setPendingPlanState(savedPendingPlan);
            setIsCheckoutInProgress(true);
          } else {
            // Expired, clear saved state
            await clearAllCheckoutState();
          }
        }
      } catch (error) {
        console.error('[SubscriptionContext] Error loading saved state:', error);
      }
    };

    loadSavedState();
  }, []);

  // Clear all checkout state
  const clearAllCheckoutState = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.RETURN_PATH),
        AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PLAN),
        AsyncStorage.removeItem(STORAGE_KEYS.CHECKOUT_TIMESTAMP),
      ]);
      setReturnPathState(null);
      setPendingPlanState(null);
      setIsCheckoutInProgress(false);
    } catch (error) {
      console.error('[SubscriptionContext] Error clearing checkout state:', error);
    }
  };

  // Set return path
  const setReturnPath = useCallback(async (path: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RETURN_PATH, path);
      setReturnPathState(path);
    } catch (error) {
      console.error('[SubscriptionContext] Error saving return path:', error);
    }
  }, []);

  // Clear return path
  const clearReturnPath = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.RETURN_PATH);
      setReturnPathState(null);
    } catch (error) {
      console.error('[SubscriptionContext] Error clearing return path:', error);
    }
  }, []);

  // Set pending plan
  const setPendingPlan = useCallback(async (plan: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PLAN, plan);
      setPendingPlanState(plan);
    } catch (error) {
      console.error('[SubscriptionContext] Error saving pending plan:', error);
    }
  }, []);

  // Clear pending plan
  const clearPendingPlan = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PLAN);
      setPendingPlanState(null);
    } catch (error) {
      console.error('[SubscriptionContext] Error clearing pending plan:', error);
    }
  }, []);

  // Start checkout - save return path and pending plan
  const startCheckout = useCallback(async (path: string, planId: string) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.RETURN_PATH, path),
        AsyncStorage.setItem(STORAGE_KEYS.PENDING_PLAN, planId),
        AsyncStorage.setItem(STORAGE_KEYS.CHECKOUT_TIMESTAMP, Date.now().toString()),
      ]);
      setReturnPathState(path);
      setPendingPlanState(planId);
      setIsCheckoutInProgress(true);
      console.log('[SubscriptionContext] Checkout started, return path:', path, 'plan:', planId);
    } catch (error) {
      console.error('[SubscriptionContext] Error starting checkout:', error);
    }
  }, []);

  // Complete checkout - return saved state and clear it
  const completeCheckout = useCallback(async () => {
    const savedReturnPath = returnPath;
    const savedPendingPlan = pendingPlan;

    // Clear the saved state
    await clearAllCheckoutState();

    console.log('[SubscriptionContext] Checkout completed, returning to:', savedReturnPath);

    return {
      returnPath: savedReturnPath,
      pendingPlan: savedPendingPlan,
    };
  }, [returnPath, pendingPlan]);

  return (
    <SubscriptionContext.Provider
      value={{
        returnPath,
        setReturnPath,
        clearReturnPath,
        pendingPlan,
        setPendingPlan,
        clearPendingPlan,
        isCheckoutInProgress,
        startCheckout,
        completeCheckout,
        showPaymentSuccess,
        setShowPaymentSuccess,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}

export default SubscriptionContext;
