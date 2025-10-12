-- =====================================================
-- ADD DELETE USER FUNCTION
-- Migration: Add secure function to delete users
-- Date: 2025-01-07
-- Purpose: Allow admins to delete users securely from frontend
-- =====================================================

-- Function to securely delete a user (admin only)
-- This function has SECURITY DEFINER which allows it to delete from auth.users
-- even though the calling user doesn't have direct access
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

-- Add comment
COMMENT ON FUNCTION public.delete_user(UUID) IS 'Securely delete a user (admin only). Cascades to profiles and memberships.';

-- Grant execute permission to authenticated users (function checks admin role internally)
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

