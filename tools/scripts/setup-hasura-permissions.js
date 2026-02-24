#!/usr/bin/env node

/**
 * Hasura Permission Setup Script
 *
 * Adds permissions for singular role names (maid, sponsor, agency, user)
 * to match what Firebase JWT sets via x-hasura-default-role.
 *
 * The existing metadata only has permissions for "maids" (plural),
 * but the JWT uses "maid" (singular), "sponsor", "agency", "user".
 *
 * This script is idempotent - safe to run multiple times.
 *
 * Usage:
 *   HASURA_ENDPOINT=https://your-hasura.app/v1 HASURA_ADMIN_SECRET=xxx node setup-hasura-permissions.js
 *
 * Or set these in your .env file.
 */

const HASURA_ENDPOINT =
  process.env.HASURA_ENDPOINT ||
  process.env.HASURA_GRAPHQL_ENDPOINT ||
  process.env.VITE_HASURA_GRAPHQL_ENDPOINT ||
  'https://ethio-maids-01.hasura.app/v1';

const HASURA_ADMIN_SECRET =
  process.env.HASURA_ADMIN_SECRET || '';

if (!HASURA_ADMIN_SECRET) {
  console.error('ERROR: HASURA_ADMIN_SECRET environment variable is required.');
  console.error('Usage: HASURA_ADMIN_SECRET=xxx node setup-hasura-permissions.js');
  process.exit(1);
}

// The metadata API endpoint (not GraphQL)
const METADATA_URL = HASURA_ENDPOINT.replace('/v1/graphql', '/v1').replace(/\/+$/, '') + '/metadata';

async function runMetadataQuery(body) {
  const response = await fetch(METADATA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    // Permission already exists is OK (idempotent)
    if (result?.error?.includes('already exists') || result?.internal?.error?.message?.includes('already exists')) {
      return { skipped: true, ...result };
    }
    throw new Error(`Hasura metadata API error: ${JSON.stringify(result)}`);
  }

  return result;
}

// Source name in Hasura metadata
// VPS instance uses 'default', old Supabase instance used 'supabase-postgres'
const SOURCE = process.env.HASURA_SOURCE || 'default';
const SCHEMA = 'public';

// ---- Permission definitions ----

// Roles to add (singular form matching JWT)
const ROLES = ['maid', 'sponsor', 'agency', 'user'];

