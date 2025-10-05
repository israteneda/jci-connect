-- =====================================================
-- CHAPTER SETTINGS TABLE
-- Migration: Add organization/chapter settings
-- Date: 2025-01-06
-- Purpose: Store chapter configuration (single row)
-- =====================================================

-- Create chapter_settings table (single row configuration)
CREATE TABLE IF NOT EXISTS public.chapter_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_name TEXT NOT NULL DEFAULT 'JCI Chapter',
  chapter_city TEXT,
  chapter_country TEXT,
  description TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3A67B1',
  secondary_color TEXT DEFAULT '#0097D7',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_settings_row CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- Insert default settings (single row)
INSERT INTO public.chapter_settings (
  id,
  chapter_name,
  chapter_city,
  chapter_country,
  description
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'JCI Chapter',
  'Your City',
  'Your Country',
  'Junior Chamber International - Empowering young leaders'
) ON CONFLICT (id) DO NOTHING;

-- Add index
CREATE INDEX IF NOT EXISTS idx_chapter_settings_id ON public.chapter_settings(id);

-- Enable RLS
ALTER TABLE public.chapter_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can read settings
CREATE POLICY "Anyone can view chapter settings"
  ON public.chapter_settings FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update chapter settings"
  ON public.chapter_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add updated_at trigger
CREATE TRIGGER set_chapter_settings_updated_at
  BEFORE UPDATE ON public.chapter_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE public.chapter_settings IS 'Organization/chapter configuration - single row table';
COMMENT ON COLUMN public.chapter_settings.chapter_name IS 'Name of the chapter/organization';
COMMENT ON CONSTRAINT single_settings_row ON public.chapter_settings IS 'Ensures only one settings row exists';

