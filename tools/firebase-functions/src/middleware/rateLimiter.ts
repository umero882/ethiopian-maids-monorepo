import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

/**
 * Firestore-based IP rate limiter for Firebase Cloud Functions.
 * Algorithm: Sliding window — MAX_REQUESTS per WINDOW_MS per IP.
 * Violation:  IP blocked for BLOCK_DURATION_MS.
 */

const RATE_LIMIT_COLLECTION = 'rate_limits';
const MAX_REQUESTS = 100;
const WINDOW_MS = 15 * 60 * 1000;         // 15 minutes
const BLOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitDoc {
  ip: string;
  count: number;
  window_start: FirebaseFirestore.Timestamp;
  blocked_until?: FirebaseFirestore.Timestamp;
  last_request: FirebaseFirestore.Timestamp;
}

/** Extract real client IP, respecting X-Forwarded-For. */
export function getClientIp(req: functions.https.Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) {
    const raw = Array.isArray(fwd) ? fwd[0] : fwd;
    return raw.split(',').shift()?.trim() ?? 'unknown';
  }
  return req.ip ?? 'unknown';
}

/**
 * Check and enforce rate limit for a given IP.
 * Runs inside a Firestore transaction for atomicity.
 */
export async function checkRateLimit(ip: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  blocked: boolean;
}> {
  const db = admin.firestore();
  const docId = ip.replace(/[.\/]/g, '_');
  const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(docId);
  const now = Date.now();
  const nowTs = admin.firestore.Timestamp.fromMillis(now);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);

    if (!snap.exists) {
      tx.set(docRef, { ip, count: 1, window_start: nowTs, last_request: nowTs } as RateLimitDoc);
      return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: new Date(now + WINDOW_MS), blocked: false };
    }

    const data = snap.data() as RateLimitDoc;

    // Check if currently blocked
    if (data.blocked_until) {
      const blockedMs = data.blocked_until.toMillis();
      if (now < blockedMs) {
        return { allowed: false, remaining: 0, resetAt: new Date(blockedMs), blocked: true };
      }
    }

    const windowStartMs = data.window_start.toMillis();

    // Window expired — reset counter
    if (now - windowStartMs > WINDOW_MS) {
      tx.update(docRef, {
        count: 1,
        window_start: nowTs,
        last_request: nowTs,
        blocked_until: admin.firestore.FieldValue.delete(),
      });
      return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: new Date(now + WINDOW_MS), blocked: false };
    }

    const newCount = data.count + 1;

    if (newCount > MAX_REQUESTS) {
      const blockedUntil = admin.firestore.Timestamp.fromMillis(now + BLOCK_DURATION_MS);
      tx.update(docRef, { count: newCount, last_request: nowTs, blocked_until: blockedUntil });
      return { allowed: false, remaining: 0, resetAt: new Date(now + BLOCK_DURATION_MS), blocked: true };
    }

    tx.update(docRef, { count: newCount, last_request: nowTs });
    return { allowed: true, remaining: MAX_REQUESTS - newCount, resetAt: new Date(windowStartMs + WINDOW_MS), blocked: false };
  });
}

/**
 * Express-style middleware for Firebase HTTPS onRequest functions.
 */
export async function rateLimiterMiddleware(
  req: functions.https.Request,
  res: functions.Response
): Promise<void> {
  const ip = getClientIp(req);
  try {
    const result = await checkRateLimit(ip);
    res.set('X-RateLimit-Limit', String(MAX_REQUESTS));
    res.set('X-RateLimit-Remaining', String(result.remaining));
    res.set('X-RateLimit-Reset', result.resetAt.toISOString());
    if (!result.allowed) {
      res.status(429).json({
        error: 'rate_limit_exceeded',
        message: result.blocked
          ? `IP blocked until ${result.resetAt.toISOString()}.`
          : 'Rate limit exceeded. Please slow down.',
        retry_after: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
      });
    }
  } catch (err) {
    // Fail open — never block legitimate traffic due to rate limiter errors
    console.error('rateLimiterMiddleware error (failing open):', err);
  }
}

/** Cleanup stale rate-limit docs older than 24h. */
export async function cleanupRateLimits(): Promise<number> {
  const db = admin.firestore();
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
  const stale = await db.collection(RATE_LIMIT_COLLECTION).where('last_request', '<', cutoff).get();
  const batch = db.batch();
  stale.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`cleanupRateLimits: removed ${stale.size} stale docs`);
  return stale.size;
}
