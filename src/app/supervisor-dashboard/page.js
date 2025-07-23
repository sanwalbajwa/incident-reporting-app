'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SupervisorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) {
      router.push('/login') // Not logged in
      return
    }
    
    // Check if user has supervisor role
    if (session.user.role !== 'security_supervisor') {
      router.push('/dashboard') // Redirect non-supervisors to regular dashboard
      return
    }
    
    setLoading(false)
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'security_supervisor') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Supervisor Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name}
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                Security Supervisor
              </span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Security Supervisor Panel
            </h2>
            <p className="text-gray-600 mb-6">
              Monitor and manage incident reports, communications from guards, and oversee security operations.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-purple-800 font-medium">
                🎯 Your Role: You can receive and review communications and incident reports from guards.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New Messages</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Guards</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Guards</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📨 Guard Messages</h3>
            <p className="text-gray-600 mb-4">View and respond to messages from security guards.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              View Messages
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">📋 Incident Reports</h3>
            <p className="text-gray-600 mb-4">Review and manage incident reports submitted by guards.</p>
            <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
              View Reports
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">👥 Guard Management</h3>
            <p className="text-gray-600 mb-4">Monitor guard activities and shift schedules.</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
              Manage Guards
            </button>
          </div>
        </div>

        {/* Development Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <svg className="flex-shrink-0 h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Development Status
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                This supervisor dashboard is ready for implementation. Next steps: Add message viewing system and incident report review functionality.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}