import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { auth } from '@/lib/firebaseClient';
import { getStripe } from '@/config/stripe';
import { createLogger } from '@/utils/logger';

const log = createLogger('PaymentService');

// GraphQL Queries and Mutations
const UPDATE_BOOKING_PAYMENT = gql`
  mutation UpdateBookingPayment(
    $id: uuid!
    $payment_status: String!
    $payment_method: String
    $payment_date: timestamptz
    $payment_reference: String
  ) {
    update_booking_requests_by_pk(
      pk_columns: { id: $id }
      _set: {
        payment_status: $payment_status
        payment_method: $payment_method
        payment_date: $payment_date
        payment_reference: $payment_reference
      }
    ) {
      id
      payment_status
    }
  }
`;

const GET_PAYMENT_HISTORY = gql`
  query GetPaymentHistory($sponsor_id: uuid!) {
    booking_requests(
      where: { sponsor_id: { _eq: $sponsor_id }, payment_date: { _is_null: false } }
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
      maid: profiles {
        id
        name
        avatar_url
      }
    }
  }
`;

const GET_BOOKING_PAYMENT_DETAILS = gql`
  query GetBookingPaymentDetails($id: uuid!) {
    booking_requests_by_pk(id: $id) {
      id
      amount
      currency
      payment_status
      payment_method
      payment_date
      payment_reference
      maid: profiles {
        id
        name
        avatar_url
      }
    }
  }
`;

