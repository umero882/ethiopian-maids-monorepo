/**
 * Cleanup Expired Idempotency Keys
 *
 * Scheduled function and callable function to remove old idempotency records.
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

const DELETE_EXPIRED_IDEMPOTENCY = gql`
  mutation DeleteExpiredIdempotency($expiryDate: timestamptz!) {
    delete_payment_idempotency(where: { created_at: { _lt: $expiryDate } }) {
      affected_rows
    }
  }
`;

const DELETE_USER_EXPIRED_IDEMPOTENCY = gql`
  mutation DeleteUserExpiredIdempotency($userId: String!, $expiryDate: timestamptz!) {
    delete_payment_idempotency(
      where: {
        _and: [
          { user_id: { _eq: $userId } }
          { created_at: { _lt: $expiryDate } }
        ]
      }
    ) {
      affected_rows
    }
  }
`;

/**
 * Internal cleanup function (used by scheduled task)
 */
export async function cleanupExpiredIdempotency(): Promise<void> {
  try {
    // Delete records older than 24 hours
    const expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const result = await hasuraClient.request<{
      delete_payment_idempotency: { affected_rows: number };
    }>(DELETE_EXPIRED_IDEMPOTENCY, { expiryDate });

    console.log(`Cleaned up ${result.delete_payment_idempotency.affected_rows} expired idempotency records`);
  } catch (error) {
    console.error('Error cleaning up idempotency records:', error);
    throw error;
  }
}

interface CleanupData {
  maxAgeHours?: number;
}

/**
 * Callable cleanup function (can be called by admin users)
 * Only cleans up records belonging to the authenticated user
 */
export async function cleanupExpiredIdempotencyCallable(
  data: CleanupData,
  context: functions.https.CallableContext
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const maxAgeHours = data.maxAgeHours || 24;

  // Validate maxAgeHours (minimum 1 hour, maximum 168 hours / 1 week)
  if (maxAgeHours < 1 || maxAgeHours > 168) {
    throw new functions.https.HttpsError('invalid-argument', 'maxAgeHours must be between 1 and 168');
  }

  try {
    const expiryDate = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();

    const result = await hasuraClient.request<{
      delete_payment_idempotency: { affected_rows: number };
    }>(DELETE_USER_EXPIRED_IDEMPOTENCY, { userId, expiryDate });

    const deletedCount = result.delete_payment_idempotency.affected_rows;

    console.log(`User ${userId} cleaned up ${deletedCount} expired idempotency records`);

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    console.error('Error cleaning up user idempotency records:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to cleanup idempotency records');
  }
}
