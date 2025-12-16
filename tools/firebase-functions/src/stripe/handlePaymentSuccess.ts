/**
 * Handle Payment Success
 */

import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface PaymentSuccessData {
  sessionId: string;
}

export async function handlePaymentSuccess(
  data: PaymentSuccessData,
  context: functions.https.CallableContext
): Promise<{ subscription: any }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sessionId } = data;

  if (!sessionId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing sessionId');
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      throw new functions.https.HttpsError('failed-precondition', 'Payment not completed');
    }

    return {
      subscription: {
        id: session.subscription,
        status: 'active',
      },
    };
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw new functions.https.HttpsError('internal', 'Failed to handle payment success');
  }
}
