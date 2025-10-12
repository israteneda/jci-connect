import { Link, useLocation } from 'react-router-dom'
import { Users, LayoutDashboard, X, ChevronLeft, ChevronRight, Shield, Award, UserCheck, UserCircle, Settings, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Templates', href: '/dashboard/templates', icon: FileText },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation()
  const { user } = useAuth()
  const { settings } = useOrganizationSettings()

  // Get organization info
  const organizationName = settings?.organization_name || 'JCI Organization'
  const organizationLocation = settings?.organization_city && settings?.organization_country
    ? `${settings.organization_city}, ${settings.organization_country}`
    : 'Member Management'

  // Get user role info
  const userRole = user?.profile?.role || user?.role || 'user'
  const userName = user?.profile?.first_name && user?.profile?.last_name
    ? `${user.profile.first_name} ${user.profile.last_name}`
    : user?.email || 'User'
  const formattedRole = userRole === 'past_member'
    ? 'Past Member'
    : userRole.charAt(0).toUpperCase() + userRole.slice(1)

  // Get role icon and color
  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin':
        return <Shield className="h-5 w-5 text-purple-400" />
      case 'senator':
        return <Award className="h-5 w-5 text-amber-400" />
      case 'officer':
        return <Shield className="h-5 w-5 text-teal-400" />
      case 'member':
        return <UserCheck className="h-5 w-5 text-blue-400" />
      case 'candidate':
        return <UserCircle className="h-5 w-5 text-gray-400" />
      case 'past_member':
        return <UserCircle className="h-5 w-5 text-orange-400" />
      case 'guest':
        return <UserCircle className="h-5 w-5 text-green-400" />
      default:
        return <UserCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-purple-900/50 text-purple-300'
      case 'senator':
        return 'bg-amber-900/50 text-amber-300'
      case 'officer':
        return 'bg-teal-900/50 text-teal-300'
      case 'member':
        return 'bg-blue-900/50 text-blue-300'
      case 'candidate':
        return 'bg-gray-800 text-gray-300'
      case 'past_member':
        return 'bg-orange-900/50 text-orange-300'
      case 'guest':
        return 'bg-green-900/50 text-green-300'
      default:
        return 'bg-gray-800 text-gray-300'
    }
  }

  return (
    <div 
      className={cn(
        'bg-offBlack text-white flex flex-col h-full transition-all duration-300 ease-in-out relative',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header with close button for mobile */}
      <div className="p-6 flex items-start justify-between">
        <div className={cn('transition-opacity duration-300', isCollapsed && 'opacity-0')}>
          <h1 className="text-2xl font-bold text-aqua whitespace-nowrap">{organizationName}</h1>
          <p className="text-sm text-specialGray mt-1 whitespace-nowrap">{organizationLocation}</p>
        </div>
        
        {/* Close button - only visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-specialGray hover:text-white hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Toggle button for desktop */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 bg-navy hover:bg-navy-600 text-white rounded-full p-1.5 shadow-lg transition-colors z-10 hidden lg:flex items-center justify-center"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-navy text-white'
                  : 'text-specialGray hover:bg-offBlack-light hover:text-white',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
              <span className={cn(
                'transition-opacity duration-300 whitespace-nowrap',
                isCollapsed && 'opacity-0 w-0 overflow-hidden'
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-700">
        <div className={cn(
          'p-4 transition-all duration-300',
          isCollapsed ? 'flex justify-center' : 'space-y-3'
        )}>
          {isCollapsed ? (
            // Collapsed view - just icon
            <div className="flex items-center justify-center" title={`${userName} - ${formattedRole}`}>
              {getRoleIcon()}
            </div>
          ) : (
            // Expanded view - full profile
            <>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getRoleIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {userName}
                  </p>
                  <span className={cn(
                    'inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                    getRoleBadgeColor()
                  )}>
                    {formattedRole}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

