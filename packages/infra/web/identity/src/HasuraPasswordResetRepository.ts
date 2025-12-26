/**
 * HasuraPasswordResetRepository
 *
 * Concrete implementation of PasswordResetRepository port using Hasura GraphQL.
 * Note: Firebase Auth handles password resets natively, but this repository
 * can be used for custom reset flows or tracking purposes.
 */

import { PasswordResetRepository } from '@ethio/app-identity';
import { PasswordReset } from '@ethio/domain-identity';
import { gql } from '@apollo/client';

// GraphQL Documents
const UPSERT_PASSWORD_RESET = gql`
  mutation UpsertPasswordReset($object: password_resets_insert_input!) {
    insert_password_resets_one(
      object: $object
      on_conflict: {
        constraint: password_resets_pkey
        update_columns: [status, used_at, updated_at]
      }
    ) {
      id
      user_id
      email
      token
      expires_at
      created_at
      used_at
      status
      ip_address
    }
  }
`;

const GET_PASSWORD_RESET_BY_TOKEN = gql`
  query GetPasswordResetByToken($token: String!) {
    password_resets(where: { token: { _eq: $token }, status: { _eq: "pending" } }, limit: 1) {
      id
      user_id
      email
      token
      expires_at
      created_at
      used_at
      status
      ip_address
    }
  }
`;

const GET_PASSWORD_RESET_BY_ID = gql`
  query GetPasswordResetById($id: uuid!) {
    password_resets_by_pk(id: $id) {
      id
      user_id
      email
      token
      expires_at
      created_at
      used_at
      status
      ip_address
    }
  }
`;

const GET_PENDING_RESETS_BY_USER = gql`
  query GetPendingResetsByUser($userId: String!) {
    password_resets(
      where: { user_id: { _eq: $userId }, status: { _eq: "pending" } }
      order_by: { created_at: desc }
    ) {
      id
      user_id
      email
      token
      expires_at
      created_at
      used_at
      status
      ip_address
    }
  }
`;

const CANCEL_PENDING_RESETS = gql`
  mutation CancelPendingResets($userId: String!, $updatedAt: timestamptz!) {
    update_password_resets(
      where: { user_id: { _eq: $userId }, status: { _eq: "pending" } }
      _set: { status: "cancelled", updated_at: $updatedAt }
    ) {
      affected_rows
    }
  }
`;

const DELETE_EXPIRED_RESETS = gql`
  mutation DeleteExpiredResets($now: timestamptz!) {
    delete_password_resets(where: { expires_at: { _lt: $now } }) {
      affected_rows
    }
  }
`;

interface HasuraPasswordResetRecord {
  id: string;
  user_id: string;
  email: string;
  token: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  status: string;
  ip_address: string | null;
}

export class HasuraPasswordResetRepository extends PasswordResetRepository {
  // Using 'any' type for Apollo Client 4 compatibility - proper typing requires generated types
  constructor(private readonly apolloClient: any) {
    super();
  }

  /**
   * Save or update password reset
   */
  async save(passwordReset: PasswordReset): Promise<void> {
    const record = this._mapToRecord(passwordReset);

    const { errors } = await this.apolloClient.mutate({
      mutation: UPSERT_PASSWORD_RESET,
      variables: { object: record },
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to save password reset: ${errors[0].message}`);
    }
  }

  /**
   * Find password reset by token
   */
  async findByToken(token: string): Promise<PasswordReset | null> {
    const { data, errors } = await this.apolloClient.query({
      query: GET_PASSWORD_RESET_BY_TOKEN,
      variables: { token },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to find password reset: ${errors[0].message}`);
    }

    if (!data?.password_resets || data.password_resets.length === 0) {
      return null;
    }

    return this._mapToEntity(data.password_resets[0]);
  }

  /**
   * Find password reset by ID
   */
  async findById(id: string): Promise<PasswordReset | null> {
    const { data, errors } = await this.apolloClient.query({
      query: GET_PASSWORD_RESET_BY_ID,
      variables: { id },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to find password reset: ${errors[0].message}`);
    }

    if (!data?.password_resets_by_pk) {
      return null;
    }

    return this._mapToEntity(data.password_resets_by_pk);
  }

  /**
   * Find all pending resets for a user
   */
  async findPendingByUserId(userId: string): Promise<PasswordReset[]> {
    const { data, errors } = await this.apolloClient.query({
      query: GET_PENDING_RESETS_BY_USER,
      variables: { userId },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to find pending resets: ${errors[0].message}`);
    }

    return (data?.password_resets || []).map((record: HasuraPasswordResetRecord) =>
      this._mapToEntity(record)
    );
  }

  /**
   * Cancel all pending resets for a user
   */
  async cancelPendingResets(userId: string): Promise<void> {
    const { errors } = await this.apolloClient.mutate({
      mutation: CANCEL_PENDING_RESETS,
      variables: {
        userId,
        updatedAt: new Date().toISOString(),
      },
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to cancel pending resets: ${errors[0].message}`);
    }
  }

  /**
   * Delete expired resets (cleanup)
   */
  async deleteExpired(): Promise<number> {
    const { data, errors } = await this.apolloClient.mutate({
      mutation: DELETE_EXPIRED_RESETS,
      variables: { now: new Date().toISOString() },
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to delete expired resets: ${errors[0].message}`);
    }

    return data?.delete_password_resets?.affected_rows || 0;
  }

  /**
   * Map database record to PasswordReset entity
   */
  private _mapToEntity(record: HasuraPasswordResetRecord): PasswordReset {
    return new PasswordReset({
      id: record.id,
      userId: record.user_id,
      email: record.email,
      token: record.token,
      expiresAt: new Date(record.expires_at),
      createdAt: new Date(record.created_at),
      usedAt: record.used_at ? new Date(record.used_at) : null,
      status: record.status as any,
      ipAddress: record.ip_address,
    });
  }

  /**
   * Map PasswordReset entity to database record
   */
  private _mapToRecord(passwordReset: PasswordReset): Partial<HasuraPasswordResetRecord> {
    return {
      id: passwordReset.id,
      user_id: passwordReset.userId,
      email: passwordReset.email,
      token: passwordReset.token,
      expires_at: passwordReset.expiresAt.toISOString(),
      created_at: passwordReset.createdAt.toISOString(),
      used_at: passwordReset.usedAt ? passwordReset.usedAt.toISOString() : null,
      status: passwordReset.status,
      ip_address: passwordReset.ipAddress,
    };
  }
}
