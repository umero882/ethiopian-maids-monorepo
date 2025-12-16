/**
 * UserRepository Port (Interface)
 *
 * Defines the contract for user data persistence.
 * Implementations live in infrastructure layer (adapters).
 */

import { User } from '@ethio/domain-identity';

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface FindByRoleResult {
  users: User[];
  total: number;
}

export abstract class UserRepository {
  /**
   * Find user by ID
   * @param id - User ID
   * @returns Promise<User | null>
   */
  abstract findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   * @param email - User email
   * @returns Promise<User | null>
   */
  abstract findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by phone number
   * @param phoneNumber - Phone number
   * @returns Promise<User | null>
   */
  abstract findByPhoneNumber(phoneNumber: string): Promise<User | null>;

  /**
   * Save user (create or update)
   * @param user - User entity
   * @returns Promise<User>
   */
  abstract save(user: User): Promise<User>;

  /**
   * Delete user
   * @param id - User ID
   * @returns Promise<void>
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Check if email exists
   * @param email - Email to check
   * @returns Promise<boolean>
   */
  abstract emailExists(email: string): Promise<boolean>;

  /**
   * Get users by role
   * @param role - Role name
   * @param options - Pagination options
   * @returns Promise<FindByRoleResult>
   */
  abstract findByRole(
    role: string,
    options?: PaginationOptions
  ): Promise<FindByRoleResult>;
}
