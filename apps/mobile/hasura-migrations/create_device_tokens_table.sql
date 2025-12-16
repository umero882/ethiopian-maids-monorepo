-- Migration: Create device_tokens table for push notifications
-- Run this migration in Hasura Console SQL tab

-- Create device_tokens table
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_name TEXT,
    app_version TEXT,
    is_active BOOLEAN DEFAULT true,
    badge_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint on user_id and device_id combination
    CONSTRAINT device_tokens_user_id_device_id_key UNIQUE (user_id, device_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_token ON public.device_tokens(token);
CREATE INDEX IF NOT EXISTS idx_device_tokens_is_active ON public.device_tokens(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.device_tokens IS 'Stores device push notification tokens for users';
COMMENT ON COLUMN public.device_tokens.user_id IS 'Firebase Auth UID of the user';
COMMENT ON COLUMN public.device_tokens.device_id IS 'Unique identifier for the device';
COMMENT ON COLUMN public.device_tokens.token IS 'Expo push token or FCM token';
COMMENT ON COLUMN public.device_tokens.platform IS 'Device platform (ios, android, web)';
COMMENT ON COLUMN public.device_tokens.is_active IS 'Whether the token is currently active';
COMMENT ON COLUMN public.device_tokens.badge_count IS 'Current badge count for the device';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_device_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_device_tokens_updated_at ON public.device_tokens;
CREATE TRIGGER set_device_tokens_updated_at
    BEFORE UPDATE ON public.device_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_device_tokens_updated_at();

-- Grant permissions (adjust role names as needed for your Hasura setup)
-- These may need to be run separately or adjusted based on your Hasura configuration

-- Track the table in Hasura (run in Hasura Console -> Data -> Track)
-- After running this SQL, go to Hasura Console and:
-- 1. Go to Data tab
-- 2. Click "Track" on the device_tokens table
-- 3. Set up permissions for the appropriate roles

/*
Hasura Permissions Setup (configure in Console):

For 'user' role:
- Select: Allow users to read their own tokens
  - Row permissions: { "user_id": { "_eq": "X-Hasura-User-Id" } }
  - Column permissions: all columns

- Insert: Allow users to insert their own tokens
  - Row permissions: { "user_id": { "_eq": "X-Hasura-User-Id" } }
  - Column presets: user_id = X-Hasura-User-Id
  - Column permissions: device_id, token, platform, device_name, app_version

- Update: Allow users to update their own tokens
  - Row permissions: { "user_id": { "_eq": "X-Hasura-User-Id" } }
  - Column permissions: token, is_active, badge_count, last_used_at, app_version

- Delete: Allow users to delete their own tokens
  - Row permissions: { "user_id": { "_eq": "X-Hasura-User-Id" } }
*/
