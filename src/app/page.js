'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Shield, 
  LogIn, 
  LayoutDashboard, 
  UserCheck, 
  Users 
} from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [connectionStatus, setConnectionStatus] = useState('Testing...')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('/api/test-db')
        const data = await response.json()
        
        if (data.success) {
          setConnectionStatus('✅ Database Connected')
        } else {
          setConnectionStatus('❌ Connection Failed: ' + data.error)
        }
      } catch (error) {
        setConnectionStatus('❌ Connection Error: ' + error.message)
      }
    }

    testConnection()
  }, [])

  // Get dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!session?.user?.role) return '/dashboard'
    
    switch (session.user.role) {
      case 'security_supervisor':
      case 'maintenance':
      case 'management':
        return '/supervisor-dashboard'
      case 'guard':
      default:
        return '/dashboard'
    }
  }

  // Get dashboard button text based on role
  const getDashboardText = () => {
    if (!session?.user?.role) return 'Dashboard'
    
    switch (session.user.role) {
      case 'security_supervisor':
        return 'Supervisor Dashboard'
      case 'maintenance':
        return 'Maintenance Dashboard'
      case 'management':
        return 'Management Dashboard'
      case 'guard':
      default:
        return 'Guard Dashboard'
    }
  }

  // Get role icon
  const getRoleIcon = () => {
    if (!session?.user?.role) return <LayoutDashboard className="w-6 h-6" />
    
    switch (session.user.role) {
      case 'security_supervisor':
      case 'maintenance':
      case 'management':
        return <Users className="w-6 h-6" />
      case 'guard':
      default:
        return <UserCheck className="w-6 h-6" />
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto">
        
        {/* App Header */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Incident Reporting App
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Security Guard Management System
          </p>
        </div>

        {/* User Welcome Section */}
        {session?.user && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {getRoleIcon()}
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome back, {session.user.name?.split(' ')[0]}!
              </h2>
            </div>
            <p className="text-gray-600">
              Role: <span className="font-semibold text-blue-600 capitalize">
                {session.user.role?.replace('_', ' ')}
              </span>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          {session ? (
            // Show Dashboard button if logged in
            <button
              onClick={() => router.push(getDashboardUrl())}
              className="w-full max-w-md mx-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-8 rounded-2xl text-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              {getRoleIcon()}
              {getDashboardText()}
            </button>
          ) : (
            // Show Login button if not logged in
            <div className="space-y-4">
              <button
                onClick={() => router.push('/login')}
                className="w-full max-w-md mx-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-8 rounded-2xl text-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <LogIn className="w-6 h-6" />
                Sign In
              </button>
              
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  Sign up here
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Database Status */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
          connectionStatus.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : connectionStatus.includes('❌')
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          <Shield className="w-4 h-4" />
          Database: {connectionStatus}
        </div>

        {/* Quick Access for Logged in Users */}
        {session && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                 onClick={() => router.push('/incidents/new')}>
              <div className="text-red-600 mb-2">
                <Shield className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="font-bold text-gray-900">Report Incident</h3>
              <p className="text-sm text-gray-600">Create new incident report</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                 onClick={() => router.push('/incidents')}>
              <div className="text-blue-600 mb-2">
                <LayoutDashboard className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="font-bold text-gray-900">My Reports</h3>
              <p className="text-sm text-gray-600">View your incident reports</p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/80 transition-all duration-200 cursor-pointer"
                 onClick={() => router.push('/checkin')}>
              <div className="text-green-600 mb-2">
                <UserCheck className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="font-bold text-gray-900">Check In/Out</h3>
              <p className="text-sm text-gray-600">Manage your shift status</p>
            </div>
          </div>
        )}

        {/* Demo Credentials */}
        {!session && (
          <div className="mt-8 bg-gray-100 rounded-xl p-4 max-w-md mx-auto">
            <h3 className="font-bold text-gray-800 mb-2">Demo Accounts</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Supervisor:</strong> admin@test.com / 123456</p>
              <p><strong>Guard:</strong> guard@test.com / 123456</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}