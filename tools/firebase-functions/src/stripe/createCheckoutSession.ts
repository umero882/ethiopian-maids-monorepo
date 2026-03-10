/**
 * Create Stripe Checkout Session
 * Supports both subscription mode (recurring plans) and payment mode (one-time boost)
 */

import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { GraphQLClient, gql } from 'graphql-request';

// Config: prefer process.env over deprecated functions.config()
const _hasuraLegacy = (() => { try { return functions.config()?.hasura || {}; } catch { return {} as any; } })();
const _stripeLegacy = (() => { try { return functions.config()?.stripe || {}; } catch { return {} as any; } })();

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || _stripeLegacy.secret_key || '';
const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT || _hasuraLegacy.endpoint || 'https://api.ethiopianmaids.com/v1/graphql';
const HASURA_SECRET = process.env.HASURA_ADMIN_SECRET || _hasuraLegacy.admin_secret || '';

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2023-10-16',
});

const hasuraClient = new GraphQLClient(HASURA_ENDPOINT, {
  headers: {
    'x-hasura-admin-secret': HASURA_SECRET,
  },
});

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
  priceId?: string;
  planName?: string;
  userEmail?: string;
  billingCycle?: string;
  userType?: string;
  planTier?: string;
  successUrl?: string;
  cancelUrl?: string;
  // One-time payment fields (for paid boost)
  mode?: 'subscription' | 'payment';
  amount?: number;
  currency?: string;
  productName?: string;
  productDescription?: string;
}

export async function createCheckoutSession(
  data: CheckoutSessionData,
  context: functions.https.CallableContext
): Promise<{ url: string; sessionId: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const {
    priceId, planName, userEmail, successUrl, cancelUrl,
    userType, planTier, billingCycle,
    mode = 'subscription', amount, currency = 'aed',
    productName, productDescription,
  } = data;

  // IMPORTANT: Always use the verified Firebase UID from auth context, not from client data
  const userId = context.auth.uid;

  // Validate: subscription mode requires priceId, payment mode requires amount
  if (mode === 'subscription' && !priceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing priceId for subscription mode');
  }
  if (mode === 'payment' && (!amount || amount <= 0)) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid amount for payment mode');
  }

  console.log(`Creating ${mode} checkout session for Firebase user: ${userId}`);

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
          userId,
          firebaseUid: userId,
          userType: userType || '',
        },
      });

      stripeCustomerId = customer.id;

      await hasuraClient.request(UPSERT_CUSTOMER, {
        userId,
        stripeCustomerId: customer.id,
      });
    }

    const sessionMetadata: Record<string, string> = {
      userId,
      firebaseUid: userId,
      planName: planName || '',
      userType: userType || '',
      planTier: planTier || '',
      billingCycle: billingCycle || '',
    };

    // Build line_items based on mode
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (mode === 'payment' && amount) {
      // One-time payment with dynamic pricing (e.g., paid boost)
      lineItems = [{
        price_data: {
          currency: currency,
          product_data: {
            name: productName || 'Premium Boost',
            description: productDescription || 'Premium features boost',
          },
          unit_amount: amount, // amount in smallest currency unit (fils for AED)
        },
        quantity: 1,
      }];
    } else {
      // Subscription with pre-created price
      lineItems = [{
        price: priceId!,
        quantity: 1,
      }];
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      success_url: successUrl || `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?canceled=true`,
      metadata: sessionMetadata,
    };

    // Add subscription_data only for subscription mode
    if (mode === 'subscription') {
      sessionParams.subscription_data = {
        metadata: {
          userId,
          firebaseUid: userId,
          planName: planName || '',
          userType: userType || '',
          planTier: planTier || '',
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

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
