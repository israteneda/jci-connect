import { Link } from 'react-router-dom'
import { useChapters } from '@/hooks/useChapters'
import { Building2, Users, MapPin } from 'lucide-react'

export function Chapters() {
  const { chapters, isLoading } = useChapters()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Chapters</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chapters?.map((chapter) => (
          <Link
            key={chapter.id}
            to={`/dashboard/chapters/${chapter.id}`}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-navy rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                chapter.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {chapter.status}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{chapter.name}</h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{chapter.city}, {chapter.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{chapter.member_count} members</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

