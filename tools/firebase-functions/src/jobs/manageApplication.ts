/**
 * manageApplication Cloud Function
 *
 * Uses Hasura admin secret to insert/update applications,
 * bypassing JWT role permission issues.
 */

import * as functions from 'firebase-functions';
import { GraphQLClient, gql } from 'graphql-request';

// Hasura config
const _hasuraLegacy = (() => { try { return functions.config()?.hasura || {}; } catch { return {} as any; } })();
const HASURA_ENDPOINT =
  process.env.HASURA_GRAPHQL_ENDPOINT || _hasuraLegacy.endpoint;
const HASURA_ADMIN_SECRET =
  process.env.HASURA_ADMIN_SECRET || _hasuraLegacy.admin_secret;

function getAdminClient(): GraphQLClient {
  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Hasura configuration missing. Set hasura.endpoint and hasura.admin_secret.'
    );
  }
  return new GraphQLClient(HASURA_ENDPOINT, {
    headers: { 'x-hasura-admin-secret': HASURA_ADMIN_SECRET },
  });
}

const INSERT_APPLICATION = gql`
  mutation InsertApplication($data: applications_insert_input!) {
    insert_applications_one(object: $data) {
      id
      job_id
      maid_id
      status
      application_status
      cover_letter
      offer_amount
      message
      created_at
    }
  }
`;

const INCREMENT_APPLICATIONS_COUNT = gql`
  mutation IncrementApplicationsCount($jobId: uuid!) {
    update_jobs_by_pk(
      pk_columns: { id: $jobId }
      _inc: { applications_count: 1 }
    ) {
      id
      applications_count
    }
  }
`;

interface ApplicationData {
  job_id: string;
  maid_id: string;
  cover_letter: string;
  status?: string;
  application_status?: string;
  offer_amount?: number;
  message?: string;
}

interface ManageApplicationRequest {
  action: 'submit' | 'incrementCount';
  applicationData?: ApplicationData;
  jobId?: string;
}

/**
 * Cloud Function: Manage job applications using admin secret
 */
export async function manageApplication(
  data: ManageApplicationRequest,
  context: functions.https.CallableContext
): Promise<{ success: boolean; application?: unknown }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const client = getAdminClient();
  const { action } = data;

  console.log(`[manageApplication] Action: ${action}, User: ${userId}`);

  try {
    if (action === 'submit') {
      const appData = data.applicationData;
      if (!appData?.job_id || !appData?.cover_letter) {
        throw new functions.https.HttpsError('invalid-argument', 'job_id and cover_letter are required');
      }

      // Enforce maid_id matches the authenticated user
      const payload: Record<string, unknown> = {
        ...appData,
        maid_id: userId,
        status: appData.status || 'pending',
        application_status: appData.application_status || 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Remove undefined/null keys
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      console.log(`[manageApplication] Submitting application for job ${appData.job_id} by maid ${userId}`);
      const result = await client.request(INSERT_APPLICATION, { data: payload });
      const application = (result as { insert_applications_one: unknown }).insert_applications_one;

      console.log(`[manageApplication] Application created:`, (application as { id: string })?.id);

      // Also increment the job's applications_count
      try {
        await client.request(INCREMENT_APPLICATIONS_COUNT, { jobId: appData.job_id });
        console.log(`[manageApplication] Incremented applications_count for job ${appData.job_id}`);
      } catch (countError) {
        console.warn(`[manageApplication] Failed to increment count:`, countError);
      }

      return { success: true, application };
    }

    if (action === 'incrementCount') {
      if (!data.jobId) {
        throw new functions.https.HttpsError('invalid-argument', 'jobId is required');
      }

      await client.request(INCREMENT_APPLICATIONS_COUNT, { jobId: data.jobId });
      return { success: true };
    }

    throw new functions.https.HttpsError('invalid-argument', `Unknown action: ${action}`);
  } catch (error) {
    console.error(`[manageApplication] Error:`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError(
      'internal',
      `Failed to ${action} application: ${(error as Error).message}`
    );
  }
}
