'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  Shield, 
  AlertCircle,
  CheckCircle,
  User,
  Users,
  Crown,
  HardHat
} from 'lucide-react'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Redirect based on role when session is available
  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (session) {
      // Redirect based on user role
      switch (session.user.role) {
        case 'guard':
          router.push('/dashboard')
          break
        case 'security_supervisor':
          router.push('/supervisor-dashboard')
          break
        case 'maintenance':
          router.push('/maintenance-dashboard')
          break
        case 'management':
          router.push('/management-dashboard')
          break
        default:
          router.push('/dashboard')
      }
    }
  }, [session, status, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      // Don't manually redirect here - let useEffect handle it based on role
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) setError('')
  }

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // If already logged in, don't show login form
  if (session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-3xl opacity-20 blur-lg"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-lg">Sign in to IRPA System</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 transition-all duration-200 text-gray-900"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/70 transition-all duration-200 text-gray-900"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">{error}</p>
                    <p className="text-red-600 text-sm mt-1">Please check your credentials and try again.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link 
                href="/register" 
                className="text-blue-600 hover:text-blue-700 font-bold underline decoration-2 underline-offset-2 hover:underline-offset-4 transition-all duration-200"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}