-- =====================================================
-- SEED DATA for JCI Connect
-- Run this after the initial migration
-- =====================================================

-- This system is designed for single-chapter installations
-- Each chapter deploys their own instance

-- Note: Admin users should be created through Supabase Auth Dashboard
-- After creating a user, update their role:
-- UPDATE public.profiles SET role = 'admin', status = 'active' WHERE id = 'user-id-here';

-- Example: Create a test member with membership
-- First create user in Auth Dashboard, then:
-- INSERT INTO public.memberships (user_id, membership_type, status, start_date, expiry_date, member_number, payment_status, annual_fee)
-- VALUES ('user-id-here', 'local', 'active', '2025-01-01', '2025-12-31', 'M-001', 'paid', 100.00);

-- Example: Add a board position for a member
-- INSERT INTO public.board_positions (user_id, position_title, level, start_date, is_active)
-- VALUES ('user-id-here', 'President', 'local', '2025-01-01', true);
