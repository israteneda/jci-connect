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

export type Role = 'admin' | 'senator' | 'officer' | 'member' | 'candidate' | 'past_member' | 'guest';

export type Action = 'create' | 'read' | 'update' | 'delete';

export type Resource = 
  | 'members' 
  | 'senators'
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
   * ADMIN: Full system access
   * Can manage all resources and users
   */
  admin: {
    members: ['create', 'read', 'update', 'delete'],
    senators: ['create', 'read', 'update', 'delete'],
    memberships: ['create', 'read', 'update', 'delete'],
    board_positions: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    reports: ['create', 'read'],
    profile: ['read', 'update'],
    templates: ['create', 'read', 'update', 'delete'],
  },

  /**
   * SENATOR: Enhanced member with additional privileges
   * Senators are members 40+ years old approved by the international organization
   * They have elevated access to view organizational information
   */
  senator: {
    members: ['read'], // Can view all member profiles
    senators: ['read'], // Can view other senators
    memberships: ['read'], // Can view membership information
    board_positions: ['read'], // Can view board positions
    reports: ['read'], // Access to reports and analytics
    profile: ['read', 'update'], // Can manage own profile
  },

  /**
   * OFFICER: Chapter board member
   * Officers have elevated privileges to manage chapter operations
   * Includes positions like President, VP, Treasurer, Secretary, etc.
   */
  officer: {
    members: ['read', 'update'], // Can view and update member profiles
    memberships: ['read', 'update'], // Can manage memberships
    board_positions: ['read'], // Can view board positions
    reports: ['read'], // Access to reports and analytics
    profile: ['read', 'update'], // Can manage own profile
    templates: ['read', 'update'], // Can view and update templates
  },

  /**
   * MEMBER: Active organization member
   * Standard member with access to community resources
   */
  member: {
    members: ['read'], // Can view other members
    board_positions: ['read'], // Can view board positions
    profile: ['read', 'update'], // Can manage own profile
  },

  /**
   * CANDIDATE: Potential member
   * Limited access while being evaluated for membership
   */
  candidate: {
    profile: ['read', 'update'], // Can only access own profile
  },

  /**
   * PAST_MEMBER: Alumni or aged out member
   * Former members who maintain limited access to stay connected
   * Can view member directory but cannot access organizational resources
   */
  past_member: {
    members: ['read'], // Can view member directory to stay connected
    profile: ['read', 'update'], // Can manage own profile
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
 * canAccessResource('candidate', 'members'); // false
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

