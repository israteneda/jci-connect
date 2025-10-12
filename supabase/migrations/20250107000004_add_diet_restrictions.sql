-- Add diet_restrictions column to profiles table
-- This migration adds a field to store dietary restrictions and allergies for event planning

-- Add diet_restrictions column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN diet_restrictions TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.diet_restrictions IS 'Dietary restrictions and allergies for event planning purposes';

-- Update the profiles table comment
COMMENT ON TABLE public.profiles IS 'User profiles with personal information including dietary restrictions for event planning';
