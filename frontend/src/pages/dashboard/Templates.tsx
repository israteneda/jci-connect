import { useState, useEffect } from 'react'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionsLoader } from '@/components/common/PermissionsLoader'
import { 
  Plus, 
  Mail, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Eye, 
  Send,
  Save,
  X,
  Code,
  EyeIcon
} from 'lucide-react'
import { toast } from 'sonner'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// Quill.js configuration for email templates
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
}

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'align',
  'link', 'image'
]

interface Template {
  id: string
  name: string
  type: 'email' | 'whatsapp'
  subject?: string
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export function Templates() {
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Mock data - will be replaced with actual API calls
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Prospective Member Email',
      type: 'email',
      subject: 'Explore Growth, Leadership & Friendship with {{organization_name}}',
      content: 'Hi {{first_name}},\n\nThank you for your interest in {{organization_name}}. We\'re a community of young leaders and professionals who believe in developing skills, creating impact, and building lifelong friendships along the way.\n\nWhen you become part of JCI, you open the door to a wide range of opportunities for personal and professional growth:\n\n<strong>Training & Mentorship</strong> – Participate in workshops, develop public speaking and facilitation skills, and even progress toward becoming a certified JCI trainer.\n\n<strong>Leadership Development</strong> – Take up local, national, or international leadership roles that challenge and grow your abilities.\n\n<strong>Entrepreneurship & Innovation</strong> – Join projects that nurture entrepreneurial thinking and bring ideas to life.\n\n<strong>Community Impact</strong> – Lead or support initiatives that address real challenges and create meaningful change in Ottawa.\n\n<strong>Networking & Global Connections</strong> – Build strong relationships with professionals, entrepreneurs, and changemakers across Canada and over 100 countries worldwide.\n\nYou can learn more about {{organization_name}} here: https://www.jciottawa.ca/index.php\n\nIf you\'d like to have a personal conversation about how JCI fits with your goals, you can schedule a short call with our Membership Director. [Insert Calendar Link]\n\nWe\'d love for you to experience what JCI truly offers — a place where learning leads to leadership, and friendships last far beyond meetings and events. Looking forward to see you as part of the community.\n\nWarm regards,\nIsrael\nPresident, {{organization_name}}',
      variables: ['first_name', 'organization_name'],
      is_active: true,
      created_at: '2025-01-07T10:00:00Z',
      updated_at: '2025-01-07T10:00:00Z'
    },
    {
      id: '2',
      name: 'JCI Ottawa Welcome WhatsApp',
      type: 'whatsapp',
      content: 'Hi *{{first_name}} {{last_name}}*\nWelcome to *{{organization_name}}*. We\'re excited to have you join our community of young leaders.\n\nDo you believe in _lifelong friendships_? At JCI, you\'ll find opportunities to build genuine connections while growing your skills and making an impact.\n\nHere are a few links to help you get started:\n• WhatsApp Group (for updates and reminders): Join here\n• JVC Platform (workshops and leadership resources): https://jvc.jci.cc/\n• Website (events and projects): https://www.jciottawa.ca/index.php\n• Facebook: https://www.facebook.com/JCI.Ottawa\n• Instagram: https://www.instagram.com/jciottawa/\n\nYou\'ll also find a detailed welcome email in your inbox with more information about *{{organization_name}}* and how to get involved.\n\nIf you\'d like, you can schedule a short call with our Membership Director (Your new friend) for a personal orientation into the organization. (we will create a Calendly Link or alternate open source)\n\nLooking forward to meeting you soon — because beyond skills and projects, JCI is where _lifelong friendships_ are built.\n\nBest Regards,\nIsrael\nPresident\n*{{organization_name}}*',
      variables: ['first_name', 'last_name', 'organization_name'],
      is_active: true,
      created_at: '2025-01-07T10:00:00Z',
      updated_at: '2025-01-07T10:00:00Z'
    },
    {
      id: '3',
      name: 'JCI Ottawa Welcome Email',
      type: 'email',
      subject: 'Welcome to {{organization_name}}, {{first_name}} {{last_name}}',
      content: 'Hi {{first_name}},\n\nWelcome to {{organization_name}}. We\'re excited to have you join our community of young leaders who are building connections, developing skills, and creating impact in Ottawa and beyond.\n\nTo help you get started, here are a few important links:\n\nWhatsApp Group: This is where members share updates, event reminders, and stay in touch. Join here\nJVC Platform: Our global hub for workshops, trainings, and leadership resources. Visit JVC\nWebsite: Learn more about upcoming events and local projects. Visit Website\nFacebook and Instagram: Follow us to stay connected and actively participate in our online community.\nFacebook | Instagram\n\nWe\'d also like to make your introduction to {{organization_name}} more personal. You can schedule a short orientation call with our Membership Director at a time that works for you. [Insert Calendar Link]\n\nAs a fun way to introduce yourself to the group, we invite you to send a quick 30-second video sharing your name, what you do, and one fun fact about yourself. This is completely optional, but it\'s a great way for other members to get to know you.\n\nWe look forward to meeting you soon and seeing how you\'ll get involved in our community.\n\nWarm regards,\nIsrael\nPresident, {{organization_name}}',
      variables: ['first_name', 'last_name', 'organization_name'],
      is_active: true,
      created_at: '2025-01-07T10:00:00Z',
      updated_at: '2025-01-07T10:00:00Z'
    }
  ])

  const canManage = can('templates', 'update')

  const handleCreateTemplate = async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true)
    try {
      // TODO: Implement API call to create template
      const newTemplate: Template = {
        ...templateData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setTemplates(prev => [...prev, newTemplate])
      setShowCreateModal(false)
      toast.success('Template created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateTemplate = async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingTemplate) return
    
    setIsLoading(true)
    try {
      // TODO: Implement API call to update template
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...templateData, updated_at: new Date().toISOString() }
          : t
      ))
      setEditingTemplate(null)
      toast.success('Template updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return
    
    setIsLoading(true)
    try {
      // TODO: Implement API call to delete template
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast.success('Template deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendTest = async (template: Template) => {
    setIsLoading(true)
    try {
      // TODO: Implement API call to send test message
      toast.success(`Test ${template.type} sent successfully!`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test message')
    } finally {
      setIsLoading(false)
    }
  }


  const filteredTemplates = templates.filter(t => t.type === activeTab)

  if (!canManage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">You do not have permission to manage templates.</p>
        </div>
      </div>
    )
  }

  return (
    <PermissionsLoader>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-gray-600 mt-2">Create and manage email and WhatsApp templates for member communications</p>
        </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('email')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'email'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email Templates
            </button>
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'whatsapp'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              WhatsApp Templates
            </button>
          </nav>
        </div>

        {/* Templates List */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'email' ? 'Email Templates' : 'WhatsApp Templates'}
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Template
            </button>
          </div>

          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                {activeTab === 'email' ? (
                  <Mail className="h-6 w-6 text-gray-400" />
                ) : (
                  <MessageSquare className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first {activeTab} template to start communicating with members.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create Template
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      {template.subject && (
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Subject:</strong> {template.subject}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {template.content}
                      </p>
                      
                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {template.variables.map((variable) => (
                            <span
                              key={variable}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {`{{${variable}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Updated {new Date(template.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setPreviewTemplate(template)
                          setShowPreviewModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleSendTest(template)}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Send Test"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Template Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          type={activeTab}
          onClose={() => {
            setShowCreateModal(false)
            setEditingTemplate(null)
          }}
          onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
          isLoading={isLoading}
        />
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewTemplate && (
        <PreviewModal
          template={previewTemplate}
          onClose={() => {
            setShowPreviewModal(false)
            setPreviewTemplate(null)
          }}
        />
      )}
      </div>
    </PermissionsLoader>
  )
}

// Template Modal Component
interface TemplateModalProps {
  template?: Template | null
  type: 'email' | 'whatsapp'
  onClose: () => void
  onSave: (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  isLoading: boolean
}

function TemplateModal({ template, type, onClose, onSave, isLoading }: TemplateModalProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    subject: template?.subject || '',
    content: template?.content || '',
    is_active: template?.is_active ?? true
  })
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject || '',
        content: template.content,
        is_active: template.is_active
      })
    } else {
      setFormData({
        name: '',
        subject: '',
        content: '',
        is_active: true
      })
    }
    // Reset preview state when template changes
    setShowPreview(false)
  }, [template])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const variables = extractVariables(formData.content + (formData.subject || ''))
    
    await onSave({
      name: formData.name,
      type,
      subject: type === 'email' ? formData.subject : undefined,
      content: formData.content,
      variables,
      is_active: formData.is_active
    })
  }


  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{\{([^}]+)\}\}/g)
    return matches ? matches.map(match => match.replace(/[{}]/g, '')) : []
  }


  // Function to insert variables into Quill editor
  const insertVariable = (variableName: string) => {
    const quillEditor = document.querySelector('.ql-editor') as HTMLElement
    if (quillEditor) {
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()
        const textNode = document.createTextNode(`{{${variableName}}}`)
        range.insertNode(textNode)
        range.setStartAfter(textNode)
        range.setEndAfter(textNode)
        selection.removeAllRanges()
        selection.addRange(range)
      }
    }
  }

  // Rich Text Editor Component for both Email and WhatsApp
  const EmailRichTextEditor = () => {
    const handleEditorChange = (content: string) => {
      setFormData(prev => ({ ...prev, content }))
    }

    return (
      <div className="space-y-4">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {type === 'email' ? 'Email Template Editor' : 'WhatsApp Template Editor'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className={`px-3 py-1 text-xs rounded ${
                  !showPreview 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Code className="h-3 w-3 inline mr-1" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className={`px-3 py-1 text-xs rounded ${
                  showPreview 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <EyeIcon className="h-3 w-3 inline mr-1" />
                Preview
              </button>
            </div>
          </div>
          
          {/* Variable Picker */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Insert:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  insertVariable(e.target.value)
                  e.target.value = ''
                }
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="">Select Variable</option>
              {availableVariables.map((variable) => (
                <option key={variable.name} value={variable.name}>
                  {variable.name} - {variable.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Editor or Preview */}
        {!showPreview ? (
          <div className="border border-gray-300 rounded-b-lg">
            <ReactQuill
              theme="snow"
              value={formData.content}
              onChange={handleEditorChange}
              modules={quillModules}
              formats={quillFormats}
              style={{ height: '400px' }}
              placeholder={type === 'email' 
                ? "Start typing your email template..." 
                : "Start typing your WhatsApp message..."
              }
            />
          </div>
        ) : (
          <div className="border border-gray-300 rounded-b-lg p-4 bg-white min-h-[400px]">
            <div className="prose max-w-none">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formData.content.replace(/\{\{([^}]+)\}\}/g, '<span class="bg-yellow-100 px-1 rounded text-yellow-800 font-mono text-sm">{{$1}}</span>')
                }} 
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  const availableVariables = [
    { name: 'first_name', description: 'Member first name' },
    { name: 'last_name', description: 'Member last name' },
    { name: 'organization_name', description: 'Organization name' },
    { name: 'member_number', description: 'Member number' },
    { name: 'email', description: 'Member email' },
    { name: 'phone', description: 'Member phone' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {template ? 'Edit Template' : 'Create Template'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                placeholder="e.g., Welcome Email"
              />
            </div>

            {type === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                  placeholder="e.g., Welcome to {{organization_name}}!"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Content *
              </label>
              
              {/* Rich Text Editor for both Email and WhatsApp */}
              <EmailRichTextEditor />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-navy focus:ring-navy"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>

            {/* Available Variables */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableVariables.map((variable) => (
                  <div key={variable.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <code className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                      {`{{${variable.name}}}`}
                    </code>
                    <span className="text-xs text-gray-600">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Preview Modal Component
interface PreviewModalProps {
  template: Template
  onClose: () => void
}

function PreviewModal({ template, onClose }: PreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Template Preview</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">{template.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                {template.type === 'email' ? (
                  <Mail className="h-4 w-4 text-gray-400" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-600 capitalize">{template.type} Template</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  template.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {template.subject && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Subject:</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{template.subject}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Content:</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-sans">{template.content}</pre>
              </div>
            </div>

            {template.variables.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Variables:</h4>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <span
                      key={variable}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
