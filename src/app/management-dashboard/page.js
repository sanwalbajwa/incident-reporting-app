// src/app/management-dashboard/page.js - Updated with realistic data

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
  Mail,
  RefreshCw,
  Activity,
  Star,
  Timer
} from 'lucide-react'

export default function ManagementDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState({
    totalGuards: 0,
    onDutyGuards: 0,
    offDutyGuards: 0,
    totalSupervisors: 0,
    totalClients: 0,
    totalIncidents: 0,
    urgentIncidents: 0,
    todayIncidents: 0,
    weeklyIncidents: 0,
    resolvedIncidents: 0,
    pendingIncidents: 0,
    communicationMessages: 0,
    responseRate: 0,
    avgShiftDuration: 0,
    shiftsThisWeek: 0,
    recentActivity: [],
    guardPerformance: [],
    incidentTypes: [],
    activeShiftsDetails: []
  })
  const [lastUpdated, setLastUpdated] = useState(null)

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
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [session, status, router])

  const loadDashboardStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch('/api/management/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
        setLastUpdated(new Date(data.lastUpdated))
      } else {
        console.error('Failed to load stats:', data.error)
        // Keep existing stats on error
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      // Keep existing stats on error
    }
    setStatsLoading(false)
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getShiftDuration = (checkInTime) => {
    const now = new Date()
    const checkIn = new Date(checkInTime)
    const durationMinutes = Math.round((now - checkIn) / (1000 * 60))
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    return `${hours}h ${minutes}m`
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'normal': return 'text-blue-600 bg-blue-100'
      case 'low': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'text-green-600 bg-green-100'
      case 'reviewed': return 'text-blue-600 bg-blue-100'
      case 'submitted': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Dashboard...</p>
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
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {formatTime(lastUpdated)}
                </p>
              )}
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
                <p className="text-sm text-gray-600">{stats.onDutyGuards} on duty, {stats.offDutyGuards} off duty</p>
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
                <p className="text-sm text-gray-600">{stats.totalSupervisors} active supervisors</p>
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
                <p className="text-sm text-gray-600">{stats.totalClients} active properties</p>
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
                <p className="text-sm text-gray-600">{stats.totalIncidents} total, {stats.urgentIncidents} urgent</p>
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
            <div className="text-sm text-gray-600 font-medium">On Duty Now</div>
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

        {/* Activity Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Activity */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Activity
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(activity.priority)}`}>
                      {activity.priority}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{activity.incidentType}</div>
                      <div className="text-xs text-gray-600">
                        {activity.guardName} • {activity.clientName}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTime(activity.createdAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No recent activity
                </div>
              )}
            </div>
          </div>

          {/* Active Shifts */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Timer className="w-5 h-5 text-green-600" />
              Active Shifts ({stats.onDutyGuards})
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.activeShiftsDetails.length > 0 ? (
                stats.activeShiftsDetails.map((shift, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{shift.guardName}</div>
                      <div className="text-xs text-gray-600">{shift.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {getShiftDuration(shift.checkInTime)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Since {formatTime(shift.checkInTime)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No active shifts
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Performing Guards */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              Top Performing Guards (This Week)
            </h3>
            <div className="space-y-3">
              {stats.guardPerformance.length > 0 ? (
                stats.guardPerformance.map((guard, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-yellow-600">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{guard.guardName}</div>
                        <div className="text-xs text-gray-600">{guard.shiftsCompleted} shifts completed</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-yellow-600">
                        {Math.round(guard.totalHours * 10) / 10}h
                      </div>
                      <div className="text-xs text-gray-500">total hours</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No performance data available
                </div>
              )}
            </div>
          </div>

          {/* Incident Types Distribution */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Incident Types Distribution
            </h3>
            <div className="space-y-3">
              {stats.incidentTypes.length > 0 ? (
                stats.incidentTypes.map((type, index) => {
                  const percentage = stats.totalIncidents > 0 ? Math.round((type.count / stats.totalIncidents) * 100) : 0
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-900">{type._id || 'Other'}</span>
                        <span className="text-gray-600">{type.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No incident data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
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
                <span className="text-blue-700">Response Rate:</span>
                <span className="font-bold text-blue-900">{stats.responseRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Avg Shift:</span>
                <span className="font-bold text-blue-900">{stats.avgShiftDuration}h</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
            <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Weekly Activity
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">New Reports:</span>
                <span className="font-bold text-green-900">{stats.weeklyIncidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Today's Reports:</span>
                <span className="font-bold text-green-900">{stats.todayIncidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Urgent Items:</span>
                <span className="font-bold text-green-900">{stats.urgentIncidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Shifts This Week:</span>
                <span className="font-bold text-green-900">{stats.shiftsThisWeek}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Communication Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-purple-700">Messages Sent:</span>
                <span className="font-bold text-purple-900">{stats.communicationMessages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Pending Items:</span>
                <span className="font-bold text-purple-900">{stats.pendingIncidents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Resolved:</span>
                <span className="font-bold text-purple-900">{stats.resolvedIncidents}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-200">
              <button
                onClick={() => router.push('/management/guards')}
                className="w-full text-left px-3 py-2 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors text-sm"
              >
                → View Guard Status
              </button>
              <button
                onClick={() => router.push('/management/reports')}
                className="w-full text-left px-3 py-2 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors text-sm"
              >
                → Review All Reports
              </button>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {statsLoading && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-white/20">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-gray-700 font-medium">Updating dashboard...</span>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}