/**
 * Create Stripe Checkout Session
 */

import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { GraphQLClient, gql } from 'graphql-request';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const hasuraClient = new GraphQLClient(
  process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql',
  {
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
  }
);

const UPSERT_CUSTOMER = gql`
  mutation UpsertCustomer($userId: String!, $stripeCustomerId: String!) {
    insert_stripe_customers_one(
      object: { user_id: $userId, stripe_customer_id: $stripeCustomerId }
      on_conflict: {
        constraint: stripe_customers_user_id_key
        update_columns: [stripe_customer_id, updated_at]
      }
    ) {
      id
      user_id
      stripe_customer_id
    }
  }
`;

const GET_CUSTOMER = gql`
  query GetCustomer($userId: String!) {
    stripe_customers(where: { user_id: { _eq: $userId } }, limit: 1) {
      stripe_customer_id
    }
  }
`;

interface CheckoutSessionData {
  userId: string;
  priceId: string;
  planName?: string;
  userEmail?: string;
  billingCycle?: string;
  userType?: string;
  planTier?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession(
  data: CheckoutSessionData,
  context: functions.https.CallableContext
): Promise<{ url: string; sessionId: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { priceId, planName, userEmail, successUrl, cancelUrl, userType, planTier, billingCycle } = data;

  // IMPORTANT: Always use the verified Firebase UID from auth context, not from client data
  // This ensures the subscription is linked to the correct user profile
  const userId = context.auth.uid;

  if (!priceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing priceId');
  }

  console.log(`Creating checkout session for Firebase user: ${userId}`);

  try {
    let stripeCustomerId: string | null = null;

    const customerResult = await hasuraClient.request<{
      stripe_customers: Array<{ stripe_customer_id: string }>;
    }>(GET_CUSTOMER, { userId });

    if (customerResult.stripe_customers.length > 0) {
      stripeCustomerId = customerResult.stripe_customers[0].stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,  // This is now the verified Firebase UID
          firebaseUid: userId,  // Explicitly set for clarity
          userType: userType || '',
        },
      });

      stripeCustomerId = customer.id;

      await hasuraClient.request(UPSERT_CUSTOMER, {
        userId,
        stripeCustomerId: customer.id,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?canceled=true`,
      metadata: {
        userId,  // This is now the verified Firebase UID
        firebaseUid: userId,  // Explicitly set for clarity
        planName: planName || '',
        userType: userType || '',
        planTier: planTier || '',
        billingCycle: billingCycle || '',
      },
      subscription_data: {
        metadata: {
          userId,  // This is now the verified Firebase UID
          firebaseUid: userId,  // Explicitly set for clarity
          planName: planName || '',
          userType: userType || '',
          planTier: planTier || '',
        },
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return {
      url: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
  }
}
