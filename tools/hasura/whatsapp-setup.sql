-- =====================================================
-- WhatsApp Admin Dashboard - Hasura Setup SQL
-- This script sets up the necessary tables and relationships
-- for the WhatsApp admin dashboard to work properly
-- =====================================================

-- =====================================================
-- 1. Ensure whatsapp_messages table exists with proper schema
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number text NOT NULL,
    message_content text NOT NULL,
    message_type text NOT NULL DEFAULT 'text',
    sender text NOT NULL CHECK (sender IN ('user', 'assistant')),
    ai_response text,
    processed boolean DEFAULT false,
    received_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON public.whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_received_at ON public.whatsapp_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender ON public.whatsapp_messages(sender);

-- =====================================================
-- 2. Ensure maid_bookings table exists with proper schema
-- =====================================================
CREATE TABLE IF NOT EXISTS public.maid_bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number text NOT NULL,
    sponsor_name text,
    sponsor_id uuid REFERENCES public.profiles(id),
    maid_id text,
    maid_name text,
    booking_type text CHECK (booking_type IN ('interview', 'hire', 'replacement', 'inquiry')),
    booking_date timestamptz,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'rescheduled')),
    notes text,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_maid_bookings_phone_number ON public.maid_bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_maid_bookings_status ON public.maid_bookings(status);
