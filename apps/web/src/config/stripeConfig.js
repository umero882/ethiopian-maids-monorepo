/**
 * 🔥 Real Stripe Configuration
 * Production-ready Stripe integration with actual price IDs
 * Updated: December 2025 - New pricing structure with yearly plans (25% discount)
 */

// =============================================
// STRIPE PRICE IDS (PRODUCTION)
// =============================================

export const STRIPE_PRICE_IDS = {
  // Agency Placement Fee - One-time payments for wallet top-up
  placementFee: {
    aed500: import.meta.env.VITE_STRIPE_PLACEMENT_FEE_500 || 'price_1SeYoK3ySFkJEQXkThP3oYaL',
    aed1000: import.meta.env.VITE_STRIPE_PLACEMENT_FEE_1000 || 'price_1SeYoL3ySFkJEQXkI7DfNEIy',
    aed2000: import.meta.env.VITE_STRIPE_PLACEMENT_FEE_2000 || 'price_1SeYoL3ySFkJEQXkcyqFGmN5',
    aed5000: import.meta.env.VITE_STRIPE_PLACEMENT_FEE_5000 || 'price_1SeYoM3ySFkJEQXkxFQKGeDG',
  },

  // Sponsor Plans - New pricing structure
  sponsor: {
    weekly: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_WEEKLY_MONTHLY || 'price_1Sb9QH3ySFkJEQXkxZNoSfjq',
      yearly: import.meta.env.VITE_STRIPE_SPONSOR_WEEKLY_YEARLY || 'price_1Sb9gH3ySFkJEQXkA8Jf3tc4',
    },
    monthly: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_MONTHLY_MONTHLY || 'price_1Sb9QI3ySFkJEQXkWkOtwgSF',
      yearly: import.meta.env.VITE_STRIPE_SPONSOR_MONTHLY_YEARLY || 'price_1Sb9gH3ySFkJEQXkhRaxI2Ud',
    },
    twoMonths: import.meta.env.VITE_STRIPE_SPONSOR_2MONTHS || 'price_1Sb9QI3ySFkJEQXkwOO3EiHS',
    premium: {
      monthly: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_MONTHLY || 'price_1Sb9QJ3ySFkJEQXkFnaxurtt',
      yearly: import.meta.env.VITE_STRIPE_SPONSOR_PREMIUM_YEARLY || 'price_1Sb9gI3ySFkJEQXkP8mmIBZx',
    },
  },

  // Agency Plans - New pricing structure
  agency: {
    pro: {
      monthly: import.meta.env.VITE_STRIPE_AGENCY_PRO_MONTHLY || 'price_1Sb9QJ3ySFkJEQXkUV5OsggS',
      yearly: import.meta.env.VITE_STRIPE_AGENCY_PRO_YEARLY || 'price_1Sb9gI3ySFkJEQXkvbMwsKNC',
    },
    premium: {
      monthly: import.meta.env.VITE_STRIPE_AGENCY_PREMIUM_MONTHLY || 'price_1Sb9QK3ySFkJEQXkOoHIJFFb',
      yearly: import.meta.env.VITE_STRIPE_AGENCY_PREMIUM_YEARLY || 'price_1Sb9gJ3ySFkJEQXkgImautfo',
    },
  },
};

// =============================================
// STRIPE PAYMENT LINKS
// =============================================

