/**
 * Jobs Use Cases
 *
 * These represent all the operations that can be performed on jobs and applications.
 * Each use case is a single business operation with clear input and output.
 */

// Job Posting Use Cases
export { CreateJobPostingUseCase } from './CreateJobPosting.js';
export { UpdateJobDetailsUseCase } from './UpdateJobDetails.js';
export { GetJobPostingUseCase } from './GetJobPosting.js';
export type { GetJobPostingRequest } from './GetJobPosting.js';
export { SearchJobPostingsUseCase } from './SearchJobPostings.js';
export { PublishJobPostingUseCase } from './PublishJobPosting.js';
export { CloseJobPostingUseCase } from './CloseJobPosting.js';
export { DeleteJobPostingUseCase } from './DeleteJobPosting.js';

// Job Application Use Cases
export { SubmitJobApplicationUseCase } from './SubmitJobApplication.js';
export { WithdrawJobApplicationUseCase } from './WithdrawJobApplication.js';
export { ReviewJobApplicationUseCase } from './ReviewJobApplication.js';
export { ShortlistJobApplicationUseCase } from './ShortlistJobApplication.js';
export { RejectJobApplicationUseCase } from './RejectJobApplication.js';
export { AcceptJobApplicationUseCase } from './AcceptJobApplication.js';
export { GetApplicationsByJobUseCase } from './GetApplicationsByJob.js';
export { GetApplicationsByMaidUseCase } from './GetApplicationsByMaid.js';
