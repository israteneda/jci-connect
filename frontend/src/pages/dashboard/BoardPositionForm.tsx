import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBoardPositions } from '@/hooks/useBoardPositions'
import { useMembers } from '@/hooks/useMembers'
import { ArrowLeft, Save, X } from 'lucide-react'

// Validation schema for board position form
const boardPositionSchema = z.object({
  user_id: z.string().min(1, 'Please select a member'),
  position_title: z.string().min(1, 'Position title is required'),
  level: z.enum(['local', 'national', 'international'], {
    errorMap: () => ({ message: 'Please select a valid level' }),
  }),
  description: z.string().optional(),
  priority: z.number().min(0).max(100).default(0),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  is_active: z.boolean().default(true),
})

type BoardPositionFormData = z.infer<typeof boardPositionSchema>

interface BoardPositionFormProps {
  isEditing?: boolean
}

export function BoardPositionForm({ isEditing = false }: BoardPositionFormProps) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { createPosition, updatePosition, positions, isLoading: positionsLoading } = useBoardPositions()
  const { members, isLoading: membersLoading } = useMembers()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BoardPositionFormData>({
    resolver: zodResolver(boardPositionSchema),
    defaultValues: {
      user_id: '',
      position_title: '',
      level: 'local',
      description: '',
      priority: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
    },
  })

  // Load existing position data if editing
  useEffect(() => {
    if (isEditing && id && positions) {
      const position = positions.find(p => p.id === id)
      if (position) {
        setValue('user_id', position.user_id)
        setValue('position_title', position.position_title)
        setValue('level', position.level as 'local' | 'national' | 'international')
        setValue('description', position.description || '')
        setValue('priority', position.priority || 0)
        setValue('start_date', position.start_date || '')
        setValue('end_date', position.end_date || '')
        setValue('is_active', position.is_active)
      }
    }
  }, [isEditing, id, positions, setValue])

  const onSubmit = async (data: BoardPositionFormData) => {
    setLoading(true)
    setError(null)

    try {
      if (isEditing && id) {
        await updatePosition.mutateAsync({
          id,
          updates: {
            user_id: data.user_id,
            position_title: data.position_title,
            level: data.level,
            description: data.description,
            priority: data.priority,
            start_date: data.start_date,
            end_date: data.end_date || null,
            is_active: data.is_active,
          },
        })
      } else {
        await createPosition.mutateAsync({
          user_id: data.user_id,
          position_title: data.position_title,
          level: data.level,
          description: data.description,
          priority: data.priority,
          start_date: data.start_date,
          end_date: data.end_date || null,
          is_active: data.is_active,
        })
      }
      
      navigate('/dashboard/board-members')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/dashboard/board-members')
  }

  if (membersLoading || positionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Board Members
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          {isEditing ? 'Edit Board Position' : 'Add Board Position'}
        </h1>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'Update the board position details' : 'Create a new board position for a member'}
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <X className="h-4 w-4" />
              <span className="font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Member Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Member *
            </label>
            <select
              {...register('user_id')}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                errors.user_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a member...</option>
              {members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name} ({member.memberships?.member_number})
                </option>
              ))}
            </select>
            {errors.user_id && (
              <p className="mt-1 text-xs text-red-600">{errors.user_id.message}</p>
            )}
          </div>

          {/* Position Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position Title *
            </label>
            <input
              type="text"
              {...register('position_title')}
              placeholder="e.g., President, Vice President, Treasurer"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                errors.position_title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.position_title && (
              <p className="mt-1 text-xs text-red-600">{errors.position_title.message}</p>
            )}
          </div>

          {/* Level and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level *
              </label>
              <select
                {...register('level')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                  errors.level ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="local">Local Chapter</option>
                <option value="national">National</option>
                <option value="international">International</option>
              </select>
              {errors.level && (
                <p className="mt-1 text-xs text-red-600">{errors.level.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                {...register('priority', { valueAsNumber: true })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                  errors.priority ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">Lower numbers = higher priority</p>
              {errors.priority && (
                <p className="mt-1 text-xs text-red-600">{errors.priority.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Optional description of responsibilities..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                {...register('start_date')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                  errors.start_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-red-600">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                {...register('end_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">Leave empty for ongoing position</p>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('is_active')}
              className="rounded border-gray-300 text-navy focus:ring-navy"
            />
            <label className="text-sm font-medium text-gray-700">
              Active Position
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : (isEditing ? 'Update Position' : 'Create Position')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
