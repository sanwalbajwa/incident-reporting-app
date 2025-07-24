'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Clock, 
  MapPin, 
  Camera, 
  Play, 
  Square, 
  AlertTriangle, 
  FileText, 
  RefreshCw,
  CheckCircle,
  Pause,
  Calendar,
  Timer,
  Shield,
  Building2
} from 'lucide-react'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, <span className="text-blue-600">{session.user.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-600 text-lg">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Shift Status - Prominent Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 text-center">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              Shift Status
            </h2>
          </div>
          
          {activeShift ? (
            // On Duty
            <div className="space-y-6">
              <div className="inline-flex items-center bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-6 py-3 rounded-2xl text-xl font-bold border border-green-200 shadow-sm">
                <CheckCircle className="w-6 h-6 mr-3" />
                ON DUTY
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <p className="text-sm text-blue-700 font-medium mb-1">Started At</p>
                  <p className="text-lg font-bold text-blue-900">{formatTime(activeShift.checkInTime)}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <Timer className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <p className="text-sm text-purple-700 font-medium mb-1">Duration</p>
                  <p className="text-2xl font-bold text-purple-900">{getShiftDuration(activeShift.checkInTime)}</p>
                </div>
                
                {activeShift.location && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 border border-amber-200">
                    <MapPin className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                    <p className="text-sm text-amber-700 font-medium mb-1">Location</p>
                    <p className="text-lg font-bold text-amber-900">{activeShift.location}</p>
                  </div>
                )}
              </div>

              {activeShift.checkInPhoto && (
                <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 rounded-xl py-3 px-4 border border-green-200">
                  <Camera className="w-5 h-5" />
                  <span className="font-medium">Photo verified</span>
                </div>
              )}

              {/* End Shift Button */}
              <div className="pt-4">
                <button
                  onClick={() => router.push('/checkin')}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-10 py-4 rounded-2xl text-xl font-bold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center gap-3 mx-auto"
                >
                  <Square className="w-6 h-6" />
                  END SHIFT
                </button>
              </div>
            </div>
          ) : (
            // Not On Duty
            <div className="space-y-6">
              <div className="inline-flex items-center bg-gradient-to-r from-gray-100 to-slate-100 text-gray-600 px-6 py-3 rounded-2xl text-xl font-bold border border-gray-200 shadow-sm">
                <Pause className="w-6 h-6 mr-3" />
                NOT ON DUTY
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to start your shift?</h3>
                <p className="text-gray-600 text-lg mb-8">
                  Photo verification is required to begin your shift
                </p>

                <button
                  onClick={() => router.push('/checkin')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-10 py-4 rounded-2xl text-xl font-bold transition-all duration-200 transform hover:scale-105 hover:shadow-lg inline-flex items-center gap-3"
                >
                  <Play className="w-6 h-6" />
                  <Camera className="w-6 h-6" />
                  START SHIFT
                </button>
                
                <p className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Photo required to start shift
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions - Only show if on duty */}
        {activeShift && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-2xl group-hover:bg-red-200 transition-colors duration-200">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Report Incident</h3>
                  <p className="text-gray-600">Create a new incident report</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/incidents/new')}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                New Report
              </button>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-2xl group-hover:bg-blue-200 transition-colors duration-200">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">View Reports</h3>
                  <p className="text-gray-600">View and manage your reports</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/incidents')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                View Reports
              </button>
            </div>
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-600" />
            Your Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <p className="text-sm font-medium text-blue-700 mb-2">Name</p>
              <p className="text-lg font-bold text-blue-900">{session.user.name}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <p className="text-sm font-medium text-purple-700 mb-2">Email</p>
              <p className="text-lg font-bold text-purple-900 truncate">{session.user.email}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <p className="text-sm font-medium text-green-700 mb-2">Role</p>
              <p className="text-lg font-bold text-green-900 capitalize">{session.user.role}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 border border-amber-200">
              <p className="text-sm font-medium text-amber-700 mb-2">Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${activeShift ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <p className={`text-lg font-bold ${activeShift ? 'text-green-600' : 'text-gray-600'}`}>
                  {activeShift ? 'On Duty' : 'Off Duty'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Date/Time Display */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center shadow-xl">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">Current Time</h3>
          <p className="text-3xl font-bold mb-2">
            {new Date().toLocaleTimeString()}
          </p>
          <p className="text-lg opacity-90">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>

      </main>
    </div>
  )
}