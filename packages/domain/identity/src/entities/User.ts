/**
 * User Entity (Aggregate Root)
 *
 * Represents a user in the identity domain.
 * Enforces business rules around user lifecycle.
 */

import { UserRole } from '../value-objects/UserRole.js';

export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface UserProps {
  id: string;
  email: string;
  emailVerified?: boolean;
  phoneNumber?: string | null;
  phoneVerified?: boolean;
  role: UserRole;
  status?: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public readonly id: string;
  public email: string;
  public emailVerified: boolean;
  public phoneNumber: string | null;
  public phoneVerified: boolean;
  public readonly role: UserRole;
  public status: UserStatus;
  public createdAt: Date;
  public updatedAt: Date;

  private _domainEvents: DomainEvent[] = [];

  constructor({
    id,
    email,
    emailVerified = false,
    phoneNumber = null,
    phoneVerified = false,
    role,
    status = 'active',
    createdAt = new Date(),
    updatedAt = new Date(),
  }: UserProps) {
    this.id = id;
    this.email = email;
    this.emailVerified = emailVerified;
    this.phoneNumber = phoneNumber;
    this.phoneVerified = phoneVerified;
    this.role = role;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Verify user's email
   */
  verifyEmail(): void {
    if (this.emailVerified) {
      throw new Error('Email already verified');
    }

    this.emailVerified = true;
    this.updatedAt = new Date();

    this._domainEvents.push({
      type: 'UserEmailVerified',
      payload: { userId: this.id, email: this.email },
      occurredAt: new Date(),
    });
  }

  /**
   * Verify user's phone number
   */
  verifyPhone(phoneNumber: string): void {
    this.phoneNumber = phoneNumber;
    this.phoneVerified = true;
    this.updatedAt = new Date();

    this._domainEvents.push({
      type: 'UserPhoneVerified',
      payload: { userId: this.id, phoneNumber },
      occurredAt: new Date(),
    });
  }

  /**
   * Suspend user account
   */
  suspend(reason: string): void {
    if (this.status === 'deleted') {
      throw new Error('Cannot suspend deleted user');
    }

    this.status = 'suspended';
    this.updatedAt = new Date();

    this._domainEvents.push({
      type: 'UserSuspended',
      payload: { userId: this.id, reason },
      occurredAt: new Date(),
    });
  }

  /**
   * Reactivate suspended user
   */
  reactivate(): void {
    if (this.status !== 'suspended') {
      throw new Error('Only suspended users can be reactivated');
    }

    this.status = 'active';
    this.updatedAt = new Date();

    this._domainEvents.push({
      type: 'UserReactivated',
      payload: { userId: this.id },
      occurredAt: new Date(),
    });
  }

  /**
   * Check if user can perform action based on role
   */
  can(permission: string): boolean {
    return this.role.hasPermission(permission);
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
   * Check if user is active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if verification is complete
   */
  isVerified(): boolean {
    return this.emailVerified && this.phoneVerified;
  }
}
