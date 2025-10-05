-- =====================================================
-- SEED DATA for JCI Connect
-- Run this after the initial migration
-- =====================================================

-- Insert chapters for Canada
INSERT INTO public.chapters (name, city, country, description, status) VALUES
  ('JCI Ottawa', 'Ottawa', 'Canada', 'Junior Chamber International Ottawa - Capital city innovation leaders', 'active')
ON CONFLICT DO NOTHING;

-- Insert chapters for Ecuador
INSERT INTO public.chapters (name, city, country, description, status) VALUES
  ('JCI Ambato', 'Ambato', 'Ecuador', 'Junior Chamber International Ambato - Agricultural innovation and entrepreneurship', 'active')
ON CONFLICT DO NOTHING;

-- Note: Admin users should be created through Supabase Auth Dashboard
-- After creating a user, update their role:
-- UPDATE public.profiles SET role = 'admin', status = 'active' WHERE id = 'user-id-here';

-- Note: To create a member who is also a chapter president:
-- 1. Create user in Auth Dashboard
-- 2. Set role to 'member' in profiles table
-- 3. Create membership record
-- 4. Update chapter.president_id to reference the user
