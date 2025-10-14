import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePermissions } from '@/hooks/usePermissions'
import { 
  Users, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone, 
  Crown,
  Building,
  Globe,
  User,
  Search,
  Filter,
  Plus
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type BoardPosition = Database['public']['Tables']['board_positions']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

type BoardMember = {
  profile: Profile
  positions: BoardPosition[]
  email?: string
}

export function BoardMembers() {
  const { can } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<'all' | 'local' | 'national' | 'international'>('all')

  // Fetch all board members with their positions
  const { data: boardMembers, isLoading, error } = useQuery({
    queryKey: ['board-members'],
    queryFn: async (): Promise<BoardMember[]> => {
      // Fetch all active board positions
      const { data: positions, error: positionsError } = await supabase
        .from('board_positions')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('created_at', { ascending: false })

      if (positionsError) throw positionsError
      if (!positions) return []

      // Get unique user IDs from positions
      const userIds = [...new Set(positions.map(p => p.user_id))]

      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      if (profilesError) throw profilesError
      if (!profiles) return []

      // Create a map of profiles by id for quick lookup
      const profileMap = new Map(profiles.map(p => [p.id, p]))

      // Group positions by user and fetch emails
      const boardMembersWithEmails = await Promise.all(
        userIds.map(async (userId) => {
          const profile = profileMap.get(userId)
          if (!profile) return null

          const userPositions = positions.filter(p => p.user_id === userId)
          
          // Fetch email using secure Postgres function
          const { data: email } = await (supabase.rpc as any)('get_user_email', {
            user_id: userId
          })

          return {
            profile,
            positions: userPositions,
            email: email || null
          } as BoardMember
        })
      )

      // Filter out any null values
      return boardMembersWithEmails.filter(m => m !== null) as BoardMember[]
    },
  })

  // Filter board members based on search and level
  const filteredMembers = boardMembers?.filter(member => {
    const matchesSearch = searchTerm === '' || 
      member.profile.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profile.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.positions.some(p => p.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesLevel = levelFilter === 'all' || 
      member.positions.some(p => p.level === levelFilter)
    
    return matchesSearch && matchesLevel
  }) || []

  // Group members by level for display
  const groupedMembers = {
    local: filteredMembers.filter(m => m.positions.some(p => p.level === 'local')),
    national: filteredMembers.filter(m => m.positions.some(p => p.level === 'national')),
    international: filteredMembers.filter(m => m.positions.some(p => p.level === 'international'))
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'local':
        return <Building className="h-4 w-4" />
      case 'national':
        return <MapPin className="h-4 w-4" />
      case 'international':
        return <Globe className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'local':
        return 'bg-blue-100 text-blue-800'
      case 'national':
        return 'bg-green-100 text-green-800'
      case 'international':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelTitle = (level: string) => {
    switch (level) {
      case 'local':
        return 'Local Chapter Board'
      case 'national':
        return 'National Board'
      case 'international':
        return 'International Board'
      default:
        return 'Board Members'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading board members</div>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Board Members</h1>
          <p className="text-gray-600 mt-1">
            Current board members across all levels
          </p>
        </div>
        {can('board_positions', 'create') && (
          <Link
            to="/dashboard/board-positions/new"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Position
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
            >
              <option value="all">All Levels</option>
              <option value="local">Local</option>
              <option value="national">National</option>
              <option value="international">International</option>
            </select>
          </div>
        </div>
      </div>

      {/* Board Members by Level */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No board members found</h3>
          <p className="text-gray-600">
            {searchTerm || levelFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No board positions have been assigned yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(['local', 'national', 'international'] as const).map(level => {
            const members = groupedMembers[level]
            if (members.length === 0) return null

            return (
              <div key={level} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    {getLevelIcon(level)}
                    <h2 className="text-xl font-semibold text-gray-900">
                      {getLevelTitle(level)}
                    </h2>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                      {members.length} member{members.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.map((member) => (
                      <div key={member.profile.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {member.profile.first_name} {member.profile.last_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {member.profile.role === 'prospective' ? 'Prospective Member' : member.profile.role.charAt(0).toUpperCase() + member.profile.role.slice(1)}
                            </p>
                          </div>
                          <Link
                            to={`/dashboard/members/${member.profile.id}`}
                            className="text-navy hover:text-navy-600 text-sm font-medium"
                          >
                            View Profile
                          </Link>
                        </div>

                        {/* Positions */}
                        <div className="space-y-2 mb-4">
                          {member.positions
                            .filter(p => p.level === level)
                            .map((position) => (
                              <div key={position.id} className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-amber-500" />
                                <span className="font-medium text-gray-900">
                                  {position.position_title}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getLevelColor(position.level)}`}>
                                  {position.level}
                                </span>
                              </div>
                            ))}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1 text-sm text-gray-600">
                          {member.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              <span className="truncate">{member.email}</span>
                            </div>
                          )}
                          {member.profile.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{member.profile.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Position Dates */}
                        {member.positions[0]?.start_date && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Since {formatDate(member.positions[0].start_date)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
