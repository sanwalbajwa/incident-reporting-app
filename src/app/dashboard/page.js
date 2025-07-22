'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeShift, setActiveShift] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/login') // Not logged in
    else {
      loadShiftStatus()
      // Set up auto-refresh every 30 seconds
      const interval = setInterval(loadShiftStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [session, status, router])

  // Also refresh when the page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session) {
        loadShiftStatus()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [session])

  const loadShiftStatus = async () => {
    if (!session) return
    
    try {
      console.log('Loading shift status...') // Debug log
      
      const response = await fetch('/api/checkin/status', {
        // Add cache-busting parameter
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      console.log('Shift status response:', data) // Debug log
      
      if (response.ok) {
        setActiveShift(data.activeShift)
        console.log('Active shift:', data.activeShift) // Debug log
      } else {
        console.error('Error loading shift status:', data.error)
      }
    } catch (error) {
      console.error('Error loading shift status:', error)
    }
    setLoading(false)
  }

  // Add manual refresh button
  const handleRefresh = () => {
    setLoading(true)
    loadShiftStatus()
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleString()
  }

  const getShiftDuration = (startTime) => {
    const now = new Date()
    const start = new Date(startTime)
    const diffMinutes = Math.floor((now - start) / (1000 * 60))
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }

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

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Guard Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name}
              </span>
              {/* Add refresh button */}
              <button
                onClick={handleRefresh}
                className="text-blue-600 hover:text-blue-700 text-sm"
                title="Refresh status"
              >
                🔄 Refresh
              </button>
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
        
        {/* Shift Status - Prominent Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Shift Status</h2>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
            >
              {loading ? '⏳' : '🔄'}
            </button>
          </div>
          
                  {activeShift ? (
          // On Duty
          <div className="space-y-4">
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-medium">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ✅ ON DUTY
            </div>
            
            <div className="text-gray-600">
              <p className="text-lg">Started: {formatTime(activeShift.checkInTime)}</p>
              <p className="text-xl font-semibold text-blue-600">
                Duration: {getShiftDuration(activeShift.checkInTime)}
              </p>
              {activeShift.location && (
                <p className="text-sm mt-2">Location: {activeShift.location}</p>
              )}
              {activeShift.checkInPhoto && (
                <p className="text-sm text-green-600 mt-2">📸 Photo verified</p>
              )}
            </div>

            {/* Removed lunch break buttons, only end shift */}
            <div className="flex justify-center mt-6">
              <button
                onClick={() => router.push('/checkin')}
                className="bg-red-600 text-white px-8 py-3 rounded-lg text-xl font-bold hover:bg-red-700 transition-colors"
              >
                🏁 END SHIFT
              </button>
            </div>
          </div>
        ) : (
            // Not On Duty
            <div className="space-y-4">
              <div className="inline-flex items-center bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-lg font-medium">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                ⏸️ NOT ON DUTY
              </div>
              
              <p className="text-gray-600 text-lg mb-6">
                Ready to start your shift?
              </p>

              <button
                onClick={() => router.push('/checkin')}
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-green-700 transition-colors inline-flex items-center"
              >
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                📸 START SHIFT
              </button>
              
              <p className="text-sm text-gray-500 mt-4">
                * Photo required to start shift
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions - Only show if on duty */}
        {activeShift && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Report Incident</h2>
              <p className="text-gray-600 mb-4">Create a new incident report</p>
              <button 
                onClick={() => router.push('/incidents/new')}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                🚨 New Report
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">View Reports</h2>
              <p className="text-gray-600 mb-4">View and manage your reports</p>
              <button 
                onClick={() => router.push('/incidents')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                📋 View Reports
              </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Messages</h2>
              <p className="text-gray-600 mb-4">Communicate with headquarters</p>
              <button className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                💬 Send Message
              </button>
            </div>
          </div>
        )}

        {/* Your Profile */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2 text-gray-600">{session.user.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-gray-600">{session.user.email}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Role:</span>
              <span className="ml-2 text-gray-600 capitalize">{session.user.role}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className={`ml-2 font-medium ${activeShift ? 'text-green-600' : 'text-gray-600'}`}>
                {activeShift ? 'On Duty' : 'Off Duty'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}