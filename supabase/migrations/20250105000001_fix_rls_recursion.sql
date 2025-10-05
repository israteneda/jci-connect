-- =====================================================
-- FIX RLS INFINITE RECURSION
-- Migration: Fix infinite recursion in profiles policies
-- Date: 2025-01-05
-- =====================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Senators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Members can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a secure function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Recreate policies using the secure function (no recursion)
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Senators can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'senator');

CREATE POLICY "Members can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() IN ('member', 'senator', 'admin'));

-- Update chapters policies
DROP POLICY IF EXISTS "Authenticated users can view active chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can manage chapters" ON public.chapters;

CREATE POLICY "Authenticated users can view active chapters"
  ON public.chapters FOR SELECT
  USING (
    status = 'active' OR public.get_my_role() = 'admin'
  );

CREATE POLICY "Admins can manage chapters"
  ON public.chapters FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Update memberships policies
DROP POLICY IF EXISTS "Admins can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Senators can view all memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view their own membership" ON public.memberships;

CREATE POLICY "Admins can view all memberships"
  ON public.memberships FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can manage memberships"
  ON public.memberships FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Senators can view all memberships"
  ON public.memberships FOR SELECT
  USING (public.get_my_role() = 'senator');

CREATE POLICY "Users can view their own membership"
  ON public.memberships FOR SELECT
  USING (auth.uid() = user_id);

-- Update board_positions policies
DROP POLICY IF EXISTS "Admins can view all board positions" ON public.board_positions;
DROP POLICY IF EXISTS "Admins can manage board positions" ON public.board_positions;
DROP POLICY IF EXISTS "Senators can view all board positions" ON public.board_positions;
DROP POLICY IF EXISTS "Members can view all board positions" ON public.board_positions;
DROP POLICY IF EXISTS "Users can view their own board positions" ON public.board_positions;

CREATE POLICY "Admins can view all board positions"
  ON public.board_positions FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can manage board positions"
  ON public.board_positions FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Senators can view all board positions"
  ON public.board_positions FOR SELECT
  USING (public.get_my_role() = 'senator');

CREATE POLICY "Members can view all board positions"
  ON public.board_positions FOR SELECT
  USING (public.get_my_role() IN ('member', 'senator', 'admin'));

CREATE POLICY "Users can view their own board positions"
  ON public.board_positions FOR SELECT
  USING (auth.uid() = user_id);

-- Add helpful comment
COMMENT ON FUNCTION public.get_my_role() IS 'Securely gets the current user role without RLS recursion';

