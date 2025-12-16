-- Migration: Create notification_settings table for user notification preferences
-- Run this migration in Hasura Console SQL tab
-- This table syncs notification preferences between web and mobile

-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,

    -- Channel toggles
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    in_app_enabled BOOLEAN DEFAULT true,

    -- Email frequency: 'instant', 'daily', 'weekly'
    email_frequency TEXT DEFAULT 'instant' CHECK (email_frequency IN ('instant', 'daily', 'weekly')),

    -- Quiet hours settings
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TEXT DEFAULT '22:00',  -- HH:MM format
    quiet_hours_end TEXT DEFAULT '07:00',    -- HH:MM format

    -- Per-type notification preferences (JSONB)
    -- Example: {"message_received": {"email": true, "push": true, "inApp": true}}
    notification_types JSONB DEFAULT '{
        "application_received": {"email": true, "push": true, "inApp": true},
        "application_accepted": {"email": true, "push": true, "inApp": true},
        "application_rejected": {"email": true, "push": false, "inApp": true},
        "message_received": {"email": false, "push": true, "inApp": true},
        "booking_created": {"email": true, "push": true, "inApp": true},
        "booking_accepted": {"email": true, "push": true, "inApp": true},
        "booking_rejected": {"email": true, "push": true, "inApp": true},
        "profile_approved": {"email": true, "push": true, "inApp": true},
        "profile_rejected": {"email": true, "push": true, "inApp": true},
        "job_posted": {"email": true, "push": false, "inApp": true},
        "payment_received": {"email": true, "push": true, "inApp": true},
        "system_announcement": {"email": true, "push": false, "inApp": true}
    }'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON public.notification_settings(user_id);

-- Add comments for documentation
COMMENT ON TABLE public.notification_settings IS 'User notification preferences synced between web and mobile';
COMMENT ON COLUMN public.notification_settings.user_id IS 'Firebase Auth UID of the user';
COMMENT ON COLUMN public.notification_settings.email_enabled IS 'Global toggle for email notifications';
COMMENT ON COLUMN public.notification_settings.push_enabled IS 'Global toggle for push notifications';
COMMENT ON COLUMN public.notification_settings.sms_enabled IS 'Global toggle for SMS notifications';
COMMENT ON COLUMN public.notification_settings.in_app_enabled IS 'Global toggle for in-app notifications';
COMMENT ON COLUMN public.notification_settings.email_frequency IS 'How often to send email digests: instant, daily, or weekly';
COMMENT ON COLUMN public.notification_settings.quiet_hours_enabled IS 'Whether quiet hours are enabled';
COMMENT ON COLUMN public.notification_settings.quiet_hours_start IS 'Start time for quiet hours (HH:MM)';
COMMENT ON COLUMN public.notification_settings.quiet_hours_end IS 'End time for quiet hours (HH:MM)';
COMMENT ON COLUMN public.notification_settings.notification_types IS 'Per-type notification preferences as JSONB';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notification_settings_updated_at ON public.notification_settings;
CREATE TRIGGER set_notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_settings_updated_at();

-- Track the table in Hasura (run in Hasura Console -> Data -> Track)
-- After running this SQL, go to Hasura Console and:
-- 1. Go to Data tab
-- 2. Click "Track" on the notification_settings table
-- 3. Set up permissions for the appropriate roles

/*
Hasura Permissions Setup (configure in Console):

For 'user' role:
- Select: Allow users to read their own settings
  - Row permissions: { "user_id": { "_eq": "X-Hasura-User-Id" } }
  - Column permissions: all columns

- Insert: Allow users to insert their own settings
  - Row permissions: { "user_id": { "_eq": "X-Hasura-User-Id" } }
  - Column presets: user_id = X-Hasura-User-Id
  - Column permissions: email_enabled, push_enabled, sms_enabled, in_app_enabled,
                        email_frequency, quiet_hours_enabled, quiet_hours_start,
                        quiet_hours_end, notification_types

- Update: Allow users to update their own settings
  - Row permissions: { "user_id": { "_eq": "X-Hasura-User-Id" } }
  - Column permissions: email_enabled, push_enabled, sms_enabled, in_app_enabled,
                        email_frequency, quiet_hours_enabled, quiet_hours_start,
                        quiet_hours_end, notification_types

- Delete: Allow users to delete their own settings
  - Row permissions: { "user_id": { "_eq": "X-Hasura-User-Id" } }
*/
