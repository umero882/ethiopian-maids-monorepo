"use strict";
/**
 * Cleanup Expired Idempotency Keys
 *
 * Scheduled function and callable function to remove old idempotency records.
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
exports.cleanupExpiredIdempotency = cleanupExpiredIdempotency;
exports.cleanupExpiredIdempotencyCallable = cleanupExpiredIdempotencyCallable;
const functions = __importStar(require("firebase-functions"));
const graphql_request_1 = require("graphql-request");
const hasuraClient = new graphql_request_1.GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql', {
    headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
});
const DELETE_EXPIRED_IDEMPOTENCY = (0, graphql_request_1.gql) `
  mutation DeleteExpiredIdempotency($expiryDate: timestamptz!) {
    delete_payment_idempotency(where: { created_at: { _lt: $expiryDate } }) {
      affected_rows
    }
  }
`;
const DELETE_USER_EXPIRED_IDEMPOTENCY = (0, graphql_request_1.gql) `
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
async function cleanupExpiredIdempotency() {
    try {
        // Delete records older than 24 hours
        const expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const result = await hasuraClient.request(DELETE_EXPIRED_IDEMPOTENCY, { expiryDate });
        console.log(`Cleaned up ${result.delete_payment_idempotency.affected_rows} expired idempotency records`);
    }
    catch (error) {
        console.error('Error cleaning up idempotency records:', error);
        throw error;
    }
}
/**
 * Callable cleanup function (can be called by admin users)
 * Only cleans up records belonging to the authenticated user
 */
async function cleanupExpiredIdempotencyCallable(data, context) {
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
        const result = await hasuraClient.request(DELETE_USER_EXPIRED_IDEMPOTENCY, { userId, expiryDate });
        const deletedCount = result.delete_payment_idempotency.affected_rows;
        console.log(`User ${userId} cleaned up ${deletedCount} expired idempotency records`);
        return {
            success: true,
            deletedCount,
        };
    }
    catch (error) {
        console.error('Error cleaning up user idempotency records:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to cleanup idempotency records');
    }
}
//# sourceMappingURL=cleanupIdempotency.js.map