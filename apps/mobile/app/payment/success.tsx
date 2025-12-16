/**
 * Payment Success Screen
 *
 * Handles the redirect from Stripe after successful payment.
 * Industry standard implementation:
 * - Updates the subscription data
 * - Shows a success message briefly
 * - Auto-redirects to the previous page (saved return path)
 * - Allows manual navigation if auto-redirect fails
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { useSubscriptionContext } from '../../context/SubscriptionContext';

// Auto-redirect delay in milliseconds (industry standard: 3-5 seconds)
const AUTO_REDIRECT_DELAY = 3000;

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ session_id?: string; plan?: string }>();
  const { user } = useAuth();
  const { refresh, currentPlan, subscription, userType } = useSubscription();
  const { completeCheckout, setShowPaymentSuccess } = useSubscriptionContext();

  const [isRefreshing, setIsRefreshing] = useState(true);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_DELAY / 1000);
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const [autoRedirectCancelled, setAutoRedirectCancelled] = useState(false);

  const maxAttempts = 5;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Get saved return path and refresh subscription
  useEffect(() => {
    const initializeSuccess = async () => {
      console.log('[PaymentSuccess] Initializing success screen...');
      console.log('[PaymentSuccess] Session ID:', params.session_id);
      console.log('[PaymentSuccess] Plan:', params.plan);

      try {
        // Get the saved return path from checkout
        const checkoutData = await completeCheckout();
        const savedReturnPath = checkoutData.returnPath;

        console.log('[PaymentSuccess] Saved return path:', savedReturnPath);
        setReturnPath(savedReturnPath);

        // Show payment success indicator
        setShowPaymentSuccess(true);

        // Refresh subscription data multiple times to ensure we get the updated data
        // Stripe webhook may take a moment to update the database
        await refresh();

        // Stop showing loading after initial refresh
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1500);

      } catch (error) {
        console.error('[PaymentSuccess] Error initializing:', error);
        setIsRefreshing(false);
      }
    };

    initializeSuccess();

    // Cleanup
    return () => {
      setShowPaymentSuccess(false);
    };
  }, []);

  // Keep refreshing in background for a while
  useEffect(() => {
    if (refreshAttempts < maxAttempts && !isRefreshing) {
      const interval = setInterval(async () => {
        await refresh();
        setRefreshAttempts(prev => prev + 1);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [refreshAttempts, isRefreshing]);

  // Auto-redirect countdown
  useEffect(() => {
    if (isRefreshing || autoRedirectCancelled) return;

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: AUTO_REDIRECT_DELAY,
      useNativeDriver: false,
    }).start();

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-redirect timer
    const redirectTimer = setTimeout(() => {
      handleContinue();
    }, AUTO_REDIRECT_DELAY);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [isRefreshing, autoRedirectCancelled, returnPath]);

  // Navigate to the saved return path or dashboard
  const handleContinue = () => {
    console.log('[PaymentSuccess] Continuing to:', returnPath || 'dashboard');

    if (returnPath && returnPath !== '/') {
      // Navigate to the saved return path
      router.replace(returnPath as any);
    } else {
      // Default: Navigate to the appropriate dashboard
      router.replace('/(tabs)');
    }
  };

  // Cancel auto-redirect and stay on this page
  const handleCancelAutoRedirect = () => {
    setAutoRedirectCancelled(true);
    progressAnim.setValue(0);
  };

  const handleViewSubscription = () => {
    // Get user type from subscription or effective user type
    const effectiveUserType = subscription?.userType || userType || 'sponsor';
    router.push(`/${effectiveUserType}/subscriptions` as any);
  };

  // Calculate progress bar width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (isRefreshing) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Processing your payment...</Text>
          <Text style={styles.loadingSubtext}>Please wait while we confirm your subscription</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={64} color="#fff" />
          </View>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Thank you for upgrading your subscription.
        </Text>

        {/* Subscription Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="diamond" size={24} color="#10B981" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Your Plan</Text>
              <Text style={styles.infoValue}>
                {currentPlan === 'premium' ? 'Premium' : currentPlan === 'pro' ? 'Professional' : 'Free'}
              </Text>
            </View>
          </View>

          {subscription?.status && (
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={24} color="#10B981" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={styles.infoValue}>
                  {subscription.status === 'active' ? 'Active' : subscription.status}
                </Text>
              </View>
            </View>
          )}

          {subscription?.endDate && (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="calendar" size={24} color="#10B981" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Valid Until</Text>
                <Text style={styles.infoValue}>
                  {new Date(subscription.endDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Auto-redirect indicator */}
        {!autoRedirectCancelled && (
          <View style={styles.redirectContainer}>
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
            </View>
            <Text style={styles.redirectText}>
              Redirecting in {countdown} seconds...
            </Text>
            <TouchableOpacity onPress={handleCancelAutoRedirect}>
              <Text style={styles.cancelRedirectText}>Stay on this page</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleContinue}
          >
            <Ionicons name="arrow-forward" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {returnPath && returnPath !== '/(tabs)' ? 'Continue' : 'Go to Dashboard'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewSubscription}
          >
            <Text style={styles.secondaryButtonText}>View Subscription Details</Text>
          </TouchableOpacity>
        </View>

        {/* Confirmation note */}
        <Text style={styles.noteText}>
          A confirmation email has been sent to your registered email address.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  redirectContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  redirectText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  cancelRedirectText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  noteText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
});
