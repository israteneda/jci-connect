-- =====================================================
-- BOARD POSITIONS TABLE
-- Migration: Add board positions feature
-- Date: 2025-01-05
-- =====================================================

-- Create board_positions table
CREATE TABLE IF NOT EXISTS public.board_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('chapter', 'national', 'international')),
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_chapter_position CHECK (
    (level = 'chapter' AND chapter_id IS NOT NULL) OR 
    (level IN ('national', 'international') AND chapter_id IS NULL)
  )
);

-- Add indexes for board_positions
CREATE INDEX IF NOT EXISTS idx_board_positions_user_id ON public.board_positions(user_id);
CREATE INDEX IF NOT EXISTS idx_board_positions_is_active ON public.board_positions(is_active);
CREATE INDEX IF NOT EXISTS idx_board_positions_level ON public.board_positions(level);

-- Enable RLS
ALTER TABLE public.board_positions ENABLE ROW LEVEL SECURITY;

-- Board positions table policies
CREATE POLICY "Admins can view all board positions"
  ON public.board_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage board positions"
  ON public.board_positions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Senators can view all board positions"
  ON public.board_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'senator'
    )
  );

CREATE POLICY "Members can view all board positions"
  ON public.board_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('member', 'senator', 'admin')
    )
  );

CREATE POLICY "Users can view their own board positions"
  ON public.board_positions FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Add updated_at trigger for board_positions
CREATE TRIGGER set_board_positions_updated_at
  BEFORE UPDATE ON public.board_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE public.board_positions IS 'Stores member board positions at chapter, national, and international levels';
COMMENT ON COLUMN public.board_positions.level IS 'Position level: chapter, national, or international';
COMMENT ON COLUMN public.board_positions.is_active IS 'Whether position is currently active (false = historical)';
COMMENT ON CONSTRAINT valid_chapter_position ON public.board_positions IS 'Chapter positions must have chapter_id, national/international must not';

