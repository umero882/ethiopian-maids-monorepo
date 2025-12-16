/**
 * Input Validators for Identity Use Cases
 *
 * Validates command/query inputs before execution.
 */

import { IdentityPolicies } from '@ethio/domain-identity';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: ValidationErrorDetail[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface RegisterUserInput {
  email?: string;
  password?: string;
  role?: string;
}

export const RegisterUserValidator = {
  validate(command: RegisterUserInput): boolean {
    const errors: ValidationErrorDetail[] = [];

    if (!command.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    } else if (!IdentityPolicies.isValidEmail(command.email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }

    if (!command.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (!IdentityPolicies.isPasswordStrong(command.password)) {
      errors.push({
        field: 'password',
        message: 'Password does not meet strength requirements',
      });
    }

    if (!command.role) {
      errors.push({ field: 'role', message: 'Role is required' });
    } else if (!['maid', 'sponsor', 'agency'].includes(command.role)) {
      errors.push({ field: 'role', message: 'Invalid role' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    return true;
  },
};
