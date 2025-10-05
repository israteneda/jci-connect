import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button + Title */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Title - Hide on small mobile, show on larger screens */}
          <h2 className="text-lg md:text-2xl font-semibold text-gray-900">
            <span className="hidden sm:inline">Welcome to </span>JCI Connect
          </h2>
        </div>

        {/* Right side - Sign out */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Sign out button - Icon only on mobile, with text on desktop */}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium text-white bg-navy hover:bg-navy-600 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}

