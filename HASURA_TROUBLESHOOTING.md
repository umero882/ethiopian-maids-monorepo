# Hasura Project Not Starting - Troubleshooting

## Current Issue

Your Hasura project shows "Project not reachable" even after upgrading to paid tier.

## Possible Causes

1. **Database Connection Failed** - Most likely cause
2. **Project Configuration Error**
3. **Environment Variable Issue**
4. **Region/Network Issue**

## Solution Steps

### Step 1: Check Project Status in Dashboard

1. Go to https://cloud.hasura.io/projects
2. Find project `0d275914-99de-410f-aa51-8b81ae03f9fe`
3. Check the status indicator

**If showing RED (Error):**
- Click on the project
- Check the **Logs** tab for error messages
- Look for database connection errors

**If showing YELLOW (Starting):**
- Wait 2-3 more minutes
- Refresh the page

**If showing GREEN (Active) but still not reachable:**
- There's a DNS or routing issue
- Try accessing directly via API tab

### Step 2: Check Project Logs

1. Go to project page: https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe
2. Click **Settings** → **Logs**
3. Look for errors like:
   - "connection to database failed"
   - "could not connect to postgres"
   - "authentication failed"

### Step 3: Verify Database Connection

The issue is likely with the database connection. Try reconnecting:

1. Go to Console (or try to): https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/console
2. If console loads:
   - Go to **Data** tab
   - Check if database is connected
   - If not, reconnect using pooler string

3. If console doesn't load:
   - The project can't start without a working database
   - Need to fix via project settings

### Step 4: Fix Database Connection via Settings

If you can't access the console:

1. Go to https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/settings
2. Click on **Env vars** tab
3. Look for database URL environment variable
4. Update it to use the Supabase connection pooler:

```
postgresql://postgres.kstoksqbhmxnrmspfywm:ZOqYmq7dEJjZ1pBw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### Step 5: Alternative - Create Fresh Project

If the project won't start, create a new one:

1. Go to https://cloud.hasura.io/projects
2. Click **New Project**
3. Choose same region (ap-south-1 Mumbai)
4. Connect to Supabase database using pooler string
5. Update endpoints in your monorepo

**Pros:**
- Fresh start, no configuration errors
- Known working setup

**Cons:**
- Need to update all endpoints
- Lose any custom Hasura configuration

## Temporary Workaround: Use Schema Introspection File

While we fix the Hasura issue, we can generate types from a schema file:

### Option 1: Export Schema from Supabase

If you have direct Supabase access:

1. Install Hasura CLI:
```bash
npm install -g hasura-cli
```

2. Create introspection file:
```bash
hasura metadata export \
  --endpoint https://kstoksqbhmxnrmspfywm.supabase.co \
  --admin-secret your_supabase_service_key
```

### Option 2: Manually Create Schema File

Create a minimal schema to unblock development:

1. Create `schema.graphql` in project root:
```graphql
type profiles {
  id: uuid!
  full_name: String
  email: String
  role: String
  avatar_url: String
  created_at: timestamptz
}

type maids {
  id: uuid!
  profile_id: uuid
  profile: profiles
  skills: jsonb
  experience_years: Int
  languages: jsonb
  availability_status: String
  hourly_rate: numeric
  monthly_rate: numeric
}

type messages {
  id: uuid!
  content: String!
  sender_id: uuid!
  receiver_id: uuid!
  sender: profiles
  receiver: profiles
  read: Boolean
  created_at: timestamptz
}

type Query {
  profiles(limit: Int, offset: Int, where: profiles_bool_exp): [profiles!]!
  profiles_by_pk(id: uuid!): profiles
  maids(limit: Int, offset: Int, where: maids_bool_exp): [maids!]!
  maids_by_pk(id: uuid!): maids
  messages(limit: Int, offset: Int): [messages!]!
}

type Mutation {
  insert_messages_one(object: messages_insert_input!): messages
  update_profiles_by_pk(pk_columns: profiles_pk_columns_input!, _set: profiles_set_input!): profiles
}

type Subscription {
  messages(where: messages_bool_exp): [messages!]!
}

scalar uuid
scalar timestamptz
scalar jsonb
scalar numeric

input profiles_bool_exp {
  id: uuid_comparison_exp
  email: String_comparison_exp
}

input maids_bool_exp {
  availability_status: String_comparison_exp
}

input messages_bool_exp {
  sender_id: uuid_comparison_exp
  receiver_id: uuid_comparison_exp
}

input uuid_comparison_exp {
  _eq: uuid
}

input String_comparison_exp {
  _eq: String
  _ilike: String
}

input profiles_pk_columns_input {
  id: uuid!
}

input profiles_set_input {
  full_name: String
  email: String
}

input messages_insert_input {
  content: String!
  sender_id: uuid!
  receiver_id: uuid!
}
```

2. Update `codegen.yml`:
```yaml
schema: './schema.graphql'  # Use local file instead of URL
documents: 'packages/api-client/src/graphql/**/*.graphql'
# ... rest stays the same
```

3. Run codegen:
```bash
pnpm codegen
```

This will let you continue development while we fix Hasura!

## Recommended Action

**BEST APPROACH:**

1. Check project logs in Hasura dashboard
2. If database connection error → fix the database URL
3. If that doesn't work → create new Hasura project
4. Update monorepo endpoints to new project

**QUICK WORKAROUND:**

Use the schema file approach above to unblock development now, fix Hasura later.

## Contact Support

If nothing works:
1. Go to https://cloud.hasura.io/support/create-ticket
2. Mention:
   - Project ID: 0d275914-99de-410f-aa51-8b81ae03f9fe
   - Issue: "Project not reachable after upgrade to paid tier"
   - Database: Supabase PostgreSQL

---

Let me know what you see in the project dashboard and we'll fix this!
