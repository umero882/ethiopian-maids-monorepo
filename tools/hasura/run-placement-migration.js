/**
 * Hasura Migration Script - Placement Workflow Tables
 *
 * This script creates the placement_workflows and platform_fee_requirements tables
 * and alters maid_profiles to add hired_status columns.
 *
 * Usage:
 *   HASURA_ADMIN_SECRET="your-secret" node tools/hasura/run-placement-migration.js
 *
 * Or with environment file:
 *   node tools/hasura/run-placement-migration.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const HASURA_ENDPOINT = process.env.VITE_HASURA_GRAPHQL_ENDPOINT || 'https://ethio-maids-01.hasura.app/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

// Derive the SQL endpoint from GraphQL endpoint
const HASURA_SQL_ENDPOINT = HASURA_ENDPOINT.replace('/v1/graphql', '/v2/query');

// Possible source names (Hasura database connection names)
const POSSIBLE_SOURCES = ['supabase-postgres', 'default', 'pg', 'postgres'];
let ACTIVE_SOURCE = null;

if (!HASURA_ADMIN_SECRET) {
  console.error('ERROR: HASURA_ADMIN_SECRET environment variable is required');
  console.error('');
  console.error('Usage:');
  console.error('  HASURA_ADMIN_SECRET="your-secret" node tools/hasura/run-placement-migration.js');
  process.exit(1);
}

/**
 * Find the active database source name
 */
async function findDatabaseSource() {
  console.log('Finding database source name...');

  for (const source of POSSIBLE_SOURCES) {
    try {
      const response = await fetch(HASURA_SQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hasura-Admin-Secret': HASURA_ADMIN_SECRET,
        },
        body: JSON.stringify({
          type: 'run_sql',
          args: {
            source: source,
            sql: 'SELECT 1',
            cascade: false,
            read_only: true,
          },
        }),
      });

      const result = await response.json();
      if (response.ok && !result.error) {
        console.log(`Found active source: "${source}"`);
        return source;
      }
    } catch (e) {
      // Try next source
    }
  }

  throw new Error('Could not find a valid database source. Tried: ' + POSSIBLE_SOURCES.join(', '));
}

/**
 * Execute SQL on Hasura
 */
async function executeSQL(sql, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Executing: ${description}`);
  console.log('='.repeat(60));

  if (!ACTIVE_SOURCE) {
    ACTIVE_SOURCE = await findDatabaseSource();
  }

  const response = await fetch(HASURA_SQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hasura-Admin-Secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: 'run_sql',
      args: {
        source: ACTIVE_SOURCE,
        sql: sql,
        cascade: false,
        read_only: false,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    console.error('ERROR:', result.error || result.message || 'Unknown error');
    throw new Error(result.error || result.message || 'SQL execution failed');
  }

  console.log('SUCCESS: SQL executed successfully');
  if (result.result && result.result.length > 1) {
    console.log('Result:', JSON.stringify(result.result.slice(0, 5), null, 2));
  }

  return result;
}

/**
 * Track a table in Hasura
 */
async function trackTable(tableName) {
  console.log(`\nTracking table: ${tableName}`);

  if (!ACTIVE_SOURCE) {
    ACTIVE_SOURCE = await findDatabaseSource();
  }

  const response = await fetch(HASURA_SQL_ENDPOINT.replace('/v2/query', '/v1/metadata'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hasura-Admin-Secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: 'pg_track_table',
      args: {
        source: ACTIVE_SOURCE,
        table: {
          schema: 'public',
          name: tableName,
        },
      },
    }),
  });

  const result = await response.json();

  if (result.error && result.error.includes('already tracked')) {
    console.log(`Table ${tableName} is already tracked`);
    return;
  }

  if (!response.ok && !result.error?.includes('already tracked')) {
    console.error('Warning:', result.error || result.message || 'Could not track table');
    return;
  }

  console.log(`SUCCESS: Table ${tableName} tracked`);
}

/**
 * Reload Hasura metadata
 */
async function reloadMetadata() {
  console.log('\nReloading Hasura metadata...');

  const response = await fetch(HASURA_SQL_ENDPOINT.replace('/v2/query', '/v1/metadata'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Hasura-Admin-Secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      type: 'reload_metadata',
      args: {
        reload_remote_schemas: true,
        reload_sources: true,
      },
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Warning: Could not reload metadata:', result.error || result.message);
    return;
  }

  console.log('SUCCESS: Metadata reloaded');
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('');
  console.log('='.repeat(60));
  console.log('HASURA MIGRATION: Placement Workflow Tables');
  console.log('='.repeat(60));
  console.log(`Endpoint: ${HASURA_SQL_ENDPOINT}`);
  console.log('');

  try {
    // Step 1: Read and execute the main placement workflow SQL
    const placementSQLPath = path.join(__dirname, 'create-placement-workflow-tables.sql');
    const placementSQL = fs.readFileSync(placementSQLPath, 'utf8');
    await executeSQL(placementSQL, 'Create placement_workflows and platform_fee_requirements tables');

    // Step 2: Read and execute the maid_profiles alteration SQL
    const maidProfilesSQLPath = path.join(__dirname, 'alter-maid-profiles-hired-status.sql');
    const maidProfilesSQL = fs.readFileSync(maidProfilesSQLPath, 'utf8');
    await executeSQL(maidProfilesSQL, 'Add hired_status columns to maid_profiles');

    // Step 3: Track the new tables
    await trackTable('platform_fee_requirements');
    await trackTable('placement_workflows');

    // Step 4: Reload metadata to pick up changes
    await reloadMetadata();

    console.log('');
    console.log('='.repeat(60));
    console.log('MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('1. Go to Hasura Console > Data to verify tables');
    console.log('2. Run "pnpm codegen" to regenerate GraphQL types');
    console.log('3. Set up permissions for the new tables');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('MIGRATION FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('');
    console.error('If the error is about existing tables, you may need to:');
    console.error('1. Drop existing tables in Hasura Console');
    console.error('2. Or run the SQL statements individually');
    process.exit(1);
  }
}

// Run the migration
runMigration();
