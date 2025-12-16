# Hasura Console - GraphQL ProfileService Testing Walkthrough

**Purpose:** Verify the GraphQL ProfileService migration works correctly
**Time Required:** 15-30 minutes
**Difficulty:** Easy

---

## 🚀 Step 1: Access Hasura Console

### Open Hasura Console

**URL:** https://ethio-maids-01.hasura.app/console

### Enter Admin Secret

When prompted, enter:
```
GtTmwvc6ycbRB491SQ7iQnqnMGlg1dHwMCEb0763ogB6Y0ADI0szWUSsbHhmt78F
```

**You should see:** Hasura Console dashboard

---

## 📊 Step 2: Get a Test User ID

Before testing profile queries, we need a real user ID from the database.

### Navigate to Data Tab

1. Click **DATA** tab at the top
2. In the left sidebar, find and click **profiles** table
3. You'll see a list of all profiles

### Copy a User ID

**Look for a user with:**
- `user_type` = `'maid'` (for testing maid profile)
- Copy the `id` value (it's a UUID like: `abc-123-def-456-789`)

**Example:**
```
id: 550e8400-e29b-41d4-a716-446655440000
user_type: maid
email: test@example.com
```

📝 **Write down this user ID - we'll use it in tests!**

---

## 🧪 Step 3: Test GetMaidProfileData Query

### Navigate to API Tab

1. Click **API** tab at the top
2. You'll see a GraphQL query editor

### Paste the Query

Copy and paste this into the query editor (left side):

```graphql
query GetMaidProfileData($userId: uuid!) {
  profiles_by_pk(id: $userId) {
    id
    email
    name
    phone
    country
    avatar_url
    user_type
    created_at
    updated_at
    maid_profiles {
      id
      user_id
      first_name
      middle_name
      last_name
      full_name
      date_of_birth
      marital_status
      nationality
      country
      current_location
      languages
      profile_photo_url
      primary_profession
      skills
      special_skills
      experience_years
      preferred_salary_min
      preferred_salary_max
      availability_status
      about_me
      phone_number
      education_level
      religion
      children_count
      created_at
      updated_at
    }
  }
}
```

### Set Query Variables

In the **Query Variables** section (bottom left), paste:

```json
{
  "userId": "PASTE_YOUR_USER_ID_HERE"
}
```

**Replace** `PASTE_YOUR_USER_ID_HERE` with the actual user ID you copied in Step 2.

### Run the Query

1. Click the **Play** button (▶️) at the top
2. **Expected Result:** You should see profile data in the right panel

**Success looks like:**
```json
{
  "data": {
    "profiles_by_pk": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "test@example.com",
      "name": "Test User",
      "user_type": "maid",
      "maid_profiles": [
        {
          "id": "maid-profile-id",
          "first_name": "Jane",
          "last_name": "Doe",
          "experience_years": 5,
          ...
        }
      ]
    }
  }
}
```

### ✅ Checkpoint 1

**If you see data:** ✅ GetMaidProfileData query works!
**If you see error:** ❌ Check user ID is correct, check admin secret

---

## 🧪 Step 4: Test GetSponsorProfileData Query

### Change the Query

Replace the previous query with:

```graphql
query GetSponsorProfileData($userId: uuid!) {
  profiles_by_pk(id: $userId) {
    id
    email
    name
    phone
    country
    avatar_url
    user_type
    created_at
    updated_at
    sponsor_profile {
      id
      full_name
      phone_number
      city
      country
      address
      household_size
      number_of_children
      children_ages
      required_skills
      preferred_languages
      salary_budget_min
      salary_budget_max
      currency
      religion
      created_at
      updated_at
    }
  }
}
```

### Update Query Variables

1. Go back to **DATA** tab
2. Find a user with `user_type` = `'sponsor'`
3. Copy that user's `id`
4. Update Query Variables:

```json
{
  "userId": "PASTE_SPONSOR_USER_ID_HERE"
}
```

### Run the Query

Click **Play** (▶️)

### ✅ Checkpoint 2

**If you see sponsor data:** ✅ GetSponsorProfileData query works!

---

## 🧪 Step 5: Test UpdateMaidProfileData Mutation

Now let's test if we can UPDATE profile data.

### Paste the Mutation

Replace the query with this mutation:

```graphql
mutation UpdateMaidProfileData(
  $userId: uuid!
  $maidProfileId: uuid!
  $profileData: profiles_set_input!
  $maidData: maid_profiles_set_input!
) {
  update_profiles_by_pk(
    pk_columns: { id: $userId }
    _set: $profileData
  ) {
    id
    name
    updated_at
  }

  update_maid_profiles_by_pk(
    pk_columns: { id: $maidProfileId }
    _set: $maidData
  ) {
    id
    user_id
    experience_years
    updated_at
  }
}
```

### Set Mutation Variables

**Important:** You need both `userId` AND `maidProfileId`

1. Use the maid user ID from Step 3
2. Use the maid_profile ID from the maid_profiles array you got in Step 3

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "maidProfileId": "maid-profile-uuid-here",
  "profileData": {
    "name": "Jane Doe Updated"
  },
  "maidData": {
    "experience_years": 10
  }
}
```

### Run the Mutation

Click **Play** (▶️)

### Expected Result

```json
{
  "data": {
    "update_profiles_by_pk": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Jane Doe Updated",
      "updated_at": "2025-11-10T10:45:00.000Z"
    },
    "update_maid_profiles_by_pk": {
      "id": "maid-profile-uuid",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "experience_years": 10,
      "updated_at": "2025-11-10T10:45:00.000Z"
    }
  }
}
```

### ✅ Checkpoint 3

**If you see updated data:** ✅ UpdateMaidProfileData mutation works!

---

## 🔍 Step 6: Verify Data Persisted

Let's confirm the update actually saved to the database.

### Go to DATA Tab

1. Click **DATA** tab
2. Click **maid_profiles** table
3. Find the row with your `maidProfileId`
4. Check the `experience_years` column

**You should see:** `10` (the value you just updated)

**Also check:** `updated_at` timestamp should be recent

### ✅ Checkpoint 4

**If you see the updated value:** ✅ Data persistence works!

---

## 📊 Step 7: Test All Profile Types

Repeat the tests for:

### Agency Profiles

```graphql
query GetAgencyProfileData($userId: uuid!) {
  profiles_by_pk(id: $userId) {
    id
    email
    name
    user_type
    agency_profile {
      id
      agency_name
      license_number
      business_email
      business_phone
      address
      city
      country
      created_at
      updated_at
    }
  }
}
```

**Find a user with** `user_type` = `'agency'` in DATA tab

---

## ✅ Final Checklist

### GraphQL Queries

- [ ] GetMaidProfileData works
- [ ] GetSponsorProfileData works
- [ ] GetAgencyProfileData works
- [ ] All queries return correct data structure
- [ ] No GraphQL errors

### GraphQL Mutations

- [ ] UpdateMaidProfileData works
- [ ] Data updates successfully
- [ ] updated_at timestamp changes
- [ ] Data persists in database
- [ ] No GraphQL errors

### Database Verification

- [ ] Can see updated data in DATA tab
- [ ] Timestamps are correct
- [ ] No data corruption
- [ ] All fields updated as expected

---

## 🎉 Success Criteria

**If all checkpoints pass:**

✅ **GraphQL ProfileService Migration is SUCCESSFUL!**

This proves:
- GraphQL queries are correctly structured
- GraphQL mutations work properly
- Database updates succeed
- Data transformation is correct
- The migration implementation is production-ready

---

## 🐛 Troubleshooting

### Error: "JWTExpired" or "Unauthorized"

**Fix:** Re-enter admin secret in Hasura Console

### Error: "No rows found"

**Cause:** User ID doesn't exist or wrong user_type
**Fix:** Go to DATA tab, verify user exists with correct user_type

### Error: "Field doesn't exist"

**Cause:** Typo in field name or field doesn't exist in schema
**Fix:** Check DATA tab for actual column names (use snake_case)

### Error: "Cannot query field X on type Y"

**Cause:** Wrong relationship name (singular vs plural)
**Fix:**
- `maid_profiles` (plural, array)
- `sponsor_profile` (singular, object)
- `agency_profile` (singular, object)

---

## 📝 Record Your Results

**Test Date:** _______________
**Tester:** _______________

**Results:**

| Test | Status | Notes |
|------|--------|-------|
| GetMaidProfileData | [ ] Pass [ ] Fail | |
| GetSponsorProfileData | [ ] Pass [ ] Fail | |
| GetAgencyProfileData | [ ] Pass [ ] Fail | |
| UpdateMaidProfileData | [ ] Pass [ ] Fail | |
| Data Persistence | [ ] Pass [ ] Fail | |

**Overall Status:** [ ] All Pass [ ] Some Fail

**Issues Found:**
_______________________________________
_______________________________________

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅

1. **Document success** - Record test results
2. **Update status** - Mark migration as verified
3. **Prepare for deployment:**
   - Configure Hasura permissions (remove admin secret)
   - Set up JWT authentication
   - Plan canary rollout (10% → 50% → 100%)

### If Some Tests Fail ❌

1. **Document failures** - Note exact error messages
2. **Check GraphQL files:**
   - `packages/api-client/src/graphql/queries/profiles.graphql`
   - `packages/api-client/src/graphql/mutations/profiles.graphql`
3. **Verify schema** - Check field names in DATA tab
4. **Fix issues** - Update queries/mutations as needed
5. **Re-run codegen:** `pnpm codegen`
6. **Test again**

---

## 📚 Additional Resources

**GraphQL Files:**
- Queries: `packages/api-client/src/graphql/queries/profiles.graphql`
- Mutations: `packages/api-client/src/graphql/mutations/profiles.graphql`

**Documentation:**
- Full Guide: `PROFILE_SERVICE_TESTING_GUIDE.md`
- Migration Summary: `PROFILE_SERVICE_MIGRATION_COMPLETE.md`

**Hasura Docs:**
- https://hasura.io/docs/latest/graphql/core/api-reference/graphql-api/query/

---

**Ready to test? Open Hasura Console and start with Step 1!** 🚀
