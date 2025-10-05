import { useAuth } from './useAuth';
import { 
  hasPermission, 
  canAccessResource, 
  getResourceActions,
  type Resource, 
  type Action, 
  type Role 
} from '@/lib/permissions';

/**
 * Permission hook for checking user permissions in components
 * 
 * This hook provides a convenient way to check permissions based on
 * the current user's role. It automatically fetches the user's role
 * from the auth context.
 * 
 * @example
 * ```typescript
 * function MembersList() {
 *   const { can, canAccess, getActions } = usePermissions();
 *   
 *   return (
 *     <div>
 *       {can('members', 'read') && <MemberList />}
 *       {can('members', 'create') && <AddMemberButton />}
 *       {can('members', 'delete') && <DeleteButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions() {
  const { user } = useAuth();
  const userRole = (user?.role || 'candidate') as Role;

  /**
   * Check if current user can perform an action on a resource
   * 
   * @param resource - The resource to check
   * @param action - The action to perform
   * @returns true if user has permission
   * 
   * @example
   * ```typescript
   * const { can } = usePermissions();
   * 
   * if (can('members', 'delete')) {
   *   // Show delete button
   * }
   * ```
   */
  const can = (resource: Resource, action: Action): boolean => {
    return hasPermission(userRole, resource, action);
  };

  /**
   * Check if current user can access a resource at all
   * 
   * @param resource - The resource to check
   * @returns true if user has any permission on the resource
   * 
   * @example
   * ```typescript
   * const { canAccess } = usePermissions();
   * 
   * if (canAccess('chapters')) {
   *   // Show chapters section
   * }
   * ```
   */
  const canAccess = (resource: Resource): boolean => {
    return canAccessResource(userRole, resource);
  };

  /**
   * Get all actions the current user can perform on a resource
   * 
   * @param resource - The resource to check
   * @returns Array of allowed actions
   * 
   * @example
   * ```typescript
   * const { getActions } = usePermissions();
   * 
   * const memberActions = getActions('members');
   * // Returns: ['read', 'update'] for a regular member
   * ```
   */
  const getActions = (resource: Resource): Action[] => {
    return getResourceActions(userRole, resource);
  };

  /**
   * Check if current user can manage a specific user
   * This checks if they can update or delete the target user
   * 
   * @param targetUserId - The ID of the user to check
   * @returns true if current user can manage the target user
   * 
   * @example
   * ```typescript
   * const { canManageUser } = usePermissions();
   * 
   * if (canManageUser(memberId)) {
   *   // Show edit/delete buttons
   * }
   * ```
   */
  const canManageUser = (targetUserId: string): boolean => {
    // Admins can manage all users
    if (userRole === 'admin') {
      return true;
    }

    // Users can manage their own profile
    if (user?.id === targetUserId) {
      return can('profile', 'update');
    }

    // Otherwise, no permission
    return false;
  };

  /**
   * Check if current user is an admin
   * Convenience helper for common checks
   */
  const isAdmin = (): boolean => {
    return userRole === 'admin';
  };

  /**
   * Check if current user is a senator
   * Convenience helper for common checks
   */
  const isSenator = (): boolean => {
    return userRole === 'senator';
  };

  /**
   * Check if current user is a member (including senators)
   * Convenience helper for common checks
   */
  const isMember = (): boolean => {
    return userRole === 'member' || userRole === 'senator';
  };

  return {
    can,
    canAccess,
    getActions,
    canManageUser,
    isAdmin,
    isSenator,
    isMember,
    role: userRole,
  };
}

