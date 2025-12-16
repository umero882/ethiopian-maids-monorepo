/**
 * Domain Events for Identity Context
 *
 * Events are emitted by aggregates and consumed by other bounded contexts.
 */

export const DomainEvents = {
  UserRegistered: 'UserRegistered',
  UserEmailVerified: 'UserEmailVerified',
  UserPhoneVerified: 'UserPhoneVerified',
  UserSuspended: 'UserSuspended',
  UserReactivated: 'UserReactivated',
  UserDeleted: 'UserDeleted',
  PasswordChanged: 'PasswordChanged',
  LoginAttempted: 'LoginAttempted',
  LoginSucceeded: 'LoginSucceeded',
  LoginFailed: 'LoginFailed',
} as const;

export type DomainEventType = typeof DomainEvents[keyof typeof DomainEvents];

export interface DomainEventMetadata {
  occurredAt: string;
  [key: string]: unknown;
}

export interface DomainEventBase<T = unknown> {
  type: DomainEventType | string;
  payload: T;
  metadata: DomainEventMetadata;
}

export function createDomainEvent<T = unknown>(
  type: DomainEventType | string,
  payload: T,
  metadata: Partial<DomainEventMetadata> = {}
): DomainEventBase<T> {
  return {
    type,
    payload,
    metadata: {
      occurredAt: new Date().toISOString(),
      ...metadata,
    },
  };
}
