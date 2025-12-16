"use strict";
/**
 * Purchase Credits (Idempotent) - v1 API
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
exports.purchaseCreditsIdempotent = purchaseCreditsIdempotent;
exports.completeCreditPurchase = completeCreditPurchase;
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
async function purchaseCreditsIdempotent(data, context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { userId, creditsAmount, costUsdCents } = data;
    if (!userId || !creditsAmount || !costUsdCents) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
    }
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${creditsAmount} Credits`,
                            description: `Purchase ${creditsAmount} credits for Ethiopian Maids platform`,
                        },
                        unit_amount: costUsdCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?credits_purchased=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?credits_canceled=true`,
            metadata: {
                userId,
                creditsAmount: creditsAmount.toString(),
                type: 'credit_purchase',
                firebaseUid: context.auth.uid,
            },
        });
        return {
            success: true,
            checkoutUrl: session.url || undefined,
        };
    }
    catch (error) {
        console.error('Error purchasing credits:', error);
        throw new functions.https.HttpsError('internal', 'Failed to initiate credit purchase');
    }
}
/**
 * Complete credit purchase (called from webhook after successful payment)
 */
async function completeCreditPurchase(userId, creditsAmount, stripePaymentIntentId) {
    await hasuraClient.request(UPSERT_USER_CREDITS, {
        userId,
        amount: 0,
    });
    await hasuraClient.request(ADD_CREDITS, {
        userId,
        amount: creditsAmount,
    });
    await hasuraClient.request(INSERT_CREDIT_TRANSACTION, {
        userId,
        amount: creditsAmount,
        type: 'purchase',
        description: `Purchased ${creditsAmount} credits`,
        stripePaymentIntentId,
    });
}
//# sourceMappingURL=purchaseCredits.js.map