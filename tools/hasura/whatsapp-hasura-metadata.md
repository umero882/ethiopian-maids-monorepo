# WhatsApp Dashboard - Hasura Metadata Setup

This document describes the Hasura metadata configuration needed for the WhatsApp admin dashboard.

## Tables Required

### 1. whatsapp_messages
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| phone_number | text | WhatsApp phone number (E.164 format) |
| message_content | text | Message text |
| message_type | text | Type: text, image, document |
| sender | text | Either "user" or "assistant" |
| ai_response | text | Full AI response JSON |
| processed | boolean | Whether message was processed |
| received_at | timestamptz | When message was received |
| created_at | timestamptz | Record creation time |

### 2. maid_bookings
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| phone_number | text | WhatsApp phone number |
| sponsor_name | text | Name of sponsor |
| sponsor_id | uuid | FK to profiles table |
| maid_id | text | FK to maid_profiles table |
| maid_name | text | Name of maid |
| booking_type | text | interview, hire, replacement, inquiry |
| booking_date | timestamptz | Scheduled booking date |
| status | text | pending, confirmed, cancelled, completed, rescheduled |
| notes | text | Additional notes |
| metadata | jsonb | Flexible metadata storage |
| created_at | timestamptz | Record creation time |
| updated_at | timestamptz | Last update time |

### 3. platform_settings
Contains all WhatsApp and AI configuration settings.

## Relationships to Add in Hasura Console

### maid_bookings -> maid_profiles (Optional Object Relationship)
If you want to add a relationship to fetch maid profile details:

1. Go to Hasura Console -> Data -> maid_bookings -> Relationships
2. Add Object Relationship:
   - Relationship Name: `maid_profile`
   - Reference Schema: `public`
   - Reference Table: `maid_profiles`
   - From: `maid_id`
   - To: `id`

**Note**: This relationship is optional. The current implementation stores `maid_name` directly in maid_bookings to work without the relationship.

### maid_bookings -> profiles (Object Relationship for Sponsor)
1. Go to Hasura Console -> Data -> maid_bookings -> Relationships
2. Add Object Relationship:
   - Relationship Name: `sponsor_profile`
   - Reference Schema: `public`
   - Reference Table: `profiles`
   - From: `sponsor_id`
   - To: `id`

## Permissions Required

### For Admin Role (Full Access)
All tables should have full CRUD permissions for admin users.

### For Public/Anonymous Role (Limited Access)
- `whatsapp_messages`: SELECT only for specific phone numbers
- `maid_bookings`: SELECT only for specific phone numbers
- `platform_settings`: SELECT only (read configuration)

## Applying Metadata via CLI

If using Hasura CLI, add relationships in `metadata/tables.yaml`:

```yaml
- table:
    schema: public
    name: maid_bookings
  object_relationships:
    - name: maid_profile
      using:
        foreign_key_constraint_on: maid_id
    - name: sponsor_profile
      using:
        foreign_key_constraint_on: sponsor_id
```

Then run:
```bash
hasura metadata apply
```

## Testing the Setup

After applying the SQL and metadata:

1. Open Hasura Console
2. Go to API tab
3. Run this test query:

```graphql
query TestWhatsAppSetup {
  # Test messages table
  whatsapp_messages(limit: 5) {
    id
    phone_number
    message_content
    sender
    received_at
  }

  # Test bookings table
  maid_bookings(limit: 5) {
    id
    phone_number
    sponsor_name
    maid_name
    status
  }

  # Test platform settings
  platform_settings(limit: 1) {
    id
    platform_name
    ai_model
    auto_response_enabled
  }

  # Test booking stats
  total: maid_bookings_aggregate {
    aggregate { count }
  }
  pending: maid_bookings_aggregate(where: {status: {_eq: "pending"}}) {
    aggregate { count }
  }
}
```

## Troubleshooting

### "relation does not exist" error
Run the `whatsapp-setup.sql` script in your database.

### Permissions denied error
Ensure your Hasura admin secret is configured correctly and the tables have proper permissions.

### No data showing in dashboard
1. Check if platform_settings has a record (seed data should have been inserted)
2. Check browser console for GraphQL errors
3. Verify Apollo Client is connected to correct Hasura endpoint
