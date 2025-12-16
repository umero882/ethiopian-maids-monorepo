/**
 * Create Test User in Firebase
 *
 * This script creates a test user in Firebase Auth for testing purposes.
 * It also sets up Hasura custom claims on the user.
 */

import { auth } from './firebaseAdmin.js';

// Test user configuration
const TEST_USER = {
  email: 'test@ethiopianmaids.com',
  password: 'TestPassword123!',
  displayName: 'Test User',
  userType: 'sponsor', // 'maid', 'sponsor', or 'agency'
};

async function createTestUser() {
  console.log('\n========================================');
  console.log('Creating Test User in Firebase Auth');
  console.log('========================================\n');

  try {
    // Check if user already exists
    console.log(`Checking if user ${TEST_USER.email} exists...`);
    let existingUser = null;
    try {
      existingUser = await auth.getUserByEmail(TEST_USER.email);
      console.log(`User already exists with UID: ${existingUser.uid}`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log('User does not exist, creating...');
      } else {
        throw e;
      }
    }

    let user;
    if (existingUser) {
      user = existingUser;
      console.log('Using existing user...');
    } else {
      // Create the user
      user = await auth.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        displayName: TEST_USER.displayName,
        emailVerified: true, // Skip email verification for test user
      });
      console.log(`User created with UID: ${user.uid}`);
    }

    // Set custom claims for Hasura
    console.log('\nSetting Hasura custom claims...');
    const hasuraClaims = {
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': TEST_USER.userType,
        'x-hasura-allowed-roles': ['user', 'maid', 'sponsor', 'agency'],
        'x-hasura-user-id': user.uid,
      },
      user_type: TEST_USER.userType,
    };

    await auth.setCustomUserClaims(user.uid, hasuraClaims);
    console.log('Custom claims set successfully');

    // Verify the claims were set
    const updatedUser = await auth.getUser(user.uid);
    console.log('\nUser details:');
    console.log('-------------');
    console.log(`UID: ${updatedUser.uid}`);
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Display Name: ${updatedUser.displayName}`);
    console.log(`Email Verified: ${updatedUser.emailVerified}`);
    console.log(`Custom Claims:`, JSON.stringify(updatedUser.customClaims, null, 2));

    console.log('\n========================================');
    console.log('Test user created successfully!');
    console.log('========================================');
    console.log('\nLogin credentials:');
    console.log(`  Email: ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log(`  UID: ${user.uid}`);
    console.log('\nUse these credentials to log in to the app.');

    return user;

  } catch (error) {
    console.error('\nFailed to create test user:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

createTestUser();
