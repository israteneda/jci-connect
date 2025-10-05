import { useState } from 'react'
import { useChapterSettings } from '@/hooks/useChapterSettings'
import { usePermissions } from '@/hooks/usePermissions'
import { Save, Building2, Mail, Phone, Globe, MapPin } from 'lucide-react'
import { toast } from 'sonner'

export function Settings() {
  const { settings, isLoading, updateSettings } = useChapterSettings()
  const { can } = usePermissions()
  const [isSaving, setIsSaving] = useState(false)

  const canEdit = can('settings', 'update')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canEdit) {
      toast.error('You do not have permission to update settings')
      return
    }

    setIsSaving(true)
    const formData = new FormData(e.currentTarget)

    try {
      await updateSettings.mutateAsync({
        chapter_name: formData.get('chapter_name') as string,
        chapter_city: formData.get('chapter_city') as string || null,
        chapter_country: formData.get('chapter_country') as string || null,
        description: formData.get('description') as string || null,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        website: formData.get('website') as string || null,
      })

      toast.success('Settings updated successfully!')
    } catch (error: any) {
      console.error('Error updating settings:', error)
      toast.error(error.message || 'Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">You do not have permission to view or edit settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Chapter Settings</h1>
        <p className="text-gray-600 mt-2">Manage your chapter's information and appearance</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="h-5 w-5 text-navy" />
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chapter Name *
              </label>
              <input
                type="text"
                name="chapter_name"
                defaultValue={settings?.chapter_name}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                placeholder="e.g., JCI Ambato"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                City
              </label>
              <input
                type="text"
                name="chapter_city"
                defaultValue={settings?.chapter_city || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                placeholder="e.g., Ambato"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Country
              </label>
              <input
                type="text"
                name="chapter_country"
                defaultValue={settings?.chapter_country || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                placeholder="e.g., Ecuador"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={settings?.description || ''}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none resize-none"
                placeholder="A brief description of your chapter..."
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Mail className="h-5 w-5 text-navy" />
            <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                name="email"
                defaultValue={settings?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                placeholder="contact@jciambato.org"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-1" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                defaultValue={settings?.phone || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                placeholder="+593 123 456 789"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="inline h-4 w-4 mr-1" />
                Website
              </label>
              <input
                type="url"
                name="website"
                defaultValue={settings?.website || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                placeholder="https://www.jciambato.org"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

