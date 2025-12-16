/**
 * Create Payment Intent
 *
 * Creates a Stripe PaymentIntent for one-time payments (like credit purchases).
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

const GET_CUSTOMER = gql`
  query GetCustomer($userId: String!) {
    stripe_customers(where: { user_id: { _eq: $userId } }, limit: 1) {
      stripe_customer_id
    }
  }
`;

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

const UPDATE_IDEMPOTENCY = gql`
  mutation UpdateIdempotency($idempotencyKey: String!, $stripePaymentIntentId: String!) {
    update_payment_idempotency(
      where: { idempotency_key: { _eq: $idempotencyKey } }
      _set: { stripe_payment_intent_id: $stripePaymentIntentId, status: "processing", updated_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

interface CreatePaymentIntentData {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
  userEmail?: string;
}

export async function createPaymentIntent(
  data: CreatePaymentIntentData,
  context: functions.https.CallableContext
): Promise<{
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, currency = 'usd', description, metadata = {}, idempotencyKey, userEmail } = data;
  const userId = context.auth.uid;

  if (!amount || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number');
  }

  try {
    // Get or create Stripe customer
    let stripeCustomerId: string | null = null;

    const customerResult = await hasuraClient.request<{
      stripe_customers: Array<{ stripe_customer_id: string }>;
    }>(GET_CUSTOMER, { userId });

    if (customerResult.stripe_customers.length > 0) {
      stripeCustomerId = customerResult.stripe_customers[0].stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId,
          firebaseUid: userId,
        },
      });

      stripeCustomerId = customer.id;

      await hasuraClient.request(UPSERT_CUSTOMER, {
        userId,
        stripeCustomerId: customer.id,
      });
    }

    // Create PaymentIntent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount,
      currency,
      customer: stripeCustomerId,
      description: description || 'Ethiopian Maids Platform Payment',
      metadata: {
        ...metadata,
        userId,
        firebaseUid: userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Add idempotency key if provided
    const createOptions: Stripe.RequestOptions = {};
    if (idempotencyKey) {
      createOptions.idempotencyKey = idempotencyKey;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, createOptions);

    // Update idempotency record with payment intent ID
    if (idempotencyKey) {
      try {
        await hasuraClient.request(UPDATE_IDEMPOTENCY, {
          idempotencyKey,
          stripePaymentIntentId: paymentIntent.id,
        });
      } catch (updateError) {
        console.warn('Failed to update idempotency record:', updateError);
        // Don't fail the payment intent creation for this
      }
    }

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to create payment intent');
  }
}
