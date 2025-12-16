/**
 * Placement Workflow Service - GraphQL Implementation
 *
 * Handles placement workflow state machine operations.
 * Manages the full lifecycle from contact to confirmed placement.
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

// ============================================================================
// GRAPHQL DOCUMENTS
// ============================================================================

const GET_PLACEMENT_WORKFLOW = gql`
  query GetPlacementWorkflow($id: uuid!) {
    placement_workflows_by_pk(id: $id) {
      id
      sponsor_id
      agency_id
      maid_id
      status
      platform_fee_amount
      platform_fee_currency
      fee_status
      contact_date
      interview_scheduled_date
      interview_completed_date
      trial_start_date
      trial_end_date
      placement_confirmed_date
      sponsor_confirmed
      agency_confirmed
      interview_outcome
      trial_outcome
      failure_reason
      guarantee_end_date
      notes
      created_at
      updated_at
    }
  }
`;

const GET_SPONSOR_WORKFLOWS = gql`
  query GetSponsorPlacementWorkflows($sponsorId: String!, $status: String) {
    placement_workflows(
      where: {
        sponsor_id: { _eq: $sponsorId }
        _and: [{ status: { _eq: $status } }]
      }
      order_by: { created_at: desc }
    ) {
      id
      maid_id
      agency_id
      status
      platform_fee_amount
      platform_fee_currency
      contact_date
      interview_scheduled_date
      trial_start_date
      trial_end_date
      sponsor_confirmed
      agency_confirmed
      created_at
    }
  }
`;

const GET_AGENCY_WORKFLOWS = gql`
  query GetAgencyPlacementWorkflows($agencyId: String!, $status: String) {
    placement_workflows(
      where: {
        agency_id: { _eq: $agencyId }
        _and: [{ status: { _eq: $status } }]
      }
      order_by: { created_at: desc }
    ) {
      id
      sponsor_id
      maid_id
      status
      platform_fee_amount
      platform_fee_currency
      fee_status
      contact_date
      interview_scheduled_date
      trial_start_date
      trial_end_date
      sponsor_confirmed
      agency_confirmed
      created_at
    }
  }
`;

const GET_MAID_ACTIVE_PLACEMENT = gql`
  query GetMaidActivePlacement($maidId: String!) {
    placement_workflows(
      where: {
        maid_id: { _eq: $maidId }
        status: { _nin: ["placement_failed", "placement_confirmed"] }
      }
      order_by: { created_at: desc }
      limit: 1
    ) {
      id
      sponsor_id
      agency_id
      status
      trial_start_date
      trial_end_date
      sponsor_confirmed
      agency_confirmed
    }
  }
`;

const GET_EXPIRING_TRIALS = gql`
  query GetExpiringTrials {
    placement_workflows(
      where: { status: { _eq: "trial_started" }, trial_end_date: { _lte: "now()" } }
    ) {
      id
      sponsor_id
      agency_id
      maid_id
      trial_start_date
      trial_end_date
      sponsor_confirmed
      agency_confirmed
    }
  }
`;

const GET_PLACEMENT_STATS = gql`
  query GetPlacementStats($startDate: timestamptz!, $endDate: timestamptz!) {
    total: placement_workflows_aggregate(
      where: { created_at: { _gte: $startDate, _lte: $endDate } }
    ) {
      aggregate {
        count
      }
    }
    successful: placement_workflows_aggregate(
      where: {
        status: { _eq: "placement_confirmed" }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    failed: placement_workflows_aggregate(
      where: {
        status: { _eq: "placement_failed" }
        created_at: { _gte: $startDate, _lte: $endDate }
      }
    ) {
      aggregate {
        count
      }
    }
    in_trial: placement_workflows_aggregate(where: { status: { _eq: "trial_started" } }) {
      aggregate {
        count
      }
    }
    revenue: placement_workflows_aggregate(
      where: { fee_status: { _eq: "earned" }, created_at: { _gte: $startDate, _lte: $endDate } }
    ) {
      aggregate {
        sum {
          platform_fee_amount
        }
      }
    }
  }
`;

const CREATE_PLACEMENT_WORKFLOW = gql`
  mutation CreatePlacementWorkflow(
    $sponsorId: String!
    $agencyId: String
    $maidId: String!
    $platformFeeAmount: numeric!
    $platformFeeCurrency: String!
  ) {
    insert_placement_workflows_one(
      object: {
        sponsor_id: $sponsorId
        agency_id: $agencyId
        maid_id: $maidId
        status: "contact_initiated"
        platform_fee_amount: $platformFeeAmount
        platform_fee_currency: $platformFeeCurrency
        fee_status: "held"
      }
    ) {
      id
      status
      contact_date
      platform_fee_amount
      platform_fee_currency
    }
  }
`;

const UPDATE_WORKFLOW_STATUS = gql`
  mutation UpdatePlacementWorkflowStatus($id: uuid!, $status: String!, $updates: placement_workflows_set_input) {
    update_placement_workflows_by_pk(pk_columns: { id: $id }, _set: $updates) {
      id
      status
      updated_at
    }
  }
`;

const SCHEDULE_INTERVIEW = gql`
  mutation ScheduleInterview($id: uuid!, $interviewDate: timestamptz!) {
    update_placement_workflows_by_pk(
      pk_columns: { id: $id }
      _set: { status: "interview_scheduled", interview_scheduled_date: $interviewDate }
    ) {
      id
      status
      interview_scheduled_date
    }
  }
`;

const COMPLETE_INTERVIEW = gql`
  mutation CompleteInterview($id: uuid!, $outcome: String!) {
    update_placement_workflows_by_pk(
      pk_columns: { id: $id }
      _set: { status: "interview_completed", interview_outcome: $outcome }
    ) {
      id
      status
      interview_outcome
    }
  }
`;

const START_TRIAL_PERIOD = gql`
  mutation StartTrialPeriod($id: uuid!, $trialEndDate: timestamptz!) {
    update_placement_workflows_by_pk(
      pk_columns: { id: $id }
      _set: { status: "trial_started", trial_end_date: $trialEndDate }
    ) {
      id
      status
      trial_start_date
      trial_end_date
    }
  }
`;

const SPONSOR_CONFIRM = gql`
  mutation SponsorConfirmPlacement($id: uuid!) {
    update_placement_workflows_by_pk(pk_columns: { id: $id }, _set: { sponsor_confirmed: true }) {
      id
      sponsor_confirmed
      agency_confirmed
    }
  }
`;

const AGENCY_CONFIRM = gql`
  mutation AgencyConfirmPlacement($id: uuid!) {
    update_placement_workflows_by_pk(pk_columns: { id: $id }, _set: { agency_confirmed: true }) {
      id
      sponsor_confirmed
      agency_confirmed
    }
  }
`;

const CONFIRM_PLACEMENT = gql`
  mutation ConfirmPlacement($id: uuid!, $guaranteeEndDate: timestamptz!) {
    update_placement_workflows_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: "placement_confirmed"
        trial_outcome: "passed"
        fee_status: "earned"
        guarantee_end_date: $guaranteeEndDate
      }
    ) {
      id
      status
      fee_status
      placement_confirmed_date
      guarantee_end_date
      platform_fee_amount
      platform_fee_currency
      agency_id
      maid_id
      sponsor_id
    }
  }
`;

const FAIL_PLACEMENT = gql`
  mutation FailPlacement($id: uuid!, $reason: String!) {
    update_placement_workflows_by_pk(
      pk_columns: { id: $id }
      _set: { status: "placement_failed", trial_outcome: "failed", fee_status: "returned", failure_reason: $reason }
    ) {
      id
      status
      fee_status
      failure_reason
      agency_id
      maid_id
    }
  }
`;

const UPDATE_MAID_HIRED_STATUS = gql`
  mutation UpdateMaidHiredStatus(
    $maidId: String!
    $hiredStatus: String!
    $currentPlacementId: uuid
    $hiredBySponsorId: String
  ) {
    update_maid_profiles(
      where: { id: { _eq: $maidId } }
      _set: {
        hired_status: $hiredStatus
        current_placement_id: $currentPlacementId
        hired_by_sponsor_id: $hiredBySponsorId
      }
    ) {
      affected_rows
      returning {
        id
        hired_status
      }
    }
  }
`;

const RESET_MAID_TO_AVAILABLE = gql`
  mutation ResetMaidToAvailable($maidId: String!) {
    update_maid_profiles(
      where: { id: { _eq: $maidId } }
      _set: { hired_status: "available", current_placement_id: null, hired_by_sponsor_id: null }
    ) {
      affected_rows
      returning {
        id
        hired_status
      }
    }
  }
`;

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const graphqlPlacementWorkflowService = {
  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  async getWorkflow(id) {
    const { data } = await apolloClient.query({
      query: GET_PLACEMENT_WORKFLOW,
      variables: { id },
      fetchPolicy: 'network-only',
    });
    return data?.placement_workflows_by_pk || null;
  },

  async getSponsorWorkflows(sponsorId, status = null) {
    const { data } = await apolloClient.query({
      query: GET_SPONSOR_WORKFLOWS,
      variables: { sponsorId, status },
      fetchPolicy: 'network-only',
    });
    return data?.placement_workflows || [];
  },

  async getAgencyWorkflows(agencyId, status = null) {
    const { data } = await apolloClient.query({
      query: GET_AGENCY_WORKFLOWS,
      variables: { agencyId, status },
      fetchPolicy: 'network-only',
    });
    return data?.placement_workflows || [];
  },

  async getMaidActivePlacement(maidId) {
    const { data } = await apolloClient.query({
      query: GET_MAID_ACTIVE_PLACEMENT,
      variables: { maidId },
      fetchPolicy: 'network-only',
    });
    return data?.placement_workflows?.[0] || null;
  },

  async getExpiringTrials() {
    const { data } = await apolloClient.query({
      query: GET_EXPIRING_TRIALS,
      fetchPolicy: 'network-only',
    });
    return data?.placement_workflows || [];
  },

  async getPlacementStats(startDate, endDate) {
    const { data } = await apolloClient.query({
      query: GET_PLACEMENT_STATS,
      variables: { startDate, endDate },
      fetchPolicy: 'network-only',
    });
    return {
      total: data?.total?.aggregate?.count || 0,
      successful: data?.successful?.aggregate?.count || 0,
      failed: data?.failed?.aggregate?.count || 0,
      inTrial: data?.in_trial?.aggregate?.count || 0,
      revenue: data?.revenue?.aggregate?.sum?.platform_fee_amount || 0,
    };
  },

  // ============================================================================
  // MUTATION METHODS
  // ============================================================================

  async createWorkflow(sponsorId, agencyId, maidId, platformFeeAmount, platformFeeCurrency) {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_PLACEMENT_WORKFLOW,
      variables: { sponsorId, agencyId, maidId, platformFeeAmount, platformFeeCurrency },
    });
    return data?.insert_placement_workflows_one || null;
  },

  async updateWorkflowStatus(id, status, updates = {}) {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_WORKFLOW_STATUS,
      variables: { id, status, updates: { status, ...updates } },
    });
    return data?.update_placement_workflows_by_pk || null;
  },

  async scheduleInterview(id, interviewDate) {
    const { data } = await apolloClient.mutate({
      mutation: SCHEDULE_INTERVIEW,
      variables: { id, interviewDate },
    });
    return data?.update_placement_workflows_by_pk || null;
  },

  async completeInterview(id, outcome) {
    const { data } = await apolloClient.mutate({
      mutation: COMPLETE_INTERVIEW,
      variables: { id, outcome },
    });
    return data?.update_placement_workflows_by_pk || null;
  },

  async startTrialPeriod(id) {
    // Calculate trial end date (3 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 3);

    const { data } = await apolloClient.mutate({
      mutation: START_TRIAL_PERIOD,
      variables: { id, trialEndDate: trialEndDate.toISOString() },
    });
    return data?.update_placement_workflows_by_pk || null;
  },

  async sponsorConfirm(id) {
    const { data } = await apolloClient.mutate({
      mutation: SPONSOR_CONFIRM,
      variables: { id },
    });
    return data?.update_placement_workflows_by_pk || null;
  },

  async agencyConfirm(id) {
    const { data } = await apolloClient.mutate({
      mutation: AGENCY_CONFIRM,
      variables: { id },
    });
    return data?.update_placement_workflows_by_pk || null;
  },

  async confirmPlacement(id) {
    // Calculate guarantee end date (90 days from now)
    const guaranteeEndDate = new Date();
    guaranteeEndDate.setDate(guaranteeEndDate.getDate() + 90);

    const { data } = await apolloClient.mutate({
      mutation: CONFIRM_PLACEMENT,
      variables: { id, guaranteeEndDate: guaranteeEndDate.toISOString() },
    });
    return data?.update_placement_workflows_by_pk || null;
  },

  async failPlacement(id, reason) {
    const { data } = await apolloClient.mutate({
      mutation: FAIL_PLACEMENT,
      variables: { id, reason },
    });
    return data?.update_placement_workflows_by_pk || null;
  },

  async updateMaidHiredStatus(maidId, hiredStatus, currentPlacementId = null, hiredBySponsorId = null) {
    const { data } = await apolloClient.mutate({
      mutation: UPDATE_MAID_HIRED_STATUS,
      variables: { maidId, hiredStatus, currentPlacementId, hiredBySponsorId },
    });
    return data?.update_maid_profiles?.returning?.[0] || null;
  },

  async resetMaidToAvailable(maidId) {
    const { data } = await apolloClient.mutate({
      mutation: RESET_MAID_TO_AVAILABLE,
      variables: { maidId },
    });
    return data?.update_maid_profiles?.returning?.[0] || null;
  },
};
