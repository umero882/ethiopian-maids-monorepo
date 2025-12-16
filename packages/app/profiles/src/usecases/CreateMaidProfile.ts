/**
 * CreateMaidProfile Use Case (Command)
 *
 * Creates a new maid profile for a user.
 */

import { MaidProfile, ProfilePolicies } from '@ethio/domain-profiles';
import type { MaidProfileRepository } from '../ports/MaidProfileRepository.js';

export interface EventBus {
  publish(event: any): Promise<void>;
}

export interface AuditLogger {
  logSecurityEvent(event: {
    action: string;
    userId: string;
    profileId: string;
    metadata?: Record<string, any>;
  }): Promise<void>;
}

export interface CreateMaidProfileCommand {
  userId: string;
  fullName?: string;
  dateOfBirth?: Date | string;
  nationality?: string;
  phone?: string;
}

export interface CreateMaidProfileResult {
  profileId: string;
  profile: Record<string, any>;
}

export interface CreateMaidProfileDependencies {
  maidProfileRepository: MaidProfileRepository;
  eventBus: EventBus;
  auditLogger: AuditLogger;
}

export class CreateMaidProfile {
  private maidProfileRepository: MaidProfileRepository;
  private eventBus: EventBus;
  private auditLogger: AuditLogger;

  constructor({ maidProfileRepository, eventBus, auditLogger }: CreateMaidProfileDependencies) {
    this.maidProfileRepository = maidProfileRepository;
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use case
   */
  async execute(command: CreateMaidProfileCommand): Promise<CreateMaidProfileResult> {
    // 1. Validate command
    this._validate(command);

    // 2. Check if user already has a profile
    const exists = await this.maidProfileRepository.profileExists(command.userId);
    if (exists) {
      throw new Error('User already has a maid profile');
    }

    // 3. Validate business rules
    if (command.dateOfBirth && !ProfilePolicies.isValidMaidAge(command.dateOfBirth)) {
      const age = ProfilePolicies.calculateAge(command.dateOfBirth);
      throw new Error(
        `Invalid age: ${age}. Maid must be between ${ProfilePolicies.MINIMUM_MAID_AGE} and ${ProfilePolicies.MAXIMUM_MAID_AGE} years old`
      );
    }

    if (command.phone && !ProfilePolicies.isValidPhoneNumber(command.phone)) {
      throw new Error('Invalid phone number format. Use international format (e.g., +251912345678)');
    }

    // 4. Create profile entity
    const profile = new MaidProfile({
      id: this._generateId(),
      userId: command.userId,
      fullName: command.fullName || null,
      dateOfBirth: command.dateOfBirth || null,
      nationality: command.nationality || 'ET',
      phone: command.phone || null,
      status: 'draft',
    });

    // 5. Persist profile
    await this.maidProfileRepository.save(profile);

    // 6. Publish domain events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 7. Log audit event
    await this.auditLogger.logSecurityEvent({
      action: 'MAID_PROFILE_CREATED',
      userId: command.userId,
      profileId: profile.id,
      metadata: {
        nationality: profile.nationality,
      },
    });

    // 8. Return result
    return {
      profileId: profile.id,
      profile: profile.toJSON(),
    };
  }

  /**
   * Validate command structure
   */
  private _validate(command: CreateMaidProfileCommand): void {
    if (!command.userId) {
      throw new Error('userId is required');
    }

    // Other fields are optional at creation time
  }

  /**
   * Generate unique ID
   */
  private _generateId(): string {
    return `maid_profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
