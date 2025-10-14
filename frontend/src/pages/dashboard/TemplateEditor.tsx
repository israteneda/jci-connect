import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTemplates } from '@/hooks/useTemplates'
import { PermissionsLoader } from '@/components/common/PermissionsLoader'
import { 
  Save, 
  Code,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// Custom styles to override Quill's default borders
const quillCustomStyles = `
  .ql-container {
    border: none !important;
  }
  .ql-toolbar {
    border: none !important;
    border-bottom: 1px solid #d1d5db !important;
  }
  .ql-editor {
    border: none !important;
  }
`

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

import type { Database } from '@/types/database.types'

type Template = Database['public']['Tables']['message_templates']['Row']

interface FormData {
  name: string
  type: 'email' | 'whatsapp'
  subject: string
  content: string
  variables: string[]
  is_active: boolean
}

export default function TemplateEditor() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { fetchTemplate, updateTemplate, createTemplate } = useTemplates()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: 'email',
    subject: '',
    content: '',
    variables: [],
    is_active: true
  })

  useEffect(() => {
    const loadTemplate = async () => {
      if (templateId) {
        try {
          const foundTemplate = await fetchTemplate(templateId)
          if (foundTemplate) {
            setTemplate(foundTemplate)
            setFormData({
              name: foundTemplate.name,
              type: foundTemplate.type as 'email' | 'whatsapp',
              subject: foundTemplate.subject || '',
              content: foundTemplate.content,
              variables: foundTemplate.variables || [],
              is_active: foundTemplate.is_active
            })
          }
        } catch (error) {
          console.error('Error loading template:', error)
        }
      }
      setLoading(false)
    }

    loadTemplate()
  }, [templateId, fetchTemplate])

  // Inject custom styles for Quill editor
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = quillCustomStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.type === 'email' && !formData.subject.trim()) {
      toast.error('Email subject is required')
      return
    }

    setSaving(true)
    try {
      if (templateId) {
        // Update existing template
        await updateTemplate.mutateAsync({ id: templateId, updates: formData })
      } else {
        // Create new template
        await createTemplate.mutateAsync(formData)
      }
      
      toast.success('Template saved successfully!')
      
      // Navigate back to templates page
      navigate('/dashboard/templates')
    } catch (error) {
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/dashboard/templates')
  }

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

  const extractVariables = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const matches = content.match(variableRegex)
    return matches ? [...new Set(matches.map(match => match.slice(2, -2)))] : []
  }

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ 
      ...prev, 
      content,
      variables: extractVariables(content)
    }))
  }

  const renderPreview = () => {
    if (!formData.content) return <div className="text-gray-500">No content to preview</div>
    
    // Simple variable replacement for preview
    let previewContent = formData.content
    const previewVariables = {
      first_name: 'John',
      organization_name: 'JCI Ottawa',
      last_name: 'Doe',
      email: 'john.doe@example.com'
    }
    
    Object.entries(previewVariables).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })
    
    return (
      <div 
        className="prose max-w-none p-4 border rounded-lg bg-white"
        dangerouslySetInnerHTML={{ __html: previewContent }}
      />
    )
  }

  if (loading) {
    return (
      <PermissionsLoader>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full border-b-2 border-navy mx-auto mb-2 h-8 w-8"></div>
            <p className="text-gray-600 text-sm">Loading template...</p>
          </div>
        </div>
      </PermissionsLoader>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Template Not Found</h1>
          <p className="text-gray-600 mb-4">The template you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/dashboard/templates')}
            className="bg-navy text-white px-3 py-2 text-sm rounded-lg hover:bg-navy-dark transition-colors"
          >
            Back to Templates
          </button>
        </div>
      </div>
    )
  }

  return (
    <PermissionsLoader>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="px-4 md:px-6 py-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Templates
          </button>
        </div>

        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Template: {template.name}
            </h1>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
{showPreview ? <Code className="h-4 w-4" /> : <span className="text-sm">👁</span>}
                {showPreview ? 'Edit' : 'Preview'}
              </button>
              
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 md:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content Area */}
            <div className="flex-1">

              {/* Editor Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">

                  {/* Template Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                      placeholder="Enter template name"
                    />
                  </div>

                  {/* Email Subject (only for email templates) */}
                  {formData.type === 'email' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject *
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent"
                        placeholder="Enter email subject"
                      />
                    </div>
                  )}

                  {/* Content Editor */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Message Content *
                      </label>
                      
                      {/* Variable Insertion */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Insert variables:</span>
                        <button
                          onClick={() => insertVariable('first_name')}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          {`{{first_name}}`}
                        </button>
                        <button
                          onClick={() => insertVariable('organization_name')}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          {`{{organization_name}}`}
                        </button>
                        <button
                          onClick={() => insertVariable('last_name')}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                        >
                          {`{{last_name}}`}
                        </button>
                      </div>
                    </div>
                    
                    {!showPreview ? (
                      <div className="border border-gray-300 rounded-lg overflow-hidden">
                        <ReactQuill
                          theme="snow"
                          value={formData.content}
                          onChange={handleEditorChange}
                          modules={quillModules}
                          formats={quillFormats}
                          style={{ 
                            height: '400px',
                            border: 'none'
                          }}
                          placeholder={formData.type === 'email'
                            ? "Start typing your email template..."
                            : "Start typing your WhatsApp message..."
                          }
                        />
                      </div>
                    ) : (
                      <div className="border border-gray-300 rounded-lg bg-white" style={{ height: '400px', overflow: 'auto' }}>
                        {renderPreview()}
                      </div>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="text-navy"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Template is active
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-80 space-y-6">
              {/* Variables */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detected Variables</h3>
                {formData.variables.length > 0 ? (
                  <div className="space-y-2">
                    {formData.variables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Code className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {`{{${variable}}}`}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No variables detected</p>
                )}
              </div>

              {/* Template Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      formData.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2">{new Date(template.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Last Updated:</span>
                    <span className="ml-2">{new Date(template.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionsLoader>
  )
}
