/**
 * Profile Domain Events
 *
 * All events that can occur within the Profiles bounded context.
 */

export const ProfileDomainEvents = {
  // Maid Profile Events
  MaidProfileCreated: 'MaidProfileCreated',
  MaidProfileUpdated: 'MaidProfileUpdated',
  MaidProfileSubmitted: 'MaidProfileSubmitted',
  MaidProfileApproved: 'MaidProfileApproved',
  MaidProfileRejected: 'MaidProfileRejected',
  MaidProfileArchived: 'MaidProfileArchived',
  WorkExperienceAdded: 'WorkExperienceAdded',
  MaidSkillsUpdated: 'MaidSkillsUpdated',
  DocumentUploaded: 'DocumentUploaded',

  // Sponsor Profile Events
  SponsorProfileCreated: 'SponsorProfileCreated',
  SponsorProfileUpdated: 'SponsorProfileUpdated',
  SponsorProfileSubmitted: 'SponsorProfileSubmitted',
  SponsorProfileVerified: 'SponsorProfileVerified',
  SponsorProfileRejected: 'SponsorProfileRejected',
  SponsorProfileArchived: 'SponsorProfileArchived',
  SponsorHouseholdInfoUpdated: 'SponsorHouseholdInfoUpdated',
  SponsorPreferencesUpdated: 'SponsorPreferencesUpdated',
  SponsorDocumentUploaded: 'SponsorDocumentUploaded',
} as const;

export type ProfileDomainEventType = typeof ProfileDomainEvents[keyof typeof ProfileDomainEvents];

export interface ProfileEvent {
  type: ProfileDomainEventType;
  payload: Record<string, any>;
  aggregateId: string;
  occurredAt: Date;
  contextName: string;
}

/**
 * Event factory for creating standardized events
 */
export function createProfileEvent(
  type: ProfileDomainEventType,
  payload: Record<string, any>,
  aggregateId: string
): ProfileEvent {
  return {
    type,
    payload,
    aggregateId,
    occurredAt: new Date(),
    contextName: 'profiles',
  };
}
