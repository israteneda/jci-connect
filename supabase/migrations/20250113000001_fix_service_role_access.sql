-- =====================================================
-- FIX SERVICE ROLE ACCESS TO PROFILES
-- Migration: Add service role access to profiles table
-- Date: 2025-01-13
-- Purpose: Allow service role to access profiles for backend operations
-- =====================================================

-- Create a function that bypasses RLS for service role
-- This function will be called by the backend to get profiles data
CREATE OR REPLACE FUNCTION public.get_profiles_for_service_role()
RETURNS TABLE (
  id UUID,
  role TEXT,
  status TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  avatar_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  language_preference TEXT,
  diet_restrictions TEXT,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, so it bypasses RLS
  RETURN QUERY
  SELECT 
    p.id,
    p.role,
    p.status,
    p.first_name,
    p.last_name,
    p.phone,
    p.date_of_birth,
    p.address,
    p.avatar_url,
    p.bio,
    p.linkedin_url,
    p.language_preference,
    p.diet_restrictions,
    p.last_login,
    p.created_at,
    p.updated_at
  FROM public.profiles p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.get_profiles_for_service_role() TO service_role;

-- Also create a function to get profiles count
CREATE OR REPLACE FUNCTION public.get_profiles_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.profiles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.get_profiles_count() TO service_role;
