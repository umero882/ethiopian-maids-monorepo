/**
 * Domain Errors - Type-safe error handling
 *
 * Represents different types of errors that can occur in the domain layer.
 * Each error type has a specific meaning and can be handled differently.
 */

export abstract class DomainError extends Error {
  public readonly timestamp: Date;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Entity not found in repository
 */
export class NotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id '${id}' was not found`);
  }
}

/**
 * Validation failed on entity or value object
 */
export class ValidationError extends DomainError {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.errors = errors;
  }
}

/**
 * Business rule violation
 */
export class BusinessRuleViolationError extends DomainError {
  constructor(rule: string, message: string) {
    super(`Business rule '${rule}' violated: ${message}`);
  }
}

/**
 * Unauthorized access attempt
 */
export class UnauthorizedError extends DomainError {
  constructor(action: string) {
    super(`Unauthorized to perform action: ${action}`);
  }
}

/**
 * Forbidden action due to state or permissions
 */
export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Conflict with existing entity (e.g., duplicate)
 */
export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Invalid operation on entity
 */
export class InvalidOperationError extends DomainError {
  constructor(operation: string, reason: string) {
    super(`Invalid operation '${operation}': ${reason}`);
  }
}
