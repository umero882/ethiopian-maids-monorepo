# Setting Up Environment Variables

## Get Your Hasura Admin Secret

**Option 1: From Hasura Cloud Console**
1. Go to https://cloud.hasura.io/project/0d275914-99de-410f-aa51-8b81ae03f9fe/settings
2. Click on **Env vars** tab
3. Look for `HASURA_GRAPHQL_ADMIN_SECRET`
4. Copy the value (it should be a long random string)

**Option 2: Create a New One**
If you don't see an admin secret:
1. In Hasura Console → Settings → Env vars
2. Click **+ New Env Var**
3. Key: `HASURA_GRAPHQL_ADMIN_SECRET`
4. Value: Generate a strong password (e.g., use a password generator)
5. Click **Add**

## Create .env File

Once you have the admin secret, create a `.env` file:

**On Windows (Command Prompt):**
```cmd
cd C:\Users\umera\OneDrive\Documents\ethiopian-maids-monorepo

REM Copy the example file
copy .env.example .env

REM Then edit .env file and replace 'your_hasura_admin_secret_here' with your actual secret
notepad .env
```

**On Windows (PowerShell):**
```powershell
cd C:\Users\umera\OneDrive\Documents\ethiopian-maids-monorepo

# Copy the example file
Copy-Item .env.example .env

# Then edit .env file
notepad .env
```

**On Git Bash:**
```bash
cd /c/Users/umera/OneDrive/Documents/ethiopian-maids-monorepo

# Copy the example file
cp .env.example .env

# Edit the file
nano .env
# or
code .env
```

## What to Put in .env

Your `.env` file should look like this:

```env
# Supabase Configuration (Keep from Phase 1)
VITE_SUPABASE_URL=https://kstoksqbhmxnrmspfywm.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Hasura GraphQL Configuration (Phase 2)
VITE_HASURA_GRAPHQL_ENDPOINT=https://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql
VITE_HASURA_WS_ENDPOINT=wss://0d275914-99de-410f-aa51-8b81ae03f9fe.hasura.app/v1/graphql

# Hasura Admin Secret (For development/codegen - DO NOT COMMIT)
HASURA_ADMIN_SECRET=paste_your_actual_admin_secret_here

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key_here
```

**Replace:**
- `your_supabase_anon_key_here` with your actual Supabase anon key (if you have it)
- `paste_your_actual_admin_secret_here` with the Hasura admin secret you copied
- Other placeholder values as needed

## Verify .env File

Check that the file was created and has the admin secret:

```bash
cd /c/Users/umera/OneDrive/Documents/ethiopian-maids-monorepo

# Check if .env exists
ls -la .env

# View the file (be careful not to share this!)
cat .env
```

## Security Note

**IMPORTANT:**
- `.env` file should be in `.gitignore` (already is)
- NEVER commit `.env` to git
- NEVER share your admin secret publicly
- The admin secret gives full access to your Hasura instance

## Next Step

After creating the .env file with your admin secret, run:

```bash
pnpm codegen
```

This will generate TypeScript types from your GraphQL schema!
