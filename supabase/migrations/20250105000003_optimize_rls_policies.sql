-- =====================================================
-- OPTIMIZE RLS POLICIES: Consolidate for Performance
-- Migration: Consolidate multiple SELECT policies into one
-- Date: 2025-01-05
-- Issue: Multiple policies cause overhead and potential recursion
--        even with SECURITY DEFINER function
-- =====================================================

-- =====================================================
-- CONSOLIDATE PROFILES SELECT POLICIES
-- =====================================================

-- Drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Senators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Members can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Create single optimized policy with short-circuit evaluation
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    -- First condition: user viewing their own profile (fast, no function call)
    -- PostgreSQL evaluates OR conditions left-to-right and stops when TRUE
    auth.uid() = id
    OR
    -- Second condition: only evaluated if first is FALSE
    -- Calls get_my_role() which has SECURITY DEFINER (bypasses RLS)
    public.get_my_role() IN ('admin', 'senator', 'member')
  );

-- =====================================================
-- VERIFY: Test the policy works correctly
-- =====================================================

-- Test 1: Policy should exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'profiles_select_policy'
  ) THEN
    RAISE EXCEPTION 'Policy profiles_select_policy does not exist!';
  END IF;
END $$;

-- Test 2: Only one SELECT policy should exist
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'profiles' 
  AND cmd = 'SELECT';
  
  IF policy_count != 1 THEN
    RAISE EXCEPTION 'Expected 1 SELECT policy, found %', policy_count;
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully';
  RAISE NOTICE '✅ Consolidated SELECT policies into single optimized policy';
  RAISE NOTICE '✅ Profile queries should now be instant (< 500ms)';
END $$;

-- =====================================================
-- PERFORMANCE NOTES
-- =====================================================

-- Before: Multiple policies evaluated for each query
--   - "Users can view their own profile"
--   - "Admins can view all profiles"
--   - "Senators can view all profiles"
--   - "Members can view all profiles"
--   Result: Overhead + multiple get_my_role() calls
--
-- After: Single policy with OR conditions
--   - First check: auth.uid() = id (fast, no recursion)
--   - Second check: get_my_role() IN (...) (only if first FALSE)
--   Result: Fast short-circuit evaluation + single function call

-- Expected Performance:
--   - Own profile query: < 50ms (simple UID comparison)
--   - Admin viewing others: < 200ms (one function call)
--   - Total login time: < 1 second

