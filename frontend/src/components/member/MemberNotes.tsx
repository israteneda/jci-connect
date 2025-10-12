import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Lock, 
  Globe, 
  Save, 
  X,
  FileText
} from 'lucide-react'
// import { formatDate } from '@/lib/utils' // Not currently used
import { toast } from 'sonner'

interface Note {
  id: string
  title: string
  content: string
  is_private: boolean
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

interface MemberNotesProps {
  userId: string
  canEdit?: boolean
}

export function MemberNotes({ userId, canEdit = false }: MemberNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all')

  useEffect(() => {
    fetchNotes()
  }, [userId])

  const fetchNotes = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      // Mock data for now
      const mockNotes: Note[] = [
        {
          id: '1',
          title: 'Initial Contact',
          content: 'Met John at the networking event. Very interested in JCI and has experience in marketing. Follow up with membership information.',
          is_private: false,
          tags: ['networking', 'marketing', 'prospect'],
          created_by: 'admin-user-id',
          created_at: '2025-01-01T10:00:00Z',
          updated_at: '2025-01-01T10:00:00Z'
        },
        {
          id: '2',
          title: 'Payment Issue',
          content: 'Had trouble with online payment. Called to assist with manual payment process. Payment completed successfully.',
          is_private: true,
          tags: ['payment', 'support'],
          created_by: 'admin-user-id',
          created_at: '2025-01-05T14:30:00Z',
          updated_at: '2025-01-05T14:30:00Z'
        },
        {
          id: '3',
          title: 'Meeting Attendance',
          content: 'Attended the January board meeting. Showed great interest in the community service projects. Potential for leadership role.',
          is_private: false,
          tags: ['meeting', 'leadership', 'community-service'],
          created_by: 'admin-user-id',
          created_at: '2025-01-06T19:00:00Z',
          updated_at: '2025-01-06T19:00:00Z'
        }
      ]

      setNotes(mockNotes)
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast.error('Failed to load notes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // TODO: Implement API call to create note
      const newNote: Note = {
        ...noteData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setNotes(prev => [newNote, ...prev])
      setShowCreateModal(false)
      toast.success('Note created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create note')
    }
  }

  const handleUpdateNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingNote) return
    
    try {
      // TODO: Implement API call to update note
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id 
          ? { ...note, ...noteData, updated_at: new Date().toISOString() }
          : note
      ))
      setEditingNote(null)
      toast.success('Note updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update note')
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    try {
      // TODO: Implement API call to delete note
      setNotes(prev => prev.filter(note => note.id !== noteId))
      toast.success('Note deleted successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete note')
    }
  }

  const filteredNotes = notes.filter(note => {
    if (filter === 'public') return !note.is_private
    if (filter === 'private') return note.is_private
    return true
  })

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
          <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
          >
            <option value="all">All Notes</option>
            <option value="public">Public Notes</option>
            <option value="private">Private Notes</option>
          </select>
        </div>
      </div>

      {/* Notes List */}
      <div className="p-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No notes found</p>
            {canEdit && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-600 transition-colors mx-auto"
              >
                <Plus className="h-4 w-4" />
                Add First Note
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900">{note.title}</h3>
                      {note.is_private ? (
                        <Lock className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Globe className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{note.content}</p>
                    
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {new Date(note.created_at).toLocaleString()}</span>
                      {note.updated_at !== note.created_at && (
                        <span>Updated: {new Date(note.updated_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  {canEdit && (
                    <div className="flex items-center gap-1 ml-4">
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
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
          </div>
        )}
      </div>

      {/* Create/Edit Note Modal */}
      {(showCreateModal || editingNote) && (
        <NoteModal
          note={editingNote}
          onClose={() => {
            setShowCreateModal(false)
            setEditingNote(null)
          }}
          onSave={editingNote ? handleUpdateNote : handleCreateNote}
        />
      )}
    </div>
  )
}

// Note Modal Component
interface NoteModalProps {
  note?: Note | null
  onClose: () => void
  onSave: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => void
}

function NoteModal({ note, onClose, onSave }: NoteModalProps) {
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
    is_private: note?.is_private ?? false,
    tags: note?.tags || []
  })
  const [newTag, setNewTag] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onSave({
      title: formData.title,
      content: formData.content,
      is_private: formData.is_private,
      tags: formData.tags,
      created_by: null // Will be set by backend
    })
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {note ? 'Edit Note' : 'Create Note'}
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
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                placeholder="Note title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none resize-none"
                placeholder="Note content..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_private}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_private: e.target.checked }))}
                  className="rounded border-gray-300 text-navy focus:ring-navy"
                />
                <span className="text-sm font-medium text-gray-700">Private note</span>
                <Lock className="h-4 w-4 text-gray-400" />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Private notes are only visible to you
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  Add
                </button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
                className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                {note ? 'Update Note' : 'Create Note'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
