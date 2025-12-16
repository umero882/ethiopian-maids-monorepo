/**
 * Placement Fee Payment Service
 * Handles Stripe payment integration for agency placement fees
 * with auto-update of agency balance after successful payment
 */

import { getPlacementFeePaymentLink, PLACEMENT_FEE_AMOUNTS } from '@/config/stripeConfig';
import { placementFeesService } from './placementFeesService.graphql';
import { createLogger } from '@/utils/logger';

const log = createLogger('PlacementFeePaymentService');

// Session storage keys for tracking pending payments
const PENDING_PAYMENT_KEY = 'placement_fee_pending_payment';
const PAYMENT_SUCCESS_KEY = 'placement_fee_payment_success';

/**
 * Placement Fee Payment Service
 */
class PlacementFeePaymentService {
  /**
   * Initiate a placement fee payment via Stripe
   * @param {string} agencyId - Agency UUID
   * @param {number} amount - Amount in AED (500, 1000, 2000, or 5000)
   * @param {string} returnUrl - URL to return to after payment (optional)
   * @returns {object} Result with success status and payment URL
   */
  initiatePayment(agencyId, amount, returnUrl = null) {
    try {
      // Validate amount
      if (!PLACEMENT_FEE_AMOUNTS.includes(amount)) {
        log.error(`Invalid placement fee amount: ${amount}. Must be one of: ${PLACEMENT_FEE_AMOUNTS.join(', ')}`);
        return {
          success: false,
          error: `Invalid amount. Please select ${PLACEMENT_FEE_AMOUNTS.join(', ')} AED`,
        };
      }

      // Get payment link with agency ID for tracking
      let paymentUrl = getPlacementFeePaymentLink(amount, agencyId);

      if (!paymentUrl) {
        log.error(`No payment link found for amount: ${amount}`);
        return {
          success: false,
          error: 'Payment link not available. Please try again later.',
        };
      }

      // Store pending payment info in session storage
      const pendingPayment = {
        agencyId,
        amount,
        currency: 'AED',
        timestamp: new Date().toISOString(),
        returnUrl: returnUrl || window.location.pathname,
      };

      sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pendingPayment));

      // Add success redirect URL to payment link
      // Stripe Payment Links support custom success URLs via query params
      const url = new URL(paymentUrl);
      const successUrl = `${window.location.origin}/dashboard/agency/placement-fees?payment=success&amount=${amount}`;
      const cancelUrl = `${window.location.origin}/dashboard/agency/placement-fees?payment=cancelled`;

      // Note: Stripe Payment Links may require these to be configured in the dashboard
      // For now, we'll append the client_reference_id which includes the agency ID
      url.searchParams.set('client_reference_id', `${agencyId}_${amount}_${Date.now()}`);
      paymentUrl = url.toString();

      log.info(`Payment initiated for agency ${agencyId}, amount: ${amount} AED`);

