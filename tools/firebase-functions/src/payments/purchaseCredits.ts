/**
 * Purchase Credits (Idempotent) - v1 API
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

const UPSERT_USER_CREDITS = gql`
  mutation UpsertUserCredits($userId: String!, $amount: Int!) {
    insert_user_credits_one(
      object: { user_id: $userId, balance: $amount }
      on_conflict: {
        constraint: user_credits_user_id_key
        update_columns: [balance, updated_at]
      }
    ) {
      id
      balance
    }
  }
`;

const ADD_CREDITS = gql`
  mutation AddCredits($userId: String!, $amount: Int!) {
    update_user_credits(
      where: { user_id: { _eq: $userId } }
      _inc: { balance: $amount }
    ) {
      returning {
        balance
      }
    }
  }
`;

const INSERT_CREDIT_TRANSACTION = gql`
  mutation InsertCreditTransaction(
    $userId: String!
    $amount: Int!
    $type: String!
    $description: String
    $stripePaymentIntentId: String
  ) {
    insert_credit_transactions_one(
      object: {
        user_id: $userId
        amount: $amount
        transaction_type: $type
        description: $description
        stripe_payment_intent_id: $stripePaymentIntentId
      }
    ) {
      id
    }
  }
`;

interface PurchaseCreditsData {
  userId: string;
  creditsAmount: number;
  costUsdCents: number;
  context?: string;
}

export async function purchaseCreditsIdempotent(
  data: PurchaseCreditsData,
  context: functions.https.CallableContext
): Promise<{ success: boolean; checkoutUrl?: string; duplicate?: boolean; message?: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, creditsAmount, costUsdCents } = data;

  if (!userId || !creditsAmount || !costUsdCents) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creditsAmount} Credits`,
              description: `Purchase ${creditsAmount} credits for Ethiopian Maids platform`,
            },
            unit_amount: costUsdCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?credits_purchased=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?credits_canceled=true`,
      metadata: {
        userId,
        creditsAmount: creditsAmount.toString(),
        type: 'credit_purchase',
        firebaseUid: context.auth.uid,
      },
    });

    return {
      success: true,
      checkoutUrl: session.url || undefined,
    };
  } catch (error) {
    console.error('Error purchasing credits:', error);
    throw new functions.https.HttpsError('internal', 'Failed to initiate credit purchase');
  }
}

/**
 * Complete credit purchase (called from webhook after successful payment)
 */
export async function completeCreditPurchase(
  userId: string,
  creditsAmount: number,
  stripePaymentIntentId: string
): Promise<void> {
  await hasuraClient.request(UPSERT_USER_CREDITS, {
    userId,
    amount: 0,
  });

  await hasuraClient.request(ADD_CREDITS, {
    userId,
    amount: creditsAmount,
  });

  await hasuraClient.request(INSERT_CREDIT_TRANSACTION, {
    userId,
    amount: creditsAmount,
    type: 'purchase',
    description: `Purchased ${creditsAmount} credits`,
    stripePaymentIntentId,
  });
}
