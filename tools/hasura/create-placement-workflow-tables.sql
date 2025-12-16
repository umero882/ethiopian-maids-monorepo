-- Placement Workflow Tables for Hire Workflow System
-- This creates the placement_workflows and platform_fee_requirements tables
-- Run this in Hasura Console > Data > SQL

-- ============================================================================
-- PART 1: Platform Fee Requirements Table
-- ============================================================================

-- Create the platform_fee_requirements table
CREATE TABLE IF NOT EXISTS public.platform_fee_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Country configuration
    country_code VARCHAR(3) NOT NULL UNIQUE,  -- 'AE', 'SA', 'KW', etc.
    country_name VARCHAR(100) NOT NULL,       -- 'United Arab Emirates', 'Saudi Arabia', etc.
    currency VARCHAR(3) NOT NULL,             -- 'AED', 'SAR', 'KWD', etc.
    amount NUMERIC(10,2) NOT NULL,            -- Platform fee amount (500)

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_platform_fee_requirements_country ON public.platform_fee_requirements(country_code);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_platform_fee_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_platform_fee_requirements_updated_at ON public.platform_fee_requirements;
CREATE TRIGGER trigger_update_platform_fee_requirements_updated_at
    BEFORE UPDATE ON public.platform_fee_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_platform_fee_requirements_updated_at();

-- Add comments
COMMENT ON TABLE public.platform_fee_requirements IS 'Platform fee requirements by country for sponsor placement fees';
COMMENT ON COLUMN public.platform_fee_requirements.country_code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN public.platform_fee_requirements.amount IS 'Required platform fee amount in local currency';

-- ============================================================================
-- PART 2: Placement Workflows Table
-- ============================================================================

