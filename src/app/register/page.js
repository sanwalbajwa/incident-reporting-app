'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Registration</h1>
          <p className="text-gray-600">Create your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorStyle('fullName')}`}
              placeholder="John Doe"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorStyle('email')}`}
              placeholder="user@example.com"
            />
            {errorType === 'EMAIL_EXISTS' && (
              <p className="text-red-600 text-xs mt-1">This email is already registered</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorStyle('password')}`}
              placeholder="Enter password"
            />
            {errorType === 'PASSWORD_TOO_SHORT' && (
              <p className="text-red-600 text-xs mt-1">Password must be at least 6 characters</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorStyle('confirmPassword')}`}
              placeholder="Confirm password"
            />
            {errorType === 'PASSWORD_MISMATCH' && (
              <p className="text-red-600 text-xs mt-1">Passwords don't match</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorStyle('role')}`}
            >
              <option value="">Select Role</option>
              <option value="guard">Guard</option>
              <option value="security_supervisor">Security Supervisor</option>
              <option value="maintenance">Maintenance Team</option>
              <option value="management">Management</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID
            </label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorStyle('employeeId')}`}
              placeholder="EMP001"
            />
            {errorType === 'EMPLOYEE_ID_EXISTS' && (
              <p className="text-red-600 text-xs mt-1">This Employee ID is already taken</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getFieldErrorStyle('phone')}`}
              placeholder="+1234567890"
            />
          </div>

          {error && (
            <div className={`mb-4 text-sm p-3 rounded ${
              errorType === 'EMAIL_EXISTS' || errorType === 'EMPLOYEE_ID_EXISTS' 
                ? 'text-red-600 bg-red-50 border border-red-200' 
                : 'text-red-600 bg-red-50'
            }`}>
              <div className="flex items-start">
                <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
              {errorType === 'EMPLOYEE_ID_EXISTS' && (
                <div className="mt-2 text-xs text-red-500">
                  💡 Tip: Try adding numbers or your initials (e.g., EMP001, JD123)
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}