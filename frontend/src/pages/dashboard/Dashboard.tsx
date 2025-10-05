import { useMembers } from '@/hooks/useMembers'
import { Users, UserCheck, UserX, Award } from 'lucide-react'

export function Dashboard() {
  const { members, isLoading: membersLoading } = useMembers()

  const stats = {
    totalMembers: members?.length || 0,
    activeMembers: members?.filter(m => m.memberships?.status === 'active').length || 0,
    senators: members?.filter(m => m.role === 'senator').length || 0,
    expiredMembers: members?.filter(m => m.memberships?.status === 'expired').length || 0,
  }

  const recentMembers = members?.slice(0, 5) || []

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          color="navy"
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          icon={UserCheck}
          color="aqua"
        />
        <StatCard
          title="Senators"
          value={stats.senators}
          icon={Award}
          color="amber"
        />
        <StatCard
          title="Expired"
          value={stats.expiredMembers}
          icon={UserX}
          color="red"
        />
      </div>

      {/* Recent Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Members</h2>
        
        {recentMembers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No members yet</p>
        ) : (
          <div className="space-y-4">
            {recentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.role === 'senator' && (
                      <Award className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{member.email || 'No email'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-navy">
                    {member.memberships.member_number}
                  </p>
                  <p className="text-xs text-gray-500">
                    {member.memberships.membership_type}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: string
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    navy: 'bg-navy text-white',
    aqua: 'bg-aqua text-white',
    amber: 'bg-amber-500 text-white',
    red: 'bg-red-500 text-white',
    purple: 'bg-purple-500 text-white',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

