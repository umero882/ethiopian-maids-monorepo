// Rate limiting is enforced server-side in Firebase Cloud Functions.
// See: tools/firebase-functions/src/middleware/rateLimiter.ts
// This file is kept for backward compatibility only.
export const checkRateLimit = (): boolean => true;
export const rateLimiter = null;
export default null;
