import { useState } from 'react'
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings'
import { usePermissions } from '@/hooks/usePermissions'
import { PermissionsLoader } from '@/components/common/PermissionsLoader'
import { Save, Building2, Mail, Phone, Globe, MapPin, MessageSquare, Server, Key, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

// Type definitions for configuration objects
interface WhatsAppConfig {
  enabled?: boolean
  api_url?: string
  api_key?: string
  instance_name?: string
  webhook_url?: string
}

interface EmailConfig {
  enabled?: boolean
  smtp_host?: string
  smtp_port?: number
  smtp_username?: string
  smtp_password?: string
  smtp_secure?: boolean
  from_email?: string
  from_name?: string
}

export function Settings() {
  const { settings, isLoading, updateSettings } = useOrganizationSettings()
  const { can } = usePermissions()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'whatsapp' | 'email'>('general')
  const [showPasswords, setShowPasswords] = useState({
    whatsapp: false,
    email: false
  })

  // Helper functions to safely access configuration objects
  const getWhatsAppConfig = (): WhatsAppConfig => {
    if (settings?.whatsapp_config && typeof settings.whatsapp_config === 'object') {
      return settings.whatsapp_config as WhatsAppConfig
    }
    return {}
  }

  const getEmailConfig = (): EmailConfig => {
    if (settings?.email_config && typeof settings.email_config === 'object') {
      return settings.email_config as EmailConfig
    }
    return {}
  }

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
      const updateData: any = {
        organization_name: formData.get('organization_name') as string,
        organization_city: formData.get('organization_city') as string || null,
        organization_country: formData.get('organization_country') as string || null,
        description: formData.get('description') as string || null,
        email: formData.get('email') as string || null,
        phone: formData.get('phone') as string || null,
        website: formData.get('website') as string || null,
      }

      // Add WhatsApp configuration if on WhatsApp tab
      if (activeTab === 'whatsapp') {
        updateData.whatsapp_config = {
          enabled: formData.get('whatsapp_enabled') === 'on',
          api_url: formData.get('whatsapp_api_url') as string || null,
          api_key: formData.get('whatsapp_api_key') as string || null,
          instance_name: formData.get('whatsapp_instance_name') as string || null,
          webhook_url: formData.get('whatsapp_webhook_url') as string || null,
        }
      }

      // Add Email configuration if on Email tab
      if (activeTab === 'email') {
        updateData.email_config = {
          enabled: formData.get('email_enabled') === 'on',
          smtp_host: formData.get('smtp_host') as string || null,
          smtp_port: parseInt(formData.get('smtp_port') as string) || null,
          smtp_username: formData.get('smtp_username') as string || null,
          smtp_password: formData.get('smtp_password') as string || null,
          smtp_secure: formData.get('smtp_secure') === 'on',
          from_email: formData.get('from_email') as string || null,
          from_name: formData.get('from_name') as string || null,
        }
      }

      await updateSettings.mutateAsync(updateData)
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
    <PermissionsLoader>
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chapter Settings</h1>
        <p className="text-gray-600 mt-2">Manage your chapter's information and communication settings</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'general'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building2 className="h-4 w-4" />
              General
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
              WhatsApp
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'email'
                  ? 'border-navy text-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* General Settings Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Building2 className="h-5 w-5 text-navy" />
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <input
                      type="text"
                      name="organization_name"
                      defaultValue={settings?.organization_name}
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
                      name="organization_city"
                      defaultValue={settings?.organization_city || ''}
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
                      name="organization_country"
                      defaultValue={settings?.organization_country || ''}
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
              <div>
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
            </div>
          )}

          {/* WhatsApp Settings Tab */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-navy" />
                <h2 className="text-xl font-semibold text-gray-900">WhatsApp EvolutionAPI Configuration</h2>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900">EvolutionAPI Integration</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Configure your WhatsApp Business API through EvolutionAPI to send messages directly from templates.
                      You'll need an EvolutionAPI instance and API key.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="whatsapp_enabled"
                    defaultChecked={getWhatsAppConfig().enabled || false}
                    className="rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable WhatsApp messaging</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Server className="inline h-4 w-4 mr-1" />
                      API URL *
                    </label>
                    <input
                      type="url"
                      name="whatsapp_api_url"
                      defaultValue={getWhatsAppConfig().api_url || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                      placeholder="https://your-evolution-api.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Key className="inline h-4 w-4 mr-1" />
                      API Key *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.whatsapp ? 'text' : 'password'}
                        name="whatsapp_api_key"
                        defaultValue={getWhatsAppConfig().api_key || ''}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                        placeholder="Your EvolutionAPI key"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.whatsapp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instance Name *
                    </label>
                    <input
                      type="text"
                      name="whatsapp_instance_name"
                      defaultValue={getWhatsAppConfig().instance_name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                      placeholder="your-instance-name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      name="whatsapp_webhook_url"
                      defaultValue={getWhatsAppConfig().webhook_url || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                      placeholder="https://your-app.com/webhook/whatsapp"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Mail className="h-5 w-5 text-navy" />
                <h2 className="text-xl font-semibold text-gray-900">SMTP Email Configuration</h2>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-900">SMTP Configuration</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Configure your SMTP server settings to send emails directly from templates.
                      Supports Gmail, Outlook, and other SMTP providers.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="email_enabled"
                    defaultChecked={getEmailConfig().enabled || false}
                    className="rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <label className="text-sm font-medium text-gray-700">Enable email messaging</label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Server className="inline h-4 w-4 mr-1" />
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      name="smtp_host"
                      defaultValue={getEmailConfig().smtp_host || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port *
                    </label>
                    <input
                      type="number"
                      name="smtp_port"
                      defaultValue={getEmailConfig().smtp_port || 587}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                      placeholder="587"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Username *
                    </label>
                    <input
                      type="email"
                      name="smtp_username"
                      defaultValue={getEmailConfig().smtp_username || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                      placeholder="your-email@gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Key className="inline h-4 w-4 mr-1" />
                      SMTP Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.email ? 'text' : 'password'}
                        name="smtp_password"
                        defaultValue={getEmailConfig().smtp_password || ''}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                        placeholder="Your email password or app password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, email: !prev.email }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.email ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email *
                    </label>
                    <input
                      type="email"
                      name="from_email"
                      defaultValue={getEmailConfig().from_email || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                      placeholder="noreply@jciambato.org"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name *
                    </label>
                    <input
                      type="text"
                      name="from_name"
                      defaultValue={getEmailConfig().from_name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                      placeholder="JCI Ambato"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="smtp_secure"
                        defaultChecked={getEmailConfig().smtp_secure || false}
                        className="rounded border-gray-300 text-navy focus:ring-navy"
                      />
                      <label className="text-sm font-medium text-gray-700">Use SSL/TLS (recommended for port 465)</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-8">
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
      </div>
    </PermissionsLoader>
  )
}