export const STRIPE_PAYMENT_LINKS = {
  // Agency Placement Fee Payment Links
  placementFee: {
    aed500: import.meta.env.VITE_STRIPE_LINK_PLACEMENT_FEE_500 || 'https://buy.stripe.com/test_4gM3co2t4aI5apH0ZP8og0n',
    aed1000: import.meta.env.VITE_STRIPE_LINK_PLACEMENT_FEE_1000 || 'https://buy.stripe.com/test_3cI5kwd7I7vT69r8sh8og0o',
    aed2000: import.meta.env.VITE_STRIPE_LINK_PLACEMENT_FEE_2000 || 'https://buy.stripe.com/test_aFacMY2t47vT7dv8sh8og0p',
    aed5000: import.meta.env.VITE_STRIPE_LINK_PLACEMENT_FEE_5000 || 'https://buy.stripe.com/test_6oU28kd7I4jHfK1cIx8og0q',
  },

  sponsor: {
    weekly: {
      monthly: 'https://buy.stripe.com/test_5kQ28kc3E17v7dvbEt8og0c',
      yearly: 'https://buy.stripe.com/test_dRm4gs2t417v8hz23T8og0f',
    },
    monthly: {
      monthly: 'https://buy.stripe.com/test_7sY28k8Rs5nLeFX37X8og0d',
      yearly: 'https://buy.stripe.com/test_28E6oA0kW6rPbtL8sh8og0j',
    },
    twoMonths: 'https://buy.stripe.com/test_5kQfZaebM6rP9lD5g58og0e',
    premium: {
      monthly: 'https://buy.stripe.com/test_dRm4gs2t417v8hz23T8og0f',
      yearly: 'https://buy.stripe.com/test_6oU7sE8Rs6rP7dv8sh8og0k',
    },
  },
  agency: {
    pro: {
      monthly: 'https://buy.stripe.com/test_00wcMY5Fg7vT0P70ZP8og0g',
      yearly: 'https://buy.stripe.com/test_bJe7sEgjU03r41jgYN8og0l',
    },
    premium: {
      monthly: 'https://buy.stripe.com/test_cNi3co8RseYl41j6k98og0h',
      yearly: 'https://buy.stripe.com/test_fZu5kwgjUg2pgO537X8og0m',
    },
  },
};

// =============================================
// GCC HOLIDAY PROMOTIONAL COUPONS
// =============================================

export const PROMOTIONAL_COUPONS = {
  // Islamic Holidays (dates vary - Hijri calendar)
  EID_FITR: { id: 'yO3mYKQs', name: 'Eid Al-Fitr 50 AED Off', discount: 50, currency: 'AED' },
  EID_ADHA: { id: '8zekGpp1', name: 'Eid Al-Adha 50 AED Off', discount: 50, currency: 'AED' },
  RAMADAN: { id: 'oaGuQGj5', name: 'Ramadan 40 AED Off', discount: 40, currency: 'AED' },
  ISLAMIC_NEW_YEAR: { id: '4fx78AAd', name: 'Islamic New Year 25 AED Off', discount: 25, currency: 'AED' },

  // GCC National Days (fixed dates)
  UAE_NATIONAL: { id: 'KHRNU3FZ', name: 'UAE National Day 40 AED Off', discount: 40, currency: 'AED', date: '12-02' },
  SAUDI_NATIONAL: { id: 'MjhmEedD', name: 'Saudi National Day 40 AED Off', discount: 40, currency: 'AED', date: '09-23' },
  QATAR_NATIONAL: { id: 'PMfJGExV', name: 'Qatar National Day 40 AED Off', discount: 40, currency: 'AED', date: '12-18' },
  KUWAIT_NATIONAL: { id: 'J95LLQJO', name: 'Kuwait National Day 40 AED Off', discount: 40, currency: 'AED', date: '02-25' },
  BAHRAIN_NATIONAL: { id: 'sTgWcAUM', name: 'Bahrain National Day 40 AED Off', discount: 40, currency: 'AED', date: '12-16' },
  OMAN_NATIONAL: { id: '0RkSIcZn', name: 'Oman National Day 40 AED Off', discount: 40, currency: 'AED', date: '11-18' },

  // Other promotions
  NEW_YEAR: { id: 'T1xwgvfr', name: 'New Year 25 AED Off', discount: 25, currency: 'AED', date: '01-01' },
  BLACK_FRIDAY: { id: 'IpgsNzTC', name: 'Black Friday 75 AED Off', discount: 75, currency: 'AED' },
};

// =============================================
// GCC HOLIDAYS CALENDAR (for auto-applying promotions)
// =============================================

