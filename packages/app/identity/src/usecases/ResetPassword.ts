/**
 * ResetPassword Use Case
 *
 * Completes a password reset using a valid reset token.
 * CQRS Command handler.
 */

import { IdentityPolicies } from '@ethio/domain-identity';
import { UserRepository } from '../ports/UserRepository.js';
import { PasswordResetRepository } from '../ports/PasswordResetRepository.js';
import { AuthenticationService } from '../ports/AuthenticationService.js';
import { AuditLogger } from '../ports/AuditLogger.js';
import { EventBus } from '../ports/EventBus.js';

export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
  metadata?: {
    ip?: string;
    [key: string]: unknown;
  };
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

export interface ResetPasswordDependencies {
  userRepository: UserRepository;
  passwordResetRepository: PasswordResetRepository;
  authService: AuthenticationService;
  auditLogger: AuditLogger;
  eventBus: EventBus;
}

export class ResetPassword {
  constructor(private readonly deps: ResetPasswordDependencies) {}

  async execute(command: ResetPasswordCommand): Promise<ResetPasswordResult> {
    const { token, newPassword, metadata = {} } = command;

    try {
      // Validate new password strength
      if (!IdentityPolicies.isPasswordStrong(newPassword)) {
        throw new Error(
          'Password must be at least 8 characters with uppercase, lowercase, digit, and special character'
        );
      }

      // Find password reset by token
      const passwordReset =
        await this.deps.passwordResetRepository.findByToken(token);
      if (!passwordReset) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if reset is valid
      if (!passwordReset.isValid()) {
        throw new Error(`Reset token is ${passwordReset.status}`);
      }

      // Get user
      const user = await this.deps.userRepository.findById(passwordReset.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is active
      if (!user.isActive()) {
        throw new Error('Cannot reset password for inactive account');
      }

      // Update password via auth service
      await this.deps.authService.updatePassword({
        userId: user.id,
        newPassword,
      });

      // Mark reset as used
      passwordReset.markAsUsed();
      await this.deps.passwordResetRepository.save(passwordReset);

      // Pull and publish domain events
      const resetEvents = passwordReset.pullDomainEvents();
      for (const event of resetEvents) {
        await this.deps.eventBus.publish(event);
      }

      // Publish password changed event
      await this.deps.eventBus.publish({
        type: 'PasswordChanged',
        payload: {
          userId: user.id,
          email: user.email,
          via: 'reset_token',
        },
        occurredAt: new Date(),
      });

      // Revoke all existing sessions for security
      await this.deps.authService.revokeAllSessions({ userId: user.id });

      // Audit log
      await this.deps.auditLogger.logSecurityEvent({
        action: 'PASSWORD_RESET_COMPLETED',
        userId: user.id,
        resource: 'password_reset',
        result: 'success',
        metadata: {
          email: user.email,
          resetId: passwordReset.id,
          ip: metadata.ip,
        },
      });

      return {
        success: true,
        message: 'Password successfully reset. Please sign in with your new password.',
      };
    } catch (error) {
      // Audit failed attempt
      await this.deps.auditLogger.logSecurityEvent({
        action: 'PASSWORD_RESET_FAILED',
        resource: 'password_reset',
        result: 'failure',
        metadata: {
          token: token ? token.substring(0, 8) + '...' : 'null',
          reason: error instanceof Error ? error.message : 'Unknown error',
          ip: metadata.ip,
        },
      });

      throw error;
    }
  }
}
