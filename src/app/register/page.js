'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Hash,
  Phone,
  Users,
  Crown,
  UserCheck
} from 'lucide-react'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    employeeId: '',
    phone: ''
  })
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setErrorType('')

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setErrorType('PASSWORD_MISMATCH')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setErrorType('PASSWORD_TOO_SHORT')
      setLoading(false)
      return
    }

    if (!formData.role) {
      setError('Please select a role')
      setErrorType('ROLE_REQUIRED')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          employeeId: formData.employeeId,
          phone: formData.phone
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Success - redirect to login
        router.push('/login?message=Registration successful! Please sign in.')
      } else {
        // Handle specific error types
        setError(data.error || 'Registration failed')
        setErrorType(data.errorType || 'UNKNOWN_ERROR')
        
        // Focus on the relevant field based on error type
        if (data.errorType === 'EMAIL_EXISTS') {
          const emailField = document.querySelector('input[name="email"]')
          emailField?.focus()
        } else if (data.errorType === 'EMPLOYEE_ID_EXISTS') {
          const employeeIdField = document.querySelector('input[name="employeeId"]')
          employeeIdField?.focus()
        }
      }
    } catch (error) {
      console.error('Network error:', error)
      setError('Network error. Please check your connection and try again.')
      setErrorType('NETWORK_ERROR')
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear errors when user starts typing
    if (error) {
      setError('')
      setErrorType('')
    }
  }

  // Get error styling based on error type
  const getFieldErrorStyle = (fieldName) => {
    const errorFields = {
      'EMAIL_EXISTS': 'email',
      'EMPLOYEE_ID_EXISTS': 'employeeId',
      'PASSWORD_TOO_SHORT': 'password',
      'PASSWORD_MISMATCH': 'confirmPassword'
    }
    
    return errorFields[errorType] === fieldName 
      ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white/70'
  }

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'guard':
        return <UserCheck className="w-4 h-4" />
      case 'security_supervisor':
        return <Shield className="w-4 h-4" />
      case 'management':
        return <Crown className="w-4 h-4" />
      default:
        return <Users className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
              <UserPlus className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-3xl opacity-20 blur-lg"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 text-lg">Join the IRPA System</p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name and Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Full Name
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 ${getFieldErrorStyle('fullName')}`}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email Address
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 ${getFieldErrorStyle('email')}`}
                  placeholder="user@example.com"
                />
                {errorType === 'EMAIL_EXISTS' && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    This email is already registered
                  </p>
                )}
              </div>
            </div>

            {/* Password Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Password
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 ${getFieldErrorStyle('password')}`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errorType === 'PASSWORD_TOO_SHORT' && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Confirm Password
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 ${getFieldErrorStyle('confirmPassword')}`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errorType === 'PASSWORD_MISMATCH' && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Passwords don't match
                  </p>
                )}
              </div>
            </div>

            {/* Role Selection - UPDATED: Removed maintenance role */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Role
                <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 ${getFieldErrorStyle('role')}`}
              >
                <option value="">Select Your Role</option>
                <option value="guard">🛡️ Security Guard</option>
                <option value="security_supervisor">👮 Security Supervisor</option>
                <option value="management">👑 Management</option>
              </select>
            </div>

            {/* Employee ID and Phone Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-600" />
                  Employee ID
                  <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 ${getFieldErrorStyle('employeeId')}`}
                  placeholder="EMP001"
                />
                {errorType === 'EMPLOYEE_ID_EXISTS' && (
                  <div className="text-red-600 text-xs mt-1">
                    <p className="flex items-center gap-1 mb-1">
                      <AlertCircle className="w-3 h-3" />
                      This Employee ID is already taken
                    </p>
                    <p className="text-red-500 bg-red-50 rounded-lg p-2 border border-red-200">
                      💡 Try: EMP{Math.floor(Math.random() * 999) + 100}, {formData.fullName.split(' ').map(n => n[0]).join('')}123, or add your initials
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Phone Number
                  <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 text-gray-900 ${getFieldErrorStyle('phone')}`}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className={`rounded-xl p-4 border ${
                errorType === 'EMAIL_EXISTS' || errorType === 'EMPLOYEE_ID_EXISTS' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">{error}</p>
                    {errorType === 'EMPLOYEE_ID_EXISTS' && (
                      <p className="text-red-600 text-sm mt-1">
                        Please try a different Employee ID or leave it blank.
                      </p>
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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-blue-600 hover:text-blue-700 font-bold underline decoration-2 underline-offset-2 hover:underline-offset-4 transition-all duration-200"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}