/**
 * Salary Value Object
 *
 * Immutable representation of salary with currency and payment period.
 */

export type CurrencyType = 'AED' | 'SAR' | 'USD' | 'EUR' | 'GBP' | 'KWD' | 'QAR' | 'BHD' | 'OMR';
export type PaymentPeriod = 'monthly' | 'weekly' | 'hourly' | 'yearly';

export interface SalaryProps {
  amount: number;
  currency?: CurrencyType;
  period?: PaymentPeriod;
}

export interface SalaryJSON {
  amount: number;
  currency: CurrencyType;
  period: PaymentPeriod;
}

export class Salary {
  readonly amount: number;
  readonly currency: CurrencyType;
  readonly period: PaymentPeriod;

  constructor(props: SalaryProps) {
    this._validate(props);

    this.amount = props.amount;
    this.currency = props.currency || 'AED'; // Default to AED (UAE Dirham)
    this.period = props.period || 'monthly'; // monthly, weekly, hourly
  }

  /**
   * Validate props
   */
  private _validate(props: SalaryProps): void {
    if (!props.amount || typeof props.amount !== 'number') {
      throw new Error('Amount is required and must be a number');
    }

    if (props.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    const validCurrencies: CurrencyType[] = ['AED', 'SAR', 'USD', 'EUR', 'GBP', 'KWD', 'QAR', 'BHD', 'OMR'];
    if (props.currency && !validCurrencies.includes(props.currency)) {
      throw new Error(`Invalid currency: ${props.currency}`);
    }

    const validPeriods: PaymentPeriod[] = ['monthly', 'weekly', 'hourly', 'yearly'];
    if (props.period && !validPeriods.includes(props.period)) {
      throw new Error(`Invalid period: ${props.period}`);
    }
  }

  /**
   * Convert to monthly equivalent for comparison
   */
  toMonthlyAmount(): number {
    switch (this.period) {
      case 'monthly':
        return this.amount;
      case 'weekly':
        return this.amount * 4.33; // Average weeks per month
      case 'hourly':
        return this.amount * 160; // Assuming 40 hours/week
      case 'yearly':
        return this.amount / 12;
      default:
        return this.amount;
    }
  }

  /**
   * Compare with another salary
   * Returns: -1 if less, 0 if equal, 1 if greater
   */
  compareTo(other: Salary): number {
    if (!(other instanceof Salary)) {
      throw new Error('Can only compare with another Salary object');
    }

    // Convert both to same currency (simplified - in production use exchange rates)
    const thisMonthly = this.toMonthlyAmount();
    const otherMonthly = other.toMonthlyAmount();

    if (thisMonthly < otherMonthly) return -1;
    if (thisMonthly > otherMonthly) return 1;
    return 0;
  }

  /**
   * Check if salary is within range
   */
  isInRange(min: number, max: number): boolean {
    const monthly = this.toMonthlyAmount();
    return monthly >= min && monthly <= max;
  }

  /**
   * Format for display
   */
  format(): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(this.amount);

    const periodLabel: Record<PaymentPeriod, string> = {
      monthly: 'per month',
      weekly: 'per week',
      hourly: 'per hour',
      yearly: 'per year',
    };

    return `${formatted} ${periodLabel[this.period]}`;
  }

  /**
   * Serialize to plain object
   */
  toJSON(): SalaryJSON {
    return {
      amount: this.amount,
      currency: this.currency,
      period: this.period,
    };
  }

  /**
   * Value equality
   */
  equals(other: Salary): boolean {
    if (!(other instanceof Salary)) return false;

    return this.amount === other.amount &&
           this.currency === other.currency &&
           this.period === other.period;
  }
}