const GET_PAYMENT_METHODS = gql`
  query GetPaymentMethods($user_id: uuid!) {
    payment_methods(
      where: { user_id: { _eq: $user_id }, status: { _eq: "active" } }
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

const GET_DEFAULT_PAYMENT_METHOD = gql`
  query GetDefaultPaymentMethod($user_id: uuid!) {
    payment_methods(
      where: { user_id: { _eq: $user_id }, status: { _eq: "active" }, is_default: { _eq: true } }
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

const UNSET_DEFAULT_PAYMENT_METHODS = gql`
  mutation UnsetDefaultPaymentMethods($user_id: uuid!) {
    update_payment_methods(
      where: { user_id: { _eq: $user_id }, status: { _eq: "active" } }
      _set: { is_default: false }
    ) {
      affected_rows
    }
  }
`;

const INSERT_PAYMENT_METHOD = gql`
  mutation InsertPaymentMethod($object: payment_methods_insert_input!) {
    insert_payment_methods_one(object: $object) {
      id
      stripe_payment_method_id
      method_type
      card_brand
      card_last4
      is_default
      status
    }
  }
`;

const UPDATE_PAYMENT_METHOD = gql`
  mutation UpdatePaymentMethod($id: uuid!, $user_id: uuid!, $cardholder_name: String, $billing_address: jsonb) {
    update_payment_methods_by_pk(
      pk_columns: { id: $id }
      _set: { cardholder_name: $cardholder_name, billing_address: $billing_address }
    ) {
      id
    }
  }
`;

const SET_DEFAULT_PAYMENT_METHOD = gql`
  mutation SetDefaultPaymentMethod($id: uuid!, $user_id: uuid!) {
    update_payment_methods_by_pk(
      pk_columns: { id: $id }
      _set: { is_default: true }
    ) {
      id
      is_default
    }
  }
`;

const REMOVE_PAYMENT_METHOD = gql`
  mutation RemovePaymentMethod($id: uuid!, $user_id: uuid!) {
    update_payment_methods_by_pk(
      pk_columns: { id: $id }
      _set: { status: "removed" }
    ) {
      id
      status
    }
  }
`;

const MARK_PAYMENT_METHOD_USED = gql`
  mutation MarkPaymentMethodUsed($id: uuid!, $user_id: uuid!, $last_used_at: timestamptz!) {
    update_payment_methods_by_pk(
      pk_columns: { id: $id }
      _set: { last_used_at: $last_used_at }
    ) {
      id
    }
  }
`;

export const paymentService = {
  /**
   * Create a payment intent for booking
   *
   * NOTE: In production, this should call a backend API endpoint
   * that creates the PaymentIntent server-side with your secret key.
   *
   * For now, this is a client-side mock that simulates the flow.
   */
  async createBookingPaymentIntent(bookingId, amount, currency = 'USD') {
    try {
      log.debug('Creating payment intent for booking:', bookingId);

      // In production, call your backend:
      // const response = await fetch('/api/create-payment-intent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ bookingId, amount, currency })
      // });
      // const { clientSecret } = await response.json();

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
   * Confirm card payment
   *
   * This uses Stripe.js to confirm the payment on the client side.
   * The PaymentIntent is created server-side for security.
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
   * Update booking payment status
   */
  async updateBookingPayment(bookingId, paymentData) {
    try {
      log.debug('Updating booking payment status:', bookingId);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data } = await apolloClient.mutate({
        mutation: UPDATE_BOOKING_PAYMENT,
        variables: {
          id: bookingId,
          payment_status: paymentData.status,
          payment_method: paymentData.method || 'card',
          payment_date: paymentData.date || new Date().toISOString(),
          payment_reference: paymentData.reference,
        }
      });

      log.info('Booking payment updated successfully');
      return { data: data?.update_booking_requests_by_pk, error: null };
    } catch (error) {
      log.error('Exception in updateBookingPayment:', error);
      return { data: null, error };
    }
  },

  /**
   * Process booking payment
   * Complete flow: create intent → confirm payment → update booking
   */
  async processBookingPayment(bookingId, amount, currency, paymentMethodData) {
    try {
      log.info('Processing booking payment:', { bookingId, amount, currency });

      // Step 1: Create payment intent
      const intentResult = await this.createBookingPaymentIntent(
        bookingId,
        amount,
        currency
      );

      if (intentResult.error) {
        return { data: null, error: intentResult.error };
      }

      // Step 2: Confirm payment
      const confirmResult = await this.confirmCardPayment(
        intentResult.data.clientSecret,
        { ...paymentMethodData, amount, currency }
      );

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
        // Payment succeeded, but we couldn't update the booking
        // This requires manual intervention
        return {
          data: null,
          error: new Error(
            'Payment succeeded but we could not update your booking. Please contact support.'
          ),
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
   * Get payment history for a user
   */
  async getPaymentHistory(userId) {
    try {
      log.debug('Fetching payment history for user:', userId);

      const { data } = await apolloClient.query({
        query: GET_PAYMENT_HISTORY,
        variables: { sponsor_id: userId },
        fetchPolicy: 'network-only'
      });

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

      const { data } = await apolloClient.query({
        query: GET_BOOKING_PAYMENT_DETAILS,
        variables: { id: bookingId },
        fetchPolicy: 'network-only'
      });

      return { data: data?.booking_requests_by_pk, error: null };
    } catch (error) {
      log.error('Exception in getBookingPaymentDetails:', error);
      return { data: null, error };
    }
  },

  /**
   * Create subscription payment intent
   * For recurring subscription payments
   */
  async createSubscriptionPaymentIntent(subscriptionId, amount, currency = 'USD') {
    try {
      log.debug('Creating subscription payment intent:', subscriptionId);

      // In production, call your backend:
      // const response = await fetch('/api/create-subscription-payment', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ subscriptionId, amount, currency })
      // });

      // For development: Mock
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
   * Uses payment_methods table (created in migration 042)
   */
  async getPaymentMethods() {
    try {
      log.debug('Fetching payment methods');

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data } = await apolloClient.query({
        query: GET_PAYMENT_METHODS,
        variables: { user_id: currentUser.uid },
        fetchPolicy: 'network-only'
      });

      const paymentMethods = data?.payment_methods || [];
      log.info(`Found ${paymentMethods.length} payment methods`);
      return { data: paymentMethods, error: null };
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

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data } = await apolloClient.query({
        query: GET_DEFAULT_PAYMENT_METHOD,
        variables: { user_id: currentUser.uid },
        fetchPolicy: 'network-only'
      });

      const paymentMethod = data?.payment_methods?.[0] || null;
      return { data: paymentMethod, error: null };
    } catch (error) {
      log.error('Exception in getDefaultPaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Add new payment method using Stripe token
   * IMPORTANT: Never send raw card data to this function
   * Use Stripe.js to tokenize card first, then pass the token
   *
   * @param {string} stripePaymentMethodId - Stripe PaymentMethod ID (pm_xxx)
   * @param {object} billingDetails - Billing information
   * @param {boolean} setAsDefault - Whether to set as default
   */
  async addPaymentMethod(stripePaymentMethodId, billingDetails = {}, setAsDefault = false) {
    try {
      log.debug('Adding payment method:', stripePaymentMethodId);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') };
      }

      // If setting as default, unset other defaults first
      if (setAsDefault) {
        await apolloClient.mutate({
          mutation: UNSET_DEFAULT_PAYMENT_METHODS,
          variables: { user_id: currentUser.uid }
        });
      }

      // Insert new payment method
      const { data } = await apolloClient.mutate({
        mutation: INSERT_PAYMENT_METHOD,
        variables: {
          object: {
            user_id: currentUser.uid,
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
          }
        }
      });

      const insertedData = data?.insert_payment_methods_one;
      log.info('Payment method added successfully:', insertedData?.id);
      return { data: insertedData, error: null };
    } catch (error) {
      log.error('Exception in addPaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Update payment method details (cardholder name, billing address)
   * Cannot update card number or expiry - must add new card instead
   */
  async updatePaymentMethod(paymentMethodId, updates) {
    try {
      log.debug('Updating payment method:', paymentMethodId);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data } = await apolloClient.mutate({
        mutation: UPDATE_PAYMENT_METHOD,
        variables: {
          id: paymentMethodId,
          user_id: currentUser.uid,
          cardholder_name: updates.cardholder_name,
          billing_address: updates.billing_address,
        }
      });

      log.info('Payment method updated successfully');
      return { data: data?.update_payment_methods_by_pk, error: null };
    } catch (error) {
      log.error('Exception in updatePaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Set a payment method as default
   * Automatically unsets other defaults
   */
  async setDefaultPaymentMethod(paymentMethodId) {
    try {
      log.debug('Setting default payment method:', paymentMethodId);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') };
      }

      // Unset all other defaults
      await apolloClient.mutate({
        mutation: UNSET_DEFAULT_PAYMENT_METHODS,
        variables: { user_id: currentUser.uid }
      });

      // Set new default
      const { data } = await apolloClient.mutate({
        mutation: SET_DEFAULT_PAYMENT_METHOD,
        variables: {
          id: paymentMethodId,
          user_id: currentUser.uid
        }
      });

      log.info('Default payment method updated');
      return { data: data?.update_payment_methods_by_pk, error: null };
    } catch (error) {
      log.error('Exception in setDefaultPaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove payment method (soft delete)
   * Sets status to 'removed' instead of deleting
   */
  async removePaymentMethod(paymentMethodId) {
    try {
      log.debug('Removing payment method:', paymentMethodId);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') };
      }

      const { data } = await apolloClient.mutate({
        mutation: REMOVE_PAYMENT_METHOD,
        variables: {
          id: paymentMethodId,
          user_id: currentUser.uid
        }
      });

      log.info('Payment method removed successfully');
      return { data: data?.update_payment_methods_by_pk, error: null };
    } catch (error) {
      log.error('Exception in removePaymentMethod:', error);
      return { data: null, error };
    }
  },

  /**
   * Mark payment method as used (updates last_used_at)
   */
  async markPaymentMethodUsed(paymentMethodId) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { data: null, error: new Error('Not authenticated') };
      }

      await apolloClient.mutate({
        mutation: MARK_PAYMENT_METHOD_USED,
        variables: {
          id: paymentMethodId,
          user_id: currentUser.uid,
          last_used_at: new Date().toISOString()
        }
      });

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

export default paymentService;
