/**
 * UseCase Interface - Base interface for all use cases
 *
 * Defines a standard contract for executing business operations.
 * All use cases should implement this interface.
 *
 * @example
 * ```typescript
 * export class CreateMaidProfileUseCase implements UseCase<CreateMaidProfileDTO, MaidProfile> {
 *   async execute(request: CreateMaidProfileDTO): Promise<Result<MaidProfile>> {
 *     // Implementation
 *   }
 * }
 * ```
 */

import { Result } from './Result.js';

export interface UseCase<TRequest, TResponse> {
  /**
   * Execute the use case
   * @param request - Input data for the use case
   * @returns Result containing the response or error
   */
  execute(request: TRequest): Promise<Result<TResponse>>;
}

/**
 * UseCase with no return value (for commands that don't return data)
 */
export interface VoidUseCase<TRequest> {
  execute(request: TRequest): Promise<Result<void>>;
}

/**
 * UseCase with no input (for queries that don't need parameters)
 */
export interface NoInputUseCase<TResponse> {
  execute(): Promise<Result<TResponse>>;
}
