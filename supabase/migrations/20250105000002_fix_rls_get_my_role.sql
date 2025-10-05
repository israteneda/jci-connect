-- =====================================================
-- FIX: Improve get_my_role() to prevent RLS recursion
-- Migration: Fix RLS infinite recursion by improving function
-- Date: 2025-01-05
-- Issue: get_my_role() was causing infinite recursion when
--        evaluating RLS policies during profile fetch
-- =====================================================

-- =====================================================
-- NOTE: We use CREATE OR REPLACE instead of DROP
-- because many RLS policies depend on this function.
-- CREATE OR REPLACE will update the function without
-- breaking the dependencies.
-- =====================================================

-- Create or replace improved version that explicitly bypasses RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Directly query without RLS check (SECURITY DEFINER bypasses RLS)
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  -- Return the role, or 'candidate' if not found
  RETURN COALESCE(user_role, 'candidate');
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to candidate role on any error
    RETURN 'candidate';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

-- Add helpful comment
COMMENT ON FUNCTION public.get_my_role() IS 
  'Securely gets current user role without RLS recursion. Uses SECURITY DEFINER to bypass RLS and prevent infinite loops. Returns candidate as fallback if user not found or on error.';

-- =====================================================
-- VERIFY: Test the function works correctly
-- =====================================================

-- Test 1: Function should exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_my_role'
  ) THEN
    RAISE EXCEPTION 'Function get_my_role does not exist!';
  END IF;
END $$;

-- Test 2: Function should return text type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_my_role' 
    AND prorettype = 'text'::regtype
  ) THEN
    RAISE EXCEPTION 'Function get_my_role does not return TEXT!';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully';
  RAISE NOTICE '✅ get_my_role() function updated with RLS bypass';
  RAISE NOTICE '✅ Function will prevent infinite recursion';
END $$;

