/**
 * GetUser Use Case
 *
 * Query user by ID with permission check.
 * CQRS Query handler.
 */

import { UserRepository } from '../ports/UserRepository.js';
import { AuditLogger } from '../ports/AuditLogger.js';

export interface GetUserQuery {
  userId: string;
  requestorId: string;
  requestorRole: string;
}

export interface GetUserResult {
  id: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUserDependencies {
  userRepository: UserRepository;
  auditLogger: AuditLogger;
}

export class GetUser {
  constructor(private readonly deps: GetUserDependencies) {}

  async execute(query: GetUserQuery): Promise<GetUserResult> {
    const { userId, requestorId, requestorRole } = query;

    // Permission check: users can only view their own profile unless admin
    if (userId !== requestorId && requestorRole !== 'admin') {
      throw new Error('Unauthorized: Cannot view other user profiles');
    }

    // Fetch user
    const user = await this.deps.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Audit PII access if viewing another user
    if (userId !== requestorId) {
      await this.deps.auditLogger.logPIIAccess({
        userId,
        accessor: requestorId,
        field: 'profile',
        reason: 'admin_view',
      });
    }

    // Map to DTO (Data Transfer Object)
    return {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      role: user.role.name,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
