import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Users, LayoutDashboard, X, ChevronLeft, ChevronRight, Shield, UserCheck, UserCircle, FileText, Crown, Settings2, ChevronRight as ChevronRightIcon, UserPlus, MessageSquare } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings'
import { cn } from '@/lib/utils'

interface NavigationItem {
  name: string
  href?: string
  icon: any
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Membership', 
    icon: UserPlus,
    children: [
      { name: 'Members', href: '/dashboard/members', icon: Users },
      { name: 'Board', href: '/dashboard/board-members', icon: Crown },
    ]
  },
  { 
    name: 'Communication', 
    icon: MessageSquare,
    children: [
      { name: 'Templates', href: '/dashboard/templates', icon: FileText },
    ]
  },
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
  const [expandedItems, setExpandedItems] = useState<string[]>(['Membership', 'Communication'])
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  // Helper functions for submenu handling
  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isExpanded = (itemName: string) => expandedItems.includes(itemName)

  const isActive = (href?: string) => {
    if (!href) return false
    // For Dashboard, only match exact path or if it's the index route
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/'
    }
    // For other routes, use exact match or starts with
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const isParentActive = (children?: NavigationItem[]) => {
    if (!children) return false
    return children.some(child => isActive(child.href))
  }

  // Handle hover with delay to prevent flickering
  const handleMouseEnter = (itemName: string) => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    setHoveredItem(itemName)
  }

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setHoveredItem(null)
    }, 200) // Increased delay to allow moving to submenu
    setHoverTimeout(timeout)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout)
      }
    }
  }, [hoverTimeout])


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
  const formattedRole = userRole === 'prospective'
    ? 'Prospective Member'
    : userRole.charAt(0).toUpperCase() + userRole.slice(1)

  // Get role icon and color
  const getRoleIcon = () => {
    switch (userRole) {
      case 'admin':
        return <Shield className="h-5 w-5 text-blue-200" />
      case 'member':
        return <UserCheck className="h-5 w-5 text-blue-200" />
      case 'prospective':
        return <UserCircle className="h-5 w-5 text-blue-200" />
      case 'guest':
        return <UserCircle className="h-5 w-5 text-blue-200" />
      default:
        return <UserCircle className="h-5 w-5 text-blue-200" />
    }
  }

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin':
        return 'bg-blue-800 text-blue-100'
      case 'member':
        return 'bg-blue-800 text-blue-100'
      case 'prospective':
        return 'bg-blue-800 text-blue-100'
      case 'guest':
        return 'bg-blue-800 text-blue-100'
      default:
        return 'bg-blue-800 text-blue-100'
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
          <h1 className="text-2xl font-bold text-blue-100 whitespace-nowrap">{organizationName}</h1>
          <p className="text-sm text-blue-200 mt-1 whitespace-nowrap">{organizationLocation}</p>
        </div>
        
        {/* Close button - only visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-800 transition-colors"
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
          className="absolute -right-3 top-20 bg-blue-600 hover:bg-blue-500 text-white rounded-full p-1.5 shadow-lg transition-colors z-10 hidden lg:flex items-center justify-center"
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
          const itemIsActive = isActive(item.href) || (isCollapsed && isParentActive(item.children))
          const itemIsExpanded = isExpanded(item.name)
          
          if (item.children) {
            // Parent item with children (submenu)
            return (
              <div key={item.name}>
                {isCollapsed ? (
                  // When collapsed, show hover menu
                  <div 
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(item.name)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      to={item.children[0].href!}
                      onClick={onClose}
                      className={cn(
                        'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 justify-center',
                        itemIsActive
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                      )}
                      title={item.name}
                    >
                      <item.icon className="h-5 w-5" />
                    </Link>
                    
                    {/* Hover menu */}
                    {hoveredItem === item.name && (
                      <>
                        {/* Invisible bridge to help with navigation */}
                        <div 
                          className="absolute left-full top-0 w-2 h-full z-40"
                          onMouseEnter={() => handleMouseEnter(item.name)}
                        />
                        <div 
                          className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[160px]"
                          onMouseEnter={() => handleMouseEnter(item.name)}
                          onMouseLeave={handleMouseLeave}
                        >
                        {item.children.map((child) => {
                          const childIsActive = isActive(child.href)
                          return (
                            <Link
                              key={child.name}
                              to={child.href!}
                              onClick={onClose}
                              className={cn(
                                'flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors',
                                childIsActive && 'bg-blue-50 text-blue-700'
                              )}
                            >
                              <child.icon className="h-4 w-4 mr-2" />
                              <span>{child.name}</span>
                            </Link>
                          )
                        })}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // When expanded, show toggle button
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                      itemIsActive
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                    )}
                    title={item.name}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span className="transition-opacity duration-300 whitespace-nowrap flex-1 text-left">
                      {item.name}
                    </span>
                    <ChevronRightIcon className={cn(
                      'h-4 w-4 transition-transform duration-200',
                      itemIsExpanded && 'rotate-90'
                    )} />
                  </button>
                )}
                
                {/* Submenu items */}
                {!isCollapsed && itemIsExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const childIsActive = isActive(child.href)
                      return (
                        <Link
                          key={child.name}
                          to={child.href!}
                          onClick={onClose}
                          className={cn(
                            'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                            childIsActive
                              ? 'bg-blue-500 text-white'
                              : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                          )}
                        >
                          <child.icon className="h-4 w-4 mr-3" />
                          <span className="whitespace-nowrap">{child.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          } else {
            // Regular navigation item
            return (
              <Link
                key={item.name}
                to={item.href!}
                onClick={onClose}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  itemIsActive
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white',
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
          }
        })}
        
      </nav>

      {/* User Profile Section */}
      <div className="border-t border-gray-700">
        <div className={cn(
          'p-4 transition-all duration-300',
          isCollapsed ? 'flex justify-center' : 'space-y-3'
        )}>
          {isCollapsed ? (
            // Collapsed view - only one icon (gear for admin, role icon for others)
            <div className="flex items-center justify-center" title={`${userName} - ${formattedRole}`}>
              {userRole === 'admin' ? (
                <Link 
                  to="/dashboard/admin-data" 
                  className="text-blue-200 hover:text-white transition-colors"
                  title="Admin Data"
                >
                  <Settings2 className="h-5 w-5" />
                </Link>
              ) : (
                getRoleIcon()
              )}
            </div>
          ) : (
            // Expanded view - full profile with gear
            <>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getRoleIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-100 truncate">
                    {userName}
                  </p>
                  <span className={cn(
                    'inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                    getRoleBadgeColor()
                  )}>
                    {formattedRole}
                  </span>
                </div>
                {userRole === 'admin' && (
                  <Link 
                    to="/dashboard/admin-data" 
                    className="text-blue-200 hover:text-white transition-colors flex-shrink-0"
                    title="Admin Data"
                  >
                    <Settings2 className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

