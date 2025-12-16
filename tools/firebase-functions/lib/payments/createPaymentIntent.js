"use strict";
/**
 * Create Payment Intent
 *
 * Creates a Stripe PaymentIntent for one-time payments (like credit purchases).
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
exports.createPaymentIntent = createPaymentIntent;
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
const GET_CUSTOMER = (0, graphql_request_1.gql) `
  query GetCustomer($userId: String!) {
    stripe_customers(where: { user_id: { _eq: $userId } }, limit: 1) {
      stripe_customer_id
    }
  }
`;
const UPSERT_CUSTOMER = (0, graphql_request_1.gql) `
  mutation UpsertCustomer($userId: String!, $stripeCustomerId: String!) {
    insert_stripe_customers_one(
      object: { user_id: $userId, stripe_customer_id: $stripeCustomerId }
      on_conflict: {
        constraint: stripe_customers_user_id_key
        update_columns: [stripe_customer_id, updated_at]
      }
    ) {
      id
      user_id
      stripe_customer_id
    }
  }
`;
const UPDATE_IDEMPOTENCY = (0, graphql_request_1.gql) `
  mutation UpdateIdempotency($idempotencyKey: String!, $stripePaymentIntentId: String!) {
    update_payment_idempotency(
      where: { idempotency_key: { _eq: $idempotencyKey } }
      _set: { stripe_payment_intent_id: $stripePaymentIntentId, status: "processing", updated_at: "now()" }
    ) {
      affected_rows
    }
  }
`;
async function createPaymentIntent(data, context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { amount, currency = 'usd', description, metadata = {}, idempotencyKey, userEmail } = data;
    const userId = context.auth.uid;
    if (!amount || amount <= 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Amount must be a positive number');
    }
    try {
        // Get or create Stripe customer
        let stripeCustomerId = null;
        const customerResult = await hasuraClient.request(GET_CUSTOMER, { userId });
        if (customerResult.stripe_customers.length > 0) {
            stripeCustomerId = customerResult.stripe_customers[0].stripe_customer_id;
        }
        else {
            // Create new Stripe customer
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    userId,
                    firebaseUid: userId,
                },
            });
            stripeCustomerId = customer.id;
            await hasuraClient.request(UPSERT_CUSTOMER, {
                userId,
                stripeCustomerId: customer.id,
            });
        }
        // Create PaymentIntent
        const paymentIntentParams = {
            amount,
            currency,
            customer: stripeCustomerId,
            description: description || 'Ethiopian Maids Platform Payment',
            metadata: {
                ...metadata,
                userId,
                firebaseUid: userId,
            },
            automatic_payment_methods: {
                enabled: true,
            },
        };
        // Add idempotency key if provided
        const createOptions = {};
        if (idempotencyKey) {
            createOptions.idempotencyKey = idempotencyKey;
        }
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams, createOptions);
        // Update idempotency record with payment intent ID
        if (idempotencyKey) {
            try {
                await hasuraClient.request(UPDATE_IDEMPOTENCY, {
                    idempotencyKey,
                    stripePaymentIntentId: paymentIntent.id,
                });
            }
            catch (updateError) {
                console.warn('Failed to update idempotency record:', updateError);
                // Don't fail the payment intent creation for this
            }
        }
        return {
            success: true,
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret || undefined,
        };
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        if (error instanceof stripe_1.default.errors.StripeError) {
            return {
                success: false,
                error: error.message,
            };
        }
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to create payment intent');
    }
}
//# sourceMappingURL=createPaymentIntent.js.map