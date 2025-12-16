"use strict";
/**
 * Complete Credit Purchase (Callable)
 *
 * Called after successful Stripe payment to finalize credit purchase.
 * This is a callable wrapper around the internal completeCreditPurchase function.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeCreditPurchaseCallable = completeCreditPurchaseCallable;
const functions = __importStar(require("firebase-functions"));
const stripe_1 = __importDefault(require("stripe"));
const graphql_request_1 = require("graphql-request");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
const hasuraClient = new graphql_request_1.GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql', {
    headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
});
const UPSERT_USER_CREDITS = (0, graphql_request_1.gql) `
  mutation UpsertUserCredits($userId: String!, $amount: Int!) {
    insert_user_credits_one(
      object: { user_id: $userId, balance: $amount }
      on_conflict: {
        constraint: user_credits_user_id_key
        update_columns: [balance, updated_at]
      }
    ) {
      id
      balance
    }
  }
`;
const ADD_CREDITS = (0, graphql_request_1.gql) `
  mutation AddCredits($userId: String!, $amount: Int!) {
    update_user_credits(
      where: { user_id: { _eq: $userId } }
      _inc: { balance: $amount }
    ) {
      returning {
        balance
      }
    }
  }
`;
const INSERT_CREDIT_TRANSACTION = (0, graphql_request_1.gql) `
  mutation InsertCreditTransaction(
    $userId: String!
    $amount: Int!
    $type: String!
    $description: String
    $stripePaymentIntentId: String
  ) {
    insert_credit_transactions_one(
      object: {
        user_id: $userId
        amount: $amount
        transaction_type: $type
        description: $description
        stripe_payment_intent_id: $stripePaymentIntentId
      }
    ) {
      id
    }
  }
`;
const UPDATE_IDEMPOTENCY_STATUS = (0, graphql_request_1.gql) `
  mutation UpdateIdempotencyStatus($idempotencyKey: String!, $status: String!, $result: jsonb) {
    update_payment_idempotency(
      where: { idempotency_key: { _eq: $idempotencyKey } }
      _set: { status: $status, result: $result, updated_at: "now()" }
    ) {
      affected_rows
    }
  }
`;
async function completeCreditPurchaseCallable(data, context) {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { idempotencyKey, stripePaymentIntentId } = data;
    if (!idempotencyKey || !stripePaymentIntentId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing idempotencyKey or stripePaymentIntentId');
    }
    const userId = context.auth.uid;
    try {
        // Verify the payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return {
                success: false,
                error: `Payment not successful. Status: ${paymentIntent.status}`,
            };
        }
        // Get credits amount from payment intent metadata
        const creditsAmount = parseInt(((_a = paymentIntent.metadata) === null || _a === void 0 ? void 0 : _a.creditsAmount) || '0', 10);
        if (creditsAmount <= 0) {
            return {
                success: false,
                error: 'Invalid credits amount in payment metadata',
            };
        }
        // Ensure user has a credits record
        await hasuraClient.request(UPSERT_USER_CREDITS, {
            userId,
            amount: 0,
        });
        // Add credits to user balance
        const addResult = await hasuraClient.request(ADD_CREDITS, {
            userId,
            amount: creditsAmount,
        });
        const newBalance = ((_b = addResult.update_user_credits.returning[0]) === null || _b === void 0 ? void 0 : _b.balance) || creditsAmount;
        // Record the transaction
        const transactionResult = await hasuraClient.request(INSERT_CREDIT_TRANSACTION, {
            userId,
            amount: creditsAmount,
            type: 'purchase',
            description: `Purchased ${creditsAmount} credits`,
            stripePaymentIntentId,
        });
        // Update idempotency record
        await hasuraClient.request(UPDATE_IDEMPOTENCY_STATUS, {
            idempotencyKey,
            status: 'completed',
            result: {
                creditsBalance: newBalance,
                creditsAdded: creditsAmount,
                transactionId: transactionResult.insert_credit_transactions_one.id,
            },
        });
        return {
            success: true,
            creditsBalance: newBalance,
            transactionId: transactionResult.insert_credit_transactions_one.id,
        };
    }
    catch (error) {
        console.error('Error completing credit purchase:', error);
        // Update idempotency record as failed
        try {
            await hasuraClient.request(UPDATE_IDEMPOTENCY_STATUS, {
                idempotencyKey,
                status: 'failed',
                result: { error: error instanceof Error ? error.message : 'Unknown error' },
            });
        }
        catch (updateError) {
            console.error('Failed to update idempotency status:', updateError);
        }
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to complete credit purchase');
    }
}
//# sourceMappingURL=completeCreditPurchaseCallable.js.map