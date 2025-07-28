// src/app/management-dashboard/page.js

'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  Crown,
  Users,
  Shield,
  Building2,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  UserCog,
  Settings,
  Eye,
  FileText,
  Mail
} from 'lucide-react'

export default function ManagementDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGuards: 0,
    onDutyGuards: 0,
    totalSupervisors: 0,
    totalClients: 0,
    totalIncidents: 0,
    urgentIncidents: 0,
    todayIncidents: 0,
    resolvedIncidents: 0
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    
    // Check if user has management role
    if (session.user.role !== 'management') {
      router.push('/dashboard')
      return
    }
    
    loadDashboardStats()
    setLoading(false)
  }, [session, status, router])

  const loadDashboardStats = async () => {
    try {
      // You can create a specific API for dashboard stats
      // For now, we'll use placeholder data
      setStats({
        totalGuards: 12,
        onDutyGuards: 8,
        totalSupervisors: 3,
        totalClients: 25,
        totalIncidents: 145,
        urgentIncidents: 5,
        todayIncidents: 8,
        resolvedIncidents: 132
      })
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'management') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Crown className="w-8 h-8 text-blue-600" />
                Management Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Welcome back, {session.user.name?.split(' ')[0]}</p>
            </div>
          </div>
        </div>

        {/* Key Management Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-2xl group-hover:bg-blue-200 transition-colors duration-200">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Guards</h3>
                <p className="text-sm text-gray-600">Manage security guards</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/management/guards')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <UserCog className="w-4 h-4" />
              Manage Guards
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-2xl group-hover:bg-purple-200 transition-colors duration-200">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Supervisors</h3>
                <p className="text-sm text-gray-600">Manage supervisors</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/management/supervisors')}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Manage Supervisors
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-2xl group-hover:bg-green-200 transition-colors duration-200">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Clients</h3>
                <p className="text-sm text-gray-600">Manage client properties</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/clients')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage Clients
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-orange-100 rounded-2xl group-hover:bg-orange-200 transition-colors duration-200">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">All Reports</h3>
                <p className="text-sm text-gray-600">View all incidents</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/management/reports')}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View All Reports
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalGuards}</div>
            <div className="text-sm text-gray-600 font-medium">Total Guards</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.onDutyGuards}</div>
            <div className="text-sm text-gray-600 font-medium">On Duty</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.totalSupervisors}</div>
            <div className="text-sm text-gray-600 font-medium">Supervisors</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-600">{stats.totalClients}</div>
            <div className="text-sm text-gray-600 font-medium">Client Properties</div>
          </div>
        </div>

        {/* Incident Statistics */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-7 h-7 text-orange-600" />
            Incident Reports Overview
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-1">{stats.totalIncidents}</div>
              <div className="text-sm text-gray-600 font-medium">Total Reports</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-red-600 mb-1">{stats.urgentIncidents}</div>
              <div className="text-sm text-gray-600 font-medium">Urgent</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.todayIncidents}</div>
              <div className="text-sm text-gray-600 font-medium">Today</div>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.resolvedIncidents}</div>
              <div className="text-sm text-gray-600 font-medium">Resolved</div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => router.push('/management/reports')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3"
            >
              <Eye className="w-5 h-5" />
              View All Incident Reports
            </button>
          </div>
        </div>

        {/* Quick Access Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              System Health
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-700">Guards Online:</span>
                <span className="font-bold text-blue-900">{stats.onDutyGuards}/{stats.totalGuards}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Active Properties:</span>
                <span className="font-bold text-blue-900">{stats.totalClients}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Supervisors:</span>
                <span className="font-bold text-blue-900">{stats.totalSupervisors}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Activity
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">New Reports:</span>
                <span className="font-bold text-green-900">{stats.todayIncidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Urgent Items:</span>
                <span className="font-bold text-green-900">{stats.urgentIncidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Response Rate:</span>
                <span className="font-bold text-green-900">98%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/management/guards')}
                className="w-full text-left px-3 py-2 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
              >
                View Guard Status
              </button>
              <button
                onClick={() => router.push('/management/reports')}
                className="w-full text-left px-3 py-2 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
              >
                Review Reports
              </button>
              <button
                onClick={() => router.push('/clients')}
                className="w-full text-left px-3 py-2 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors"
              >
                Manage Properties
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}