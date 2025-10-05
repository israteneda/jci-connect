-- =====================================================
-- UPDATE PROFILES TABLE
-- Migration: Replace city and country with address field
-- Date: 2025-01-06
-- Purpose: Consolidate location info into a single address field
-- =====================================================

-- Add address column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS address TEXT;

-- Migrate existing city/country data to address (if you have existing data)
UPDATE public.profiles
SET address = CASE
  WHEN city IS NOT NULL AND country IS NOT NULL THEN city || ', ' || country
  WHEN city IS NOT NULL THEN city
  WHEN country IS NOT NULL THEN country
  ELSE NULL
END
WHERE address IS NULL;

-- Drop old columns
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS country;

-- Add comment
COMMENT ON COLUMN public.profiles.address IS 'Full address: street, city, country';

