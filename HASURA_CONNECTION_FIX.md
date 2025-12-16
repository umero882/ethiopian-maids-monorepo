# Hasura Connection Error - Fix Guide

## Error Encountered
```
connection to server at "db.kstoksqbhmxnrmspfywm.supabase.co" (2406:da1a:6b0:f614:5baa:f58e:ea9e:7110), port 5432 failed: Network is unreachable
```

## Issue
Hasura is trying to connect via IPv6, but the network isn't reachable. This is a common issue with Supabase and Hasura Cloud.

## Solutions (Try in Order)

### Solution 1: Use Supabase Connection Pooler (RECOMMENDED)

Supabase provides a connection pooler specifically for external connections like Hasura.

**Connection String to Use:**
```
postgresql://postgres.kstoksqbhmxnrmspfywm:ZOqYmq7dEJjZ1pBw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**Key Changes:**
- Host: `aws-0-ap-south-1.pooler.supabase.com` (pooler, not direct DB)
- Port: `6543` (pooler port, not 5432)
- Database: `postgres`
- **Remove** `?sslmode=require` for now (test without it first)

### Solution 2: Use Transaction Mode Pooler

If Solution 1 doesn't work, try the transaction pooler:

```
postgresql://postgres.kstoksqbhmxnrmspfywm:ZOqYmq7dEJjZ1pBw@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

### Solution 3: Get Direct Database URL from Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/project/kstoksqbhmxnrmspfywm/settings/database)
2. Navigate to: **Settings** → **Database** → **Connection String**
3. Select "URI" tab
4. Copy the **Connection Pooling** string (Session mode)
5. Use that exact string in Hasura

### Solution 4: Use IPv4 Address Directly

If you can find the IPv4 address:

1. Go to Supabase Dashboard → Settings → Database
2. Look for "IPv4 address" or "Direct connection"
3. Use that IP instead of the hostname

### Solution 5: Add SSL Mode Parameters

Try the connection pooler with SSL parameters:

```
postgresql://postgres.kstoksqbhmxnrmspfywm:ZOqYmq7dEJjZ1pBw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require&sslrootcert=rds-ca-2019
```

## Step-by-Step Fix

### Option A: Using Supabase Dashboard (Easiest)

1. **Get the Correct Connection String:**
   - Open [Supabase Dashboard](https://app.supabase.com/project/kstoksqbhmxnrmspfywm/settings/database)
   - Click on **Settings** (gear icon in sidebar)
   - Click on **Database**
   - Scroll to **Connection String** section
   - Click on **URI** tab
   - **Copy the "Connection Pooling" string** (this is what you need for Hasura)

2. **Add to Hasura:**
   - Go to [Hasura Console](https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/console)
   - Click **Data** → **Manage** → **Connect Database**
   - Paste the connection pooling string from Supabase
   - Give it a name: `supabase-postgres`
   - Click **Connect Database**

### Option B: Manual Configuration

If you can't access Supabase Dashboard, use this pooler connection string:

```
postgresql://postgres.kstoksqbhmxnrmspfywm:ZOqYmq7dEJjZ1pBw@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**In Hasura Console:**
1. Go to Data → Manage Databases
2. If database exists, click "Edit" and update the connection string
3. If not, click "Connect Database" and add the new string
4. Test the connection

## Verify Connection Region

Your Supabase project appears to be in `ap-south-1` (Mumbai, India).

Make sure the pooler hostname matches:
- `aws-0-ap-south-1.pooler.supabase.com` for ap-south-1

If your project is in a different region, adjust accordingly:
- `aws-0-us-east-1.pooler.supabase.com` for US East
- `aws-0-eu-west-1.pooler.supabase.com` for EU West
- etc.

## Common Mistakes to Avoid

❌ **Don't use:** Direct database connection (db.kstoksqbhmxnrmspfywm.supabase.co:5432)
✅ **Do use:** Connection pooler (aws-0-ap-south-1.pooler.supabase.com:6543)

❌ **Don't use:** Port 5432 with pooler
✅ **Do use:** Port 6543 for pooler (or 5432 with pgbouncer=true)

❌ **Don't use:** `sslmode=require` initially
✅ **Do use:** Test without SSL first, then add if needed

## Testing the Connection

After connecting, verify it works:

1. In Hasura Console, go to **Data** tab
2. You should see "supabase-postgres" in the left sidebar
3. Click on it
4. You should see your tables listed
5. Try tracking a table (like `profiles`)
6. Run a test query in the GraphiQL explorer

## If Still Not Working

### Check Supabase Network Settings

1. Go to Supabase Dashboard → Settings → Database
2. Look for **Network Restrictions** or **IP Allowlist**
3. Make sure Hasura Cloud IPs are allowed (or allow all IPs for testing)

### Get Hasura Cloud IP Addresses

Hasura Cloud may need to be whitelisted:

1. Go to your [Hasura Cloud Project Settings](https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/settings)
2. Look for "IP Addresses" or "NAT Gateway IPs"
3. Add these IPs to Supabase IP allowlist

### Alternative: Use Hasura Cloud Database

As a temporary workaround, you could:
1. Create a PostgreSQL database in Hasura Cloud
2. Migrate your data from Supabase
3. Use Hasura's built-in database

**Note:** This is NOT recommended for production, just for testing.

## Recommended Solution Summary

**BEST APPROACH:**

1. Get the **Connection Pooling** string from your Supabase Dashboard:
   - Settings → Database → Connection String → URI → **Connection Pooling**

2. Use that exact string in Hasura Console

3. If the string doesn't work, modify it to use the pooler explicitly:
   ```
   postgresql://postgres.kstoksqbhmxnrmspfywm:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

## After Successful Connection

Once connected successfully:

1. Track all your tables in Hasura
2. Set up table relationships
3. Configure permissions
4. Test a GraphQL query
5. Continue with the rest of Phase 2 (run `pnpm codegen`)

## Need More Help?

- Check Supabase documentation: https://supabase.com/docs/guides/database/connecting-to-postgres
- Check Hasura documentation: https://hasura.io/docs/latest/databases/connect-db/
- Look for "connection pooler" in Supabase docs

---

**Updated:** 2025-11-09
**Status:** Troubleshooting IPv6 Connection Issue
