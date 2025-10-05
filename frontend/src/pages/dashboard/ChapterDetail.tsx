import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useChapters } from '@/hooks/useChapters'
import { ArrowLeft } from 'lucide-react'

export function ChapterDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getChapter } = useChapters()
  const [chapter, setChapter] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      getChapter(id)
        .then(setChapter)
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

  if (!chapter) {
    return <div className="text-center py-12">Chapter not found</div>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{chapter.name}</h1>
        <p className="text-gray-600 mb-6">
          {chapter.city}, {chapter.country}
        </p>

        {chapter.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600">{chapter.description}</p>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Members ({chapter.memberships?.length || 0})
          </h2>
          
          {chapter.memberships?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No members in this chapter yet</p>
          ) : (
            <div className="space-y-3">
              {chapter.memberships?.map((membership: any) => (
                <div key={membership.id} className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-900">
                      Member #{membership.member_number}
                    </p>
                    <p className="text-sm text-gray-500">Type: {membership.membership_type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    membership.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {membership.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

