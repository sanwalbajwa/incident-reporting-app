// Enhanced: src/app/management/activity-logs/page.js - Updated with location display

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
  Monitor,
  X,
  ExternalLink,
  MapPin,
  Navigation,
  Globe,
  Zap,
  Satellite,
  Router,
  Loader2
} from 'lucide-react'

export default function ManagementActivityLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState({})
  const [topUsers, setTopUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userActivities, setUserActivities] = useState([])
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [showUserModal, setShowUserModal] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [filters, setFilters] = useState({
    limit: 50,
    category: '',
    action: '',
    userRole: '',
    timeRange: '24h',
    dateFrom: '',
    dateTo: '',
    hasLocation: '', // NEW: Location filter
    locationSource: '' // NEW: Location source filter
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    
    if (session.user.role !== 'management') {
      router.push('/dashboard')
      return
    }
    
    loadActivityLogs()
    loadAllUsers()
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

  const loadAllUsers = async () => {
    try {
      const response = await fetch('/api/management/users')
      const data = await response.json()
      
      if (data.success) {
        setAllUsers(data.users)
      } else {
        console.error('Failed to load users:', data.error)
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadUserActivities = async (userId, userName) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/management/activity-logs/user/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setUserActivities(data.activities)
        setSelectedUser({ id: userId, name: userName })
        setShowUserModal(true)
      } else {
        console.error('Failed to load user activities:', data.error)
        alert('Failed to load user activities')
      }
    } catch (error) {
      console.error('Error loading user activities:', error)
      alert('Error loading user activities')
    }
    setLoading(false)
  }

  const exportUserActivitiesCSV = async () => {
    if (!selectedUser) return
    
    setExportingCsv(true)
    try {
      const response = await fetch(`/api/management/activity-logs/export/${selectedUser.id}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv'
        }
      })
      
      if (response.ok) {
        const csvContent = await response.text()
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${selectedUser.name.replace(/\s+/g, '_')}_activity_logs_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        const errorData = await response.json()
        alert(`Export failed: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export CSV')
    }
    setExportingCsv(false)
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
      dateTo: '',
      hasLocation: '',
      locationSource: ''
    })
    setTimeout(() => loadActivityLogs(), 100)
  }

  const filteredUsers = allUsers.filter(user => 
    user.fullName?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(userSearchTerm.toLowerCase())
  )

  // NEW: Location helper functions
  const getLocationIcon = (locationData) => {
    if (!locationData) return <MapPin className="w-4 h-4 text-gray-400" />
    
    switch (locationData.source) {
      case 'gps':
        return <Satellite className="w-4 h-4 text-green-600" />
      case 'ip':
        return <Globe className="w-4 h-4 text-blue-600" />
      case 'manual':
        return <MapPin className="w-4 h-4 text-purple-600" />
      default:
        return <Navigation className="w-4 h-4 text-gray-600" />
    }
  }

  const formatLocationForDisplay = (locationData) => {
    if (!locationData) return 'No location'
    
    if (locationData.error) return `Error: ${locationData.error}`
    
    if (locationData.address) return locationData.address
    
    if (locationData.city) {
      return `${locationData.city}${locationData.country ? `, ${locationData.country}` : ''}`
    }
    
    if (locationData.latitude && locationData.longitude) {
      return `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`
    }
    
    return 'Location unavailable'
  }

  const getLocationAccuracy = (locationData) => {
    if (!locationData || !locationData.accuracy) return 'Unknown'
    
    const accuracy = locationData.accuracy
    if (accuracy < 10) return 'Very High'
    if (accuracy < 100) return 'High'
    if (accuracy < 1000) return 'Medium'
    if (accuracy < 10000) return 'Low'
    return 'Very Low'
  }

  const getLocationSourceColor = (source) => {
    switch (source) {
      case 'gps':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'ip':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'manual':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Existing helper functions
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
        <button
          onClick={() => router.push('/management-dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-200 border border-white/20 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Crown className="w-8 h-8 text-blue-600" />
                <Activity className="w-8 h-8 text-green-600" />
                System Activity Logs
              </h1>
              <p className="text-gray-600 mt-1">Monitor all user activities and system events</p>
            </div>
          </div>
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
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {activities.filter(a => a.locationData).length}
            </div>
            <div className="text-sm text-gray-600 font-medium">With Location</div>
            <div className="text-xs text-gray-500 mt-1">
              {activities.length > 0 ? Math.round((activities.filter(a => a.locationData).length / activities.length) * 100) : 0}% coverage
            </div>
          </div>
        </div>

        {/* Enhanced Filters with Location Options */}
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

            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            >
              <option value="">All Categories</option>
              <option value="authentication">Authentication</option>
              <option value="shift">Shift Management</option>
              <option value="break">Break Tracking</option>
              <option value="incident">Incident Reports</option>
              <option value="system">System</option>
            </select>

            {/* NEW: Location filters */}
            <select
              value={filters.hasLocation}
              onChange={(e) => handleFilterChange('hasLocation', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            >
              <option value="">All Locations</option>
              <option value="true">With Location</option>
              <option value="false">Without Location</option>
            </select>

            <select
              value={filters.locationSource}
              onChange={(e) => handleFilterChange('locationSource', e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            >
              <option value="">All Sources</option>
              <option value="gps">GPS Location</option>
              <option value="ip">IP-based Location</option>
              <option value="manual">Manual Entry</option>
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

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-6 py-3 rounded-xl font-bold transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* User Search Section (keeping existing functionality) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Search Users
          </h3>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name, email, or role..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            />
          </div>

          {userSearchTerm && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => loadUserActivities(user._id, user.fullName)}
                  className="p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{user.fullName}</div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      <div className="flex items-center gap-1 mt-1">
                        {getRoleIcon(user.role)}
                        <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="col-span-full text-center py-4 text-gray-500">
                  No users found matching "{userSearchTerm}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Activity Logs List with Location */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              Recent Activity Logs ({activities.length})
            </h2>
          </div>

          {activities.length > 0 ? (
            <>
              {/* Desktop Table View with Location Column */}
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
                        <div className="flex items-center gap-1">
                          <Navigation className="w-4 h-4" />
                          Location
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Device & Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Actions
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

                        {/* NEW: Location Column */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {activity.locationData ? (
                              <>
                                <div className="flex items-center gap-2">
                                  {getLocationIcon(activity.locationData)}
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatLocationForDisplay(activity.locationData)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getLocationSourceColor(activity.locationData.source)}`}>
                                    {activity.locationData.source?.toUpperCase() || 'UNKNOWN'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {getLocationAccuracy(activity.locationData)} accuracy
                                  </span>
                                </div>
                                {activity.locationData.accuracy && (
                                  <div className="text-xs text-gray-400">
                                    ±{Math.round(activity.locationData.accuracy)}m
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">Location not required</span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(activity.deviceType)}
                              <span className="text-sm text-gray-600 capitalize">
                                {activity.deviceType || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatTimeAgo(activity.timestamp)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatTime(activity.timestamp)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <button
                            onClick={() => loadUserActivities(activity.userId, activity.userName)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            disabled={!activity.userId}
                          >
                            <Eye className="w-4 h-4" />
                            View User
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Enhanced Mobile Card View with Location */}
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
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(activity.userRole)}
                        <span className="capitalize">{activity.userRole || 'Unknown Role'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(activity.deviceType)}
                        <span className="capitalize">{activity.deviceType || 'Unknown Device'}</span>
                      </div>
                      
                      {/* NEW: Location info in mobile view */}
                      {activity.locationData ? (
                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center gap-2 mb-1">
                            {getLocationIcon(activity.locationData)}
                            <span className="text-sm font-medium text-gray-900">Location</span>
                          </div>
                          <div className="text-sm text-gray-700 mb-1">
                            {formatLocationForDisplay(activity.locationData)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getLocationSourceColor(activity.locationData.source)}`}>
                              {activity.locationData.source?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {getLocationAccuracy(activity.locationData)} accuracy
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">Location not required</span>
                        </div>
                      )}
                      
                      {activity.ipAddress && (
                        <div className="text-xs text-gray-500">
                          IP: {activity.ipAddress}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => loadUserActivities(activity.userId, activity.userName)}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      disabled={!activity.userId}
                    >
                      <Eye className="w-4 h-4" />
                      View User Activities
                    </button>
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

        {/* Enhanced User Activities Modal with Location */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 flex items-end justify-center z-150 p-4 bg-black/50 backdrop-blur-sm mb-0">
            <div className="bg-white rounded-3xl shadow-2xl border border-white/20 p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <p className="text-gray-600">Activity History ({userActivities.length} records)</p>
                    <div className="text-sm text-gray-500 mt-1">
                      {userActivities.filter(a => a.locationData).length} activities with location data
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={exportUserActivitiesCSV}
                    disabled={exportingCsv || userActivities.length === 0}
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                  >
                    {exportingCsv ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export CSV
                  </button>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content with Enhanced Location Display */}
              <div className="flex-1 overflow-y-auto">
                {userActivities.length > 0 ? (
                  <div className="space-y-3">
                    {userActivities.map((activity, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            {getActionIcon(activity.action, activity.category)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900 capitalize">
                                  {activity.action?.replace('_', ' ') || 'Unknown Action'}
                                </span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getCategoryColor(activity.category)}`}>
                                  {activity.category}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600 mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatTime(activity.timestamp)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getDeviceIcon(activity.deviceType)}
                                  <span className="capitalize">{activity.deviceType || 'Unknown'}</span>
                                </div>
                                {activity.ipAddress && (
                                  <div className="flex items-center gap-2">
                                    <Monitor className="w-3 h-3" />
                                    <span>IP: {activity.ipAddress}</span>
                                  </div>
                                )}
                              </div>

                              {/* Enhanced Location Display in Modal */}
                              {activity.locationData && (
                                <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getLocationIcon(activity.locationData)}
                                    <span className="text-sm font-semibold text-gray-800">Location Information</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <div className="text-xs font-medium text-gray-600 mb-1">Address:</div>
                                      <div className="text-gray-800">{formatLocationForDisplay(activity.locationData)}</div>
                                    </div>
                                    
                                    <div>
                                      <div className="text-xs font-medium text-gray-600 mb-1">Source & Accuracy:</div>
                                      <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getLocationSourceColor(activity.locationData.source)}`}>
                                          {activity.locationData.source?.toUpperCase() || 'UNKNOWN'}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                          {getLocationAccuracy(activity.locationData)}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {activity.locationData.latitude && activity.locationData.longitude && (
                                      <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1">Coordinates:</div>
                                        <div className="text-gray-800 font-mono text-xs">
                                          {activity.locationData.latitude.toFixed(6)}, {activity.locationData.longitude.toFixed(6)}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {activity.locationData.accuracy && (
                                      <div>
                                        <div className="text-xs font-medium text-gray-600 mb-1">Accuracy:</div>
                                        <div className="text-gray-800">±{Math.round(activity.locationData.accuracy)} meters</div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {activity.locationData.city && (
                                    <div className="mt-2 pt-2 border-t border-blue-200">
                                      <div className="text-xs text-gray-600">
                                        City: <span className="font-medium">{activity.locationData.city}</span>
                                        {activity.locationData.country && (
                                          <>, Country: <span className="font-medium">{activity.locationData.country}</span></>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {activity.details && Object.keys(activity.details).length > 0 && (
                                <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <div className="text-xs font-medium text-gray-700 mb-1">Details:</div>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    {Object.entries(activity.details).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="font-medium">{key}:</span>
                                        <span>{value?.toString() || 'N/A'}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {formatTimeAgo(activity.timestamp)}
                            </div>
                            {activity.locationData && (
                              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <Navigation className="w-3 h-3" />
                                <span>Located</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Activities Found</h3>
                    <p className="text-gray-600">No activities recorded for this user.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Statistics showing location data */}
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
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
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
                        {/* NEW: Show if user has location data */}
                        {user.hasLocationData > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            <Navigation className="w-3 h-3" />
                            {user.hasLocationData} located
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{user.activityCount}</div>
                      <div className="text-xs text-gray-500">activities</div>
                    </div>
                    <button
                      onClick={() => loadUserActivities(user._id, user.userName)}
                      className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Summary Footer with Location Stats */}
        <div className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-2xl p-8 text-white text-center shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-12 h-12 opacity-90" />
            <Navigation className="w-12 h-12 opacity-90" />
          </div>
          <h3 className="text-2xl font-bold mb-2">System Activity & Location Monitoring</h3>
          <p className="text-lg opacity-90 mb-4">
            Tracking {stats.totalActivities || 0} activities from {stats.uniqueUsers || 0} users
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-2xl font-bold">{activities.filter(a => a.locationData).length}</div>
              <div className="text-sm opacity-80">With Location</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-2xl font-bold">
                {activities.filter(a => a.locationData?.source === 'gps').length}
              </div>
              <div className="text-sm opacity-80">GPS Located</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-2xl font-bold">
                {activities.filter(a => a.locationData?.source === 'ip').length}
              </div>
              <div className="text-sm opacity-80">IP Located</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-2xl font-bold">
                {activities.length > 0 ? Math.round((activities.filter(a => a.locationData).length / activities.length) * 100) : 0}%
              </div>
              <div className="text-sm opacity-80">Coverage</div>
            </div>
          </div>
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
              <span>Location Tracked</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}