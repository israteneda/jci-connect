import { usePermissions } from '@/hooks/usePermissions'
import { Role } from '@/lib/permissions'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: Role
  requiredRoles?: Role[]
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  loadingMessage?: string
  accessDeniedMessage?: string
}

/**
 * RoleGuard component that handles both permission loading and role-based access control.
 * This is a more comprehensive solution that combines loading and authorization.
 * 
 * @param children - Content to render when user has required permissions
 * @param requiredRole - Single role required to access content
 * @param requiredRoles - Array of roles that can access content
 * @param fallback - Custom component to show when access is denied
 * @param loadingFallback - Custom component to show while loading
 * @param size - Size of the loading spinner
 * @param loadingMessage - Custom loading message
 * @param accessDeniedMessage - Custom access denied message
 * 
 * @example
 * ```tsx
 * // Require admin role
 * <RoleGuard requiredRole="admin">
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * // Require any of multiple roles
 * <RoleGuard requiredRoles={['admin', 'member']}>
 *   <MemberContent />
 * </RoleGuard>
 * 
 * // Custom fallback for access denied
 * <RoleGuard 
 *   requiredRole="admin" 
 *   fallback={<div>You need admin access</div>}
 * >
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  children,
  requiredRole,
  requiredRoles,
  fallback,
  loadingFallback,
  size = 'md',
  loadingMessage = 'Loading permissions...',
  accessDeniedMessage = "You don't have the required permissions to access this content."
}: RoleGuardProps) {
  const { loading, isReady, role } = usePermissions()

  // Show loading while permissions are being loaded
  if (loading || !isReady) {
    if (loadingFallback) {
      return <>{loadingFallback}</>
    }

    const sizeClasses = {
      sm: 'h-6 w-6',
      md: 'h-8 w-8', 
      lg: 'h-12 w-12'
    }

    const containerClasses = {
      sm: 'min-h-32',
      md: 'min-h-64',
      lg: 'min-h-96'
    }

    return (
      <div className={`flex items-center justify-center ${containerClasses[size]}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full border-b-2 border-navy mx-auto mb-2 ${sizeClasses[size]}`}></div>
          <p className="text-gray-600 text-sm">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  // Check role requirements
  const hasRequiredRole = () => {
    if (requiredRole) {
      return role === requiredRole
    }
    if (requiredRoles) {
      return requiredRoles.includes(role)
    }
    return true // No role requirement
  }

  if (!hasRequiredRole()) {
    if (fallback) {
      return <>{fallback}</>
    }

    const requiredRolesText = requiredRole 
      ? requiredRole 
      : requiredRoles?.join(' or ')

    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{accessDeniedMessage}</p>
          <div className="text-sm text-gray-500">
            {requiredRolesText && (
              <>
                Required role: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{requiredRolesText}</span>
                <br />
              </>
            )}
            Your role: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{role}</span>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
