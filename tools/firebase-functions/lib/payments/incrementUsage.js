"use strict";
/**
 * Increment Usage Stat - v1 API
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementUsageStat = incrementUsageStat;
const functions = __importStar(require("firebase-functions"));
const graphql_request_1 = require("graphql-request");
const hasuraClient = new graphql_request_1.GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql', {
    headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
});
const UPSERT_USAGE_STATS = (0, graphql_request_1.gql) `
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
const INCREMENT_PROFILE_VIEWS = (0, graphql_request_1.gql) `
  mutation IncrementProfileViews($userId: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { profile_views: $amount }
    ) {
      affected_rows
    }
  }
`;
const INCREMENT_CONTACT_REQUESTS = (0, graphql_request_1.gql) `
  mutation IncrementContactRequests($userId: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { contact_requests: $amount }
    ) {
      affected_rows
    }
  }
`;
const INCREMENT_JOB_POSTS = (0, graphql_request_1.gql) `
  mutation IncrementJobPosts($userId: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { job_posts: $amount }
    ) {
      affected_rows
    }
  }
`;
const INCREMENT_MESSAGES_SENT = (0, graphql_request_1.gql) `
  mutation IncrementMessagesSent($userId: String!, $amount: Int!) {
    update_user_usage_stats(
      where: { user_id: { _eq: $userId } }
      _inc: { messages_sent: $amount }
    ) {
      affected_rows
    }
  }
`;
async function incrementUsageStat(data, context) {
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
    }
    catch (error) {
        console.error('Error incrementing usage stat:', error);
        throw new functions.https.HttpsError('internal', 'Failed to increment usage stat');
    }
}
//# sourceMappingURL=incrementUsage.js.map