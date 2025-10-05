import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMembers } from '@/hooks/useMembers'
import { useBoardPositions, getPositionLevelColor } from '@/hooks/useBoardPositions'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Award, Briefcase } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getMember } = useMembers()
  const { positions, isLoading: positionsLoading } = useBoardPositions(id)
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getMember(id)
        .then(setMember)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    )
  }

  if (!member) {
    return <div className="text-center py-12">Member not found</div>
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-gray-600 mt-1">{member.memberships.member_number}</p>
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
              {member.role === 'senator' && (
                <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">
                  <Award className="h-3 w-3" />
                  Senator Status
                </span>
              )}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            member.memberships.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {member.memberships.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="space-y-3">
              {member.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span>{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span>{member.phone}</span>
                </div>
              )}
              {(member.city || member.country) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span>{member.city}, {member.country}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Membership Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Chapter</p>
                <p className="font-medium">{member.memberships.chapters.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Membership Type</p>
                <p className="font-medium capitalize">{member.memberships.membership_type}</p>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="font-medium">
                    {formatDate(member.memberships.start_date)} - {formatDate(member.memberships.expiry_date)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Board Positions Section */}
        {!positionsLoading && positions && positions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold text-gray-900">Board Positions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{position.position_title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionLevelColor(position.level)}`}>
                      {position.level}
                    </span>
                  </div>
                  {position.level === 'chapter' && position.chapters && (
                    <p className="text-sm text-gray-600 mb-2">
                      {position.chapters.name}, {position.chapters.city}
                    </p>
                  )}
                  {position.start_date && (
                    <p className="text-xs text-gray-500">
                      Since {formatDate(position.start_date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

