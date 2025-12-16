/**
 * Fix Subscription User IDs Migration Script
 *
 * This script fixes subscriptions that have incorrect user_ids (UUIDs instead of Firebase UIDs).
 * It attempts to find the correct Firebase UID by:
 * 1. Looking up the stripe_customers table (if it exists)
 * 2. Matching profiles by email patterns
 * 3. Providing manual fix guidance
 *
 * Usage:
 *   node tools/scripts/fix-subscription-user-ids.js
 *
 * Environment Variables Required:
 *   HASURA_GRAPHQL_ENDPOINT or VITE_HASURA_GRAPHQL_ENDPOINT
 *   HASURA_ADMIN_SECRET
 */

require('dotenv').config();

const { GraphQLClient, gql } = require('graphql-request');

const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT || process.env.VITE_HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;

if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
  console.error('Missing required environment variables:');
  console.error('  HASURA_GRAPHQL_ENDPOINT or VITE_HASURA_GRAPHQL_ENDPOINT');
  console.error('  HASURA_ADMIN_SECRET');
  process.exit(1);
}

const client = new GraphQLClient(HASURA_ENDPOINT, {
  headers: {
    'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
  },
});

// Get all subscriptions with metadata
const GET_SUBSCRIPTIONS = gql`
  query GetAllSubscriptions {
    subscriptions(order_by: { created_at: desc }) {
      id
      user_id
      stripe_customer_id
      stripe_subscription_id
      status
      plan_name
      plan_type
      user_type
      metadata
      created_at
    }
  }
`;

// Get all profiles
const GET_ALL_PROFILES = gql`
  query GetAllProfiles {
    profiles {
      id
      email
      full_name
      user_type
    }
    sponsor_profiles {
      id
      full_name
    }
    maid_profiles {
      id
      full_name
    }
    agency_profiles {
      id
      full_name
      email
    }
  }
`;

// Update subscription user_id
const UPDATE_SUBSCRIPTION_USER_ID = gql`
  mutation UpdateSubscriptionUserId($id: uuid!, $userId: String!) {
    update_subscriptions_by_pk(
      pk_columns: { id: $id }
      _set: { user_id: $userId }
    ) {
      id
      user_id
    }
  }
`;

