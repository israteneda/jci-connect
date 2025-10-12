import { useState, useEffect } from 'react'
import { 
  Clock, 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar, 
  UserPlus, 
  Shield, 
  CreditCard,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
// import { formatDate } from '@/lib/utils' // Not currently used
import { toast } from 'sonner'

interface Activity {
  id: string
  activity_type: string
  title: string
  description: string | null
  metadata: any
  created_by: string | null
  created_at: string
}

interface Interaction {
  id: string
  interaction_type: string
  subject: string | null
  content: string | null
  direction: 'inbound' | 'outbound'
  status: string
  scheduled_at: string | null
  completed_at: string | null
  created_by: string | null
  created_at: string
}

interface InteractionTimelineProps {
  userId: string
  canEdit?: boolean
}

export function InteractionTimeline({ userId, canEdit = false }: InteractionTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'timeline' | 'interactions'>('timeline')

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API calls
      // Mock data for now
      const mockActivities: Activity[] = [
        {
          id: '1',
          activity_type: 'joined',
          title: 'Member Joined',
          description: 'New member joined the organization',
          metadata: { role: 'member', status: 'active' },
          created_by: null,
          created_at: '2025-01-01T10:00:00Z'
        },
        {
          id: '2',
          activity_type: 'role_changed',
          title: 'Role Changed',
          description: 'Member role updated',
          metadata: { old_role: 'member', new_role: 'officer' },
          created_by: 'admin-user-id',
          created_at: '2025-01-05T14:30:00Z'
        },
        {
          id: '3',
          activity_type: 'message_sent',
          title: 'Welcome Email Sent',
          description: 'Welcome email sent to new member',
          metadata: { template: 'Welcome Email', type: 'email' },
          created_by: 'admin-user-id',
          created_at: '2025-01-01T10:15:00Z'
        }
      ]

      const mockInteractions: Interaction[] = [
        {
          id: '1',
          interaction_type: 'email',
          subject: 'Welcome to JCI Ambato!',
          content: 'Welcome to our organization...',
          direction: 'outbound',
          status: 'completed',
          scheduled_at: null,
          completed_at: '2025-01-01T10:15:00Z',
          created_by: 'admin-user-id',
          created_at: '2025-01-01T10:00:00Z'
        },
        {
          id: '2',
          interaction_type: 'whatsapp',
          subject: 'Meeting Reminder',
          content: 'Hi! This is a reminder about our upcoming meeting...',
          direction: 'outbound',
          status: 'completed',
          scheduled_at: null,
          completed_at: '2025-01-06T09:00:00Z',
          created_by: 'admin-user-id',
          created_at: '2025-01-06T08:45:00Z'
        }
      ]

      setActivities(mockActivities)
      setInteractions(mockInteractions)
    } catch (error) {
      console.error('Error fetching timeline data:', error)
      toast.error('Failed to load interaction timeline')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'joined':
        return <UserPlus className="h-4 w-4 text-green-600" />
      case 'role_changed':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'message_sent':
        return <Mail className="h-4 w-4 text-purple-600" />
      case 'message_received':
        return <Mail className="h-4 w-4 text-indigo-600" />
      case 'membership_updated':
        return <CreditCard className="h-4 w-4 text-orange-600" />
      case 'board_position_added':
        return <Award className="h-4 w-4 text-yellow-600" />
      case 'meeting_attended':
        return <Calendar className="h-4 w-4 text-teal-600" />
      case 'payment_made':
        return <CreditCard className="h-4 w-4 text-green-600" />
      case 'payment_overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getInteractionIcon = (interactionType: string) => {
    switch (interactionType) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'phone_call':
        return <Phone className="h-4 w-4" />
      case 'meeting':
        return <Calendar className="h-4 w-4" />
      case 'note':
        return <FileText className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getDirectionColor = (direction: string) => {
    return direction === 'inbound' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-green-100 text-green-800'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Interaction Timeline</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('interactions')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                activeTab === 'interactions'
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Interactions
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'timeline' ? (
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No activities recorded yet</p>
              </div>
            ) : (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {activities.map((activity) => (
                  <div key={activity.id} className="relative flex items-start gap-4 pb-6">
                    {/* Icon */}
                    <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-200 rounded-full">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </h3>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </p>
                          )}
                          
                          {/* Metadata */}
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {Object.entries(activity.metadata).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800"
                                >
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {interactions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No interactions recorded yet</p>
                {canEdit && (
                  <button className="mt-4 flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-600 transition-colors mx-auto">
                    <Plus className="h-4 w-4" />
                    Add Interaction
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {interactions.map((interaction) => (
                  <div key={interaction.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                          {getInteractionIcon(interaction.interaction_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900">
                              {interaction.subject || `${interaction.interaction_type} interaction`}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getDirectionColor(interaction.direction)}`}>
                              {interaction.direction}
                            </span>
                            {getStatusIcon(interaction.status)}
                          </div>
                          
                          {interaction.content && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {interaction.content}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Type: {interaction.interaction_type}</span>
                            {interaction.completed_at && (
                              <span>Completed: {new Date(interaction.completed_at).toLocaleString()}</span>
                            )}
                            {interaction.scheduled_at && (
                              <span>Scheduled: {new Date(interaction.scheduled_at).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {canEdit && (
                        <div className="flex items-center gap-1 ml-4">
                          <button
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {canEdit && (
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-navy hover:text-navy transition-colors">
                    <Plus className="h-4 w-4" />
                    Add New Interaction
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
