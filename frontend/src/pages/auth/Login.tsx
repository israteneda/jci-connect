import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '@/hooks/useAuth'
import { useFormPersistence } from '@/hooks/useFormPersistence'
import { loginSchema, type LoginFormData } from '@/lib/validations/auth'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export function Login() {
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Persist only email, exclude password for security
  const { clearStoredData } = useFormPersistence({
    watch,
    setValue,
    storageKey: 'jci-login-form',
    excludeFields: ['password'],
  })

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)

    try {
      await signIn(data.email, data.password)
      clearStoredData() // Clear saved email after successful login
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleClearSavedData = () => {
    clearStoredData()
    setValue('email', '')
    toast.success('Saved data cleared')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-aqua flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">JCI Connect</h1>
          <p className="text-gray-600">Member Management Platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-navy focus:border-transparent outline-none transition ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy hover:bg-navy-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleClearSavedData}
            className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear saved email
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Tenpisoft © {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  )
}