// Tables and their permission configs
const TABLES = {
  profiles: {
    select: {
      columns: [
        'id', 'full_name', 'email', 'phone', 'user_type', 'avatar_url',
        'country', 'location', 'registration_complete', 'is_active',
        'profile_completion', 'verification_status', 'created_at', 'updated_at',
      ],
      // Users can only see their own profile
      filter: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
    insert: {
      columns: [
        'id', 'full_name', 'email', 'phone', 'user_type', 'avatar_url',
        'country', 'location', 'registration_complete', 'is_active',
        'profile_completion', 'updated_at',
      ],
      check: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
    update: {
      columns: [
        'full_name', 'phone', 'user_type', 'avatar_url', 'country',
        'location', 'registration_complete', 'is_active',
        'profile_completion', 'updated_at',
      ],
      filter: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
  },
  maid_profiles: {
    select: {
      columns: '*',
      filter: { id: { '_eq': 'X-Hasura-User-Id' } },
      // Allow all users to read maid profiles (for browsing)
      public_filter: {},
    },
    insert: {
      columns: '*',
      check: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
    update: {
      columns: '*',
      filter: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
  },
  sponsor_profiles: {
    select: {
      columns: '*',
      filter: { id: { '_eq': 'X-Hasura-User-Id' } },
      // Allow maids/agencies/users to read basic sponsor info (for job cards)
      public_filter: {},
    },
    insert: {
      columns: '*',
      check: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
    update: {
      columns: '*',
      filter: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
  },
  agency_profiles: {
    select: {
      columns: '*',
      filter: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
    insert: {
      columns: '*',
      check: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
    update: {
      columns: '*',
      filter: { id: { '_eq': 'X-Hasura-User-Id' } },
    },
  },
  jobs: {
    select: {
      columns: '*',
      // All users can browse jobs
      filter: {},
    },
    insert: {
      columns: '*',
      // Only the sponsor creating the job can insert (sponsor_id = user ID)
      check: { sponsor_id: { '_eq': 'X-Hasura-User-Id' } },
    },
    update: {
      columns: '*',
      // Sponsors can only update their own jobs
      filter: { sponsor_id: { '_eq': 'X-Hasura-User-Id' } },
    },
  },
  applications: {
    select: {
      columns: '*',
      // Users can see their own applications (maid_id) or applications to their jobs
      filter: {
        '_or': [
          { maid_id: { '_eq': 'X-Hasura-User-Id' } },
          { job: { sponsor_id: { '_eq': 'X-Hasura-User-Id' } } },
        ],
      },
    },
    insert: {
      columns: '*',
      // Maids can submit applications
      check: { maid_id: { '_eq': 'X-Hasura-User-Id' } },
    },
    update: {
      columns: '*',
      // Users can update their own applications or sponsors can update applications to their jobs
      filter: {
        '_or': [
          { maid_id: { '_eq': 'X-Hasura-User-Id' } },
          { job: { sponsor_id: { '_eq': 'X-Hasura-User-Id' } } },
        ],
      },
    },
  },
};

// Special: maid_profiles should be readable by sponsors and agencies (for browsing)
const MAID_PROFILES_PUBLIC_SELECT_ROLES = ['sponsor', 'agency', 'user'];

// Special: sponsor_profiles should be readable by maids and agencies (for job cards)
const SPONSOR_PROFILES_PUBLIC_SELECT_ROLES = ['maid', 'agency', 'user'];

// Tables that have public_filter overrides for certain roles
const PUBLIC_SELECT_OVERRIDES = {
  maid_profiles: MAID_PROFILES_PUBLIC_SELECT_ROLES,
  sponsor_profiles: SPONSOR_PROFILES_PUBLIC_SELECT_ROLES,
};

async function createSelectPermission(table, role, config) {
  const args = {
    type: 'pg_create_select_permission',
    args: {
      source: SOURCE,
      table: { name: table, schema: SCHEMA },
      role: role,
      permission: {
        columns: config.columns,
        filter: config.filter,
        allow_aggregations: false,
      },
    },
  };

  try {
    const result = await runMetadataQuery(args);
    if (result.skipped) {
      console.log(`  [SKIP] SELECT on ${table} for ${role} (already exists)`);
    } else {
      console.log(`  [OK]   SELECT on ${table} for ${role}`);
    }
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`  [SKIP] SELECT on ${table} for ${role} (already exists)`);
    } else {
      console.error(`  [FAIL] SELECT on ${table} for ${role}:`, error.message);
    }
  }
}

async function dropSelectPermission(table, role) {
  const args = {
    type: 'pg_drop_select_permission',
    args: {
      source: SOURCE,
      table: { name: table, schema: SCHEMA },
      role: role,
    },
  };

  try {
    await runMetadataQuery(args);
    console.log(`  [DROP] SELECT on ${table} for ${role}`);
    return true;
  } catch (error) {
    // Permission doesn't exist is OK
    return false;
  }
}

async function replaceSelectPermission(table, role, config) {
  await dropSelectPermission(table, role);
  await createSelectPermission(table, role, config);
}

async function createInsertPermission(table, role, config) {
  const args = {
    type: 'pg_create_insert_permission',
    args: {
      source: SOURCE,
      table: { name: table, schema: SCHEMA },
      role: role,
      permission: {
        columns: config.columns,
        check: config.check,
      },
    },
  };

  try {
    const result = await runMetadataQuery(args);
    if (result.skipped) {
      console.log(`  [SKIP] INSERT on ${table} for ${role} (already exists)`);
    } else {
      console.log(`  [OK]   INSERT on ${table} for ${role}`);
    }
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`  [SKIP] INSERT on ${table} for ${role} (already exists)`);
    } else {
      console.error(`  [FAIL] INSERT on ${table} for ${role}:`, error.message);
    }
  }
}

async function createUpdatePermission(table, role, config) {
  const args = {
    type: 'pg_create_update_permission',
    args: {
      source: SOURCE,
      table: { name: table, schema: SCHEMA },
      role: role,
      permission: {
        columns: config.columns,
        filter: config.filter,
        check: null,
      },
    },
  };

  try {
    const result = await runMetadataQuery(args);
    if (result.skipped) {
      console.log(`  [SKIP] UPDATE on ${table} for ${role} (already exists)`);
    } else {
      console.log(`  [OK]   UPDATE on ${table} for ${role}`);
    }
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(`  [SKIP] UPDATE on ${table} for ${role} (already exists)`);
    } else {
      console.error(`  [FAIL] UPDATE on ${table} for ${role}:`, error.message);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('Hasura Permission Setup Script');
  console.log('========================================');
  console.log(`Endpoint: ${METADATA_URL}`);
  console.log(`Roles: ${ROLES.join(', ')}`);
  console.log(`Tables: ${Object.keys(TABLES).join(', ')}`);
  console.log('');

  for (const [table, permissions] of Object.entries(TABLES)) {
    console.log(`\nTable: ${table}`);
    console.log('-'.repeat(40));

    for (const role of ROLES) {
      // SELECT permission
      if (permissions.select) {
        const publicRoles = PUBLIC_SELECT_OVERRIDES[table];
        if (publicRoles && publicRoles.includes(role) && permissions.select.public_filter !== undefined) {
          // These roles get public access (no row filter) for browsing
          await createSelectPermission(table, role, {
            columns: permissions.select.columns,
            filter: permissions.select.public_filter,
          });
        } else {
          await createSelectPermission(table, role, permissions.select);
        }
      }

      // INSERT permission
      if (permissions.insert) {
        await createInsertPermission(table, role, permissions.insert);
      }

      // UPDATE permission
      if (permissions.update) {
        await createUpdatePermission(table, role, permissions.update);
      }
    }
  }

  // Phase 2: Replace existing SELECT permissions that need public access
  // (These were previously created with row-level filter, now need to be open for browsing)
  console.log('\n\nPhase 2: Replacing SELECT permissions for cross-role visibility');
  console.log('='.repeat(50));

  for (const [table, publicRoles] of Object.entries(PUBLIC_SELECT_OVERRIDES)) {
    const permissions = TABLES[table];
    if (!permissions?.select?.public_filter === undefined) continue;

    for (const role of publicRoles) {
      if (!ROLES.includes(role)) continue;
      console.log(`  Replacing SELECT on ${table} for ${role} (public access)...`);
      await replaceSelectPermission(table, role, {
        columns: permissions.select.columns,
        filter: permissions.select.public_filter,
      });
    }
  }

  console.log('\n========================================');
  console.log('Permission setup complete!');
  console.log('========================================');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
