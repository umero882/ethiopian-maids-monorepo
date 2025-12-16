/**
 * Identity Infrastructure Module - Public API
 *
 * Exports infrastructure adapters for the Identity context.
 * Uses Firebase for authentication and Hasura/GraphQL for data persistence.
 */

// Firebase/Hasura Adapters (Primary)
export { FirebaseAuthService } from './FirebaseAuthService.js';
export { HasuraUserRepository } from './HasuraUserRepository.js';
export { HasuraAuditLogger } from './HasuraAuditLogger.js';
export { HasuraPasswordResetRepository } from './HasuraPasswordResetRepository.js';

// Email Service
export { SendGridEmailService } from './SendGridEmailService.js';
