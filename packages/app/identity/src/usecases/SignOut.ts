/**
 * SignOut Use Case
 *
 * Signs out a user and revokes their session.
 * CQRS Command handler.
 */

import { AuthenticationService } from '../ports/AuthenticationService.js';
import { AuditLogger } from '../ports/AuditLogger.js';
import { EventBus } from '../ports/EventBus.js';

export interface SignOutCommand {
  userId: string;
  token: string;
  reason?: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
  };
}

export interface SignOutResult {
  success: boolean;
  message: string;
}

export interface SignOutDependencies {
  authService: AuthenticationService;
  auditLogger: AuditLogger;
  eventBus: EventBus;
}

export class SignOut {
  constructor(private readonly deps: SignOutDependencies) {}

  async execute(command: SignOutCommand): Promise<SignOutResult> {
    const { userId, token, reason = 'user_initiated', metadata = {} } = command;

    try {
      // Revoke session via auth service
      await this.deps.authService.signOut({ userId, token });

      // Publish domain event
      await this.deps.eventBus.publish({
        type: 'UserSignedOut',
        payload: {
          userId,
          reason,
          sessionId: this.extractSessionId(token),
        },
        occurredAt: new Date(),
      });

      // Audit log
      await this.deps.auditLogger.logSecurityEvent({
        action: 'USER_SIGNED_OUT',
        userId,
        resource: 'authentication',
        result: 'success',
        metadata: {
          reason,
          ip: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });

      return {
        success: true,
        message: 'Successfully signed out',
      };
    } catch (error) {
      // Audit failed attempt
      await this.deps.auditLogger.logSecurityEvent({
        action: 'USER_SIGN_OUT_FAILED',
        userId,
        resource: 'authentication',
        result: 'failure',
        metadata: {
          reason: error instanceof Error ? error.message : 'Unknown error',
          ip: metadata.ip,
        },
      });

      throw error;
    }
  }

  /**
   * Extract session ID from token (if embedded)
   */
  private extractSessionId(token: string): string | null {
    // This is a placeholder - implement based on your token structure
    return token ? `session_from_${token.substring(0, 10)}` : null;
  }
}
