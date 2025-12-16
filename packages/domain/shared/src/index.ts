/**
 * @ethio/domain-shared
 *
 * Shared types and utilities for all domain packages
 */

export { Result, ResultWithError } from './Result.js';
export {
  DomainError,
  NotFoundError,
  ValidationError,
  BusinessRuleViolationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InvalidOperationError,
} from './DomainError.js';
export { UseCase, VoidUseCase, NoInputUseCase } from './UseCase.js';