export const GCC_HOLIDAYS = {
  // Fixed date holidays (MM-DD format)
  fixed: [
    { date: '01-01', coupon: 'NEW_YEAR', duration: 3 },      // Jan 1 (3 days)
    { date: '02-25', coupon: 'KUWAIT_NATIONAL', duration: 3 }, // Feb 25 (3 days)
    { date: '09-23', coupon: 'SAUDI_NATIONAL', duration: 3 },  // Sep 23 (3 days)
    { date: '11-18', coupon: 'OMAN_NATIONAL', duration: 3 },   // Nov 18 (3 days)
    { date: '12-02', coupon: 'UAE_NATIONAL', duration: 3 },    // Dec 2 (3 days)
    { date: '12-16', coupon: 'BAHRAIN_NATIONAL', duration: 3 }, // Dec 16 (3 days)
    { date: '12-18', coupon: 'QATAR_NATIONAL', duration: 3 },  // Dec 18 (3 days)
  ],
  // Black Friday - last Friday of November (calculated dynamically)
  blackFriday: { coupon: 'BLACK_FRIDAY', duration: 4 },
  // Islamic holidays - dates change yearly based on Hijri calendar
  // These should be updated annually or fetched from an API
  islamic2025: [
    { start: '2025-03-01', end: '2025-03-07', coupon: 'RAMADAN' },      // Ramadan start
    { start: '2025-03-30', end: '2025-04-05', coupon: 'EID_FITR' },     // Eid Al-Fitr
    { start: '2025-06-06', end: '2025-06-12', coupon: 'EID_ADHA' },     // Eid Al-Adha
    { start: '2025-06-26', end: '2025-06-28', coupon: 'ISLAMIC_NEW_YEAR' }, // Islamic New Year
  ],
};

// =============================================
// STRIPE CONFIGURATION
// =============================================

export const STRIPE_CONFIG = {
  // Keys from environment variables - NOTE: secretKey should NEVER be in client-side code
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
  // REMOVED: secretKey - moved to server-side only for security
  // REMOVED: webhookSecret - moved to server-side only for security
  // SECURITY: No hardcoded fallback keys - must be provided via environment

  // API Configuration
  apiVersion: '2023-10-16',

  // Webhook Events
  webhookEvents: [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'checkout.session.completed',
    'customer.created',
    'customer.updated',
  ],

  // Success/Cancel URLs
  urls: {
    success: '/dashboard?payment=success',
    cancel: '/pricing?payment=cancelled',
    portal: '/dashboard/billing',
  },
};

// =============================================
// SUBSCRIPTION PLANS WITH REAL PRICING
// All prices in AED (Stripe base currency)
// UI will auto-convert to user's local currency
// Updated: December 2025 - 25% yearly discount (3 months free)
// =============================================

