/**
 * Agency Balance Service - GraphQL Implementation
 *
 * Handles agency credit/balance operations and platform fee requirements.
 * Uses GraphQL/Hasura for all data operations.
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

// ============================================================================
// GRAPHQL DOCUMENTS
// ============================================================================

const GET_AGENCY_BALANCE = gql`
  query GetAgencyBalance($agencyId: String!) {
    agency_credits(where: { agency_id: { _eq: $agencyId } }) {
      id
      agency_id
      total_credits
      available_credits
      reserved_credits
      auto_apply_credits
      last_credit_used_at
      created_at
      updated_at
    }
  }
`;

const GET_PLATFORM_FEE_REQUIREMENT = gql`
  query GetPlatformFeeRequirement($countryCode: String!) {
    platform_fee_requirements(where: { country_code: { _eq: $countryCode } }) {
      id
      country_code
      currency
      amount
    }
  }
`;

const GET_ALL_PLATFORM_FEE_REQUIREMENTS = gql`
  query GetAllPlatformFeeRequirements {
    platform_fee_requirements(order_by: { country_code: asc }) {
      id
      country_code
      currency
      amount
    }
  }
`;

const CHECK_AGENCY_BALANCE_FOR_CONTACT = gql`
  query CheckAgencyBalanceForContact($agencyId: String!, $requiredAmount: numeric!) {
    agency_credits(
      where: {
        agency_id: { _eq: $agencyId }
        available_credits: { _gte: $requiredAmount }
      }
    ) {
      id
      available_credits
    }
  }
`;

const GET_AGENCIES_WITH_LOW_BALANCE = gql`
  query GetAgenciesWithLowBalance($threshold: numeric!) {
    agency_credits(where: { available_credits: { _lt: $threshold } }) {
      agency_id
      available_credits
      total_credits
      agency_profile {
        id
        full_name
        business_email
      }
    }
  }
`;

const RESERVE_AGENCY_BALANCE = gql`
  mutation ReserveAgencyBalance($agencyId: String!, $amount: numeric!) {
    update_agency_credits(
      where: { agency_id: { _eq: $agencyId } }
      _inc: { reserved_credits: $amount }
      _dec: { available_credits: $amount }
    ) {
      affected_rows
      returning {
        available_credits
        reserved_credits
      }
    }
  }
`;

const RELEASE_AGENCY_BALANCE = gql`
  mutation ReleaseAgencyBalance($agencyId: String!, $amount: numeric!) {
    update_agency_credits(
      where: { agency_id: { _eq: $agencyId } }
      _dec: { reserved_credits: $amount }
      _inc: { available_credits: $amount }
    ) {
      affected_rows
      returning {
        available_credits
        reserved_credits
      }
    }
  }
`;

const DEDUCT_AGENCY_BALANCE_AS_REVENUE = gql`
  mutation DeductAgencyBalanceAsRevenue($agencyId: String!, $amount: numeric!) {
    update_agency_credits(
      where: { agency_id: { _eq: $agencyId } }
      _dec: { reserved_credits: $amount, total_credits: $amount }
      _set: { last_credit_used_at: "now()" }
    ) {
      affected_rows
      returning {
        total_credits
        available_credits
        reserved_credits
      }
    }
  }
`;

const CREATE_PLATFORM_FEE_REQUIREMENT = gql`
  mutation CreatePlatformFeeRequirement(
    $countryCode: String!
    $currency: String!
    $amount: numeric!
  ) {
    insert_platform_fee_requirements_one(
      object: { country_code: $countryCode, currency: $currency, amount: $amount }
      on_conflict: {
        constraint: platform_fee_requirements_country_code_key
        update_columns: [currency, amount]
      }
    ) {
      id
      country_code
      currency
      amount
    }
  }
`;

// ============================================================================
// COUNTRY CODE MAPPING
// ============================================================================

const COUNTRY_CODE_MAP = {
  // GCC Countries
  'United Arab Emirates': 'AE',
  UAE: 'AE',
  'Saudi Arabia': 'SA',
  KSA: 'SA',
  Kuwait: 'KW',
  Qatar: 'QA',
  Bahrain: 'BH',
  Oman: 'OM',
  // Other common countries
  Ethiopia: 'ET',
  Lebanon: 'LB',
  Jordan: 'JO',
  Egypt: 'EG',
};

// ============================================================================
// GCC PLATFORM FEE DEFAULTS (Equivalent to 500 AED)
// Exchange rates approximate as of 2025
// 500 AED ≈ $136 USD
// ============================================================================

const GCC_FEE_DEFAULTS = {
  AE: { currency: 'AED', amount: 500 },      // UAE Dirham - Base rate
  SA: { currency: 'SAR', amount: 510 },      // Saudi Riyal (1 AED ≈ 1.02 SAR)
  KW: { currency: 'KWD', amount: 42 },       // Kuwaiti Dinar (1 KWD ≈ 12 AED)
  QA: { currency: 'QAR', amount: 495 },      // Qatari Riyal (1 AED ≈ 0.99 QAR)
  BH: { currency: 'BHD', amount: 51 },       // Bahraini Dinar (1 BHD ≈ 9.75 AED)
  OM: { currency: 'OMR', amount: 53 },       // Omani Rial (1 OMR ≈ 9.55 AED)
  // Fallback for other countries
  DEFAULT: { currency: 'USD', amount: 136 }, // ~500 AED equivalent
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export const graphqlAgencyBalanceService = {
  /**
   * Get agency balance/credits
   */
  async getAgencyBalance(agencyId) {
    const { data } = await apolloClient.query({
      query: GET_AGENCY_BALANCE,
      variables: { agencyId },
      fetchPolicy: 'network-only',
    });
    return data?.agency_credits?.[0] || null;
  },

  /**
   * Get platform fee requirement for a country
   * Falls back to GCC defaults based on 500 AED equivalent
   */
  async getPlatformFeeRequirement(countryCode) {
    // Normalize country code
    const normalizedCode = COUNTRY_CODE_MAP[countryCode] || countryCode?.toUpperCase();

    try {
      const { data } = await apolloClient.query({
        query: GET_PLATFORM_FEE_REQUIREMENT,
        variables: { countryCode: normalizedCode },
        fetchPolicy: 'cache-first',
      });

      const dbFee = data?.platform_fee_requirements?.[0];
      if (dbFee) {
        return dbFee;
      }
    } catch (error) {
      console.warn('Error fetching platform fee requirement:', error);
    }

    // Fallback to GCC defaults (equivalent to 500 AED)
    const defaultFee = GCC_FEE_DEFAULTS[normalizedCode] || GCC_FEE_DEFAULTS.DEFAULT;
    return {
      country_code: normalizedCode,
      currency: defaultFee.currency,
      amount: defaultFee.amount,
    };
  },

  /**
   * Get all platform fee requirements
   */
  async getAllPlatformFeeRequirements() {
    const { data } = await apolloClient.query({
      query: GET_ALL_PLATFORM_FEE_REQUIREMENTS,
      fetchPolicy: 'cache-first',
    });
    return data?.platform_fee_requirements || [];
  },

  /**
   * Check if agency has sufficient balance for contact
   * Returns detailed balance check result
   */
  async checkAgencyBalance(agencyId, sponsorCountry) {
    // Get required fee for sponsor's country
    const feeRequirement = await this.getPlatformFeeRequirement(sponsorCountry);

    if (!feeRequirement) {
      // Default to 500 USD if no specific requirement
      return {
        hasSufficientBalance: false,
        required: 500,
        currency: 'USD',
        available: 0,
        error: 'No fee requirement found for country',
      };
    }

    // Get agency's current balance
    const agencyBalance = await this.getAgencyBalance(agencyId);

    if (!agencyBalance) {
      return {
        hasSufficientBalance: false,
        required: feeRequirement.amount,
        currency: feeRequirement.currency,
        available: 0,
        error: 'Agency has no credit record',
      };
    }

    const hasSufficientBalance = agencyBalance.available_credits >= feeRequirement.amount;

    return {
      hasSufficientBalance,
      required: feeRequirement.amount,
      currency: feeRequirement.currency,
      available: agencyBalance.available_credits,
      total: agencyBalance.total_credits,
      reserved: agencyBalance.reserved_credits,
    };
  },

  /**
   * Reserve balance for a placement
   */
  async reserveBalanceForPlacement(agencyId, amount) {
    const { data } = await apolloClient.mutate({
      mutation: RESERVE_AGENCY_BALANCE,
      variables: { agencyId, amount },
    });
    return data?.update_agency_credits?.returning?.[0] || null;
  },

  /**
   * Release reserved balance back to available (on failure)
   */
  async releaseBalanceOnFailure(agencyId, amount) {
    const { data } = await apolloClient.mutate({
      mutation: RELEASE_AGENCY_BALANCE,
      variables: { agencyId, amount },
    });
    return data?.update_agency_credits?.returning?.[0] || null;
  },

  /**
   * Deduct balance as platform revenue (on success)
   */
  async releaseBalanceOnSuccess(agencyId, amount) {
    const { data } = await apolloClient.mutate({
      mutation: DEDUCT_AGENCY_BALANCE_AS_REVENUE,
      variables: { agencyId, amount },
    });
    return data?.update_agency_credits?.returning?.[0] || null;
  },

  /**
   * Get agencies with low balance (for admin notifications)
   */
  async getAgenciesWithLowBalance(threshold = 500) {
    const { data } = await apolloClient.query({
      query: GET_AGENCIES_WITH_LOW_BALANCE,
      variables: { threshold },
      fetchPolicy: 'network-only',
    });
    return data?.agency_credits || [];
  },

  /**
   * Create or update platform fee requirement (admin)
   */
  async createPlatformFeeRequirement(countryCode, currency, amount) {
    const { data } = await apolloClient.mutate({
      mutation: CREATE_PLATFORM_FEE_REQUIREMENT,
      variables: { countryCode, currency, amount },
    });
    return data?.insert_platform_fee_requirements_one || null;
  },

  /**
   * Get country code from country name or code
   */
  normalizeCountryCode(country) {
    if (!country) return null;
    return COUNTRY_CODE_MAP[country] || country.toUpperCase().slice(0, 2);
  },
};
