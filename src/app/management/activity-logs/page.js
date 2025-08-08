// src/app/management/activity-logs/page.js

'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  ArrowLeft,
  Activity,
  Filter,
  Search,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  User,
  Shield,
  Crown,
  UserCheck,
  Eye,
  TrendingUp,
  BarChart3,
  Users,
  AlertCircle,
  CheckCircle,
  LogIn,
  LogOut,
  Play,
  Square,
  Coffee,
  UtensilsCrossed,
  FileText,
  Settings,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react'

export default function ManagementActivityLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState({})
  const [topUsers, setTopUsers] = useState([])
  const [filters, setFilters] = useState({
    limit: 50,
    category: '',
    action: '',
    userRole: '',
    timeRange: '24h',
    dateFrom: '',
    dateTo: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    
    // Check if user is management
    if (session.user.role !== 'management') {
      router.push('/dashboard')
      return
    }
    
    loadActivityLogs()
  }, [session, status, router])

  const loadActivityLogs = async () => {
    setLoading(true)
    try {
      const searchParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) searchParams.append(key, value)
      })
      
      const response = await fetch(`/api/management/activity-logs?${searchParams}`)
      const data = await response.json()
      
      if (data.success) {
        setActivities(data.data.activities)
        setStats(data.data.stats)
        setTopUsers(data.data.topUsers)
      } else {
        console.error('Failed to load activity logs:', data.error)
      }
    } catch (error) {
      console.error('Error loading activity logs:', error)
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadActivityLogs()
    setRefreshing(false)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const applyFilters = () => {
    loadActivityLogs()
  }

  const clearFilters = () => {
    setFilters({
      limit: 50,
      category: '',
      action: '',
      userRole: '',
      timeRange: '24h',
      dateFrom: '',
      dateTo: ''
    })
    setTimeout(() => loadActivityLogs(), 100)
  }

  const getActionIcon = (action, category) => {
    switch (action) {
      case 'login':
        return <LogIn className="w-4 h-4 text-green-600" />
      case 'logout':
        return <LogOut className="w-4 h-4 text-red-600" />
      case 'start_shift':
        return <Play className="w-4 h-4 text-blue-600" />
      case 'end_shift':
        return <Square className="w-4 h-4 text-orange-600" />
      case 'start_break':
        return <Coffee className="w-4 h-4 text-purple-600" />
      case 'start_lunch':
        return <UtensilsCrossed className="w-4 h-4 text-orange-600" />
      case 'end_break':
      case 'end_lunch':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'create_incident':
      case 'update_incident':
        return <FileText className="w-4 h-4 text-red-600" />
      case 'view_incident':
        return <Eye className="w-4 h-4 text-blue-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  const getCategoryColor = (category) => {
    switch (category) {
      case 'authentication':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'shift':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'break':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'incident':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'system':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'management':
        return <Crown className="w-4 h-4 text-blue-600" />
      case 'security_supervisor':
        return <Shield className="w-4 h-4 text-purple-600" />
      case 'guard':
      case 'rover':
        return <UserCheck className="w-4 h-4 text-gray-600" />
      default:
        return <User className="w-4 h-4 text-gray-600" />
    }
  }

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-blue-600" />
      case 'tablet':
        return <Tablet className="w-4 h-4 text-green-600" />
      case 'desktop':
        return <Monitor className="w-4 h-4 text-gray-600" />
      default:
        return <Monitor className="w-4 h-4 text-gray-400" />
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatTime(timestamp)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading activity logs...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'management') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/management-dashboard')}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-200 border border-white/20 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Crown className="w-8 h-8 text-blue-600" />
                <Activity className="w-8 h-8 text-green-600" />
                System Activity Logs
              </h1>
              <p className="text-gray-600 mt-1">Monitor all user activities and system events</p>
            </div>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalActivities || 0}</div>
            <div className="text-sm text-gray-600 font-medium">Total Activities</div>
            <div className="text-xs text-gray-500 mt-1">Last {filters.timeRange}</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.uniqueUsers || 0}</div>
            <div className="text-sm text-gray-600 font-medium">Active Users</div>
            <div className="text-xs text-gray-500 mt-1">Last {filters.timeRange}</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.categoryStats?.length || 0}
            </div>
            <div className="text-sm text-gray-600 font-medium">Categories</div>
            <div className="text-xs text-gray-500 mt-1">Active</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((stats.totalActivities || 0) / Math.max(stats.uniqueUsers || 1, 1))}
            </div>
            <div className="text-sm text-gray-600 font-medium">Avg per User</div>
            <div className="text-xs text-gray-500 mt-1">Activities</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Filters & Search
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            >
              <option value="25">25 Results</option>
              <option value="50">50 Results</option>
              <option value="100">100 Results</option>
              <option value="200">200 Results</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={applyFilters}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <Search className="w-4 h-4" />
              Apply Filters
            </button>
            
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>

        {/* Activity Categories Chart */}
        {stats.categoryStats && stats.categoryStats.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              Activity by Category
            </h3>
            
            <div className="space-y-3">
              {stats.categoryStats.map((category, index) => {
                const percentage = Math.round((category.count / stats.totalActivities) * 100)
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-900 capitalize">{category._id || 'Unknown'}</span>
                      <span className="text-gray-600">{category.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top Active Users */}
        {topUsers && topUsers.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Most Active Users (Last {filters.timeRange})
            </h3>
            
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.userName?.charAt(0)?.toUpperCase() || '#'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.userName || 'Unknown User'}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {getRoleIcon(user.userRole)}
                        <span className="capitalize">{user.userRole || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{user.activityCount}</div>
                    <div className="text-xs text-gray-500">activities</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Logs List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              Recent Activity Logs ({activities.length})
            </h2>
          </div>

          {activities.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        User & Action
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Category & Details
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Device & Location
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {activities.map((activity, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {activity.userName?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                {getActionIcon(activity.action, activity.category)}
                                <span className="text-sm font-bold text-gray-900 capitalize">
                                  {activity.action?.replace('_', ' ') || 'Unknown Action'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">{activity.userName || 'Unknown User'}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                {getRoleIcon(activity.userRole)}
                                <span className="capitalize">{activity.userRole || 'Unknown'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getCategoryColor(activity.category)}`}>
                              {activity.category || 'unknown'}
                            </span>
                            {activity.details && Object.keys(activity.details).length > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {Object.entries(activity.details).slice(0, 2).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {value?.toString() || 'N/A'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              {getDeviceIcon(activity.deviceType)}
                              <span className="capitalize">{activity.deviceType || 'Unknown'}</span>
                            </div>
                            {activity.ipAddress && (
                              <div className="text-xs text-gray-500">
                                IP: {activity.ipAddress}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {formatTimeAgo(activity.timestamp)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(activity.timestamp)}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {activities.map((activity, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {activity.userName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getActionIcon(activity.action, activity.category)}
                            <span className="text-sm font-bold text-gray-900 capitalize">
                              {activity.action?.replace('_', ' ') || 'Unknown Action'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">{activity.userName || 'Unknown User'}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-900">
                          {formatTimeAgo(activity.timestamp)}
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border mt-1 ${getCategoryColor(activity.category)}`}>
                          {activity.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(activity.userRole)}
                        <span className="capitalize">{activity.userRole || 'Unknown Role'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(activity.deviceType)}
                        <span className="capitalize">{activity.deviceType || 'Unknown Device'}</span>
                      </div>
                      {activity.ipAddress && (
                        <div className="text-xs text-gray-500">
                          IP: {activity.ipAddress}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-300 to-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No Activity Logs Found</h3>
              <p className="text-gray-600 text-lg">
                No activities match your current filters, or no activities have been recorded yet.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-2xl p-8 text-white text-center shadow-xl">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">System Activity Monitoring</h3>
          <p className="text-lg opacity-90 mb-4">
            Tracking {stats.totalActivities || 0} activities from {stats.uniqueUsers || 0} users
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full"></div>
              <span>Authentication Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
              <span>Shift Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-300 rounded-full"></div>
              <span>Break Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-300 rounded-full"></div>
              <span>Incident Reports</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}