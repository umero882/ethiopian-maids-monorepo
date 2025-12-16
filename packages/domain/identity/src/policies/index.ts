/**
 * Domain Policies for Identity Context
 *
 * Business rules that govern identity operations.
 */

import { User } from '../entities/User.js';
import { RoleName } from '../value-objects/UserRole.js';

export const IdentityPolicies = {
  /**
   * Password strength policy
   */
  isPasswordStrong(password: string): boolean {
    if (!password || password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false; // uppercase
    if (!/[a-z]/.test(password)) return false; // lowercase
    if (!/[0-9]/.test(password)) return false; // digit
    if (!/[^A-Za-z0-9]/.test(password)) return false; // special char
    return true;
  },

  /**
   * Email format policy
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Phone number format policy (international)
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // E.164 format: +[country code][number]
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  },

  /**
   * Can user change role?
   */
  canChangeRole(
    currentRole: RoleName,
    newRole: RoleName,
    requestorRole: RoleName
  ): boolean {
    // Only admins can change roles
    if (requestorRole !== 'admin') return false;
    // Cannot change to/from admin unless already admin
    if (newRole === 'admin' && requestorRole !== 'admin') return false;
    return true;
  },

  /**
   * Is user eligible for verification?
   */
  isEligibleForVerification(user: User): boolean {
    return user.isActive() && !user.isVerified();
  },
};
