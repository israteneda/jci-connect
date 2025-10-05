-- =====================================================
-- UPDATE MEMBERSHIPS TABLE
-- Migration: Add payment_type field
-- Date: 2025-01-06
-- Purpose: Track if membership is paid annually or monthly
-- =====================================================

-- Add payment_type column to memberships
ALTER TABLE public.memberships
ADD COLUMN IF NOT EXISTS payment_type TEXT NOT NULL DEFAULT 'annual' 
CHECK (payment_type IN ('annual', 'monthly'));

-- Add comment
COMMENT ON COLUMN public.memberships.payment_type IS 'Payment frequency: annual or monthly';

