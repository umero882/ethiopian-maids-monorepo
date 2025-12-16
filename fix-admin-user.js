/**
 * Script to create admin user with proper UUID
 * Note: The auth lookup is done by EMAIL, not by ID, so the UUID doesn't need to match Firebase UID
 */

require('dotenv').config();
const crypto = require('crypto');

const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || process.env.VITE_HASURA_ADMIN_SECRET;

const EMAIL = 'info@ethiopianmaids.com';
const NEW_UUID = crypto.randomUUID();

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

async function fixAdminUser() {
  console.log('========================================');
  console.log('Creating Admin User');
  console.log('========================================\n');
  console.log('Email:', EMAIL);
  console.log('New UUID:', NEW_UUID);
  console.log('');

  try {
    // Step 1: Insert auth_users entry first (required for foreign key)
    console.log('Step 1: Creating auth_users entry...');
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
          role
        }
      }
    `, { id: NEW_UUID, email: EMAIL });

    if (insertAuth.errors) {
      // Try with email constraint instead
      console.log('Trying with email constraint...');
      const insertAuth2 = await runQuery(`
        mutation InsertAuthUser($id: uuid!, $email: String!) {
          insert_auth_users_one(
            object: {
              id: $id
              email: $email
              role: "authenticated"
            }
            on_conflict: {
              constraint: users_email_key
              update_columns: [role]
            }
          ) {
            id
            email
            role
          }
        }
      `, { id: NEW_UUID, email: EMAIL });

      if (insertAuth2.errors) {
        console.error('Auth insert errors:', insertAuth2.errors[0].message);

        // Check if user already exists
        const checkAuth = await runQuery(`
          query { auth_users(where: { email: { _eq: "${EMAIL}" } }) { id email } }
        `);

        if (checkAuth.data?.auth_users?.length > 0) {
          console.log('Auth user already exists:', checkAuth.data.auth_users[0]);
        }
      } else {
        console.log('Auth user created:', insertAuth2.data?.insert_auth_users_one);
      }
    } else {
      console.log('Auth user created:', insertAuth.data?.insert_auth_users_one);
    }

    // Step 2: Get the auth_users id (might be different if already existed)
    const getAuthId = await runQuery(`
      query { auth_users(where: { email: { _eq: "${EMAIL}" } }) { id email } }
    `);

    const authUserId = getAuthId.data?.auth_users?.[0]?.id;
    console.log('\nAuth user ID to use:', authUserId);

    if (!authUserId) {
      console.error('No auth user found! Cannot create admin.');
      return;
    }

    // Step 3: Insert admin_users entry using the auth_users id
    console.log('\nStep 2: Creating admin_users entry...');
    const insertAdmin = await runQuery(`
      mutation InsertAdminUser($id: uuid!, $email: String!) {
        insert_admin_users_one(
          object: {
            id: $id
            email: $email
            full_name: "Ethiopian Maids Admin"
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
    `, { id: authUserId, email: EMAIL });

    if (insertAdmin.errors) {
      console.error('Admin insert errors:', insertAdmin.errors[0].message);
    } else {
      console.log('Admin user created:', insertAdmin.data?.insert_admin_users_one);
    }

    // Step 4: Verify
    console.log('\n========================================');
    console.log('Verification');
    console.log('========================================');

    const finalCheck = await runQuery(`
      query {
        admin_users(where: { email: { _eq: "${EMAIL}" } }) {
          id
          email
          full_name
          role
          is_active
        }
      }
    `);

    if (finalCheck.data?.admin_users?.length > 0) {
      const admin = finalCheck.data.admin_users[0];
      console.log('\n✅ Admin user is ready!');
      console.log('ID:', admin.id);
      console.log('Email:', admin.email);
      console.log('Name:', admin.full_name);
      console.log('Role:', admin.role);
      console.log('Active:', admin.is_active);
      console.log('\n========================================');
      console.log('You can now login at:');
      console.log('http://localhost:5173/admin/login');
      console.log('Email: info@ethiopianmaids.com');
      console.log('Password: 231978@EthioAdmin');
      console.log('========================================');
    } else {
      console.log('\n❌ Admin user not found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

fixAdminUser();