export const SUBSCRIPTION_PLANS_CONFIG = {
  // Maid plans (placeholder - maids use free tier primarily)
  maid: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Basic access for job seekers',
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        'Create and manage your profile',
        'Apply to job postings',
        'Basic messaging',
        'Standard support',
      ],
      limitations: [],
    },
    pro: {
      id: 'pro',
      name: 'Professional',
      description: 'Enhanced visibility for maids',
      priceId: null, // Maids don't have paid plans yet
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        'All Free features',
        'Featured profile placement',
        'Priority in search results',
      ],
      limitations: [],
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      description: 'Maximum exposure for maids',
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        'All Professional features',
        'Verified badge',
        'Priority support',
      ],
      limitations: [],
    },
  },

  // Sponsor Plans - New pricing structure (December 2025)
  sponsor: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Basic access for employers',
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        '1 active job posting',
        '10 candidate searches per month',
        '3 saved candidates',
        'Basic messaging',
      ],
      limitations: [
        'Limited candidate access',
        'No advanced filters',
      ],
    },
    pro: {
      id: 'pro',
      name: 'Weekly',
      description: 'Short-term access for quick hiring',
      priceId: STRIPE_PRICE_IDS.sponsor.weekly,
      paymentLink: STRIPE_PAYMENT_LINKS.sponsor.weekly,
      monthlyPrice: 99,
      annualPrice: 891, // 25% discount (99 * 12 * 0.75)
      currency: 'AED',
      features: [
        '1 week of premium access',
        '10 candidate searches',
        '5 saved candidates',
        '3 message threads',
        'Standard customer support',
      ],
      limitations: [],
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      description: 'Unlimited hiring power with AI matching',
      priceId: STRIPE_PRICE_IDS.sponsor.premium,
      paymentLink: STRIPE_PAYMENT_LINKS.sponsor.premium,
      monthlyPrice: 599,
      annualPrice: 5391, // 25% discount (599 * 12 * 0.75)
      currency: 'AED',
      features: [
        'Unlimited job postings',
        'Unlimited candidate searches',
        'Unlimited saved candidates',
        'Unlimited message threads',
        'AI-powered matching',
        '6-hour priority support',
        'Priority candidate access',
        'Dedicated account manager',
      ],
      limitations: [],
    },
    // Additional sponsor plans (accessible via direct payment links)
    monthly: {
      id: 'monthly',
      name: 'Monthly',
      description: 'Standard access for regular hiring',
      priceId: STRIPE_PRICE_IDS.sponsor.monthly,
      paymentLink: STRIPE_PAYMENT_LINKS.sponsor.monthly,
      monthlyPrice: 299,
      annualPrice: 2691, // 25% discount (299 * 12 * 0.75)
      currency: 'AED',
      features: [
        '3 active job postings',
        '100 candidate searches per month',
        '25 saved candidates',
        '10 message threads',
        'Advanced search filters',
        '24-hour support response',
      ],
      popular: true,
      limitations: [],
    },
    twoMonths: {
      id: 'twoMonths',
      name: '2 Months Bundle',
      description: 'Save with 2-month commitment',
      priceId: STRIPE_PRICE_IDS.sponsor.twoMonths,
      paymentLink: STRIPE_PAYMENT_LINKS.sponsor.twoMonths,
      monthlyPrice: 469,
      annualPrice: 469, // Bundle - no annual equivalent
      currency: 'AED',
      features: [
        '2 months of monthly plan access',
        '~22% savings vs monthly',
        'All Monthly plan features',
      ],
      bundle: true,
      limitations: [],
    },
  },

  // Agency Plans - New pricing structure (December 2025)
  agency: {
    free: {
      id: 'free',
      name: 'Free',
      description: 'Basic agency management',
      priceId: null,
      monthlyPrice: 0,
      annualPrice: 0,
      currency: 'AED',
      features: [
        '3 maid listings',
        '5 message threads',
        '10 sponsor connections',
        'Standard customer support',
      ],
      limitations: [
        'No analytics dashboard',
        'No bulk upload',
        'No verification badge',
      ],
    },
    pro: {
      id: 'pro',
      name: 'Professional',
      description: 'Comprehensive agency tools',
      priceId: STRIPE_PRICE_IDS.agency.pro,
      paymentLink: STRIPE_PAYMENT_LINKS.agency.pro,
      monthlyPrice: 499,
      annualPrice: 4491, // 25% discount (499 * 12 * 0.75)
      currency: 'AED',
      features: [
        '25 maid listings',
        '50 message threads',
        '100 sponsor connections',
        'Analytics dashboard',
        '24-hour support response',
        'Direct messaging',
      ],
      popular: true,
      limitations: [],
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      description: 'Enterprise agency solution',
      priceId: STRIPE_PRICE_IDS.agency.premium,
      paymentLink: STRIPE_PAYMENT_LINKS.agency.premium,
      monthlyPrice: 999,
      annualPrice: 8991, // 25% discount (999 * 12 * 0.75)
      currency: 'AED',
      features: [
        'Unlimited maid listings',
        'Unlimited message threads',
        'Unlimited sponsor connections',
        'Advanced analytics dashboard',
        'Bulk upload capabilities',
        'Verification badge',
        '6-hour priority support',
        'White-label options',
        'API access',
        'Dedicated account manager',
      ],
      limitations: [],
    },
  },
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get price ID for a specific plan and billing cycle
 */
export const getPriceId = (userType, planId, billingCycle = 'monthly') => {
  if (planId === 'free') return null;

  const plan = STRIPE_PRICE_IDS[userType]?.[planId];
  if (!plan) return null;

  return typeof plan === 'string' ? plan : plan[billingCycle];
};

/**
 * Get plan configuration
 */
export const getPlanConfig = (userType, planId) => {
  return SUBSCRIPTION_PLANS_CONFIG[userType]?.[planId] || null;
};

/**
 * Get all plans for a user type
 */
