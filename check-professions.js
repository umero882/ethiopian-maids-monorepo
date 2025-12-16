// Script to check primary_profession values in the database
const fetch = require('node-fetch');

const HASURA_ENDPOINT = 'https://ethio-maids-01.hasura.app/v1/graphql';

async function checkProfessions() {
  const query = `
    query GetProfessions {
      maid_profiles(limit: 100) {
        id
        full_name
        primary_profession
      }
    }
  `;

  try {
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      return;
    }

    console.log('\n=== Maid Professions in Database ===\n');

    const professions = new Map();

    data.data.maid_profiles.forEach(maid => {
      const prof = maid.primary_profession || '(null)';
      if (!professions.has(prof)) {
        professions.set(prof, []);
      }
      professions.get(prof).push(maid.full_name);
    });

    console.log('Unique profession values found:');
    professions.forEach((maids, profession) => {
      console.log(`  "${profession}": ${maids.length} maid(s)`);
      maids.forEach(name => console.log(`    - ${name}`));
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProfessions();
