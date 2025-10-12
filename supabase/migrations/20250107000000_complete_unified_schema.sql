-- =====================================================
-- JCI CONNECT - COMPLETE UNIFIED DATABASE SCHEMA
-- Migration: Complete unified schema with all features
-- Date: 2025-01-07
-- Purpose: Single comprehensive migration for all JCI Connect features
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
  diet_restrictions TEXT, -- Added for event planning
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles with personal information including dietary restrictions for event planning';
COMMENT ON COLUMN public.profiles.role IS 'User role: admin (full access), senator (40+ approved member), officer (chapter board member), member (active), candidate (prospective), past_member (alumni/aged out), guest (browsing/interested)';
COMMENT ON COLUMN public.profiles.address IS 'Full address: street, city, country';
COMMENT ON COLUMN public.profiles.diet_restrictions IS 'Dietary restrictions and allergies for event planning purposes';

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
-- ORGANIZATION SETTINGS TABLE (renamed from chapter_settings)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000',
  organization_name TEXT NOT NULL DEFAULT 'JCI Organization',
  organization_city TEXT,
  organization_country TEXT,
  description TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#3A67B1',
  secondary_color TEXT NOT NULL DEFAULT '#0097D7',
  whatsapp_config JSONB DEFAULT '{}', -- WhatsApp EvolutionAPI configuration
  email_config JSONB DEFAULT '{}', -- SMTP email configuration
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.organization_settings IS 'Organization settings and configuration for JCI organizations';
COMMENT ON COLUMN public.organization_settings.whatsapp_config IS 'WhatsApp EvolutionAPI configuration';
COMMENT ON COLUMN public.organization_settings.email_config IS 'SMTP email configuration';

-- =====================================================
-- MESSAGE TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  subject TEXT, -- Only for email templates
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}', -- Array of variable names used in template
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.message_templates IS 'Message templates for email and WhatsApp communications';
COMMENT ON COLUMN public.message_templates.type IS 'Template type: email or whatsapp';
COMMENT ON COLUMN public.message_templates.subject IS 'Email subject line (only for email templates)';
COMMENT ON COLUMN public.message_templates.content IS 'Template content with variable placeholders like {{first_name}}';
COMMENT ON COLUMN public.message_templates.variables IS 'Array of variable names extracted from content';

-- =====================================================
-- COMMUNICATION CONFIGURATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.communication_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('whatsapp', 'email')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  config_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(type) -- Only one config per type
);

COMMENT ON TABLE public.communication_configs IS 'Communication service configurations (WhatsApp EvolutionAPI, SMTP, etc.)';
COMMENT ON COLUMN public.communication_configs.type IS 'Configuration type: whatsapp or email';
COMMENT ON COLUMN public.communication_configs.config_data IS 'JSON configuration data specific to each service type';

-- =====================================================
-- MESSAGE LOGS TABLE (for tracking sent messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.message_templates(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp')),
  subject TEXT, -- For email messages
  content TEXT NOT NULL,
  variables_used JSONB DEFAULT '{}', -- Variables that were replaced in the message
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.message_logs IS 'Log of all messages sent through the system';
COMMENT ON COLUMN public.message_logs.variables_used IS 'JSON object with the actual values used for each variable';
COMMENT ON COLUMN public.message_logs.status IS 'Message delivery status';

-- =====================================================
-- MEMBER ACTIVITIES TABLE (CRM)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.member_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'joined', 'role_changed', 'membership_updated', 'profile_updated',
    'message_sent', 'message_received', 'meeting_attended', 'event_attended',
    'payment_made', 'payment_overdue', 'board_position_added', 'board_position_removed',
    'status_changed', 'login', 'logout', 'password_changed', 'email_verified'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Additional data specific to activity type
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who performed the action
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.member_activities IS 'Timeline of all member activities and interactions';
COMMENT ON COLUMN public.member_activities.activity_type IS 'Type of activity: joined, role_changed, message_sent, etc.';
COMMENT ON COLUMN public.member_activities.metadata IS 'Additional data like old/new values, message content, etc.';

-- =====================================================
-- MEMBER INTERACTIONS TABLE (CRM)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.member_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'email', 'whatsapp', 'phone_call', 'meeting', 'event', 'note'
  )),
  subject TEXT,
  content TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  scheduled_at TIMESTAMPTZ, -- For scheduled interactions
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.member_interactions IS 'Detailed interaction records for CRM functionality';
COMMENT ON COLUMN public.member_interactions.direction IS 'Whether interaction was inbound (from member) or outbound (to member)';

