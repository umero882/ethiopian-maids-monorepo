/**
 * Payment Service - GraphQL Implementation
 * Uses inline gql documents with Apollo Client + Firebase Auth
 *
 * MIGRATED FROM SUPABASE TO FIREBASE/HASURA
 *
 * This service handles:
 * - Payment method management (CRUD)
 * - Booking payment processing
 * - Payment history queries
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { getStripe } from '@/config/stripe';
import { createLogger } from '@/utils/logger';

const log = createLogger('PaymentService.GraphQL');

// =====================================================
// GRAPHQL DOCUMENTS
// =====================================================

// Payment Methods Queries
const GetPaymentMethodsDocument = gql`
  query GetPaymentMethods($userId: String!) {
    payment_methods(
      where: { user_id: { _eq: $userId }, status: { _eq: "active" } }
      order_by: [{ is_default: desc }, { created_at: desc }]
    ) {
      id
      stripe_payment_method_id
      method_type
      card_brand
      card_last4
      card_exp_month
      card_exp_year
      billing_name
      billing_address
      is_default
      status
      created_at
      last_used_at
    }
  }
`;

const GetDefaultPaymentMethodDocument = gql`
  query GetDefaultPaymentMethod($userId: String!) {
    payment_methods(
      where: { user_id: { _eq: $userId }, status: { _eq: "active" }, is_default: { _eq: true } }
      limit: 1
    ) {
      id
      stripe_payment_method_id
      method_type
      card_brand
      card_last4
      card_exp_month
      card_exp_year
      billing_name
      billing_address
      is_default
      status
      created_at
      last_used_at
    }
  }
`;

// Payment Methods Mutations
const InsertPaymentMethodDocument = gql`
  mutation InsertPaymentMethod($object: payment_methods_insert_input!) {
    insert_payment_methods_one(object: $object) {
      id
      stripe_payment_method_id
      method_type
      card_brand
      card_last4
      card_exp_month
      card_exp_year
      billing_name
      is_default
      status
      created_at
    }
  }
`;

const UpdatePaymentMethodDocument = gql`
  mutation UpdatePaymentMethod($id: uuid!, $data: payment_methods_set_input!) {
    update_payment_methods_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      billing_name
      billing_address
      is_default
      status
      last_used_at
    }
  }
`;

const UnsetDefaultPaymentMethodsDocument = gql`
  mutation UnsetDefaultPaymentMethods($userId: String!) {
    update_payment_methods(
      where: { user_id: { _eq: $userId }, status: { _eq: "active" } }
      _set: { is_default: false }
    ) {
      affected_rows
    }
  }
`;

// Booking Payment Queries/Mutations
const UpdateBookingPaymentDocument = gql`
  mutation UpdateBookingPayment($id: uuid!, $data: booking_requests_set_input!) {
    update_booking_requests_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      payment_status
      payment_method
      payment_date
      payment_reference
      updated_at
    }
  }
`;

const GetPaymentHistoryDocument = gql`
  query GetPaymentHistory($userId: String!) {
    booking_requests(
      where: { sponsor_id: { _eq: $userId }, payment_date: { _is_null: false } }
      order_by: { payment_date: desc }
    ) {
      id
      amount
      currency
      payment_status
      payment_method
      payment_date
      payment_reference
      created_at
      maid: maid_profile {
        id
        full_name
        profile_photo_url
      }
    }
  }
`;

const GetBookingPaymentDetailsDocument = gql`
  query GetBookingPaymentDetails($id: uuid!) {
    booking_requests_by_pk(id: $id) {
      id
      amount
      currency
      payment_status
      payment_method
      payment_date
      payment_reference
      maid: maid_profile {
        id
        full_name
        profile_photo_url
      }
    }
  }
`;

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get current authenticated user ID from Firebase
 */
async function getCurrentUserId() {
  const user = auth?.currentUser;
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user.uid;
}

// =====================================================
// PAYMENT SERVICE
// =====================================================

