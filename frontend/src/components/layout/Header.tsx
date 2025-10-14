import { LogOut, Menu, Search, Command } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { toast } from 'sonner'
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { signOut } = useAuth()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Available shortcuts
  const shortcuts = [
    { key: 'd', label: 'Dashboard', path: '/dashboard' },
    { key: 'm', label: 'Members', path: '/dashboard/members' },
    { key: 'b', label: 'Board', path: '/dashboard/board-members' },
    { key: 't', label: 'Templates', path: '/dashboard/templates' },
    ...(can('members', 'create') ? [{ key: 'a', label: 'Admin Data', path: '/dashboard/admin-data' }] : []),
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  // Filter shortcuts based on search query
  const filteredShortcuts = useMemo(() => 
    shortcuts.filter(shortcut =>
      shortcut.label.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]
  )

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
        setSelectedIndex(0)
        return
      }

      // Handle search modal navigation
      if (isSearchOpen) {
        switch (e.key) {
          case 'Escape':
            e.preventDefault()
            setIsSearchOpen(false)
            setSearchQuery('')
            setSelectedIndex(0)
            return

          case 'ArrowDown':
            e.preventDefault()
            setSelectedIndex(prev => 
              prev < filteredShortcuts.length - 1 ? prev + 1 : 0
            )
            return

          case 'ArrowUp':
            e.preventDefault()
            setSelectedIndex(prev => 
              prev > 0 ? prev - 1 : filteredShortcuts.length - 1
            )
            return

          case 'Enter':
            e.preventDefault()
            if (filteredShortcuts[selectedIndex]) {
              handleShortcutClick(filteredShortcuts[selectedIndex])
            }
            return
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, navigate, filteredShortcuts, selectedIndex])

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isSearchOpen) {
        const target = e.target as Element
        if (!target.closest('[data-search-container]')) {
          setIsSearchOpen(false)
          setSearchQuery('')
        }
      }
    }

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchOpen])

  // Reset selected index when search query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  const handleShortcutClick = (shortcut: typeof shortcuts[0]) => {
    navigate(shortcut.path)
    setIsSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu button + Search */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search Bar */}
          <div className="relative" data-search-container>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors min-w-[200px] md:min-w-[300px]"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Search shortcuts...</span>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Command className="h-3 w-3" />
                <span>K</span>
              </div>
            </button>

            {/* Search Modal */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search shortcuts..."
                      className="flex-1 outline-none text-sm"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredShortcuts.length > 0 ? (
                    filteredShortcuts.map((shortcut, index) => (
                      <button
                        key={shortcut.key}
                        onClick={() => handleShortcutClick(shortcut)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                          index === selectedIndex 
                            ? 'bg-blue-50 border-l-2 border-blue-500' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`${
                            index === selectedIndex ? 'text-blue-900 font-medium' : 'text-gray-900'
                          }`}>
                            {shortcut.label}
                          </span>
                        </div>
                        <span className={`text-xs ${
                          index === selectedIndex ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {shortcut.path}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                      No shortcuts found
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-gray-100 text-xs text-gray-400">
                  <div className="flex items-center gap-2 mb-1">
                    <span>Press</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex items-center gap-2">
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑↓</kbd>
                      <span>to navigate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd>
                      <span>to select</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
                      <span>to close</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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

