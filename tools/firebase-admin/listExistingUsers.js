/**
 * List existing users from Hasura to migrate to Firebase
 */

import { auth } from './firebaseAdmin.js';

const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = 'GtTmwvc6ycbRB491SQ7iQnqnMGlg1dHwMCEb0763ogB6Y0ADI0szWUSsbHhmt78F';

async function queryHasura(query) {
  const response = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    return null;
  }
  return data.data;
}

async function listUsers() {
  console.log('\n========================================');
  console.log('Fetching Users from Hasura');
  console.log('========================================\n');

  // Get maid profiles
  const maidsQuery = `{
    maid_profiles(limit: 50) {
      id
      user_id
      full_name
      email
      phone
    }
  }`;

  const maidsData = await queryHasura(maidsQuery);
  if (maidsData?.maid_profiles) {
    console.log('Maid Profiles:');
    maidsData.maid_profiles.forEach(m => {
      console.log(`  - ${m.full_name || 'N/A'} | ${m.email || 'No email'} | user_id: ${m.user_id}`);
    });
    console.log(`  Total: ${maidsData.maid_profiles.length}\n`);
  }

  // Get sponsor profiles
  const sponsorsQuery = `{
    sponsor_profiles(limit: 50) {
      id
      user_id
      full_name
      email
      phone
    }
  }`;

  const sponsorsData = await queryHasura(sponsorsQuery);
  if (sponsorsData?.sponsor_profiles) {
    console.log('Sponsor Profiles:');
    sponsorsData.sponsor_profiles.forEach(s => {
      console.log(`  - ${s.full_name || 'N/A'} | ${s.email || 'No email'} | user_id: ${s.user_id}`);
    });
    console.log(`  Total: ${sponsorsData.sponsor_profiles.length}\n`);
  }

  // Get agency profiles
  const agenciesQuery = `{
    agency_profiles(limit: 50) {
      id
      user_id
      agency_name
      email
      phone
    }
  }`;

  const agenciesData = await queryHasura(agenciesQuery);
  if (agenciesData?.agency_profiles) {
    console.log('Agency Profiles:');
    agenciesData.agency_profiles.forEach(a => {
      console.log(`  - ${a.agency_name || 'N/A'} | ${a.email || 'No email'} | user_id: ${a.user_id}`);
    });
    console.log(`  Total: ${agenciesData.agency_profiles.length}\n`);
  }

  // Collect all users with emails for migration
  const usersToMigrate = [];

  if (maidsData?.maid_profiles) {
    maidsData.maid_profiles.forEach(m => {
      if (m.email) usersToMigrate.push({ email: m.email, name: m.full_name, type: 'maid', userId: m.user_id });
    });
  }

  if (sponsorsData?.sponsor_profiles) {
    sponsorsData.sponsor_profiles.forEach(s => {
      if (s.email) usersToMigrate.push({ email: s.email, name: s.full_name, type: 'sponsor', userId: s.user_id });
    });
  }

  if (agenciesData?.agency_profiles) {
    agenciesData.agency_profiles.forEach(a => {
      if (a.email) usersToMigrate.push({ email: a.email, name: a.agency_name, type: 'agency', userId: a.user_id });
    });
  }

  console.log('========================================');
  console.log(`Users with emails that can be migrated: ${usersToMigrate.length}`);
  console.log('========================================\n');

  if (usersToMigrate.length > 0) {
    console.log('To migrate these users to Firebase, run:');
    usersToMigrate.forEach(u => {
      console.log(`  node migrateSupabaseUsers.js "${u.email}" "${u.name || 'User'}" ${u.type}`);
    });
  }

  return usersToMigrate;
}

// Also list existing Firebase users
async function listFirebaseUsers() {
  console.log('\n========================================');
  console.log('Existing Firebase Auth Users');
  console.log('========================================\n');

  try {
    const listUsersResult = await auth.listUsers(100);

    if (listUsersResult.users.length === 0) {
      console.log('No users in Firebase Auth yet.\n');
      return;
    }

    listUsersResult.users.forEach(user => {
      console.log(`  - ${user.email} | ${user.displayName || 'No name'} | UID: ${user.uid}`);
    });
    console.log(`\n  Total: ${listUsersResult.users.length}`);
  } catch (error) {
    console.error('Error listing Firebase users:', error.message);
  }
}

async function main() {
  await listUsers();
  await listFirebaseUsers();
}

main().then(() => process.exit(0));