export const getPlansForUserType = (userType) => {
  return SUBSCRIPTION_PLANS_CONFIG[userType] || {};
};

/**
 * Validate Stripe configuration with enhanced security checks
 * Updated for new pricing structure (December 2025)
 */
export const validateStripeConfig = () => {
  const config = STRIPE_CONFIG;
  const errors = [];
  const warnings = [];

  // Validate publishable key
  if (!config.publishableKey) {
    errors.push('CRITICAL: Missing Stripe publishable key - check VITE_STRIPE_PUBLISHABLE_KEY environment variable');
  }

  if (config.publishableKey && !config.publishableKey.startsWith('pk_')) {
    errors.push('CRITICAL: Invalid Stripe publishable key format - must start with "pk_"');
  }

  if (config.publishableKey && config.publishableKey.includes('YOUR_')) {
    errors.push('CRITICAL: Placeholder Stripe key detected - replace with actual key');
  }

  // Security check: warn if test key is used in production
  if (config.publishableKey && config.publishableKey.includes('test') && import.meta.env.PROD) {
    warnings.push('WARNING: Using test Stripe key in production environment');
  }

  // Validate price IDs for new structure
  // Sponsor plans: weekly, monthly, twoMonths, premium
  // Agency plans: pro, premium
  const validatePriceId = (priceId, planName) => {
    if (priceId && typeof priceId === 'string' && !priceId.startsWith('price_')) {
      errors.push(`CRITICAL: Invalid Stripe price ID format for ${planName} - must start with "price_"`);
      return false;
    }
    return true;
  };

  // Validate sponsor plans
  if (STRIPE_PRICE_IDS.sponsor) {
    ['weekly', 'monthly', 'premium'].forEach(planType => {
      const plan = STRIPE_PRICE_IDS.sponsor[planType];
      if (plan) {
        if (plan.monthly) validatePriceId(plan.monthly, `sponsor ${planType} monthly`);
        if (plan.yearly) validatePriceId(plan.yearly, `sponsor ${planType} yearly`);
      }
    });
    // twoMonths is a single price, not monthly/yearly
    if (STRIPE_PRICE_IDS.sponsor.twoMonths) {
      validatePriceId(STRIPE_PRICE_IDS.sponsor.twoMonths, 'sponsor twoMonths');
    }
  }

  // Validate agency plans
  if (STRIPE_PRICE_IDS.agency) {
    ['pro', 'premium'].forEach(planType => {
      const plan = STRIPE_PRICE_IDS.agency[planType];
      if (plan) {
        if (plan.monthly) validatePriceId(plan.monthly, `agency ${planType} monthly`);
        if (plan.yearly) validatePriceId(plan.yearly, `agency ${planType} yearly`);
      }
    });
  }

  // NOTE: secretKey and webhookSecret validation removed as they should only exist server-side

  return {
    isValid: errors.length === 0,
    errors: [...errors, ...warnings],
    warnings,
    critical: errors,
  };
};

/**
 * Format price for display
 * @deprecated Use getConvertedPrice from currencyService instead for dynamic currency conversion
 * This function is kept for backward compatibility but will format in the provided currency
 */
export const formatPrice = (price, currency = 'AED') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(price);
};

/**
 * Format price with currency conversion
 * This is the new recommended way to format prices
 * @param {number} priceInAED - Price in AED (base currency)
 * @param {string} targetCurrency - Target currency code (optional, auto-detected)
 * @returns {Promise<string>} Formatted price in user's currency
 */
export const formatPriceWithConversion = async (priceInAED, targetCurrency = null) => {
  // Import currencyService dynamically to avoid circular dependencies
  const { getConvertedPrice } = await import('../services/currencyService.js');
  const result = await getConvertedPrice(priceInAED, targetCurrency);
  return result.formatted;
};

/**
 * Calculate annual savings
 */
export const calculateAnnualSavings = (monthlyPrice, annualPrice) => {
  const monthlyTotal = monthlyPrice * 12;
  const savings = monthlyTotal - annualPrice;
  const percentage = Math.round((savings / monthlyTotal) * 100);

  return {
    amount: savings,
    percentage,
    monthlyEquivalent: annualPrice / 12,
  };
};

