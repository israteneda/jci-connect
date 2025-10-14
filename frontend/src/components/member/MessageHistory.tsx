import { useState, useEffect } from 'react'
import { 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter,
  Search
} from 'lucide-react'
// import { formatDate } from '@/lib/utils' // Not currently used
import { toast } from 'sonner'

interface Message {
  id: string
  template_id: string | null
  template_name: string | null
  type: 'email' | 'whatsapp'
  subject: string | null
  content: string
  variables_used: any
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  error_message: string | null
  sent_at: string | null
  delivered_at: string | null
  created_at: string
}

interface MessageHistoryProps {
  userId: string
  canView?: boolean
}

export function MessageHistory({ userId, canView = true }: MessageHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'email' | 'whatsapp'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    fetchMessages()
  }, [userId])

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // Mock data for now
      const mockMessages: Message[] = [
        {
          id: '1',
          template_id: '1',
          template_name: 'Welcome Email',
          type: 'email',
          subject: 'Welcome to JCI Ambato!',
          content: 'Dear John,\n\nWelcome to JCI Ambato! We are excited to have you as a new member.\n\nBest regards,\nJCI Ambato Team',
          variables_used: { first_name: 'John', organization_name: 'JCI Ambato' },
          status: 'delivered',
          error_message: null,
          sent_at: '2025-01-01T10:15:00Z',
          delivered_at: '2025-01-01T10:16:00Z',
          created_at: '2025-01-01T10:00:00Z'
        },
        {
          id: '2',
          template_id: '2',
          template_name: 'Meeting Reminder',
          type: 'whatsapp',
          subject: null,
          content: 'Hi John! 👋\n\nThis is a reminder about our upcoming meeting on January 15th at 7:00 PM.\n\nLocation: JCI Ambato Office\n\nSee you there! 🎯',
          variables_used: { first_name: 'John', meeting_date: 'January 15th', meeting_time: '7:00 PM', meeting_location: 'JCI Ambato Office' },
          status: 'sent',
          error_message: null,
          sent_at: '2025-01-06T09:00:00Z',
          delivered_at: null,
          created_at: '2025-01-06T08:45:00Z'
        },
        {
          id: '3',
          template_id: '3',
          template_name: 'Payment Reminder',
          type: 'email',
          subject: 'Payment Reminder - JCI Ambato',
          content: 'Dear John,\n\nThis is a friendly reminder that your membership payment is due.\n\nAmount: $50.00\nDue Date: January 31st\n\nPlease make your payment at your earliest convenience.\n\nBest regards,\nJCI Ambato Team',
          variables_used: { first_name: 'John', amount: '$50.00', due_date: 'January 31st' },
          status: 'failed',
          error_message: 'Invalid email address',
          sent_at: null,
          delivered_at: null,
          created_at: '2025-01-07T14:30:00Z'
        }
      ]

      setMessages(mockMessages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load message history')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'sent':
        return <Send className="h-4 w-4 text-blue-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    return type === 'email' ? (
      <Mail className="h-4 w-4" />
    ) : (
      <MessageSquare className="h-4 w-4" />
    )
  }

  const filteredMessages = messages.filter(message => {
    const matchesType = filter === 'all' || message.type === filter
    const matchesStatus = statusFilter === 'all' || message.status === statusFilter
    const matchesSearch = searchTerm === '' || 
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesType && matchesStatus && matchesSearch
  })

  if (!canView) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8 text-gray-500">
          <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>You don't have permission to view message history</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Message History</h2>
          <div className="text-sm text-gray-500">
            {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-navy focus:border-transparent outline-none flex-1 min-w-0"
            />
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="p-6">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No messages found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-sm text-navy hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                      {getTypeIcon(message.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {message.subject || message.template_name || `${message.type} message`}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(message.status)}`}>
                          {message.status}
                        </span>
                        {getStatusIcon(message.status)}
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {message.content}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Template: {message.template_name || 'Custom'}</span>
                        {message.sent_at && (
                          <span>Sent: {new Date(message.sent_at).toLocaleString()}</span>
                        )}
                        {message.delivered_at && (
                          <span>Delivered: {new Date(message.delivered_at).toLocaleString()}</span>
                        )}
                        {message.error_message && (
                          <span className="text-red-600">Error: {message.error_message}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Message Details</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Subject</h4>
                  <p className="text-sm text-gray-900">
                    {selectedMessage.subject || 'No subject'}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Content</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap font-sans">
                      {selectedMessage.content}
                    </pre>
                  </div>
                </div>

                {selectedMessage.variables_used && Object.keys(selectedMessage.variables_used).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Variables Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedMessage.variables_used).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Status</h4>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedMessage.status)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedMessage.status)}`}>
                        {selectedMessage.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Type</h4>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedMessage.type)}
                      <span className="text-sm text-gray-900 capitalize">{selectedMessage.type}</span>
                    </div>
                  </div>
                </div>

                {selectedMessage.error_message && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Error Message</h4>
                    <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {selectedMessage.error_message}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Created</h4>
                    <p className="text-gray-600">{new Date(selectedMessage.created_at).toLocaleString()}</p>
                  </div>
                  {selectedMessage.sent_at && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Sent</h4>
                      <p className="text-gray-600">{new Date(selectedMessage.sent_at).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedMessage.delivered_at && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Delivered</h4>
                      <p className="text-gray-600">{new Date(selectedMessage.delivered_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-3 py-2 text-sm bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
