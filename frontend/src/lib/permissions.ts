/**
 * Permission System for JCI Connect
 * 
 * This module provides a flexible, action-level permission system
 * that can be extended for different organizations and roles.
 * 
 * Design Philosophy:
 * - Resource-based: Permissions are grouped by resource (members, chapters, etc.)
 * - Action-level: Each resource has specific actions (create, read, update, delete)
 * - Role-based: Permissions are assigned to roles, not individual users
 * - Extensible: Easy to add new roles, resources, or actions
 */

// =====================================================
// TYPES
// =====================================================

export type Role = 'admin' | 'senator' | 'member' | 'candidate';

export type Action = 'create' | 'read' | 'update' | 'delete';

export type Resource = 
  | 'members' 
  | 'chapters' 
  | 'senators'
  | 'memberships'
  | 'settings'
  | 'reports'
  | 'profile';

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
   * ADMIN: Full system access
   * Can manage all resources and users
   */
  admin: {
    members: ['create', 'read', 'update', 'delete'],
    senators: ['create', 'read', 'update', 'delete'],
    chapters: ['create', 'read', 'update', 'delete'],
    memberships: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    reports: ['create', 'read'],
    profile: ['read', 'update'],
  },

  /**
   * SENATOR: Enhanced member with additional privileges
   * Senators are members 40+ years old approved by the international organization
   * They remain part of their local chapter but have elevated access
   */
  senator: {
    members: ['read'], // Can view all member profiles
    senators: ['read'], // Can view other senators
    chapters: ['read'], // Can view all chapters
    memberships: ['read'], // Can view membership information
    reports: ['read'], // Access to reports and analytics
    profile: ['read', 'update'], // Can manage own profile
  },

  /**
   * MEMBER: Active chapter member
   * Standard member with access to community resources
   */
  member: {
    members: ['read'], // Can view other members
    chapters: ['read'], // Can view chapters
    profile: ['read', 'update'], // Can manage own profile
  },

  /**
   * CANDIDATE: Potential member
   * Limited access while being evaluated for membership
   */
  candidate: {
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
 * getRolePermissions('senator');
 * // Returns: { members: ['read'], senators: ['read'], ... }
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
 * canAccessResource('candidate', 'chapters'); // false
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

