# Hasura Connection Details - VERIFIED

**Date:** 2025-11-09
**Status:** ✅ Connection String Ready

---

## Your Hasura Project

**Project ID:** `0d275914-99de-410f-aa51-8b81ae03f9fe`
**Console URL:** https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/console

**GraphQL Endpoints:**
- **HTTP:** `https://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql`
- **WebSocket:** `wss://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql`

---

## Supabase Database Connection

**Connection String:**
```
postgresql://postgres:ZOqYmq7dEJjZ1pBw@db.kstoksqbhmxnrmspfywm.supabase.co:5432/postgres?sslmode=require
```

**Database Details:**
- **Host:** `db.kstoksqbhmxnrmspfywm.supabase.co`
- **Port:** `5432`
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** `ZOqYmq7dEJjZ1pBw`
- **SSL Mode:** `require`

---

## ✅ Next Steps in Hasura Console

You're at: https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/console/data/v2/manage/database/add

### Step 1: Connect Database

1. On the "Add Database" page, you should see:
   - **Database Display Name:** Enter `supabase-postgres`
   - **Data Source Driver:** Select `PostgreSQL`
   - **Connect Database Via:** Select `Database URL`

2. **Paste your connection string:**
   ```
   postgresql://postgres:ZOqYmq7dEJjZ1pBw@db.kstoksqbhmxnrmspfywm.supabase.co:5432/postgres?sslmode=require
   ```

3. Click **"Connect Database"**

4. ✅ You should see "Connection successful!"

---

### Step 2: Track All Tables

Once connected:

1. Click on **"public"** schema in the left sidebar
2. You'll see all your tables:
   - `profiles`
   - `maids`
   - `sponsors`
   - `agencies`
   - `jobs`
   - `bookings`
   - `messages`
   - `payments`
   - `applications`
   - `reviews`
   - etc.

3. Click the **"Track All"** button at the top
4. Confirm tracking all tables
5. Wait for all tables to be tracked (checkmarks appear)

---

### Step 3: Track Relationships

1. Look for **"Untracked foreign-key relationships"** banner
2. Click **"Track All"**
3. Hasura will auto-create relationships based on your foreign keys

**Common relationships that will be created:**
- `maids.profile` → `profiles`
- `jobs.maid` → `maids`
- `jobs.sponsor` → `sponsors`
- `bookings.maid` → `maids`
- `bookings.sponsor` → `sponsors`
- `messages.sender` → `profiles`
- `messages.receiver` → `profiles`

---

### Step 4: Configure JWT Authentication

#### 4.1 Get Supabase JWT Secret

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `kstoksqbhmxnrmspfywm`
3. Click **Settings** → **API**
4. Scroll to **"JWT Settings"**
5. **Copy the JWT Secret** (it's a long base64-encoded string)

#### 4.2 Add to Hasura Environment Variables

1. In Hasura Cloud Dashboard, click your project name
2. Go to **"Env vars"** tab
3. Click **"New Env Var"**

**Add these 3 environment variables:**

**Variable 1: HASURA_GRAPHQL_JWT_SECRET**
```json
{
  "type": "HS256",
  "key": "OlNwAKydoA25Y3iBTptC9QQ5kElMAnBZAqXMsHjTzncxjwIxhqON/QevfxClgHI3l1jwPD735Mj8ur0prOLZfA==
"
}
```
Replace `YOUR_SUPABASE_JWT_SECRET_HERE` with the secret from Supabase

**Variable 2: HASURA_GRAPHQL_UNAUTHORIZED_ROLE**
```
anonymous
```

**Variable 3: HASURA_GRAPHQL_ADMIN_SECRET**
```
Generate a strong secret (e.g., use: openssl rand -hex 32)
```
Save this secret - you'll need it for GraphQL Code Generator

4. Click **"Add"** for each
5. Click **"Restart"** when prompted

---

### Step 5: Set Up Basic Permissions

#### For `profiles` table:

1. Go to `profiles` table → **Permissions** tab
2. Enter role: `authenticated`
3. Click **Select** operation

**Configure Select (Read) Permission:**
- **Row select permissions:**
  ```json
  {
    "id": {
      "_eq": "X-Hasura-User-Id"
    }
  }
  ```
- **Column permissions:** Select all columns except sensitive ones
- Click **Save Permissions**

4. Click **Update** operation

**Configure Update Permission:**
- **Row update permissions:**
  ```json
  {
    "id": {
      "_eq": "X-Hasura-User-Id"
    }
  }
  ```
- **Column permissions:** Select fields users can update (exclude `id`, `created_at`)
- Click **Save Permissions**

5. Repeat for `maid`, `sponsor`, `agency` roles with appropriate permissions

---

### Step 6: Test Your Setup

1. Go to **"API"** tab in Hasura Console
2. Try this test query:

```graphql
query TestConnection {
  profiles(limit: 5) {
    id
    full_name
    email
    role
  }
}
```

3. Click **Execute Query**
4. ✅ You should see your profile data!

---

## 🎯 Update Your Local Environment

Add to `apps/web/.env`:

```env
# Hasura GraphQL Endpoints
VITE_HASURA_GRAPHQL_ENDPOINT=https://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql
VITE_HASURA_WS_ENDPOINT=wss://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql

# For GraphQL Code Generator (development only)
HASURA_ADMIN_SECRET=<your-generated-admin-secret>
```

---

## ✅ Verification Checklist

- [ ] Database connected successfully
- [ ] All tables tracked (67+ tables)
- [ ] Relationships auto-tracked
- [ ] JWT secret configured
- [ ] Admin secret set
- [ ] Basic permissions configured for `profiles` table
- [ ] Test query executed successfully
- [ ] Environment variables added to `.env`

---

## 🚀 Ready for Code Generation!

Once all steps are complete, proceed to:
1. Create GraphQL queries
2. Set up Code Generator
3. Generate TypeScript types

See: **PHASE_2_STATUS.md** for next steps

---

## Quick Reference

**Your Endpoints:**
```typescript
// HTTP Endpoint
const GRAPHQL_ENDPOINT = 'https://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql';

// WebSocket Endpoint (for subscriptions)
const WS_ENDPOINT = 'wss://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql';
```

**Hasura Console:**
https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/console
