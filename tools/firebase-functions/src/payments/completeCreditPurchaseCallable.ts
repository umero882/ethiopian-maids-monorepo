/**
 * Complete Credit Purchase (Callable)
 *
 * Called after successful Stripe payment to finalize credit purchase.
 * This is a callable wrapper around the internal completeCreditPurchase function.
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

const UPDATE_IDEMPOTENCY_STATUS = gql`
  mutation UpdateIdempotencyStatus($idempotencyKey: String!, $status: String!, $result: jsonb) {
    update_payment_idempotency(
      where: { idempotency_key: { _eq: $idempotencyKey } }
      _set: { status: $status, result: $result, updated_at: "now()" }
    ) {
      affected_rows
    }
  }
`;

interface CompleteCreditPurchaseData {
  idempotencyKey: string;
  stripePaymentIntentId: string;
}

export async function completeCreditPurchaseCallable(
  data: CompleteCreditPurchaseData,
  context: functions.https.CallableContext
): Promise<{ success: boolean; creditsBalance?: number; transactionId?: string; error?: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { idempotencyKey, stripePaymentIntentId } = data;

  if (!idempotencyKey || !stripePaymentIntentId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing idempotencyKey or stripePaymentIntentId');
  }

  const userId = context.auth.uid;

  try {
    // Verify the payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return {
        success: false,
        error: `Payment not successful. Status: ${paymentIntent.status}`,
      };
    }

    // Get credits amount from payment intent metadata
    const creditsAmount = parseInt(paymentIntent.metadata?.creditsAmount || '0', 10);

    if (creditsAmount <= 0) {
      return {
        success: false,
        error: 'Invalid credits amount in payment metadata',
      };
    }

    // Ensure user has a credits record
    await hasuraClient.request(UPSERT_USER_CREDITS, {
      userId,
      amount: 0,
    });

    // Add credits to user balance
    const addResult = await hasuraClient.request<{
      update_user_credits: { returning: Array<{ balance: number }> };
    }>(ADD_CREDITS, {
      userId,
      amount: creditsAmount,
    });

    const newBalance = addResult.update_user_credits.returning[0]?.balance || creditsAmount;

    // Record the transaction
    const transactionResult = await hasuraClient.request<{
      insert_credit_transactions_one: { id: string };
    }>(INSERT_CREDIT_TRANSACTION, {
      userId,
      amount: creditsAmount,
      type: 'purchase',
      description: `Purchased ${creditsAmount} credits`,
      stripePaymentIntentId,
    });

    // Update idempotency record
    await hasuraClient.request(UPDATE_IDEMPOTENCY_STATUS, {
      idempotencyKey,
      status: 'completed',
      result: {
        creditsBalance: newBalance,
        creditsAdded: creditsAmount,
        transactionId: transactionResult.insert_credit_transactions_one.id,
      },
    });

    return {
      success: true,
      creditsBalance: newBalance,
      transactionId: transactionResult.insert_credit_transactions_one.id,
    };
  } catch (error) {
    console.error('Error completing credit purchase:', error);

    // Update idempotency record as failed
    try {
      await hasuraClient.request(UPDATE_IDEMPOTENCY_STATUS, {
        idempotencyKey,
        status: 'failed',
        result: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    } catch (updateError) {
      console.error('Failed to update idempotency status:', updateError);
    }

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to complete credit purchase');
  }
}
