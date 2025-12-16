# Hasura Cloud Setup Guide - Phase 2

**Project:** Ethiopian Maids Monorepo
**Phase:** 2 - GraphQL Layer
**Date:** 2025-11-09

---

## Overview

This guide walks you through setting up Hasura GraphQL Engine on top of your existing Supabase PostgreSQL database.

**Architecture:**
```
React App → Apollo Client → Hasura GraphQL → Supabase PostgreSQL
                                    ↓
                            Supabase Auth (JWT)
```

---

## Prerequisites

✅ Phase 1 completed (monorepo building successfully)
✅ Existing Supabase project with PostgreSQL database
✅ Supabase connection string (from Supabase dashboard)
✅ Email for Hasura Cloud account

---

## Step 1: Create Hasura Cloud Account

### 1.1 Sign Up
1. Go to https://cloud.hasura.io/signup
2. Sign up with GitHub or Email
3. Verify your email

### 1.2 Create New Project
1. Click "Create New Project"
2. **Project Name:** `ethiopian-maids-prod`
3. **Region:** Choose closest to your users (e.g., AWS US-East for USA)
4. **Plan:** Start with Free tier (can upgrade later)
5. Click "Create Project"

**⏱ Wait ~2-3 minutes** for project to provision

---

## Step 2: Get Supabase Connection String

### 2.1 From Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your Ethiopian Maids project
3. Click "Settings" (gear icon) → "Database"
4. Scroll to "Connection string" section
5. **Select "URI"** (not "Connection pooling")
6. **Copy the connection string** - looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

### 2.2 Important Notes
- ⚠️ Replace `[YOUR-PASSWORD]` with your actual database password
- ⚠️ Keep this string secret (never commit to git)
- ℹ️ Port is `5432` (direct connection)

---

## Step 3: Connect Hasura to Supabase

### 3.1 Add Database to Hasura
1. In Hasura Cloud console, click "Launch Console"
2. Go to "Data" tab
3. Click "Connect Database"
4. **Database Display Name:** `supabase-postgres`
5. **Data Source Driver:** PostgreSQL
6. **Connect Database Via:** Database URL

### 3.2 Enter Connection String
Paste your Supabase connection string:
```
postgresql://postgres:YOUR_PASSWORD@db.kstoksqbhmxnrmspfywm.supabase.co:5432/postgres?sslmode=require
```

**Important:** Add `?sslmode=require` at the end if not present

7. Click "Connect Database"

### 3.3 Verify Connection
✅ You should see "Connection successful"
✅ Database appears in left sidebar under "Data"

---

## Step 4: Track All Tables

### 4.1 Public Schema Tables
1. In Hasura Console → Data tab
2. Click "public" schema
3. You should see all your tables:
   - `profiles`
   - `maids`
   - `sponsors`
   - `agencies`
   - `jobs`
   - `bookings`
   - `messages`
   - `payments`
   - etc.

### 4.2 Track Tables
**Option A: Track All (Recommended)**
1. Click "Track All" button at the top
2. Confirm tracking all tables
3. Wait for all tables to be tracked

**Option B: Track Individually**
1. For each table, click "Track"
2. Repeat for all tables

### 4.3 Verify Tracking
✅ All tables should have checkmark ✓
✅ Click on any table → should see "Browse Rows" and schema

---

## Step 5: Configure Relationships

Hasura auto-detects foreign keys and suggests relationships.

### 5.1 Auto-Track Relationships
1. In Data tab, look for "Untracked foreign-key relationships" banner
2. Click "Track All"
3. Hasura will create relationships based on foreign keys

### 5.2 Common Relationships to Verify

**Example: `maids` table**
- `maid.profile` → `profiles` (object relationship via `profile_id`)
- `maid.jobs` → `jobs` (array relationship via `maid_id`)
- `maid.bookings` → `bookings` (array relationship)

**Example: `jobs` table**
- `job.maid` → `maids` (object relationship)
- `job.sponsor` → `sponsors` (object relationship)
- `job.applications` → `applications` (array relationship)

### 5.3 Manual Relationship (if needed)
If auto-tracking missed any:
1. Click on table
2. Go to "Relationships" tab
3. Click "Add" → Choose relationship type
4. Configure foreign key mapping

---

## Step 6: Configure Supabase Authentication

### 6.1 Get Supabase JWT Secret
1. Go to Supabase Dashboard → Settings → API
2. Scroll to "JWT Settings"
3. **Copy** the `JWT Secret` (looks like a long string)

### 6.2 Add JWT Config to Hasura
1. In Hasura Cloud Dashboard (not console), click your project
2. Go to "Env vars" tab
3. Click "New Env Var"

**Add these variables:**

**Variable 1: HASURA_GRAPHQL_JWT_SECRET**
```json
{
  "type": "HS256",
  "key": "YOUR_SUPABASE_JWT_SECRET_HERE"
}
```
Replace `YOUR_SUPABASE_JWT_SECRET_HERE` with the secret from step 6.1

**Variable 2: HASURA_GRAPHQL_UNAUTHORIZED_ROLE**
Value: `anonymous`

**Variable 3: HASURA_GRAPHQL_ADMIN_SECRET**
Value: Create a strong random string (e.g., `openssl rand -hex 32`)

