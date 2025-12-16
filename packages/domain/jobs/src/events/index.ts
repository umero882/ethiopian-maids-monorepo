/**
 * Jobs Domain Events
 *
 * All events that can occur within the Jobs bounded context.
 */

export const JobDomainEvents = {
  // Job Posting Events
  JobPostingCreated: 'JobPostingCreated',
  JobPostingUpdated: 'JobPostingUpdated',
  JobCompensationUpdated: 'JobCompensationUpdated',
  JobPostingPublished: 'JobPostingPublished',
  JobPostingClosed: 'JobPostingClosed',
  JobPostingFilled: 'JobPostingFilled',
  JobPostingCancelled: 'JobPostingCancelled',
  JobPostingExpired: 'JobPostingExpired',

  // Job Application Events
  ApplicationSubmitted: 'ApplicationSubmitted',
  ApplicationUpdated: 'ApplicationUpdated',
  ApplicationReviewed: 'ApplicationReviewed',
  InterviewScheduled: 'InterviewScheduled',
  InterviewCompleted: 'InterviewCompleted',
  ApplicationAccepted: 'ApplicationAccepted',
  ApplicationRejected: 'ApplicationRejected',
  ApplicationWithdrawn: 'ApplicationWithdrawn',
} as const;

export type JobDomainEventType = typeof JobDomainEvents[keyof typeof JobDomainEvents];

export interface JobEvent {
  type: JobDomainEventType | string;
  payload: Record<string, unknown>;
  aggregateId: string;
  occurredAt: Date;
  contextName: string;
}

/**
 * Event factory for creating standardized events
 */
export function createJobEvent(
  type: JobDomainEventType | string,
  payload: Record<string, unknown>,
  aggregateId: string
): JobEvent {
  return {
    type,
    payload,
    aggregateId,
    occurredAt: new Date(),
    contextName: 'jobs',
  };
}
