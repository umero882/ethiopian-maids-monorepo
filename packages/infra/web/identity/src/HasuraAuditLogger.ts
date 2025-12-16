/**
 * HasuraAuditLogger - Implements AuditLogger port
 *
 * Logs audit events to Hasura database tables.
 */

import { AuditLogger, SecurityEvent, AuthAttempt, PIIAccess } from '@ethio/app-identity';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL Documents
const INSERT_SECURITY_AUDIT_LOG = gql`
  mutation InsertSecurityAuditLog($object: security_audit_log_insert_input!) {
    insert_security_audit_log_one(object: $object) {
      id
    }
  }
`;

const INSERT_ACTIVITY_LOG = gql`
  mutation InsertActivityLog($object: activity_log_insert_input!) {
    insert_activity_log_one(object: $object) {
      id
    }
  }
`;

const INSERT_PII_ACCESS_LOG = gql`
  mutation InsertPIIAccessLog($object: pii_access_log_insert_input!) {
    insert_pii_access_log_one(object: $object) {
      id
    }
  }
`;

export class HasuraAuditLogger extends AuditLogger {
  constructor(private readonly apolloClient: ApolloClient<NormalizedCacheObject>) {
    super();
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const { action, userId, resource, result, metadata = {} } = event;

    try {
      await this.apolloClient.mutate({
        mutation: INSERT_SECURITY_AUDIT_LOG,
        variables: {
          object: {
            user_id: userId,
            action,
            resource,
            result,
            metadata,
            ip_address: metadata.ip,
            user_agent: metadata.userAgent,
            created_at: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
      // Don't throw - logging failure shouldn't break the flow
    }
  }

  /**
   * Log authentication attempt
   */
  async logAuthAttempt(attempt: AuthAttempt): Promise<void> {
    const { userId, success, ip, userAgent } = attempt;

    try {
      await this.apolloClient.mutate({
        mutation: INSERT_ACTIVITY_LOG,
        variables: {
          object: {
            user_id: userId,
            action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
            metadata: {
              ip,
              userAgent,
              timestamp: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }

  /**
   * Log PII access
   */
  async logPIIAccess(access: PIIAccess): Promise<void> {
    const { userId, accessor, field, reason } = access;

    try {
      await this.apolloClient.mutate({
        mutation: INSERT_PII_ACCESS_LOG,
        variables: {
          object: {
            user_id: userId,
            accessor_id: accessor,
            field_accessed: field,
            access_reason: reason,
            created_at: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Failed to log PII access:', error);
    }
  }
}
