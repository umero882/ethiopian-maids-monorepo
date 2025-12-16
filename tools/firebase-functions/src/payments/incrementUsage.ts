/**
 * Increment Usage Stat - v1 API
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

const UPSERT_USAGE_STATS = gql`
  mutation UpsertUsageStats($userId: String!, $periodStart: timestamptz!, $periodEnd: timestamptz!) {
    insert_user_usage_stats_one(
      object: {
        user_id: $userId
        period_start: $periodStart
        period_end: $periodEnd
        profile_views: 0
        contact_requests: 0
        job_posts: 0
        messages_sent: 0
      }
      on_conflict: {
        constraint: user_usage_stats_user_id_period_start_key
        update_columns: []
      }
    ) {
      id
    }
  }
`;

const INCREMENT_PROFILE_VIEWS = gql`
  mutation IncrementProfileViews($userId: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { profile_views: $amount }
    ) {
      affected_rows
    }
  }
`;

const INCREMENT_CONTACT_REQUESTS = gql`
  mutation IncrementContactRequests($userId: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { contact_requests: $amount }
    ) {
      affected_rows
    }
  }
`;

const INCREMENT_JOB_POSTS = gql`
  mutation IncrementJobPosts($userId: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { job_posts: $amount }
    ) {
      affected_rows
    }
  }
`;

const INCREMENT_MESSAGES_SENT = gql`
  mutation IncrementMessagesSent($userId: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { messages_sent: $amount }
    ) {
      affected_rows
    }
  }
`;

interface IncrementUsageData {
  userId: string;
  feature: string;
  amount?: number;
}

export async function incrementUsageStat(
  data: IncrementUsageData,
  context: functions.https.CallableContext
): Promise<{ success: boolean }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, feature, amount = 1 } = data;

  if (!userId || !feature) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing userId or feature');
  }

  try {
    // Ensure usage stats record exists for current period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await hasuraClient.request(UPSERT_USAGE_STATS, {
      userId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });

    // Increment the appropriate counter
    let mutation;
    switch (feature) {
      case 'profile_views':
        mutation = INCREMENT_PROFILE_VIEWS;
        break;
      case 'contact_requests':
        mutation = INCREMENT_CONTACT_REQUESTS;
        break;
      case 'job_posts':
        mutation = INCREMENT_JOB_POSTS;
        break;
      case 'messages_sent':
        mutation = INCREMENT_MESSAGES_SENT;
        break;
      default:
        throw new functions.https.HttpsError('invalid-argument', `Unknown feature: ${feature}`);
    }

    await hasuraClient.request(mutation, { userId, amount });

    return { success: true };
  } catch (error) {
    console.error('Error incrementing usage stat:', error);
    throw new functions.https.HttpsError('internal', 'Failed to increment usage stat');
  }
}
