/**
 * Ensure Payment Idempotency
 */

import * as functions from 'firebase-functions';
import { GraphQLClient, gql } from 'graphql-request';
import * as crypto from 'crypto';

const hasuraClient = new GraphQLClient(
  process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql',
  {
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
  }
);

const CHECK_IDEMPOTENCY = gql`
  query CheckIdempotency($key: String!) {
    payment_idempotency(where: { idempotency_key: { _eq: $key } }, limit: 1) {
      id
      status
      result
      created_at
    }
  }
`;

const INSERT_IDEMPOTENCY = gql`
  mutation InsertIdempotency($key: String!, $userId: String!, $operation: String!, $amount: Int!) {
    insert_payment_idempotency_one(
      object: {
        idempotency_key: $key
        user_id: $userId
        operation: $operation
        amount: $amount
        status: "pending"
      }
    ) {
      id
      idempotency_key
      status
    }
  }
`;

interface IdempotencyData {
  userId: string;
  operation: string;
  amount: number;
  context?: string;
}

export async function ensurePaymentIdempotency(
  data: IdempotencyData,
  context: functions.https.CallableContext
): Promise<{ isDuplicate: boolean; idempotencyKey: string; existingResult?: any }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, operation, amount, context: opContext } = data;

  const keyData = `${userId}:${operation}:${amount}:${opContext || ''}:${Date.now()}`;
  const idempotencyKey = crypto.createHash('sha256').update(keyData).digest('hex').substring(0, 32);

  try {
    const existing = await hasuraClient.request<{
      payment_idempotency: Array<{ id: string; status: string; result: any }>;
    }>(CHECK_IDEMPOTENCY, { key: idempotencyKey });

    if (existing.payment_idempotency.length > 0) {
      const record = existing.payment_idempotency[0];

      if (record.status === 'completed') {
        return {
          isDuplicate: true,
          idempotencyKey,
          existingResult: record.result,
        };
      }

      return {
        isDuplicate: false,
        idempotencyKey,
      };
    }

    await hasuraClient.request(INSERT_IDEMPOTENCY, {
      key: idempotencyKey,
      userId,
      operation,
      amount,
    });

    return {
      isDuplicate: false,
      idempotencyKey,
    };
  } catch (error) {
    console.error('Error ensuring idempotency:', error);
    throw new functions.https.HttpsError('internal', 'Failed to check payment idempotency');
  }
}
