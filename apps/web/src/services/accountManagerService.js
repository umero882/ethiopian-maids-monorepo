/**
 * Account Manager Service - Automated Workflow Management
 *
 * Handles automated tasks for the placement workflow:
 * - Interview reminders
 * - Trial period monitoring
 * - Agency balance checks
 * - Confirmation prompts
 *
 * This service can be triggered by:
 * - Hasura scheduled events
 * - Client-side polling
 * - Admin manual triggers
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { notificationService } from './notificationService';
import { agencyBalanceService } from './agencyBalanceService';

// ============================================================================
// GRAPHQL DOCUMENTS
// ============================================================================

const GET_UPCOMING_INTERVIEWS = gql`
  query GetUpcomingInterviews($hoursAhead: timestamptz!) {
    placement_workflows(
      where: {
        status: { _eq: "interview_scheduled" }
        interview_scheduled_date: { _lte: $hoursAhead, _gt: "now()" }
        _not: { notes: { _contains: { interview_reminder_sent: true } } }
      }
    ) {
      id
      sponsor_id
      agency_id
      maid_id
      interview_scheduled_date
      sponsor_profile {
        full_name
        email
      }
      agency_profile {
        full_name
        business_email
      }
      maid_profile {
        full_name
      }
    }
  }
`;

const GET_EXPIRING_TRIALS = gql`
  query GetExpiringTrials {
    placement_workflows(
      where: {
        status: { _eq: "trial_started" }
        trial_end_date: { _lte: "now()" }
      }
    ) {
      id
      sponsor_id
      agency_id
      maid_id
      trial_start_date
      trial_end_date
      sponsor_confirmed
      agency_confirmed
      platform_fee_amount
      platform_fee_currency
      sponsor_profile {
        full_name
        email
      }
      agency_profile {
        full_name
        business_email
      }
      maid_profile {
        full_name
      }
    }
  }
`;

const GET_TRIALS_ENDING_SOON = gql`
  query GetTrialsEndingSoon($withinHours: timestamptz!) {
    placement_workflows(
      where: {
        status: { _eq: "trial_started" }
        trial_end_date: { _lte: $withinHours, _gt: "now()" }
        _not: { notes: { _contains: { trial_ending_reminder_sent: true } } }
      }
    ) {
      id
      sponsor_id
      agency_id
      maid_id
      trial_end_date
      sponsor_profile {
        full_name
      }
      agency_profile {
        full_name
      }
      maid_profile {
        full_name
      }
    }
  }
`;

const GET_LOW_BALANCE_AGENCIES = gql`
  query GetLowBalanceAgencies($threshold: numeric!) {
    agency_credits(
      where: { available_credits: { _lt: $threshold } }
    ) {
      agency_id
      available_credits
      total_credits
      agency_profile {
        id
        user_id
        full_name
        business_email
      }
    }
  }
`;

const GET_PENDING_CONFIRMATIONS = gql`
  query GetPendingConfirmations {
    placement_workflows(
      where: {
        status: { _eq: "trial_completed" }
        _or: [
          { sponsor_confirmed: { _eq: false } }
          { agency_confirmed: { _eq: false } }
        ]
      }
    ) {
      id
      sponsor_id
      agency_id
      maid_id
      trial_end_date
      sponsor_confirmed
      agency_confirmed
      created_at
      sponsor_profile {
        full_name
      }
      agency_profile {
        full_name
      }
      maid_profile {
        full_name
      }
    }
  }
`;

const UPDATE_WORKFLOW_NOTES = gql`
  mutation UpdateWorkflowNotes($workflowId: uuid!, $notes: jsonb!) {
    update_placement_workflows_by_pk(
      pk_columns: { id: $workflowId }
      _append: { notes: $notes }
    ) {
      id
      notes
    }
  }
`;

const UPDATE_WORKFLOW_STATUS = gql`
  mutation UpdateWorkflowStatus($workflowId: uuid!, $status: String!) {
    update_placement_workflows_by_pk(
      pk_columns: { id: $workflowId }
      _set: { status: $status, updated_at: "now()" }
    ) {
      id
      status
    }
  }
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate hours from now as ISO timestamp
 */
