/**
 * Hasura Claims Management Functions
 *
 * These functions manage custom claims in Firebase Auth tokens for Hasura GraphQL authorization.
 * Hasura requires specific claims in the JWT to determine user roles and permissions.
 *
 * IMPORTANT: userType is stored BOTH in direct claims AND Hasura claims for reliability:
 *
 * Claims structure:
 * {
 *   "user_type": "maid",                    // Direct access - ALWAYS available
 *   "https://hasura.io/jwt/claims": {
 *     "x-hasura-allowed-roles": ["user", "maid"],
 *     "x-hasura-default-role": "maid",
 *     "x-hasura-user-id": "<firebase-uid>"
 *   }
 * }
 *
 * This ensures userType is:
 * - Persisted server-side (survives refresh, logout, device changes)
 * - Available immediately in JWT token
 * - No localStorage dependency
 */

import * as admin from 'firebase-admin';
import { GraphQLClient, gql } from 'graphql-request';
import * as functions from 'firebase-functions';

// Hasura GraphQL endpoint from environment
const HASURA_ENDPOINT = functions.config().hasura?.endpoint || process.env.HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET = functions.config().hasura?.admin_secret || process.env.HASURA_ADMIN_SECRET;

// GraphQL query to get user profile type
const GET_USER_PROFILE = gql`
  query GetUserProfile($id: String!) {
    profiles_by_pk(id: $id) {
      id
      user_type
      email
    }
  }
`;

// GraphQL query to get user by email
const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      user_type
      email
    }
  }