4. Click "Add" for each
5. **Restart Hasura** (button appears after adding env vars)

---

## Step 7: Set Up Permissions

### 7.1 Understand Roles
Based on Supabase Auth, you have these roles:
- `authenticated` - Logged-in users
- `maid` - Maids
- `sponsor` - Sponsors
- `agency` - Agencies
- `admin` - Administrators
- `anonymous` - Not logged in

### 7.2 Example: Configure `profiles` Table Permissions

**For `maid` role:**
1. Go to `profiles` table → Permissions tab
2. Click `maid` role → Insert
3. **Row insert permissions:**
   ```json
   {
     "id": {
       "_eq": "X-Hasura-User-Id"
     },
     "role": {
       "_eq": "maid"
     }
   }
   ```
4. **Column permissions:** Select relevant columns
5. Repeat for Select, Update, Delete operations

**For `select` (read):**
- Row: `{ "id": { "_eq": "X-Hasura-User-Id" } }`
- Columns: All except sensitive fields

**For `update`:**
- Row: `{ "id": { "_eq": "X-Hasura-User-Id" } }`
- Columns: Fields user can update

**For `delete`:**
- Usually restricted or `{ "id": { "_eq": "X-Hasura-User-Id" } }`

### 7.3 Test Permissions
1. Go to GraphiQL tab (API explorer)
2. Add header:
   ```json
   {
     "Authorization": "Bearer YOUR_SUPABASE_JWT_TOKEN"
   }
   ```
3. Run test query:
   ```graphql
   query {
     profiles {
       id
       full_name
       role
     }
   }
   ```

---

## Step 8: Get Hasura GraphQL Endpoint

### 8.1 Copy Endpoint URL
1. Hasura Cloud Dashboard → Your Project
2. Copy the "GraphQL Endpoint" URL
3. Format: `https://your-project.hasura.app/v1/graphql`

### 8.2 Save to Environment Variables
Add to `apps/web/.env`:
```env
VITE_HASURA_GRAPHQL_ENDPOINT=https://your-project.hasura.app/v1/graphql
VITE_HASURA_WS_ENDPOINT=wss://your-project.hasura.app/v1/graphql
```

---

## Step 9: Test GraphQL API

### 9.1 Using Hasura Console
1. Go to "API" tab in Hasura Console
2. Try this query:
   ```graphql
   query GetMaids {
     maids(limit: 10) {
       id
       profile {
         full_name
         email
       }
       skills
       experience_years
     }
   }
   ```

### 9.2 Expected Response
```json
{
  "data": {
    "maids": [
      {
        "id": "...",
        "profile": {
          "full_name": "...",
          "email": "..."
        },
        "skills": [...],
        "experience_years": 5
      }
    ]
  }
}
```

✅ If you see data, Hasura is working!

---

## Step 10: Enable Real-Time Subscriptions

### 10.1 Test Subscription
```graphql
subscription OnNewMessages {
  messages(
    order_by: { created_at: desc }
    limit: 1
  ) {
    id
    content
    created_at
    sender {
      full_name
    }
  }
}
```

### 10.2 Verify
- Should see live updates when new messages are created
- WebSocket connection established

---

## Troubleshooting

### Issue: "Connection failed"
**Solution:**
- Check connection string is correct
- Verify `?sslmode=require` is appended
- Ensure Supabase database password is correct
- Check Supabase database is not paused (free tier)

### Issue: "No tables visible"
**Solution:**
- Verify you're looking at `public` schema
- Check database user has correct permissions
- Try refreshing the Data tab

### Issue: "JWT verification failed"
**Solution:**
- Double-check JWT secret matches Supabase
- Ensure JSON format is correct in env var
- Restart Hasura after changing env vars

### Issue: "Permission denied"
**Solution:**
- Check role is being passed correctly in JWT
- Verify permissions are configured for the role
- Test with a simpler permission rule first

---

## Security Checklist

- [ ] Admin secret is strong and secret
- [ ] JWT secret matches Supabase
- [ ] Permissions configured for all roles
- [ ] Sensitive columns excluded from public queries
- [ ] Rate limiting configured (Hasura Cloud settings)
- [ ] CORS configured properly
- [ ] Environment variables not committed to git

---

## Next Steps

Once Hasura is set up:

1. ✅ **Create `@ethio/api-client` package**
2. ✅ **Set up GraphQL Code Generator**
3. ✅ **Configure Apollo Client**
4. ✅ **Migrate first queries**

See: `PHASE_2_IMPLEMENTATION_GUIDE.md`

---

## Useful Resources

- **Hasura Docs:** https://hasura.io/docs
- **Supabase Auth + Hasura:** https://hasura.io/docs/latest/auth/authentication/supabase/
- **GraphQL Permissions:** https://hasura.io/docs/latest/auth/authorization/
- **Hasura Cloud Console:** https://cloud.hasura.io

---

## Summary

**What you configured:**
✅ Hasura Cloud project created
✅ Connected to Supabase PostgreSQL
✅ All tables tracked
✅ Relationships configured
✅ Supabase Auth JWT integration
✅ Role-based permissions
✅ Real-time subscriptions enabled

**Your GraphQL endpoint:**
`https://your-project.hasura.app/v1/graphql`

**Ready for Phase 2 development!** 🚀
