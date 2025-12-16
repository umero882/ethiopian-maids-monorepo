"use strict";
/**
 * Update Payment Status
 *
 * Updates the status of a payment in the idempotency table.
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
exports.updatePaymentStatus = updatePaymentStatus;
const functions = __importStar(require("firebase-functions"));
const graphql_request_1 = require("graphql-request");
const hasuraClient = new graphql_request_1.GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql', {
    headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
});
const UPDATE_PAYMENT_STATUS = (0, graphql_request_1.gql) `
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
const GET_PAYMENT_IDEMPOTENCY = (0, graphql_request_1.gql) `
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
async function updatePaymentStatus(data, context) {
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
        const existingResult = await hasuraClient.request(GET_PAYMENT_IDEMPOTENCY, { idempotencyKey });
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
        const updateResult = await hasuraClient.request(UPDATE_PAYMENT_STATUS, {
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
    }
    catch (error) {
        console.error('Error updating payment status:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to update payment status');
    }
}
//# sourceMappingURL=updatePaymentStatus.js.map