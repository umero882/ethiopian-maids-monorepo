/**
 * SignIn Use Case
 *
 * Authenticates a user and creates a session.
 * CQRS Command handler.
 */

import { Session } from '@ethio/domain-identity';
import { UserRepository } from '../ports/UserRepository.js';
import { AuthenticationService } from '../ports/AuthenticationService.js';
import { AuditLogger } from '../ports/AuditLogger.js';
import { EventBus } from '../ports/EventBus.js';

export interface SignInCommand {
  email: string;
  password: string;
  metadata?: {
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
  };
}

export interface SignInResult {
  userId: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: number;
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    status: string;
  };
}

export interface SignInDependencies {
  userRepository: UserRepository;
  authService: AuthenticationService;
  auditLogger: AuditLogger;
  eventBus: EventBus;
}

export class SignIn {
  constructor(private readonly deps: SignInDependencies) {}

  async execute(command: SignInCommand): Promise<SignInResult> {
    const { email, password, metadata = {} } = command;

    try {
      // Authenticate via auth service
      const authResult = await this.deps.authService.signIn({ email, password });
      const { userId, session } = authResult;
      const { accessToken: token, refreshToken, expiresAt } = session;

      // Fetch user entity
      const user = await this.deps.userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found after authentication');
      }

      // Check if user is active
      if (!user.isActive()) {
        throw new Error(`User account is ${user.status}`);
      }

      // Create session entity
      const sessionEntity = new Session({
        id: this.generateSessionId(),
        userId: user.id,
        token: token || '',
        refreshToken: refreshToken || null,
        expiresAt: new Date(expiresAt || Date.now() + 3600000),
        ipAddress: metadata.ip || null,
        userAgent: metadata.userAgent || null,
        status: 'active',
      });

      // Pull and publish domain events
      const events = sessionEntity.pullDomainEvents();
      for (const event of events) {
        await this.deps.eventBus.publish(event);
      }

      // Audit log
      await this.deps.auditLogger.logSecurityEvent({
        action: 'USER_SIGNED_IN',
        userId: user.id,
        resource: 'authentication',
        result: 'success',
        metadata: {
          email: user.email,
          role: user.role.name,
          ip: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });

      return {
        userId: user.id,
        token,
        refreshToken,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          role: user.role.name,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          status: user.status,
        },
      };
    } catch (error) {
      // Audit failed attempt
      await this.deps.auditLogger.logSecurityEvent({
        action: 'USER_SIGN_IN_FAILED',
        resource: 'authentication',
        result: 'failure',
        metadata: {
          email,
          reason: error instanceof Error ? error.message : 'Unknown error',
          ip: metadata.ip,
          userAgent: metadata.userAgent,
        },
      });

      throw error;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}
