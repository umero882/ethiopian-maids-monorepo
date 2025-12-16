/**
 * Communications Domain Module - Public API
 *
 * Exports all public domain objects for the Communications bounded context.
 */

// Entities
export * from './entities/index.js';

// Repositories (Interfaces)
export * from './repositories/index.js';

// DTOs
export * from './dtos/MessageDTOs.js';
export * from './dtos/NotificationDTOs.js';

// Use Cases
export * from './use-cases/index.js';
