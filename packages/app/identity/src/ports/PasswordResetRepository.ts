/**
 * PasswordResetRepository Port
 *
 * Interface for password reset persistence.
 * Implementation will be provided by infrastructure layer.
 */

import { PasswordReset } from '@ethio/domain-identity';

export abstract class PasswordResetRepository {
  /**
   * Save or update a password reset
   * @param passwordReset - Password reset entity
   * @returns Promise<void>
   */
  abstract save(passwordReset: PasswordReset): Promise<void>;

  /**
   * Find password reset by token
   * @param token - Reset token
   * @returns Promise<PasswordReset | null>
   */
  abstract findByToken(token: string): Promise<PasswordReset | null>;

  /**
   * Find password reset by ID
   * @param id - Reset ID
   * @returns Promise<PasswordReset | null>
   */
  abstract findById(id: string): Promise<PasswordReset | null>;

  /**
   * Find all pending resets for a user
   * @param userId - User ID
   * @returns Promise<PasswordReset[]>
   */
  abstract findPendingByUserId(userId: string): Promise<PasswordReset[]>;

  /**
   * Cancel all pending resets for a user
   * @param userId - User ID
   * @returns Promise<void>
   */
  abstract cancelPendingResets(userId: string): Promise<void>;

  /**
   * Delete expired resets (cleanup)
   * @returns Promise<number> Number of deleted resets
   */
  abstract deleteExpired(): Promise<number>;
}
