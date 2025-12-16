/**
 * Entities - Profiles Domain
 *
 * Exports all entities for the Profiles bounded context.
 */

export {
  MaidProfile,
  type MaidProfileProps,
  type BasicInfoUpdate,
  type DomainEvent
} from './MaidProfile.js';
export {
  SponsorProfile,
  type SponsorProfileProps,
  type SponsorBasicInfoUpdate,
  type SponsorHouseholdInfoUpdate,
  type SponsorPreferencesUpdate
} from './SponsorProfile.js';
export {
  AgencyProfile,
  type AgencyProfileProps,
  type AgencyBasicInfoUpdate,
  type AgencyLicenseInfoUpdate,
  type AgencyBusinessInfoUpdate
} from './AgencyProfile.js';
