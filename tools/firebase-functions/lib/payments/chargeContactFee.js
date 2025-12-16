"use strict";
/**
 * Charge Contact Fee (Idempotent) - v1 API
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
exports.chargeContactFeeIdempotent = chargeContactFeeIdempotent;
const functions = __importStar(require("firebase-functions"));
const graphql_request_1 = require("graphql-request");
const hasuraClient = new graphql_request_1.GraphQLClient(process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql', {
    headers: {
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
});
const GET_CREDIT_BALANCE = (0, graphql_request_1.gql) `
  query GetCreditBalance($userId: String!) {
    user_credits(where: { user_id: { _eq: $userId } }) {
      balance
    }
  }
`;
const DEDUCT_CREDITS = (0, graphql_request_1.gql) `
  mutation DeductCredits($userId: String!, $amount: Int!) {
    update_user_credits(
      where: { user_id: { _eq: $userId }, balance: { _gte: $amount } }
      _inc: { balance: -$amount }
    ) {
      affected_rows
      returning {
        balance
      }
    }
  }
`;
const CHECK_EXISTING_CONTACT = (0, graphql_request_1.gql) `
  query CheckExistingContact($sponsorId: String!, $maidId: String!) {
    contact_fees(
      where: { sponsor_id: { _eq: $sponsorId }, maid_id: { _eq: $maidId } }
      limit: 1
    ) {
      id
      created_at
    }
  }
`;
const INSERT_CONTACT_FEE = (0, graphql_request_1.gql) `
  mutation InsertContactFee($sponsorId: String!, $maidId: String!, $creditsCharged: Int!, $message: String) {
    insert_contact_fees_one(
      object: {
        sponsor_id: $sponsorId
        maid_id: $maidId
        credits_charged: $creditsCharged
        contact_message: $message
      }
    ) {
      id
    }
  }
`;
const INSERT_CREDIT_TRANSACTION = (0, graphql_request_1.gql) `
  mutation InsertCreditTransaction($userId: String!, $amount: Int!, $description: String!) {
    insert_credit_transactions_one(
      object: {
        user_id: $userId
        amount: $amount
        transaction_type: "charge"
        description: $description
      }
    ) {
      id
    }
  }
`;
async function chargeContactFeeIdempotent(data, context) {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { sponsorId, maidId, creditsAmount = 1, contactMessage } = data;
    if (!sponsorId || !maidId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing sponsorId or maidId');
    }
    try {
        // Check if already contacted (idempotency check)
        const existingContact = await hasuraClient.request(CHECK_EXISTING_CONTACT, { sponsorId, maidId });
        if (existingContact.contact_fees.length > 0) {
            return {
                success: true,
                alreadyContacted: true,
            };
        }
        // Check credit balance
        const balanceResult = await hasuraClient.request(GET_CREDIT_BALANCE, { userId: sponsorId });
        const currentBalance = ((_a = balanceResult.user_credits[0]) === null || _a === void 0 ? void 0 : _a.balance) || 0;
        if (currentBalance < creditsAmount) {
            return {
                success: false,
                insufficientCredits: true,
            };
        }
        // Deduct credits
        const deductResult = await hasuraClient.request(DEDUCT_CREDITS, { userId: sponsorId, amount: creditsAmount });
        if (deductResult.update_user_credits.affected_rows === 0) {
            return {
                success: false,
                insufficientCredits: true,
            };
        }
        // Record contact fee
        await hasuraClient.request(INSERT_CONTACT_FEE, {
            sponsorId,
            maidId,
            creditsCharged: creditsAmount,
            message: contactMessage,
        });
        // Record transaction
        await hasuraClient.request(INSERT_CREDIT_TRANSACTION, {
            userId: sponsorId,
            amount: -creditsAmount,
            description: `Contact fee for maid ${maidId}`,
        });
        const newBalance = ((_b = deductResult.update_user_credits.returning[0]) === null || _b === void 0 ? void 0 : _b.balance) || 0;
        return {
            success: true,
            newBalance,
        };
    }
    catch (error) {
        console.error('Error charging contact fee:', error);
        throw new functions.https.HttpsError('internal', 'Failed to charge contact fee');
    }
}
//# sourceMappingURL=chargeContactFee.js.map