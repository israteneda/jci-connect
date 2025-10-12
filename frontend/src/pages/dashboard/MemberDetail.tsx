import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMembers } from '@/hooks/useMembers'
import { useBoardPositions, getPositionLevelColor } from '@/hooks/useBoardPositions'
import { usePermissions } from '@/hooks/usePermissions'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Award, Briefcase, Clock, MessageSquare, FileText, Send } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { InteractionTimeline } from '@/components/member/InteractionTimeline'
import { MessageHistory } from '@/components/member/MessageHistory'
import { MemberNotes } from '@/components/member/MemberNotes'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getMember } = useMembers()
  const { positions, isLoading: positionsLoading } = useBoardPositions(id)
  const { can } = usePermissions()
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'messages' | 'notes'>('overview')

  useEffect(() => {
    if (id) {
      getMember(id)
        .then(setMember)
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [id, getMember])

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

  const canEdit = can('members', 'update')
  const canViewMessages = can('settings', 'update') // Using settings permission for now

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Members
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
                    : member.role === 'officer'
                    ? 'bg-teal-100 text-teal-800'
                    : member.role === 'member'
                    ? 'bg-blue-100 text-blue-800'
                    : member.role === 'past_member'
                    ? 'bg-orange-100 text-orange-800'
                    : member.role === 'guest'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.role === 'past_member' ? 'Past Member' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                </span>
                {member.role === 'senator' && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs">
                    <Award className="h-3 w-3" />
                    Senator Status
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                member.memberships.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {member.memberships.status}
              </span>
              {canEdit && (
                <button className="flex items-center gap-2 px-3 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors">
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Member Since</p>
                  <p className="font-semibold text-gray-900">{formatDate(member.memberships.start_date)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Messages Sent</p>
                  <p className="font-semibold text-gray-900">12</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-semibold text-gray-900">3</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Last Activity</p>
                  <p className="font-semibold text-gray-900">2 days ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-navy text-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'timeline'
                    ? 'border-navy text-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Clock className="h-4 w-4" />
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'messages'
                    ? 'border-navy text-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Messages
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === 'notes'
                    ? 'border-navy text-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4" />
                Notes
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {member.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span>{member.address}</span>
                  </div>
                )}
              </div>
              <div className="space-y-3">
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

          {/* Board Positions */}
          {!positionsLoading && positions && positions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionLevelColor(position.level as 'local' | 'national' | 'international')}`}>
                        {position.level}
                      </span>
                    </div>
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
      )}

      {activeTab === 'timeline' && (
        <InteractionTimeline userId={id!} canEdit={canEdit} />
      )}

      {activeTab === 'messages' && (
        <MessageHistory userId={id!} canView={canViewMessages} />
      )}

      {activeTab === 'notes' && (
        <MemberNotes userId={id!} canEdit={canEdit} />
      )}
    </div>
  )
}

