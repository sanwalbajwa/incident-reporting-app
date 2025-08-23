// src/app/management/reports/page.js

'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  MessageCircle,
  User,
  Building2,
  Calendar,
  Clock,
  FileText,
  Eye,
  Filter,
  Search,
  Crown,
  CheckCircle,
  MapPin,
  RefreshCw,
  TrendingUp,
  Users,
  Shield
} from 'lucide-react'

export default function ManagementReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    reviewed: 0,
    resolved: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

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
    
    loadAllIncidents()
  }, [session, status, router])

const loadAllIncidents = async () => {
  setLoading(true)
  try {
    // Remove the limit to get ALL incidents
    const response = await fetch('/api/incidents/list?guardOnly=false')
    const data = await response.json()
    
    if (response.ok) {
      setIncidents(data.incidents || [])
      
      // Calculate stats
      const incidents = data.incidents || []
      setStats({
        total: incidents.length,
        submitted: incidents.filter(i => i.status === 'submitted').length,
        reviewed: incidents.filter(i => i.status === 'reviewed').length,
        resolved: incidents.filter(i => i.status === 'resolved').length
      })
    } else {
      console.error('Error loading incidents:', data.error)
    }
  } catch (error) {
    console.error('Error loading incidents:', error)
  }
  setLoading(false)
}

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
      case 'reviewed':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200'
      case 'resolved':
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4" />
      case 'reviewed':
        return <Eye className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-200'
      case 'urgent':
        return 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 border-orange-200'
      case 'normal':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-200'
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type) => {
    if (type === 'Communication/Message') {
      return <MessageCircle className="w-5 h-5 text-blue-600" />
    }
    return <AlertTriangle className="w-5 h-5 text-red-600" />
  }

  // Filter incidents
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.incidentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.guardName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.incidentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'communication' && incident.incidentType === 'Communication/Message') ||
                       (typeFilter === 'incident' && incident.incidentType !== 'Communication/Message')
    const matchesPriority = priorityFilter === 'all' || incident.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading all reports...</p>
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
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Crown className="w-8 h-8 text-blue-600" />
                <BarChart3 className="w-8 h-8 text-orange-600" />
                All Incident Reports
              </h1>
              <p className="text-gray-600 mt-1">View and manage all incident reports across the system</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats.total}</div>
            <div className="text-sm text-gray-600 font-medium">Total Reports</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.submitted}</div>
            <div className="text-sm text-gray-600 font-medium">Pending Review</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.reviewed}</div>
            <div className="text-sm text-gray-600 font-medium">Under Review</div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-gray-600 font-medium">Resolved</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID, guard name, type, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50 text-black placeholder-gray-400"
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50"
              >
                <option value="all">All Types</option>
                <option value="incident">Incidents</option>
                <option value="communication">Communications</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 text-black border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white/50"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-3 border-orange-600 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Loading all reports...</p>
            </div>
          ) : filteredIncidents.length > 0 ? (
            <>
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                  All System Reports ({filteredIncidents.length})
                  {searchTerm && (
                    <span className="text-sm font-normal text-gray-600">
                      - Search: "{searchTerm}"
                    </span>
                  )}
                </h2>
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Report Details
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Guard & Location
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Priority & Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Date Created
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredIncidents.map((incident) => (
                      <tr key={incident._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(incident.incidentType)}
                            <div>
                              <div className="text-sm font-bold text-blue-600">
                                {incident.incidentId}
                              </div>
                              <div className="text-sm text-gray-900 font-medium">
                                {incident.incidentType}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {incident.description?.substring(0, 60)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {incident.guardName}
                            </div>
                            <div className="text-gray-500 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {incident.location}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getPriorityColor(incident.priority)}`}>
                              {incident.priority || 'normal'}
                            </span>
                            <br />
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(incident.status)}`}>
                              {getStatusIcon(incident.status)}
                              {incident.status}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            {formatDate(incident.createdAt)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <button
                            onClick={() => router.push(`/incidents/${incident._id}`)}
                            className="bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredIncidents.map((incident) => (
                  <div key={incident._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(incident.incidentType)}
                        <div>
                          <div className="text-sm font-bold text-blue-600">
                            {incident.incidentId}
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {incident.incidentType}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(incident.status)}`}>
                          {incident.status}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full border ${getPriorityColor(incident.priority)}`}>
                          {incident.priority || 'normal'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Guard: {incident.guardName}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {incident.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(incident.createdAt)}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/incidents/${incident._id}`)}
                      className="w-full bg-orange-100 hover:bg-orange-200 text-orange-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View Full Report
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-300 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">No reports found</h3>
              <p className="text-gray-600 text-lg">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? "No reports match your current search or filter criteria."
                  : "No incident reports have been submitted yet."
                }
              </p>
            </div>
          )}
        </div>

        {/* Summary Footer */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-8 text-white text-center shadow-xl">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h3 className="text-2xl font-bold mb-2">System-Wide Report Overview</h3>
          <p className="text-lg opacity-90 mb-4">
            Managing {stats.total} total reports across all security operations
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
              <span>{stats.submitted} Pending Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-300 rounded-full"></div>
              <span>{stats.reviewed} In Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-300 rounded-full"></div>
              <span>{stats.resolved} Resolved</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}