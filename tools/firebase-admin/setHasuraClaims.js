/**
 * Set Hasura Custom Claims on Firebase Users
 *
 * This script sets the necessary Hasura JWT claims on Firebase users.
 * These claims are required for Hasura row-level security to work.
 *
 * The claims structure:
 * {
 *   "https://hasura.io/jwt/claims": {
 *     "x-hasura-default-role": "user",
 *     "x-hasura-allowed-roles": ["user", "maid", "sponsor", "agency"],
 *     "x-hasura-user-id": "<firebase-uid>"
 *   }
 * }
 */

import { auth } from './firebaseAdmin.js';

/**
 * Set Hasura claims for a single user
 * @param {string} uid - Firebase user UID
 * @param {string} userType - User type (maid, sponsor, agency)
 */
async function setHasuraClaimsForUser(uid, userType = 'user') {
  try {
    const hasuraClaims = {
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': userType,
        'x-hasura-allowed-roles': ['user', 'maid', 'sponsor', 'agency'],
        'x-hasura-user-id': uid,
      },
      user_type: userType,
    };

    await auth.setCustomUserClaims(uid, hasuraClaims);
    console.log(`Set claims for user ${uid} with role ${userType}`);
    return true;
  } catch (error) {
    console.error(`Failed to set claims for user ${uid}:`, error.message);
    return false;
  }
}

/**
 * Set Hasura claims for all users in Firebase Auth
 * Fetches user type from profile metadata if available
 */
async function setHasuraClaimsForAllUsers() {
  console.log('\n========================================');
  console.log('Setting Hasura Claims for All Users');
  console.log('========================================\n');

  let pageToken;
  let successCount = 0;
  let failCount = 0;
  let totalUsers = 0;

  try {
    do {
      const listUsersResult = await auth.listUsers(100, pageToken);

      for (const user of listUsersResult.users) {
        totalUsers++;

        // Try to get user type from existing claims or default to 'user'
        const existingClaims = user.customClaims || {};
        const userType = existingClaims.user_type ||
                        existingClaims['https://hasura.io/jwt/claims']?.['x-hasura-default-role'] ||
                        'user';

        const success = await setHasuraClaimsForUser(user.uid, userType);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    console.log('\n========================================');
    console.log('Claims Update Complete');
    console.log('========================================');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);

  } catch (error) {
    console.error('Error listing users:', error.message);
    process.exit(1);
  }
}

// Run if called directly
const args = process.argv.slice(2);

if (args.length === 2) {
  // Update single user: node setHasuraClaims.js <uid> <userType>
  const [uid, userType] = args;
  setHasuraClaimsForUser(uid, userType).then(() => {
    console.log('Done');
    process.exit(0);
  });
} else if (args.length === 0 || args[0] === '--all') {
  // Update all users
  setHasuraClaimsForAllUsers().then(() => {
    process.exit(0);
  });
} else {
  console.log('Usage:');
  console.log('  Update all users:   node setHasuraClaims.js');
  console.log('  Update single user: node setHasuraClaims.js <uid> <userType>');
  console.log('\nUser types: user, maid, sponsor, agency');
  process.exit(1);
}

export { setHasuraClaimsForUser, setHasuraClaimsForAllUsers };
