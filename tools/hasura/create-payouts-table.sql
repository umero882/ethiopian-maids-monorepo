-- Payouts Table for Admin Financial Management
-- This table supports payouts for all user types (maid, sponsor, agency)
-- Run this in Hasura Console > Data > SQL

-- Create the payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Payout identifier
    payout_number VARCHAR(50) NOT NULL UNIQUE,

    -- User information (links to profiles table via Firebase UID)
    user_id VARCHAR(128) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('maid', 'sponsor', 'agency')),

    -- Amount details
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    net_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    processing_fee NUMERIC(12, 2) DEFAULT 0,
    platform_fee NUMERIC(12, 2) DEFAULT 0,

    -- Payout status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'on_hold', 'cancelled')),

    -- Payment method details
    payout_method VARCHAR(30) NOT NULL
        CHECK (payout_method IN ('bank_transfer', 'wire_transfer', 'digital_wallet', 'check', 'stripe')),
    payout_destination JSONB, -- Bank details, wallet info, etc.

    -- Description and notes
    description TEXT,
    notes TEXT,

    -- Timestamps for processing stages
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processing_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,

    -- Failure information
    failure_code VARCHAR(50),
    failure_message TEXT,

    -- External references
    provider_reference VARCHAR(100),
    stripe_payout_id VARCHAR(100),
    stripe_transfer_id VARCHAR(100),

    -- Retry tracking
    retry_count INT DEFAULT 0,

    -- Additional metadata
    metadata JSONB DEFAULT '{}',

    -- Audit timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(128),
    updated_by VARCHAR(128)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user_type ON public.payouts(user_type);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_payout_method ON public.payouts(payout_method);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON public.payouts(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON public.payouts(created_at DESC);

-- Create function to auto-generate payout_number
CREATE OR REPLACE FUNCTION generate_payout_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payout_number IS NULL OR NEW.payout_number = '' THEN
        NEW.payout_number := 'PAYOUT-' || TO_CHAR(NOW(), 'YYYY-MMDD') || '-' ||
            LPAD(NEXTVAL('payout_number_seq')::TEXT, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for payout numbers
CREATE SEQUENCE IF NOT EXISTS payout_number_seq START 1;

-- Create trigger for auto-generating payout_number
DROP TRIGGER IF EXISTS trigger_generate_payout_number ON public.payouts;
CREATE TRIGGER trigger_generate_payout_number
    BEFORE INSERT ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION generate_payout_number();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_payouts_updated_at ON public.payouts;
CREATE TRIGGER trigger_update_payouts_updated_at
    BEFORE UPDATE ON public.payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_payouts_updated_at();

-- Track the table in Hasura
-- After running this SQL, go to Hasura Console > Data > Track Table to track 'payouts'

-- Add comments for documentation
COMMENT ON TABLE public.payouts IS 'Payout requests and transactions for all user types (maid, sponsor, agency)';
COMMENT ON COLUMN public.payouts.payout_number IS 'Unique payout identifier (e.g., PAYOUT-2024-1214-001)';
COMMENT ON COLUMN public.payouts.user_id IS 'Firebase UID of the user receiving the payout';
COMMENT ON COLUMN public.payouts.user_type IS 'Type of user: maid, sponsor, or agency';
COMMENT ON COLUMN public.payouts.payout_destination IS 'JSON containing bank details or wallet information';
COMMENT ON COLUMN public.payouts.metadata IS 'Additional payout metadata as JSON';

-- Insert sample data for testing (optional - remove in production)
INSERT INTO public.payouts (
    payout_number, user_id, user_type, amount, net_amount, currency,
    processing_fee, status, payout_method, payout_destination,
    description, requested_at
) VALUES
(
    'PAYOUT-2024-1214-001',
    'ie5YPmKmndUYGMz1voLEOLctPu12',
    'sponsor',
    500.00,
    485.00,
    'USD',
    15.00,
    'completed',
    'bank_transfer',
    '{"account_name": "Abu Hamdan", "bank_name": "Emirates NBD", "account_number": "****-****-1234", "routing_number": "ENBD001"}'::jsonb,
    'Refund for cancelled booking',
    NOW() - INTERVAL '2 days'
),
(
    'PAYOUT-2024-1214-002',
    'JlTGdym1qrP1hTpypukuyJlWEIg1',
    'agency',
    2500.00,
    2425.00,
    'USD',
    75.00,
    'pending',
    'wire_transfer',
    '{"account_name": "Kafil Agency", "bank_name": "Al Rajhi Bank", "account_number": "****-****-5678", "routing_number": "RJHI002"}'::jsonb,
    'Monthly commission payout - December 2024',
    NOW() - INTERVAL '1 day'
),
(
    'PAYOUT-2024-1214-003',
    'JlTGdym1qrP1hTpypukuyJlWEIg1',
    'agency',
    1200.00,
    1170.00,
    'USD',
    30.00,
    'processing',
    'bank_transfer',
    '{"account_name": "Kafil Agency", "bank_name": "Al Rajhi Bank", "account_number": "****-****-5678", "routing_number": "RJHI002"}'::jsonb,
    'Weekly placement bonus',
    NOW()
);