-- =====================================================
-- MEMBER NOTES TABLE (CRM)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.member_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false, -- Private notes only visible to creator
  tags TEXT[] DEFAULT '{}', -- Tags for categorization
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.member_notes IS 'Notes and observations about members';
COMMENT ON COLUMN public.member_notes.is_private IS 'Private notes are only visible to the creator';

-- =====================================================
-- MEMBER TAGS TABLE (CRM)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.member_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL,
  tag_color TEXT DEFAULT '#3B82F6', -- Hex color for tag display
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tag_name) -- Prevent duplicate tags per user
);

COMMENT ON TABLE public.member_tags IS 'Custom tags for member categorization and filtering';

-- =====================================================
-- MEMBER FOLLOW-UPS TABLE (CRM)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.member_follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  follow_up_type TEXT NOT NULL CHECK (follow_up_type IN (
    'call', 'email', 'meeting', 'payment_reminder', 'event_invitation', 'general'
  )),
  due_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'overdue')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.member_follow_ups IS 'Follow-up tasks and reminders for member management';

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

CREATE INDEX IF NOT EXISTS idx_message_templates_type ON public.message_templates(type);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_active ON public.message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON public.message_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_communication_configs_type ON public.communication_configs(type);
CREATE INDEX IF NOT EXISTS idx_message_logs_template_id ON public.message_logs(template_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_recipient_id ON public.message_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_type ON public.message_logs(type);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON public.message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON public.message_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_member_activities_user_id ON public.member_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_member_activities_activity_type ON public.member_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_member_activities_created_at ON public.member_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_member_activities_created_by ON public.member_activities(created_by);

CREATE INDEX IF NOT EXISTS idx_member_interactions_user_id ON public.member_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_member_interactions_type ON public.member_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_member_interactions_direction ON public.member_interactions(direction);
CREATE INDEX IF NOT EXISTS idx_member_interactions_status ON public.member_interactions(status);
CREATE INDEX IF NOT EXISTS idx_member_interactions_created_at ON public.member_interactions(created_at);

CREATE INDEX IF NOT EXISTS idx_member_notes_user_id ON public.member_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_member_notes_created_by ON public.member_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_member_notes_created_at ON public.member_notes(created_at);
CREATE INDEX IF NOT EXISTS idx_member_notes_is_private ON public.member_notes(is_private);

CREATE INDEX IF NOT EXISTS idx_member_tags_user_id ON public.member_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_member_tags_tag_name ON public.member_tags(tag_name);

CREATE INDEX IF NOT EXISTS idx_member_follow_ups_user_id ON public.member_follow_ups(user_id);
CREATE INDEX IF NOT EXISTS idx_member_follow_ups_due_date ON public.member_follow_ups(due_date);
CREATE INDEX IF NOT EXISTS idx_member_follow_ups_status ON public.member_follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_member_follow_ups_assigned_to ON public.member_follow_ups(assigned_to);

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

  -- Check if current user is an admin
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users'
      USING HINT = 'not_admin';
  END IF;

  -- Prevent admins from deleting themselves
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete yourself'
      USING HINT = 'cannot_delete_self';
  END IF;

  -- Delete from auth.users (this will cascade to profiles and memberships)
  -- Note: This requires SECURITY DEFINER privilege
  DELETE FROM auth.users WHERE id = target_user_id;

  -- Return success with user_id
  RETURN json_build_object(
    'success', true,
    'user_id', target_user_id,
    'deleted_at', NOW()
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'hint', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user(UUID) IS 'Securely delete a user (admin only). Cascades to profiles and memberships.';

-- Grant execute permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- Function to extract variables from template content
CREATE OR REPLACE FUNCTION public.extract_template_variables(content TEXT, subject TEXT DEFAULT NULL)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  full_text TEXT;
  matches TEXT[];
BEGIN
  -- Combine content and subject
  full_text := COALESCE(content, '') || ' ' || COALESCE(subject, '');
  
  -- Extract all {{variable}} patterns
  SELECT ARRAY(
    SELECT DISTINCT regexp_replace(match, '[{}]', '', 'g')
    FROM regexp_split_to_table(full_text, '\{\{[^}]+\}\}') AS match
    WHERE match ~ '\{\{[^}]+\}\}'
  ) INTO matches;
  
  RETURN COALESCE(matches, ARRAY[]::TEXT[]);
END;
$$;

COMMENT ON FUNCTION public.extract_template_variables(TEXT, TEXT) IS 'Extracts variable names from template content and subject';

-- Function to validate template variables
CREATE OR REPLACE FUNCTION public.validate_template_variables(template_content TEXT, template_subject TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  variables TEXT[];
  valid_variables TEXT[] := ARRAY[
    'first_name', 'last_name', 'email', 'phone', 'member_number',
    'organization_name', 'organization_city', 'organization_country', 'website',
    'meeting_date', 'meeting_time', 'meeting_location', 'event_name',
    'event_date', 'event_location', 'payment_amount', 'due_date'
  ];
  var TEXT;
BEGIN
  variables := public.extract_template_variables(template_content, template_subject);
  
  -- Check if all variables are in the valid list
  FOREACH var IN ARRAY variables
  LOOP
    IF NOT (var = ANY(valid_variables)) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.validate_template_variables(TEXT, TEXT) IS 'Validates that all template variables are from the allowed list';

-- Function to create activity when member joins
CREATE OR REPLACE FUNCTION public.create_member_join_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.member_activities (user_id, activity_type, title, description, metadata)
  VALUES (
    NEW.id,
    'joined',
    'Member Joined',
    'New member joined the organization',
    jsonb_build_object(
      'role', NEW.role,
      'status', NEW.status,
      'first_name', NEW.first_name,
      'last_name', NEW.last_name
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity when role changes
CREATE OR REPLACE FUNCTION public.create_role_change_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role THEN
    INSERT INTO public.member_activities (user_id, activity_type, title, description, metadata)
    VALUES (
      NEW.id,
      'role_changed',
      'Role Changed',
      'Member role updated',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'first_name', NEW.first_name,
        'last_name', NEW.last_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity when membership changes
CREATE OR REPLACE FUNCTION public.create_membership_change_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status OR OLD.membership_type != NEW.membership_type THEN
    INSERT INTO public.member_activities (user_id, activity_type, title, description, metadata)
    VALUES (
      NEW.user_id,
      'membership_updated',
      'Membership Updated',
      'Membership status or type changed',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_type', OLD.membership_type,
        'new_type', NEW.membership_type,
        'member_number', NEW.member_number
      )
    );
  END IF;
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

CREATE TRIGGER set_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_communication_configs_updated_at
  BEFORE UPDATE ON public.communication_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_member_interactions_updated_at
  BEFORE UPDATE ON public.member_interactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_member_notes_updated_at
  BEFORE UPDATE ON public.member_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_member_follow_ups_updated_at
  BEFORE UPDATE ON public.member_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile on user signup
-- Drop trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Triggers for automatic activity creation
CREATE TRIGGER create_member_join_activity_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_member_join_activity();

CREATE TRIGGER create_role_change_activity_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_role_change_activity();

CREATE TRIGGER create_membership_change_activity_trigger
  AFTER UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.create_membership_change_activity();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_follow_ups ENABLE ROW LEVEL SECURITY;

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
-- ORGANIZATION SETTINGS TABLE POLICIES
-- =====================================================

CREATE POLICY "Allow authenticated users to read organization settings"
  ON public.organization_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage organization settings"
  ON public.organization_settings FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- MESSAGE TEMPLATES TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read active templates
CREATE POLICY "Users can view active templates"
  ON public.message_templates FOR SELECT
  USING (
    auth.role() = 'authenticated' 
    AND is_active = true
  );

-- Allow admins to manage all templates
CREATE POLICY "Admins can manage all templates"
  ON public.message_templates FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Allow senators to view all templates
CREATE POLICY "Senators can view all templates"
  ON public.message_templates FOR SELECT
  USING (public.get_my_role() = 'senator');

-- =====================================================
-- COMMUNICATION CONFIGURATIONS TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read configurations
CREATE POLICY "Users can view communication configs"
  ON public.communication_configs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage configurations
CREATE POLICY "Admins can manage communication configs"
  ON public.communication_configs FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- MESSAGE LOGS TABLE POLICIES
-- =====================================================

-- Users can view their own message logs
CREATE POLICY "Users can view their own message logs"
  ON public.message_logs FOR SELECT
  USING (auth.uid() = recipient_id);

-- Admins can view all message logs
CREATE POLICY "Admins can view all message logs"
  ON public.message_logs FOR SELECT
  USING (public.get_my_role() = 'admin');

-- Admins can manage message logs
CREATE POLICY "Admins can manage message logs"
  ON public.message_logs FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- MEMBER ACTIVITIES TABLE POLICIES
-- =====================================================

-- Users can view their own activities
CREATE POLICY "Users can view their own activities"
  ON public.member_activities FOR SELECT
  USING (auth.uid() = user_id);

-- Admins and senators can view all activities
CREATE POLICY "Admins and senators can view all activities"
  ON public.member_activities FOR SELECT
  USING (public.get_my_role() IN ('admin', 'senator'));

-- Admins can manage all activities
CREATE POLICY "Admins can manage all activities"
  ON public.member_activities FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- MEMBER INTERACTIONS TABLE POLICIES
-- =====================================================

-- Users can view their own interactions
CREATE POLICY "Users can view their own interactions"
  ON public.member_interactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins and senators can view all interactions
CREATE POLICY "Admins and senators can view all interactions"
  ON public.member_interactions FOR SELECT
  USING (public.get_my_role() IN ('admin', 'senator'));

-- Admins can manage all interactions
CREATE POLICY "Admins can manage all interactions"
  ON public.member_interactions FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- MEMBER NOTES TABLE POLICIES
-- =====================================================

-- Users can view their own notes
CREATE POLICY "Users can view their own notes"
  ON public.member_notes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view public notes about them
CREATE POLICY "Users can view public notes about them"
  ON public.member_notes FOR SELECT
  USING (auth.uid() = user_id AND is_private = false);

-- Admins and senators can view all public notes
CREATE POLICY "Admins and senators can view public notes"
  ON public.member_notes FOR SELECT
  USING (public.get_my_role() IN ('admin', 'senator') AND is_private = false);

-- Users can view their own private notes
CREATE POLICY "Users can view their own private notes"
  ON public.member_notes FOR SELECT
  USING (auth.uid() = created_by);

-- Admins can manage all notes
CREATE POLICY "Admins can manage all notes"
  ON public.member_notes FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- MEMBER TAGS TABLE POLICIES
-- =====================================================

-- Users can view their own tags
CREATE POLICY "Users can view their own tags"
  ON public.member_tags FOR SELECT
  USING (auth.uid() = user_id);

-- Admins and senators can view all tags
CREATE POLICY "Admins and senators can view all tags"
  ON public.member_tags FOR SELECT
  USING (public.get_my_role() IN ('admin', 'senator'));

-- Admins can manage all tags
CREATE POLICY "Admins can manage all tags"
  ON public.member_tags FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- MEMBER FOLLOW-UPS TABLE POLICIES
-- =====================================================

-- Users can view their own follow-ups
CREATE POLICY "Users can view their own follow-ups"
  ON public.member_follow_ups FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view follow-ups assigned to them
CREATE POLICY "Users can view assigned follow-ups"
  ON public.member_follow_ups FOR SELECT
  USING (auth.uid() = assigned_to);

-- Admins and senators can view all follow-ups
CREATE POLICY "Admins and senators can view all follow-ups"
  ON public.member_follow_ups FOR SELECT
  USING (public.get_my_role() IN ('admin', 'senator'));

-- Admins can manage all follow-ups
CREATE POLICY "Admins can manage all follow-ups"
  ON public.member_follow_ups FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert default organization settings
INSERT INTO public.organization_settings (
  id, 
  organization_name, 
  organization_city, 
  organization_country, 
  description, 
  email, 
  phone, 
  website, 
  logo_url, 
  primary_color, 
  secondary_color,
  whatsapp_config,
  email_config
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
  '#0097D7',
  '{}',
  '{}'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample email template
INSERT INTO public.message_templates (name, type, subject, content, variables, is_active) VALUES
(
  'Prospective Member Email',
  'email',
  'Explore Growth, Leadership & Friendship with {{organization_name}}',
  'Hi {{first_name}},

Thank you for your interest in {{organization_name}}. We''re a community of young leaders and professionals who believe in developing skills, creating impact, and building lifelong friendships along the way.

When you become part of JCI, you open the door to a wide range of opportunities for personal and professional growth:

<strong>Training & Mentorship</strong> – Participate in workshops, develop public speaking and facilitation skills, and even progress toward becoming a certified JCI trainer.

<strong>Leadership Development</strong> – Take up local, national, or international leadership roles that challenge and grow your abilities.

<strong>Entrepreneurship & Innovation</strong> – Join projects that nurture entrepreneurial thinking and bring ideas to life.

<strong>Community Impact</strong> – Lead or support initiatives that address real challenges and create meaningful change in Ottawa.

<strong>Networking & Global Connections</strong> – Build strong relationships with professionals, entrepreneurs, and changemakers across Canada and over 100 countries worldwide.

You can learn more about {{organization_name}} here: https://www.jciottawa.ca/index.php

If you''d like to have a personal conversation about how JCI fits with your goals, you can schedule a short call with our Membership Director. [Insert Calendar Link]

We''d love for you to experience what JCI truly offers — a place where learning leads to leadership, and friendships last far beyond meetings and events. Looking forward to see you as part of the community.

Warm regards,
Israel
President, {{organization_name}}',
  ARRAY['first_name', 'organization_name'],
  true
) ON CONFLICT DO NOTHING;

-- Insert sample WhatsApp template
INSERT INTO public.message_templates (name, type, content, variables, is_active) VALUES
(
  'JCI Ottawa Welcome WhatsApp',
  'whatsapp',
  'Hi *{{first_name}} {{last_name}}*
Welcome to *{{organization_name}}*. We''re excited to have you join our community of young leaders.

Do you believe in _lifelong friendships_? At JCI, you''ll find opportunities to build genuine connections while growing your skills and making an impact.

Here are a few links to help you get started:
• WhatsApp Group (for updates and reminders): Join here
• JVC Platform (workshops and leadership resources): https://jvc.jci.cc/
• Website (events and projects): https://www.jciottawa.ca/index.php
• Facebook: https://www.facebook.com/JCI.Ottawa
• Instagram: https://www.instagram.com/jciottawa/

You''ll also find a detailed welcome email in your inbox with more information about *{{organization_name}}* and how to get involved.

If you''d like, you can schedule a short call with our Membership Director (Your new friend) for a personal orientation into the organization. (we will create a Calendly Link or alternate open source)

Looking forward to meeting you soon — because beyond skills and projects, JCI is where _lifelong friendships_ are built.

Best Regards,
Israel
President
*{{organization_name}}*',
  ARRAY['first_name', 'last_name', 'organization_name'],
  true
) ON CONFLICT DO NOTHING;

-- Insert default communication configurations
INSERT INTO public.communication_configs (type, enabled, config_data) VALUES
(
  'whatsapp',
  false,
  '{
    "api_url": "",
    "api_key": "",
    "instance_name": "",
    "webhook_url": ""
  }'
),
(
  'email',
  false,
  '{
    "smtp_host": "",
    "smtp_port": 587,
    "smtp_username": "",
    "smtp_password": "",
    "smtp_secure": false,
    "from_email": "",
    "from_name": ""
  }'
) ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ JCI Connect Complete Unified Schema Created Successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 Core Tables: profiles, memberships, board_positions, organization_settings';
  RAISE NOTICE '📧 Communication: message_templates, communication_configs, message_logs';
  RAISE NOTICE '👥 CRM Features: member_activities, member_interactions, member_notes, member_tags, member_follow_ups';
  RAISE NOTICE '🔧 Functions: get_my_role, delete_user, extract_template_variables, validate_template_variables';
  RAISE NOTICE '🔒 RLS enabled on all tables with optimized policies';
  RAISE NOTICE '⚡ Indexes created for performance';
  RAISE NOTICE '📝 Sample data and templates created';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Step: Create admin user via Supabase Auth UI';
  RAISE NOTICE 'Then run: UPDATE profiles SET role = ''admin'' WHERE id = ''user-id'';';
  RAISE NOTICE '========================================';
END $$;
