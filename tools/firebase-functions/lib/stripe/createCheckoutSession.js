"use strict";
/**
 * Create Stripe Checkout Session
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
exports.createCheckoutSession = createCheckoutSession;
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
const GET_CUSTOMER = (0, graphql_request_1.gql) `
  query GetCustomer($userId: String!) {
    stripe_customers(where: { user_id: { _eq: $userId } }, limit: 1) {
      stripe_customer_id
    }
  }
`;
async function createCheckoutSession(data, context) {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { priceId, planName, userEmail, successUrl, cancelUrl, userType, planTier, billingCycle } = data;
    // IMPORTANT: Always use the verified Firebase UID from auth context, not from client data
    // This ensures the subscription is linked to the correct user profile
    const userId = context.auth.uid;
    if (!priceId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing priceId');
    }
    console.log(`Creating checkout session for Firebase user: ${userId}`);
    try {
        let stripeCustomerId = null;
        const customerResult = await hasuraClient.request(GET_CUSTOMER, { userId });
        if (customerResult.stripe_customers.length > 0) {
            stripeCustomerId = customerResult.stripe_customers[0].stripe_customer_id;
        }
        else {
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    userId, // This is now the verified Firebase UID
                    firebaseUid: userId, // Explicitly set for clarity
                    userType: userType || '',
                },
            });
            stripeCustomerId = customer.id;
            await hasuraClient.request(UPSERT_CUSTOMER, {
                userId,
                stripeCustomerId: customer.id,
            });
        }
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl || `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.APP_URL || 'https://ethiopianmaids.com'}/dashboard?canceled=true`,
            metadata: {
                userId, // This is now the verified Firebase UID
                firebaseUid: userId, // Explicitly set for clarity
                planName: planName || '',
                userType: userType || '',
                planTier: planTier || '',
                billingCycle: billingCycle || '',
            },
            subscription_data: {
                metadata: {
                    userId, // This is now the verified Firebase UID
                    firebaseUid: userId, // Explicitly set for clarity
                    planName: planName || '',
                    userType: userType || '',
                    planTier: planTier || '',
                },
            },
        });
        if (!session.url) {
            throw new Error('Failed to create checkout session URL');
        }
        return {
            url: session.url,
            sessionId: session.id,
        };
    }
    catch (error) {
        console.error('Error creating checkout session:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create checkout session');
    }
}
//# sourceMappingURL=createCheckoutSession.js.map