export const graphqlPaymentService = {
  /**
   * Create a payment intent for booking
   * NOTE: In production, this should call a Firebase Cloud Function
   */
  async createBookingPaymentIntent(bookingId, amount, currency = 'USD') {
    try {
      log.debug('Creating payment intent for booking:', bookingId);

      // TODO: Call Firebase Cloud Function in production
      // const functions = getFunctions();
      // const createPaymentIntent = httpsCallable(functions, 'createPaymentIntent');
      // const result = await createPaymentIntent({ bookingId, amount, currency });
      // return { data: result.data, error: null };

      // For development: Mock payment intent
      const mockClientSecret = `pi_mock_${bookingId}_secret_${Date.now()}`;

      log.info('Payment intent created (mock):', mockClientSecret);

      return {
        data: {
          clientSecret: mockClientSecret,
          amount,
          currency,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error creating payment intent:', error);
      return { data: null, error };
    }
  },

  /**
   * Confirm card payment using Stripe.js
   */
  async confirmCardPayment(clientSecret, paymentMethodData) {
    try {
      log.debug('Confirming card payment');

      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      // For mock mode (development without Stripe keys)
      if (clientSecret.startsWith('pi_mock_')) {
        log.info('Mock payment confirmed');
        return {
          data: {
            paymentIntent: {
              id: clientSecret.replace('_secret_', '_').split('_secret_')[0],
              status: 'succeeded',
              amount: paymentMethodData.amount,
              currency: paymentMethodData.currency,
            },
          },
          error: null,
        };
      }

      // Real Stripe confirmation
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodData.payment_method || {
          card: paymentMethodData.card,
          billing_details: paymentMethodData.billing_details || {},
        },
      });

      if (result.error) {
        log.error('Payment confirmation error:', result.error);
        return { data: null, error: result.error };
      }

      log.info('Payment confirmed successfully:', result.paymentIntent.id);
      return { data: result, error: null };
    } catch (error) {
      log.error('Exception in confirmCardPayment:', error);
      return { data: null, error };
    }
  },

  /**
   * Update booking payment status via GraphQL
   */
  async updateBookingPayment(bookingId, paymentData) {
    try {
      log.debug('Updating booking payment status:', bookingId);

      await getCurrentUserId(); // Verify authentication

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdateBookingPaymentDocument,
        variables: {
          id: bookingId,
          data: {
            payment_status: paymentData.status,
            payment_method: paymentData.method || 'card',
            payment_date: paymentData.date || new Date().toISOString(),
            payment_reference: paymentData.reference,
          },
        },
      });

      if (errors && errors.length > 0) {
        log.error('Error updating booking payment:', errors[0]);
        return { data: null, error: errors[0] };
      }

      log.info('Booking payment updated successfully');
      return { data: data?.update_booking_requests_by_pk, error: null };
    } catch (error) {
      log.error('Exception in updateBookingPayment:', error);
      return { data: null, error };
    }
  },

  /**
   * Process booking payment - Complete flow
   */
  async processBookingPayment(bookingId, amount, currency, paymentMethodData) {
    try {
      log.info('Processing booking payment:', { bookingId, amount, currency });

      // Step 1: Create payment intent
      const intentResult = await this.createBookingPaymentIntent(bookingId, amount, currency);
      if (intentResult.error) {
        return { data: null, error: intentResult.error };
      }

      // Step 2: Confirm payment
      const confirmResult = await this.confirmCardPayment(intentResult.data.clientSecret, {
        ...paymentMethodData,
        amount,
        currency,
      });
      if (confirmResult.error) {
        return { data: null, error: confirmResult.error };
      }

      // Step 3: Update booking
      const updateResult = await this.updateBookingPayment(bookingId, {
        status: 'paid',
        method: 'card',
        date: new Date().toISOString(),
        reference: confirmResult.data.paymentIntent.id,
      });

      if (updateResult.error) {
        log.error('Payment succeeded but booking update failed:', updateResult.error);
        return {
          data: null,
          error: new Error('Payment succeeded but we could not update your booking. Please contact support.'),
        };
      }

      log.info('Booking payment processed successfully');
      return {
        data: {
          paymentIntent: confirmResult.data.paymentIntent,
          booking: updateResult.data,
        },
        error: null,
      };
    } catch (error) {
      log.error('Exception in processBookingPayment:', error);
      return { data: null, error };
    }
  },

  /**
   * Get payment history for current user
   */
  async getPaymentHistory(userId) {
    try {
      log.debug('Fetching payment history for user:', userId);

      const { data, errors } = await apolloClient.query({
        query: GetPaymentHistoryDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('Error fetching payment history:', errors[0]);
        return { data: null, error: errors[0] };
      }

      return { data: data?.booking_requests || [], error: null };
    } catch (error) {
      log.error('Exception in getPaymentHistory:', error);
      return { data: null, error };
    }
  },

  /**
   * Get booking payment details
   */
  async getBookingPaymentDetails(bookingId) {
    try {
      log.debug('Fetching payment details for booking:', bookingId);

      const { data, errors } = await apolloClient.query({
        query: GetBookingPaymentDetailsDocument,
        variables: { id: bookingId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('Error fetching booking payment details:', errors[0]);
        return { data: null, error: errors[0] };
      }

      return { data: data?.booking_requests_by_pk, error: null };
    } catch (error) {
      log.error('Exception in getBookingPaymentDetails:', error);
      return { data: null, error };
    }
  },

  /**
   * Create subscription payment intent
   */
  async createSubscriptionPaymentIntent(subscriptionId, amount, currency = 'USD') {
    try {
      log.debug('Creating subscription payment intent:', subscriptionId);

      // TODO: Call Firebase Cloud Function in production
      const mockClientSecret = `pi_sub_mock_${subscriptionId}_secret_${Date.now()}`;

      return {
        data: {
          clientSecret: mockClientSecret,
          amount,
          currency,
        },
        error: null,
      };
    } catch (error) {
      log.error('Error creating subscription payment intent:', error);
      return { data: null, error };
    }
  },

  /**
   * Get supported currencies
   */
  getSupportedCurrencies() {
    return [
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
      { code: 'GBP', symbol: '£', name: 'British Pound' },
      { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal' },
      { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
      { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
    ];
  },

  /**
   * Format amount for display
   */
  formatAmount(amount, currency = 'USD') {
    const currencyData = this.getSupportedCurrencies().find((c) => c.code === currency);
    const symbol = currencyData?.symbol || currency;

    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },

  // ============================================
  // PAYMENT METHOD MANAGEMENT (PCI-DSS Compliant)
  // ============================================

  /**
   * Get all active payment methods for current user
   */
  async getPaymentMethods() {
    try {
      log.debug('Fetching payment methods');

      const userId = await getCurrentUserId();

      const { data, errors } = await apolloClient.query({
        query: GetPaymentMethodsDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('Error fetching payment methods:', errors[0]);
        return { data: null, error: errors[0] };
      }

      const methods = data?.payment_methods || [];
      log.info(`Found ${methods.length} payment methods`);
      return { data: methods, error: null };
    } catch (error) {
      log.error('Exception in getPaymentMethods:', error);
      return { data: null, error };
    }
  },

  /**
   * Get user's default payment method
   */
  async getDefaultPaymentMethod() {
    try {
      log.debug('Fetching default payment method');

      const userId = await getCurrentUserId();

      const { data, errors } = await apolloClient.query({
        query: GetDefaultPaymentMethodDocument,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      if (errors && errors.length > 0) {
        log.error('Error fetching default payment method:', errors[0]);
        return { data: null, error: errors[0] };
      }

      const method = data?.payment_methods?.[0] || null;
      return { data: method, error: null };
    } catch (error) {
      log.error('Exception in getDefaultPaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Add new payment method using Stripe token
   */
  async addPaymentMethod(stripePaymentMethodId, billingDetails = {}, setAsDefault = false) {
    try {
      log.debug('Adding payment method:', stripePaymentMethodId);

      const userId = await getCurrentUserId();

      // If setting as default, unset other defaults first
      if (setAsDefault) {
        await apolloClient.mutate({
          mutation: UnsetDefaultPaymentMethodsDocument,
          variables: { userId },
        });
      }

      // Insert new payment method
      const { data, errors } = await apolloClient.mutate({
        mutation: InsertPaymentMethodDocument,
        variables: {
          object: {
            user_id: userId,
            stripe_payment_method_id: stripePaymentMethodId,
            method_type: 'card',
            card_brand: billingDetails.card_type || 'card',
            card_last4: billingDetails.last4 || '',
            card_exp_month: billingDetails.exp_month || null,
            card_exp_year: billingDetails.exp_year || null,
            billing_name: billingDetails.cardholder_name || '',
            billing_address: billingDetails.billing_address || null,
            is_default: setAsDefault,
            status: 'active',
          },
        },
      });

      if (errors && errors.length > 0) {
        log.error('Error adding payment method:', errors[0]);
        return { data: null, error: errors[0] };
      }

      log.info('Payment method added successfully:', data?.insert_payment_methods_one?.id);
      return { data: data?.insert_payment_methods_one, error: null };
    } catch (error) {
      log.error('Exception in addPaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Update payment method details
   */
  async updatePaymentMethod(paymentMethodId, updates) {
    try {
      log.debug('Updating payment method:', paymentMethodId);

      await getCurrentUserId(); // Verify authentication

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdatePaymentMethodDocument,
        variables: {
          id: paymentMethodId,
          data: {
            billing_name: updates.cardholder_name,
            billing_address: updates.billing_address,
          },
        },
      });

      if (errors && errors.length > 0) {
        log.error('Error updating payment method:', errors[0]);
        return { data: null, error: errors[0] };
      }

      log.info('Payment method updated successfully');
      return { data: data?.update_payment_methods_by_pk, error: null };
    } catch (error) {
      log.error('Exception in updatePaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Set a payment method as default
   */
  async setDefaultPaymentMethod(paymentMethodId) {
    try {
      log.debug('Setting default payment method:', paymentMethodId);

      const userId = await getCurrentUserId();

      // Unset all other defaults
      await apolloClient.mutate({
        mutation: UnsetDefaultPaymentMethodsDocument,
        variables: { userId },
      });

      // Set new default
      const { data, errors } = await apolloClient.mutate({
        mutation: UpdatePaymentMethodDocument,
        variables: {
          id: paymentMethodId,
          data: { is_default: true },
        },
      });

      if (errors && errors.length > 0) {
        log.error('Error setting default payment method:', errors[0]);
        return { data: null, error: errors[0] };
      }

      log.info('Default payment method updated');
      return { data: data?.update_payment_methods_by_pk, error: null };
    } catch (error) {
      log.error('Exception in setDefaultPaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove payment method (soft delete)
   */
  async removePaymentMethod(paymentMethodId) {
    try {
      log.debug('Removing payment method:', paymentMethodId);

      await getCurrentUserId(); // Verify authentication

      const { data, errors } = await apolloClient.mutate({
        mutation: UpdatePaymentMethodDocument,
        variables: {
          id: paymentMethodId,
          data: { status: 'removed' },
        },
      });

      if (errors && errors.length > 0) {
        log.error('Error removing payment method:', errors[0]);
        return { data: null, error: errors[0] };
      }

      log.info('Payment method removed successfully');
      return { data: data?.update_payment_methods_by_pk, error: null };
    } catch (error) {
      log.error('Exception in removePaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark payment method as used
   */
  async markPaymentMethodUsed(paymentMethodId) {
    try {
      await getCurrentUserId(); // Verify authentication

      const { errors } = await apolloClient.mutate({
        mutation: UpdatePaymentMethodDocument,
        variables: {
          id: paymentMethodId,
          data: { last_used_at: new Date().toISOString() },
        },
      });

      if (errors && errors.length > 0) {
        log.error('Error marking payment method as used:', errors[0]);
        return { data: null, error: errors[0] };
      }

      return { data: true, error: null };
    } catch (error) {
      log.error('Exception in markPaymentMethodUsed:', error);
      return { data: null, error };
    }
  },

  /**
   * Check if card is expired
   */
  isCardExpired(expMonth, expYear) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expYear < currentYear) return true;
    if (expYear === currentYear && expMonth < currentMonth) return true;

    return false;
  },

  /**
   * Format card display string
   */
  formatCardDisplay(cardType, last4) {
    return `${cardType} •••• ${last4}`;
  },

  /**
   * Get payment method status badge info
   */
  getPaymentMethodStatus(paymentMethod) {
    if (paymentMethod.status === 'removed') {
      return { label: 'Removed', variant: 'destructive' };
    }

    const isExpired = this.isCardExpired(paymentMethod.card_exp_month, paymentMethod.card_exp_year);
    if (isExpired) {
      return { label: 'Expired', variant: 'destructive' };
    }

    if (paymentMethod.is_default) {
      return { label: 'Default', variant: 'default' };
    }

    return { label: 'Active', variant: 'secondary' };
  },
};

export default graphqlPaymentService;
