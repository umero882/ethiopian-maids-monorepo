import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { createLogger } from '@/utils/logger';

const log = createLogger('CountryService');

/**
 * Country Service
 * Handles all country-related database operations
 * Updated to use GraphQL/Hasura instead of Supabase
 */

// Comprehensive country list organized by region
const FALLBACK_COUNTRIES = [
  // GCC Countries (Primary destinations)
  { code: 'AE', name: 'United Arab Emirates', is_gcc: true, is_active: true, flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', is_gcc: true, is_active: true, flag: '🇸🇦' },
  { code: 'KW', name: 'Kuwait', is_gcc: true, is_active: true, flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', is_gcc: true, is_active: true, flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain', is_gcc: true, is_active: true, flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', is_gcc: true, is_active: true, flag: '🇴🇲' },

  // East African Countries (Primary source)
  { code: 'ET', name: 'Ethiopia', is_gcc: false, is_active: true, flag: '🇪🇹' },
  { code: 'KE', name: 'Kenya', is_gcc: false, is_active: true, flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', is_gcc: false, is_active: true, flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', is_gcc: false, is_active: true, flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', is_gcc: false, is_active: true, flag: '🇷🇼' },
  { code: 'ER', name: 'Eritrea', is_gcc: false, is_active: true, flag: '🇪🇷' },

  // Southeast Asian Countries (Major source)
  { code: 'PH', name: 'Philippines', is_gcc: false, is_active: true, flag: '🇵🇭' },
  { code: 'ID', name: 'Indonesia', is_gcc: false, is_active: true, flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', is_gcc: false, is_active: true, flag: '🇲🇾' },
  { code: 'TH', name: 'Thailand', is_gcc: false, is_active: true, flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', is_gcc: false, is_active: true, flag: '🇻🇳' },
  { code: 'MM', name: 'Myanmar', is_gcc: false, is_active: true, flag: '🇲🇲' },

  // South Asian Countries
  { code: 'IN', name: 'India', is_gcc: false, is_active: true, flag: '🇮🇳' },
  { code: 'LK', name: 'Sri Lanka', is_gcc: false, is_active: true, flag: '🇱🇰' },
  { code: 'BD', name: 'Bangladesh', is_gcc: false, is_active: true, flag: '🇧🇩' },
  { code: 'NP', name: 'Nepal', is_gcc: false, is_active: true, flag: '🇳🇵' },
  { code: 'PK', name: 'Pakistan', is_gcc: false, is_active: true, flag: '🇵🇰' },

  // Other Middle Eastern Countries
  { code: 'JO', name: 'Jordan', is_gcc: false, is_active: true, flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', is_gcc: false, is_active: true, flag: '🇱🇧' },
  { code: 'SY', name: 'Syria', is_gcc: false, is_active: true, flag: '🇸🇾' },
  { code: 'IQ', name: 'Iraq', is_gcc: false, is_active: true, flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', is_gcc: false, is_active: true, flag: '🇮🇷' },

  // North African Countries
  { code: 'EG', name: 'Egypt', is_gcc: false, is_active: true, flag: '🇪🇬' },
  { code: 'SD', name: 'Sudan', is_gcc: false, is_active: true, flag: '🇸🇩' },
  { code: 'MA', name: 'Morocco', is_gcc: false, is_active: true, flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisia', is_gcc: false, is_active: true, flag: '🇹🇳' },

  // West African Countries
  { code: 'NG', name: 'Nigeria', is_gcc: false, is_active: true, flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', is_gcc: false, is_active: true, flag: '🇬🇭' },
  { code: 'SN', name: 'Senegal', is_gcc: false, is_active: true, flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroon', is_gcc: false, is_active: true, flag: '🇨🇲' },

  // European Countries
  { code: 'UK', name: 'United Kingdom', is_gcc: false, is_active: true, flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', is_gcc: false, is_active: true, flag: '🇩🇪' },
  { code: 'FR', name: 'France', is_gcc: false, is_active: true, flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', is_gcc: false, is_active: true, flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', is_gcc: false, is_active: true, flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', is_gcc: false, is_active: true, flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', is_gcc: false, is_active: true, flag: '🇧🇪' },
  { code: 'SE', name: 'Sweden', is_gcc: false, is_active: true, flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', is_gcc: false, is_active: true, flag: '🇳🇴' },
  { code: 'CH', name: 'Switzerland', is_gcc: false, is_active: true, flag: '🇨🇭' },

  // North American Countries
  { code: 'US', name: 'United States', is_gcc: false, is_active: true, flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', is_gcc: false, is_active: true, flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', is_gcc: false, is_active: true, flag: '🇲🇽' },

  // Oceania
  { code: 'AU', name: 'Australia', is_gcc: false, is_active: true, flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', is_gcc: false, is_active: true, flag: '🇳🇿' },
];

// GraphQL queries for countries (if table exists)
const GET_COUNTRIES = gql`
  query GetCountries {
    countries(where: { is_active: { _eq: true } }, order_by: { name: asc }) {
      code
      name
      is_gcc
      is_active
      flag
    }
  }
`;

export const countryService = {
  /**
   * Get all active countries
   * Uses fallback list since countries are static data
   */
  async getActiveCountries() {
    try {
      // Always use fallback countries since they're comprehensive
      // and don't require a database table
      log.debug('Using comprehensive fallback countries list');
      return FALLBACK_COUNTRIES.filter(c => c.is_active).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      log.error('Error fetching countries, using fallback:', error);
      return FALLBACK_COUNTRIES;
    }
  },

  /**
   * Get GCC countries only
   */
  async getGCCCountries() {
    try {
      return FALLBACK_COUNTRIES
        .filter(c => c.is_gcc && c.is_active)
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      log.error('Error fetching GCC countries:', error);
      throw error;
    }
  },

  /**
   * Get country by code
   */
  async getCountryByCode(code) {
    try {
      const country = FALLBACK_COUNTRIES.find(c => c.code === code);
      return country ? [country] : [];
    } catch (error) {
      log.error('Error fetching country by code:', error);
      throw error;
    }
  },

  /**
   * Search countries by name
   */
  async searchCountries(searchTerm) {
    try {
      const term = searchTerm.toLowerCase();
      return FALLBACK_COUNTRIES
        .filter(c => c.name.toLowerCase().includes(term))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      log.error('Error searching countries:', error);
      throw error;
    }
  },
};

export default countryService;
