import { vi, beforeEach, afterEach, describe, test, expect } from 'vitest';

// Mock the stripeBillingService.graphql since billingService redirects to it
vi.mock('../stripeBillingService.graphql', () => ({
  __esModule: true,
  default: {
    createCheckoutSession: vi.fn().mockResolvedValue({
      success: true,
    }),
    createPortalSession: vi.fn().mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    }),
  },
}));

// Mock logger to avoid console output
vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }),
}));

let billingService;

describe('billingService', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset modules and import fresh
    vi.resetModules();
    const module = await import('../billingService');
    billingService = module.billingService;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('createSubscription returns success from redirect flow', async () => {
    // Use real timers for async operations
    vi.useRealTimers();
    const result = await billingService.createSubscription(
      'user1',
      'maid',
      'plan_basic'
    );
    expect(result.success).toBe(true);
  });

  test('changePlan updates planId', async () => {
    const promise = billingService.changePlan('sub_123', 'plan_pro');
    vi.runAllTimers();
    const result = await promise;
    expect(result.id).toBe('sub_123');
    expect(result.planId).toBe('plan_pro');
  });

  test('cancelSubscription handles immediate cancel', async () => {
    const promise = billingService.cancelSubscription('sub_123', false);
    vi.runAllTimers();
    const result = await promise;
    expect(result.status).toBe('canceled');
    expect(result.cancelAtPeriodEnd).toBe(false);
  });

  test('calculateTax computes tax for AE', async () => {
    const promise = billingService.calculateTax('cus_1', 10000, {
      country: 'AE',
    });
    vi.runAllTimers();
    const result = await promise;
    expect(result.taxAmount).toBe(500);
    expect(result.taxRate).toBe(0.05);
    expect(result.totalWithTax).toBe(10500);
  });
});