CREATE INDEX IF NOT EXISTS idx_maid_bookings_booking_date ON public.maid_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_maid_bookings_maid_id ON public.maid_bookings(maid_id);
CREATE INDEX IF NOT EXISTS idx_maid_bookings_sponsor_id ON public.maid_bookings(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_maid_bookings_created_at ON public.maid_bookings(created_at DESC);

-- =====================================================
-- 3. Ensure platform_settings table exists with proper schema
-- =====================================================
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Platform Information
    platform_name text DEFAULT 'Ethiopian Maids',
    about_platform text,
    support_email text,
    support_phone text,
    working_hours text DEFAULT '9:00 AM - 6:00 PM EAT, Monday - Saturday',
    available_services text[] DEFAULT ARRAY['Maid Placement', 'Maid Training', 'Document Processing'],

    -- AI Configuration
    ai_model text DEFAULT 'claude-3-5-sonnet-20241022',
    ai_temperature numeric DEFAULT 0.7,
    max_context_messages integer DEFAULT 20,
    max_tokens integer DEFAULT 1024,
    system_prompt text,

    -- Auto-Response Settings
    auto_response_enabled boolean DEFAULT true,
    business_hours_only boolean DEFAULT false,
    greeting_message text DEFAULT 'Hello! I''m Lucy, your AI assistant for Ethiopian Maids. How can I help you today?',
    offline_message text DEFAULT 'We''re currently offline. Our working hours are 9:00 AM - 6:00 PM EAT, Monday - Saturday.',
    error_message text DEFAULT 'I''m sorry, I encountered an error. Please try again or contact support.',

    -- Webhook Settings
    whatsapp_webhook_url text,
    validate_signature boolean DEFAULT true,
    rate_limiting_enabled boolean DEFAULT false,
    rate_limit integer DEFAULT 5,
    timeout integer DEFAULT 30,

    -- Notification Settings
    notify_new_messages boolean DEFAULT true,
    notify_bookings boolean DEFAULT true,
    notify_errors boolean DEFAULT true,
    notification_email text,

    -- User Notification Settings
    auto_confirm_bookings boolean DEFAULT false,
    send_reminders boolean DEFAULT true,
    send_followups boolean DEFAULT false,

    -- Advanced Settings
    debug_mode boolean DEFAULT false,
    store_ai_responses boolean DEFAULT true,
    allowed_numbers text,
    blocked_numbers text,
    cache_timeout integer DEFAULT 5,

    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- 4. Insert default platform settings if not exists
-- =====================================================
INSERT INTO public.platform_settings (
    id,
    platform_name,
    about_platform,
    support_email,
    support_phone,
    working_hours,
    available_services,
    ai_model,
    ai_temperature,
    max_context_messages,
    max_tokens,
    auto_response_enabled,
    business_hours_only,
    greeting_message,
    offline_message,
    error_message,
    notify_new_messages,
    notify_bookings,
    notify_errors,
    auto_confirm_bookings,
    send_reminders,
    send_followups,
    debug_mode,
    store_ai_responses,
    cache_timeout,
    timeout
)
SELECT
    gen_random_uuid(),
    'Ethiopian Maids',
    'Ethiopian Maids is a trusted platform connecting families in the Gulf region with skilled and verified Ethiopian domestic workers. We ensure a seamless and secure hiring process with comprehensive support.',
    'support@ethiopianmaids.com',
    '+971501234567',
    '9:00 AM - 6:00 PM EAT, Monday - Saturday',
    ARRAY['Maid Placement', 'Maid Training', 'Document Processing', 'Visa Assistance', 'Interview Scheduling'],
    'claude-3-5-sonnet-20241022',
    0.7,
    20,
    1024,
    true,
    false,
    'Hello! I''m Lucy, your AI assistant for Ethiopian Maids. I can help you find the perfect maid, schedule interviews, or answer questions about our services. How may I assist you today?',
    'We''re currently offline. Our working hours are 9:00 AM - 6:00 PM EAT, Monday - Saturday. Please leave a message and we''ll get back to you.',
    'I apologize, but I encountered an issue processing your request. Please try again or contact our support team at support@ethiopianmaids.com.',
    true,
    true,
    true,
    false,
    true,
    true,
    false,
    true,
    5,
    30
WHERE NOT EXISTS (SELECT 1 FROM public.platform_settings LIMIT 1);

-- =====================================================
-- 5. Create trigger for updated_at on maid_bookings
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_maid_bookings_updated_at ON public.maid_bookings;
CREATE TRIGGER update_maid_bookings_updated_at
    BEFORE UPDATE ON public.maid_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Grant permissions (adjust as needed for your Hasura setup)
-- =====================================================
-- Uncomment and modify these if needed based on your Hasura role setup
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO hasura;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.maid_bookings TO hasura;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO hasura;

-- =====================================================
-- 7. Sample test data (optional - comment out in production)
-- =====================================================
-- Insert sample WhatsApp messages for testing (recent timestamps)
INSERT INTO public.whatsapp_messages (phone_number, message_content, message_type, sender, received_at)
SELECT * FROM (VALUES
    ('+971501234567', 'Hello, I am looking for a maid', 'text', 'user', now() - interval '30 seconds'),
    ('+971501234567', 'Hello! I''m Lucy, your AI assistant. I''d be happy to help you find the perfect maid. Could you tell me more about your requirements?', 'text', 'assistant', now() - interval '25 seconds'),
    ('+971501234567', 'I need someone with cooking experience', 'text', 'user', now() - interval '20 seconds'),
    ('+971501234567', 'Great! We have several maids with excellent cooking skills. Do you have any preference for nationality, age, or language?', 'text', 'assistant', now() - interval '15 seconds'),
    ('+966551234567', 'Hi, can I schedule an interview?', 'text', 'user', now() - interval '10 seconds'),
    ('+966551234567', 'Of course! I''d be happy to schedule an interview for you. Which maid would you like to interview and what date/time works best for you?', 'text', 'assistant', now() - interval '5 seconds')
) AS v(phone_number, message_content, message_type, sender, received_at)
WHERE NOT EXISTS (SELECT 1 FROM public.whatsapp_messages LIMIT 1);

-- Insert sample bookings for testing
INSERT INTO public.maid_bookings (phone_number, sponsor_name, maid_name, booking_type, booking_date, status, notes)
SELECT * FROM (VALUES
    ('+971501234567', 'Ahmed Al-Rashid', 'Tigist Bekele', 'interview', now() + interval '2 days', 'confirmed', 'Video interview scheduled'),
    ('+971501234567', 'Ahmed Al-Rashid', 'Meron Tadesse', 'interview', now() + interval '3 days', 'pending', 'Awaiting confirmation'),
    ('+966551234567', 'Mohammad Hassan', 'Sara Getachew', 'hire', now() + interval '1 week', 'confirmed', 'Contract signed, visa processing'),
    ('+966551234567', 'Mohammad Hassan', 'Helen Yohannes', 'inquiry', null, 'pending', 'Interested in multiple candidates')
) AS v(phone_number, sponsor_name, maid_name, booking_type, booking_date, status, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.maid_bookings LIMIT 1);

-- =====================================================
-- End of setup script
-- =====================================================
