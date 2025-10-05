-- =====================================================
-- REMOVE CHAPTERS - Single Chapter Architecture
-- Migration: Remove chapters table and related dependencies
-- Date: 2025-01-06
-- Reason: Each installation will serve a single chapter
-- =====================================================

-- =====================================================
-- STEP 1: Update board_positions table
-- =====================================================

-- Drop the old constraint
ALTER TABLE public.board_positions
DROP CONSTRAINT IF EXISTS valid_chapter_position;

-- Remove chapter_id column
ALTER TABLE public.board_positions
DROP COLUMN IF EXISTS chapter_id;

-- Update level enum to use 'local' instead of 'chapter'
-- First, update any existing 'chapter' values to 'local'
UPDATE public.board_positions
SET level = 'local'
WHERE level = 'chapter';

-- Drop the old check constraint on level
ALTER TABLE public.board_positions
DROP CONSTRAINT IF EXISTS board_positions_level_check;

-- Add new check constraint with 'local' instead of 'chapter'
ALTER TABLE public.board_positions
ADD CONSTRAINT board_positions_level_check 
CHECK (level IN ('local', 'national', 'international'));

-- Update comments
COMMENT ON TABLE public.board_positions IS 'Stores member board positions at local, national, and international levels';
COMMENT ON COLUMN public.board_positions.level IS 'Position level: local (chapter), national, or international';

-- =====================================================
-- STEP 2: Update memberships table
-- =====================================================

-- Drop the index on chapter_id
DROP INDEX IF EXISTS idx_memberships_chapter_id;

-- First, make chapter_id nullable (if it's not already)
ALTER TABLE public.memberships
ALTER COLUMN chapter_id DROP NOT NULL;

-- Drop the foreign key constraint
ALTER TABLE public.memberships
DROP CONSTRAINT IF EXISTS memberships_chapter_id_fkey;

-- Remove the chapter_id column
ALTER TABLE public.memberships
DROP COLUMN IF EXISTS chapter_id;

-- =====================================================
-- STEP 3: Drop chapter-related functions
-- =====================================================

DROP FUNCTION IF EXISTS increment_chapter_members(UUID);
DROP FUNCTION IF EXISTS decrement_chapter_members(UUID);

-- =====================================================
-- STEP 4: Drop chapters table and related objects
-- =====================================================

-- Drop indexes
DROP INDEX IF EXISTS idx_chapters_status;

-- Drop RLS policies
DROP POLICY IF EXISTS "Authenticated users can view active chapters" ON public.chapters;
DROP POLICY IF EXISTS "Admins can manage chapters" ON public.chapters;

-- Drop trigger
DROP TRIGGER IF EXISTS set_chapters_updated_at ON public.chapters;

-- Finally, drop the chapters table
DROP TABLE IF EXISTS public.chapters CASCADE;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- Add a comment to document this migration
COMMENT ON TABLE public.memberships IS 'Member membership details - single chapter per installation';
COMMENT ON TABLE public.board_positions IS 'Board positions at local (chapter), national, and international levels';

