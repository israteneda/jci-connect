-- =====================================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- Use this to completely reset the database before running migrations
-- =====================================================

-- =====================================================
-- DISABLE TRIGGERS AND CONSTRAINTS
-- =====================================================

-- Disable the auth trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- DROP ALL CUSTOM FUNCTIONS
-- =====================================================

-- Core functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.delete_user(UUID) CASCADE;

-- Activity tracking functions
DROP FUNCTION IF EXISTS public.create_member_join_activity() CASCADE;
DROP FUNCTION IF EXISTS public.create_membership_change_activity() CASCADE;
DROP FUNCTION IF EXISTS public.create_role_change_activity() CASCADE;

-- Template functions
DROP FUNCTION IF EXISTS public.extract_template_variables(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.validate_template_variables(text, text) CASCADE;

-- Utility functions
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =====================================================
-- DROP ALL CUSTOM TABLES (in reverse dependency order)
-- =====================================================

-- Drop tables that reference other tables first
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.interactions CASCADE;
DROP TABLE IF EXISTS public.board_positions CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.message_templates CASCADE;
DROP TABLE IF EXISTS public.organization_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Additional tables from your database
DROP TABLE IF EXISTS public.communication_configs CASCADE;
DROP TABLE IF EXISTS public.member_activities CASCADE;
DROP TABLE IF EXISTS public.member_follow_ups CASCADE;
DROP TABLE IF EXISTS public.member_interactions CASCADE;
DROP TABLE IF EXISTS public.member_notes CASCADE;
DROP TABLE IF EXISTS public.member_tags CASCADE;
DROP TABLE IF EXISTS public.message_logs CASCADE;

-- =====================================================
-- DROP ALL POLICIES (if any remain)
-- =====================================================

-- Note: Policies are automatically dropped when tables are dropped
-- But let's be explicit about it

-- =====================================================
-- CLEAN UP EXTENSIONS (optional - keep uuid-ossp)
-- =====================================================

-- Keep uuid-ossp extension as it's commonly used
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check what tables remain in public schema
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check what functions remain in public schema
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Database Cleanup Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All custom tables dropped';
  RAISE NOTICE 'All custom functions dropped';
  RAISE NOTICE 'All triggers removed';
  RAISE NOTICE 'All policies removed';
  RAISE NOTICE 'Database is now clean and ready for fresh migration';
  RAISE NOTICE '========================================';
END $$;
