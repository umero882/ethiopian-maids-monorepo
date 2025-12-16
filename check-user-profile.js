/**
 * Check user profiles to understand the ID mapping
 */

const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = 'GtTmwvc6ycbRB491SQ7iQnqnMGlg1dHwMCEb0763ogB6Y0ADI0szWUSsbHhmt78F';

async function checkProfiles() {
  // Get all profiles with agency user_type
  const query = `
    query {
      profiles(where: { user_type: { _eq: "agency" } }) {
        id
        email
        user_type
        full_name
      }
      agency_profiles {
        id
        full_name
        total_maids
      }
    }
  `;

  try {
    const res = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();

    console.log('=== AGENCY USER PROFILES ===');
    const profiles = data?.data?.profiles || [];
    profiles.forEach(p => {
      console.log(`Profile ID: ${p.id}`);
      console.log(`  Email: ${p.email}`);
      console.log(`  Full Name: ${p.full_name}`);
      console.log('');
    });

    console.log('=== AGENCY PROFILES ===');
    const agencyProfiles = data?.data?.agency_profiles || [];
    agencyProfiles.forEach(a => {
      console.log(`Agency ID: ${a.id}`);
      console.log(`  Full Name: ${a.full_name}`);
      console.log(`  Total Maids: ${a.total_maids}`);

      // Check if this ID matches any profile
      const matchingProfile = profiles.find(p => p.id === a.id);
      if (matchingProfile) {
        console.log(`  ✓ Matches profile: ${matchingProfile.email}`);
      } else {
        console.log(`  ✗ No matching profile found`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkProfiles();
