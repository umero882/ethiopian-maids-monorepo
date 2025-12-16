/**
 * Cancel Stripe Subscription
 */

import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface CancelSubscriptionData {
  subscriptionId: string;
}

export async function cancelSubscription(
  data: CancelSubscriptionData,
  context: functions.https.CallableContext
): Promise<{ success: boolean }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { subscriptionId } = data;

  if (!subscriptionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing subscriptionId');
  }

  try {
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new functions.https.HttpsError('internal', 'Failed to cancel subscription');
  }
}
