import { usePermissions } from '@/hooks/usePermissions'

interface PermissionsLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

/**
 * PermissionsLoader component that shows a loading state while user permissions are being loaded.
 * This prevents components from rendering with incorrect permissions or showing wrong screens.
 * 
 * @param children - Content to render when permissions are loaded
 * @param fallback - Custom loading component (optional)
 * @param size - Size of the loading spinner ('sm', 'md', 'lg')
 * @param message - Custom loading message
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   return (
 *     <PermissionsLoader>
 *       <div>Content that needs permissions</div>
 *     </PermissionsLoader>
 *   )
 * }
 * ```
 */
export function PermissionsLoader({ 
  children, 
  fallback, 
  size = 'md',
  message = 'Loading permissions...'
}: PermissionsLoaderProps) {
  const { loading, isReady } = usePermissions()

  // Show loading while permissions are being loaded
  if (loading || !isReady) {
    if (fallback) {
      return <>{fallback}</>
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
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
