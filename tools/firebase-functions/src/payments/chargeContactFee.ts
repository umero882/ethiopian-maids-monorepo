/**
 * Charge Contact Fee (Idempotent) - v1 API
 */

import * as functions from 'firebase-functions';
import { GraphQLClient, gql } from 'graphql-request';

const hasuraClient = new GraphQLClient(
  process.env.HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql',
  {
    headers: {
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
    },
  }
);

const GET_CREDIT_BALANCE = gql`
  query GetCreditBalance($userId: String!) {
    user_credits(where: { user_id: { _eq: $userId } }) {
      balance
    }
  }
`;

const DEDUCT_CREDITS = gql`
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

const CHECK_EXISTING_CONTACT = gql`
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

const INSERT_CONTACT_FEE = gql`
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

const INSERT_CREDIT_TRANSACTION = gql`
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

interface ChargeContactFeeData {
  sponsorId: string;
  maidId: string;
  creditsAmount?: number;
  contactMessage?: string;
}

export async function chargeContactFeeIdempotent(
  data: ChargeContactFeeData,
  context: functions.https.CallableContext
): Promise<{ success: boolean; alreadyContacted?: boolean; insufficientCredits?: boolean; newBalance?: number }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sponsorId, maidId, creditsAmount = 1, contactMessage } = data;

  if (!sponsorId || !maidId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing sponsorId or maidId');
  }

  try {
    // Check if already contacted (idempotency check)
    const existingContact = await hasuraClient.request<{
      contact_fees: Array<{ id: string }>;
    }>(CHECK_EXISTING_CONTACT, { sponsorId, maidId });

    if (existingContact.contact_fees.length > 0) {
      return {
        success: true,
        alreadyContacted: true,
      };
    }

    // Check credit balance
    const balanceResult = await hasuraClient.request<{
      user_credits: Array<{ balance: number }>;
    }>(GET_CREDIT_BALANCE, { userId: sponsorId });

    const currentBalance = balanceResult.user_credits[0]?.balance || 0;

    if (currentBalance < creditsAmount) {
      return {
        success: false,
        insufficientCredits: true,
      };
    }

    // Deduct credits
    const deductResult = await hasuraClient.request<{
      update_user_credits: { affected_rows: number; returning: Array<{ balance: number }> };
    }>(DEDUCT_CREDITS, { userId: sponsorId, amount: creditsAmount });

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

    const newBalance = deductResult.update_user_credits.returning[0]?.balance || 0;

    return {
      success: true,
      newBalance,
    };
  } catch (error) {
    console.error('Error charging contact fee:', error);
    throw new functions.https.HttpsError('internal', 'Failed to charge contact fee');
  }
}
