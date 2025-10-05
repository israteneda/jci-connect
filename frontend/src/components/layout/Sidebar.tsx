import { Link, useLocation } from 'react-router-dom'
import { Users, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/dashboard/members', icon: Users },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="w-64 bg-offBlack text-white flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-aqua">JCI Connect</h1>
        <p className="text-sm text-specialGray mt-1">Member Management</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-navy text-white'
                  : 'text-specialGray hover:bg-offBlack-light hover:text-white'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-specialGray">
          Tenpisoft © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}

