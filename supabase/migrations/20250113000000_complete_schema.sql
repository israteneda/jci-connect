-- =====================================================
-- JCI CONNECT - COMPLETE DATABASE SCHEMA
-- Migration: Complete consolidated schema with all features and fixes
-- Date: 2025-01-13
-- Purpose: Single comprehensive migration with all tables, constraints, and triggers
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('admin', 'prospective', 'member', 'guest')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '+1000000000',
  date_of_birth DATE,
  address TEXT,
  avatar_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'es')),
  diet_restrictions TEXT, -- Added for event planning
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles with personal information including dietary restrictions for event planning';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin (platform administrator - hidden), member (active member), prospective (potential member), guest (browsing/interested)';
COMMENT ON COLUMN public.profiles.address IS 'Full address: street, city, country';
COMMENT ON COLUMN public.profiles.diet_restrictions IS 'Dietary restrictions and allergies for event planning purposes';
COMMENT ON COLUMN public.profiles.phone IS 'Phone number is mandatory for all users';

-- =====================================================
-- MEMBERSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL DEFAULT 'local' CHECK (membership_type IN ('local', 'national', 'international')),
  payment_type TEXT NOT NULL DEFAULT 'annual' CHECK (payment_type IN ('annual', 'monthly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
  member_number TEXT UNIQUE,
  annual_fee DECIMAL(10,2) DEFAULT 0.00,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.memberships IS 'User membership information with payment tracking';
COMMENT ON COLUMN public.memberships.membership_type IS 'Type of membership: local, national, or international';
COMMENT ON COLUMN public.memberships.payment_type IS 'Payment frequency: annual or monthly';
COMMENT ON COLUMN public.memberships.member_number IS 'Unique member identification number';

-- =====================================================
-- BOARD POSITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.board_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'local' CHECK (level IN ('local', 'national', 'international')),
  description TEXT,
  priority INTEGER DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.board_positions IS 'Board positions held by members with priority and level information';
COMMENT ON COLUMN public.board_positions.level IS 'Position level: local, national, or international';
COMMENT ON COLUMN public.board_positions.priority IS 'Display priority for ordering positions';
COMMENT ON COLUMN public.board_positions.description IS 'Optional description of the position';

-- =====================================================
-- MESSAGE TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  subject TEXT, -- Only for email templates
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.message_templates IS 'Email and WhatsApp message templates with variable support';
COMMENT ON COLUMN public.message_templates.type IS 'Template type: email or whatsapp';
COMMENT ON COLUMN public.message_templates.variables IS 'Array of available variables for the template';

-- =====================================================
-- ORGANIZATION SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000',
  organization_name TEXT NOT NULL DEFAULT 'JCI Connect',
  organization_city TEXT,
  organization_country TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT,
  smtp_use_tls BOOLEAN DEFAULT true,
  whatsapp_api_url TEXT,
  whatsapp_api_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.organization_settings IS 'Global organization settings including SMTP and WhatsApp configuration';

-- =====================================================
-- INTERACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('email', 'phone', 'meeting', 'event', 'other')),
  subject TEXT,
  description TEXT,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.interactions IS 'User interaction history and notes';

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('email', 'whatsapp', 'sms')),
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'pending')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.messages IS 'Message history for users';

-- =====================================================
-- NOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.notes IS 'User notes and comments';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Memberships policies
CREATE POLICY "Users can view their own membership" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships" ON public.memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Board positions policies
CREATE POLICY "Users can view their own board positions" ON public.board_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all board positions" ON public.board_positions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Message templates policies
CREATE POLICY "Authenticated users can view active templates" ON public.message_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all templates" ON public.message_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Organization settings policies
CREATE POLICY "Admins can manage organization settings" ON public.organization_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Interactions policies
CREATE POLICY "Users can view their own interactions" ON public.interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all interactions" ON public.interactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Messages policies
CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages" ON public.messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Notes policies
CREATE POLICY "Users can view their own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notes" ON public.notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to securely get user email
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_phone TEXT;
  user_role TEXT;
  user_status TEXT;
BEGIN
  -- Extract values with proper defaults
  user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', '+1000000000');
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'guest');
  user_status := COALESCE(NEW.raw_user_meta_data->>'status', 'active');
  
  -- Ensure phone is not null and has reasonable length
  IF user_phone IS NULL OR user_phone = '' OR LENGTH(user_phone) < 10 THEN
    user_phone := '+1000000000';
  END IF;
  
  -- Ensure role is valid
  IF user_role NOT IN ('admin', 'prospective', 'member', 'guest') THEN
    user_role := 'guest';
  END IF;
  
  -- Ensure status is valid
  IF user_status NOT IN ('active', 'inactive', 'suspended', 'pending') THEN
    user_status := 'active';
  END IF;
  
  -- Insert profile
  INSERT INTO public.profiles (id, first_name, last_name, phone, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    user_phone,
    user_role,
    user_status
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to securely delete a user (admin only)
CREATE OR REPLACE FUNCTION public.delete_user(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Get the role of the current user
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  -- Check if user is admin
  IF current_user_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Delete the user (this will cascade to all related records)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  RETURN json_build_object('success', true, 'message', 'User deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