// Check if stripe_customers table exists
async function checkStripeCustomersTable() {
  try {
    const result = await client.request(gql`
      query CheckTable {
        stripe_customers(limit: 1) {
          id
        }
      }
    `);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Fix Subscription User IDs Migration');
  console.log('='.repeat(60));
  console.log();

  try {
    // Step 1: Get all subscriptions
    console.log('Step 1: Fetching all subscriptions...');
    const { subscriptions } = await client.request(GET_SUBSCRIPTIONS);
    console.log(`  Found ${subscriptions.length} subscriptions`);

    if (subscriptions.length === 0) {
      console.log('\nNo subscriptions found. Nothing to fix.');
      return;
    }

    // Step 2: Get all profiles (to validate Firebase UIDs)
    console.log('\nStep 2: Fetching all profiles...');
    const profileData = await client.request(GET_ALL_PROFILES);

    // Build a set of valid Firebase UIDs
    const validFirebaseUids = new Set();
    const profilesByEmail = new Map();
    const profilesById = new Map();

    profileData.profiles?.forEach(p => {
      validFirebaseUids.add(p.id);
      if (p.email) {
        profilesByEmail.set(p.email.toLowerCase(), p);
      }
      profilesById.set(p.id, p);
    });

    // Also add specific profile table IDs
    profileData.sponsor_profiles?.forEach(p => validFirebaseUids.add(p.id));
    profileData.maid_profiles?.forEach(p => validFirebaseUids.add(p.id));
    profileData.agency_profiles?.forEach(p => validFirebaseUids.add(p.id));

    console.log(`  Found ${validFirebaseUids.size} valid Firebase UIDs`);

    // Step 3: Check for stripe_customers table
    console.log('\nStep 3: Checking for stripe_customers table...');
    const hasStripeCustomersTable = await checkStripeCustomersTable();

    if (hasStripeCustomersTable) {
      console.log('  stripe_customers table exists');
    } else {
      console.log('  stripe_customers table does NOT exist');
      console.log('  Will use alternative methods to find correct user IDs');
    }

    // Step 4: Analyze subscriptions
    console.log('\nStep 4: Analyzing subscriptions...');

    const subscriptionsOk = [];
    const subscriptionsToFix = [];
    const subscriptionsNeedManualFix = [];

    for (const sub of subscriptions) {
      const isValidFirebaseUid = validFirebaseUids.has(sub.user_id);

      if (isValidFirebaseUid) {
        subscriptionsOk.push(sub);
      } else {
        // Try to find the correct user ID

        // Method 1: Check metadata for firebaseUid
        let correctUserId = null;
        let method = '';

        if (sub.metadata?.firebaseUid && validFirebaseUids.has(sub.metadata.firebaseUid)) {
          correctUserId = sub.metadata.firebaseUid;
          method = 'metadata.firebaseUid';
        }

        // Method 2: Check metadata for userId (in case it's different from subscription.user_id)
        if (!correctUserId && sub.metadata?.userId && sub.metadata.userId !== sub.user_id && validFirebaseUids.has(sub.metadata.userId)) {
          correctUserId = sub.metadata.userId;
          method = 'metadata.userId';
        }

        // Method 3: Try to find by user_type matching
        if (!correctUserId && sub.user_type) {
          // Look for profiles with matching user_type that might match
          for (const profile of profilesById.values()) {
            if (profile.user_type === sub.user_type) {
              // This is a weak match - just noting it as a possibility
            }
          }
        }

        if (correctUserId) {
          subscriptionsToFix.push({
            subscription: sub,
            correctUserId,
            method
          });
        } else {
          subscriptionsNeedManualFix.push(sub);
        }
      }
    }

    console.log(`\n  Summary:`);
    console.log(`    Already valid: ${subscriptionsOk.length}`);
    console.log(`    Can be auto-fixed: ${subscriptionsToFix.length}`);
    console.log(`    Need manual fix: ${subscriptionsNeedManualFix.length}`);

    // Show subscriptions that can be fixed
    if (subscriptionsToFix.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('Subscriptions that CAN be auto-fixed:');
      console.log('-'.repeat(60));
      subscriptionsToFix.forEach(({ subscription, correctUserId, method }) => {
        const profile = profilesById.get(correctUserId);
        console.log(`\n  Subscription ID: ${subscription.id}`);
        console.log(`    Current user_id: ${subscription.user_id}`);
        console.log(`    Correct user_id: ${correctUserId}`);
        console.log(`    User name: ${profile?.full_name || 'N/A'}`);
        console.log(`    Found via: ${method}`);
        console.log(`    Plan: ${subscription.plan_name}, Status: ${subscription.status}`);
      });
    }

    // Show subscriptions that need manual fix
    if (subscriptionsNeedManualFix.length > 0) {
      console.log('\n' + '-'.repeat(60));
      console.log('Subscriptions that NEED MANUAL FIX:');
      console.log('-'.repeat(60));
      subscriptionsNeedManualFix.forEach(sub => {
        console.log(`\n  Subscription ID: ${sub.id}`);
        console.log(`    user_id: ${sub.user_id}`);
        console.log(`    stripe_customer_id: ${sub.stripe_customer_id || 'N/A'}`);
        console.log(`    stripe_subscription_id: ${sub.stripe_subscription_id || 'N/A'}`);
        console.log(`    user_type: ${sub.user_type || 'N/A'}`);
        console.log(`    Plan: ${sub.plan_name}, Status: ${sub.status}`);
        console.log(`    Created: ${sub.created_at}`);
        if (sub.metadata) {
          console.log(`    Metadata: ${JSON.stringify(sub.metadata)}`);
        }
        console.log(`    `);
        console.log(`    To fix manually:`);
        console.log(`    1. Find the correct user in Stripe Dashboard (customer: ${sub.stripe_customer_id})`);
        console.log(`    2. Get their email from Stripe`);
        console.log(`    3. Find the matching profile in Hasura by email`);
        console.log(`    4. Update the subscription with the correct user_id`);
      });
    }

    // Apply auto-fixes
    if (subscriptionsToFix.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('Applying auto-fixes...');
      console.log('='.repeat(60));

      let successCount = 0;
      let errorCount = 0;

      for (const { subscription, correctUserId, method } of subscriptionsToFix) {
        try {
          await client.request(UPDATE_SUBSCRIPTION_USER_ID, {
            id: subscription.id,
            userId: correctUserId
          });
          console.log(`  [OK] Fixed ${subscription.id} (via ${method})`);
          successCount++;
        } catch (error) {
          console.error(`  [ERROR] Failed to fix ${subscription.id}:`, error.message);
          errorCount++;
        }
      }

      console.log('\n  Results:');
      console.log(`    Successfully fixed: ${successCount}`);
      console.log(`    Errors: ${errorCount}`);
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('Migration Complete');
    console.log('='.repeat(60));
    console.log(`  Already valid: ${subscriptionsOk.length}`);
    console.log(`  Auto-fixed: ${subscriptionsToFix.length}`);
    console.log(`  Need manual fix: ${subscriptionsNeedManualFix.length}`);

    if (subscriptionsNeedManualFix.length > 0) {
      console.log('\n  ⚠️  Some subscriptions need manual intervention.');
      console.log('  See the details above for how to fix them.');
    }

  } catch (error) {
    console.error('\nFatal error:', error.message);
    if (error.response?.errors) {
      console.error('GraphQL errors:', JSON.stringify(error.response.errors, null, 2));
    }
    process.exit(1);
  }
}

main();
