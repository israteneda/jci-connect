import { usePermissions } from '@/hooks/usePermissions'

interface RoleAwareRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'member' | 'guest' | 'prospective'
  fallback?: React.ReactNode
}

/**
 * RoleAwareRoute component that waits for user role to be loaded
 * before rendering children. This prevents showing wrong screens
 * while the role is still being fetched.
 */
export function RoleAwareRoute({ 
  children, 
  requiredRole, 
  fallback 
}: RoleAwareRouteProps) {
  const { loading, isReady, role } = usePermissions()

  // Show loading screen while role is being fetched
  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your permissions...</p>
        </div>
      </div>
    )
  }

  // Check role requirement if specified
  if (requiredRole && role !== requiredRole) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">
            You don't have the required permissions to access this page.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Required role: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{requiredRole}</span>
            <br />
            Your role: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{role}</span>
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
