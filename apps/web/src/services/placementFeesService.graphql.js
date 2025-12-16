import { gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { createLogger } from '@/utils/logger';

const log = createLogger('PlacementFeesService.GraphQL');

// Get agency credits - using String for Firebase UID compatibility
const GetAgencyCreditsDocument = gql`
  query GetAgencyCredits($agencyId: String!) {
    agency_credits(where: { agency_id: { _eq: $agencyId } }) {
      id
      agency_id
      total_credits
      available_credits
      reserved_credits
      auto_apply_credits
      credit_transactions
      last_credit_earned_at
      last_credit_used_at
      created_at
    }
  }
`;

// Get placement fee transactions
const GetPlacementFeeTransactionsDocument = gql`
  query GetPlacementFeeTransactions($agencyId: String!, $limit: Int = 50) {
    placement_fee_transactions(
      where: { agency_id: { _eq: $agencyId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      agency_id
      maid_id
      sponsor_id
      job_id
      placement_id
      fee_amount
      credits_applied
      amount_charged
      fee_status
      visa_status
      currency
      payment_method
      payment_reference
      deducted_at
      escrow_until
      released_at
      credited_at
      refunded_at
      notes
      metadata
      created_at
      updated_at
      user {
        id
        full_name
        email
      }
    }
  }
`;

// Get placement fee transactions with maid and sponsor details
const GetPlacementFeeTransactionsWithDetailsDocument = gql`
  query GetPlacementFeeTransactionsWithDetails($agencyId: String!, $limit: Int = 50) {
    placement_fee_transactions(
      where: { agency_id: { _eq: $agencyId } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      agency_id
      maid_id
      sponsor_id
      job_id
      placement_id
      fee_amount
      credits_applied
      amount_charged
      fee_status
      visa_status
      currency
      payment_method
      payment_reference
      deducted_at
      escrow_until
      released_at
      credited_at
      refunded_at
      notes
      metadata
      created_at
      updated_at
    }
  }
`;

// Get active placements (pending visa)
const GetActivePlacementsDocument = gql`
  query GetActivePlacements($agencyId: String!) {
    agency_placements(
      where: {
        agency_id: { _eq: $agencyId }
        status: { _in: ["pending_visa", "active", "in_progress"] }
      }
      order_by: { created_at: desc }
    ) {
      id
      agency_id
      maid_id
      sponsor_id
      job_id
      status
      placement_date
      application_date
      notes
      created_at
      updated_at
      userByMaidId {
        id
        full_name
        email
      }
      userBySponsorId {
        id
        full_name
        email
      }
      placement_fee_transactions {
        id
        fee_amount
        credits_applied
        amount_charged
        fee_status
        visa_status
        escrow_until
        deducted_at
      }
    }
  }
`;

// Get escrow balance (fees in escrow status)
const GetEscrowBalanceDocument = gql`
  query GetEscrowBalance($agencyId: String!) {
    placement_fee_transactions_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        fee_status: { _eq: "escrow" }
      }
    ) {
      aggregate {
        sum {
          amount_charged
        }
        count
      }
    }
  }
`;

// Get released fees (last 30 days)
const GetReleasedFeesDocument = gql`
  query GetReleasedFees($agencyId: String!, $since: timestamptz!) {
    placement_fee_transactions_aggregate(
      where: {
        agency_id: { _eq: $agencyId }
        fee_status: { _eq: "released" }
        released_at: { _gte: $since }
      }
    ) {
      aggregate {
        sum {
          fee_amount
        }
        count
      }
    }
  }
`;

// Get maid profiles for transactions
const GetMaidProfilesDocument = gql`
  query GetMaidProfiles($maidIds: [uuid!]!) {
    maid_profiles(where: { id: { _in: $maidIds } }) {
      id
      full_name
      nationality
      date_of_birth
      profile_photo
    }
  }
`;

// Get sponsor profiles for transactions
const GetSponsorProfilesDocument = gql`
  query GetSponsorProfiles($sponsorIds: [uuid!]!) {
    sponsor_profiles(where: { id: { _in: $sponsorIds } }) {
      id
      full_name
      city
      country
      phone
    }
  }
`;

// Update placement fee transaction (visa approval)
const UpdateFeeTransactionVisaApprovedDocument = gql`
  mutation UpdateFeeTransactionVisaApproved($id: uuid!, $released_at: timestamptz!) {
    update_placement_fee_transactions_by_pk(
      pk_columns: { id: $id }
      _set: {
        fee_status: "released"
        visa_status: "visa_approved"
        released_at: $released_at
      }
    ) {
      id
      fee_status
      visa_status
      released_at
    }
  }
`;

// Update placement fee transaction (maid returned - convert to credit)
const UpdateFeeTransactionMaidReturnedDocument = gql`
  mutation UpdateFeeTransactionMaidReturned($id: uuid!, $credited_at: timestamptz!, $notes: String) {
    update_placement_fee_transactions_by_pk(
      pk_columns: { id: $id }
      _set: {
        fee_status: "credited"
        visa_status: "maid_returned"
        credited_at: $credited_at
        notes: $notes
      }
    ) {
      id
      fee_status
      visa_status
      credited_at
      fee_amount
    }
  }
`;

// Update agency credits
const UpdateAgencyCreditsDocument = gql`
  mutation UpdateAgencyCredits($agencyId: String!, $available_credits: numeric!, $total_credits: numeric!, $last_credit_earned_at: timestamptz) {
    update_agency_credits(
      where: { agency_id: { _eq: $agencyId } }
      _set: {
        available_credits: $available_credits
        total_credits: $total_credits
        last_credit_earned_at: $last_credit_earned_at
      }
    ) {
      affected_rows
      returning {
        id
        available_credits
        total_credits
      }
    }
  }
`;

// Update placement status
const UpdatePlacementStatusDocument = gql`
  mutation UpdatePlacementStatus($id: uuid!, $status: String!) {
    update_agency_placements_by_pk(
      pk_columns: { id: $id }
      _set: { status: $status }
    ) {
      id
      status
    }
  }
`;

// Add credits to agency (manual deposit)
const AddAgencyCreditsDocument = gql`
  mutation AddAgencyCredits(
    $agencyId: String!
    $available_credits: numeric!
    $total_credits: numeric!
  ) {
    update_agency_credits(
      where: { agency_id: { _eq: $agencyId } }
      _set: {
        available_credits: $available_credits
        total_credits: $total_credits
      }
    ) {
      affected_rows
      returning {
        id
        available_credits
        total_credits
      }
    }
  }
`;

// Insert agency credits if not exists
const InsertAgencyCreditsDocument = gql`
  mutation InsertAgencyCredits(
    $agencyId: String!
    $available_credits: numeric!
    $total_credits: numeric!
  ) {
    insert_agency_credits_one(
      object: {
        agency_id: $agencyId
        available_credits: $available_credits
        total_credits: $total_credits
        reserved_credits: 0
        auto_apply_credits: true
      }
      on_conflict: {
        constraint: agency_credits_agency_id_key
        update_columns: [available_credits, total_credits]
      }
    ) {
      id
      available_credits
      total_credits
    }
  }
`;

class PlacementFeesService {
  async getAgencyCredits(agencyId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetAgencyCreditsDocument,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      const credits = data?.agency_credits?.[0];

      // Return default credits if none exist
      if (!credits) {
        return {
          data: {
            total_credits: 0,
            available_credits: 0,
            reserved_credits: 0,
            auto_apply_credits: true,
            credit_transactions: [],
          },
          error: null,
        };
      }

      return { data: credits, error: null };
    } catch (error) {
      log.error('Error fetching agency credits:', error);
      return { data: null, error };
    }
  }

  async getPlacementFeeTransactions(agencyId, limit = 50) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetPlacementFeeTransactionsWithDetailsDocument,
        variables: { agencyId, limit },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      const transactions = data?.placement_fee_transactions || [];

      // Get unique maid and sponsor IDs
      const maidIds = [...new Set(transactions.filter(t => t.maid_id).map(t => t.maid_id))];
      const sponsorIds = [...new Set(transactions.filter(t => t.sponsor_id).map(t => t.sponsor_id))];

      // Fetch maid and sponsor profiles in parallel
      const [maidsResult, sponsorsResult] = await Promise.all([
        maidIds.length > 0 ? this.getMaidProfiles(maidIds) : { data: [] },
        sponsorIds.length > 0 ? this.getSponsorProfiles(sponsorIds) : { data: [] },
      ]);

      // Create lookup maps
      const maidsMap = new Map((maidsResult.data || []).map(m => [m.id, m]));
      const sponsorsMap = new Map((sponsorsResult.data || []).map(s => [s.id, s]));

      // Enrich transactions with maid and sponsor data
      const enrichedTransactions = transactions.map(transaction => ({
        ...transaction,
        maid: maidsMap.get(transaction.maid_id) || null,
        sponsor: sponsorsMap.get(transaction.sponsor_id) || null,
      }));

      return { data: enrichedTransactions, error: null };
    } catch (error) {
      log.error('Error fetching placement fee transactions:', error);
      return { data: [], error };
    }
  }

  async getMaidProfiles(maidIds) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetMaidProfilesDocument,
        variables: { maidIds },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      return { data: data?.maid_profiles || [], error: null };
    } catch (error) {
      log.error('Error fetching maid profiles:', error);
      return { data: [], error };
    }
  }

  async getSponsorProfiles(sponsorIds) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetSponsorProfilesDocument,
        variables: { sponsorIds },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      return { data: data?.sponsor_profiles || [], error: null };
    } catch (error) {
      log.error('Error fetching sponsor profiles:', error);
      return { data: [], error };
    }
  }

  async getActivePlacements(agencyId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetActivePlacementsDocument,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: [], error: errors[0] };
      }

      const placements = data?.agency_placements || [];

      // Get unique maid and sponsor IDs from placements
      const maidIds = [...new Set(placements.filter(p => p.maid_id).map(p => p.maid_id))];
      const sponsorIds = [...new Set(placements.filter(p => p.sponsor_id).map(p => p.sponsor_id))];

      // Fetch maid and sponsor profiles
      const [maidsResult, sponsorsResult] = await Promise.all([
        maidIds.length > 0 ? this.getMaidProfiles(maidIds) : { data: [] },
        sponsorIds.length > 0 ? this.getSponsorProfiles(sponsorIds) : { data: [] },
      ]);

      // Create lookup maps
      const maidsMap = new Map((maidsResult.data || []).map(m => [m.id, m]));
      const sponsorsMap = new Map((sponsorsResult.data || []).map(s => [s.id, s]));

      // Enrich placements
      const enrichedPlacements = placements.map(placement => ({
        ...placement,
        maid: maidsMap.get(placement.maid_id) || placement.userByMaidId || null,
        sponsor: sponsorsMap.get(placement.sponsor_id) || placement.userBySponsorId || null,
        fee_transaction: placement.placement_fee_transactions?.[0] || null,
        contract_status: placement.status,
        visa_application_date: placement.application_date,
      }));

      return { data: enrichedPlacements, error: null };
    } catch (error) {
      log.error('Error fetching active placements:', error);
      return { data: [], error };
    }
  }

  async getEscrowBalance(agencyId) {
    try {
      const { data, errors } = await apolloClient.query({
        query: GetEscrowBalanceDocument,
        variables: { agencyId },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: 0, error: errors[0] };
      }

      const sum = data?.placement_fee_transactions_aggregate?.aggregate?.sum?.amount_charged || 0;
      return { data: parseFloat(sum) || 0, error: null };
    } catch (error) {
      log.error('Error fetching escrow balance:', error);
      return { data: 0, error };
    }
  }

  async getReleasedFees(agencyId, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, errors } = await apolloClient.query({
        query: GetReleasedFeesDocument,
        variables: { agencyId, since: since.toISOString() },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: 0, error: errors[0] };
      }

      const sum = data?.placement_fee_transactions_aggregate?.aggregate?.sum?.fee_amount || 0;
      return { data: parseFloat(sum) || 0, error: null };
    } catch (error) {
      log.error('Error fetching released fees:', error);
      return { data: 0, error };
    }
  }

  async processVisaApproval(agencyId, placementId) {
    try {
      // First, find the fee transaction for this placement
      const { data: transactions } = await this.getPlacementFeeTransactions(agencyId, 100);
      const transaction = transactions.find(t => t.placement_id === placementId && t.fee_status === 'escrow');

      if (!transaction) {
        return { data: null, error: new Error('Fee transaction not found or already processed') };
      }

      // Update fee transaction to released
      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateFeeTransactionVisaApprovedDocument,
        variables: {
          id: transaction.id,
          released_at: new Date().toISOString(),
        },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      // Update placement status
      await apolloClient.mutate({
        mutation: UpdatePlacementStatusDocument,
        variables: {
          id: placementId,
          status: 'visa_approved',
        },
      });

      return { data: data?.update_placement_fee_transactions_by_pk, error: null };
    } catch (error) {
      log.error('Error processing visa approval:', error);
      return { data: null, error };
    }
  }

  async processMaidReturn(agencyId, placementId, reason = '') {
    try {
      // First, find the fee transaction for this placement
      const { data: transactions } = await this.getPlacementFeeTransactions(agencyId, 100);
      const transaction = transactions.find(t => t.placement_id === placementId && t.fee_status === 'escrow');

      if (!transaction) {
        return { data: null, error: new Error('Fee transaction not found or already processed') };
      }

      // Update fee transaction to credited
      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateFeeTransactionMaidReturnedDocument,
        variables: {
          id: transaction.id,
          credited_at: new Date().toISOString(),
          notes: reason || 'Maid returned - fee converted to credit',
        },
      });

      if (errors) {
        log.error('GraphQL errors:', errors);
        return { data: null, error: errors[0] };
      }

      // Get current credits and update
      const { data: credits } = await this.getAgencyCredits(agencyId);
      const feeAmount = parseFloat(transaction.fee_amount) || 0;
      const newAvailable = (parseFloat(credits?.available_credits) || 0) + feeAmount;
      const newTotal = (parseFloat(credits?.total_credits) || 0) + feeAmount;

      await apolloClient.mutate({
        mutation: UpdateAgencyCreditsDocument,
        variables: {
          agencyId,
          available_credits: newAvailable,
          total_credits: newTotal,
          last_credit_earned_at: new Date().toISOString(),
        },
      });

      // Update placement status
      await apolloClient.mutate({
        mutation: UpdatePlacementStatusDocument,
        variables: {
          id: placementId,
          status: 'maid_returned',
        },
      });

      return { data: data?.update_placement_fee_transactions_by_pk, error: null };
    } catch (error) {
      log.error('Error processing maid return:', error);
      return { data: null, error };
    }
  }

  async getCreditHistory(agencyId) {
    try {
      const { data: credits } = await this.getAgencyCredits(agencyId);

      // Parse credit_transactions if it's a JSON field
      let history = [];
      if (credits?.credit_transactions) {
        if (typeof credits.credit_transactions === 'string') {
          try {
            history = JSON.parse(credits.credit_transactions);
          } catch (e) {
            history = [];
          }
        } else if (Array.isArray(credits.credit_transactions)) {
          history = credits.credit_transactions;
        }
      }

      return { data: history, error: null };
    } catch (error) {
      log.error('Error fetching credit history:', error);
      return { data: [], error };
    }
  }

  async getPlacementFeesDashboard(agencyId) {
    try {
      // Fetch all data in parallel
      const [creditsResult, escrowResult, releasedResult, transactionsResult, placementsResult] = await Promise.all([
        this.getAgencyCredits(agencyId),
        this.getEscrowBalance(agencyId),
        this.getReleasedFees(agencyId, 30),
        this.getPlacementFeeTransactions(agencyId, 50),
        this.getActivePlacements(agencyId),
      ]);

      return {
        data: {
          credits: creditsResult.data,
          escrowBalance: escrowResult.data,
          releasedFees: releasedResult.data,
          feeTransactions: transactionsResult.data,
          activePlacements: placementsResult.data,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error fetching placement fees dashboard:', error);
      return { data: null, error };
    }
  }

  /**
   * Add placement fee/credits to agency wallet (manual deposit)
   * @param {string} agencyId - Agency ID (Firebase UID)
   * @param {number} amount - Amount to add (default 500)
   * @param {string} currency - Currency code (default AED)
   * @param {string} notes - Optional notes for the transaction
   */
  async addPlacementFee(agencyId, amount = 500, currency = 'AED', notes = '') {
    try {
      log.info(`addPlacementFee called - agencyId: ${agencyId}, amount: ${amount}, currency: ${currency}`);

      if (!agencyId) {
        log.error('addPlacementFee: agencyId is required');
        return { data: null, error: new Error('Agency ID is required') };
      }

      // Get current credits
      const { data: currentCredits, error: fetchError } = await this.getAgencyCredits(agencyId);
      log.info('Current credits fetched:', { currentCredits, fetchError });

      if (fetchError) {
        log.error('Error fetching current credits:', fetchError);
        return { data: null, error: fetchError };
      }

      const currentAvailable = parseFloat(currentCredits?.available_credits) || 0;
      const currentTotal = parseFloat(currentCredits?.total_credits) || 0;
      const newAvailable = currentAvailable + amount;
      const newTotal = currentTotal + amount;

      log.info(`Balance calculation - current: ${currentAvailable}, adding: ${amount}, new: ${newAvailable}`);

      // Check if credits record exists
      if (currentCredits?.id) {
        // Update existing credits
        log.info('Updating existing credits record:', currentCredits.id);
        const { data, errors } = await apolloClient.mutate({
          mutation: AddAgencyCreditsDocument,
          variables: {
            agencyId,
            available_credits: newAvailable,
            total_credits: newTotal,
          },
        });

        if (errors && errors.length > 0) {
          log.error('GraphQL mutation errors:', errors);
          return { data: null, error: errors[0] };
        }

        log.info(`Successfully added ${amount} ${currency} to agency ${agencyId}. New balance: ${newAvailable}`, data);
        return {
          data: {
            previous_balance: currentAvailable,
            amount_added: amount,
            new_balance: newAvailable,
            currency,
            notes,
          },
          error: null
        };
      } else {
        // Insert new credits record
        log.info('Creating new credits record for agency:', agencyId);
        const { data, errors } = await apolloClient.mutate({
          mutation: InsertAgencyCreditsDocument,
          variables: {
            agencyId,
            available_credits: amount,
            total_credits: amount,
          },
        });

        if (errors && errors.length > 0) {
          log.error('GraphQL insert errors:', errors);
          return { data: null, error: errors[0] };
        }

        log.info(`Successfully created credits for agency ${agencyId} with ${amount} ${currency}`, data);
        return {
          data: {
            previous_balance: 0,
            amount_added: amount,
            new_balance: amount,
            currency,
            notes,
          },
          error: null
        };
      }
    } catch (error) {
      log.error('Error adding placement fee:', error);
      return { data: null, error };
    }
  }

  /**
   * Check if agency has sufficient balance for placements
   * @param {string} agencyId - Agency UUID
   * @param {number} requiredAmount - Minimum required amount (default 500)
   */
  async checkSufficientBalance(agencyId, requiredAmount = 500) {
    try {
      const { data: credits, error } = await this.getAgencyCredits(agencyId);

      if (error) {
        return { hasSufficientBalance: false, balance: 0, required: requiredAmount, error };
      }

      const balance = parseFloat(credits?.available_credits) || 0;
      return {
        hasSufficientBalance: balance >= requiredAmount,
        balance,
        required: requiredAmount,
        shortfall: Math.max(0, requiredAmount - balance),
        error: null,
      };
    } catch (error) {
      log.error('Error checking balance:', error);
      return { hasSufficientBalance: false, balance: 0, required: requiredAmount, error };
    }
  }
}

export const placementFeesService = new PlacementFeesService();
export default placementFeesService;
