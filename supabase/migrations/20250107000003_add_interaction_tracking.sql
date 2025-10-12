-- =====================================================
-- JCI CONNECT - INTERACTION TRACKING SCHEMA
-- Migration: Add interaction tracking for CRM functionality
-- Date: 2025-01-07
-- Purpose: Track all member interactions and activities
-- =====================================================

-- =====================================================
-- MEMBER ACTIVITIES TABLE
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
-- MEMBER INTERACTIONS TABLE
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
-- MEMBER NOTES TABLE
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
-- MEMBER TAGS TABLE
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
-- MEMBER FOLLOW-UPS TABLE
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
-- TRIGGERS
-- =====================================================

-- Apply updated_at trigger to tables that need it
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

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.member_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_follow_ups ENABLE ROW LEVEL SECURITY;

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
-- FUNCTIONS
-- =====================================================

-- Function to create activity when member joins
CREATE OR REPLACE FUNCTION public.create_member_join_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.member_activities (user_id, activity_type, title, description, metadata)
  VALUES (
    NEW.id,
    'joined',
    'Member Joined',
    'New member joined the chapter',
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
-- TRIGGERS FOR AUTOMATIC ACTIVITY CREATION
-- =====================================================

-- Create activity when new profile is created
CREATE TRIGGER create_member_join_activity_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_member_join_activity();

-- Create activity when role changes
CREATE TRIGGER create_role_change_activity_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_role_change_activity();

-- Create activity when membership changes
CREATE TRIGGER create_membership_change_activity_trigger
  AFTER UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.create_membership_change_activity();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample tags
INSERT INTO public.member_tags (user_id, tag_name, tag_color) 
SELECT 
  p.id,
  'VIP Member',
  '#10B981'
FROM public.profiles p 
WHERE p.role = 'senator'
LIMIT 1
ON CONFLICT (user_id, tag_name) DO NOTHING;

INSERT INTO public.member_tags (user_id, tag_name, tag_color) 
SELECT 
  p.id,
  'Board Member',
  '#3B82F6'
FROM public.profiles p 
WHERE p.role = 'officer'
LIMIT 1
ON CONFLICT (user_id, tag_name) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Interaction Tracking Schema Created Successfully';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 Tables: member_activities, member_interactions, member_notes, member_tags, member_follow_ups';
  RAISE NOTICE '🔧 Functions: create_member_join_activity, create_role_change_activity, create_membership_change_activity';
  RAISE NOTICE '🔒 RLS enabled on all tables';
  RAISE NOTICE '⚡ Automatic activity tracking triggers created';
  RAISE NOTICE '📝 Sample data inserted';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next Step: Enhance member detail page with CRM features';
  RAISE NOTICE '========================================';
END $$;
