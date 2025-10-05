import { useState } from 'react'
import { useMembers } from '@/hooks/useMembers'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MemberFormDialog({ open, onOpenChange }: MemberFormDialogProps) {
  const { createMember } = useMembers()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const role = formData.get('role') as string
      const hasMembership = formData.get('has_membership') === 'true'

      await createMember.mutateAsync({
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        role: role as any,
        first_name: formData.get('first_name') as string,
        last_name: formData.get('last_name') as string,
        phone: formData.get('phone') as string || undefined,
        city: formData.get('city') as string || undefined,
        country: formData.get('country') as string || undefined,
        // Only include membership data if enabled
        membership_type: hasMembership ? (formData.get('membership_type') as any) : undefined,
        start_date: hasMembership ? (formData.get('start_date') as string) : undefined,
        expiry_date: hasMembership ? (formData.get('expiry_date') as string) : undefined,
        annual_fee: hasMembership ? (Number(formData.get('annual_fee')) || undefined) : undefined,
      })

      const userType = role === 'candidate' ? 'Candidate' : role === 'admin' ? 'Admin' : 'Member'
      toast.success(`${userType} created successfully! n8n webhook triggered.`)
      onOpenChange(false)
      e.currentTarget.reset()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Add New Member</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* User Role */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                defaultValue="member"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
              >
                <option value="candidate">Candidate (Potential Member)</option>
                <option value="member">Member</option>
                <option value="senator">Senator (Member 40+)</option>
                <option value="admin">Admin</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Senators are members aged 40+ approved by the international organization
              </p>
            </div>
          </div>

          {/* Membership Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Membership Information</h3>
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_membership"
                  value="true"
                  defaultChecked
                  className="rounded border-gray-300 text-navy focus:ring-navy"
                />
                <span className="text-sm font-medium text-gray-700">
                  Create membership record (uncheck for admins without membership)
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Type *
                </label>
                <select
                  name="membership_type"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                >
                  <option value="local">Local</option>
                  <option value="national">National</option>
                  <option value="international">International</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  required
                  defaultValue={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Fee (USD)
                </label>
                <input
                  type="number"
                  name="annual_fee"
                  step="0.01"
                  defaultValue="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-navy hover:bg-navy-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

