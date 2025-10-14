import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useMembers } from '@/hooks/useMembers'
import { useBoardPositions } from '@/hooks/useBoardPositions'
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings'
import { 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Database,
  Key,
  Settings,
  Users,
  Crown,
  MessageSquare,
  Server,
  Eye,
  EyeOff,
  Save,
  Building2,
  Globe
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
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

export function AdminData() {
  const { user, loading: authLoading } = useAuth()
  const { can, role } = usePermissions()
  const { members } = useMembers()
  const { positions } = useBoardPositions(user?.id)
  const { settings, updateSettings } = useOrganizationSettings()
  
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp')
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

  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

      await updateSettings.mutateAsync(updateData)
      toast.success('Settings updated successfully!')
    } catch (error: any) {
      console.error('Error updating settings:', error)
      toast.error(error.message || 'Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfigSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canEdit) {
      toast.error('You do not have permission to update settings')
      return
    }

    setIsSaving(true)
    const formData = new FormData(e.currentTarget)

    try {
      const updateData: any = {}

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
      toast.success('Configuration updated successfully!')
    } catch (error: any) {
      console.error('Error updating configuration:', error)
      toast.error(error.message || 'Failed to update configuration')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">No user data available</div>
        <p className="text-gray-600">Please log in to view admin data</p>
      </div>
    )
  }

  const adminMembers = members?.filter(m => m.role === 'admin') || []
  const totalMembers = members?.length || 0
  const activeMembers = members?.filter(m => m.memberships?.status === 'active').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Data</h1>
          <p className="text-gray-600">Current admin user information and system data</p>
        </div>
      </div>

      {/* Current Admin User */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Current Admin User</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-gray-400" />
                <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                  {user.id}
                </code>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{user.email}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-500" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800`}>
                  {role}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.profile?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.profile?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            {user.profile && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <span className="text-sm">
                    {user.profile.first_name} {user.profile.last_name}
                  </span>
                </div>

                {user.profile.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.profile.phone}</span>
                    </div>
                  </div>
                )}

                {user.profile.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{user.profile.address}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{formatDate(user.profile.created_at)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Admin Permissions</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${can('members', 'create') ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Create Members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${can('members', 'read') ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Read Members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${can('members', 'update') ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Update Members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${can('members', 'delete') ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Delete Members</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${can('board_positions', 'create') ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Create Board Positions</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${can('settings', 'update') ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Update Settings</span>
          </div>
        </div>
      </div>

      {/* System Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">System Statistics</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Total Members</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{totalMembers}</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Active Members</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{activeMembers}</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Admin Users</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{adminMembers.length}</div>
          </div>

          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-900">Board Positions</span>
            </div>
            <div className="text-2xl font-bold text-amber-900">{positions?.length || 0}</div>
          </div>
        </div>
      </div>


      {/* Settings Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Chapter Settings</h2>
        </div>

        <form onSubmit={handleSettingsSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="h-5 w-5 text-navy" />
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
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
                <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
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

          {/* Save Button */}
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Communication Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Communication Configuration</h2>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
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
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
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

        <form onSubmit={handleConfigSubmit}>
          {/* WhatsApp Configuration */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-navy" />
                <h3 className="text-lg font-semibold text-gray-900">WhatsApp EvolutionAPI Configuration</h3>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">EvolutionAPI Integration</h4>
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

          {/* Email Configuration */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6">
                <Mail className="h-5 w-5 text-navy" />
                <h3 className="text-lg font-semibold text-gray-900">SMTP Email Configuration</h3>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-900">SMTP Configuration</h4>
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
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Raw Data (Debug) */}
      <div className="bg-gray-50 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-900">Raw User Data (Debug)</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Auth User Object</label>
            <pre className="bg-white p-4 rounded border text-xs overflow-auto max-h-40">
              {JSON.stringify({
                id: user.id,
                email: user.email,
                created_at: user.created_at,
                last_sign_in_at: user.last_sign_in_at,
                email_confirmed_at: user.email_confirmed_at,
                phone: user.phone,
                phone_confirmed_at: user.phone_confirmed_at
              }, null, 2)}
            </pre>
          </div>

          {user.profile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Object</label>
              <pre className="bg-white p-4 rounded border text-xs overflow-auto max-h-40">
                {JSON.stringify(user.profile, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
