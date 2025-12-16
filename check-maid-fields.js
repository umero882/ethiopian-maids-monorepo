const query = `
  query {
    maid_profiles(limit: 10) {
      id
      full_name
      introduction_video_url
      primary_profession
      live_in_preference
      contract_duration_preference
      is_agency_managed
      iso_country_code
    }
  }
`;

async function checkMaids() {
  const response = await fetch('https://ethio-maids-01.hasura.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

checkMaids().catch(console.error);
