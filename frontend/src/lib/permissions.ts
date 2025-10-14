/**
 * Permission System for JCI Connect
 * 
 * This module provides a flexible, action-level permission system
 * that can be extended for different organizations and roles.
 * 
 * Design Philosophy:
 * - Resource-based: Permissions are grouped by resource (members, reports, etc.)
 * - Action-level: Each resource has specific actions (create, read, update, delete)
 * - Role-based: Permissions are assigned to roles, not individual users
 * - Extensible: Easy to add new roles, resources, or actions
 */

// =====================================================
// TYPES
// =====================================================

export type Role = 'admin' | 'member' | 'prospective' | 'guest';

export type Action = 'create' | 'read' | 'update' | 'delete';

export type Resource = 
  | 'members' 
  | 'memberships'
  | 'board_positions'
  | 'settings'
  | 'reports'
  | 'profile'
  | 'templates';

export type ResourcePermissions = {
  [key in Resource]?: Action[];
};

export type Permissions = {
  [key in Role]: ResourcePermissions;
};

// =====================================================
// PERMISSION DEFINITIONS
// =====================================================

/**
 * Central permission configuration
 * 
 * To add a new role:
 * 1. Add the role to the Role type above
 * 2. Add the role to this PERMISSIONS object
 * 3. Define which resources and actions the role can access
 * 
 * To add a new resource:
 * 1. Add the resource to the Resource type above
 * 2. Add the resource to relevant roles in PERMISSIONS
 */
export const PERMISSIONS: Permissions = {
  /**
   * ADMIN: Platform administrator (hidden from regular users)
   * Full system access - can manage all resources and users
   */
  admin: {
    members: ['create', 'read', 'update', 'delete'],
    memberships: ['create', 'read', 'update', 'delete'],
    board_positions: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    reports: ['create', 'read'],
    profile: ['read', 'update'],
    templates: ['create', 'read', 'update', 'delete'],
  },

  /**
   * MEMBER: Active organization member
   * Standard member with access to community resources
   */
  member: {
    members: ['read'], // Can view other members
    memberships: ['read'], // Can view membership information
    board_positions: ['read'], // Can view board positions
    profile: ['read', 'update'], // Can manage own profile
  },

  /**
   * PROSPECTIVE: Potential member
   * Limited access while being evaluated for membership
   */
  prospective: {
    profile: ['read', 'update'], // Can only access own profile
  },

  /**
   * GUEST: Browsing or interested non-member
   * Very limited access - for people interested in JCI or attending events
   * Cannot access member directory or organizational resources
   */
  guest: {
    profile: ['read', 'update'], // Can only access own profile
  },
};

// =====================================================
// PERMISSION CHECKING FUNCTIONS
// =====================================================

/**
 * Check if a role has permission to perform an action on a resource
 * 
 * @param role - The user's role
 * @param resource - The resource being accessed
 * @param action - The action being performed
 * @returns true if the role has permission, false otherwise
 * 
 * @example
 * ```typescript
 * hasPermission('member', 'members', 'read'); // true
 * hasPermission('member', 'members', 'delete'); // false
 * hasPermission('admin', 'members', 'delete'); // true
 * ```
 */
export function hasPermission(
  role: Role,
  resource: Resource,
  action: Action
): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  const resourceActions = rolePermissions[resource];
  if (!resourceActions) return false;

  return resourceActions.includes(action);
}

/**
 * Get all permissions for a specific role
 * 
 * @param role - The user's role
 * @returns Object containing all permissions for the role
 * 
 * @example
 * ```typescript
 * getRolePermissions('member');
 * // Returns: { members: ['read'], memberships: ['read'], ... }
 * ```
 */
export function getRolePermissions(role: Role): ResourcePermissions {
  return PERMISSIONS[role] || {};
}

/**
 * Check if a role can perform ANY action on a resource
 * 
 * @param role - The user's role
 * @param resource - The resource being checked
 * @returns true if the role has any permission on the resource
 * 
 * @example
 * ```typescript
 * canAccessResource('member', 'members'); // true
 * canAccessResource('guest', 'members'); // false
 * ```
 */
export function canAccessResource(role: Role, resource: Resource): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  const resourceActions = rolePermissions[resource];
  return !!resourceActions && resourceActions.length > 0;
}

/**
 * Get all actions a role can perform on a resource
 * 
 * @param role - The user's role
 * @param resource - The resource being checked
 * @returns Array of actions the role can perform
 * 
 * @example
 * ```typescript
 * getResourceActions('admin', 'members');
 * // Returns: ['create', 'read', 'update', 'delete']
 * ```
 */
export function getResourceActions(role: Role, resource: Resource): Action[] {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return [];

  return rolePermissions[resource] || [];
}

