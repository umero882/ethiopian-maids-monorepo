/**
 * Create Stripe Customer Portal Session
 */

import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface PortalSessionData {
  customerId: string;
  returnUrl?: string;
}

export async function createPortalSession(
  data: PortalSessionData,
  context: functions.https.CallableContext
): Promise<{ url: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { customerId, returnUrl } = data;

  if (!customerId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing customerId');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard`,
    });

    return { url: session.url };
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create portal session');
  }
}
