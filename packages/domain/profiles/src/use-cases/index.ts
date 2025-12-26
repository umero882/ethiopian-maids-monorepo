/**
 * Profile Use Cases
 *
 * These represent all the operations that can be performed on profiles.
 * Each use case is a single business operation with clear input and output.
 */

// Maid Profile Use Cases
export { CreateMaidProfileUseCase } from './CreateMaidProfile.js';
export { UpdateMaidProfileUseCase } from './UpdateMaidProfile.js';
export { GetMaidProfileUseCase } from './GetMaidProfile.js';
export type { GetMaidProfileRequest } from './GetMaidProfile.js';
export { SearchMaidProfilesUseCase } from './SearchMaidProfiles.js';
export { SubmitMaidProfileForReviewUseCase } from './SubmitMaidProfileForReview.js';
export { ApproveMaidProfileUseCase } from './ApproveMaidProfile.js';
export { RejectMaidProfileUseCase } from './RejectMaidProfile.js';
export { ArchiveMaidProfileUseCase } from './ArchiveMaidProfile.js';
export { UpdateMaidWorkInfoUseCase } from './UpdateMaidWorkInfo.js';
export { UploadMaidDocumentUseCase } from './UploadMaidDocument.js';
export { DeleteMaidProfileUseCase } from './DeleteMaidProfile.js';
export type { DeleteMaidProfileRequest } from './DeleteMaidProfile.js';

// Sponsor Profile Use Cases
export { CreateSponsorProfileUseCase } from './CreateSponsorProfile.js';
export { UpdateSponsorProfileUseCase } from './UpdateSponsorProfile.js';
export { GetSponsorProfileUseCase } from './GetSponsorProfile.js';
export type { GetSponsorProfileRequest } from './GetSponsorProfile.js';
export { AddFavoriteMaidUseCase } from './AddFavoriteMaid.js';
export { RemoveFavoriteMaidUseCase } from './RemoveFavoriteMaid.js';

// Agency Profile Use Cases
export { CreateAgencyProfileUseCase } from './CreateAgencyProfile.js';
export { UpdateAgencyProfileUseCase } from './UpdateAgencyProfile.js';
export { GetAgencyProfileUseCase } from './GetAgencyProfile.js';
export type { GetAgencyProfileRequest } from './GetAgencyProfile.js';
export { GetAgencyStatisticsUseCase } from './GetAgencyStatistics.js';