`;

/**
 * Valid user roles in the system
 */
type UserRole = 'user' | 'maid' | 'sponsor' | 'agency' | 'admin';

/**
 * Hasura claims structure
 */
interface HasuraClaims {
  'x-hasura-allowed-roles': UserRole[];
  'x-hasura-default-role': UserRole;
  'x-hasura-user-id': string;
}

/**
 * Full custom claims structure including both direct user_type and Hasura claims
 */
interface FullCustomClaims {
  user_type: UserRole;
  'https://hasura.io/jwt/claims': HasuraClaims;
}

/**
 * Build complete custom claims object for a user
 * Includes BOTH direct user_type claim AND Hasura-specific claims
 */
function buildFullCustomClaims(userId: string, userRole: UserRole = 'user'): FullCustomClaims {
  // All users get the 'user' base role plus their specific role
  const allowedRoles: UserRole[] = ['user'];

  // Add specific role if different from base user role
  if (userRole && userRole !== 'user' && !allowedRoles.includes(userRole)) {
    allowedRoles.push(userRole);
  }

  return {
    // Direct user_type claim - easily accessible without parsing Hasura claims
    user_type: userRole || 'user',
    // Hasura-specific claims for GraphQL authorization
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': allowedRoles,
      'x-hasura-default-role': userRole || 'user',
      'x-hasura-user-id': userId,
    },
  };
}

/**
 * Fetch user role from Hasura database
 */
async function fetchUserRoleFromDatabase(userId: string, email?: string): Promise<UserRole> {
  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    console.warn('[HasuraClaims] Hasura config not set, using default role');
    return 'user';
  }

  const client = new GraphQLClient(HASURA_ENDPOINT, {
    headers: {
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
  });

  try {
    // First try by user ID
    const dataById = await client.request<{ profiles_by_pk: { user_type: string } | null }>(
      GET_USER_PROFILE,
      { id: userId }
    );

    if (dataById?.profiles_by_pk?.user_type) {
      return dataById.profiles_by_pk.user_type as UserRole;
    }

    // If not found by ID and email is provided, try by email
    if (email) {
      const dataByEmail = await client.request<{ profiles: Array<{ user_type: string }> }>(
        GET_USER_BY_EMAIL,
        { email }
      );

      if (dataByEmail?.profiles?.[0]?.user_type) {
        return dataByEmail.profiles[0].user_type as UserRole;
      }
    }

    console.log(`[HasuraClaims] No profile found for user ${userId}, using default role`);
    return 'user';
  } catch (error) {
    console.error('[HasuraClaims] Failed to fetch user role from database:', error);
    return 'user';
  }
}

/**
 * Set full custom claims for a user (includes user_type + Hasura claims)
 */
async function setFullClaimsForUser(uid: string, role: UserRole): Promise<void> {
  const claims = buildFullCustomClaims(uid, role);

  try {
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`[HasuraClaims] Set full claims for user ${uid}: user_type=${role}`);
  } catch (error) {
    console.error(`[HasuraClaims] Failed to set claims for user ${uid}:`, error);
    throw error;
  }
}

/**
 * Set Hasura custom claims for a user (legacy - now uses full claims)
 */
async function setHasuraClaimsForUser(uid: string, role: UserRole): Promise<void> {
  // Now delegates to setFullClaimsForUser to ensure user_type is always set
  await setFullClaimsForUser(uid, role);
}

/**
 * Firebase Auth trigger: Set default Hasura claims when a new user is created
 *
 * This runs automatically when a new user signs up via Firebase Auth.
 * Sets default 'user' role initially - call syncHasuraClaims after profile creation
 * to update with the actual role.
 */
export async function onUserCreated(user: admin.auth.UserRecord): Promise<void> {
  console.log(`[HasuraClaims] New user created: ${user.uid} (${user.email})`);

  // Set default claims with 'user' role
  // The actual role will be synced after profile is created in database
  await setHasuraClaimsForUser(user.uid, 'user');

  console.log(`[HasuraClaims] Default claims set for new user ${user.uid}`);
}

/**
 * Callable function: Sync Hasura claims with user's role from database
 *
 * Call this after:
 * - User profile is created/updated in database
 * - User's role changes (e.g., sponsor becomes agency)
 *
 * @param data - { userId?: string } - Optional user ID (defaults to caller)
 * @param context - Firebase callable context with auth info
 */
export async function syncHasuraClaims(
  data: { userId?: string },
  context: functions.https.CallableContext
): Promise<{ success: boolean; role: string }> {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Users can only sync their own claims unless they're admin
  const targetUserId = data?.userId || context.auth.uid;
  const callerClaims = context.auth.token as Record<string, unknown>;
  const hasuraClaims = callerClaims['https://hasura.io/jwt/claims'] as HasuraClaims | undefined;
  const isAdmin = hasuraClaims?.['x-hasura-default-role'] === 'admin';

  if (targetUserId !== context.auth.uid && !isAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot sync claims for other users');
  }

  console.log(`[HasuraClaims] Syncing claims for user ${targetUserId}`);

  // Get user's email for fallback lookup
  const userRecord = await admin.auth().getUser(targetUserId);
  const email = userRecord.email;

  // Fetch actual role from database
  const role = await fetchUserRoleFromDatabase(targetUserId, email);

  // Update claims
  await setHasuraClaimsForUser(targetUserId, role);

  return { success: true, role };
}

/**
 * Callable function: Force refresh Hasura claims
 *
 * Call this when you need to ensure the token has the latest claims.
 * After calling this, the client should call Firebase's getIdToken(true) to get a fresh token.
 *
 * @param context - Firebase callable context with auth info
 */
export async function refreshHasuraClaims(
  _data: unknown,
  context: functions.https.CallableContext
): Promise<{ success: boolean; message: string }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  console.log(`[HasuraClaims] Refreshing claims for user ${userId}`);

  // Get user's email for fallback lookup
  const userRecord = await admin.auth().getUser(userId);
  const email = userRecord.email;

  // Fetch and update role
  const role = await fetchUserRoleFromDatabase(userId, email);
  await setHasuraClaimsForUser(userId, role);

  return {
    success: true,
    message: 'Claims refreshed. Call getIdToken(true) to get updated token.',
  };
}

/**
 * Admin function: Set specific role for a user (admin only)
 *
 * @param data - { userId: string, role: UserRole }
 * @param context - Firebase callable context with auth info
 */
export async function adminSetUserRole(
  data: { userId: string; role: UserRole },
  context: functions.https.CallableContext
): Promise<{ success: boolean }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify caller is admin
  const callerClaims = context.auth.token as Record<string, unknown>;
  const hasuraClaims = callerClaims['https://hasura.io/jwt/claims'] as HasuraClaims | undefined;

  if (hasuraClaims?.['x-hasura-default-role'] !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set user roles');
  }

  if (!data?.userId || !data?.role) {
    throw new functions.https.HttpsError('invalid-argument', 'userId and role are required');
  }

  const validRoles: UserRole[] = ['user', 'maid', 'sponsor', 'agency', 'admin'];
  if (!validRoles.includes(data.role)) {
    throw new functions.https.HttpsError('invalid-argument', `Invalid role: ${data.role}`);
  }

  console.log(`[HasuraClaims] Admin setting role for user ${data.userId}: ${data.role}`);
  await setHasuraClaimsForUser(data.userId, data.role);

  return { success: true };
}

/**
 * ============================================================================
 * SET USER TYPE - PRIMARY FUNCTION FOR REGISTRATION FLOW
 * ============================================================================
 *
 * Callable function: Set user type during registration
 *
 * THIS IS THE KEY FUNCTION that solves the userType persistence problem:
 * - Called IMMEDIATELY after user signs up (phone verification or email)
 * - Sets userType in Firebase Custom Claims (server-side, persistent)
 * - userType survives: page refresh, logout, device changes, browser close
 * - No localStorage dependency - claims are in the JWT token
 *
 * Flow:
 * 1. User selects userType in onboarding/registration
 * 2. User completes phone/email verification
 * 3. Client calls this function with userType
 * 4. Function sets custom claims with user_type
 * 5. Client calls getIdToken(true) to get fresh token with claims
 * 6. userType is now permanently available in token
 *
 * @param data - { userType: 'maid' | 'sponsor' | 'agency' }
 * @param context - Firebase callable context with auth info
 * @returns { success: boolean, userType: string, message: string }
 */
export async function setUserType(
  data: { userType: string },
  context: functions.https.CallableContext
): Promise<{ success: boolean; userType: string; message: string }> {
  // Must be authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to set user type'
    );
  }

  const userId = context.auth.uid;
  const requestedType = data?.userType?.toLowerCase().trim();

  console.log(`[SetUserType] Request for user ${userId}: userType=${requestedType}`);

  // Validate userType
  const validUserTypes: UserRole[] = ['maid', 'sponsor', 'agency'];
  if (!requestedType || !validUserTypes.includes(requestedType as UserRole)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid user type: "${requestedType}". Must be one of: maid, sponsor, agency`
    );
  }

  const userType = requestedType as UserRole;

  try {
    // Set the full custom claims including user_type and Hasura claims
    await setFullClaimsForUser(userId, userType);

    console.log(`[SetUserType] SUCCESS - User ${userId} now has user_type=${userType}`);

    return {
      success: true,
      userType: userType,
      message: `User type set to "${userType}". Call getIdToken(true) to get updated token.`,
    };
  } catch (error) {
    console.error(`[SetUserType] FAILED for user ${userId}:`, error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to set user type. Please try again.'
    );
  }
}

/**
 * Get current user type from claims (useful for debugging)
 *
 * @param context - Firebase callable context with auth info
 * @returns { userType: string, claims: object }
 */
export async function getUserType(
  _data: unknown,
  context: functions.https.CallableContext
): Promise<{ userType: string | null; hasuraClaims: HasuraClaims | null }> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const token = context.auth.token as Record<string, unknown>;
  const userType = token.user_type as string | undefined;
  const hasuraClaims = token['https://hasura.io/jwt/claims'] as HasuraClaims | undefined;

  console.log(`[GetUserType] User ${context.auth.uid}: user_type=${userType}`);

  return {
    userType: userType || null,
    hasuraClaims: hasuraClaims || null,
  };
}
