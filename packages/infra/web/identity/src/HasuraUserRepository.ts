/**
 * HasuraUserRepository - Implements UserRepository port
 *
 * Adapter for Hasura GraphQL database operations, replacing Supabase.
 */

import { UserRepository, FindByRoleResult, PaginationOptions } from '@ethio/app-identity';
import { User, UserRole } from '@ethio/domain-identity';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';
import { gql } from '@apollo/client';

// GraphQL Documents
const GET_USER_BY_ID = gql`
  query GetUserById($id: String!) {
    profiles_by_pk(id: $id) {
      id
      email
      user_type
      phone
      registration_complete
      is_active
      created_at
      updated_at
    }
  }
`;

const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
      user_type
      phone
      registration_complete
      is_active
      created_at
      updated_at
    }
  }
`;

const GET_USER_BY_PHONE = gql`
  query GetUserByPhone($phone: String!) {
    profiles(where: { phone: { _eq: $phone } }, limit: 1) {
      id
      email
      user_type
      phone
      registration_complete
      is_active
      created_at
      updated_at
    }
  }
`;

const UPSERT_USER = gql`
  mutation UpsertUser($object: profiles_insert_input!, $update_columns: [profiles_update_column!]!) {
    insert_profiles_one(
      object: $object
      on_conflict: {
        constraint: profiles_pkey
        update_columns: $update_columns
      }
    ) {
      id
      email
      user_type
      phone
      registration_complete
      is_active
      created_at
      updated_at
    }
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: String!, $data: profiles_set_input!) {
    update_profiles_by_pk(pk_columns: { id: $id }, _set: $data) {
      id
      email
      user_type
      phone
      registration_complete
      is_active
      created_at
      updated_at
    }
  }
`;

const CHECK_EMAIL_EXISTS = gql`
  query CheckEmailExists($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
    }
  }
`;

const GET_USERS_BY_ROLE = gql`
  query GetUsersByRole($role: String!, $limit: Int!, $offset: Int!) {
    profiles(
      where: { user_type: { _eq: $role } }
      limit: $limit
      offset: $offset
      order_by: { created_at: desc }
    ) {
      id
      email
      user_type
      phone
      registration_complete
      is_active
      created_at
      updated_at
    }
    profiles_aggregate(where: { user_type: { _eq: $role } }) {
      aggregate {
        count
      }
    }
  }
`;

interface HasuraUserRecord {
  id: string;
  email: string;
  user_type: string;
  phone: string | null;
  registration_complete: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class HasuraUserRepository extends UserRepository {
  constructor(private readonly apolloClient: ApolloClient<NormalizedCacheObject>) {
    super();
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const { data, errors } = await this.apolloClient.query({
      query: GET_USER_BY_ID,
      variables: { id },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to find user: ${errors[0].message}`);
    }

    if (!data?.profiles_by_pk) {
      return null;
    }

    return this._mapToEntity(data.profiles_by_pk);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const { data, errors } = await this.apolloClient.query({
      query: GET_USER_BY_EMAIL,
      variables: { email },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to find user by email: ${errors[0].message}`);
    }

    if (!data?.profiles || data.profiles.length === 0) {
      return null;
    }

    return this._mapToEntity(data.profiles[0]);
  }

  /**
   * Find user by phone number
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    const { data, errors } = await this.apolloClient.query({
      query: GET_USER_BY_PHONE,
      variables: { phone: phoneNumber },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to find user by phone: ${errors[0].message}`);
    }

    if (!data?.profiles || data.profiles.length === 0) {
      return null;
    }

    return this._mapToEntity(data.profiles[0]);
  }

  /**
   * Save user (insert or update)
   */
  async save(user: User): Promise<User> {
    const record = this._mapToRecord(user);

    const { data, errors } = await this.apolloClient.mutate({
      mutation: UPSERT_USER,
      variables: {
        object: record,
        update_columns: ['email', 'user_type', 'phone', 'registration_complete', 'is_active', 'updated_at'],
      },
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to save user: ${errors[0].message}`);
    }

    if (!data?.insert_profiles_one) {
      throw new Error('Failed to save user: No data returned');
    }

    return this._mapToEntity(data.insert_profiles_one);
  }

  /**
   * Delete user (soft delete)
   */
  async delete(id: string): Promise<void> {
    const { errors } = await this.apolloClient.mutate({
      mutation: UPDATE_USER,
      variables: {
        id,
        data: {
          is_active: false,
          updated_at: new Date().toISOString(),
        },
      },
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to delete user: ${errors[0].message}`);
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const { data, errors } = await this.apolloClient.query({
      query: CHECK_EMAIL_EXISTS,
      variables: { email },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to check email existence: ${errors[0].message}`);
    }

    return data?.profiles && data.profiles.length > 0;
  }

  /**
   * Get users by role with pagination
   */
  async findByRole(role: string, options: PaginationOptions = {}): Promise<FindByRoleResult> {
    const { page = 1, pageSize = 20 } = options;
    const offset = (page - 1) * pageSize;

    const { data, errors } = await this.apolloClient.query({
      query: GET_USERS_BY_ROLE,
      variables: {
        role,
        limit: pageSize,
        offset,
      },
      fetchPolicy: 'network-only',
    });

    if (errors && errors.length > 0) {
      throw new Error(`Failed to find users by role: ${errors[0].message}`);
    }

    const users = (data?.profiles || []).map((record: HasuraUserRecord) => this._mapToEntity(record));
    const total = data?.profiles_aggregate?.aggregate?.count || 0;

    return { users, total };
  }

  /**
   * Map database record to User entity
   */
  private _mapToEntity(record: HasuraUserRecord): User {
    return new User({
      id: record.id,
      email: record.email,
      emailVerified: record.registration_complete || false,
      phoneNumber: record.phone,
      phoneVerified: false, // Need to check phone_verifications table
      role: UserRole.fromString(record.user_type),
      status: record.is_active ? 'active' : 'suspended',
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    });
  }

  /**
   * Map User entity to database record
   */
  private _mapToRecord(user: User): Partial<HasuraUserRecord> {
    return {
      id: user.id,
      email: user.email,
      user_type: user.role.name,
      phone: user.phoneNumber,
      registration_complete: user.emailVerified,
      is_active: user.status === 'active',
      updated_at: new Date().toISOString(),
    };
  }
}
