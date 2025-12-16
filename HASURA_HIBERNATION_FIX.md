# Hasura Project Not Reachable - Fix Guide

## Error
```
Unable to load this project
It looks like the project you tried to access is not live!
```

## Causes

1. **Project Hibernated** - Hasura Cloud hibernates free-tier projects after inactivity
2. **Project Still Starting** - If just created, might need a few minutes
3. **Configuration Error** - Database connection or environment variable issue

## Solutions

### Solution 1: Wake Up Hibernated Project

**Step 1: Check Project Status**
1. Go to [Hasura Cloud Dashboard](https://cloud.hasura.io/projects)
2. Find your project: `0d275914-99de-410f-aa51-8b81ae03f9fe`
3. Check the status indicator:
   - 🟢 Green = Active
   - 🟡 Yellow = Hibernated
   - 🔴 Red = Error

**Step 2: Wake Up Project**
If status shows hibernated:
1. Click on the project
2. Look for a "Wake Up" or "Resume" button
3. Click it and wait 1-2 minutes for the project to start

**OR** Simply access the Console URL:
- Open: https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/console
- This should automatically wake up the project
- Wait 1-2 minutes for it to start

### Solution 2: Check Project Health

1. Go to [Project Settings](https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/settings)
2. Click on **Health** or **Logs** tab
3. Look for any errors in the logs
4. Common issues:
   - Database connection failed
   - Missing environment variables
   - Invalid admin secret

### Solution 3: Verify Database Connection

The database connection issue we fixed earlier might need verification:

1. Go to Hasura Console → Data tab
2. Check if database "supabase-postgres" shows as connected
3. If not connected, re-add the connection pooler string:
   ```
   postgresql://postgres.kstoksqbhmxnrmspfywm:ZOqYmq7dEJjZ1pBw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

### Solution 4: Manual Introspection (Workaround)

If the project won't wake up, we can use introspection file instead:

**Step 1: Download Schema via Hasura Console**
1. Once project is awake, go to Console → API tab
2. Click on the "Explorer" button
3. In the GraphiQL interface, run this introspection query:

```graphql
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      ...FullType
    }
    directives {
      name
      description
      locations
      args {
        ...InputValue
      }
    }
  }
}

fragment FullType on __Type {
  kind
  name
  description
  fields(includeDeprecated: true) {
    name
    description
    args {
      ...InputValue
    }
    type {
      ...TypeRef
    }
    isDeprecated
    deprecationReason
  }
  inputFields {
    ...InputValue
  }
  interfaces {
    ...TypeRef
  }
  enumValues(includeDeprecated: true) {
    name
    description
    isDeprecated
    deprecationReason
  }
  possibleTypes {
    ...TypeRef
  }
}

fragment InputValue on __InputValue {
  name
  description
  type { ...TypeRef }
  defaultValue
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
              }
            }
          }
        }
      }
    }
  }
}
```

**Step 2: Save Introspection Result**
1. Copy the JSON result
2. Save it as `schema.json` in your project root

**Step 3: Update codegen.yml**
```yaml
overwrite: true
schema: './schema.json'  # Use local file instead of URL
documents: 'packages/api-client/src/graphql/**/*.graphql'
# ... rest of config
```

**Step 4: Run codegen**
```bash
pnpm codegen
```

### Solution 5: Use Hasura CLI for Introspection

**Install Hasura CLI:**
```bash
npm install --global hasura-cli
```

**Export Schema:**
```bash
hasura metadata export --endpoint https://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app --admin-secret YOUR_SECRET
```

## Recommended Steps

**Try these in order:**

1. **Wait 2 minutes** - Project might just be starting up
2. **Access Console URL** - https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/console
3. **Check Dashboard** - https://cloud.hasura.io/projects
4. **Wake up project** if hibernated
5. **Try codegen again** after project is active
6. **Check logs** for any errors

## Quick Fix Command

Try accessing the GraphQL endpoint directly to wake it up:

```bash
# Test if endpoint is accessible (replace YOUR_SECRET)
curl -X POST \
  -H "x-hasura-admin-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}' \
  https://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql
```

If you get a JSON response (not HTML), the project is awake. Try `pnpm codegen` again.

## Free Tier Limitations

Hasura Cloud free tier:
- Hibernates after 5 days of inactivity
- Takes 1-2 minutes to wake up
- Consider upgrading for production use

## After Project is Awake

Once the project shows as active (green status):

1. Wait 1-2 minutes for full startup
2. Test in browser: https://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql
3. Run `pnpm codegen` again

## Alternative: Create New Project

If project won't wake up:

1. Create a new Hasura Cloud project
2. Connect to same Supabase database
3. Update endpoints in .env and codegen.yml
4. Try codegen again

---

**Next Step:** Go to [Hasura Cloud Dashboard](https://cloud.hasura.io/projects) and check your project status.
