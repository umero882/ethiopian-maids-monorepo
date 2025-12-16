/**
 * Use Cases - Public API
 */

// Commands
export {
  CreateJobPosting,
  type CreateJobPostingCommand,
  type CreateJobPostingResult,
  type CreateJobPostingDependencies,
  type EventBus,
  type AuditLogger,
} from './CreateJobPosting.js';

export {
  ApplyToJob,
  type ApplyToJobCommand,
  type ApplyToJobResult,
  type ApplyToJobDependencies,
  type MaidProfileForApplication,
  type MaidProfileRepository,
} from './ApplyToJob.js';

// Queries
export {
  SearchJobs,
  type SearchJobsQuery,
  type SearchJobsResult,
  type SearchJobsDependencies,
} from './SearchJobs.js';