// =============================================
// PROMOTION HELPER FUNCTIONS
// =============================================

/**
 * Get active promotion based on current date
 * @returns {Object|null} Active promotion or null
 */
export const getActivePromotion = () => {
  const now = new Date();
  const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dateStr = now.toISOString().split('T')[0];

  // Check fixed date holidays
  for (const holiday of GCC_HOLIDAYS.fixed) {
    const holidayDate = new Date(`${now.getFullYear()}-${holiday.date}`);
    const startDate = new Date(holidayDate);
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(holidayDate);
    endDate.setDate(endDate.getDate() + holiday.duration - 1);

    if (now >= startDate && now <= endDate) {
      return PROMOTIONAL_COUPONS[holiday.coupon];
    }
  }

  // Check Islamic holidays for current year
  const islamicHolidays = GCC_HOLIDAYS[`islamic${now.getFullYear()}`] || [];
  for (const holiday of islamicHolidays) {
    if (dateStr >= holiday.start && dateStr <= holiday.end) {
      return PROMOTIONAL_COUPONS[holiday.coupon];
    }
  }

  // Check Black Friday (last Friday of November)
  if (now.getMonth() === 10) { // November
    const lastDay = new Date(now.getFullYear(), 11, 0);
    const lastFriday = lastDay.getDate() - ((lastDay.getDay() + 2) % 7);
    const bfStart = lastFriday - 1;
    const bfEnd = lastFriday + GCC_HOLIDAYS.blackFriday.duration - 1;
    if (now.getDate() >= bfStart && now.getDate() <= bfEnd) {
      return PROMOTIONAL_COUPONS[GCC_HOLIDAYS.blackFriday.coupon];
    }
  }

  return null;
};

/**
 * Get payment link for a plan
 * @param {string} userType - 'sponsor' or 'agency'
 * @param {string} planId - Plan identifier
 * @param {string} billingCycle - 'monthly' or 'yearly'
 */
export const getPaymentLink = (userType, planId, billingCycle = 'monthly') => {
  const plan = STRIPE_PAYMENT_LINKS[userType]?.[planId];
  if (!plan) return null;
  return typeof plan === 'string' ? plan : plan[billingCycle];
};

/**
 * Get placement fee payment link by amount
 * @param {number} amount - Amount in AED (500, 1000, 2000, or 5000)
 * @param {string} agencyId - Agency ID for tracking
 * @returns {string} Payment link URL with client_reference_id
 */
export const getPlacementFeePaymentLink = (amount, agencyId = '') => {
  const amountKey = `aed${amount}`;
  const baseUrl = STRIPE_PAYMENT_LINKS.placementFee?.[amountKey];

  if (!baseUrl) {
    console.warn(`No payment link found for amount: ${amount} AED`);
    return null;
  }

  // Add client_reference_id for tracking the agency
  const url = new URL(baseUrl);
  if (agencyId) {
    url.searchParams.set('client_reference_id', agencyId);
  }

  return url.toString();
};

/**
 * Get placement fee price ID by amount
 * @param {number} amount - Amount in AED (500, 1000, 2000, or 5000)
 * @returns {string} Stripe price ID
 */
export const getPlacementFeePriceId = (amount) => {
  const amountKey = `aed${amount}`;
  return STRIPE_PRICE_IDS.placementFee?.[amountKey] || null;
};

/**
 * Available placement fee amounts
 */
export const PLACEMENT_FEE_AMOUNTS = [500, 1000, 2000, 5000];

// =============================================
// EXPORT DEFAULT CONFIG
// =============================================

export default {
  STRIPE_PRICE_IDS,
  STRIPE_PAYMENT_LINKS,
  STRIPE_CONFIG,
  SUBSCRIPTION_PLANS_CONFIG,
  PROMOTIONAL_COUPONS,
  GCC_HOLIDAYS,
  PLACEMENT_FEE_AMOUNTS,
  getPriceId,
  getPlanConfig,
  getPlansForUserType,
  validateStripeConfig,
  formatPrice,
  formatPriceWithConversion,
  calculateAnnualSavings,
  getActivePromotion,
  getPaymentLink,
  getPlacementFeePaymentLink,
  getPlacementFeePriceId,
};
