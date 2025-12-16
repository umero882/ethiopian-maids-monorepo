/**
 * Use Cases - Application Layer
 *
 * Exports all use cases for the Profiles application layer.
 */

// Commands
export {
  CreateMaidProfile,
  type CreateMaidProfileCommand,
  type CreateMaidProfileResult,
  type CreateMaidProfileDependencies,
  type EventBus,
  type AuditLogger
} from './CreateMaidProfile.js';
export {
  UpdateMaidProfile,
  type UpdateMaidProfileCommand,
  type UpdateMaidProfileResult,
  type UpdateMaidProfileDependencies
} from './UpdateMaidProfile.js';
export {
  SubmitMaidProfileForReview,
  type SubmitMaidProfileForReviewCommand,
  type SubmitMaidProfileForReviewResult,
  type SubmitMaidProfileForReviewDependencies
} from './SubmitMaidProfileForReview.js';
export {
  ApproveMaidProfile,
  type ApproveMaidProfileCommand,
  type ApproveMaidProfileResult,
  type ApproveMaidProfileDependencies
} from './ApproveMaidProfile.js';

// Queries
export {
  GetMaidProfile,
  type GetMaidProfileQuery,
  type GetMaidProfileResult,
  type GetMaidProfileDependencies
} from './GetMaidProfile.js';
export {
  SearchMaidProfiles,
  type SearchMaidProfilesQuery,
  type SearchMaidProfilesResult,
  type SearchMaidProfilesDependencies
} from './SearchMaidProfiles.js';
