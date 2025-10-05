-- =====================================================
-- DEBUG SCRIPT: Profile Fetch Issue
-- User ID: c4fe16d8-69ed-4295-9316-fcbad33d2901
-- =====================================================

-- Step 1: Check if user exists in auth.users
SELECT 
  id, 
  email, 
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE id = 'c4fe16d8-69ed-4295-9316-fcbad33d2901';

-- Step 2: Check if profile exists in public.profiles
SELECT 
  id, 
  first_name, 
  last_name, 
  role, 
  status,
  created_at
FROM public.profiles 
WHERE id = 'c4fe16d8-69ed-4295-9316-fcbad33d2901';

-- Step 3: Check if RLS function exists
SELECT 
  proname, 
  prosrc 
FROM pg_proc 
WHERE proname = 'get_my_role';

-- Step 4: Check RLS policies on profiles table
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 5: Check if trigger exists for auto-creating profiles
SELECT 
  tgname,
  tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- =====================================================
-- FIX: Create profile if missing
-- =====================================================
-- Run this ONLY if Step 2 returns no results:

INSERT INTO public.profiles (id, first_name, last_name, role, status)
VALUES (
  'c4fe16d8-69ed-4295-9316-fcbad33d2901',
  'Israel',
  'Ateneda',
  'admin',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active',
  updated_at = NOW();

-- =====================================================
-- FIX: Re-apply RLS fix if get_my_role doesn't exist
-- =====================================================
-- If Step 3 returns no results, run this:

-- Create the function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- =====================================================
-- VERIFY: Test the profile query
-- =====================================================
-- After fixes, test this query (should return immediately):

SELECT * FROM public.profiles WHERE id = 'c4fe16d8-69ed-4295-9316-fcbad33d2901';

-- Test the RLS function:
SELECT public.get_my_role();

