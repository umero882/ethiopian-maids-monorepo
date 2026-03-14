/**
 * profileIncrementViews Cloud Function
 *
 * Increments maid profile view count using admin secret,
 * bypassing Hasura row-level permissions (viewers can't update other users' rows).
 */

import * as functions from 'firebase-functions';
import { GraphQLClient, gql } from 'graphql-request';

const _hasuraLegacy = (() => { try { return functions.config()?.hasura || {}; } catch { return {} as any; } })();
const HASURA_ENDPOINT =
  process.env.HASURA_GRAPHQL_ENDPOINT || _hasuraLegacy.endpoint;
const HASURA_ADMIN_SECRET =
  process.env.HASURA_ADMIN_SECRET || _hasuraLegacy.admin_secret;

function getAdminClient(): GraphQLClient {
  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Hasura configuration missing.'
    );
  }
  return new GraphQLClient(HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': HASURA_ADMIN_SECRET },
  });
}

const INCREMENT_VIEWS = gql`
  mutation IncrementProfileViews($id: String!) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $id }
      _inc: { profile_views: 1 }
    ) {
      id
      profile_views
    }
  }
`;

export async function incrementViews(
  data: { maidId: string },
  context: functions.https.CallableContext
) {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to record views.'
    );
  }

  const { maidId } = data;
  if (!maidId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'maidId is required.'
    );
  }

  try {
    const client = getAdminClient();
    const result: any = await client.request(INCREMENT_VIEWS, { id: maidId });
    const profileViews = result?.update_maid_profiles_by_pk?.profile_views;

    return {
      success: true,
      profile_views: profileViews,
    };
  } catch (error: any) {
    functions.logger.error('Error incrementing profile views:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to increment profile views.'
    );
  }
}
