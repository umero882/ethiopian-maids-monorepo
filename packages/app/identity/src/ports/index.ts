export {
  UserRepository,
  type PaginationOptions,
  type FindByRoleResult,
} from './UserRepository.js';
export {
  AuthenticationService,
  type RegisterCredentials,
  type SignInCredentials,
  type SessionData,
  type AuthResult,
  type UpdatePasswordParams,
  type SignOutParams,
  type RevokeAllSessionsParams,
} from './AuthenticationService.js';
export {
  AuditLogger,
  type SecurityEvent,
  type AuthAttempt,
  type PIIAccess,
} from './AuditLogger.js';
export {
  EmailService,
  type PasswordResetEmailParams,
  type EmailVerificationParams,
  type WelcomeEmailParams,
  type SecurityAlertEmailParams,
} from './EmailService.js';
export { PasswordResetRepository } from './PasswordResetRepository.js';
export { EventBus } from './EventBus.js';
