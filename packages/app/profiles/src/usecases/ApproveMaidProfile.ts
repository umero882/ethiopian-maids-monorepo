/**
 * ApproveMaidProfile Use Case (Command)
 *
 * Approves a maid profile (by agency or admin).
 */

import type { MaidProfileRepository } from '../ports/MaidProfileRepository.js';
import type { EventBus, AuditLogger } from './CreateMaidProfile.js';

export interface ApproveMaidProfileCommand {
  profileId: string;
  approvedBy: string;
  approverRole: 'admin' | 'agency';
}

export interface ApproveMaidProfileResult {
  profile: Record<string, any>;
}

export interface ApproveMaidProfileDependencies {
  maidProfileRepository: MaidProfileRepository;
  eventBus: EventBus;
  auditLogger: AuditLogger;
}

export class ApproveMaidProfile {
  private maidProfileRepository: MaidProfileRepository;
  private eventBus: EventBus;
  private auditLogger: AuditLogger;

  constructor({ maidProfileRepository, eventBus, auditLogger }: ApproveMaidProfileDependencies) {
    this.maidProfileRepository = maidProfileRepository;
    this.eventBus = eventBus;
    this.auditLogger = auditLogger;
  }

  /**
   * Execute the use case
   */
  async execute(command: ApproveMaidProfileCommand): Promise<ApproveMaidProfileResult> {
    // 1. Validate command
    if (!command.profileId) {
      throw new Error('profileId is required');
    }
    if (!command.approvedBy) {
      throw new Error('approvedBy is required');
    }
    if (!command.approverRole) {
      throw new Error('approverRole is required');
    }

    // 2. Check authorization
    const allowedRoles: string[] = ['admin', 'agency'];
    if (!allowedRoles.includes(command.approverRole)) {
      throw new Error('Unauthorized to approve profiles');
    }

    // 3. Load profile
    const profile = await this.maidProfileRepository.findById(command.profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // 4. Approve profile
    profile.approve(command.approvedBy);

    // 5. Persist changes
    await this.maidProfileRepository.save(profile);

    // 6. Publish domain events
    const events = profile.pullDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    // 7. Log audit event
    await this.auditLogger.logSecurityEvent({
      action: 'MAID_PROFILE_APPROVED',
      userId: profile.userId,
      profileId: profile.id,
      metadata: {
        approvedBy: command.approvedBy,
        approverRole: command.approverRole,
      },
    });

    // 8. Return result
    return {
      profile: profile.toJSON(),
    };
  }
}
