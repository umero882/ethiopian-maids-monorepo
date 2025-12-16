/**
 * UpdateUser Use Case
 *
 * Updates user profile information.
 * CQRS Command handler.
 */

import { IdentityPolicies } from '@ethio/domain-identity';
import { UserRepository } from '../ports/UserRepository.js';
import { AuditLogger } from '../ports/AuditLogger.js';
import { EventBus } from '../ports/EventBus.js';

export interface UpdateUserCommand {
  userId: string;
  updates: {
    email?: string;
    phoneNumber?: string | null;
  };
  metadata?: Record<string, unknown>;
}

export interface UpdateUserResult {
  success: boolean;
  user: {
    id: string;
    email: string;
    phoneNumber: string | null;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    status: string;
    updatedAt: Date;
  };
}

export interface UpdateUserDependencies {
  userRepository: UserRepository;
  auditLogger: AuditLogger;
  eventBus: EventBus;
}

export class UpdateUser {
  constructor(private readonly deps: UpdateUserDependencies) {}

  async execute(command: UpdateUserCommand): Promise<UpdateUserResult> {
    const { userId, updates, metadata = {} } = command;

    try {
      // Get user
      const user = await this.deps.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Track changes for audit
      const changes: Record<string, { from: unknown; to: unknown }> = {};

      // Update email if provided
      if (updates.email && updates.email !== user.email) {
        if (!IdentityPolicies.isValidEmail(updates.email)) {
          throw new Error('Invalid email format');
        }

        // Check if new email already exists
        const emailExists = await this.deps.userRepository.emailExists(updates.email);
        if (emailExists) {
          throw new Error('Email already in use');
        }

        changes.email = { from: user.email, to: updates.email };
        user.email = updates.email;
        // Reset email verification when email changes
        user.emailVerified = false;

        (user as any)._domainEvents.push({
          type: 'UserEmailChanged',
          payload: {
            userId: user.id,
            oldEmail: changes.email.from,
            newEmail: changes.email.to,
          },
          occurredAt: new Date(),
        });
      }

      // Update phone number if provided
      if (updates.phoneNumber !== undefined && updates.phoneNumber !== user.phoneNumber) {
        changes.phoneNumber = { from: user.phoneNumber, to: updates.phoneNumber };
        user.phoneNumber = updates.phoneNumber;

        // Reset phone verification when phone changes
        if (updates.phoneNumber !== null) {
          user.phoneVerified = false;
        }

        (user as any)._domainEvents.push({
          type: 'UserPhoneChanged',
          payload: {
            userId: user.id,
            oldPhone: changes.phoneNumber.from,
            newPhone: changes.phoneNumber.to,
          },
          occurredAt: new Date(),
        });
      }

      // Update timestamp
      user.updatedAt = new Date();

      // Persist user
      await this.deps.userRepository.save(user);

      // Pull and publish domain events
      const events = user.pullDomainEvents();
      for (const event of events) {
        await this.deps.eventBus.publish(event);
      }

      // Audit log
      await this.deps.auditLogger.logSecurityEvent({
        action: 'USER_UPDATED',
        userId: user.id,
        resource: 'users',
        result: 'success',
        metadata: {
          changes,
          ...metadata,
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role.name,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          status: user.status,
          updatedAt: user.updatedAt,
        },
      };
    } catch (error) {
      // Audit failed attempt
      await this.deps.auditLogger.logSecurityEvent({
        action: 'USER_UPDATE_FAILED',
        userId,
        resource: 'users',
        result: 'failure',
        metadata: {
          reason: error instanceof Error ? error.message : 'Unknown error',
          attemptedUpdates: Object.keys(updates),
          ...metadata,
        },
      });

      throw error;
    }
  }
}