      return {
        success: true,
        paymentUrl,
        pendingPayment,
        successUrl,
        cancelUrl,
      };
    } catch (error) {
      log.error('Error initiating payment:', error);
      return {
        success: false,
        error: error.message || 'Failed to initiate payment',
      };
    }
  }

  /**
   * Open payment in new window/tab
   * @param {string} agencyId - Agency UUID
   * @param {number} amount - Amount in AED
   */
  openPaymentWindow(agencyId, amount) {
    const result = this.initiatePayment(agencyId, amount);

    if (result.success && result.paymentUrl) {
      // Open Stripe checkout in same window (better UX for payment flow)
      window.location.href = result.paymentUrl;
      return { success: true };
    }

    return result;
  }

  /**
   * Check for and process pending payment after returning from Stripe
   * Call this on component mount in the placement fees page
   * @param {string} agencyId - Current agency ID
   * @returns {object} Result with processed payment details or null
   */
  async checkPendingPayment(agencyId) {
    try {
      // Check URL params for payment success indicators first
      const urlParams = new URLSearchParams(window.location.search);
      const isSuccess = urlParams.get('payment') === 'success' ||
                        urlParams.get('checkout') === 'success' ||
                        urlParams.has('session_id');
      const isCancelled = urlParams.get('payment') === 'cancelled' ||
                          urlParams.get('checkout') === 'cancelled';

      // Get amount from URL if available
      const urlAmount = parseInt(urlParams.get('amount'), 10);

      // Get pending payment data from session storage
      const pendingData = sessionStorage.getItem(PENDING_PAYMENT_KEY);
      let pending = null;

      if (pendingData) {
        pending = JSON.parse(pendingData);
        // Verify this is for the current agency
        if (pending.agencyId !== agencyId) {
          log.warn('Pending payment agency mismatch');
          pending = null;
        }
      }

      // If no pending data but we have success URL params, create from URL
      if (!pending && isSuccess && urlAmount && PLACEMENT_FEE_AMOUNTS.includes(urlAmount)) {
        pending = {
          agencyId,
          amount: urlAmount,
          currency: 'AED',
          timestamp: new Date().toISOString(),
        };
        log.info('Created pending payment from URL params:', pending);
      }

      // Process success
      if (isSuccess && pending) {
        log.info('Payment success detected, processing auto-update...');

        // Auto-update the agency balance
        const updateResult = await this.processSuccessfulPayment(
          pending.agencyId || agencyId,
          pending.amount,
          pending.currency || 'AED'
        );

        // Clear pending payment
        sessionStorage.removeItem(PENDING_PAYMENT_KEY);

        // Store success info for UI display
        sessionStorage.setItem(PAYMENT_SUCCESS_KEY, JSON.stringify({
          ...pending,
          processedAt: new Date().toISOString(),
          updateResult,
        }));

        // Clean URL params
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        return {
          hasPending: true,
          wasSuccessful: true,
          data: pending,
          updateResult,
        };
      }

      // Handle cancelled payment
      if (isCancelled) {
        sessionStorage.removeItem(PENDING_PAYMENT_KEY);

        // Clean URL params
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);

        return {
          hasPending: true,
          wasSuccessful: false,
          wasCancelled: true,
          data: pending,
        };
      }

      // No URL params - check if pending payment is stale
      if (pending) {
        const paymentTime = new Date(pending.timestamp);
        const now = new Date();
        const hoursDiff = (now - paymentTime) / (1000 * 60 * 60);

        if (hoursDiff > 1) {
          log.info('Stale pending payment removed');
          sessionStorage.removeItem(PENDING_PAYMENT_KEY);
          return { hasPending: false, data: null };
        }

        return {
          hasPending: true,
          wasSuccessful: false,
          isPending: true,
          data: pending,
        };
      }

      return { hasPending: false, data: null };
    } catch (error) {
      log.error('Error checking pending payment:', error);
      return { hasPending: false, data: null, error };
    }
  }

  /**
   * Process successful payment - auto-update agency balance
   * @param {string} agencyId - Agency ID (Firebase UID)
   * @param {number} amount - Amount paid in AED
   * @param {string} currency - Currency code
   */
  async processSuccessfulPayment(agencyId, amount, currency = 'AED') {
    try {
      log.info(`Processing successful payment: ${amount} ${currency} for agency ${agencyId}`);

      if (!agencyId) {
        log.error('processSuccessfulPayment: agencyId is required');
        return {
          success: false,
          error: 'Agency ID is required',
        };
      }

      if (!amount || amount <= 0) {
        log.error('processSuccessfulPayment: valid amount is required');
        return {
          success: false,
          error: 'Valid amount is required',
        };
      }

      // Update agency balance via the placement fees service
      log.info('Calling placementFeesService.addPlacementFee...');
      const result = await placementFeesService.addPlacementFee(
        agencyId,
        amount,
        currency,
        `Stripe payment - ${new Date().toISOString()}`
      );

      log.info('addPlacementFee result:', result);

      if (result.error) {
        log.error('Failed to update agency balance:', result.error);
        return {
          success: false,
          error: result.error?.message || result.error || 'Failed to update balance',
        };
      }

      log.info('Agency balance updated successfully:', result.data);
      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      log.error('Error processing successful payment:', error);
      return {
        success: false,
        error: error.message || 'Failed to update balance',
      };
    }
  }

  /**
   * Get last successful payment info (for showing success message)
   * @returns {object|null} Last successful payment or null
   */
  getLastSuccessfulPayment() {
    try {
      const successData = sessionStorage.getItem(PAYMENT_SUCCESS_KEY);
      if (!successData) return null;

      const success = JSON.parse(successData);

      // Clear after reading (one-time display)
      sessionStorage.removeItem(PAYMENT_SUCCESS_KEY);

      return success;
    } catch (error) {
      log.error('Error getting last successful payment:', error);
      return null;
    }
  }

  /**
   * Clear all pending payment data
   */
  clearPendingPayment() {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
    sessionStorage.removeItem(PAYMENT_SUCCESS_KEY);
  }

  /**
   * Get available payment amounts
   * @returns {Array} Available amounts in AED
   */
  getAvailableAmounts() {
    return PLACEMENT_FEE_AMOUNTS;
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in AED
   * @returns {string} Formatted amount string
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}

export const placementFeePaymentService = new PlacementFeePaymentService();
export default placementFeePaymentService;
