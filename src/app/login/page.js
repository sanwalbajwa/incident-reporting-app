// src/app/login/page.js - Updated error handling for management mobile access

'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LocationService } from '@/lib/locationService'
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
  HardHat,
  Smartphone,
  Tablet,
  MapPin,
  Loader2
} from 'lucide-react'

// Separate component for handling search params
function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState('')
  const [errorRole, setErrorRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [locationStatus, setLocationStatus] = useState({
    loading: false,
    data: null,
    error: null
  })
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  // Load location on component mount
  useEffect(() => {
    loadLocation()
  }, [])

  // Check for URL parameters (like error from NextAuth)
  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) {
      if (urlError.includes('DEVICE_BLOCKED:')) {
        const errorParts = urlError.split(':')
        const deviceType = errorParts[1] || 'mobile'
        const userRole = errorParts[2] || 'unknown'
        
        setErrorRole(userRole)
        
        if (userRole === 'management') {
          // This shouldn't happen anymore, but just in case
          setError('Unexpected device restriction for management')
          setErrorType('MANAGEMENT_DEVICE_ERROR')
        } else {
          setError('Access restricted to company tablets and computers')
          setErrorType('DEVICE_BLOCKED')
        }
      }
    }
  }, [searchParams])

  // Redirect based on role when session is available
  useEffect(() => {
    if (status === 'loading') return

    if (session) {
      switch (session.user.role) {
        case 'guard':
        case 'rover':
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

  const loadLocation = async () => {
    setLocationStatus({ loading: true, data: null, error: null })
    
    try {
      const location = await LocationService.getCurrentLocation()
      setLocationStatus({ 
        loading: false, 
        data: location, 
        error: location.error 
      })
      
      console.log('Location loaded:', location)
    } catch (error) {
      console.error('Location error:', error)
      setLocationStatus({ 
        loading: false, 
        data: null, 
        error: error.message 
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrorType('')
    setErrorRole('')

    try {
      // Prepare credentials with location data
      const credentials = {
        email: formData.email,
        password: formData.password
      }

      // Include location data if available
      if (locationStatus.data) {
        credentials.locationData = JSON.stringify(locationStatus.data)
      }

      const result = await signIn('credentials', {
        ...credentials,
        redirect: false
      })

      if (result?.error) {
        // Handle specific error types with role information
        if (result.error.includes('CredentialsSignin')) {
          setError('Invalid email or password')
          setErrorType('INVALID_CREDENTIALS')
        } else if (result.error.includes('DEVICE_BLOCKED:')) {
          const errorParts = result.error.split(':')
          const deviceType = errorParts[1] || 'mobile'
          const userRole = errorParts[2] || 'unknown'
          
          setErrorRole(userRole)
          
          if (userRole === 'management') {
            // This shouldn't happen anymore, but handle gracefully
            setError('Unexpected access restriction. Please contact system administrator.')
            setErrorType('MANAGEMENT_DEVICE_ERROR')
          } else {
            setError('Access restricted to company tablets and computers')
            setErrorType('DEVICE_BLOCKED')
          }
        } else {
          setError('Login failed. Please try again.')
          setErrorType('GENERAL_ERROR')
        }
        setLoading(false)
      } else {
        // Success - let useEffect handle redirect
        setLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please check your connection.')
      setErrorType('NETWORK_ERROR')
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (error) {
      setError('')
      setErrorType('')
      setErrorRole('')
    }
  }

  const getLocationDisplay = () => {
    if (locationStatus.loading) {
      return (
        <div className="flex items-center gap-2 text-blue-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Getting location...</span>
        </div>
      )
    }

    if (locationStatus.error) {
      return (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Location unavailable</span>
        </div>
      )
    }

    if (locationStatus.data) {
      const location = locationStatus.data
      const display = LocationService.formatLocationForDisplay(location)
      const accuracy = LocationService.getAccuracyDescription(location.accuracy)
      
      return (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <MapPin className="w-4 h-4" />
          <div className="flex-1">
            <div className="font-medium">{display}</div>
            {location.source && (
              <div className="text-xs opacity-75">
                Source: {location.source.toUpperCase()} • Accuracy: {accuracy}
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
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
          
          {/* Location Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Location Status</span>
              <button
                onClick={loadLocation}
                disabled={locationStatus.loading}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {locationStatus.loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            {getLocationDisplay()}
          </div>

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
              <div className={`rounded-xl p-4 border ${
                errorType === 'DEVICE_BLOCKED' 
                  ? 'bg-red-50 border-red-200' 
                  : errorType === 'MANAGEMENT_DEVICE_ERROR'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {errorType === 'DEVICE_BLOCKED' ? (
                      <Smartphone className="w-5 h-5 text-red-600 mt-0.5" />
                    ) : errorType === 'MANAGEMENT_DEVICE_ERROR' ? (
                      <Crown className="w-5 h-5 text-yellow-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h3 className={`font-medium mb-1 ${
                      errorType === 'DEVICE_BLOCKED' ? 'text-red-800' 
                      : errorType === 'MANAGEMENT_DEVICE_ERROR' ? 'text-yellow-800'
                      : 'text-red-800'
                    }`}>
                      {errorType === 'DEVICE_BLOCKED' ? 'Device Not Allowed' 
                       : errorType === 'MANAGEMENT_DEVICE_ERROR' ? 'System Error'
                       : 'Login Failed'}
                    </h3>
                    <p className={`text-sm ${
                      errorType === 'DEVICE_BLOCKED' ? 'text-red-700'
                      : errorType === 'MANAGEMENT_DEVICE_ERROR' ? 'text-yellow-700'
                      : 'text-red-700'
                    }`}>{error}</p>
                    
                    {errorType === 'DEVICE_BLOCKED' && errorRole !== 'management' && (
                      <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 text-red-800 text-sm font-medium mb-2">
                          <Tablet className="w-4 h-4" />
                          Allowed Devices for {errorRole}:
                        </div>
                        <ul className="text-red-700 text-sm space-y-1">
                          <li>• Company tablets</li>
                          <li>• Desktop computers</li>
                          <li>• Laptop computers</li>
                        </ul>
                        <div className="mt-2 pt-2 border-t border-red-200">
                          <p className="text-red-600 text-xs">
                            📱 Personal mobile phones are not permitted for security roles.
                          </p>
                        </div>
                      </div>
                    )}

                    {errorType === 'MANAGEMENT_DEVICE_ERROR' && (
                      <div className="mt-3 p-3 bg-yellow-100 rounded-lg border border-yellow-200">
                        <p className="text-yellow-700 text-sm">
                          Management users should have unrestricted device access. Please contact IT support.
                        </p>
                      </div>
                    )}
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
          
          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <Link 
              href="/forgot-password" 
              className="text-blue-600 hover:text-blue-700 font-medium underline decoration-2 underline-offset-2 hover:underline-offset-4 transition-all duration-200"
            >
              Forgot your password?
            </Link>
          </div>
          
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

        {/* Company Device Notice - Updated for role-based restrictions */}
        <div className="mt-6 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-blue-800 text-sm font-medium mb-2">
              <Crown className="w-4 h-4" />
              Device Access Policy
            </div>
            <div className="text-blue-700 text-xs space-y-1">
              <p><strong>Management:</strong> All devices allowed</p>
              <p><strong>Security Roles:</strong> Company tablets & computers only</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Loading login...</p>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}