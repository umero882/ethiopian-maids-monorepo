/**
 * usePaymentMethods Hook
 *
 * Hook for managing payment methods using GraphQL.
 * Integrates with the payment_methods table for mobile payment settings.
 */

import { useCallback, useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { useAuth } from './useAuth';

// Query to get profile ID by email
const GET_PROFILE_BY_EMAIL = gql`
  query GetProfileByEmail($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
    }
  }
`;

// Get all payment methods for a user
const GET_PAYMENT_METHODS = gql`
  query GetPaymentMethods($userId: String!) {
    payment_methods(
      where: {
        user_id: { _eq: $userId }
        status: { _eq: "active" }
      }
      order_by: [{ is_default: desc }, { created_at: desc }]
    ) {
      id
      method_type
      card_brand
      card_last4
      card_exp_month
      card_exp_year
      is_default
      is_verified
      status
      billing_name
      billing_email
      billing_phone
      billing_address
      nickname
      created_at
      updated_at
      last_used_at
      stripe_payment_method_id
      stripe_customer_id
    }
  }
`;

// Get default payment method
const GET_DEFAULT_PAYMENT_METHOD = gql`
  query GetDefaultPaymentMethod($userId: String!) {
    payment_methods(
      where: {
        user_id: { _eq: $userId }
        status: { _eq: "active" }
        is_default: { _eq: true }
      }
      limit: 1
    ) {
      id
      method_type
      card_brand
      card_last4
      card_exp_month
      card_exp_year
      billing_name
      nickname
    }
  }
`;

// Add a new payment method
const ADD_PAYMENT_METHOD = gql`
  mutation AddPaymentMethod(
    $userId: String!
    $methodType: String!
    $cardBrand: String
    $cardLast4: String
    $cardExpMonth: Int
    $cardExpYear: Int
    $billingName: String!
    $billingEmail: String
    $billingPhone: String
    $billingAddress: jsonb
    $nickname: String
    $isDefault: Boolean
    $stripePaymentMethodId: String
    $stripeCustomerId: String
  ) {
    insert_payment_methods_one(
      object: {
        user_id: $userId
        method_type: $methodType
        card_brand: $cardBrand
        card_last4: $cardLast4
        card_exp_month: $cardExpMonth
        card_exp_year: $cardExpYear
        billing_name: $billingName
        billing_email: $billingEmail
        billing_phone: $billingPhone
        billing_address: $billingAddress
        nickname: $nickname
        is_default: $isDefault
        stripe_payment_method_id: $stripePaymentMethodId
        stripe_customer_id: $stripeCustomerId
        status: "active"
      }
    ) {
      id
      method_type
      card_brand
      card_last4
      is_default
      billing_name
      nickname
      created_at
    }
  }
`;

// Set a payment method as default
const SET_DEFAULT_PAYMENT_METHOD = gql`
  mutation SetDefaultPaymentMethod($userId: String!, $paymentMethodId: uuid!) {
    # First, unset all defaults for this user
    update_payment_methods(
      where: { user_id: { _eq: $userId } }
      _set: { is_default: false }
    ) {
      affected_rows
    }
    # Then set the selected one as default
    update_payment_methods_by_pk(
      pk_columns: { id: $paymentMethodId }
      _set: { is_default: true }
    ) {
      id
      is_default
    }
  }
`;

// Remove a payment method (soft delete)
const REMOVE_PAYMENT_METHOD = gql`
  mutation RemovePaymentMethod($paymentMethodId: uuid!) {
    update_payment_methods_by_pk(
      pk_columns: { id: $paymentMethodId }
      _set: { status: "removed" }
    ) {
      id
      status
    }
  }
`;

// Update payment method details
const UPDATE_PAYMENT_METHOD = gql`
  mutation UpdatePaymentMethod(
    $paymentMethodId: uuid!
    $billingName: String
    $billingEmail: String
    $billingPhone: String
    $billingAddress: jsonb
    $nickname: String
  ) {
    update_payment_methods_by_pk(
      pk_columns: { id: $paymentMethodId }
      _set: {
        billing_name: $billingName
        billing_email: $billingEmail
        billing_phone: $billingPhone
        billing_address: $billingAddress
        nickname: $nickname
      }
    ) {
      id
      billing_name
      billing_email
      billing_phone
      billing_address
      nickname
      updated_at
    }
  }
`;

// Types
export interface PaymentMethod {
  id: string;
  method_type: string;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  is_default: boolean;
  is_verified: boolean;
  status: string;
  billing_name: string;
  billing_email?: string;
  billing_phone?: string;
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  nickname?: string;
  created_at: string;
  updated_at?: string;
  last_used_at?: string;
  stripe_payment_method_id?: string;
  stripe_customer_id?: string;
}

export interface AddPaymentMethodInput {
  methodType: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  billingName: string;
  billingEmail?: string;
  billingPhone?: string;
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  nickname?: string;
  isDefault?: boolean;
  stripePaymentMethodId?: string;
  stripeCustomerId?: string;
}

/**
 * Hook for managing user payment methods
 */
export function usePaymentMethods() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  // Fetch profile ID from email
  const { data: profileData, loading: profileLoading } = useQuery(GET_PROFILE_BY_EMAIL, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  const userId = profileId || profileData?.profiles?.[0]?.id;

  // Get payment methods
  const {
    data: paymentMethodsData,
    loading: paymentMethodsLoading,
    error,
    refetch,
  } = useQuery(GET_PAYMENT_METHODS, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const paymentMethods: PaymentMethod[] = paymentMethodsData?.payment_methods || [];
  const loading = profileLoading || paymentMethodsLoading;

  // Mutations
  const [addPaymentMethodMutation, { loading: addingPaymentMethod }] = useMutation(ADD_PAYMENT_METHOD);
  const [setDefaultMutation, { loading: settingDefault }] = useMutation(SET_DEFAULT_PAYMENT_METHOD);
  const [removeMutation, { loading: removing }] = useMutation(REMOVE_PAYMENT_METHOD);
  const [updateMutation, { loading: updating }] = useMutation(UPDATE_PAYMENT_METHOD);

  // Add a new payment method
  const addPaymentMethod = useCallback(async (input: AddPaymentMethodInput) => {
    if (!userId) {
      console.error('[PaymentMethods] No user ID available');
      return null;
    }

    try {
      const result = await addPaymentMethodMutation({
        variables: {
          userId,
          methodType: input.methodType,
          cardBrand: input.cardBrand,
          cardLast4: input.cardLast4,
          cardExpMonth: input.cardExpMonth,
          cardExpYear: input.cardExpYear,
          billingName: input.billingName,
          billingEmail: input.billingEmail,
          billingPhone: input.billingPhone,
          billingAddress: input.billingAddress,
          nickname: input.nickname,
          isDefault: input.isDefault ?? false,
          stripePaymentMethodId: input.stripePaymentMethodId,
          stripeCustomerId: input.stripeCustomerId,
        },
      });

      await refetch();
      return result.data?.insert_payment_methods_one;
    } catch (error) {
      console.error('[PaymentMethods] Error adding payment method:', error);
      throw error;
    }
  }, [userId, addPaymentMethodMutation, refetch]);

  // Set a payment method as default
  const setDefaultPaymentMethod = useCallback(async (paymentMethodId: string) => {
    if (!userId) {
      console.error('[PaymentMethods] No user ID available');
      return false;
    }

    try {
      await setDefaultMutation({
        variables: {
          userId,
          paymentMethodId,
        },
      });

      await refetch();
      return true;
    } catch (error) {
      console.error('[PaymentMethods] Error setting default payment method:', error);
      return false;
    }
  }, [userId, setDefaultMutation, refetch]);

  // Remove a payment method
  const removePaymentMethod = useCallback(async (paymentMethodId: string) => {
    try {
      await removeMutation({
        variables: { paymentMethodId },
      });

      await refetch();
      return true;
    } catch (error) {
      console.error('[PaymentMethods] Error removing payment method:', error);
      return false;
    }
  }, [removeMutation, refetch]);

  // Update payment method details
  const updatePaymentMethod = useCallback(async (
    paymentMethodId: string,
    updates: {
      billingName?: string;
      billingEmail?: string;
      billingPhone?: string;
      billingAddress?: object;
      nickname?: string;
    }
  ) => {
    try {
      const result = await updateMutation({
        variables: {
          paymentMethodId,
          ...updates,
        },
      });

      await refetch();
      return result.data?.update_payment_methods_by_pk;
    } catch (error) {
      console.error('[PaymentMethods] Error updating payment method:', error);
      throw error;
    }
  }, [updateMutation, refetch]);

  // Get default payment method
  const defaultPaymentMethod = paymentMethods.find(pm => pm.is_default) || null;

  return {
    paymentMethods,
    defaultPaymentMethod,
    loading,
    error,
    refetch,
    addPaymentMethod,
    setDefaultPaymentMethod,
    removePaymentMethod,
    updatePaymentMethod,
    isProcessing: addingPaymentMethod || settingDefault || removing || updating,
  };
}

/**
 * Hook just for getting the default payment method (lightweight)
 */
export function useDefaultPaymentMethod() {
  const { user } = useAuth();
  const [profileId, setProfileId] = useState<string | null>(null);

  const { data: profileData, loading: profileLoading } = useQuery(GET_PROFILE_BY_EMAIL, {
    variables: { email: user?.email || '' },
    skip: !user?.email,
    onCompleted: (data) => {
      if (data?.profiles?.[0]?.id) {
        setProfileId(data.profiles[0].id);
      }
    },
  });

  const userId = profileId || profileData?.profiles?.[0]?.id;

  const { data, loading: methodLoading, error } = useQuery(GET_DEFAULT_PAYMENT_METHOD, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  return {
    defaultPaymentMethod: data?.payment_methods?.[0] || null,
    loading: profileLoading || methodLoading,
    error,
  };
}

/**
 * Helper function to get display text for a payment method
 */
export function getPaymentMethodDisplay(pm: PaymentMethod): string {
  if (pm.nickname) return pm.nickname;

  switch (pm.method_type) {
    case 'card':
      return `${pm.card_brand || 'Card'} ****${pm.card_last4 || '****'}`;
    default:
      return pm.billing_name;
  }
}

/**
 * Helper function to get icon name for payment method type
 */
export function getPaymentMethodIcon(pm: PaymentMethod): string {
  switch (pm.method_type) {
    case 'card':
      return 'card-outline';
    default:
      return 'wallet-outline';
  }
}

/**
 * Helper function to check if card is expiring soon (within 3 months)
 */
export function isCardExpiringSoon(pm: PaymentMethod): boolean {
  if (pm.method_type !== 'card' || !pm.card_exp_month || !pm.card_exp_year) {
    return false;
  }

  const now = new Date();
  const expDate = new Date(pm.card_exp_year, pm.card_exp_month - 1); // Month is 0-indexed
  const threeMonthsFromNow = new Date(now.getFullYear(), now.getMonth() + 3);

  return expDate <= threeMonthsFromNow;
}

/**
 * Helper function to format expiration date
 */
export function formatExpiration(pm: PaymentMethod): string {
  if (!pm.card_exp_month || !pm.card_exp_year) return '';
  return `${pm.card_exp_month.toString().padStart(2, '0')}/${pm.card_exp_year.toString().slice(-2)}`;
}
