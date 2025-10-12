-- =====================================================
-- JCI CONNECT - COMPLETE DATABASE SCHEMA
-- Migration: Complete unified schema
-- Date: 2025-01-07
-- Purpose: Single-chapter architecture with all features
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'senator', 'officer', 'member', 'candidate', 'past_member', 'guest')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  avatar_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'es')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles with personal information';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin (full access), senator (40+ approved member), officer (chapter board member), member (active), candidate (prospective), past_member (alumni/aged out), guest (browsing/interested)';
COMMENT ON COLUMN public.profiles.address IS 'Full address: street, city, country';

-- =====================================================
-- MEMBERSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL DEFAULT 'local' CHECK (membership_type IN ('local', 'senator', 'national', 'international')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  member_number TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'overdue')),
  payment_type TEXT NOT NULL DEFAULT 'annual' CHECK (payment_type IN ('annual', 'monthly')),
  annual_fee DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.memberships IS 'Member membership details - single chapter per installation';
COMMENT ON COLUMN public.memberships.payment_type IS 'Payment frequency: annual or monthly';

-- =====================================================
-- BOARD POSITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.board_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('local', 'national', 'international')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.board_positions IS 'Board positions at local (chapter), national, and international levels';
COMMENT ON COLUMN public.board_positions.level IS 'Position level: local (chapter), national, or international';
COMMENT ON COLUMN public.board_positions.is_active IS 'Whether position is currently active (false = historical)';

-- =====================================================
-- CHAPTER SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.chapter_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000',
  chapter_name TEXT NOT NULL DEFAULT 'JCI Chapter',
  chapter_city TEXT,
  chapter_country TEXT,
  description TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#3A67B1',
  secondary_color TEXT NOT NULL DEFAULT '#0097D7',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chapter_settings IS 'Global settings for the single chapter installation';

-- Insert default settings
INSERT INTO public.chapter_settings (
  id, 
  chapter_name, 
  chapter_city, 
  chapter_country, 
  description, 
  email, 
  phone, 
  website, 
  logo_url, 
  primary_color, 
  secondary_color
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'JCI Connect',
  'Global',
  'International',
  'Default settings for JCI Connect platform.',
  'info@jciconnect.org',
  '+1234567890',
  'https://www.jciconnect.org',
  NULL,
  '#3A67B1',
  '#0097D7'
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INDEXES for better query performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);
CREATE INDEX IF NOT EXISTS idx_board_positions_user_id ON public.board_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_board_positions_is_active ON public.board_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_board_positions_level ON public.board_positions(level);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to securely get user role (bypasses RLS to prevent recursion)
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
  
  -- Return the role, or 'guest' if not found
  RETURN COALESCE(user_role, 'guest');
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to guest role on any error
    RETURN 'guest';
END;
$$;

COMMENT ON FUNCTION public.get_my_role() IS 'Securely gets current user role without RLS recursion';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;

-- Function to get user email (Safe for frontend)
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest'),
    COALESCE(NEW.raw_user_meta_data->>'status', 'pending')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply updated_at trigger to all tables
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_board_positions_updated_at
  BEFORE UPDATE ON public.board_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_chapter_settings_updated_at
  BEFORE UPDATE ON public.chapter_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile on user signup
-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapter_settings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Consolidated SELECT policy with short-circuit evaluation
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    -- First condition: user viewing their own profile (fast, no function call)
    auth.uid() = id
    OR
    -- Second condition: only evaluated if first is FALSE
    public.get_my_role() IN ('admin', 'senator', 'member')
  );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin policies
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'admin');

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.get_my_role() = 'admin');

-- =====================================================
-- MEMBERSHIPS TABLE POLICIES
-- =====================================================

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

-- =====================================================
-- BOARD POSITIONS TABLE POLICIES
-- =====================================================

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

-- =====================================================
-- CHAPTER SETTINGS TABLE POLICIES
-- =====================================================

CREATE POLICY "Allow authenticated users to read chapter settings"
  ON public.chapter_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage chapter settings"
  ON public.chapter_settings FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ JCI Connect Schema Created Successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 Tables: profiles, memberships, board_positions, chapter_settings';
  RAISE NOTICE '🔒 RLS enabled on all tables';
  RAISE NOTICE '⚡ Optimized policies with get_my_role()';
  RAISE NOTICE '🏗️  Indexes created for performance';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Step: Create admin user via Supabase Auth UI';
  RAISE NOTICE 'Then run: UPDATE profiles SET role = ''admin'' WHERE id = ''user-id'';';
  RAISE NOTICE '========================================';
END $$;

