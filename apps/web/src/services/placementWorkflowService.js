/**
 * Placement Workflow Service
 *
 * Manages the full placement workflow lifecycle from contact to confirmed hire.
 * Implements a state machine with automated transitions and actions.
 *
 * Workflow States:
 * 1. contact_initiated - Sponsor contacted agency/maid
 * 2. interview_scheduled - Interview date set
 * 3. interview_completed - Interview done (successful/failed)
 * 4. trial_started - 3-day trial period began
 * 5. trial_completed - Trial ended, awaiting confirmations
 * 6. placement_confirmed - Both parties confirmed, maid hired
 * 7. placement_failed - Placement didn't work out
 *
 * Maid Status Lifecycle:
 * - available: Can be contacted
 * - in_trial: On 3-day trial, contact disabled
 * - hired: Successfully placed, contact disabled
 */

import { graphqlPlacementWorkflowService } from './placementWorkflowService.graphql';
import { agencyBalanceService } from './agencyBalanceService';
import { notificationService } from './notificationService';
import { createLogger } from '@/utils/logger';

const log = createLogger('PlacementWorkflowService');

// ============================================================================
// CONSTANTS
// ============================================================================

export const WORKFLOW_STATES = {
  CONTACT_INITIATED: 'contact_initiated',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_COMPLETED: 'interview_completed',
  TRIAL_STARTED: 'trial_started',
  TRIAL_COMPLETED: 'trial_completed',
  PLACEMENT_CONFIRMED: 'placement_confirmed',
  PLACEMENT_FAILED: 'placement_failed',
};

export const MAID_HIRED_STATUS = {
  AVAILABLE: 'available',
  IN_TRIAL: 'in_trial',
  HIRED: 'hired',
};

export const INTERVIEW_OUTCOMES = {
  SUCCESSFUL: 'successful',
  FAILED: 'failed',
  RESCHEDULED: 'rescheduled',
};

export const TRIAL_OUTCOMES = {
  PASSED: 'passed',
  FAILED: 'failed',
};

// ============================================================================
// MAIN SERVICE
// ============================================================================

