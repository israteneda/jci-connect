-- Rename chapter_settings table to organization_settings
-- This migration renames the table and all related columns from chapter to organization terminology

-- Rename the table
ALTER TABLE public.chapter_settings RENAME TO organization_settings;

-- Rename the columns
ALTER TABLE public.organization_settings 
  RENAME COLUMN chapter_name TO organization_name;

ALTER TABLE public.organization_settings 
  RENAME COLUMN chapter_city TO organization_city;

ALTER TABLE public.organization_settings 
  RENAME COLUMN chapter_country TO organization_country;

-- Update table comment
COMMENT ON TABLE public.organization_settings IS 'Organization settings and configuration for JCI organizations';

-- Update column comments
COMMENT ON COLUMN public.organization_settings.organization_name IS 'Name of the JCI organization';
COMMENT ON COLUMN public.organization_settings.organization_city IS 'City where the organization is located';
COMMENT ON COLUMN public.organization_settings.organization_country IS 'Country where the organization is located';

-- Update any existing data to reflect the new terminology
-- (This is optional and can be customized based on your specific needs)
UPDATE public.organization_settings 
SET organization_name = REPLACE(organization_name, 'Chapter', 'Organization')
WHERE organization_name LIKE '%Chapter%';

-- Add a notice about the migration
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Chapter to Organization Migration Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 Table renamed: chapter_settings → organization_settings';
    RAISE NOTICE '🔧 Columns renamed: chapter_* → organization_*';
    RAISE NOTICE '📝 Comments updated for new terminology';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Next Step: Update frontend code to use new table/column names';
    RAISE NOTICE '========================================';
END $$;
