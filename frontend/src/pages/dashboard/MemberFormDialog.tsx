import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMembers } from '@/hooks/useMembers'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { memberSchema, type MemberFormData } from '@/lib/validations/member'
import { X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MemberFormDialog({ open, onOpenChange }: MemberFormDialogProps) {
  const { createMember } = useMembers()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone_country_code: '+1',
      phone: '',
      date_of_birth: '',
      address: '',
      role: 'guest',
      diet_restrictions: '',
      has_membership: true,
      payment_type: 'annual',
      annual_fee: 100,
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    },
  })

  // Persist form data, excluding password for security
  const { clearStoredData } = useFormPersistence({
    watch,
    setValue,
    storageKey: 'jci-member-form',
    excludeFields: ['password'],
  })

  const onSubmit = async (data: MemberFormData) => {
    setLoading(true)

    try {
      // Combine country code and phone number
      const fullPhone = data.phone ? `${data.phone_country_code} ${data.phone}` : undefined

      await createMember.mutateAsync({
        email: data.email,
        password: data.password,
        role: data.role as any,
        first_name: data.first_name,
        last_name: data.last_name,
        phone: fullPhone,
        date_of_birth: data.date_of_birth || undefined,
        address: data.address || undefined,
        diet_restrictions: data.diet_restrictions || undefined,
        // Only include membership data if enabled
        membership_type: data.has_membership ? 'local' : undefined,
        payment_type: data.has_membership ? data.payment_type : undefined,
        start_date: data.has_membership ? data.start_date : undefined,
        expiry_date: data.has_membership ? data.expiry_date : undefined,
        annual_fee: data.has_membership ? data.annual_fee : undefined,
      })

      const userType = data.role === 'guest' ? 'Guest'
        : data.role === 'prospective' ? 'Prospective Member'
        : data.role === 'member' ? 'Member'
        : data.role === 'admin' ? 'Admin'
        : 'Guest'
      
      toast.success(`${userType} created successfully! n8n webhook triggered.`)
      clearStoredData() // Clear saved data after successful submission
      reset() // Reset form
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSavedData = () => {
    clearStoredData()
    reset()
    toast.success('Saved form data cleared')
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add New Member</h2>
          <button
            onClick={() => onOpenChange(false)}
            type="button"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  {...register('first_name')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                    errors.first_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.first_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  {...register('last_name')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                    errors.last_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.last_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  {...register('password')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <div className="flex gap-2">
                  <select
                    {...register('phone_country_code')}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+1">🇨🇦 +1</option>
                    <option value="+52">🇲🇽 +52</option>
                    <option value="+593">🇪🇨 +593</option>
                    <option value="+54">🇦🇷 +54</option>
                    <option value="+55">🇧🇷 +55</option>
                    <option value="+56">🇨🇱 +56</option>
                    <option value="+57">🇨🇴 +57</option>
                    <option value="+51">🇵🇪 +51</option>
                    <option value="+58">🇻🇪 +58</option>
                    <option value="+507">🇵🇦 +507</option>
                    <option value="+506">🇨🇷 +506</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+49">🇩🇪 +49</option>
                  </select>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="1234567890"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  {...register('date_of_birth')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                    errors.date_of_birth ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_of_birth && (
                  <p className="mt-1 text-xs text-red-600">{errors.date_of_birth.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="Street, City, Country"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diet Restrictions
                </label>
                <textarea
                  {...register('diet_restrictions')}
                  placeholder="e.g., Vegetarian, Vegan, Gluten-free, Allergies, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Specify any dietary restrictions or allergies for event planning
                </p>
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
                {...register('role')}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="guest">Guest</option>
                <option value="prospective">Prospective</option>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-red-600">{errors.role.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                <strong>Guest:</strong> Browsing/interested. <strong>Prospective:</strong> Interested in joining JCI. <strong>Member:</strong> Active JCI member. <strong>Admin:</strong> Organization administrator with full access.
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
                  {...register('has_membership')}
                  className="rounded border-gray-300 text-navy focus:ring-navy"
                />
                <span className="text-sm font-medium text-gray-700">
                  Create membership record (uncheck for admins without membership)
                </span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type *
                </label>
                <select
                  {...register('payment_type')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                    errors.payment_type ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                </select>
                {errors.payment_type && (
                  <p className="mt-1 text-xs text-red-600">{errors.payment_type.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fee Amount (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('annual_fee', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                    errors.annual_fee ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.annual_fee && (
                  <p className="mt-1 text-xs text-red-600">{errors.annual_fee.message}</p>
                )}
              </div>
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
                  Expiry Date *
                </label>
                <input
                  type="date"
                  {...register('expiry_date')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none ${
                    errors.expiry_date ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.expiry_date && (
                  <p className="mt-1 text-xs text-red-600">{errors.expiry_date.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={handleClearSavedData}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear saved data
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
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
          </div>
        </form>
      </div>
    </div>
  )
}

