/**
 * Security Headers Middleware for Firebase Cloud Functions HTTP endpoints.
 *
 * Adds standard security headers (equivalent to Helmet defaults) to all
 * onRequest handlers. Callable functions (onCall) don't need this since
 * Firebase SDK handles their transport.
 */

import * as functions from 'firebase-functions';

type HttpHandler = (
  req: functions.https.Request,
  res: functions.Response
) => void | Promise<void>;

/**
 * Wraps an onRequest handler with security headers.
 *
 * Headers applied:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 0  (modern best practice — rely on CSP instead)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Strict-Transport-Security: max-age=31536000; includeSubDomains
 * - Content-Security-Policy: default-src 'none'
 * - Permissions-Policy: camera=(), microphone=(), geolocation=()
 * - X-DNS-Prefetch-Control: off
 * - X-Download-Options: noopen
 * - X-Permitted-Cross-Domain-Policies: none
 */
export function withSecurityHeaders(handler: HttpHandler): HttpHandler {
  return (req, res) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '0');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
    res.set('Content-Security-Policy', "default-src 'none'");
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.set('X-DNS-Prefetch-Control', 'off');
    res.set('X-Download-Options', 'noopen');
    res.set('X-Permitted-Cross-Domain-Policies', 'none');

    return handler(req, res);
  };
}