const hoursFromNow = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const accountManagerService = {
  /**
   * Send interview reminders for interviews scheduled within the next N hours
   * Should be called periodically (e.g., every hour)
   */
  async sendInterviewReminders(hoursAhead = 24) {
    try {
      const { data } = await apolloClient.query({
        query: GET_UPCOMING_INTERVIEWS,
        variables: { hoursAhead: hoursFromNow(hoursAhead) },
        fetchPolicy: 'network-only',
      });

      const interviews = data?.placement_workflows || [];
      const results = [];

      for (const interview of interviews) {
        try {
          // Notify sponsor
          if (interview.sponsor_id) {
            await notificationService.createNotification(interview.sponsor_id, {
              type: 'interview_reminder',
              title: 'Interview Reminder',
              message: `Your interview with ${interview.maid_profile?.full_name || 'the maid'} is scheduled for ${formatDate(interview.interview_scheduled_date)}`,
              priority: 'high',
              link: `/sponsor/placements/${interview.id}`,
            });
          }

          // Notify agency
          if (interview.agency_id && interview.agency_profile?.user_id) {
            await notificationService.createNotification(interview.agency_profile.user_id, {
              type: 'interview_reminder',
              title: 'Interview Reminder',
              message: `Interview for ${interview.maid_profile?.full_name || 'maid'} with ${interview.sponsor_profile?.full_name || 'sponsor'} is scheduled for ${formatDate(interview.interview_scheduled_date)}`,
              priority: 'high',
              link: `/agency/placements/${interview.id}`,
            });
          }

          // Mark reminder as sent
          await apolloClient.mutate({
            mutation: UPDATE_WORKFLOW_NOTES,
            variables: {
              workflowId: interview.id,
              notes: { interview_reminder_sent: true, interview_reminder_sent_at: new Date().toISOString() },
            },
          });

          results.push({ workflowId: interview.id, status: 'sent' });
        } catch (error) {
          console.error(`Error sending reminder for workflow ${interview.id}:`, error);
          results.push({ workflowId: interview.id, status: 'failed', error: error.message });
        }
      }

      return {
        processed: interviews.length,
        results,
      };
    } catch (error) {
      console.error('Error in sendInterviewReminders:', error);
      throw error;
    }
  },

  /**
   * Check for expired trials and prompt for confirmation
   * Should be called periodically (e.g., every hour)
   */
  async checkTrialExpiry() {
    try {
      const { data } = await apolloClient.query({
        query: GET_EXPIRING_TRIALS,
        fetchPolicy: 'network-only',
      });

      const expiredTrials = data?.placement_workflows || [];
      const results = [];

      for (const trial of expiredTrials) {
        try {
          // Update status to trial_completed
          await apolloClient.mutate({
            mutation: UPDATE_WORKFLOW_STATUS,
            variables: {
              workflowId: trial.id,
              status: 'trial_completed',
            },
          });

          // Prompt both parties for confirmation
          await this.promptPlacementConfirmation(trial);

          results.push({ workflowId: trial.id, status: 'trial_completed' });
        } catch (error) {
          console.error(`Error processing trial ${trial.id}:`, error);
          results.push({ workflowId: trial.id, status: 'failed', error: error.message });
        }
      }

      return {
        processed: expiredTrials.length,
        results,
      };
    } catch (error) {
      console.error('Error in checkTrialExpiry:', error);
      throw error;
    }
  },

  /**
   * Send reminders for trials ending soon
   * Should be called periodically (e.g., every few hours)
   */
  async sendTrialEndingReminders(hoursAhead = 24) {
    try {
      const { data } = await apolloClient.query({
        query: GET_TRIALS_ENDING_SOON,
        variables: { withinHours: hoursFromNow(hoursAhead) },
        fetchPolicy: 'network-only',
      });

      const endingTrials = data?.placement_workflows || [];
      const results = [];

      for (const trial of endingTrials) {
        try {
          // Calculate remaining time
          const endDate = new Date(trial.trial_end_date);
          const now = new Date();
          const hoursRemaining = Math.round((endDate - now) / (1000 * 60 * 60));

          // Notify sponsor
          if (trial.sponsor_id) {
            await notificationService.createNotification(trial.sponsor_id, {
              type: 'trial_ending',
              title: 'Trial Period Ending Soon',
              message: `Your trial period with ${trial.maid_profile?.full_name || 'the maid'} ends in ${hoursRemaining} hours. Please be ready to confirm or reject the placement.`,
              priority: 'high',
              link: `/sponsor/placements/${trial.id}`,
            });
          }

          // Notify agency
          if (trial.agency_id && trial.agency_profile?.user_id) {
            await notificationService.createNotification(trial.agency_profile.user_id, {
              type: 'trial_ending',
              title: 'Trial Period Ending Soon',
              message: `Trial period for ${trial.maid_profile?.full_name || 'maid'} with ${trial.sponsor_profile?.full_name || 'sponsor'} ends in ${hoursRemaining} hours.`,
              priority: 'high',
              link: `/agency/placements/${trial.id}`,
            });
          }

          // Mark reminder as sent
          await apolloClient.mutate({
            mutation: UPDATE_WORKFLOW_NOTES,
            variables: {
              workflowId: trial.id,
              notes: { trial_ending_reminder_sent: true, trial_ending_reminder_sent_at: new Date().toISOString() },
            },
          });

          results.push({ workflowId: trial.id, status: 'sent' });
        } catch (error) {
          console.error(`Error sending trial ending reminder for ${trial.id}:`, error);
          results.push({ workflowId: trial.id, status: 'failed', error: error.message });
        }
      }

      return {
        processed: endingTrials.length,
        results,
      };
    } catch (error) {
      console.error('Error in sendTrialEndingReminders:', error);
      throw error;
    }
  },

  /**
   * Prompt both parties to confirm placement after trial ends
   */
  async promptPlacementConfirmation(workflow) {
    // Notify sponsor if not confirmed
    if (!workflow.sponsor_confirmed && workflow.sponsor_id) {
      await notificationService.createNotification(workflow.sponsor_id, {
        type: 'confirmation_required',
        title: 'Placement Confirmation Required',
        message: `The trial period for ${workflow.maid_profile?.full_name || 'the maid'} has ended. Please confirm or reject the placement.`,
        priority: 'urgent',
        link: `/sponsor/placements/${workflow.id}`,
        action: 'confirm_placement',
      });
    }

    // Notify agency if not confirmed
    if (!workflow.agency_confirmed && workflow.agency_id && workflow.agency_profile?.user_id) {
      await notificationService.createNotification(workflow.agency_profile.user_id, {
        type: 'confirmation_required',
        title: 'Placement Confirmation Required',
        message: `The trial period for ${workflow.maid_profile?.full_name || 'maid'} has ended. Please confirm or reject the placement.`,
        priority: 'urgent',
        link: `/agency/placements/${workflow.id}`,
        action: 'confirm_placement',
      });
    }
  },

  /**
   * Check agencies with low balance and send reminders
   * Should be called periodically (e.g., daily)
   */
  async checkAgencyBalances(threshold = 500) {
    try {
      const { data } = await apolloClient.query({
        query: GET_LOW_BALANCE_AGENCIES,
        variables: { threshold },
        fetchPolicy: 'network-only',
      });

      const lowBalanceAgencies = data?.agency_credits || [];
      const results = [];

      for (const agency of lowBalanceAgencies) {
        try {
          if (agency.agency_profile?.user_id) {
            await notificationService.createNotification(agency.agency_profile.user_id, {
              type: 'low_balance',
              title: 'Low Balance Warning',
              message: `Your available balance is ${agency.available_credits}. You need at least ${threshold} to accept new sponsor inquiries. Please deposit to continue receiving leads.`,
              priority: 'high',
              link: '/agency/wallet',
            });

            results.push({ agencyId: agency.agency_id, status: 'notified' });
          }
        } catch (error) {
          console.error(`Error notifying agency ${agency.agency_id}:`, error);
          results.push({ agencyId: agency.agency_id, status: 'failed', error: error.message });
        }
      }

      return {
        processed: lowBalanceAgencies.length,
        results,
      };
    } catch (error) {
      console.error('Error in checkAgencyBalances:', error);
      throw error;
    }
  },

  /**
   * Get pending confirmations and send follow-up reminders
   * Should be called periodically (e.g., every 12 hours)
   */
  async sendConfirmationReminders() {
    try {
      const { data } = await apolloClient.query({
        query: GET_PENDING_CONFIRMATIONS,
        fetchPolicy: 'network-only',
      });

      const pendingConfirmations = data?.placement_workflows || [];
      const results = [];

      for (const workflow of pendingConfirmations) {
        try {
          // Calculate days since trial ended
          const trialEndDate = new Date(workflow.trial_end_date);
          const now = new Date();
          const daysSinceTrialEnd = Math.floor((now - trialEndDate) / (1000 * 60 * 60 * 24));

          // Send follow-up reminders after 1, 3, and 7 days
          if ([1, 3, 7].includes(daysSinceTrialEnd)) {
            await this.promptPlacementConfirmation(workflow);
            results.push({ workflowId: workflow.id, status: 'reminder_sent', days: daysSinceTrialEnd });
          }
        } catch (error) {
          console.error(`Error sending confirmation reminder for ${workflow.id}:`, error);
          results.push({ workflowId: workflow.id, status: 'failed', error: error.message });
        }
      }

      return {
        processed: pendingConfirmations.length,
        results,
      };
    } catch (error) {
      console.error('Error in sendConfirmationReminders:', error);
      throw error;
    }
  },

  /**
   * Run all automated tasks
   * Can be triggered by admin or scheduled job
   */
  async runAllAutomatedTasks() {
    const results = {};

    try {
      results.interviewReminders = await this.sendInterviewReminders(24);
    } catch (error) {
      results.interviewReminders = { error: error.message };
    }

    try {
      results.trialExpiry = await this.checkTrialExpiry();
    } catch (error) {
      results.trialExpiry = { error: error.message };
    }

    try {
      results.trialEndingReminders = await this.sendTrialEndingReminders(24);
    } catch (error) {
      results.trialEndingReminders = { error: error.message };
    }

    try {
      results.agencyBalances = await this.checkAgencyBalances(500);
    } catch (error) {
      results.agencyBalances = { error: error.message };
    }

    try {
      results.confirmationReminders = await this.sendConfirmationReminders();
    } catch (error) {
      results.confirmationReminders = { error: error.message };
    }

    return results;
  },

  /**
   * Get summary of pending tasks requiring attention
   */
  async getPendingTasksSummary() {
    try {
      const [interviews, trials, confirmations, lowBalanceAgencies] = await Promise.all([
        apolloClient.query({
          query: GET_UPCOMING_INTERVIEWS,
          variables: { hoursAhead: hoursFromNow(48) },
          fetchPolicy: 'network-only',
        }),
        apolloClient.query({
          query: GET_EXPIRING_TRIALS,
          fetchPolicy: 'network-only',
        }),
        apolloClient.query({
          query: GET_PENDING_CONFIRMATIONS,
          fetchPolicy: 'network-only',
        }),
        apolloClient.query({
          query: GET_LOW_BALANCE_AGENCIES,
          variables: { threshold: 500 },
          fetchPolicy: 'network-only',
        }),
      ]);

      return {
        upcomingInterviews: interviews.data?.placement_workflows?.length || 0,
        expiredTrials: trials.data?.placement_workflows?.length || 0,
        pendingConfirmations: confirmations.data?.placement_workflows?.length || 0,
        lowBalanceAgencies: lowBalanceAgencies.data?.agency_credits?.length || 0,
      };
    } catch (error) {
      console.error('Error getting pending tasks summary:', error);
      throw error;
    }
  },
};

export default accountManagerService;