-- Create the placement_workflows table
CREATE TABLE IF NOT EXISTS public.placement_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parties involved (using VARCHAR to match existing profiles tables)
    sponsor_id VARCHAR(255) NOT NULL,         -- References profiles.user_id
    agency_id VARCHAR(255),                   -- References agency_profiles.id (nullable for independent maids)
    maid_id VARCHAR(255) NOT NULL,            -- References maid_profiles.id

    -- Workflow state machine
    status VARCHAR(50) NOT NULL DEFAULT 'contact_initiated'
        CHECK (status IN (
            'contact_initiated',     -- Initial contact made
            'interview_scheduled',   -- Interview date set
            'interview_completed',   -- Interview done
            'trial_started',         -- 3-day trial period started
            'trial_completed',       -- Trial period ended
            'placement_confirmed',   -- Both parties confirmed - SUCCESS
            'placement_failed'       -- Placement did not succeed
        )),

    -- Platform fee tracking
    platform_fee_amount NUMERIC(10,2),
    platform_fee_currency VARCHAR(3),
    fee_status VARCHAR(20) DEFAULT 'pending'
        CHECK (fee_status IN ('pending', 'held', 'earned', 'returned', 'refunded')),

    -- Workflow dates
    contact_date TIMESTAMPTZ DEFAULT NOW(),
    interview_scheduled_date TIMESTAMPTZ,
    interview_completed_date TIMESTAMPTZ,
    trial_start_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,               -- trial_start + 3 days
    placement_confirmed_date TIMESTAMPTZ,

    -- Confirmation flags (both must be true for final confirmation)
    sponsor_confirmed BOOLEAN DEFAULT FALSE,
    agency_confirmed BOOLEAN DEFAULT FALSE,

    -- Outcomes
    interview_outcome VARCHAR(30)
        CHECK (interview_outcome IS NULL OR interview_outcome IN ('successful', 'failed', 'rescheduled', 'no_show')),
    trial_outcome VARCHAR(30)
        CHECK (trial_outcome IS NULL OR trial_outcome IN ('passed', 'failed', 'extended', 'terminated_early')),
    failure_reason TEXT,
    failure_stage VARCHAR(50),                -- Stage at which failure occurred

    -- Guarantee period (90 days from confirmed placement)
    guarantee_end_date TIMESTAMPTZ,
    guarantee_claimed BOOLEAN DEFAULT FALSE,

    -- Communication tracking
    last_activity_date TIMESTAMPTZ DEFAULT NOW(),
    reminder_sent_count INT DEFAULT 0,

    -- Notes and metadata
    notes JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_placement_workflows_sponsor ON public.placement_workflows(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_placement_workflows_agency ON public.placement_workflows(agency_id);
CREATE INDEX IF NOT EXISTS idx_placement_workflows_maid ON public.placement_workflows(maid_id);
CREATE INDEX IF NOT EXISTS idx_placement_workflows_status ON public.placement_workflows(status);
CREATE INDEX IF NOT EXISTS idx_placement_workflows_fee_status ON public.placement_workflows(fee_status);
CREATE INDEX IF NOT EXISTS idx_placement_workflows_created_at ON public.placement_workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_placement_workflows_trial_end ON public.placement_workflows(trial_end_date)
    WHERE status = 'trial_started';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_placement_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_activity_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_placement_workflows_updated_at ON public.placement_workflows;
CREATE TRIGGER trigger_update_placement_workflows_updated_at
    BEFORE UPDATE ON public.placement_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_placement_workflows_updated_at();

-- Add comments
COMMENT ON TABLE public.placement_workflows IS 'Tracks the full placement workflow from contact to confirmed hire';
COMMENT ON COLUMN public.placement_workflows.status IS 'Current workflow state: contact_initiated -> interview_scheduled -> interview_completed -> trial_started -> trial_completed -> placement_confirmed/placement_failed';
COMMENT ON COLUMN public.placement_workflows.fee_status IS 'Platform fee status: pending (not collected) -> held (collected, in escrow) -> earned (placement confirmed) / returned (placement failed)';
COMMENT ON COLUMN public.placement_workflows.trial_end_date IS 'End of 3-day trial period (trial_start_date + 3 days)';
COMMENT ON COLUMN public.placement_workflows.guarantee_end_date IS 'End of 90-day guarantee period (placement_confirmed_date + 90 days)';

-- ============================================================================
-- PART 3: Seed GCC Country Data
-- ============================================================================

-- Insert GCC countries with 500 local currency platform fee
INSERT INTO public.platform_fee_requirements (country_code, country_name, currency, amount) VALUES
    ('AE', 'United Arab Emirates', 'AED', 500.00),
    ('SA', 'Saudi Arabia', 'SAR', 500.00),
    ('KW', 'Kuwait', 'KWD', 50.00),        -- KWD is stronger, so 50 KWD ~ 500 AED
    ('QA', 'Qatar', 'QAR', 500.00),
    ('BH', 'Bahrain', 'BHD', 50.00),       -- BHD is stronger, so 50 BHD ~ 500 AED
    ('OM', 'Oman', 'OMR', 50.00),          -- OMR is stronger, so 50 OMR ~ 500 AED
    ('JO', 'Jordan', 'JOD', 100.00),
    ('LB', 'Lebanon', 'USD', 135.00),      -- Using USD due to currency instability
    ('EG', 'Egypt', 'EGP', 7000.00),       -- ~500 AED equivalent
    ('US', 'United States', 'USD', 135.00),
    ('GB', 'United Kingdom', 'GBP', 110.00),
    ('DE', 'Germany', 'EUR', 125.00),
    ('FR', 'France', 'EUR', 125.00),
    ('CA', 'Canada', 'CAD', 185.00)
ON CONFLICT (country_code) DO UPDATE SET
    country_name = EXCLUDED.country_name,
    currency = EXCLUDED.currency,
    amount = EXCLUDED.amount,
    updated_at = NOW();

-- ============================================================================
-- TRACK TABLES IN HASURA
-- After running this SQL:
-- 1. Go to Hasura Console > Data
-- 2. Click "Track" on both tables: platform_fee_requirements, placement_workflows
-- 3. Track foreign key relationships if suggested
-- ============================================================================
