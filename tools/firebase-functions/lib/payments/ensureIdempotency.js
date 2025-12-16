"use strict";
/**
 * Ensure Payment Idempotency
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
exports.ensurePaymentIdempotency = ensurePaymentIdempotency;
const functions = __importStar(require("firebase-functions"));
const graphql_request_1 = require("graphql-request");
const crypto = __importStar(require("crypto"));
const hasuraClient = new graphql_request_1.GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql', {
    headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
});
const CHECK_IDEMPOTENCY = (0, graphql_request_1.gql) `
  query CheckIdempotency($key: String!) {
    payment_idempotency(where: { idempotency_key: { _eq: $key } }, limit: 1) {
      id
      status
      result
      created_at
    }
  }
`;
const INSERT_IDEMPOTENCY = (0, graphql_request_1.gql) `
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
async function ensurePaymentIdempotency(data, context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, operation, amount, context: opContext } = data;
    const keyData = `${userId}:${operation}:${amount}:${opContext || ''}:${Date.now()}`;
    const idempotencyKey = crypto.createHash('sha256').update(keyData).digest('hex').substring(0, 32);
    try {
        const existing = await hasuraClient.request(CHECK_IDEMPOTENCY, { key: idempotencyKey });
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
    }
    catch (error) {
        console.error('Error ensuring idempotency:', error);
        throw new functions.https.HttpsError('internal', 'Failed to check payment idempotency');
    }
}
//# sourceMappingURL=ensureIdempotency.js.map