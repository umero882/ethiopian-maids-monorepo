/**
 * EventBus Port (Interface)
 *
 * Defines the contract for publishing domain events.
 */

import { DomainEvent } from '@ethio/domain-identity';

export abstract class EventBus {
  /**
   * Publish a domain event
   * @param event - Domain event to publish
   * @returns Promise<void>
   */
  abstract publish(event: DomainEvent): Promise<void>;
}
