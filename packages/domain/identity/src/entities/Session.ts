/**
 * Session Entity
 *
 * Represents an authenticated user session.
 * Tracks session lifecycle and security.
 */

import { DomainEvent } from './User.js';

export type SessionStatus = 'active' | 'expired' | 'revoked';

export interface SessionProps {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string | null;
  expiresAt: Date;
  createdAt?: Date;
  lastActivityAt?: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: SessionStatus;
}

export class Session {
  public readonly id: string;
  public readonly userId: string;
  public token: string;
  public refreshToken: string | null;
  public expiresAt: Date;
  public readonly createdAt: Date;
  public lastActivityAt: Date;
  public readonly ipAddress: string | null;
  public readonly userAgent: string | null;
  public status: SessionStatus;

  private _domainEvents: DomainEvent[] = [];

  constructor({
    id,
    userId,
    token,
    refreshToken = null,
    expiresAt,
    createdAt = new Date(),
    lastActivityAt = new Date(),
    ipAddress = null,
    userAgent = null,
    status = 'active',
  }: SessionProps) {
    this.id = id;
    this.userId = userId;
    this.token = token;
    this.refreshToken = refreshToken;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.lastActivityAt = lastActivityAt;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.status = status;
  }

  /**
   * Check if session is valid
   */
  isValid(): boolean {
    if (this.status !== 'active') {
      return false;
    }

    if (new Date() > this.expiresAt) {
      this.expire();
      return false;
    }

    return true;
  }

  /**
   * Expire the session
   */
  expire(): void {
    if (this.status === 'revoked') {
      throw new Error('Cannot expire revoked session');
    }

    this.status = 'expired';

    this._domainEvents.push({
      type: 'SessionExpired',
      payload: { sessionId: this.id, userId: this.userId },
      occurredAt: new Date(),
    });
  }

  /**
   * Revoke the session (logout, security event)
   */
  revoke(reason: string | null = null): void {
    if (this.status === 'revoked') {
      throw new Error('Session already revoked');
    }

    this.status = 'revoked';

    this._domainEvents.push({
      type: 'SessionRevoked',
      payload: {
        sessionId: this.id,
        userId: this.userId,
        reason,
      },
      occurredAt: new Date(),
    });
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    if (!this.isValid()) {
      throw new Error('Cannot update activity of invalid session');
    }

    this.lastActivityAt = new Date();
  }

  /**
   * Refresh the session with new token and expiry
   */
  refresh(
    newToken: string,
    newExpiresAt: Date,
    newRefreshToken: string | null = null
  ): void {
    if (!this.isValid()) {
      throw new Error('Cannot refresh invalid session');
    }

    this.token = newToken;
    this.expiresAt = newExpiresAt;

    if (newRefreshToken) {
      this.refreshToken = newRefreshToken;
    }

    this.lastActivityAt = new Date();

    this._domainEvents.push({
      type: 'SessionRefreshed',
      payload: { sessionId: this.id, userId: this.userId },
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
   * Check if session is approaching expiry
   */
  isApproachingExpiry(thresholdMinutes: number = 5): boolean {
    const now = new Date();
    const thresholdMs = thresholdMinutes * 60 * 1000;
    const timeUntilExpiry = this.expiresAt.getTime() - now.getTime();

    return timeUntilExpiry > 0 && timeUntilExpiry <= thresholdMs;
  }

  /**
   * Get session duration in milliseconds
   */
  getDuration(): number {
    return this.lastActivityAt.getTime() - this.createdAt.getTime();
  }
}
