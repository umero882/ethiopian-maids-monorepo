const fetch = require('node-fetch');
const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = 'GtTmwvc6ycbRB491SQ7iQnqnMGlg1dHwMCEb0763ogB6Y0ADI0szWUSsbHhmt78F';

async function testVerification() {
  // First, get a pending maid
  const getQuery = `
    query GetPendingMaid {
      maid_profiles(where: { verification_status: { _eq: "pending" } }, limit: 1) {
        id
        full_name
        verification_status
      }
    }
  `;

  const getResponse = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({ query: getQuery })
  });

  const getData = await getResponse.json();
  console.log('Pending maid:', JSON.stringify(getData, null, 2));

  if (getData.data?.maid_profiles?.[0]) {
    const maidId = getData.data.maid_profiles[0].id;
    console.log('\nTesting update for maid ID:', maidId);

    // Test the update mutation
    const updateMutation = `
      mutation UpdateMaidVerification($id: String!, $verification_status: String!) {
        update_maid_profiles_by_pk(
          pk_columns: { id: $id }
          _set: { verification_status: $verification_status }
        ) {
          id
          verification_status
        }
      }
    `;

    const updateResponse = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      },
      body: JSON.stringify({
        query: updateMutation,
        variables: { id: maidId, verification_status: 'verified' }
      })
    });

    const updateData = await updateResponse.json();
    console.log('\nUpdate result:', JSON.stringify(updateData, null, 2));

    // Reset back to pending for testing
    const resetResponse = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET
      },
      body: JSON.stringify({
        query: updateMutation,
        variables: { id: maidId, verification_status: 'pending' }
      })
    });

    const resetData = await resetResponse.json();
    console.log('\nReset result:', JSON.stringify(resetData, null, 2));
  }
}

testVerification().catch(console.error);
