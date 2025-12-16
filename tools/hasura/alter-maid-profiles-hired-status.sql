-- Alter maid_profiles Table to Add Hired Status Fields
-- This adds columns to track maid hiring status for fraud prevention
-- Run this in Hasura Console > Data > SQL

-- ============================================================================
-- ADD HIRED STATUS COLUMNS TO MAID_PROFILES
-- ============================================================================

-- Add hired_status column
-- Values: 'available' (can be contacted), 'in_trial' (3-day trial), 'hired' (confirmed placement)
ALTER TABLE public.maid_profiles
ADD COLUMN IF NOT EXISTS hired_status VARCHAR(20) DEFAULT 'available'
    CHECK (hired_status IS NULL OR hired_status IN ('available', 'in_trial', 'hired'));

-- Add current_placement_id column (references placement_workflows)
ALTER TABLE public.maid_profiles
ADD COLUMN IF NOT EXISTS current_placement_id UUID;

-- Add hired_by_sponsor_id column (tracks who hired the maid)
ALTER TABLE public.maid_profiles
ADD COLUMN IF NOT EXISTS hired_by_sponsor_id VARCHAR(255);

-- Add hired_date column (when the maid was confirmed as hired)
ALTER TABLE public.maid_profiles
ADD COLUMN IF NOT EXISTS hired_date TIMESTAMPTZ;

-- Add trial_start_date column (when the 3-day trial started)
ALTER TABLE public.maid_profiles
ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ;

-- Add trial_end_date column (when the 3-day trial ends)
ALTER TABLE public.maid_profiles
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- Create index for quick lookup of available maids
CREATE INDEX IF NOT EXISTS idx_maid_profiles_hired_status ON public.maid_profiles(hired_status);

-- Create index for placement lookups
CREATE INDEX IF NOT EXISTS idx_maid_profiles_current_placement ON public.maid_profiles(current_placement_id)
    WHERE current_placement_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.maid_profiles.hired_status IS 'Current hiring status: available (can be contacted), in_trial (3-day trial in progress), hired (confirmed placement)';
COMMENT ON COLUMN public.maid_profiles.current_placement_id IS 'References the active placement_workflows record';
COMMENT ON COLUMN public.maid_profiles.hired_by_sponsor_id IS 'The sponsor who hired this maid (profiles.user_id)';
COMMENT ON COLUMN public.maid_profiles.hired_date IS 'Date when placement was confirmed';
COMMENT ON COLUMN public.maid_profiles.trial_start_date IS 'Start date of the 3-day trial period';
COMMENT ON COLUMN public.maid_profiles.trial_end_date IS 'End date of the 3-day trial period';

-- ============================================================================
-- SET DEFAULT FOR EXISTING RECORDS
-- ============================================================================

-- Update all existing maid profiles to 'available' if hired_status is null
UPDATE public.maid_profiles
SET hired_status = 'available'
WHERE hired_status IS NULL;

-- ============================================================================
-- TRACK COLUMNS IN HASURA
-- After running this SQL:
-- 1. Go to Hasura Console > Data > maid_profiles
-- 2. The new columns should be automatically visible
-- 3. You may need to refresh the page or reload metadata
-- ============================================================================
