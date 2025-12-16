/**
 * AuditLogger Port (Interface)
 *
 * Defines the contract for audit logging.
 */

export interface SecurityEvent {
  action: string;
  userId?: string;
  resource: string;
  result: string;
  metadata?: Record<string, unknown>;
}

export interface AuthAttempt {
  userId?: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
}

export interface PIIAccess {
  userId: string;
  accessor: string;
  field: string;
  reason: string;
}

export abstract class AuditLogger {
  /**
   * Log security event
   * @param event - { action, userId, resource, result, metadata }
   * @returns Promise<void>
   */
  abstract logSecurityEvent(event: SecurityEvent): Promise<void>;

  /**
   * Log authentication attempt
   * @param attempt - { userId, success, ip, userAgent }
   * @returns Promise<void>
   */
  abstract logAuthAttempt(attempt: AuthAttempt): Promise<void>;

  /**
   * Log PII access
   * @param access - { userId, accessor, field, reason }
   * @returns Promise<void>
   */
  abstract logPIIAccess(access: PIIAccess): Promise<void>;
}
