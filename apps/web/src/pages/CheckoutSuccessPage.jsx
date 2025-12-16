/**
 * Checkout Success Page
 *
 * Handles the redirect after successful Stripe payment.
 * If the user came from the mobile app, redirects back to the app via deep link.
 * Otherwise, redirects to the appropriate dashboard.
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Smartphone, Monitor, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import subscriptionService from '@/services/subscriptionService';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  // Get URL parameters
  const sessionId = searchParams.get('session_id');
  const plan = searchParams.get('plan');
  const returnUrl = searchParams.get('returnUrl');
  const isMobileApp = searchParams.get('mobile') === 'true' || returnUrl?.includes('ethiopianmaids://');

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        // Refresh subscription data
        if (user?.uid) {
          const subData = await subscriptionService.getActiveSubscription(user.uid);
          setSubscription(subData);
        }

        setIsLoading(false);

        // If came from mobile app, redirect back after a short delay
        if (isMobileApp || returnUrl) {
          setRedirecting(true);

          // Wait 2 seconds to show success message, then redirect
          setTimeout(() => {
            const mobileDeepLink = returnUrl
              ? decodeURIComponent(returnUrl)
              : `ethiopianmaids://payment/success?plan=${plan || 'pro'}&session_id=${sessionId || ''}`;

            console.log('[CheckoutSuccess] Redirecting to mobile app:', mobileDeepLink);

            // Try to open the mobile app
            window.location.href = mobileDeepLink;

            // Fallback: if still on this page after 1 second, show manual redirect option
            setTimeout(() => {
              setRedirecting(false);
            }, 1500);
          }, 2000);
        }
      } catch (error) {
        console.error('[CheckoutSuccess] Error:', error);
        setIsLoading(false);
      }
    };

    verifyAndRedirect();
  }, [user?.uid, sessionId, plan, returnUrl, isMobileApp]);

  const handleOpenApp = () => {
    const mobileDeepLink = `ethiopianmaids://payment/success?plan=${plan || 'pro'}&session_id=${sessionId || ''}`;
    window.location.href = mobileDeepLink;
  };

  const handleGoToDashboard = () => {
    const userType = userProfile?.user_type || 'sponsor';
    navigate(`/dashboard/${userType}/subscriptions`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for upgrading your subscription. Your new features are now active.
        </p>

        {/* Subscription Info */}
        {subscription && (
          <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-emerald-600 font-semibold">Plan:</span>
              <span className="text-gray-900 capitalize">
                {subscription.plan_name || subscription.plan_type || 'Premium'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-600 font-semibold">Status:</span>
              <span className="inline-flex items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-sm rounded-full">
                Active
              </span>
            </div>
          </div>
        )}

        {/* Redirecting Message */}
        {redirecting && (
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Redirecting to app...</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {(isMobileApp || returnUrl) && (
            <button
              onClick={handleOpenApp}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <Smartphone className="w-5 h-5" />
              Open in App
            </button>
          )}

          <button
            onClick={handleGoToDashboard}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <Monitor className="w-5 h-5" />
            Continue on Web
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 mt-6">
          A confirmation email has been sent to your registered email address.
        </p>
      </div>
    </div>
  );
}