export const placementWorkflowService = {
  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get a single workflow by ID
   */
  async getWorkflow(workflowId) {
    log.debug('Getting workflow', { workflowId });
    return graphqlPlacementWorkflowService.getWorkflow(workflowId);
  },

  /**
   * Get all workflows for a sponsor
   */
  async getSponsorWorkflows(sponsorId, status = null) {
    log.debug('Getting sponsor workflows', { sponsorId, status });
    return graphqlPlacementWorkflowService.getSponsorWorkflows(sponsorId, status);
  },

  /**
   * Get all workflows for an agency
   */
  async getAgencyWorkflows(agencyId, status = null) {
    log.debug('Getting agency workflows', { agencyId, status });
    return graphqlPlacementWorkflowService.getAgencyWorkflows(agencyId, status);
  },

  /**
   * Get active placement for a maid (if any)
   */
  async getMaidActivePlacement(maidId) {
    log.debug('Getting maid active placement', { maidId });
    return graphqlPlacementWorkflowService.getMaidActivePlacement(maidId);
  },

  /**
   * Get trials that are expiring (for notifications)
   */
  async getExpiringTrials() {
    log.debug('Getting expiring trials');
    return graphqlPlacementWorkflowService.getExpiringTrials();
  },

  /**
   * Get placement statistics for a date range
   */
  async getPlacementStats(startDate, endDate) {
    log.debug('Getting placement stats', { startDate, endDate });
    return graphqlPlacementWorkflowService.getPlacementStats(startDate, endDate);
  },

  // ============================================================================
  // WORKFLOW CREATION
  // ============================================================================

  /**
   * Create a new placement workflow when contact is initiated
   * This is called when a sponsor contacts an agency about a maid
   *
   * @param {Object} params - Workflow parameters
   * @param {string} params.sponsorId - Sponsor user ID
   * @param {string} params.agencyId - Agency ID (null for independent maids)
   * @param {string} params.maidId - Maid profile ID
   * @param {string} params.sponsorCountry - Sponsor's country (for fee currency)
   * @returns {Object} Created workflow
   */
  async initiateContact({ sponsorId, agencyId, maidId, sponsorCountry }) {
    log.info('Initiating contact workflow', { sponsorId, agencyId, maidId, sponsorCountry });

    // Get platform fee requirement for sponsor's country
    const feeRequirement = await agencyBalanceService.getRequiredFeeForCountry(sponsorCountry);
    const platformFeeAmount = feeRequirement?.amount || 500;
    const platformFeeCurrency = feeRequirement?.currency || 'USD';

    // Create the workflow
    const workflow = await graphqlPlacementWorkflowService.createWorkflow(
      sponsorId,
      agencyId,
      maidId,
      platformFeeAmount,
      platformFeeCurrency
    );

    log.info('Workflow created', { workflowId: workflow.id, status: workflow.status });

    // If agency maid, reserve agency balance
    if (agencyId) {
      await agencyBalanceService.reserveBalanceForPlacement(
        agencyId,
        platformFeeAmount,
        platformFeeCurrency,
        workflow.id
      );
      log.info('Agency balance reserved', { agencyId, amount: platformFeeAmount });
    }

    return workflow;
  },

  // ============================================================================
  // STATE TRANSITIONS
  // ============================================================================

  /**
   * Schedule an interview
   */
  async scheduleInterview(workflowId, interviewDate) {
    log.info('Scheduling interview', { workflowId, interviewDate });

    const workflow = await graphqlPlacementWorkflowService.scheduleInterview(workflowId, interviewDate);

    // Send notifications to both parties
    const fullWorkflow = await this.getWorkflow(workflowId);
    if (fullWorkflow) {
      await this._sendInterviewScheduledNotifications(fullWorkflow);
    }

    return workflow;
  },

  /**
   * Complete an interview with outcome
   */
  async completeInterview(workflowId, outcome) {
    log.info('Completing interview', { workflowId, outcome });

    const workflow = await graphqlPlacementWorkflowService.completeInterview(workflowId, outcome);

    if (outcome === INTERVIEW_OUTCOMES.FAILED) {
      // Interview failed - fail the placement
      await this.failPlacement(workflowId, 'Interview unsuccessful');
    }

    return workflow;
  },

  /**
   * Start the 3-day trial period
   * This also updates the maid status to 'in_trial'
   */
  async startTrial(workflowId) {
    log.info('Starting trial period', { workflowId });

    const workflow = await graphqlPlacementWorkflowService.startTrialPeriod(workflowId);
    const fullWorkflow = await this.getWorkflow(workflowId);

    // Update maid status to in_trial
    if (fullWorkflow?.maid_id) {
      await graphqlPlacementWorkflowService.updateMaidHiredStatus(
        fullWorkflow.maid_id,
        MAID_HIRED_STATUS.IN_TRIAL,
        workflowId,
        fullWorkflow.sponsor_id
      );
      log.info('Maid status updated to in_trial', { maidId: fullWorkflow.maid_id });
    }

    // Send trial started notifications
    await this._sendTrialStartedNotifications(fullWorkflow);

    return workflow;
  },

  /**
   * Sponsor confirms the placement
   */
  async sponsorConfirm(workflowId) {
    log.info('Sponsor confirming placement', { workflowId });

    const workflow = await graphqlPlacementWorkflowService.sponsorConfirm(workflowId);

    // Check if both parties have confirmed
    if (workflow.sponsor_confirmed && workflow.agency_confirmed) {
      return this._finalizePlacement(workflowId);
    }

    // Notify agency that sponsor confirmed
    const fullWorkflow = await this.getWorkflow(workflowId);
    if (fullWorkflow?.agency_id) {
      await notificationService.createNotification(fullWorkflow.agency_id, {
        type: 'placement_sponsor_confirmed',
        title: 'Sponsor Confirmed Placement',
        message: `The sponsor has confirmed the placement. Please confirm from your side to complete the process.`,
        priority: 'high',
        related_id: workflowId,
        related_type: 'placement_workflow',
      });
    }

    return workflow;
  },

  /**
   * Agency confirms the placement
   */
  async agencyConfirm(workflowId) {
    log.info('Agency confirming placement', { workflowId });

    const workflow = await graphqlPlacementWorkflowService.agencyConfirm(workflowId);

    // Check if both parties have confirmed
    if (workflow.sponsor_confirmed && workflow.agency_confirmed) {
      return this._finalizePlacement(workflowId);
    }

    // Notify sponsor that agency confirmed
    const fullWorkflow = await this.getWorkflow(workflowId);
    if (fullWorkflow?.sponsor_id) {
      await notificationService.createNotification(fullWorkflow.sponsor_id, {
        type: 'placement_agency_confirmed',
        title: 'Agency Confirmed Placement',
        message: `The agency has confirmed the placement. Please confirm from your side to complete the process.`,
        priority: 'high',
        related_id: workflowId,
        related_type: 'placement_workflow',
      });
    }

    return workflow;
  },

  /**
   * Fail the placement
   * Returns balance to agency and resets maid status
   */
  async failPlacement(workflowId, reason) {
    log.info('Failing placement', { workflowId, reason });

    const fullWorkflow = await this.getWorkflow(workflowId);
    const workflow = await graphqlPlacementWorkflowService.failPlacement(workflowId, reason);

    // Return balance to agency
    if (fullWorkflow?.agency_id && fullWorkflow?.platform_fee_amount) {
      await agencyBalanceService.returnBalanceOnFailure(
        fullWorkflow.agency_id,
        workflowId,
        fullWorkflow.platform_fee_amount
      );
      log.info('Balance returned to agency', { agencyId: fullWorkflow.agency_id });
    }

    // Reset maid status to available
    if (fullWorkflow?.maid_id) {
      await graphqlPlacementWorkflowService.resetMaidToAvailable(fullWorkflow.maid_id);
      log.info('Maid reset to available', { maidId: fullWorkflow.maid_id });
    }

    // Send failure notifications
    await this._sendPlacementFailedNotifications(fullWorkflow, reason);

    return workflow;
  },

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Finalize a confirmed placement
   * Called when both sponsor and agency confirm
   */
  async _finalizePlacement(workflowId) {
    log.info('Finalizing placement', { workflowId });

    const fullWorkflow = await this.getWorkflow(workflowId);
    const workflow = await graphqlPlacementWorkflowService.confirmPlacement(workflowId);

    // Update maid status to hired
    if (fullWorkflow?.maid_id) {
      await graphqlPlacementWorkflowService.updateMaidHiredStatus(
        fullWorkflow.maid_id,
        MAID_HIRED_STATUS.HIRED,
        workflowId,
        fullWorkflow.sponsor_id
      );
      log.info('Maid status updated to hired', { maidId: fullWorkflow.maid_id });
    }

    // Deduct balance as platform revenue
    if (fullWorkflow?.agency_id && fullWorkflow?.platform_fee_amount) {
      await agencyBalanceService.releaseBalanceOnSuccess(
        fullWorkflow.agency_id,
        workflowId,
        fullWorkflow.platform_fee_amount
      );
      log.info('Platform fee earned', {
        amount: fullWorkflow.platform_fee_amount,
        currency: fullWorkflow.platform_fee_currency,
      });

      // Notify agency to deposit for next placement
      await agencyBalanceService.notifyDepositForNextPlacement(
        fullWorkflow.agency_id,
        fullWorkflow.platform_fee_amount,
        fullWorkflow.platform_fee_currency
      );
    }

    // Send success notifications
    await this._sendPlacementConfirmedNotifications(fullWorkflow);

    return workflow;
  },

  /**
   * Send interview scheduled notifications
   */
  async _sendInterviewScheduledNotifications(workflow) {
    const interviewDate = new Date(workflow.interview_scheduled_date).toLocaleDateString();

    // Notify sponsor
    await notificationService.createNotification(workflow.sponsor_id, {
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Your interview has been scheduled for ${interviewDate}`,
      priority: 'high',
      related_id: workflow.id,
      related_type: 'placement_workflow',
    });

    // Notify agency
    if (workflow.agency_id) {
      await notificationService.createNotification(workflow.agency_id, {
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `Interview scheduled for ${interviewDate}`,
        priority: 'high',
        related_id: workflow.id,
        related_type: 'placement_workflow',
      });
    }
  },

  /**
   * Send trial started notifications
   */
  async _sendTrialStartedNotifications(workflow) {
    const trialEndDate = new Date(workflow.trial_end_date).toLocaleDateString();

    // Notify sponsor
    await notificationService.createNotification(workflow.sponsor_id, {
      type: 'trial_started',
      title: '3-Day Trial Started',
      message: `Your trial period has started and will end on ${trialEndDate}. Please confirm the placement after the trial.`,
      priority: 'high',
      related_id: workflow.id,
      related_type: 'placement_workflow',
    });

    // Notify agency
    if (workflow.agency_id) {
      await notificationService.createNotification(workflow.agency_id, {
        type: 'trial_started',
        title: '3-Day Trial Started',
        message: `Trial period started, ending on ${trialEndDate}. Both parties must confirm after trial.`,
        priority: 'high',
        related_id: workflow.id,
        related_type: 'placement_workflow',
      });
    }
  },

  /**
   * Send placement confirmed notifications
   */
  async _sendPlacementConfirmedNotifications(workflow) {
    // Notify sponsor
    await notificationService.createNotification(workflow.sponsor_id, {
      type: 'placement_confirmed',
      title: 'Placement Confirmed!',
      message: `Congratulations! The maid placement has been confirmed. Your 90-day guarantee period has started.`,
      priority: 'normal',
      related_id: workflow.id,
      related_type: 'placement_workflow',
    });

    // Notify agency
    if (workflow.agency_id) {
      await notificationService.createNotification(workflow.agency_id, {
        type: 'placement_confirmed',
        title: 'Placement Confirmed!',
        message: `Placement confirmed! The platform fee of ${workflow.platform_fee_amount} ${workflow.platform_fee_currency} has been deducted. Please deposit for your next placement.`,
        priority: 'normal',
        related_id: workflow.id,
        related_type: 'placement_workflow',
      });
    }
  },

  /**
   * Send placement failed notifications
   */
  async _sendPlacementFailedNotifications(workflow, reason) {
    // Notify sponsor
    await notificationService.createNotification(workflow.sponsor_id, {
      type: 'placement_failed',
      title: 'Placement Unsuccessful',
      message: `Unfortunately, the placement was not successful. Reason: ${reason}`,
      priority: 'normal',
      related_id: workflow.id,
      related_type: 'placement_workflow',
    });

    // Notify agency
    if (workflow.agency_id) {
      await notificationService.createNotification(workflow.agency_id, {
        type: 'placement_failed',
        title: 'Placement Unsuccessful',
        message: `Placement failed. Reason: ${reason}. Your balance has been returned for the next placement.`,
        priority: 'normal',
        related_id: workflow.id,
        related_type: 'placement_workflow',
      });
    }
  },

  // ============================================================================
  // MAID STATUS HELPERS
  // ============================================================================

  /**
   * Check if a maid can be contacted
   * Returns false if maid is in_trial or hired
   */
  async canContactMaid(maidId) {
    const activePlacement = await this.getMaidActivePlacement(maidId);
    if (activePlacement) {
      const status = activePlacement.status;
      // Cannot contact if in active workflow (except failed)
      return status === WORKFLOW_STATES.PLACEMENT_FAILED;
    }
    return true;
  },

  /**
   * Get maid's current placement status
   */
  async getMaidPlacementStatus(maidId) {
    const activePlacement = await this.getMaidActivePlacement(maidId);
    if (!activePlacement) {
      return { status: MAID_HIRED_STATUS.AVAILABLE, workflow: null };
    }

    const workflowStatus = activePlacement.status;

    if (workflowStatus === WORKFLOW_STATES.TRIAL_STARTED) {
      return { status: MAID_HIRED_STATUS.IN_TRIAL, workflow: activePlacement };
    }

    if (workflowStatus === WORKFLOW_STATES.PLACEMENT_CONFIRMED) {
      return { status: MAID_HIRED_STATUS.HIRED, workflow: activePlacement };
    }

    // In other active states, still considered in process
    return { status: 'in_process', workflow: activePlacement };
  },
};

export default placementWorkflowService;
