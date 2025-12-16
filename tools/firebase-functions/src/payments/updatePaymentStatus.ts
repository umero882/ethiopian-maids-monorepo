/**
 * Update Payment Status
 *
 * Updates the status of a payment in the idempotency table.
 */

import * as functions from 'firebase-functions';
import { GraphQLClient, gql } from 'graphql-request';

const hasuraClient = new GraphQLClient(
  process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql',
  {
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
  }
);

const UPDATE_PAYMENT_STATUS = gql`
  mutation UpdatePaymentStatus(
    $idempotencyKey: String!
    $status: String!
    $stripePaymentIntentId: String
    $stripeChargeId: String
    $result: jsonb
  ) {
    update_payment_idempotency(
      where: { idempotency_key: { _eq: $idempotencyKey } }
      _set: {
        status: $status
        stripe_payment_intent_id: $stripePaymentIntentId
        stripe_charge_id: $stripeChargeId
        result: $result
        updated_at: "now()"
      }
    ) {
      affected_rows
      returning {
        id
        idempotency_key
        status
        result
      }
    }
  }
`;

const GET_PAYMENT_IDEMPOTENCY = gql`
  query GetPaymentIdempotency($idempotencyKey: String!) {
    payment_idempotency(where: { idempotency_key: { _eq: $idempotencyKey } }, limit: 1) {
      id
      user_id
      status
      operation
      amount
      result
    }
  }
`;

interface UpdatePaymentStatusData {
  idempotencyKey: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  result?: Record<string, unknown>;
}

export async function updatePaymentStatus(
  data: UpdatePaymentStatusData,
  context: functions.https.CallableContext
): Promise<{ success: boolean; record?: unknown; error?: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { idempotencyKey, status, stripePaymentIntentId, stripeChargeId, result } = data;

  if (!idempotencyKey || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing idempotencyKey or status');
  }

  // Validate status value
  const validStatuses = ['pending', 'processing', 'completed', 'failed'];
  if (!validStatuses.includes(status)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  try {
    // First verify the record exists and belongs to the user
    const existingResult = await hasuraClient.request<{
      payment_idempotency: Array<{ id: string; user_id: string; status: string }>;
    }>(GET_PAYMENT_IDEMPOTENCY, { idempotencyKey });

    if (existingResult.payment_idempotency.length === 0) {
      return {
        success: false,
        error: 'Payment record not found',
      };
    }

    const existingRecord = existingResult.payment_idempotency[0];

    // Security check: only allow user to update their own payments
    if (existingRecord.user_id !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'You can only update your own payment records');
    }

    // Update the payment status
    const updateResult = await hasuraClient.request<{
      update_payment_idempotency: {
        affected_rows: number;
        returning: Array<{ id: string; idempotency_key: string; status: string; result: unknown }>;
      };
    }>(UPDATE_PAYMENT_STATUS, {
      idempotencyKey,
      status,
      stripePaymentIntentId: stripePaymentIntentId || null,
      stripeChargeId: stripeChargeId || null,
      result: result || null,
    });

    if (updateResult.update_payment_idempotency.affected_rows === 0) {
      return {
        success: false,
        error: 'Failed to update payment status',
      };
    }

    return {
      success: true,
      record: updateResult.update_payment_idempotency.returning[0],
    };
  } catch (error) {
    console.error('Error updating payment status:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to update payment status');
  }
}
