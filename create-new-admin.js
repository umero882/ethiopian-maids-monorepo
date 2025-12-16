/**
 * Create a NEW admin user in Firebase and Hasura
 */

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const crypto = require('crypto');

const firebaseConfig = {
  apiKey: "REMOVED_API_KEY",
  authDomain: "ethiopian-maids.firebaseapp.com",
  projectId: "ethiopian-maids",
  storageBucket: "ethiopian-maids.firebasestorage.app",
  messagingSenderId: "227663902586",
  appId: "1:227663902586:web:3d100f09f205d5833988c3"
};

const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || process.env.VITE_HASURA_ADMIN_SECRET;

// NEW admin credentials
const NEW_EMAIL = 'admin@ethiopianmaids.com';
const NEW_PASSWORD = 'Admin@2025!Ethio';

async function runQuery(query, variables = {}) {
  const response = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({ query, variables })
  });
  return response.json();
}

async function main() {
  console.log('========================================');
  console.log('Creating NEW Admin User');
  console.log('========================================\n');
  console.log('Email:', NEW_EMAIL);
  console.log('Password:', NEW_PASSWORD);
  console.log('');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  // Step 1: Create Firebase user
  console.log('Step 1: Creating Firebase user...');
  let firebaseUid;
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, NEW_EMAIL, NEW_PASSWORD);
    firebaseUid = userCredential.user.uid;
    console.log('✅ Firebase user created! UID:', firebaseUid);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('Firebase user already exists. Proceeding with Hasura setup...');
    } else {
      console.error('❌ Firebase error:', error.code, error.message);
      process.exit(1);
    }
  }

  // Step 2: Create auth_users entry in Hasura
  const NEW_UUID = crypto.randomUUID();
  console.log('\nStep 2: Creating auth_users entry...');

  const insertAuth = await runQuery(`
    mutation InsertAuthUser($id: uuid!, $email: String!) {
      insert_auth_users_one(
        object: {
          id: $id
          email: $email
          role: "authenticated"
        }
        on_conflict: {
          constraint: users_pkey
          update_columns: [email, role]
        }
      ) {
        id
        email
      }
    }
  `, { id: NEW_UUID, email: NEW_EMAIL });

  if (insertAuth.errors) {
    console.log('Auth insert issue:', insertAuth.errors[0].message);
  } else {
    console.log('✅ auth_users created:', insertAuth.data?.insert_auth_users_one);
  }

  // Step 3: Get the auth_users id
  const getAuthId = await runQuery(`
    query { auth_users(where: { email: { _eq: "${NEW_EMAIL}" } }) { id email } }
  `);

  const authUserId = getAuthId.data?.auth_users?.[0]?.id;
  console.log('\nAuth user ID:', authUserId);

  if (!authUserId) {
    console.error('❌ No auth user found!');
    process.exit(1);
  }

  // Step 4: Create admin_users entry
  console.log('\nStep 3: Creating admin_users entry...');
  const insertAdmin = await runQuery(`
    mutation InsertAdminUser($id: uuid!, $email: String!) {
      insert_admin_users_one(
        object: {
          id: $id
          email: $email
          full_name: "System Administrator"
          role: super_admin
          is_active: true
        }
        on_conflict: {
          constraint: admin_users_email_key
          update_columns: [full_name, role, is_active]
        }
      ) {
        id
        email
        full_name
        role
        is_active
      }
    }
  `, { id: authUserId, email: NEW_EMAIL });

  if (insertAdmin.errors) {
    console.error('❌ Admin insert error:', insertAdmin.errors[0].message);
  } else {
    console.log('✅ admin_users created:', insertAdmin.data?.insert_admin_users_one);
  }

  // Final verification
  console.log('\n========================================');
  console.log('✅ NEW ADMIN USER READY!');
  console.log('========================================');
  console.log('');
  console.log('Login at: http://localhost:5173/admin/login');
  console.log('Email:', NEW_EMAIL);
  console.log('Password:', NEW_PASSWORD);
  console.log('========================================');

  process.exit(0);
}

main();
