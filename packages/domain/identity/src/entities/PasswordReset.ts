/**
 * PasswordReset Entity
 *
 * Represents a password reset request.
 * Enforces security rules around password reset lifecycle.
 */

import { DomainEvent } from './User.js';

export type PasswordResetStatus = 'pending' | 'used' | 'expired' | 'cancelled';

export interface PasswordResetProps {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  usedAt?: Date | null;
  status?: PasswordResetStatus;
  ipAddress?: string | null;
}

export class PasswordReset {
  public readonly id: string;
  public readonly userId: string;
  public readonly email: string;
  public readonly token: string;
  public readonly expiresAt: Date;
  public readonly createdAt: Date;
  public usedAt: Date | null;
  public status: PasswordResetStatus;
  public readonly ipAddress: string | null;

  private _domainEvents: DomainEvent[] = [];

  constructor({
    id,
    userId,
    email,
    token,
    expiresAt,
    createdAt = new Date(),
    usedAt = null,
    status = 'pending',
    ipAddress = null,
  }: PasswordResetProps) {
    this.id = id;
    this.userId = userId;
    this.email = email;
    this.token = token;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.usedAt = usedAt;
    this.status = status;
    this.ipAddress = ipAddress;
  }

  /**
   * Check if reset token is valid
   */
  isValid(): boolean {
    if (this.status !== 'pending') {
      return false;
    }

    if (new Date() > this.expiresAt) {
      this.expire();
      return false;
    }

    return true;
  }

  /**
   * Expire the reset token
   */
  expire(): void {
    if (this.status !== 'pending') {
      throw new Error('Only pending reset tokens can be expired');
    }

    this.status = 'expired';

    this._domainEvents.push({
      type: 'PasswordResetExpired',
      payload: {
        resetId: this.id,
        userId: this.userId,
        email: this.email,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Mark reset token as used
   */
  markAsUsed(): void {
    if (!this.isValid()) {
      throw new Error('Cannot use invalid reset token');
    }

    this.status = 'used';
    this.usedAt = new Date();

    this._domainEvents.push({
      type: 'PasswordResetUsed',
      payload: {
        resetId: this.id,
        userId: this.userId,
        email: this.email,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Cancel the reset request
   */
  cancel(reason: string | null = null): void {
    if (this.status !== 'pending') {
      throw new Error('Only pending reset tokens can be cancelled');
    }

    this.status = 'cancelled';

    this._domainEvents.push({
      type: 'PasswordResetCancelled',
      payload: {
        resetId: this.id,
        userId: this.userId,
        reason,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Get domain events and clear
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Check if reset is approaching expiry
   */
  isApproachingExpiry(thresholdMinutes: number = 10): boolean {
    const now = new Date();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    const timeUntilExpiry = this.expiresAt.getTime() - now.getTime();

    return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMs;
  }

  /**
   * Get age in minutes
   */
  getAgeInMinutes(): number {
    const now = new Date();
    const ageMs = now.getTime() - this.createdAt.getTime();
    return Math.floor(ageMs / (60 * 1000));
  }
}
