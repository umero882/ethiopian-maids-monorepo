/**
 * createJob Cloud Function
 *
 * Uses Hasura admin secret to insert into the jobs table,
 * bypassing JWT role permission issues.
 */

import * as functions from 'firebase-functions';
import { GraphQLClient, gql } from 'graphql-request';

// Hasura config
const HASURA_ENDPOINT =
  functions.config().hasura?.endpoint || process.env.HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET =
  functions.config().hasura?.admin_secret || process.env.HASURA_ADMIN_SECRET;

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

const INSERT_JOB = gql`
  mutation InsertJob($data: jobs_insert_input!) {
    insert_jobs_one(object: $data) {
      id
      title
      description
      job_type
      country
      city
      status
      sponsor_id
      salary_min
      salary_max
      currency
      created_at
      updated_at
    }
  }
`;

const UPDATE_JOB = gql`
  mutation UpdateJob($id: uuid!, $data: jobs_set_input!) {
    update_jobs_by_pk(
      pk_columns: { id: $id }
      _set: $data
    ) {
      id
      title
      status
      updated_at
    }
  }
`;

interface JobData {
  [key: string]: unknown;
}

interface CreateJobRequest {
  action: 'create' | 'update' | 'delete' | 'changeStatus';
  jobData?: JobData;
  jobId?: string;
  status?: string;
}

/**
 * Cloud Function: Manage jobs using admin secret
 * Supports create, update, delete, changeStatus actions
 */
export async function manageJob(
  data: CreateJobRequest,
  context: functions.https.CallableContext
): Promise<{ success: boolean; job: unknown }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  const client = getAdminClient();
  const { action, jobData, jobId, status } = data;

  console.log(`[manageJob] Action: ${action}, User: ${userId}`);

  try {
    if (action === 'create') {
      if (!jobData) {
        throw new functions.https.HttpsError('invalid-argument', 'jobData is required for create');
      }

      // Ensure sponsor_id is set to the authenticated user
      const payload: Record<string, unknown> = {
        ...jobData,
        sponsor_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Remove undefined/null keys that Hasura doesn't accept
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) {
          delete payload[key];
        }
      });

      console.log(`[manageJob] Creating job for sponsor ${userId}`);
      const result = await client.request(INSERT_JOB, { data: payload });
      console.log(`[manageJob] Job created:`, (result as { insert_jobs_one: { id: string } }).insert_jobs_one?.id);

      return {
        success: true,
        job: (result as { insert_jobs_one: unknown }).insert_jobs_one,
      };
    }

    if (action === 'update') {
      if (!jobId || !jobData) {
        throw new functions.https.HttpsError('invalid-argument', 'jobId and jobData required for update');
      }

      const updatePayload: Record<string, unknown> = {
        ...jobData,
        updated_at: new Date().toISOString(),
      };

      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined) {
          delete updatePayload[key];
        }
      });

      console.log(`[manageJob] Updating job ${jobId}`);
      const result = await client.request(UPDATE_JOB, { id: jobId, data: updatePayload });

      return {
        success: true,
        job: (result as { update_jobs_by_pk: unknown }).update_jobs_by_pk,
      };
    }

    if (action === 'changeStatus') {
      if (!jobId || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'jobId and status required');
      }

      console.log(`[manageJob] Changing job ${jobId} status to ${status}`);
      const result = await client.request(UPDATE_JOB, {
        id: jobId,
        data: { status, updated_at: new Date().toISOString() },
      });

      return {
        success: true,
        job: (result as { update_jobs_by_pk: unknown }).update_jobs_by_pk,
      };
    }

    if (action === 'delete') {
      if (!jobId) {
        throw new functions.https.HttpsError('invalid-argument', 'jobId required for delete');
      }

      const DELETE_JOB = gql`
        mutation DeleteJob($id: uuid!) {
          delete_jobs_by_pk(id: $id) {
            id
            title
          }
        }
      `;

      console.log(`[manageJob] Deleting job ${jobId}`);
      const result = await client.request(DELETE_JOB, { id: jobId });

      return {
        success: true,
        job: (result as { delete_jobs_by_pk: unknown }).delete_jobs_by_pk,
      };
    }

    throw new functions.https.HttpsError('invalid-argument', `Unknown action: ${action}`);
  } catch (error) {
    console.error(`[manageJob] Error:`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError(
      'internal',
      `Failed to ${action} job: ${(error as Error).message}`
    );
  }
}
