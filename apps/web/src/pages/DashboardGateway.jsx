import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import SEO from '@/components/global/SEO';
import { toast } from '@/components/ui/use-toast';
import { syncSubscriptionAfterPayment, getUserSubscription, detectPlanFromPayment } from '@/services/subscriptionSyncService';

const DashboardGateway = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { refreshSubscription } = useSubscription();
  const [searchParams] = useSearchParams();
  const [hasNavigated, setHasNavigated] = useState(false);

  const seo = useMemo(
    () => ({
      title: 'Dashboard | Ethiopian Maids',
      description:
        'Route to your personalized dashboard based on your role (maid, agency, sponsor, or admin).',
      canonical:
        typeof window !== 'undefined'
          ? `${window.location.origin}/dashboard`
          : undefined,
      openGraph: {
        title: 'Dashboard Redirect | Ethiopian Maids',
        description: 'Taking you to the right dashboard for your role.',
        url:
          typeof window !== 'undefined'
            ? `${window.location.origin}/dashboard`
            : undefined,
        image: '/images/og-default.png',
      },
    }),
    []
  );

  // Handle successful payment redirect and pending subscription sync
  useEffect(() => {
    const paymentSuccess = searchParams.get('success');
    const paymentCancelled = searchParams.get('canceled');
    const paymentParam = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const planType = searchParams.get('plan');
    const amount = searchParams.get('amount');

    // Check for pending subscription in localStorage (set before redirecting to Stripe Payment Link)
    const pendingSubscriptionStr = localStorage.getItem('pendingSubscription');
    let pendingSubscription = null;

    if (pendingSubscriptionStr) {
      try {
        pendingSubscription = JSON.parse(pendingSubscriptionStr);
        // Only use if it's recent (within last 30 minutes)
        const isRecent = pendingSubscription.timestamp && (Date.now() - pendingSubscription.timestamp) < 30 * 60 * 1000;
        if (!isRecent) {
          console.log('[DashboardGateway] Pending subscription expired, clearing...');
          localStorage.removeItem('pendingSubscription');
          pendingSubscription = null;
        }
      } catch (e) {
        console.error('[DashboardGateway] Error parsing pending subscription:', e);
        localStorage.removeItem('pendingSubscription');
      }
    }

    console.log('[DashboardGateway] URL params:', {
      success: paymentSuccess,
      payment: paymentParam,
      canceled: paymentCancelled,
      session_id: sessionId,
      plan: planType,
      amount: amount,
      pendingSubscription: pendingSubscription ? 'found' : 'none',
      fullUrl: window.location.href
    });

    // Check for payment success - various ways Stripe can indicate this
    const isPaymentSuccess = paymentSuccess === 'true' || paymentParam === 'success' || sessionId;
    // Also check if we have a pending subscription and user just arrived (from Stripe redirect)
    const hasPendingPayment = pendingSubscription && user && pendingSubscription.userId === user.id;

    if ((isPaymentSuccess || hasPendingPayment) && user) {
      console.log('[DashboardGateway] Payment detected, syncing subscription to Hasura...');

      // Sync subscription using GraphQL (Firebase/Hasura)
      const syncSubscription = async (retryCount = 0, maxRetries = 3) => {
        try {
          console.log(`[DashboardGateway] Sync attempt ${retryCount + 1}/${maxRetries + 1}`);

          // Use pending subscription from localStorage if available
          let planDetails = {
            planName: 'Professional',
            planType: 'pro',
            billingPeriod: 'monthly',
            amount: 49900, // Default Agency Pro (499 AED in fils)
          };

          if (pendingSubscription) {
            // Use stored pending subscription details
            planDetails = {
              planName: pendingSubscription.planName,
              planType: pendingSubscription.planType,
              billingPeriod: pendingSubscription.billingPeriod,
              amount: pendingSubscription.amount,
            };
            console.log('[DashboardGateway] Using pending subscription from localStorage:', planDetails);
          } else if (amount) {
            const detected = detectPlanFromPayment(parseInt(amount), user.userType || 'agency');
            planDetails = { ...planDetails, ...detected, amount: parseInt(amount) };
          } else if (planType) {
            planDetails.planType = planType;
            planDetails.planName = planType === 'premium' ? 'Premium' : 'Professional';
          }

          // Sync subscription to Hasura via GraphQL
          const result = await syncSubscriptionAfterPayment(user.id, {
            ...planDetails,
            stripeSubscriptionId: sessionId || `payment_${Date.now()}`,
            stripeCustomerId: null,
          });

          console.log('[DashboardGateway] Sync result:', result);

          if (result.success) {
            // Clear pending subscription from localStorage
            localStorage.removeItem('pendingSubscription');

            // Refresh subscription context with new data
            await refreshSubscription();

            toast({
              title: 'Payment Successful!',
              description: 'Your subscription has been activated. Welcome to your new plan!',
            });

            // Clean up URL params after showing notification
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } else if (retryCount < maxRetries) {
            // Retry if sync failed
            console.log('[DashboardGateway] Subscription sync failed, retrying...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            return syncSubscription(retryCount + 1, maxRetries);
          } else {
            // Max retries reached
            console.error('[DashboardGateway] Max retries reached:', result.error);
            localStorage.removeItem('pendingSubscription');

            toast({
              title: 'Payment Received',
              description: 'Your payment was successful! If your subscription doesn\'t appear, please contact support.',
              variant: 'destructive',
            });

            // Clean up URL params
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        } catch (error) {
          console.error('[DashboardGateway] Error syncing subscription:', error);

          if (retryCount < maxRetries) {
            console.log(`[DashboardGateway] Retrying after error (attempt ${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return syncSubscription(retryCount + 1, maxRetries);
          }

          localStorage.removeItem('pendingSubscription');

          toast({
            title: 'Payment Received',
            description: 'Your payment was successful! Your subscription will be updated shortly.',
          });

          // Clean up URL params
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      };

      // Execute sync with a small delay for Stripe to process
      setTimeout(() => syncSubscription(), 1000);
    } else if (paymentCancelled === 'true' || paymentParam === 'cancelled') {
      // Clear pending subscription on cancellation
      localStorage.removeItem('pendingSubscription');

      toast({
        title: 'Payment Cancelled',
        description: 'You cancelled the payment process. You can try again anytime.',
        variant: 'destructive',
      });

      // Clean up URL params
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, user, refreshSubscription]);

  useEffect(() => {
    console.log('🔍 DashboardGateway useEffect triggered:', {
      loading,
      hasNavigated,
      user: user
        ? {
            id: user.id,
            email: user.email,
            userType: user.userType,
            user_type: user.user_type,
            registration_complete: user.registration_complete,
          }
        : null,
    });

    if (!loading && user && !hasNavigated) {
      // Route users to their appropriate dashboard based on user type
      // Profile completion will be handled within the dashboard with notifications and modals
      console.log(
        '🎯 DashboardGateway - Routing user to dashboard:',
        'userType:', user.userType,
        'user_type:', user.user_type,
        'Registration complete:', user.registration_complete
      );

      setHasNavigated(true); // Prevent multiple navigation attempts

      // Check both userType and user_type for compatibility
      const userType = user.userType || user.user_type;

      switch (userType) {
        case 'maid':
          navigate('/dashboard/maid', { replace: true });
          break;
        case 'agency':
          navigate('/dashboard/agency', { replace: true });
          break;
        case 'sponsor':
          navigate('/dashboard/sponsor', { replace: true });
          break;
        case 'admin':
          navigate('/admin-dashboard', { replace: true });
          break;
        default:
          // If user type is not recognized, still allow dashboard access
          // but they'll see profile completion prompts
          console.warn('⚠️ Unknown user type:', userType);
          navigate('/dashboard/sponsor', { replace: true }); // Default to sponsor dashboard
          break;
      }
    } else if (!loading && !user && !hasNavigated) {
      // If no user is logged in, redirect to login
      setHasNavigated(true);
      navigate('/login', { replace: true });
    } else if (loading) {
      // Loading state - waiting for auth
    }
  }, [user, loading, navigate, hasNavigated]);

  // Show loading state while determining where to redirect
  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='text-center'>
          <SEO {...seo} />
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4'></div>
          <p className='text-lg text-gray-700'>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='text-center'>
        <SEO {...seo} />
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4'></div>
        <p className='text-lg text-gray-700'>
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
};

export default DashboardGateway;
