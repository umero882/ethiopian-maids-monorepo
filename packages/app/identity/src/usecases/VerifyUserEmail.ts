/**
 * VerifyUserEmail Use Case
 *
 * Mark user email as verified after confirmation.
 */

import { UserRepository } from '../ports/UserRepository.js';
import { AuthenticationService } from '../ports/AuthenticationService.js';
import { EventBus } from '../ports/EventBus.js';

export interface VerifyUserEmailCommand {
  userId: string;
  verificationCode: string;
}

export interface VerifyUserEmailResult {
  success: boolean;
  userId: string;
  emailVerified: boolean;
}

export interface VerifyUserEmailDependencies {
  userRepository: UserRepository;
  authService: AuthenticationService;
  eventBus: EventBus;
}

export class VerifyUserEmail {
  constructor(private readonly deps: VerifyUserEmailDependencies) {}

  async execute(command: VerifyUserEmailCommand): Promise<VerifyUserEmailResult> {
    const { userId, verificationCode } = command;

    // Verify code with auth provider
    const verified = await this.deps.authService.verifyEmail(verificationCode);
    if (!verified) {
      throw new Error('Invalid or expired verification code');
    }

    // Get user entity
    const user = await this.deps.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Apply domain logic
    user.verifyEmail();

    // Persist
    await this.deps.userRepository.save(user);

    // Publish events
    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.deps.eventBus.publish(event);
    }

    return {
      success: true,
      userId: user.id,
      emailVerified: user.emailVerified,
    };
  }
}
