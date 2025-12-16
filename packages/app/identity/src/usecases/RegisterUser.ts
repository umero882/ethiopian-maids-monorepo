/**
 * RegisterUser Use Case
 *
 * Handles user registration with validation and audit.
 * CQRS Command handler.
 */

import { User, UserRole, IdentityPolicies } from '@ethio/domain-identity';
import { UserRepository } from '../ports/UserRepository.js';
import { AuthenticationService, AuthResult } from '../ports/AuthenticationService.js';
import { AuditLogger } from '../ports/AuditLogger.js';
import { EventBus } from '../ports/EventBus.js';

export interface RegisterUserCommand {
  email: string;
  password: string;
  role: string;
  metadata?: Record<string, unknown>;
}

export interface RegisterUserResult {
  userId: string;
  session: AuthResult['session'];
  user: {
    id: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
}

export interface RegisterUserDependencies {
  userRepository: UserRepository;
  authService: AuthenticationService;
  auditLogger: AuditLogger;
  eventBus: EventBus;
}

export class RegisterUser {
  constructor(private readonly deps: RegisterUserDependencies) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    const { email, password, role, metadata = {} } = command;

    // Validate inputs
    if (!IdentityPolicies.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!IdentityPolicies.isPasswordStrong(password)) {
      throw new Error(
        'Password must be at least 8 characters with uppercase, lowercase, digit, and special character'
      );
    }

    // Check if email already exists
    const emailExists = await this.deps.userRepository.emailExists(email);
    if (emailExists) {
      throw new Error('Email already registered');
    }

    // Register with auth provider
    const { userId, session } = await this.deps.authService.register({
      email,
      password,
      role,
    });

    // Create domain entity
    const userRole = UserRole.fromString(role);
    const user = new User({
      id: userId,
      email,
      role: userRole,
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
    });

    // Persist user
    await this.deps.userRepository.save(user);

    // Pull and publish domain events
    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.deps.eventBus.publish(event);
    }

    // Audit log
    await this.deps.auditLogger.logSecurityEvent({
      action: 'USER_REGISTERED',
      userId,
      resource: 'users',
      result: 'success',
      metadata: {
        email,
        role,
        ...metadata,
      },
    });

    return {
      userId,
      session,
      user: {
        id: user.id,
        email: user.email,
        role: user.role.name,
        emailVerified: user.emailVerified,
      },
    };
  }
}
