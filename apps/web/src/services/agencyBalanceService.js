/**
 * Agency Balance Service
 *
 * This module handles agency credit/balance management and platform fee requirements.
 * Used for the 500 platform fee system where agencies must maintain a minimum balance
 * to contact or be contacted by sponsors.
 *
 * Fee Logic:
 * - Agency must have 500 (currency based on sponsor's country) to engage with sponsors
 * - On successful placement: Platform earns the 500 as revenue
 * - On failed placement: 500 returns to agency's available balance for reuse
 * - After successful hire: Agency must deposit new 500 for next placement
 */

import { graphqlAgencyBalanceService } from './agencyBalanceService.graphql';
import { notificationService } from './notificationService';
import { createLogger } from '@/utils/logger';

const log = createLogger('AgencyBalanceService');

/**
 * Agency Balance Service - Main API
 */
export const agencyBalanceService = {
  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get agency's current balance
   * @param {string} agencyId - The agency ID
   * @returns {Object} Balance details including total, available, and reserved credits
   */
  async getAgencyBalance(agencyId) {
    log.debug('Getting agency balance', { agencyId });
    return graphqlAgencyBalanceService.getAgencyBalance(agencyId);
  },

  /**
   * Get platform fee requirement for a specific country
   * @param {string} countryCode - Country code (e.g., 'AE', 'SA') or country name
   * @returns {Object} Fee requirement including amount and currency
   */
  async getRequiredFeeForCountry(countryCode) {
    log.debug('Getting platform fee requirement', { countryCode });
    return graphqlAgencyBalanceService.getPlatformFeeRequirement(countryCode);
  },

  /**
   * Get all platform fee requirements
   * @returns {Array} List of all country fee requirements
   */
  async getAllFeeRequirements() {
    log.debug('Getting all platform fee requirements');
    return graphqlAgencyBalanceService.getAllPlatformFeeRequirements();
  },

  /**
   * Check if agency has sufficient balance to engage with a sponsor
   * This is the main gate check before allowing contact
   *
   * @param {string} agencyId - The agency ID
   * @param {string} sponsorCountry - The sponsor's country (determines fee currency)
   * @returns {Object} Balance check result
   *   - hasSufficientBalance: boolean
   *   - required: number (required amount)
   *   - currency: string (fee currency)
   *   - available: number (available balance)
   */
  async checkAgencyBalance(agencyId, sponsorCountry) {
    log.debug('Checking agency balance for contact', { agencyId, sponsorCountry });
    return graphqlAgencyBalanceService.checkAgencyBalance(agencyId, sponsorCountry);
  },

  /**
   * Get agencies with balance below threshold (for admin alerts)
   * @param {number} threshold - Minimum balance threshold (default: 500)
   * @returns {Array} List of agencies with low balance
   */
  async getAgenciesWithLowBalance(threshold = 500) {
    log.debug('Getting agencies with low balance', { threshold });
    return graphqlAgencyBalanceService.getAgenciesWithLowBalance(threshold);
  },

  // ============================================================================
  // MUTATION METHODS
  // ============================================================================

  /**
   * Reserve balance when a placement workflow starts
   * Moves amount from available to reserved credits
   *
   * @param {string} agencyId - The agency ID
   * @param {number} amount - Amount to reserve
   * @param {string} currency - Currency code
   * @param {string} placementId - The placement workflow ID
   * @returns {Object} Updated balance
   */
  async reserveBalanceForPlacement(agencyId, amount, currency, placementId) {
    log.info('Reserving balance for placement', { agencyId, amount, currency, placementId });
    const result = await graphqlAgencyBalanceService.reserveBalanceForPlacement(agencyId, amount);
    log.info('Balance reserved successfully', { agencyId, newAvailable: result?.available_credits });
    return result;
  },

  /**
   * Release balance on successful placement
   * Deducts from reserved credits as platform revenue
   *
   * @param {string} agencyId - The agency ID
   * @param {string} placementId - The placement workflow ID
   * @param {number} amount - Amount to release as revenue
   * @returns {Object} Updated balance
   */
  async releaseBalanceOnSuccess(agencyId, placementId, amount) {
    log.info('Releasing balance as platform revenue', { agencyId, placementId, amount });
    const result = await graphqlAgencyBalanceService.releaseBalanceOnSuccess(agencyId, amount);
    log.info('Balance released as revenue', { agencyId, newTotal: result?.total_credits });
    return result;
  },

  /**
   * Return balance on failed placement
   * Moves amount from reserved back to available credits
   *
   * @param {string} agencyId - The agency ID
   * @param {string} placementId - The placement workflow ID
   * @param {number} amount - Amount to return
   * @returns {Object} Updated balance
   */
  async returnBalanceOnFailure(agencyId, placementId, amount) {
    log.info('Returning balance on placement failure', { agencyId, placementId, amount });
    const result = await graphqlAgencyBalanceService.releaseBalanceOnFailure(agencyId, amount);
    log.info('Balance returned to available', { agencyId, newAvailable: result?.available_credits });
    return result;
  },

  /**
   * Create or update platform fee requirement (admin only)
   * @param {string} countryCode - Country code (e.g., 'AE', 'SA')
   * @param {string} currency - Currency code (e.g., 'AED', 'SAR')
   * @param {number} amount - Fee amount (default: 500)
   * @returns {Object} Created/updated fee requirement
   */
  async createPlatformFeeRequirement(countryCode, currency, amount = 500) {
    log.info('Creating platform fee requirement', { countryCode, currency, amount });
    return graphqlAgencyBalanceService.createPlatformFeeRequirement(countryCode, currency, amount);
  },

  // ============================================================================
  // NOTIFICATION HELPERS
  // ============================================================================

  /**
   * Send notification to agency about insufficient balance
   * @param {string} agencyUserId - The agency's user ID (for notifications)
   * @param {number} required - Required amount
   * @param {string} currency - Currency code
   */
  async notifyInsufficientBalance(agencyUserId, required, currency) {
    log.info('Sending insufficient balance notification', { agencyUserId, required, currency });

    await notificationService.createNotification(agencyUserId, {
      type: 'balance_required',
      title: 'Deposit Required',
      message: `Deposit ${required} ${currency} to connect with sponsors. Your current balance is insufficient for new placements.`,
      priority: 'high',
      action_url: '/agency/wallet',
    });
  },

  /**
   * Send notification to agency to deposit for next placement
   * @param {string} agencyUserId - The agency's user ID
   * @param {number} amount - Amount to deposit
   * @param {string} currency - Currency code
   */
  async notifyDepositForNextPlacement(agencyUserId, amount, currency) {
    log.info('Sending deposit reminder notification', { agencyUserId, amount, currency });

    await notificationService.createNotification(agencyUserId, {
      type: 'deposit_reminder',
      title: 'Deposit Required for Next Placement',
      message: `Your last placement was successful! Deposit ${amount} ${currency} to continue receiving sponsor inquiries.`,
      priority: 'normal',
      action_url: '/agency/wallet',
    });
  },

  /**
   * Send low balance warning to agency
   * @param {string} agencyUserId - The agency's user ID
   * @param {number} currentBalance - Current available balance
   */
  async notifyLowBalance(agencyUserId, currentBalance) {
    log.info('Sending low balance warning', { agencyUserId, currentBalance });

    await notificationService.createNotification(agencyUserId, {
      type: 'low_balance_warning',
      title: 'Low Balance Warning',
      message: `Your balance is low (${currentBalance}). Deposit more to ensure you can respond to sponsor inquiries.`,
      priority: 'high',
      action_url: '/agency/wallet',
    });
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Normalize country name/code to standard country code
   * @param {string} country - Country name or code
   * @returns {string} Normalized country code
   */
  normalizeCountryCode(country) {
    return graphqlAgencyBalanceService.normalizeCountryCode(country);
  },

  /**
   * Get fee display string for a country
   * @param {string} countryCode - Country code
   * @returns {string} Display string like "500 AED"
   */
  async getFeeDisplayString(countryCode) {
    const fee = await this.getRequiredFeeForCountry(countryCode);
    if (!fee) return '500 USD';
    return `${fee.amount} ${fee.currency}`;
  },
};

export default agencyBalanceService;
