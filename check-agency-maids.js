/**
 * Quick script to check agency-maid relationships in Hasura
 */

const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = 'GtTmwvc6ycbRB491SQ7iQnqnMGlg1dHwMCEb0763ogB6Y0ADI0szWUSsbHhmt78F';

async function checkAgencyMaids() {
  // First, get all agency profiles
  const agencyQuery = `
    query {
      agency_profiles(limit: 10) {
        id
        full_name
        total_maids
        total_maids_managed
      }
    }
  `;

  // Get all maid profiles with agency_id
  const maidQuery = `
    query {
      maid_profiles(where: { agency_id: { _is_null: false } }, limit: 20) {
        id
        full_name
        agency_id
        is_agency_managed
        availability_status
      }
    }
  `;

  try {
    // Fetch agencies
    const agencyRes = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({ query: agencyQuery }),
    });
    const agencyData = await agencyRes.json();

    console.log('=== AGENCY PROFILES ===');
    console.log(JSON.stringify(agencyData, null, 2));

    // Fetch maids
    const maidRes = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({ query: maidQuery }),
    });
    const maidData = await maidRes.json();

    console.log('\n=== MAID PROFILES WITH AGENCY_ID ===');
    console.log(JSON.stringify(maidData, null, 2));

    // Now check if any agencies have matching maids
    const agencies = agencyData?.data?.agency_profiles || [];
    const maids = maidData?.data?.maid_profiles || [];

    console.log('\n=== MATCHING ANALYSIS ===');
    for (const agency of agencies) {
      const matchingMaids = maids.filter(m => m.agency_id === agency.id);
      console.log(`Agency "${agency.full_name}" (ID: ${agency.id}): ${matchingMaids.length} maids found`);
      if (matchingMaids.length > 0) {
        matchingMaids.forEach(m => {
          console.log(`  - ${m.full_name} (status: ${m.availability_status})`);
        });
      }
    }

    // Show maids that have agency_id but don't match any agency
    const allAgencyIds = agencies.map(a => a.id);
    const orphanMaids = maids.filter(m => !allAgencyIds.includes(m.agency_id));
    if (orphanMaids.length > 0) {
      console.log('\n=== MAIDS WITH NON-MATCHING AGENCY_ID ===');
      orphanMaids.forEach(m => {
        console.log(`  - ${m.full_name}: agency_id="${m.agency_id}"`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAgencyMaids();
