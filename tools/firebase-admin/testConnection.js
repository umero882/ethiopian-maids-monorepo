/**
 * Test Firebase Admin SDK Connection
 *
 * This script tests that the Firebase Admin SDK is properly configured
 * and can connect to your Firebase project.
 */

import { auth, firebaseAdmin } from './firebaseAdmin.js';

async function testConnection() {
  console.log('\n========================================');
  console.log('Testing Firebase Admin SDK Connection');
  console.log('========================================\n');

  try {
    // Test 1: Check project configuration
    console.log('1. Checking project configuration...');
    const projectId = firebaseAdmin.app().options.projectId;
    console.log(`   Project ID: ${projectId}`);
    console.log('   Status: OK\n');

    // Test 2: List existing users (limited to 1 to test connection)
    console.log('2. Testing Auth connection...');
    const listUsersResult = await auth.listUsers(1);
    console.log(`   Users found: ${listUsersResult.users.length > 0 ? 'Yes' : 'No users yet'}`);
    if (listUsersResult.users.length > 0) {
      console.log(`   First user email: ${listUsersResult.users[0].email || 'N/A'}`);
    }
    console.log('   Status: OK\n');

    // Test 3: Check if we can generate a custom token (proves full auth access)
    console.log('3. Testing custom token generation...');
    const testUid = 'test-connection-uid';
    const customToken = await auth.createCustomToken(testUid);
    console.log(`   Custom token generated: ${customToken.substring(0, 50)}...`);
    console.log('   Status: OK\n');

    console.log('========================================');
    console.log('All tests passed! Firebase Admin SDK is working correctly.');
    console.log('========================================\n');

    // Print useful information
    console.log('Your Hasura JWT configuration should be:');
    console.log('----------------------------------------');
    console.log(`HASURA_GRAPHQL_JWT_SECRET='${JSON.stringify({
      type: 'RS256',
      jwk_url: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      claims_namespace: 'https://hasura.io/jwt/claims',
      claims_format: 'json'
    })}'`);
    console.log('----------------------------------------\n');

    console.log('Your client-side Firebase config should be:');
    console.log('----------------------------------------');
    console.log(`VITE_FIREBASE_PROJECT_ID=${projectId}`);
    console.log(`VITE_FIREBASE_AUTH_DOMAIN=${projectId}.firebaseapp.com`);
    console.log(`VITE_FIREBASE_STORAGE_BUCKET=${projectId}.appspot.com`);
    console.log('(Get API_KEY, APP_ID, MESSAGING_SENDER_ID from Firebase Console)');
    console.log('----------------------------------------\n');

  } catch (error) {
    console.error('\nConnection test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testConnection();
