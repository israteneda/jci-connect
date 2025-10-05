import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers } from '@/hooks/useMembers'
import { usePermissions } from '@/hooks/usePermissions'
import { Plus, Search, Eye, Trash2, Filter } from 'lucide-react'
import { MemberFormDialog } from './MemberFormDialog'
import { toast } from 'sonner'

export function Members() {
  const { members, isLoading, deleteMember } = useMembers()
  const { can } = usePermissions()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredMembers = members?.filter(member => {
    const searchLower = search.toLowerCase()
    const matchesSearch = 
      member.first_name.toLowerCase().includes(searchLower) ||
      member.last_name.toLowerCase().includes(searchLower) ||
      member.memberships.member_number.toLowerCase().includes(searchLower) ||
      member.id.toLowerCase().includes(searchLower) ||
      (member.email && member.email.toLowerCase().includes(searchLower))
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      await deleteMember.mutateAsync(id)
      toast.success('Member deleted successfully')
    } catch (error) {
      toast.error('Failed to delete member')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Members</h1>
        {can('members', 'create') && (
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Member
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none appearance-none bg-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="senator">Senator</option>
            <option value="member">Member</option>
            <option value="candidate">Candidate</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Membership Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No members found
                </td>
              </tr>
            ) : (
              filteredMembers?.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{member.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : member.role === 'senator'
                        ? 'bg-amber-100 text-amber-800'
                        : member.role === 'member'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{member.memberships?.member_number || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{member.memberships?.membership_type || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      member.memberships?.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.memberships?.status || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/dashboard/members/${member.id}`}
                        className="text-aqua hover:text-aqua-600"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      {can('members', 'delete') && (
                        <button
                          onClick={() => handleDelete(member.id, `${member.first_name} ${member.last_name}`)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MemberFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}

