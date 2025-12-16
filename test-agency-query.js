/**
 * Test the exact GraphQL query used in agency profile screen
 */

const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = 'GtTmwvc6ycbRB491SQ7iQnqnMGlg1dHwMCEb0763ogB6Y0ADI0szWUSsbHhmt78F';

// Kafil Agency user ID
const USER_ID = 'JlTGdym1qrP1hTpypukuyJlWEIg1';

async function testQuery() {
  const query = `
    query GetAgencyProfile($userId: String!) {
      agency_profiles(where: { id: { _eq: $userId } }, limit: 1) {
        id
        full_name
        total_maids
        active_maids
      }
      total_maids_count: maid_profiles_aggregate(where: { agency_id: { _eq: $userId } }) {
        aggregate {
          count
        }
      }
      active_maids_count: maid_profiles_aggregate(
        where: { agency_id: { _eq: $userId }, availability_status: { _in: ["available", "active"] } }
      ) {
        aggregate {
          count
        }
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
      body: JSON.stringify({
        query,
        variables: { userId: USER_ID }
      }),
    });
    const data = await res.json();

    console.log('=== QUERY RESULT ===');
    console.log(JSON.stringify(data, null, 2));

    if (data.data) {
      const profile = data.data.agency_profiles?.[0];
      const totalMaidsCount = data.data.total_maids_count?.aggregate?.count;
      const activeMaidsCount = data.data.active_maids_count?.aggregate?.count;

      console.log('\n=== PARSED VALUES ===');
      console.log('Agency:', profile?.full_name);
      console.log('Static total_maids field:', profile?.total_maids);
      console.log('Static active_maids field:', profile?.active_maids);
      console.log('Aggregate total_maids_count:', totalMaidsCount);
      console.log('Aggregate active_maids_count:', activeMaidsCount);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery();
